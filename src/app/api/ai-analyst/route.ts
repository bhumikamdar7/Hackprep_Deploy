import { NextRequest, NextResponse } from 'next/server';
import { generateAICards, processChatbotQuery } from '@/lib/aiEngine';
import { TimePeriod, ChatMessage } from '@/types';
import { createClient } from '@/lib/supabase-server';

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
    const { mode, period, prompt, history } = body;
    const selectedPeriod = (period || 'monthly') as TimePeriod;

    if (mode === 'chat') {
      const userMessage = prompt && typeof prompt === 'string' ? prompt.trim() : 'Summary of my spending';
      const chatHistory: ChatMessage[] = Array.isArray(history) ? history : [];
      const botResponse = await processChatbotQuery(userMessage, chatHistory, supabase, user.id, selectedPeriod);

      return NextResponse.json({
        reply: botResponse,
      });
    }

    // Default mode: Generate 6 Dynamic AI Cards
    const cards = await generateAICards(supabase, user.id, selectedPeriod);

    return NextResponse.json({
      cards,
      queryType: 'cards_analysis',
    });
  } catch (error: any) {
    console.error('API Error in /api/ai-analyst:', error);
    return NextResponse.json(
      { error: 'Failed to process AI request', details: error.message },
      { status: 500 }
    );
  }
}
