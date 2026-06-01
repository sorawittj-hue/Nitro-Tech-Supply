import React from 'react';
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useApp } from '../context/AppContext';

export const AnalyticsView: React.FC = () => {
  const { inventory, orders, finance, loadingData } = useApp();

  if (loadingData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
        Loading sales and inventory metrics...
      </div>
    );
  }

  // Calculate live financial metrics
  const cashOnHand = finance?.cashOnHand ?? 0;
  const inventoryValue = inventory.reduce((sum, item) => sum + item.stock * item.price, 0);
  const pendingInvoices = orders
    .filter(o => o.status === 'Pending')
    .reduce((sum, o) => sum + o.value, 0);
  
  const realizedSales = orders
    .filter(o => o.status !== 'Pending')
    .reduce((sum, o) => sum + o.value, 0);

  const totalCapital = cashOnHand + inventoryValue + pendingInvoices;

  const totalOrdersCount = orders.length;
  const completedOrders = orders.filter(o => o.status !== 'Pending');
  const completedOrdersCount = completedOrders.length;
  
  const fulfillmentRate = totalOrdersCount > 0 
    ? (completedOrdersCount / totalOrdersCount) * 100 
    : 0;

  // Group by date for Daily Order Volumes
  const dailyMap: Record<string, number> = {};
  orders.forEach(o => {
    const formattedDate = o.date.length >= 10 ? o.date.slice(5) : o.date; // MM-DD
    dailyMap[formattedDate] = (dailyMap[formattedDate] || 0) + o.value;
  });

  const dailySalesData = Object.entries(dailyMap)
    .map(([day, sales]) => ({ day, sales }))
    .sort((a, b) => a.day.localeCompare(b.day));

  // Generate cumulative revenue data over time
  const sortedDays = Object.keys(dailyMap).sort();
  const revenueData = sortedDays.reduce((acc, day) => {
    const prevRevenue = acc.length > 0 ? acc[acc.length - 1].revenue : 0;
    acc.push({
      time: day,
      revenue: prevRevenue + dailyMap[day]
    });
    return acc;
  }, [] as Array<{ time: string; revenue: number }>);

  const tooltipStyle = {
    backgroundColor: 'var(--bg-deep, #0a0f1a)',
    border: '1px solid rgba(148,163,184,0.15)',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'JetBrains Mono, monospace',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* KPI Cards */}
      <div className="analytics-grid">
        <div className="kpi-card">
          <div className="kpi-label">TOTAL CAPITAL (THB)</div>
          <div className="kpi-value green">
            ฿{totalCapital.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          <div className="kpi-sub">Assets + Cash Balance</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">REALIZED SALES</div>
          <div className="kpi-value green">฿{realizedSales.toLocaleString()}</div>
          <div className="kpi-sub">Invoiced Bulk Orders</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">PENDING INVOICES</div>
          <div className={`kpi-value ${pendingInvoices >= 0 ? 'green' : 'red'}`}>
            ฿{pendingInvoices.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          <div className="kpi-sub">Awaiting Bank Clearance</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">FULFILLMENT RATE</div>
          <div className="kpi-value cyan">{fulfillmentRate.toFixed(1)}%</div>
          <div className="kpi-sub">
            {totalOrdersCount > 0 ? `${completedOrdersCount} Shipments Completed` : 'No orders tracked yet'}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <span className="panel-card-title">📈 REVENUE GROWTH (THB)</span>
          <div className="chart-area">
            {revenueData.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No data points available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} domain={['auto', 'auto']} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#22d3ee' }} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#34d399" 
                    strokeWidth={2.5} 
                    dot={{ r: 3, fill: '#34d399', strokeWidth: 0 }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="chart-card">
          <span className="panel-card-title">📊 DAILY ORDER VOLUMES</span>
          <div className="chart-area">
            {dailySalesData.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No sales data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySalesData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis dataKey="day" stroke="#475569" fontSize={10} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#22d3ee' }} />
                  <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                    {dailySalesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.sales >= 100000 ? '#34d399' : '#22d3ee'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
