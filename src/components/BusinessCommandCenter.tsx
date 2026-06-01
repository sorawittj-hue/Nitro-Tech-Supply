import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Agent } from '../data/agents';

interface BusinessCommandCenterProps {
  agents: Agent[];
  onSelectAgent: (agent: Agent) => void;
  onNavigate: (panel: string) => void;
}

interface ExecutiveAction {
  id: string;
  title: string;
  owner: string;
  priority: 'high' | 'medium' | 'low';
  detail: string;
}

const currencyFormatter = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  maximumFractionDigits: 0,
});

export function BusinessCommandCenter({ agents, onSelectAgent, onNavigate }: BusinessCommandCenterProps) {
  const { inventory, orders, finance, affiliate, loadingData, isOffline, lastUpdated, refreshAllData } = useApp();

  const metrics = useMemo(() => {
    const cashOnHand = finance?.cashOnHand ?? 0;
    const inventoryValue = inventory.reduce((sum, item) => sum + item.stock * item.price, 0);
    const pendingReceivable = orders
      .filter(order => order.status === 'Pending')
      .reduce((sum, order) => sum + order.value, 0);
    const realizedSales = orders
      .filter(order => order.status !== 'Pending')
      .reduce((sum, order) => sum + order.value, 0);
    const lowStockItems = inventory.filter(item => item.stock <= item.threshold);
    const criticalStockItems = inventory.filter(item => item.stock <= item.threshold * 0.5);
    const activeOrders = orders.filter(order => order.status !== 'Delivered');
    const workingAgents = agents.filter(agent => agent.status === 'Working').length;
    const totalCapital = cashOnHand + inventoryValue + pendingReceivable;

    return {
      cashOnHand,
      inventoryValue,
      pendingReceivable,
      realizedSales,
      totalCapital,
      lowStockItems,
      criticalStockItems,
      activeOrders,
      workingAgents,
      teamHealth: agents.length > 0 ? Math.round((workingAgents / agents.length) * 100) : 0,
    };
  }, [agents, finance, inventory, orders]);

  const departmentMap = useMemo(() => {
    const grouped = new Map<string, Agent[]>();
    agents.forEach(agent => {
      const current = grouped.get(agent.department) ?? [];
      grouped.set(agent.department, [...current, agent]);
    });
    return Array.from(grouped.entries()).sort(([left], [right]) => left.localeCompare(right));
  }, [agents]);

  const executiveActions = useMemo<ExecutiveAction[]>(() => {
    const actions: ExecutiveAction[] = [];

    metrics.criticalStockItems.slice(0, 2).forEach(item => {
      actions.push({
        id: `restock-${item.id}`,
        title: `อนุมัติเติมสต็อก ${item.name}`,
        owner: 'Atlas + Mira',
        priority: 'high',
        detail: `เหลือ ${item.stock} ชิ้น ต่ำกว่าเกณฑ์ ${item.threshold}`,
      });
    });

    if (metrics.pendingReceivable > 0) {
      actions.push({
        id: 'collect-receivable',
        title: 'ตามยอดลูกหนี้ค้างรับ',
        owner: 'Vega',
        priority: 'high',
        detail: `${currencyFormatter.format(metrics.pendingReceivable)} ยังรอเคลียร์`,
      });
    }

    if (metrics.activeOrders.length > 0) {
      actions.push({
        id: 'clear-orders',
        title: 'เร่งปิด order ที่ยังไม่ delivered',
        owner: 'Orion + Aria',
        priority: 'medium',
        detail: `${metrics.activeOrders.length} order ยังอยู่ระหว่างจัดการ`,
      });
    }

    if (actions.length === 0) {
      actions.push({
        id: 'growth-review',
        title: 'ประชุม growth review รายวัน',
        owner: 'CEO + Nova + Max',
        priority: 'low',
        detail: 'ไม่มีไฟไหม้ตอนนี้ เหมาะกับการวางแผนยอดขายรอบถัดไป',
      });
    }

    return actions.slice(0, 4);
  }, [metrics]);

  return (
    <div className="command-center">
      <div className="command-hero">
        <div>
          <div className="command-eyebrow">CEO OPERATING SYSTEM</div>
          <h2>ศูนย์บัญชาการ Nitro Tech Supply</h2>
          <p>
            มุมมองเดียวสำหรับบริหารบริษัทซื้อขายอุปกรณ์คอมพิวเตอร์: เงินสด สต็อก ดีล ทีมงาน AI และงานที่ CEO ต้องตัดสินใจวันนี้
          </p>
        </div>
        <div className="command-hero-actions">
          <button className="btn btn-primary" onClick={() => onNavigate('inventory')}>เปิดคลังสินค้า</button>
          <button className="btn btn-ghost" onClick={() => onNavigate('chat')}>สั่งทีม AI</button>
          <button className="btn btn-ghost" onClick={refreshAllData}>Refresh</button>
        </div>
      </div>

      <div className="command-status-row">
        <span className={`badge ${isOffline ? 'badge-warning' : 'badge-success'}`}>
          {isOffline ? 'OFFLINE MODE' : 'LIVE BACKEND'}
        </span>
        <span>Updated: {lastUpdated}</span>
        {loadingData && <span>Syncing...</span>}
      </div>

      <div className="command-metrics-grid">
        <MetricCard label="Total Capital" value={currencyFormatter.format(metrics.totalCapital)} sub="Cash + Stock + Receivable" tone="green" />
        <MetricCard label="Realized Sales" value={currencyFormatter.format(metrics.realizedSales)} sub={`${orders.length} orders tracked`} tone="cyan" />
        <MetricCard label="Inventory Value" value={currencyFormatter.format(metrics.inventoryValue)} sub={`${metrics.lowStockItems.length} SKU need attention`} tone={metrics.criticalStockItems.length > 0 ? 'red' : 'amber'} />
        <MetricCard label="Team Health" value={`${metrics.teamHealth}%`} sub={`${metrics.workingAgents}/${agents.length} agents working`} tone="violet" />
      </div>

      <div className="command-grid">
        <section className="command-section">
          <div className="panel-card-header">
            <span className="panel-card-title">CEO DECISION QUEUE</span>
            <span className="badge badge-danger">{executiveActions.filter(action => action.priority === 'high').length} HIGH</span>
          </div>
          <div className="command-list">
            {executiveActions.map(action => (
              <div key={action.id} className="command-action">
                <div>
                  <div className="command-action-title">{action.title}</div>
                  <div className="command-action-detail">{action.detail}</div>
                </div>
                <div className="command-action-meta">
                  <span className={`badge ${action.priority === 'high' ? 'badge-danger' : action.priority === 'medium' ? 'badge-warning' : 'badge-info'}`}>
                    {action.priority.toUpperCase()}
                  </span>
                  <span>{action.owner}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="command-section">
          <div className="panel-card-header">
            <span className="panel-card-title">COMPANY DEPARTMENTS</span>
            <span className="badge badge-info">{departmentMap.length} UNITS</span>
          </div>
          <div className="department-grid">
            {departmentMap.map(([department, members]) => (
              <div key={department} className="department-card">
                <div className="department-name">{department}</div>
                <div className="department-members">
                  {members.map(member => (
                    <button key={member.id} type="button" onClick={() => onSelectAgent(member)}>
                      <span>{member.avatar}</span>
                      <span>{member.name.split('(')[0].trim()}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="command-grid three">
        <section className="command-section">
          <div className="panel-card-header">
            <span className="panel-card-title">LOW STOCK WATCH</span>
            <span className="badge badge-warning">{metrics.lowStockItems.length} SKU</span>
          </div>
          <div className="compact-list">
            {inventory.length === 0 ? (
              <span className="muted-line">Waiting for real inventory data.</span>
            ) : metrics.lowStockItems.length === 0 ? (
              <span className="muted-line">All tracked SKUs are above threshold.</span>
            ) : metrics.lowStockItems.slice(0, 5).map(item => (
              <div key={item.id} className="compact-row">
                <span>{item.name}</span>
                <strong>{item.stock}/{item.threshold}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="command-section">
          <div className="panel-card-header">
            <span className="panel-card-title">ACTIVE ORDERS</span>
            <span className="badge badge-info">{metrics.activeOrders.length}</span>
          </div>
          <div className="compact-list">
            {orders.length === 0 ? (
              <span className="muted-line">Waiting for real order data.</span>
            ) : metrics.activeOrders.length === 0 ? (
              <span className="muted-line">No active orders awaiting delivery.</span>
            ) : metrics.activeOrders.slice(0, 5).map(order => (
              <div key={order.id} className="compact-row">
                <span>ORD-{order.id} {order.customer}</span>
                <strong>{order.status}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="command-section">
          <div className="panel-card-header">
            <span className="panel-card-title">GROWTH SIGNAL</span>
            <span className="badge badge-success">LIVE</span>
          </div>
          <div className="compact-list">
            <div className="compact-row">
              <span>Affiliate Revenue</span>
              <strong>{currencyFormatter.format(affiliate?.revenueTHB ?? 0)}</strong>
            </div>
            <div className="compact-row">
              <span>Conversions</span>
              <strong>{affiliate?.conversions.toLocaleString('th-TH') ?? '0'}</strong>
            </div>
            <div className="compact-row">
              <span>Retail next move</span>
              <strong>{orders.length > 0 ? 'Review conversion by SKU' : 'Waiting for order data'}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: 'green' | 'cyan' | 'amber' | 'red' | 'violet' }) {
  return (
    <div className="command-metric-card">
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${tone === 'violet' ? 'cyan' : tone}`}>{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}
