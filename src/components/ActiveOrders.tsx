import React, { useState, useEffect } from 'react';

interface OrderItem {
  id: string;
  customer: string;
  item: string;
  quantity: number;
  status: string;
  value: number;
  date: string;
}

export const ActiveOrders: React.FC = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/orders')
      .then(r => r.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Backend not running", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="panel-card">
        <div className="panel-card-header">
          <span className="panel-card-title">🚚 ACTIVE ORDERS</span>
        </div>
        <div style={{padding: '20px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '14px'}}>
          Syncing with Backend...
        </div>
      </div>
    );
  }

  return (
    <div className="panel-card">
      <div className="panel-card-header">
        <span className="panel-card-title">🚚 ACTIVE ORDERS</span>
        <span className="badge badge-info">{orders.length} ORDERS</span>
      </div>

      <div>
        {orders.map((order, i) => (
          <div key={order.id || i} className="restock-item">
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '13px' }}>ORD-{order.id}</span>
                <span className={`badge ${
                  order.status.toLowerCase() === 'delivered' ? 'badge-success' : 
                  order.status.toLowerCase() === 'shipping' ? 'badge-warning' : 'badge-info'
                }`}>
                  {order.status.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '4px' }}>{order.customer}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-muted)', marginTop: '2px' }}>
                <span>{order.item} x{order.quantity}</span>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>฿{order.value?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <div style={{padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px'}}>
            No active orders. Check Backend.
          </div>
        )}
      </div>
    </div>
  );
};
