'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { InventoryBatch } from '@/types';
import Topbar from '@/components/Topbar';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { Store01Icon, FilterIcon } from 'hugeicons-react';
import { useRequireRole } from '@/lib/auth';

const statusFilters = ['ALL', 'RELEASED', 'QUARANTINE', 'PASSED', 'FAILED'];

export default function InventoryPage() {
  useRequireRole(['ADMIN', 'MANAGER', 'WAREHOUSE_OPERATOR', 'QC_INSPECTOR']);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: batches = [], isLoading } = useQuery<InventoryBatch[]>({
    queryKey: ['inventory', statusFilter],
    queryFn: () =>
      api.get(`/api/v1/inventory${statusFilter !== 'ALL' ? `?quality_status=${statusFilter}` : ''}`).then((r) => r.data),
  });

  return (
    <div className="flex-1 flex flex-col">
      <Topbar title="Inventory" />
      <main className="flex-1 p-6">
        {/* Filter chips */}
        <div className="flex items-center gap-2 mb-6">
          <FilterIcon size={16} primaryColor="#788596" />
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                statusFilter === s
                  ? 'bg-brand-black text-white shadow-sm'
                  : 'bg-white text-brand-muted border border-gray-200 hover:border-gray-300'
              }`}
            >
              {s === 'ALL' ? 'All Batches' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-12 bg-brand-bg rounded-2xl animate-pulse" />)}
            </div>
          ) : batches.length === 0 ? (
            <EmptyState icon={Store01Icon} title="No inventory batches" description="Adjust filters or receive stock via a purchase order" />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-brand-bg border-b border-gray-100">
                  {['Bin Code', 'Product', 'Part #', 'Lot #', 'Qty', 'Quality', 'Received', 'Expiry', 'Warehouse'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-brand-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr
                    key={b.id}
                    className={`border-b border-gray-50 hover:bg-brand-bg/50 transition-colors ${
                      b.quality_status === 'QUARANTINE' ? 'border-l-4 border-l-amber-400' : ''
                    }`}
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs bg-brand-bg text-brand-black px-2 py-1 rounded-xl border border-gray-100">{b.bin_code}</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-brand-black">{b.product_name}</p>
                      <p className="text-xs text-brand-muted">{b.zone_name}</p>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-brand-muted">{b.part_number}</td>
                    <td className="px-5 py-4 text-xs text-brand-muted">{b.lot_number ?? '—'}</td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-brand-black">{b.quantity}</span>
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={b.quality_status} /></td>
                    <td className="px-5 py-4 text-xs text-brand-muted">{b.received_date}</td>
                    <td className="px-5 py-4 text-xs text-brand-muted">{b.expiry_date ?? '—'}</td>
                    <td className="px-5 py-4 text-xs text-brand-muted">{b.warehouse_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
