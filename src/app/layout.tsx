import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'SpendSense — AI Powered Expense Tracker',
  description: 'Track spending, set category budgets, visualize analytics, and ask your AI financial analyst based on real SQLite database queries.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 min-h-screen antialiased flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
