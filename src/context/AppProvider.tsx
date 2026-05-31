import { useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Agent } from '../data/agents';
import { initialAgents } from '../data/agents';
import type { ConsoleLog } from '../components/SystemConsole';
import { 
  AppContext, 
  type InventoryItem, 
  type OrderItem, 
  type AffiliateData, 
  type FinanceData, 
  type AuditEntry, 
  type ToastItem,
  type AppContextValue 
} from './AppContext';

const fallbackInventory: InventoryItem[] = [
  { id: '1', name: 'ASUS ROG RTX 4070 Ti', stock: 45, threshold: 20, price: 28900 },
  { id: '2', name: 'AMD Ryzen 7 7800X3D', stock: 12, threshold: 15, price: 14500 },
  { id: '3', name: 'Corsair Vengeance DDR5 32GB', stock: 8, threshold: 30, price: 4200 },
  { id: '4', name: 'Samsung 990 PRO 2TB', stock: 65, threshold: 20, price: 6500 }
];

const fallbackOrders: OrderItem[] = [
  { id: '1', customer: 'Advice IT (สาขาปิ่นเกล้า)', item: 'ASUS ROG RTX 4070 Ti', quantity: 10, status: 'Pending', date: '2026-05-31', value: 289000 },
  { id: '2', customer: 'JIB Computer Group', item: 'AMD Ryzen 7 7800X3D', quantity: 5, status: 'Shipped', date: '2026-05-30', value: 72500 },
  { id: '3', customer: 'Speed Computer', item: 'Samsung 990 PRO 2TB', quantity: 8, status: 'Delivered', date: '2026-05-28', value: 52000 },
  { id: '4', customer: 'iHaveCPU', item: 'Corsair Vengeance DDR5 32GB', quantity: 15, status: 'Delivered', date: '2026-05-26', value: 63000 },
  { id: '5', customer: 'Advice IT (สาขาพระราม 2)', item: 'ASUS ROG RTX 4070 Ti', quantity: 3, status: 'Delivered', date: '2026-05-24', value: 86700 },
  { id: '6', customer: 'JIB (สาขาเซ็นทรัลลาดพร้าว)', item: 'AMD Ryzen 7 7800X3D', quantity: 4, status: 'Delivered', date: '2026-05-22', value: 58000 }
];

const fallbackAffiliate: AffiliateData = {
  totalClicks: 12450,
  conversions: 892,
  revenueTHB: 154200.50
};

const fallbackFinance: FinanceData = {
  cashOnHand: 680000
};

let toastCounter = 0;

