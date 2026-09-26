import theme from '@astrojs/theme';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [
    theme({
      defaultTheme: 'dark',
      enableColorScheme: false,
      enableSystem: false,
      themes: ['light', 'dark'],
    }),
  ],
});
