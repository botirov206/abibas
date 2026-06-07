'use client';
import { Search01Icon, Notification01Icon } from 'hugeicons-react';
import { useAuth } from '@/lib/auth';

export default function Topbar({ title }: { title: string }) {
  const { user } = useAuth();
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-xl font-bold text-brand-black">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-brand-bg rounded-full px-4 py-2 w-72 border border-gray-100">
          <Search01Icon size={16} primaryColor="#788596" />
          <input
            type="text"
            placeholder="Search anything..."
            className="bg-transparent text-sm text-brand-black placeholder:text-brand-muted outline-none w-full"
          />
        </div>
        <button className="relative w-9 h-9 flex items-center justify-center rounded-full bg-brand-bg border border-gray-100 hover:bg-gray-100 transition-colors">
          <Notification01Icon size={18} primaryColor="#788596" />
        </button>
        <div className="w-9 h-9 rounded-full bg-brand-yellow flex items-center justify-center">
          <span className="text-brand-black font-bold text-xs">
            {user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
          </span>
        </div>
      </div>
    </header>
  );
}
