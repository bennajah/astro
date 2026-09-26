import { THEME_VALUES, type ResolvedTheme, type Theme } from './options.js';

/**
 * The global the integration's `<head>` script defines. Not part of this package's public
 * types — see the injected `theme.d.ts` for that.
 */
interface ThemeGlobal {
	themes: readonly Theme[];
	defaultTheme: Theme;
	get(): Theme;
	set(theme: Theme): void;
	resolved(): ResolvedTheme;
}

function global(): ThemeGlobal | undefined {
	if (typeof window === 'undefined') return undefined;
	return (window as unknown as { theme?: ThemeGlobal }).theme;
}

/**
 * The themes this project offers, reflecting the `themes` option.
 *
 * The value is read from the integration when this module is first evaluated in the
 * browser. During SSR the integration has not run, so this falls back to every theme the
 * package knows about.
 */
export const themes: readonly Theme[] = global()?.themes ?? THEME_VALUES;

/**
 * The active preference, which may be `'system'`.
 *
 * There is no stored preference on the server, so during SSR this returns `'system'`
 * rather than the configured `defaultTheme`. Read the theme in the browser instead.
 */
export function getTheme(): Theme {
	return global()?.get() ?? 'system';
}

/**
 * The theme actually applied to the document: `'system'` already resolved against the
 * visitor's `prefers-color-scheme`.
 *
 * During SSR this returns `'light'`, since the visitor's OS preference is unknown.
 */
export function resolvedTheme(): ResolvedTheme {
	return global()?.resolved() ?? 'light';
}

/**
 * Stores the preference and applies it immediately. Unknown values are rejected, which
 * includes any theme left out of the `themes` option.
 *
 * Does nothing during SSR, where there is no document to theme.
 */
export function setTheme(theme: Theme): void {
	const integration = global();
	if (!integration) {
		// Only worth reporting in the browser: on the server this is the expected path.
		if (typeof window !== 'undefined') {
			console.warn(
				'[@astrojs/theme] window.theme is not available. Did you add `theme()` to the `integrations` array in your Astro config?',
			);
		}
		return;
	}
	integration.set(theme);
}
