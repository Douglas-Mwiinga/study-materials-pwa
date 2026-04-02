import { supabaseAdmin } from '../config/supabase.js';
import { getUserIdFromToken } from '../utils/authHelpers.js';

function setCors(res) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function normalizeRoles(profile = {}) {
    const roles = Array.isArray(profile.roles) ? profile.roles : [];
    const legacyRole = profile.role ? [profile.role] : [];
    return [...new Set([...roles, ...legacyRole])].filter(Boolean);
}

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        setCors(res);
        return res.status(200).end();
    }

    setCors(res);

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const userId = getUserIdFromToken(req.headers.authorization);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, role, roles, tutorial_group')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            return res.status(401).json({ error: 'Unauthorized', message: 'User profile not found' });
        }

        const roles = normalizeRoles(profile);
        const isAdmin = roles.includes('admin');
        const isTutor = roles.includes('tutor');

        if (!isAdmin && !isTutor) {
            return res.status(403).json({ error: 'Forbidden', message: 'Only tutors or admins can access this resource' });
        }

        // Build query: admins see all, tutors see only their own
        let query = supabaseAdmin
            .from('student_approvals')
            .select('id, student_id, status, access_expires_at, created_at, approved_at, tutorial_group_name, tutor_id')
            .eq('status', 'approved')
            .order('approved_at', { ascending: false });

        if (!isAdmin) {
            query = query.eq('tutor_id', userId);
        }

        const { data: approvedApprovals, error } = await query;

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch approved students', message: error.message });
        }

        if (!approvedApprovals || approvedApprovals.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const studentIds = approvedApprovals.map(item => item.student_id);
        const { data: studentProfiles, error: profilesError } = await supabaseAdmin
            .from('profiles')
            .select('id, name, email')
            .in('id', studentIds);

        if (profilesError) {
            return res.status(500).json({ error: 'Failed to fetch student profiles', message: profilesError.message });
        }

        const profileMap = new Map((studentProfiles || []).map(p => [p.id, p]));
        const hydratedApprovals = approvedApprovals.map(item => ({
            ...item,
            profiles: profileMap.get(item.student_id) || null
        }));

        return res.json({ success: true, data: hydratedApprovals });
    } catch (err) {
        console.error('Get approved students error:', err);
        return res.status(500).json({ error: 'Internal server error', message: err.message });
    }
}
