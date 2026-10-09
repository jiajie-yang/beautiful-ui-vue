import { loadEnv } from 'vite';
import { subscriptionMiddleware } from './http.mjs';
export function subscriptionPlugin() {
  let options;
  const configure = server => { server.middlewares.use((req, res, next) => subscriptionMiddleware(req, res, next, options)); };
  return { name: 'beautiful-ui-subscribe', configResolved(config) {
    const env = loadEnv(config.mode, config.envDir, '');
    options = { apiKey: process.env.RESEND_API_KEY ?? env.RESEND_API_KEY };
  }, configureServer: configure, configurePreviewServer: configure };
}
