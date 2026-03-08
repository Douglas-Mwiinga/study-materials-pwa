// Materials API Utility
// Use shared API_URL to avoid redeclaration errors
if (typeof window.API_URL === 'undefined') {
    window.API_URL = 'http://localhost:3001';
}


/**
 * Get authentication token from localStorage
 */
function getAuthToken() {
    return localStorage.getItem('authToken');
}

/**
 * List all materials
 * @param {string} course - Optional course filter
 * @param {string} search - Optional search term
 * @returns {Promise<Object>} Materials list
 */
async function getMaterials(course = null, search = null) {
    try {
        let url = `${window.API_URL}/api/materials`;
        const params = new URLSearchParams();
        
        if (course) params.append('course', course);
        if (search) params.append('search', search);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || 'Failed to fetch materials');
        }

        return data;
    } catch (error) {
        console.error('Get materials error:', error);
        throw error;
    }
}

/**
 * Upload a new material (tutor only)
 * @param {FormData} formData - Form data with file, course, title, description
 * @returns {Promise<Object>} Uploaded material
 */
async function uploadMaterial(formData) {
    try {
        const token = getAuthToken();
        if (!token) {
            console.error('❌ Upload failed: No authentication token found in localStorage');
            console.log('Debug info:', {
                authToken: localStorage.getItem('authToken'),
                user: localStorage.getItem('user'),
                role: (typeof getUserRole === 'function' && getUserRole()) || localStorage.getItem('role')
            });
            throw new Error('Authentication required — please sign in first');
        }

        console.log('✓ Auth token found, uploading material...');
        const response = await fetch(`${window.API_URL}/api/materials`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Don't set Content-Type - browser will set it with boundary for FormData
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || 'Failed to upload material');
        }

        return data;
    } catch (error) {
        console.error('Upload material error:', error);
        throw error;
    }
}

/**
 * Get single material by ID
 * @param {string} materialId - Material ID
 * @returns {Promise<Object>} Material data
 */
async function getMaterial(materialId) {
    try {
        const response = await fetch(`${window.API_URL}/api/materials/${materialId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || 'Failed to fetch material');
        }

        return data;
    } catch (error) {
        console.error('Get material error:', error);
        throw error;
    }
}

/**
 * Increment download count and get download URL
 * @param {string} materialId - Material ID
 * @returns {Promise<Object>} Material with download URL
 */
async function downloadMaterial(materialId) {
    try {
        const token = getAuthToken();
        
        // Increment download count
        const response = await fetch(`${window.API_URL}/api/materials/${materialId}/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || 'Failed to download material');
        }

        return data;
    } catch (error) {
        console.error('Download material error:', error);
        throw error;
    }
}

/**
 * Check if student has approved access
 * @returns {Promise<Object>} Access status
 */
async function checkStudentAccess() {
    try {
        const token = getAuthToken();
        if (!token) {
            return { hasAccess: false, message: 'Not authenticated' };
        }

        const response = await fetch(`${window.API_URL}/api/student-access/check-access`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return { hasAccess: false, message: data.message || 'Access check failed' };
        }

        return data;
    } catch (error) {
        console.error('Check access error:', error);
        return { hasAccess: false, message: error.message };
    }
}

// Make functions available globally for browser scripts
if (typeof window !== 'undefined') {
    window.getMaterials = getMaterials;
    window.uploadMaterial = uploadMaterial;
    window.getMaterial = getMaterial;
    window.downloadMaterial = downloadMaterial;
    window.checkStudentAccess = checkStudentAccess;
    
    // Debug: Log that functions are loaded (can be removed in production)
    if (typeof console !== 'undefined' && console.debug) {
        console.debug('Materials API functions loaded:', {
            getMaterials: typeof getMaterials === 'function',
            uploadMaterial: typeof uploadMaterial === 'function',
            getMaterial: typeof getMaterial === 'function',
            downloadMaterial: typeof downloadMaterial === 'function'
        });
    }
}

// Export for use in other scripts (Node.js)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getMaterials,
        uploadMaterial,
        getMaterial,
        downloadMaterial,
        checkStudentAccess
    };
}


