import theme from '@astrojs/theme';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [theme()],
});
