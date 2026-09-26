import { AstroError } from 'astro/errors';

/**
 * A theme preference. `'system'` defers to the visitor's `prefers-color-scheme` setting and
 * keeps following it as it changes.
 */
export type Theme = 'light' | 'dark' | 'system';

/** A {@link Theme} with `'system'` already resolved against the visitor's OS. */
export type ResolvedTheme = 'light' | 'dark';

/** Every theme the integration knows how to apply. */
export const THEME_VALUES = ['light', 'dark', 'system'] as const satisfies readonly Theme[];

export interface ThemeOptions {
	/**
	 * The preference used until the visitor picks one. Must be included in `themes`.
	 *
	 * @default "system", or the first entry of `themes` when `enableSystem` is `false`
	 */
	defaultTheme?: Theme;
	/**
	 * Set the CSS [`color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme)
	 * property on `<html>` to match the resolved theme, so native UI (scrollbars, form
	 * controls, the caret) follows it.
	 *
	 * @default true
	 */
	enableColorScheme?: boolean;
	/**
	 * Offer the `'system'` preference, which follows `prefers-color-scheme` and keeps
	 * following it as it changes. When `false`, `'system'` is rejected in both `themes` and
	 * `defaultTheme`.
	 *
	 * @default true
	 */
	enableSystem?: boolean;
	/**
	 * The themes this project offers. Must be a non-empty subset of `'light'`, `'dark'`,
	 * and `'system'`.
	 *
	 * @default ["light", "dark", "system"]
	 */
	themes?: readonly Theme[];
}

/** {@link ThemeOptions} with every default applied. */
export interface ResolvedThemeOptions {
	defaultTheme: Theme;
	enableColorScheme: boolean;
	enableSystem: boolean;
	themes: readonly Theme[];
}

const list = (values: readonly string[]) => values.map((value) => `"${value}"`).join(', ');

/**
 * Applies defaults and rejects option combinations that cannot be honored, so a
 * misconfigured project fails on startup rather than silently ignoring the setting.
 */
export function normalizeOptions(options: ThemeOptions = {}): ResolvedThemeOptions {
	const enableSystem = options.enableSystem ?? true;
	const enableColorScheme = options.enableColorScheme ?? true;
	const themes = [...new Set(options.themes ?? THEME_VALUES)];

	if (themes.length === 0) {
		throw new AstroError(`The 'themes' option must include at least one theme.`);
	}

	for (const theme of themes) {
		if (!THEME_VALUES.includes(theme)) {
			throw new AstroError(
				`Invalid theme ${JSON.stringify(theme)} in the 'themes' option.`,
				`Expected one of: ${list(THEME_VALUES)}.`,
			);
		}
	}

	if (!enableSystem && themes.includes('system')) {
		throw new AstroError(
			`The 'themes' option includes "system" but 'enableSystem' is false.`,
			`Either remove "system" from 'themes' or set 'enableSystem: true'.`,
		);
	}

	const defaultTheme = options.defaultTheme ?? (enableSystem ? 'system' : themes[0]);

	if (!enableSystem && defaultTheme === 'system') {
		throw new AstroError(
			`The 'defaultTheme' option is "system" but 'enableSystem' is false.`,
			`Either set 'defaultTheme' to one of ${list(themes)} or set 'enableSystem: true'.`,
		);
	}

	if (!themes.includes(defaultTheme)) {
		throw new AstroError(
			`The 'defaultTheme' option is ${JSON.stringify(defaultTheme)}, which the 'themes' option does not include.`,
			`Either add ${JSON.stringify(defaultTheme)} to 'themes' or change 'defaultTheme'. Configured themes: ${list(themes)}.`,
		);
	}

	return { defaultTheme, enableColorScheme, enableSystem, themes };
}
