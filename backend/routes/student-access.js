// Middleware to check if user is a tutor or admin
function requireTutorOrAdmin(req, res, next) {
    const userRoles = [
        ...(Array.isArray(req.user.roles) ? req.user.roles : []),
        req.user.role
    ].filter(Boolean);

    const isTutorOrAdmin = userRoles.includes('tutor') || userRoles.includes('admin');
    if (!isTutorOrAdmin) {
        return res.status(403).json({ error: 'Forbidden', message: 'Only tutors or admins can perform this action' });
    }

    return next();
}
// Student Access Management Routes
// For tutors to approve/reject student access and manage settings

const express = require('express');
const router = express.Router();
require('dotenv').config();
const { supabaseAdmin } = require('../config/supabase');
const emailService = require('../services/email');

const DEFAULT_DURATION_DAYS = 90;
const MAX_DURATION_DAYS = 3650;

// Middleware to check if user is authenticated and merge roles from profiles
const { getUserIdFromToken } = require('../utils/authHelpers');
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const userId = getUserIdFromToken(authHeader);
    if (!userId) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Token is invalid or expired'
        });
    }

    // Fetch profile from your profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, name, role, roles, tutorial_group')
        .eq('id', userId)
        .single();

    if (profileError || !profile) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'User profile not found'
        });
    }

    req.user = profile;
    console.log('DEBUG req.user:', req.user);
    next();
};

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

function computeLegacyNextOccurrence(day, month) {
    if (!Number.isInteger(day) || !Number.isInteger(month) || day < 1 || day > 31 || month < 1 || month > 12) {
        return null;
    }

    const now = new Date();
    let year = now.getUTCFullYear();
    let candidate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    if (candidate.getTime() <= now.getTime()) {
        year += 1;
        candidate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    }

    return Number.isNaN(candidate.getTime()) ? null : candidate;
}

function computeExpiryFromTutorSettings(tutorSettings) {
    const mode = tutorSettings?.default_expiry_mode === 'fixed_date' ? 'fixed_date' : 'duration';

    if (mode === 'fixed_date') {
        const fixedIso = toValidFutureIso(tutorSettings?.exact_expiry_at);
        if (!fixedIso) {
            throw new Error('Invalid exact expiry for fixed_date mode');
        }

        return new Date(fixedIso);
    }

    const durationDays = Number(tutorSettings?.default_duration_days);
    if (Number.isInteger(durationDays) && durationDays >= 1 && durationDays <= MAX_DURATION_DAYS) {
        const expiry = new Date();
        expiry.setUTCDate(expiry.getUTCDate() + durationDays);
        return expiry;
    }

    const legacyExpiry = computeLegacyNextOccurrence(
        Number(tutorSettings?.default_expiry_day),
        Number(tutorSettings?.default_expiry_month)
    );
    if (legacyExpiry) {
        return legacyExpiry;
    }

    const fallback = new Date();
    fallback.setUTCDate(fallback.getUTCDate() + DEFAULT_DURATION_DAYS);
    return fallback;
}

function isMissingColumnError(error) {
    const message = String(error?.message || '').toLowerCase();
    return message.includes('column') && message.includes('does not exist');
}

function withDefaultSettings(settings) {
    const mode = settings?.default_expiry_mode === 'fixed_date' ? 'fixed_date' : 'duration';
    const durationDays = Number(settings?.default_duration_days);

    return {
        default_expiry_mode: mode,
        default_duration_days: Number.isInteger(durationDays) && durationDays >= 1 ? durationDays : DEFAULT_DURATION_DAYS,
        exact_expiry_at: settings?.exact_expiry_at || null,
        default_expiry_day: settings?.default_expiry_day ?? 31,
        default_expiry_month: settings?.default_expiry_month ?? 12,
        ...(settings || {})
    };
}

function computeAccessExpiry(settings, approvedAt = new Date()) {
        const mode = settings?.default_expiry_mode === 'fixed_date' ? 'fixed_date' : 'duration';

        if (mode === 'fixed_date') {
                const exactIso = toValidFutureIso(settings?.exact_expiry_at);
                if (!exactIso) {
                        throw new Error('Invalid exact expiry for fixed_date mode');
                }

                return exactIso;
        }

        const days = Number(settings?.default_duration_days);
        const safeDays = Number.isFinite(days) && days > 0 ? days : DEFAULT_DURATION_DAYS;
        const dt = new Date(approvedAt);
        dt.setUTCDate(dt.getUTCDate() + safeDays);
        return dt.toISOString();
}

