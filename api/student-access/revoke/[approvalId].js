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

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const tutorId = getUserIdFromToken(req.headers.authorization);
        if (!tutorId) {
            return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
        }

        const { approvalId } = req.query;
        if (!approvalId) {
            return res.status(400).json({ error: 'Missing approvalId parameter' });
        }

        const { data: updatedApproval, error } = await supabaseAdmin
            .from('student_approvals')
            .update({
                status: 'rejected',
                access_expires_at: null,
                rejected_at: new Date().toISOString()
            })
            .eq('id', approvalId)
            .eq('tutor_id', tutorId)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: 'Failed to revoke access', message: error.message });
        }

        if (!updatedApproval) {
            return res.status(404).json({ error: 'Approval not found', message: 'Approval record does not exist or does not belong to you' });
        }

        return res.json({ success: true, message: 'Access revoked successfully', data: updatedApproval });
    } catch (err) {
        console.error('Revoke access error:', err);
        return res.status(500).json({ error: 'Internal server error', message: err.message });
    }
}
