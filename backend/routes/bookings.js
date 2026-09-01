import { Router } from 'express';
import {
  createBooking,
  cancelBooking,
  getBookingsByResourceId,
  getBookingById,
  getAllBookings
} from '../services/bookingService.js';
import { getResourceById } from '../data/dataLoader.js';

const router = Router();

router.get('/bookings', (req, res) => {
  try {
    const bookings = getAllBookings();
    const enriched = bookings.map(b => {
      const resource = getResourceById(b.resource_id);
      return {
        ...b,
        resource_name: resource?.resource_name || 'Unknown',
        building: resource?.building || '',
        resource_type: resource?.resource_type || ''
      };
    });
    res.json({ bookings: enriched });
  } catch (error) {
    console.error('All bookings error:', error);
    res.status(500).json({ error: 'Unable to fetch bookings.' });
  }
});

router.post('/resources/:resourceId/bookings', (req, res) => {
  try {
    const { resourceId } = req.params;
    const { availability_id } = req.body;

    if (!availability_id) {
      return res.status(400).json({ error: 'availability_id is required.' });
    }

    const resource = getResourceById(resourceId);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    const result = createBooking(resourceId, availability_id);

    if (result.error === 'not_found') {
      return res.status(404).json({ error: result.message });
    }
    if (result.error === 'mismatch') {
      return res.status(400).json({ error: result.message });
    }
    if (result.error === 'conflict') {
      return res.status(409).json({ error: result.message });
    }

    res.status(201).json({
      message: 'Booking created successfully.',
      booking: result.booking
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ error: 'Unable to create booking.' });
  }
});

router.get('/resources/:resourceId/bookings', (req, res) => {
  try {
    const { resourceId } = req.params;

    const resource = getResourceById(resourceId);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    const bookings = getBookingsByResourceId(resourceId);
    res.json({ bookings });
  } catch (error) {
    console.error('Bookings list error:', error);
    res.status(500).json({ error: 'Unable to fetch bookings.' });
  }
});

router.get('/bookings/:bookingId', (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = getBookingById(bookingId);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Booking detail error:', error);
    res.status(500).json({ error: 'Unable to fetch booking.' });
  }
});

router.delete('/bookings/:bookingId', (req, res) => {
  try {
    const { bookingId } = req.params;
    const result = cancelBooking(bookingId);

    if (result.error === 'not_found') {
      return res.status(404).json({ error: result.message });
    }
    if (result.error === 'already_cancelled') {
      return res.status(400).json({ error: result.message });
    }
    if (result.error === 'past') {
      return res.status(400).json({ error: result.message });
    }

    res.json({ message: 'Booking cancelled successfully.', booking: result.booking });
  } catch (error) {
    console.error('Booking cancel error:', error);
    res.status(500).json({ error: 'Unable to cancel booking.' });
  }
});

export default router;
