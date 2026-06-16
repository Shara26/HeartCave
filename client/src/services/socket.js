import { io } from 'socket.io-client';
import { getAccessToken } from './api.js';

// Single shared socket. We (re)connect with the current access token. The
// backend authenticates the handshake via socket.handshake.auth.token.
let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io('/', {
      autoConnect: false,
      withCredentials: true,
      auth: { token: getAccessToken() },
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  s.auth = { token: getAccessToken() };
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
