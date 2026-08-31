import { Router } from 'express';
import {
  getResources,
  getResourceById,
  getEquipmentByResourceId,
  getAvailabilityByResourceId
} from '../data/dataLoader.js';
import {
  getResourceStatus,
  setLiveStatus,
  addSseClient,
  removeSseClient,
  VALID_STATUSES
} from '../services/liveStatus.js';
import { isSlotBooked } from '../services/bookingService.js';

const router = Router();

router.get('/resources', (req, res) => {
  try {
    const { type, building, limit = '25' } = req.query;
    const searchLimit = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 50);

    let results = getResources();

    if (type) {
      const t = type.toLowerCase();
      results = results.filter(r => r.resource_type.toLowerCase() === t);
    }
    if (building) {
      const b = building.toLowerCase();
      results = results.filter(r => r.building.toLowerCase() === b);
    }

    const lightweight = results.slice(0, searchLimit).map(r => ({
      resource_id: r.resource_id,
      resource_name: r.resource_name,
      resource_type: r.resource_type,
      building: r.building,
      floor: r.floor,
      capacity: r.capacity
    }));

    res.json({
      count: lightweight.length,
      resources: lightweight
    });
  } catch (error) {
    console.error('Resources list error:', error);
    res.status(500).json({ error: 'Unable to fetch resources.' });
  }
});

router.get('/resources/:resourceId', (req, res) => {
  try {
    const { resourceId } = req.params;
    const resource = getResourceById(resourceId);

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    const equipment = getEquipmentByResourceId(resourceId).map(e => ({
      equipment_id: e.equipment_id,
      equipment_name: e.equipment_name,
      category: e.category,
      quantity: e.quantity
    }));

    res.json({
      resource: {
        resource_id: resource.resource_id,
        resource_name: resource.resource_name,
        resource_type: resource.resource_type,
        building: resource.building,
        floor: resource.floor,
        capacity: resource.capacity,
        equipment
      }
    });
  } catch (error) {
    console.error('Resource detail error:', error);
    res.status(500).json({ error: 'Unable to fetch resource.' });
  }
});

router.get('/resources/:resourceId/availability', (req, res) => {
  try {
    const { resourceId } = req.params;
    const { date } = req.query;

    const resource = getResourceById(resourceId);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    const records = getAvailabilityByResourceId(resourceId, date);
    records.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.start_time.localeCompare(b.start_time);
    });

    res.json({
      resource_id: resourceId,
      availability: records.map(r => ({
        availability_id: r.availability_id,
        date: r.date,
        start_time: r.start_time,
        end_time: r.end_time,
        status: r.status,
        booked: isSlotBooked(r.availability_id)
      }))
    });
  } catch (error) {
    console.error('Availability error:', error);
    res.status(500).json({ error: 'Unable to fetch availability.' });
  }
});

router.get('/resources/:resourceId/status', (req, res) => {
  try {
    const { resourceId } = req.params;
    const status = getResourceStatus(resourceId);

    if (!status) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    res.json(status);
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Unable to fetch status.' });
  }
});

router.patch('/resources/:resourceId/status', (req, res) => {
  try {
    const { resourceId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Allowed: ${VALID_STATUSES.join(', ')}`
      });
    }

    const result = setLiveStatus(resourceId, status);

    if (result.error === 'not_found') {
      return res.status(404).json({ error: 'Resource not found.' });
    }
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      resource_id: resourceId,
      live_status: result.status,
      updated_at: result.updated_at
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: 'Unable to update status.' });
  }
});

router.get('/resources/:resourceId/status/stream', (req, res) => {
  const { resourceId } = req.params;
  const resource = getResourceById(resourceId);

  if (!resource) {
    return res.status(404).json({ error: 'Resource not found.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'connected', resource_id: resourceId })}\n\n`);

  addSseClient(resourceId, res);

  req.on('close', () => {
    removeSseClient(resourceId, res);
  });
});

export default router;
