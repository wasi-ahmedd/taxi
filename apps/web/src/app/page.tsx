'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

type Role = 'admin' | 'driver';

type Session = {
  token: string;
  user: {
    id: number;
    name: string;
    role: Role;
  };
};

type Driver = {
  id: number;
  name: string;
};

type Trip = {
  id: number;
  customer_name: string;
  pickup_location: string;
  destination: string;
  assigned_driver_id: number | null;
  driver_name?: string;
  status: 'requested' | 'accepted' | 'started' | 'completed' | 'cancelled';
};

type ReportPayload = {
  summary: {
    total_trips: string;
    total_revenue: string;
    total_driver_earnings: string;
    total_owner_earnings: string;
  };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const statusActions: Partial<Record<Trip['status'], 'accept' | 'start' | 'complete'>> = {
  requested: 'accept',
  accepted: 'start',
  started: 'complete',
};

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('admin');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [message, setMessage] = useState('');
  const [fareByTrip, setFareByTrip] = useState<Record<number, string>>({});

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${session?.token}`,
      'Content-Type': 'application/json',
    }),
    [session],
  );

  const loadAdminData = useCallback(async () => {
    const [driversRes, tripsRes, reportRes] = await Promise.all([
      fetch(`${API_URL}/drivers`, { headers: authHeaders }),
      fetch(`${API_URL}/trips`, { headers: authHeaders }),
      fetch(`${API_URL}/reports/summary`, { headers: authHeaders }),
    ]);

    if (driversRes.ok) setDrivers(await driversRes.json());
    if (tripsRes.ok) setTrips(await tripsRes.json());
    if (reportRes.ok) setReport(await reportRes.json());
  }, [authHeaders]);

  const loadDriverData = useCallback(async () => {
    if (!session) return;
    const tripsRes = await fetch(`${API_URL}/trips?driverId=${session.user.id}`, { headers: authHeaders });
    if (tripsRes.ok) setTrips(await tripsRes.json());
  }, [authHeaders, session]);

  useEffect(() => {
    if (!session) return;

    const refreshData = async () => {
      if (session.user.role === 'admin') {
        await loadAdminData();
      } else {
        await loadDriverData();
      }
    };

    void refreshData();
  }, [session, loadAdminData, loadDriverData]);

  const login = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');

    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password, role }),
    });
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.message || 'Login failed');
      return;
    }

    setSession(data);
  };

  const createTrip = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const assignedDriverIdValue = form.get('assignedDriverId') as string;

    const payload = {
      customerName: form.get('customerName'),
      pickupLocation: form.get('pickupLocation'),
      destination: form.get('destination'),
      assignedDriverId: Number(assignedDriverIdValue),
    };

    const res = await fetch(`${API_URL}/trips`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setMessage('Trip created');
      e.currentTarget.reset();
      await loadAdminData();
    }
  };

  const assignDriver = async (tripId: number, assignedDriverId: number) => {
    await fetch(`${API_URL}/trips/${tripId}/assign`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ assignedDriverId }),
    });
    await loadAdminData();
  };

  const moveTrip = async (trip: Trip) => {
    const action = statusActions[trip.status];
    if (!action) return;

    const payload: { fare?: number } = {};
    if (action === 'complete') {
      payload.fare = Number(fareByTrip[trip.id] || 0);
    }

    await fetch(`${API_URL}/trips/${trip.id}/${action}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify(payload),
    });

    if (session?.user.role === 'admin') {
      await loadAdminData();
    } else {
      await loadDriverData();
    }
  };

  if (!session) {
    return (
      <main className="mx-auto mt-20 max-w-md rounded border p-6">
        <h1 className="mb-4 text-2xl font-bold">Taxi Fleet Login</h1>
        <form onSubmit={login} className="space-y-3">
          <input className="w-full rounded border p-2" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input
            className="w-full rounded border p-2"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <select className="w-full rounded border p-2" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="admin">Admin</option>
            <option value="driver">Driver</option>
          </select>
          <button className="w-full rounded bg-black p-2 text-white" type="submit">
            Login
          </button>
        </form>
        {message && <p className="mt-2 text-sm text-red-600">{message}</p>}
      </main>
    );
  }

  return (
    <main className="mx-auto my-8 max-w-6xl space-y-6 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{session.user.role === 'admin' ? 'Admin Dashboard' : 'Driver Dashboard'}</h1>
        <button className="rounded border px-3 py-1" onClick={() => setSession(null)}>
          Logout
        </button>
      </header>

      {session.user.role === 'admin' && (
        <section className="rounded border p-4">
          <h2 className="mb-3 font-semibold">Create Trip</h2>
          <form onSubmit={createTrip} className="grid gap-2 md:grid-cols-4">
            <input name="customerName" className="rounded border p-2" placeholder="Customer" required />
            <input name="pickupLocation" className="rounded border p-2" placeholder="Pickup" required />
            <input name="destination" className="rounded border p-2" placeholder="Destination" required />
            <select name="assignedDriverId" className="rounded border p-2" required>
              <option value="">Assign Driver</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>
            <button className="rounded bg-black p-2 text-white md:col-span-4" type="submit">
              Create
            </button>
          </form>
        </section>
      )}

      {session.user.role === 'admin' && report && (
        <section className="rounded border p-4">
          <h2 className="mb-3 font-semibold">Reports</h2>
          <p>Total Trips: {report.summary.total_trips}</p>
          <p>Total Revenue: ₹{report.summary.total_revenue}</p>
          <p>Driver Earnings: ₹{report.summary.total_driver_earnings}</p>
          <p>Owner Earnings: ₹{report.summary.total_owner_earnings}</p>
        </section>
      )}

      <section className="rounded border p-4">
        <h2 className="mb-3 font-semibold">Trips</h2>
        <div className="space-y-2">
          {trips.map((trip) => (
            <div key={trip.id} className="rounded border p-3">
              <p>
                #{trip.id} {trip.customer_name} — {trip.pickup_location} to {trip.destination}
              </p>
              <p className="text-sm">Status: {trip.status} | Driver: {trip.driver_name || trip.assigned_driver_id || 'Unassigned'}</p>

              {session.user.role === 'admin' && !trip.assigned_driver_id && (
                <select
                  className="mt-2 rounded border p-1"
                  onChange={(e) => assignDriver(trip.id, Number(e.target.value))}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Assign Driver
                  </option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              )}

              {statusActions[trip.status] && (
                <div className="mt-2 flex gap-2">
                  {statusActions[trip.status] === 'complete' && (
                    <input
                      className="rounded border p-1"
                      placeholder="Fare"
                      value={fareByTrip[trip.id] || ''}
                      onChange={(e) => setFareByTrip((prev) => ({ ...prev, [trip.id]: e.target.value }))}
                    />
                  )}
                  <button className="rounded bg-black px-3 py-1 text-white" onClick={() => moveTrip(trip)}>
                    {statusActions[trip.status]}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
      {message && <p>{message}</p>}
    </main>
  );
}
