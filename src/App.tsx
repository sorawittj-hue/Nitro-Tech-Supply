import { lazy, Suspense, useCallback } from 'react';
import { useApp } from './context/AppContext';
import { Workspace } from './components/Workspace';
import { AgentModal } from './components/AgentModal';
import { AffiliateTracker } from './components/AffiliateTracker';
import { SystemConsole } from './components/SystemConsole';
import type { ConsoleLog } from './components/SystemConsole';
import { RestockGrid } from './components/RestockGrid';
import { ActiveOrders } from './components/ActiveOrders';
import { CompanyCapital } from './components/CompanyCapital';
import { BusinessCommandCenter } from './components/BusinessCommandCenter';
import { BusinessOps } from './components/BusinessOps';
import { AgentRunsView } from './components/AgentRunsView';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastContainer } from './components/ToastContainer';
import { SearchBar } from './components/SearchBar';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { initialAgents } from './data/agents';
import type { Agent } from './data/agents';
import { transport } from './transport';

const TeamChat = lazy(() => import('./components/TeamChat').then(module => ({ default: module.TeamChat })));
const AnalyticsView = lazy(() => import('./components/AnalyticsView').then(module => ({ default: module.AnalyticsView })));
const LofiPlayer = lazy(() => import('./components/LofiPlayer').then(module => ({ default: module.LofiPlayer })));

