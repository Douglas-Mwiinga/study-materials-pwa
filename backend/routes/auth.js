// Authentication Routes
const express = require('express');
const router = express.Router();
const multer = require('multer');
require('dotenv').config();
const { supabaseAdmin } = require('../config/supabase');
const emailService = require('../services/email');

// Setup multer for file uploads (keep in memory)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// =============================================
// POST /api/auth/signup
// =============================================
router.post('/signup', upload.any(), async (req, res) => {
    try {
        const { email, password, role, name, tutorialGroup } = req.body;
        const paymentScreenshot = req.files?.find(f => f.fieldname === 'paymentScreenshot');

        // Validate input
        if (!email || !password || !role || !name) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Email, password, role, and name are required'
            });
        }

        // Validate student requires payment screenshot
        if (role === 'student' && !paymentScreenshot) {
            return res.status(400).json({
                error: 'Missing payment proof',
                message: 'Students must provide a payment screenshot'
            });
        }

        // Validate student requires tutorial group
        if (role === 'student' && !tutorialGroup) {
            return res.status(400).json({
                error: 'Missing tutorial group',
                message: 'Students must specify which tutorial group they are joining'
            });
        }

        // Validate tutor requires tutorial group
        if (role === 'tutor' && !tutorialGroup) {
            return res.status(400).json({
                error: 'Missing tutorial group',
                message: 'Tutors must specify which tutorial group they manage'
            });
        }

        if (role !== 'student' && role !== 'tutor') {
            return res.status(400).json({
                error: 'Invalid role',
                message: 'Role must be "student" or "tutor"'
            });
        }

        // Check if user already exists
        const { data: existingUser } = await supabaseAdmin
            .from('profiles')
            .select('email')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(409).json({
                error: 'User already exists',
                message: 'An account with this email already exists'
            });
        }

        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true // Auto-confirm email for now
        });

        if (authError) {
            return res.status(400).json({
                error: 'Signup failed',
                message: authError.message
            });
        }

        const userId = authData.user.id;
        let paymentScreenshotUrl = null;

        // Upload payment screenshot to Supabase Storage if student
        if (role === 'student' && paymentScreenshot) {
            try {
                const fileName = `${userId}-${Date.now()}-${paymentScreenshot.originalname}`;
                const { data: storageData, error: storageError } = await supabaseAdmin.storage
                    .from('payment-proofs')
                    .upload(fileName, paymentScreenshot.buffer, {
                        contentType: paymentScreenshot.mimetype,
                        upsert: false
                    });

                if (storageError) {
                    throw storageError;
                }

                // Get public URL
                const { data: { publicUrl } } = supabaseAdmin.storage
                    .from('payment-proofs')
                    .getPublicUrl(fileName);

                paymentScreenshotUrl = publicUrl;
            } catch (storageErr) {
                console.error('Storage upload error:', storageErr);
                // Rollback: delete user if storage upload fails
                await supabaseAdmin.auth.admin.deleteUser(userId);
                return res.status(500).json({
                    error: 'File upload failed',
                    message: storageErr.message
                });
            }
        }

        // Both students and tutors use tutorialGroup field
        const resolvedTutorialGroup = tutorialGroup || null;

        // Create profile in profiles table
        const profileData = {
            id: userId,
            email: email,
            name: name,
            role: role,
            payment_screenshot_url: paymentScreenshotUrl,
            tutorial_group: resolvedTutorialGroup
        };

        // Set tutor_status for tutors (pending approval)
        if (role === 'tutor') {
            profileData.tutor_status = 'pending';
        }

        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert(profileData);

        if (profileError) {
            // Rollback: delete user and remove file if profile creation fails
            await supabaseAdmin.auth.admin.deleteUser(userId);
            if (paymentScreenshotUrl) {
                const fileName = paymentScreenshotUrl.split('/').pop();
                await supabaseAdmin.storage.from('payment-proofs').remove([fileName]);
            }
            return res.status(500).json({
                error: 'Profile creation failed',
                message: profileError.message
            });
        }

        // Create initial approval record for students
        if (role === 'student') {
            const { error: approvalError } = await supabaseAdmin
                .from('student_approvals')
                .insert({
                    student_id: userId,
                    tutor_id: null,
                    payment_screenshot_url: paymentScreenshotUrl,
                    tutorial_group_name: tutorialGroup,
                    status: 'pending'
                });

            if (approvalError) {
                console.error('Approval record creation failed:', approvalError);
                // Don't rollback - this is non-critical
            }
        }

        // Send welcome email to tutors
        if (role === 'tutor') {
            await emailService.sendTutorWelcome(email, name);
        }

        // Return success with user data (no password!)
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                id: userId,
                email: email,
                name: name,
                role: role,
                tutorialGroup: resolvedTutorialGroup
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// =============================================
// POST /api/auth/login
// =============================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                error: 'Missing credentials',
                message: 'Email and password are required'
            });
        }

        // Authenticate user with Supabase using client
        // Use the regular supabase client (not admin) for login
        const { supabase } = require('../config/supabase');

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError || !authData.user || !authData.session) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: authError?.message || 'Email or password is incorrect'
            });
        }

        const userId = authData.user.id;

        // Get user profile (including role and name)
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, email, name, role, tutorial_group')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            return res.status(500).json({
                error: 'Profile not found',
                message: 'User account exists but profile is missing'
            });
        }

        // Return success with user data and session
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                role: profile.role,
                tutorialGroup: profile.tutorial_group
            },
            session: {
                access_token: authData.session.access_token,
                refresh_token: authData.session.refresh_token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// =============================================
// POST /api/auth/logout
// =============================================
router.post('/logout', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'No token provided'
            });
        }

        const token = authHeader.split(' ')[1];

        // Sign out user (invalidate session)
        const { error } = await supabaseAdmin.auth.signOut();

        // Even if signOut fails, return success (token will expire anyway)
        res.json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        console.error('Logout error:', error);
        // Still return success - logout is mostly client-side
        res.json({
            success: true,
            message: 'Logout successful'
        });
    }
});

// =============================================
// GET /api/auth/me (Get current user)
// =============================================
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'No token provided'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token and get user
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                error: 'Invalid token',
                message: 'Token is invalid or expired'
            });
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, email, name, role, tutorial_group, created_at, tutor_status, tutor_status_notes, tutor_approved_at')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return res.status(404).json({
                error: 'Profile not found',
                message: 'User profile does not exist'
            });
        }

        res.json({
            success: true,
            user: profile
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

module.exports = router;

