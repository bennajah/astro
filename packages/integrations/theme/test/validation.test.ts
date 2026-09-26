import { expect, test } from '@playwright/test';
import { normalizeOptions, type ThemeOptions } from '../src/options.ts';

/**
 * Returns the error `normalizeOptions()` throws, so both the message and the hint Astro
 * prints can be asserted. `toThrow()` only matches the message.
 */
function configError(options?: ThemeOptions): { message: string; hint?: string } {
	try {
		normalizeOptions(options);
	} catch (error) {
		return error as { message: string; hint?: string };
	}
	throw new Error('Expected normalizeOptions() to reject these options.');
}

test.describe('normalizeOptions', () => {
	test('applies the documented defaults', () => {
		expect(normalizeOptions()).toEqual({
			defaultTheme: 'system',
			enableColorScheme: true,
			enableSystem: true,
			themes: ['light', 'dark', 'system'],
		});
	});

	test('falls back to the first theme when system support is off', () => {
		expect(normalizeOptions({ enableSystem: false, themes: ['dark', 'light'] })).toEqual({
			defaultTheme: 'dark',
			enableColorScheme: true,
			enableSystem: false,
			themes: ['dark', 'light'],
		});
	});

	test('de-duplicates themes while keeping their order', () => {
		const options = normalizeOptions({ defaultTheme: 'dark', themes: ['dark', 'light', 'dark'] });
		expect(options.themes).toEqual(['dark', 'light']);
	});

	test('rejects an empty themes list', () => {
		expect(configError({ themes: [] }).message).toMatch(/at least one theme/);
	});

	test('rejects a theme the package does not know', () => {
		const error = configError({ themes: ['light', 'sepia'] as unknown as ['light'] });
		expect(error.message).toMatch('Invalid theme "sepia"');
		expect(error.hint).toMatch('Expected one of: "light", "dark", "system"');
	});

	test('rejects "system" in themes when enableSystem is false', () => {
		const error = configError({ enableSystem: false, themes: ['light', 'system'] });
		expect(error.message).toMatch('includes "system" but \'enableSystem\' is false');
		expect(error.hint).toMatch('remove "system" from \'themes\'');
	});

	test('rejects a "system" defaultTheme when enableSystem is false', () => {
		const error = configError({
			enableSystem: false,
			defaultTheme: 'system',
			themes: ['light', 'dark'],
		});
		expect(error.message).toMatch(
			"The 'defaultTheme' option is \"system\" but 'enableSystem' is false",
		);
		expect(error.hint).toMatch(`set 'defaultTheme' to one of "light", "dark"`);
	});

	test('rejects a defaultTheme that themes does not include', () => {
		const error = configError({ defaultTheme: 'dark', themes: ['light', 'system'] });
		expect(error.message).toMatch('is "dark", which the \'themes\' option does not include');
		expect(error.hint).toMatch('Configured themes: "light", "system"');
	});
});
