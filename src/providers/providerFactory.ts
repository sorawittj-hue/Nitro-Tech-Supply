import { HermesProvider } from './hermesProvider';
import { MimoProvider } from './mimoProvider';
import { OfflineProvider } from './offlineProvider';
import type { ChatProvider, ChatProviderConfig, ChatProviderId } from './types';

export function createChatProvider(id: ChatProviderId, config: ChatProviderConfig): ChatProvider {
  if (id === 'hermes') return new HermesProvider(config);
  if (id === 'mimo') return new MimoProvider(config);
  return new OfflineProvider();
}

export async function testHermesConnection(config: ChatProviderConfig): Promise<boolean> {
  return new HermesProvider(config).checkHealth();
}
