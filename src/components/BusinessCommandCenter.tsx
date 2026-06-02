import { useMemo, useState, type ReactNode } from 'react';
import { useApp } from '../context/AppContext';
import type { Agent } from '../data/agents';

interface BusinessCommandCenterProps {
  agents: Agent[];
  onSelectAgent: (agent: Agent) => void;
  onNavigate: (panel: string) => void;
}

type OsView = 'map' | 'analytics' | 'floor' | 'signals' | 'research' | 'watchlist';
type MarketSide = 'LONG' | 'SHORT';
type TradeStatus = 'SCANNING' | 'ARMED' | 'OPEN' | 'EXITING';
type SystemStatus = 'online' | 'degraded' | 'offline';
type Trend = 'bullish' | 'bearish' | 'neutral';
type TaskPriority = 'High' | 'Medium' | 'Low';

interface PortfolioSnapshot {
  totalEquity: number;
  dailyPnl: number;
  dailyPnlPct: number;
  maxDrawdownPct: number;
  winRatePct: number;
  sharpeRatio: number;
  riskUtilizationPct: number;
  cashAllocationPct: number;
  grossExposurePct: number;
  activeSignals: number;
  systemLoadPct: number;
}

interface TradingSignal {
  id: string;
  ticker: string;
  side: MarketSide;
  entryPrice: number;
  currentPrice: number;
  pnlPct: number;
  confidencePct: number;
  status: TradeStatus;
  strategy: string;
  owner: string;
}

interface ResearchLoopStatus {
  schedule: string;
  lastRunAt: string;
  nextRunAt: string;
  optimizationScorePct: number;
  backtestDeltaPct: number;
  parameterDriftPct: number;
  status: SystemStatus;
}

interface WatchlistStock {
  ticker: string;
  price: number;
  changePct: number;
  relativeVolume: number;
  rsi: number;
  technicalSignal: Trend;
  sparkline: number[];
}

interface TradingDistrict {
  id: string;
  title: string;
  subtitle: string;
  metric: string;
  tone: 'cyan' | 'green' | 'violet' | 'amber' | 'red';
  position: { left: string; top: string };
  view: OsView;
}

interface FloorZone {
  id: string;
  label: string;
  detail: string;
  position: { left: string; top: string };
}

interface QuantTask {
  id: string;
  title: string;
  assignee: string;
  priority: TaskPriority;
  status: 'In Progress' | 'Pending' | 'Completed';
}

interface ReportItem {
  title: string;
  detail: string;
  time: string;
}

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  signDisplay: 'exceptZero',
});

const portfolioSnapshot: PortfolioSnapshot = {
  totalEquity: 428_640,
  dailyPnl: 7_820,
  dailyPnlPct: 1.86,
  maxDrawdownPct: 6.4,
  winRatePct: 62.8,
  sharpeRatio: 1.94,
  riskUtilizationPct: 41,
  cashAllocationPct: 37,
  grossExposurePct: 112,
  activeSignals: 9,
  systemLoadPct: 34,
};

const tradingSignals: TradingSignal[] = [
  { id: 'SIG-AX-1042', ticker: 'NVDA', side: 'LONG', entryPrice: 126.8, currentPrice: 131.44, pnlPct: 3.66, confidencePct: 84, status: 'OPEN', strategy: 'AI Momentum Breakout', owner: 'OmniTrade' },
  { id: 'SIG-QS-2091', ticker: 'TSLA', side: 'SHORT', entryPrice: 183.1, currentPrice: 178.22, pnlPct: 2.66, confidencePct: 78, status: 'EXITING', strategy: 'Mean Reversion Risk-Off', owner: 'OmniTrade' },
  { id: 'SIG-SP-0877', ticker: 'SPY', side: 'LONG', entryPrice: 536.2, currentPrice: 535.48, pnlPct: -0.13, confidencePct: 71, status: 'ARMED', strategy: 'Index Continuation', owner: 'Hermes' },
  { id: 'SIG-MS-4430', ticker: 'MSFT', side: 'LONG', entryPrice: 422.7, currentPrice: 420.11, pnlPct: -0.61, confidencePct: 68, status: 'SCANNING', strategy: 'Cloud Basket Rotation', owner: 'US Analyst' },
];

