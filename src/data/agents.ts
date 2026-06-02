export interface AgentSearchResult {
  id: string;
  name: string;
  title: string;
  avatar: string;
}

export interface Agent {
  id: string;
  spriteId?: string;
  name: string;
  title: string;
  avatar: string;
  status: 'Working' | 'Thinking' | 'Napping' | 'Idle';
  department: string;
  mission: string;
  authorityLevel: 'Owner' | 'Director' | 'Manager' | 'Specialist';
  description: string;
  tools: string;
  system: string;
  reportsTo: string;
  position: { left: string; top: string };
  individualSkill: string;
  sharedSkill: string;
  sessionId?: string;
  isLive?: boolean;
  activeTools?: string[];
  isWaiting?: boolean;
  inputTokens?: number;
  outputTokens?: number;
  lastActiveAt?: number;
  providerId?: 'hermes' | 'mimo' | 'offline';
  isTeamLead?: boolean;
  subAgentIds?: string[];
}

const SHARED_SKILL = `# AgentVerse OS Quant Trading Protocol

## Firm Context
Nitro Tech Supply is now operating as a Fund of One trading command center.
The dashboard is the AgentVerse OS for an automated trading firm powered by OmniTrade AI 3.0.
CEO Jay / Sorawit is the final risk owner.

## Core Pillars
1. trading-research-system: run a self-learning research loop every 6 hours (0 */6), review past trades, optimize parameters, and publish strategy deltas.
2. signal-bot: monitor live markets, generate entry/exit signals, and route mocked exchange orders through OmniTrade AI 3.0.
3. us-stock-watchlist: track US equities, price action, volume anomalies, and technical indicators.
4. Portfolio & System: manage total equity, allocation, drawdown, win rate, and agent health.

## Risk Rules
- Never present simulated or mocked execution as real filled trades.
- Escalate max drawdown, exchange connectivity failures, abnormal volume, or strategy degradation immediately.
- CEO approval is required before enabling live capital deployment, changing API credentials, increasing leverage, or overriding hard risk limits.
- Every recommendation must include risk, confidence, and the next verifiable action.
`;

