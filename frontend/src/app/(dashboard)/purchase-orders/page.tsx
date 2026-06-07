'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { PurchaseOrder, Supplier, Product } from '@/types';
import Topbar from '@/components/Topbar';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { ClipboardIcon, PlusSignIcon, ArrowDown01Icon, ArrowUp01Icon, Delete01Icon } from 'hugeicons-react';
import { useAuth } from '@/lib/auth';

const statusTabs = ['ALL', 'DRAFT', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'];

export default function PurchaseOrdersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState('ALL');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ supplier_id: '', expected_date: '', notes: '', items: [{ product_id: '', quantity_ordered: '', unit_cost: '' }] });

  const { data: pos = [], isLoading } = useQuery<PurchaseOrder[]>({ queryKey: ['pos'], queryFn: () => api.get('/api/v1/purchase-orders').then((r) => r.data) });
  const { data: suppliers = [] } = useQuery<Supplier[]>({ queryKey: ['suppliers'], queryFn: () => api.get('/api/v1/suppliers').then((r) => r.data) });
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ['products'], queryFn: () => api.get('/api/v1/products').then((r) => r.data) });

  const addMutation = useMutation({
    mutationFn: (data: object) => api.post('/api/v1/purchase-orders', data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pos'] }); setShowAdd(false); },
  });

  const canEdit = ['ADMIN', 'PROCUREMENT'].includes(user?.role ?? '');
  const filtered = tab === 'ALL' ? pos : pos.filter((p) => p.status === tab);

  const tabLabel = (t: string) => {
    if (t === 'ALL') return 'All';
    if (t === 'PARTIALLY_RECEIVED') return 'Partial';
    return t.charAt(0) + t.slice(1).toLowerCase();
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { product_id: '', quantity_ordered: '', unit_cost: '' }] });
  const removeItem = (i: number) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i: number, field: string, val: string) => {
    const items = [...form.items];
    (items[i] as any)[field] = val;
    setForm({ ...form, items });
  };

  return (
    <div className="flex-1 flex flex-col">
      <Topbar title="Purchase Orders" />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {statusTabs.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${tab === t ? 'bg-brand-black text-white shadow-sm' : 'bg-white text-brand-muted border border-gray-200 hover:border-gray-300'}`}>
                {tabLabel(t)}
              </button>
            ))}
          </div>
          {canEdit && (
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-brand-yellow hover:bg-[#dce34d] text-brand-black font-semibold rounded-full px-5 py-2.5 text-sm transition-all active:scale-95">
              <PlusSignIcon size={18} primaryColor="#090909" />
              Create PO
            </button>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-brand-bg rounded-2xl animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={ClipboardIcon} title="No purchase orders" description="Create a purchase order to start receiving stock" />
          ) : (
            <div>
              <div className="grid grid-cols-6 gap-4 px-5 py-3 bg-brand-bg border-b border-gray-100 text-xs font-semibold text-brand-muted uppercase tracking-wider">
                {['PO #', 'Supplier', 'Status', 'Items', 'Expected Date', ''].map((h) => <div key={h}>{h}</div>)}
              </div>
              {filtered.map((po) => (
                <div key={po.id}>
                  <div
                    onClick={() => setExpanded(expanded === po.id ? null : po.id)}
                    className="grid grid-cols-6 gap-4 px-5 py-4 border-b border-gray-50 hover:bg-brand-bg/50 cursor-pointer transition-colors items-center"
                  >
                    <div className="text-sm font-bold text-brand-black">PO-{String(po.id).padStart(4, '0')}</div>
                    <div className="text-sm text-brand-black font-medium">{po.supplier_name}</div>
                    <div><StatusBadge status={po.status} /></div>
                    <div className="text-sm text-brand-muted">{po.items.length} line items</div>
                    <div className="text-sm text-brand-muted">{po.expected_date ?? '—'}</div>
                    <div className="flex justify-end">
                      {expanded === po.id
                        ? <ArrowUp01Icon size={16} primaryColor="#788596" />
                        : <ArrowDown01Icon size={16} primaryColor="#788596" />
                      }
                    </div>
                  </div>
                  {expanded === po.id && (
                    <div className="bg-brand-bg border-b border-gray-100 px-5 py-4">
                      <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">Line Items</p>
                      <table className="w-full text-sm">
                        <thead><tr className="text-xs text-brand-muted">{['Product', 'Part #', 'Ordered', 'Received', 'Unit Cost'].map((h) => <th key={h} className="text-left pb-2 font-semibold">{h}</th>)}</tr></thead>
                        <tbody>
                          {po.items.map((item) => (
                            <tr key={item.id} className="border-t border-gray-100">
                              <td className="py-2 font-semibold text-brand-black">{item.product_name}</td>
                              <td className="py-2 font-mono text-xs text-brand-muted">{item.part_number}</td>
                              <td className="py-2 text-brand-black">{item.quantity_ordered}</td>
                              <td className="py-2">
                                <span className={item.quantity_received >= item.quantity_ordered ? 'text-brand-teal font-semibold' : 'text-amber-600 font-semibold'}>{item.quantity_received}</span>
                              </td>
                              <td className="py-2 text-brand-muted">£{item.unit_cost.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {po.notes && <p className="text-xs text-brand-muted mt-3">Notes: {po.notes}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create Purchase Order" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-brand-black mb-1.5">Supplier</label>
              <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                className="w-full bg-brand-bg border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow">
                <option value="">Select supplier...</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.company_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-black mb-1.5">Expected Date</label>
              <input type="date" value={form.expected_date} onChange={(e) => setForm({ ...form, expected_date: e.target.value })}
                className="w-full bg-brand-bg border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-black mb-1.5">Notes</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-brand-bg border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow" placeholder="Optional notes..." />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-brand-black">Line Items</label>
              <button onClick={addItem} className="text-xs text-brand-teal font-semibold hover:text-brand-black">+ Add Item</button>
            </div>
            {form.items.map((item, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 mb-2 items-center">
                <select value={item.product_id} onChange={(e) => updateItem(i, 'product_id', e.target.value)}
                  className="bg-brand-bg border border-gray-200 rounded-2xl px-3 py-2 text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow">
                  <option value="">Product...</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" value={item.quantity_ordered} onChange={(e) => updateItem(i, 'quantity_ordered', e.target.value)}
                  placeholder="Qty" className="bg-brand-bg border border-gray-200 rounded-2xl px-3 py-2 text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
                <div className="flex gap-2">
                  <input type="number" step="0.01" value={item.unit_cost} onChange={(e) => updateItem(i, 'unit_cost', e.target.value)}
                    placeholder="£ cost" className="flex-1 bg-brand-bg border border-gray-200 rounded-2xl px-3 py-2 text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
                  {form.items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors">
                      <Delete01Icon size={16} primaryColor="#f87171" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 bg-brand-bg hover:bg-gray-100 text-brand-black font-semibold rounded-full py-2.5 text-sm transition-colors border border-gray-200">Cancel</button>
            <button
              onClick={() => addMutation.mutate({
                supplier_id: +form.supplier_id, expected_date: form.expected_date || undefined, notes: form.notes || undefined,
                items: form.items.filter((i) => i.product_id).map((i) => ({ product_id: +i.product_id, quantity_ordered: +i.quantity_ordered, unit_cost: +i.unit_cost })),
              })}
              disabled={addMutation.isPending || !form.supplier_id}
              className="flex-1 bg-brand-yellow hover:bg-[#dce34d] text-brand-black font-semibold rounded-full py-2.5 text-sm transition-all active:scale-95 disabled:opacity-60">
              {addMutation.isPending ? 'Creating...' : 'Create PO'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
