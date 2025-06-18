import express from 'express';
import { disastersRouter } from './disasters.js';
import { reportsRouter } from './reports.js';
import { resourcesRouter } from './resources.js';
import { geocodingRouter } from './geocoding.js';
import { socialMediaRouter } from './socialMedia.js';
import { updatesRouter } from './updates.js';
import { authMiddleware } from '../middleware/auth.js';
import { testConnection } from '../database/supabase.js';

export function setupRoutes(app) {
  // Health check
  app.get('/health', async (req, res) => {
    const dbStatus = await testConnection();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'connected' : 'disconnected',
      version: '1.0.0'
    });
  });

  // API routes with authentication
  app.use('/api', authMiddleware);
  app.use('/api/disasters', disastersRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/resources', resourcesRouter);
  app.use('/api/geocoding', geocodingRouter);
  app.use('/api/social-media', socialMediaRouter);
  app.use('/api/updates', updatesRouter);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}