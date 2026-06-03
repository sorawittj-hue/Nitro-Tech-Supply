import { createContext, useContext } from 'react';
import type { Agent } from '../data/agents';
import type { ConsoleLog } from '../components/SystemConsole';
import type { ChatProviderConfig, ChatProviderId } from '../providers/types';

export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  threshold: number;
  price: number;
}

export interface OrderItem {
  id: string;
  customer: string;
  item: string;
  quantity: number;
  status: string;
  value: number;
  date: string;
}

export interface AffiliateData {
  totalClicks: number;
  conversions: number;
  revenueTHB: number;
}

export interface FinanceData {
  cashOnHand: number;
  accountsPayable?: number;
  weeklyReserveTarget?: number;
  monthlyOperatingExpense?: number;
  creditLineAvailable?: number;
}

export interface CustomerRecord {
  id: string;
  name: string;
  type: 'retail' | 'wholesale';
  status: 'lead' | 'active' | 'inactive';
  phone?: string;
  email?: string;
  taxId?: string;
  address?: string;
  totalSpendTHB: number;
  lastContactAt?: string;
}

export interface SupplierRecord {
  id: string;
  name: string;
  status: 'active' | 'watchlist' | 'inactive';
  contactName?: string;
  phone?: string;
  email?: string;
  leadTimeDays: number;
  paymentTerms: string;
  rating: number;
}

export type ApprovalStatus = 'not_required' | 'pending' | 'approved' | 'rejected';

export interface QuoteRecord {
  id: string;
  customerId: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
  description?: string;
  totalValue: number;
  grossMargin: number;
  createdAt: string;
  validUntil?: string;
}

export interface InvoiceRecord {
  id: string;
  customerId: string;
  orderId?: string;
  status: 'Draft' | 'Issued' | 'Paid' | 'Overdue' | 'Cancelled';
  description?: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  issuedAt?: string;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  method: 'cash' | 'bank_transfer' | 'card' | 'other';
  amount: number;
  paidAt: string;
  reference?: string;
}

export interface PurchaseOrderRecord {
  id: string;
  supplierId: string;
  status: 'Draft' | 'Approved' | 'Ordered' | 'Received' | 'Cancelled';
  description?: string;
  totalCost: number;
  createdAt: string;
  expectedAt?: string;
  approvalStatus?: ApprovalStatus;
  approvalReason?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface ShipmentRecord {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber?: string;
  status: 'Pending' | 'Packed' | 'Shipped' | 'Delivered' | 'Delayed';
  eta?: string;
}

export interface ClaimRecord {
  id: string;
  customerId: string;
  orderId?: string;
  item: string;
  status: 'Open' | 'Testing' | 'Approved' | 'Rejected' | 'Resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface CompanyAgentTask {
  id: string;
  agentId: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high';
  source: 'ceo' | 'hermes' | 'system';
  createdAt: string;
  dueAt?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  detail: string;
  method?: string;
  status?: number;
  sourceIp?: string;
}

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export interface NitroHealthStatus {
  status: string;
  service: string;
  dataWriteAuthConfigured: boolean;
  dataWriteAuthRequired: boolean;
  dataWriteAuthExplicitlyRequired?: boolean;
  auditLogEnabled?: boolean;
  checkedAt: string;
}

export interface AppState {
  agents: Agent[];
  selectedAgent: Agent | null;
  logs: ConsoleLog[];
  projectProgress: number;
  nappingAgentAlert: Agent | null;
  activePanel: string;
  sharedSkillText: string;
  currentTime: string;
  aiApiKey: string;
  aiModel: string;
  auditLog: AuditEntry[];
  toasts: ToastItem[];
  retryCount: number;
  inventory: InventoryItem[];
  orders: OrderItem[];
  affiliate: AffiliateData | null;
  finance: FinanceData | null;
  customers: CustomerRecord[];
  suppliers: SupplierRecord[];
  quotes: QuoteRecord[];
  invoices: InvoiceRecord[];
  payments: PaymentRecord[];
  purchaseOrders: PurchaseOrderRecord[];
  shipments: ShipmentRecord[];
  claims: ClaimRecord[];
  companyAgentTasks: CompanyAgentTask[];
  loadingData: boolean;
  lastUpdated: string;
  isOffline: boolean;
  chatProvider: ChatProviderId;
  hermesConfig: ChatProviderConfig;
  hermesConnected: boolean;
  transportConnected: boolean;
  lastAgentEventAt: number | null;
  debugMode: boolean;
  dataWriteToken: string;
  nitroHealth: NitroHealthStatus | null;
}

export type BusinessCollection =
  | 'customers'
  | 'suppliers'
  | 'quotes'
  | 'invoices'
  | 'payments'
  | 'purchaseOrders'
  | 'shipments'
  | 'claims'
  | 'agentTasks'
  | 'auditLogs'
  | 'chatMessages';

export interface AppContextValue extends AppState {
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  setSelectedAgent: React.Dispatch<React.SetStateAction<Agent | null>>;
  setLogs: React.Dispatch<React.SetStateAction<ConsoleLog[]>>;
  setProjectProgress: React.Dispatch<React.SetStateAction<number>>;
  setNappingAgentAlert: React.Dispatch<React.SetStateAction<Agent | null>>;
  setActivePanel: React.Dispatch<React.SetStateAction<string>>;
  setSharedSkillText: React.Dispatch<React.SetStateAction<string>>;
  setCurrentTime: React.Dispatch<React.SetStateAction<string>>;
  setAiApiKey: React.Dispatch<React.SetStateAction<string>>;
  setAiModel: React.Dispatch<React.SetStateAction<string>>;
  setRetryCount: React.Dispatch<React.SetStateAction<number>>;
  setIsOffline: React.Dispatch<React.SetStateAction<boolean>>;
  setChatProvider: React.Dispatch<React.SetStateAction<ChatProviderId>>;
  setHermesConfig: React.Dispatch<React.SetStateAction<ChatProviderConfig>>;
  setHermesConnected: React.Dispatch<React.SetStateAction<boolean>>;
  setDebugMode: React.Dispatch<React.SetStateAction<boolean>>;
  setDataWriteToken: React.Dispatch<React.SetStateAction<string>>;
  addLog: (type: ConsoleLog['type'], message: string) => void;
  handleUpdateAgent: (updatedAgent: Agent) => void;
  handleWakeAgent: (agent: Agent) => void;
  togglePanel: (panel: string) => void;
  addAuditLog: (action: string, detail: string) => void;
  addToast: (type: ToastItem['type'], message: string) => void;
  removeToast: (id: string) => void;
  refreshAllData: () => Promise<void>;
  refreshNitroHealth: () => Promise<NitroHealthStatus | null>;
  adjustStock: (item: InventoryItem, delta: number) => Promise<void>;
  saveInventoryItem: (item: Omit<InventoryItem, 'id'> & { id?: string }) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  createBusinessRecord: <TRecord extends Record<string, unknown>>(collection: BusinessCollection, record: TRecord) => Promise<TRecord>;
  updateBusinessRecord: <TRecord extends Record<string, unknown>>(
    collection: BusinessCollection,
    id: string,
    patch: Partial<TRecord>
  ) => Promise<TRecord>;
  testHermesConnection: () => Promise<boolean>;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
