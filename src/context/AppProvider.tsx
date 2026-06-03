import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import type { Agent } from '../data/agents';
import { initialAgents } from '../data/agents';
import type { ConsoleLog } from '../components/SystemConsole';
import { testHermesConnection as testHermesProviderConnection } from '../providers/providerFactory';
import type { ChatProviderConfig, ChatProviderId } from '../providers/types';
import { useAgentEvents } from '../hooks/useAgentEvents';
import { transport } from '../transport';
import {
  parseAffiliateData,
  parseAuditLogData,
  parseClaimData,
  parseCompanyAgentTaskData,
  parseCustomerData,
  parseFinanceData,
  parseInventoryData,
  parseInvoiceData,
  parseNitroHealthStatus,
  parseOrderData,
  parsePaymentData,
  parsePurchaseOrderData,
  parseQuoteData,
  parseShipmentData,
  parseSupplierData,
} from '../lib/businessDataValidators';
import { canonicalAgentId } from '../lib/agentIdentity';
import { 
  AppContext, 
  type InventoryItem, 
  type OrderItem, 
  type AffiliateData, 
  type FinanceData, 
  type NitroHealthStatus,
  type CustomerRecord,
  type SupplierRecord,
  type QuoteRecord,
  type InvoiceRecord,
  type PaymentRecord,
  type PurchaseOrderRecord,
  type ShipmentRecord,
  type ClaimRecord,
  type CompanyAgentTask,
  type BusinessCollection,
  type AuditEntry, 
  type ToastItem,
  type AppContextValue 
} from './AppContext';

let toastCounter = 0;

