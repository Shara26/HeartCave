import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/tokens.js';
import User from '../models/User.js';
import Match from '../models/Match.js';
import { persistMessage } from '../controllers/chatController.js';

// Tracks how many active sockets each user has → online/offline presence.
const onlineCounts = new Map();

const setOnline = (userId) => {
  onlineCounts.set(userId, (onlineCounts.get(userId) || 0) + 1);
  return onlineCounts.get(userId) === 1; // became online
};
const setOffline = (userId) => {
  const next = (onlineCounts.get(userId) || 1) - 1;
  if (next <= 0) {
    onlineCounts.delete(userId);
    return true; // went offline
  }
  onlineCounts.set(userId, next);
  return false;
};
export const isOnline = (userId) => onlineCounts.has(userId.toString());

export const initSockets = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Authenticate every socket with the access token.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token'));
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id);
      if (!user || user.isBanned) return next(new Error('Unauthorized'));
      socket.user = user;
      return next();
    } catch {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    const becameOnline = setOnline(userId);
    if (becameOnline) socket.broadcast.emit('online', { userId });

    // Join a private match room (only if a participant).
    socket.on('join-room', async ({ matchId }) => {
      const match = await Match.findById(matchId);
      if (!match || !match.includes(socket.user._id) || !match.isActive) {
        socket.emit('room-error', { message: 'Cannot join this conversation' });
        return;
      }
      socket.join(`match:${matchId}`);
      // Tell the new joiner whether the partner is currently online.
      const partnerId = match.partnerOf(socket.user._id).toString();
      socket.emit('presence', { userId: partnerId, online: isOnline(partnerId) });
    });

    socket.on('send-message', async ({ matchId, content }, ack) => {
      try {
        const match = await Match.findById(matchId);
        if (!match || !match.includes(socket.user._id) || !match.isActive) {
          if (ack) ack({ ok: false, error: 'Conversation unavailable' });
          return;
        }
        const { message, blocked } = await persistMessage({
          match,
          sender: socket.user,
          content,
        });

        if (blocked) {
          // Sender is told it was blocked; partner never receives it.
          if (ack) ack({ ok: false, blocked: true, error: 'Message blocked by safety policy' });
          socket.emit('message-blocked', { matchId });
          return;
        }

        const payload = {
          id: message._id,
          matchId,
          senderId: userId,
          content: message.content,
          read: false,
          createdAt: message.createdAt,
        };
        io.to(`match:${matchId}`).emit('receive-message', payload);
        if (ack) ack({ ok: true, message: payload });
      } catch (err) {
        if (ack) ack({ ok: false, error: 'Failed to send' });
      }
    });

    socket.on('typing', ({ matchId }) =>
      socket.to(`match:${matchId}`).emit('typing', { matchId, userId })
    );
    socket.on('stop-typing', ({ matchId }) =>
      socket.to(`match:${matchId}`).emit('stop-typing', { matchId, userId })
    );

    socket.on('message-read', ({ matchId }) =>
      socket.to(`match:${matchId}`).emit('message-read', { matchId, userId })
    );

    socket.on('disconnect', () => {
      const wentOffline = setOffline(userId);
      if (wentOffline) socket.broadcast.emit('offline', { userId });
    });
  });

  return io;
};

export default initSockets;
