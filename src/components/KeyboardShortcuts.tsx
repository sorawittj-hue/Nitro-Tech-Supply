import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  togglePanel: (panel: string) => void;
  setActivePanel: (panel: string) => void;
  addLog: (type: string, message: string) => void;
  clearLogs: () => void;
  focusSearch: () => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  togglePanel,
  setActivePanel,
  addLog,
  clearLogs,
  focusSearch,
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      const key = e.key.toLowerCase();

      if (key === 'k') {
        e.preventDefault();
        focusSearch();
        return;
      }

      if (key === '1') {
        e.preventDefault();
        togglePanel('console');
        return;
      }

      if (key === '2') {
        e.preventDefault();
        togglePanel('chat');
        return;
      }

      if (key === '3') {
        e.preventDefault();
        togglePanel('income');
        return;
      }

      if (key === '4') {
        e.preventDefault();
        togglePanel('inventory');
        return;
      }

      if (key === '5') {
        e.preventDefault();
        togglePanel('analytics');
        return;
      }

      if (key === '6') {
        e.preventDefault();
        togglePanel('settings');
        return;
      }

      if (e.shiftKey && key === 'c') {
        e.preventDefault();
        clearLogs();
        addLog('INFO', 'Console logs cleared');
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePanel, setActivePanel, addLog, clearLogs, focusSearch]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const target = e.target as HTMLElement | null;
        if (target && target.tagName === 'INPUT') {
          target.blur();
          return;
        }
        setActivePanel('none');
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setActivePanel]);

  return null;
};
