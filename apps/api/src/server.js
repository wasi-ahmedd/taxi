import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';
import { setSocket } from './services/socketService.js';

const app = createApp();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.corsOrigin,
  },
});

io.on('connection', (socket) => {
  socket.on('driver:join', (driverId) => {
    socket.join(`driver:${driverId}`);
  });
});

setSocket(io);

server.listen(env.port, () => {
  console.log(`API running on http://localhost:${env.port}`);
});

process.on('SIGTERM', async () => {
  await pool.end();
  server.close(() => process.exit(0));
});
