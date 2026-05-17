import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://concretecuttingpros.com',
  output: 'static',
  build: {
    format: 'directory'
  }
});
