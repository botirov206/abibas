import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Abibas WMS',
  description: 'Electronics & Hardware Warehouse Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-brand-bg text-brand-black">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
