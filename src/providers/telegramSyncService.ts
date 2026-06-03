import type { ChatMessage, ChatProviderConfig } from './types';
import { transport } from '../transport';

export type IncomingTelegramMessage = ChatMessage & {
  source: 'telegram';
};

interface RunsResponse {
  messages?: Array<{
    id?: string;
    role?: string;
    source?: string;
    sender?: string;
    text?: string;
    content?: string;
    created_at?: number;
    timestamp?: number;
  }>;
}

export class TelegramSyncService {
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private lastSeenAt = Date.now();
  private onNewMessage: ((msg: IncomingTelegramMessage) => void) | null = null;
  private unsubscribeTransport: (() => void) | null = null;
  private readonly seenMessageIds = new Set<string>();
  private readonly config: ChatProviderConfig;

  constructor(config: ChatProviderConfig) {
    this.config = config;
  }

  start(callback: (msg: IncomingTelegramMessage) => void): void {
    this.stop();
    this.onNewMessage = callback;
    this.unsubscribeTransport = transport.onMessage(message => {
      if (message.type !== 'telegram.message') return;
      const messageId = `telegram-${message.timestamp ?? message.text}`;
      if (this.seenMessageIds.has(messageId)) return;
      this.seenMessageIds.add(messageId);
      callback({
        id: messageId,
        sender: message.sender || 'Jay (Telegram)',
        avatar: '📱',
        text: message.text,
        time: message.time || new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        isUser: true,
        source: 'telegram',
      });
    });
    this.pollInterval = setInterval(() => {
      void this.poll();
    }, 5000);
  }

  stop(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = null;
    this.unsubscribeTransport?.();
    this.unsubscribeTransport = null;
    this.onNewMessage = null;
  }

  private async poll(): Promise<void> {
    if (!this.onNewMessage) return;

    const payload = await this.pollViaProxy() ?? await this.pollViaDirectHermes();
    if (!payload) return;

    this.processRunsResponse(payload);
  }

  private async pollViaProxy(): Promise<RunsResponse | null> {
    if (!this.config.nitroProxyUrl) return null;

    const baseUrl = this.config.nitroProxyUrl.replace(/\/$/, '');
    const health = await fetch(`${baseUrl}/api/hermes/health`).catch(() => null);
    if (!health?.ok) return null;

    const url = new URL(`${baseUrl}/api/hermes/runs`);
    url.searchParams.set('session_key', this.config.hermesSessionKey || 'nitro-tech-jay');
    url.searchParams.set('platform', 'telegram');
    url.searchParams.set('since', String(this.lastSeenAt));

    const response = await fetch(url).catch(() => null);
    if (!response?.ok) return null;
    return response.json().catch((): RunsResponse => ({})) as Promise<RunsResponse>;
  }

  private async pollViaDirectHermes(): Promise<RunsResponse | null> {
    if (!this.config.hermesApiUrl || !this.config.hermesApiKey) return null;
    const baseUrl = this.config.hermesApiUrl.replace(/\/$/, '');
    const health = await fetch(`${baseUrl}/v1/health`, {
      headers: { Authorization: `Bearer ${this.config.hermesApiKey}` },
    }).catch(() => null);
    if (!health?.ok) return null;

    const url = new URL(`${baseUrl}/v1/runs`);
    url.searchParams.set('session_key', this.config.hermesSessionKey || 'nitro-tech-jay');
    url.searchParams.set('platform', 'telegram');
    url.searchParams.set('since', String(this.lastSeenAt));

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.config.hermesApiKey}` },
    }).catch(() => null);
    if (!response?.ok) return null;

    return response.json().catch((): RunsResponse => ({})) as Promise<RunsResponse>;
  }

  private processRunsResponse(payload: RunsResponse): void {
    const messages = payload.messages ?? [];
    messages
      .filter(message => message.source === 'telegram' && message.role === 'user')
      .forEach(message => {
        const timestamp = message.timestamp ?? message.created_at ?? Date.now();
        const id = message.id || `telegram-${timestamp}-${message.text || message.content || ''}`;
        if (this.seenMessageIds.has(id)) return;
        this.seenMessageIds.add(id);
        this.lastSeenAt = Math.max(this.lastSeenAt, timestamp);
        this.onNewMessage?.({
          id,
          sender: message.sender || 'Jay (Telegram 📱)',
          avatar: '📱',
          text: message.text || message.content || '',
          time: new Date(timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          isUser: true,
          source: 'telegram',
        });
      });
  }
}
