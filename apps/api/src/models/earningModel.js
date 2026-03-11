import { query } from '../config/db.js';

export const upsertEarning = async ({
  tripId,
  driverId,
  totalFare,
  ownerCommissionPercent,
  ownerEarning,
  driverEarning,
}) => {
  const result = await query(
    `INSERT INTO earnings (trip_id, driver_id, total_fare, owner_commission_percent, owner_earning, driver_earning)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (trip_id) DO UPDATE
     SET total_fare = EXCLUDED.total_fare,
         owner_commission_percent = EXCLUDED.owner_commission_percent,
         owner_earning = EXCLUDED.owner_earning,
         driver_earning = EXCLUDED.driver_earning
     RETURNING *`,
    [tripId, driverId, totalFare, ownerCommissionPercent, ownerEarning, driverEarning],
  );

  return result.rows[0];
};

export const getReportSummary = async () => {
  const result = await query(
    `SELECT
      COUNT(t.id) AS total_trips,
      COALESCE(SUM(t.fare), 0) AS total_revenue,
      COALESCE(SUM(e.driver_earning), 0) AS total_driver_earnings,
      COALESCE(SUM(e.owner_earning), 0) AS total_owner_earnings
     FROM trips t
     LEFT JOIN earnings e ON e.trip_id = t.id
     WHERE t.status = 'completed'`,
  );

  return result.rows[0];
};

export const getTripsByDriver = async () => {
  const result = await query(
    `SELECT d.id AS driver_id, d.name AS driver_name,
      COUNT(t.id) AS trips_completed,
      COALESCE(SUM(t.fare), 0) AS total_fare,
      COALESCE(SUM(e.driver_earning), 0) AS driver_earnings,
      COALESCE(SUM(e.owner_earning), 0) AS owner_earnings
     FROM drivers d
     LEFT JOIN trips t ON t.assigned_driver_id = d.id AND t.status = 'completed'
     LEFT JOIN earnings e ON e.trip_id = t.id
     GROUP BY d.id, d.name
     ORDER BY d.name ASC`,
  );

  return result.rows;
};

export const getMonthlyReport = async () => {
  const result = await query(
    `SELECT TO_CHAR(DATE_TRUNC('month', t.created_at), 'YYYY-MM') AS month,
      COUNT(t.id) AS trips_completed,
      COALESCE(SUM(t.fare), 0) AS total_fare,
      COALESCE(SUM(e.driver_earning), 0) AS driver_earnings,
      COALESCE(SUM(e.owner_earning), 0) AS owner_earnings
     FROM trips t
     LEFT JOIN earnings e ON e.trip_id = t.id
     WHERE t.status = 'completed'
     GROUP BY DATE_TRUNC('month', t.created_at)
     ORDER BY DATE_TRUNC('month', t.created_at) DESC`,
  );

  return result.rows;
};
