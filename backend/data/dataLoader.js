import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let resources = [];
let equipment = [];
let availability = [];

function loadCSV(filename) {
  const filePath = join(__dirname, filename);
  const content = readFileSync(filePath, 'utf-8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
}

export async function loadData() {
  resources = loadCSV('campus_resources.csv');
  equipment = loadCSV('equipment.csv');
  availability = loadCSV('resource_availability.csv');

  resources.forEach(r => {
    r.floor = parseInt(r.floor, 10);
    r.capacity = parseInt(r.capacity, 10);
    r.equipment = r.equipment ? r.equipment.split(';') : [];
  });

  equipment.forEach(e => {
    e.quantity = parseInt(e.quantity, 10);
  });

  console.log(`Loaded ${resources.length} resources, ${equipment.length} equipment, ${availability.length} availability records`);
}

export function getResources() {
  return resources;
}

export function getEquipment() {
  return equipment;
}

export function getAvailability() {
  return availability;
}

export function getResourceById(id) {
  return resources.find(r => r.resource_id === id);
}

export function getEquipmentByResourceId(resourceId) {
  return equipment.filter(e => e.resource_id === resourceId);
}

export function getAvailabilityByResourceId(resourceId, date) {
  return availability.filter(a => {
    if (a.resource_id !== resourceId) return false;
    if (date && a.date !== date) return false;
    return true;
  });
}
