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

        // Get all materials by this tutor
        const { data: materials, error: materialsError } = await supabaseAdmin
            .from('materials')
            .select('id')
            .eq('tutor_id', tutorId);

        if (materialsError) {
            return res.status(500).json({ error: 'Failed to fetch materials', message: materialsError.message });
        }

        if (!materials || materials.length === 0) {
            return res.json({ success: true, feedback: [], count: 0 });
        }

        const materialIds = materials.map(m => m.id);

        // Get all feedback for these materials
        const { data: feedback, error: feedbackError } = await supabaseAdmin
            .from('feedback')
            .select(`
                id,
                material_id,
                rating,
                comment,
                created_at,
                materials:materials!feedback_material_id_fkey(title, course),
                profiles:profiles!feedback_student_id_fkey(email)
            `)
            .in('material_id', materialIds)
            .order('created_at', { ascending: false });

        if (feedbackError) {
            return res.status(500).json({ error: 'Failed to fetch feedback', message: feedbackError.message });
        }

        return res.json({
            success: true,
            feedback: feedback || [],
            count: feedback ? feedback.length : 0
        });
    } catch (err) {
        console.error('Get tutor feedback error:', err);
        return res.status(500).json({ error: 'Internal server error', message: err.message });
    }
}
