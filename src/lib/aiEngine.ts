import { getDb } from './db';
import { AIResponse, TimePeriod, AICardInsights, ChatMessage } from '@/types';
import { formatINR } from './formatters';
import { getPeriodFilter } from './period';

// Helper to gather complete verified SQLite financial context
export function getFinancialContext(userId: string, period: TimePeriod = 'monthly') {
  const db = getDb();
  const periodFilter = getPeriodFilter(period);
  const currentMonth = new Date().toISOString().slice(0, 7);

  // 1. Total Income
  const incRow = db
    .prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'income' AND ${periodFilter.whereClause}`)
    .get(userId) as { total: number };
  const totalIncome = incRow?.total || 0;

  // 2. Total Expenses & Count
  const expRow = db
    .prepare(`SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM transactions WHERE user_id = ? AND type = 'expense' AND ${periodFilter.whereClause}`)
    .get(userId) as { total: number; count: number };
  const totalExpenses = expRow?.total || 0;
  const txCount = expRow?.count || 0;

  // 3. Category Breakdown
  const catRows = db
    .prepare(`
      SELECT category, SUM(amount) as total, COUNT(*) as count
      FROM transactions
      WHERE user_id = ? AND type = 'expense' AND ${periodFilter.whereClause}
      GROUP BY category
      ORDER BY total DESC
    `)
    .all(userId) as Array<{ category: string; total: number; count: number }>;

  const categoryBreakdown = catRows.map((c) => ({
    category: c.category,
    amount: c.total,
    percentage: totalExpenses > 0 ? Math.round((c.total / totalExpenses) * 100) : 0,
    count: c.count,
  }));

  // 4. High-value transactions audit (> ₹3,000 or top 5)
  const topTxns = db
    .prepare(`
      SELECT id, amount, category, description, date, payment_method
      FROM transactions
      WHERE user_id = ? AND type = 'expense' AND ${periodFilter.whereClause}
      ORDER BY amount DESC
      LIMIT 5
    `)
    .all(userId) as Array<{ id: number; amount: number; category: string; description: string; date: string; payment_method: string }>;

  // 5. Active Budget Progress
  const budgetRows = db
    .prepare(`
      SELECT 
        b.category,
        b.amount as budgetAmount,
        COALESCE(SUM(t.amount), 0) as spentAmount
      FROM budgets b
      LEFT JOIN transactions t 
        ON b.category = t.category 
        AND t.user_id = b.user_id
        AND t.type = 'expense'
        AND strftime('%Y-%m', t.date) = b.month
      WHERE b.user_id = ? AND b.month = ?
      GROUP BY b.id, b.category, b.amount
    `)
    .all(userId, currentMonth) as Array<{ category: string; budgetAmount: number; spentAmount: number }>;

  const budgets = budgetRows.map((b) => ({
    category: b.category,
    budgetAmount: b.budgetAmount,
    spentAmount: b.spentAmount,
    isOverBudget: b.spentAmount > b.budgetAmount,
    percentage: b.budgetAmount > 0 ? Math.round((b.spentAmount / b.budgetAmount) * 100) : 0,
  }));

  // 6. Monthly Trend Comparison
  const trendRows = db
    .prepare(`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions
      WHERE user_id = ?
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month DESC
      LIMIT 3
    `)
    .all(userId) as Array<{ month: string; income: number; expense: number }>;

  return {
    periodLabel: periodFilter.label,
    periodKey: period,
    totalIncome,
    totalExpenses,
    netCashflow: totalIncome - totalExpenses,
    savingsRate: totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)) : 0,
    txCount,
    categoryBreakdown,
    topTxns,
    budgets,
    trends: trendRows,
  };
}

// Generate the 6 Dynamic Cards via LLM
export async function generateAICards(userId: string, period: TimePeriod = 'monthly'): Promise<AICardInsights> {
  const ctx = getFinancialContext(userId, period);

  const fallbackCards: AICardInsights = {
    spendingSummary: `For ${ctx.periodLabel}, total expenses stand at **${formatINR(ctx.totalExpenses)}** across ${ctx.txCount} transactions against recorded income of **${formatINR(ctx.totalIncome)}**. Net balance: **${formatINR(ctx.netCashflow)}**.`,
    topCategories: ctx.categoryBreakdown.slice(0, 3).map((c) => ({
      category: c.category,
      amount: c.amount,
      percentage: c.percentage,
    })),
    spendingTrends: ctx.categoryBreakdown.length > 0
      ? `Your primary expenditure driver is **${ctx.categoryBreakdown[0].category}** at ${formatINR(ctx.categoryBreakdown[0].amount)} (${ctx.categoryBreakdown[0].percentage}% of total spend).`
      : "No spending trends detected for this period.",
    unusualSpending: ctx.topTxns.length > 0
      ? `Highest transaction logged is **${ctx.topTxns[0].description}** for **${formatINR(ctx.topTxns[0].amount)}** via ${ctx.topTxns[0].payment_method}.`
      : "No high-value unusual transactions logged.",
    budgetHealth: ctx.budgets.some((b) => b.isOverBudget)
      ? `🚨 Attention needed: ${ctx.budgets.filter((b) => b.isOverBudget).length} category/categories are over budget (${ctx.budgets.filter((b) => b.isOverBudget).map((b) => b.category).join(', ')}).`
      : ctx.budgets.length > 0
      ? `✅ All ${ctx.budgets.length} category budgets are currently within limits.`
      : "No active monthly budget caps configured yet.",
    recommendations: [
      ctx.categoryBreakdown.length > 0
        ? `Target **${ctx.categoryBreakdown[0].category}** for a 15% reduction to save ${formatINR(ctx.categoryBreakdown[0].amount * 0.15)}.`
        : "Log more transactions to receive tailored savings advice.",
      "Maintain a 20% minimum savings buffer from monthly income.",
      "Audit high-frequency digital transfers & recurring UPI subscriptions.",
    ],
  };

  const apiKey = process.env.AI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return fallbackCards;
  }

  try {
    const systemPrompt = `You are SpendSense AI, an expert Indian financial advisor. Analyze the user's verified SQLite database facts below and return a JSON object with insights for EXACTLY 6 sections.

VERIFIED SQLITE FINANCIAL FACTS:
- Time Period: ${ctx.periodLabel}
- Total Income: ${formatINR(ctx.totalIncome)}
- Total Expenses: ${formatINR(ctx.totalExpenses)}
- Net Cashflow: ${formatINR(ctx.netCashflow)}
- Savings Rate: ${ctx.savingsRate}%
- Total Transactions: ${ctx.txCount}
- Top Expense Categories: ${JSON.stringify(ctx.categoryBreakdown)}
- Top Individual Transactions: ${JSON.stringify(ctx.topTxns)}
- Active Budget Caps: ${JSON.stringify(ctx.budgets)}
- Recent Monthly Trends: ${JSON.stringify(ctx.trends)}

CRITICAL INSTRUCTIONS:
- Use Indian Rupee (₹ / INR) formatting.
- Do NOT invent totals or change financial numbers. Rely strictly on the provided SQL facts.
- Return ONLY valid JSON matching this exact structure:
{
  "spending_summary": "1-2 sentence summary of income, expense, and net balance in ₹",
  "top_categories": [
    { "category": "Category Name", "amount": 1234, "percentage": 45 }
  ],
  "spending_trends": "1-2 sentences on spending distribution or top drivers",
  "unusual_spending": "1-2 sentences highlighting highest or notable individual transactions",
  "budget_health": "1-2 sentences summarizing budget caps compliance or overruns",
  "actionable_advice": [
    "Specific actionable tip 1 with ₹ savings target",
    "Specific tip 2",
    "Specific tip 3"
  ]
}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      console.warn('Groq API cards call failed:', await res.text());
      return fallbackCards;
    }

    const json = await res.json();
    const parsed = JSON.parse(json.choices[0].message.content);

    return {
      spendingSummary: parsed.spending_summary || fallbackCards.spendingSummary,
      topCategories: Array.isArray(parsed.top_categories) && parsed.top_categories.length > 0
        ? parsed.top_categories.map((c: any) => ({
            category: c.category || c.name || 'Expense',
            amount: Number(c.amount) || 0,
            percentage: Number(c.percentage) || 0,
          }))
        : fallbackCards.topCategories,
      spendingTrends: parsed.spending_trends || fallbackCards.spendingTrends,
      unusualSpending: parsed.unusual_spending || fallbackCards.unusualSpending,
      budgetHealth: parsed.budget_health || fallbackCards.budgetHealth,
      recommendations: Array.isArray(parsed.actionable_advice)
        ? parsed.actionable_advice
        : fallbackCards.recommendations,
    };
  } catch (err) {
    console.error('Error generating AI cards:', err);
    return fallbackCards;
  }
}

