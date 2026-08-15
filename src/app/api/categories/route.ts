import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user categories OR default system categories (user_id IS NULL)
    const { data: dbCategories, error } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    let categories = dbCategories || [];

    // If categories table is empty, return DEFAULT_CATEGORIES formatted
    if (categories.length === 0) {
      categories = DEFAULT_CATEGORIES.map((name, index) => ({
        id: index + 1,
        name,
        user_id: null,
      }));
    }

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
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();

    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        name: trimmedName,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Category already exists' }, { status: 400 });
      }
      throw new Error(error.message);
    }

    return NextResponse.json({ category, success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to add category', details: error.message },
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
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const { error, count } = await supabase
      .from('categories')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error || count === 0) {
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
