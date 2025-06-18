import { supabaseAdmin } from '../database/supabase.js';
import { logger } from './logger.js';

const CACHE_TTL_HOURS = parseInt(process.env.CACHE_TTL_HOURS) || 1;

export class CacheManager {
  static async get(key) {
    try {
      const { data, error } = await supabaseAdmin
        .from('cache')
        .select('value, expires_at')
        .eq('key', key)
        .single();

      if (error || !data) {
        return null;
      }

      // Check if cache has expired
      if (new Date(data.expires_at) < new Date()) {
        await this.delete(key);
        return null;
      }

      logger.debug(`Cache hit for key: ${key}`);
      return data.value;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  static async set(key, value, ttlHours = CACHE_TTL_HOURS) {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + ttlHours);

      const { error } = await supabaseAdmin
        .from('cache')
        .upsert({
          key,
          value,
          expires_at: expiresAt.toISOString()
        });

      if (error) {
        logger.error('Cache set error:', error);
        return false;
      }

      logger.debug(`Cache set for key: ${key}, expires: ${expiresAt}`);
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  static async delete(key) {
    try {
      const { error } = await supabaseAdmin
        .from('cache')
        .delete()
        .eq('key', key);

      if (error) {
        logger.error('Cache delete error:', error);
        return false;
      }

      logger.debug(`Cache deleted for key: ${key}`);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  static async cleanup() {
    try {
      const { error } = await supabaseAdmin
        .from('cache')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        logger.error('Cache cleanup error:', error);
        return false;
      }

      logger.info('Cache cleanup completed');
      return true;
    } catch (error) {
      logger.error('Cache cleanup error:', error);
      return false;
    }
  }
}

// Cleanup expired cache entries every hour
setInterval(() => {
  CacheManager.cleanup();
}, 60 * 60 * 1000);