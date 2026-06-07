'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { InventoryBatch } from '@/types';
import Topbar from '@/components/Topbar';
import {
  Alert01Icon, Shield01Icon, CheckmarkCircle01Icon, CancelCircleIcon,
  Calendar01Icon, Location01Icon,
} from 'hugeicons-react';
import { useAuth } from '@/lib/auth';

export default function QualityPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canAct = ['ADMIN', 'QC_INSPECTOR'].includes(user?.role ?? '');

  const { data: batches = [], isLoading } = useQuery<InventoryBatch[]>({
    queryKey: ['quality'],
    queryFn: () => api.get('/api/v1/quality').then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/api/v1/quality/${id}`, { quality_status: status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quality'] }),
  });

  return (
    <div className="flex-1 flex flex-col">
      <Topbar title="Quality Control" />
      <main className="flex-1 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
            <Alert01Icon size={20} primaryColor="#d97706" />
          </div>
          <div>
            <h2 className="text-base font-bold text-brand-black">Quarantine Batches</h2>
            <p className="text-sm text-brand-muted">{batches.length} batch{batches.length !== 1 ? 'es' : ''} awaiting QC inspection</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-56 bg-white rounded-3xl animate-pulse" />)}
          </div>
        ) : batches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-20 h-20 rounded-3xl bg-brand-teal/10 flex items-center justify-center mb-4">
              <Shield01Icon size={36} primaryColor="#409C9B" />
            </div>
            <p className="text-lg font-bold text-brand-black">All clear!</p>
            <p className="text-sm text-brand-muted mt-1">No batches in quarantine</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {batches.map((b) => (
              <div key={b.id} className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border-t-4 border-amber-400">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                      <Alert01Icon size={24} primaryColor="#d97706" />
                    </div>
                    <span className="text-xs bg-amber-50 text-amber-600 font-semibold px-2.5 py-1 rounded-full">Quarantine</span>
                  </div>
                  <h3 className="text-base font-bold text-brand-black leading-tight">{b.product_name}</h3>
                  <p className="text-xs font-mono text-brand-muted mt-0.5">{b.part_number}</p>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-brand-muted">
                      <Location01Icon size={14} primaryColor="#788596" />
                      <span>{b.bin_code} · {b.warehouse_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-brand-muted">
                      <Calendar01Icon size={14} primaryColor="#788596" />
                      <span>Received {b.received_date}</span>
                    </div>
                    {b.lot_number && (
                      <div className="flex items-center gap-2 text-sm text-brand-muted">
                        <span className="text-brand-muted text-xs font-semibold">LOT</span>
                        <span className="font-mono text-xs">{b.lot_number}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-brand-muted">Quantity</p>
                    <p className="text-2xl font-bold text-brand-black">{b.quantity} <span className="text-sm font-normal text-brand-muted">units</span></p>
                  </div>
                </div>

                {canAct && (
                  <div className="flex border-t border-gray-100">
                    <button
                      onClick={() => updateMutation.mutate({ id: b.id, status: 'RELEASED' })}
                      disabled={updateMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-brand-teal hover:bg-brand-teal/5 transition-colors"
                    >
                      <CheckmarkCircle01Icon size={16} primaryColor="#409C9B" />
                      Approve
                    </button>
                    <div className="w-px bg-gray-100" />
                    <button
                      onClick={() => updateMutation.mutate({ id: b.id, status: 'FAILED' })}
                      disabled={updateMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <CancelCircleIcon size={16} primaryColor="#ef4444" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
