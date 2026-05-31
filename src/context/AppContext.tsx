import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import type { Agent, ConsoleLog } from '../data/agents';
import { initialAgents } from '../data/agents';

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  detail: string;
}

interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface AppState {
  agents: Agent[];
  selectedAgent: Agent | null;
  logs: ConsoleLog[];
  projectProgress: number;
  nappingAgentAlert: Agent | null;
  activePanel: string;
  sharedSkillText: string;
  currentTime: string;
  mimoApiKey: string;
  mimoBaseUrl: string;
  mimoModel: string;
  auditLog: AuditEntry[];
  toasts: ToastItem[];
  retryCount: number;
}

interface AppContextValue extends AppState {
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  setSelectedAgent: React.Dispatch<React.SetStateAction<Agent | null>>;
  setLogs: React.Dispatch<React.SetStateAction<ConsoleLog[]>>;
  setProjectProgress: React.Dispatch<React.SetStateAction<number>>;
  setNappingAgentAlert: React.Dispatch<React.SetStateAction<Agent | null>>;
  setActivePanel: React.Dispatch<React.SetStateAction<string>>;
  setSharedSkillText: React.Dispatch<React.SetStateAction<string>>;
  setCurrentTime: React.Dispatch<React.SetStateAction<string>>;
  setMimoApiKey: React.Dispatch<React.SetStateAction<string>>;
  setMimoBaseUrl: React.Dispatch<React.SetStateAction<string>>;
  setMimoModel: React.Dispatch<React.SetStateAction<string>>;
  setRetryCount: React.Dispatch<React.SetStateAction<number>>;
  addLog: (type: ConsoleLog['type'], message: string) => void;
  handleUpdateAgent: (updatedAgent: Agent) => void;
  handleWakeAgent: (agent: Agent) => void;
  togglePanel: (panel: string) => void;
  addAuditLog: (action: string, detail: string) => void;
  addToast: (type: ToastItem['type'], message: string) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

let toastCounter = 0;

export function AppProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [projectProgress, setProjectProgress] = useState<number>(72);
  const [nappingAgentAlert, setNappingAgentAlert] = useState<Agent | null>(null);
  const [activePanel, setActivePanel] = useState<string>('none');
  const [sharedSkillText, setSharedSkillText] = useState<string>(initialAgents[0]?.sharedSkill || '');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [mimoApiKey, setMimoApiKey] = useState<string>(() => localStorage.getItem('mimoApiKey') || '');
  const [mimoBaseUrl, setMimoBaseUrl] = useState<string>(() => 'https://api.xiaomimimo.com/v1');
  const [mimoModel, setMimoModel] = useState<string>(() => localStorage.getItem('mimoModel') || 'mimo-v2.5-pro');
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    localStorage.setItem('mimoApiKey', mimoApiKey);
    localStorage.setItem('mimoBaseUrl', mimoBaseUrl);
    localStorage.setItem('mimoModel', mimoModel);
  }, [mimoApiKey, mimoBaseUrl, mimoModel]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const ts = () => new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs([
      { timestamp: ts(), type: 'INFO', message: 'ระบบ Nitro Tech Supply เริ่มต้นการทำงาน...' },
      { timestamp: ts(), type: 'INFO', message: 'ตรวจสอบคลังสินค้า... สถานะ: พร้อมจัดส่ง 100%' },
      { timestamp: ts(), type: 'INFO', message: 'โหลดคู่มือบอทลูกน้องสำเร็จ — ทุกคนพร้อมทำงาน' },
    ]);
  }, []);

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

  const playAlertSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    } catch {}
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
    mimoApiKey,
    mimoBaseUrl,
    mimoModel,
    auditLog,
    toasts,
    retryCount,
    setAgents,
    setSelectedAgent,
    setLogs,
    setProjectProgress,
    setNappingAgentAlert,
    setActivePanel,
    setSharedSkillText,
    setCurrentTime,
    setMimoApiKey,
    setMimoBaseUrl,
    setMimoModel,
    setRetryCount,
    addLog,
    handleUpdateAgent,
    handleWakeAgent,
    togglePanel,
    addAuditLog,
    addToast,
    removeToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
