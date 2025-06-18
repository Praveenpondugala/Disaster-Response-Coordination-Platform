import express from 'express';
import Joi from 'joi';
import { GeminiService } from '../services/gemini.js';
import { GeocodingService } from '../services/geocoding.js';
import { logger } from '../utils/logger.js';

export const geocodingRouter = express.Router();

const geocodeSchema = Joi.object({
  location_name: Joi.string().optional(),
  description: Joi.string().optional()
}).or('location_name', 'description');

// POST /geocoding - Extract location and get coordinates
geocodingRouter.post('/', async (req, res) => {
  try {
    const { error: validationError, value } = geocodeSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    const { location_name, description } = value;
    let finalLocationName = location_name;

    // Extract location from description if not provided
    if (!location_name && description) {
      try {
        const extracted = await GeminiService.extractLocation(description);
        finalLocationName = extracted.location;
        logger.info(`Location extracted: ${finalLocationName}`);
      } catch (error) {
        logger.error('Failed to extract location:', error);
        return res.status(400).json({ 
          error: 'Could not extract location from description',
          details: error.message
        });
      }
    }

    if (!finalLocationName) {
      return res.status(400).json({ error: 'No location name provided or extracted' });
    }

    // Geocode the location
    try {
      const coordinates = await GeocodingService.getCoordinates(finalLocationName);
      
      res.json({
        location_name: finalLocationName,
        coordinates,
        extracted: !location_name // true if location was extracted from description
      });

    } catch (error) {
      logger.error('Geocoding failed:', error);
      res.status(400).json({ 
        error: 'Could not geocode location',
        location_name: finalLocationName,
        details: error.message
      });
    }

  } catch (error) {
    logger.error('Geocoding endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /geocoding/reverse - Reverse geocoding (coordinates to location name)
geocodingRouter.get('/reverse', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    // For simplicity, we'll use a basic reverse geocoding approach
    // In a production app, you'd use Google Maps or another service
    const locationName = await reverseGeocode(latitude, longitude);
    
    res.json({
      coordinates: { latitude, longitude },
      location_name: locationName
    });

  } catch (error) {
    logger.error('Reverse geocoding error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function reverseGeocode(lat, lng) {
  // Simple city detection based on coordinates
  const cities = [
    { name: 'New York, NY', lat: 40.7128, lng: -74.0060, radius: 0.5 },
    { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437, radius: 0.5 },
    { name: 'Chicago, IL', lat: 41.8781, lng: -87.6298, radius: 0.3 },
    { name: 'Houston, TX', lat: 29.7604, lng: -95.3698, radius: 0.3 },
    { name: 'Phoenix, AZ', lat: 33.4484, lng: -112.0740, radius: 0.3 }
  ];

  for (const city of cities) {
    const distance = Math.sqrt(
      Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
    );
    
    if (distance <= city.radius) {
      return city.name;
    }
  }

  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}