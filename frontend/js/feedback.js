// Feedback API Utility
// Use shared API_URL from auth.js or materials.js (already initialized)
if (typeof window.API_URL === "undefined") { window.API_URL = "http://localhost:3001"; }

/**
 * Get authentication token from localStorage
 */
function getAuthToken() {
    return localStorage.getItem('authToken');
}

/**
 * Submit feedback for a material
 * @param {string} materialId - Material ID
 * @param {number} rating - Rating (1-5)
 * @param {string} comment - Optional comment
 * @returns {Promise<Object>} Feedback data
 */
async function submitFeedback(materialId, rating, comment = null) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${window.API_URL}/api/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                material_id: materialId,
                rating: parseInt(rating),
                comment: comment || null
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || 'Failed to submit feedback');
        }

        return data;
    } catch (error) {
        console.error('Submit feedback error:', error);
        throw error;
    }
}

/**
 * Get feedback for a specific material
 * @param {string} materialId - Material ID
 * @returns {Promise<Object>} Feedback list with stats
 */
async function getMaterialFeedback(materialId) {
    try {
        const response = await fetch(`${window.API_URL}/api/feedback/material/${materialId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || 'Failed to fetch feedback');
        }

        return data;
    } catch (error) {
        console.error('Get feedback error:', error);
        throw error;
    }
}

/**
 * Get feedback statistics for a material
 * @param {string} materialId - Material ID
 * @returns {Promise<Object>} Feedback statistics
 */
async function getFeedbackStats(materialId) {
    try {
        const response = await fetch(`${window.API_URL}/api/feedback/stats/${materialId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || 'Failed to fetch feedback stats');
        }

        return data;
    } catch (error) {
        console.error('Get feedback stats error:', error);
        throw error;
    }
}

/**
 * Get all feedback for a tutor's materials
 * @param {string} tutorId - Tutor ID
 * @returns {Promise<Object>} Feedback list
 */
async function getTutorFeedback(tutorId) {
    try {
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

        const response = await fetch(`${window.API_URL}/api/feedback/tutor/${tutorId}`, {
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

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        submitFeedback,
        getMaterialFeedback,
        getFeedbackStats,
        getTutorFeedback
    };
}


