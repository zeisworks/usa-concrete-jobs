export const prerender = false;

import type { APIRoute } from 'astro';
import { upsertArticle } from '../../lib/articleStore';

const API_KEY = import.meta.env.BABYLOVEGROWTH_API_KEY ?? 'f2b21dd7-f88f-49ca-8107-3f2bf5b79ba5';

export const POST: APIRoute = async ({ request }) => {
  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

  if (token !== API_KEY) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { title, slug, content_html, content_markdown, metaDescription, heroImageUrl, status = 'publish' } = body;

  if (!title || !slug || (!content_html && !content_markdown)) {
    return new Response(JSON.stringify({ error: 'title, slug, and content_html or content_markdown are required' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const content = content_html ?? `<div>${content_markdown}</div>`;
  const wordCount = content.replace(/<[^>]+>/g, '').split(/\s+/).length;
  const readTime = `${Math.max(1, Math.round(wordCount / 200))} min read`;
  const excerpt = metaDescription ?? content.replace(/<[^>]+>/g, '').slice(0, 160).trim();

  upsertArticle({
    slug,
    title,
    description: metaDescription ?? excerpt,
    date: new Date().toISOString().split('T')[0],
    category: 'Article',
    readTime,
    excerpt,
    content,
    heroImageUrl,
    status: status as 'publish' | 'draft' | 'pending',
  });

  return new Response(JSON.stringify({ success: true, slug }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
