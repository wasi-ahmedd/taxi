import { env } from '../config/env.js';
import { findDriverById, updateDriver } from '../models/driverModel.js';
import { upsertEarning } from '../models/earningModel.js';
import { createTrip, findTripById, listTrips, updateTrip } from '../models/tripModel.js';
import { calculateEarnings } from '../services/earningsService.js';
import { emitTripUpdated, emitDriverUpdated } from '../services/socketService.js';

const setDriverStatus = async (driverId, status) => {
  if (!driverId) return;
  const driver = await updateDriver(driverId, { status });
  if (driver) emitDriverUpdated(driver);
};

export const createTripHandler = async (req, res) => {
  try {
    const { customerName, pickupLocation, destination, assignedDriverId } = req.body;
    if (!customerName || !pickupLocation || !destination) {
      return res.status(400).json({ message: 'customerName, pickupLocation, destination are required' });
    }

    if (assignedDriverId) {
      const driver = await findDriverById(assignedDriverId);
      if (!driver || !driver.active) {
        return res.status(400).json({ message: 'Assigned driver not found or inactive' });
      }
    }

    const trip = await createTrip({ customerName, pickupLocation, destination, assignedDriverId });
    if (assignedDriverId) await setDriverStatus(assignedDriverId, 'busy');
    emitTripUpdated(trip);
    return res.status(201).json(trip);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create trip', detail: error.message });
  }
};

export const listTripsHandler = async (req, res) => {
  try {
    const trips = await listTrips({
      driverId: req.query.driverId ? Number(req.query.driverId) : undefined,
      from: req.query.from,
      to: req.query.to,
    });
    return res.json(trips);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list trips', detail: error.message });
  }
};

const ensureDriverOwnsTrip = (trip, userId) => trip.assigned_driver_id === userId;

export const acceptTripHandler = async (req, res) => {
  try {
    const tripId = Number(req.params.id);
    const trip = await findTripById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    if (req.user.role === 'driver' && !ensureDriverOwnsTrip(trip, req.user.id)) {
      return res.status(403).json({ message: 'Trip not assigned to this driver' });
    }

    const updated = await updateTrip(tripId, { status: 'accepted' });
    await setDriverStatus(updated.assigned_driver_id, 'busy');
    emitTripUpdated(updated);
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to accept trip', detail: error.message });
  }
};

export const startTripHandler = async (req, res) => {
  try {
    const tripId = Number(req.params.id);
    const trip = await findTripById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    if (req.user.role === 'driver' && !ensureDriverOwnsTrip(trip, req.user.id)) {
      return res.status(403).json({ message: 'Trip not assigned to this driver' });
    }

    const updated = await updateTrip(tripId, { status: 'started', start_time: new Date() });
    await setDriverStatus(updated.assigned_driver_id, 'busy');
    emitTripUpdated(updated);
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to start trip', detail: error.message });
  }
};

export const completeTripHandler = async (req, res) => {
  try {
    const tripId = Number(req.params.id);
    const { fare } = req.body;
    if (fare === undefined || Number(fare) < 0) {
      return res.status(400).json({ message: 'Valid fare is required' });
    }

    const trip = await findTripById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    if (req.user.role === 'driver' && !ensureDriverOwnsTrip(trip, req.user.id)) {
      return res.status(403).json({ message: 'Trip not assigned to this driver' });
    }

    const updated = await updateTrip(tripId, { status: 'completed', fare: Number(fare), end_time: new Date() });

    const earnings = calculateEarnings({
      fare,
      ownerCommissionPercent: env.ownerCommissionPercent,
    });

    const earningRow = await upsertEarning({
      tripId: updated.id,
      driverId: updated.assigned_driver_id,
      totalFare: earnings.totalFare,
      ownerCommissionPercent: earnings.ownerCommissionPercent,
      ownerEarning: earnings.ownerEarning,
      driverEarning: earnings.driverEarning,
    });

    await setDriverStatus(updated.assigned_driver_id, 'available');
    emitTripUpdated(updated);
    return res.json({ trip: updated, earnings: earningRow });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to complete trip', detail: error.message });
  }
};

export const assignDriverHandler = async (req, res) => {
  try {
    const tripId = Number(req.params.id);
    const { assignedDriverId } = req.body;
    const trip = await findTripById(tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const driver = await findDriverById(assignedDriverId);
    if (!driver || !driver.active) {
      return res.status(400).json({ message: 'Assigned driver not found or inactive' });
    }

    const updated = await updateTrip(tripId, { assigned_driver_id: assignedDriverId });
    await setDriverStatus(assignedDriverId, 'busy');
    emitTripUpdated(updated);
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to assign driver', detail: error.message });
  }
};
