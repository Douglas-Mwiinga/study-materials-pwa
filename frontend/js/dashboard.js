// Dashboard API Utility
// Robust API_URL resolver for all environments
let API_URL = '';
if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    API_URL = import.meta.env.VITE_API_URL;
} else if (typeof window !== 'undefined' && window.API_URL) {
    API_URL = window.API_URL;
}
if (!API_URL) {
    console.warn('API_URL is not set! Please configure VITE_API_URL in your environment variables.');
}

/**
 * Get authentication token from localStorage
 */
function getAuthToken() {
    return localStorage.getItem('authToken');
}

/**
 * Get current user info
 */
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

/**
 * Get tutor's materials
 * @param {string} tutorId - Tutor ID
 * @returns {Promise<Object>} Materials list
 */
async function getTutorMaterials(tutorId) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_URL}/api/materials/tutor/${tutorId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || 'Failed to fetch materials');
        }

        return data;
    } catch (error) {
        console.error('Get tutor materials error:', error);
        throw error;
    }
}

/**
 * Get tutor's feedback
 * @param {string} tutorId - Tutor ID
 * @returns {Promise<Object>} Feedback list
 */
async function getTutorFeedback(tutorId) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_URL}/api/feedback/tutor/${tutorId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || 'Failed to fetch feedback');
        }

        return data;
    } catch (error) {
        console.error('Get tutor feedback error:', error);
        throw error;
    }
}

/**
 * Get approved students count for tutor
 * @returns {Promise<number>} Count of approved students
 */
async function getApprovedStudentsCount() {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${API_URL}/api/student-access/approved`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || result.error || 'Failed to fetch approved students');
        }

        return result.data ? result.data.length : 0;
    } catch (error) {
        console.error('Get approved students count error:', error);
        return 0;
    }
}

/**
 * Calculate dashboard statistics
 * @param {Array} materials - Materials array
 * @param {Array} feedback - Feedback array
 * @returns {Object} Dashboard stats
 */
function calculateDashboardStats(materials, feedback) {
    const totalDownloads = materials.reduce((sum, m) => sum + (m.downloads_count || 0), 0);
    
    // Find top material by downloads
    const topMaterial = materials.length > 0 
        ? materials.reduce((top, m) => 
            (m.downloads_count || 0) > (top.downloads_count || 0) ? m : top, materials[0])
        : null;
    
    // Get recent feedback (last 5)
    const recentFeedback = feedback.slice(0, 5);
    
    return {
        totalDownloads,
        topMaterial: topMaterial?.course || 'N/A',
        recentFeedback
    };
}

// Make functions available globally for browser scripts
if (typeof window !== 'undefined') {
    window.getTutorMaterials = getTutorMaterials;
    window.getTutorFeedback = getTutorFeedback;
    window.calculateDashboardStats = calculateDashboardStats;
    window.getApprovedStudentsCount = getApprovedStudentsCount;
    // Note: getCurrentUser in dashboard.js is synchronous (reads from localStorage)
    // This is different from auth.js getCurrentUser which is async (API call)
    window.getCurrentUserFromStorage = getCurrentUser;
}

// Export for use in other scripts (Node.js)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getTutorMaterials,
        getTutorFeedback,
        calculateDashboardStats,
        getApprovedStudentsCount,
        getCurrentUser
    };
}


