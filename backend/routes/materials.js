// Materials Routes
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { supabaseAdmin } = require('../config/supabase');
require('dotenv').config();

// Configure multer for file uploads (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow common document types
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'text/plain',
            'image/png',
            'image/jpeg',
            'image/jpg'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed. Allowed types: PDF, DOC, DOCX, XLS, XLSX, TXT, PNG, JPG'));
        }
    }
});

// Helper function to get user ID from token
async function getUserIdFromToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];
    
    try {
        // Verify token and get user
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !user) {
            return null;
        }
        return user.id;
    } catch (error) {
        return null;
    }
}

// Helper function to get user profile
async function getUserProfile(userId) {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email, role, tutor_status, tutorial_group')
        .eq('id', userId)
        .single();
    
    return { data, error };
}

// =============================================
// GET /api/materials - List all materials
// =============================================
router.get('/', async (req, res) => {
    try {
        const { course, search } = req.query;

        // Require authentication for materials access
        const userId = await getUserIdFromToken(req.headers.authorization);
        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
        }

        const { data: userProfile, error: userProfileError } = await getUserProfile(userId);
        if (userProfileError || !userProfile) {
            return res.status(404).json({
                error: 'Profile not found',
                message: 'User profile does not exist'
            });
        }
        
        let query = supabaseAdmin
            .from('materials')
            .select(`
                id,
                course,
                title,
                description,
                file_name,
                file_url,
                file_size,
                file_type,
                downloads_count,
                tutorial_group,
                created_at,
                tutor_id,
                profiles:profiles!materials_tutor_id_fkey(email)
            `)
            .order('created_at', { ascending: false });

        // Enforce approved access for students and filter by approved tutorial group
        if (userProfile?.role === 'student') {
            const { data: latestApproval, error: approvalError } = await supabaseAdmin
                .from('student_approvals')
                .select('status, tutorial_group_name, access_expires_at, created_at')
                .eq('student_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (approvalError || !latestApproval) {
                return res.status(403).json({
                    error: 'Approval required',
                    message: 'Your account is pending tutor approval.'
                });
            }

            if (latestApproval.status !== 'approved') {
                return res.status(403).json({
                    error: 'Approval required',
                    message: 'Your account is pending tutor approval.'
                });
            }

            if (latestApproval.access_expires_at) {
                const expiresAt = new Date(latestApproval.access_expires_at);
                const now = new Date();
                if (expiresAt < now) {
                    return res.status(403).json({
                        error: 'Access expired',
                        message: 'Your access to materials has expired. Please contact your tutor.'
                    });
                }
            }

            const tutorialGroup = latestApproval.tutorial_group_name || userProfile.tutorial_group;
            if (!tutorialGroup) {
                return res.status(403).json({
                    error: 'No tutorial group assigned',
                    message: 'No tutorial group is assigned to your approved access.'
                });
            }

            query = query.eq('tutorial_group', tutorialGroup);
        }
        
        // Filter by tutor_id for tutors (show only their uploads)
        if (userProfile?.role === 'tutor') {
            query = query.eq('tutor_id', userId);
        }

        if (userProfile?.role !== 'student' && userProfile?.role !== 'tutor') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Invalid user role for materials access'
            });
        }

        // Filter by course if provided
        if (course) {
            query = query.eq('course', course);
        }

        // Search in title and description if provided
        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const { data: materials, error } = await query;

        if (error) {
            return res.status(500).json({
                error: 'Failed to fetch materials',
                message: error.message
            });
        }

        res.json({
            success: true,
            materials: materials || [],
            count: materials?.length || 0
        });

    } catch (error) {
        console.error('List materials error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// =============================================
// POST /api/materials - Upload a new material
// =============================================
router.post('/', upload.single('file'), async (req, res) => {
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

        // Only tutors can upload
        if (profile.role !== 'tutor') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Only tutors can upload materials'
            });
        }

        // Check tutor approval status
        if (profile.tutor_status !== 'approved') {
            return res.status(403).json({
                error: 'Tutor not approved',
                message: `Your tutor account is ${profile.tutor_status}. You must be approved by an admin to upload materials.`
            });
        }

        // Check if tutor has a tutorial group assigned
        if (!profile.tutorial_group) {
            return res.status(400).json({
                error: 'No tutorial group assigned',
                message: 'You must be assigned to a tutorial group before uploading materials. Please contact an administrator.'
            });
        }

        // Validate required fields
        const { course, title, description } = req.body;
        if (!course || !title) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Course and title are required'
            });
        }

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                error: 'No file uploaded',
                message: 'Please select a file to upload'
            });
        }

        const file = req.file;
        const fileName = `${Date.now()}-${file.originalname}`;
        const filePath = `materials/${userId}/${fileName}`;

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin
            .storage
            .from('materials')
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (uploadError) {
            return res.status(500).json({
                error: 'File upload failed',
                message: uploadError.message
            });
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin
            .storage
            .from('materials')
            .getPublicUrl(filePath);

        // Save material record to database
        const { data: material, error: dbError } = await supabaseAdmin
            .from('materials')
            .insert({
                tutor_id: userId,
                course: course,
                title: title,
                description: description || null,
                file_name: file.originalname,
                file_url: publicUrl,
                file_size: file.size,
                file_type: file.mimetype,
                tutorial_group: profile.tutorial_group,
                downloads_count: 0
            })
            .select()
            .single();

        if (dbError) {
            // If database insert fails, try to delete uploaded file
            await supabaseAdmin.storage.from('materials').remove([filePath]);
            
            return res.status(500).json({
                error: 'Failed to save material',
                message: dbError.message
            });
        }

        res.status(201).json({
            success: true,
            message: 'Material uploaded successfully',
            material: material
        });

    } catch (error) {
        console.error('Upload material error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// =============================================
// GET /api/materials/:id - Get single material
// =============================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data: material, error } = await supabaseAdmin
            .from('materials')
            .select(`
                *,
                profiles:profiles!materials_tutor_id_fkey(email)
            `)
            .eq('id', id)
            .single();

        if (error) {
            return res.status(404).json({
                error: 'Material not found',
                message: error.message
            });
        }

        res.json({
            success: true,
            material: material
        });

    } catch (error) {
        console.error('Get material error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// =============================================
// POST /api/materials/:id/download - Increment download count
// =============================================
router.post('/:id/download', async (req, res) => {
    try {
        const { id } = req.params;

        // Check authentication
        const userId = await getUserIdFromToken(req.headers.authorization);
        if (userId) {
            // If authenticated, verify student access hasn't expired
            const { data: userProfile, error: profileError } = await getUserProfile(userId);
            
            if (!profileError && userProfile && userProfile.role === 'student') {
                // Check student approval and expiry
                const { data: latestApproval, error: approvalError } = await supabaseAdmin
                    .from('student_approvals')
                    .select('status, access_expires_at')
                    .eq('student_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (!approvalError && latestApproval) {
                    if (latestApproval.status !== 'approved') {
                        return res.status(403).json({
                            error: 'Approval required',
                            message: 'Your account is pending tutor approval.'
                        });
                    }

                    // Check expiry
                    if (latestApproval.access_expires_at) {
                        const expiresAt = new Date(latestApproval.access_expires_at);
                        const now = new Date();
                        if (expiresAt < now) {
                            return res.status(403).json({
                                error: 'Access expired',
                                message: 'Your access to materials has expired. Please contact your tutor.'
                            });
                        }
                    }
                }
            }
        }

        // Get current material
        const { data: currentMaterial, error: fetchError } = await supabaseAdmin
            .from('materials')
            .select('downloads_count')
            .eq('id', id)
            .single();

        if (fetchError) {
            return res.status(404).json({
                error: 'Material not found',
                message: fetchError.message
            });
        }

        // Increment download count
        const { data: material, error } = await supabaseAdmin
            .from('materials')
            .update({ downloads_count: (currentMaterial.downloads_count || 0) + 1 })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({
                error: 'Failed to update download count',
                message: error.message
            });
        }

        res.json({
            success: true,
            message: 'Download count updated',
            material: material
        });

    } catch (error) {
        console.error('Download count error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// =============================================
// GET /api/materials/tutor/:tutorId - Get materials by tutor
// =============================================
router.get('/tutor/:tutorId', async (req, res) => {
    try {
        const { tutorId } = req.params;

        const { data: materials, error } = await supabaseAdmin
            .from('materials')
            .select('*')
            .eq('tutor_id', tutorId)
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({
                error: 'Failed to fetch materials',
                message: error.message
            });
        }

        res.json({
            success: true,
            materials: materials || [],
            count: materials?.length || 0
        });

    } catch (error) {
        console.error('Get tutor materials error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// =============================================
// DELETE /api/materials/:id - Delete material (tutor only)
// =============================================
router.delete('/:id', async (req, res) => {
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

        // Only tutors can delete materials
        if (profile.role !== 'tutor') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Only tutors can delete materials'
            });
        }

        const { id } = req.params;

        // Get material to verify ownership and get file path
        const { data: material, error: fetchError } = await supabaseAdmin
            .from('materials')
            .select('id, tutor_id, file_url, file_name')
            .eq('id', id)
            .single();

        if (fetchError || !material) {
            return res.status(404).json({
                error: 'Material not found',
                message: 'Material does not exist'
            });
        }

        // Verify the material belongs to the authenticated tutor
        if (material.tutor_id !== userId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You can only delete your own materials'
            });
        }

        // Extract file path from file_url
        // File URL format: https://[project].supabase.co/storage/v1/object/public/materials/[path]
        // We need to extract: materials/[userId]/[fileName]
        let filePath = null;
        try {
            const url = new URL(material.file_url);
            // Extract path after /materials/
            const pathMatch = url.pathname.match(/\/materials\/(.+)$/);
            if (pathMatch) {
                filePath = `materials/${pathMatch[1]}`;
            } else {
                // Fallback: construct path from userId and file_name
                filePath = `materials/${userId}/${material.file_name}`;
            }
        } catch (urlError) {
            // If URL parsing fails, construct path from userId and file_name
            filePath = `materials/${userId}/${material.file_name}`;
        }

        // Delete file from storage (if path is available)
        if (filePath) {
            const { error: storageError } = await supabaseAdmin
                .storage
                .from('materials')
                .remove([filePath]);

            // Log storage deletion errors but don't fail if file doesn't exist
            if (storageError) {
                console.warn('Storage deletion warning:', storageError.message);
                // Continue with database deletion even if storage deletion fails
            }
        }

        // Delete material record from database
        const { error: deleteError } = await supabaseAdmin
            .from('materials')
            .delete()
            .eq('id', id)
            .eq('tutor_id', userId); // Extra safety check

        if (deleteError) {
            return res.status(500).json({
                error: 'Failed to delete material',
                message: deleteError.message
            });
        }

        res.json({
            success: true,
            message: 'Material deleted successfully'
        });

    } catch (error) {
        console.error('Delete material error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

module.exports = router;

