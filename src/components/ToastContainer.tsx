import { useApp } from '../context/AppContext';
import { Toast } from './Toast';

export function ToastContainer() {
  const { toasts, removeToast } = useApp();
  const visibleToasts = toasts.slice(-5);

  if (visibleToasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 9000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none',
        maxWidth: '400px',
        width: '100%',
      }}
    >
      {visibleToasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            pointerEvents: 'auto',
            animationDelay: `${index * 40}ms`,
          }}
        >
          <Toast toast={toast} onDismiss={removeToast} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
