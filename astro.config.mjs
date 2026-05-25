import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

const SITE = 'https://usaconcretejobs.com';

export default defineConfig({
  site: SITE,
  output: 'hybrid',
  adapter: node({ mode: 'middleware' }),
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/privacy/') &&
        !page.includes('/terms/'),
      serialize(item) {
        const url = item.url;
        if (url === `${SITE}/`) {
          return { ...item, lastmod: new Date(), changefreq: 'weekly', priority: 1.0 };
        }
        if (url.includes('/states/') || url.includes('/services/') || url.includes('/counties/')) {
          return { ...item, lastmod: new Date(), changefreq: 'monthly', priority: 0.7 };
        }
        return { ...item, lastmod: new Date(), changefreq: 'monthly', priority: 0.5 };
      },
    }),
  ],
  build: {
    format: 'directory'
  }
});
