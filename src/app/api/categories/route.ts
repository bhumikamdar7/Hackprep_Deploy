import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const db = getDb();
    const trimmedName = name.trim();
    
    // Insert category
    const stmt = db.prepare('INSERT INTO categories (name) VALUES (?)');
    const info = stmt.run(trimmedName);

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid);
    return NextResponse.json({ category, success: true }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json({ error: 'Category already exists' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to add category', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const db = getDb();
    const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Category deleted' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete category', details: error.message },
      { status: 500 }
    );
  }
}
