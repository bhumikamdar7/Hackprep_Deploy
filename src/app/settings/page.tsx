'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import TransactionModal from '@/components/TransactionModal';
import { Settings as SettingsIcon, Tag, CreditCard, Shield, Globe, Plus } from 'lucide-react';
import { PAYMENT_METHODS } from '@/lib/constants';

export default function SettingsPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
        setMessage(`Category "${newCategoryName.trim()}" created!`);
        setNewCategoryName('');
        fetchCategories();
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
        fetchCategories();
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
      <Header onAddTransaction={() => setModalOpen(true)} />

      <main className="ui-page-container space-y-6">
        {message && (
          <div className="p-3.5 rounded-[10px] bg-[#E8F0EA] border border-[#6F8F7A]/30 text-[#4F6F5B] text-xs font-semibold">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Management Card */}
          <div className="ui-card space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[12px] bg-[#E8F0EA] text-[#4F6F5B] border border-[#6F8F7A]/20">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="ui-card-title">Expense Categories</h3>
                <p className="text-xs text-[#8A857F] font-medium mt-0.5">Manage your custom expense categories</p>
              </div>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#5F5B56] mb-1">New Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. 🍕 Snacks, 🚗 Fuel"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full ui-input"
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full">
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </form>

            <div className="pt-3 border-t border-[#E8E4DF]">
              <h4 className="text-xs font-bold text-[#5F5B56] mb-2">Active Categories ({categories.length})</h4>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
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

          {/* Localization & Preferences Card */}
          <div className="ui-card space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[12px] bg-[#E8F0EA] text-[#4F6F5B] border border-[#6F8F7A]/20">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="ui-card-title">Localization & Preferences</h3>
                <p className="text-xs text-[#8A857F] font-medium mt-0.5">App region and currency configurations</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-[10px] bg-[#F7F5F2] border border-[#E8E4DF] space-y-1">
                <span className="font-bold text-[#242321] block">Default Currency</span>
                <span className="text-[#5F5B56]">Indian Rupee (INR / ₹) — Locale `en-IN`</span>
              </div>

              <div className="p-3.5 rounded-[10px] bg-[#F7F5F2] border border-[#E8E4DF] space-y-1">
                <span className="font-bold text-[#242321] block">Date Format</span>
                <span className="text-[#5F5B56]">DD/MM/YYYY (Indian Standard)</span>
              </div>

              <div className="p-3.5 rounded-[10px] bg-[#F7F5F2] border border-[#E8E4DF] space-y-2">
                <span className="font-bold text-[#242321] block">Supported Payment Channels</span>
                <div className="flex flex-wrap gap-1">
                  {PAYMENT_METHODS.map((pm) => (
                    <span key={pm} className="px-2 py-0.5 rounded-[6px] bg-white text-[#4F6F5B] border border-[#E8E4DF] font-semibold text-[11px]">
                      {pm}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchCategories}
      />
    </div>
  );
}
