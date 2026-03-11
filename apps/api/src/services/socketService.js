let io;

export const setSocket = (serverIo) => {
  io = serverIo;
};

export const emitTripUpdated = (trip) => {
  if (!io) return;
  io.emit('trip:updated', trip);
  if (trip.assigned_driver_id) {
    io.to(`driver:${trip.assigned_driver_id}`).emit('driver:trip-updated', trip);
  }
};

export const emitDriverUpdated = (driver) => {
  if (!io) return;
  io.emit('driver:updated', driver);
};
