import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { subscriptionMiddleware } from './http.mjs';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.mp4':'video/mp4', '.txt':'text/plain' };
export function createAppServer(options = {}) {
  return createServer((req, res) => subscriptionMiddleware(req, res, async () => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      let path = resolve(root, `.${pathname}`);
      if (path !== root.slice(0,-1) && !path.startsWith(root.endsWith(sep) ? root : root + sep)) { res.writeHead(403); res.end(); return; }
      if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
      try { if (!(await stat(path)).isFile()) throw new Error('directory'); }
      catch { if (extname(path)) { res.writeHead(404); res.end(); return; } path = resolve(root, 'index.html'); }
      const data = await readFile(path);
      res.writeHead(200, { 'Content-Type': mime[extname(path)] ?? 'application/octet-stream', 'X-Content-Type-Options':'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch { res.writeHead(404); res.end(); }
  }, options));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 3000), host = process.env.HOST ?? '127.0.0.1';
  createAppServer().listen(port, host, () => console.log(`Beautiful UI Vue: http://${host}:${port}`));
}
