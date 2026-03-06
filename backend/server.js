const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\n💡 Please check your .env file in the backend folder.');
    process.exit(1);
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001; // Backend on 3001, Frontend on 3000

// CORS Configuration - More permissive for development
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, curl, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:5500',
            'http://localhost:5173',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            'http://127.0.0.1:5500',
            'http://127.0.0.1:5173'
        ];
        
        // In development, allow all origins
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        
        // In production, check against allowed list
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
// CORS middleware already handles preflight OPTIONS requests automatically
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic test route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Smart Up API Server',
        status: 'running',
        version: '1.0.0'
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Test Supabase connection on startup
async function testSupabaseConnection() {
    try {
        const { supabaseAdmin } = require('./config/supabase');
        const { data, error } = await supabaseAdmin.from('profiles').select('count').limit(1);
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (expected if no data)
            console.warn('⚠️  Supabase connection warning:', error.message);
            console.warn('   Make sure you\'ve run the database schema.sql in Supabase');
        } else {
            console.log('✅ Supabase connection successful');
        }
    } catch (error) {
        console.error('❌ Supabase connection failed:', error.message);
        console.error('   Check your SUPABASE_URL and keys in .env file');
    }
}

// Import routes
const authRoutes = require('./routes/auth');
const materialsRoutes = require('./routes/materials');
const feedbackRoutes = require('./routes/feedback');
const studentAccessRoutes = require('./routes/student-access');
const tutorApprovalsRoutes = require('./routes/tutor-approvals');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/student-access', studentAccessRoutes);
app.use('/api/tutor-approvals', tutorApprovalsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: err.message 
    });
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 Smart Up Backend API`);
    console.log(`🌐 CORS enabled for development`);
    console.log(`\n📋 Available endpoints:`);
    console.log(`   GET  /health - Health check`);
    console.log(`\n🔐 Authentication:`);
    console.log(`   POST /api/auth/signup - Register user`);
    console.log(`   POST /api/auth/login - Login user`);
    console.log(`   POST /api/auth/logout - Logout user`);
    console.log(`   GET  /api/auth/me - Get current user`);
    console.log(`\n📚 Materials:`);
    console.log(`   GET    /api/materials - List all materials`);
    console.log(`   POST   /api/materials - Upload material (tutor only)`);
    console.log(`   GET    /api/materials/:id - Get single material`);
    console.log(`   DELETE /api/materials/:id - Delete material (tutor only)`);
    console.log(`   POST   /api/materials/:id/download - Increment download count`);
    console.log(`\n💬 Feedback:`);
    console.log(`   POST /api/feedback - Submit feedback (student only)`);
    console.log(`   GET  /api/feedback/material/:id - Get feedback for material`);
    console.log(`   GET  /api/feedback/tutor/:id - Get feedback for tutor's materials`);
    console.log(`\n✅ Student Access Management (Tutor)`);
    console.log(`   GET  /api/student-access/pending - Get pending approvals`);
    console.log(`   GET  /api/student-access/approved - Get approved students`);
    console.log(`   POST /api/student-access/approve/:id - Approve student`);
    console.log(`   POST /api/student-access/reject/:id - Reject student`);
    console.log(`   POST /api/student-access/revoke/:id - Revoke access`);
    console.log(`   GET  /api/student-access/settings - Get default expiry settings`);
    console.log(`   POST /api/student-access/settings - Update expiry settings`);
    console.log(`   GET  /api/student-access/check-access - Check student access\n`);
    
    // Test Supabase connection
    await testSupabaseConnection();
});

