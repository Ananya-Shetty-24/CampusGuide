import { getResources, getEquipment, getResourceById } from '../data/dataLoader.js';

const SYNONYMS = {
  'lab': 'laboratory',
  'labs': 'laboratory',
  'proj': 'projector',
  'projector': 'presentation',
  '3d': '3d',
  'robot': 'robotics',
  'cyber': 'cybersecurity',
  'proto': 'prototyping',
  'fabric': 'fabrication',
  'seminar': 'seminar',
  'study': 'study'
};

function normalizeQuery(query) {
  let q = query.toLowerCase().trim();
  
  Object.entries(SYNONYMS).forEach(([key, value]) => {
    if (q === key || q.startsWith(key + ' ')) {
      q = q.replace(key, value);
    }
  });
  
  return q;
}

function calculateEquipmentScore(equipment, query) {
  let score = 0;
  const name = equipment.equipment_name.toLowerCase();
  const category = equipment.category.toLowerCase();
  const location = equipment.location.toLowerCase();
  
  if (name === query) score += 100;
  else if (name.startsWith(query)) score += 60;
  else if (name.includes(query)) score += 40;
  
  if (category === query) score += 80;
  else if (category.startsWith(query)) score += 50;
  else if (category.includes(query)) score += 30;
  
  if (location.includes(query)) score += 35;
  
  return score;
}

function calculateResourceScore(resource, query) {
  let score = 0;
  const name = resource.resource_name.toLowerCase();
  const type = resource.resource_type.toLowerCase();
  const building = resource.building.toLowerCase();
  const equipmentStr = resource.equipment.join(' ').toLowerCase();
  
  if (name === query) score += 100;
  else if (name.startsWith(query)) score += 60;
  else if (name.includes(query)) score += 40;
  
  if (type === query) score += 80;
  else if (type.startsWith(query)) score += 50;
  else if (type.includes(query)) score += 30;
  
  if (building === query) score += 90;
  else if (building.startsWith(query)) score += 55;
  else if (building.includes(query)) score += 35;
  
  if (equipmentStr.includes(query)) score += 35;
  
  return score;
}

function searchEquipment(query, limit) {
  const equipment = getEquipment();
  const results = [];
  
  for (const item of equipment) {
    const score = calculateEquipmentScore(item, query);
    if (score > 0) {
      const resource = getResourceById(item.resource_id);
      results.push({
        type: 'equipment',
        id: item.equipment_id,
        name: item.equipment_name,
        category: item.category,
        quantity: item.quantity,
        resource_id: item.resource_id,
        location: resource ? {
          name: resource.resource_name,
          building: resource.building,
          floor: resource.floor
        } : null,
        score
      });
    }
  }
  
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

function searchResources(query, limit) {
  const resources = getResources();
  const results = [];
  
  for (const item of resources) {
    const score = calculateResourceScore(item, query);
    if (score > 0) {
      results.push({
        type: 'resource',
        id: item.resource_id,
        name: item.resource_name,
        resource_type: item.resource_type,
        building: item.building,
        floor: item.floor,
        capacity: item.capacity,
        equipment: item.equipment,
        score
      });
    }
  }
  
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

function searchLocations(query, limit) {
  const resources = getResources();
  const results = [];
  const seenBuildings = new Set();
  
  for (const item of resources) {
    const building = item.building.toLowerCase();
    const name = item.resource_name.toLowerCase();
    
    let score = 0;
    if (building === query) score += 90;
    else if (building.startsWith(query)) score += 55;
    else if (building.includes(query)) score += 35;
    
    if (name.includes(query)) score += 40;
    
    if (score > 0) {
      if (!seenBuildings.has(item.building)) {
        seenBuildings.add(item.building);
        results.push({
          type: 'location',
          building: item.building,
          resources: [],
          score
        });
      }
      
      const locationResult = results.find(r => r.building === item.building);
      locationResult.resources.push({
        id: item.resource_id,
        name: item.resource_name,
        resource_type: item.resource_type,
        floor: item.floor,
        capacity: item.capacity
      });
      locationResult.score = Math.max(locationResult.score, score);
    }
  }
  
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

export function search(query, type = 'all', limit = 10) {
  const normalizedQuery = normalizeQuery(query);
  
  if (!normalizedQuery || normalizedQuery.length === 0) {
    return {
      query,
      filter: type,
      count: 0,
      results: []
    };
  }
  
  const results = [];
  
  if (type === 'all' || type === 'equipment') {
    results.push(...searchEquipment(normalizedQuery, limit));
  }
  
  if (type === 'all' || type === 'resources') {
    results.push(...searchResources(normalizedQuery, limit));
  }
  
  if (type === 'all' || type === 'locations') {
    results.push(...searchLocations(normalizedQuery, limit));
  }
  
  results.sort((a, b) => b.score - a.score);
  
  return {
    query,
    filter: type,
    count: Math.min(results.length, limit),
    results: results.slice(0, limit)
  };
}

export function getSuggestions(query, limit = 8) {
  const normalizedQuery = normalizeQuery(query);
  
  if (!normalizedQuery || normalizedQuery.length === 0) {
    return [];
  }
  
  const suggestions = [];
  
  const equipment = getEquipment();
  for (const item of equipment) {
    const score = calculateEquipmentScore(item, normalizedQuery);
    if (score > 0) {
      const resource = getResourceById(item.resource_id);
      suggestions.push({
        type: 'equipment',
        id: item.equipment_id,
        label: item.equipment_name,
        subtitle: resource ? resource.resource_name : item.location,
        score
      });
    }
  }
  
  const resources = getResources();
  for (const item of resources) {
    const score = calculateResourceScore(item, normalizedQuery);
    if (score > 0) {
      suggestions.push({
        type: 'resource',
        id: item.resource_id,
        label: item.resource_name,
        subtitle: `${item.building} · Floor ${item.floor}`,
        score
      });
    }
  }
  
  suggestions.sort((a, b) => b.score - a.score);
  return suggestions.slice(0, limit);
}
