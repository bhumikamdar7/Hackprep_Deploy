'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Target, 
  PieChart, 
  Bot, 
  Settings,
  Wallet,
  Menu,
  X
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: Receipt },
  { href: '/budgets', label: 'Budgets', icon: Target },
  { href: '/ai-analyst', label: 'AI Analyst', icon: Bot, badge: 'AI' },
  { href: '/analytics', label: 'Analytics', icon: PieChart },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-[#E8E4DF] px-4 py-3 flex items-center justify-between shadow-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#6F8F7A] text-white flex items-center justify-center font-bold">
            <Wallet className="w-4 h-4" />
          </div>
          <span className="font-bold text-base text-[#242321]">SpendSense</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-[#5F5B56] hover:bg-[#F7F5F2] transition"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/30 backdrop-blur-xs top-[57px]" onClick={() => setMobileOpen(false)}>
          <div className="bg-white w-64 h-full border-r border-[#E8E4DF] p-4 space-y-1 shadow-xl" onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-[#E8F0EA] text-[#4F6F5B] font-semibold'
                      : 'text-[#5F5B56] hover:bg-[#F7F5F2] hover:text-[#242321]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#4F6F5B]' : 'text-[#8A857F]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-[#6F8F7A]/15 text-[#4F6F5B]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Desktop Sticky Left Sidebar (240px) */}
      <aside className="w-[240px] bg-white border-r border-[#E8E4DF] flex flex-col justify-between hidden md:flex shrink-0 min-h-screen sticky top-0 h-screen">
        <div>
          {/* Logo & Header */}
          <div className="p-6 border-b border-[#E8E4DF] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#6F8F7A] text-white flex items-center justify-center shadow-subtle">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base text-[#242321] tracking-tight flex items-center gap-1">
                SpendSense
              </h1>
              <p className="text-[11px] text-[#8A857F] font-medium">India Finance Tracker</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-[#E8F0EA] text-[#4F6F5B] font-bold'
                      : 'text-[#5F5B56] hover:bg-[#F7F5F2] hover:text-[#242321]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#4F6F5B]' : 'text-[#8A857F]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-[#6F8F7A]/15 text-[#4F6F5B]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
