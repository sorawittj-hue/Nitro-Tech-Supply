import { useState } from 'react';
import { useApp, type InventoryItem } from '../context/AppContext';
import ConfirmationDialog from './ConfirmationDialog';
import type { Agent } from '../data/agents';

function getStatus(stock: number, threshold: number) {
  if (stock <= threshold * 0.5) return 'critical';
  if (stock <= threshold) return 'low';
  return 'ok';
}

export const RestockGrid: React.FC<{ agents?: Agent[] }> = () => {
  const { 
    inventory, 
    loadingData, 
    adjustStock, 
    saveInventoryItem, 
    deleteInventoryItem 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', stock: 0, threshold: 10, price: 0 });
  const [error, setError] = useState('');

  const openCreate = () => {
    setForm({ name: '', stock: 0, threshold: 10, price: 0 });
    setEditingItem(null);
    setIsEditorOpen(true);
    setError('');
  };

  const openEdit = (item: InventoryItem) => {
    setForm({ name: item.name, stock: item.stock, threshold: item.threshold, price: item.price });
    setEditingItem(item);
    setIsEditorOpen(true);
    setError('');
  };

  const validate = () => {
    if (!form.name.trim()) return 'กรุณากรอกชื่อสินค้า';
    if (!Number.isInteger(form.stock) || form.stock < 0) return 'Stock ต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป';
    if (!Number.isInteger(form.threshold) || form.threshold < 1) return 'Threshold ต้องเป็นจำนวนเต็มมากกว่า 0';
    if (!Number.isFinite(form.price) || form.price < 0) return 'ราคาต้องไม่ติดลบ';
    return '';
  };

  const handleSaveItem = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    try {
      await saveInventoryItem({
        ...form,
        id: editingItem?.id
      });
      setEditingItem(null);
      setIsEditorOpen(false);
      setError('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteInventoryItem(id);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = inventory.filter(i => !searchQuery || i.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const alertCount = inventory.filter(i => getStatus(i.stock, i.threshold) !== 'ok').length;

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

      {loadingData ? (
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

      {isEditorOpen && (
        <>
          <div className="side-panel-overlay" onClick={() => { setEditingItem(null); setIsEditorOpen(false); setError(''); }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 7000, width: '400px', maxWidth: '90vw' }}>
            <div className="panel-card">
              <div className="side-panel-header">
                <h2>{editingItem ? '✏️ EDIT ITEM' : '🆕 NEW ITEM'}</h2>
                <button className="side-panel-close" onClick={() => { setEditingItem(null); setIsEditorOpen(false); setError(''); }}>✕</button>
              </div>
              <div className="side-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label className="form-label">ชื่อสินค้า</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Stock ปัจจุบัน</label>
                    <input className="form-input" type="number" min="0" step="1" value={form.stock} onChange={e => setForm({ ...form, stock: Number.parseInt(e.target.value, 10) || 0 })} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Min Threshold</label>
                    <input className="form-input" type="number" min="1" step="1" value={form.threshold} onChange={e => setForm({ ...form, threshold: Number.parseInt(e.target.value, 10) || 1 })} />
                  </div>
                </div>
                <div>
                  <label className="form-label">ราคา/หน่วย (THB)</label>
                  <input className="form-input" type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: Number.parseFloat(e.target.value) || 0 })} />
                </div>
                {error && <div className="form-error">{error}</div>}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" onClick={() => { setEditingItem(null); setIsEditorOpen(false); setError(''); }}>ยกเลิก</button>
                  <button className="btn btn-primary" onClick={handleSaveItem}>💾 บันทึก</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmationDialog
        open={!!confirmDeleteId}
        title="ยืนยันการลบสินค้า"
        message="คุณแน่ใจหรือไม่ที่จะลบสินค้าออกจากคลัง?"
        confirmLabel="ลบ"
        cancelLabel="ยกเลิก"
        variant="danger"
        onConfirm={() => confirmDeleteId && handleDeleteItem(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};
