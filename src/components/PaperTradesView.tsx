import React, { useState } from 'react';
import { 
  Briefcase, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Percent, 
  Clock, 
  Award,
  AlertCircle,
  X,
  Download,
  ShieldCheck,
  Zap,
  Activity,
  LineChart as LineChartIcon,
  RotateCcw
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { PaperTrade, BotStatus } from '../types';

interface PaperTradesViewProps {
  trades: PaperTrade[];
  status: BotStatus | null;
  onCloseTrade: (tradeId: string) => void;
  onResetAccount?: () => void;
}

export const PaperTradesView: React.FC<PaperTradesViewProps> = ({
  trades,
  status,
  onCloseTrade,
  onResetAccount
}) => {
  const [activeTab, setActiveTab] = useState<'OPEN' | 'CLOSED' | 'EQUITY'>('OPEN');
  const [isResetting, setIsResetting] = useState(false);

  const openTrades = trades.filter(t => t.status === 'OPEN');
  const closedTrades = trades.filter(t => t.status === 'CLOSED');

  const baseCapital = status?.accountBalance || 50;
  const targetMultiplier = status?.dailyProfitTargetMultiplier || 10;
  const targetUSD = status?.dailyProfitTargetUSD || (baseCapital * targetMultiplier);
  const totalPnL = +trades.reduce((acc, t) => acc + (t.status === 'CLOSED' ? t.pnl : 0), 0).toFixed(2);
  const openPnL = +openTrades.reduce((acc, t) => acc + t.pnl, 0).toFixed(2);
  const currentNetGain = totalPnL + openPnL;
  const targetProgressPct = Math.min(100, Math.max(0, +((Math.max(0, currentNetGain) / targetUSD) * 100).toFixed(1)));
  const winningTrades = closedTrades.filter(t => t.pnl > 0);
  const winRate = closedTrades.length > 0 ? Math.round((winningTrades.length / closedTrades.length) * 100) : 100;

  // Build Equity Growth Curve dataset
  let runningEquity = baseCapital;
  const equityData = [
    { time: 'Start', equity: baseCapital, pnl: 0 },
    ...trades.slice().reverse().map((t, idx) => {
      runningEquity += t.pnl;
      return {
        time: `Trade #${idx + 1}`,
        equity: +runningEquity.toFixed(2),
        pnl: t.pnl,
        symbol: t.symbol,
      };
    })
  ];

  const handleResetTrades = async () => {
    if (!window.confirm('Are you sure you want to reset the paper trading account to $50.00 and clear previous trades?')) return;
    setIsResetting(true);
    try {
      await fetch('/api/paper/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startingBalance: 50 })
      });
      if (onResetAccount) onResetAccount();
      window.location.reload();
    } catch (err) {
      console.error('Failed to reset paper account:', err);
    } finally {
      setIsResetting(false);
    }
  };

  // CSV Export Function
  const handleExportCSV = () => {
    if (trades.length === 0) return;
    const headers = ['Trade ID', 'Symbol', 'Direction', 'Lot Size', 'Entry Price', 'Current/Exit Price', 'Stop Loss', 'Take Profit 1', 'Status', 'PnL ($)', 'PnL (%)', 'Opened At', 'Close Reason'];
    const rows = trades.map(t => [
      t.id,
      t.symbol,
      t.direction,
      t.lotSize,
      t.entryPrice,
      t.currentPrice,
      t.stopLoss,
      t.takeProfit1,
      t.status,
      t.pnl,
      t.pnlPercentage,
      new Date(t.openedAt).toISOString(),
      t.closeReason || 'N/A'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MarketRadar_Trades_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      
      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Total Equity */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Account Equity</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-mono text-white">
            ${(baseCapital + totalPnL + openPnL).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-400 font-medium mt-1">Starting Capital: ${baseCapital.toFixed(2)}</p>
        </div>

        {/* Realized & Floating PnL */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Net PnL</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <div className={`text-xl sm:text-2xl lg:text-3xl font-extrabold font-mono ${(totalPnL + openPnL) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {(totalPnL + openPnL) >= 0 ? '+' : ''}${(totalPnL + openPnL).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Floating PnL: <span className="text-emerald-300 font-mono font-bold">{openPnL >= 0 ? '+' : ''}${openPnL}</span></p>
        </div>

        {/* Win Rate */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Win Rate</span>
            <Award className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-mono text-cyan-400">
            {winRate}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{winningTrades.length} Wins / {closedTrades.length} Closed</p>
        </div>

        {/* Active Open Positions */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">ATR Trailing</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-mono text-white">
            {openTrades.filter(t => t.trailingStopActive).length} / {openTrades.length}
          </div>
          <p className="text-[11px] text-emerald-400 mt-1 font-medium">Dynamic Profit Lock Active</p>
        </div>

        {/* Execution Quality & Slippage */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm col-span-1 xs:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Execution Quality</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-mono text-amber-300">
            {status?.metrics?.executionQuality?.fillEfficiencyPct || 94}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Avg Slippage: <span className="text-slate-200 font-mono font-bold">{status?.metrics?.executionQuality?.avgSlippagePoints || 0.2} pips</span>
          </p>
        </div>
      </div>

      {/* 10x Daily Profit Target & Compound Accelerator Card */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                10x Capital Daily Profit Accelerator (هدف مضاعفة رأس المال 10x)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                10x GOAL: ${targetUSD.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              المبلغ الرئيسي للمحفظة: <strong className="text-emerald-400 font-mono">${baseCapital.toFixed(2)}</strong> | هدف الأرباح اليومية: <strong className="text-emerald-300 font-mono">${targetUSD.toFixed(2)}</strong> (مضاعفة 10 أضعاف مع نظام الأمان وحماية الأرباح المتتالية)
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="text-[11px] uppercase font-mono text-slate-400">Current Daily Net</div>
              <div className={`text-xl sm:text-2xl font-black font-mono ${currentNetGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {currentNetGain >= 0 ? '+' : ''}${currentNetGain.toFixed(2)}
              </div>
            </div>
            <div className="h-10 w-px bg-slate-800 hidden sm:block" />
            <div className="text-right">
              <div className="text-[11px] uppercase font-mono text-slate-400">Goal Progress</div>
              <div className="text-xl sm:text-2xl font-black font-mono text-cyan-300">
                {targetProgressPct}%
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Progress Bar & Milestones */}
        <div className="mt-4 space-y-2">
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div 
              className="bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-400 h-full rounded-full transition-all duration-700 shadow-sm shadow-emerald-500/50"
              style={{ width: `${Math.max(3, targetProgressPct)}%` }}
            />
          </div>

          <div className="grid grid-cols-3 text-[11px] font-mono pt-1 text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${currentNetGain >= (baseCapital * 1) ? 'bg-emerald-400' : 'bg-slate-700'}`} />
              <span>Phase 1 (2x): ${(baseCapital * 2).toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${currentNetGain >= (baseCapital * 4) ? 'bg-emerald-400' : 'bg-slate-700'}`} />
              <span>Phase 2 (5x): ${(baseCapital * 5).toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-end gap-1.5 font-bold text-emerald-400">
              <span className={`w-2 h-2 rounded-full ${currentNetGain >= (baseCapital * 10) ? 'bg-emerald-400 animate-ping' : 'bg-slate-700'}`} />
              <span>10x Goal: ${(baseCapital * 10).toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Reset Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('OPEN')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'OPEN'
                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Open ({openTrades.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CLOSED')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'CLOSED'
                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>History ({closedTrades.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('EQUITY')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
              activeTab === 'EQUITY'
                ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <LineChartIcon className="w-3.5 h-3.5" />
            <span>Equity Curve</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleResetTrades}
            disabled={isResetting}
            className="px-3 sm:px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition"
            title="Reset Paper Account Balance to $50 and Clear Trade History"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset (${baseCapital})</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 sm:px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono font-bold flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Open Positions */}
      {activeTab === 'OPEN' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-400" />
                Live Active Positions ({openTrades.length})
              </h3>
              <p className="text-xs text-slate-400">Stop ديناميكي (ATR-based) يتحرك مع السعر لحماية الأرباح العائمة وتنبيه الانعكاس المبكر مفعل</p>
            </div>
          </div>

          {openTrades.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm font-mono">
              No open positions currently active. Automated bot will execute on next radar scan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="pb-3 pl-2">Asset</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Size</th>
                    <th className="pb-3">Entry & Slippage</th>
                    <th className="pb-3">Current</th>
                    <th className="pb-3">Dynamic ATR SL</th>
                    <th className="pb-3">Take Profit</th>
                    <th className="pb-3">Trailing Status</th>
                    <th className="pb-3">PnL ($)</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {openTrades.map((t) => {
                    const isLong = t.direction === 'LONG';
                    const isProfit = t.pnl >= 0;
                    return (
                      <tr key={t.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 pl-2 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isProfit ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                            <div>
                              <span>{t.symbol}</span>
                              {t.earlyInvalidation && (
                                <span className="block text-[9px] text-amber-400 font-bold bg-amber-500/10 px-1 rounded border border-amber-500/20 mt-0.5">
                                  ⚠️ {t.earlyInvalidation.reason}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            isLong ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                          }`}>
                            {t.direction}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-300">{t.lotSize}</td>
                        <td className="py-3.5">
                          <span className="text-slate-200 font-bold">${t.entryPrice}</span>
                          {t.slippagePoints !== undefined && (
                            <span className="block text-[10px] text-slate-400">
                              Slip: {t.slippagePoints}p ({t.executionQualityGrade || 'A'})
                            </span>
                          )}
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">${t.currentPrice}</span>
                            {t.isPriceFresh !== false ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" title="Real-time Atomic Tick">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                Fresh
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30" title="Staleness Guard: Calculations safely paused until fresh tick">
                                ⏸️ Sync
                              </span>
                            )}
                          </div>
                          {t.priceSource && (
                            <span className="block text-[9px] text-slate-500 font-mono mt-0.5">
                              {t.priceSource.replace('_WS', '').replace('_INTERBANK', '')}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5">
                          <span className="text-rose-400 font-bold">${t.stopLoss}</span>
                          {t.atr && (
                            <span className="block text-[10px] text-slate-500">
                              ATR: {t.atr.toFixed(2)} ({t.atrTrailingMultiplier || 1.5}x)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-emerald-400 font-bold">${t.takeProfit1}</td>
                        <td className="py-3.5">
                          {t.trailingStopActive ? (
                            <div>
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold">
                                ATR TRAIL LOCK
                              </span>
                              {t.lockedProfitUSD !== undefined && t.lockedProfitUSD > 0 && (
                                <span className="block text-[10px] text-emerald-400 mt-0.5">
                                  +${t.lockedProfitUSD} locked
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[10px]">ARMING (ATR)</span>
                          )}
                        </td>
                        <td className="py-3.5 font-bold">
                          <span className={isProfit ? 'text-emerald-400' : 'text-rose-400'}>
                            {isProfit ? '+' : ''}${t.pnl} ({isProfit ? '+' : ''}{t.pnlPercentage}%)
                          </span>
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          <button
                            onClick={() => onCloseTrade(t.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-[11px] font-bold transition"
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Closed Trades History */}
      {activeTab === 'CLOSED' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Executed Closed Trades ({closedTrades.length})
              </h3>
              <p className="text-xs text-slate-400">Audited execution ledger with automated risk triggers & slippage audit</p>
            </div>
          </div>

          {closedTrades.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm font-mono">
              No closed trades recorded in this session yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="pb-3 pl-2">Asset</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Entry & Slip</th>
                    <th className="pb-3">Exit Price</th>
                    <th className="pb-3">Exit Reason</th>
                    <th className="pb-3">Execution Grade</th>
                    <th className="pb-3">Realized PnL ($)</th>
                    <th className="pb-3">PnL (%)</th>
                    <th className="pb-3 text-right pr-2">Closed Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {closedTrades.map((t) => {
                    const isProfit = t.pnl >= 0;
                    return (
                      <tr key={t.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 pl-2 font-bold text-white">{t.symbol}</td>
                        <td className="py-3.5 font-bold">
                          <span className={t.direction === 'LONG' ? 'text-emerald-400' : 'text-rose-400'}>
                            {t.direction}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-300">
                          <span>${t.entryPrice}</span>
                          {t.slippagePoints !== undefined && (
                            <span className="block text-[10px] text-slate-500">{t.slippagePoints}p slip</span>
                          )}
                        </td>
                        <td className="py-3.5 text-white font-bold">${t.currentPrice}</td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.closeReason === 'TP1' || t.closeReason === 'TP2'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                              : t.closeReason === 'TRAILING_SL'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                              : t.closeReason === 'AUTO_CLOSE_ATR'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                          }`}>
                            {t.closeReason === 'TRAILING_SL' ? 'DYNAMIC ATR SL' : t.closeReason === 'AUTO_CLOSE_ATR' ? 'AUTO-CLOSE (ATR)' : (t.closeReason || 'MANUAL')}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            (t.executionQualityGrade || 'A').startsWith('A') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {t.executionQualityGrade || 'A'} ({t.executionLatencyMs || 65}ms)
                          </span>
                        </td>
                        <td className={`py-3.5 font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isProfit ? '+' : ''}${t.pnl}
                        </td>
                        <td className={`py-3.5 font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isProfit ? '+' : ''}{t.pnlPercentage}%
                        </td>
                        <td className="py-3.5 text-right pr-2 text-slate-400 text-[11px]">
                          {t.closedAt ? new Date(t.closedAt).toLocaleTimeString() : 'Just now'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Equity Growth Curve */}
      {activeTab === 'EQUITY' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Cumulative Portfolio Equity Curve
              </h3>
              <p className="text-xs text-slate-400">Visualizing capital growth trajectory and drawdowns over time.</p>
            </div>
            <div className="text-right font-mono">
              <span className="text-xs text-slate-400">Current Capital: </span>
              <strong className="text-emerald-400 text-sm">${(25000 + totalPnL).toFixed(2)}</strong>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis stroke="#64748b" domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#equityGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
};
