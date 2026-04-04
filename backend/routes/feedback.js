// Feedback Routes
const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
require('dotenv').config();

const { getUserIdFromToken } = require('../utils/authHelpers');

// Helper function to get user profile
async function getUserProfile(userId) {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email, role, tutorial_group')
        .eq('id', userId)
        .single();
    
    return { data, error };
}

// =============================================
// POST /api/feedback - Submit feedback
// =============================================
router.post('/', async (req, res) => {
    try {
        // Check authentication
        const userId = await getUserIdFromToken(req.headers.authorization);
        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
        }

        // Get user profile to check role
        const { data: profile, error: profileError } = await getUserProfile(userId);
        if (profileError || !profile) {
            return res.status(404).json({
                error: 'Profile not found',
                message: 'User profile does not exist'
            });
        }

        // Only students can submit feedback
        if (profile.role !== 'student') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Only students can submit feedback'
            });
        }

        // Validate input
        const { material_id, rating, comment } = req.body;

        if (!material_id) {
            return res.status(400).json({
                error: 'Missing required field',
                message: 'Material ID is required'
            });
        }

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                error: 'Invalid rating',
                message: 'Rating must be between 1 and 5'
            });
        }

        // Verify material exists
        const { data: material, error: materialError } = await supabaseAdmin
            .from('materials')
            .select('id')
            .eq('id', material_id)
            .single();

        if (materialError || !material) {
            return res.status(404).json({
                error: 'Material not found',
                message: 'The material you are trying to rate does not exist'
            });
        }

        // Check if student already submitted feedback for this material
        const { data: existingFeedback } = await supabaseAdmin
            .from('feedback')
            .select('id')
            .eq('material_id', material_id)
            .eq('student_id', userId)
            .single();

        if (existingFeedback) {
            return res.status(409).json({
                error: 'Feedback already exists',
                message: 'You have already submitted feedback for this material'
            });
        }

        // Create feedback
        const { data: feedback, error: feedbackError } = await supabaseAdmin
            .from('feedback')
            .insert({
                material_id: material_id,
                student_id: userId,
                rating: parseInt(rating),
                comment: comment || null
            })
            .select(`
                *,
                profiles:profiles!feedback_student_id_fkey(email)
            `)
            .single();

        if (feedbackError) {
            return res.status(500).json({
                error: 'Failed to submit feedback',
                message: feedbackError.message
            });
        }

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            feedback: feedback
        });

    } catch (error) {
        console.error('Submit feedback error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// =============================================
// GET /api/feedback/material/:materialId - Get feedback for a material
// =============================================
router.get('/material/:materialId', async (req, res) => {
    try {
        const { materialId } = req.params;

        // Verify material exists
        const { data: material, error: materialError } = await supabaseAdmin
            .from('materials')
            .select('id')
            .eq('id', materialId)
            .single();

        if (materialError || !material) {
            return res.status(404).json({
                error: 'Material not found',
                message: 'The material does not exist'
            });
        }

        // Get feedback for this material
        const { data: feedback, error: feedbackError } = await supabaseAdmin
            .from('feedback')
            .select(`
                id,
                rating,
                comment,
                created_at,
                profiles:profiles!feedback_student_id_fkey(email)
            `)
            .eq('material_id', materialId)
            .order('created_at', { ascending: false });

        if (feedbackError) {
            return res.status(500).json({
                error: 'Failed to fetch feedback',
                message: feedbackError.message
            });
        }

        // Calculate average rating
        const avgRating = feedback && feedback.length > 0
            ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
            : 0;

        res.json({
            success: true,
            feedback: feedback || [],
            count: feedback?.length || 0,
            averageRating: Math.round(avgRating * 10) / 10 // Round to 1 decimal
        });

    } catch (error) {
        console.error('Get feedback error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// =============================================
// GET /api/feedback/tutor/:tutorId - Get all feedback for tutor's materials
// =============================================
router.get('/tutor/:tutorId', async (req, res) => {
    try {
        const { tutorId } = req.params;

        // Get tutor's tutorial_group
        const { data: tutorProfile, error: tutorProfileError } = await getUserProfile(tutorId);
        if (tutorProfileError || !tutorProfile) {
            return res.status(404).json({ error: 'Tutor not found' });
        }

        // Get materials by this tutor, scoped to their tutorial_group
        let materialsQuery = supabaseAdmin
            .from('materials')
            .select('id')
            .eq('tutor_id', tutorId);

        if (tutorProfile.tutorial_group) {
            materialsQuery = materialsQuery.eq('tutorial_group', tutorProfile.tutorial_group);
        }

        const { data: materials, error: materialsError } = await materialsQuery;

        if (materialsError) {
            return res.status(500).json({
                error: 'Failed to fetch materials',
                message: materialsError.message
            });
        }

        if (!materials || materials.length === 0) {
            return res.json({ success: true, feedback: [], count: 0 });
        }

        const materialIds = materials.map(m => m.id);

        // Get feedback only from students approved in the tutor's tutorial_group
        const { data: approvedStudents } = await supabaseAdmin
            .from('student_approvals')
            .select('student_id')
            .eq('tutorial_group_name', tutorProfile.tutorial_group || '')
            .eq('status', 'approved');

        const approvedStudentIds = (approvedStudents || []).map(a => a.student_id);

        let feedbackQuery = supabaseAdmin
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

        // If we have approved students, filter to only their feedback
        if (approvedStudentIds.length > 0) {
            feedbackQuery = feedbackQuery.in('student_id', approvedStudentIds);
        } else {
            // No approved students in this group — return empty
            return res.json({ success: true, feedback: [], count: 0 });
        }

        const { data: feedback, error: feedbackError } = await feedbackQuery;

        if (feedbackError) {
            return res.status(500).json({
                error: 'Failed to fetch feedback',
                message: feedbackError.message
            });
        }

        res.json({
            success: true,
            feedback: feedback || [],
            count: feedback?.length || 0
        });

    } catch (error) {
        console.error('Get tutor feedback error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// =============================================
// GET /api/feedback/stats/:materialId - Get feedback statistics for a material
// =============================================
router.get('/stats/:materialId', async (req, res) => {
    try {
        const { materialId } = req.params;

        const { data: feedback, error } = await supabaseAdmin
            .from('feedback')
            .select('rating')
            .eq('material_id', materialId);

        if (error) {
            return res.status(500).json({
                error: 'Failed to fetch feedback stats',
                message: error.message
            });
        }

        if (!feedback || feedback.length === 0) {
            return res.json({
                success: true,
                averageRating: 0,
                totalRatings: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            });
        }

        // Calculate statistics
        const totalRatings = feedback.length;
        const averageRating = feedback.reduce((sum, f) => sum + f.rating, 0) / totalRatings;
        
        // Rating distribution
        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        feedback.forEach(f => {
            ratingDistribution[f.rating] = (ratingDistribution[f.rating] || 0) + 1;
        });

        res.json({
            success: true,
            averageRating: Math.round(averageRating * 10) / 10,
            totalRatings: totalRatings,
            ratingDistribution: ratingDistribution
        });

    } catch (error) {
        console.error('Get feedback stats error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

module.exports = router;


