import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const tutorApprovalsRoutes = require('../../backend/routes/tutor-approvals');

let app;

function createApp() {
    const server = express();

    server.use(cors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    server.use(express.json());
    server.use(express.urlencoded({ extended: true }));

    server.use((req, res, next) => {
        if (req.url.startsWith('/api/tutor-approvals/')) {
            req.url = req.url.slice('/api/tutor-approvals'.length) || '/';
        } else if (req.url === '/api/tutor-approvals') {
            req.url = '/';
        }

        res.setHeader('x-gateway-scope', 'tutor-approvals');
        next();
    });

    server.use('/', tutorApprovalsRoutes);

    server.use((_req, res) => {
        res.status(404).json({ error: 'Not found', message: 'Tutor approvals endpoint not found' });
    });

    server.use((err, _req, res, _next) => {
        console.error('Tutor approvals gateway error:', err);
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
