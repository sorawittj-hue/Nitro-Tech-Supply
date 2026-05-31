import { useEffect } from 'react';
import type { ToastItem } from '../context/AppContext';

const icons: Record<string, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
};

const accentColors: Record<string, string> = {
  success: 'var(--accent-emerald)',
  error: 'var(--accent-rose)',
  info: 'var(--accent-cyan)',
  warning: 'var(--accent-amber)',
};

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  return (
    <div
      className="toast-item"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'var(--bg-elevated)',
        border: `1px solid ${accentColors[toast.type]}40`,
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        minWidth: '280px',
        maxWidth: '380px',
        boxShadow: `0 0 20px ${accentColors[toast.type]}20`,
        animation: 'slideInRight 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <span style={{ fontSize: '16px', flexShrink: 0 }}>{icons[toast.type]}</span>
      <span
        style={{
          flex: 1,
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          color: 'var(--text-primary)',
          lineHeight: '1.4',
        }}
      >
        {toast.message}
      </span>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: '14px',
          padding: '2px 6px',
          borderRadius: '4px',
          flexShrink: 0,
        }}
      >
        ✕
      </button>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '2px',
          background: accentColors[toast.type],
          animation: 'shrink 4s linear forwards',
        }}
      />
    </div>
  );
}
