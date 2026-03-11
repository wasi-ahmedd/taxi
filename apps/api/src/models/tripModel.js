import { query } from '../config/db.js';

export const createTrip = async ({ customerName, pickupLocation, destination, assignedDriverId }) => {
  const result = await query(
    `INSERT INTO trips (customer_name, pickup_location, destination, assigned_driver_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [customerName, pickupLocation, destination, assignedDriverId || null],
  );
  return result.rows[0];
};

export const listTrips = async ({ driverId, from, to }) => {
  const where = [];
  const values = [];

  if (driverId) {
    values.push(driverId);
    where.push(`t.assigned_driver_id = $${values.length}`);
  }
  if (from) {
    values.push(from);
    where.push(`t.created_at >= $${values.length}`);
  }
  if (to) {
    values.push(to);
    where.push(`t.created_at <= $${values.length}`);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const result = await query(
    `SELECT t.*, d.name AS driver_name, d.phone AS driver_phone, d.car_number
     FROM trips t
     LEFT JOIN drivers d ON d.id = t.assigned_driver_id
     ${whereClause}
     ORDER BY t.created_at DESC`,
    values,
  );
  return result.rows;
};

export const findTripById = async (id) => {
  const result = await query('SELECT * FROM trips WHERE id = $1 LIMIT 1', [id]);
  return result.rows[0] || null;
};

export const updateTrip = async (id, fields) => {
  const updates = [];
  const values = [];
  let idx = 1;

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = $${idx}`);
      values.push(value);
      idx += 1;
    }
  });

  if (!updates.length) return null;

  values.push(id);

  const result = await query(`UPDATE trips SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, values);
  return result.rows[0] || null;
};
