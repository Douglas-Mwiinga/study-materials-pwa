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

const MAX_UPLOAD_SIZE_BYTES = 500 * 1024 * 1024; // 500MB per file
const ALLOWED_UPLOAD_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-m4v'
];


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
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

            let url = `${API_BASE}/materials`;
        const params = new URLSearchParams();
        
        if (course) params.append('course', course);
        if (search) params.append('search', search);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
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
            throw new Error('Authentication required — please sign in first');
        }

        const file = formData?.get('file');
        if (!file) throw new Error('Please select a file to upload');

        if (!ALLOWED_UPLOAD_MIME_TYPES.includes(file.type)) {
            throw new Error('File type not allowed. Allowed types: PDF, DOC, DOCX, XLS, XLSX, TXT, PNG, JPG, MP4, MOV, WEBM, M4V');
        }

        if (file.size > MAX_UPLOAD_SIZE_BYTES) {
            throw new Error('File is too large. Maximum allowed size is 500MB per file.');
        }

        console.log('✓ Auth token found, uploading material...');

        // Step 1: Get a presigned upload URL from the backend (small JSON request — no Vercel size limit hit)
        const urlRes = await fetch(`${API_BASE}/materials/upload-url`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fileName: file.name, fileType: file.type })
        });

        const urlData = await urlRes.json();
        if (!urlRes.ok) throw new Error(urlData.message || urlData.error || 'Failed to get upload URL');

        // Step 2: Upload file directly to Supabase Storage (bypasses Vercel entirely)
        const uploadRes = await fetch(urlData.signedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file
        });

        if (!uploadRes.ok) {
            throw new Error(`Storage upload failed: ${uploadRes.status} ${uploadRes.statusText}`);
        }

        // Step 3: Save the DB record (small JSON request)
        const course = formData.get('course');
        const title = formData.get('title');
        const description = formData.get('description');

        const completeRes = await fetch(`${API_BASE}/materials/complete`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                course,
                title,
                description,
                storagePath: urlData.storagePath,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type
            })
        });

        const data = await completeRes.json();
        if (!completeRes.ok) throw new Error(data.message || data.error || 'Failed to save material');

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
        const token = getAuthToken();
        if (!token) {
            throw new Error('Authentication required');
        }

            const response = await fetch(`${API_BASE}/materials/${materialId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
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
            const response = await fetch(`${API_BASE}/materials/${materialId}/download`, {
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

            const response = await fetch(`${API_BASE}/student-access/check-access`, {
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


