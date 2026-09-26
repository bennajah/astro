import type { ResolvedThemeOptions } from './options.js';

/**
 * Builds the source of the `<head>` script for a given configuration.
 *
 * `head-inline` content is inlined into the HTML verbatim and is **not** processed or
 * resolved by Vite, so this returns a self-contained classic script with no imports.
 * Running it in the head — before the body is parsed — lets the first paint already use
 * the stored theme instead of flashing the default one.
 *
 * Every interpolated value has already been checked against the fixed set of themes by
 * `normalizeOptions`, so none of them can introduce markup into the script.
 */
export function createThemeScript(options: ResolvedThemeOptions): string {
	const applyColorScheme = options.enableColorScheme
		? "\t\troot.style.setProperty('color-scheme', resolved);"
		: '';
	const followSystem = options.enableSystem
		? `		media.addEventListener('change', function () {
			if (preference === 'system') {
				apply();
			}
		});`
		: '';
	const media = options.enableSystem ? "window.matchMedia('(prefers-color-scheme: dark)')" : 'null';

	return `(function () {
	var STORAGE_KEY = 'theme';
	var THEMES = ${JSON.stringify(options.themes)};
	var DEFAULT = ${JSON.stringify(options.defaultTheme)};
	var root = document.documentElement;
	var media = ${media};
	var preference = readStored();

	function readStored() {
		var stored;
		try {
			stored = window.localStorage.getItem(STORAGE_KEY);
		} catch {
			// Storage throws when the visitor blocks cookies. Fall back to the default and
			// keep any later changes in memory for this page only.
			return DEFAULT;
		}
		// A value left by another tool, or a theme this project no longer offers.
		return THEMES.indexOf(stored) === -1 ? DEFAULT : stored;
	}

	function resolve(theme) {
		return theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
	}

	function apply() {
		var resolved = resolve(preference);
		root.setAttribute('data-theme', resolved);
${applyColorScheme}
	}

	apply();

${followSystem}

	window.theme = {
		themes: THEMES,
		defaultTheme: DEFAULT,
		get: function () {
			return preference;
		},
		resolved: function () {
			return resolve(preference);
		},
		set: function (next) {
			if (THEMES.indexOf(next) === -1) {
				console.warn(
					'[@astrojs/theme] Ignoring unknown theme "' +
						next +
						'". Expected one of: ' +
						THEMES.join(', ') +
						'.',
				);
				return;
			}
			preference = next;
			try {
				window.localStorage.setItem(STORAGE_KEY, preference);
			} catch {
				// The theme still applies to this page, it just will not persist.
			}
			apply();
		},
	};
})();`;
}
