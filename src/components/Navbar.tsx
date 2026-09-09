import React from 'react';
import { 
  Bot, 
  Play, 
  Pause, 
  RefreshCw, 
  Send, 
  Volume2, 
  VolumeX, 
  Radio, 
  Activity, 
  BarChart2, 
  BrainCircuit, 
  Briefcase, 
  Settings as SettingsIcon,
  Sparkles,
  Terminal,
  Smartphone,
  Globe,
  GitCompare,
  Languages,
  Calculator,
  Clock,
  Cloud,
  Flame,
  Waves,
  Lock,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { BotStatus, MarketSymbol } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  status: BotStatus | null;
  symbols: MarketSymbol[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onToggleBot: () => void;
  onScanNow: () => void;
  isScanning: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onLock?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  status,
  symbols,
  activeTab,
  setActiveTab,
  onToggleBot,
  onScanNow,
  isScanning,
  soundEnabled,
  onToggleSound,
  onLock,
}) => {
  const { t, language, setLanguage, toggleLanguage } = useLanguage();
  const isRunning = status?.isRunning ?? true;

  const navTabs = [
    { id: 'gemini-master', label: language === 'ar' ? 'الذكاء الثنائي (Gemini + DeepSeek)' : 'Dual AI (Gemini + DeepSeek)', icon: Sparkles, badge: 'DUAL AI', count: status?.activeSignalsCount },
    { id: 'liquidity-heatmap', label: language === 'ar' ? 'خريطة السيولة' : 'Liquidity', icon: Waves, badge: 'LIQ' },
    { id: 'cloud-autonomy', label: language === 'ar' ? 'السحابة 24/7' : 'Cloud 24/7', icon: Cloud, badge: '24/7' },
    { id: 'quantitative', label: t('tabUnifiedQuant'), icon: Calculator, badge: 'QUANT' },
    { id: 'market-hours', label: t('tabMarketHours'), icon: Clock, badge: 'TIME' },
    { id: 'paper-trades', label: language === 'ar' ? 'محفظة البروكر الحية' : 'Live Broker Ledger', icon: Briefcase, count: status?.openTradesCount },
    { id: 'chart', label: t('tabChart'), icon: BarChart2 },
    { id: 'monitor', label: t('tabMonitor'), icon: Terminal, badge: 'LIVE' },
    { id: 'telegram-creator', label: t('tabTelegramCreator'), icon: Send, badge: 'TMA', dot: status?.telegramConnected },
    { id: 'settings', label: t('tabSettings'), icon: SettingsIcon },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50 w-full max-w-full overflow-hidden">
      {/* Ticker tape ribbon */}
      <div className="bg-slate-950/80 border-b border-slate-800/80 px-3 sm:px-4 py-1.5 overflow-x-auto no-scrollbar flex items-center gap-4 sm:gap-6 text-xs font-mono w-full max-w-full">
        <div className="flex items-center gap-2 text-emerald-400 font-bold shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          {t('liveFeeds')}
        </div>
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          {symbols.map(sym => {
            const isPos = sym.change24h >= 0;
            return (
              <div key={sym.symbol} className="flex items-center gap-2 px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800/50">
                <span className="font-semibold text-slate-300">{sym.symbol}</span>
                <span className="text-slate-100 font-bold">${sym.price.toLocaleString(undefined, { minimumFractionDigits: sym.digits })}</span>
                <span className={isPos ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                  {isPos ? '+' : ''}{sym.change24h}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          
          {/* Logo & Status */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-1 truncate">
                    {t('appTitle')} <span className="text-emerald-400 text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">v3.3</span>
                  </h1>
                </div>
                <p className="text-[10px] text-slate-400 hidden sm:block truncate">
                  {t('appSubtitle')}
                </p>
              </div>
            </div>

            {/* Live Bot Pulse Badge */}
            <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-800">
              <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
                isRunning 
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-500/20' 
                  : 'bg-amber-950/60 border-amber-500/40 text-amber-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {isRunning ? t('botActive') : t('botPaused')}
              </div>
              
              {isRunning && status?.nextScanSeconds !== undefined && (
                <span className="text-xs font-mono text-slate-400">
                  {language === 'ar' ? 'المسح خلال:' : 'Scan in:'} <span className="text-emerald-400 font-bold">{status.nextScanSeconds}s</span>
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Live Real / Paper Mode Badge Button */}
            <button
              onClick={() => setActiveTab('cloud-autonomy')}
              className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-slate-900 to-slate-800 hover:border-indigo-500/60 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700/80 shadow-sm"
              title={language === 'ar' ? 'إعدادات التداول الحقيقي والبروكر' : 'Live Broker & Real Trading Gateway'}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{language === 'ar' ? 'تداول حقيقي' : 'Live Broker'}</span>
            </button>

            {/* Language Switcher Button */}
            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700/80 shadow-sm hover:border-emerald-500/40"
              title={language === 'ar' ? 'Switch to English' : 'التحويل إلى اللغة العربية'}
            >
              <Languages className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold">{language === 'ar' ? '🇸🇦 عربي' : '🇬🇧 EN'}</span>
            </button>

            {/* Security Vault Lock Button */}
            {onLock && (
              <button
                onClick={onLock}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700/80 hover:border-rose-500/40 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                title={language === 'ar' ? 'قفل الخزنة والبيانات الشخصية' : 'Lock Security Vault'}
              >
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden lg:inline">{language === 'ar' ? 'قفل الخزنة' : 'Lock'}</span>
              </button>
            )}

            {/* Start / Pause Bot Toggle */}
            <button
              onClick={onToggleBot}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border shadow-sm ${
                isRunning
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/50 shadow-emerald-600/30'
              }`}
              title={isRunning ? t('pause') : t('start')}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{t('pause')}</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{t('start')}</span>
                </>
              )}
            </button>

            {/* Scan Now Button */}
            <button
              onClick={onScanNow}
              disabled={isScanning}
              className="px-2.5 py-1.5 sm:px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 border border-emerald-400/40 shadow-sm shadow-emerald-600/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">{isScanning ? (language === 'ar' ? 'جارٍ المسح...' : 'Scanning...') : t('scanNow')}</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              title={soundEnabled ? 'Mute Alert Sounds' : 'Unmute Alert Sounds'}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-1 w-full max-w-full">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    {tab.badge}
                  </span>
                )}
                {tab.dot && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
