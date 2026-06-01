import { WebSocketTransport } from './webSocketTransport';
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

export const transport: MessageTransport = wsUrl
  ? new WebSocketTransport(wsUrl, wsToken)
  : new OfflineTransport();
