// Cloudflare Pages Function: /api/contractors
// Handles contractor application form submissions from usaconcretejobs.com

export async function onRequestPost(context) {
  try {
    const data = await context.request.json();

    const lines = [
      `New contractor application from usaconcretejobs.com`,
      ``,
      `Business: ${data.business_name || 'N/A'}`,
      `Owner: ${data.owner_name || 'N/A'}`,
      `Phone: ${data.phone || 'N/A'}`,
      `Email: ${data.email || 'N/A'}`,
      `State: ${data.state || 'N/A'}`,
      `License: ${data.license_number || 'N/A'}`,
    ];
    if (data.services) lines.push(`Services: ${Array.isArray(data.services) ? data.services.join(', ') : data.services}`);
    if (data.service_area) lines.push(`Service Area: ${data.service_area}`);
    lines.push(``, `Submitted: ${new Date().toISOString()}`);

    // Store in KV
    if (context.env && context.env.LEADS_KV) {
      const key = `contractor:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
      await context.env.LEADS_KV.put(key, JSON.stringify(data), { expirationTtl: 60 * 60 * 24 * 90 });
    }

    // Forward to webhook
    if (context.env && context.env.LEAD_WEBHOOK_URL) {
      await fetch(context.env.LEAD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `New contractor application - USA Concrete Jobs`,
          body: lines.join('\n'),
          ...data,
        }),
      }).catch(() => {});
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('Contractor application error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
