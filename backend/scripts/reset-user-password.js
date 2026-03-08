require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function run() {
    const userId = process.argv[2];
    const newPassword = process.argv[3];

    if (!userId || !newPassword) {
        console.error('Usage: node .\\scripts\\reset-user-password.js <userId> <newPassword>');
        process.exit(1);
    }

    const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
    const serviceRoleKey = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY/SUPABASE_SERVICE_ROLE_KEY in backend/.env');
        process.exit(1);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false }
    });

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword
    });

    if (error) {
        console.error('Password reset failed:', error.message);
        process.exit(1);
    }

    console.log('Password updated for user:', data?.user?.id || userId);
}

run().catch((error) => {
    console.error('Unhandled error:', error.message);
    process.exit(1);
});