import { readFile } from 'node:fs/promises';
import { expect } from '@playwright/test';
import type { Theme } from '../src/index.js';
import { prepareTestFactory } from './test-utils.js';

const { test } = prepareTestFactory({ root: './fixtures/basics/' });

// `injectTypes` namespaces each integration's types under `.astro/integrations/<name>/`,
// where `<name>` is the integration name with non-word characters replaced.
const INJECTED_TYPES = new URL(
	'./fixtures/basics/.astro/integrations/_astrojs_theme/theme.d.ts',
	import.meta.url,
);
const ASTRO_TYPES = new URL('./fixtures/basics/.astro/types.d.ts', import.meta.url);

test.describe('Injection', () => {
	test('injects an inline script into the head of every page', async ({ page, astro }) => {
		const response = await page.request.get(astro.resolveUrl('/'));
		const html = await response.text();

		const headEnd = html.indexOf('</head>');
		expect(headEnd).toBeGreaterThan(-1);

		const head = html.slice(0, headEnd);
		// The head script is what defines the global, so its presence there is the point.
		expect(head).toContain('window.theme');
		// Inlined rather than deferred to a module, so the theme is applied before the body
		// is parsed and the first paint does not flash the wrong theme.
		expect(head).toContain('prefers-color-scheme: dark');
	});

	test('exposes window.theme before the body is parsed', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		// The fixture calls `window.theme.get()` from an inline script while the body is
		// being parsed and writes the result into the page, so this only passes if the head
		// script ran first.
		await expect(page.locator('#early')).toHaveText('system');
	});

	test('applies the resolved theme to the document element', async ({ page, astro }) => {
		await page.emulateMedia({ colorScheme: 'dark' });
		await page.goto(astro.resolveUrl('/'));

		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	});

	test('sets color-scheme so native UI matches the theme', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const colorScheme = await page.evaluate(() =>
			document.documentElement.style.getPropertyValue('color-scheme'),
		);
		expect(colorScheme).toBe('light');
	});

	test('declares the global and references it from the project types', async () => {
		// Written by `astro:config:done` + sync, which the dev server in `beforeAll` runs.
		const injected = await readFile(INJECTED_TYPES, 'utf-8');
		// The declaration reuses the types exported by the package rather than restating
		// them, so the two cannot drift apart.
		expect(injected).toContain("import type { ThemeApi } from '@astrojs/theme';");
		expect(injected).toContain('theme: ThemeApi;');

		// Without the reference, the declaration is invisible to the project.
		const astroTypes = await readFile(ASTRO_TYPES, 'utf-8');
		expect(astroTypes).toContain('/// <reference path="integrations/_astrojs_theme/theme.d.ts" />');
	});
});

test.describe('window.theme', () => {
	test('is defined on the window', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const api = await page.evaluate(() => ({
			get: typeof window.theme.get,
			set: typeof window.theme.set,
			resolved: typeof window.theme.resolved,
		}));
		expect(api).toEqual({ get: 'function', set: 'function', resolved: 'function' });
	});

	test('defaults to "system"', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		expect(await page.evaluate(() => window.theme.get())).toBe('system');
	});

	test('resolves "system" against prefers-color-scheme', async ({ page, astro }) => {
		await page.emulateMedia({ colorScheme: 'dark' });
		await page.goto(astro.resolveUrl('/'));

		// The preference stays "system" while the applied theme follows the OS.
		expect(await page.evaluate(() => window.theme.get())).toBe('system');
		expect(await page.evaluate(() => window.theme.resolved())).toBe('dark');
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	});

	test('set() applies the theme immediately', async ({ page, astro }) => {
		await page.emulateMedia({ colorScheme: 'light' });
		await page.goto(astro.resolveUrl('/'));

		await page.evaluate(() => window.theme.set('dark'));

		expect(await page.evaluate(() => window.theme.get())).toBe('dark');
		expect(await page.evaluate(() => window.theme.resolved())).toBe('dark');
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	});

	test('set() back to "system" re-resolves against the OS', async ({ page, astro }) => {
		await page.emulateMedia({ colorScheme: 'dark' });
		await page.goto(astro.resolveUrl('/'));

		await page.evaluate(() => window.theme.set('light'));
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

		await page.evaluate(() => window.theme.set('system'));
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	});

	test('set() persists the choice across a reload', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		await page.evaluate(() => window.theme.set('dark'));
		await page.reload();

		expect(await page.evaluate(() => window.theme.get())).toBe('dark');
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	});

	test('stores the preference under the "theme" localStorage key', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		await page.evaluate(() => window.theme.set('dark'));

		const stored = await page.evaluate(() => window.localStorage.getItem('theme'));
		expect(stored).toBe('dark');
	});

	test('restores a theme stored before the page loaded', async ({ page, astro }) => {
		// Runs before any page script, so the head script reads it as it starts.
		await page.addInitScript(() => window.localStorage.setItem('theme', 'dark'));
		await page.emulateMedia({ colorScheme: 'light' });
		await page.goto(astro.resolveUrl('/'));

		// A stored preference wins over the OS.
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	});

	test('falls back to the default for an unrecognized stored theme', async ({ page, astro }) => {
		await page.addInitScript(() => window.localStorage.setItem('theme', 'rainbow'));
		await page.emulateMedia({ colorScheme: 'dark' });
		await page.goto(astro.resolveUrl('/'));

		expect(await page.evaluate(() => window.theme.get())).toBe('system');
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	});

	test('set() ignores an unrecognized theme', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const warnings: string[] = [];
		page.on('console', (message) => {
			if (message.type() === 'warning') warnings.push(message.text());
		});

		await page.evaluate(() => window.theme.set('rainbow' as Theme));

		expect(await page.evaluate(() => window.theme.get())).toBe('system');
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
		expect(warnings.join('\n')).toContain('[@astrojs/theme]');
	});

	test('follows the OS when the preference is "system"', async ({ page, astro }) => {
		await page.emulateMedia({ colorScheme: 'light' });
		await page.goto(astro.resolveUrl('/'));
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

		await page.emulateMedia({ colorScheme: 'dark' });

		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	});

	test('ignores OS changes once a theme is chosen explicitly', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		await page.evaluate(() => window.theme.set('light'));
		await page.emulateMedia({ colorScheme: 'dark' });

		// Give the media query listener a chance to fire before asserting that it did not.
		await page.waitForTimeout(300);
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
	});
});
