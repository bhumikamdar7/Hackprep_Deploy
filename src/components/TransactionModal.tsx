'use client';

import { useState, useEffect } from 'react';
import { Transaction, TransactionType, PaymentMethod } from '@/types';
import { DEFAULT_CATEGORIES, PAYMENT_METHODS } from '@/lib/constants';
import { X, Calendar, Tag, FileText, ArrowDownRight, ArrowUpRight, AlertCircle, CreditCard, ChevronDown } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialTransaction?: Transaction | null;
}

export default function TransactionModal({
  isOpen,
  onClose,
  onSuccess,
  initialTransaction,
}: TransactionModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<TransactionType>('expense');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories && data.categories.length > 0) {
          const names = data.categories.map((c: any) => c.name);
          setCategories(names);
        }
      })
      .catch(() => {});

    if (initialTransaction) {
      setAmount(initialTransaction.amount.toString());
      setCategory(initialTransaction.category);
      setDescription(initialTransaction.description);
      setDate(initialTransaction.date);
      setType(initialTransaction.type);
      setPaymentMethod(initialTransaction.payment_method || 'UPI');
    } else {
      setAmount('');
      setCategory(DEFAULT_CATEGORIES[0]);
      setDescription('');
      setDate(new Date().toISOString().slice(0, 10));
      setType('expense');
      setPaymentMethod('UPI');
    }
    setError(null);
  }, [initialTransaction, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount in ₹ greater than 0');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    if (!date) {
      setError('Date is required');
      return;
    }

    try {
      setLoading(true);
      const endpoint = initialTransaction ? `/api/transactions/${initialTransaction.id}` : '/api/transactions';
      const method = initialTransaction ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount,
          category,
          description: description.trim(),
          date,
          type,
          payment_method: paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save transaction');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-[16px] border border-[#E8E4DF] p-6 shadow-xl relative my-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8E4DF] pb-4 mb-5">
          <h3 className="ui-card-title flex items-center gap-2">
            {initialTransaction ? 'Edit Transaction' : 'New Transaction'}
          </h3>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-[8px] text-[#8A857F] hover:text-[#242321] hover:bg-[#F7F5F2] transition shrink-0"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-[10px] bg-[#FDF0EE] border border-[#B56F67]/30 text-[#B56F67] text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Income / Expense Toggle */}
          <div>
            <label className="block text-xs font-semibold text-[#5F5B56] mb-1.5 uppercase tracking-wider">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`h-[42px] rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-2 border cursor-pointer ${
                  type === 'expense'
                    ? 'bg-[#FDF0EE] text-[#B56F67] border-[#B56F67]/40'
                    : 'bg-[#F7F5F2] text-[#5F5B56] border-[#E8E4DF] hover:bg-[#E8E4DF]/50'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-[#B56F67]" />
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`h-[42px] rounded-[10px] text-xs font-bold transition flex items-center justify-center gap-2 border cursor-pointer ${
                  type === 'income'
                    ? 'bg-[#E8F0EA] text-[#4F6F5B] border-[#6F8F7A]/40'
                    : 'bg-[#F7F5F2] text-[#5F5B56] border-[#E8E4DF] hover:bg-[#E8E4DF]/50'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-[#4F6F5B]" />
                Income
              </button>
            </div>
          </div>

          {/* Amount (₹) */}
          <div>
            <label className="block text-xs font-semibold text-[#5F5B56] mb-1.5 uppercase tracking-wider">
              Amount (₹ INR)
            </label>
            <div className="input-group">
              <span className="input-icon font-bold text-sm text-[#8A857F]">₹</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="ui-input input-with-icon font-semibold"
                required
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-[#5F5B56] mb-1.5 uppercase tracking-wider">
              Payment Method
            </label>
            <div className="input-group">
              <div className="input-icon">
                <CreditCard className="w-4 h-4" />
              </div>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="ui-select select-with-icon font-medium"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
              <ChevronDown className="select-arrow" />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-[#5F5B56] mb-1.5 uppercase tracking-wider">
              Category
            </label>
            <div className="input-group">
              <div className="input-icon">
                <Tag className="w-4 h-4" />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="ui-select select-with-icon font-medium"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="select-arrow" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#5F5B56] mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <div className="input-group">
              <div className="input-icon">
                <FileText className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="e.g. Swiggy Lunch, House Rent, Salary via NEFT"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="ui-input input-with-icon font-medium"
                required
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-[#5F5B56] mb-1.5 uppercase tracking-wider">
              Date
            </label>
            <div className="input-group">
              <div className="input-icon">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="ui-input input-with-icon font-medium"
                required
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8E4DF] mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Saving...' : initialTransaction ? 'Update Transaction' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
