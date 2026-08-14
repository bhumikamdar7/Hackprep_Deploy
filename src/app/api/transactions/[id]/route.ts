import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { PAYMENT_METHODS } from '@/lib/constants';
import { getAuthenticatedUser } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();
    const transaction = db
      .prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?')
      .get(id, user.id);

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ transaction });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch transaction', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { amount, category, description, date, type, payment_method } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
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
      return NextResponse.json({ error: 'Type must be income or expense' }, { status: 400 });
    }

    const method = PAYMENT_METHODS.includes(payment_method) ? payment_method : 'UPI';

    const db = getDb();
    const stmt = db.prepare(`
      UPDATE transactions
      SET amount = ?, category = ?, description = ?, date = ?, type = ?, payment_method = ?
      WHERE id = ? AND user_id = ?
    `);

    const result = stmt.run(amount, category.trim(), description.trim(), date, type, method, id, user.id);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const updatedTx = db
      .prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?')
      .get(id, user.id);

    return NextResponse.json({ transaction: updatedTx, success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update transaction', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();
    const result = db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(id, user.id);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Transaction deleted' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete transaction', details: error.message },
      { status: 500 }
    );
  }
}


