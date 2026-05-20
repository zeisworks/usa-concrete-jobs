import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://usaconcretejobs.com',
  output: 'static',
  build: {
    format: 'directory'
  }
});
