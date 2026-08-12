'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { TimePeriod, AICardInsights, ChatMessage } from '@/types';
import { formatINR } from '@/lib/formatters';
import { 
  Bot, 
  Sparkles, 
  TrendingUp, 
  PieChart, 
  ShieldCheck, 
  AlertCircle, 
  Plus, 
  RefreshCw,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Send,
  User,
  MessageSquareText
} from 'lucide-react';

interface AIAnalystViewProps {
  period?: TimePeriod;
  onAddTransaction?: () => void;
}

const SUGGESTED_PROMPTS = [
  "Where did I spend the most this month?",
  "How much did I spend on food?",
  "Am I staying within my budgets?",
  "What category can I reduce spending in?",
  "Compare my spending with last month.",
  "Which transactions were unusually high?",
  "How much can I save if I reduce my top expense by 15%?",
  "What are my biggest recurring expenses?",
];

export default function AIAnalystChat({ period = 'monthly', onAddTransaction }: AIAnalystViewProps) {
  // Cards state
  const [cards, setCards] = useState<AICardInsights | null>(null);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [cardsError, setCardsError] = useState<string | null>(null);

  // Chatbot state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch dynamic AI Cards
  const fetchAICards = useCallback(async () => {
    try {
      setCardsLoading(true);
      setCardsError(null);
      const res = await fetch('/api/ai-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'cards', period }),
      });

      if (!res.ok) throw new Error('Failed to load dynamic AI analysis');
      const data = await res.json();
      if (data.cards) {
        setCards(data.cards);
      }
    } catch (err: any) {
      setCardsError(err.message || 'Error generating insights');
    } finally {
      setCardsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAICards();
  }, [fetchAICards]);

  // Scroll to bottom of chat when new message arrives
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // Send a Chat Message
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || chatLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    if (!textToSend) setInputQuery('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/ai-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'chat',
          period,
          prompt: query,
          history: newHistory,
        }),
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'I processed your query based on your SQLite database.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I ran into an error reading your financial data. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* SECTION 1: 6 DYNAMIC AI CARDS */}
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="ui-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[12px] bg-[#E8F0EA] text-[#4F6F5B] flex items-center justify-center shrink-0 border border-[#6F8F7A]/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#242321] flex items-center gap-2">
                AI Analyst <Sparkles className="w-4 h-4 text-[#6F8F7A]" />
              </h2>
              <p className="text-xs text-[#5F5B56] font-medium mt-0.5">
                Dynamic LLM analysis powered by your SQLite database in INR (₹)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAICards}
              disabled={cardsLoading}
              className="btn-secondary btn-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cardsLoading ? 'animate-spin' : ''}`} />
              Refresh Analysis
            </button>
          </div>
        </div>

        {/* Loading Skeleton */}
        {cardsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="ui-card space-y-3 animate-pulse">
                <div className="h-4 bg-[#F7F5F2] rounded w-1/3"></div>
                <div className="h-6 bg-[#F7F5F2] rounded w-2/3"></div>
                <div className="h-12 bg-[#F7F5F2] rounded w-full"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error Retry State */}
        {!cardsLoading && cardsError && (
          <div className="ui-card text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FDF0EE] text-[#B56F67] border border-[#B56F67]/20 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="ui-card-title">Unable to generate AI analysis</h3>
            <p className="text-xs text-[#5F5B56]">{cardsError}</p>
            <button onClick={fetchAICards} className="btn-primary mt-2">
              Retry Analysis
            </button>
          </div>
        )}

        {/* Cards Grid */}
        {!cardsLoading && !cardsError && cards && (
          <>
            {(!cards.topCategories || cards.topCategories.length === 0) ? (
              <div className="ui-card text-center max-w-lg mx-auto space-y-4 p-12">
                <div className="w-14 h-14 rounded-full bg-[#E8F0EA] text-[#4F6F5B] flex items-center justify-center mx-auto border border-[#6F8F7A]/20">
                  <Bot className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#242321]">Your AI Analyst is ready</h3>
                  <p className="text-xs text-[#5F5B56] mt-1.5 leading-relaxed font-medium">
                    Add a few transactions and I'll start finding spending patterns and useful ways to save.
                  </p>
                </div>
                {onAddTransaction && (
                  <button onClick={onAddTransaction} className="btn-primary">
                    <Plus className="w-4 h-4 stroke-[2.5]" /> Add your first transaction
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* 1. Spending Summary */}
                <div className="ui-card space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-[#5F5B56] uppercase tracking-wider">
                      <span>Spending Summary</span>
                      <ShieldCheck className="w-4 h-4 text-[#4F6F5B]" />
                    </div>
                    <p className="text-xs text-[#242321] mt-3 font-medium leading-relaxed">
                      {cards.spendingSummary}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#E8E4DF] text-[11px] text-[#8A857F] flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4F6F5B]" /> Verified SQLite data
                  </div>
                </div>

                {/* 2. Top Categories */}
                <div className="ui-card space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-[#5F5B56] uppercase tracking-wider">
                      <span>Top Categories</span>
                      <PieChart className="w-4 h-4 text-[#6F8F7A]" />
                    </div>
                    <div className="space-y-2 mt-3">
                      {cards.topCategories.map((c) => (
                        <div key={c.category} className="flex items-center justify-between text-xs p-2 rounded-[8px] bg-[#F7F5F2]">
                          <span className="font-semibold text-[#242321] truncate">{c.category}</span>
                          <div className="text-right shrink-0 font-bold text-[#242321]">
                            {formatINR(c.amount)} <span className="text-[10px] text-[#8A857F] font-normal">({c.percentage}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2 text-[11px] text-[#8A857F] font-medium">
                    Primary expenditure drivers
                  </div>
                </div>

                {/* 3. Spending Trends */}
                <div className="ui-card space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-[#5F5B56] uppercase tracking-wider">
                      <span>Spending Trends</span>
                      <TrendingUp className="w-4 h-4 text-[#B78478]" />
                    </div>
                    <p className="text-xs text-[#242321] mt-3 leading-relaxed font-medium">
                      {cards.spendingTrends}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#E8E4DF] text-[11px] text-[#8A857F] font-medium">
                    Time-period pattern analysis
                  </div>
                </div>

                {/* 4. Unusual Spending */}
                <div className="ui-card space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-[#5F5B56] uppercase tracking-wider">
                      <span>Unusual Spending</span>
                      <AlertTriangle className="w-4 h-4 text-[#C49A5A]" />
                    </div>
                    <p className="text-xs text-[#242321] mt-3 leading-relaxed font-medium">
                      {cards.unusualSpending}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#E8E4DF] text-[11px] text-[#8A857F] font-medium">
                    High-value transaction audit
                  </div>
                </div>

                {/* 5. Budget Health */}
                <div className="ui-card space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-[#5F5B56] uppercase tracking-wider">
                      <span>Budget Health</span>
                      <CheckCircle2 className="w-4 h-4 text-[#4F6F5B]" />
                    </div>
                    <p className="text-xs text-[#242321] mt-3 leading-relaxed font-medium">
                      {cards.budgetHealth}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#E8E4DF] text-[11px] text-[#8A857F] font-medium">
                    Category limits evaluation
                  </div>
                </div>

                {/* 6. Actionable Advice */}
                <div className="ui-card space-y-3 flex flex-col justify-between md:col-span-2 lg:col-span-1">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-[#5F5B56] uppercase tracking-wider">
                      <span>Actionable Advice</span>
                      <Lightbulb className="w-4 h-4 text-[#C49A5A]" />
                    </div>
                    <ul className="mt-3 space-y-2 text-xs text-[#242321] font-medium">
                      {cards.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#6F8F7A] font-bold">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-3 border-t border-[#E8E4DF] text-[11px] text-[#8A857F] font-medium">
                    Personalized savings guidance
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* SECTION 2: FINANCIAL CHATBOT SECTION */}
      <div className="ui-card space-y-5">
        <div className="flex items-center gap-3 border-b border-[#E8E4DF] pb-4">
          <div className="p-2.5 rounded-[12px] bg-[#E8F0EA] text-[#4F6F5B] border border-[#6F8F7A]/20">
            <MessageSquareText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="ui-card-title flex items-center gap-2">
              Ask SpendSense Assistant
            </h3>
            <p className="text-xs text-[#8A857F] font-medium mt-0.5">
              Ask any question about your spending, budgets, and transactions in INR (₹)
            </p>
          </div>
        </div>

        {/* Suggested Prompts / Chips */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-[#8A857F] uppercase tracking-wider block">
            Suggested Prompts
          </span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((promptText, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(promptText)}
                className="text-xs px-3 py-1.5 rounded-[8px] bg-[#F7F5F2] hover:bg-[#E8F0EA] text-[#242321] hover:text-[#4F6F5B] border border-[#E8E4DF] hover:border-[#6F8F7A]/40 transition font-medium cursor-pointer"
              >
                {promptText}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Message Thread */}
        <div className="min-h-[220px] max-h-[380px] overflow-y-auto p-4 rounded-[12px] bg-[#F7F5F2]/60 border border-[#E8E4DF] space-y-3.5">
          {chatMessages.length === 0 ? (
            <div className="text-center py-10 text-[#8A857F] text-xs font-medium space-y-1">
              <Bot className="w-8 h-8 mx-auto text-[#6F8F7A] opacity-80 mb-2" />
              <p className="font-semibold text-[#242321]">Have questions about your finances?</p>
              <p>Click a suggested prompt above or type your question below.</p>
            </div>
          ) : (
            chatMessages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 text-xs font-bold ${
                      isUser
                        ? 'bg-[#6F8F7A] text-white'
                        : 'bg-[#E8F0EA] text-[#4F6F5B] border border-[#6F8F7A]/20'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[80%] rounded-[12px] p-3.5 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-[#6F8F7A] text-white font-medium'
                        : 'bg-white text-[#242321] border border-[#E8E4DF] shadow-subtle'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <span
                      className={`text-[10px] block mt-1 text-right ${
                        isUser ? 'text-white/75' : 'text-[#8A857F]'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {chatLoading && (
            <div className="flex items-center gap-2 text-xs text-[#8A857F] italic p-2">
              <Bot className="w-4 h-4 text-[#6F8F7A] animate-bounce" />
              <span>Analyzing SQLite database & generating response...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Field & Send Button */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 pt-1"
        >
          <input
            type="text"
            placeholder="Ask about your spending, e.g. 'How much did I spend on groceries?'"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="flex-1 ui-input text-xs"
            disabled={chatLoading}
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || chatLoading}
            className="btn-primary disabled:opacity-50 shrink-0"
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </form>
      </div>
    </div>
  );
}
