import { NextResponse } from 'next/server';
import { seedDemoData } from '@/lib/seedData';
import { getAuthenticatedUser } from '@/lib/supabase-server';

export async function POST() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = seedDemoData(user.id);
    return NextResponse.json(result);

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to seed database', details: error.message },
      { status: 500 }
    );
  }
}

