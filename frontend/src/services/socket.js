import { io } from 'socket.io-client';
import { API_URL } from './api.js';

let socket = null;

export function connectSocket(token) {
  socket?.disconnect();
  socket = io(API_URL || undefined, { auth: { token } });
  return socket;
}

export const getSocket = () => socket;

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
