'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import TransactionModal from '@/components/TransactionModal';
import { Target, Tag, AlertTriangle, CheckCircle, Plus } from 'lucide-react';
import { formatINR } from '@/lib/formatters';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [selectedCategory, setSelectedCategory] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [bRes, cRes] = await Promise.all([
        fetch('/api/budgets'),
        fetch('/api/categories'),
      ]);

      const bData = await bRes.json();
      const cData = await cRes.json();

      if (bData.budgets) setBudgets(bData.budgets);
      if (cData.categories) {
        setCategories(cData.categories);
        if (cData.categories.length > 0 && !selectedCategory) {
          setSelectedCategory(cData.categories[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to load budgets & categories', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(budgetAmount);
    if (isNaN(amt) || amt < 0 || !selectedCategory) return;

    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: selectedCategory, amount: amt }),
      });

      if (res.ok) {
        setMessage(`Budget limit for ${selectedCategory} set to ${formatINR(amt)}`);
        setBudgetAmount('');
        fetchData();
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to set budget', err);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      if (res.ok) {
        setMessage(`New category "${newCategoryName.trim()}" created!`);
        setNewCategoryName('');
        fetchData();
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add category');
      }
    } catch (err) {
      console.error('Failed to add category', err);
    }
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;

    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Cannot delete category in use');
      }
    } catch (err) {
      console.error('Failed to delete category', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F7F5F2]">
      <Header
        onAddTransaction={() => setModalOpen(true)}
      />

      <main className="ui-page-container space-y-6">
        {message && (
          <div className="p-3.5 rounded-[10px] bg-[#E8F0EA] border border-[#6F8F7A]/30 text-[#4F6F5B] text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Set Budget Form Card */}
          <div className="lg:col-span-6 ui-card space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[12px] bg-[#E8F0EA] text-[#4F6F5B] border border-[#6F8F7A]/20">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="ui-card-title">Configure Category Budget</h3>
                <p className="text-xs text-[#8A857F] font-medium mt-0.5">Set monthly spending limits in ₹ (INR)</p>
              </div>
            </div>

            <form onSubmit={handleSetBudget} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#5F5B56] mb-1.5 uppercase tracking-wider">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full ui-select"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5F5B56] mb-1.5 uppercase tracking-wider">
                  Monthly Budget Limit (₹ INR)
                </label>
                <div className="relative">
                  <span className="w-4 h-4 text-[#8A857F] font-bold absolute left-3.5 top-2.5 text-sm">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 15000"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    className="w-full ui-input pl-10 font-semibold"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full">
                Save Budget Limit
              </button>
            </form>
          </div>

          {/* Add Category Form Card */}
          <div className="lg:col-span-6 ui-card space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[12px] bg-[#E8F0EA] text-[#4F6F5B] border border-[#6F8F7A]/20">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="ui-card-title">Custom Category Manager</h3>
                <p className="text-xs text-[#8A857F] font-medium mt-0.5">Add new Indian expense categories</p>
              </div>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#5F5B56] mb-1.5 uppercase tracking-wider">
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. 🍿 Cinema, ☕ Café"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full ui-input"
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full">
                <Plus className="w-4 h-4" /> Create Category
              </button>
            </form>

            <div className="pt-3 border-t border-[#E8E4DF]">
              <h4 className="text-xs font-bold text-[#5F5B56] mb-2">Active Categories ({categories.length})</h4>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {categories.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-xs font-medium bg-[#F7F5F2] text-[#242321] border border-[#E8E4DF]"
                  >
                    {c.name}
                    <button
                      onClick={() => handleDeleteCategory(c.id, c.name)}
                      className="text-[#8A857F] hover:text-[#B56F67] transition font-bold"
                      title="Delete category"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Existing Budgets Progress List */}
        <div className="ui-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="ui-card-title flex items-center gap-2">
                <Target className="w-4 h-4 text-[#6F8F7A]" />
                Active Monthly Category Budgets
              </h3>
              <p className="text-xs text-[#8A857F] font-medium mt-0.5">Real-time spending tracked against limits for this month (₹)</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-[8px] bg-[#E8F0EA] text-[#4F6F5B]">
              {budgets.length} Active Budgets
            </span>
          </div>

          {budgets.length === 0 ? (
            <div className="py-8 text-center border border-[#E8E4DF] rounded-[12px] bg-[#F7F5F2]">
              <p className="text-xs text-[#8A857F] font-medium">No category budget limits configured for this month.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {budgets.map((b) => {
                const isOver = b.spentAmount > b.budgetAmount;
                const percentage = b.budgetAmount > 0 ? Math.round((b.spentAmount / b.budgetAmount) * 100) : 0;
                const remaining = Math.max(0, b.budgetAmount - b.spentAmount);

                return (
                  <div key={b.id} className="p-4 rounded-[12px] bg-[#F7F5F2] border border-[#E8E4DF] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#242321]">{b.category}</span>
                      {isOver ? (
                        <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-[#FDF0EE] text-[#B56F67] border border-[#B56F67]/20 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Over Cap
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-medium bg-[#E8F0EA] text-[#4F6F5B]">
                          {formatINR(remaining)} left
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-[#5F5B56]">
                        <span>Spent: <strong className="text-[#242321]">{formatINR(b.spentAmount)}</strong></span>
                        <span>Limit: <strong className="text-[#242321]">{formatINR(b.amount)}</strong></span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white overflow-hidden border border-[#E8E4DF]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOver ? 'bg-[#B56F67]' : percentage > 85 ? 'bg-[#C49A5A]' : 'bg-[#6F8F7A]'
                          }`}
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
