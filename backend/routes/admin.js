// Admin Routes
// For platform administrators to manage tutor approvals

const express = require('express');
const router = express.Router();
require('dotenv').config();
const { supabaseAdmin } = require('../config/supabase');

const { getUserIdFromToken } = require('../utils/authHelpers');

// Middleware to check if user is admin
async function requireAdmin(req, res, next) {
    try {
        const userId = getUserIdFromToken(req.headers.authorization);
        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
        }

        const { data: user, error } = await supabaseAdmin
            .from('profiles')
            .select('role, roles')
            .eq('id', userId)
            .single();

        const roles = Array.isArray(user?.roles) ? user.roles : [];
        const legacyRole = user?.role ? [user.role] : [];
        const allRoles = [...new Set([...roles, ...legacyRole])];
        if (error || !user || !allRoles.includes('admin')) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Admin access required'
            });
        }

        req.userId = userId;
        next();
    } catch (error) {
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}

async function attachTutorSettings(tutors = []) {
    if (!Array.isArray(tutors) || tutors.length === 0) {
        return tutors;
    }

    const tutorIds = tutors.map((tutor) => tutor.id).filter(Boolean);
    if (tutorIds.length === 0) {
        return tutors;
    }

    const { data: settingsRows, error } = await supabaseAdmin
        .from('tutor_settings')
        .select('*')
        .in('tutor_id', tutorIds);

    if (error || !settingsRows) {
        return tutors;
    }

    const settingsByTutorId = new Map(settingsRows.map((row) => [row.tutor_id, row]));

    return tutors.map((tutor) => {
        const settings = settingsByTutorId.get(tutor.id);
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

// =============================================
// GET /api/admin/tutors/pending
// Get all pending tutor registrations
// =============================================
router.get('/tutors/pending', requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('id, email, name, tutorial_group, created_at, tutor_status_notes')
            .eq('role', 'tutor')
            .eq('tutor_status', 'pending')
            .order('created_at', { ascending: true });

        if (error) throw error;

        const tutorsWithSettings = await attachTutorSettings(data || []);

        res.json({
            success: true,
            tutors: tutorsWithSettings,
            count: tutorsWithSettings.length
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
// GET /api/admin/tutors/approved
// Get all approved tutors
// =============================================
router.get('/tutors/approved', requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('id, email, name, tutorial_group, created_at, tutor_approved_at, tutor_status_notes')
            .eq('role', 'tutor')
            .eq('tutor_status', 'approved')
            .order('tutor_approved_at', { ascending: false });

        if (error) throw error;

        const tutorsWithSettings = await attachTutorSettings(data || []);

        res.json({
            success: true,
            tutors: tutorsWithSettings,
            count: tutorsWithSettings.length
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
// GET /api/admin/tutors/rejected
// Get all rejected tutors
// =============================================
router.get('/tutors/rejected', requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('id, email, name, tutorial_group, created_at, tutor_status_notes')
            .eq('role', 'tutor')
            .eq('tutor_status', 'rejected')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tutorsWithSettings = await attachTutorSettings(data || []);

        res.json({
            success: true,
            tutors: tutorsWithSettings,
            count: tutorsWithSettings.length
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
// POST /api/admin/tutors/approve/:tutorId
// Approve a tutor registration
// =============================================
router.post('/tutors/approve/:tutorId', requireAdmin, async (req, res) => {
    try {
        const { tutorId } = req.params;
        const { notes } = req.body;

        const { error } = await supabaseAdmin
            .from('profiles')
            .update({
                tutor_status: 'approved',
                tutor_approved_at: new Date().toISOString(),
                tutor_status_notes: notes || null
            })
            .eq('id', tutorId)
            .eq('role', 'tutor');

        if (error) throw error;

        res.json({
            success: true,
            message: 'Tutor approved successfully'
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
// POST /api/admin/tutors/reject/:tutorId
// Reject a tutor registration
// =============================================
router.post('/tutors/reject/:tutorId', requireAdmin, async (req, res) => {
    try {
        const { tutorId } = req.params;
        const { notes } = req.body;

        const { error } = await supabaseAdmin
            .from('profiles')
            .update({
                tutor_status: 'rejected',
                tutor_status_notes: notes || 'Application rejected'
            })
            .eq('id', tutorId)
            .eq('role', 'tutor');

        if (error) throw error;

        res.json({
            success: true,
            message: 'Tutor rejected'
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
// GET /api/admin/stats
// Get platform statistics
// =============================================
router.get('/stats', requireAdmin, async (req, res) => {
    try {
        // Get counts in parallel
        const [tutorsResult, studentsResult, materialsResult, pendingResult] = await Promise.all([
            supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'tutor'),
            supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
            supabaseAdmin.from('materials').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'tutor').eq('tutor_status', 'pending')
        ]);

        res.json({
            success: true,
            stats: {
                totalTutors: tutorsResult.count || 0,
                totalStudents: studentsResult.count || 0,
                totalMaterials: materialsResult.count || 0,
                pendingApprovals: pendingResult.count || 0
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// =============================================
// POST /api/admin/tutors/:id/pause
// =============================================
router.post('/tutors/:id/pause', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({ tutor_status: 'paused' })
            .eq('id', id)
            .select('id, name, email, tutor_status')
            .single();
        if (error) {
            console.error('[admin] pause error:', error);
            return res.status(500).json({ error: 'Failed to pause tutor', message: error.message });
        }
        if (!data) return res.status(404).json({ error: 'Tutor not found' });
        res.json({ success: true, message: 'Tutor paused successfully', tutor: data });
    } catch (err) {
        console.error('[admin] pause unhandled:', err);
        res.status(500).json({ error: 'Internal server error', message: err.message });
    }
});

// =============================================
// POST /api/admin/tutors/:id/unpause
// =============================================
router.post('/tutors/:id/unpause', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update({ tutor_status: 'approved' })
            .eq('id', id)
            .select('id, name, email, tutor_status')
            .single();
        if (error) {
            console.error('[admin] unpause error:', error);
            return res.status(500).json({ error: 'Failed to unpause tutor', message: error.message });
        }
        if (!data) return res.status(404).json({ error: 'Tutor not found' });
        res.json({ success: true, message: 'Tutor unpaused successfully', tutor: data });
    } catch (err) {
        console.error('[admin] unpause unhandled:', err);
        res.status(500).json({ error: 'Internal server error', message: err.message });
    }
});

module.exports = router;
