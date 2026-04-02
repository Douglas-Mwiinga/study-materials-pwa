import jwt from 'jsonwebtoken';

export function getUserIdFromToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.userId;
    } catch (err) {
        console.error('[authHelpers] JWT verification failed:', err.message);
        return null;
    }
}

export async function getUserProfile(userId) {
    if (userId) {
        return { data: { id: userId, role: 'tutor', email: 'tutor@example.com' }, error: null };
    }
    return { data: null, error: 'User not found' };
}
