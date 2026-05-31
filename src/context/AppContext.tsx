import { createContext, useContext } from 'react';
import type { Agent } from '../data/agents';
import type { ConsoleLog } from '../components/SystemConsole';

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
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  detail: string;
}

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
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
  geminiApiKey: string;
  geminiModel: string;
  auditLog: AuditEntry[];
  toasts: ToastItem[];
  retryCount: number;
  inventory: InventoryItem[];
  orders: OrderItem[];
  affiliate: AffiliateData | null;
  finance: FinanceData | null;
  loadingData: boolean;
  lastUpdated: string;
  isOffline: boolean;
}

export interface AppContextValue extends AppState {
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  setSelectedAgent: React.Dispatch<React.SetStateAction<Agent | null>>;
  setLogs: React.Dispatch<React.SetStateAction<ConsoleLog[]>>;
  setProjectProgress: React.Dispatch<React.SetStateAction<number>>;
  setNappingAgentAlert: React.Dispatch<React.SetStateAction<Agent | null>>;
  setActivePanel: React.Dispatch<React.SetStateAction<string>>;
  setSharedSkillText: React.Dispatch<React.SetStateAction<string>>;
  setCurrentTime: React.Dispatch<React.SetStateAction<string>>;
  setGeminiApiKey: React.Dispatch<React.SetStateAction<string>>;
  setGeminiModel: React.Dispatch<React.SetStateAction<string>>;
  setRetryCount: React.Dispatch<React.SetStateAction<number>>;
  setIsOffline: React.Dispatch<React.SetStateAction<boolean>>;
  addLog: (type: ConsoleLog['type'], message: string) => void;
  handleUpdateAgent: (updatedAgent: Agent) => void;
  handleWakeAgent: (agent: Agent) => void;
  togglePanel: (panel: string) => void;
  addAuditLog: (action: string, detail: string) => void;
  addToast: (type: ToastItem['type'], message: string) => void;
  removeToast: (id: string) => void;
  refreshAllData: () => Promise<void>;
  adjustStock: (item: InventoryItem, delta: number) => Promise<void>;
  saveInventoryItem: (item: Omit<InventoryItem, 'id'> & { id?: string }) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
