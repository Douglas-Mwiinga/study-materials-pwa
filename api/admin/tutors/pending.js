import { supabaseAdmin } from '../../config/supabase.js';
import { getUserIdFromToken } from '../../utils/authHelpers.js';

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

    if (error || !data || !normalizeRoles(data).includes('admin')) {
        return { error: { status: 403, body: { error: 'Forbidden', message: 'Admin access required' } } };
    }

    return { userId };
}

async function attachTutorSettings(tutors = []) {
    if (!tutors.length) {
        return tutors;
    }

    const ids = tutors.map((tutor) => tutor.id).filter(Boolean);
    const { data } = await supabaseAdmin
        .from('tutor_settings')
        .select('*')
        .in('tutor_id', ids);

    const byTutorId = new Map((data || []).map((row) => [row.tutor_id, row]));

    return tutors.map((tutor) => {
        const settings = byTutorId.get(tutor.id);
        return {
            ...tutor,
            default_expiry_mode: settings?.default_expiry_mode || 'duration',
            default_duration_days: settings?.default_duration_days ?? 90,
            exact_expiry_at: settings?.exact_expiry_at ?? null,
            default_expiry_day: settings?.default_expiry_day ?? 31,
            default_expiry_month: settings?.default_expiry_month ?? 12
        };
    });
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

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('id, email, name, tutorial_group, created_at, tutor_status_notes')
            .eq('role', 'tutor')
            .eq('tutor_status', 'pending')
            .order('created_at', { ascending: true });

        if (error) {
            return res.status(500).json({ error: 'Internal server error', message: error.message });
        }

        const tutors = await attachTutorSettings(data || []);
        return res.json({ success: true, tutors, count: tutors.length });
    } catch (error) {
        console.error('Get pending tutors error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
