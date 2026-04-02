import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const express = require('express');
const cors = require('cors');
require('dotenv').config();

let app;

function createApp() {
    const server = express();

    server.use(cors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    server.use(express.json());
    server.use(express.urlencoded({ extended: true }));

    const authRoutes = require('../backend/routes/auth');
    const materialsRoutes = require('../backend/routes/materials');
    const feedbackRoutes = require('../backend/routes/feedback');
    const studentAccessRoutes = require('../backend/routes/student-access');
    const tutorApprovalsRoutes = require('../backend/routes/tutor-approvals');
    const adminRoutes = require('../backend/routes/admin');

    server.use('/api/auth', authRoutes);
    server.use('/api/materials', materialsRoutes);
    server.use('/api/feedback', feedbackRoutes);
    server.use('/api/student-access', studentAccessRoutes);
    server.use('/api/tutor-approvals', tutorApprovalsRoutes);
    server.use('/api/admin', adminRoutes);

    server.get('/api/health', (_req, res) => {
        res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    server.use('/api', (_req, res) => {
        res.status(404).json({ error: 'Not found', message: 'API endpoint not found' });
    });

    server.use((err, _req, res, _next) => {
        console.error('API error:', err);
        res.status(500).json({ error: 'Internal server error', message: err.message });
    });

    return server;
}

export default async function handler(req, res) {
    if (!app) {
        app = createApp();
    }

    return app(req, res);
}
