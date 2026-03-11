import bcrypt from 'bcryptjs';
import { createDriver, listDrivers, updateDriver } from '../models/driverModel.js';
import { emitDriverUpdated } from '../services/socketService.js';

export const createDriverHandler = async (req, res) => {
  try {
    const { name, phone, carNumber, password } = req.body;
    if (!name || !phone || !carNumber || !password) {
      return res.status(400).json({ message: 'name, phone, carNumber, password are required' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const driver = await createDriver({ name, phone, carNumber, passwordHash });
    emitDriverUpdated(driver);
    return res.status(201).json(driver);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create driver', detail: error.message });
  }
};

export const listDriversHandler = async (_req, res) => {
  try {
    const drivers = await listDrivers();
    return res.json(drivers);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list drivers', detail: error.message });
  }
};

export const updateDriverHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, carNumber, active, status } = req.body;

    const payload = {
      name,
      phone,
      car_number: carNumber,
      active,
      status,
    };

    const updated = await updateDriver(Number(id), payload);
    if (!updated) return res.status(404).json({ message: 'Driver not found or no changes provided' });

    emitDriverUpdated(updated);
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update driver', detail: error.message });
  }
};

export const deactivateDriverHandler = async (req, res) => {
  req.body.active = false;
  return updateDriverHandler(req, res);
};