const watchlistStocks: WatchlistStock[] = [
  { ticker: 'NVDA', price: 131.44, changePct: 3.18, relativeVolume: 2.4, rsi: 67, technicalSignal: 'bullish', sparkline: [22, 26, 25, 31, 37, 34, 42, 48] },
  { ticker: 'AAPL', price: 196.12, changePct: 0.84, relativeVolume: 1.1, rsi: 58, technicalSignal: 'neutral', sparkline: [35, 33, 36, 37, 35, 39, 38, 41] },
  { ticker: 'TSLA', price: 178.22, changePct: -2.47, relativeVolume: 1.9, rsi: 42, technicalSignal: 'bearish', sparkline: [52, 49, 45, 43, 46, 40, 36, 34] },
  { ticker: 'MSFT', price: 420.11, changePct: -0.61, relativeVolume: 0.8, rsi: 51, technicalSignal: 'neutral', sparkline: [28, 31, 30, 33, 34, 32, 35, 34] },
  { ticker: 'SPY', price: 535.48, changePct: 0.21, relativeVolume: 1.0, rsi: 55, technicalSignal: 'bullish', sparkline: [40, 41, 43, 42, 44, 46, 45, 47] },
];

const researchLoop: ResearchLoopStatus = {
  schedule: '0 */6 * * *',
  lastRunAt: '06:00 ICT',
  nextRunAt: '12:00 ICT',
  optimizationScorePct: 73,
  backtestDeltaPct: 4.8,
  parameterDriftPct: 11.2,
  status: 'online',
};

const equityCurve = [42, 45, 43, 48, 54, 53, 59, 64, 62, 70, 76, 74, 83, 88, 91, 96];
const backtestBars = [58, 64, 61, 72, 69, 78, 82, 87];

const tradingDistricts: TradingDistrict[] = [
  { id: 'portfolio-tower', title: 'Portfolio Tower', subtitle: 'Risk, allocation, drawdown', metric: '$428.6K equity', tone: 'cyan', position: { left: '50%', top: '44%' }, view: 'analytics' },
  { id: 'signal-exchange', title: 'Signal Exchange', subtitle: 'OmniTrade execution hub', metric: '9 active signals', tone: 'green', position: { left: '20%', top: '28%' }, view: 'signals' },
  { id: 'research-lab', title: 'Quant Research Lab', subtitle: '6-hour self-learning CRON', metric: 'Next 12:00 ICT', tone: 'violet', position: { left: '72%', top: '27%' }, view: 'research' },
  { id: 'us-market', title: 'US Market Street', subtitle: 'Watchlist and anomaly radar', metric: '5 tickers live', tone: 'amber', position: { left: '25%', top: '70%' }, view: 'watchlist' },
  { id: 'risk-vault', title: 'Risk Vault', subtitle: 'Live capital locked', metric: 'DD 6.4%', tone: 'red', position: { left: '74%', top: '68%' }, view: 'floor' },
];

const floorZones: FloorZone[] = [
  { id: 'execution', label: 'Execution Desk', detail: 'Mock exchange routing', position: { left: '22%', top: '48%' } },
  { id: 'risk', label: 'Risk Wall', detail: 'Max DD / exposure', position: { left: '58%', top: '30%' } },
  { id: 'research', label: 'Research Pods', detail: 'Walk-forward tests', position: { left: '40%', top: '64%' } },
  { id: 'watchlist', label: 'Market Screens', detail: 'US equities radar', position: { left: '72%', top: '58%' } },
];

const quantTasks: QuantTask[] = [
  { id: 'QT-104', title: 'Validate NVDA breakout risk', assignee: 'OmniTrade', priority: 'High', status: 'In Progress' },
  { id: 'QT-108', title: 'Run 6-hour parameter drift scan', assignee: 'Quant Researcher', priority: 'Medium', status: 'Pending' },
  { id: 'QT-111', title: 'Review gross exposure ceiling', assignee: 'Hermes', priority: 'High', status: 'In Progress' },
  { id: 'QT-117', title: 'Track TSLA short exit window', assignee: 'US Analyst', priority: 'Medium', status: 'Completed' },
];

