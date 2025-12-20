import express from 'express';
import type { Express } from 'express';
import dotenv from 'dotenv';
import { manifest } from './manifest.js';
import { lookupIp } from './transforms/lookup-ip.js';
import { scanIp, getJobStatus } from './transforms/scan-ip.js';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: manifest.plugin.version,
  });
});

// Manifest endpoint
app.get('/manifest.json', (req, res) => {
  res.json(manifest);
});

// Transform endpoints
app.post('/transform/lookup-ip', lookupIp);
app.post('/transform/scan-ip', scanIp);

// Job status endpoint
app.get('/jobs/:jobId', getJobStatus);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Endpoint ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Relazio Plugin Example Server`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Base URL: ${process.env.PLUGIN_BASE_URL || `http://localhost:${PORT}`}`);
  console.log(`📄 Manifest: http://localhost:${PORT}/manifest.json`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log(`\n✅ Server running!\n`);

  // Warn if webhook secret is not set
  if (!process.env.WEBHOOK_SECRET) {
    console.warn('⚠️  WARNING: WEBHOOK_SECRET not set! Webhooks will fail.');
    console.warn('   Set it in .env file after installing the plugin in Relazio.\n');
  }
});