export const initialAgents: Agent[] = [
  {
    id: 'ceo_jay',
    name: 'Jay (Fund Manager)',
    title: 'FOUNDER, CEO & RISK OWNER',
    avatar: '👑',
    status: 'Working',
    department: 'Portfolio Command',
    mission: 'อนุมัติ risk limits, capital allocation, live trading mode และ strategic direction ของ Fund of One',
    authorityLevel: 'Owner',
    description: 'ผู้ควบคุม AgentVerse OS และเจ้าของพอร์ต กำหนด drawdown ceiling, allocation policy, trade permissions และการเปิดใช้เงินจริง',
    tools: 'Portfolio Cockpit, Risk Console, Approval Gate, OmniTrade AI 3.0 Override',
    system: 'fund-command',
    reportsTo: 'None (Owner)',
    position: { left: '76%', top: '34%' },
    sessionId: 'ceo-jay-command',
    isLive: false,
    providerId: 'offline',
    isTeamLead: true,
    subAgentIds: ['orchestrator-nitro', 'xaugod', 'housekeeper', 'joe', 'finance_vega', 'policy', 'jing', 'procurement_mira'],
    individualSkill: `# Jay Fund Manager Directives

## Role
Jay is the final approval gate for trading capital, leverage, live API access, and risk overrides.

## Operating Rules
- Review daily PnL, drawdown, risk heat, and agent status before approving new exposure.
- Ask Hermes for allocation and risk summaries before moving from paper to live execution.
- Approve or reject any action that changes live capital, exchange credentials, or hard stop-loss rules.
- Keep the firm in paper/simulated mode until live risk controls are independently verified.`,
    sharedSkill: SHARED_SKILL,
  },
  {
    id: 'orchestrator-nitro',
    spriteId: 'policy',
    name: 'Hermes',
    title: 'PORTFOLIO & SYSTEM MANAGER',
    avatar: '🧠',
    status: 'Working',
    department: 'Portfolio & System',
    mission: 'คุมภาพรวมพอร์ต, allocation, max drawdown, win rate, system health และประสาน agent ทั้งหมด',
    authorityLevel: 'Director',
    description: 'Hermes เป็นผู้จัดการระบบ AgentVerse OS ตรวจ risk budget, capital allocation, agent uptime และ decision queue ก่อนส่งเรื่องให้ CEO',
    tools: 'Portfolio Risk Engine, Allocation Matrix, System Health Router, Agent Task Orchestrator',
    system: 'portfolio-system-manager',
    reportsTo: 'Jay (Fund Manager)',
    position: { left: '61%', top: '48%' },
    sessionId: 'orchestrator-nitro',
    isLive: false,
    providerId: 'offline',
    isTeamLead: true,
    subAgentIds: ['xaugod', 'housekeeper', 'joe', 'finance_vega'],
    individualSkill: `# Hermes Portfolio & System Manager

## Responsibilities
- Maintain portfolio-level risk visibility: equity, exposure, drawdown, win rate, and cash buffer.
- Route trading missions to OmniTrade Signal Bot, Quant Researcher, and US Market Analyst.
- Convert agent outputs into decision memos with risk, confidence, and recommended action.
- Block live deployment when risk telemetry is stale or exchange connectivity is unverified.`,
    sharedSkill: SHARED_SKILL,
  },
  {
    id: 'xaugod',
    spriteId: 'xaugod',
    name: 'OmniTrade Signal Bot',
    title: 'EXECUTION AGENT',
    avatar: '⚡',
    status: 'Working',
    department: 'Signal Bot',
    mission: 'ติดตามตลาดแบบ real-time, สร้าง entry/exit signal และส่งคำสั่ง mock exchange ผ่าน OmniTrade AI 3.0',
    authorityLevel: 'Manager',
    description: 'Execution agent สำหรับ signal-bot ตรวจ momentum, volatility, order state และจำลองการส่งคำสั่งซื้อขายตาม risk limits',
    tools: 'OmniTrade AI 3.0, Mock Exchange API, Signal Router, Entry/Exit Engine',
    system: 'signal-bot',
    reportsTo: 'Hermes',
    position: { left: '48%', top: '56%' },
    sessionId: 'signal-bot-omnitrade',
    isLive: false,
    providerId: 'offline',
    individualSkill: `# OmniTrade Signal Bot

## Responsibilities
- Monitor live market placeholders and generate entry/exit signals with confidence scores.
- Execute mocked orders only; never claim real fills without verified exchange API mode.
- Maintain active trade status, stop-loss state, and current PnL.
- Escalate slippage, API disconnects, or drawdown breach to Hermes and Jay.`,
    sharedSkill: SHARED_SKILL,
  },
  {
    id: 'housekeeper',
    spriteId: 'housekeeper',
    name: 'Quant Researcher',
    title: 'SELF-LEARNING STRATEGY AGENT',
    avatar: '🔬',
    status: 'Thinking',
    department: 'Trading Research',
    mission: 'รัน research loop ทุก 6 ชั่วโมง วิเคราะห์ trade history, backtest และปรับ parameters',
    authorityLevel: 'Manager',
    description: 'ดูแล trading-research-system จำลอง CRON 0 */6 เพื่อหา parameter drift, strategy decay และ optimization candidates',
    tools: 'Backtest Engine, Parameter Optimizer, Trade Journal Analyzer, CRON 0 */6 Research Loop',
    system: 'trading-research-system',
    reportsTo: 'Hermes',
    position: { left: '24%', top: '43%' },
    sessionId: 'trading-research-system',
    isLive: false,
    providerId: 'offline',
    isTeamLead: true,
    subAgentIds: ['finance_vega'],
    individualSkill: `# Quant Researcher

## Responsibilities
- Simulate a 6-hour self-learning loop: analyze past trades, optimize parameters, and publish strategy deltas.
- Track Sharpe ratio, max drawdown, walk-forward results, and overfitting risk.
- Flag strategies that improve backtest but reduce robustness.
- Produce concise research notes for Hermes before any execution rule changes.`,
    sharedSkill: SHARED_SKILL,
  },
  {
    id: 'joe',
    spriteId: 'joe',
    name: 'US Market Analyst',
    title: 'WATCHLIST MANAGER',
    avatar: '📈',
    status: 'Working',
    department: 'US Stock Watchlist',
    mission: 'ติดตามหุ้นสหรัฐ, price action, volume anomalies และ technical indicators',
    authorityLevel: 'Manager',
    description: 'ดูแล us-stock-watchlist สำหรับ AAPL, NVDA, MSFT, TSLA, SPY และหุ้นเป้าหมาย วิเคราะห์ trend, volume spike และ technical signal',
    tools: 'US Equity Watchlist, Volume Anomaly Scanner, RSI/MACD Dashboard, Market Regime Notes',
    system: 'us-stock-watchlist',
    reportsTo: 'Hermes',
    position: { left: '42%', top: '39%' },
    sessionId: 'us-market-analyst',
    isLive: false,
    providerId: 'offline',
    individualSkill: `# US Market Analyst

## Responsibilities
- Track US equity watchlist price action, volume anomalies, and technical indicators.
- Surface market regime changes that affect signal-bot execution.
- Identify stocks with abnormal volume, trend continuation, or reversal risk.
- Keep reports clear: ticker, signal, confidence, risk, and next action.`,
    sharedSkill: SHARED_SKILL,
  },
  {
    id: 'finance_vega',
    spriteId: 'policy',
    name: 'Vega Risk Controller',
    title: 'RISK & PERFORMANCE CONTROLLER',
    avatar: '🛡️',
    status: 'Thinking',
    department: 'Portfolio & System',
    mission: 'คุม max drawdown, exposure, win rate, daily PnL และ stop-trading conditions',
    authorityLevel: 'Director',
    description: 'Risk controller ที่ตรวจ portfolio heat, exposure concentration, daily loss limits และ performance quality ก่อนส่งให้ Hermes',
    tools: 'Risk Heatmap, Drawdown Monitor, Win Rate Tracker, Exposure Guard',
    system: 'risk-control',
    reportsTo: 'Hermes',
    position: { left: '67%', top: '52%' },
    sessionId: 'risk-controller-vega',
    isLive: false,
    providerId: 'offline',
    individualSkill: `# Vega Risk Controller

## Responsibilities
- Track max drawdown, daily PnL, win rate, and risk per trade.
- Stop new exposure when risk limits are stale, breached, or unverifiable.
- Challenge signal quality before any strategy is promoted.
- Give Hermes a risk-first summary with clear pass/fail status.`,
    sharedSkill: SHARED_SKILL,
  },
  {
    id: 'policy',
    spriteId: 'policy',
    name: 'Orion Compliance',
    title: 'BROKER, API & POLICY GUARD',
    avatar: '🕵️',
    status: 'Working',
    department: 'Compliance',
    mission: 'ตรวจ API key hygiene, broker/exchange connectivity, audit trail และ live-trading permissions',
    authorityLevel: 'Manager',
    description: 'Compliance guard สำหรับการเชื่อม exchange/broker, key rotation, audit log และ policy ก่อนเปิดเงินจริง',
    tools: 'API Key Policy, Broker Connectivity Check, Audit Trail, Permission Gate',
    system: 'trading-compliance',
    reportsTo: 'Hermes',
    position: { left: '33%', top: '62%' },
    sessionId: 'compliance-orion',
    isLive: false,
    providerId: 'offline',
    individualSkill: `# Orion Compliance

## Responsibilities
- Verify no secrets are exposed in browser bundles or commits.
- Confirm exchange API mode before any execution agent reports live fills.
- Maintain audit requirements for strategy changes, order actions, and capital approvals.
- Escalate credential, broker, and policy risks immediately.`,
    sharedSkill: SHARED_SKILL,
  },
  {
    id: 'jing',
    spriteId: 'jing',
    name: 'Luna Ops Monitor',
    title: 'SYSTEM RELIABILITY & INCIDENT AGENT',
    avatar: '🛰️',
    status: 'Working',
    department: 'Portfolio & System',
    mission: 'ตรวจ uptime, latency, telemetry freshness, incident queue และ dashboard health',
    authorityLevel: 'Specialist',
    description: 'Reliability agent สำหรับตรวจ background loop, transport status, API health, stale telemetry และ incident escalation',
    tools: 'Telemetry Freshness Monitor, Incident Queue, Latency Watch, Health Probe',
    system: 'system-reliability',
    reportsTo: 'Hermes',
    position: { left: '37%', top: '45%' },
    sessionId: 'system-reliability-luna',
    isLive: false,
    providerId: 'offline',
    individualSkill: `# Luna Ops Monitor

## Responsibilities
- Monitor system health, stale data, background loop timing, and agent uptime.
- Open incident tasks when API health, transport, or research loops degrade.
- Keep dashboards honest by labeling mocked data and offline states clearly.
- Report operational risk before trading risk is assessed.`,
    sharedSkill: SHARED_SKILL,
  },
  {
    id: 'procurement_mira',
    spriteId: 'joe',
    name: 'Mira Data Steward',
    title: 'MARKET DATA & DATA QUALITY AGENT',
    avatar: '🧬',
    status: 'Idle',
    department: 'Trading Research',
    mission: 'ตรวจคุณภาพ market data, trade journal integrity, missing candles และ data drift',
    authorityLevel: 'Specialist',
    description: 'Data steward สำหรับเช็ค market data pipeline, backtest input quality, missing rows และ anomalous datasets ก่อนให้ Quant Researcher ใช้',
    tools: 'Market Data Validator, Trade Journal QA, Candle Gap Detector, Dataset Drift Monitor',
    system: 'market-data-quality',
    reportsTo: 'Quant Researcher',
    position: { left: '19%', top: '57%' },
    sessionId: 'market-data-steward-mira',
    isLive: false,
    providerId: 'offline',
    individualSkill: `# Mira Data Steward

## Responsibilities
- Validate market data quality before research runs.
- Flag missing candles, duplicated trades, bad ticks, and stale watchlist feeds.
- Preserve research reproducibility by recording dataset versions.
- Escalate data gaps before strategy optimization begins.`,
    sharedSkill: SHARED_SKILL,
  },
];