export function AppProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>(() => loadAgentLayout(initialAgents));
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [projectProgress, setProjectProgress] = useState<number>(0);
  const [nappingAgentAlert, setNappingAgentAlert] = useState<Agent | null>(null);
  const [activePanel, setActivePanel] = useState<string>('none');
  const [sharedSkillText, setSharedSkillText] = useState<string>(initialAgents[0]?.sharedSkill || '');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [aiApiKey, setAiApiKey] = useState<string>(() => import.meta.env.VITE_MIMO_API_KEY || '');
  const [aiModel, setAiModel] = useState<string>(() => localStorage.getItem('mimoModel') || 'mimo-v2.5-pro');
  const [hermesConfig, setHermesConfig] = useState<ChatProviderConfig>(() => loadHermesConfig());
  const [chatProvider, setChatProvider] = useState<ChatProviderId>(() => loadChatProvider(import.meta.env.VITE_NITRO_PROXY_URL, import.meta.env.VITE_HERMES_API_URL, import.meta.env.VITE_HERMES_API_KEY, import.meta.env.VITE_MIMO_API_KEY));
  const [hermesConnected, setHermesConnected] = useState<boolean>(false);
  const [debugMode, setDebugMode] = useState<boolean>(() => localStorage.getItem('nitro-tech:debug-mode') === 'true');
  const [dataWriteToken, setDataWriteToken] = useState<string>(() => sessionStorage.getItem('nitro-tech:data-write-token') || '');
  const [nitroHealth, setNitroHealth] = useState<NitroHealthStatus | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Unified database states
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [finance, setFinance] = useState<FinanceData | null>(null);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRecord[]>([]);
  const [shipments, setShipments] = useState<ShipmentRecord[]>([]);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [companyAgentTasks, setCompanyAgentTasks] = useState<CompanyAgentTask[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('—');
  const [isOffline, setIsOffline] = useState<boolean>(false);

  // Logs state, initialized cleanly
  const [logs, setLogs] = useState<ConsoleLog[]>(() => {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    return [
      { timestamp: ts, type: 'INFO', message: 'Nitro Tech Supply OS started.' },
      { timestamp: ts, type: 'INFO', message: 'Waiting for real business data from backend.' },
      { timestamp: ts, type: 'INFO', message: 'MiMo AI integration is configured from environment/settings.' },
    ];
  });

  const apiBase = resolveApiBase(import.meta.env.VITE_API_BASE_URL);

  // Base logging and notification functions (must be declared first)
  const addLog = useCallback((type: ConsoleLog['type'], message: string) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [...prev.slice(-50), { timestamp, type, message }]);
  }, []);

  const addAuditLog = useCallback((action: string, detail: string) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setAuditLog(prev => [...prev.slice(-200), { id: Date.now().toString(), timestamp, action, detail }]);
  }, []);

  const addToast = useCallback((type: ToastItem['type'], message: string) => {
    const id = `toast-${++toastCounter}`;
    setToasts(prev => [...prev.slice(-4), { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const eventOptions = useMemo(() => ({
    setAgents,
    setInventory,
    setOrders,
    setFinance,
    setAffiliate,
    setCustomers,
    setSuppliers,
    setQuotes,
    setInvoices,
    setPayments,
    setPurchaseOrders,
    setShipments,
    setClaims,
    setCompanyAgentTasks,
    addLog,
  }), [addLog]);

  const { isConnected: transportConnected, lastEventAt: lastAgentEventAt } = useAgentEvents(eventOptions);

  const refreshNitroHealth = useCallback(async (): Promise<NitroHealthStatus | null> => {
    try {
      const health = await fetchJson(`${apiBase}/health`, parseNitroHealthStatus, 'Nitro health');
      setNitroHealth(health);
      return health;
    } catch (error) {
      console.warn('Failed to fetch Nitro health:', error);
      setNitroHealth(null);
      return null;
    }
  }, [apiBase]);

  // Fetch all endpoints with defensive checks to avoid SyntaxError for HTML responses
  const refreshAllData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [
        invData,
        ordData,
        affData,
        finData,
        customerData,
        supplierData,
        quoteData,
        invoiceData,
        paymentData,
        purchaseOrderData,
        shipmentData,
        claimData,
        agentTaskData,
        auditLogData,
      ] = await Promise.all([
        fetchJson(`${apiBase}/inventory`, parseInventoryData, 'Inventory'),
        fetchJson(`${apiBase}/orders`, parseOrderData, 'Orders'),
        fetchJson(`${apiBase}/affiliate`, parseAffiliateData, 'Affiliate'),
        fetchJson(`${apiBase}/finance`, parseFinanceData, 'Finance'),
        fetchJson(`${apiBase}/customers`, parseCustomerData, 'Customers'),
        fetchJson(`${apiBase}/suppliers`, parseSupplierData, 'Suppliers'),
        fetchJson(`${apiBase}/quotes`, parseQuoteData, 'Quotes'),
        fetchJson(`${apiBase}/invoices`, parseInvoiceData, 'Invoices'),
        fetchJson(`${apiBase}/payments`, parsePaymentData, 'Payments'),
        fetchJson(`${apiBase}/purchaseOrders`, parsePurchaseOrderData, 'Purchase orders'),
        fetchJson(`${apiBase}/shipments`, parseShipmentData, 'Shipments'),
        fetchJson(`${apiBase}/claims`, parseClaimData, 'Claims'),
        fetchJson(`${apiBase}/agentTasks`, parseCompanyAgentTaskData, 'Agent tasks'),
        fetchJson(`${apiBase}/auditLogs`, parseAuditLogData, 'Audit logs'),
      ]);

      setInventory(invData);
      setOrders(ordData);
      setAffiliate(affData);
      setFinance(finData);
      setCustomers(customerData);
      setSuppliers(supplierData);
      setQuotes(quoteData);
      setInvoices(invoiceData);
      setPayments(paymentData);
      setPurchaseOrders(purchaseOrderData);
      setShipments(shipmentData);
      setClaims(claimData);
      setCompanyAgentTasks(agentTaskData);
      setAuditLog(auditLogData.slice(-200));
      setIsOffline(false);
      
      const ts = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      setLastUpdated(ts);
    } catch (err) {
      console.warn('Failed to fetch data from backend:', err);
      setIsOffline(true);
      setInventory([]);
      setOrders([]);
      setAffiliate(null);
      setFinance(null);
      setCustomers([]);
      setSuppliers([]);
      setQuotes([]);
      setInvoices([]);
      setPayments([]);
      setPurchaseOrders([]);
      setShipments([]);
      setClaims([]);
      setCompanyAgentTasks([]);
      setAuditLog([]);
      
      const ts = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      setLastUpdated(`${ts} (Offline)`);
    } finally {
      setLoadingData(false);
    }
  }, [apiBase]);

  // Load data async in useEffect to avoid cascading render lint errors
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (active) {
        await refreshAllData();
        await refreshNitroHealth();
      }
    };
    load();
    return () => { active = false; };
  }, [refreshAllData, refreshNitroHealth]);

  useEffect(() => {
    let active = true;
    const check = async () => {
      if (active) {
        await refreshNitroHealth();
      }
    };
    void check();
    const interval = setInterval(() => {
      void check();
    }, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [refreshNitroHealth]);

  // Inventory actions with offline local handling
  const adjustStock = useCallback(async (item: InventoryItem, delta: number) => {
    const newStock = Math.max(0, item.stock + delta);
    if (isOffline) {
      const offlineItem = { ...item, stock: newStock };
      setInventory(prev => prev.map(i => i.id === item.id ? offlineItem : i));
      addLog('WARN', `📦 ปรับสต็อก (Offline) ${item.name}: ${item.stock} → ${newStock}`);
      addAuditLog('Stock Adjust (Offline)', `${item.name} ${item.stock} → ${newStock} locally`);
      addToast('warning', `${item.name}: ${item.stock} → ${newStock} (โหมดออฟไลน์)`);
      return;
    }
    try {
      const res = await fetch(`${apiBase}/inventory/${item.id}`, {
        method: 'PUT',
        headers: buildWriteHeaders(dataWriteToken),
        body: JSON.stringify({ ...item, stock: newStock }),
      });
      if (!res.ok) throw new Error('Failed to update stock');
      const saved = await res.json();
      setInventory(prev => prev.map(i => i.id === item.id ? saved : i));
      addLog('INFO', `📦 ปรับสต็อก ${item.name}: ${item.stock} → ${newStock}`);
      addAuditLog('Stock Adjust', `${item.name} ${item.stock} → ${newStock}`);
      addToast('info', `${item.name}: ${item.stock} → ${newStock}`);
    } catch (err) {
      console.warn('Backend offline, adjusting stock locally:', err);
      setIsOffline(true);
      const offlineItem = { ...item, stock: newStock };
      setInventory(prev => prev.map(i => i.id === item.id ? offlineItem : i));
      addLog('WARN', `📦 ปรับสต็อก (Offline) ${item.name}: ${item.stock} → ${newStock}`);
      addAuditLog('Stock Adjust (Offline)', `${item.name} ${item.stock} → ${newStock} locally`);
      addToast('warning', `${item.name}: ${item.stock} → ${newStock} (โหมดออฟไลน์)`);
    }
  }, [apiBase, dataWriteToken, isOffline, setIsOffline, addLog, addAuditLog, addToast]);

  const saveInventoryItem = useCallback(async (item: Omit<InventoryItem, 'id'> & { id?: string }) => {
    if (isOffline) {
      if (item.id) {
        const offlineItem = item as InventoryItem;
        setInventory(prev => prev.map(i => i.id === item.id ? offlineItem : i));
        addLog('WARN', `📝 อัปเดตสต็อก (Offline) ${item.name} → ${item.stock} units`);
        addAuditLog('Inventory Update (Offline)', `${item.name} stock ${item.stock} locally`);
        addToast('warning', `อัปเดต ${item.name} สำเร็จ (โหมดออฟไลน์)`);
      } else {
        const offlineItem = { ...item, id: Date.now().toString() } as InventoryItem;
        setInventory(prev => [...prev, offlineItem]);
        addLog('WARN', `🆕 เพิ่มสินค้าใหม่ (Offline): ${offlineItem.name}`);
        addAuditLog('Inventory Create (Offline)', `New item ${offlineItem.name} locally`);
        addToast('warning', `เพิ่มสินค้า ${offlineItem.name} สำเร็จ (โหมดออฟไลน์)`);
      }
      return;
    }
    try {
      let saved: InventoryItem;
      if (item.id) {
        const res = await fetch(`${apiBase}/inventory/${item.id}`, {
          method: 'PUT',
          headers: buildWriteHeaders(dataWriteToken),
          body: JSON.stringify(item),
        });
        if (!res.ok) throw new Error('Failed to update inventory item');
        saved = await res.json();
        setInventory(prev => prev.map(i => i.id === item.id ? saved : i));
        addLog('INFO', `📝 อัปเดตสต็อก ${saved.name} → ${saved.stock} units`);
        addAuditLog('Inventory Update', `${saved.name} stock ${saved.stock}`);
        addToast('success', `อัปเดต ${saved.name} สำเร็จ`);
      } else {
        const newItem = { ...item, id: Date.now().toString() };
        const res = await fetch(`${apiBase}/inventory`, {
          method: 'POST',
          headers: buildWriteHeaders(dataWriteToken),
          body: JSON.stringify(newItem),
        });
        if (!res.ok) throw new Error('Failed to create inventory item');
        saved = await res.json();
        setInventory(prev => [...prev, saved]);
        addLog('INFO', `🆕 เพิ่มสินค้าใหม่: ${saved.name}`);
        addAuditLog('Inventory Create', `New item ${saved.name}`);
        addToast('success', `เพิ่มสินค้า ${saved.name} สำเร็จ`);
      }
    } catch (err) {
      console.warn('Backend offline, saving locally:', err);
      setIsOffline(true);
      if (item.id) {
        const offlineItem = item as InventoryItem;
        setInventory(prev => prev.map(i => i.id === item.id ? offlineItem : i));
        addLog('WARN', `📝 อัปเดตสต็อก (Offline) ${item.name} → ${item.stock} units`);
        addAuditLog('Inventory Update (Offline)', `${item.name} stock ${item.stock} locally`);
        addToast('warning', `อัปเดต ${item.name} สำเร็จ (โหมดออฟไลน์)`);
      } else {
        const offlineItem = { ...item, id: Date.now().toString() } as InventoryItem;
        setInventory(prev => [...prev, offlineItem]);
        addLog('WARN', `🆕 เพิ่มสินค้าใหม่ (Offline): ${offlineItem.name}`);
        addAuditLog('Inventory Create (Offline)', `New item ${offlineItem.name} locally`);
        addToast('warning', `เพิ่มสินค้า ${offlineItem.name} สำเร็จ (โหมดออฟไลน์)`);
      }
    }
  }, [apiBase, dataWriteToken, isOffline, setIsOffline, addLog, addAuditLog, addToast]);

  const deleteInventoryItem = useCallback(async (id: string) => {
    if (isOffline) {
      setInventory(prev => prev.filter(i => i.id !== id));
      addLog('WARN', `🗑️ ลบสินค้าออกจากคลัง (Offline) ${id}`);
      addAuditLog('Inventory Delete (Offline)', `Deleted ${id} locally`);
      addToast('warning', 'ลบสินค้าสำเร็จ (โหมดออฟไลน์)');
      return;
    }
    try {
      const res = await fetch(`${apiBase}/inventory/${id}`, {
        method: 'DELETE',
        headers: buildWriteHeaders(dataWriteToken),
      });
      if (!res.ok) throw new Error('Failed to delete inventory item');
      setInventory(prev => prev.filter(i => i.id !== id));
      addLog('INFO', `🗑️ ลบสินค้าออกจากคลัง ${id}`);
      addAuditLog('Inventory Delete', `Deleted ${id}`);
      addToast('success', 'ลบสินค้าสำเร็จ');
    } catch (err) {
      console.warn('Backend offline, deleting locally:', err);
      setIsOffline(true);
      setInventory(prev => prev.filter(i => i.id !== id));
      addLog('WARN', `🗑️ ลบสินค้าออกจากคลัง (Offline) ${id}`);
      addAuditLog('Inventory Delete (Offline)', `Deleted ${id} locally`);
      addToast('warning', 'ลบสินค้าสำเร็จ (โหมดออฟไลน์)');
    }
  }, [apiBase, dataWriteToken, isOffline, setIsOffline, addLog, addAuditLog, addToast]);

  const createBusinessRecord = useCallback(async <TRecord extends Record<string, unknown>>(
    collection: BusinessCollection,
    record: TRecord
  ): Promise<TRecord> => {
    const response = await fetch(`${apiBase}/${collection}`, {
      method: 'POST',
      headers: buildWriteHeaders(dataWriteToken),
      body: JSON.stringify(record),
    });

    if (!response.ok) {
      const payload = await response.json().catch((): { error?: { message?: string } } => ({}));
      throw new Error(payload.error?.message || `${collection} API returned status ${response.status}`);
    }

    const saved = await response.json() as TRecord;
    addAuditLog('Business Record Create', `${collection}: ${String(record.id ?? 'new')}`);
    addLog('INFO', `Created ${collection} record ${String(record.id ?? 'new')}`);
    await refreshAllData();
    return saved;
  }, [addAuditLog, addLog, apiBase, dataWriteToken, refreshAllData]);

  const updateBusinessRecord = useCallback(async <TRecord extends Record<string, unknown>>(
    collection: BusinessCollection,
    id: string,
    patch: Partial<TRecord>
  ): Promise<TRecord> => {
    const response = await fetch(`${apiBase}/${collection}/${id}`, {
      method: 'PATCH',
      headers: buildWriteHeaders(dataWriteToken),
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      const payload = await response.json().catch((): { error?: { message?: string } } => ({}));
      throw new Error(payload.error?.message || `${collection}/${id} API returned status ${response.status}`);
    }

    const saved = await response.json() as TRecord;
    addAuditLog('Business Record Update', `${collection}: ${id}`);
    addLog('INFO', `Updated ${collection} record ${id}`);
    await refreshAllData();
    return saved;
  }, [addAuditLog, addLog, apiBase, dataWriteToken, refreshAllData]);

  useEffect(() => {
    localStorage.setItem('mimoModel', aiModel);
  }, [aiModel]);

  useEffect(() => {
    localStorage.setItem('nitro-tech:hermes-config', JSON.stringify(hermesConfig));
  }, [hermesConfig]);

  useEffect(() => {
    localStorage.setItem('nitro-tech:chat-provider', chatProvider);
  }, [chatProvider]);

  useEffect(() => {
    localStorage.setItem('nitro-tech:debug-mode', String(debugMode));
  }, [debugMode]);

  useEffect(() => {
    if (dataWriteToken) {
      sessionStorage.setItem('nitro-tech:data-write-token', dataWriteToken);
    } else {
      sessionStorage.removeItem('nitro-tech:data-write-token');
    }
  }, [dataWriteToken]);

  const testHermesConnection = useCallback(async () => {
    const ok = await testHermesProviderConnection(hermesConfig);
    setHermesConnected(ok);
    addToast(ok ? 'success' : 'error', ok ? 'Hermes Connected' : 'Hermes Connection Failed');
    addLog(ok ? 'INFO' : 'WARN', ok ? 'Hermes API health check passed' : 'Hermes API health check failed');
    return ok;
  }, [addLog, addToast, hermesConfig]);

  useEffect(() => {
    let active = true;
    const check = async () => {
      const ok = await testHermesProviderConnection(hermesConfig);
      if (!active) return;
      setHermesConnected(ok);
      if (ok && chatProvider === 'offline') {
        setChatProvider('hermes');
      }
      if (!ok && chatProvider === 'hermes' && aiApiKey) {
        setChatProvider('mimo');
        addToast('warning', 'Hermes offline, switched to MiMo fallback');
      }
    };
    void check();
    const interval = setInterval(check, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [addToast, aiApiKey, chatProvider, hermesConfig]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateAgent = useCallback((updatedAgent: Agent) => {
    const previous = agents.find(a => a.id === updatedAgent.id);
    setAgents(prev => prev.map(a => a.id === updatedAgent.id ? updatedAgent : a));

    if (previous && previous.status !== updatedAgent.status) {
      const logType = updatedAgent.status === 'Napping' ? 'CRITICAL' : 'INFO';
      addLog(logType, `สถานะ "${updatedAgent.name}": ${previous.status} → ${updatedAgent.status}`);
      if (previous.status === 'Napping' && updatedAgent.status === 'Working') {
        if (nappingAgentAlert?.id === updatedAgent.id) setNappingAgentAlert(null);
        addLog('INFO', `✅ ปลุก "${updatedAgent.name}" สำเร็จ — กลับมาทำงานแล้ว`);
        addToast('success', `ปลุก ${updatedAgent.name} สำเร็จ`);
      }
    } else {
      addLog('INFO', `📝 อัปเดต skill.md ของ "${updatedAgent.name}"`);
    }

    addAuditLog('Agent Update', `Updated ${updatedAgent.name}: status=${updatedAgent.status}`);
    if (selectedAgent?.id === updatedAgent.id) setSelectedAgent(updatedAgent);
  }, [agents, nappingAgentAlert, selectedAgent, addLog, addAuditLog, addToast]);

  const handleWakeAgent = useCallback((agent: Agent) => {
    handleUpdateAgent({ ...agent, status: 'Working' });
    transport.send({
      type: 'agent.wake',
      agentId: agent.id,
      timestamp: Date.now(),
    });
  }, [handleUpdateAgent]);

  const togglePanel = useCallback((panel: string) => {
    setActivePanel(prev => prev === panel ? 'none' : panel);
  }, []);

  const value: AppContextValue = {
    agents,
    selectedAgent,
    logs,
    projectProgress,
    nappingAgentAlert,
    activePanel,
    sharedSkillText,
    currentTime,
    aiApiKey,
    aiModel,
    auditLog,
    toasts,
    retryCount,
    inventory,
    orders,
    affiliate,
    finance,
    customers,
    suppliers,
    quotes,
    invoices,
    payments,
    purchaseOrders,
    shipments,
    claims,
    companyAgentTasks,
    loadingData,
    lastUpdated,
    isOffline,
    chatProvider,
    hermesConfig,
    hermesConnected,
    transportConnected,
    lastAgentEventAt,
    debugMode,
    dataWriteToken,
    nitroHealth,
    setAgents,
    setSelectedAgent,
    setLogs,
    setProjectProgress,
    setNappingAgentAlert,
    setActivePanel,
    setSharedSkillText,
    setCurrentTime,
    setAiApiKey,
    setAiModel,
    setRetryCount,
    setIsOffline,
    setChatProvider,
    setHermesConfig,
    setHermesConnected,
    setDebugMode,
    setDataWriteToken,
    addLog,
    handleUpdateAgent,
    handleWakeAgent,
    togglePanel,
    addAuditLog,
    addToast,
    removeToast,
    refreshAllData,
    refreshNitroHealth,
    adjustStock,
    saveInventoryItem,
    deleteInventoryItem,
    createBusinessRecord,
    updateBusinessRecord,
    testHermesConnection,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function loadAgentLayout(defaultAgents: Agent[]): Agent[] {
  try {
    const raw = localStorage.getItem('nitro-tech:layout') || localStorage.getItem('nitro-agent-layout');
    if (!raw) return defaultAgents;
    const saved = JSON.parse(raw) as Record<string, Agent['position']>;
    return defaultAgents.map(agent => {
      const position = saved[agent.id] ?? findLegacyPosition(saved, agent.id);
      if (!position?.left || !position?.top) return agent;
      return { ...agent, position };
    });
  } catch (error) {
    console.warn('Could not load saved agent layout:', error);
    return defaultAgents;
  }
}

function findLegacyPosition(saved: Record<string, Agent['position']>, canonicalId: string): Agent['position'] | undefined {
  const legacyEntry = Object.entries(saved).find(([agentId]) => canonicalAgentId(agentId) === canonicalId);
  return legacyEntry?.[1];
}

function loadHermesConfig(): ChatProviderConfig {
  const envConfig: ChatProviderConfig = {
    mimoApiBaseUrl: import.meta.env.VITE_MIMO_API_BASE_URL || 'https://api.xiaomimimo.com/v1',
    mimoApiKey: import.meta.env.VITE_MIMO_API_KEY || '',
    mimoModel: localStorage.getItem('mimoModel') || 'mimo-v2.5-pro',
    hermesApiUrl: import.meta.env.VITE_HERMES_API_URL || '',
    hermesApiKey: import.meta.env.VITE_HERMES_API_KEY || '',
    hermesSessionKey: import.meta.env.VITE_HERMES_SESSION_KEY || 'nitro-tech-jay',
    nitroProxyUrl: import.meta.env.VITE_NITRO_PROXY_URL || (import.meta.env.DEV ? 'http://localhost:8787' : getBrowserOrigin()),
  };

  try {
    const raw = localStorage.getItem('nitro-tech:hermes-config');
    if (!raw) return envConfig;
    const saved = JSON.parse(raw) as Partial<ChatProviderConfig>;
    return { ...envConfig, ...saved };
  } catch (error) {
    console.warn('Could not load Hermes config:', error);
    return envConfig;
  }
}

function getBrowserOrigin(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

function resolveApiBase(envApiBase?: string): string {
  const configured = envApiBase?.trim() ?? '';
  if (import.meta.env.DEV) {
    return configured || 'http://localhost:3030';
  }
  if (!configured || isLocalhostUrl(configured)) {
    return getBrowserOrigin();
  }
  return configured;
}

async function fetchJson<T>(url: string, parser: (value: unknown) => T, label: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${label} API returned status ${response.status} (${response.statusText})`);
  }
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`${label} API returned non-JSON content-type: "${contentType}"`);
  }
  return parser(await response.json());
}

function buildWriteHeaders(dataWriteToken: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (dataWriteToken) {
    headers['X-Nitro-Write-Token'] = dataWriteToken;
  }
  return headers;
}

function isLocalhostUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

function loadChatProvider(proxyUrl?: string, hermesUrl?: string, hermesKey?: string, mimoKey?: string): ChatProviderId {
  const saved = localStorage.getItem('nitro-tech:chat-provider');
  if (saved === 'hermes' || saved === 'mimo' || saved === 'offline') return saved;
  if (proxyUrl) return 'hermes';
  if (hermesUrl && hermesKey) return 'hermes';
  if (mimoKey) return 'mimo';
  return 'offline';
}
