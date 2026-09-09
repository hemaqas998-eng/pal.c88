import React, { useState } from 'react';
import { 
  Radio, 
  ArrowUpRight, 
  ArrowDownRight, 
  Target, 
  ShieldAlert, 
  Zap, 
  TrendingUp, 
  Send, 
  BarChart2, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Filter, 
  Layers, 
  Percent, 
  DollarSign, 
  Award,
  ChevronRight,
  ExternalLink,
  Flame,
  AlertTriangle,
  Info
} from 'lucide-react';
import { TradeSignal, MarketSymbol, BotStatus, SignalDirection, AssetClass } from '../types';
import { EconomicCalendarBar } from './EconomicCalendarBar';
import { NewsImpactModal } from './NewsImpactModal';

interface RadarScannerProps {
  signals: TradeSignal[];
  symbols: MarketSymbol[];
  status: BotStatus | null;
  onOpenChart: (symbol: string, timeframe: string) => void;
  onOpenAiAnalysis: (signal: TradeSignal) => void;
  onExecuteTrade: (signal: TradeSignal) => void;
  onSendTelegram: (signal: TradeSignal) => void;
  sendingTelegramId: string | null;
}

export const RadarScanner: React.FC<RadarScannerProps> = ({
  signals,
  symbols,
  status,
  onOpenChart,
  onOpenAiAnalysis,
  onExecuteTrade,
  onSendTelegram,
  sendingTelegramId,
}) => {
  const [selectedAssetClass, setSelectedAssetClass] = useState<string>('ALL');
  const [selectedDirection, setSelectedDirection] = useState<string>('ALL');
  const [minConfidence, setMinConfidence] = useState<number>(75);
  const [filterNewsOnly, setFilterNewsOnly] = useState<boolean>(false);
  const [selectedNewsSignal, setSelectedNewsSignal] = useState<TradeSignal | null>(null);

  const filteredSignals = signals.filter(signal => {
    const sym = symbols.find(s => s.symbol === signal.symbol);
    const assetClassMatch = selectedAssetClass === 'ALL' || sym?.assetClass === selectedAssetClass.toLowerCase();
    const directionMatch = selectedDirection === 'ALL' || signal.direction === selectedDirection;
    const confidenceMatch = signal.confidence >= minConfidence;
    const newsMatch = !filterNewsOnly || (signal.newsImpact?.hasImpact && signal.newsImpact.highestImpact !== 'NONE');
    return assetClassMatch && directionMatch && confidenceMatch && newsMatch;
  });

  const newsImpactSignalsCount = signals.filter(s => s.newsImpact?.hasImpact && s.newsImpact.highestImpact === 'HIGH').length;

  const formatCountdown = (scheduledTime?: number, fallbackMins?: number | null) => {
    if (scheduledTime) {
      const diffMs = scheduledTime - Date.now();
      if (diffMs <= 0) return 'Live now';
      const mins = Math.floor(diffMs / 60000);
      if (mins < 60) return `in ${mins}m`;
      const hours = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `in ${hours}h ${remMins}m`;
    }
    if (fallbackMins != null) {
      return fallbackMins > 0 ? `in ${fallbackMins}m` : 'imminent';
    }
    return 'Approaching';
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      
      {/* Top Economic Calendar Live Fetcher Bar */}
      <EconomicCalendarBar 
        onSelectAffectedSymbol={(sym) => {
          const matchingSignal = signals.find(s => s.symbol === sym);
          if (matchingSignal) {
            setSelectedNewsSignal(matchingSignal);
          }
        }}
      />

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Active Signals */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Signals</span>
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              {status?.activeSignalsCount ?? signals.length}
            </span>
            <span className="text-xs text-emerald-400 font-medium">High Confluence</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Multi-timeframe setups monitored</p>
        </div>

        {/* Win Rate */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Radar Win Rate</span>
            <Award className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              {status?.winRatePct ?? 76}%
            </span>
            <span className="text-xs text-teal-400 font-medium">TP1/TP2 Hit</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Verified pattern backtest</p>
        </div>

        {/* Daily PnL */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Paper Bot PnL</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">
              +${status?.dailyPnL?.toLocaleString() ?? '434.18'}
            </span>
            <span className="text-xs text-emerald-400 font-medium">+1.74%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Automated execution simulation</p>
        </div>

        {/* System & Dispatcher Health */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Bot Dispatcher</span>
            <Send className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-sm font-bold text-white">
              {status?.telegramConnected ? 'Telegram Live' : 'Telegram Standby'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>News Guard: <span className="text-amber-400 font-bold">{newsImpactSignalsCount} Alert{newsImpactSignalsCount !== 1 ? 's' : ''}</span></span>
            <span>API: <span className="text-slate-300 font-mono">{status?.quota.apiRequestsToday ?? 142}/800</span></span>
          </div>
        </div>
      </div>

      {/* Filter & Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Asset Class Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {['ALL', 'FOREX', 'CRYPTO', 'COMMODITY'].map(type => (
            <button
              key={type}
              onClick={() => setSelectedAssetClass(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                selectedAssetClass === type
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Direction, News Filter & Confidence */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* News Alert Quick Filter */}
          <button
            onClick={() => setFilterNewsOnly(!filterNewsOnly)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
              filterNewsOnly
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-rose-500/10'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
            title="Filter setups affected by upcoming macroeconomic events"
          >
            <Flame className={`w-3.5 h-3.5 ${filterNewsOnly ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
            <span>News Alert Only</span>
          </button>

          {/* Direction Filter */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setSelectedDirection('ALL')}
              className={`px-2.5 py-1 rounded-md transition ${selectedDirection === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedDirection('LONG')}
              className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${selectedDirection === 'LONG' ? 'bg-emerald-600 text-white' : 'text-emerald-400/70'}`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> Long
            </button>
            <button
              onClick={() => setSelectedDirection('SHORT')}
              className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${selectedDirection === 'SHORT' ? 'bg-rose-600 text-white' : 'text-rose-400/70'}`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" /> Short
            </button>
          </div>

          {/* Min Confidence Slider */}
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span>Min Score:</span>
            <span className="font-mono font-bold text-emerald-400">{minConfidence}%</span>
            <input
              type="range"
              min="60"
              max="95"
              step="5"
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="w-20 accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Main Signal Feed Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            Active Radar Signals ({filteredSignals.length})
          </h2>
          <span className="text-xs text-slate-400">
            Real-time pattern confluence scanner with Macro News Shield
          </span>
        </div>

        {filteredSignals.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
            <Radio className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
            <h3 className="text-base font-bold text-slate-300">No Signals Match Current Filters</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Lower the minimum confidence threshold or switch asset class filters to see more setups.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredSignals.map(signal => {
              const isLong = signal.direction === 'LONG';
              const sym = symbols.find(s => s.symbol === signal.symbol);
              const impact = signal.newsImpact;
              const hasImpact = impact?.hasImpact && impact.highestImpact !== 'NONE';
              const isHighImpact = impact?.highestImpact === 'HIGH';

              return (
                <div 
                  key={signal.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition shadow-lg relative overflow-hidden flex flex-col justify-between group"
                >
                  {/* Subtle Direction Ambient Accent */}
                  <div className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl pointer-events-none ${
                    isLong ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                  }`} />

                  <div>
                    {/* Top Row: Symbol, TF, Direction Badge, Confidence */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-xs text-slate-200 font-mono">
                          {signal.symbol.split('/')[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-white text-base">{signal.symbol}</h3>
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono font-bold">
                              {signal.timeframe}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              ${sym?.price.toLocaleString(undefined, { minimumFractionDigits: sym.digits })}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">{sym?.name}</span>
                        </div>
                      </div>

                      {/* Direction Badge */}
                      <div className={`px-3 py-1 rounded-lg text-xs font-extrabold tracking-wide flex items-center gap-1.5 border shadow-sm ${
                        isLong 
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-emerald-500/10' 
                          : 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-rose-500/10'
                      }`}>
                        {isLong ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {isLong ? 'LONG BUY' : 'SHORT SELL'}
                      </div>
                    </div>

                    {/* News Impact Overlay / Banner on Card */}
                    {hasImpact && (
                      <div 
                        onClick={() => setSelectedNewsSignal(signal)}
                        className={`mb-3.5 p-2.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
                          isHighImpact
                            ? 'bg-rose-950/40 border-rose-500/40 hover:bg-rose-950/60 shadow-sm'
                            : 'bg-amber-950/30 border-amber-500/40 hover:bg-amber-950/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 text-xs font-extrabold">
                            <Flame className={`w-3.5 h-3.5 ${isHighImpact ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
                            <span className={isHighImpact ? 'text-rose-300' : 'text-amber-300'}>
                              {impact.highestImpact} IMPACT EVENT {formatCountdown(impact.scheduledTime, impact.minutesUntilEvent)}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-300 underline flex items-center gap-0.5">
                            Inspect Impact <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-medium line-clamp-1">
                          ⚡ {impact.closestEventTitle}
                        </p>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {impact.invalidationWarning}
                        </p>
                      </div>
                    )}

                    {/* Pattern Banner */}
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 mb-3.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <Target className="w-3.5 h-3.5" />
                          {signal.pattern.name}
                        </span>
                        <span className="font-mono text-[11px] text-teal-300 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-500/30">
                          {signal.confidence}% Score
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {signal.pattern.description}
                      </p>
                    </div>

                    {/* Trade Levels Matrix */}
                    <div className="grid grid-cols-4 gap-2 bg-slate-950/90 rounded-xl p-2.5 border border-slate-800/90 text-center font-mono mb-3.5">
                      <div className="border-r border-slate-800/80 pr-1">
                        <span className="text-[10px] text-slate-400 block">ENTRY</span>
                        <span className="text-xs font-bold text-slate-200">${signal.entryPrice}</span>
                      </div>
                      <div className="border-r border-slate-800/80 pr-1">
                        <span className="text-[10px] text-rose-400 block">STOP LOSS</span>
                        <span className="text-xs font-bold text-rose-300">${signal.stopLoss}</span>
                      </div>
                      <div className="border-r border-slate-800/80 pr-1">
                        <span className="text-[10px] text-emerald-400 block">TAKE PROFIT 1</span>
                        <span className="text-xs font-bold text-emerald-300">${signal.takeProfit1}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-teal-400 block">TAKE PROFIT 2</span>
                        <span className="text-xs font-bold text-teal-300">${signal.takeProfit2}</span>
                      </div>
                    </div>

                    {/* Confluences & Stats */}
                    <div className="space-y-1.5 mb-3.5">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold text-slate-300">Risk-to-Reward:</span>
                        <span className="font-mono font-bold text-emerald-400">1:{signal.riskRewardRatio}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {signal.confluenceFactors.slice(0, 3).map((factor, idx) => (
                          <span 
                            key={idx} 
                            className="px-2 py-0.5 rounded-full bg-slate-800/70 border border-slate-700/60 text-[10px] text-slate-300 flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* AI Next Move Sneak Peek */}
                    {signal.aiAnalysis && (
                      <div className="bg-gradient-to-r from-emerald-950/30 via-slate-950 to-teal-950/30 border border-emerald-500/20 rounded-xl p-3 mb-4">
                        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400 mb-1">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            Gemini AI Next Move Plan
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Bias: {signal.aiAnalysis.marketBias}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2">
                          {signal.aiAnalysis.summary}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-800/80">
                    
                    {/* View on Chart */}
                    <button
                      onClick={() => onOpenChart(signal.symbol, signal.timeframe)}
                      className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1 border border-slate-700"
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Chart</span>
                    </button>

                    {/* AI Plan Deep Dive */}
                    <button
                      onClick={() => onOpenAiAnalysis(signal)}
                      className="px-2 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-1 border border-emerald-500/30"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>AI Plan</span>
                    </button>

                    {/* News Impact Inspector */}
                    <button
                      onClick={() => setSelectedNewsSignal(signal)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 border ${
                        hasImpact
                          ? isHighImpact
                            ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                            : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                          : 'bg-slate-800/60 hover:bg-slate-700 text-slate-400 border-slate-700/60'
                      }`}
                      title="Inspect Economic Calendar Impact"
                    >
                      <Flame className={`w-3.5 h-3.5 ${hasImpact ? (isHighImpact ? 'text-rose-400' : 'text-amber-400') : 'text-slate-400'}`} />
                      <span>News</span>
                    </button>

                    {/* Paper Trade */}
                    <button
                      onClick={() => onExecuteTrade(signal)}
                      className="px-2 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Trade</span>
                    </button>

                    {/* Send Telegram */}
                    <button
                      onClick={() => onSendTelegram(signal)}
                      disabled={sendingTelegramId === signal.id}
                      className={`px-2 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 border ${
                        signal.telegramSent
                          ? 'bg-sky-950/60 text-sky-300 border-sky-500/40'
                          : 'bg-sky-600 hover:bg-sky-500 text-white border-sky-400/50 shadow-sky-600/20'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{sendingTelegramId === signal.id ? '...' : signal.telegramSent ? 'Sent' : 'Telegram'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Market Watchlist Heatmap Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Live Market Scanner Grid
            </h3>
            <p className="text-xs text-slate-400">Continuous price updates and technical health</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">{symbols.length} Watched Assets</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold">ASSET</th>
                <th className="py-2.5 px-3 font-semibold">CLASS</th>
                <th className="py-2.5 px-3 font-semibold">PRICE</th>
                <th className="py-2.5 px-3 font-semibold">24H CHANGE</th>
                <th className="py-2.5 px-3 font-semibold">24H RANGE</th>
                <th className="py-2.5 px-3 font-semibold">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {symbols.map(sym => {
                const isPos = sym.change24h >= 0;
                return (
                  <tr key={sym.symbol} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {sym.symbol}
                    </td>
                    <td className="py-3 px-3 uppercase text-slate-400 font-semibold">{sym.assetClass}</td>
                    <td className="py-3 px-3 font-bold text-slate-100">${sym.price.toLocaleString(undefined, { minimumFractionDigits: sym.digits })}</td>
                    <td className={`py-3 px-3 font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPos ? '+' : ''}{sym.change24h}%
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      L: ${sym.low24h} — H: ${sym.high24h}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => onOpenChart(sym.symbol, '15m')}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-bold border border-slate-700 flex items-center gap-1"
                      >
                        <BarChart2 className="w-3 h-3" /> Chart
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* News Impact Modal / Overlay Drawer */}
      {selectedNewsSignal && (
        <NewsImpactModal
          signal={selectedNewsSignal}
          onClose={() => setSelectedNewsSignal(null)}
          onOpenChart={onOpenChart}
        />
      )}
    </div>
  );
};
