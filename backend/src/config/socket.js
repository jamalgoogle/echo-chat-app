import { Server } from 'socket.io';

export function createSocketServer(httpServer, clientUrl) {
  return new Server(httpServer, {
    cors: { origin: clientUrl, credentials: true },
  });
}
