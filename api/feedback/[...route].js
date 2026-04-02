import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const feedbackRoutes = require('../../backend/routes/feedback');

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
        if (req.url.startsWith('/api/feedback/')) {
            req.url = req.url.slice('/api/feedback'.length) || '/';
        } else if (req.url === '/api/feedback') {
            req.url = '/';
        }

        res.setHeader('x-gateway-scope', 'feedback');
        next();
    });

    server.use('/', feedbackRoutes);

    server.use((_req, res) => {
        res.status(404).json({ error: 'Not found', message: 'Feedback endpoint not found' });
    });

    server.use((err, _req, res, _next) => {
        console.error('Feedback gateway error:', err);
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
