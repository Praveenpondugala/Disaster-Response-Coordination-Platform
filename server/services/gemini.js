import axios from 'axios';
import { CacheManager } from '../utils/cache.js';
import { logger } from '../utils/logger.js';

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export class GeminiService {
  static async extractLocation(description) {
    const cacheKey = `gemini_location_${Buffer.from(description).toString('base64')}`;
    
    try {
      // Check cache first
      const cached = await CacheManager.get(cacheKey);
      if (cached) {
        logger.debug('Location extraction cache hit');
        return cached;
      }

      const prompt = `Extract the location name from this disaster description. Return only the location name (city, state/country format if possible): "${description}"`;

      const response = await axios.post(
        `${GEMINI_BASE_URL}/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const extractedLocation = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      
      if (!extractedLocation) {
        throw new Error('No location extracted from description');
      }

      const result = { location: extractedLocation };
      
      // Cache the result
      await CacheManager.set(cacheKey, result);
      
      logger.info(`Location extracted: ${extractedLocation}`);
      return result;

    } catch (error) {
      logger.error('Gemini location extraction error:', error);
      
      // Fallback: try to extract location using simple text analysis
      const locationKeywords = ['in ', 'at ', 'near ', 'around '];
      const words = description.toLowerCase().split(' ');
      
      for (const keyword of locationKeywords) {
        const index = description.toLowerCase().indexOf(keyword);
        if (index !== -1) {
          const afterKeyword = description.substring(index + keyword.length);
          const locationPart = afterKeyword.split(/[,.!?]/)[0].trim();
          if (locationPart.length > 2) {
            return { location: locationPart };
          }
        }
      }
      
      throw new Error('Failed to extract location');
    }
  }

  static async verifyImage(imageUrl) {
    const cacheKey = `gemini_verify_${Buffer.from(imageUrl).toString('base64')}`;
    
    try {
      // Check cache first
      const cached = await CacheManager.get(cacheKey);
      if (cached) {
        logger.debug('Image verification cache hit');
        return cached;
      }

      const prompt = `Analyze this image for signs of disaster or emergency. Check for:
      1. Authenticity (does it look manipulated or fake?)
      2. Disaster context (does it show actual emergency conditions?)
      3. Relevance (is it related to the reported disaster type?)
      
      Respond with JSON format: {"authentic": boolean, "disaster_related": boolean, "confidence": number 0-1, "description": "brief description"}`;

      // Note: For real implementation, you would need to handle image upload to Gemini
      // This is a simplified version that assumes the image URL is accessible
      const response = await axios.post(
        `${GEMINI_BASE_URL}/models/gemini-pro-vision:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [
              { text: prompt },
              { 
                inline_data: {
                  mime_type: "image/jpeg",
                  data: imageUrl // In real implementation, convert image to base64
                }
              }
            ]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const analysisText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      let analysis;
      try {
        analysis = JSON.parse(analysisText);
      } catch {
        // Fallback if JSON parsing fails
        analysis = {
          authentic: true,
          disaster_related: true,
          confidence: 0.5,
          description: 'Unable to fully analyze image'
        };
      }

      // Cache the result
      await CacheManager.set(cacheKey, analysis);
      
      logger.info(`Image verified: ${imageUrl}, authentic: ${analysis.authentic}`);
      return analysis;

    } catch (error) {
      logger.error('Gemini image verification error:', error);
      
      // Fallback response
      return {
        authentic: true,
        disaster_related: true,
        confidence: 0.3,
        description: 'Verification service unavailable'
      };
    }
  }
}