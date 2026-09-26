import { expect } from '@playwright/test';
import { prepareTestFactory } from './test-utils.js';

// Configured with `enableSystem: false`, `enableColorScheme: false`,
// `themes: ['light', 'dark']`, and `defaultTheme: 'dark'`.
const { test } = prepareTestFactory({ root: './fixtures/no-system/' });

test.describe('enableSystem: false', () => {
	test('omits the media query entirely', async ({ page, astro }) => {
		const response = await page.request.get(astro.resolveUrl('/'));
		const html = await response.text();

		expect(html.slice(0, html.indexOf('</head>'))).not.toContain('matchMedia');
	});

	test('uses the configured defaultTheme regardless of the OS', async ({ page, astro }) => {
		await page.emulateMedia({ colorScheme: 'light' });
		await page.goto(astro.resolveUrl('/'));

		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
		expect(await page.evaluate(() => window.theme.get())).toBe('dark');
	});

	test('does not follow the OS after the page has loaded', async ({ page, astro }) => {
		await page.emulateMedia({ colorScheme: 'light' });
		await page.goto(astro.resolveUrl('/'));

		await page.evaluate(() => window.theme.set('light'));
		await page.emulateMedia({ colorScheme: 'dark' });
		await page.waitForTimeout(300);

		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
	});

	test('the imported themes exclude "system"', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		expect(await page.evaluate(() => window.theme.themes)).toEqual(['light', 'dark']);
		await expect(page.locator('#preference')).toHaveText('dark/light,dark');
	});

	test('rejects "system" at runtime', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const warnings: string[] = [];
		page.on('console', (message) => {
			if (message.type() === 'warning') warnings.push(message.text());
		});

		await page.evaluate(() => window.theme.set('system'));

		expect(await page.evaluate(() => window.theme.get())).toBe('dark');
		expect(warnings.join('\n')).toContain('[@astrojs/theme]');
	});
});

test.describe('enableColorScheme: false', () => {
	test('leaves the color-scheme property unset', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const colorScheme = await page.evaluate(() =>
			document.documentElement.style.getPropertyValue('color-scheme'),
		);
		expect(colorScheme).toBe('');
		// The theme is still applied, just without the native UI hint.
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	});
});
