'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { AlertItem } from '@/types';
import Topbar from '@/components/Topbar';
import EmptyState from '@/components/EmptyState';
import { AlertDiamondIcon, Notification03Icon, ShoppingBag01Icon } from 'hugeicons-react';
import Link from 'next/link';
import { useRequireRole } from '@/lib/auth';

export default function AlertsPage() {
  useRequireRole(['ADMIN', 'MANAGER', 'WAREHOUSE_OPERATOR', 'QC_INSPECTOR']);
  const { data: alerts = [], isLoading } = useQuery<AlertItem[]>({
    queryKey: ['alerts'],
    queryFn: () => api.get('/api/v1/inventory/alerts').then((r) => r.data),
  });

  const sorted = [...alerts].sort((a, b) => b.deficit - a.deficit);

  return (
    <div className="flex-1 flex flex-col">
      <Topbar title="Low Stock Alerts" />
      <main className="flex-1 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
            <Notification03Icon size={20} primaryColor="#d97706" />
          </div>
          <div>
            <h2 className="text-base font-bold text-brand-black">Reorder Alerts</h2>
            <p className="text-sm text-brand-muted">{alerts.length} product{alerts.length !== 1 ? 's' : ''} below reorder point</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-white rounded-3xl animate-pulse" />)}
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState icon={Notification03Icon} title="No alerts right now" description="All products are above their reorder points" />
        ) : (
          <div className="space-y-3">
            {sorted.map((a) => {
              const pct = Math.max(0, Math.min(100, (a.total_stock / a.reorder_point) * 100));
              const urgent = pct < 30;
              return (
                <div
                  key={a.product_id}
                  className={`bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-l-4 ${urgent ? 'border-red-400' : 'border-amber-400'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${urgent ? 'bg-red-50' : 'bg-amber-50'}`}>
                        <AlertDiamondIcon size={18} primaryColor={urgent ? '#ef4444' : '#d97706'} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-black">{a.name}</p>
                        <p className="text-xs font-mono text-brand-muted">{a.part_number}</p>
                      </div>
                    </div>
                    <Link
                      href="/purchase-orders"
                      className="shrink-0 flex items-center gap-1.5 bg-brand-yellow hover:bg-[#dce34d] text-brand-black font-semibold rounded-full px-3 py-2 text-xs transition-all active:scale-95"
                    >
                      <ShoppingBag01Icon size={14} primaryColor="#090909" />
                      Create PO
                    </Link>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-brand-muted">Current Stock</p>
                      <p className={`text-xl font-bold ${urgent ? 'text-red-500' : 'text-amber-600'}`}>{a.total_stock}</p>
                    </div>
                    <div>
                      <p className="text-xs text-brand-muted">Reorder Point</p>
                      <p className="text-xl font-bold text-brand-black">{a.reorder_point}</p>
                    </div>
                    <div>
                      <p className="text-xs text-brand-muted">Deficit</p>
                      <p className="text-xl font-bold text-brand-black">−{a.deficit}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="h-2 bg-brand-bg rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${urgent ? 'bg-red-400' : 'bg-amber-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-brand-muted mt-1">{Math.round(pct)}% of reorder point</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
