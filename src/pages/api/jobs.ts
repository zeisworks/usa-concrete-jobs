export const prerender = false;

import type { APIRoute } from 'astro';
import { appendRecord } from '../../lib/formStore';

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, string>;
  try { body = await request.json(); } catch {
    return json({ error: 'Invalid request' }, 400);
  }

  const { name, phone, email, service, state, city, description } = body;
  if (!name || !phone || !email || !service || !state || !city || !description) {
    return json({ error: 'name, phone, email, service, state, city, and description are required' }, 422);
  }

  appendRecord('jobs', body);
  return json({ success: true });
};

function json(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
