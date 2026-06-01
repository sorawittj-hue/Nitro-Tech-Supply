import type { ChatMessage, ChatProvider, ChatProviderConfig } from './types';

/**
 * Hermes Agent Integration - discovered config:
 * API_SERVER_ENABLED: not set in ~/.hermes/.env
 * API_SERVER_PORT:    not set; default 8642 did not answer /v1/health
 * API_SERVER_HOST:    not set
 * Integration path:   B/C-ready; gateway is running, REST API must be enabled or proxied
 * Telegram:           configured
 * Hermes version:     0.14.0
 * Discovery date:     2026-06-01
 */

interface HermesCompletionResponse {
  choices?: Array<{
    delta?: {
      content?: string;
    };
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

export class HermesProvider implements ChatProvider {
  id = 'hermes' as const;
  label = 'Hermes Agent (AWS)';
  private readonly config: ChatProviderConfig;

  constructor(config: ChatProviderConfig) {
    this.config = config;
  }

  isConnected(): boolean {
    return Boolean(this.config.nitroProxyUrl || (this.config.hermesApiUrl && this.config.hermesApiKey));
  }

  async sendMessage(
    history: ChatMessage[],
    systemPrompt: string,
    options?: { stream?: boolean; onChunk?: (chunk: string) => void }
  ): Promise<string> {
    if (!this.isConnected()) {
      throw new Error('Hermes API URL or key is not configured.');
    }

    const endpoint = this.config.nitroProxyUrl
      ? `${this.config.nitroProxyUrl.replace(/\/$/, '')}/api/hermes/chat`
      : `${this.config.hermesApiUrl.replace(/\/$/, '')}/v1/chat/completions`;
    const headers: Record<string, string> = this.config.nitroProxyUrl
      ? {
          'Content-Type': 'application/json',
          'X-Hermes-Session-Key': this.config.hermesSessionKey || 'nitro-tech-jay',
        }
      : {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.hermesApiKey}`,
          'X-Hermes-Session-Key': this.config.hermesSessionKey || 'nitro-tech-jay',
        };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'hermes-agent',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.map(message => ({
            role: message.isUser ? 'user' : 'assistant',
            content: message.text,
          })),
        ],
        stream: options?.stream ?? false,
      }),
    });

    if (options?.stream) {
      return readStreamResponse(response, options.onChunk);
    }

    const payload = await parseHermesResponse(response);
    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('Hermes returned an empty response.');
    }
    return content;
  }

  async checkHealth(): Promise<boolean> {
    if (!this.config.hermesApiUrl && !this.config.nitroProxyUrl) return false;
    try {
      const endpoint = this.config.nitroProxyUrl
        ? `${this.config.nitroProxyUrl.replace(/\/$/, '')}/api/hermes/health`
        : `${this.config.hermesApiUrl.replace(/\/$/, '')}/v1/health`;
      const response = await fetch(endpoint, {
        headers: this.config.nitroProxyUrl || !this.config.hermesApiKey ? undefined : { Authorization: `Bearer ${this.config.hermesApiKey}` },
      });
      if (!response.ok) return false;
      const payload = await response.json().catch(() => null) as { status?: string } | null;
      return payload?.status === 'ok';
    } catch {
      return false;
    }
  }
}

async function parseHermesResponse(response: Response): Promise<HermesCompletionResponse> {
  const payload = await response.json().catch((): HermesCompletionResponse => ({}));
  if (!response.ok) {
    throw new Error(payload.error?.message || `Hermes API returned ${response.status}`);
  }
  return payload;
}

async function readStreamResponse(response: Response, onChunk?: (chunk: string) => void): Promise<string> {
  if (!response.ok) {
    const payload = await response.json().catch((): HermesCompletionResponse => ({}));
    throw new Error(payload.error?.message || `Hermes stream returned ${response.status}`);
  }
  if (!response.body) return '';

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const payload = JSON.parse(data) as HermesCompletionResponse;
        const content = payload.choices?.[0]?.delta?.content ?? '';
        if (content) {
          fullText += content;
          onChunk?.(content);
        }
      } catch {
        // Ignore malformed SSE fragments; the next chunk may complete the frame.
      }
    }
  }

  return fullText;
}
