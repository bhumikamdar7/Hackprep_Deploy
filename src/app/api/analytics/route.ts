import { NextRequest, NextResponse } from 'next/server';
import { Transaction, TimePeriod } from '@/types';
import { createClient } from '@/lib/supabase-server';

function getDateRange(period: TimePeriod) {
  const now = new Date();

  // Use local calendar dates instead of UTC timestamps.
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const endDate = formatDate(today);

  switch (period) {
    case 'daily': {
      return {
        startDate: endDate,
        endDate,
      };
    }

    case 'weekly': {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);

      return {
        startDate: formatDate(start),
        endDate,
      };
    }

    case 'yearly': {
      const start = new Date(
        today.getFullYear(),
        0,
        1
      );

      return {
        startDate: formatDate(start),
        endDate,
      };
    }

    case 'monthly':
    default: {
      const start = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );

      return {
        startDate: formatDate(start),
        endDate,
      };
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const periodParam =
      (searchParams.get('period') || 'monthly') as TimePeriod;

    const { startDate, endDate } = getDateRange(periodParam);

    const currentMonth = startDate.slice(0, 7);

    // ============================================================
    // 1. FETCH USER TRANSACTIONS FROM SUPABASE
    // ============================================================

    const { data: transactions, error: transactionsError } =
      await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('id', { ascending: false });

    if (transactionsError) {
      throw new Error(
        `Failed to fetch transactions: ${transactionsError.message}`
      );
    }

    const allTransactions =
      (transactions || []) as Transaction[];

    // ============================================================
    // 2. FILTER TRANSACTIONS FOR SELECTED PERIOD
    // ============================================================

    const periodTransactions = allTransactions.filter((tx) => {
      return tx.date >= startDate && tx.date <= endDate;
    });

    // ============================================================
    // 3. INCOME + EXPENSE TOTALS
    // ============================================================

    const totalIncome = periodTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const totalExpenses = periodTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    // ============================================================
    // 4. CURRENT BALANCE
    // ============================================================

    const currentBalance = totalIncome - totalExpenses;

    // ============================================================
    // 5. CURRENT MONTH SPENDING
    // ============================================================

    const monthlySpending = allTransactions
      .filter(
        (tx) =>
          tx.type === 'expense' &&
          String(tx.date).slice(0, 7) === currentMonth
      )
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    // ============================================================
    // 6. SAVINGS RATE
    // ============================================================

    const savingsRate =
      totalIncome > 0
        ? Math.max(
          0,
          Math.round(
            ((totalIncome - totalExpenses) / totalIncome) * 100
          )
        )
        : 0;

    // ============================================================
    // 7. AVERAGE SPENDING
    // ============================================================

    const expenseTransactions = periodTransactions.filter(
      (tx) => tx.type === 'expense'
    );

    const averageSpending =
      expenseTransactions.length > 0
        ? Math.round(
          (expenseTransactions.reduce(
            (sum, tx) => sum + Number(tx.amount),
            0
          ) /
            expenseTransactions.length) *
          100
        ) / 100
        : 0;

    // ============================================================
    // 8. LARGEST TRANSACTION
    // ============================================================

    const largestTx =
      expenseTransactions.length > 0
        ? expenseTransactions.reduce((largest, tx) =>
          Number(tx.amount) > Number(largest.amount)
            ? tx
            : largest
        )
        : null;

    // ============================================================
    // 9. SPENDING BY CATEGORY
    // ============================================================

    const categoryMap = new Map<
      string,
      { total: number; count: number }
    >();

    for (const tx of expenseTransactions) {
      const existing = categoryMap.get(tx.category) || {
        total: 0,
        count: 0,
      };

      existing.total += Number(tx.amount);
      existing.count += 1;

      categoryMap.set(tx.category, existing);
    }

    const categoryBreakdown = Array.from(
      categoryMap.entries()
    )
      .map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count,
        percentage:
          totalExpenses > 0
            ? Math.round(
              (data.total / totalExpenses) * 1000
            ) / 10
            : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // ============================================================
    // 10. HIGHEST SPENDING CATEGORY
    // ============================================================

    const highestCategory =
      categoryBreakdown.length > 0
        ? {
          category: categoryBreakdown[0].category,
          amount: categoryBreakdown[0].total,
        }
        : null;

    // ============================================================
    // 11. MONTHLY TREND BREAKDOWN
    // ============================================================

    const monthlyMap = new Map<
      string,
      { income: number; expense: number }
    >();

    for (const tx of allTransactions) {
      const month = String(tx.date).slice(0, 7);

      const existing = monthlyMap.get(month) || {
        income: 0,
        expense: 0,
      };

      if (tx.type === 'income') {
        existing.income += Number(tx.amount);
      } else {
        existing.expense += Number(tx.amount);
      }

      monthlyMap.set(month, existing);
    }

    const monthlyBreakdown = Array.from(
      monthlyMap.entries()
    )
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, values]) => ({
        month,
        income: values.income,
        expense: values.expense,
        net: values.income - values.expense,
      }));

    // ============================================================
    // 12. FETCH CURRENT MONTH BUDGETS
    // ============================================================

    const { data: budgets, error: budgetsError } =
      await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth);

    if (budgetsError) {
      throw new Error(
        `Failed to fetch budgets: ${budgetsError.message}`
      );
    }

    // ============================================================
    // 13. BUDGET PROGRESS
    // ============================================================

    let totalBudgeted = 0;
    let totalSpentInBudgets = 0;

    const overBudgetCategories: any[] = [];

    const budgetProgressList = (budgets || [])
      .map((budget) => {
        const spentAmount = allTransactions
          .filter(
            (tx) =>
              tx.type === 'expense' &&
              tx.category === budget.category &&
              String(tx.date).slice(0, 7) === budget.month
          )
          .reduce(
            (sum, tx) => sum + Number(tx.amount),
            0
          );

        const budgetAmount = Number(budget.amount);

        totalBudgeted += budgetAmount;
        totalSpentInBudgets += spentAmount;

        const percentage =
          budgetAmount > 0
            ? Math.round(
              (spentAmount / budgetAmount) * 100
            )
            : 0;

        const isOver = spentAmount > budgetAmount;

        const item = {
          category: budget.category,
          budgetAmount,
          spentAmount,
          percentage,
          remaining: Math.max(
            0,
            budgetAmount - spentAmount
          ),
          isOverBudget: isOver,
        };

        if (isOver) {
          overBudgetCategories.push(item);
        }

        return item;
      })
      .sort(
        (a, b) => b.spentAmount - a.spentAmount
      );

    // ============================================================
    // 14. REMAINING BUDGET
    // ============================================================

    const remainingBudget = Math.max(
      0,
      totalIncome - totalExpenses
    );

    const budgetUsagePercentage =
      totalBudgeted > 0
        ? Math.round(
          (totalSpentInBudgets / totalBudgeted) * 100
        )
        : 0;

    // ============================================================
    // 15. RETURN ANALYTICS
    // ============================================================

    return NextResponse.json({
      summary: {
        period: periodParam,
        totalIncome,
        totalExpenses,
        currentBalance,
        monthlySpending,
        remainingBudget,
        savingsRate,
        averageSpending,
        largestTransaction: largestTx,
        highestCategory,
        budgetUsagePercentage,
        overBudgetCategoriesCount:
          overBudgetCategories.length,
        overBudgetCategories,
        categoryBreakdown,
        monthlyBreakdown,
        budgetProgressList,
      },
    });
  } catch (error: any) {
    console.error('Analytics error:', error);

    return NextResponse.json(
      {
        error: 'Failed to compute analytics',
        details: error.message,
      },
      { status: 500 }
    );
  }
}