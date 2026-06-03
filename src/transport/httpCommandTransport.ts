import type { ClientMessage } from '../protocol/messages';
import type { MessageTransport } from './types';

const MAX_RETRY_ATTEMPTS = 3;

export class HttpCommandTransport implements MessageTransport {
  private readonly endpoint: string;
  private readonly commandQueue: ClientMessage[] = [];
  private readonly connectionHandlers = new Set<(isConnected: boolean) => void>();
  private connected = false;
  private flushing = false;
  private disposed = false;

  constructor(baseUrl: string) {
    this.endpoint = `${baseUrl.replace(/\/$/, '')}/api/transport/messages`;
    void this.checkHealth();
  }

  send(message: ClientMessage): void {
    if (this.disposed) return;
    this.commandQueue.push(message);
    void this.flushQueue();
  }

  onMessage(): () => void {
    return () => {};
  }

  onConnectionChange(handler: (isConnected: boolean) => void): () => void {
    this.connectionHandlers.add(handler);
    handler(this.connected);
    return () => this.connectionHandlers.delete(handler);
  }

  isConnected(): boolean {
    return this.connected;
  }

  dispose(): void {
    this.disposed = true;
    this.commandQueue.length = 0;
    this.setConnected(false);
  }

  private async checkHealth(): Promise<void> {
    try {
      const healthUrl = this.endpoint.replace('/api/transport/messages', '/health');
      const response = await fetch(healthUrl, { method: 'GET' });
      this.setConnected(response.ok);
    } catch (error) {
      console.warn('Nitro HTTP command transport health check failed:', error);
      this.setConnected(false);
    }
  }

  private async flushQueue(): Promise<void> {
    if (this.flushing || this.disposed) return;
    this.flushing = true;

    try {
      while (this.commandQueue.length > 0 && !this.disposed) {
        const message = this.commandQueue[0];
        const delivered = await this.deliver(message);
        if (!delivered) break;
        this.commandQueue.shift();
      }
    } finally {
      this.flushing = false;
    }
  }

  private async deliver(message: ClientMessage): Promise<boolean> {
    for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt += 1) {
      try {
        const token = readWriteToken();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) headers['X-Nitro-Write-Token'] = token;

        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(message),
        });

        if (response.ok) {
          this.setConnected(true);
          return true;
        }

        const text = await response.text().catch(() => '');
        console.warn(`Nitro HTTP command transport rejected ${message.type}: ${response.status} ${text}`);
        this.setConnected(false);
        return false;
      } catch (error) {
        console.warn(`Nitro HTTP command transport failed ${message.type}:`, error);
        this.setConnected(false);
        await delay(Math.min(1000 * 2 ** attempt, 5000));
      }
    }

    return false;
  }

  private setConnected(nextConnected: boolean): void {
    if (this.connected === nextConnected) return;
    this.connected = nextConnected;
    this.connectionHandlers.forEach(handler => handler(nextConnected));
  }
}

function readWriteToken(): string {
  try {
    return sessionStorage.getItem('nitro-tech:data-write-token') || '';
  } catch {
    return '';
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
