import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month') || new Date().toISOString().slice(0, 7);

    const db = getDb();
    
    // Select budget target + calculate current actual month spending for each category
    const budgets = db.prepare(`
      SELECT 
        b.id,
        b.category,
        b.amount as budgetAmount,
        b.month,
        COALESCE(SUM(t.amount), 0) as spentAmount
      FROM budgets b
      LEFT JOIN transactions t 
        ON b.category = t.category 
        AND t.user_id = b.user_id
        AND t.type = 'expense'
        AND strftime('%Y-%m', t.date) = b.month
      WHERE b.user_id = ? AND b.month = ?
      GROUP BY b.id, b.category, b.amount, b.month
      ORDER BY b.category ASC
    `).all(user.id, monthParam) as Array<{
      id: number;
      category: string;
      budgetAmount: number;
      month: string;
      spentAmount: number;
    }>;

    const progress = budgets.map((b) => {
      const percentage = b.budgetAmount > 0 ? Math.round((b.spentAmount / b.budgetAmount) * 100) : 0;
      return {
        ...b,
        percentage,
        remaining: Math.max(0, b.budgetAmount - b.spentAmount),
        isOverBudget: b.spentAmount > b.budgetAmount,
      };
    });

    return NextResponse.json({ budgets: progress, month: monthParam });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch budgets', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { category, amount, month } = await request.json();

    if (!category || typeof category !== 'string' || !category.trim()) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }
    if (amount === undefined || typeof amount !== 'number' || amount < 0) {
      return NextResponse.json({ error: 'Amount must be a non-negative number' }, { status: 400 });
    }

    const monthStr = month || new Date().toISOString().slice(0, 7);
    const db = getDb();

    // Upsert budget for category + month + user_id
    const existing = db
      .prepare('SELECT id FROM budgets WHERE user_id = ? AND category = ? AND month = ?')
      .get(user.id, category.trim(), monthStr) as { id: number } | undefined;

    if (existing) {
      db.prepare('UPDATE budgets SET amount = ? WHERE id = ? AND user_id = ?').run(amount, existing.id, user.id);
    } else {
      db.prepare('INSERT INTO budgets (user_id, category, amount, month) VALUES (?, ?, ?, ?)').run(user.id, category.trim(), amount, monthStr);
    }

    return NextResponse.json({ success: true, message: 'Budget set successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to save budget', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Budget ID is required' }, { status: 400 });
    }

    const db = getDb();
    const result = db.prepare('DELETE FROM budgets WHERE id = ? AND user_id = ?').run(id, user.id);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Budget deleted' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete budget', details: error.message },
      { status: 500 }
    );
  }
}


