export type ChatProviderId = 'hermes' | 'mimo' | 'offline';

export interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  time: string;
  isUser?: boolean;
  source?: 'dashboard' | 'telegram' | 'system';
}

export interface ChatProvider {
  id: ChatProviderId;
  label: string;
  isConnected(): boolean;
  sendMessage(
    history: ChatMessage[],
    systemPrompt: string,
    options?: { stream?: boolean; onChunk?: (chunk: string) => void }
  ): Promise<string>;
}

export interface ChatProviderConfig {
  mimoApiBaseUrl: string;
  mimoApiKey: string;
  mimoModel: string;
  hermesApiUrl: string;
  hermesApiKey: string;
  hermesSessionKey: string;
  nitroProxyUrl: string;
}
