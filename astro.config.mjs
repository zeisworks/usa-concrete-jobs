import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

const SITE = 'https://usaconcretejobs.com';

export default defineConfig({
  site: SITE,
  output: 'server',
  adapter: cloudflare(),
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
