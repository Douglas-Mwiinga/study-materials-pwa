import { supabaseAdmin } from '../config/supabase.js';
import { getUserIdFromToken } from '../utils/authHelpers.js';

const DEFAULT_DURATION_DAYS = 90;

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
        .select('id, role, roles')
        .eq('id', userId)
        .single();

    if (error || !data) {
        return null;
    }

    return data;
}

function defaultSettings(tutorId) {
    return {
        tutor_id: tutorId,
        default_expiry_mode: 'duration',
        default_duration_days: DEFAULT_DURATION_DAYS,
        exact_expiry_at: null,
        default_expiry_day: 31,
        default_expiry_month: 12
    };
}

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        setCors(res);
        return res.status(200).end();
    }

    setCors(res);

    if (req.method !== 'GET' && req.method !== 'POST') {
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
        const canManage = roles.includes('tutor') || roles.includes('admin');
        if (!canManage) {
            return res.status(403).json({ error: 'Forbidden', message: 'Only tutors or admins can manage settings' });
        }

        if (req.method === 'GET') {
            const { data, error } = await supabaseAdmin
                .from('tutor_settings')
                .select('*')
                .eq('tutor_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                return res.status(500).json({ error: 'Failed to load settings', message: error.message });
            }

            return res.json({ success: true, data: data || defaultSettings(userId) });
        }

        const body = req.body || {};
        const payload = {
            tutor_id: userId,
            default_expiry_mode: body.default_expiry_mode === 'fixed_date' ? 'fixed_date' : 'duration',
            default_duration_days: Number(body.default_duration_days) > 0 ? Number(body.default_duration_days) : DEFAULT_DURATION_DAYS,
            exact_expiry_at: body.exact_expiry_at || null,
            default_expiry_day: Number(body.default_expiry_day) || 31,
            default_expiry_month: Number(body.default_expiry_month) || 12,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabaseAdmin
            .from('tutor_settings')
            .upsert(payload, { onConflict: 'tutor_id' })
            .select('*')
            .single();

        if (error) {
            return res.status(500).json({ error: 'Failed to save settings', message: error.message });
        }

        return res.json({ success: true, data, updatedApprovalsCount: 0 });
    } catch (error) {
        console.error('Tutor settings error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
