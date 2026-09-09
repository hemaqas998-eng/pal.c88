import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  RefreshCw, 
  Zap, 
  Layers, 
  Target, 
  Compass, 
  AlertCircle,
  Activity,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Flame,
  Bot,
  Sliders,
  Play,
  Briefcase,
  Radio,
  BrainCircuit,
  MessageSquare,
  BarChart2,
  Maximize2,
  ShieldAlert,
  Cpu,
  Calculator,
  SlidersHorizontal
} from 'lucide-react';
import { 
  MarketSymbol, 
  RadarSignal, 
  PaperTrade, 
  BotStatus, 
  DualAiConsensusResult,
  TradeManagementEvaluation,
  GeminiMasterScreenerFilter
} from '../types';
import { useLanguage } from '../context/LanguageContext';
import { AiNextMoveView } from './AiNextMoveView';

interface GeminiMasterCenterProps {
  symbols: MarketSymbol[];
  signals: RadarSignal[];
  trades: PaperTrade[];
  status: BotStatus | null;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onOpenChart: (symbol: string, timeframe: string) => void;
  onRefreshData: () => void;
  accountBalance?: number;
  onOpenAiAnalysis?: (signal: RadarSignal) => void;
  onExecuteTrade?: (signal: RadarSignal) => void;
  onSendTelegram?: (signal: RadarSignal) => void;
  sendingTelegramId?: string | null;
}

