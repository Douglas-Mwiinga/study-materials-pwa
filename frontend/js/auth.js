// Authentication API Utility
// Handles all authentication-related API calls

// Robust API base resolver for all environments
const configuredApiUrl =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
        ? import.meta.env.VITE_API_URL
        : (typeof window !== 'undefined' && window.API_URL ? window.API_URL : '');

const API_BASE = (() => {
    const baseUrl = (configuredApiUrl || '').replace(/\/+$/, '');

    if (!baseUrl) {
        return '/api';
    }

    return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
})();

if (!configuredApiUrl) {
    console.info('Using default API base URL:', API_BASE);
}

function normalizeRoles(user) {
    const rolesFromArray = Array.isArray(user?.roles) ? user.roles : [];
    const legacyRole = user?.role ? [user.role] : [];
    return [...new Set([...rolesFromArray, ...legacyRole])].filter(Boolean);
}

function getPrimaryRoleFromRoles(roles = []) {
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('tutor')) return 'tutor';
    if (roles.includes('student')) return 'student';
    return null;
}

const ROUTES = {
    login: '/pages/login.html',
    signup: '/pages/signup.html',
    dashboard: '/pages/dashboard.html',
    materials: '/pages/materials.html'
};

function endsWithAny(path, suffixes) {
    return suffixes.some((suffix) => path.endsWith(suffix));
}

/**
 * Sign up a new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} role - User role ('student' or 'tutor')
 * @param {string} name - User full name (username)
 * @param {File} paymentScreenshot - Payment proof file (students only)
 * @param {string} tutorialGroup - Tutorial group name (students only)
 * @returns {Promise<Object>} Response data
 */
async function signup(email, password, role, name, paymentScreenshot, tutorialGroup) {
    try {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        formData.append('role', role);
        formData.append('name', name);
        if (paymentScreenshot) {
            formData.append('paymentScreenshot', paymentScreenshot);
        }
        if (tutorialGroup) {
            formData.append('tutorialGroup', tutorialGroup);
        }

        const response = await fetch(`${API_BASE}/auth/signup`, {
            method: 'POST',
            // Don't set Content-Type - browser will set it with boundary for FormData
            body: formData
        });

        let data = null;
        try {
            data = await response.json();
        } catch {
            // If response is empty or not JSON, set data to empty object
            data = {};
        }

        if (!response.ok) {
            throw new Error(data.message || data.error || `Signup failed (HTTP ${response.status})`);
        }

        return data;
    } catch (error) {
        console.error('Signup error:', error);
        throw error;
    }
}

/**
 * Log in a user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Response data with user info and tokens
 */
async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        let data = null;
        try {
            data = await response.json();
        } catch {
            // If response is empty or not JSON, set data to empty object
            data = {};
        }

        if (!response.ok) {
            throw new Error(data.message || data.error || `Login failed (HTTP ${response.status})`);
        }

        // Store authentication data
        if (data.token) {
            // Store JWT token for API authentication
            localStorage.setItem('authToken', data.token);
            console.log('✓ JWT token stored successfully', {
                hasAuthToken: !!localStorage.getItem('authToken')
            });
        } else if (data.session?.access_token) {
            // Fallback: store Supabase session token if present
            localStorage.setItem('authToken', data.session.access_token);
            localStorage.setItem('refreshToken', data.session.refresh_token);
            console.log('✓ Tokens stored successfully', {
                hasAuthToken: !!localStorage.getItem('authToken'),
                hasRefreshToken: !!localStorage.getItem('refreshToken')
            });
        } else {
            console.warn('⚠ Server did not return authentication tokens', data);
        }
        if (data.user) {
            const roles = normalizeRoles(data.user);
            const role = getPrimaryRoleFromRoles(roles) || data.user.role || null;
            const authUser = {
                ...data.user,
                role,
                roles
            };

            localStorage.setItem('user', JSON.stringify(authUser));
            localStorage.setItem('role', role || '');
            localStorage.setItem('username', authUser.name || authUser.email);
            console.log('✓ User data stored', { role, roles, username: authUser.name || authUser.email });
        } else {
            console.warn('⚠ Server did not return user data', data);
        }

        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

