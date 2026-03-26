import formidable from 'formidable';
import { supabaseAdmin } from '../../backend/config/supabase.js';
import emailService from '../../backend/services/email.js';

function normalizeRoles(profile) {
    const rolesFromArray = Array.isArray(profile?.roles) ? profile.roles : [];
    const legacyRole = profile?.role ? [profile.role] : [];
    return [...new Set([...rolesFromArray, ...legacyRole])].filter(Boolean);
}

function primaryRoleFromRoles(roles = []) {
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('tutor')) return 'tutor';
    if (roles.includes('student')) return 'student';
    return null;
}

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
        return res.status(200).end();
    }
    // Set CORS headers for all other requests
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(400).json({ error: 'Form parse error', message: err.message });
        }
        const { email, password, role, name, tutorialGroup } = fields;
        const paymentScreenshot = files.paymentScreenshot;

        // Validate input
        if (!email || !password || !role || !name) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Email, password, role, and name are required'
            });
        }
        if (role === 'student' && !paymentScreenshot) {
            return res.status(400).json({
                error: 'Missing payment proof',
                message: 'Students must provide a payment screenshot'
            });
        }
        if (role === 'student' && !tutorialGroup) {
            return res.status(400).json({
                error: 'Missing tutorial group',
                message: 'Students must specify which tutorial group they are joining'
            });
        }
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
            email_confirm: true
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
                const fileName = `${userId}-${Date.now()}-${paymentScreenshot.originalFilename}`;
                const { data: storageData, error: storageError } = await supabaseAdmin.storage
                    .from('payment-proofs')
                    .upload(fileName, paymentScreenshot.filepath, {
                        contentType: paymentScreenshot.mimetype,
                        upsert: false
                    });
                if (storageError) {
                    throw storageError;
                }
                const { data: { publicUrl } } = supabaseAdmin.storage
                    .from('payment-proofs')
                    .getPublicUrl(fileName);
                paymentScreenshotUrl = publicUrl;
            } catch (storageErr) {
                await supabaseAdmin.auth.admin.deleteUser(userId);
                return res.status(500).json({
                    error: 'File upload failed',
                    message: storageErr.message
                });
            }
        }
        const resolvedTutorialGroup = tutorialGroup || null;
        const profileData = {
            id: userId,
            email: email,
            name: name,
            role: role,
            payment_screenshot_url: paymentScreenshotUrl,
            tutorial_group: resolvedTutorialGroup
        };
        if (role === 'tutor') {
            profileData.tutor_status = 'pending';
        }
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert(profileData);
        if (profileError) {
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
            // Non-critical: don't rollback
        }
        if (role === 'tutor') {
            await emailService.sendTutorWelcome(email, name);
        }
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                id: userId,
                email: email,
                name: name,
                role: role,
                roles: [role],
                tutorialGroup: resolvedTutorialGroup
            }
        });
    });
}
