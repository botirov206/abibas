'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

type DropdownMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenu() {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('Dropdown menu components must be used within DropdownMenu');
  }
  return context;
}

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={containerRef} className="relative">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = useDropdownMenu();

  return (
    <button
      type="button"
      data-state={open ? 'open' : 'closed'}
      aria-expanded={open}
      aria-haspopup="menu"
      onClick={() => setOpen(!open)}
      className={cn('w-full text-left', className)}
      {...props}
    >
      {children}
    </button>
  );
}

type DropdownMenuContentProps = HTMLAttributes<HTMLDivElement> & {
  align?: 'start' | 'end';
  side?: 'top' | 'bottom';
};

export function DropdownMenuContent({
  className,
  align = 'start',
  side = 'top',
  children,
  ...props
}: DropdownMenuContentProps) {
  const { open } = useDropdownMenu();

  if (!open) return null;

  return (
    <div
      role="menu"
      className={cn(
        'absolute z-50 min-w-[calc(100%-0.5rem)] rounded-xl border border-gray-100 bg-white p-1 shadow-[0_8px_30px_rgb(0,0,0,0.08)]',
        side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
        align === 'end' ? 'right-0' : 'left-0',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-2 py-1.5 text-xs font-semibold text-brand-muted', className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('my-1 h-px bg-gray-100', className)} {...props} />;
}

type DropdownMenuItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  destructive?: boolean;
};

export function DropdownMenuItem({
  className,
  destructive = false,
  onClick,
  ...props
}: DropdownMenuItemProps) {
  const { setOpen } = useDropdownMenu();

  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition-colors',
        destructive
          ? 'text-red-600 hover:bg-red-50'
          : 'text-brand-black hover:bg-brand-bg',
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        setOpen(false);
      }}
      {...props}
    />
  );
}
