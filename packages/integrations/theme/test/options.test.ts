import { expect } from '@playwright/test';
import { prepareTestFactory } from './test-utils.js';

// Configured with `defaultTheme: 'dark'` and all three themes available.
const { test } = prepareTestFactory({ root: './fixtures/options/' });

test.describe('options', () => {
	test('honors the defaultTheme option', async ({ page, astro }) => {
		await page.emulateMedia({ colorScheme: 'light' });
		await page.goto(astro.resolveUrl('/'));

		// Nothing stored, and the OS says light, but `defaultTheme: 'dark'` wins.
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
		expect(await page.evaluate(() => window.theme.get())).toBe('dark');
	});

	test('exposes the configured themes on the global', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		expect(await page.evaluate(() => window.theme.themes)).toEqual(['light', 'dark', 'system']);
	});

	test('sets color-scheme when enableColorScheme is on', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const colorScheme = await page.evaluate(() =>
			document.documentElement.style.getPropertyValue('color-scheme'),
		);
		expect(colorScheme).toBe('dark');
	});
});

test.describe('imported module API', () => {
	test('reads the preference and the resolved theme', async ({ page, astro }) => {
		await page.emulateMedia({ colorScheme: 'light' });
		await page.goto(astro.resolveUrl('/'));

		await expect(page.locator('#preference')).toHaveText('dark');
		await expect(page.locator('#resolved')).toHaveText('dark');
	});

	test('exposes the configured themes', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		await expect(page.locator('#themes')).toHaveText('light,dark,system');
	});

	test('setTheme() applies and persists the change', async ({ page, astro }) => {
		await page.emulateMedia({ colorScheme: 'light' });
		await page.goto(astro.resolveUrl('/'));

		// The fixture's own module script calls setTheme() from its click handler.
		await page.locator('#toggle').click();
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

		await page.reload();
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
	});

	test('setTheme() is the same API as window.theme.set()', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		await page.locator('#toggle').click();

		expect(await page.evaluate(() => window.theme.get())).toBe('light');
		expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light');
	});
});

test.describe('during SSR', () => {
	test('falls back to the package defaults instead of throwing', async ({ page, astro }) => {
		const response = await page.request.get(astro.resolveUrl('/ssr'));
		const html = await response.text();

		// The visitor's OS preference and stored choice are both unknown on the server, so
		// these are the package defaults rather than the configured `defaultTheme: 'dark'`.
		expect(html).toContain('<span id="preference">system</span>');
		expect(html).toContain('<span id="resolved">light</span>');
		expect(html).toContain('<span id="themes">light,dark,system</span>');
	});
});
