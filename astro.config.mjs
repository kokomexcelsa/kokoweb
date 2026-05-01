import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://kokomexcelsa.github.io',
  base: '/kokoweb',
  trailingSlash: 'never',
  build: {
    format: 'file'
  }
});
