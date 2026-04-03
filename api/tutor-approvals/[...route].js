import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const express = require('express');
const cors = require('cors');
const tutorApprovalsRoutes = require('../../backend/routes/tutor-approvals');

let app;

function getApp() {
  if (app) return app;

  app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    res.setHeader('x-route-handler', 'tutor-approvals');
    next();
  });

  app.use('/api/tutor-approvals', tutorApprovalsRoutes);
  app.use('/tutor-approvals', tutorApprovalsRoutes);
  app.use('/', tutorApprovalsRoutes);

  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
  return app;
}

export default async function handler(req, res) {
  return getApp()(req, res);
}