const reports: ReportItem[] = [
  { title: 'Strategy Performance Report', detail: 'Momentum basket improved 4.8%', time: '10:24 AM' },
  { title: 'Drawdown Guard Review', detail: 'Risk ceiling remains locked', time: '09:41 AM' },
  { title: 'US Watchlist Pulse', detail: 'NVDA RVOL anomaly detected', time: '08:55 AM' },
];

const navItems: Array<{ id: OsView; label: string; icon: string }> = [
  { id: 'map', label: 'System Map', icon: '▦' },
  { id: 'floor', label: 'Trading Floor', icon: '⌂' },
  { id: 'signals', label: 'Signals', icon: '↯' },
  { id: 'research', label: 'Research', icon: '⌁' },
  { id: 'watchlist', label: 'Watchlist', icon: '◌' },
  { id: 'analytics', label: 'Analytics', icon: '▧' },
];

export function BusinessCommandCenter({ agents, onSelectAgent, onNavigate }: BusinessCommandCenterProps) {
  const {
    isOffline,
    loadingData,
    lastUpdated,
    chatProvider,
    hermesConnected,
    transportConnected,
    nitroHealth,
    refreshAllData,
  } = useApp();
  const [activeView, setActiveView] = useState<OsView>('map');

  const quantAgents = useMemo(() => {
    const bySystem = new Map(agents.map(agent => [agent.system, agent]));
    return {
      hermes: bySystem.get('portfolio-system-manager') ?? agents.find(agent => agent.id === 'orchestrator-nitro'),
      signalBot: bySystem.get('signal-bot') ?? agents.find(agent => agent.name.includes('Signal')),
      researcher: bySystem.get('trading-research-system') ?? agents.find(agent => agent.name.includes('Quant')),
      marketAnalyst: bySystem.get('us-stock-watchlist') ?? agents.find(agent => agent.name.includes('Market')),
    };
  }, [agents]);

  const workingAgents = agents.filter(agent => agent.status === 'Working').length;
  const systemStatus: SystemStatus = isOffline ? 'offline' : transportConnected || hermesConnected ? 'online' : 'degraded';
  const systemHealthPct = agents.length > 0 ? Math.round((workingAgents / agents.length) * 100) : 0;

  return (
    <div className="agentverse-shell">
      <aside className="agentverse-sidebar">
        <div className="agentverse-brand">
          <div className="agentverse-logo">A</div>
          <div>
            <strong>AGENTVERSE OS</strong>
            <span>AI TRADING COMMAND CENTER</span>
          </div>
        </div>

        <nav className="agentverse-nav" aria-label="AgentVerse sections">
          {navItems.map(item => (
            <button
              key={item.id}
              type="button"
              className={activeView === item.id ? 'active' : ''}
              onClick={() => setActiveView(item.id)}
            >
              <span>{item.icon}</span>
              <em>{item.label}</em>
            </button>
          ))}
        </nav>

        <div className="agentverse-quick">
          <span>Quick Actions</span>
          <button type="button" onClick={() => onNavigate('chat')}>Ask Hermes</button>
          <button type="button" onClick={() => void refreshAllData()}>Refresh Data</button>
          <button type="button" onClick={() => setActiveView('signals')}>Open Signals</button>
        </div>
      </aside>

      <main className="agentverse-main">
        <header className="agentverse-topbar">
          <div className="agentverse-command">
            <span>&gt;_</span>
            <input aria-label="AgentVerse command search" value="Enter command or search... / พิมพ์คำสั่งหรือค้นหา..." readOnly />
            <kbd>⌘ K</kbd>
          </div>
          <div className="agentverse-top-actions">
            <button type="button" onClick={() => setActiveView('map')}>▦</button>
            <button type="button" onClick={() => onNavigate('settings')}>⚙</button>
            <button type="button" onClick={() => onNavigate('chat')}>AI</button>
            <div className="agentverse-user">
              <span>Jay</span>
              <small>Fund Manager</small>
            </div>
          </div>
        </header>

        <div className="agentverse-controller-strip">
          <AgentChip label="Portfolio" agent={quantAgents.hermes} fallback="Hermes" />
          <AgentChip label="Execution" agent={quantAgents.signalBot} fallback="OmniTrade" />
          <AgentChip label="Research" agent={quantAgents.researcher} fallback="Quant Researcher" />
          <AgentChip label="US Market" agent={quantAgents.marketAnalyst} fallback="US Market Analyst" />
        </div>

        {activeView === 'map' && (
          <section className="agentverse-map-view">
            <div className="agentverse-map-stage">
              <div className="agentverse-city-sky" />
              <div className="agentverse-city-grid" />
              <div className="agentverse-city-core">
                <span>AGENTVERSE OS</span>
                <strong>Quant Trading City</strong>
              </div>
              {tradingDistricts.map(district => (
                <button
                  key={district.id}
                  type="button"
                  className={`agentverse-district ${district.tone}`}
                  style={{ left: district.position.left, top: district.position.top }}
                  onClick={() => setActiveView(district.view)}
                >
                  <strong>{district.title}</strong>
                  <span>{district.subtitle}</span>
                  <b>{district.metric}</b>
                </button>
              ))}
            </div>

            <div className="agentverse-map-overlay left">
              <StatLine label="System Status" value={statusLabel(systemStatus)} tone={systemStatus === 'online' ? 'green' : systemStatus === 'degraded' ? 'amber' : 'red'} />
              <StatLine label="Active Agents" value={`${workingAgents}/${agents.length}`} tone="cyan" />
              <StatLine label="Agent Health" value={`${systemHealthPct}%`} tone="green" />
            </div>

            <div className="agentverse-map-overlay bottom">
              <MiniLineChart values={equityCurve} />
              <small>Equity generated</small>
              <strong>{moneyFormatter.format(portfolioSnapshot.totalEquity)}</strong>
            </div>
          </section>
        )}

        {activeView === 'analytics' && (
          <section className="agentverse-analytics">
            <div className="agentverse-view-title">
              <div>
                <span>ANALYTICS / การวิเคราะห์</span>
                <h2>Portfolio Performance</h2>
              </div>
              <div className="agentverse-date-chip">23 Apr - 23 May 2026</div>
            </div>
            <div className="agentverse-kpi-grid">
              <KpiCard title="Total Equity" value={moneyFormatter.format(portfolioSnapshot.totalEquity)} delta={`${formatSigned(portfolioSnapshot.dailyPnlPct)}% today`} tone="green" />
              <KpiCard title="Daily PnL" value={moneyFormatter.format(portfolioSnapshot.dailyPnl)} delta={`${portfolioSnapshot.activeSignals} active signals`} tone="green" />
              <KpiCard title="Sharpe Ratio" value={portfolioSnapshot.sharpeRatio.toFixed(2)} delta="+0.18 vs prior" tone="cyan" />
              <KpiCard title="Win Rate" value={`${portfolioSnapshot.winRatePct}%`} delta="+2.4% 30D" tone="violet" />
            </div>
            <div className="agentverse-analytics-grid">
              <Panel title="Performance Over Time" badge="30D">
                <SparkArea values={equityCurve} stroke="#ec4899" fill="rgba(236,72,153,0.12)" />
              </Panel>
              <Panel title="Risk Rings" badge="LIVE">
                <div className="agentverse-rings">
                  <RingMetric label="Win" value={portfolioSnapshot.winRatePct} color="#22c55e" />
                  <RingMetric label="DD" value={portfolioSnapshot.maxDrawdownPct * 10} color="#f97316" />
                  <RingMetric label="Load" value={portfolioSnapshot.systemLoadPct} color="#3b82f6" />
                </div>
              </Panel>
              <Panel title="Backtest Output" badge="8 Runs">
                <BarSeries values={backtestBars} />
              </Panel>
              <Panel title="Platform Comparison" badge="Portfolio">
                <SignalTable signals={tradingSignals.slice(0, 3)} />
              </Panel>
              <Panel title="Recent Reports" badge={loadingData ? 'SYNCING' : lastUpdated}>
                <ReportList reports={reports} />
              </Panel>
            </div>
          </section>
        )}

        {activeView === 'floor' && (
          <section className="agentverse-floor">
            <div className="agentverse-floor-header">
              <div>
                <span>TRADING FLOOR / ภายในอาคาร</span>
                <h2>Fund of One Operations Floor</h2>
              </div>
              <button type="button" onClick={() => setActiveView('signals')}>Open Signal Dashboard</button>
            </div>
            <div className="agentverse-floor-grid">
              <div className="agentverse-floor-map">
                <div className="floor-platform" />
                {floorZones.map(zone => (
                  <button key={zone.id} type="button" className="floor-zone" style={{ left: zone.position.left, top: zone.position.top }}>
                    <strong>{zone.label}</strong>
                    <span>{zone.detail}</span>
                  </button>
                ))}
              </div>
              <Panel title="Building Performance" badge="LIVE">
                <div className="agentverse-mini-metrics">
                  <MiniMetric label="AI Utilization" value="78%" tone="green" />
                  <MiniMetric label="Task Completion" value="94.2%" tone="green" />
                  <MiniMetric label="Energy Efficiency" value="82%" tone="cyan" />
                </div>
              </Panel>
            </div>
          </section>
        )}

        {activeView === 'signals' && (
          <section className="agentverse-view-stack">
            <ViewHeader title="OmniTrade Signal Bot" subtitle="Real-time execution engine with mocked exchange order routing." />
            <Panel title="Live Trading Signals" badge="Mock Exchange">
              <div className="agentverse-list">
                {tradingSignals.map(signal => <SignalRow key={signal.id} signal={signal} />)}
              </div>
            </Panel>
          </section>
        )}

        {activeView === 'research' && (
          <section className="agentverse-view-stack">
            <ViewHeader title="Trading Research System" subtitle="Self-learning loop scheduled every 6 hours: 0 */6 * * *." />
            <div className="agentverse-two-col">
              <Panel title="Self-Learning Loop" badge={researchLoop.schedule}>
                <div className="agentverse-list">
                  <StatLine label="Last Run" value={researchLoop.lastRunAt} tone="cyan" />
                  <StatLine label="Next Run" value={researchLoop.nextRunAt} tone="green" />
                  <StatLine label="Optimization" value={`${researchLoop.optimizationScorePct}%`} tone="green" />
                  <StatLine label="Parameter Drift" value={`${researchLoop.parameterDriftPct}%`} tone="amber" />
                </div>
              </Panel>
              <Panel title="Backtest Improvement" badge={`${formatSigned(researchLoop.backtestDeltaPct)}%`}>
                <BarSeries values={backtestBars} />
              </Panel>
            </div>
          </section>
        )}

        {activeView === 'watchlist' && (
          <section className="agentverse-view-stack">
            <ViewHeader title="US Stock Watchlist" subtitle="Real-time price action, volume anomalies, RSI, and technical bias." />
            <Panel title="Market Radar" badge="US Equities">
              <div className="agentverse-list">
                {watchlistStocks.map(stock => <WatchlistRow key={stock.ticker} stock={stock} />)}
              </div>
            </Panel>
          </section>
        )}
      </main>

      <aside className="agentverse-rightbar">
        <Panel title="Agents in Building" badge={`${workingAgents}/${agents.length}`}>
          <div className="agentverse-agent-list">
            {agents.slice(0, 7).map(agent => (
              <button key={agent.id} type="button" className="agentverse-agent-row" onClick={() => onSelectAgent(agent)}>
                <span>{agent.avatar}</span>
                <div>
                  <strong>{agent.name}</strong>
                  <small>{agent.title}</small>
                </div>
                <b className={statusBadgeClass(agent.status)}>{agent.status}</b>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Tasks in Building" badge="4 Active">
          <div className="agentverse-task-list">
            {quantTasks.map(task => <TaskRow key={task.id} task={task} />)}
          </div>
        </Panel>

        <Panel title="Activity Log" badge={nitroHealth?.dataWriteAuthRequired ? 'LOCKED' : 'OPEN'}>
          <div className="agentverse-list">
            <EventLine tone="green" title="OmniTrade AI" detail="Mock exchange engine armed; live capital disabled." />
            <EventLine tone="cyan" title="Hermes" detail={`${chatProvider.toUpperCase()} provider ${hermesConnected ? 'connected' : 'pending'}.`} />
            <EventLine tone="amber" title="Watchlist" detail="NVDA relative volume anomaly detected at 2.4x." />
            <EventLine tone={isOffline ? 'red' : 'green'} title="Backend" detail={isOffline ? 'Data API unreachable.' : 'Nitro proxy and data API reachable.'} />
          </div>
        </Panel>
      </aside>
    </div>
  );
}

function ViewHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="agentverse-view-title">
      <div>
        <span>AGENTVERSE OS</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function Panel({ title, badge, children }: { title: string; badge: string; children: ReactNode }) {
  return (
    <div className="agentverse-panel">
      <div className="agentverse-panel-header">
        <h3>{title}</h3>
        <span>{badge}</span>
      </div>
      {children}
    </div>
  );
}

function AgentChip({ label, agent, fallback }: { label: string; agent: Agent | undefined; fallback: string }) {
  return (
    <button type="button" className="agentverse-agent-chip">
      <span>{agent?.avatar ?? 'AI'}</span>
      <div>
        <strong>{label}</strong>
        <small>{agent?.name ?? fallback}</small>
      </div>
      <b className={statusBadgeClass(agent?.status ?? 'Idle')}>{agent?.status ?? 'Idle'}</b>
    </button>
  );
}

function KpiCard({ title, value, delta, tone }: { title: string; value: string; delta: string; tone: 'green' | 'red' | 'cyan' | 'violet' }) {
  return (
    <div className={`agentverse-kpi ${tone}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{delta}</small>
    </div>
  );
}

function MiniMetric({ label, value, tone }: { label: string; value: string; tone: 'green' | 'red' | 'amber' | 'cyan' | 'violet' }) {
  return (
    <div className="agentverse-mini-metric">
      <span>{label}</span>
      <strong className={`agentverse-tone-${tone}`}>{value}</strong>
    </div>
  );
}

function StatLine({ label, value, tone }: { label: string; value: string; tone: 'green' | 'red' | 'amber' | 'cyan' | 'violet' }) {
  return (
    <div className="agentverse-stat-line">
      <span>{label}</span>
      <strong className={`agentverse-tone-${tone}`}>{value}</strong>
    </div>
  );
}

function SignalRow({ signal }: { signal: TradingSignal }) {
  const isProfit = signal.pnlPct >= 0;
  return (
    <div className="agentverse-signal-row">
      <div>
        <strong>{signal.ticker}</strong>
        <span>{signal.id} / {signal.strategy}</span>
      </div>
      <b className={signal.side === 'LONG' ? 'agentverse-tone-green' : 'agentverse-tone-red'}>{signal.side}</b>
      <span>${signal.entryPrice.toFixed(2)}</span>
      <span>${signal.currentPrice.toFixed(2)}</span>
      <b className={isProfit ? 'agentverse-tone-green' : 'agentverse-tone-red'}>{formatSigned(signal.pnlPct)}%</b>
      <em>{signal.confidencePct}% / {signal.status}</em>
    </div>
  );
}

function WatchlistRow({ stock }: { stock: WatchlistStock }) {
  return (
    <div className="agentverse-watch-row">
      <div>
        <strong>{stock.ticker}</strong>
        <span className={trendTextClass(stock.technicalSignal)}>{stock.technicalSignal.toUpperCase()}</span>
      </div>
      <b>${stock.price.toFixed(2)}</b>
      <small className={stock.changePct >= 0 ? 'agentverse-tone-green' : 'agentverse-tone-red'}>{formatSigned(stock.changePct)}%</small>
      <MiniLineChart values={stock.sparkline} compact />
      <em>RVOL {stock.relativeVolume.toFixed(1)}x / RSI {stock.rsi}</em>
    </div>
  );
}

function SignalTable({ signals }: { signals: TradingSignal[] }) {
  return (
    <div className="agentverse-table">
      {signals.map(signal => (
        <div key={signal.id}>
          <span>{signal.ticker}</span>
          <span>{signal.side}</span>
          <span>{signal.confidencePct}%</span>
          <b className={signal.pnlPct >= 0 ? 'agentverse-tone-green' : 'agentverse-tone-red'}>{formatSigned(signal.pnlPct)}%</b>
        </div>
      ))}
    </div>
  );
}

function ReportList({ reports: reportItems }: { reports: ReportItem[] }) {
  return (
    <div className="agentverse-list">
      {reportItems.map(report => (
        <div className="agentverse-report-row" key={report.title}>
          <div>
            <strong>{report.title}</strong>
            <small>{report.detail}</small>
          </div>
          <span>{report.time}</span>
        </div>
      ))}
    </div>
  );
}

function TaskRow({ task }: { task: QuantTask }) {
  return (
    <div className="agentverse-task-row">
      <div>
        <strong>{task.title}</strong>
        <span>{task.assignee}</span>
      </div>
      <b className={`priority-${task.priority.toLowerCase()}`}>{task.priority}</b>
      <em>{task.status}</em>
    </div>
  );
}

function EventLine({ tone, title, detail }: { tone: 'green' | 'red' | 'amber' | 'cyan'; title: string; detail: string }) {
  return (
    <div className="agentverse-event-line">
      <span className={`agentverse-event-dot ${tone}`} />
      <div>
        <strong>{title}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

function RingMetric({ label, value, color }: { label: string; value: number; color: string }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="agentverse-ring" style={{ background: `conic-gradient(${color} ${safeValue * 3.6}deg, rgba(30,41,59,0.9) 0deg)` }}>
      <div>
        <strong>{Math.round(value)}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function SparkArea({ values, stroke, fill }: { values: number[]; stroke: string; fill: string }) {
  const width = 520;
  const height = 190;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * width;
    const y = height - ((value - min) / Math.max(max - min, 1)) * (height - 12) - 6;
    return `${x},${y}`;
  });
  const areaPoints = `0,${height} ${points.join(' ')} ${width},${height}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="agentverse-spark" role="img" aria-label="Portfolio sparkline">
      <polygon points={areaPoints} fill={fill} />
      <polyline points={points.join(' ')} fill="none" stroke={stroke} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MiniLineChart({ values, compact = false }: { values: number[]; compact?: boolean }) {
  const width = compact ? 140 : 260;
  const height = compact ? 42 : 92;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * width;
    const y = height - ((value - min) / Math.max(max - min, 1)) * (height - 10) - 5;
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={compact ? 'agentverse-mini-chart compact' : 'agentverse-mini-chart'} role="img" aria-label="Mini chart">
      <polyline points={points.join(' ')} fill="none" stroke="#67e8f9" strokeWidth={compact ? 3 : 2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BarSeries({ values }: { values: number[] }) {
  return (
    <div className="agentverse-bars">
      {values.map((value, index) => (
        <div key={`${value}-${index}`}>
          <i style={{ height: `${value}%` }} />
          <span>R{index + 1}</span>
        </div>
      ))}
    </div>
  );
}

function statusBadgeClass(status: Agent['status']): string {
  if (status === 'Working') return 'agentverse-agent-status working';
  if (status === 'Thinking') return 'agentverse-agent-status thinking';
  if (status === 'Napping') return 'agentverse-agent-status napping';
  return 'agentverse-agent-status idle';
}

function statusLabel(status: SystemStatus): string {
  if (status === 'online') return 'SYSTEM ONLINE';
  if (status === 'degraded') return 'DEGRADED';
  return 'OFFLINE';
}

function formatSigned(value: number): string {
  return percentFormatter.format(value);
}

function trendTextClass(trend: Trend): string {
  if (trend === 'bullish') return 'agentverse-tone-green';
  if (trend === 'bearish') return 'agentverse-tone-red';
  return 'agentverse-tone-cyan';
}
