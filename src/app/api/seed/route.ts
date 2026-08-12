import { NextResponse } from 'next/server';
import { seedDemoData } from '@/lib/seedData';

export async function POST() {
  try {
    const result = seedDemoData();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to seed database', details: error.message },
      { status: 500 }
    );
  }
}
