import { useState, useRef, useEffect, useCallback } from 'react';

interface AgentSearchResult {
  id: string;
  name: string;
  title: string;
  avatar: string;
}

interface SearchBarProps {
  onNavigate: (panel: string) => void;
  onSelectAgent: (agentId: string) => void;
  agents: AgentSearchResult[];
}

export const SearchBar: React.FC<SearchBarProps> = ({ onNavigate, onSelectAgent, agents }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const filtered = agents.filter(a => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.title.toLowerCase().includes(q);
  });

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery('');
    setActiveIndex(0);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setActiveIndex(0);
  }, []);

  const select = useCallback((agentId: string) => {
    onSelectAgent(agentId);
    onNavigate('none');
    close();
  }, [onSelectAgent, onNavigate, close]);

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(i => (i + 1) % Math.max(filtered.length, 1));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(i => (i - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1));
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const current = filtered[activeIndex];
        if (current) select(current.id);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, filtered, activeIndex, close, select]);

  useEffect(() => {
    const onGlobalKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) close();
        else open();
      }
    };

    window.addEventListener('keydown', onGlobalKey);
    return () => window.removeEventListener('keydown', onGlobalKey);
  }, [isOpen, open, close]);

  const renderDropdown = () => {
    if (!isOpen) return null;
    const items = filtered.length > 0 ? filtered : [];
    return (
      <div
        ref={overlayRef}
        className="glass-input"
        style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '360px',
          maxHeight: '320px',
          overflowY: 'auto',
          padding: '6px',
          zIndex: 300,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-medium)',
          background: 'var(--bg-elevated)',
          boxShadow: 'var(--shadow-float)',
        }}
      >
        {items.map((agent, idx) => (
          <div
            key={agent.id}
            role="button"
            tabIndex={0}
            onClick={() => select(agent.id)}
            onMouseDown={e => e.preventDefault()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              background: idx === activeIndex ? 'rgba(34, 211, 238, 0.08)' : 'transparent',
              border: idx === activeIndex ? '1px solid var(--border-glow-cyan)' : '1px solid transparent',
              transition: 'background 120ms ease, border-color 120ms ease',
            }}
          >
            <span
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '16px',
                flexShrink: 0,
              }}
            >
              {agent.avatar}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {agent.name}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {agent.title}
              </span>
            </div>
            <span
              className="badge badge-info"
              style={{ marginLeft: 'auto', flexShrink: 0 }}
            >
              Jump
            </span>
          </div>
        ))}
        {items.length === 0 && (
          <div
            style={{
              padding: '12px',
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: 'var(--text-muted)',
            }}
          >
            No agents found
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ position: 'relative' }}>
      {!isOpen ? (
        <button className="btn-icon" onClick={open} aria-label="Search">
          <span
            style={{
              lineHeight: 1,
              fontSize: '15px',
            }}
          >
            🔍
          </span>
        </button>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-glow-cyan)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 10px',
            boxShadow: '0 0 12px rgba(34, 211, 238, 0.12)',
          }}
        >
          <span style={{ fontSize: '14px', lineHeight: 1, opacity: 0.7 }}>🔍</span>
          <input
            ref={inputRef}
            className="chat-input-field"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onBlur={close}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              boxShadow: 'none',
              fontSize: '14px',
              minWidth: '180px',
              width: '220px',
            }}
            placeholder="Search agents..."
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              padding: '1px 6px',
              whiteSpace: 'nowrap',
            }}
          >
            ESC
          </span>
          {renderDropdown()}
        </div>
      )}
    </div>
  );
};