// Process Financial Chatbot Query via LLM
export async function processChatbotQuery(
  userQuery: string,
  history: ChatMessage[],
  userId: string,
  period: TimePeriod = 'monthly'
): Promise<string> {
  const ctx = getFinancialContext(userId, period);


  const apiKey = process.env.AI_API_KEY;

  const contextPrompt = `You are SpendSense AI, an intelligent, helpful Indian personal finance assistant.
Answer the user's financial question concisely, accurately, and naturally based ONLY on their verified SQLite database records below. Always format amounts in Indian Rupees (₹ / INR).

VERIFIED DATABASE FACTS (${ctx.periodLabel}):
- Income: ${formatINR(ctx.totalIncome)}
- Expenses: ${formatINR(ctx.totalExpenses)}
- Net Cashflow: ${formatINR(ctx.netCashflow)}
- Savings Rate: ${ctx.savingsRate}%
- Transaction Count: ${ctx.txCount}
- Category Breakdown: ${JSON.stringify(ctx.categoryBreakdown)}
- Top Transactions: ${JSON.stringify(ctx.topTxns)}
- Active Budgets: ${JSON.stringify(ctx.budgets)}
- Recent Monthly Trends: ${JSON.stringify(ctx.trends)}

Rules:
- Keep responses concise (2-4 sentences max unless detailed calculation requested).
- If the user asks about a specific category (e.g. Food, Rent, Fuel), reference the exact amounts from the facts.
- Do not make up fake transaction facts.`;

  if (!apiKey || apiKey.trim() === '') {
    // Intelligent local fallback if API key is missing
    const q = userQuery.toLowerCase();
    if (q.includes('food')) {
      const food = ctx.categoryBreakdown.find((c) => c.category.includes('Food'));
      return food
        ? `You have spent **${formatINR(food.amount)}** on **${food.category}** for ${ctx.periodLabel} (${food.percentage}% of your total expenses).`
        : `No Food & Dining expenses logged for ${ctx.periodLabel}.`;
    }
    if (q.includes('most') || q.includes('highest')) {
      const top = ctx.categoryBreakdown[0];
      return top
        ? `Your highest expense category for ${ctx.periodLabel} is **${top.category}** at **${formatINR(top.amount)}** (${top.percentage}% of total spend).`
        : `No expenses logged for ${ctx.periodLabel}.`;
    }
    if (q.includes('budget')) {
      const over = ctx.budgets.filter((b) => b.isOverBudget);
      return over.length > 0
        ? `You are currently over budget in **${over.length}** category/categories (${over.map((b) => `${b.category}: ${formatINR(b.spentAmount)} / ${formatINR(b.budgetAmount)}`).join(', ')}).`
        : `✅ You are within budget limits across all configured categories for ${ctx.periodLabel}!`;
    }
    return `For ${ctx.periodLabel}, your total income is **${formatINR(ctx.totalIncome)}** and total expenses are **${formatINR(ctx.totalExpenses)}**, giving a net cashflow of **${formatINR(ctx.netCashflow)}** (Savings Rate: ${ctx.savingsRate}%).`;
  }

  try {
    const formattedHistory = history.slice(-6).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const messages = [
      { role: 'system', content: contextPrompt },
      ...formattedHistory,
      { role: 'user', content: userQuery },
    ];

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.3,
        max_tokens: 450,
      }),
    });

    if (!res.ok) {
      console.warn('Groq Chatbot call failed:', await res.text());
      return `For ${ctx.periodLabel}, your total expenses are **${formatINR(ctx.totalExpenses)}** against total income of **${formatINR(ctx.totalIncome)}**. Net savings: **${formatINR(ctx.netCashflow)}**.`;
    }

    const json = await res.json();
    return json.choices[0].message.content.trim();
  } catch (err) {
    console.error('Chatbot LLM Error:', err);
    return `For ${ctx.periodLabel}, total expenses stand at **${formatINR(ctx.totalExpenses)}** across ${ctx.txCount} transactions.`;
  }
}
