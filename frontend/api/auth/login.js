import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const console = globalThis.console;
const authRoutes = require('../../../backend/routes/auth');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const originalUrl = req.url;
  req.url = '/login';

  return authRoutes(req, res, (err) => {
    req.url = originalUrl;
    if (err) {
      console.error('auth/login handler error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    return res.status(404).json({ error: 'Not found' });
  });
}