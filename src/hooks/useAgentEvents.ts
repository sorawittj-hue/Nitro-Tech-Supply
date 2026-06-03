import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Agent } from '../data/agents';
import type {
  AffiliateData,
  ClaimRecord,
  CompanyAgentTask,
  CustomerRecord,
  FinanceData,
  InventoryItem,
  InvoiceRecord,
  OrderItem,
  PaymentRecord,
  PurchaseOrderRecord,
  QuoteRecord,
  ShipmentRecord,
  SupplierRecord,
} from '../context/AppContext';
import type { ConsoleLog } from '../components/SystemConsole';
import { transport } from '../transport';
import { canonicalAgentId } from '../lib/agentIdentity';

interface UseAgentEventsOptions {
  setAgents: Dispatch<SetStateAction<Agent[]>>;
  setInventory: Dispatch<SetStateAction<InventoryItem[]>>;
  setOrders: Dispatch<SetStateAction<OrderItem[]>>;
  setFinance: Dispatch<SetStateAction<FinanceData | null>>;
  setAffiliate: Dispatch<SetStateAction<AffiliateData | null>>;
  setCustomers: Dispatch<SetStateAction<CustomerRecord[]>>;
  setSuppliers: Dispatch<SetStateAction<SupplierRecord[]>>;
  setQuotes: Dispatch<SetStateAction<QuoteRecord[]>>;
  setInvoices: Dispatch<SetStateAction<InvoiceRecord[]>>;
  setPayments: Dispatch<SetStateAction<PaymentRecord[]>>;
  setPurchaseOrders: Dispatch<SetStateAction<PurchaseOrderRecord[]>>;
  setShipments: Dispatch<SetStateAction<ShipmentRecord[]>>;
  setClaims: Dispatch<SetStateAction<ClaimRecord[]>>;
  setCompanyAgentTasks: Dispatch<SetStateAction<CompanyAgentTask[]>>;
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
        case 'agent.status': {
          const agentId = canonicalAgentId(message.agentId);
          options.setAgents(prev => prev.map(agent => agent.id === agentId
            ? {
                ...agent,
                status: message.status,
                isLive: message.isLive ?? agent.isLive,
                lastActiveAt: message.lastActiveAt ?? Date.now(),
              }
            : agent
          ));
          break;
        }
        case 'agent.token.usage': {
          const agentId = canonicalAgentId(message.agentId);
          options.setAgents(prev => prev.map(agent => agent.id === agentId
            ? {
                ...agent,
                inputTokens: message.inputTokens,
                outputTokens: message.outputTokens,
                lastActiveAt: Date.now(),
              }
            : agent
          ));
          break;
        }
        case 'agent.task.start': {
          const agentId = canonicalAgentId(message.agentId);
          options.setAgents(prev => prev.map(agent => {
            if (agent.id !== agentId) return agent;
            const currentTools = agent.activeTools ?? [];
            const activeTools = currentTools.includes(message.taskId)
              ? currentTools
              : [...currentTools, message.taskId];
            return {
              ...agent,
              status: 'Working',
              isLive: true,
              isWaiting: true,
              activeTools,
              lastActiveAt: Date.now(),
            };
          }));
          options.addLog('INFO', `Hermes task started for ${agentId}: ${message.title}`);
          break;
        }
        case 'agent.task.done': {
          const agentId = canonicalAgentId(message.agentId);
          options.setAgents(prev => prev.map(agent => {
            if (agent.id !== agentId) return agent;
            const activeTools = (agent.activeTools ?? []).filter(taskId => taskId !== message.taskId);
            return {
              ...agent,
              status: activeTools.length > 0 ? 'Working' : 'Idle',
              isLive: true,
              isWaiting: activeTools.length > 0,
              activeTools,
              lastActiveAt: Date.now(),
            };
          }));
          options.addLog('INFO', `Hermes task completed for ${agentId}: ${message.result || message.taskId}`);
          break;
        }
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
        case 'business.records.update':
          if (message.customers) options.setCustomers(message.customers);
          if (message.suppliers) options.setSuppliers(message.suppliers);
          if (message.quotes) options.setQuotes(message.quotes);
          if (message.invoices) options.setInvoices(message.invoices);
          if (message.payments) options.setPayments(message.payments);
          if (message.purchaseOrders) options.setPurchaseOrders(message.purchaseOrders);
          if (message.shipments) options.setShipments(message.shipments);
          if (message.claims) options.setClaims(message.claims);
          if (message.agentTasks) options.setCompanyAgentTasks(message.agentTasks);
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
