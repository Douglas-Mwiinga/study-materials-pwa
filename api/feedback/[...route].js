import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const express = require('express');
const cors = require('cors');
const feedbackRoutes = require('../../backend/routes/feedback');

let app;

function getApp() {
  if (app) return app;

  app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req, _res, next) => {
    const url = req.url || '/';
    req.url = url
      .replace(/^\/api\/feedback(?=\/|$)/, '')
      .replace(/^\/feedback(?=\/|$)/, '') || '/';
    next();
  });

  app.use('/', feedbackRoutes);
  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

  return app;
}

export default async function handler(req, res) {
  return getApp()(req, res);
}
