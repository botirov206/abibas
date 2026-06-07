'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Product } from '@/types';
import Topbar from '@/components/Topbar';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import {
  PlusSignIcon, Search01Icon, CpuIcon, FlashIcon, Activity01Icon,
  Wrench01Icon, Package01Icon, Cancel01Icon,
} from 'hugeicons-react';
import { useAuth } from '@/lib/auth';

const ProductImage = ({ imageUrl, name, large = false }: { imageUrl: string | null; name: string; large?: boolean }) => {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`object-contain ${large ? 'w-full h-full' : 'w-28 h-28'}`}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
      />
    );
  }
  return null;
};

const categoryIcon = (name: string) => {
  const n = name?.toLowerCase() ?? '';
  if (n.includes('resistor') || n.includes('passive')) return <FlashIcon size={56} primaryColor="#e2e5ea" />;
  if (n.includes('capacitor')) return <Activity01Icon size={56} primaryColor="#e2e5ea" />;
  if (n.includes('microcontroller') || n.includes('active')) return <CpuIcon size={56} primaryColor="#e2e5ea" />;
  if (n.includes('tool') || n.includes('equipment')) return <Wrench01Icon size={56} primaryColor="#e2e5ea" />;
  return <Package01Icon size={56} primaryColor="#e2e5ea" />;
};

export default function ProductsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', part_number: '', description: '', unit_of_measure: 'PCS', reorder_point: 50, reorder_qty: 200 });

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products', search],
    queryFn: () => api.get(`/api/v1/products${search ? `?search=${search}` : ''}`).then((r) => r.data),
  });

  const addMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/api/v1/products', data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setShowAdd(false); setForm({ name: '', part_number: '', description: '', unit_of_measure: 'PCS', reorder_point: 50, reorder_qty: 200 }); },
  });

  const canAdd = ['ADMIN', 'PROCUREMENT'].includes(user?.role ?? '');

  return (
    <div className="flex-1 flex flex-col">
      <Topbar title="Products" />
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 bg-white rounded-full border border-gray-100 px-4 py-2.5 w-80 shadow-[0_2px_8px_rgb(0,0,0,0.04)]">
            <Search01Icon size={16} primaryColor="#788596" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or part number..."
              className="text-sm text-brand-black placeholder:text-brand-muted outline-none w-full bg-transparent"
            />
          </div>
          {canAdd && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 bg-brand-yellow hover:bg-[#dce34d] text-brand-black font-semibold rounded-full px-5 py-2.5 text-sm transition-all active:scale-95"
            >
              <PlusSignIcon size={18} primaryColor="#090909" />
              Add Product
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-52 bg-white rounded-3xl animate-pulse" />)}
          </div>
        ) : products.length === 0 ? (
          <EmptyState icon={Package01Icon} title="No products found" description="Try adjusting your search or add a new product" />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelected(p)}
                className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <div className="bg-brand-bg rounded-2xl h-36 flex items-center justify-center mb-4 overflow-hidden">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-contain p-2"
                      onError={(e) => {
                        const t = e.target as HTMLImageElement;
                        t.style.display = 'none';
                        (t.nextSibling as HTMLElement)?.style.setProperty('display', 'flex');
                      }}
                    />
                  ) : null}
                  <div className={`${p.image_url ? 'hidden' : 'flex'} items-center justify-center w-full h-full`} style={{ display: p.image_url ? 'none' : 'flex' }}>
                    {categoryIcon(p.specs?.[0]?.spec_name ?? '')}
                  </div>
                </div>
                <p className="text-xs text-brand-muted font-mono mb-1">{p.part_number}</p>
                <p className="text-sm font-semibold text-brand-black leading-tight mb-2 line-clamp-2">{p.name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-muted">Reorder: <span className="font-bold text-brand-black">{p.reorder_point}</span></span>
                  <span className="text-xs bg-brand-bg text-brand-muted px-2 py-0.5 rounded-full font-medium border border-gray-100">{p.unit_of_measure}</span>
                </div>
                {p.specs.length > 0 && (
                  <p className="text-xs text-brand-muted mt-2 truncate">{p.specs[0].spec_name}: {p.specs[0].spec_value}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Product detail side panel */}
      {selected && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-brand-black/20 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="w-96 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col h-full overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-brand-black">Product Details</h2>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-brand-bg transition-colors">
                <Cancel01Icon size={18} primaryColor="#788596" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-brand-bg rounded-3xl h-48 flex items-center justify-center overflow-hidden">
                {selected.image_url ? (
                  <img
                    src={selected.image_url}
                    alt={selected.name}
                    className="w-full h-full object-contain p-4"
                    onError={(e) => {
                      const t = e.target as HTMLImageElement;
                      t.style.display = 'none';
                      (t.nextSibling as HTMLElement)?.style.setProperty('display', 'flex');
                    }}
                  />
                ) : null}
                <div style={{ display: selected.image_url ? 'none' : 'flex' }} className="items-center justify-center w-full h-full">
                  <Package01Icon size={64} primaryColor="#e2e5ea" />
                </div>
              </div>
              <div>
                <p className="text-xs text-brand-muted font-mono">{selected.part_number}</p>
                <h3 className="text-xl font-bold text-brand-black mt-1">{selected.name}</h3>
                {selected.description && <p className="text-sm text-brand-muted mt-2">{selected.description}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-brand-bg rounded-2xl p-3">
                  <p className="text-xs text-brand-muted">Reorder Point</p>
                  <p className="text-lg font-bold text-brand-black">{selected.reorder_point}</p>
                </div>
                <div className="bg-brand-bg rounded-2xl p-3">
                  <p className="text-xs text-brand-muted">Reorder Qty</p>
                  <p className="text-lg font-bold text-brand-black">{selected.reorder_qty}</p>
                </div>
                <div className="bg-brand-bg rounded-2xl p-3 col-span-2">
                  <p className="text-xs text-brand-muted">Unit of Measure</p>
                  <p className="text-base font-semibold text-brand-black">{selected.unit_of_measure}</p>
                </div>
              </div>
              {selected.specs.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-brand-black mb-2">Technical Specifications</p>
                  <div className="space-y-2">
                    {selected.specs.map((s) => (
                      <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-brand-muted">{s.spec_name}</span>
                        <span className="text-sm font-semibold text-brand-black">{s.spec_value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Product modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Product">
        <div className="space-y-4">
          {['name', 'part_number', 'description'].map((field) => (
            <div key={field}>
              <label className="block text-sm font-semibold text-brand-black mb-1.5 capitalize">{field.replace('_', ' ')}</label>
              <input
                value={(form as any)[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full bg-brand-bg border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow"
                placeholder={field.replace('_', ' ')}
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-brand-black mb-1.5">Reorder Point</label>
              <input type="number" value={form.reorder_point} onChange={(e) => setForm({ ...form, reorder_point: +e.target.value })}
                className="w-full bg-brand-bg border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-black mb-1.5">Reorder Qty</label>
              <input type="number" value={form.reorder_qty} onChange={(e) => setForm({ ...form, reorder_qty: +e.target.value })}
                className="w-full bg-brand-bg border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 bg-brand-bg hover:bg-gray-100 text-brand-black font-semibold rounded-full py-2.5 text-sm transition-colors border border-gray-200">Cancel</button>
            <button onClick={() => addMutation.mutate(form)} disabled={addMutation.isPending} className="flex-1 bg-brand-yellow hover:bg-[#dce34d] text-brand-black font-semibold rounded-full py-2.5 text-sm transition-all active:scale-95 disabled:opacity-60">
              {addMutation.isPending ? 'Adding...' : 'Add Product'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
