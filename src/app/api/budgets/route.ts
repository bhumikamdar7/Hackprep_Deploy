import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month') || new Date().toISOString().slice(0, 7);

    // Fetch user budgets for the month
    const { data: budgets, error: bError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', monthParam)
      .order('category', { ascending: true });

    if (bError) throw new Error(bError.message);

    // Fetch user transactions for the month to calculate spent amount
    const { data: transactions, error: tError } = await supabase
      .from('transactions')
      .select('category, amount, type, date')
      .eq('user_id', user.id)
      .eq('type', 'expense');

    if (tError) throw new Error(tError.message);

    const monthTransactions = (transactions || []).filter(
      (t) => String(t.date).slice(0, 7) === monthParam
    );

    const progress = (budgets || []).map((b) => {
      const budgetAmount = Number(b.amount);
      const spentAmount = monthTransactions
        .filter((t) => t.category === b.category)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const percentage = budgetAmount > 0 ? Math.round((spentAmount / budgetAmount) * 100) : 0;
      return {
        id: b.id,
        category: b.category,
        budgetAmount,
        amount: budgetAmount,
        month: b.month,
        spentAmount,
        percentage,
        remaining: Math.max(0, budgetAmount - spentAmount),
        isOverBudget: spentAmount > budgetAmount,
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
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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
    const trimmedCat = category.trim();

    // Check existing
    const { data: existing } = await supabase
      .from('budgets')
      .select('id')
      .eq('user_id', user.id)
      .eq('category', trimmedCat)
      .eq('month', monthStr)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('budgets')
        .update({ amount })
        .eq('id', existing.id)
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from('budgets')
        .insert({ user_id: user.id, category: trimmedCat, amount, month: monthStr });
      if (error) throw new Error(error.message);
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
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Budget ID is required' }, { status: 400 });
    }

    const { error, count } = await supabase
      .from('budgets')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error || count === 0) {
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
