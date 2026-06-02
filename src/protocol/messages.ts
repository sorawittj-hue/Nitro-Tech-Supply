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

export interface BaseMessage {
  type: string;
  timestamp?: number;
}

export interface AgentStatusMsg extends BaseMessage {
  type: 'agent.status';
  agentId: string;
  status: Agent['status'];
  isLive?: boolean;
  lastActiveAt?: number;
}

export interface AgentTaskStartMsg extends BaseMessage {
  type: 'agent.task.start';
  agentId: string;
  taskId: string;
  title: string;
}

export interface AgentTaskDoneMsg extends BaseMessage {
  type: 'agent.task.done';
  agentId: string;
  taskId: string;
  result?: string;
}

export interface AgentTokenUsageMsg extends BaseMessage {
  type: 'agent.token.usage';
  agentId: string;
  inputTokens: number;
  outputTokens: number;
}

export interface AgentLogMsg extends BaseMessage {
  type: 'agent.log';
  level: 'INFO' | 'TRADE' | 'CRITICAL' | 'WARN';
  message: string;
}

export interface TelegramMessageMsg extends BaseMessage {
  type: 'telegram.message';
  sender: string;
  text: string;
  time?: string;
}

export interface InventoryUpdateMsg extends BaseMessage {
  type: 'inventory.update';
  inventory: InventoryItem[];
}

export interface OrderUpdateMsg extends BaseMessage {
  type: 'order.update';
  orders: OrderItem[];
}

export interface CapitalUpdateMsg extends BaseMessage {
  type: 'capital.update';
  finance?: FinanceData;
  affiliate?: AffiliateData;
}

export interface BusinessRecordsUpdateMsg extends BaseMessage {
  type: 'business.records.update';
  customers?: CustomerRecord[];
  suppliers?: SupplierRecord[];
  quotes?: QuoteRecord[];
  invoices?: InvoiceRecord[];
  payments?: PaymentRecord[];
  purchaseOrders?: PurchaseOrderRecord[];
  shipments?: ShipmentRecord[];
  claims?: ClaimRecord[];
  agentTasks?: CompanyAgentTask[];
}

export type ServerMessage =
  | AgentStatusMsg
  | AgentTaskStartMsg
  | AgentTaskDoneMsg
  | AgentTokenUsageMsg
  | AgentLogMsg
  | TelegramMessageMsg
  | InventoryUpdateMsg
  | OrderUpdateMsg
  | CapitalUpdateMsg
  | BusinessRecordsUpdateMsg;

export interface WebviewReadyMsg extends BaseMessage {
  type: 'webview.ready';
}

export interface WakeAgentMsg extends BaseMessage {
  type: 'agent.wake';
  agentId: string;
}

export interface AssignTaskMsg extends BaseMessage {
  type: 'agent.task.assign';
  agentId: string;
  title: string;
  detail?: string;
}

export interface UpdateSkillMsg extends BaseMessage {
  type: 'agent.skill.update';
  agentId: string;
  individualSkill?: string;
  sharedSkill?: string;
}

export interface ChatSendMsg extends BaseMessage {
  type: 'chat.send';
  text: string;
  sessionKey?: string;
  source: 'dashboard';
}

export interface SaveLayoutMsg extends BaseMessage {
  type: 'layout.save';
  layout: Record<string, Agent['position']>;
}

export interface DiagnosticsRequestMsg extends BaseMessage {
  type: 'diagnostics.request';
}

export type ClientMessage =
  | WebviewReadyMsg
  | WakeAgentMsg
  | AssignTaskMsg
  | UpdateSkillMsg
  | ChatSendMsg
  | SaveLayoutMsg
  | DiagnosticsRequestMsg;

export function parseServerMessage(raw: string): ServerMessage | null {
  try {
    const parsed = JSON.parse(raw) as Partial<ServerMessage>;
    if (!parsed || typeof parsed.type !== 'string') return null;

    switch (parsed.type) {
      case 'agent.status':
      case 'agent.task.start':
      case 'agent.task.done':
      case 'agent.token.usage':
      case 'agent.log':
      case 'telegram.message':
      case 'inventory.update':
      case 'order.update':
      case 'capital.update':
      case 'business.records.update':
        return parsed as ServerMessage;
      default:
        return null;
    }
  } catch {
    return null;
  }
}
