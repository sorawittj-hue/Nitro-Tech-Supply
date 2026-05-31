import React from 'react';

const restockItems = [
  { name: 'RTX 4070 Super', stock: 42, threshold: 20, status: 'ok' },
  { name: 'RTX 4060', stock: 18, threshold: 20, status: 'low' },
  { name: 'Ryzen 7 7800X3D', stock: 55, threshold: 15, status: 'ok' },
  { name: 'DDR5 32GB Kit', stock: 8, threshold: 25, status: 'critical' },
  { name: 'NVMe SSD 1TB', stock: 34, threshold: 20, status: 'ok' },
  { name: 'B650 Motherboard', stock: 12, threshold: 15, status: 'low' },
];

export const RestockGrid: React.FC = () => {
  return (
    <div className="panel-card">
      <div className="panel-card-header">
        <span className="panel-card-title">📦 STOCK LEVELS</span>
        <span className="badge badge-warning">{restockItems.filter(i => i.status !== 'ok').length} ALERTS</span>
      </div>

      <div>
        {restockItems.map((item, i) => (
          <div key={i} className="restock-item">
            <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.name}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Min: {item.threshold} units
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ 
                fontWeight: 700, 
                color: item.status === 'critical' ? 'var(--accent-rose)' : 
                       item.status === 'low' ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                fontFamily: 'var(--font-retro)',
                fontSize: '18px'
              }}>
                {item.stock}
              </span>
              <span className={`badge ${item.status === 'critical' ? 'badge-danger' : item.status === 'low' ? 'badge-warning' : 'badge-success'}`}>
                {item.status === 'critical' ? 'CRITICAL' : item.status === 'low' ? 'LOW' : 'OK'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
