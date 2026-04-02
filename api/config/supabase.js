// Supabase Client Configuration (ESM version for Vercel API functions)
import { createClient } from '@supabase/supabase-js';

// Validate environment variables (trim whitespace and remove quotes)
const supabaseUrl = (process.env.SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '');
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_KEY || '').trim().replace(/^["']|["']$/g, '');

// Detailed validation with helpful error messages
if (!supabaseUrl) {
    console.error('SUPABASE_URL is missing or empty');
    throw new Error('Missing SUPABASE_URL. Check your Vercel environment variables.');
}
if (!supabaseAnonKey) {
    console.error('SUPABASE_ANON_KEY is missing or empty');
    throw new Error('Missing SUPABASE_ANON_KEY. Check your Vercel environment variables.');
}
if (!supabaseServiceKey) {
    console.error('SUPABASE_SERVICE_KEY is missing or empty');
    throw new Error('Missing SUPABASE_SERVICE_KEY. Check your Vercel environment variables.');
}

// Validate URL format
if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    console.error('SUPABASE_URL must start with http:// or https://');
    throw new Error('Invalid SUPABASE_URL format. Must be a valid URL.');
}

let supabase;
let supabaseAdmin;

try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false }
    });
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false }
    });

    console.log('Supabase clients initialized successfully');
} catch (error) {
    console.error('Failed to create Supabase clients:', error.message);
    console.error('URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'undefined or empty');
    console.error('Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined or empty');
    console.error('Service Key:', supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'undefined or empty');
    throw error;
}

export { supabase, supabaseAdmin };
