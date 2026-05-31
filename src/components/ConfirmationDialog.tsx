import React, { type ReactNode } from 'react';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

const variantStyles: Record<string, { accent: string; btnBg: string; btnColor: string; icon: string }> = {
  danger: { accent: '#f87171', btnBg: 'linear-gradient(135deg, #f87171, #ef4444)', btnColor: '#fff', icon: '⚠️' },
  warning: { accent: '#fbbf24', btnBg: 'linear-gradient(135deg, #f59e0b, #d97706)', btnColor: '#fff', icon: '⚡' },
  info: { accent: '#22d3ee', btnBg: 'linear-gradient(135deg, #22d3ee, #06b6d4)', btnColor: '#0f172a', icon: 'ℹ️' },
};

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'info',
}) => {
  if (!open) return null;

  const v = variantStyles[variant];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 8000,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: `1px solid ${v.accent}40`,
          borderRadius: '16px',
          padding: '28px',
          maxWidth: '420px',
          width: '90%',
          boxShadow: `0 0 50px ${v.accent}18`,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '40px' }}>{v.icon}</span>
        </div>
        <h3
          id="confirm-dialog-title"
          style={{
            color: v.accent,
            fontFamily: 'var(--font-mono, "Fira Code", monospace)',
            fontSize: '16px',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '10px',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            color: 'var(--text-muted, #94a3b8)',
            fontSize: '14px',
            lineHeight: '1.6',
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              borderRadius: '10px',
              padding: '9px 20px',
              color: '#94a3b8',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              background: v.btnBg,
              border: 'none',
              borderRadius: '10px',
              padding: '9px 20px',
              color: v.btnColor,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
