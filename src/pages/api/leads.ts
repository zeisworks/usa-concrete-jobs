export const prerender = false;

import type { APIRoute } from 'astro';
import { appendRecord } from '../../lib/formStore';

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, string>;
  try { body = await request.json(); } catch {
    return json({ error: 'Invalid request' }, 400);
  }

  const { name, phone, email, state, service } = body;
  if (!name || !phone || !email || !state || !service) {
    return json({ error: 'name, phone, email, state, and service are required' }, 422);
  }

  appendRecord('leads', body);
  return json({ success: true });
};

function json(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
