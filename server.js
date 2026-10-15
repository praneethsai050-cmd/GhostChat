const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Serve frontend files
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Single waiting queue slot (from blueprint)
let waitingUser = null;

// Track active pairings: socket.id -> partner.id
const activePairs = new Map();

io.on('connection', (socket) => {
  console.log(`[CONNECT] User connected: ${socket.id}`);
  io.emit('online_count', io.engine.clientsCount);

  // Trigger pairing algorithm (Blueprint implementation)
  socket.on('find_partner', () => {
    // If user is already in an active pair, leave first
    handleDisconnect(socket, false);

    // If a user is already waiting and it's not the same person
    if (waitingUser && waitingUser !== socket.id) {
      const partnerId = waitingUser;
      waitingUser = null; // Clear the queue slot

      // Establish active pair tracking links
      activePairs.set(socket.id, partnerId);
      activePairs.set(partnerId, socket.id);

      // Notify both users they are connected
      io.to(socket.id).emit('chat_start', { role: 'stranger' });
      io.to(partnerId).emit('chat_start', { role: 'stranger' });

      console.log(`[MATCH] Paired: ${socket.id} with ${partnerId}`);
    } else {
      // No one is waiting; place this user in the queue
      waitingUser = socket.id;
      socket.emit('waiting', 'Searching for a stranger...');
      console.log(`[QUEUE] User ${socket.id} waiting in queue.`);
    }
  });

  // Relay messages between paired users
  socket.on('send_message', (message) => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('receive_message', message);
    }
  });

  // Relay typing indicator
  socket.on('typing', (isTyping) => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('partner_typing', isTyping);
    }
  });

  // Handle when a user leaves or disconnects
  function handleDisconnect(sock, notifyPartner = true) {
    const partnerId = activePairs.get(sock.id);
    activePairs.delete(sock.id);

    if (waitingUser === sock.id) {
      waitingUser = null;
    }

    if (partnerId) {
      activePairs.delete(partnerId);
      if (notifyPartner) {
        io.to(partnerId).emit('partner_disconnected', 'Stranger has disconnected.');
        console.log(`[DISCONNECT] Notified ${partnerId} that partner ${sock.id} left.`);
      }
    }
  }

  socket.on('disconnect_chat', () => {
    handleDisconnect(socket, true);
    socket.emit('chat_left');
  });

  socket.on('disconnect', () => {
    handleDisconnect(socket, true);
    io.emit('online_count', io.engine.clientsCount);
    console.log(`[DISCONNECT] User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 GhostChat server running smoothly on port ${PORT}`);
});