/**
 * Log out the current user
 * @returns {Promise<Object>} Response data
 */
async function logout() {
    try {
        const token = localStorage.getItem('authToken');
        
        if (token) {
            const response = await fetch(`${API_BASE}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // Clear local storage regardless of API response
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            localStorage.removeItem('role');
            
            return await response.json();
        } else {
            // Clear local storage even if no token
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            localStorage.removeItem('role');
            return { success: true, message: 'Logged out' };
        }
    } catch (error) {
        console.error('Logout error:', error);
        // Clear local storage even on error
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        throw error;
    }
}

/**
 * Get current user information
 * @returns {Promise<Object>} User data
 */
async function getCurrentUser() {
    try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            return null;
        }

        const response = await fetch(`${API_BASE}/auth/me`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        let data = {};
        try {
            data = await response.json();
        } catch {
            data = {};
        }

        if (response.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            localStorage.removeItem('role');
            return null;
        }

        if (!response.ok) {
            throw new Error(data.message || data.error || `Failed to get user (HTTP ${response.status})`);
        }

        return data;
    } catch (error) {
        console.error('Get user error:', error);
        throw error;
    }
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has valid token
 */
function isAuthenticated() {
    return !!localStorage.getItem('authToken');
}

/**
 * Get stored user role
 * @returns {string|null} User role or null
 */
function getUserRole() {
    const user = getUser();
    if (!user) {
        return localStorage.getItem('role');
    }

    const roles = normalizeRoles(user);
    const derivedRole = getPrimaryRoleFromRoles(roles) || user.role || null;
    return derivedRole || localStorage.getItem('role');
}

/**
 * Get stored user data
 * @returns {Object|null} User object or null
 */
function getUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        return null;
    }

    try {
        return JSON.parse(userStr);
    } catch {
        localStorage.removeItem('user');
        return null;
    }
}

/**
 * Get stored user's tutorial group
 * @returns {string|null} Tutorial group name or null
 */
function getTutorialGroup() {
    const user = getUser();
    return user?.tutorialGroup || null;
}

/**
 * Redirect user based on their role
 */
function redirectByRole() {
    const role = getUserRole();
    const path = window.location.pathname;

    const onLogin = endsWithAny(path, ['/login.html', '/pages/login.html']);
    const onSignup = endsWithAny(path, ['/signup.html', '/pages/signup.html']);
    const onDashboard = endsWithAny(path, ['/dashboard.html', '/pages/dashboard.html']);
    const onMaterials = endsWithAny(path, ['/materials.html', '/pages/materials.html']);

    // Allow admin/tutor on both dashboard and materials
    if (role === 'admin' || role === 'tutor') {
        if (!(onDashboard || onMaterials)) {
            window.location.href = ROUTES.dashboard;
        }
        return;
    }

    // Students stay on materials
    if (role === 'student') {
        if (!onMaterials) window.location.href = ROUTES.materials;
        return;
    }

    // Unauthenticated users: only block protected pages
    if (!onLogin && !onSignup && (onDashboard || onMaterials)) {
        window.location.href = ROUTES.login;
    }
}

// Make functions available globally for browser scripts
if (typeof window !== 'undefined') {
    window.signup = signup;
    window.login = login;
    window.logout = logout;
    window.getCurrentUser = getCurrentUser;
    window.isAuthenticated = isAuthenticated;
    window.getUserRole = getUserRole;
    window.getUser = getUser;
    window.getTutorialGroup = getTutorialGroup;
    window.redirectByRole = redirectByRole;
}

// Export for use in other scripts (Node.js)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        signup,
        login,
        logout,
        getCurrentUser,
        isAuthenticated,
        getUserRole,
        getUser,
        getTutorialGroup,
        redirectByRole
    };
}


