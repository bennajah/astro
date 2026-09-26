# @astrojs/theme

This **[Astro integration][astro-integration]** adds light, dark, and system theme support to your project.

It injects a small script into the `<head>` of every page, so the theme is applied before the
body is parsed and the first paint never flashes the wrong colors. The script reads the stored
preference, applies it to the `<html>` element, and exposes a `window.theme` API.

## Installation

```sh
npm install @astrojs/theme
```

Add it to your `astro.config.mjs`:

```js
import theme from '@astrojs/theme';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [theme()],
});
```

## Usage

The integration sets `data-theme` on the `<html>` element to the resolved theme (`light` or
`dark`), and sets the CSS [`color-scheme`][color-scheme] property so native UI matches. Style
against the attribute:

```css
:root {
  --bg: white;
  --fg: black;
}

[data-theme='dark'] {
  --bg: black;
  --fg: white;
}
```

### API

Import the functions from `@astrojs/theme` in any `<script>` or client module:

```astro
<button id="toggle">Toggle</button>

<script>
  import { getTheme, resolvedTheme, setTheme } from '@astrojs/theme';

  const toggle = document.getElementById('toggle')!;
  toggle.addEventListener('click', () => {
    setTheme(getTheme() === 'dark' ? 'light' : 'dark');
  });
</script>
```

| Export            | Description                                                                   |
| ----------------- | ----------------------------------------------------------------------------- |
| `getTheme()`      | The active preference: `'light'`, `'dark'`, or `'system'`.                    |
| `setTheme(theme)` | Stores the preference and applies it immediately. Unknown values are ignored. |
| `resolvedTheme()` | The applied theme, with `'system'` resolved against the user's OS.            |
| `themes`          | The themes this project offers, reflecting the `themes` option.               |
| `type Theme`      | `'light' \| 'dark' \| 'system'`.                                              |

`getTheme()` returns the _preference_, which may be `'system'`. Use `resolvedTheme()` when you
need the theme that is actually applied.

`'system'` follows the user's `prefers-color-scheme` setting and keeps following it as it
changes. The preference is persisted in `localStorage` under the `theme` key. If storage is
unavailable (for example when the user blocks cookies), the theme still applies for the current
page.

**During SSR** there is no stored preference and no `prefers-color-scheme` to read, so the
functions return the package defaults (`'system'`, `'light'`, and all three themes) instead of
the configured `defaultTheme`. Read the theme in the browser rather than rendering it on the
server, since the head script is what applies it.

### `window.theme`

The injected script also exposes the same API on `window`, which is useful from inline scripts
that cannot import modules:

```js
window.theme.get(); // 'light' | 'dark' | 'system'
window.theme.resolved(); // 'light' | 'dark'
window.theme.set('dark');
window.theme.themes; // ['light', 'dark', 'system']
window.theme.defaultTheme; // 'system'
```

The integration injects a type declaration for this global, so it is typed without an import.

## Configuration

```js
theme({
  defaultTheme: 'system',
  enableColorScheme: true,
  enableSystem: true,
  themes: ['light', 'dark', 'system'],
});
```

| Option              | Type      | Default                       | Description                                                           |
| ------------------- | --------- | ----------------------------- | --------------------------------------------------------------------- |
| `defaultTheme`      | `Theme`   | `'system'`                    | The preference used until the visitor picks one. Must be in `themes`. |
| `enableColorScheme` | `boolean` | `true`                        | Set the CSS `color-scheme` property to match the resolved theme.      |
| `enableSystem`      | `boolean` | `true`                        | Offer `'system'`, which follows `prefers-color-scheme`.               |
| `themes`            | `Theme[]` | `['light', 'dark', 'system']` | The themes to offer, in preference order.                             |

To drop `'system'` and force a single theme, turn system support off and pick a default:

```js
theme({ enableSystem: false, themes: ['light', 'dark'], defaultTheme: 'dark' });
```

Options that cannot be honored are rejected when the config loads, rather than silently ignored:

- `themes` must be non-empty and may only contain `'light'`, `'dark'`, and `'system'`.
- `enableSystem: false` is a conflict with `'system'` in either `themes` or `defaultTheme`.
- `defaultTheme` must be included in `themes`.

To make the theme available only as a fixed default, `enableSystem: false` also removes the
`prefers-color-scheme` query from the injected script entirely.

## Support

- Get help in the [Astro Discord][discord]. Post questions in our `#support` forum, or visit our dedicated `#dev` channel to discuss current development and more!

- Check our [Astro Integration Documentation][astro-integration] for more on integrations.

- Submit bug reports and feature requests as [GitHub issues][issues].

## Contributing

This package is maintained by Astro's Core team. You're welcome to submit an issue or PR! These links will help you get started:

- [Contributor Manual][contributing]
- [Code of Conduct][coc]
- [Community Guide][community]

## License

MIT

Copyright (c) 2023–present [Astro][astro]

[astro]: https://astro.build/
[color-scheme]: https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme
[contributing]: https://github.com/withastro/astro/blob/main/CONTRIBUTING.md
[coc]: https://github.com/withastro/.github/blob/main/CODE_OF_CONDUCT.md
[community]: https://github.com/withastro/.github/blob/main/COMMUNITY_GUIDE.md
[discord]: https://astro.build/chat/
[issues]: https://github.com/withastro/astro/issues
[astro-integration]: https://docs.astro.build/en/guides/integrations/
