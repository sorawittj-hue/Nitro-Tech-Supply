import React, { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Agent } from '../data/agents';
import { PixelCharacter } from './PixelCharacter';

interface WorkspaceProps {
  agents: Agent[];
  onSelectAgent: (agent: Agent) => void;
  onMoveAgent: (agentId: string, position: Agent['position']) => void;
  onResetLayout: () => void;
  selectedAgentId?: string;
  projectProgress: number;
  debugMode?: boolean;
}

interface DragState {
  agentId: string;
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
}

interface AgentWalkState {
  x: number;
  y: number;
  facing: 'left' | 'right';
  moving: boolean;
}

type AgentWalkMap = Record<string, AgentWalkState>;

const particles = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  left: `${(i * 17 + 11) % 100}%`,
  top: `${(i * 23 + 7) % 100}%`,
  delay: `${(i % 8) * 0.8}s`,
  duration: `${6 + (i % 6)}s`,
  size: 2 + (i % 3) * 0.5,
  opacity: 0.25 + (i % 4) * 0.1,
}));

export const Workspace: React.FC<WorkspaceProps> = ({
  agents,
  onSelectAgent,
  onMoveAgent,
  onResetLayout,
  selectedAgentId,
  projectProgress,
  debugMode = false,
}) => {
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const [draggingAgentId, setDraggingAgentId] = useState<string | null>(null);
  const [agentWalkMap, setAgentWalkMap] = useState<AgentWalkMap>({});

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const updateWalk = () => {
      setAgentWalkMap(prev => {
        const next: AgentWalkMap = {};
        agents.forEach(agent => {
          const previous = prev[agent.id];
          next[agent.id] = createWalkState(agent, previous, draggingAgentId === agent.id);
        });
        return next;
      });
    };

    updateWalk();
    const interval = window.setInterval(updateWalk, 2400);
    return () => window.clearInterval(interval);
  }, [agents, draggingAgentId]);

  const currentTime = useMemo(() => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  }, []);

  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }, []);

  const workingCount = agents.filter(a => a.status === 'Working').length;
  const totalCount = agents.length;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>, agent: Agent) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      agentId: agent.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    suppressClickRef.current = false;
    setDraggingAgentId(agent.id);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    const workspace = workspaceRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId || !workspace) return;

    const movement = Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY);
    if (movement > 4) {
      dragState.moved = true;
      suppressClickRef.current = true;
    }

    const rect = workspace.getBoundingClientRect();
    const left = clamp(((event.clientX - rect.left) / rect.width) * 100, 5, 95);
    const top = clamp(((event.clientY - rect.top) / rect.height) * 100, 8, 92);

    onMoveAgent(dragState.agentId, {
      left: `${left.toFixed(1)}%`,
      top: `${top.toFixed(1)}%`,
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (dragState?.pointerId !== event.pointerId) return;
    dragStateRef.current = null;
    setDraggingAgentId(null);
  };

  const handleAgentClick = (agent: Agent) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    onSelectAgent(agent);
  };

  return (
    <div className="workspace-hero" ref={workspaceRef}>
      {/* Background Image */}
      <div 
        className="workspace-bg-layer"
        style={{ backgroundImage: `url('/pixel_office_bg.png')` }}
      />
      
      {/* Overlay gradient */}
      <div className="workspace-bg-overlay" />
      
      {/* Vignette */}
      <div className="workspace-vignette" />
      
      {/* Ambient particles */}
      <div className="workspace-particles">
        {particles.map(p => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              animationDelay: p.delay,
              animationDuration: p.duration,
              opacity: p.opacity,
            }}
          />
        ))}
      </div>

      {/* HUD Overlay */}
      <div className="workspace-hud">
        <div className="hud-left">
          <div className="hud-project-badge">
            <span style={{ fontSize: '16px' }}>📋</span>
            <div>
              <div className="pixel-font" style={{ fontSize: '7px', color: 'var(--accent-cyan)', letterSpacing: '1px' }}>
                WAREHOUSE AUTOMATION v2
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <div className="hud-progress-track">
                  <div className="hud-progress-fill" style={{ width: `${projectProgress}%` }} />
                </div>
                <span className="retro-number" style={{ fontSize: '16px', color: 'var(--accent-cyan)' }}>
                  {projectProgress}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="hud-badge" style={{ gap: '10px' }}>
            <span className="hud-badge-icon">👥</span>
            <span style={{ fontSize: '13px' }}>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>{workingCount}</span>
              <span style={{ color: 'var(--text-muted)' }}> / {totalCount} Online</span>
            </span>
          </div>
          <button className="hud-layout-reset" type="button" onClick={onResetLayout}>
            Reset Layout
          </button>
        </div>

        <div className="hud-right">
          <div className="hud-badge">
            <span className="hud-badge-icon">💰</span>
            <span className="hud-badge-value">12,450</span>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>GP</span>
          </div>
          <div className="hud-badge">
            <span className="hud-badge-icon">💎</span>
            <span className="hud-badge-value" style={{ color: 'var(--accent-violet)' }}>320</span>
          </div>
        </div>
      </div>

      {/* Agent Characters */}
      {agents.map((agent) => {
        const isSelected = selectedAgentId === agent.id;
        const isNapping = agent.status === 'Napping';
        const isThinking = agent.status === 'Thinking';
        const isIdle = agent.status === 'Idle';
        const isCeo = isCeoAgent(agent);
        const isTeamLead = Boolean(agent.isTeamLead);
        const subTaskCount = agent.activeTools?.length ?? 0;
        const walkState = agentWalkMap[agent.id] ?? { x: 0, y: 0, facing: 'right', moving: false };
        const walkStyle = {
          left: agent.position.left,
          top: agent.position.top,
          zIndex: isSelected ? 30 : 15,
          '--walk-x': `${walkState.x}px`,
          '--walk-y': `${walkState.y}px`,
        } as CSSProperties;
        
        const statusClass = isNapping ? 'napping' : isThinking ? 'thinking' : isIdle ? 'idle' : 'working';

        return (
          <div
            key={agent.id}
            className={`agent-node ${draggingAgentId === agent.id ? 'dragging' : ''} ${walkState.moving ? 'walking' : 'standing'}`}
            style={walkStyle}
            onPointerDown={(event) => handlePointerDown(event, agent)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={() => handleAgentClick(agent)}
          >
            {/* Hover tooltip */}
            <div className="agent-tooltip">
              <div className="tooltip-title">{agent.name}</div>
              <div className="tooltip-role">{agent.title}</div>
              <div className="tooltip-status">
                <div 
                  className="tooltip-status-dot"
                  style={{ 
                    background: isNapping ? 'var(--accent-rose)' : 
                                isThinking ? 'var(--accent-cyan)' : 
                                isIdle ? 'var(--accent-amber)' : 'var(--accent-emerald)' 
                  }}
                />
                <span style={{ 
                  color: isNapping ? 'var(--accent-rose)' : 
                         isThinking ? 'var(--accent-cyan)' : 
                         isIdle ? 'var(--accent-amber)' : 'var(--accent-emerald)' 
                }}>
                  {agent.status === 'Working' ? 'กำลังทำงาน' :
                   agent.status === 'Thinking' ? 'กำลังประมวลผล' :
                   agent.status === 'Napping' ? 'แอบงีบหลับ!' :
                   'ว่างงาน'}
                </span>
              </div>
              <div className="tooltip-action">Drag to move desk • Click for details</div>
            </div>

            {/* Character sprite */}
            <div className={`agent-sprite-wrapper ${statusClass} walk-${walkState.facing}`}>
              <PixelCharacter spriteId={agent.spriteId ?? agent.id} size={isCeo ? 72 : 60} />
              {isTeamLead && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '-8px',
                  fontSize: '18px',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.45))',
                }}>
                  👑
                </div>
              )}
              {subTaskCount > 0 && (
                <div className="dock-item-badge" style={{ right: '-10px', top: '8px', width: 'auto', minWidth: '22px', height: '18px', borderRadius: '999px', padding: '1px 5px', fontSize: '10px' }}>
                  x{subTaskCount}
                </div>
              )}
              
              {/* Zzz for sleeping */}
              {isNapping && (
                <div className="zzz-container">
                  <span className="zzz-letter">z</span>
                  <span className="zzz-letter">Z</span>
                  <span className="zzz-letter">Z</span>
                </div>
              )}
              
              {/* Thinking dots */}
              {isThinking && (
                <div className="thinking-dots">
                  <div className="thinking-dot" />
                  <div className="thinking-dot" />
                  <div className="thinking-dot" />
                </div>
              )}
              
              {/* Status ring shadow */}
              <div className={`agent-status-ring ${statusClass}`} />
            </div>

            {/* Name label */}
            <div className={`agent-label ${statusClass} ${isCeo ? 'ceo' : ''}`}>
              {isCeo ? '👑 ' : ''}{agent.name.split('(')[0].replace('คุณ ', '').trim()}
            </div>

            {debugMode && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: '18px',
                padding: '6px 8px',
                minWidth: '170px',
                border: '1px solid rgba(34, 211, 238, 0.35)',
                background: 'rgba(2, 6, 23, 0.88)',
                color: 'var(--text-muted)',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                pointerEvents: 'none',
                zIndex: 40,
              }}>
                <div>session: {agent.sessionId ?? 'none'}</div>
                <div>live: {agent.isLive ? 'yes' : 'no'} / {agent.providerId ?? 'offline'}</div>
                <div>tokens: {(agent.inputTokens ?? 0).toLocaleString()} in / {(agent.outputTokens ?? 0).toLocaleString()} out</div>
                <div>last: {agent.lastActiveAt ? new Date(agent.lastActiveAt).toLocaleTimeString('en-US', { hour12: false }) : 'never'}</div>
              </div>
            )}
          </div>
        );
      })}

      {/* Bottom footer strip */}
      <div className="workspace-footer-bar">
        <span>📍 Nitro Tech Supply — WHOLESALE OPERATION MODE</span>
        <span>
          🌞 {currentDate} | {currentTime} ICT
        </span>
      </div>
    </div>
  );
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function createWalkState(agent: Agent, previous?: AgentWalkState, isDragging = false): AgentWalkState {
  if (isDragging || agent.status === 'Napping') {
    return { x: 0, y: 0, facing: previous?.facing ?? 'right', moving: false };
  }

  const originX = parsePercent(agent.position.left);
  const originY = parsePercent(agent.position.top);
  const radius = getWalkRadius(agent);
  const homeBiasX = previous ? -previous.x * 0.45 : 0;
  const homeBiasY = previous ? -previous.y * 0.45 : 0;
  const edgeBiasX = originX < 10 ? radius : originX > 90 ? -radius : 0;
  const edgeBiasY = originY < 12 ? radius : originY > 88 ? -radius : 0;
  const jitterX = (Math.random() * 2 - 1) * radius;
  const jitterY = (Math.random() * 2 - 1) * radius * 0.55;
  const x = Math.round(clamp(homeBiasX + edgeBiasX + jitterX, -radius, radius));
  const y = Math.round(clamp(homeBiasY + edgeBiasY + jitterY, -radius * 0.55, radius * 0.55));
  const deltaX = x - (previous?.x ?? 0);

  return {
    x,
    y,
    facing: deltaX < -1 ? 'left' : deltaX > 1 ? 'right' : previous?.facing ?? 'right',
    moving: Math.abs(x - (previous?.x ?? 0)) + Math.abs(y - (previous?.y ?? 0)) > 3,
  };
}

function getWalkRadius(agent: Agent): number {
  if (isCeoAgent(agent)) return 10;
  if (agent.status === 'Thinking') return 16;
  if (agent.status === 'Idle') return 8;
  return agent.isTeamLead ? 22 : 28;
}

function parsePercent(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 50;
}

function isCeoAgent(agent: Agent): boolean {
  return agent.id === 'ceo-jay-command' || agent.sessionId === 'ceo-jay-command' || agent.authorityLevel === 'Owner';
}
