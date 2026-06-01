import { parseServerMessage, type ClientMessage, type ServerMessage } from '../protocol/messages';
import type { MessageTransport } from './types';

export class WebSocketTransport implements MessageTransport {
  private socket: WebSocket | null = null;
  private disposed = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private readonly outbox: ClientMessage[] = [];
  private readonly messageHandlers = new Set<(message: ServerMessage) => void>();
  private readonly connectionHandlers = new Set<(isConnected: boolean) => void>();
  private readonly url: string;
  private readonly token: string;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
    this.connect();
  }

  send(message: ClientMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      return;
    }
    this.outbox.push(message);
  }

  onMessage(handler: (message: ServerMessage) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onConnectionChange(handler: (isConnected: boolean) => void): () => void {
    this.connectionHandlers.add(handler);
    handler(this.isConnected());
    return () => this.connectionHandlers.delete(handler);
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  dispose(): void {
    this.disposed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.socket?.close();
    this.socket = null;
    this.outbox.length = 0;
    this.notifyConnection(false);
  }

  private connect(): void {
    if (this.disposed || !this.url) return;
    const socketUrl = this.token ? appendToken(this.url, this.token) : this.url;
    this.socket = new WebSocket(socketUrl);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.notifyConnection(true);
      while (this.outbox.length > 0 && this.socket?.readyState === WebSocket.OPEN) {
        const message = this.outbox.shift();
        if (message) this.socket.send(JSON.stringify(message));
      }
    };

    this.socket.onmessage = event => {
      if (typeof event.data !== 'string') return;
      const message = parseServerMessage(event.data);
      if (!message) return;
      this.messageHandlers.forEach(handler => handler(message));
    };

    this.socket.onclose = () => {
      this.notifyConnection(false);
      this.scheduleReconnect();
    };

    this.socket.onerror = () => {
      this.notifyConnection(false);
      this.socket?.close();
    };
  }

  private scheduleReconnect(): void {
    if (this.disposed) return;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30_000);
    this.reconnectAttempts += 1;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  private notifyConnection(isConnected: boolean): void {
    this.connectionHandlers.forEach(handler => handler(isConnected));
  }
}

function appendToken(url: string, token: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}
