// Supabase Client Configuration
const { createClient } = require('@supabase/supabase-js');

// Ensure dotenv is loaded (in case this module is imported before server.js loads it)
if (!process.env.SUPABASE_URL) {
    require('dotenv').config();
}

// Validate environment variables (trim whitespace and remove quotes)
const supabaseUrl = (process.env.SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '');
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_KEY || '').trim().replace(/^["']|["']$/g, '');

// Detailed validation with helpful error messages
if (!supabaseUrl) {
    console.error('❌ SUPABASE_URL is missing or empty in .env file');
    throw new Error('Missing SUPABASE_URL. Check your .env file.');
}
if (!supabaseAnonKey) {
    console.error('❌ SUPABASE_ANON_KEY is missing or empty in .env file');
    throw new Error('Missing SUPABASE_ANON_KEY. Check your .env file.');
}
if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_KEY is missing or empty in .env file');
    throw new Error('Missing SUPABASE_SERVICE_KEY. Check your .env file.');
}

// Validate URL format
if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    console.error('❌ SUPABASE_URL must start with http:// or https://');
    throw new Error('Invalid SUPABASE_URL format. Must be a valid URL.');
}

// Initialize Supabase client with service role key (for admin operations)
let supabaseAdmin;
let supabase;

try {
    // Validate parameters are not empty before creating clients
    if (!supabaseUrl || supabaseUrl.length === 0) {
        throw new Error('SUPABASE_URL is empty or undefined');
    }
    if (!supabaseAnonKey || supabaseAnonKey.length === 0) {
        throw new Error('SUPABASE_ANON_KEY is empty or undefined');
    }
    if (!supabaseServiceKey || supabaseServiceKey.length === 0) {
        throw new Error('SUPABASE_SERVICE_KEY is empty or undefined');
    }
    
    // Create clients with validated parameters
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            persistSession: false
        }
    });
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false
        }
    });
    
    console.log('✅ Supabase clients initialized successfully');
} catch (error) {
    console.error('\n❌ Failed to create Supabase clients:');
    console.error('   Error:', error.message);
    console.error('   URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ undefined or empty');
    console.error('   Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : '❌ undefined or empty');
    console.error('   Service Key:', supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : '❌ undefined or empty');
    console.error('\n💡 Check your .env file in the backend folder.');
    console.error('   Make sure all three Supabase values are set and not wrapped in quotes.\n');
    throw error;
}

module.exports = {
    supabase,      // For client-side operations
    supabaseAdmin  // For admin operations (bypass RLS)
};


