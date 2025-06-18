import axios from 'axios';
import { CacheManager } from '../utils/cache.js';
import { logger } from '../utils/logger.js';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export class GeocodingService {
  static async getCoordinates(locationName) {
    const cacheKey = `geocoding_${Buffer.from(locationName).toString('base64')}`;
    
    try {
      // Check cache first
      const cached = await CacheManager.get(cacheKey);
      if (cached) {
        logger.debug('Geocoding cache hit');
        return cached;
      }

      // Try Google Maps Geocoding API first
      if (GOOGLE_MAPS_API_KEY) {
        try {
          const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json`,
            {
              params: {
                address: locationName,
                key: GOOGLE_MAPS_API_KEY
              }
            }
          );

          if (response.data.status === 'OK' && response.data.results.length > 0) {
            const location = response.data.results[0].geometry.location;
            const result = {
              latitude: location.lat,
              longitude: location.lng,
              formatted_address: response.data.results[0].formatted_address
            };

            await CacheManager.set(cacheKey, result);
            logger.info(`Geocoded: ${locationName} -> ${location.lat}, ${location.lng}`);
            return result;
          }
        } catch (error) {
          logger.warn('Google Maps geocoding failed, trying OpenStreetMap:', error.message);
        }
      }

      // Fallback to OpenStreetMap Nominatim
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search`,
        {
          params: {
            q: locationName,
            format: 'json',
            limit: 1
          },
          headers: {
            'User-Agent': 'DisasterResponsePlatform/1.0'
          }
        }
      );

      if (response.data && response.data.length > 0) {
        const location = response.data[0];
        const result = {
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lon),
          formatted_address: location.display_name
        };

        await CacheManager.set(cacheKey, result);
        logger.info(`Geocoded (OSM): ${locationName} -> ${result.latitude}, ${result.longitude}`);
        return result;
      }

      throw new Error('No geocoding results found');

    } catch (error) {
      logger.error('Geocoding error:', error);
      
      // Return sample coordinates for major cities as fallback
      const fallbackLocations = {
        'manhattan': { latitude: 40.7829, longitude: -73.9654 },
        'nyc': { latitude: 40.7128, longitude: -74.0060 },
        'los angeles': { latitude: 34.0522, longitude: -118.2437 },
        'chicago': { latitude: 41.8781, longitude: -87.6298 },
        'houston': { latitude: 29.7604, longitude: -95.3698 }
      };

      const key = locationName.toLowerCase();
      for (const [city, coords] of Object.entries(fallbackLocations)) {
        if (key.includes(city)) {
          logger.info(`Using fallback coordinates for ${locationName}`);
          return { ...coords, formatted_address: locationName };
        }
      }

      throw new Error('Geocoding failed and no fallback available');
    }
  }
}