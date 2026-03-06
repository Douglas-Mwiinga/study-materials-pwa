// Admin Routes
// For platform administrators to manage tutor approvals

const express = require('express');
const router = express.Router();
require('dotenv').config();
const { supabaseAdmin } = require('../config/supabase');

// Helper function to extract user ID from token
async function getUserIdFromToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    return (error || !user) ? null : user.id;
}

// Middleware to check if user is admin
async function requireAdmin(req, res, next) {
    try {
        const userId = await getUserIdFromToken(req.headers.authorization);
        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
        }

        const { data: user, error } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (error || !user || user.role !== 'admin') {
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

        res.json({
            success: true,
            tutors: data || [],
            count: data?.length || 0
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

        res.json({
            success: true,
            tutors: data || [],
            count: data?.length || 0
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

        res.json({
            success: true,
            tutors: data || [],
            count: data?.length || 0
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

module.exports = router;
