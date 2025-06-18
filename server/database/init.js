import { supabaseAdmin } from './supabase.js';
import { logger } from '../utils/logger.js';

export async function initializeDatabase() {
  try {
    logger.info('🔧 Initializing database...');

    // Note: Database schema should be managed through Supabase migrations
    // or directly in the Supabase dashboard, not by the application at runtime.
    // The tables are assumed to already exist.

    // Insert sample data
    await insertSampleData();

    logger.info('✅ Database initialized successfully');

  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    throw error;
  }
}

async function insertSampleData() {
  try {
    // Sample disasters with GeoJSON Point format for PostGIS GEOGRAPHY columns
    const sampleDisasters = [
      {
        title: 'NYC Flood',
        location_name: 'Manhattan, NYC',
        location: {
          type: 'Point',
          coordinates: [-74.0060, 40.7128]
        },
        description: 'Heavy flooding in Manhattan due to storm surge',
        tags: ['flood', 'urgent'],
        owner_id: 'netrunnerX'
      },
      {
        title: 'California Wildfire',
        location_name: 'Los Angeles, CA',
        location: {
          type: 'Point',
          coordinates: [-118.2437, 34.0522]
        },
        description: 'Large wildfire spreading through LA County',
        tags: ['wildfire', 'evacuation'],
        owner_id: 'reliefAdmin'
      }
    ];

    // Use upsert to insert sample data without duplicates
    const { error } = await supabaseAdmin
      .from('disasters')
      .upsert(sampleDisasters, { 
        onConflict: 'title,location_name',
        ignoreDuplicates: true 
      });

    if (error) {
      logger.warn('Sample data insertion warning:', error);
    } else {
      logger.info('📝 Sample data inserted');
    }

  } catch (error) {
    logger.warn('Sample data insertion failed:', error);
    // Don't throw here - sample data insertion failure shouldn't prevent server startup
  }
}