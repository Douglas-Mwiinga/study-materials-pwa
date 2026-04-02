import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const express = require('express');
const cors = require('cors');

const authRoutes = require('../../backend/routes/auth');
const materialsRoutes = require('../../backend/routes/materials');
const feedbackRoutes = require('../../backend/routes/feedback');
const studentAccessRoutes = require('../../backend/routes/student-access');
const tutorApprovalsRoutes = require('../../backend/routes/tutor-approvals');
const adminRoutes = require('../../backend/routes/admin');

let app;

function createApp() {
  const server = express();

  server.use(cors({ origin: true, credentials: true }));
  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));

  // Normalize /api prefix
  server.use((req, _res, next) => {
    if (req.url.startsWith('/api/')) req.url = req.url.slice(4) || '/';
    next();
  });

  server.get('/health', (_req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  server.use('/auth', authRoutes);
  server.use('/materials', materialsRoutes);
  server.use('/feedback', feedbackRoutes);
  server.use('/student-access', studentAccessRoutes);
  server.use('/tutor-approvals', tutorApprovalsRoutes);
  server.use('/admin', adminRoutes);

  server.use((_req, res) => {
    res.status(404).json({ error: 'Not found', message: 'API endpoint not found' });
  });

  return server;
}

export default async function handler(req, res) {
  if (!app) app = createApp();
  return app(req, res);
}
