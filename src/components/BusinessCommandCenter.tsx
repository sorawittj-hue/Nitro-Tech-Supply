import { useMemo, useState, type ReactNode } from 'react';
import { useApp } from '../context/AppContext';
import type { Agent } from '../data/agents';

interface BusinessCommandCenterProps {
  agents: Agent[];
  onSelectAgent: (agent: Agent) => void;
  onNavigate: (panel: string) => void;
}

type QuantTab = 'portfolio' | 'signal-bot' | 'research' | 'watchlist';
type MarketSide = 'LONG' | 'SHORT';
type TradeStatus = 'SCANNING' | 'ARMED' | 'OPEN' | 'EXITING';
type SystemStatus = 'online' | 'degraded' | 'offline';
type Trend = 'bullish' | 'bearish' | 'neutral';

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
}

interface ResearchLoopStatus {
  id: 'trading-research-system';
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

interface CorePillar {
  id: 'trading-research-system' | 'signal-bot' | 'us-stock-watchlist' | 'portfolio-system';
  title: string;
  subtitle: string;
  owner: string;
  status: SystemStatus;
  metric: string;
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
};

const tradingSignals: TradingSignal[] = [
  { id: 'SIG-AX-1042', ticker: 'NVDA', side: 'LONG', entryPrice: 126.8, currentPrice: 131.44, pnlPct: 3.66, confidencePct: 84, status: 'OPEN', strategy: 'AI Momentum Breakout' },
  { id: 'SIG-QS-2091', ticker: 'TSLA', side: 'SHORT', entryPrice: 183.1, currentPrice: 178.22, pnlPct: 2.66, confidencePct: 78, status: 'EXITING', strategy: 'Mean Reversion Risk-Off' },
  { id: 'SIG-SP-0877', ticker: 'SPY', side: 'LONG', entryPrice: 536.2, currentPrice: 535.48, pnlPct: -0.13, confidencePct: 71, status: 'ARMED', strategy: 'Index Continuation' },
  { id: 'SIG-MS-4430', ticker: 'MSFT', side: 'LONG', entryPrice: 422.7, currentPrice: 420.11, pnlPct: -0.61, confidencePct: 68, status: 'SCANNING', strategy: 'Cloud Basket Rotation' },
];

const watchlistStocks: WatchlistStock[] = [
  { ticker: 'NVDA', price: 131.44, changePct: 3.18, relativeVolume: 2.4, rsi: 67, technicalSignal: 'bullish', sparkline: [22, 26, 25, 31, 37, 34, 42, 48] },
  { ticker: 'AAPL', price: 196.12, changePct: 0.84, relativeVolume: 1.1, rsi: 58, technicalSignal: 'neutral', sparkline: [35, 33, 36, 37, 35, 39, 38, 41] },
  { ticker: 'TSLA', price: 178.22, changePct: -2.47, relativeVolume: 1.9, rsi: 42, technicalSignal: 'bearish', sparkline: [52, 49, 45, 43, 46, 40, 36, 34] },
  { ticker: 'MSFT', price: 420.11, changePct: -0.61, relativeVolume: 0.8, rsi: 51, technicalSignal: 'neutral', sparkline: [28, 31, 30, 33, 34, 32, 35, 34] },
  { ticker: 'SPY', price: 535.48, changePct: 0.21, relativeVolume: 1.0, rsi: 55, technicalSignal: 'bullish', sparkline: [40, 41, 43, 42, 44, 46, 45, 47] },
];

const researchLoop: ResearchLoopStatus = {
  id: 'trading-research-system',
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
  const [activeTab, setActiveTab] = useState<QuantTab>('portfolio');

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
  const marketBreadth = watchlistStocks.reduce((score, stock) => stock.technicalSignal === 'bullish' ? score + 1 : stock.technicalSignal === 'bearish' ? score - 1 : score, 0);

  const pillars: CorePillar[] = [
    {
      id: 'portfolio-system',
      title: 'Portfolio & System',
      subtitle: 'Equity, allocation, drawdown, win rate, and agent health.',
      owner: quantAgents.hermes?.name ?? 'Hermes',
      status: systemStatus,
      metric: `${systemHealthPct}% agent health`,
    },
    {
      id: 'signal-bot',
      title: 'Signal Bot',
      subtitle: 'OmniTrade AI 3.0 entry/exit engine with mocked exchange execution.',
      owner: quantAgents.signalBot?.name ?? 'OmniTrade Signal Bot',
      status: 'online',
      metric: `${portfolioSnapshot.activeSignals} active signals`,
    },
    {
      id: 'trading-research-system',
      title: 'Trading Research System',
      subtitle: 'Self-learning loop, backtests, parameter drift, strategy deltas.',
      owner: quantAgents.researcher?.name ?? 'Quant Researcher',
      status: researchLoop.status,
      metric: `Next run ${researchLoop.nextRunAt}`,
    },
    {
      id: 'us-stock-watchlist',
      title: 'US Stock Watchlist',
      subtitle: 'Price action, volume anomalies, RSI, technical signals.',
      owner: quantAgents.marketAnalyst?.name ?? 'US Market Analyst',
      status: 'online',
      metric: `${watchlistStocks.length} tickers tracked`,
    },
  ];

  return (
    <div className="quant-dashboard">
      <section className="quant-hero-grid">
        <div className="quant-hero">
          <div className="quant-hero-gridlines" />
          <div className="quant-hero-content">
            <div className="quant-eyebrow">
              <span className="quant-live-dot" />
              AgentVerse OS / Fund of One
            </div>
            <h2>Quant Trading & Financial Data Center</h2>
            <p>
              OmniTrade AI 3.0 command surface for research, signals, US market intelligence, portfolio allocation,
              drawdown control, and agent reliability. Execution remains mocked until live exchange mode is explicitly approved.
            </p>
            <div className="quant-hero-actions">
              <button type="button" onClick={() => onNavigate('analytics')}>Analytics</button>
              <button type="button" onClick={() => onNavigate('chat')}>Ask Agents</button>
              <button type="button" onClick={() => void refreshAllData()}>Refresh</button>
            </div>
          </div>
        </div>

        <div className="quant-status-stack">
          <MetricPanel label="Total Equity" value={moneyFormatter.format(portfolioSnapshot.totalEquity)} delta={`${formatSigned(portfolioSnapshot.dailyPnlPct)}% today`} tone="green" />
          <MetricPanel label="Daily PnL" value={moneyFormatter.format(portfolioSnapshot.dailyPnl)} delta={`${portfolioSnapshot.activeSignals} active signals`} tone={portfolioSnapshot.dailyPnl >= 0 ? 'green' : 'red'} />
          <div className="quant-card quant-runtime-card">
            <StatusLine label="Runtime" value={statusLabel(systemStatus)} tone={systemStatus === 'online' ? 'green' : systemStatus === 'degraded' ? 'amber' : 'red'} />
            <StatusLine label="Provider" value={chatProvider.toUpperCase()} tone={hermesConnected ? 'blue' : 'amber'} />
            <StatusLine label="Transport" value={transportConnected ? 'CONNECTED' : 'OFFLINE'} tone={transportConnected ? 'green' : 'amber'} />
            <StatusLine label="Write Guard" value={nitroHealth?.dataWriteAuthRequired ? 'LOCKED' : 'OPEN'} tone={nitroHealth?.dataWriteAuthRequired ? 'green' : 'red'} />
          </div>
        </div>
      </section>

      <section className="quant-pillars">
        {pillars.map(pillar => (
          <button
            key={pillar.id}
            type="button"
            className={`quant-pillar ${activeTab === tabForPillar(pillar.id) ? 'active' : ''}`}
            onClick={() => setActiveTab(tabForPillar(pillar.id))}
          >
            <span className="quant-pillar-head">
              <strong>{pillar.title}</strong>
              <StatusDot status={pillar.status} />
            </span>
            <span>{pillar.subtitle}</span>
            <span className="quant-pillar-foot">
              <em>{pillar.owner}</em>
              <b>{pillar.metric}</b>
            </span>
          </button>
        ))}
      </section>

      <section className="quant-main-grid">
        <div className="quant-card quant-command-zone">
          <div className="quant-zone-header">
            <div>
              <span>Portfolio & System</span>
              <h3>Central Command</h3>
            </div>
            <div className="quant-tabs">
              {(['portfolio', 'signal-bot', 'research', 'watchlist'] as const).map(tab => (
                <button key={tab} type="button" className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
                  {tabLabel(tab)}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'portfolio' && (
            <div className="quant-two-col">
              <CyberPanel title="Equity Curve" badge="LIVE SIM">
                <SparkArea values={equityCurve} stroke="#22c55e" fill="rgba(34,197,94,0.16)" />
                <div className="quant-mini-grid">
                  <MiniMetric label="Sharpe" value={portfolioSnapshot.sharpeRatio.toFixed(2)} tone="blue" />
                  <MiniMetric label="Win Rate" value={`${portfolioSnapshot.winRatePct}%`} tone="green" />
                  <MiniMetric label="Max DD" value={`${portfolioSnapshot.maxDrawdownPct}%`} tone="red" />
                  <MiniMetric label="Risk Used" value={`${portfolioSnapshot.riskUtilizationPct}%`} tone="amber" />
                </div>
              </CyberPanel>
              <CyberPanel title="Allocation Matrix" badge={`${portfolioSnapshot.grossExposurePct}% Gross`}>
                <AllocationRow label="Cash Buffer" value={portfolioSnapshot.cashAllocationPct} color="#38bdf8" />
                <AllocationRow label="US Equities" value={34} color="#22c55e" />
                <AllocationRow label="Index Hedge" value={18} color="#a855f7" />
                <AllocationRow label="Tactical Short" value={11} color="#ef4444" />
                <div className="quant-notice green">Live capital is blocked until CEO approval and exchange API verification.</div>
              </CyberPanel>
            </div>
          )}

          {activeTab === 'signal-bot' && (
            <CyberPanel title="OmniTrade Signal Bot" badge="Mock Exchange">
              <div className="quant-list">
                {tradingSignals.map(signal => <SignalRow key={signal.id} signal={signal} />)}
              </div>
            </CyberPanel>
          )}

          {activeTab === 'research' && (
            <div className="quant-two-col">
              <CyberPanel title="Self-Learning Loop" badge={researchLoop.schedule}>
                <div className="quant-list">
                  <StatusLine label="Last Run" value={researchLoop.lastRunAt} tone="blue" />
                  <StatusLine label="Next Run" value={researchLoop.nextRunAt} tone="green" />
                  <StatusLine label="Optimization" value={`${researchLoop.optimizationScorePct}%`} tone="green" />
                  <StatusLine label="Parameter Drift" value={`${researchLoop.parameterDriftPct}%`} tone="amber" />
                </div>
                <div className="quant-notice violet">
                  Placeholder CRON loop: 0 */6. Future backend worker will read trade journal, run walk-forward tests, and publish strategy deltas.
                </div>
              </CyberPanel>
              <CyberPanel title="Backtest Improvement" badge={`${formatSigned(researchLoop.backtestDeltaPct)}%`}>
                <BarSeries values={backtestBars} />
              </CyberPanel>
            </div>
          )}

          {activeTab === 'watchlist' && (
            <CyberPanel title="US Stock Watchlist" badge={marketBreadth >= 0 ? 'Risk-On Bias' : 'Risk-Off Bias'}>
              <div className="quant-list">
                {watchlistStocks.map(stock => <WatchlistRow key={stock.ticker} stock={stock} />)}
              </div>
            </CyberPanel>
          )}
        </div>

        <aside className="quant-side-stack">
          <CyberPanel title="Agents in Data Center" badge={`${workingAgents}/${agents.length} Online`}>
            <div className="quant-agent-list">
              {agents.slice(0, 8).map(agent => (
                <button key={agent.id} type="button" className="quant-agent-row" onClick={() => onSelectAgent(agent)}>
                  <span className="quant-agent-avatar">{agent.avatar}</span>
                  <span className="quant-agent-copy">
                    <strong>{agent.name}</strong>
                    <small>{agent.system}</small>
                  </span>
                  <span className={statusBadgeClass(agent.status)}>{agent.status}</span>
                </button>
              ))}
            </div>
          </CyberPanel>

          <CyberPanel title="System Event Feed" badge={loadingData ? 'SYNCING' : `Updated ${lastUpdated}`}>
            <div className="quant-list">
              <EventLine tone="green" title="OmniTrade AI" detail="Mock exchange engine armed; live capital disabled." />
              <EventLine tone="blue" title="Research Loop" detail={`Next self-learning CRON window at ${researchLoop.nextRunAt}.`} />
              <EventLine tone="amber" title="Watchlist" detail="NVDA relative volume anomaly detected at 2.4x." />
              <EventLine tone={isOffline ? 'red' : 'green'} title="Backend" detail={isOffline ? 'Data API unreachable.' : 'Nitro proxy and data API reachable.'} />
            </div>
          </CyberPanel>
        </aside>
      </section>
    </div>
  );
}

function MetricPanel({ label, value, delta, tone }: { label: string; value: string; delta: string; tone: 'green' | 'red' }) {
  return (
    <div className={`quant-card quant-metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{delta}</small>
    </div>
  );
}

function CyberPanel({ title, badge, children }: { title: string; badge: string; children: ReactNode }) {
  return (
    <div className="quant-panel">
      <div className="quant-panel-header">
        <h4>{title}</h4>
        <span>{badge}</span>
      </div>
      {children}
    </div>
  );
}

function MiniMetric({ label, value, tone }: { label: string; value: string; tone: 'green' | 'red' | 'amber' | 'blue' }) {
  return (
    <div className="quant-mini-metric">
      <span>{label}</span>
      <strong className={`tone-${tone}`}>{value}</strong>
    </div>
  );
}

function StatusLine({ label, value, tone }: { label: string; value: string; tone: 'green' | 'red' | 'amber' | 'blue' }) {
  return (
    <div className="quant-status-line">
      <span>{label}</span>
      <strong className={`tone-${tone}`}>{value}</strong>
    </div>
  );
}

function SignalRow({ signal }: { signal: TradingSignal }) {
  const isProfit = signal.pnlPct >= 0;
  return (
    <div className="quant-signal-row">
      <div>
        <strong>{signal.ticker}</strong>
        <span className={signal.side === 'LONG' ? 'tone-green' : 'tone-red'}>{signal.side}</span>
        <small>{signal.id} / {signal.strategy}</small>
      </div>
      <span>Entry <b>${signal.entryPrice.toFixed(2)}</b></span>
      <span>Now <b>${signal.currentPrice.toFixed(2)}</b></span>
      <b className={isProfit ? 'tone-green' : 'tone-red'}>{formatSigned(signal.pnlPct)}%</b>
      <em>{signal.confidencePct}% / {signal.status}</em>
    </div>
  );
}

function WatchlistRow({ stock }: { stock: WatchlistStock }) {
  return (
    <div className="quant-watch-row">
      <div>
        <strong>{stock.ticker}</strong>
        <span className={trendTextClass(stock.technicalSignal)}>{stock.technicalSignal.toUpperCase()}</span>
      </div>
      <div>
        <b>${stock.price.toFixed(2)}</b>
        <small className={stock.changePct >= 0 ? 'tone-green' : 'tone-red'}>{formatSigned(stock.changePct)}%</small>
      </div>
      <SparkArea values={stock.sparkline} stroke={stock.changePct >= 0 ? '#22c55e' : '#ef4444'} fill="rgba(56,189,248,0.08)" compact />
      <div className="quant-watch-tags">
        <span>RVOL {stock.relativeVolume.toFixed(1)}x</span>
        <span>RSI {stock.rsi}</span>
      </div>
    </div>
  );
}

function AllocationRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="quant-allocation-row">
      <div><span>{label}</span><b>{value}%</b></div>
      <span className="quant-allocation-track"><i style={{ width: `${value}%`, backgroundColor: color, boxShadow: `0 0 18px ${color}` }} /></span>
    </div>
  );
}

function SparkArea({ values, stroke, fill, compact = false }: { values: number[]; stroke: string; fill: string; compact?: boolean }) {
  const width = 520;
  const height = compact ? 54 : 190;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * width;
    const y = height - ((value - min) / Math.max(max - min, 1)) * (height - 12) - 6;
    return `${x},${y}`;
  });
  const areaPoints = `0,${height} ${points.join(' ')} ${width},${height}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={compact ? 'quant-spark compact' : 'quant-spark'} role="img" aria-label="Market sparkline">
      <polygon points={areaPoints} fill={fill} />
      <polyline points={points.join(' ')} fill="none" stroke={stroke} strokeWidth={compact ? 4 : 3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BarSeries({ values }: { values: number[] }) {
  return (
    <div className="quant-bars">
      {values.map((value, index) => (
        <div key={`${value}-${index}`}>
          <i style={{ height: `${value}%` }} />
          <span>R{index + 1}</span>
        </div>
      ))}
    </div>
  );
}

function EventLine({ tone, title, detail }: { tone: 'green' | 'red' | 'amber' | 'blue'; title: string; detail: string }) {
  return (
    <div className="quant-event-line">
      <span className={`quant-event-dot tone-bg-${tone}`} />
      <span>
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
    </div>
  );
}

function StatusDot({ status }: { status: SystemStatus }) {
  return <span className={`quant-status-dot ${status}`} />;
}

function statusBadgeClass(status: Agent['status']): string {
  if (status === 'Working') return 'quant-agent-status working';
  if (status === 'Thinking') return 'quant-agent-status thinking';
  if (status === 'Napping') return 'quant-agent-status napping';
  return 'quant-agent-status idle';
}

function tabForPillar(id: CorePillar['id']): QuantTab {
  if (id === 'signal-bot') return 'signal-bot';
  if (id === 'trading-research-system') return 'research';
  if (id === 'us-stock-watchlist') return 'watchlist';
  return 'portfolio';
}

function tabLabel(tab: QuantTab): string {
  if (tab === 'signal-bot') return 'Signal Bot';
  if (tab === 'research') return 'Research';
  if (tab === 'watchlist') return 'Watchlist';
  return 'Portfolio';
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
  if (trend === 'bullish') return 'tone-green';
  if (trend === 'bearish') return 'tone-red';
  return 'tone-blue';
}
