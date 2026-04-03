const authRoutes = require('../../backend/routes/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  req.url = '/logout';
  return authRoutes(req, res, (err) => {
    if (err) return res.status(500).json({ error: 'Internal server error' });
    return res.status(404).json({ error: 'Not found' });
  });
};
