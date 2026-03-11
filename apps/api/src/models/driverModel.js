import { query } from '../config/db.js';

export const createDriver = async ({ name, phone, carNumber, passwordHash }) => {
  const result = await query(
    `INSERT INTO drivers (name, phone, car_number, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, phone, car_number, status, active, created_at`,
    [name, phone, carNumber, passwordHash],
  );

  return result.rows[0];
};

export const listDrivers = async () => {
  const result = await query(
    'SELECT id, name, phone, car_number, status, active, created_at FROM drivers ORDER BY created_at DESC',
  );
  return result.rows;
};

export const updateDriver = async (id, fields) => {
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

  const result = await query(
    `UPDATE drivers SET ${updates.join(', ')} WHERE id = $${idx}
     RETURNING id, name, phone, car_number, status, active, created_at`,
    values,
  );

  return result.rows[0] || null;
};

export const findDriverByPhone = async (phone) => {
  const result = await query('SELECT * FROM drivers WHERE phone = $1 AND active = true LIMIT 1', [phone]);
  return result.rows[0] || null;
};

export const findDriverById = async (id) => {
  const result = await query('SELECT id, name, phone, car_number, status, active, created_at FROM drivers WHERE id = $1', [id]);
  return result.rows[0] || null;
};
