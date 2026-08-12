'use client';

import { useState } from 'react';
import { Transaction } from '@/types';
import { PAYMENT_METHODS } from '@/lib/constants';
import { formatINR, formatDateIN } from '@/lib/formatters';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Calendar,
  Receipt,
  FileSpreadsheet,
  CreditCard,
  ChevronDown
} from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: number) => void;
  categories: string[];
  limit?: number;
  showFilters?: boolean;
}

export default function TransactionTable({
  transactions,
  onEdit,
  onDelete,
  categories,
  limit,
  showFilters = true,
}: TransactionTableProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('All');

  // Filter transactions in memory
  const filtered = transactions.filter((tx) => {
    const matchesSearch = 
      tx.description.toLowerCase().includes(search.toLowerCase()) ||
      tx.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || tx.category === selectedCategory;
    const matchesType = selectedType === 'All' || tx.type === selectedType;
    const matchesPayment = selectedPaymentMethod === 'All' || (tx.payment_method || 'UPI') === selectedPaymentMethod;
    return matchesSearch && matchesCategory && matchesType && matchesPayment;
  });

  const displayed = limit ? filtered.slice(0, limit) : filtered;

  return (
    <div className="ui-card flex flex-col justify-between h-full">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="ui-card-title flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#6F8F7A]" />
            Recent Transactions
          </h3>
          <p className="text-xs text-[#8A857F] font-medium mt-0.5">
            Showing {displayed.length} of {transactions.length} recorded entries
          </p>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="input-group shrink-0 w-auto sm:w-48">
              <div className="input-icon">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ui-input input-with-icon text-xs"
              />
            </div>

            {/* Category Filter */}
            <div className="input-group shrink-0 w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="ui-select text-xs pr-8 cursor-pointer text-[#5F5B56]"
              >
                <option value="All">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="select-arrow w-3.5 h-3.5" />
            </div>

            {/* Type Filter */}
            <div className="input-group shrink-0 w-auto">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="ui-select text-xs pr-8 cursor-pointer text-[#5F5B56]"
              >
                <option value="All">All Types</option>
                <option value="expense">Expenses Only</option>
                <option value="income">Income Only</option>
              </select>
              <ChevronDown className="select-arrow w-3.5 h-3.5" />
            </div>

            {/* Payment Method Filter */}
            <div className="input-group shrink-0 w-auto">
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="ui-select text-xs pr-8 cursor-pointer text-[#5F5B56]"
              >
                <option value="All">All Methods</option>
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
              <ChevronDown className="select-arrow w-3.5 h-3.5" />
            </div>
          </div>
        )}
      </div>

      {/* Table Content */}
      {displayed.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-[#E8E4DF] rounded-[12px] bg-[#F7F5F2]/50">
          <FileSpreadsheet className="w-8 h-8 text-[#8A857F] mx-auto mb-2" />
          <p className="text-sm font-semibold text-[#5F5B56]">No transactions found</p>
          <p className="text-xs text-[#8A857F] mt-1 font-medium">Try adjusting your filters or click 'Add Transaction'.</p>
        </div>
      ) : (
        <>
          {/* Desktop View Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E8E4DF] text-[11px] font-bold text-[#8A857F] uppercase tracking-wider">
                  <th className="py-3 px-4">Transaction</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DF] text-xs">
                {displayed.map((tx) => {
                  const isExpense = tx.type === 'expense';
                  return (
                    <tr key={tx.id} className="hover:bg-[#F7F5F2] transition group">
                      {/* Description & Icon */}
                      <td className="py-3.5 px-4 font-medium text-[#242321]">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 border ${
                              isExpense
                                ? 'bg-[#FDF0EE] text-[#B56F67] border-[#B56F67]/20'
                                : 'bg-[#E8F0EA] text-[#4F6F5B] border-[#6F8F7A]/20'
                            }`}
                          >
                            {isExpense ? (
                              <ArrowDownRight className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <span className="font-semibold">{tx.description}</span>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-[8px] text-[11px] font-medium bg-[#F7F5F2] text-[#5F5B56] border border-[#E8E4DF]">
                          {tx.category}
                        </span>
                      </td>

                      {/* Payment Method Badge */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-[#E8F0EA] text-[#4F6F5B]">
                          {tx.payment_method || 'UPI'}
                        </span>
                      </td>

                      {/* Date (DD/MM/YYYY) */}
                      <td className="py-3.5 px-4 text-[#8A857F] flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-[#8A857F]" />
                        {formatDateIN(tx.date)}
                      </td>

                      {/* Amount (₹) */}
                      <td
                        className={`py-3.5 px-4 text-right font-bold text-sm ${
                          isExpense ? 'text-[#B56F67]' : 'text-[#4F6F5B]'
                        }`}
                      >
                        {isExpense ? '-' : '+'}{formatINR(tx.amount)}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => onEdit(tx)}
                            className="p-1.5 rounded-[6px] text-[#8A857F] hover:text-[#4F6F5B] hover:bg-[#E8F0EA] transition"
                            title="Edit transaction"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(tx.id)}
                            className="p-1.5 rounded-[6px] text-[#8A857F] hover:text-[#B56F67] hover:bg-[#FDF0EE] transition"
                            title="Delete transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile View Stacked Cards */}
          <div className="sm:hidden space-y-3">
            {displayed.map((tx) => {
              const isExpense = tx.type === 'expense';
              return (
                <div key={tx.id} className="p-3.5 rounded-[12px] border border-[#E8E4DF] bg-[#F7F5F2]/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-[8px] flex items-center justify-center border ${
                          isExpense
                            ? 'bg-[#FDF0EE] text-[#B56F67] border-[#B56F67]/20'
                            : 'bg-[#E8F0EA] text-[#4F6F5B] border-[#6F8F7A]/20'
                        }`}
                      >
                        {isExpense ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      </div>
                      <span className="font-bold text-xs text-[#242321]">{tx.description}</span>
                    </div>
                    <span className={`font-bold text-sm ${isExpense ? 'text-[#B56F67]' : 'text-[#4F6F5B]'}`}>
                      {isExpense ? '-' : '+'}{formatINR(tx.amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#8A857F]">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-white border border-[#E8E4DF] font-medium text-[#5F5B56]">
                        {tx.category}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-[#E8F0EA] text-[#4F6F5B] font-bold">
                        {tx.payment_method || 'UPI'}
                      </span>
                    </div>
                    <span>{formatDateIN(tx.date)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
