import { io, Socket } from 'socket.io-client';

import { getPublicApiUrl } from './api';
import type { OrderPhase } from '../store/orderStore';

export type OrderRemotePatch = {
  id: string;
  phase: OrderPhase;
  riderLat: number;
  riderLng: number;
  restaurantName: string;
  totalINR: number;
};

let socket: Socket | null = null;
let lastOrigin: string | null = null;

function normalizedApiOrigin() {
  return getPublicApiUrl().replace(/\/$/, '');
}

function getSharedSocket() {
  const origin = normalizedApiOrigin();
  if (!socket || origin !== lastOrigin) {
    socket?.disconnect();
    lastOrigin = origin;
    socket = io(origin, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function subscribeOrderUpdates(
  orderId: string,
  onPatch: (patch: OrderRemotePatch) => void
): () => void {
  const instance = getSharedSocket();
  instance.emit('order:watch', orderId);

  const handler = (patch: OrderRemotePatch) => {
    if (patch?.id === orderId) onPatch(patch);
  };

  instance.on('order:update', handler);

  return () => {
    instance.emit('order:unwatch', orderId);
    instance.off('order:update', handler);
  };
}
