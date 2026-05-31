import React, { useState, useEffect } from 'react';

export const AffiliateTracker: React.FC = () => {
  const [usdToThb, setUsdToThb] = useState<number>(32.61);
  const [isLoadingRate, setIsLoadingRate] = useState<boolean>(false);
  const [synnexCommission, setSynnexCommission] = useState<number>(13.57);
  const [adviceCommission, setAdviceCommission] = useState<number>(16.59);
  const [lastUpdated, setLastUpdated] = useState<string>('—');

  const fetchRate = async () => {
    setIsLoadingRate(true);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      if (res.ok) {
        const data = await res.json();
        if (data.rates?.THB) {
          setUsdToThb(Number(data.rates.THB.toFixed(2)));
          setLastUpdated(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
        }
      }
    } catch { /* */ } finally {
      setIsLoadingRate(false);
    }
  };

  useEffect(() => {
    fetchRate();
    const interval = setInterval(fetchRate, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.6) setSynnexCommission(p => Number((p + Math.random() * 0.05).toFixed(2)));
      if (Math.random() > 0.7) setAdviceCommission(p => Number((p + Math.random() * 0.08).toFixed(2)));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const totalUSD = synnexCommission + adviceCommission;
  const totalTHB = totalUSD * usdToThb;

  const handleDownloadReport = () => {
    const ts = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
    const report = `== DROPSHIP COMMISSION REPORT ==\nGenerated: ${ts}\nRate: 1 USD = ${usdToThb} THB\n\nSynnex: $${synnexCommission.toFixed(2)}\nAdvice: $${adviceCommission.toFixed(2)}\nTotal: $${totalUSD.toFixed(2)} / ฿${totalTHB.toFixed(2)}\n`;
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="panel-card">
      <div className="panel-card-header">
        <span className="panel-card-title">📊 DROPSHIP INCOME</span>
        <button
          onClick={fetchRate}
          disabled={isLoadingRate}
          className="btn-icon"
          style={{ width: '26px', height: '26px', fontSize: '11px' }}
          title="Refresh rate"
        >
          {isLoadingRate ? '⏳' : '🔄'}
        </button>
      </div>

      <div className="income-display">
        <span className="income-currency">฿</span>
        <span className="income-amount">{totalTHB.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
      <div className="income-sub">
        ${totalUSD.toFixed(2)} USD · @{usdToThb} THB/USD
      </div>

      <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '12px 0', paddingTop: '12px' }}>
        <div className="breakdown-item">
          <span className="breakdown-label">🍊 Synnex Partner</span>
          <span className="breakdown-value">${synnexCommission.toFixed(2)}</span>
        </div>
        <div className="breakdown-item">
          <span className="breakdown-label">🟦 Advice Dropship</span>
          <span className="breakdown-value">${adviceCommission.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
        <span>Updated: {lastUpdated}</span>
        <button onClick={handleDownloadReport} className="btn btn-ghost" style={{ fontSize: '10px', padding: '4px 8px' }}>
          📥 Report
        </button>
      </div>
    </div>
  );
};
