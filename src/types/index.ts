export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 'UPI' | 'Cash' | 'Debit Card' | 'Credit Card' | 'Bank Transfer' | 'Other';

export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Transaction {
  id: number;
  amount: number;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  payment_method: PaymentMethod;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  created_at: string;
}

export interface Budget {
  id: number;
  category: string;
  amount: number;
  month: string; // YYYY-MM
  created_at: string;
}

export interface CategorySpending {
  category: string;
  total: number;
  percentage: number;
  count: number;
}

export interface MonthlySpending {
  month: string; // YYYY-MM or Date string
  income: number;
  expense: number;
  net: number;
}

export interface BudgetProgress {
  category: string;
  budgetAmount: number;
  spentAmount: number;
  percentage: number;
  remaining: number;
  isOverBudget: boolean;
}

export interface AnalyticsSummary {
  period: TimePeriod;
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
  monthlySpending: number;
  remainingBudget: number;
  savingsRate: number;
  averageSpending: number;
  largestTransaction: Transaction | null;
  highestCategory: { category: string; amount: number } | null;
  budgetUsagePercentage: number;
  overBudgetCategoriesCount: number;
  overBudgetCategories: BudgetProgress[];
  categoryBreakdown: CategorySpending[];
  monthlyBreakdown: MonthlySpending[];
  budgetProgressList: BudgetProgress[];
}

export interface AICardInsights {
  spendingSummary: string;
  topCategories: Array<{ category: string; amount: number; percentage: number }>;
  spendingTrends: string;
  unusualSpending: string;
  budgetHealth: string;
  recommendations: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIResponse {
  answer?: string;
  queryType?: string;
  cards?: AICardInsights;
  dataPoints?: Record<string, any>;
  suggestions?: string[];
}
