CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drivers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  car_number VARCHAR(20) NOT NULL,
  password_hash TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  pickup_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  assigned_driver_id INT REFERENCES drivers(id),
  fare NUMERIC(10,2),
  status VARCHAR(20) NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'started', 'completed', 'cancelled')),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS earnings (
  id SERIAL PRIMARY KEY,
  trip_id INT UNIQUE NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  driver_id INT NOT NULL REFERENCES drivers(id),
  total_fare NUMERIC(10,2) NOT NULL,
  owner_commission_percent NUMERIC(5,2) NOT NULL,
  owner_earning NUMERIC(10,2) NOT NULL,
  driver_earning NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trips_driver ON trips(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at);
