const { Server } = require("socket.io");

function setupSocketIO(httpServer) {
  const io = new Server(httpServer, {
   cors: {
    origin: "https://meetapp-frontend-z33b.onrender.com",
    methods: ["GET", "POST"],
    credentials: true,
  },
  });

  const rooms = {};
  const userMeta = {};
  const mediaState = {};

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', ({ roomId, userId, displayName, isCameraOn, isMicOn }) => {
      socket.join(roomId);
      userMeta[socket.id] = { userId, displayName, roomId, isCameraOn, isMicOn };

      if (!rooms[roomId]) rooms[roomId] = [];

      rooms[roomId] = rooms[roomId].filter(u => u.userId !== userId);
      rooms[roomId].push({ socketId: socket.id, userId, displayName });

      const usersInRoom = rooms[roomId]
        .filter(u => u.userId !== userId)
        .map(u => ({ userId: u.userId, displayName: u.displayName }));

      socket.emit('all-users', usersInRoom);

      socket.to(roomId).emit('user-joined', {
        callerID: socket.id,
        displayName,
        userId,
        isCameraOn,
        isMicOn,
      });
    });

    socket.on('sending-signal', payload => {
      console.log(`Server: forwarding signal from ${socket.id} to ${payload.userToSignal}`);

      const senderName = userMeta[socket.id]?.displayName || "Anonymous";
      const roomId = userMeta[socket.id]?.roomId;

      if (!roomId) {
        console.error(`Room ID not found for socket ${socket.id}`);
        return;
      }

      const targetSocket = rooms[roomId]?.find(u => u.socketId === payload.userToSignal);

      if (targetSocket) {
        io.to(payload.userToSignal).emit('sending-signal', {
          signal: payload.signal,
          callerID: payload.callerID,
          displayName: senderName,
        });
      } else {
        console.error(`Target socket ${payload.userToSignal} not found in room ${roomId}`);
      }
    });

    socket.on('returning-signal', payload => {
      console.log(`Server: returning signal from ${socket.id} to ${payload.callerID}`);

      const returnerName = userMeta[socket.id]?.displayName || "Anonymous";

      io.to(payload.callerID).emit('receiving-returned-signal', {
        signal: payload.signal,
        id: socket.id,
        displayName: returnerName,
      });
    });

    socket.on('media-toggle', ({ userId, mic, camera }) => {
      const roomId = userMeta[socket.id]?.roomId;
      if (!roomId) {
        console.error(`Room ID not found for media-toggle from socket ${socket.id}`);
        return;
      }

      mediaState[userId] = { mic, camera };
      socket.broadcast.emit('media-toggle', { userId, mic, camera });
    });

    socket.on('disconnect', () => {
      const roomId = userMeta[socket.id]?.roomId;

      if (roomId) {
        rooms[roomId] = rooms[roomId].filter(user => user.socketId !== socket.id);
        delete mediaState[socket.id];
        socket.to(roomId).emit('user-left', { userId: userMeta[socket.id]?.userId });
      }

      delete userMeta[socket.id];
    });
  });

  console.log("✅ Socket.IO server ready");
  return io;
}

module.exports = setupSocketIO;