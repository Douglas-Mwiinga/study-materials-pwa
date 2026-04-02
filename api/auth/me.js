import { supabaseAdmin } from '../config/supabase.js';
import { getUserIdFromToken } from '../utils/authHelpers.js';

export default async function handler(req, res) {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
        return res.status(200).end();
    }
    // Set CORS headers for all other requests
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    const authHeader = req.headers.authorization;
    const userId = getUserIdFromToken(authHeader);
    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email, name, role, roles, tutorial_group, tutor_status')
        .eq('id', userId)
        .single();
    if (error || !profile) {
        return res.status(404).json({ error: 'User profile not found' });
    }
    res.json({ user: profile });
}
