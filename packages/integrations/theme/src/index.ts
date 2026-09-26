import type { AstroIntegration } from 'astro';
import {
	normalizeOptions,
	type ResolvedThemeOptions,
	type Theme,
	type ThemeOptions,
} from './options.js';
import { createThemeScript } from './script.js';

export type { ResolvedTheme, Theme, ThemeOptions } from './options.js';
export { getTheme, resolvedTheme, setTheme, themes } from './client.js';

/** The global the injected `<head>` script adds to `window`. */
export interface ThemeApi {
	/** The themes this project offers. */
	readonly themes: readonly Theme[];
	/** The preference used until the visitor picks one. */
	readonly defaultTheme: Theme;
	/** The active preference, which may be `'system'`. */
	get(): Theme;
	/** The active preference with `'system'` resolved against the visitor's OS. */
	resolved(): 'light' | 'dark';
	/** Stores the preference and applies it immediately. Unknown values are rejected. */
	set(theme: Theme): void;
}

// Declares the global in terms of the types exported above, so the two cannot drift apart.
// This is a module (it has an `import`), which is what makes `declare global` apply.
const THEME_TYPES = `import type { ThemeApi } from '@astrojs/theme';

declare global {
	interface Window {
		theme: ThemeApi;
	}
}
`;

export default function theme(options?: ThemeOptions): AstroIntegration {
	// Validated eagerly so a misconfigured project fails on startup, not on first render.
	const resolved: ResolvedThemeOptions = normalizeOptions(options);
	const script = createThemeScript(resolved);

	return {
		name: '@astrojs/theme',
		hooks: {
			'astro:config:setup': ({ injectScript }) => {
				injectScript('head-inline', script);
			},
			'astro:config:done': ({ injectTypes }) => {
				injectTypes({ filename: 'theme.d.ts', content: THEME_TYPES });
			},
		},
	};
}
