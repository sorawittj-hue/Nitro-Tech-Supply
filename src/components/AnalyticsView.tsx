import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const initialRevenueData = [
  { time: '10:00', revenue: 980400 },
  { time: '10:15', revenue: 980450 },
  { time: '10:30', revenue: 980420 },
  { time: '10:45', revenue: 980550 },
  { time: '11:00', revenue: 980680 },
  { time: '11:15', revenue: 980600 },
  { time: '11:30', revenue: 980750 },
  { time: '11:45', revenue: 980983 },
];

const initialDailySalesData = [
  { day: '05-21', sales: 45000 },
  { day: '05-22', sales: 32000 },
  { day: '05-23', sales: 58000 },
  { day: '05-24', sales: 61000 },
  { day: '05-25', sales: 29000 },
  { day: '05-26', sales: 74000 },
  { day: '05-27', sales: 98343 },
];

export const AnalyticsView: React.FC = () => {
  const [realizedSales] = useState(98343);
  const [pendingInvoices, setPendingInvoices] = useState(-12500);
  const [revenueData, setRevenueData] = useState(initialRevenueData);
  const [dailySalesData] = useState(initialDailySalesData);

  useEffect(() => {
    const interval = setInterval(() => {
      setPendingInvoices(prev => Number((prev + (Math.random() - 0.45) * 500).toFixed(2)));
      setRevenueData(prev => {
        const lastVal = prev[prev.length - 1].revenue;
        const delta = (Math.random() - 0.4) * 80;
        const t = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return [...prev.slice(1), { time: t, revenue: Number((lastVal + delta).toFixed(2)) }];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalSales = realizedSales + pendingInvoices;

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
          <div className="kpi-value green">฿{(980000 + totalSales).toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
          <div className="kpi-sub">Assets + Cash Balance</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">TODAY'S SALES</div>
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
          <div className="kpi-value cyan">96.8%</div>
          <div className="kpi-sub">122 Shipments Completed</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <span className="panel-card-title">📈 REVENUE GROWTH (THB)</span>
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} domain={['auto', 'auto']} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#22d3ee' }} />
                <Line type="monotone" dataKey="revenue" stroke="#34d399" strokeWidth={2.5} dot={{ r: 3, fill: '#34d399', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <span className="panel-card-title">📊 DAILY ORDER VOLUMES</span>
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySalesData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="day" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#22d3ee' }} />
                <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                  {dailySalesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.sales >= 40000 ? '#34d399' : '#22d3ee'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
