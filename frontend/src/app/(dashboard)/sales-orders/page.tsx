'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { SalesOrder, Product } from '@/types';
import Topbar from '@/components/Topbar';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { ShoppingBag01Icon, PlusSignIcon, ArrowDown01Icon, ArrowUp01Icon, Delete01Icon } from 'hugeicons-react';
import { useAuth } from '@/lib/auth';

const statusTabs = ['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const nextStatuses: Record<string, string[]> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export default function SalesOrdersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState('ALL');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ customer_ref: '', customer_email: '', ship_by_date: '', items: [{ product_id: '', quantity: '', unit_price: '' }] });

  const { data: orders = [], isLoading } = useQuery<SalesOrder[]>({ queryKey: ['sos'], queryFn: () => api.get('/api/v1/sales-orders').then((r) => r.data) });
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ['products'], queryFn: () => api.get('/api/v1/products').then((r) => r.data) });

  const addMutation = useMutation({
    mutationFn: (data: object) => api.post('/api/v1/sales-orders', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sos'] }); setShowAdd(false); },
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.patch(`/api/v1/sales-orders/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sos'] }),
  });

  const filtered = tab === 'ALL' ? orders : orders.filter((o) => o.status === tab);
  const canEdit = user?.role === 'ADMIN';

  const addItem = () => setForm({ ...form, items: [...form.items, { product_id: '', quantity: '', unit_price: '' }] });
  const removeItem = (i: number) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i: number, field: string, val: string) => { const items = [...form.items]; (items[i] as any)[field] = val; setForm({ ...form, items }); };

  return (
    <div className="flex-1 flex flex-col">
      <Topbar title="Sales Orders" />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {statusTabs.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${tab === t ? 'bg-brand-black text-white shadow-sm' : 'bg-white text-brand-muted border border-gray-200 hover:border-gray-300'}`}>
                {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          {canEdit && (
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-brand-yellow hover:bg-[#dce34d] text-brand-black font-semibold rounded-full px-5 py-2.5 text-sm transition-all active:scale-95">
              <PlusSignIcon size={18} primaryColor="#090909" />
              Create SO
            </button>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-brand-bg rounded-2xl animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={ShoppingBag01Icon} title="No sales orders" />
          ) : (
            <div>
              <div className="grid grid-cols-6 gap-4 px-5 py-3 bg-brand-bg border-b border-gray-100 text-xs font-semibold text-brand-muted uppercase tracking-wider">
                {['SO #', 'Customer', 'Status', 'Items', 'Ship By', 'Actions'].map((h) => <div key={h}>{h}</div>)}
              </div>
              {filtered.map((so) => (
                <div key={so.id}>
                  <div className="grid grid-cols-6 gap-4 px-5 py-4 border-b border-gray-50 hover:bg-brand-bg/50 transition-colors items-center">
                    <div
                      onClick={() => setExpanded(expanded === so.id ? null : so.id)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span className="text-sm font-bold text-brand-black">SO-{String(so.id).padStart(4, '0')}</span>
                      {expanded === so.id
                        ? <ArrowUp01Icon size={14} primaryColor="#788596" />
                        : <ArrowDown01Icon size={14} primaryColor="#788596" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-black truncate max-w-[160px]" title={so.customer_ref}>{so.customer_ref}</p>
                      {so.customer_email && <p className="text-xs text-brand-muted truncate">{so.customer_email}</p>}
                    </div>
                    <div><StatusBadge status={so.status} /></div>
                    <div className="text-sm text-brand-muted">{so.items.length} items</div>
                    <div className="text-sm text-brand-muted">{so.ship_by_date ?? '—'}</div>
                    <div>
                      {canEdit && nextStatuses[so.status]?.length > 0 && (
                        <select
                          value=""
                          onChange={(e) => e.target.value && statusMutation.mutate({ id: so.id, status: e.target.value })}
                          className="text-xs bg-brand-bg border border-gray-200 rounded-full px-3 py-1.5 text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                        >
                          <option value="">Update status</option>
                          {nextStatuses[so.status].map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                  {expanded === so.id && (
                    <div className="bg-brand-bg border-b border-gray-100 px-5 py-4">
                      <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">Line Items</p>
                      <table className="w-full text-sm">
                        <thead><tr className="text-xs text-brand-muted">{['Product', 'Part #', 'Qty', 'Unit Price', 'Total'].map((h) => <th key={h} className="text-left pb-2 font-semibold">{h}</th>)}</tr></thead>
                        <tbody>
                          {so.items.map((item) => (
                            <tr key={item.id} className="border-t border-gray-100">
                              <td className="py-2 font-semibold text-brand-black">{item.product_name}</td>
                              <td className="py-2 font-mono text-xs text-brand-muted">{item.part_number}</td>
                              <td className="py-2 text-brand-black">{item.quantity}</td>
                              <td className="py-2 text-brand-muted">£{item.unit_price.toFixed(2)}</td>
                              <td className="py-2 font-bold text-brand-black">£{(item.quantity * item.unit_price).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create Sales Order" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-brand-black mb-1.5">Customer Reference</label>
              <input value={form.customer_ref} onChange={(e) => setForm({ ...form, customer_ref: e.target.value })}
                className="w-full bg-brand-bg border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow" placeholder="e.g. ACME Corp PO-001" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-black mb-1.5">Customer Email</label>
              <input type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                className="w-full bg-brand-bg border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow" placeholder="orders@customer.co.uk" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-black mb-1.5">Ship By Date</label>
            <input type="date" value={form.ship_by_date} onChange={(e) => setForm({ ...form, ship_by_date: e.target.value })}
              className="w-full bg-brand-bg border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
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
                <input type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                  placeholder="Qty" className="bg-brand-bg border border-gray-200 rounded-2xl px-3 py-2 text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
                <div className="flex gap-2">
                  <input type="number" step="0.01" value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', e.target.value)}
                    placeholder="£ price" className="flex-1 bg-brand-bg border border-gray-200 rounded-2xl px-3 py-2 text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
                  {form.items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-50 text-red-400 transition-colors">
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
                customer_ref: form.customer_ref, customer_email: form.customer_email || undefined,
                ship_by_date: form.ship_by_date || undefined,
                items: form.items.filter((i) => i.product_id).map((i) => ({ product_id: +i.product_id, quantity: +i.quantity, unit_price: +i.unit_price })),
              })}
              disabled={addMutation.isPending || !form.customer_ref}
              className="flex-1 bg-brand-yellow hover:bg-[#dce34d] text-brand-black font-semibold rounded-full py-2.5 text-sm transition-all active:scale-95 disabled:opacity-60">
              {addMutation.isPending ? 'Creating...' : 'Create SO'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