export function AppProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [projectProgress, setProjectProgress] = useState<number>(72);
  const [nappingAgentAlert, setNappingAgentAlert] = useState<Agent | null>(null);
  const [activePanel, setActivePanel] = useState<string>('none');
  const [sharedSkillText, setSharedSkillText] = useState<string>(initialAgents[0]?.sharedSkill || '');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => localStorage.getItem('geminiApiKey') || '');
  const [geminiModel, setGeminiModel] = useState<string>(() => localStorage.getItem('geminiModel') || 'gemini-3-flash-preview');
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Unified database states
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [finance, setFinance] = useState<FinanceData | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('—');

  // Logs state, initialized cleanly
  const [logs, setLogs] = useState<ConsoleLog[]>(() => {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    return [
      { timestamp: ts, type: 'INFO', message: 'ระบบ Nitro Tech Supply เริ่มต้นการทำงาน...' },
      { timestamp: ts, type: 'INFO', message: 'ตรวจสอบคลังสินค้า... สถานะ: พร้อมจัดส่ง 100%' },
      { timestamp: ts, type: 'INFO', message: 'โหลดคู่มือบอทลูกน้องสำเร็จ — ทุกคนพร้อมทำงาน' },
    ];
  });

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

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

  // Fetch all endpoints with defensive checks to avoid SyntaxError for HTML responses
  const refreshAllData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [invRes, ordRes, affRes, finRes] = await Promise.all([
        fetch(`${apiBase}/inventory`),
        fetch(`${apiBase}/orders`),
        fetch(`${apiBase}/affiliate`),
        fetch(`${apiBase}/finance`),
      ]);

      if (invRes.ok && invRes.headers.get('content-type')?.includes('application/json')) {
        setInventory(await invRes.json());
      } else {
        throw new Error('Invalid inventory data format');
      }

      if (ordRes.ok && ordRes.headers.get('content-type')?.includes('application/json')) {
        setOrders(await ordRes.json());
      } else {
        throw new Error('Invalid orders data format');
      }

      if (affRes.ok && affRes.headers.get('content-type')?.includes('application/json')) {
        setAffiliate(await affRes.json());
      } else {
        throw new Error('Invalid affiliate data format');
      }

      if (finRes.ok && finRes.headers.get('content-type')?.includes('application/json')) {
        setFinance(await finRes.json());
      } else {
        throw new Error('Invalid finance data format');
      }
      
      const ts = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      setLastUpdated(ts);
    } catch (err) {
      console.warn('Failed to fetch data from json-server, falling back to local storage database:', err);
      // Fallback to initial datasets if server is unreachable
      setInventory(fallbackInventory);
      setOrders(fallbackOrders);
      setAffiliate(fallbackAffiliate);
      setFinance(fallbackFinance);
      
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
      }
    };
    load();
    return () => { active = false; };
  }, [refreshAllData]);

  // Inventory actions with offline fallback handling
  const adjustStock = useCallback(async (item: InventoryItem, delta: number) => {
    const newStock = Math.max(0, item.stock + delta);
    try {
      const res = await fetch(`${apiBase}/inventory/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
      const offlineItem = { ...item, stock: newStock };
      setInventory(prev => prev.map(i => i.id === item.id ? offlineItem : i));
      addLog('WARN', `📦 ปรับสต็อก (Offline) ${item.name}: ${item.stock} → ${newStock}`);
      addAuditLog('Stock Adjust (Offline)', `${item.name} ${item.stock} → ${newStock} locally`);
      addToast('warning', `${item.name}: ${item.stock} → ${newStock} (โหมดออฟไลน์)`);
    }
  }, [apiBase, addLog, addAuditLog, addToast]);

  const saveInventoryItem = useCallback(async (item: Omit<InventoryItem, 'id'> & { id?: string }) => {
    try {
      let saved: InventoryItem;
      if (item.id) {
        const res = await fetch(`${apiBase}/inventory/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
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
          headers: { 'Content-Type': 'application/json' },
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
  }, [apiBase, addLog, addAuditLog, addToast]);

  const deleteInventoryItem = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${apiBase}/inventory/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete inventory item');
      setInventory(prev => prev.filter(i => i.id !== id));
      addLog('INFO', `🗑️ ลบสินค้าออกจากคลัง ${id}`);
      addAuditLog('Inventory Delete', `Deleted ${id}`);
      addToast('success', 'ลบสินค้าสำเร็จ');
    } catch (err) {
      console.warn('Backend offline, deleting locally:', err);
      setInventory(prev => prev.filter(i => i.id !== id));
      addLog('WARN', `🗑️ ลบสินค้าออกจากคลัง (Offline) ${id}`);
      addAuditLog('Inventory Delete (Offline)', `Deleted ${id} locally`);
      addToast('warning', 'ลบสินค้าสำเร็จ (โหมดออฟไลน์)');
    }
  }, [apiBase, addLog, addAuditLog, addToast]);

  useEffect(() => {
    localStorage.setItem('geminiApiKey', geminiApiKey);
    localStorage.setItem('geminiModel', geminiModel);
  }, [geminiApiKey, geminiModel]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const playAlertSound = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(220, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch {
      // Catch blocked autoplay or hardware audio issues silently
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const activeAgents = agents.filter(a => a.id !== 'ceo_jay' && (a.status === 'Working' || a.status === 'Thinking'));
      if (activeAgents.length === 0) return;
      const target = activeAgents[Math.floor(Math.random() * activeAgents.length)];

      if (Math.random() < target.sleepChance) {
        setAgents(prev => prev.map(a => {
          if (a.id === target.id) {
            const napping = { ...a, status: 'Napping' as const };
            setNappingAgentAlert(napping);
            playAlertSound();
            addLog('CRITICAL', `⚠️ "${a.name}" แอบงีบหลับ! ระบบถูกระงับชั่วคราว`);
            addToast('warning', `${a.name} แอบหลับ!`);
            addAuditLog('Agent Sleep', `${a.name} entered Napping state`);
            return napping;
          }
          return a;
        }));
      }

      if (Math.random() > 0.85) {
        setProjectProgress(prev => Math.min(prev + 1, 100));
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [agents, playAlertSound, addLog, addToast, addAuditLog]);

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
    geminiApiKey,
    geminiModel,
    auditLog,
    toasts,
    retryCount,
    inventory,
    orders,
    affiliate,
    finance,
    loadingData,
    lastUpdated,
    setAgents,
    setSelectedAgent,
    setLogs,
    setProjectProgress,
    setNappingAgentAlert,
    setActivePanel,
    setSharedSkillText,
    setCurrentTime,
    setGeminiApiKey,
    setGeminiModel,
    setRetryCount,
    addLog,
    handleUpdateAgent,
    handleWakeAgent,
    togglePanel,
    addAuditLog,
    addToast,
    removeToast,
    refreshAllData,
    adjustStock,
    saveInventoryItem,
    deleteInventoryItem,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
