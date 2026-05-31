import React, { useState, useEffect } from 'react';

interface AffiliateData {
  totalClicks: number;
  conversions: number;
  revenueTHB: number;
}

export const AffiliateTracker: React.FC = () => {
  const [data, setData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('—');

  const fetchAffiliateData = async () => {
    try {
      const res = await fetch('http://localhost:3001/affiliate');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastUpdated(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.error("Backend not running", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliateData();
    const interval = setInterval(fetchAffiliateData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleDownloadReport = () => {
    if (!data) return;
    const ts = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
    const report = `== AFFILIATE INCOME REPORT ==\nGenerated: ${ts}\n\nTotal Clicks: ${data.totalClicks}\nConversions: ${data.conversions}\nTotal Revenue: ฿${data.revenueTHB.toFixed(2)}\n`;
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `affiliate_report_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !data) {
    return (
      <div className="panel-card">
        <div className="panel-card-header">
          <span className="panel-card-title">📊 AFFILIATE INCOME</span>
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
        <span className="panel-card-title">📊 AFFILIATE INCOME</span>
        <button
          onClick={fetchAffiliateData}
          className="btn-icon"
          style={{ width: '26px', height: '26px', fontSize: '13px' }}
          title="Refresh Data"
        >
          🔄
        </button>
      </div>

      <div className="income-display">
        <span className="income-currency">฿</span>
        <span className="income-amount">{data?.revenueTHB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
      </div>
      <div className="income-sub">
        TOTAL REVENUE (THB)
      </div>

      <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '12px 0', paddingTop: '12px' }}>
        <div className="breakdown-item">
          <span className="breakdown-label">🔗 Total Clicks</span>
          <span className="breakdown-value">{data?.totalClicks.toLocaleString()}</span>
        </div>
        <div className="breakdown-item">
          <span className="breakdown-label">🎯 Conversions</span>
          <span className="breakdown-value">{data?.conversions.toLocaleString()}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
        <span>Updated: {lastUpdated}</span>
        <button onClick={handleDownloadReport} className="btn btn-ghost" style={{ fontSize: '14px', padding: '4px 8px' }}>
          📥 Report
        </button>
      </div>
    </div>
  );
};
