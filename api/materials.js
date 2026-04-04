import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const materialsRoutes = require('../backend/routes/materials');

// Disable Vercel's default body parser so multer can parse multipart/form-data
export const config = {
  api: {
    bodyParser: false
  }
};

function toSubPath(req, base) {
  const queryRoute = req.query?.route;

  if (Array.isArray(queryRoute) && queryRoute.length > 0) {
    return `/${queryRoute.join('/')}`;
  }

  if (typeof queryRoute === 'string' && queryRoute.length > 0) {
    return `/${queryRoute}`;
  }

  const pathname = new URL(req.url, 'http://localhost').pathname;
  const parts = pathname.split('/').filter(Boolean);

  if (parts[0] === 'api') parts.shift();
  if (parts[0] === base) parts.shift();

  return parts.length > 0 ? `/${parts.join('/')}` : '/';
}

export default async function handler(req, res) {
  req.url = toSubPath(req, 'materials');

  return materialsRoutes(req, res, (err) => {
    if (err) return res.status(500).json({ error: 'Internal server error' });
    return res.status(404).json({ error: 'Not found' });
  });
}