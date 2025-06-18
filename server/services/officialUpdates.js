import axios from 'axios';
import * as cheerio from 'cheerio';
import { CacheManager } from '../utils/cache.js';
import { logger } from '../utils/logger.js';

export class OfficialUpdatesService {
  static async getUpdates(disasterType = 'general') {
    const cacheKey = `official_updates_${disasterType}`;
    
    try {
      // Check cache first
      const cached = await CacheManager.get(cacheKey);
      if (cached) {
        logger.debug('Official updates cache hit');
        return cached;
      }

      // Mock official updates since we can't reliably scrape government sites
      const mockUpdates = this.generateMockOfficialUpdates(disasterType);
      
      // Cache the results
      await CacheManager.set(cacheKey, mockUpdates, 2); // 2 hours cache

      logger.info(`Generated ${mockUpdates.length} mock official updates`);
      return mockUpdates;

    } catch (error) {
      logger.error('Official updates service error:', error);
      return this.generateMockOfficialUpdates(disasterType);
    }
  }

  static generateMockOfficialUpdates(disasterType) {
    const agencies = [
      'FEMA',
      'Red Cross',
      'National Weather Service',
      'Emergency Management',
      'Local Government',
      'State Department of Emergency Services'
    ];

    const updateTypes = [
      'Weather Alert',
      'Evacuation Notice',
      'Resource Distribution',
      'Safety Advisory',
      'Status Update',
      'Recovery Information'
    ];

    const updates = [];
    const numUpdates = Math.floor(Math.random() * 6) + 2; // 2-7 updates

    for (let i = 0; i < numUpdates; i++) {
      const agency = agencies[Math.floor(Math.random() * agencies.length)];
      const type = updateTypes[Math.floor(Math.random() * updateTypes.length)];
      
      updates.push({
        id: `official_${Date.now()}_${i}`,
        agency: agency,
        title: `${type}: ${this.getUpdateTitle(disasterType)}`,
        content: this.getUpdateContent(disasterType, type),
        timestamp: new Date(Date.now() - Math.random() * 7200000).toISOString(),
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        source_url: `https://example.gov/updates/${Date.now()}_${i}`,
        verified: true
      });
    }

    return updates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  static getUpdateTitle(disasterType) {
    const titles = {
      flood: [
        'Flood Warning Extended Through Weekend',
        'Emergency Shelters Open in Affected Areas',
        'Water Rescue Operations Ongoing',
        'Flood Recovery Resources Available'
      ],
      wildfire: [
        'Evacuation Orders Expanded to Zone 3',
        'Air Quality Advisory in Effect',
        'Firefighting Resources Deployed',
        'Smoke Shelter Locations Announced'
      ],
      general: [
        'Emergency Response Teams Deployed',
        'Public Safety Measures in Effect',
        'Community Resources Available',
        'Recovery Operations Underway'
      ]
    };

    const typeTitle = titles[disasterType] || titles.general;
    return typeTitle[Math.floor(Math.random() * typeTitle.length)];
  }

  static getUpdateContent(disasterType, updateType) {
    const contents = [
      'Local authorities are coordinating emergency response efforts. Residents in affected areas should follow evacuation orders and stay informed through official channels.',
      'Emergency shelters have been established at local schools and community centers. Transportation assistance is available for those who need it.',
      'First responders are conducting search and rescue operations. Citizens are advised to avoid affected areas unless absolutely necessary.',
      'Distribution centers for emergency supplies have been set up at designated locations. Please bring identification when requesting assistance.',
      'Recovery resources including temporary housing assistance are now available. Contact the disaster relief hotline for more information.',
      'Public safety officials are monitoring the situation closely. Updates will be provided as conditions change.'
    ];

    return contents[Math.floor(Math.random() * contents.length)];
  }
}