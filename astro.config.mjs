import { defineConfig, passthroughImageService, sharpImageService } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Use Sharp in CI (where it works), passthrough locally when Sharp isn't available.
const isCI = Boolean(process.env.CI);

export default defineConfig({
  site: 'https://robertozuniga.github.io',
  output: 'static',
  integrations: [
    mdx(),
    react(),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  image: {
    service: isCI ? sharpImageService() : passthroughImageService(),
  },
});