// =============================================
// GET /api/student-access/pending
// Get all pending student approvals for a tutor
// =============================================
router.get('/pending', requireAuth, requireTutorOrAdmin, async (req, res) => {
    try {
        const tutorId = req.user.id;

        // Fetch the user's profile to get their tutorial_group (for tutors) or all groups (for admins)
        const userId = req.user.id;
        const { data: userProfile, error: userProfileError } = await supabaseAdmin
            .from('profiles')
            .select('id, role, roles, tutorial_group')
            .eq('id', userId)
            .single();

        if (userProfileError || !userProfile) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Profile not found'
            });
        }

        // Check both role and roles fields for admin/tutor
        const roles = [
            ...(Array.isArray(userProfile.roles) ? userProfile.roles : []),
            ...(userProfile.role ? [userProfile.role] : [])
        ];

        let pendingApprovals = [];
        if (roles.includes('admin')) {
            // Admin: get all pending approvals
            const { data, error } = await supabaseAdmin
                .from('student_approvals')
                .select('id, student_id, payment_screenshot_url, status, created_at, tutorial_group_name, tutor_id')
                .eq('status', 'pending')
                .order('created_at', { ascending: true });
            if (error) {
                return res.status(500).json({
                    error: 'Failed to fetch pending approvals',
                    message: error.message
                });
            }
            pendingApprovals = data;
        } else if (roles.includes('tutor')) {
            if (!userProfile.tutorial_group) {
                return res.json({
                    success: true,
                    data: []
                });
            }
            const { data, error } = await supabaseAdmin
                .from('student_approvals')
                .select('id, student_id, payment_screenshot_url, status, created_at, tutorial_group_name, tutor_id')
                .eq('status', 'pending')
                .eq('tutorial_group_name', userProfile.tutorial_group)
                .order('created_at', { ascending: true });
            if (error) {
                return res.status(500).json({
                    error: 'Failed to fetch pending approvals',
                    message: error.message
                });
            }
            pendingApprovals = data;
        } else {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Only tutors or admins can view pending approvals'
            });
        }

        res.json({
            success: true,
            data: pendingApprovals
        });
    } catch (error) {
        console.error('Get pending students error:', error);
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
        let { expiryDate, exactExpiryAt } = req.body; // explicit override formats: YYYY-MM-DD or ISO datetime

        // Use profile already fetched by requireAuth middleware
        const tutorProfile = req.user;
        const allRoles = [
            ...(Array.isArray(tutorProfile.roles) ? tutorProfile.roles : []),
            ...(tutorProfile.role ? [tutorProfile.role] : [])
        ];
        if (!tutorProfile || (!allRoles.includes('tutor') && !allRoles.includes('admin'))) {
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

        const isAdmin = allRoles.includes('admin');
        if (!isAdmin && (!tutorProfile.tutorial_group || approval.tutorial_group_name !== tutorProfile.tutorial_group)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You can only approve students in your tutorial group',
                debug: { tutorGroup: tutorProfile.tutorial_group, approvalGroup: approval.tutorial_group_name }
            });
        }

        if (!isAdmin && approval.tutor_id && approval.tutor_id !== tutorId) {
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

        const explicitExpiry = parseDateInputToUtc(exactExpiryAt || expiryDate, Boolean(expiryDate && !exactExpiryAt));
        let accessExpiresAt;

        if (explicitExpiry) {
            if (!isFutureDate(explicitExpiry)) {
                return res.status(400).json({
                    error: 'Invalid expiry date',
                    message: 'Expiry must be in the future (UTC)'
                });
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

        // Use profile already fetched by requireAuth middleware
        const tutorProfile = req.user;
        const allRoles = [
            ...(Array.isArray(tutorProfile.roles) ? tutorProfile.roles : []),
            ...(tutorProfile.role ? [tutorProfile.role] : [])
        ];
        if (!tutorProfile || (!allRoles.includes('tutor') && !allRoles.includes('admin'))) {
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

        const rejectAllRoles = [
            ...(Array.isArray(tutorProfile.roles) ? tutorProfile.roles : []),
            ...(tutorProfile.role ? [tutorProfile.role] : [])
        ];
        const rejectIsAdmin = rejectAllRoles.includes('admin');
        if (!rejectIsAdmin && (!tutorProfile.tutorial_group || approval.tutorial_group_name !== tutorProfile.tutorial_group)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You can only reject students in your tutorial group',
                debug: { tutorGroup: tutorProfile.tutorial_group, approvalGroup: approval.tutorial_group_name }
            });
        }

        if (!rejectIsAdmin && approval.tutor_id && approval.tutor_id !== tutorId) {
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
            data: withDefaultSettings(settings)
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
    console.log('POST /api/student-access/settings called');
    try {
        const tutorId = req.user.id;
    const applyToExisting = req.body?.applyToExisting === true || req.body?.apply_to_existing === true;
        const expiryMode = req.body?.defaultExpiryMode ?? req.body?.default_expiry_mode ?? 'duration';
        const durationDaysRaw = req.body?.defaultDurationDays ?? req.body?.default_duration_days;
        const exactExpiryRaw = req.body?.exactExpiryAt ?? req.body?.exact_expiry_at ?? null;
        const defaultExpiryDayRaw = req.body?.defaultExpiryDay ?? req.body?.default_expiry_day;
        const defaultExpiryMonthRaw = req.body?.defaultExpiryMonth ?? req.body?.default_expiry_month;
        const defaultExpiryDay = Number(defaultExpiryDayRaw ?? 31);
        const defaultExpiryMonth = Number(defaultExpiryMonthRaw ?? 12);
        const durationDays = Number(durationDaysRaw ?? DEFAULT_DURATION_DAYS);
        const exactExpiryAt = exactExpiryRaw ? parseDateInputToUtc(exactExpiryRaw) : null;

        if (!['duration', 'fixed_date'].includes(expiryMode)) {
            return res.status(400).json({
                error: 'Invalid expiry mode',
                message: 'Mode must be duration or fixed_date'
            });
        }

        if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > MAX_DURATION_DAYS) {
            return res.status(400).json({
                error: 'Invalid duration',
                message: `Duration must be between 1 and ${MAX_DURATION_DAYS} days`
            });
        }

        if (expiryMode === 'fixed_date') {
            if (!exactExpiryAt || !isFutureDate(exactExpiryAt)) {
                return res.status(400).json({
                    error: 'Invalid fixed expiry',
                    message: 'Exact expiry must be a valid future UTC date/time'
                });
            }
        }

        if (!Number.isInteger(defaultExpiryDay) || !Number.isInteger(defaultExpiryMonth)) {
            return res.status(400).json({
                error: 'Invalid settings payload',
                message: 'default expiry day and month must be integers'
            });
        }

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

        const fullPayload = {
            default_expiry_mode: expiryMode,
            default_duration_days: durationDays,
            exact_expiry_at: expiryMode === 'fixed_date' ? exactExpiryAt.toISOString() : null,
            default_expiry_day: defaultExpiryDay,
            default_expiry_month: defaultExpiryMonth
        };

        const legacyPayload = {
            default_expiry_day: defaultExpiryDay,
            default_expiry_month: defaultExpiryMonth
        };

        let result;
        if (existingSettings) {
            result = await supabaseAdmin
                .from('tutor_settings')
                .update(fullPayload)
                .eq('tutor_id', tutorId)
                .select()
                .single();

            if (result.error && isMissingColumnError(result.error)) {
                result = await supabaseAdmin
                    .from('tutor_settings')
                    .update(legacyPayload)
                    .eq('tutor_id', tutorId)
                    .select()
                    .single();
            }
        } else {
            result = await supabaseAdmin
                .from('tutor_settings')
                .insert({
                    tutor_id: tutorId,
                    ...fullPayload
                })
                .select()
                .single();

            if (result.error && isMissingColumnError(result.error)) {
                result = await supabaseAdmin
                    .from('tutor_settings')
                    .insert({
                        tutor_id: tutorId,
                        ...legacyPayload
                    })
                    .select()
                    .single();
            }
        }

        const { data: settings, error } = result;

        if (error) {
            return res.status(500).json({
                error: 'Failed to save settings',
                message: error.message
            });
        }

        if (applyToExisting) {
            const accessExpiresAt = computeAccessExpiry(settings || fullPayload, new Date());

            const { data: updatedApprovals, error: bulkError } = await supabaseAdmin
                .from('student_approvals')
                .update({
                    access_expires_at: accessExpiresAt
                })
                .eq('tutor_id', tutorId)
                .eq('status', 'approved')
                .select('id');

            if (bulkError) {
                return res.status(500).json({
                    error: 'Settings saved, but failed to apply to existing approvals',
                    message: bulkError.message
                });
            }

            return res.json({
                success: true,
                message: 'Settings updated and applied to existing approved students',
                updatedApprovalsCount: Array.isArray(updatedApprovals) ? updatedApprovals.length : 0,
                data: withDefaultSettings(settings)
            });
        }

        res.json({
            success: true,
            message: 'Settings updated successfully',
            data: withDefaultSettings(settings)
        });

    } catch (error) {
        console.error('Save settings error:', error);
    console.error('Settings error:', error); // <-- force log
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
            const expiresAt = parseDateInputToUtc(approval.access_expires_at);
            if (expiresAt && expiresAt.getTime() <= Date.now()) {
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

        const validApprovals = approvals.filter((a) => {
            if (!a.access_expires_at) return true;
            const expiresAt = parseDateInputToUtc(a.access_expires_at);
            return expiresAt && expiresAt.getTime() > Date.now();
        });

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
