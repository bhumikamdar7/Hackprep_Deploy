'use client';

import { MonthlySpending } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { formatINR } from '@/lib/formatters';

interface MonthlyBarChartProps {
  data: MonthlySpending[];
}

export default function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="ui-card flex flex-col items-center justify-center min-h-[300px] text-center">
        <BarChart3 className="w-8 h-8 text-[#8A857F] mb-2" />
        <h3 className="ui-card-title">Spending Overview</h3>
        <p className="text-xs text-[#8A857F] font-medium mt-0.5">Income vs. expense trend lines will populate as transactions are added.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-[#E8E4DF] p-3 rounded-[12px] shadow-subtle text-xs space-y-1">
          <div className="font-bold text-[#242321] mb-1">{label}</div>
          <div className="text-[#4F6F5B] font-semibold flex items-center justify-between gap-4">
            <span>Income:</span>
            <span>{formatINR(payload[0].value || 0, true)}</span>
          </div>
          <div className="text-[#B56F67] font-semibold flex items-center justify-between gap-4">
            <span>Expense:</span>
            <span>{formatINR(payload[1].value || 0, true)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="ui-card flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="ui-card-title flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#6F8F7A]" />
            Spending Overview
          </h3>
          <p className="text-xs text-[#8A857F] font-medium mt-0.5">Income vs. expense trend comparison (₹)</p>
        </div>
      </div>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DF" vertical={false} />
            <XAxis dataKey="month" stroke="#8A857F" fontSize={11} tickLine={false} />
            <YAxis stroke="#8A857F" fontSize={11} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />
            <Bar dataKey="income" name="Income" fill="#6F8F7A" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Expense" fill="#B78478" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
