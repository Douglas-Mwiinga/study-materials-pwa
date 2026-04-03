module.exports = function handler(_req, res) {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
};
