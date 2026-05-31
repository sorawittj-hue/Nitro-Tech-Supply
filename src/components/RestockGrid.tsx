import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import ConfirmationDialog from './ConfirmationDialog';
import type { Agent } from '../data/agents';

interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  threshold: number;
  price: number;
}

function getStatus(stock: number, threshold: number) {
  if (stock <= threshold * 0.5) return 'critical';
  if (stock <= threshold) return 'low';
  return 'ok';
}

export const RestockGrid: React.FC<{ agents: Agent[] }> = ({ agents }) => {
  const { addLog, addToast, addAuditLog } = useApp();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', stock: 0, threshold: 10, price: 0 });
  const [error, setError] = useState('');
  const apiBase = 'http://localhost:3001';

  const fetchItems = useCallback(() => {
    setLoading(true);
    fetch(`${apiBase}/inventory`)
      .then(r => r.json())
      .then(data => { setItems(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); addToast('error', 'ไม่สามารถโหลดสต็อกได้'); });
  }, [addToast]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openCreate = () => {
    setForm({ name: '', stock: 0, threshold: 10, price: 0 });
    setEditingItem(null);
    setError('');
  };

  const openEdit = (item: InventoryItem) => {
    setForm({ name: item.name, stock: item.stock, threshold: item.threshold, price: item.price });
    setEditingItem(item);
    setError('');
  };

  const validate = () => {
    if (!form.name.trim()) return 'กรุณากรอกชื่อสินค้า';
    if (form.threshold < 1) return 'Threshold ต้องมากกว่า 0';
    if (form.price < 0) return 'ราคาต้องไม่ติดลบ';
    return '';
  };

  const saveItem = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    try {
      let saved: InventoryItem;
      if (editingItem) {
        const res = await fetch(`${apiBase}/inventory/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, id: editingItem.id }),
        });
        saved = await res.json();
        setItems(prev => prev.map(i => i.id === editingItem.id ? saved : i));
        addLog('INFO', `📝 อัปเดตสต็อก ${saved.name} → ${saved.stock} units`);
        addAuditLog('Inventory Update', `${saved.name} stock ${saved.stock}`);
        addToast('success', `อัปเดต ${saved.name} สำเร็จ`);
      } else {
        const res = await fetch(`${apiBase}/inventory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, id: Date.now().toString() }),
        });
        saved = await res.json();
        setItems(prev => [...prev, saved]);
        addLog('INFO', `🆕 เพิ่มสินค้าใหม่: ${saved.name}`);
        addAuditLog('Inventory Create', `New item ${saved.name}`);
        addToast('success', `เพิ่มสินค้า ${saved.name} สำเร็จ`);
      }
      setEditingItem(null);
      setError('');
    } catch (err) {
      console.error(err);
      addToast('error', 'บันทึกไม่สำเร็จ');
    }
  };

  const adjustStock = async (item: InventoryItem, delta: number) => {
    const newStock = Math.max(0, item.stock + delta);
    try {
      const res = await fetch(`${apiBase}/inventory/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, stock: newStock }),
      });
      const saved = await res.json();
      setItems(prev => prev.map(i => i.id === item.id ? saved : i));
      addLog('INFO', `📦 ปรับสต็อก ${item.name}: ${item.stock} → ${newStock}`);
      addAuditLog('Stock Adjust', `${item.name} ${item.stock} → ${newStock}`);
      addToast('info', `${item.name}: ${item.stock} → ${newStock}`);
    } catch (err) {
      console.error(err);
      addToast('error', 'ปรับสต็อกไม่สำเร็จ');
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await fetch(`${apiBase}/inventory/${id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i.id !== id));
      addLog('INFO', `🗑️ ลบสินค้าออกจากคลัง ${id}`);
      addAuditLog('Inventory Delete', `Deleted ${id}`);
      addToast('success', 'ลบสินค้าสำเร็จ');
      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
      addToast('error', 'ลบไม่สำเร็จ');
    }
  };

  const filtered = items.filter(i => !searchQuery || i.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const alertCount = items.filter(i => getStatus(i.stock, i.threshold) !== 'ok').length;

  const FormModal = () => (
    <>
      <div className="side-panel-overlay" onClick={() => { setEditingItem(null); setError(''); }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 7000, width: '400px', maxWidth: '90vw' }}>
        <div className="panel-card">
          <div className="side-panel-header">
            <h2>{editingItem ? '✏️ EDIT ITEM' : '🆕 NEW ITEM'}</h2>
            <button className="side-panel-close" onClick={() => { setEditingItem(null); setError(''); }}>✕</button>
          </div>
          <div className="side-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label className="form-label">ชื่อสินค้า</label>
              <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">Stock ปัจจุบัน</label>
                <input className="form-input" type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Min Threshold</label>
                <input className="form-input" type="number" min="1" value={form.threshold} onChange={e => setForm({ ...form, threshold: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            <div>
              <label className="form-label">ราคา/หน่วย (THB)</label>
              <input className="form-input" type="number" min="0" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
            </div>
            {error && <div className="form-error">{error}</div>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => { setEditingItem(null); setError(''); }}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={saveItem}>💾 บันทึก</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="panel-card">
      <div className="panel-card-header">
        <span className="panel-card-title">📦 STOCK LEVELS</span>
        <span className="badge badge-warning">{alertCount} ALERTS</span>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <input className="chat-input-field" placeholder="🔍 ค้นหาสินค้า..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex: '1 1 160px' }} />
        <button className="btn btn-primary" onClick={openCreate}>+ ADD ITEM</button>
      </div>

      {loading ? (
        <div className="skeleton-block" />
      ) : filtered.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>ไม่พบสินค้า</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '340px', overflowY: 'auto' }}>
          {filtered.map(item => {
            const status = getStatus(item.stock, item.threshold);
            return (
              <div key={item.id} className="restock-item" style={{ alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '14px' }}>{item.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Min: {item.threshold} | ฿{item.price?.toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: '13px' }} onClick={() => adjustStock(item, -1)} disabled={item.stock === 0}>−</button>
                  <span style={{ fontWeight: 700, color: status === 'critical' ? 'var(--accent-rose)' : status === 'low' ? 'var(--accent-amber)' : 'var(--accent-emerald)', fontFamily: 'var(--font-retro)', fontSize: '20px', minWidth: '40px', textAlign: 'center' }}>{item.stock}</span>
                  <button className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: '13px' }} onClick={() => adjustStock(item, 1)}>+</button>
                  <span className={`badge ${status === 'critical' ? 'badge-danger' : status === 'low' ? 'badge-warning' : 'badge-success'}`}>{status.toUpperCase()}</span>
                  <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => openEdit(item)}>✏️</button>
                  <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setConfirmDeleteId(item.id)}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingItem !== null && <FormModal />}

      <ConfirmationDialog
        open={!!confirmDeleteId}
        title="ยืนยันการลบสินค้า"
        message="คุณแน่ใจหรือไม่ที่จะลบสินค้าออกจากคลัง?"
        confirmLabel="ลบ"
        cancelLabel="ยกเลิก"
        variant="danger"
        onConfirm={() => confirmDeleteId && deleteItem(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};