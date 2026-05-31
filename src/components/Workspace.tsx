import React, { useMemo } from 'react';
import type { Agent } from '../data/agents';
import { PixelCharacter } from './PixelCharacter';

interface WorkspaceProps {
  agents: Agent[];
  onSelectAgent: (agent: Agent) => void;
  selectedAgentId?: string;
  projectProgress: number;
}

// Generate ambient particles
const particles = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  delay: `${Math.random() * 8}s`,
  duration: `${6 + Math.random() * 6}s`,
  size: 2 + Math.random() * 2,
  opacity: 0.2 + Math.random() * 0.4,
}));

export const Workspace: React.FC<WorkspaceProps> = ({
  agents,
  onSelectAgent,
  selectedAgentId,
  projectProgress,
}) => {

  const currentTime = useMemo(() => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  }, []);

  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }, []);

  const workingCount = agents.filter(a => a.status === 'Working').length;
  const totalCount = agents.length;

  return (
    <div className="workspace-hero">
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
            <span style={{ fontSize: '11px' }}>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>{workingCount}</span>
              <span style={{ color: 'var(--text-muted)' }}> / {totalCount} Online</span>
            </span>
          </div>
        </div>

        <div className="hud-right">
          <div className="hud-badge">
            <span className="hud-badge-icon">💰</span>
            <span className="hud-badge-value">12,450</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>GP</span>
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
        const isCeo = agent.id === 'ceo_jay';
        
        const statusClass = isNapping ? 'napping' : isThinking ? 'thinking' : isIdle ? 'idle' : 'working';

        return (
          <div
            key={agent.id}
            className="agent-node"
            style={{ 
              left: agent.position.left, 
              top: agent.position.top,
              zIndex: isSelected ? 30 : 15,
            }}
            onClick={() => onSelectAgent(agent)}
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
              <div className="tooltip-action">🖱️ คลิกเพื่อดูรายละเอียด</div>
            </div>

            {/* Character sprite */}
            <div className={`agent-sprite-wrapper ${statusClass}`}>
              <PixelCharacter spriteId={agent.id} size={isCeo ? 72 : 60} />
              
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
