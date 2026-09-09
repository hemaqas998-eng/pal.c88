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
  Maximize2
} from 'lucide-react';
import { 
  MarketSymbol, 
  RadarSignal, 
  PaperTrade, 
  BotStatus, 
  GeminiMasterScreenedTrade, 
  GeminiMasterScreenerFilter,
  GeminiMasterScreenerResult 
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

  // Active View Mode: Unified 3-in-1 Master Center or Deep AI Next Move
  const [activeView, setActiveView] = useState<'unified-engine' | 'next-move'>('unified-engine');

  // Screener Filters & State
  const [filters, setFilters] = useState<GeminiMasterScreenerFilter>({
    minWinRate: 75,
    minConfidence: 78,
    minRR: 1.5,
    assetClass: 'ALL',
    timeframe: 'ALL',
    min10xScore: 8.0,
    searchQuery: ''
  });

  const [screenerResult, setScreenerResult] = useState<GeminiMasterScreenerResult | null>(null);
  const [isRunningUnifiedEngine, setIsRunningUnifiedEngine] = useState<boolean>(false);
  const [engineStepText, setEngineStepText] = useState<string>('');
  const [executingTradeId, setExecutingTradeId] = useState<string | null>(null);
  const [executionToast, setExecutionToast] = useState<string | null>(null);

  // Unified 3-in-1 Master Engine Trigger (فراز الصفقات الذكي + الماسح الفوري + الدعوم والمقاومات في زر واحد)
  const handleRunUnifiedEngine = async (customFilters?: GeminiMasterScreenerFilter) => {
    setIsRunningUnifiedEngine(true);
    setExecutionToast(null);
    setEngineStepText(language === 'ar' ? '1/3 جارٍ المسح الفوري وتتبع السيولة...' : '1/3 Running live instant scanner...');
    
    try {
      // Step 1: Trigger Live Instant Multi-Asset Scan
      await fetch('/api/radar/scan-now', { method: 'POST' }).catch(() => {});
      
      setEngineStepText(language === 'ar' ? '2/3 جارٍ حساب الدعوم والمقاومات وفرز الصفقات الذكية...' : '2/3 Computing S/R levels & smart screening...');
      
      // Step 2 & 3: Run Master AI Screener & Dynamic S/R Extraction
      const activeF = customFilters || filters;
      const res = await fetch('/api/ai/gemini-master-screener', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeF)
      });
      const data = await res.json();
      
      if (data && data.success) {
        setScreenerResult(data);
        onRefreshData();
      }
    } catch (err: any) {
      console.error('Failed to run Unified 3-in-1 Engine:', err);
    } finally {
      setIsRunningUnifiedEngine(false);
      setEngineStepText('');
    }
  };

  // Execute a screened trade directly into the live bot
  const handleExecuteScreenedTrade = async (trade: GeminiMasterScreenedTrade) => {
    setExecutingTradeId(trade.id);
    setExecutionToast(null);
    try {
      const res = await fetch('/api/radar/hunt-sniper-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: trade.symbol,
          direction: trade.direction,
          timeframe: trade.timeframe,
          rationale: `تنفيذ فوري عبر المحرك الموحد [${trade.strategyCategory}] مع حماية وقف الخسارة عند الدعوم/المقاومات`
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setExecutionToast(data.message || `✅ تم تفعيل صفقة ${trade.symbol} (${trade.direction}) بنجاح في البوت الآلي!`);
        onRefreshData();
        // Update trade status locally
        if (screenerResult) {
          setScreenerResult({
            ...screenerResult,
            screenedTrades: screenerResult.screenedTrades.map(t => 
              t.id === trade.id ? { ...t, status: 'EXECUTED' } : t
            )
          });
        }
      } else {
        setExecutionToast(data.message || 'تعذر تنفيذ الصفقة');
      }
    } catch (err: any) {
      setExecutionToast(`خطأ في التنفيذ: ${err.message}`);
    } finally {
      setExecutingTradeId(null);
    }
  };

  // Initial load of unified engine
  useEffect(() => {
    handleRunUnifiedEngine();
  }, []);

  const filteredScreenedTrades = (screenerResult?.screenedTrades || []).filter(t => {
    if (filters.assetClass && filters.assetClass !== 'ALL') {
      const symObj = symbols.find(s => s.symbol === t.symbol);
      if (symObj && symObj.assetClass && symObj.assetClass.toUpperCase() !== filters.assetClass.toUpperCase()) return false;
    }
    if (filters.searchQuery) {
      const q = filters.searchQuery.toUpperCase();
      if (!t.symbol.toUpperCase().includes(q) && !t.strategyCategory.includes(q)) return false;
    }
    if (filters.minWinRate && t.winRatePct < filters.minWinRate) return false;
    if (filters.minRR && t.riskRewardRatio < filters.minRR) return false;
    if (filters.min10xScore && t.compound10xMultiplierScore < filters.min10xScore) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* UNIFIED 3-IN-1 MASTER ENGINE COMMAND HEADER (دمج الفراز والماسح والدعوم في زر واحد) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/20 to-teal-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                {language === 'ar' ? 'المحرك الذكي الموحد 3 في 1' : 'Unified 3-in-1 Master Engine'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                {language === 'ar' ? 'ماسح فوري • فراز ذكي • دعوم ومقاومات' : 'Scanner • Sorter • S/R Matrix'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                10x MULTIPLIER
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
              {language === 'ar' 
                ? 'المحرك الموحد الشامل: مسح فوري، استخراج الدعوم والمقاومات، وفرز الصفقات الذكية'
                : 'Unified Master Engine: Instant Scanner, S/R Matrix & Smart Trade Sorter'}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {language === 'ar'
                ? 'كتلة تحكم مدمجة واحدة تدمج الماسح اللحظي، احتساب مستويات الدعم والمقاومة الديناميكية، وفرز الصفقات عالية الدقة ذات أهداف 10x دون أي تكرار أو أزرار مشتتة.'
                : 'A single unified block integrating live instant scanning, dynamic support & resistance levels, and smart trade sorting with 10x compound acceleration into one cohesive command center.'}
            </p>
          </div>

          {/* THE SINGLE MASTER UNIFIED 3-IN-1 ACTION BUTTON */}
          <div className="shrink-0 flex flex-col gap-2.5 min-w-[280px]">
            <button
              id="unified-master-3in1-action-btn"
              onClick={() => handleRunUnifiedEngine()}
              disabled={isRunningUnifiedEngine}
              className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-teal-600 to-emerald-600 hover:from-indigo-500 hover:via-teal-500 hover:to-emerald-500 text-white font-black text-sm shadow-2xl shadow-indigo-600/40 border border-indigo-400/40 flex items-center justify-center gap-2.5 transition transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
            >
              <Sparkles className={`w-4 h-4 text-cyan-200 ${isRunningUnifiedEngine ? 'animate-spin' : ''}`} />
              <div className="text-center">
                <div className="text-sm font-black">
                  {isRunningUnifiedEngine 
                    ? (engineStepText || (language === 'ar' ? 'جارٍ الفحص والفرز...' : 'Running Unified Engine...')) 
                    : (language === 'ar' ? '⚡ فحص وفرز شامل (3 في 1)' : '⚡ Run Unified Engine (3-in-1)')}
                </div>
                {!isRunningUnifiedEngine && (
                  <div className="text-[10px] text-cyan-200 font-mono font-normal mt-0.5">
                    {language === 'ar' ? 'مسح فوري + فرز ذكي + دعوم ومقاومات' : 'Instant Scan + Smart Sorter + S/R'}
                  </div>
                )}
              </div>
            </button>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
              <span>{language === 'ar' ? 'الأصول المفحوصة:' : 'Scanned Assets:'} <strong className="text-emerald-400">{symbols.length} Pairs</strong></span>
              <span>{language === 'ar' ? 'رأس المال:' : 'Wallet:'} <strong className="text-cyan-300">${accountBalance}.00</strong></span>
            </div>
          </div>
        </div>

        {/* Executive AI Synthesis Banner */}
        {screenerResult && (
          <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="text-slate-400 flex items-center gap-1.5 mb-1">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span>{language === 'ar' ? 'نظام السوق والسيولة الكلية:' : 'Macro Regime:'}</span>
              </div>
              <div className="font-bold text-indigo-300 text-sm">{screenerResult.macroRegime}</div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="text-slate-400 flex items-center gap-1.5 mb-1">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'ar' ? 'الصفقات الممسوحة والمفروزة:' : 'Screened Setups:'}</span>
              </div>
              <div className="font-bold text-emerald-400 text-sm">
                {filteredScreenedTrades.length} {language === 'ar' ? 'فرصة مطابقة' : 'Valid Setups'} (10x Potential)
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="text-slate-400 flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>{language === 'ar' ? 'حالة محرك البوت التلقائي:' : 'Live Bot Status:'}</span>
              </div>
              <div className="font-bold text-teal-300 text-sm truncate">{screenerResult.automatedBotStatus}</div>
            </div>
          </div>
        )}

        {/* Live Executive Summary Briefing */}
        {screenerResult?.geminiExecutiveSummary && (
          <div className="mt-3 bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-3.5 text-xs text-indigo-200 leading-relaxed font-sans">
            <span className="font-bold text-indigo-400 flex items-center gap-1.5 mb-1">
              <Bot className="w-3.5 h-3.5" />
              {language === 'ar' ? 'توجيه القائد الآلي لـ Gemini:' : 'Gemini Executive Briefing:'}
            </span>
            {screenerResult.geminiExecutiveSummary}
          </div>
        )}
      </div>

      {/* Execution Toast Alert */}
      {executionToast && (
        <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-mono flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{executionToast}</span>
          </div>
          <button 
            onClick={() => setExecutionToast(null)}
            className="text-slate-400 hover:text-white px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* CONSOLIDATED SUB-NAVIGATION TABS (بدون أزرار مكررة) */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('unified-engine')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeView === 'unified-engine'
                ? 'bg-gradient-to-r from-indigo-600 to-teal-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>{language === 'ar' ? 'صفقات الفحص والفرز الذكي' : 'Screened Setups & S/R'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/30 text-indigo-200 font-extrabold">
              {filteredScreenedTrades.length}
            </span>
          </button>

          <button
            onClick={() => setActiveView('next-move')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeView === 'next-move'
                ? 'bg-gradient-to-r from-indigo-600 to-teal-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'فاحص الحركة القادمة' : 'AI Next Move'}</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: UNIFIED 3-IN-1 SCREENED TRADES BLOCK WITH EMBEDDED SCANNER & S/R MATRIX */}
      {activeView === 'unified-engine' && (
        <div className="space-y-6">
          
          {/* Smart Filter Bar Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              
              {/* Asset Class Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'ALL', label: language === 'ar' ? 'الكل' : 'All' },
                  { id: 'CRYPTO', label: language === 'ar' ? 'العملات المشفرة' : 'Crypto' },
                  { id: 'FOREX', label: language === 'ar' ? 'العملات الأجنبية' : 'Forex' },
                  { id: 'COMMODITIES', label: language === 'ar' ? 'السلع والذهب' : 'Commodities' },
                  { id: 'INDICES', label: language === 'ar' ? 'المؤشرات' : 'Indices' },
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

              {/* Search Box */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={language === 'ar' ? 'ابحث عن زوج أو استراتيجية (e.g. XAU, SMC)...' : 'Search symbol or strategy...'}
                  value={filters.searchQuery || ''}
                  onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                  className="w-full bg-slate-950 text-white text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Range Sliders for Fine-Tuned Screening */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80 text-xs">
              <div>
                <div className="flex justify-between text-slate-400 font-mono mb-1">
                  <span>{language === 'ar' ? 'الحد الأدنى لنسبة الفوز:' : 'Min Win Rate:'}</span>
                  <strong className="text-emerald-400">{filters.minWinRate}%</strong>
                </div>
                <input
                  type="range"
                  min={70}
                  max={95}
                  value={filters.minWinRate || 75}
                  onChange={(e) => setFilters({ ...filters, minWinRate: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 font-mono mb-1">
                  <span>{language === 'ar' ? 'الحد الأدنى للعائد (R:R):' : 'Min Risk/Reward:'}</span>
                  <strong className="text-cyan-400">1:{filters.minRR}</strong>
                </div>
                <input
                  type="range"
                  min={1.5}
                  max={4.0}
                  step={0.1}
                  value={filters.minRR || 1.5}
                  onChange={(e) => setFilters({ ...filters, minRR: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-400 font-mono mb-1">
                  <span>{language === 'ar' ? 'نقاط هدف 10x (Compound Score):' : '10x Potential Score:'}</span>
                  <strong className="text-amber-400">{filters.min10xScore}/10</strong>
                </div>
                <input
                  type="range"
                  min={7.0}
                  max={9.5}
                  step={0.1}
                  value={filters.min10xScore || 8.0}
                  onChange={(e) => setFilters({ ...filters, min10xScore: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            </div>
          </div>

          {/* THE UNIFIED TRADES GRID (الكتلة الموحدة المتوافقة مع الصفقات) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
              <span className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>{language === 'ar' ? 'الصفقات الممسوحة والمفروزة الجاهزة للتنفيذ:' : 'Live Screened Setups Ready:'}</span>
                <strong className="text-white">{filteredScreenedTrades.length} Opportunities</strong>
              </span>
              <span className="text-emerald-400 font-bold">
                {language === 'ar' ? 'سقف المخاطرة: 0.02 لوت كحد أقصى' : 'Strict Max Cap: 0.02 lot'}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredScreenedTrades.map((trade) => {
                const isLong = trade.direction === 'LONG';
                const isExecuting = executingTradeId === trade.id;
                const isExecuted = trade.status === 'EXECUTED';
                const sr = trade.supportResistance;

                return (
                  <div 
                    key={trade.id}
                    className="bg-slate-900/95 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 sm:p-5 transition shadow-xl relative overflow-hidden group flex flex-col justify-between gap-4"
                  >
                    {/* Header Row: Symbol, Direction, Pattern & 10x Score */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${isLong ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'}`}>
                          {isLong ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white text-lg">{trade.symbol}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black font-mono ${isLong ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                              {trade.direction}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                              {trade.timeframe}
                            </span>
                          </div>
                          <div className="text-xs text-indigo-300 font-mono mt-0.5 flex items-center gap-1.5">
                            <Activity className="w-3 h-3 text-cyan-400" />
                            <span>{trade.strategyCategory.replace(/_/g, ' ')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <Flame className="w-4 h-4 text-amber-400" />
                          <span className="text-sm font-black text-amber-300 font-mono">{trade.compound10xMultiplierScore}/10</span>
                        </div>
                        <div className="text-[10px] font-mono text-emerald-400 font-bold">{trade.winRatePct}% Win Rate</div>
                      </div>
                    </div>

                    {/* SECTION 1: SMART TRADE SORTER MATRIX (فراز الصفقات الذكي) */}
                    <div className="grid grid-cols-4 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center font-mono text-xs">
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold">{language === 'ar' ? 'سعر الدخول' : 'Entry'}</div>
                        <div className="font-bold text-white">${trade.entryPrice.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold">{language === 'ar' ? 'وقف الخسارة' : 'Stop Loss'}</div>
                        <div className="font-bold text-rose-400">${trade.stopLoss.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold">{language === 'ar' ? 'الهدف TP1' : 'Target 1'}</div>
                        <div className="font-bold text-emerald-400">${trade.takeProfit1.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold">{language === 'ar' ? 'العائد R:R' : 'R:R'}</div>
                        <div className="font-bold text-cyan-300">1:{trade.riskRewardRatio}</div>
                      </div>
                    </div>

                    {/* SECTION 2: DYNAMIC SUPPORT & RESISTANCE BLOCK (الدعوم والمقاومة اللحظية المدمجة) */}
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                          <strong className="text-indigo-300">{language === 'ar' ? 'الدعوم والمقاومات اللحظية:' : 'Dynamic S/R Levels:'}</strong>
                        </span>
                        <span className="text-[10px] text-teal-400 font-bold">
                          {sr?.bias || (isLong ? 'BULLISH_BREAKOUT' : 'BEARISH_REVERSAL')}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                        <div className="bg-slate-900/90 border border-emerald-500/20 rounded-lg p-1.5">
                          <div className="text-[10px] text-emerald-400">{language === 'ar' ? 'الدعم S1' : 'Support S1'}</div>
                          <div className="font-bold text-emerald-300">
                            ${sr ? sr.support1.toLocaleString() : (trade.entryPrice * 0.992).toFixed(2)}
                          </div>
                        </div>

                        <div className="bg-slate-900/90 border border-slate-700 rounded-lg p-1.5">
                          <div className="text-[10px] text-slate-400">{language === 'ar' ? 'الارتكاز Pivot' : 'Pivot Point'}</div>
                          <div className="font-bold text-slate-200">
                            ${sr ? sr.pivot.toLocaleString() : trade.entryPrice.toLocaleString()}
                          </div>
                        </div>

                        <div className="bg-slate-900/90 border border-rose-500/20 rounded-lg p-1.5">
                          <div className="text-[10px] text-rose-400">{language === 'ar' ? 'المقاومة R1' : 'Resistance R1'}</div>
                          <div className="font-bold text-rose-300">
                            ${sr ? sr.resistance1.toLocaleString() : (trade.entryPrice * 1.008).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Liquidity Zone info */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-900">
                        <span>{language === 'ar' ? 'منطقة تجمع السيولة:' : 'Liquidity Sweep Zone:'}</span>
                        <span className="text-amber-300 font-bold">{sr?.majorLiquidityZone || `$${trade.stopLoss} - $${trade.entryPrice}`}</span>
                      </div>
                    </div>

                    {/* SECTION 3: INSTANT SCANNER CONFLUENCES & RATIONALE (الماسح الفوري) */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {trade.confluenceFactors.map((factor, fIdx) => (
                          <span key={fIdx} className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950/70 border border-indigo-500/30 text-indigo-200">
                            ✓ {factor}
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60 leading-relaxed font-sans">
                        {trade.rationaleArabic}
                      </p>
                    </div>

                    {/* ACTION BAR: EXECUTE IN BOT & DETAILS (زر تنفيذ واحد مباشر بدون تكرار) */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenChart(trade.symbol, trade.timeframe)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-semibold transition flex items-center gap-1.5"
                          title="عرض الشارت التفاعلي"
                        >
                          <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{language === 'ar' ? 'الشارت' : 'Chart'}</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            onSelectSymbol(trade.symbol);
                            setActiveView('next-move');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-mono font-semibold transition flex items-center gap-1.5"
                          title="تحليل الحركة القادمة"
                        >
                          <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{language === 'ar' ? 'فاحص الحركة' : 'Next Move'}</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleExecuteScreenedTrade(trade)}
                        disabled={isExecuting || isExecuted}
                        className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-lg ${
                          isExecuted
                            ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-500/50 cursor-default'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/50 shadow-emerald-600/30'
                        }`}
                      >
                        {isExecuting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>{language === 'ar' ? 'جارٍ التنفيذ...' : 'Executing...'}</span>
                          </>
                        ) : isExecuted ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{language === 'ar' ? 'مفعلة بالبوت 🟢' : 'Active in Bot 🟢'}</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 text-white" />
                            <span>{language === 'ar' ? '⚡ تنفيذ بالبوت' : '⚡ Execute in Bot'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: DEEP NEXT-MOVE INSPECTOR */}
      {activeView === 'next-move' && (
        <AiNextMoveView
          signals={signals}
          symbols={symbols}
          accountBalance={accountBalance}
        />
      )}
    </div>
  );
};
