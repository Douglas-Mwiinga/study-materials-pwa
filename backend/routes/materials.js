const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
// const multerS3 = require('multer-s3');
const supabaseConfig = require('../config/supabase');

const s3 = new AWS.S3({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// =============================================
// POST /api/materials/:id/download - Download material file
// =============================================
router.post('/:id/download', async (req, res) => {
    try {
        const materialId = req.params.id;
        const userId = getUserIdFromToken(req.headers.authorization);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
        }

        // Fetch material info, including provider
        const { data: material, error } = await supabaseAdmin
            .from('materials')
            .select('id, file_url, file_name, file_type, provider, s3_key')
            .eq('id', materialId)
            .single();
        if (error || !material) {
            return res.status(404).json({ error: 'Material not found', message: error?.message || 'No material found' });
        }

        // Handle S3 and Supabase providers
        if (material.provider === 's3') {
            // Debug: Log bucket and key
            console.log('Generating signed URL with:');
            console.log('Bucket:', process.env.AWS_S3_BUCKET);
            console.log('Key:', material.s3_key);
            const AWS = require('aws-sdk');
            const s3 = new AWS.S3({
                region: process.env.AWS_REGION,
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            });
            // Use the s3_key column directly
            const s3Key = material.s3_key;
            if (!s3Key) {
                return res.status(500).json({ error: 'Missing S3 key for this material.' });
            }
            const params = {
                Bucket: process.env.AWS_S3_BUCKET,
                Key: s3Key,
                Expires: 60 * 10 // 10 minutes
            };
            try {
                const signedUrl = s3.getSignedUrl('getObject', params);
                return res.json({ file_url: signedUrl, file_name: material.file_name, file_type: material.file_type });
            } catch (signErr) {
                return res.status(500).json({ error: 'Failed to generate S3 download link', message: signErr.message });
            }
        } else if (material.provider === 'supabase' || !material.provider) {
            // Return the public URL for Supabase
            if (material.file_url) {
                return res.json({ file_url: material.file_url, file_name: material.file_name, file_type: material.file_type });
            } else {
                return res.status(404).json({ error: 'File URL missing', message: 'No file URL found for material' });
            }
        } else {
            return res.status(400).json({ error: 'Unknown file provider', message: 'Cannot handle this file provider' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', message: err.message });
    }
});

// Materials Routes
const multer = require('multer');
const { supabaseAdmin } = require('../config/supabase');
require('dotenv').config();

// =============================================
// GET /api/materials/tutor/:tutorId - Get all materials for a tutor
// =============================================
router.get('/tutor/:tutorId', async (req, res) => {
    const { tutorId } = req.params;
    try {
        const { data: materials, error } = await supabaseAdmin
            .from('materials')
            .select('*')
            .eq('tutor_id', tutorId);

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch materials', message: error.message });
        }

        res.json({ materials });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', message: err.message });
    }
});

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024 * 1024; // 5GB per file for S3
const ALLOWED_UPLOAD_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'video/mp4',
    'video/quicktime', // .mov (common iPhone export)
    'video/webm',
    'video/x-m4v'
];

// Configure multer for file uploads (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_UPLOAD_SIZE_BYTES
    },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_UPLOAD_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});

const { getUserIdFromToken } = require('../utils/authHelpers');

// Helper function to get user profile
async function getUserProfile(userId) {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email, role, tutor_status, tutorial_group')
        .eq('id', userId)
        .single();
    
    return { data, error };
}

        // Import isTutor middleware
        const isTutor = require('../middleware/isTutor');
function normalizeRoles(user = {}) {
  const arr = Array.isArray(user.roles) ? user.roles : [];
  return [...new Set([...arr, user.role].filter(Boolean))];
}
function canUploadMaterials(user = {}) {
  const roles = normalizeRoles(user);
  return roles.includes('tutor') || roles.includes('admin');
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
            // You may want to check if access has expired here, e.g.:
            if (expiresAt < new Date()) {
                return res.status(403).json({
                    error: 'Access expired',
                    message: 'Your approval access has expired.'
                });
            }
        }
        // End of student approval check
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

    const authUser = {
      role: profile?.role || req.user?.role,
      roles: profile?.roles || req.user?.roles || []
    };

    if (!canUploadMaterials(authUser)) {
      return res.status(403).json({ error: 'Only tutors or admins can upload materials' });
    }

    // Optional: enforce tutor_status only for pure tutor users, not admins
    const roles = normalizeRoles(authUser);
    if (roles.includes('tutor') && !roles.includes('admin')) {
      if (profile?.tutor_status && profile.tutor_status !== 'approved') {
        return res.status(403).json({ error: 'Tutor account is not approved yet' });
      }
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

    let file_url = '';
    let provider = '';

    try {
        let s3Key = null;
        if (file.size <= 50 * 1024 * 1024) {
            // Supabase Storage upload
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
            file_url = publicUrl;
            provider = 'supabase';
            s3Key = null;
            s3Key = null; // <-- Ensure this is set for Supabase uploads
        } else {
            // AWS S3 upload
            s3Key = fileName;
            const AWS = require('aws-sdk');
            const s3 = new AWS.S3({
                region: process.env.AWS_REGION,
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            });
            try {
                const s3Result = await s3.upload({
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: s3Key, // <-- This is the S3 key
                    Body: file.buffer,
                    ContentType: file.mimetype,
                    ACL: 'private',
                }).promise();
                file_url = s3Result.Location;
                provider = 's3';
            } catch (s3err) {
                return res.status(500).json({ error: 'Failed to upload to S3', message: s3err.message });
            }
        }

        // Save material record to database
        const { data: material, error: dbError } = await supabaseAdmin
            .from('materials')
            .insert({
                tutor_id: userId,
                course: course,
                title: title,
                description: description || null,
                file_name: file.originalname,
                file_url: file_url,
                file_size: file.size,
                file_type: file.mimetype,
                tutorial_group: profile.tutorial_group,
                downloads_count: 0,
                provider: provider,
                s3_key: s3Key // <-- Save the same key in your DB
            })
            .select()
            .single();

        if (dbError) {
            // If database insert fails, try to delete uploaded file
            if (provider === 'supabase') {
                await supabaseAdmin.storage.from('materials').remove([filePath]);
            }
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
// DELETE /api/materials/:id - Delete material (tutor only)
// =============================================
router.delete('/:id', isTutor, async (req, res) => {

    try {
        const userId = req.user.id; // Set by isTutor middleware
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

        // Debug log for troubleshooting 403 errors
        console.log('[DELETE /api/materials/:id] Authenticated tutor:', userId, 'Material tutor:', material.tutor_id);

        // Verify the material belongs to the authenticated tutor
        if (material.tutor_id !== userId) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You can only delete your own materials'
            });
        }

        // Extract file path from file_url
        let filePath = null;
        try {
            const url = new URL(material.file_url);
            const pathMatch = url.pathname.match(/\/materials\/(.+)$/);
            if (pathMatch) {
                filePath = `materials/${pathMatch[1]}`;
            } else {
                filePath = `materials/${userId}/${material.file_name}`;
            }
        } catch (urlError) {
            filePath = `materials/${userId}/${material.file_name}`;
        }

        // Delete file from storage (if path is available)
        if (filePath) {
            const { error: storageError } = await supabaseAdmin
                .storage
                .from('materials')
                .remove([filePath]);
            if (storageError) {
                console.warn('Storage deletion warning:', storageError.message);
            }
        }

        // Delete material record from database
        const { error: deleteError } = await supabaseAdmin
            .from('materials')
            .delete()
            .eq('id', id)
            .eq('tutor_id', userId);

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

