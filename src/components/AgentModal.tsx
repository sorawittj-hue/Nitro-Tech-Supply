import React, { useState } from 'react';
import type { Agent } from '../data/agents';
import { PixelCharacter } from './PixelCharacter';
import { AgentTaskManager } from './AgentTaskManager';
import { transport } from '../transport';

interface AgentModalProps {
  agent: Agent;
  onClose: () => void;
  onUpdateAgent: (updatedAgent: Agent) => void;
}

export const AgentModal: React.FC<AgentModalProps> = ({ agent, onClose, onUpdateAgent }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'tasks' | 'individual' | 'shared'>('info');
  const [individualSkill, setIndividualSkill] = useState(agent.individualSkill);
  const [sharedSkill, setSharedSkill] = useState(agent.sharedSkill);
  const [status, setStatus] = useState(agent.status);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onUpdateAgent({ ...agent, individualSkill, sharedSkill, status });
    transport.send({
      type: 'agent.skill.update',
      agentId: agent.id,
      individualSkill,
      sharedSkill,
      timestamp: Date.now(),
    });
    setIsSaved(true);
    void import('canvas-confetti').then(module => module.default({
      particleCount: 40,
      spread: 55,
      origin: { y: 0.7 },
      colors: ['#22d3ee', '#34d399', '#fbbf24']
    })).catch(error => {
      console.warn('Save confetti could not be played:', error);
    });
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleWakeUp = () => {
    setStatus('Working');
    onUpdateAgent({ ...agent, status: 'Working' });
    transport.send({
      type: 'agent.wake',
      agentId: agent.id,
      timestamp: Date.now(),
    });
    try {
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (error) {
      console.warn('Wake sound could not be played:', error);
    }
  };

  const isNapping = status === 'Napping';

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal-container ${isNapping ? 'alert' : ''}`}>
        
        {/* Header */}
        <div className="modal-header">
          <div className="modal-profile">
            <div className="modal-avatar-frame" style={isNapping ? { borderColor: 'var(--border-glow-rose)' } : {}}>
              <PixelCharacter spriteId={agent.spriteId ?? agent.id} size={44} animated={false} />
            </div>
            <div>
              <div className="modal-name">{agent.name}</div>
              <div className="modal-title-label">{agent.title}</div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Alert strip */}
        {isNapping && (
          <div className="modal-alert-strip">
            <span>⚠️ สถานะ: <strong>แอบงีบหลับ!</strong> ระบบหยุดชั่วคราว</span>
            <button onClick={handleWakeUp}>🔔 ปลุกบอท (WAKE UP)</button>
          </div>
        )}

        {/* Tabs */}
        <div className="modal-tabs">
          <button className={`modal-tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
            📋 โปรไฟล์
          </button>
          <button className={`modal-tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
            ✅ Tasks
          </button>
          <button className={`modal-tab ${activeTab === 'individual' ? 'active' : ''}`} onClick={() => setActiveTab('individual')}>
            📄 Skill.md
          </button>
          <button className={`modal-tab ${activeTab === 'shared' ? 'active' : ''}`} onClick={() => setActiveTab('shared')}>
            🔗 Shared Skill
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {activeTab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="info-desc-box">{agent.description}</div>

              <div className="modal-info-grid">
                <div className="info-field">
                  <span className="info-field-label">Department</span>
                  <div className="info-field-value">{agent.department}</div>
                </div>
                <div className="info-field">
                  <span className="info-field-label">Authority</span>
                  <div className="info-field-value">{agent.authorityLevel}</div>
                </div>
              </div>

              <div className="modal-info-grid">
                <div className="info-field">
                  <span className="info-field-label">Live Session</span>
                  <div className="info-field-value">
                    <span className={`badge ${agent.isLive ? 'badge-success' : 'badge-warning'}`}>
                      {agent.isLive ? 'LIVE' : 'OFFLINE'}
                    </span>
                    <span style={{ marginLeft: '8px' }}>{agent.sessionId ?? 'no-session'}</span>
                  </div>
                </div>
                <div className="info-field">
                  <span className="info-field-label">Token Usage</span>
                  <div className="info-field-value">
                    {(agent.inputTokens ?? 0).toLocaleString()} in / {(agent.outputTokens ?? 0).toLocaleString()} out
                  </div>
                </div>
              </div>

              <div className="info-field">
                <span className="info-field-label">Mission</span>
                <div className="info-field-value">{agent.mission}</div>
              </div>
              
              <div className="modal-info-grid">
                <div className="info-field">
                  <span className="info-field-label">เครื่องมือ / Tools</span>
                  <div className="info-field-value">{agent.tools}</div>
                </div>
                <div className="info-field">
                  <span className="info-field-label">ระบบที่ดูแล</span>
                  <div className="info-field-value">
                    <span className="badge badge-info">{agent.system}</span>
                  </div>
                </div>
              </div>

              <div className="modal-info-grid">
                <div className="info-field">
                  <span className="info-field-label">รายงานต่อ</span>
                  <div className="info-field-value">{agent.reportsTo}</div>
                </div>
                <div className="info-field">
                  <span className="info-field-label">สถานะปัจจุบัน</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Agent['status'])}
                    className="status-select"
                    style={{ marginTop: '4px', width: '100%' }}
                  >
                    <option value="Working">🟩 Working (ทำงาน)</option>
                    <option value="Thinking">🟦 Thinking (กำลังคิด)</option>
                    <option value="Napping">🟥 Napping (งีบหลับ)</option>
                    <option value="Idle">🟨 Idle (ว่างงาน)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <AgentTaskManager agent={agent} />
          )}

          {activeTab === 'individual' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>แก้ไขสกิลของ {agent.name.split('(')[0].trim()}</span>
                <span style={{ color: 'var(--accent-cyan)' }}>📁 {agent.id}_skill.md</span>
              </div>
              <textarea
                value={individualSkill}
                onChange={(e) => setIndividualSkill(e.target.value)}
                className="editor-area"
                placeholder="# Skill Instructions..."
              />
            </div>
          )}

          {activeTab === 'shared' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>คู่มือรวม (Shared Guidelines)</span>
                <span style={{ color: 'var(--accent-emerald)' }}>📁 shared_skill.md</span>
              </div>
              <textarea
                value={sharedSkill}
                onChange={(e) => setSharedSkill(e.target.value)}
                className="editor-area"
                placeholder="# Shared Instructions..."
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div>
            {isSaved && (
              <div className="modal-saved-msg">
                ✨ บันทึกสำเร็จ!
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} className="btn btn-ghost">ปิด</button>
            {(activeTab !== 'info' || status !== agent.status) && (
              <button onClick={handleSave} className="btn btn-primary">
                💾 บันทึก
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