function PanelLoading() {
  return <div className="skeleton-block" aria-label="Loading panel" />;
}

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
    aiApiKey,
    aiModel,
    auditLog,
    setSharedSkillText,
    setSelectedAgent,
    setActivePanel,
    setLogs,
    setAiApiKey,
    setAiModel,
    setAgents,
    handleUpdateAgent,
    handleWakeAgent,
    togglePanel,
    addLog,
    isOffline,
    chatProvider,
    hermesConfig,
    hermesConnected,
    transportConnected,
    lastAgentEventAt,
    debugMode,
    dataWriteToken,
    nitroHealth,
    agentRuns,
    refreshAllData,
    setChatProvider,
    setHermesConfig,
    setDebugMode,
    setDataWriteToken,
    refreshNitroHealth,
    testHermesConnection,
  } = app;

  const nappingCount = agents.filter(a => a.status === 'Napping').length;

  const persistAgentLayout = useCallback((nextAgents: Agent[]) => {
    const layout = nextAgents.reduce<Record<string, Agent['position']>>((acc, agent) => {
      acc[agent.id] = agent.position;
      return acc;
    }, {});
    localStorage.setItem('nitro-tech:layout', JSON.stringify(layout));
    transport.send({ type: 'layout.save', layout, timestamp: Date.now() });
  }, []);

  const handleMoveAgent = useCallback((agentId: string, position: Agent['position']) => {
    setAgents(prev => {
      const next = prev.map(agent => agent.id === agentId ? { ...agent, position } : agent);
      persistAgentLayout(next);
      return next;
    });
  }, [persistAgentLayout, setAgents]);

  const handleResetAgentLayout = useCallback(() => {
    setAgents(prev => {
      const next = prev.map(agent => {
        const original = initialAgents.find(item => item.id === agent.id);
        return original ? { ...agent, position: original.position } : agent;
      });
      persistAgentLayout(next);
      return next;
    });
    addLog('INFO', 'Agent office layout reset to default desks');
  }, [addLog, persistAgentLayout, setAgents]);

  return (
    <ErrorBoundary>
      <div className="app-root">
        <KeyboardShortcuts 
          togglePanel={togglePanel}
          setActivePanel={setActivePanel}
          addLog={addLog}
          clearLogs={() => setLogs([])}
          toggleDebugMode={() => setDebugMode(prev => !prev)}
          focusSearch={() => {
            const input = document.getElementById('global-search') as HTMLInputElement | null;
            if (input) input.focus();
          }}
        />
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
                <div className={`header-status-dot ${isOffline ? 'alert' : ''}`} />
                <span>
                  {isOffline
                    ? 'Offline Mode — เก็บการแก้ไขไว้ในเครื่องชั่วคราวจนกว่า backend จะกลับมา'
                    : `Live Ops — ${transportConnected ? 'Transport connected' : 'Transport offline'}${lastAgentEventAt ? ` • Event ${new Date(lastAgentEventAt).toLocaleTimeString('en-US', { hour12: false })}` : ''}`}
                </span>
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
            onMoveAgent={handleMoveAgent}
            onResetLayout={handleResetAgentLayout}
            selectedAgentId={selectedAgent?.id}
            projectProgress={projectProgress}
            debugMode={debugMode}
          />

          {activePanel !== 'none' && activePanel !== 'analytics' && activePanel !== 'settings' && activePanel !== 'command' && activePanel !== 'ops' && activePanel !== 'runs' && (
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
                    <SystemConsole
                      logs={logs as ConsoleLog[]}
                      auditLogs={auditLog}
                      onClearLogs={() => setLogs([])}
                      onRequestDiagnostics={() => {
                        transport.send({ type: 'diagnostics.request', timestamp: Date.now() });
                        addLog('INFO', 'Diagnostics requested from live transport');
                      }}
                    />
                  )}
                  {activePanel === 'chat' && (
                    <Suspense fallback={<PanelLoading />}>
                      <TeamChat agents={agents} />
                    </Suspense>
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
                  <Suspense fallback={<PanelLoading />}>
                    <AnalyticsView />
                  </Suspense>
                </div>
              </div>
            </>
          )}

          {activePanel === 'command' && (
            <>
              <div className="side-panel-overlay" onClick={() => setActivePanel('none')} />
              <div className="side-panel" style={{ width: '92vw', maxWidth: '1280px' }}>
                <div className="side-panel-header">
                  <h2>🏢 CEO COMMAND CENTER</h2>
                  <button className="side-panel-close" onClick={() => setActivePanel('none')}>✕</button>
                </div>
                <div className="side-panel-body">
                  <BusinessCommandCenter agents={agents} onSelectAgent={setSelectedAgent} onNavigate={setActivePanel} />
                </div>
              </div>
            </>
          )}

          {activePanel === 'ops' && (
            <>
              <div className="side-panel-overlay" onClick={() => setActivePanel('none')} />
              <div className="side-panel" style={{ width: '92vw', maxWidth: '1280px' }}>
                <div className="side-panel-header">
                  <h2>🏭 BUSINESS OPS</h2>
                  <button className="side-panel-close" onClick={() => setActivePanel('none')}>✕</button>
                </div>
                <div className="side-panel-body">
                  <BusinessOps agents={agents} />
                </div>
              </div>
            </>
          )}

          {activePanel === 'runs' && (
            <>
              <div className="side-panel-overlay" onClick={() => setActivePanel('none')} />
              <div className="side-panel" style={{ width: '92vw', maxWidth: '1280px' }}>
                <div className="side-panel-header">
                  <h2>HERMES AGENT RUNS</h2>
                  <button className="side-panel-close" onClick={() => setActivePanel('none')}>x</button>
                </div>
                <div className="side-panel-body">
                  <AgentRunsView runs={agentRuns} agents={agents} onRefresh={refreshAllData} />
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
                      <span className="panel-card-title">🤖 MIMO AI INTEGRATION</span>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>
                      ตั้งค่า MiMo AI เพื่อให้ทีม AI agent ตอบคำสั่ง CEO ผ่าน OpenAI-compatible chat/completions
                    </p>

                    <div className="form-error" style={{ marginBottom: '12px' }}>
                      Production note: API key เก็บเฉพาะ runtime session แล้ว ไม่บันทึกลง localStorage แต่ระบบจริงควรย้าย MiMo call ไป backend proxy เพื่อไม่ expose key ใน browser
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ fontSize: '14px', color: 'var(--accent-cyan)' }}>MIMO API KEY</label>
                      <input type="password" value={aiApiKey} onChange={(e) => setAiApiKey(e.target.value)} className="chat-input-field" placeholder="sk-..." style={{ width: '100%', marginTop: '4px' }} />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ fontSize: '14px', color: 'var(--accent-cyan)' }}>MODEL</label>
                      <input type="text" value={aiModel} onChange={(e) => setAiModel(e.target.value)} className="chat-input-field" placeholder="mimo-v2.5-pro" style={{ width: '100%', marginTop: '4px' }} />
                    </div>

                    {aiApiKey ? (
                      <div className="badge badge-success">✅ MiMo AI Ready</div>
                    ) : (
                      <div className="badge badge-warning">⚠️ No API Key</div>
                    )}
                  </div>

                  <div className="panel-card">
                    <div className="panel-card-header">
                      <span className="panel-card-title">🤖 AI CHAT PROVIDER</span>
                      <span className={`badge ${hermesConnected ? 'badge-success' : 'badge-warning'}`}>
                        {hermesConnected ? 'HERMES CONNECTED' : 'HERMES OFFLINE'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '14px', color: 'var(--accent-cyan)' }}>PROVIDER</label>
                        <select
                          value={chatProvider}
                          onChange={(event) => setChatProvider(event.target.value as typeof chatProvider)}
                          className="chat-input-field"
                          style={{ width: '100%', marginTop: '4px' }}
                        >
                          <option value="hermes">Hermes Agent (AWS)</option>
                          <option value="mimo">MiMo AI</option>
                          <option value="offline">Offline / Not Configured</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '14px', color: 'var(--accent-cyan)' }}>NITRO PROXY URL</label>
                        <input
                          type="text"
                          value={hermesConfig.nitroProxyUrl}
                          onChange={(event) => setHermesConfig(prev => ({ ...prev, nitroProxyUrl: event.target.value }))}
                          className="chat-input-field"
                          placeholder="http://localhost:8787"
                          style={{ width: '100%', marginTop: '4px' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '14px', color: 'var(--accent-cyan)' }}>HERMES API URL</label>
                        <input
                          type="text"
                          value={hermesConfig.hermesApiUrl}
                          onChange={(event) => setHermesConfig(prev => ({ ...prev, hermesApiUrl: event.target.value }))}
                          className="chat-input-field"
                          placeholder="http://YOUR_AWS_IP:8642"
                          style={{ width: '100%', marginTop: '4px' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '14px', color: 'var(--accent-cyan)' }}>HERMES API KEY</label>
                        <input
                          type="password"
                          value={hermesConfig.hermesApiKey}
                          onChange={(event) => setHermesConfig(prev => ({ ...prev, hermesApiKey: event.target.value }))}
                          className="chat-input-field"
                          placeholder="Bearer token from API_SERVER_KEY"
                          style={{ width: '100%', marginTop: '4px' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '14px', color: 'var(--accent-cyan)' }}>SESSION KEY</label>
                        <input
                          type="text"
                          value={hermesConfig.hermesSessionKey}
                          onChange={(event) => setHermesConfig(prev => ({ ...prev, hermesSessionKey: event.target.value }))}
                          className="chat-input-field"
                          placeholder="nitro-tech-jay"
                          style={{ width: '100%', marginTop: '4px' }}
                        />
                      </div>

                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => void testHermesConnection()}
                      >
                        Test Hermes Connection
                      </button>
                    </div>
                  </div>

                  <div className="panel-card">
                    <div className="panel-card-header">
                      <span className="panel-card-title">NITRO WRITE ACCESS</span>
                      <span className={`badge ${nitroHealth?.dataWriteAuthRequired ? 'badge-success' : 'badge-danger'}`}>
                        {nitroHealth?.dataWriteAuthRequired ? 'WRITE PROTECTED' : 'UNPROTECTED'}
                      </span>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>
                      Business writes use X-Nitro-Write-Token. The token is kept only in this browser session and is not saved to git or localStorage.
                    </p>
                    <div className="compact-row" style={{ marginBottom: '8px' }}>
                      <span>Server token configured</span>
                      <strong>{nitroHealth?.dataWriteAuthConfigured ? 'YES' : 'NO'}</strong>
                    </div>
                    <div className="compact-row" style={{ marginBottom: '8px' }}>
                      <span>Server requires token</span>
                      <strong>{nitroHealth?.dataWriteAuthRequired ? 'YES' : 'NO'}</strong>
                    </div>
                    <div className="compact-row" style={{ marginBottom: '12px' }}>
                      <span>Audit log</span>
                      <strong>{nitroHealth?.auditLogEnabled ? 'ON' : 'UNKNOWN'}</strong>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '14px', color: 'var(--accent-cyan)' }}>DATA WRITE TOKEN</label>
                      <input
                        type="password"
                        value={dataWriteToken}
                        onChange={(event) => setDataWriteToken(event.target.value)}
                        className="chat-input-field"
                        placeholder="NITRO_DATA_WRITE_TOKEN"
                        style={{ width: '100%', marginTop: '4px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button type="button" className="btn btn-ghost" onClick={() => void refreshNitroHealth()}>
                        Refresh Security
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={() => setDataWriteToken('')}>
                        Clear Token
                      </button>
                    </div>
                  </div>

                  <div className="panel-card">
                    <div className="panel-card-header">
                      <span className="panel-card-title">🎵 LOFI PLAYER</span>
                    </div>
                    <Suspense fallback={<PanelLoading />}>
                      <LofiPlayer />
                    </Suspense>
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

          <button className={`dock-item ${activePanel === 'command' ? 'active' : ''}`} onClick={() => togglePanel('command')}>
            <span className="dock-item-icon">🏢</span><span>CEO OS</span>
          </button>

          <button className={`dock-item ${activePanel === 'console' ? 'active' : ''}`} onClick={() => togglePanel('console')}>
            <span className="dock-item-icon">🖥️</span><span>Console</span>
            {logs.filter((l) => l.type === 'CRITICAL').length > 0 && <div className="dock-item-badge" />}
          </button>

          <button className={`dock-item ${activePanel === 'chat' ? 'active' : ''}`} onClick={() => togglePanel('chat')}>
            <span className="dock-item-icon">💬</span><span>Chat</span>
          </button>

          <button className={`dock-item ${activePanel === 'ops' ? 'active' : ''}`} onClick={() => togglePanel('ops')}>
            <span className="dock-item-icon">🏭</span><span>Ops</span>
          </button>

          <button className={`dock-item ${activePanel === 'runs' ? 'active' : ''}`} onClick={() => togglePanel('runs')}>
            <span className="dock-item-icon">🧾</span><span>Runs</span>
            {agentRuns.some(run => run.status === 'failed' || run.status === 'forward_failed') && <div className="dock-item-badge" />}
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
          <AgentModal key={selectedAgent.id} agent={selectedAgent} onClose={() => setSelectedAgent(null)} onUpdateAgent={handleUpdateAgent} />
        )}
      </div>
    </ErrorBoundary>
  );
}
