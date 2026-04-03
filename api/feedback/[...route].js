import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const feedbackRoutes = require('../../backend/routes/feedback');

function getRouteParts(req, base) {
  const queryRoute = req.query?.route;
  if (Array.isArray(queryRoute)) return queryRoute;
  if (typeof queryRoute === 'string') return [queryRoute];

  const pathname = new URL(req.url || '/', 'http://localhost').pathname;
  const parts = pathname.split('/').filter(Boolean);

  if (parts[0] === 'api') parts.shift();
  if (parts[0] === base) parts.shift();

  return parts;
}

export default async function handler(req, res) {
  const parts = getRouteParts(req, 'feedback');
  req.url = parts.length > 0 ? `/${parts.join('/')}` : '/';

  return feedbackRoutes(req, res, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }

    return res.status(404).json({ error: 'Not found' });
  });
}
