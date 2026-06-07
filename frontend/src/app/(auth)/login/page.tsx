'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  FlashIcon, Package01Icon, CpuIcon, Wrench01Icon, Store01Icon,
  ViewIcon, ViewOffIcon,
} from 'hugeicons-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-black flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-brand-yellow blur-3xl" />
          <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-brand-teal blur-3xl" />
        </div>

        {/* Floating component icons */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="grid grid-cols-4 gap-10">
            {Array.from({ length: 16 }).map((_, i) => {
              const icons = [Package01Icon, CpuIcon, Wrench01Icon, Store01Icon, FlashIcon];
              const Icon = icons[i % icons.length];
              return <Icon key={i} size={40} primaryColor="white" />;
            })}
          </div>
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-brand-yellow flex items-center justify-center">
              <FlashIcon size={22} primaryColor="#090909" />
            </div>
            <span className="text-white font-bold text-xl">StockPilot WMS</span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Electronics &<br />Hardware Warehouse<br />
            <span className="text-brand-yellow">Management System</span>
          </h2>
          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            Manage stock across bin-level locations, track purchase orders, quality inspections, and supplier relationships — all in one place.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-4">
          {[
            { label: 'Products', value: '10+' },
            { label: 'Warehouses', value: '2' },
            { label: 'Suppliers', value: '4' },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 rounded-3xl p-4">
              <p className="text-2xl font-bold text-brand-yellow">{s.value}</p>
              <p className="text-white/50 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-brand-yellow flex items-center justify-center">
              <FlashIcon size={18} primaryColor="#090909" />
            </div>
            <span className="font-bold text-lg text-brand-black">StockPilot WMS</span>
          </div>

          <h1 className="text-3xl font-bold text-brand-black mb-2">Welcome back</h1>
          <p className="text-brand-muted text-sm mb-8">Sign in to your account to continue</p>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-brand-black mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@stockpilot.com"
                className="w-full bg-brand-bg border border-gray-200 rounded-2xl px-4 py-3 text-sm text-brand-black placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-black mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-brand-bg border border-gray-200 rounded-2xl px-4 py-3 pr-11 text-sm text-brand-black placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-black transition-colors"
                >
                  {showPw
                    ? <ViewOffIcon size={18} primaryColor="#788596" />
                    : <ViewIcon size={18} primaryColor="#788596" />
                  }
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-yellow hover:bg-[#dce34d] text-brand-black font-bold rounded-full py-3 text-sm transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-brand-bg rounded-3xl border border-gray-100">
            <p className="text-xs font-semibold text-brand-muted mb-2">Demo credentials</p>
            {[
              { role: 'Admin', email: 'admin@stockpilot.com' },
              { role: 'Operator', email: 'operator@stockpilot.com' },
              { role: 'QC Inspector', email: 'qc@stockpilot.com' },
            ].map((c) => (
              <button
                key={c.email}
                type="button"
                onClick={() => { setEmail(c.email); setPassword('pass1234'); }}
                className="w-full text-left flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-white transition-colors group"
              >
                <span className="text-xs font-semibold text-brand-black">{c.role}</span>
                <span className="text-xs text-brand-muted group-hover:text-brand-black">{c.email}</span>
              </button>
            ))}
            <p className="text-xs text-brand-muted mt-2 text-center">Password: <code className="bg-white px-1.5 py-0.5 rounded-lg font-mono">pass1234</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
