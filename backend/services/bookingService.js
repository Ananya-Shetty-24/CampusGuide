import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getResourceById, getAvailabilityByResourceId } from '../data/dataLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BOOKINGS_FILE = join(__dirname, '..', 'data', 'bookings.json');

let bookings = [];
let bookingCounter = 0;

function getNow() {
  return new Date().toISOString();
}

function loadBookings() {
  if (!existsSync(BOOKINGS_FILE)) {
    bookings = [];
    bookingCounter = 0;
    return;
  }
  try {
    const content = readFileSync(BOOKINGS_FILE, 'utf-8');
    const data = JSON.parse(content);
    bookings = data.bookings || [];
    bookingCounter = bookings.reduce((max, b) => {
      const num = parseInt(b.booking_id.replace('B', ''), 10);
      return num > max ? num : max;
    }, 0);
  } catch (err) {
    console.error('Error loading bookings:', err.message);
    bookings = [];
    bookingCounter = 0;
  }
}

function saveBookings() {
  try {
    const data = { bookings };
    writeFileSync(BOOKINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving bookings:', err.message);
    throw err;
  }
}

function generateBookingId() {
  bookingCounter += 1;
  return `B${String(bookingCounter).padStart(6, '0')}`;
}

export function initBookings() {
  loadBookings();
  console.log(`Loaded ${bookings.length} persistent bookings`);
}

export function createBooking(resourceId, availabilityId) {
  const resource = getResourceById(resourceId);
  if (!resource) {
    return { error: 'not_found', message: 'Resource not found.' };
  }

  const availRecords = getAvailabilityByResourceId(resourceId);
  const slot = availRecords.find(a => a.availability_id === availabilityId);
  if (!slot) {
    return { error: 'not_found', message: 'Availability slot not found.' };
  }

  if (slot.resource_id !== resourceId) {
    return { error: 'mismatch', message: 'Availability slot does not belong to this resource.' };
  }

  if (slot.status !== 'Available') {
    return { error: 'conflict', message: 'This time slot is no longer available.' };
  }

  const existingBooking = findBookingByAvailability(availabilityId);
  if (existingBooking) {
    return { error: 'conflict', message: 'This time slot is no longer available.' };
  }

  const bookingId = generateBookingId();
  const now = getNow();

  const booking = {
    booking_id: bookingId,
    resource_id: resourceId,
    availability_id: availabilityId,
    date: slot.date,
    start_time: slot.start_time,
    end_time: slot.end_time,
    status: 'Confirmed',
    created_at: now
  };

  bookings.push(booking);
  saveBookings();

  return { success: true, booking };
}

export function findBookingByAvailability(availabilityId) {
  return bookings.find(b => b.availability_id === availabilityId && b.status === 'Confirmed') || null;
}

export function getBookingsByResourceId(resourceId) {
  return bookings.filter(b => b.resource_id === resourceId && b.status === 'Confirmed');
}

export function getBookingById(bookingId) {
  return bookings.find(b => b.booking_id === bookingId) || null;
}

export function isSlotBooked(availabilityId) {
  return findBookingByAvailability(availabilityId) !== null;
}
