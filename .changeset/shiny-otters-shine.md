---
'@astrojs/theme': minor
---

Adds a `@astrojs/theme` integration for light, dark, and system theme support

```js
import theme from '@astrojs/theme';

export default defineConfig({
  integrations: [
    theme({
      defaultTheme: 'system',
      enableColorScheme: true,
      enableSystem: true,
      themes: ['light', 'dark', 'system'],
    }),
  ],
});
```

The integration injects a script into `<head>` that applies the stored preference before the body is parsed, so the first paint never flashes the wrong colors. It sets `data-theme` on the `<html>` element to the resolved theme, and the CSS `color-scheme` property so native UI matches. `'system'` follows the visitor's `prefers-color-scheme` setting and keeps following it as it changes.

Read and change the preference from any client script:

```ts
import { getTheme, resolvedTheme, setTheme, themes } from '@astrojs/theme';

setTheme('dark');
```
