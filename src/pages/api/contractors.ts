export const prerender = false;

import type { APIRoute } from 'astro';
import { appendRecord } from '../../lib/formStore';

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return json({ error: 'Invalid request' }, 400);
  }

  const { business_name, owner_name, phone, email, state, license_number } = body as Record<string, string>;
  if (!business_name || !owner_name || !phone || !email || !state || !license_number) {
    return json({ error: 'business_name, owner_name, phone, email, state, and license_number are required' }, 422);
  }

  appendRecord('contractors', body);
  return json({ success: true });
};

function json(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
