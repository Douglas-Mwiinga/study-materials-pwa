// Tutor Approval Management Routes
// For admins to approve/reject tutor accounts

const express = require('express');
const router = express.Router();
require('dotenv').config();
const { supabaseAdmin } = require('../config/supabase');
const emailService = require('../services/email');

// Middleware to check if user is authenticated
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'No token provided'
        });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
        return res.status(401).json({
            error: 'Invalid token',
            message: 'Token is invalid or expired'
        });
    }

    req.user = user;
    next();
};

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
    try {
        const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', req.user.id)
            .single();

        if (error || profile.role !== 'admin') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Admin access required'
            });
        }

        next();
    } catch (error) {
        res.status(500).json({
            error: 'Error checking permissions',
            message: error.message
        });
    }
};

// =============================================
// GET /api/tutor-approvals/pending
// Get all pending tutor approvals (admins only)
// =============================================
router.get('/pending', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { data: pendingTutors, error } = await supabaseAdmin
            .from('profiles')
            .select(`
                id,
                email,
                name,
                created_at,
                tutor_status,
                tutor_status_notes
            `)
            .eq('role', 'tutor')
            .eq('tutor_status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({
                error: 'Failed to fetch pending tutors',
                message: error.message
            });
        }

        res.json({
            success: true,
            data: pendingTutors || []
        });
    } catch (error) {
        console.error('Get pending tutors error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// =============================================
// GET /api/tutor-approvals/approved
// Get all approved tutors (admins only)
// =============================================
router.get('/approved', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { data: approvedTutors, error } = await supabaseAdmin
            .from('profiles')
            .select(`
                id,
                email,
                name,
                tutor_approved_at,
                tutor_status_notes
            `)
            .eq('role', 'tutor')
            .eq('tutor_status', 'approved')
            .order('tutor_approved_at', { ascending: false });

        if (error) {
            return res.status(500).json({
                error: 'Failed to fetch approved tutors',
                message: error.message
            });
        }

        res.json({
            success: true,
            data: approvedTutors || []
        });
    } catch (error) {
        console.error('Get approved tutors error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// =============================================
// GET /api/tutor-approvals/rejected
// Get all rejected tutors (admins only)
// =============================================
router.get('/rejected', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { data: rejectedTutors, error } = await supabaseAdmin
            .from('profiles')
            .select(`
                id,
                email,
                name,
                tutor_status_notes
            `)
            .eq('role', 'tutor')
            .eq('tutor_status', 'rejected')
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({
                error: 'Failed to fetch rejected tutors',
                message: error.message
            });
        }

        res.json({
            success: true,
            data: rejectedTutors || []
        });
    } catch (error) {
        console.error('Get rejected tutors error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// =============================================
// POST /api/tutor-approvals/approve/:tutorId
// Approve a tutor account (admins only)
// =============================================
router.post('/approve/:tutorId', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { tutorId } = req.params;
        const { notes } = req.body;
        const adminId = req.user.id;

        // Get tutor info before updating
        const { data: tutor, error: getTutorError } = await supabaseAdmin
            .from('profiles')
            .select('email, name')
            .eq('id', tutorId)
            .single();

        if (getTutorError || !tutor) {
            return res.status(404).json({
                error: 'Tutor not found',
                message: getTutorError?.message || 'Tutor profile does not exist'
            });
        }

        // Update tutor profile status
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                tutor_status: 'approved',
                tutor_approved_at: new Date().toISOString(),
                tutor_status_notes: notes || ''
            })
            .eq('id', tutorId);

        if (profileError) {
            return res.status(500).json({
                error: 'Failed to approve tutor',
                message: profileError.message
            });
        }

        // Create/update approval record
        const { error: approvalError } = await supabaseAdmin
            .from('tutor_approvals')
            .upsert({
                tutor_id: tutorId,
                status: 'approved',
                approved_by: adminId,
                approved_at: new Date().toISOString(),
                admin_notes: notes || ''
            }, { onConflict: 'tutor_id' });

        if (approvalError) {
            console.error('Approval record error:', approvalError);
            // Don't fail if approval record creation fails, tutor is already approved
        }

        // Send approval email
        await emailService.sendTutorApproved(tutor.email, tutor.name);

        res.json({
            success: true,
            message: 'Tutor approved successfully and notification sent'
        });
    } catch (error) {
        console.error('Approve tutor error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// =============================================
// POST /api/tutor-approvals/reject/:tutorId
// Reject a tutor account (admins only)
// =============================================
router.post('/reject/:tutorId', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { tutorId } = req.params;
        const { notes } = req.body;
        const adminId = req.user.id;

        if (!notes) {
            return res.status(400).json({
                error: 'Missing rejection reason',
                message: 'Please provide a reason for rejection'
            });
        }

        // Get tutor info before updating
        const { data: tutor, error: getTutorError } = await supabaseAdmin
            .from('profiles')
            .select('email, name')
            .eq('id', tutorId)
            .single();

        if (getTutorError || !tutor) {
            return res.status(404).json({
                error: 'Tutor not found',
                message: getTutorError?.message || 'Tutor profile does not exist'
            });
        }

        // Update tutor profile status
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                tutor_status: 'rejected',
                tutor_status_notes: notes
            })
            .eq('id', tutorId);

        if (profileError) {
            return res.status(500).json({
                error: 'Failed to reject tutor',
                message: profileError.message
            });
        }

        // Create/update approval record
        const { error: approvalError } = await supabaseAdmin
            .from('tutor_approvals')
            .upsert({
                tutor_id: tutorId,
                status: 'rejected',
                admin_notes: notes,
                rejected_at: new Date().toISOString()
            }, { onConflict: 'tutor_id' });

        if (approvalError) {
            console.error('Approval record error:', approvalError);
            // Don't fail if approval record creation fails
        }

        // Send rejection email
        await emailService.sendTutorRejected(tutor.email, tutor.name, notes);

        res.json({
            success: true,
            message: 'Tutor rejected successfully and notification sent'
        });
    } catch (error) {
        console.error('Reject tutor error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// =============================================
// POST /api/tutor-approvals/appeal/:tutorId
// Appeal a rejection (tutors only)
// =============================================
router.post('/appeal/:tutorId', requireAuth, async (req, res) => {
    try {
        const { tutorId } = req.params;
        const { notes } = req.body;

        // Check if user is the tutor
        if (req.user.id !== tutorId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You can only appeal your own rejection'
            });
        }

        // Check if tutor status is rejected
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('tutor_status, name, email')
            .eq('id', tutorId)
            .single();

        if (profileError || profile.tutor_status !== 'rejected') {
            return res.status(400).json({
                error: 'Cannot appeal',
                message: 'Only rejected tutor accounts can appeal'
            });
        }

        // Reset status to pending
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
                tutor_status: 'pending',
                tutor_status_notes: notes ? `Appeal: ${notes}` : 'Resubmitted for review'
            })
            .eq('id', tutorId);

        if (updateError) {
            return res.status(500).json({
                error: 'Appeal failed',
                message: updateError.message
            });
        }

        // Send appeal notification to admins (using a placeholder admin email for now)
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@smartup.com';
        await emailService.sendTutorAppealNotification(adminEmail, profile.name, notes || 'No reason provided');

        res.json({
            success: true,
            message: 'Appeal submitted successfully. Admin will review again.'
        });
    } catch (error) {
        console.error('Appeal error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

module.exports = router;
