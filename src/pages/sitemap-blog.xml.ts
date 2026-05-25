export const prerender = false;

import type { APIRoute } from 'astro';
import { readArticles } from '../lib/articleStore';
import { posts as staticPosts } from '../data/blog.js';

const siteUrl = 'https://usaconcretejobs.com';

export const GET: APIRoute = () => {
  const dynamic = readArticles().filter(a => a.status === 'publish');
  const dynamicSlugs = new Set(dynamic.map(a => a.slug));
  const all = [...dynamic, ...staticPosts.filter(p => !dynamicSlugs.has(p.slug))];

  const urls = all
    .map(post => `  <url>
    <loc>${siteUrl}/blog/${post.slug}/</loc>
    <lastmod>${post.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
