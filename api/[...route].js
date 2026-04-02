import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const express = require('express');
const cors = require('cors');
const authRoutes = require('../../backend/routes/auth');

let app;

function getApp() {
  if (app) return app;

  app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // In this function, /api/auth/* maps to /*
  app.use('/', authRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found', message: 'Auth endpoint not found' });
  });

  return app;
}

export default async function handler(req, res) {
  return getApp()(req, res);
}
