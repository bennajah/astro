import theme from '@astrojs/theme';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [
    theme({
      defaultTheme: 'dark',
      enableColorScheme: true,
      enableSystem: true,
      themes: ['light', 'dark', 'system'],
    }),
  ],
});
