// Cloudflare Pages Function: /api/leads
// Handles contact form submissions from usaconcretejobs.com

export async function onRequestPost(context) {
  try {
    const data = await context.request.json();

    // Build a simple text summary for notification
    const lines = [
      `New lead from usaconcretejobs.com`,
      ``,
      `Name: ${data.name || 'N/A'}`,
      `Phone: ${data.phone || 'N/A'}`,
      `Email: ${data.email || 'N/A'}`,
      `ZIP: ${data.zip || 'N/A'}`,
    ];
    if (data.message) lines.push(`Message: ${data.message}`);
    lines.push(``, `Submitted: ${new Date().toISOString()}`);

    // Store in KV if available
    if (context.env && context.env.LEADS_KV) {
      const key = `lead:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
      await context.env.LEADS_KV.put(key, JSON.stringify(data), { expirationTtl: 60 * 60 * 24 * 90 });
    }

    // Forward to webhook if configured (set LEAD_WEBHOOK_URL in Cloudflare dashboard)
    if (context.env && context.env.LEAD_WEBHOOK_URL) {
      await fetch(context.env.LEAD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `New lead - USA Concrete Jobs`,
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
    console.error('Lead submission error:', err);
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
