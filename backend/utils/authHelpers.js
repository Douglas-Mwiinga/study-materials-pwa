
const jwt = require('jsonwebtoken');

function getUserIdFromToken(authHeader) {
  console.log('[authHelpers] getUserIdFromToken called with authHeader:', authHeader ? authHeader.substring(0, 30) + '...' : 'null');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[authHelpers] No or invalid Authorization header');
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[authHelpers] Token successfully verified. Decoded payload:', decoded);
    return decoded.userId;
  } catch (err) {
    console.error('[authHelpers] JWT verification failed:', err.message);
    return null;
  }
}

// Dummy getUserProfile function (replace with real DB lookup)
async function getUserProfile(userId) {
  // Simulate a tutor profile for demonstration
  // For demonstration, always return a tutor profile if userId is present
  if (userId) {
    return { data: { id: userId, role: 'tutor', email: 'tutor@example.com' }, error: null };
  }
  return { data: null, error: 'User not found' };
}

module.exports = {
  getUserIdFromToken,
  getUserProfile
};
