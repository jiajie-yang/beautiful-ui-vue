const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const json = (body, status = 200) => Response.json(body, { status });
/** Server only: never expose RESEND_API_KEY through a VITE_ variable. */
export async function subscribe(request, { apiKey = process.env.RESEND_API_KEY, fetchImpl = fetch } = {}) {
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  let email;
  try { ({ email } = await request.json()); } catch { return json({ error: 'Invalid body' }, 400); }
  email = String(email ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return json({ error: 'Invalid email' }, 400);
  if (!apiKey) return json({ error: 'Storage unavailable' }, 503);
  const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
  try {
    const created = await fetchImpl('https://api.resend.com/contacts', {
      method: 'POST', headers, body: JSON.stringify({ email, unsubscribed: false }), signal: AbortSignal.timeout(10000),
    });
    if (created.ok) return json({ ok: true, stored: true });
    // Confirm duplicates without re-subscribing an opted-out contact.
    const existing = await fetchImpl(`https://api.resend.com/contacts/${encodeURIComponent(email)}`, {
      headers, cache: 'no-store', signal: AbortSignal.timeout(10000),
    });
    if (existing.ok) return json({ ok: true, stored: true, existing: true });
    return json({ error: 'Storage failed' }, 502);
  } catch { return json({ error: 'Storage failed' }, 502); }
}
