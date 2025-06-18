import express from 'express';
import { SocialMediaService } from '../services/socialMedia.js';
import { logger } from '../utils/logger.js';

export const socialMediaRouter = express.Router();

// GET /social-media/:disaster_id - Get social media reports for a disaster
socialMediaRouter.get('/:disaster_id', async (req, res) => {
  try {
    const { disaster_id } = req.params;
    const { keywords } = req.query;
    
    // Parse keywords from query string
    const keywordArray = keywords ? keywords.split(',').map(k => k.trim()) : [];
    
    const reports = await SocialMediaService.getDisasterReports(disaster_id, keywordArray);
    
    // Flag urgent reports
    const urgentReports = await SocialMediaService.flagUrgentReports(reports);
    
    // Emit WebSocket update
    req.io.emit('social_media_updated', {
      disaster_id,
      reports: reports.slice(0, 5), // Send only latest 5 for real-time updates
      urgent_count: urgentReports.length
    });

    res.json({
      disaster_id,
      reports,
      urgent_reports: urgentReports,
      total: reports.length,
      urgent_count: urgentReports.length,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Social media reports error:', error);
    res.status(500).json({ error: 'Failed to fetch social media reports' });
  }
});

// GET /social-media/urgent/:disaster_id - Get only urgent social media reports
socialMediaRouter.get('/urgent/:disaster_id', async (req, res) => {
  try {
    const { disaster_id } = req.params;
    const { keywords } = req.query;
    
    const keywordArray = keywords ? keywords.split(',').map(k => k.trim()) : [];
    const allReports = await SocialMediaService.getDisasterReports(disaster_id, keywordArray);
    const urgentReports = await SocialMediaService.flagUrgentReports(allReports);
    
    res.json({
      disaster_id,
      urgent_reports: urgentReports,
      count: urgentReports.length,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Urgent social media reports error:', error);
    res.status(500).json({ error: 'Failed to fetch urgent reports' });
  }
});

// Mock endpoint for demonstration
socialMediaRouter.get('/mock-feed', async (req, res) => {
  try {
    const mockReports = SocialMediaService.generateMockReports(['disaster', 'emergency']);
    
    res.json({
      reports: mockReports,
      total: mockReports.length,
      source: 'mock_api',
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Mock social media feed error:', error);
    res.status(500).json({ error: 'Failed to generate mock reports' });
  }
});