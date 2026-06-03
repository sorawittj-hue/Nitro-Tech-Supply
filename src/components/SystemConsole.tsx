import React, { useRef, useEffect } from 'react';
import type { AuditEntry } from '../context/AppContext';

export interface ConsoleLog {
  timestamp: string;
  type: 'INFO' | 'TRADE' | 'CRITICAL' | 'WARN';
  message: string;
}

interface SystemConsoleProps {
  logs: ConsoleLog[];
  auditLogs?: AuditEntry[];
  onClearLogs: () => void;
  onRequestDiagnostics?: () => void;
}

export const SystemConsole: React.FC<SystemConsoleProps> = ({ logs, auditLogs = [], onClearLogs, onRequestDiagnostics }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getTagClass = (type: ConsoleLog['type']) => {
    switch (type) {
      case 'INFO': return 'info';
      case 'TRADE': return 'success';
      case 'CRITICAL': return 'error';
      case 'WARN': return 'warn';
      default: return 'info';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span className="panel-card-title">📟 SYSTEM LOG</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onRequestDiagnostics} className="btn btn-ghost" style={{ fontSize: '12px', padding: '4px 8px' }}>
            Diagnostics
          </button>
          <button onClick={onClearLogs} className="btn-icon" title="Clear logs" style={{ width: '28px', height: '28px', fontSize: '14px' }}>
            🗑️
          </button>
        </div>
      </div>

      <div className="console-container" ref={scrollRef} style={{ flex: 1, maxHeight: 'none' }}>
        {logs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
            ไม่มี log...
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="console-line">
              <span className="console-time">{log.timestamp}</span>
              <span className={`console-tag ${getTagClass(log.type)}`}>{log.type}</span>
              <span className="console-msg">{log.message}</span>
            </div>
          ))
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '8px', paddingTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span className="panel-card-title" style={{ fontSize: '12px' }}>BACKEND AUDIT</span>
          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
            {auditLogs.length} records
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
          {auditLogs.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              No backend audit records synced.
            </div>
          ) : auditLogs.slice(-5).reverse().map(entry => (
            <div key={entry.id} className="console-line">
              <span className="console-time">{formatAuditTime(entry.timestamp)}</span>
              <span className={`console-tag ${entry.status && entry.status >= 400 ? 'warn' : 'info'}`}>
                {entry.status ?? 'AUDIT'}
              </span>
              <span className="console-msg">{entry.action}: {entry.detail}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', marginTop: '8px'
      }}>
        <span>{logs.length} entries</span>
        <span>Nitro Tech Supply v2.0</span>
      </div>
    </div>
  );
};

function formatAuditTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString('en-US', { hour12: false });
}
