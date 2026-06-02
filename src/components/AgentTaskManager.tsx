import { useState } from 'react';
import type { Agent } from '../data/agents';
import { useApp } from '../context/AppContext';
import { transport } from '../transport';
import ConfirmationDialog from './ConfirmationDialog';

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export function AgentTaskManager({ agent }: { agent: Agent }) {
  const { addLog, addToast } = useApp();
  const [tasks, setTasks] = useState<Task[]>(() => readTasks(agent.id));
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Task['priority']>('medium');
  const [confirmDoneId, setConfirmDoneId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Task['status'] | 'all'>('all');

  const persist = (next: Task[]) => {
    localStorage.setItem(`tasks-${agent.id}`, JSON.stringify(next));
    setTasks(next);
  };

  const addTask = () => {
    if (!newTitle.trim()) return;
    const t: Task = { id: Date.now().toString(), title: newTitle.trim(), status: 'todo', priority: newPriority, createdAt: new Date().toISOString() };
    persist([t, ...tasks]);
    transport.send({
      type: 'agent.task.assign',
      agentId: agent.id,
      taskId: t.id,
      title: t.title,
      detail: `Priority: ${t.priority}. Created from Nitro agent task manager.`,
      priority: t.priority,
      source: 'ceo',
      timestamp: Date.now(),
    });
    setNewTitle('');
    addLog('INFO', `📋 มอบหมายงานให้ ${agent.name}: "${t.title}"`);
    addToast('info', `ส่งงานไป ${agent.name}`);
  };

  const updateStatus = (id: string, status: Task['status']) => {
    persist(tasks.map(t => t.id === id ? { ...t, status } : t));
    addLog('INFO', `🔄 งาน #${id.slice(-4)} → ${status}`);
  };

  const removeTask = (id: string) => {
    persist(tasks.filter(t => t.id !== id));
    addToast('success', 'ลบงานแล้ว');
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;

  const priorityBadge = (p: Task['priority']) => {
    if (p === 'high') return 'badge-danger';
    if (p === 'medium') return 'badge-warning';
    return 'badge-info';
  };

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {(['all', 'todo', 'in_progress', 'done'] as const).map(f => (
          <button key={f} className={`btn btn-ghost ${filter === f ? 'active' : ''}`} style={{ padding: '4px 12px', fontSize: '12px', textTransform: 'capitalize' }} onClick={() => setFilter(f)}>
            {f === 'all' ? `All (${tasks.length})` : f === 'todo' ? `To Do (${todoCount})` : f === 'in_progress' ? `In Progress (${inProgressCount})` : `Done (${doneCount})`}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input
          className="chat-input-field"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          placeholder="เพิ่มงานใหม่..."
          style={{ flex: 1 }}
        />
        <select className="chat-input-field" value={newPriority} onChange={e => setNewPriority(e.target.value as Task['priority'])} style={{ width: 'auto' }}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button className="btn btn-primary" onClick={addTask} disabled={!newTitle.trim()}>+ ADD</button>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', padding: '12px' }}>ไม่มีงาน</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
          {filtered.map(task => (
            <div key={task.id} className="restock-item" style={{ alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', flex: 1 }}>{task.title}</span>
                  <span className={`badge ${priorityBadge(task.priority)}`}>{task.priority.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{new Date(task.createdAt).toLocaleDateString('th-TH')}</div>
              </div>
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                {task.status === 'todo' && (
                  <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => updateStatus(task.id, 'in_progress')}>▶ เริ่ม</button>
                )}
                {task.status === 'in_progress' && (
                  <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setConfirmDoneId(task.id)}>✓ เสร็จ</button>
                )}
                <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => removeTask(task.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationDialog
        open={!!confirmDoneId}
        title="ทำเครื่องหมายว่าเสร็จ?"
        message="คุณต้องการส่งงานนี้ให้เสร็จสมบูรณ์?"
        confirmLabel="✓ เสร็จสิ้น"
        cancelLabel="ยกเลิก"
        variant="success"
        onConfirm={() => { if (confirmDoneId) updateStatus(confirmDoneId, 'done'); setConfirmDoneId(null); }}
        onCancel={() => setConfirmDoneId(null)}
      />
    </div>
  );
}

function readTasks(agentId: string): Task[] {
  try {
    const raw = localStorage.getItem(`tasks-${agentId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn(`Could not load tasks for ${agentId}:`, error);
    return [];
  }
}
