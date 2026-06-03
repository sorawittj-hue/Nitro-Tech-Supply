import { WebSocketTransport } from './webSocketTransport';
import { HttpCommandTransport } from './httpCommandTransport';
import type { MessageTransport } from './types';

class OfflineTransport implements MessageTransport {
  send(): void {}

  onMessage(): () => void {
    return () => {};
  }

  onConnectionChange(handler: (isConnected: boolean) => void): () => void {
    handler(false);
    return () => {};
  }

  isConnected(): boolean {
    return false;
  }

  dispose(): void {}
}

const wsUrl = import.meta.env.VITE_WS_URL || '';
const wsToken = import.meta.env.VITE_WS_TOKEN || '';
const httpBaseUrl = import.meta.env.VITE_NITRO_PROXY_URL || (import.meta.env.DEV ? 'http://localhost:8787' : getBrowserOrigin());

export const transport: MessageTransport = wsUrl
  ? new WebSocketTransport(wsUrl, wsToken)
  : httpBaseUrl
  ? new HttpCommandTransport(httpBaseUrl)
  : new OfflineTransport();

function getBrowserOrigin(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}
