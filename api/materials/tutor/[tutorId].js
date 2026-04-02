import { supabaseAdmin } from '../../config/supabase.js';
import { getUserIdFromToken } from '../../utils/authHelpers.js';

function setCors(res) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
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
        const { tutorId } = req.query;

        if (!tutorId) {
            return res.status(400).json({ error: 'Missing tutorId parameter' });
        }

        const { data: materials, error } = await supabaseAdmin
            .from('materials')
            .select('*')
            .eq('tutor_id', tutorId);

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch materials', message: error.message });
        }

        return res.json({ materials: materials || [] });
    } catch (err) {
        console.error('Get tutor materials error:', err);
        return res.status(500).json({ error: 'Internal server error', message: err.message });
    }
}
