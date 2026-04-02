import { supabaseAdmin } from '../../config/supabase.js';
import { getUserIdFromToken } from '../../utils/authHelpers.js';

const DEFAULT_DURATION_DAYS = 90;
const MAX_DURATION_DAYS = 3650;

function setCors(res) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function parseDateInputToUtc(value, endOfDay = false) {
    if (!value) return null;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const suffix = endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z';
        const parsed = new Date(`${value}${suffix}`);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isFutureDate(dateValue) {
    return dateValue instanceof Date && !Number.isNaN(dateValue.getTime()) && dateValue.getTime() > Date.now();
}

function toValidFutureIso(value) {
    const parsed = parseDateInputToUtc(value);
    if (!isFutureDate(parsed)) return null;
    return parsed.toISOString();
}

function computeAccessExpiry(settings, approvedAt = new Date()) {
    const mode = settings?.default_expiry_mode === 'fixed_date' ? 'fixed_date' : 'duration';
    if (mode === 'fixed_date') {
        const exactIso = toValidFutureIso(settings?.exact_expiry_at);
        if (!exactIso) throw new Error('Invalid exact expiry for fixed_date mode');
        return exactIso;
    }
    const days = Number(settings?.default_duration_days);
    const safeDays = Number.isFinite(days) && days > 0 ? days : DEFAULT_DURATION_DAYS;
    const dt = new Date(approvedAt);
    dt.setUTCDate(dt.getUTCDate() + safeDays);
    return dt.toISOString();
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

        const { expiryDate, exactExpiryAt } = req.body || {};

        // Get tutor profile
        const { data: tutorProfile, error: tutorProfileError } = await supabaseAdmin
            .from('profiles')
            .select('id, role, tutorial_group, name')
            .eq('id', tutorId)
            .single();

        if (tutorProfileError || !tutorProfile || tutorProfile.role !== 'tutor') {
            return res.status(403).json({ error: 'Forbidden', message: 'Only tutors can approve students' });
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
            return res.status(400).json({ error: 'Invalid approval state', message: 'Only pending approvals can be approved' });
        }

        if (!tutorProfile.tutorial_group || approval.tutorial_group_name !== tutorProfile.tutorial_group) {
            return res.status(403).json({ error: 'Forbidden', message: 'You can only approve students in your tutorial group' });
        }

        if (approval.tutor_id && approval.tutor_id !== tutorId) {
            return res.status(403).json({ error: 'Forbidden', message: 'This approval is already assigned to another tutor' });
        }

        // Compute expiry
        const explicitExpiry = parseDateInputToUtc(exactExpiryAt || expiryDate, Boolean(expiryDate && !exactExpiryAt));
        let accessExpiresAt;

        if (explicitExpiry) {
            if (!isFutureDate(explicitExpiry)) {
                return res.status(400).json({ error: 'Invalid expiry date', message: 'Expiry must be in the future (UTC)' });
            }
            accessExpiresAt = explicitExpiry.toISOString();
        } else {
            const { data: tutorSettings } = await supabaseAdmin
                .from('tutor_settings')
                .select('*')
                .eq('tutor_id', tutorId)
                .single();
            accessExpiresAt = computeAccessExpiry(tutorSettings || {}, new Date());
        }

        // Update approval record
        const { data: updatedApproval, error } = await supabaseAdmin
            .from('student_approvals')
            .update({
                tutor_id: tutorId,
                status: 'approved',
                access_expires_at: accessExpiresAt,
                approved_at: new Date().toISOString()
            })
            .eq('id', approvalId)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: 'Failed to approve student', message: error.message });
        }

        // Optionally send email (gracefully skipped if email service unavailable)
        try {
            const { default: emailService } = await import('../../services/email.js');
            const { data: student } = await supabaseAdmin
                .from('profiles').select('name, email').eq('id', approval.student_id).single();
            if (student) {
                await emailService.sendStudentApprovalGranted(student.email, student.name, tutorProfile.name || 'Your Tutor');
            }
        } catch (_emailErr) {
            console.warn('Email notification skipped:', _emailErr.message);
        }

        return res.json({ success: true, message: 'Student approved successfully', data: updatedApproval });
    } catch (err) {
        console.error('Approve student error:', err);
        return res.status(500).json({ error: 'Internal server error', message: err.message });
    }
}
