import { query } from '../config/db.js';

export const findAdminByPhone = async (phone) => {
  const result = await query('SELECT * FROM admins WHERE phone = $1 LIMIT 1', [phone]);
  return result.rows[0] || null;
};
