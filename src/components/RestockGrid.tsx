import React, { useState, useEffect } from 'react';

interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  threshold: number;
  price: number;
}

export const RestockGrid: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/inventory')
      .then(r => r.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Backend not running", err);
        setLoading(false);
      });
  }, []);

  const getStatus = (stock: number, threshold: number) => {
    if (stock <= threshold * 0.5) return 'critical';
    if (stock <= threshold) return 'low';
    return 'ok';
  };

  if (loading) {
    return (
      <div className="panel-card">
        <div className="panel-card-header">
          <span className="panel-card-title">📦 STOCK LEVELS</span>
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
        <span className="panel-card-title">📦 STOCK LEVELS</span>
        <span className="badge badge-warning">{items.filter(i => getStatus(i.stock, i.threshold) !== 'ok').length} ALERTS</span>
      </div>

      <div>
        {items.map((item, i) => {
          const status = getStatus(item.stock, item.threshold);
          return (
            <div key={item.id || i} className="restock-item">
              <div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.name}</div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  Min: {item.threshold} units | ฿{item.price?.toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  fontWeight: 700, 
                  color: status === 'critical' ? 'var(--accent-rose)' : 
                         status === 'low' ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                  fontFamily: 'var(--font-retro)',
                  fontSize: '18px'
                }}>
                  {item.stock}
                </span>
                <span className={`badge ${status === 'critical' ? 'badge-danger' : status === 'low' ? 'badge-warning' : 'badge-success'}`}>
                  {status === 'critical' ? 'CRITICAL' : status === 'low' ? 'LOW' : 'OK'}
                </span>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div style={{padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px'}}>
            No items in inventory. Check Backend.
          </div>
        )}
      </div>
    </div>
  );
};
