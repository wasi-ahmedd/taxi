import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findAdminByPhone } from '../models/adminModel.js';
import { findDriverByPhone } from '../models/driverModel.js';
import { env } from '../config/env.js';

export const login = async (req, res) => {
  try {
    const { phone, password, role } = req.body;

    if (!phone || !password || !role) {
      return res.status(400).json({ message: 'phone, password and role are required' });
    }

    if (role === 'admin') {
      const admin = await findAdminByPhone(phone);
      if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

      const ok = await bcrypt.compare(password, admin.password_hash);
      if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

      const token = jwt.sign({ id: admin.id, role: 'admin', name: admin.name }, env.jwtSecret, {
        expiresIn: '12h',
      });

      return res.json({ token, user: { id: admin.id, name: admin.name, phone: admin.phone, role: 'admin' } });
    }

    if (role === 'driver') {
      const driver = await findDriverByPhone(phone);
      if (!driver) return res.status(401).json({ message: 'Invalid credentials' });

      const ok = await bcrypt.compare(password, driver.password_hash);
      if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

      const token = jwt.sign({ id: driver.id, role: 'driver', name: driver.name }, env.jwtSecret, {
        expiresIn: '12h',
      });

      return res.json({
        token,
        user: { id: driver.id, name: driver.name, phone: driver.phone, role: 'driver', status: driver.status },
      });
    }

    return res.status(400).json({ message: 'role must be admin or driver' });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', detail: error.message });
  }
};
