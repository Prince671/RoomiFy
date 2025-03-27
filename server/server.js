const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this for production
    methods: ["GET", "POST"]
  }
});

const rooms = new Map(); // Store room data
const ROOM_PASSWORD = "admin123"; // Hardcoded for simplicity, use a database in production

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { users: new Set(), messages: [] });
    }
    const room = rooms.get(roomId);
    room.users.add(socket.id);
    io.to(roomId).emit('room-users', Array.from(room.users));
    socket.broadcast.to(roomId).emit('user-joined', socket.id);
  });

  socket.on('set-username', ({ roomId, userId, username }) => {
    socket.data.username = username;
    io.to(roomId).emit('username-update', { userId: socket.id, username });
  });

  socket.on('send-message', (data) => {
    const room = rooms.get(data.roomId);
    if (room) {
      room.messages.push(data);
      io.to(data.roomId).emit('receive-message', data);
    }
  });

  socket.on('typing', ({ roomId, senderId }) => {
    socket.broadcast.to(roomId).emit('typing', senderId);
  });

  socket.on('stop-typing', ({ roomId, senderId }) => {
    socket.broadcast.to(roomId).emit('stop-typing', senderId);
  });

  socket.on('play-video', (roomId, videoId, videoTitle) => {
    io.to(roomId).emit('play-video', videoId, videoTitle);
  });

  socket.on('pause-video', (roomId) => {
    io.to(roomId).emit('pause-video');
  });

  socket.on('message-selected', ({ roomId, messageId, senderId }) => {
    socket.broadcast.to(roomId).emit('message-selected', { messageId, senderId });
  });

  socket.on('message-deleted', ({ roomId, messageId, deleteFor, deletedBy }) => {
    const room = rooms.get(roomId);
    if (room) {
      if (deleteFor === "everyone") {
        room.messages = room.messages.map(msg => 
          msg.messageId === messageId ? { ...msg, type: "system", message: "This message was deleted" } : msg
        );
      } else {
        room.messages = room.messages.filter(msg => msg.messageId !== messageId);
      }
      io.to(roomId).emit('message-deleted', { messageId, deleteFor, deletedBy });
    }
  });

  socket.on('message-reaction', ({ roomId, messageId, userId, reaction }) => {
    io.to(roomId).emit('message-reaction', { messageId, userId, reaction });
  });

  socket.on('message-pinned', ({ roomId, messageId, isPinned }) => {
    io.to(roomId).emit('message-pinned', { messageId, isPinned });
  });

  socket.on('destroy-room', ({ roomId, password }) => {
    if (password === ROOM_PASSWORD) {
      const room = rooms.get(roomId);
      if (room) {
        io.to(roomId).emit('room-destroyed');
        rooms.delete(roomId);
        io.in(roomId).socketsLeave(roomId);
        console.log(`Room ${roomId} destroyed`);
      }
    } else {
      socket.emit('destroy-room-error', 'Incorrect password');
    }
  });

  socket.on('leave-room', (roomId) => {
    const room = rooms.get(roomId);
    if (room && room.users.has(socket.id)) {
      room.users.delete(socket.id);
      io.to(roomId).emit('user-left', socket.id);
      socket.leave(roomId);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    rooms.forEach((room, roomId) => {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);
        io.to(roomId).emit('user-left', socket.id);
        io.to(roomId).emit('room-users', Array.from(room.users));
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
