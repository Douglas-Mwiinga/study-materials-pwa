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

        const { notes } = req.body || {};

        // Get tutor profile
        const { data: tutorProfile, error: tutorProfileError } = await supabaseAdmin
            .from('profiles')
            .select('id, role, tutorial_group, name')
            .eq('id', tutorId)
            .single();

        if (tutorProfileError || !tutorProfile || tutorProfile.role !== 'tutor') {
            return res.status(403).json({ error: 'Forbidden', message: 'Only tutors can reject students' });
        }

        // Get approval record
        const { data: approval } = await supabaseAdmin
            .from('student_approvals')
            .select('student_id, tutor_id, tutorial_group_name, status')
            .eq('id', approvalId)
            .single();

        if (!approval) {
            return res.status(404).json({ error: 'Approval not found', message: 'Approval record does not exist' });
        }

        if (approval.status !== 'pending') {
            return res.status(400).json({ error: 'Invalid approval state', message: 'Only pending approvals can be rejected' });
        }

        if (!tutorProfile.tutorial_group || approval.tutorial_group_name !== tutorProfile.tutorial_group) {
            return res.status(403).json({ error: 'Forbidden', message: 'You can only reject students in your tutorial group' });
        }

        if (approval.tutor_id && approval.tutor_id !== tutorId) {
            return res.status(403).json({ error: 'Forbidden', message: 'This approval is already assigned to another tutor' });
        }

        // Update approval record
        const { data: updatedApproval, error } = await supabaseAdmin
            .from('student_approvals')
            .update({
                tutor_id: tutorId,
                status: 'rejected',
                rejected_at: new Date().toISOString(),
                notes: notes || null
            })
            .eq('id', approvalId)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: 'Failed to reject student', message: error.message });
        }

        // Optionally send email (gracefully skipped if email service unavailable)
        try {
            const { default: emailService } = await import('../../services/email.js');
            const { data: student } = await supabaseAdmin
                .from('profiles').select('name, email').eq('id', approval.student_id).single();
            if (student) {
                await emailService.sendStudentApprovalRejected(student.email, student.name, tutorProfile.name || 'Your Tutor');
            }
        } catch (_emailErr) {
            console.warn('Email notification skipped:', _emailErr.message);
        }

        return res.json({ success: true, message: 'Student rejected successfully', data: updatedApproval });
    } catch (err) {
        console.error('Reject student error:', err);
        return res.status(500).json({ error: 'Internal server error', message: err.message });
    }
}
