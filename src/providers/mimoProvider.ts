import type { ChatMessage, ChatProvider, ChatProviderConfig } from './types';

interface CompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

export class MimoProvider implements ChatProvider {
  id = 'mimo' as const;
  label = 'MiMo AI';
  private readonly config: ChatProviderConfig;

  constructor(config: ChatProviderConfig) {
    this.config = config;
  }

  isConnected(): boolean {
    return Boolean(this.config.nitroProxyUrl || (this.config.mimoApiBaseUrl && this.config.mimoApiKey));
  }

  async sendMessage(history: ChatMessage[], systemPrompt: string): Promise<string> {
    if (!this.isConnected()) {
      throw new Error('MiMo API key is not configured.');
    }

    const endpoint = this.config.nitroProxyUrl
      ? `${this.config.nitroProxyUrl.replace(/\/$/, '')}/api/mimo/chat`
      : `${this.config.mimoApiBaseUrl.replace(/\/$/, '')}/chat/completions`;
    const headers: Record<string, string> = this.config.nitroProxyUrl
      ? { 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json', 'api-key': this.config.mimoApiKey };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.config.mimoModel || 'mimo-v2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.map(message => ({
            role: message.isUser ? 'user' : 'assistant',
            content: message.text,
          })),
        ],
        max_completion_tokens: 1024,
      }),
    });

    const payload = await parseCompletionResponse(response);
    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('MiMo returned an empty response.');
    }

    return content;
  }
}

async function parseCompletionResponse(response: Response): Promise<CompletionResponse> {
  const payload = await response.json().catch((): CompletionResponse => ({}));
  if (!response.ok) {
    throw new Error(payload.error?.message || `MiMo API returned ${response.status}`);
  }
  return payload;
}
