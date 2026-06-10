'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Supplier } from '@/types';
import Topbar from '@/components/Topbar';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { Building04Icon, PlusSignIcon, Mail01Icon, SmartPhone01Icon, Clock01Icon } from 'hugeicons-react';
import { useAuth, useRequireRole } from '@/lib/auth';

const leadTimeBadge = (days: number) => {
  if (days <= 3) return 'bg-brand-teal/10 text-brand-teal';
  if (days <= 7) return 'bg-amber-50 text-amber-600';
  return 'bg-red-50 text-red-600';
};

const countryFlag: Record<string, string> = { UK: '🇬🇧', US: '🇺🇸', DE: '🇩🇪', CN: '🇨🇳', JP: '🇯🇵' };

export default function SuppliersPage() {
  useRequireRole(['ADMIN', 'MANAGER', 'PROCUREMENT']);
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ company_name: '', contact_name: '', email: '', phone: '', country: 'UK', lead_time_days: 5 });

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/api/v1/suppliers').then((r) => r.data),
  });

  const addMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/api/v1/suppliers', data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); setShowAdd(false); setForm({ company_name: '', contact_name: '', email: '', phone: '', country: 'UK', lead_time_days: 5 }); },
  });

  const canAdd = ['ADMIN', 'PROCUREMENT'].includes(user?.role ?? '');

  return (
    <div className="flex-1 flex flex-col">
      <Topbar title="Suppliers" />
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-brand-muted">{suppliers.length} active suppliers</p>
          {canAdd && (
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-brand-yellow hover:bg-[#dce34d] text-brand-black font-semibold rounded-full px-5 py-2.5 text-sm transition-all active:scale-95">
              <PlusSignIcon size={18} primaryColor="#090909" />
              Add Supplier
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-48 bg-white rounded-3xl animate-pulse" />)}
          </div>
        ) : suppliers.length === 0 ? (
          <EmptyState icon={Building04Icon} title="No suppliers yet" description="Add your first supplier to start creating purchase orders" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {suppliers.map((s) => (
              <div key={s.id} className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all hover:-translate-y-0.5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-bg flex items-center justify-center">
                    <Building04Icon size={22} primaryColor="#788596" />
                  </div>
                  <span className="text-lg">{countryFlag[s.country] ?? '🌍'}</span>
                </div>
                <h3 className="text-base font-bold text-brand-black mb-1">{s.company_name}</h3>
                {s.contact_name && <p className="text-sm text-brand-muted mb-3">{s.contact_name}</p>}
                <div className="space-y-1.5">
                  {s.email && (
                    <div className="flex items-center gap-2 text-sm text-brand-muted">
                      <Mail01Icon size={14} primaryColor="#788596" />
                      <span className="truncate">{s.email}</span>
                    </div>
                  )}
                  {s.phone && (
                    <div className="flex items-center gap-2 text-sm text-brand-muted">
                      <SmartPhone01Icon size={14} primaryColor="#788596" />
                      {s.phone}
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                  <Clock01Icon size={14} primaryColor="#788596" />
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${leadTimeBadge(s.lead_time_days)}`}>
                    {s.lead_time_days} day lead time
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Supplier">
        <div className="space-y-4">
          {[
            { field: 'company_name', label: 'Company Name', placeholder: 'RS Components UK' },
            { field: 'contact_name', label: 'Contact Name', placeholder: 'John Smith' },
            { field: 'email', label: 'Email', placeholder: 'orders@supplier.co.uk' },
            { field: 'phone', label: 'Phone', placeholder: '+44 1234 567890' },
          ].map(({ field, label, placeholder }) => (
            <div key={field}>
              <label className="block text-sm font-semibold text-brand-black mb-1.5">{label}</label>
              <input value={(form as any)[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                placeholder={placeholder}
                className="w-full bg-brand-bg border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-brand-black mb-1.5">Country</label>
              <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full bg-brand-bg border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow">
                {['UK', 'US', 'DE', 'CN', 'JP'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-black mb-1.5">Lead Time (days)</label>
              <input type="number" value={form.lead_time_days} onChange={(e) => setForm({ ...form, lead_time_days: +e.target.value })}
                className="w-full bg-brand-bg border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 bg-brand-bg hover:bg-gray-100 text-brand-black font-semibold rounded-full py-2.5 text-sm transition-colors border border-gray-200">Cancel</button>
            <button onClick={() => addMutation.mutate(form)} disabled={addMutation.isPending} className="flex-1 bg-brand-yellow hover:bg-[#dce34d] text-brand-black font-semibold rounded-full py-2.5 text-sm transition-all active:scale-95 disabled:opacity-60">
              {addMutation.isPending ? 'Adding...' : 'Add Supplier'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
