import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const authRoutes = require('../../backend/routes/auth');
const console = globalThis.console;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const originalUrl = req.url;
  req.url = '/logout';

  return authRoutes(req, res, (err) => {
    req.url = originalUrl;
    if (err) {
      console.error('auth/logout handler error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    return res.status(404).json({ error: 'Not found' });
  });
}