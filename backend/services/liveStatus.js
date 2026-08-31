import { getResourceById, getAvailabilityByResourceId } from '../data/dataLoader.js';

const VALID_STATUSES = ['AVAILABLE', 'IN_USE', 'RESERVED', 'MAINTENANCE'];

const liveStatuses = new Map();
const sseClients = new Map();

function getNow() {
  return new Date().toISOString();
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getScheduledStatus(resourceId) {
  const today = getTodayStr();
  const records = getAvailabilityByResourceId(resourceId, today);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const rec of records) {
    const [sh, sm] = rec.start_time.split(':').map(Number);
    const [eh, em] = rec.end_time.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    if (currentMinutes >= startMin && currentMinutes < endMin) {
      return rec.status;
    }
  }
  return 'Available';
}

export function getLiveStatus(resourceId) {
  if (!liveStatuses.has(resourceId)) {
    liveStatuses.set(resourceId, {
      status: 'AVAILABLE',
      updated_at: getNow()
    });
  }
  return liveStatuses.get(resourceId);
}

function getCurrentStatus(scheduledStatus, liveStatus) {
  const priority = { MAINTENANCE: 4, IN_USE: 3, RESERVED: 2, AVAILABLE: 1 };
  const schedKey = scheduledStatus === 'Booked' ? 'RESERVED' : 'AVAILABLE';
  const schedP = priority[schedKey] || 0;
  const liveP = priority[liveStatus] || 0;
  return liveP >= schedP ? liveStatus : schedKey;
}

export function getResourceStatus(resourceId) {
  const resource = getResourceById(resourceId);
  if (!resource) return null;

  const scheduled = getScheduledStatus(resourceId);
  const live = getLiveStatus(resourceId);
  const current = getCurrentStatus(scheduled, live.status);

  return {
    resource_id: resourceId,
    scheduled_status: scheduled,
    live_status: live.status,
    current_status: current,
    updated_at: live.updated_at
  };
}

export function setLiveStatus(resourceId, newStatus) {
  if (!VALID_STATUSES.includes(newStatus)) {
    return { error: `Invalid status. Allowed: ${VALID_STATUSES.join(', ')}` };
  }
  const resource = getResourceById(resourceId);
  if (!resource) {
    return { error: 'not_found' };
  }

  const now = getNow();
  liveStatuses.set(resourceId, { status: newStatus, updated_at: now });

  broadcast(resourceId, {
    type: 'RESOURCE_STATUS_CHANGED',
    resource_id: resourceId,
    status: newStatus,
    updated_at: now
  });

  return { success: true, status: newStatus, updated_at: now };
}

export function addSseClient(resourceId, res) {
  if (!sseClients.has(resourceId)) {
    sseClients.set(resourceId, new Set());
  }
  sseClients.get(resourceId).add(res);
}

export function removeSseClient(resourceId, res) {
  if (sseClients.has(resourceId)) {
    sseClients.get(resourceId).delete(res);
    if (sseClients.get(resourceId).size === 0) {
      sseClients.delete(resourceId);
    }
  }
}

function broadcast(resourceId, data) {
  if (!sseClients.has(resourceId)) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients.get(resourceId)) {
    client.write(payload);
  }
}

export { VALID_STATUSES };
