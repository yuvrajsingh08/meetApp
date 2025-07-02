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
      userMeta[socket.id] = { userId, displayName, roomId,  isCameraOn, isMicOn  };
    
      if (!rooms[roomId]) rooms[roomId] = [];
    
      rooms[roomId] = rooms[roomId].filter(u => u.userId !== userId);
      rooms[roomId].push({ socketId: socket.id, userId, displayName });
    
      // Send to the new user the list of existing users
      const usersInRoom = rooms[roomId]
        .filter(u => u.userId !== userId)
        .map(u => ({ userId: u.userId, displayName: u.displayName }));
    
      socket.emit('all-users', usersInRoom);
    
      // Notify existing users about the new user
      socket.to(roomId).emit('user-joined', {
        callerID: socket.id,
        displayName,
        userId,
        isCameraOn, 
        isMicOn ,
      });
    });
    
    socket.on('sending-signal', payload => {
      console.log(`Server: forwarding signal from ${socket.id} to ${payload.userToSignal}`);
    
      // Get sender's display name and roomId from userMeta
      const senderName = userMeta[socket.id]?.displayName || "Anonymous";
      const roomId = userMeta[socket.id]?.roomId;
    
      if (!roomId) {
        console.error(`Room ID not found for socket ${socket.id}`);
        return;
      }
    
      const targetSocket = rooms[roomId]?.find(u => u.socketId === payload.userToSignal);
    
      if (targetSocket) {
        io.to(payload.userToSignal).emit('user-joined', {
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

      // Get returner's display name
      const returnerName = userMeta[socket.id]?.displayName || "Anonymous";

      io.to(payload.callerID).emit('receiving-returned-signal', {
        signal: payload.signal,
        id: socket.id,
        displayName: returnerName,
      });
    });

    socket.on('media-toggle', ({ userId, mic, camera}) => {
      const roomId = userMeta[socket.id]?.roomId;
      if (!roomId) {
        console.error(`Room ID not found for media-toggle from socket ${socket.id}`);
        return;
      }
    
      // Save media state
      mediaState[userId] = { mic, camera };
      socket.broadcast.emit('media-toggle', { userId, mic, camera });
    });  

    socket.on('disconnect', () => {
      const roomId = userMeta[socket.id]?.roomId;
      
      if (roomId) {
        // Update your custom rooms object
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
