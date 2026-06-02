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

interface PollingEndpoints {
  healthUrl: string;
  runsUrl: string;
  headers?: Record<string, string>;
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
      this.emitTelegramMessage({
        id: `telegram-${message.timestamp ?? Date.now()}`,
        sender: message.sender || 'Jay (Telegram)',
        text: message.text,
        timestamp: message.timestamp ?? Date.now(),
        time: message.time,
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
    if (!this.onNewMessage || !this.canPoll()) return;

    const endpoints = this.buildPollingEndpoints();
    const health = await fetch(endpoints.healthUrl, {
      headers: endpoints.headers,
    }).catch(() => null);
    if (!health?.ok) return;

    const url = new URL(endpoints.runsUrl);
    url.searchParams.set('session_key', this.config.hermesSessionKey || 'nitro-tech-jay');
    url.searchParams.set('platform', 'telegram');
    url.searchParams.set('since', String(this.lastSeenAt));

    const response = await fetch(url, {
      headers: endpoints.headers,
    }).catch(() => null);
    if (!response?.ok) return;

    const payload = await response.json().catch((): RunsResponse => ({})) as RunsResponse;
    const messages = payload.messages ?? [];
    messages
      .filter(message => message.source === 'telegram' && message.role === 'user')
      .forEach(message => {
        const timestamp = message.timestamp ?? message.created_at ?? Date.now();
        this.emitTelegramMessage({
          id: message.id || `telegram-${timestamp}`,
          sender: message.sender || 'Jay (Telegram)',
          text: message.text || message.content || '',
          timestamp,
        });
      });
  }

  private canPoll(): boolean {
    return Boolean(this.config.nitroProxyUrl || (this.config.hermesApiUrl && this.config.hermesApiKey));
  }

  private buildPollingEndpoints(): PollingEndpoints {
    if (this.config.nitroProxyUrl) {
      const baseUrl = this.config.nitroProxyUrl.replace(/\/$/, '');
      return {
        healthUrl: `${baseUrl}/api/hermes/health`,
        runsUrl: `${baseUrl}/api/hermes/runs`,
      };
    }

    const baseUrl = this.config.hermesApiUrl.replace(/\/$/, '');
    return {
      healthUrl: `${baseUrl}/v1/health`,
      runsUrl: `${baseUrl}/v1/runs`,
      headers: { Authorization: `Bearer ${this.config.hermesApiKey}` },
    };
  }

  private emitTelegramMessage(message: { id: string; sender: string; text: string; timestamp: number; time?: string }): void {
    if (!message.text.trim() || this.seenMessageIds.has(message.id)) return;
    this.seenMessageIds.add(message.id);
    this.lastSeenAt = Math.max(this.lastSeenAt, message.timestamp);
    this.onNewMessage?.({
      id: message.id,
      sender: message.sender,
      avatar: 'TG',
      text: message.text,
      time: message.time || new Date(message.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      isUser: true,
      source: 'telegram',
    });
  }
}
