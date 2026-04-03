import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const authRoutes = require('../../backend/routes/auth');

// Reuse existing Express router by calling its /login handler path
export default async function handler(req, res) {
  req.url = '/login';
  return authRoutes(req, res, () => {
    res.status(404).json({ error: 'Not found' });
  });
}
