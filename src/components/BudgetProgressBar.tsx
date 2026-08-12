'use client';

import { BudgetProgress } from '@/types';
import { AlertTriangle, Target } from 'lucide-react';
import { formatINR } from '@/lib/formatters';

interface BudgetProgressBarProps {
  budgets: BudgetProgress[];
  limit?: number;
}

export default function BudgetProgressBar({ budgets, limit = 5 }: BudgetProgressBarProps) {
  const displayed = budgets.slice(0, limit);

  if (!budgets || budgets.length === 0) {
    return (
      <div className="ui-card text-center flex flex-col items-center justify-center p-8">
        <Target className="w-6 h-6 text-[#8A857F] mx-auto mb-2" />
        <h3 className="ui-card-title">Budget Progress & Caps</h3>
        <p className="text-xs text-[#8A857F] mt-1 font-medium">No monthly budgets configured yet.</p>
      </div>
    );
  }

  return (
    <div className="ui-card flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="ui-card-title flex items-center gap-2">
            <Target className="w-4 h-4 text-[#6F8F7A]" />
            Budget Progress & Caps
          </h3>
          <p className="text-xs text-[#8A857F] font-medium mt-0.5">Category caps vs. actual spending (₹)</p>
        </div>
        <span className="text-xs font-semibold text-[#5F5B56] px-2.5 py-1 rounded-[8px] bg-[#F7F5F2] border border-[#E8E4DF]">Current Month</span>
      </div>

      <div className="space-y-4">
        {displayed.map((b) => {
          const isOver = b.isOverBudget;
          const barColor = isOver 
            ? 'bg-[#B56F67]' 
            : b.percentage > 85 
            ? 'bg-[#C49A5A]' 
            : 'bg-[#6F8F7A]';

          return (
            <div key={b.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#242321]">{b.category}</span>
                  {isOver ? (
                    <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-[#FDF0EE] text-[#B56F67] border border-[#B56F67]/20 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Over Budget
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-medium bg-[#E8F0EA] text-[#4F6F5B]">
                      {formatINR(b.remaining)} left
                    </span>
                  )}
                </div>
                <div className="font-semibold text-[#242321]">
                  {formatINR(b.spentAmount)} / <span className="text-[#8A857F]">{formatINR(b.budgetAmount)}</span>
                </div>
              </div>

              {/* Progress track */}
              <div className="w-full h-2.5 rounded-full bg-[#F7F5F2] overflow-hidden relative border border-[#E8E4DF]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${Math.min(100, b.percentage)}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
