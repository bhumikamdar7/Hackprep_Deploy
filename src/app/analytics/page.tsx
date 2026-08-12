'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import CategoryDonutChart from '@/components/CategoryDonutChart';
import MonthlyBarChart from '@/components/MonthlyBarChart';
import TransactionModal from '@/components/TransactionModal';
import { AnalyticsSummary, TimePeriod } from '@/types';
import { formatINR } from '@/lib/formatters';
import { 
  PieChart, 
  Award, 
  AlertTriangle
} from 'lucide-react';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<TimePeriod>('monthly');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/analytics?period=${period}`);
      const data = await res.json();
      if (data.summary) setSummary(data.summary);
    } catch (err) {
      console.error('Failed to load analytics data', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F7F5F2]">
      <Header
        onAddTransaction={() => setModalOpen(true)}
        period={period}
        onPeriodChange={setPeriod}
        onRefreshData={fetchData}
      />

      <main className="ui-page-container space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="ui-card space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-[#5F5B56] uppercase tracking-wider">
              <span>AVERAGE EXPENSE</span>
              <span className="text-[#6F8F7A] font-bold">₹</span>
            </div>
            <div className="text-[28px] font-bold text-[#242321] tracking-tight">
              {formatINR(summary?.averageSpending || 0)}
            </div>
            <p className="text-xs text-[#8A857F] font-medium">Average transaction size</p>
          </div>

          <div className="ui-card space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-[#5F5B56] uppercase tracking-wider">
              <span>LARGEST EXPENSE</span>
              <Award className="w-4 h-4 text-[#B56F67]" />
            </div>
            <div className="text-[28px] font-bold text-[#B56F67] tracking-tight">
              {formatINR(summary?.largestTransaction?.amount || 0)}
            </div>
            <p className="text-xs text-[#8A857F] font-medium truncate">
              {summary?.largestTransaction ? summary.largestTransaction.description : 'No expenses logged'}
            </p>
          </div>

          <div className="ui-card space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-[#5F5B56] uppercase tracking-wider">
              <span>HIGHEST CATEGORY</span>
              <PieChart className="w-4 h-4 text-[#6F8F7A]" />
            </div>
            <div className="text-[28px] font-bold text-[#242321] tracking-tight truncate">
              {summary?.highestCategory?.category || 'None'}
            </div>
            <p className="text-xs text-[#8A857F] font-medium">
              {formatINR(summary?.highestCategory?.amount || 0)} total spend
            </p>
          </div>

          <div className="ui-card space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-[#5F5B56] uppercase tracking-wider">
              <span>BUDGET OVERRUNS</span>
              <AlertTriangle className="w-4 h-4 text-[#C49A5A]" />
            </div>
            <div className="text-[28px] font-bold text-[#C49A5A] tracking-tight">
              {summary?.overBudgetCategoriesCount || 0} Categories
            </div>
            <p className="text-xs text-[#8A857F] font-medium">Exceeding monthly limit</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <CategoryDonutChart data={summary?.categoryBreakdown || []} />
          </div>
          <div className="lg:col-span-5">
            <MonthlyBarChart data={summary?.monthlyBreakdown || []} />
          </div>
        </div>

        {/* Over Budget Categories Breakdown Table */}
        <div className="ui-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="ui-card-title flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#B56F67]" /> Over-Budget Categories Audit
              </h3>
              <p className="text-xs text-[#8A857F] font-medium mt-0.5">Real-time database comparison of caps vs expenses (₹)</p>
            </div>
          </div>

          {(!summary?.overBudgetCategories || summary.overBudgetCategories.length === 0) ? (
            <div className="p-8 text-center border border-[#E8E4DF] rounded-[12px] bg-[#F7F5F2]">
              <p className="text-xs font-semibold text-[#4F6F5B]">🎉 No categories are currently over budget!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E8E4DF] text-[#8A857F] uppercase text-[10px] font-bold">
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Budget Cap</th>
                    <th className="py-3 px-4">Real Spend</th>
                    <th className="py-3 px-4 text-right">Over Limit By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E4DF]">
                  {summary.overBudgetCategories.map((ob) => (
                    <tr key={ob.category} className="hover:bg-[#F7F5F2]">
                      <td className="py-3 px-4 font-bold text-[#242321]">{ob.category}</td>
                      <td className="py-3 px-4 text-[#5F5B56]">{formatINR(ob.budgetAmount)}</td>
                      <td className="py-3 px-4 text-[#B56F67] font-bold">{formatINR(ob.spentAmount)}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-[#B56F67]">
                        +{formatINR(ob.spentAmount - ob.budgetAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
