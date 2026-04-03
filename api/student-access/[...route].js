import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const express = require('express');
const cors = require('cors');
const studentAccessRoutes = require('../../backend/routes/student-access');

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
      .replace(/^\/api\/student-access(?=\/|$)/, '')
      .replace(/^\/student-access(?=\/|$)/, '') || '/';
    next();
  });

  app.use('/', studentAccessRoutes);
  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

  return app;
}

export default async function handler(req, res) {
  return getApp()(req, res);
}
