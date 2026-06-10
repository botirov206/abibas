'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { User, UserRole } from '@/types';
import Topbar from '@/components/Topbar';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { UserMultipleIcon, PlusSignIcon } from 'hugeicons-react';
import { useAuth, useRequireRole } from '@/lib/auth';

const roles: UserRole[] = ['ADMIN', 'WAREHOUSE_OPERATOR', 'PROCUREMENT', 'QC_INSPECTOR', 'MANAGER'];

export default function UsersPage() {
  useRequireRole(['ADMIN']);
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'WAREHOUSE_OPERATOR' as UserRole });

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/api/v1/users').then((r) => r.data),
    enabled: user?.role === 'ADMIN',
  });

  const addMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/api/v1/users', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setShowAdd(false); setForm({ name: '', email: '', password: '', role: 'WAREHOUSE_OPERATOR' }); },
  });

  const roleLabel = (r: UserRole) => r.replace(/_/g, ' ').charAt(0) + r.replace(/_/g, ' ').slice(1).toLowerCase();

  return (
    <div className="flex-1 flex flex-col">
      <Topbar title="User Management" />
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-brand-muted">{users.length} total users</p>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-brand-yellow hover:bg-[#dce34d] text-brand-black font-semibold rounded-full px-5 py-2.5 text-sm transition-all active:scale-95">
            <PlusSignIcon size={18} primaryColor="#090909" />
            Add User
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-brand-bg rounded-2xl animate-pulse" />)}</div>
          ) : users.length === 0 ? (
            <EmptyState icon={UserMultipleIcon} title="No users found" />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-brand-bg border-b border-gray-100">
                  {['User', 'Email', 'Role', 'Status'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-brand-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-brand-bg/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-yellow flex items-center justify-center shrink-0">
                          <span className="text-brand-black font-bold text-xs">
                            {u.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-brand-black">{u.name}</p>
                          <p className="text-xs text-brand-muted">ID #{u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-brand-muted">{u.email}</td>
                    <td className="px-5 py-4"><StatusBadge status={u.role} /></td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.is_active ? 'bg-brand-teal/10 text-brand-teal' : 'bg-red-50 text-red-600'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add User">
        <div className="space-y-4">
          {[
            { field: 'name', label: 'Full Name', placeholder: 'John Smith', type: 'text' },
            { field: 'email', label: 'Email', placeholder: 'john@abibas.com', type: 'email' },
            { field: 'password', label: 'Password', placeholder: '••••••••', type: 'password' },
          ].map(({ field, label, placeholder, type }) => (
            <div key={field}>
              <label className="block text-sm font-semibold text-brand-black mb-1.5">{label}</label>
              <input type={type} value={(form as any)[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                placeholder={placeholder}
                className="w-full bg-brand-bg border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-semibold text-brand-black mb-1.5">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              className="w-full bg-brand-bg border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-yellow">
              {roles.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 bg-brand-bg hover:bg-gray-100 text-brand-black font-semibold rounded-full py-2.5 text-sm transition-colors border border-gray-200">Cancel</button>
            <button onClick={() => addMutation.mutate(form)} disabled={addMutation.isPending || !form.name || !form.email || !form.password}
              className="flex-1 bg-brand-yellow hover:bg-[#dce34d] text-brand-black font-semibold rounded-full py-2.5 text-sm transition-all active:scale-95 disabled:opacity-60">
              {addMutation.isPending ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
