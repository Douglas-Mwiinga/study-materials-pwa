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

async function getRequesterProfile(userId) {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, role, roles, tutorial_group')
        .eq('id', userId)
        .single();

    if (error || !data) {
        return null;
    }

    return data;
}

async function attachStudentProfiles(approvals = []) {
    const studentIds = approvals.map((row) => row.student_id).filter(Boolean);
    if (!studentIds.length) {
        return approvals;
    }

    const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, email, name')
        .in('id', studentIds);

    const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]));

    return approvals.map((approval) => ({
        ...approval,
        profiles: profileById.get(approval.student_id) || null
    }));
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

        const requester = await getRequesterProfile(userId);
        if (!requester) {
            return res.status(403).json({ error: 'Forbidden', message: 'Profile not found' });
        }

        const roles = normalizeRoles(requester);
        const isAdmin = roles.includes('admin');
        const isTutor = roles.includes('tutor');

        if (!isAdmin && !isTutor) {
            return res.status(403).json({ error: 'Forbidden', message: 'Only tutors or admins can view pending approvals' });
        }

        let query = supabaseAdmin
            .from('student_approvals')
            .select('id, student_id, payment_screenshot_url, status, created_at, tutorial_group_name, tutor_id')
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        if (isTutor && !isAdmin) {
            if (!requester.tutorial_group) {
                return res.json({ success: true, data: [] });
            }
            query = query.eq('tutorial_group_name', requester.tutorial_group);
        }

        const { data, error } = await query;
        if (error) {
            return res.status(500).json({ error: 'Failed to fetch pending approvals', message: error.message });
        }

        const withProfiles = await attachStudentProfiles(data || []);
        return res.json({ success: true, data: withProfiles });
    } catch (error) {
        console.error('Get pending students error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
