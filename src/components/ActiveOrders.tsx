import React from 'react';

const orders = [
  { id: 'ORD-2841', customer: 'Pantip Plaza #12', items: 'RTX 4070 x5', total: '฿115,000', status: 'shipping' },
  { id: 'ORD-2840', customer: 'JIB (Central)', items: 'DDR5 32GB x20', total: '฿58,000', status: 'packed' },
  { id: 'ORD-2839', customer: 'Lazada Store', items: 'NVMe SSD x10', total: '฿32,500', status: 'delivered' },
  { id: 'ORD-2838', customer: 'Singapore Dist.', items: 'SSD 1TB x200', total: '฿580,000', status: 'shipping' },
];

export const ActiveOrders: React.FC = () => {
  return (
    <div className="panel-card">
      <div className="panel-card-header">
        <span className="panel-card-title">🚚 ACTIVE ORDERS</span>
        <span className="badge badge-info">{orders.length} ORDERS</span>
      </div>

      <div>
        {orders.map((order, i) => (
          <div key={i} className="restock-item">
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '11px' }}>{order.id}</span>
                <span className={`badge ${
                  order.status === 'delivered' ? 'badge-success' : 
                  order.status === 'shipping' ? 'badge-warning' : 'badge-info'
                }`}>
                  {order.status.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '4px' }}>{order.customer}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                <span>{order.items}</span>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>{order.total}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
