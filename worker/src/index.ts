export interface Env {
  LEADS_KV: KVNamespace;
  LEAD_WEBHOOK_URL?: string;
}

interface LeadData {
  type: 'job' | 'contact' | 'contractor';
  name?: string;
  phone?: string;
  email?: string;
  [key: string]: any;
}

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function formatLeadEmail(lead: LeadData): string {
  const lines = [
    `New ${lead.type} lead from usaconcretejobs.com`,
    '',
    `Name: ${lead.name || 'N/A'}`,
    `Phone: ${lead.phone || 'N/A'}`,
    `Email: ${lead.email || 'N/A'}`,
  ];

  for (const [key, value] of Object.entries(lead)) {
    if (key !== 'type' && key !== 'name' && key !== 'phone' && key !== 'email' && value) {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const val = Array.isArray(value) ? value.join(', ') : String(value);
      lines.push(`${label}: ${val}`);
    }
  }

  lines.push('', `Submitted: ${new Date().toISOString()}`);
  return lines.join('\n');
}

async function handleLeadSubmission(
  request: Request,
  env: Env,
  type: 'job' | 'contact' | 'contractor'
): Promise<Response> {
  try {
    const data = await request.json() as LeadData;
    data.type = type;

    // Store in KV if available (create KV namespace in Cloudflare dashboard)
    try {
      if (env.LEADS_KV) {
        const timestamp = Date.now();
        const key = `${type}:${timestamp}:${Math.random().toString(36).slice(2, 8)}`;
        await env.LEADS_KV.put(key, JSON.stringify(data), { expirationTtl: 60 * 60 * 24 * 90 });
      }
    } catch (kvErr) {
      console.error('KV storage error (non-critical):', kvErr);
    }

    // Optional: send to webhook (configure URL in Cloudflare dashboard)
    if (env.LEAD_WEBHOOK_URL) {
      await fetch(env.LEAD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `New ${type} lead - USA Concrete Jobs`,
          body: formatLeadEmail(data),
          ...data,
        }),
      }).catch(() => {});
    }

    return jsonResponse({ success: true, message: 'Lead captured' });
  } catch (err) {
    console.error('Lead submission error:', err);
    return jsonResponse({ success: false, error: 'Server error' }, 500);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    switch (url.pathname) {
      case '/api/jobs':
      case '/jobs':
        return handleLeadSubmission(request, env, 'job');
      case '/api/leads':
      case '/leads':
        return handleLeadSubmission(request, env, 'contact');
      case '/api/contractors':
      case '/contractors':
        return handleLeadSubmission(request, env, 'contractor');
      default:
        return jsonResponse({ error: 'Not found' }, 404);
    }
  },
};
