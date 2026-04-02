import { supabase, supabaseAdmin } from '../config/supabase.js';
import jwt from 'jsonwebtoken';

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
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                error: 'Missing credentials',
                message: 'Email and password are required'
            });
        }
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (authError || !authData.user || !authData.session) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: authError?.message || 'Email or password is incorrect'
            });
        }
        const userId = authData.user.id;
        let profile = null;
        const { data: profileWithRoles, error: profileWithRolesError } = await supabaseAdmin
            .from('profiles_with_roles')
            .select('*')
            .eq('id', userId)
            .single();
        if (!profileWithRolesError && profileWithRoles) {
            profile = profileWithRoles;
        } else {
            const { data: fallbackProfile, error: fallbackProfileError } = await supabaseAdmin
                .from('profiles')
                .select('id, email, name, role, tutorial_group')
                .eq('id', userId)
                .single();
            if (fallbackProfileError || !fallbackProfile) {
                return res.status(500).json({
                    error: 'Profile not found',
                    message: 'User account exists but profile is missing'
                });
            }
            profile = fallbackProfile;
        }
        const roles = normalizeRoles(profile);
        const role = primaryRoleFromRoles(roles) || profile.role || null;
        const jwtToken = jwt.sign(
            { userId: profile.id, role: role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                role: role,
                roles: roles,
                tutorialGroup: profile.tutorial_group
            },
            session: {
                access_token: authData.session.access_token,
                refresh_token: authData.session.refresh_token
            },
            token: jwtToken
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
