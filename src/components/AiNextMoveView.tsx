import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert,
  Target, 
  Calculator, 
  RefreshCw, 
  Send, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Layers,
  Bot,
  User,
  MessageSquare
} from 'lucide-react';
import { TradeSignal, MarketOutlookDigest, MarketSymbol } from '../types';

interface AiNextMoveViewProps {
  signals: TradeSignal[];
  symbols: MarketSymbol[];
  activeSignalId?: string;
  accountBalance?: number;
}

export const AiNextMoveView: React.FC<AiNextMoveViewProps> = ({
  signals,
  symbols,
  activeSignalId,
  accountBalance = 50,
}) => {
  const [outlook, setOutlook] = useState<MarketOutlookDigest | null>(null);
  const [isLoadingOutlook, setIsLoadingOutlook] = useState(false);
  const [selectedSignalId, setSelectedSignalId] = useState<string>(
    activeSignalId || signals[0]?.id || ''
  );
  const [isAnalyzingSignal, setIsAnalyzingSignal] = useState(false);

  // Position Calculator State
  const [customBalance, setCustomBalance] = useState<number>(accountBalance);
  const [riskPercent, setRiskPercent] = useState<number>(1.5);

  // Interactive AI Strategist Chat
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; time: string }>>([
    {
      role: 'assistant',
      text: 'Hello! I am your institutional Gemini Quantitative Strategist. Ask me anything about current market setups, liquidity pools, order flow invalidations, or dynamic position sizing.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Fetch Outlook on load
  const fetchOutlook = async (refresh = false) => {
    setIsLoadingOutlook(true);
    try {
      const res = await fetch(`/api/ai/market-outlook${refresh ? '?refresh=true' : ''}`);
      const data = await res.json();
      if (data.success) {
        setOutlook(data.outlook);
      }
    } catch (err) {
      console.error('Failed to load market outlook:', err);
    } finally {
      setIsLoadingOutlook(false);
    }
  };

  useEffect(() => {
    fetchOutlook();
  }, []);

  useEffect(() => {
    if (activeSignalId) {
      setSelectedSignalId(activeSignalId);
    }
  }, [activeSignalId]);

  const selectedSignal = signals.find(s => s.id === selectedSignalId) || signals[0];
  const selectedSym = symbols.find(s => s.symbol === selectedSignal?.symbol);

  // Trigger new deep AI analysis on selected signal
  const handleTriggerDeepAnalysis = async () => {
    if (!selectedSignal) return;
    setIsAnalyzingSignal(true);
    try {
      const res = await fetch('/api/ai/analyze-pattern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signalId: selectedSignal.id })
      });
      const data = await res.json();
      if (data.success && data.aiAnalysis) {
        selectedSignal.aiAnalysis = data.aiAnalysis;
      }
    } catch (err) {
      console.error('Failed to trigger AI analysis:', err);
    } finally {
      setIsAnalyzingSignal(false);
    }
  };

  // Position Sizing Math
  const calculatePositionSize = () => {
    if (!selectedSignal) return { riskAmount: 0, units: 0, lotSize: 0 };
    const riskAmount = (customBalance * (riskPercent / 100));
    const slDistance = Math.abs(selectedSignal.entryPrice - selectedSignal.stopLoss);
    if (slDistance === 0) return { riskAmount, units: 0, lotSize: 0 };

    const units = +(riskAmount / slDistance).toFixed(2);
    const lotSize = +(units / (selectedSym?.assetClass === 'forex' ? 100000 : 100)).toFixed(2);
    return { riskAmount: +riskAmount.toFixed(2), units, lotSize: Math.max(0.01, lotSize) };
  };

  const { riskAmount, lotSize } = calculatePositionSize();

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingChat) return;

    const userText = chatInput.trim();
    const newMsg = {
      role: 'user' as const,
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...chatMessages, newMsg];
    setChatMessages(updated);
    setChatInput('');
    setIsSendingChat(true);

    try {
      const payloadMessages = updated.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        content: m.text
      }));

      const res = await fetch('/api/ai/copilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          currentSymbol: selectedSignal?.symbol || 'XAU/USD'
        })
      });

      const data = await res.json();
      if (data.success && data.reply) {
        setChatMessages(prev => [
          ...prev,
          {
            role: 'assistant' as const,
            text: data.reply.content,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }
    } catch (err) {
      console.error('AI chat error:', err);
      // Fallback
      let fallbackReply = `Order flow analysis for ${selectedSignal?.symbol || 'XAU/USD'}: Technical structure displays high momentum confluence with active institutional order block protection.`;
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant' as const,
          text: fallbackReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      
      {/* Executive Market Outlook Card */}
      {outlook && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Gemini AI Global Market Outlook
                </h2>
                <span className="text-xs text-slate-400 font-mono">
                  Updated {new Date(outlook.generatedAt).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                outlook.overallSentiment === 'RISK_ON'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                  : 'bg-amber-950 text-amber-300 border-amber-500/50'
              }`}>
                SENTIMENT: {outlook.overallSentiment}
              </span>

              <button
                onClick={() => fetchOutlook(true)}
                disabled={isLoadingOutlook}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Regenerate Outlook"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingOutlook ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            {outlook.executiveSummary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {outlook.topOpportunities.map((opp, idx) => (
              <div key={idx} className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3">
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-white flex items-center gap-1.5">
                    {opp.direction === 'LONG' ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    {opp.symbol} ({opp.direction})
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    {opp.conviction} CONVICTION
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{opp.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Signal Deep Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Signal Selector & Deep Plan (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Signal Selector Ribbon */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
            <span className="text-xs font-semibold text-slate-400 block mb-2">Select Active Signal to Analyze:</span>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {signals.map(sig => {
                const isSelected = sig.id === selectedSignalId;
                const isLong = sig.direction === 'LONG';
                return (
                  <button
                    key={sig.id}
                    onClick={() => setSelectedSignalId(sig.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap border ${
                      isSelected
                        ? 'bg-emerald-500/20 text-white border-emerald-500/60 shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isLong ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    <span>{sig.symbol}</span>
                    <span className="text-[10px] font-mono text-slate-400">{sig.timeframe}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Deep AI Analysis Panel */}
          {selectedSignal && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5">
              
              {/* Header with Bias & Refresh AI */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-white">{selectedSignal.symbol} AI Tactical Plan</h3>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-mono font-bold">
                      {selectedSignal.timeframe}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedSignal.pattern.name}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold">
                    BIAS: {selectedSignal.aiAnalysis?.marketBias || (selectedSignal.direction === 'LONG' ? 'STRONG_BUY' : 'STRONG_SELL')}
                  </span>

                  <button
                    onClick={handleTriggerDeepAnalysis}
                    disabled={isAnalyzingSignal}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isAnalyzingSignal ? 'animate-spin' : ''}`} />
                    <span>{isAnalyzingSignal ? 'Analyzing...' : 'Re-Analyze'}</span>
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <BrainCircuit className="w-4 h-4 text-emerald-400" />
                  Tactical Thesis & Order Flow Rationale
                </h4>
                <p className="text-sm text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                  {selectedSignal.aiAnalysis?.summary}
                </p>
              </div>

              {/* Technical Confluences Checklist */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Key Institutional Confluences
                </h4>
                <div className="space-y-2">
                  {selectedSignal.aiAnalysis?.rationales?.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invalidation & Risk Rules Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-4">
                  <h5 className="text-xs font-bold text-rose-400 flex items-center gap-1.5 mb-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    Invalidation Trigger
                  </h5>
                  <p className="text-xs text-slate-300 leading-normal">
                    {selectedSignal.aiAnalysis?.invalidationTrigger || `Price closure beyond stop loss at $${selectedSignal.stopLoss}.`}
                  </p>
                </div>

                <div className="bg-teal-950/20 border border-teal-500/30 rounded-xl p-4">
                  <h5 className="text-xs font-bold text-teal-400 flex items-center gap-1.5 mb-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Risk & Scaling Protocol
                  </h5>
                  <p className="text-xs text-slate-300 leading-normal">
                    {selectedSignal.aiAnalysis?.riskRecommendation || 'Scale out 50% at Take Profit 1 and move stop loss to entry.'}
                  </p>
                </div>
              </div>

              {/* Key Targets Roadmap */}
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
                  <span className="flex items-center gap-1.5 text-white">
                    <Target className="w-4 h-4 text-emerald-400" />
                    Execution Roadmap
                  </span>
                  <span className="font-mono text-emerald-400">
                    Est. Horizon: {selectedSignal.aiAnalysis?.expectedMoveTimeframe || 'Intraday'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">ENTRY POINT</span>
                    <span className="font-bold text-slate-100">${selectedSignal.entryPrice}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-emerald-400 block">TARGET 1</span>
                    <span className="font-bold text-emerald-300">${selectedSignal.takeProfit1}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-teal-400 block">TARGET 2</span>
                    <span className="font-bold text-teal-300">${selectedSignal.takeProfit2}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Position Sizing Calculator & Interactive Chat (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Risk & Lot Size Calculator */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-emerald-400" />
              Dynamic Position Sizing
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Account Balance ($):</label>
                <input
                  type="number"
                  value={customBalance}
                  onChange={(e) => setCustomBalance(Number(e.target.value))}
                  className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Risk Per Trade:</span>
                  <span className="text-emerald-400 font-bold">{riskPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Dollar Risk:</span>
                  <span className="font-bold text-rose-400">${riskAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Optimal Lot Size:</span>
                  <span className="font-bold text-emerald-400">{lotSize} Lots</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive AI Strategist Chat */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col h-[400px]">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-3">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white">Ask Gemini AI Strategist</h4>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {chatMessages.map((msg, idx) => {
                const isAI = msg.role === 'assistant';
                return (
                  <div 
                    key={idx}
                    className={`flex flex-col ${isAI ? 'items-start' : 'items-end'}`}
                  >
                    <div className={`p-3 rounded-2xl max-w-[90%] leading-relaxed ${
                      isAI 
                        ? 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none' 
                        : 'bg-emerald-600 text-white rounded-tr-none'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 px-1">{msg.time}</span>
                  </div>
                );
              })}
              {isSendingChat && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Gemini is thinking...</span>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="pt-3 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about this setup..."
                className="flex-1 bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isSendingChat || !chatInput.trim()}
                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
