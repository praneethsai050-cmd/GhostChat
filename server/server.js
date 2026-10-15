const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e7 // 10MB to easily accommodate encrypted audio chunks
});

// State: Queue of waiting sockets & active pairs mapping
let waitingQueue = [];
const activePairs = new Map(); // socketId -> partnerSocketId

function removeFromQueue(socketId) {
  waitingQueue = waitingQueue.filter(id => id !== socketId);
}

function tryMatch(socket) {
  if (activePairs.has(socket.id)) {
    return;
  }

  removeFromQueue(socket.id);

  if (waitingQueue.length > 0) {
    const partnerId = waitingQueue.shift();
    const partnerSocket = io.sockets.sockets.get(partnerId);

    if (partnerSocket && partnerSocket.connected) {
      activePairs.set(socket.id, partnerId);
      activePairs.set(partnerId, socket.id);

      socket.emit('matched', { partnerId });
      partnerSocket.emit('matched', { partnerId: socket.id });
      console.log(`[MATCH] Paired ${socket.id} <--> ${partnerId}`);
      return;
    }
  }

  waitingQueue.push(socket.id);
  socket.emit('waiting');
  console.log(`[QUEUE] ${socket.id} joined waiting queue (Current queue size: ${waitingQueue.length})`);
}

function leaveChat(socket, notifyPartner = true) {
  removeFromQueue(socket.id);

  if (activePairs.has(socket.id)) {
    const partnerId = activePairs.get(socket.id);
    activePairs.delete(socket.id);
    activePairs.delete(partnerId);

    if (notifyPartner) {
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        partnerSocket.emit('partner_disconnected');
      }
    }
    console.log(`[UNPAIR] Disconnected ${socket.id} and ${partnerId}`);
  }
}

io.on('connection', (socket) => {
  console.log(`[CONNECT] User connected: ${socket.id}`);
  io.emit('online_count', io.engine.clientsCount);

  // Client requests to find a stranger
  socket.on('find_partner', () => {
    leaveChat(socket, true);
    tryMatch(socket);
  });

  // Client sends ECDH Public Key for E2EE key agreement
  socket.on('send_public_key', (data) => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        partnerSocket.emit('receive_public_key', { publicKey: data.publicKey });
      }
    }
  });

  // Relay encrypted payload (text or audio ciphertext + IV)
  socket.on('send_encrypted_payload', (payload) => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        partnerSocket.emit('receive_encrypted_payload', payload);
      }
    }
  });

  // Client typing status
  socket.on('typing', (isTyping) => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        partnerSocket.emit('partner_typing', isTyping);
      }
    }
  });

  // Client explicitly leaves
  socket.on('leave_chat', () => {
    leaveChat(socket, true);
    socket.emit('chat_left');
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log(`[DISCONNECT] User disconnected: ${socket.id}`);
    leaveChat(socket, true);
    io.emit('online_count', io.engine.clientsCount);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Anonymous E2EE chat server running on http://localhost:${PORT}`);
});
