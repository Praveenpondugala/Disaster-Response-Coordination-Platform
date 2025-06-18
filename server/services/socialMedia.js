import { CacheManager } from '../utils/cache.js';
import { logger } from '../utils/logger.js';

export class SocialMediaService {
  static async getDisasterReports(disasterId, keywords = []) {
    const cacheKey = `social_media_${disasterId}_${keywords.join('_')}`;
    
    try {
      // Check cache first
      const cached = await CacheManager.get(cacheKey);
      if (cached) {
        logger.debug('Social media cache hit');
        return cached;
      }

      // Mock social media data since we don't have real Twitter API access
      const mockReports = this.generateMockReports(keywords);
      
      // Cache the results
      await CacheManager.set(cacheKey, mockReports, 0.5); // 30 minutes cache

      logger.info(`Generated ${mockReports.length} mock social media reports`);
      return mockReports;

    } catch (error) {
      logger.error('Social media service error:', error);
      return [];
    }
  }

  static generateMockReports(keywords = []) {
    const users = ['citizen1', 'localreporter', 'emergency_witness', 'community_helper', 'news_update'];
    const urgencyLevels = ['low', 'medium', 'high', 'urgent'];
    
    const mockPosts = [
      'Need emergency supplies in downtown area #disaster #help',
      'Water levels rising rapidly, evacuation needed #emergency #flood',
      'Looking for shelter, family of 4 #assistance #disaster',
      'Medical supplies needed at community center #medical #emergency',
      'Road blocked by debris, alternate routes needed #traffic #disaster',
      'Power outage affecting entire neighborhood #power #emergency',
      'Red Cross setup at local school, volunteers needed #volunteer #relief',
      'Food distribution at park, 2-4 PM today #food #relief',
      'Missing person last seen near main street #missing #emergency',
      'Firefighters requesting backup at industrial district #fire #emergency'
    ];

    const reports = [];
    const numReports = Math.floor(Math.random() * 8) + 3; // 3-10 reports

    for (let i = 0; i < numReports; i++) {
      const post = mockPosts[Math.floor(Math.random() * mockPosts.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const urgency = urgencyLevels[Math.floor(Math.random() * urgencyLevels.length)];
      
      // Add keywords to some posts
      let content = post;
      if (keywords.length > 0 && Math.random() > 0.5) {
        const keyword = keywords[Math.floor(Math.random() * keywords.length)];
        content = `${content} #${keyword}`;
      }

      reports.push({
        id: `mock_${Date.now()}_${i}`,
        user: user,
        content: content,
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        urgency: urgency,
        location: this.getRandomLocation(),
        verified: Math.random() > 0.7
      });
    }

    return reports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  static getRandomLocation() {
    const locations = [
      'Downtown District',
      'Residential Area',
      'Industrial Zone',
      'City Center',
      'Suburban Neighborhood',
      'Business District',
      'Waterfront Area',
      'Historic District'
    ];
    
    return locations[Math.floor(Math.random() * locations.length)];
  }

  static async flagUrgentReports(reports) {
    const urgentKeywords = ['urgent', 'emergency', 'help', 'sos', 'critical', 'immediate'];
    
    return reports.filter(report => {
      const content = report.content.toLowerCase();
      return urgentKeywords.some(keyword => content.includes(keyword));
    });
  }
}