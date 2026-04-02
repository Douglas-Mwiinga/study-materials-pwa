import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const studentAccessRoutes = require('../../backend/routes/student-access');

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
        if (req.url.startsWith('/api/student-access/')) {
            req.url = req.url.slice('/api/student-access'.length) || '/';
        } else if (req.url === '/api/student-access') {
            req.url = '/';
        }

        res.setHeader('x-gateway-scope', 'student-access');
        next();
    });

    server.use('/', studentAccessRoutes);

    server.use((_req, res) => {
        res.status(404).json({ error: 'Not found', message: 'Student access endpoint not found' });
    });

    server.use((err, _req, res, _next) => {
        console.error('Student access gateway error:', err);
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
