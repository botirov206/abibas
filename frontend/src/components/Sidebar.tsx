'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DashboardSquare01Icon, Package01Icon, Store01Icon, Building04Icon,
  ClipboardIcon, ShoppingBag01Icon, Shield01Icon, ArrowLeftRightIcon,
  Notification03Icon, UserMultipleIcon, Logout01Icon, FlashIcon,
  ArrowUp01Icon,
} from 'hugeicons-react';
import { useAuth } from '@/lib/auth';
import { UserRole } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { href: '/dashboard',       icon: DashboardSquare01Icon, label: 'Salom Dunyo',       roles: ['ADMIN','MANAGER','WAREHOUSE_OPERATOR','PROCUREMENT','QC_INSPECTOR'] },
  { href: '/products',        icon: Package01Icon,          label: 'Products',        roles: ['ADMIN','MANAGER','WAREHOUSE_OPERATOR','PROCUREMENT','QC_INSPECTOR'] },
  { href: '/inventory',       icon: Store01Icon,            label: 'Inventory',       roles: ['ADMIN','MANAGER','WAREHOUSE_OPERATOR','QC_INSPECTOR'] },
  { href: '/suppliers',       icon: Building04Icon,         label: 'Suppliers',       roles: ['ADMIN','MANAGER','PROCUREMENT'] },
  { href: '/purchase-orders', icon: ClipboardIcon,          label: 'Purchase Orders', roles: ['ADMIN','MANAGER','PROCUREMENT'] },
  { href: '/sales-orders',    icon: ShoppingBag01Icon,      label: 'Sales Orders',    roles: ['ADMIN','MANAGER'] },
  { href: '/quality',         icon: Shield01Icon,           label: 'Quality Control', roles: ['ADMIN','MANAGER','QC_INSPECTOR'] },
  { href: '/movements',       icon: ArrowLeftRightIcon,     label: 'Movements',       roles: ['ADMIN','MANAGER','WAREHOUSE_OPERATOR'] },
  { href: '/alerts',          icon: Notification03Icon,     label: 'Alerts',          roles: ['ADMIN','MANAGER','WAREHOUSE_OPERATOR','QC_INSPECTOR'] },
];

const adminItems = [
  { href: '/users', icon: UserMultipleIcon, label: 'Users' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '??';

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 flex flex-col z-40 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="w-9 h-9 rounded-xl bg-brand-yellow flex items-center justify-center shrink-0">
          <FlashIcon size={18} primaryColor="#090909" />
        </div>
        <div>
          <p className="text-brand-black font-bold text-base leading-tight">Abibas</p>
          <p className="text-brand-muted text-[11px] font-medium tracking-wide">WMS</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-3">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-brand-muted/50">
          Main Menu
        </p>
        {navItems.filter(item => user?.role && item.roles.includes(user.role)).map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
              isActive(href)
                ? 'bg-brand-yellow/15 text-brand-black'
                : 'text-brand-muted hover:bg-brand-bg hover:text-brand-black'
            }`}
          >
            <Icon size={20} primaryColor={isActive(href) ? '#090909' : '#788596'} />
            <span className="text-sm font-medium truncate">{label}</span>
            {isActive(href) && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-yellow" />
            )}
          </Link>
        ))}

        {user?.role === 'ADMIN' && (
          <>
            <p className="px-3 pt-4 pb-2 text-[10px] font-semibold uppercase tracking-widest text-brand-muted/50">
              Admin
            </p>
            {adminItems.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                  isActive(href)
                    ? 'bg-brand-yellow/15 text-brand-black'
                    : 'text-brand-muted hover:bg-brand-bg hover:text-brand-black'
                }`}
              >
                <Icon size={20} primaryColor={isActive(href) ? '#090909' : '#788596'} />
                <span className="text-sm font-medium">{label}</span>
                {isActive(href) && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-yellow" />}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User */}
      <div className="border-t border-gray-100 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-brand-bg">
            <div className="w-9 h-9 rounded-full bg-brand-yellow flex items-center justify-center shrink-0">
              <span className="text-brand-black font-bold text-xs">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-brand-black text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-brand-muted text-[11px] truncate">{user?.role?.replace(/_/g, ' ')}</p>
            </div>
            <span className="shrink-0 opacity-60 transition-transform group-data-[state=open]:rotate-180">
              <ArrowUp01Icon size={16} primaryColor="#788596" />
            </span>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top" align="start">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} destructive>
              <Logout01Icon size={16} primaryColor="#dc2626" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