export const GeminiMasterCenter: React.FC<GeminiMasterCenterProps> = ({
  symbols,
  signals,
  trades,
  status,
  selectedSymbol,
  onSelectSymbol,
  onOpenChart,
  onRefreshData,
  accountBalance = 50,
  onOpenAiAnalysis,
  onExecuteTrade,
  onSendTelegram,
  sendingTelegramId = null,
}) => {
  const { t, language } = useLanguage();

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<'dual-consensus' | 'trade-manager' | 'next-move'>('dual-consensus');

  // Filters & State
  const [filters, setFilters] = useState<GeminiMasterScreenerFilter>({
    minWinRate: 75,
    minConfidence: 78,
    minRR: 1.5,
    assetClass: 'ALL',
    timeframe: 'ALL',
    min10xScore: 8.0,
    searchQuery: ''
  });

  const [consensusList, setConsensusList] = useState<DualAiConsensusResult[]>([]);
  const [tradeEvaluations, setTradeEvaluations] = useState<TradeManagementEvaluation[]>([]);
  const [isLoadingConsensus, setIsLoadingConsensus] = useState<boolean>(false);
  const [evaluatingTrades, setEvaluatingTrades] = useState<boolean>(false);
  const [executingSymbol, setExecutingSymbol] = useState<string | null>(null);
  const [applyingProtectionId, setApplyingProtectionId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch Dual-AI Batch Screener
  const fetchDualAiBatch = async () => {
    setIsLoadingConsensus(true);
    setToastMessage(null);
    try {
      // Trigger scan first
      await fetch('/api/radar/scan-now', { method: 'POST' }).catch(() => {});
      
      const res = await fetch('/api/ai/dual-screen-all');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.results)) {
        setConsensusList(data.results);
      }
    } catch (err: any) {
      console.error('Failed to fetch Dual-AI batch:', err);
    } finally {
      setIsLoadingConsensus(false);
    }
  };

  // Fetch Active Trade Protections (Auto Break-Even & Trailing Stop)
  const fetchTradeProtections = async () => {
    setEvaluatingTrades(true);
    try {
      const res = await fetch('/api/ai/dual-manage-trades');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.evaluations)) {
        setTradeEvaluations(data.evaluations);
      }
    } catch (err: any) {
      console.error('Failed to fetch trade protections:', err);
    } finally {
      setEvaluatingTrades(false);
    }
  };

  // Execute Dual-AI Consensus Trade into live broker engine
  const handleExecuteConsensus = async (item: DualAiConsensusResult) => {
    if (item.consensusDirection === 'WAIT' || item.vetoCondition?.isVetoed) {
      setToastMessage(language === 'ar' ? '⚠️ لا يمكن تنفيذ صفقة معلقة أو محظورة لحماية رأس المال.' : 'Cannot execute vetoed trade.');
      return;
    }

    setExecutingSymbol(item.symbol);
    setToastMessage(null);
    try {
      const res = await fetch('/api/radar/hunt-sniper-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: item.symbol,
          direction: item.consensusDirection === 'BUY' ? 'LONG' : 'SHORT',
          timeframe: '15m',
          lotSize: item.synthesisPlan.suggestedLot,
          stopLoss: item.synthesisPlan.stopLoss,
          takeProfit1: item.synthesisPlan.takeProfit1,
          rationale: `تنفيذ ثنائي معتمد [Gemini + DeepSeek] EV: +${item.deepSeekAudit.expectedValueEV}R | تأمين الوقف عند: $${item.synthesisPlan.autoBreakEvenThreshold}`
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setToastMessage(language === 'ar' 
          ? `✅ تم تنفيذ صفقة ${item.symbol} (${item.consensusDirection}) بحجم ${item.synthesisPlan.suggestedLot} لوت وتفعيل حارس نقطة الدخول!`
          : `✅ Executed ${item.symbol} (${item.consensusDirection}) with ${item.synthesisPlan.suggestedLot} lot & Auto Break-Even armed!`);
        onRefreshData();
        fetchTradeProtections();
      } else {
        setToastMessage(data.message || 'تعذر تنفيذ الصفقة');
      }
    } catch (err: any) {
      setToastMessage(`خطأ في التنفيذ: ${err.message}`);
    } finally {
      setExecutingSymbol(null);
    }
  };

  // Apply Live Stop Loss Protection (Move to Break-Even / Trail Stop)
  const handleApplyProtection = async (evalItem: TradeManagementEvaluation) => {
    setApplyingProtectionId(evalItem.tradeId);
    try {
      const res = await fetch('/api/ai/dual-apply-protection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeId: evalItem.tradeId,
          proposedStopLoss: evalItem.proposedStopLoss,
          reason: evalItem.reasonArabic
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setToastMessage(data.message);
        onRefreshData();
        fetchTradeProtections();
      }
    } catch (err: any) {
      setToastMessage(`خطأ في تطبيق الحماية: ${err.message}`);
    } finally {
      setApplyingProtectionId(null);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchDualAiBatch();
    fetchTradeProtections();
  }, []);

  // Filtered Consensus List
  const filteredConsensus = consensusList.filter(item => {
    if (filters.searchQuery) {
      const q = filters.searchQuery.toUpperCase();
      if (!item.symbol.toUpperCase().includes(q)) return false;
    }
    if (filters.assetClass && filters.assetClass !== 'ALL') {
      const symObj = symbols.find(s => s.symbol === item.symbol);
      if (symObj && symObj.assetClass && symObj.assetClass.toUpperCase() !== filters.assetClass.toUpperCase()) return false;
    }
    return true;
  });

  const primeCount = consensusList.filter(c => c.consensusGrade === 'AAA_PRIME').length;
  const vetoCount = consensusList.filter(c => c.vetoCondition?.isVetoed).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. DUAL-AI MASTER COMMAND BANNER (Gemini + DeepSeek) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/20 to-teal-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                {language === 'ar' ? 'الذكاء الثنائي التكاملي (Gemini + DeepSeek)' : 'Dual-AI Synergistic Engine (Gemini + DeepSeek)'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                {language === 'ar' ? 'حلقة تدقيق مشتركة • صفر تعارض' : 'Cross-Verification Loop'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                {language === 'ar' ? 'تأمين نقطة الدخول (Auto Break-Even)' : 'Auto Break-Even Armed'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
              {language === 'ar' 
                ? 'مركز القيادة الثنائي: تدفق السيولة المؤسسية والتدقيق الرياضي الكمي'
                : 'Dual-AI Command Center: Institutional Liquidity & Quantitative Mathematical Audit'}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {language === 'ar'
                ? 'يعمل Gemini على قراءة الهيكل السعري والسيولة الذكية، بينما يقوم DeepSeek بإجراء المحاكاة الرياضية (+EV) واحتساب حجم العقد الآمن (0.01 - 0.02) مع تفعيل حظر الصفقات الضعيفة (Veto Protocol) لضمان حماية رأس المال.'
                : 'Gemini reads institutional liquidity and macro context, while DeepSeek validates mathematical edge (+EV) and strictly sizes positions (0.01 - 0.02 lot) with automatic veto protection.'}
            </p>
          </div>

          {/* MASTER TRIGGER BUTTON */}
          <div className="shrink-0 flex flex-col gap-2.5 min-w-[280px]">
            <button
              id="dual-ai-master-trigger-btn"
              onClick={() => {
                fetchDualAiBatch();
                fetchTradeProtections();
              }}
              disabled={isLoadingConsensus}
              className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-teal-600 to-emerald-600 hover:from-indigo-500 hover:via-teal-500 hover:to-emerald-500 text-white font-black text-sm shadow-2xl shadow-indigo-600/40 border border-indigo-400/40 flex items-center justify-center gap-2.5 transition transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
            >
              <Cpu className={`w-4 h-4 text-cyan-200 ${isLoadingConsensus ? 'animate-spin' : ''}`} />
              <div className="text-center">
                <div className="text-sm font-black">
                  {isLoadingConsensus 
                    ? (language === 'ar' ? 'جارٍ التدقيق والمطابقة الثنائية...' : 'Cross-Verifying Models...') 
                    : (language === 'ar' ? '⚡ فحص وتدقيق ثنائي فوري' : '⚡ Run Dual-AI Verification')}
                </div>
                {!isLoadingConsensus && (
                  <div className="text-[10px] text-cyan-200 font-mono font-normal mt-0.5">
                    {language === 'ar' ? 'Gemini Liquidity + DeepSeek Math' : 'Gemini Liquidity + DeepSeek Math'}
                  </div>
                )}
              </div>
            </button>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
              <span>{language === 'ar' ? 'فرص AAA Prime:' : 'AAA Prime:'} <strong className="text-emerald-400">{primeCount} Approved</strong></span>
              <span>{language === 'ar' ? 'محظورة بالأمان:' : 'Vetoed:'} <strong className="text-rose-400">{vetoCount} Protected</strong></span>
            </div>
          </div>
        </div>

        {/* Real-time Status Metric Chips */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              <span>{language === 'ar' ? 'نموذج Gemini:' : 'Gemini Engine:'}</span>
            </span>
            <span className="font-bold text-indigo-300">Gemini 2.5 Pro (SMC/Macro)</span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-teal-400" />
              <span>{language === 'ar' ? 'نموذج DeepSeek:' : 'DeepSeek Engine:'}</span>
            </span>
            <span className="font-bold text-teal-300">DeepSeek Math (+EV Audit)</span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'ar' ? 'حارس الصفقات الحية:' : 'Live Trade Shield:'}</span>
            </span>
            <span className="font-bold text-emerald-400">Auto Break-Even Active</span>
          </div>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-indigo-950/90 border border-indigo-500/50 text-indigo-200 text-xs font-mono flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* SUB-NAVIGATION TABS */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-3 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('dual-consensus')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'dual-consensus'
                ? 'bg-gradient-to-r from-indigo-600 to-teal-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-300" />
            <span>{language === 'ar' ? 'التوافق والفرص المعتمدة (AAA Prime)' : 'Dual-AI Consensus (AAA Prime)'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/30 text-indigo-200 font-extrabold">
              {filteredConsensus.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('trade-manager');
              fetchTradeProtections();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'trade-manager'
                ? 'bg-gradient-to-r from-indigo-600 to-teal-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'ar' ? 'حارس الصفقات الحية (Auto Break-Even)' : 'Live Trade Protections'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/30 text-emerald-200 font-extrabold">
              {trades.filter(t => t.status === 'OPEN').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('next-move')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'next-move'
                ? 'bg-gradient-to-r from-indigo-600 to-teal-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
            <span>{language === 'ar' ? 'فاحص الحركة القادمة' : 'AI Next Move'}</span>
          </button>
        </div>

        <button
          onClick={() => {
            fetchDualAiBatch();
            fetchTradeProtections();
          }}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
          title="تحديث البيانات"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingConsensus ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* TAB 1: DUAL-AI CONSENSUS CARDS */}
      {activeTab === 'dual-consensus' && (
        <div className="space-y-5">
          
          {/* Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'ALL', label: language === 'ar' ? 'الأصول القابلة للتداول' : 'Tradeable Assets' },
                { id: 'CRYPTO', label: language === 'ar' ? 'العملات الرقمية' : 'Crypto' },
                { id: 'FOREX', label: language === 'ar' ? 'الفوركس' : 'Forex' },
                { id: 'COMMODITIES', label: language === 'ar' ? 'الذهب والسلع' : 'Commodities' },
                { id: 'INDICES', label: language === 'ar' ? 'مؤشرات القوة (تحليل فقط 📊)' : 'Macro Gauges (Analysis Only)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilters({ ...filters, assetClass: tab.id as any })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    filters.assetClass === tab.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={language === 'ar' ? 'ابحث عن زوج (XAU, BTC, EUR)...' : 'Search symbol...'}
                value={filters.searchQuery || ''}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                className="w-full bg-slate-950 text-white text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Indices Macro Compass Banner */}
          {filters.assetClass === 'INDICES' && (
            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 flex items-start gap-3">
              <Compass className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div className="font-bold text-indigo-200">
                  {language === 'ar' 
                    ? '📊 بوصلة المؤشرات وسرد السيولة الكلية (تحليل القوة فقط)'
                    : '📊 Macro Indices & Relative Strength Gauges (Analysis Only)'}
                </div>
                <p className="text-slate-300 leading-relaxed font-sans">
                  {language === 'ar'
                    ? 'المؤشرات العالمية (DXY, US10Y, VIX, US30, US100, US500, GER40, UK100) تُستخدم حصرياً في النظام لقياس القوة النسبية للعملات وتحديد اتجاه شهية المخاطرة الكلية وتدفق السيولة. لا يقوم البوت بإرسال أو تنفيذ صفقات تداول مباشرة عليها لضمان أقصى درجات انضباط إدارة المخاطر.'
                    : 'Global indices are used strictly as reference barometers to calculate currency strength, intermarket correlations, and macro regimes. Automated trade execution is strictly disabled on indices.'}
                </p>
              </div>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredConsensus.map((item) => {
              const isBuy = item.consensusDirection === 'BUY';
              const isSell = item.consensusDirection === 'SELL';
              const isWait = item.consensusDirection === 'WAIT';
              const isVetoed = item.vetoCondition?.isVetoed;
              const isExecuting = executingSymbol === item.symbol;

              return (
                <div 
                  key={item.symbol}
                  className={`bg-slate-900/95 border rounded-2xl p-4 sm:p-5 transition shadow-xl relative overflow-hidden flex flex-col justify-between gap-4 ${
                    isVetoed
                      ? 'border-rose-500/40 bg-slate-950/90'
                      : item.consensusGrade === 'AAA_PRIME'
                        ? 'border-emerald-500/50 hover:border-emerald-400/80 shadow-emerald-500/5'
                        : 'border-slate-800 hover:border-indigo-500/50'
                  }`}
                >
                  {/* Top Header: Symbol & Grade */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${
                        isBuy ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                        isSell ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                        'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {isBuy ? <ArrowUpRight className="w-6 h-6" /> : isSell ? <ArrowDownRight className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-lg">{item.symbol}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black font-mono ${
                            isBuy ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            isSell ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                            'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {item.consensusDirection}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {language === 'ar' ? 'السعر الحالي:' : 'Price:'} <strong className="text-white">${item.synthesisPlan.entryPrice}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono border ${
                        isVetoed ? 'bg-rose-950/80 text-rose-300 border-rose-500/50' :
                        item.consensusGrade === 'AAA_PRIME' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50' :
                        item.consensusGrade === 'AA_HIGH_CONFLUENCE' ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50' :
                        'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {item.consensusGrade.replace(/_/g, ' ')}
                      </span>
                      <div className="text-[10px] font-mono text-cyan-400 font-bold mt-1">
                        {item.consensusScore}% {language === 'ar' ? 'درجة التوافق' : 'Confluence'}
                      </div>
                    </div>
                  </div>

                  {/* Dual-AI Analysis Side-by-Side Block */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    
                    {/* Gemini Column */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-indigo-500/20 space-y-1.5">
                      <div className="flex items-center justify-between text-indigo-300 font-bold text-[11px]">
                        <span className="flex items-center gap-1">
                          <Bot className="w-3 h-3 text-indigo-400" />
                          <span>Google Gemini</span>
                        </span>
                        <span className="text-[10px] text-indigo-400">{item.geminiInsight.bias}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-sans line-clamp-2 leading-relaxed">
                        {item.geminiInsight.executiveSummary}
                      </p>
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-900 flex justify-between">
                        <span>{language === 'ar' ? 'كتلة السيولة SMC:' : 'Liquidity Block:'}</span>
                        <strong className="text-indigo-300 truncate max-w-[120px]">{item.geminiInsight.liquidityZone || 'Active OB'}</strong>
                      </div>
                    </div>

                    {/* DeepSeek Column */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-teal-500/20 space-y-1.5">
                      <div className="flex items-center justify-between text-teal-300 font-bold text-[11px]">
                        <span className="flex items-center gap-1">
                          <Calculator className="w-3 h-3 text-teal-400" />
                          <span>DeepSeek Math</span>
                        </span>
                        <span className="text-[10px] text-teal-400">+EV = {item.deepSeekAudit.expectedValueEV}R</span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-sans line-clamp-2 leading-relaxed">
                        {item.deepSeekAudit.reasoningReport}
                      </p>
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-900 flex justify-between">
                        <span>{language === 'ar' ? 'حجم كيلي الآمن:' : 'Kelly Lot:'}</span>
                        <strong className="text-emerald-400">{item.synthesisPlan.suggestedLot} Lot (Strict)</strong>
                      </div>
                    </div>
                  </div>

                  {/* S/R & Trade Setup Matrix */}
                  <div className="grid grid-cols-4 gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center font-mono text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500">{language === 'ar' ? 'الدخول' : 'Entry'}</div>
                      <div className="font-bold text-white">${item.synthesisPlan.entryPrice}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">{language === 'ar' ? 'الوقف SL' : 'Stop Loss'}</div>
                      <div className="font-bold text-rose-400">${item.synthesisPlan.stopLoss}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">{language === 'ar' ? 'الهدف TP1' : 'Target 1'}</div>
                      <div className="font-bold text-emerald-400">${item.synthesisPlan.takeProfit1}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">{language === 'ar' ? 'العائد R:R' : 'R:R'}</div>
                      <div className="font-bold text-cyan-300">1:{item.synthesisPlan.riskRewardRatio}</div>
                    </div>
                  </div>

                  {/* Auto Break-Even & Pullback Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono px-1">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'تأمين الوقف للدخول عند:' : 'Auto Break-Even at:'} <strong>${item.synthesisPlan.autoBreakEvenThreshold}</strong></span>
                    </span>

                    {item.synthesisPlan.limitPullbackEntry && (
                      <span className="text-amber-300 flex items-center gap-1">
                        <Target className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? 'أمر معلق مقترح (Limit):' : 'Suggested Limit:'} <strong>${item.synthesisPlan.limitPullbackEntry}</strong></span>
                      </span>
                    )}
                  </div>

                  {/* Arabic Synthesis Briefing */}
                  <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 font-sans leading-relaxed">
                    {item.synthesisPlan.arabicSynthesisSummary}
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => onOpenChart(item.symbol, '15m')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-semibold transition flex items-center gap-1.5"
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{language === 'ar' ? 'الشارت' : 'Chart'}</span>
                    </button>

                    <button
                      onClick={() => handleExecuteConsensus(item)}
                      disabled={isExecuting || isWait || isVetoed}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-lg ${
                        isVetoed || isWait
                          ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/50 shadow-emerald-600/30'
                      }`}
                    >
                      {isExecuting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{language === 'ar' ? 'جارٍ التنفيذ...' : 'Executing...'}</span>
                        </>
                      ) : isVetoed ? (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                          <span>{language === 'ar' ? 'محظورة بالأمان 🛡️' : 'Vetoed by AI 🛡️'}</span>
                        </>
                      ) : isWait ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'في انتظار التوافق' : 'Awaiting Confluence'}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 text-white" />
                          <span>{language === 'ar' ? '⚡ تنفيذ فوري للبروكر' : '⚡ Execute in Broker'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: LIVE TRADE PROTECTIONS (Auto Break-Even & ATR Trailing Stop) */}
      {activeTab === 'trade-manager' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{language === 'ar' ? 'حارس الصفقات الحية وإدارة المخاطر المشتركة' : 'Dual-AI Live Trade Protection Monitor'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'ar' 
                  ? 'يقوم محرك الذكاء الاصطناعي بمراقبة الصفقات المفتوحة ونقل وقف الخسارة إلى سعر الدخول تلقائياً (Zero Risk) وتفعيل الوقف المتحرك لحجز الأرباح.'
                  : 'Monitors open positions in real time to lock in profits and automatically move stop-loss to break-even.'}
              </p>
            </div>

            <button
              onClick={fetchTradeProtections}
              disabled={evaluatingTrades}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${evaluatingTrades ? 'animate-spin' : ''}`} />
              <span>{language === 'ar' ? 'فحص الصفقات الآن' : 'Evaluate Open Trades'}</span>
            </button>
          </div>

          {tradeEvaluations.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="text-sm font-bold text-slate-200">
                {language === 'ar' ? 'لا توجد صفقات مفتوحة بحاجة لتعديل حالياً' : 'All active trades are fully protected.'}
              </div>
              <p className="text-xs text-slate-500">
                {language === 'ar' ? 'حارس الأمان يراقب السوق باستمرار وسيقوم بتأمين أي صفقة فور وصولها إلى 50% من الهدف.' : 'The engine is actively tracking price action.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tradeEvaluations.map((evalItem) => {
                const isApplying = applyingProtectionId === evalItem.tradeId;

                return (
                  <div 
                    key={evalItem.tradeId}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">{evalItem.symbol}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          evalItem.direction === 'BUY' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {evalItem.direction}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        {language === 'ar' ? 'سعر الدخول:' : 'Entry:'} <strong className="text-white">${evalItem.entryPrice}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-xs font-mono">
                      <div>
                        <div className="text-[10px] text-slate-500">{language === 'ar' ? 'الوقف الحالي' : 'Current SL'}</div>
                        <div className="font-bold text-rose-400">${evalItem.originalStopLoss}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-emerald-400">{language === 'ar' ? 'الوقف المقترح المحمي' : 'Proposed Protected SL'}</div>
                        <div className="font-bold text-emerald-300">${evalItem.proposedStopLoss}</div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60 leading-relaxed font-sans">
                      {evalItem.reasonArabic}
                    </p>

                    <button
                      onClick={() => handleApplyProtection(evalItem)}
                      disabled={isApplying || evalItem.actionRequired === 'HOLD_CURRENT'}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                        evalItem.actionRequired === 'HOLD_CURRENT'
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/30'
                      }`}
                    >
                      {isApplying ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{language === 'ar' ? 'جارٍ تطبيق الحماية...' : 'Applying Protection...'}</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'تطبيق تأمين الوقف فوراً' : 'Apply Stop Protection Now'}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AI NEXT MOVE INSPECTOR */}
      {activeTab === 'next-move' && (
        <AiNextMoveView
          signals={signals}
          symbols={symbols}
          accountBalance={accountBalance}
        />
      )}
    </div>
  );
};
