import React from 'react';
import { useApp } from '../context/AppContext';

export const CompanyCapital: React.FC = () => {
  const { inventory, orders, finance, loadingData } = useApp();

  if (loadingData) {
    return (
      <div className="panel-card">
        <div className="panel-card-header">
          <span className="panel-card-title">🏦 COMPANY CAPITAL</span>
        </div>
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
          Syncing with Backend...
        </div>
      </div>
    );
  }

  // Calculate dynamic business finance metrics
  const cashOnHand = finance?.cashOnHand ?? 680000;
  const inventoryValue = inventory.reduce((sum, item) => sum + item.stock * item.price, 0);
  const accountsReceivable = orders
    .filter(o => o.status === 'Pending')
    .reduce((sum, o) => sum + o.value, 0);

  const totalCapital = cashOnHand + inventoryValue + accountsReceivable;

  return (
    <div className="panel-card">
      <div className="panel-card-header">
        <span className="panel-card-title">🏦 COMPANY CAPITAL</span>
        <span className="badge badge-success">LIVE</span>
      </div>
      
      <div className="income-display" style={{ marginBottom: '8px' }}>
        <span className="income-currency">฿</span>
        <span className="income-amount" style={{ color: 'var(--accent-cyan)' }}>
          {totalCapital.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </span>
      </div>
      <div className="income-sub">Total Assets (Cash + Stock + Pending)</div>

      <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '12px 0', paddingTop: '12px' }}>
        <div className="breakdown-item">
          <span className="breakdown-label">💵 Cash on Hand</span>
          <span className="breakdown-value">฿{cashOnHand.toLocaleString()}</span>
        </div>
        <div className="breakdown-item">
          <span className="breakdown-label">📦 Inventory Value</span>
          <span className="breakdown-value">฿{inventoryValue.toLocaleString()}</span>
        </div>
        <div className="breakdown-item">
          <span className="breakdown-label">📋 Accounts Receivable</span>
          <span className="breakdown-value">฿{accountsReceivable.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
