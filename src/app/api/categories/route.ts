import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/supabase-server';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const categories = db
      .prepare('SELECT * FROM categories WHERE user_id IS NULL OR user_id = ? ORDER BY name ASC')
      .all(user.id);
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
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const db = getDb();
    const trimmedName = name.trim();
    
    // Insert custom category for this user
    const stmt = db.prepare('INSERT INTO categories (name, user_id) VALUES (?, ?)');
    const info = stmt.run(trimmedName, user.id);

    const category = db
      .prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?')
      .get(info.lastInsertRowid, user.id);
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
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const db = getDb();
    const result = db.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?').run(id, user.id);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Category not found or not owned by user' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Category deleted' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete category', details: error.message },
      { status: 500 }
    );
  }
}


