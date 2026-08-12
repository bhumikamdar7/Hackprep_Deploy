'use client';

import { useState } from 'react';
import { TimePeriod } from '@/types';
import { Plus, Calendar, Database, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  onAddTransaction: () => void;
  period?: TimePeriod;
  onPeriodChange?: (p: TimePeriod) => void;
  onRefreshData?: () => void;
}

export default function Header({ onAddTransaction, period = 'monthly', onPeriodChange, onRefreshData }: HeaderProps) {
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);

  const handleSeedDemoData = async () => {
    try {
      setSeeding(true);
      setSeedMsg(null);
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSeedMsg('50+ demo records seeded!');
        if (onRefreshData) onRefreshData();
        setTimeout(() => setSeedMsg(null), 3000);
      } else {
        alert(data.error || 'Failed to seed');
      }
    } catch (err) {
      alert('Network error during seeding');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-[#F7F5F2]/90 backdrop-blur border-b border-[#E8E4DF] px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="ui-page-title">Your financial overview</h1>
        <p className="text-xs text-[#5F5B56] mt-0.5 font-medium">Track spending, budget limits, and AI insights in INR (₹)</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        {seedMsg && (
          <div className="text-xs font-semibold text-[#4F6F5B] bg-[#E8F0EA] border border-[#6F8F7A]/30 px-3 py-2 rounded-[10px] flex items-center gap-1.5 animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {seedMsg}
          </div>
        )}

        {/* Seed Demo Data Button */}
        <button
          onClick={handleSeedDemoData}
          disabled={seeding}
          className="btn-secondary disabled:opacity-50"
          title="Seed 50+ realistic Indian transactions in INR"
        >
          <Database className={`w-3.5 h-3.5 text-[#6F8F7A] ${seeding ? 'animate-spin' : ''}`} />
          {seeding ? 'Seeding...' : 'Seed Demo Data'}
        </button>

        {/* Time-Period Filter Dropdown */}
        {onPeriodChange && (
          <div className="relative shrink-0">
            <select
              value={period}
              onChange={(e) => onPeriodChange(e.target.value as TimePeriod)}
              className="ui-select pr-8 cursor-pointer font-semibold text-xs text-[#242321]"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-[#8A857F] absolute right-3 top-3.5 pointer-events-none" />
          </div>
        )}

        {/* Add Transaction CTA Button */}
        <button
          onClick={onAddTransaction}
          className="btn-primary w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Add Transaction
        </button>
      </div>
    </header>
  );
}
