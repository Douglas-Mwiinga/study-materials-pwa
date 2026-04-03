import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const express = require('express');
const cors = require('cors');
const authRoutes = require('../../../../backend/routes/auth');

let app;

function getApp() {
  if (app) return app;

  app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Force this function to execute auth router's /login handler
  app.use((req, _res, next) => {
    req.url = '/login';
    next();
  });

  app.use('/', authRoutes);

  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
  return app;
}

export default async function handler(req, res) {
  return getApp()(req, res);
}
