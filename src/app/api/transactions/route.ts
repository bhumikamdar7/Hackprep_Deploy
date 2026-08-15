import { NextRequest, NextResponse } from 'next/server';
import { PAYMENT_METHODS } from '@/lib/constants';
import { createClient } from '@/lib/supabase-server';

// GET /api/transactions
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
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const type = searchParams.get('type') || '';
    const paymentMethod = searchParams.get('paymentMethod') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const limit = parseInt(searchParams.get('limit') || '500', 10);

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id);

    if (search) {
      query = query.or(`description.ilike.%${search}%,category.ilike.%${search}%`);
    }

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    if (type && type !== 'All') {
      query = query.eq('type', type);
    }

    if (paymentMethod && paymentMethod !== 'All') {
      query = query.eq('payment_method', paymentMethod);
    }

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    query = query
      .order('date', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit);

    const { data: transactions, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ transactions: transactions || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch transactions', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/transactions
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

    const body = await request.json();

    const { amount, category, description, date, type, payment_method } = body;

    // Strict Validations
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number greater than 0' },
        { status: 400 }
      );
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Valid date (YYYY-MM-DD) is required' }, { status: 400 });
    }
    if (!type || (type !== 'income' && type !== 'expense')) {
      return NextResponse.json({ error: 'Type must be either income or expense' }, { status: 400 });
    }

    const method = PAYMENT_METHODS.includes(payment_method) ? payment_method : 'UPI';

    const { data: createdTx, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        amount,
        category: category.trim(),
        description: description.trim(),
        date,
        type,
        payment_method: method,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ transaction: createdTx, success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create transaction', details: error.message },
      { status: 500 }
    );
  }
}
