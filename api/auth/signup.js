import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const authRoutes = require('../../backend/routes/auth');

// Disable Vercel's default body parser so multer can parse multipart/form-data (payment screenshot)
export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  req.url = '/signup';
  return authRoutes(req, res, (err) => {
    if (err) return res.status(500).json({ error: 'Internal server error' });
    return res.status(404).json({ error: 'Not found' });
  });
}
