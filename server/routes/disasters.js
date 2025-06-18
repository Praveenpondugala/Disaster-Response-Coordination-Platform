import express from 'express';
import Joi from 'joi';
import { supabaseAdmin } from '../database/supabase.js';
import { GeminiService } from '../services/gemini.js';
import { GeocodingService } from '../services/geocoding.js';
import { logger } from '../utils/logger.js';

export const disastersRouter = express.Router();

// Validation schema
const createDisasterSchema = Joi.object({
  title: Joi.string().required().min(3).max(200),
  location_name: Joi.string().optional(),
  description: Joi.string().required().min(10),
  tags: Joi.array().items(Joi.string()).default([])
});

const updateDisasterSchema = Joi.object({
  title: Joi.string().optional().min(3).max(200),
  location_name: Joi.string().optional(),
  description: Joi.string().optional().min(10),
  tags: Joi.array().items(Joi.string()).optional()
});

// GET /disasters - List disasters with filtering
disastersRouter.get('/', async (req, res) => {
  try {
    const { tag, owner_id, limit = 10, offset = 0 } = req.query;
    
    let query = supabaseAdmin
      .from('disasters')
      .select(`
        *,
        reports:reports(count),
        resources:resources(count)
      `);

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    if (owner_id) {
      query = query.eq('owner_id', owner_id);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Error fetching disasters:', error);
      return res.status(500).json({ error: 'Failed to fetch disasters' });
    }

    // Convert geography to coordinates for frontend
    const disastersWithCoords = data.map(disaster => ({
      ...disaster,
      coordinates: disaster.location ? {
        latitude: disaster.location.coordinates[1],
        longitude: disaster.location.coordinates[0]
      } : null
    }));

    res.json({
      disasters: disastersWithCoords,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    logger.error('Disasters list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /disasters - Create new disaster
disastersRouter.post('/', async (req, res) => {
  try {
    const { error: validationError, value } = createDisasterSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    const { title, location_name, description, tags } = value;
    const owner_id = req.user.id;

    let coordinates = null;
    let finalLocationName = location_name;

    // Extract location from description if not provided
    if (!location_name && description) {
      try {
        const extracted = await GeminiService.extractLocation(description);
        finalLocationName = extracted.location;
        logger.info(`Location extracted from description: ${finalLocationName}`);
      } catch (error) {
        logger.warn('Failed to extract location from description:', error.message);
      }
    }

    // Geocode the location
    if (finalLocationName) {
      try {
        const coords = await GeocodingService.getCoordinates(finalLocationName);
        coordinates = coords;
        logger.info(`Geocoded location: ${finalLocationName} -> ${coords.latitude}, ${coords.longitude}`);
      } catch (error) {
        logger.warn('Failed to geocode location:', error.message);
      }
    }

    // Create audit trail entry
    const auditEntry = {
      action: 'create',
      user_id: owner_id,
      timestamp: new Date().toISOString(),
      changes: { title, location_name: finalLocationName, description, tags }
    };

    // Insert disaster with geography point
    const insertData = {
      title,
      location_name: finalLocationName,
      description,
      tags,
      owner_id,
      audit_trail: [auditEntry]
    };

    let query = supabaseAdmin.from('disasters').insert(insertData).select();

    // Add geography point if we have coordinates
    if (coordinates) {
      const { data: geoData, error: geoError } = await supabaseAdmin.rpc('insert_disaster_with_location', {
        p_title: title,
        p_location_name: finalLocationName,
        p_latitude: coordinates.latitude,
        p_longitude: coordinates.longitude,
        p_description: description,
        p_tags: tags,
        p_owner_id: owner_id,
        p_audit_trail: [auditEntry]
      });

      if (geoError) {
        logger.error('Error inserting disaster with location:', geoError);
        // Fall back to insert without location
      } else {
        // Emit WebSocket event
        req.io.emit('disaster_updated', {
          action: 'created',
          disaster: { ...geoData[0], coordinates }
        });

        logger.info(`Disaster created: ${title} by ${owner_id}`);
        return res.status(201).json({
          disaster: { ...geoData[0], coordinates },
          message: 'Disaster created successfully'
        });
      }
    }

    // Standard insert without geography
    const { data, error } = await query;

    if (error) {
      logger.error('Error creating disaster:', error);
      return res.status(500).json({ error: 'Failed to create disaster' });
    }

    // Emit WebSocket event
    req.io.emit('disaster_updated', {
      action: 'created',
      disaster: { ...data[0], coordinates }
    });

    logger.info(`Disaster created: ${title} by ${owner_id}`);
    res.status(201).json({
      disaster: { ...data[0], coordinates },
      message: 'Disaster created successfully'
    });

  } catch (error) {
    logger.error('Create disaster error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /disasters/:id - Get single disaster
disastersRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('disasters')
      .select(`
        *,
        reports:reports(*),
        resources:resources(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Disaster not found' });
      }
      logger.error('Error fetching disaster:', error);
      return res.status(500).json({ error: 'Failed to fetch disaster' });
    }

    // Convert geography to coordinates
    const disasterWithCoords = {
      ...data,
      coordinates: data.location ? {
        latitude: data.location.coordinates[1],
        longitude: data.location.coordinates[0]
      } : null
    };

    res.json({ disaster: disasterWithCoords });

  } catch (error) {
    logger.error('Get disaster error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /disasters/:id - Update disaster
disastersRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error: validationError, value } = updateDisasterSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    // Check if disaster exists and user has permission
    const { data: existingDisaster, error: fetchError } = await supabaseAdmin
      .from('disasters')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingDisaster) {
      return res.status(404).json({ error: 'Disaster not found' });
    }

    if (existingDisaster.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Handle location update if needed
    let coordinates = null;
    if (value.location_name) {
      try {
        coordinates = await GeocodingService.getCoordinates(value.location_name);
      } catch (error) {
        logger.warn('Failed to geocode updated location:', error.message);
      }
    }

    // Create audit trail entry
    const auditEntry = {
      action: 'update',
      user_id: req.user.id,
      timestamp: new Date().toISOString(),
      changes: value
    };

    const updatedAuditTrail = [...(existingDisaster.audit_trail || []), auditEntry];

    const updateData = {
      ...value,
      updated_at: new Date().toISOString(),
      audit_trail: updatedAuditTrail
    };

    const { data, error } = await supabaseAdmin
      .from('disasters')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating disaster:', error);
      return res.status(500).json({ error: 'Failed to update disaster' });
    }

    // Emit WebSocket event
    req.io.emit('disaster_updated', {
      action: 'updated',
      disaster: { ...data, coordinates }
    });

    logger.info(`Disaster updated: ${id} by ${req.user.id}`);
    res.json({
      disaster: { ...data, coordinates },
      message: 'Disaster updated successfully'
    });

  } catch (error) {
    logger.error('Update disaster error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /disasters/:id - Delete disaster
disastersRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if disaster exists and user has permission
    const { data: existingDisaster, error: fetchError } = await supabaseAdmin
      .from('disasters')
      .select('owner_id, title')
      .eq('id', id)
      .single();

    if (fetchError || !existingDisaster) {
      return res.status(404).json({ error: 'Disaster not found' });
    }

    if (existingDisaster.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { error } = await supabaseAdmin
      .from('disasters')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting disaster:', error);
      return res.status(500).json({ error: 'Failed to delete disaster' });
    }

    // Emit WebSocket event
    req.io.emit('disaster_updated', {
      action: 'deleted',
      disaster_id: id
    });

    logger.info(`Disaster deleted: ${id} (${existingDisaster.title}) by ${req.user.id}`);
    res.json({ message: 'Disaster deleted successfully' });

  } catch (error) {
    logger.error('Delete disaster error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});