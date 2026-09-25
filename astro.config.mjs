// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://d4nnABR.github.io',
  integrations: [sitemap()],
  build: {
    format: 'directory',
  },
});
