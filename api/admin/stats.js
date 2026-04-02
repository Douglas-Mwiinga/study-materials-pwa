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

async function ensureAdmin(authHeader) {
    const userId = getUserIdFromToken(authHeader);
    if (!userId) {
        return { error: { status: 401, body: { error: 'Unauthorized', message: 'Authentication required' } } };
    }

    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, role, roles')
        .eq('id', userId)
        .single();

    if (error || !data) {
        return { error: { status: 403, body: { error: 'Forbidden', message: 'Admin access required' } } };
    }

    const roles = normalizeRoles(data);
    if (!roles.includes('admin')) {
        return { error: { status: 403, body: { error: 'Forbidden', message: 'Admin access required' } } };
    }

    return { userId };
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
        const auth = await ensureAdmin(req.headers.authorization);
        if (auth.error) {
            return res.status(auth.error.status).json(auth.error.body);
        }

        const [tutorsResult, studentsResult, materialsResult, pendingResult] = await Promise.all([
            supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'tutor'),
            supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
            supabaseAdmin.from('materials').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'tutor').eq('tutor_status', 'pending')
        ]);

        return res.json({
            success: true,
            stats: {
                totalTutors: tutorsResult.count || 0,
                totalStudents: studentsResult.count || 0,
                totalMaterials: materialsResult.count || 0,
                pendingApprovals: pendingResult.count || 0
            }
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
