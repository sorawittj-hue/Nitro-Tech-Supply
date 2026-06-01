import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Agent } from '../data/agents';
import type { AffiliateData, FinanceData, InventoryItem, OrderItem } from '../context/AppContext';
import type { ConsoleLog } from '../components/SystemConsole';
import { transport } from '../transport';

interface UseAgentEventsOptions {
  setAgents: Dispatch<SetStateAction<Agent[]>>;
  setInventory: Dispatch<SetStateAction<InventoryItem[]>>;
  setOrders: Dispatch<SetStateAction<OrderItem[]>>;
  setFinance: Dispatch<SetStateAction<FinanceData | null>>;
  setAffiliate: Dispatch<SetStateAction<AffiliateData | null>>;
  addLog: (type: ConsoleLog['type'], message: string) => void;
}

export function useAgentEvents(options: UseAgentEventsOptions) {
  const [isConnected, setIsConnected] = useState<boolean>(transport.isConnected());
  const [lastEventAt, setLastEventAt] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribeConnection = transport.onConnectionChange(setIsConnected);
    const unsubscribeMessage = transport.onMessage(message => {
      setLastEventAt(Date.now());

      switch (message.type) {
        case 'agent.status':
          options.setAgents(prev => prev.map(agent => agent.id === message.agentId
            ? {
                ...agent,
                status: message.status,
                isLive: message.isLive ?? agent.isLive,
                lastActiveAt: message.lastActiveAt ?? Date.now(),
              }
            : agent
          ));
          break;
        case 'agent.token.usage':
          options.setAgents(prev => prev.map(agent => agent.id === message.agentId
            ? {
                ...agent,
                inputTokens: message.inputTokens,
                outputTokens: message.outputTokens,
                lastActiveAt: Date.now(),
              }
            : agent
          ));
          break;
        case 'agent.log':
          options.addLog(message.level, message.message);
          break;
        case 'inventory.update':
          options.setInventory(message.inventory);
          break;
        case 'order.update':
          options.setOrders(message.orders);
          break;
        case 'capital.update':
          if (message.finance) options.setFinance(message.finance);
          if (message.affiliate) options.setAffiliate(message.affiliate);
          break;
        default:
          break;
      }
    });

    transport.send({ type: 'webview.ready', timestamp: Date.now() });

    return () => {
      unsubscribeMessage();
      unsubscribeConnection();
    };
  }, [options]);

  return { isConnected, lastEventAt };
}
