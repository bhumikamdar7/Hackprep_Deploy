'use client';

import { LucideIcon } from 'lucide-react';
import { formatINR } from '@/lib/formatters';

interface StatCardProps {
  title: string;
  value: number;
  isPercentage?: boolean;
  type?: 'expense' | 'income' | 'neutral' | 'balance';
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
}

export default function StatCard({
  title,
  value,
  isPercentage = false,
  type = 'neutral',
  subtitle,
  icon: Icon,
  badge,
}: StatCardProps) {
  const formattedValue = isPercentage
    ? `${value}%`
    : formatINR(value);

  const getAccent = () => {
    switch (type) {
      case 'income':
        return 'text-[#4F6F5B] bg-[#E8F0EA] border border-[#6F8F7A]/20';
      case 'expense':
        return 'text-[#B56F67] bg-[#FDF0EE] border border-[#B56F67]/20';
      case 'balance':
        return 'text-[#6F8F7A] bg-[#E8F0EA] border border-[#6F8F7A]/20';
      default:
        return 'text-[#5F5B56] bg-[#F7F5F2] border border-[#E8E4DF]';
    }
  };

  const accentClass = getAccent();

  return (
    <div className="ui-card ui-card-hover flex flex-col justify-between h-full">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#5F5B56] uppercase tracking-wider">{title}</span>
        <div className={`p-2.5 rounded-[12px] ${accentClass}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[28px] sm:text-[32px] font-bold text-[#242321] tracking-tight leading-none">
          {formattedValue}
        </div>
        {subtitle && <p className="text-xs text-[#8A857F] mt-2 font-medium">{subtitle}</p>}
      </div>

      {badge && (
        <span className="mt-3 inline-block self-start px-2 py-0.5 text-[10px] font-bold uppercase rounded-[6px] bg-[#F7F5F2] text-[#5F5B56] border border-[#E8E4DF]">
          {badge}
        </span>
      )}
    </div>
  );
}
