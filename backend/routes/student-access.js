// Student Access Management Routes
// For tutors to approve/reject student access and manage settings

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

// =============================================
// GET /api/student-access/pending
// Get all pending student approvals for a tutor
// =============================================
router.get('/pending', requireAuth, async (req, res) => {
    try {
        const tutorId = req.user.id;

        const { data: tutorProfile, error: tutorProfileError } = await supabaseAdmin
            .from('profiles')
            .select('id, role, tutorial_group')
            .eq('id', tutorId)
            .single();

        if (tutorProfileError || !tutorProfile || tutorProfile.role !== 'tutor') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Only tutors can view pending approvals'
            });
        }

        if (!tutorProfile.tutorial_group) {
            return res.json({
                success: true,
                data: []
            });
        }

        // Get all pending approvals for this tutor's tutorial group
        const { data: pendingApprovals, error } = await supabaseAdmin
            .from('student_approvals')
            .select('id, student_id, payment_screenshot_url, status, created_at, tutorial_group_name, tutor_id')
            .eq('status', 'pending')
            .eq('tutorial_group_name', tutorProfile.tutorial_group)
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({
                error: 'Failed to fetch pending approvals',
                message: error.message
            });
        }

        if (!pendingApprovals || pendingApprovals.length === 0) {
            return res.json({
                success: true,
                data: []
            });
        }

        const studentIds = pendingApprovals.map(item => item.student_id);
        const { data: studentProfiles, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, name, email')
            .in('id', studentIds);

        if (profileError) {
            return res.status(500).json({
                error: 'Failed to fetch student profiles',
                message: profileError.message
            });
        }

        const profileMap = new Map((studentProfiles || []).map(profile => [profile.id, profile]));
        const hydratedApprovals = pendingApprovals.map(item => ({
            ...item,
            profiles: profileMap.get(item.student_id) || null
        }));

        res.json({
            success: true,
            data: hydratedApprovals
        });

    } catch (error) {
        console.error('Get pending approvals error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// =============================================
// GET /api/student-access/approved
// Get all approved students for a tutor
// =============================================
router.get('/approved', requireAuth, async (req, res) => {
    try {
        const tutorId = req.user.id;

        // Get all approved approvals for this tutor
        const { data: approvedApprovals, error } = await supabaseAdmin
            .from('student_approvals')
            .select('id, student_id, status, access_expires_at, created_at, approved_at, tutorial_group_name, tutor_id')
            .eq('tutor_id', tutorId)
            .eq('status', 'approved')
            .order('approved_at', { ascending: false });

        if (error) {
            return res.status(500).json({
                error: 'Failed to fetch approved students',
                message: error.message
            });
        }

        if (!approvedApprovals || approvedApprovals.length === 0) {
            return res.json({
                success: true,
                data: []
            });
        }

        const studentIds = approvedApprovals.map(item => item.student_id);
        const { data: studentProfiles, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, name, email')
            .in('id', studentIds);

        if (profileError) {
            return res.status(500).json({
                error: 'Failed to fetch student profiles',
                message: profileError.message
            });
        }

        const profileMap = new Map((studentProfiles || []).map(profile => [profile.id, profile]));
        const hydratedApprovals = approvedApprovals.map(item => ({
            ...item,
            profiles: profileMap.get(item.student_id) || null
        }));

        res.json({
            success: true,
            data: hydratedApprovals
        });

    } catch (error) {
        console.error('Get approved students error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// =============================================
// POST /api/student-access/approve/:approvalId
// Approve a student and set access expiry date
// =============================================
router.post('/approve/:approvalId', requireAuth, async (req, res) => {
    try {
        const { approvalId } = req.params;
        const tutorId = req.user.id;
        let { expiryDate } = req.body; // Format: "YYYY-MM-DD"

        // Get tutor profile
        const { data: tutorProfile, error: tutorProfileError } = await supabaseAdmin
            .from('profiles')
            .select('id, role, tutorial_group, name')
            .eq('id', tutorId)
            .single();

        if (tutorProfileError || !tutorProfile || tutorProfile.role !== 'tutor') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Only tutors can approve students'
            });
        }

        // Get approval record with student info
        const { data: approval } = await supabaseAdmin
            .from('student_approvals')
            .select('student_id, tutor_id, tutorial_group_name, status')
            .eq('id', approvalId)
            .single();

        if (!approval) {
            return res.status(404).json({
                error: 'Approval not found',
                message: 'Approval record does not exist'
            });
        }

        if (approval.status !== 'pending') {
            return res.status(400).json({
                error: 'Invalid approval state',
                message: 'Only pending approvals can be approved'
            });
        }

        if (!tutorProfile.tutorial_group || approval.tutorial_group_name !== tutorProfile.tutorial_group) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You can only approve students in your tutorial group'
            });
        }

        if (approval.tutor_id && approval.tutor_id !== tutorId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'This approval is already assigned to another tutor'
            });
        }

        // Get student and tutor info
        const { data: student } = await supabaseAdmin
            .from('profiles')
            .select('name, email')
            .eq('id', approval.student_id)
            .single();

        const { data: tutor } = await supabaseAdmin
            .from('profiles')
            .select('name')
            .eq('id', tutorId)
            .single();

        // If no explicit expiry date provided, use tutor's default
        if (!expiryDate) {
            // Get tutor's default expiry date setting
            const { data: tutorSettings } = await supabaseAdmin
                .from('tutor_settings')
                .select('default_expiry_day, default_expiry_month')
                .eq('tutor_id', tutorId)
                .single();

            if (tutorSettings) {
                // Build expiry date from day/month (next occurrence or this year)
                const today = new Date();
                const day = tutorSettings.default_expiry_day;
                const month = tutorSettings.default_expiry_month - 1; // JS months are 0-indexed
                let year = today.getFullYear();

                // If date has already passed this year, use next year
                const expiryThis = new Date(year, month, day);
                if (expiryThis < today) {
                    year = today.getFullYear() + 1;
                }

                expiryDate = new Date(year, month, day).toISOString().split('T')[0];
            } else {
                // Default: 1 year from now
                const expiryDateObj = new Date();
                expiryDateObj.setFullYear(expiryDateObj.getFullYear() + 1);
                expiryDate = expiryDateObj.toISOString().split('T')[0];
            }
        }

        // Update approval record
        const { data: updatedApproval, error } = await supabaseAdmin
            .from('student_approvals')
            .update({
                tutor_id: tutorId,
                status: 'approved',
                access_expires_at: expiryDate,
                approved_at: new Date().toISOString()
            })
            .eq('id', approvalId)
            .select()
            .single();

        if (error) {
            return res.status(500).json({
                error: 'Failed to approve student',
                message: error.message
            });
        }

        // Send approval email to student
        if (student) {
            await emailService.sendStudentApprovalGranted(
                student.email,
                student.name,
                tutorProfile.name || tutor?.name || 'Your Tutor'
            );
        }

        res.json({
            success: true,
            message: 'Student approved successfully and notification sent',
            data: updatedApproval
        });

    } catch (error) {
        console.error('Approve student error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// =============================================
// POST /api/student-access/reject/:approvalId
// Reject a student
// =============================================
router.post('/reject/:approvalId', requireAuth, async (req, res) => {
    try {
        const { approvalId } = req.params;
        const tutorId = req.user.id;
        const { notes } = req.body; // Optional rejection reason

        // Get tutor profile
        const { data: tutorProfile, error: tutorProfileError } = await supabaseAdmin
            .from('profiles')
            .select('id, role, tutorial_group, name')
            .eq('id', tutorId)
            .single();

        if (tutorProfileError || !tutorProfile || tutorProfile.role !== 'tutor') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Only tutors can reject students'
            });
        }

        // Get approval record with student info
        const { data: approval } = await supabaseAdmin
            .from('student_approvals')
            .select('student_id, tutor_id, tutorial_group_name, status')
            .eq('id', approvalId)
            .single();

        if (!approval) {
            return res.status(404).json({
                error: 'Approval not found',
                message: 'Approval record does not exist'
            });
        }

        if (approval.status !== 'pending') {
            return res.status(400).json({
                error: 'Invalid approval state',
                message: 'Only pending approvals can be rejected'
            });
        }

        if (!tutorProfile.tutorial_group || approval.tutorial_group_name !== tutorProfile.tutorial_group) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You can only reject students in your tutorial group'
            });
        }

        if (approval.tutor_id && approval.tutor_id !== tutorId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'This approval is already assigned to another tutor'
            });
        }

        // Get student and tutor info
        const { data: student } = await supabaseAdmin
            .from('profiles')
            .select('name, email')
            .eq('id', approval.student_id)
            .single();

        const { data: tutor } = await supabaseAdmin
            .from('profiles')
            .select('name')
            .eq('id', tutorId)
            .single();

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
            return res.status(500).json({
                error: 'Failed to reject student',
                message: error.message
            });
        }

        // Send rejection email to student
        if (student) {
            await emailService.sendStudentApprovalRejected(
                student.email,
                student.name,
                tutorProfile.name || tutor?.name || 'Your Tutor'
            );
        }

        res.json({
            success: true,
            message: 'Student rejected successfully',
            data: updatedApproval
        });

    } catch (error) {
        console.error('Reject student error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// =============================================
// POST /api/student-access/revoke/:approvalId
// Revoke previously approved access
// =============================================
router.post('/revoke/:approvalId', requireAuth, async (req, res) => {
    try {
        const { approvalId } = req.params;
        const tutorId = req.user.id;

        // Update approval record to revoke access
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
            return res.status(500).json({
                error: 'Failed to revoke access',
                message: error.message
            });
        }

        if (!updatedApproval) {
            return res.status(404).json({
                error: 'Approval not found',
                message: 'Approval record does not exist or does not belong to you'
            });
        }

        res.json({
            success: true,
            message: 'Access revoked successfully',
            data: updatedApproval
        });

    } catch (error) {
        console.error('Revoke access error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// =============================================
// GET /api/student-access/settings
// Get tutor's default access settings
// =============================================
router.get('/settings', requireAuth, async (req, res) => {
    try {
        const tutorId = req.user.id;

        // Get tutor settings
        const { data: settings, error } = await supabaseAdmin
            .from('tutor_settings')
            .select('*')
            .eq('tutor_id', tutorId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
            return res.status(500).json({
                error: 'Failed to fetch settings',
                message: error.message
            });
        }

        res.json({
            success: true,
            data: settings || {
                default_expiry_day: 31,
                default_expiry_month: 12
            }
        });

    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// =============================================
// POST /api/student-access/settings
// Update tutor's default access settings
// =============================================
router.post('/settings', requireAuth, async (req, res) => {
    try {
        const tutorId = req.user.id;
        const { defaultExpiryDay, defaultExpiryMonth } = req.body;

        // Validate input
        if (defaultExpiryDay < 1 || defaultExpiryDay > 31) {
            return res.status(400).json({
                error: 'Invalid day',
                message: 'Day must be between 1 and 31'
            });
        }

        if (defaultExpiryMonth < 1 || defaultExpiryMonth > 12) {
            return res.status(400).json({
                error: 'Invalid month',
                message: 'Month must be between 1 and 12'
            });
        }

        // Try to update, if not exists then insert
        const { data: existingSettings } = await supabaseAdmin
            .from('tutor_settings')
            .select('id')
            .eq('tutor_id', tutorId)
            .single();

        let result;
        if (existingSettings) {
            // Update
            result = await supabaseAdmin
                .from('tutor_settings')
                .update({
                    default_expiry_day: defaultExpiryDay,
                    default_expiry_month: defaultExpiryMonth
                })
                .eq('tutor_id', tutorId)
                .select()
                .single();
        } else {
            // Insert
            result = await supabaseAdmin
                .from('tutor_settings')
                .insert({
                    tutor_id: tutorId,
                    default_expiry_day: defaultExpiryDay,
                    default_expiry_month: defaultExpiryMonth
                })
                .select()
                .single();
        }

        const { data: settings, error } = result;

        if (error) {
            return res.status(500).json({
                error: 'Failed to save settings',
                message: error.message
            });
        }

        res.json({
            success: true,
            message: 'Settings updated successfully',
            data: settings
        });

    } catch (error) {
        console.error('Save settings error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// =============================================
// GET /api/student-access/status
// Get student approval status (for modal UI)
// =============================================
router.get('/status', requireAuth, async (req, res) => {
    try {
        const studentId = req.user.id;

        // Get student profile to check role
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', studentId)
            .single();

        if (profileError || !profile || profile.role !== 'student') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Only students can check approval status'
            });
        }

        // Get student approval record
        const { data: approvals, error: approvalsError } = await supabaseAdmin
            .from('student_approvals')
            .select('status, access_expires_at, tutorial_group_name')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false })
            .limit(1);

        if (approvalsError) {
            return res.status(500).json({
                error: 'Failed to get approval status',
                message: approvalsError.message
            });
        }

        // No approval record found
        if (!approvals || approvals.length === 0) {
            return res.json({
                success: true,
                status: 'pending',
                message: 'No approval record found. Please wait for tutor approval.'
            });
        }

        const approval = approvals[0];

        // Check if approved but expired
        if (approval.status === 'approved') {
            const now = new Date().toISOString();
            if (approval.access_expires_at && approval.access_expires_at < now) {
                return res.json({
                    success: true,
                    status: 'rejected',
                    message: 'Your access has expired. Please contact your tutor to renew.'
                });
            }
        }

        res.json({
            success: true,
            status: approval.status,
            tutorialGroup: approval.tutorial_group_name,
            expiresAt: approval.access_expires_at,
            message: approval.status === 'pending' 
                ? 'Your access request is under review.'
                : approval.status === 'rejected'
                ? 'Your access request was not approved.'
                : 'Access approved'
        });

    } catch (error) {
        console.error('Get approval status error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// =============================================
// GET /api/student-access/check-access
// Check if student has approved access
// =============================================
router.get('/check-access', requireAuth, async (req, res) => {
    try {
        const studentId = req.user.id;

        // Get approved access for this student
        const { data: approvals, error } = await supabaseAdmin
            .from('student_approvals')
            .select('*')
            .eq('student_id', studentId)
            .eq('status', 'approved');

        if (error) {
            return res.status(500).json({
                error: 'Failed to check access',
                message: error.message
            });
        }

        const now = new Date().toISOString();
        const validApprovals = approvals.filter(a => !a.access_expires_at || a.access_expires_at > now);

        res.json({
            success: true,
            hasAccess: validApprovals.length > 0,
            validApprovals: validApprovals.length,
            totalApprovals: approvals.length
        });

    } catch (error) {
        console.error('Check access error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

module.exports = router;
