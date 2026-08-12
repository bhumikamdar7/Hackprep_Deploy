import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { PAYMENT_METHODS } from '@/lib/constants';

// GET /api/transactions
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const type = searchParams.get('type') || '';
    const paymentMethod = searchParams.get('paymentMethod') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const limit = parseInt(searchParams.get('limit') || '500', 10);

    let query = 'SELECT * FROM transactions WHERE 1=1';
    const params: any[] = [];

    if (search) {
      query += ' AND (description LIKE ? OR category LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (type && type !== 'All') {
      query += ' AND type = ?';
      params.push(type);
    }

    if (paymentMethod && paymentMethod !== 'All') {
      query += ' AND payment_method = ?';
      params.push(paymentMethod);
    }

    if (startDate) {
      query += ' AND date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY date DESC, id DESC LIMIT ?';
    params.push(limit);

    const stmt = db.prepare(query);
    const transactions = stmt.all(...params);

    return NextResponse.json({ transactions });
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

    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO transactions (amount, category, description, date, type, payment_method)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(amount, category.trim(), description.trim(), date, type, method);

    const createdTx = db
      .prepare('SELECT * FROM transactions WHERE id = ?')
      .get(info.lastInsertRowid);

    return NextResponse.json({ transaction: createdTx, success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create transaction', details: error.message },
      { status: 500 }
    );
  }
}
