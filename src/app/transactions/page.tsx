'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import TransactionTable from '@/components/TransactionTable';
import TransactionModal from '@/components/TransactionModal';
import { Transaction } from '@/types';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [txRes, catRes] = await Promise.all([
        fetch('/api/transactions?limit=1000'),
        fetch('/api/categories'),
      ]);

      const txData = await txRes.json();
      const catData = await catRes.json();

      if (txData.transactions) setTransactions(txData.transactions);
      if (catData.categories) setCategories(catData.categories.map((c: any) => c.name));
    } catch (err) {
      console.error('Failed to load transactions', err);
    } finally {
      setLoading(false);
    }
  }, []);

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
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Failed to delete transaction', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F7F5F2]">
      <Header
        onAddTransaction={() => {
          setEditingTransaction(null);
          setModalOpen(true);
        }}
        onRefreshData={fetchData}
      />

      <main className="ui-page-container">
        <TransactionTable
          transactions={transactions}
          onEdit={handleEdit}
          onDelete={handleDelete}
          categories={categories}
          showFilters={true}
        />
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
