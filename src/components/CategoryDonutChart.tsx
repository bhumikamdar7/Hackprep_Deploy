'use client';

import { CategorySpending } from '@/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { formatINR } from '@/lib/formatters';

interface CategoryDonutChartProps {
  data: CategorySpending[];
}

const COLORS = [
  '#6F8F7A', // Primary Sage
  '#B78478', // Dusty Rose
  '#C49A5A', // Warm Gold
  '#4F6F5B', // Dark Sage
  '#8A857F', // Muted Taupe
  '#B56F67', // Danger Rose
  '#7A9A95', // Muted Teal
  '#A08478', // Terracotta
  '#6B7A8F', // Slate Blue
  '#8A9F6F', // Moss
];

export default function CategoryDonutChart({ data }: CategoryDonutChartProps) {
  const totalExpense = data.reduce((sum, item) => sum + item.total, 0);

  if (!data || data.length === 0 || totalExpense === 0) {
    return (
      <div className="ui-card flex flex-col items-center justify-center min-h-[340px] text-center">
        <div className="w-12 h-12 rounded-full bg-[#F7F5F2] border border-[#E8E4DF] flex items-center justify-center mb-3">
          <PieIcon className="w-6 h-6 text-[#8A857F]" />
        </div>
        <h3 className="ui-card-title">Where Your Money Goes</h3>
        <p className="text-xs text-[#8A857F] max-w-[240px] mt-1 font-medium">
          No expenses recorded for this period. Add a transaction to view category breakdowns.
        </p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as CategorySpending;
      return (
        <div className="bg-white border border-[#E8E4DF] p-3 rounded-[12px] shadow-subtle text-xs space-y-1">
          <div className="font-bold text-[#242321] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: payload[0].color }}></span>
            {item.category}
          </div>
          <div className="text-[#5F5B56]">
            Amount: <span className="font-bold text-[#242321]">{formatINR(item.total, true)}</span>
          </div>
          <div className="text-[#8A857F]">
            Share: <span className="font-bold text-[#4F6F5B]">{item.percentage}%</span> ({item.count} txns)
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
            <PieIcon className="w-4 h-4 text-[#6F8F7A]" />
            Where Your Money Goes
          </h3>
          <p className="text-xs text-[#8A857F] font-medium mt-0.5">Category aggregate breakdown in Indian Rupees (₹)</p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-[8px] bg-[#E8F0EA] text-[#4F6F5B]">
          {formatINR(totalExpense)} Total
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Donut Chart */}
        <div className="md:col-span-7 h-[240px] relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={4}
                dataKey="total"
                nameKey="category"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[11px] text-[#8A857F] font-medium">Categories</span>
            <span className="text-lg font-bold text-[#242321]">{data.length}</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="md:col-span-5 space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {data.map((item, index) => (
            <div 
              key={item.category} 
              className="flex items-center justify-between p-2 rounded-[10px] bg-[#F7F5F2] border border-[#E8E4DF] text-xs hover:bg-[#E8F0EA]/50 transition"
            >
              <div className="flex items-center gap-2 truncate">
                <span 
                  className="w-3 h-3 rounded-full shrink-0" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></span>
                <span className="font-medium text-[#242321] truncate">{item.category}</span>
              </div>
              <div className="text-right shrink-0">
                <span className="font-bold text-[#242321]">{formatINR(item.total)}</span>
                <span className="text-[10px] text-[#8A857F] block font-medium">{item.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
