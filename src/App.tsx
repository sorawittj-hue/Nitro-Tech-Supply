import { useApp } from './context/AppContext';
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
import ErrorBoundary from './components/ErrorBoundary';
import { ToastContainer } from './components/ToastContainer';
import { SearchBar } from './components/SearchBar';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';

export default function App() {
  const app = useApp();
  const {
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
    setSharedSkillText,
    setSelectedAgent,
    setActivePanel,
    setLogs,
    setMimoApiKey,
    setMimoBaseUrl,
    setMimoModel,
    handleUpdateAgent,
    handleWakeAgent,
    togglePanel,
    addLog,
  } = app;

  const nappingCount = agents.filter(a => a.status === 'Napping').length;

  return (
    <ErrorBoundary>
      <div className="app-root">
        <KeyboardShortcuts />
        <ToastContainer />

        <SearchBar
          onNavigate={(panel) => setActivePanel(panel)}
          onSelectAgent={(id) => {
            const found = agents.find(a => a.id === id);
            if (found) setSelectedAgent(found);
          }}
          agents={agents.map(a => ({ id: a.id, name: a.name, title: a.title, avatar: a.avatar }))}
        />

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
                <button onClick={() => handleWakeAgent(nappingAgentAlert)}>🔔 WAKE UP</button>
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

        <div className="app-content">
          <Workspace
            agents={agents}
            onSelectAgent={setSelectedAgent}
            selectedAgentId={selectedAgent?.id}
            projectProgress={projectProgress}
          />

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
                    <SystemConsole logs={logs as ConsoleLog[]} onClearLogs={() => setLogs([])} />
                  )}
                  {activePanel === 'chat' && (
                    <TeamChat agents={agents} mimoApiKey={mimoApiKey} mimoBaseUrl={mimoBaseUrl} mimoModel={mimoModel} />
                  )}
                  {activePanel === 'income' && (
                    <>
                      <AffiliateTracker />
                      <CompanyCapital />
                    </>
                  )}
                  {activePanel === 'inventory' && (
                    <>
                      <RestockGrid agents={agents} />
                      <ActiveOrders agents={agents} />
                    </>
                  )}
                </div>
              </div>
            </>
          )}

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
                      onChange={(e) => setSharedSkillText(e.target.value)}
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
                      <input type="password" value={mimoApiKey} onChange={(e) => setMimoApiKey(e.target.value)} className="chat-input-field" placeholder="sk-..." style={{ width: '100%', marginTop: '4px' }} />
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ fontSize: '14px', color: 'var(--accent-cyan)' }}>BASE URL</label>
                      <input type="text" value={mimoBaseUrl} onChange={(e) => setMimoBaseUrl(e.target.value)} className="chat-input-field" placeholder="https://api..." style={{ width: '100%', marginTop: '4px' }} />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ fontSize: '14px', color: 'var(--accent-cyan)' }}>MODEL</label>
                      <input type="text" value={mimoModel} onChange={(e) => setMimoModel(e.target.value)} className="chat-input-field" placeholder="mimo-v2.5-pro" style={{ width: '100%', marginTop: '4px' }} />
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

        <nav className="dock-bar">
          <button className={`dock-item ${activePanel === 'none' ? 'active' : ''}`} onClick={() => setActivePanel('none')}>
            <span className="dock-item-icon">🏢</span><span>Office</span>
          </button>

          <button className={`dock-item ${activePanel === 'console' ? 'active' : ''}`} onClick={() => togglePanel('console')}>
            <span className="dock-item-icon">🖥️</span><span>Console</span>
            {logs.filter((l) => l.type === 'CRITICAL').length > 0 && <div className="dock-item-badge" />}
          </button>

          <button className={`dock-item ${activePanel === 'chat' ? 'active' : ''}`} onClick={() => togglePanel('chat')}>
            <span className="dock-item-icon">💬</span><span>Chat</span>
          </button>

          <button className={`dock-item ${activePanel === 'income' ? 'active' : ''}`} onClick={() => togglePanel('income')}>
            <span className="dock-item-icon">💰</span><span>Income</span>
          </button>

          <button className={`dock-item ${activePanel === 'inventory' ? 'active' : ''}`} onClick={() => togglePanel('inventory')}>
            <span className="dock-item-icon">📦</span><span>Inventory</span>
            {nappingCount > 0 && <div className="dock-item-badge" />}
          </button>

          <button className={`dock-item ${activePanel === 'analytics' ? 'active' : ''}`} onClick={() => togglePanel('analytics')}>
            <span className="dock-item-icon">📊</span><span>Analytics</span>
          </button>

          <button className={`dock-item ${activePanel === 'settings' ? 'active' : ''}`} onClick={() => togglePanel('settings')}>
            <span className="dock-item-icon">⚙️</span><span>Settings</span>
          </button>
        </nav>

        {selectedAgent && (
          <AgentModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} onUpdateAgent={handleUpdateAgent} />
        )}
      </div>
    </ErrorBoundary>
  );
}
