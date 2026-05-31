import React, { useRef, useEffect } from 'react';

export interface ConsoleLog {
  timestamp: string;
  type: 'INFO' | 'TRADE' | 'CRITICAL' | 'WARN';
  message: string;
}

interface SystemConsoleProps {
  logs: ConsoleLog[];
  onClearLogs: () => void;
}

export const SystemConsole: React.FC<SystemConsoleProps> = ({ logs, onClearLogs }) => {
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
        <button onClick={onClearLogs} className="btn-icon" title="Clear logs" style={{ width: '28px', height: '28px', fontSize: '14px' }}>
          🗑️
        </button>
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
