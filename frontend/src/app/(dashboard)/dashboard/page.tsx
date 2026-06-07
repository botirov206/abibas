'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Topbar from '@/components/Topbar';
import StatusBadge from '@/components/StatusBadge';
import { Dashboard, StockMovement } from '@/types';
import {
  Package01Icon, Store01Icon, ShoppingBag01Icon, Notification03Icon,
  Alert01Icon, ArrowLeftRightIcon, PackageAddIcon, PackageRemove01Icon,
  RotateLeft01Icon, SlidersHorizontalIcon,
} from 'hugeicons-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const kpiConfig = [
  { key: 'total_products',       label: 'Total Products',       icon: Package01Icon,     color: 'bg-brand-yellow/20 text-brand-black' },
  { key: 'total_stock_units',    label: 'Total Stock Units',    icon: Store01Icon,        color: 'bg-brand-teal/15 text-brand-teal' },
  { key: 'open_purchase_orders', label: 'Open Purchase Orders', icon: ShoppingBag01Icon,  color: 'bg-purple-100 text-purple-600' },
  { key: 'low_stock_count',      label: 'Low Stock Alerts',     icon: Notification03Icon, color: 'bg-amber-50 text-amber-600' },
];

const movementIcon: Record<string, React.ReactNode> = {
  RECEIVE:    <PackageAddIcon size={16} primaryColor="#409C9B" />,
  SHIP:       <PackageRemove01Icon size={16} primaryColor="#3b82f6" />,
  TRANSFER:   <ArrowLeftRightIcon size={16} primaryColor="#409C9B" />,
  ADJUSTMENT: <SlidersHorizontalIcon size={16} primaryColor="#d97706" />,
  RETURN:     <RotateLeft01Icon size={16} primaryColor="#9333ea" />,
};

export default function DashboardPage() {
  const { data: dash, isLoading: dashLoading } = useQuery<Dashboard>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/api/v1/dashboard').then((r) => r.data),
  });
  const { data: movements, isLoading: movLoading } = useQuery<StockMovement[]>({
    queryKey: ['movements', 10],
    queryFn: () => api.get('/api/v1/movements?limit=10').then((r) => r.data),
  });

  if (dashLoading) return (
    <div className="flex-1 flex flex-col">
      <Topbar title="Dashboard" />
      <div className="p-6 grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-white rounded-3xl animate-pulse" />
        ))}
      </div>
    </div>
  );

  const chartData = dash?.movement_summary?.map((m) => ({
    name: m.movement_type.charAt(0) + m.movement_type.slice(1).toLowerCase(),
    count: m.count,
  })) ?? [];

  return (
    <div className="flex-1 flex flex-col">
      <Topbar title="Dashboard" />
      <main className="flex-1 p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {kpiConfig.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color}`}>
                <Icon size={22} />
              </div>
              <p className="text-3xl font-bold text-brand-black">
                {(dash as any)?.[key]?.toLocaleString() ?? '—'}
              </p>
              <p className="text-sm text-brand-muted mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Movement Chart */}
          <div className="col-span-2 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
            <h2 className="text-base font-bold text-brand-black mb-1">Stock Movement Summary</h2>
            <p className="text-sm text-brand-muted mb-5">All-time movement counts by type</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f5f7" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#788596' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#788596' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', fontSize: 13 }}
                  cursor={{ fill: '#F9F9FB' }}
                />
                <Bar dataKey="count" fill="#EBF05B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quarantine card */}
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 flex flex-col">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
              <Alert01Icon size={22} primaryColor="#d97706" />
            </div>
            <p className="text-3xl font-bold text-brand-black">{dash?.quarantine_batches ?? 0}</p>
            <p className="text-sm text-brand-muted mt-1">Quarantine Batches</p>
            <p className="text-xs text-brand-muted mt-1">Awaiting QC inspection</p>
            <div className="mt-auto pt-4 border-t border-gray-100">
              <p className="text-sm text-brand-black font-semibold">{dash?.pending_sales_orders ?? 0} pending sales orders</p>
              <p className="text-xs text-brand-muted">require shipping</p>
            </div>
          </div>
        </div>

        {/* Recent Movements */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-base font-bold text-brand-black">Recent Movements</h2>
          </div>
          {movLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-brand-bg rounded-2xl animate-pulse" />)}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-brand-bg border-b border-gray-100">
                  {['Type', 'Product', 'From → To Bin', 'Qty', 'By', 'Time'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-brand-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movements?.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-brand-bg/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {movementIcon[m.movement_type]}
                        <StatusBadge status={m.movement_type} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-brand-black">{m.product_name}</p>
                      <p className="text-xs text-brand-muted">{m.part_number}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-brand-muted">
                      {m.from_bin_code ?? '—'} → {m.to_bin_code ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-brand-black">{m.quantity}</td>
                    <td className="px-5 py-3.5 text-sm text-brand-muted">{m.performed_by}</td>
                    <td className="px-5 py-3.5 text-xs text-brand-muted">
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
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
