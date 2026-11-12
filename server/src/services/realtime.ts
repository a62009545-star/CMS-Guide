import type { Server as HttpServer } from 'node:http';
import { parse as parseCookie } from 'cookie';
import { Server } from 'socket.io';
import { REALTIME_EVENT, type ContentEvent } from '@cms/shared';
import { env } from '../config/env.js';
import { isStaff, userFromToken } from '../middleware/auth.js';

let io: Server | null = null;

export function initRealtime(server: HttpServer) {
  io = new Server(server, {
    path: '/socket.io',
    cors: { origin: env.corsOrigins, credentials: true },
  });

  // Authenticate the socket with the same httpOnly JWT cookie as the REST API.
  io.use(async (socket, next) => {
    const cookies = parseCookie(socket.handshake.headers.cookie ?? '');
    const user = await userFromToken(cookies[env.COOKIE_NAME]);
    if (!user) return next(new Error('unauthorized'));
    socket.data.user = user;
    next();
  });

  io.on('connection', (socket) => {
    socket.join('all');
    if (isStaff(socket.data.user)) socket.join('staff');
  });

  return io;
}

/** Push a content change to connected clients. Draft-only changes go to editors/admins only. */
export function broadcast(event: ContentEvent) {
  if (!io) return;
  io.to(event.visibleToViewers ? 'all' : 'staff').emit(REALTIME_EVENT, event);
}
