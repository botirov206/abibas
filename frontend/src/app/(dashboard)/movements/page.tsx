'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { StockMovement, Product, Bin } from '@/types';
import Topbar from '@/components/Topbar';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import {
  ArrowLeftRightIcon, PackageAddIcon, PackageRemove01Icon, RotateLeft01Icon,
  SlidersHorizontalIcon, PlusSignIcon,
} from 'hugeicons-react';
import { useAuth } from '@/lib/auth';

const typeFilter = ['ALL', 'RECEIVE', 'SHIP', 'TRANSFER', 'ADJUSTMENT', 'RETURN'];

const typeIcon: Record<string, React.ReactNode> = {
  RECEIVE:    <PackageAddIcon size={18} primaryColor="#409C9B" />,
  SHIP:       <PackageRemove01Icon size={18} primaryColor="#3b82f6" />,
  TRANSFER:   <ArrowLeftRightIcon size={18} primaryColor="#409C9B" />,
  ADJUSTMENT: <SlidersHorizontalIcon size={18} primaryColor="#d97706" />,
  RETURN:     <RotateLeft01Icon size={18} primaryColor="#9333ea" />,
};

export default function MovementsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('ALL');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ product_id: '', to_bin_id: '', quantity: '', movement_type: 'ADJUSTMENT', notes: '' });

  const { data: movements = [], isLoading } = useQuery<StockMovement[]>({
    queryKey: ['movements', 50],
    queryFn: () => api.get('/api/v1/movements?limit=50').then((r) => r.data),
  });
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ['products'], queryFn: () => api.get('/api/v1/products').then((r) => r.data) });

  const addMutation = useMutation({
    mutationFn: (data: object) => api.post('/api/v1/movements', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['movements'] }); setShowAdd(false); },
  });

  const filtered = filter === 'ALL' ? movements : movements.filter((m) => m.movement_type === filter);
  const canAdd = ['ADMIN', 'WAREHOUSE_OPERATOR'].includes(user?.role ?? '');

  return (
    <div className="flex-1 flex flex-col">
      <Topbar title="Stock Movements" />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {typeFilter.map((t) => (
              <button key={t} onClick={() => setFilter(t)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${filter === t ? 'bg-brand-black text-white shadow-sm' : 'bg-white text-brand-muted border border-gray-200 hover:border-gray-300'}`}>
                {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          {canAdd && (
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-brand-yellow hover:bg-[#dce34d] text-brand-black font-semibold rounded-full px-5 py-2.5 text-sm transition-all active:scale-95">
              <PlusSignIcon size={18} primaryColor="#090909" />
              Log Movement
            </button>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-12 bg-brand-bg rounded-2xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={ArrowLeftRightIcon} title="No movements found" />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-brand-bg border-b border-gray-100">
                  {['Type', 'Product', 'From → To', 'Qty', 'Performed By', 'Notes', 'Date'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-brand-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-brand-bg/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {typeIcon[m.movement_type]}
                        <StatusBadge status={m.movement_type} />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-brand-black">{m.product_name}</p>
                      <p className="text-xs text-brand-muted font-mono">{m.part_number}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-brand-muted">
                      <span className="font-mono text-xs">{m.from_bin_code ?? '—'}</span>
                      <span className="mx-1 text-brand-muted">→</span>
                      <span className="font-mono text-xs">{m.to_bin_code ?? '—'}</span>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-brand-black">{m.quantity}</td>
                    <td className="px-5 py-4 text-sm text-brand-muted">{m.performed_by}</td>
                    <td className="px-5 py-4 text-xs text-brand-muted max-w-32 truncate">{m.notes ?? '—'}</td>
                    <td className="px-5 py-4 text-xs text-brand-muted">{new Date(m.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Log Movement">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-brand-black mb-1.5">Product</label>
            <select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              className="w-full bg-brand-bg border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow">
              <option value="">Select product...</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.part_number})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-black mb-1.5">Movement Type</label>
            <select value={form.movement_type} onChange={(e) => setForm({ ...form, movement_type: e.target.value })}
              className="w-full bg-brand-bg border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow">
              {['RECEIVE', 'SHIP', 'TRANSFER', 'ADJUSTMENT', 'RETURN'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-black mb-1.5">Quantity</label>
            <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="w-full bg-brand-bg border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow" placeholder="Enter quantity" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-brand-black mb-1.5">Notes (optional)</label>
            <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-brand-bg border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow" placeholder="e.g. Manual correction..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 bg-brand-bg hover:bg-gray-100 text-brand-black font-semibold rounded-full py-2.5 text-sm transition-colors border border-gray-200">Cancel</button>
            <button
              onClick={() => addMutation.mutate({ product_id: +form.product_id, quantity: +form.quantity, movement_type: form.movement_type, notes: form.notes || undefined })}
              disabled={addMutation.isPending || !form.product_id || !form.quantity}
              className="flex-1 bg-brand-yellow hover:bg-[#dce34d] text-brand-black font-semibold rounded-full py-2.5 text-sm transition-all active:scale-95 disabled:opacity-60">
              {addMutation.isPending ? 'Logging...' : 'Log Movement'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
