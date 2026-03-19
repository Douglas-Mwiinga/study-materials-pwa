const { getUserIdFromToken, getUserProfile } = require('../utils/authHelpers');

async function isTutor(req, res, next) {
    try {
        console.log('[isTutor] Authorization header:', req.headers.authorization);
        const userId = await getUserIdFromToken(req.headers.authorization);
        console.log('[isTutor] userId:', userId);
        if (!userId) {
            console.log('[isTutor] No valid userId found, sending 401');
            return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
        }

        const { data: profile, error: profileError } = await getUserProfile(userId);
        console.log('[isTutor] profile:', profile, 'profileError:', profileError);
        if (profileError || !profile) {
            return res.status(404).json({ error: 'Profile not found', message: 'User profile does not exist' });
        }

        if (profile.role !== 'tutor') {
            return res.status(403).json({ error: 'Forbidden', message: 'Only tutors can delete materials' });
        }

        req.user = profile;
        next();
    } catch (err) {
        console.log('[isTutor] Server error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
}

module.exports = isTutor;
