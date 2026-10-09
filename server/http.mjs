import { subscribe } from './subscribe.mjs';
export async function subscriptionMiddleware(req, res, next, options = {}) {
  if (req.url?.split('?')[0] !== '/api/subscribe') return next();
  try {
    const chunks = []; let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 8192) { res.writeHead(413); res.end('Request too large'); return; }
      chunks.push(chunk);
    }
    const method = req.method ?? 'GET';
    const request = new Request('http://localhost/api/subscribe', { method, headers: { 'Content-Type': 'application/json' },
      ...(method === 'GET' || method === 'HEAD' ? {} : { body: Buffer.concat(chunks) }) });
    const response = await subscribe(request, options);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch { res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Request failed' })); }
}
