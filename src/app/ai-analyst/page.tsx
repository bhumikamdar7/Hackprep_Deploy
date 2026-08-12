'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import AIAnalystChat from '@/components/AIAnalystChat';
import TransactionModal from '@/components/TransactionModal';
import { TimePeriod } from '@/types';

export default function AIAnalystPage() {
  const [period, setPeriod] = useState<TimePeriod>('monthly');
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F7F5F2]">
      <Header
        onAddTransaction={() => setModalOpen(true)}
        period={period}
        onPeriodChange={setPeriod}
        onRefreshData={() => {}}
      />

      <main className="ui-page-container">
        <AIAnalystChat 
          period={period} 
          onAddTransaction={() => setModalOpen(true)}
        />
      </main>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
