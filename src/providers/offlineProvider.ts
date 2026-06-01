import type { ChatProvider } from './types';

export class OfflineProvider implements ChatProvider {
  id = 'offline' as const;
  label = 'Offline';

  isConnected(): boolean {
    return false;
  }

  async sendMessage(): Promise<string> {
    throw new Error('No live AI provider is configured.');
  }
}
