import { useState, useEffect, useCallback } from 'react';
import { initialAgents } from './data/agents';
import type { Agent } from './data/agents';
import { Workspace } from './components/Workspace';
import { AgentModal } from './components/AgentModal';
import { AffiliateTracker } from './components/AffiliateTracker';
import { TeamChat } from './components/TeamChat';
import { SystemConsole } from './components/SystemConsole';
import type { ConsoleLog } from './components/SystemConsole';
import { LofiPlayer } from './components/LofiPlayer';
import { RestockGrid } from './components/RestockGrid';
import { ActiveOrders } from './components/ActiveOrders';
import { CompanyCapital } from './components/CompanyCapital';
import { AnalyticsView } from './components/AnalyticsView';

type PanelId = 'none' | 'console' | 'chat' | 'income' | 'inventory' | 'analytics' | 'settings';

export default function App() {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [projectProgress, setProjectProgress] = useState<number>(72);
  const [nappingAgentAlert, setNappingAgentAlert] = useState<Agent | null>(null);
  const [activePanel, setActivePanel] = useState<PanelId>('none');
  const [sharedSkillText, setSharedSkillText] = useState<string>(initialAgents[0].sharedSkill);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [mimoApiKey, setMimoApiKey] = useState<string>(() => localStorage.getItem('mimoApiKey') || 'sk-sb0havy7743zlf72xq550uqrnqint2igxw54bzg87dcmj43j');
  const [mimoBaseUrl, setMimoBaseUrl] = useState<string>(() => localStorage.getItem('mimoBaseUrl') || 'https://token-plan-sgp.xiaomimimo.com/v1');
  const [mimoModel, setMimoModel] = useState<string>(() => localStorage.getItem('mimoModel') || 'mimo-v2.5-pro');

  useEffect(() => {
    localStorage.setItem('mimoApiKey', mimoApiKey);
    localStorage.setItem('mimoBaseUrl', mimoBaseUrl);
    localStorage.setItem('mimoModel', mimoModel);
  }, [mimoApiKey, mimoBaseUrl, mimoModel]);

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize logs
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

  // Agent sleep simulation
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
  }, [agents, addLog]);

  const playAlertSound = () => {
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
  };

  const handleUpdateAgent = (updatedAgent: Agent) => {
    const previous = agents.find(a => a.id === updatedAgent.id);
    setAgents(prev => prev.map(a => a.id === updatedAgent.id ? updatedAgent : a));
    
    if (previous && previous.status !== updatedAgent.status) {
      const logType = updatedAgent.status === 'Napping' ? 'CRITICAL' : 'INFO';
      addLog(logType, `สถานะ "${updatedAgent.name}": ${previous.status} → ${updatedAgent.status}`);
      
      if (previous.status === 'Napping' && updatedAgent.status === 'Working') {
        if (nappingAgentAlert?.id === updatedAgent.id) setNappingAgentAlert(null);
        addLog('INFO', `✅ ปลุก "${updatedAgent.name}" สำเร็จ — กลับมาทำงานแล้ว`);
      }
    } else {
      addLog('INFO', `📝 อัปเดต skill.md ของ "${updatedAgent.name}"`);
    }

    if (selectedAgent?.id === updatedAgent.id) setSelectedAgent(updatedAgent);
  };

  const handleWakeAgent = (agent: Agent) => {
    handleUpdateAgent({ ...agent, status: 'Working' });
  };

  const togglePanel = (panel: PanelId) => {
    setActivePanel(prev => prev === panel ? 'none' : panel);
  };

  const nappingCount = agents.filter(a => a.status === 'Napping').length;

  return (
    <div className="app-root">
      
      {/* ===== HEADER BAR ===== */}
      <header className="app-header">
        <div className="header-brand">
          <div className="header-brand-icon">🏢</div>
          <div className="header-brand-text">
            <h1>Nitro Tech Supply</h1>
            <p>AI-Powered IT Hardware Wholesale & Retail</p>
          </div>
        </div>

        <div className="header-center">
          {nappingAgentAlert ? (
            <div className="header-alert-banner">
              <span>⚠️</span>
              <span>{nappingAgentAlert.name} แอบหลับ!</span>
              <button onClick={() => handleWakeAgent(nappingAgentAlert)}>
                🔔 WAKE UP
              </button>
            </div>
          ) : (
            <div className="header-status">
              <div className="header-status-dot" />
              <span>ทีม AI ทำงานปกติ — Swarm Health 100%</span>
            </div>
          )}
        </div>

        <div className="header-right">
          <div>
            <div className="header-clock">{currentTime}</div>
            <div className="header-date">{new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <div className="app-content">
        
        {/* Workspace (Hero) */}
        <Workspace
          agents={agents}
          onSelectAgent={setSelectedAgent}
          selectedAgentId={selectedAgent?.id}
          projectProgress={projectProgress}
        />

        {/* Side Panel (slides in) */}
        {activePanel !== 'none' && activePanel !== 'analytics' && activePanel !== 'settings' && (
          <>
            <div className="side-panel-overlay" onClick={() => setActivePanel('none')} />
            <div className="side-panel">
              <div className="side-panel-header">
                <h2>
                  {activePanel === 'console' && '🖥️ SYSTEM CONSOLE'}
                  {activePanel === 'chat' && '💬 TEAM CHAT'}
                  {activePanel === 'income' && '💰 INCOME TRACKER'}
                  {activePanel === 'inventory' && '📦 INVENTORY'}
                </h2>
                <button className="side-panel-close" onClick={() => setActivePanel('none')}>✕</button>
              </div>
              <div className="side-panel-body">
                {activePanel === 'console' && (
                  <SystemConsole logs={logs} onClearLogs={() => setLogs([])} />
                )}
                {activePanel === 'chat' && (
                  <TeamChat 
                    agents={agents} 
                    mimoApiKey={mimoApiKey} 
                    mimoBaseUrl={mimoBaseUrl} 
                    mimoModel={mimoModel} 
                  />
                )}
                {activePanel === 'income' && (
                  <>
                    <AffiliateTracker />
                    <CompanyCapital />
                  </>
                )}
                {activePanel === 'inventory' && (
                  <>
                    <RestockGrid />
                    <ActiveOrders />
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Analytics Fullscreen */}
        {activePanel === 'analytics' && (
          <>
            <div className="side-panel-overlay" onClick={() => setActivePanel('none')} />
            <div className="side-panel" style={{ width: '90vw', maxWidth: '1100px' }}>
              <div className="side-panel-header">
                <h2>📊 SALES ANALYTICS</h2>
                <button className="side-panel-close" onClick={() => setActivePanel('none')}>✕</button>
              </div>
              <div className="side-panel-body">
                <AnalyticsView />
              </div>
            </div>
          </>
        )}

        {/* Settings Panel */}
        {activePanel === 'settings' && (
          <>
            <div className="side-panel-overlay" onClick={() => setActivePanel('none')} />
            <div className="side-panel" style={{ width: '550px' }}>
              <div className="side-panel-header">
                <h2>⚙️ MASTER SETTINGS</h2>
                <button className="side-panel-close" onClick={() => setActivePanel('none')}>✕</button>
              </div>
              <div className="side-panel-body">
                <div className="panel-card">
                  <div className="panel-card-header">
                    <span className="panel-card-title">SHARED SKILL.MD</span>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>
                    คู่มือแนวทางกลาง — บอททุกตัวดึงเอกสารนี้ไปใช้
                  </p>
                  <textarea
                    value={sharedSkillText}
                    onChange={(e) => {
                      setSharedSkillText(e.target.value);
                      setAgents(prev => prev.map(a => ({ ...a, sharedSkill: e.target.value })));
                    }}
                    className="editor-area"
                    style={{ minHeight: '360px' }}
                    placeholder="# Shared Guidelines..."
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button
                      onClick={() => {
                        import('canvas-confetti').then(c => {
                          c.default({ particleCount: 50, spread: 60, colors: ['#22d3ee', '#34d399'] });
                        });
                        addLog('INFO', '✅ อัปเดต Master shared_skill.md สำเร็จ');
                      }}
                      className="btn btn-primary"
                    >
                      💾 SAVE SHARED SKILLS
                    </button>
                  </div>
                </div>

                <div className="panel-card">
                  <div className="panel-card-header">
                    <span className="panel-card-title">🤖 AI INTEGRATION (XIAOMI MIMO)</span>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>
                    ตั้งค่า API เพื่อเชื่อมต่อระบบสมองกลให้ Team Chat
                  </p>
                  
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '14px', color: 'var(--accent-cyan)' }}>API KEY</label>
                    <input
                      type="password"
                      value={mimoApiKey}
                      onChange={(e) => setMimoApiKey(e.target.value)}
                      className="chat-input-field"
                      placeholder="sk-..."
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '14px', color: 'var(--accent-cyan)' }}>BASE URL</label>
                    <input
                      type="text"
                      value={mimoBaseUrl}
                      onChange={(e) => setMimoBaseUrl(e.target.value)}
                      className="chat-input-field"
                      placeholder="https://api..."
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '14px', color: 'var(--accent-cyan)' }}>MODEL</label>
                    <input
                      type="text"
                      value={mimoModel}
                      onChange={(e) => setMimoModel(e.target.value)}
                      className="chat-input-field"
                      placeholder="mimo-v2.5-pro"
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>

                  {mimoApiKey ? (
                    <div className="badge badge-success">✅ MiMo API Ready</div>
                  ) : (
                    <div className="badge badge-warning">⚠️ No API Key (using mock data)</div>
                  )}
                </div>

                <div className="panel-card">
                  <div className="panel-card-header">
                    <span className="panel-card-title">🎵 LOFI PLAYER</span>
                  </div>
                  <LofiPlayer />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ===== DOCK BAR (Game UI) ===== */}
      <nav className="dock-bar">
        <button 
          className={`dock-item ${activePanel === 'none' ? 'active' : ''}`}
          onClick={() => setActivePanel('none')}
        >
          <span className="dock-item-icon">🏢</span>
          <span>Office</span>
        </button>
        
        <button 
          className={`dock-item ${activePanel === 'console' ? 'active' : ''}`}
          onClick={() => togglePanel('console')}
        >
          <span className="dock-item-icon">🖥️</span>
          <span>Console</span>
          {logs.filter(l => l.type === 'CRITICAL').length > 0 && <div className="dock-item-badge" />}
        </button>
        
        <button 
          className={`dock-item ${activePanel === 'chat' ? 'active' : ''}`}
          onClick={() => togglePanel('chat')}
        >
          <span className="dock-item-icon">💬</span>
          <span>Chat</span>
        </button>
        
        <button 
          className={`dock-item ${activePanel === 'income' ? 'active' : ''}`}
          onClick={() => togglePanel('income')}
        >
          <span className="dock-item-icon">💰</span>
          <span>Income</span>
        </button>
        
        <button 
          className={`dock-item ${activePanel === 'inventory' ? 'active' : ''}`}
          onClick={() => togglePanel('inventory')}
        >
          <span className="dock-item-icon">📦</span>
          <span>Inventory</span>
          {nappingCount > 0 && <div className="dock-item-badge" />}
        </button>
        
        <button 
          className={`dock-item ${activePanel === 'analytics' ? 'active' : ''}`}
          onClick={() => togglePanel('analytics')}
        >
          <span className="dock-item-icon">📊</span>
          <span>Analytics</span>
        </button>
        
        <button 
          className={`dock-item ${activePanel === 'settings' ? 'active' : ''}`}
          onClick={() => togglePanel('settings')}
        >
          <span className="dock-item-icon">⚙️</span>
          <span>Settings</span>
        </button>
      </nav>

      {/* ===== AGENT MODAL ===== */}
      {selectedAgent && (
        <AgentModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onUpdateAgent={handleUpdateAgent}
        />
      )}
    </div>
  );
}
