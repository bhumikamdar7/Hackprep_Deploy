'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import CategoryDonutChart from '@/components/CategoryDonutChart';
import MonthlyBarChart from '@/components/MonthlyBarChart';
import BudgetProgressBar from '@/components/BudgetProgressBar';
import TransactionTable from '@/components/TransactionTable';
import TransactionModal from '@/components/TransactionModal';
import { Transaction, AnalyticsSummary, TimePeriod } from '@/types';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  Sparkles,
  ArrowRight,
  Bot
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/login');
      } else {
        setAuthChecked(true);
      }
    });
  }, [router]);
  const [period, setPeriod] = useState<TimePeriod>('monthly');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch Period-Filtered Analytics
      const analyticsRes = await fetch(`/api/analytics?period=${period}`);
      const analyticsData = await analyticsRes.json();
      if (analyticsData.summary) {
        setSummary(analyticsData.summary);
      }

      // Fetch Recent Transactions
      const txRes = await fetch('/api/transactions?limit=10');
      const txData = await txRes.json();
      if (txData.transactions) {
        setTransactions(txData.transactions);
      }

      // Fetch Categories
      const catRes = await fetch('/api/categories');
      const catData = await catRes.json();
      if (catData.categories) {
        setCategories(catData.categories.map((c: any) => c.name));
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete transaction', err);
    }
  };

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-[#F7F5F2]" />
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F7F5F2]">
      <Header
        onAddTransaction={() => {
          setEditingTransaction(null);
          setModalOpen(true);
        }}
        period={period}
        onPeriodChange={setPeriod}
        onRefreshData={fetchData}
      />

      <main className="ui-page-container space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Spending"
            value={summary?.totalExpenses || 0}
            type="expense"
            subtitle={`Expenses in ${period}`}
            icon={TrendingDown}
          />
          <StatCard
            title="Income"
            value={summary?.totalIncome || 0}
            type="income"
            subtitle={`Earnings in ${period}`}
            icon={TrendingUp}
          />
          <StatCard
            title="Remaining Budget"
            value={summary?.remainingBudget || 0}
            type="balance"
            subtitle="Available category caps"
            icon={Target}
          />
          <StatCard
            title="Savings Rate"
            value={summary?.savingsRate || 0}
            isPercentage={true}
            type="neutral"
            subtitle="Net saved ratio"
            icon={Wallet}
          />
        </div>

        {/* Dynamic Charts Two-Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Spending Overview Bar / Trend Chart */}
          <div className="lg:col-span-6">
            <MonthlyBarChart data={summary?.monthlyBreakdown || []} />
          </div>

          {/* Where Your Money Goes Donut Chart */}
          <div className="lg:col-span-6">
            <CategoryDonutChart data={summary?.categoryBreakdown || []} />
          </div>
        </div>

        {/* AI Analyst Teaser Banner */}
        <div className="ui-card flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#E8F0EA] text-[#4F6F5B] flex items-center justify-center shrink-0 border border-[#6F8F7A]/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h4 className="ui-card-title flex items-center gap-2">
                SpendSense AI Assistant <Sparkles className="w-4 h-4 text-[#6F8F7A]" />
              </h4>
              <p className="text-xs text-[#5F5B56] font-medium mt-0.5">
                Understand your spending patterns and get practical ways to save in Indian Rupees (₹).
              </p>
            </div>
          </div>
          <Link
            href="/ai-analyst"
            className="btn-primary shrink-0 text-xs"
          >
            Launch AI Analyst <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Budget Progress & Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <BudgetProgressBar budgets={summary?.budgetProgressList || []} limit={5} />
          </div>
          <div className="lg:col-span-7">
            <TransactionTable
              transactions={transactions}
              onEdit={handleEdit}
              onDelete={handleDelete}
              categories={categories}
              limit={5}
              showFilters={false}
            />
          </div>
        </div>
      </main>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
        initialTransaction={editingTransaction}
      />
    </div>
  );
}
