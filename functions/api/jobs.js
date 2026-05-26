// Cloudflare Pages Function: /api/jobs
// Handles job posting form submissions from usaconcretejobs.com

export async function onRequestPost(context) {
  try {
    const data = await context.request.json();

    const lines = [
      `New job posting from usaconcretejobs.com`,
      ``,
      `Name: ${data.name || 'N/A'}`,
      `Phone: ${data.phone || 'N/A'}`,
      `Email: ${data.email || 'N/A'}`,
      `Service: ${data.service || 'N/A'}`,
      `State: ${data.state || 'N/A'}`,
      `City: ${data.city || 'N/A'}`,
    ];
    if (data.budget) lines.push(`Budget: ${data.budget}`);
    if (data.timeline) lines.push(`Timeline: ${data.timeline}`);
    if (data.description) lines.push(`Description: ${data.description}`);
    lines.push(``, `Submitted: ${new Date().toISOString()}`);

    // Store in KV
    if (context.env && context.env.LEADS_KV) {
      const key = `job:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
      await context.env.LEADS_KV.put(key, JSON.stringify(data), { expirationTtl: 60 * 60 * 24 * 90 });
    }

    // Forward to webhook
    if (context.env && context.env.LEAD_WEBHOOK_URL) {
      await fetch(context.env.LEAD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `New job posted - USA Concrete Jobs`,
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
    console.error('Job posting error:', err);
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
