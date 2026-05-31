import { useApp } from '../context/AppContext';
import type { Agent } from '../data/agents';

export const ActiveOrders: React.FC<{ agents?: Agent[] }> = () => {
  const { orders, loadingData } = useApp();

  if (loadingData) {
    return (
      <div className="panel-card">
        <div className="panel-card-header">
          <span className="panel-card-title">🚚 ACTIVE ORDERS</span>
        </div>
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
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
                <span className={`badge ${order.status === 'Delivered' ? 'badge-success' : order.status === 'Shipped' ? 'badge-warning' : 'badge-info'}`}>
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
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            No active orders. Check Backend.
          </div>
        )}
      </div>
    </div>
  );
};
