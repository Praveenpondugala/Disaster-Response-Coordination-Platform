import express from 'express';
import { OfficialUpdatesService } from '../services/officialUpdates.js';
import { logger } from '../utils/logger.js';

export const updatesRouter = express.Router();

// GET /updates/:disaster_id - Get official updates for a disaster
updatesRouter.get('/:disaster_id', async (req, res) => {
  try {
    const { disaster_id } = req.params;
    const { type } = req.query;
    
    const updates = await OfficialUpdatesService.getUpdates(type || 'general');
    
    res.json({
      disaster_id,
      updates,
      total: updates.length,
      last_updated: new Date().toISOString(),
      source: 'official_agencies'
    });

  } catch (error) {
    logger.error('Official updates error:', error);
    res.status(500).json({ error: 'Failed to fetch official updates' });
  }
});

// GET /updates/agency/:agency_name - Get updates from specific agency
updatesRouter.get('/agency/:agency_name', async (req, res) => {
  try {
    const { agency_name } = req.params;
    const { type } = req.query;
    
    const allUpdates = await OfficialUpdatesService.getUpdates(type || 'general');
    const agencyUpdates = allUpdates.filter(update => 
      update.agency.toLowerCase().includes(agency_name.toLowerCase())
    );
    
    res.json({
      agency: agency_name,
      updates: agencyUpdates,
      total: agencyUpdates.length,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Agency updates error:', error);
    res.status(500).json({ error: 'Failed to fetch agency updates' });
  }
});

// GET /updates/priority/:priority - Get updates by priority level
updatesRouter.get('/priority/:priority', async (req, res) => {
  try {
    const { priority } = req.params;
    const { type } = req.query;
    
    if (!['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority level' });
    }
    
    const allUpdates = await OfficialUpdatesService.getUpdates(type || 'general');
    const priorityUpdates = allUpdates.filter(update => update.priority === priority);
    
    res.json({
      priority,
      updates: priorityUpdates,
      total: priorityUpdates.length,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Priority updates error:', error);
    res.status(500).json({ error: 'Failed to fetch priority updates' });
  }
});