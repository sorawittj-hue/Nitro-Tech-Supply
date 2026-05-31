import React from 'react';

export const CompanyCapital: React.FC = () => {
  return (
    <div className="panel-card">
      <div className="panel-card-header">
        <span className="panel-card-title">🏦 COMPANY CAPITAL</span>
        <span className="badge badge-success">HEALTHY</span>
      </div>
      
      <div className="income-display" style={{ marginBottom: '8px' }}>
        <span className="income-currency">฿</span>
        <span className="income-amount" style={{ color: 'var(--accent-cyan)' }}>1,245,000</span>
      </div>
      <div className="income-sub">Total Assets + Cash Balance</div>

      <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '12px 0', paddingTop: '12px' }}>
        <div className="breakdown-item">
          <span className="breakdown-label">💵 Cash on Hand</span>
          <span className="breakdown-value">฿680,000</span>
        </div>
        <div className="breakdown-item">
          <span className="breakdown-label">📦 Inventory Value</span>
          <span className="breakdown-value">฿485,000</span>
        </div>
        <div className="breakdown-item">
          <span className="breakdown-label">📋 Accounts Receivable</span>
          <span className="breakdown-value">฿80,000</span>
        </div>
      </div>
    </div>
  );
};
