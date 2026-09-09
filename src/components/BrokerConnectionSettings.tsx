import React, { useState } from 'react';
import { BotSettings } from '../types';
import { 
  Key, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Zap, 
  Lock, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Cpu, 
  DollarSign, 
  Layers, 
  Server, 
  Radio, 
  Activity, 
  ArrowRight,
  ShieldAlert,
  Flame,
  Globe,
  Sliders
} from 'lucide-react';

interface BrokerConnectionSettingsProps {
  settings: BotSettings;
  onUpdateSettings: (newSettings: Partial<BotSettings>) => void;
  language?: 'ar' | 'en';
}

type BrokerType = 'BINANCE' | 'JUSTMARKETS' | 'XM' | 'BYBIT' | 'DERIV' | 'CUSTOM_REST';

export const BrokerConnectionSettings: React.FC<BrokerConnectionSettingsProps> = ({
  settings,
  onUpdateSettings,
  language = 'ar'
}) => {
  const isAr = language === 'ar';
  
  const brokerCreds = settings.brokerApiCredentials || {
    activeBroker: 'BINANCE'
  };

  const [selectedBroker, setSelectedBroker] = useState<BrokerType>(
    (brokerCreds.activeBroker as BrokerType) || 'BINANCE'
  );

  // Binance State
  const [binanceKey, setBinanceKey] = useState(brokerCreds.binance?.apiKey || '');
  const [binanceSecret, setBinanceSecret] = useState(brokerCreds.binance?.apiSecret || '');
  const [binanceAccountType, setBinanceAccountType] = useState<'FUTURES_USDT' | 'SPOT'>(
    brokerCreds.binance?.accountType || 'FUTURES_USDT'
  );
  const [binanceTestnet, setBinanceTestnet] = useState(brokerCreds.binance?.testnet || false);

  // JustMarkets State
  const [jmLogin, setJmLogin] = useState(brokerCreds.justmarkets?.mtLogin || '');
  const [jmServer, setJmServer] = useState(brokerCreds.justmarkets?.server || 'JustMarkets-Live');
  const [jmToken, setJmToken] = useState(brokerCreds.justmarkets?.apiToken || '');
  const [jmRestEndpoint, setJmRestEndpoint] = useState(brokerCreds.justmarkets?.restEndpoint || '');

  // XM State
  const [xmLogin, setXmLogin] = useState(brokerCreds.xm?.mtLogin || '');
  const [xmServer, setXmServer] = useState(brokerCreds.xm?.server || 'XMGlobal-Real 55');
  const [xmToken, setXmToken] = useState(brokerCreds.xm?.apiToken || '');
  const [xmRestEndpoint, setXmRestEndpoint] = useState(brokerCreds.xm?.restEndpoint || '');

  // Bybit State
  const [bybitKey, setBybitKey] = useState(brokerCreds.bybit?.apiKey || '');
  const [bybitSecret, setBybitSecret] = useState(brokerCreds.bybit?.apiSecret || '');
  const [bybitTestnet, setBybitTestnet] = useState(brokerCreds.bybit?.testnet || false);

  // Custom REST State
  const [customBrokerName, setCustomBrokerName] = useState(brokerCreds.customRest?.brokerName || 'My Broker');
  const [customBaseUrl, setCustomBaseUrl] = useState(brokerCreds.customRest?.baseUrl || '');
  const [customApiKey, setCustomApiKey] = useState(brokerCreds.customRest?.apiKey || '');
  const [customApiSecret, setCustomApiSecret] = useState(brokerCreds.customRest?.apiSecret || '');

  // UI helpers
  const [showSecret, setShowSecret] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success?: boolean;
    message?: string;
    balance?: number;
    currency?: string;
    latencyMs?: number;
    permissions?: string[];
  } | null>(null);

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Validate Active Broker Credentials
  const handleValidateConnection = async () => {
    setValidating(true);
    setValidationResult(null);

    try {
      let payload: any = {};
      if (selectedBroker === 'BINANCE') {
        payload = {
          apiKey: binanceKey,
          apiSecret: binanceSecret,
          accountType: binanceAccountType,
          testnet: binanceTestnet
        };
      } else if (selectedBroker === 'JUSTMARKETS') {
        payload = {
          mtLogin: jmLogin,
          server: jmServer,
          apiToken: jmToken,
          restEndpoint: jmRestEndpoint
        };
      } else if (selectedBroker === 'XM') {
        payload = {
          mtLogin: xmLogin,
          server: xmServer,
          apiToken: xmToken,
          restEndpoint: xmRestEndpoint
        };
      } else if (selectedBroker === 'BYBIT') {
        payload = {
          apiKey: bybitKey,
          apiSecret: bybitSecret,
          testnet: bybitTestnet
        };
      } else if (selectedBroker === 'CUSTOM_REST') {
        payload = {
          brokerName: customBrokerName,
          baseUrl: customBaseUrl,
          apiKey: customApiKey,
          apiSecret: customApiSecret
        };
      }

      const res = await fetch('/api/broker/validate-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broker: selectedBroker,
          credentials: payload
        })
      });

      const data = await res.json();
      setValidationResult(data);

      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      setValidationResult({
        success: false,
        message: err.message || 'Validation request failed'
      });
    } finally {
      setValidating(false);
    }
  };

  const handleSaveAll = () => {
    const updatedCreds: any = {
      activeBroker: selectedBroker,
      binance: {
        apiKey: binanceKey,
        apiSecret: binanceSecret,
        accountType: binanceAccountType,
        testnet: binanceTestnet,
        isValidated: brokerCreds.binance?.isValidated || false,
        accountBalance: brokerCreds.binance?.accountBalance
      },
      justmarkets: {
        mtLogin: jmLogin,
        server: jmServer,
        apiToken: jmToken,
        restEndpoint: jmRestEndpoint,
        isValidated: brokerCreds.justmarkets?.isValidated || false,
        accountBalance: brokerCreds.justmarkets?.accountBalance
      },
      xm: {
        mtLogin: xmLogin,
        server: xmServer,
        apiToken: xmToken,
        restEndpoint: xmRestEndpoint,
        isValidated: brokerCreds.xm?.isValidated || false,
        accountBalance: brokerCreds.xm?.accountBalance
      },
      bybit: {
        apiKey: bybitKey,
        apiSecret: bybitSecret,
        testnet: bybitTestnet,
        category: 'linear',
        isValidated: brokerCreds.bybit?.isValidated || false,
        accountBalance: brokerCreds.bybit?.accountBalance
      },
      customRest: {
        brokerName: customBrokerName,
        baseUrl: customBaseUrl,
        apiKey: customApiKey,
        apiSecret: customApiSecret
      }
    };

    onUpdateSettings({
      tradingMode: 'LIVE',
      brokerApiCredentials: updatedCreds
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isAr ? 'تنفيذ مباشر بدون ويب هوك (Direct API Non-Webhook)' : 'Direct API Non-Webhook Trading'}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
                AES-256 Encrypted
              </span>
            </div>
            
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Key className="w-6 h-6 text-indigo-400" />
              {isAr ? 'ربط وسطاء التداول عبر الـ API المباشر (Broker API Connection)' : 'Direct Broker API Credentials & Gateway'}
            </h2>
            
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {isAr
                ? 'أدخل بيانات مفاتيح الـ API (API Key & Secret) أو بيانات حساب التداول الخاص بك في JustMarkets، Binance، XM، و Bybit لتنفيذ الصفقات وفتحها مباشرة من السيرفر بسرعة فائقة بدون الحاجة لخدمات ويب هوك وسيطة.'
                : 'Enter your official API Key & Secret or direct account credentials for JustMarkets, Binance, XM, and other brokers for direct, non-webhook order routing.'}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={handleSaveAll}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isAr ? 'حفظ البيانات المشفرة' : 'Save Credentials'}
            </button>
          </div>
        </div>
      </div>

      {/* Broker Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {[
          { id: 'BINANCE', name: 'Binance', sub: 'Futures & Spot API', icon: Zap, color: 'text-amber-400 border-amber-500/30', validated: brokerCreds.binance?.isValidated },
          { id: 'JUSTMARKETS', name: 'JustMarkets', sub: 'MT5 / Direct Gateway', icon: Server, color: 'text-sky-400 border-sky-500/30', validated: brokerCreds.justmarkets?.isValidated },
          { id: 'XM', name: 'XM Global', sub: 'MT5 / STP Bridge', icon: Activity, color: 'text-rose-400 border-rose-500/30', validated: brokerCreds.xm?.isValidated },
          { id: 'BYBIT', name: 'Bybit', sub: 'Unified Trading API', icon: Flame, color: 'text-amber-500 border-amber-500/30', validated: brokerCreds.bybit?.isValidated },
          { id: 'CUSTOM_REST', name: isAr ? 'بروكر مخصص' : 'Custom REST', sub: 'Any REST API Broker', icon: Globe, color: 'text-indigo-400 border-indigo-500/30', validated: false },
        ].map((b) => {
          const isSelected = selectedBroker === b.id;
          const Icon = b.icon;
          return (
            <button
              key={b.id}
              onClick={() => {
                setSelectedBroker(b.id as BrokerType);
                setValidationResult(null);
              }}
              className={`p-3.5 rounded-2xl border text-right transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800/90 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${b.color}`} />
                {b.validated && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse" title="Connected & Validated" />
                )}
              </div>
              <div>
                <div className="font-bold text-sm text-white">{b.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{b.sub}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Active Form Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        
        {/* BINANCE FORM */}
        {selectedBroker === 'BINANCE' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                  BN
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {isAr ? 'إعدادات مفاتيح بايننس الرسمية (Binance Official API)' : 'Binance Official API Key Configuration'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isAr ? 'تنفيذ مباشر لأوامر العقود الآجلة (Futures USDT-M) أو التداول الفوري (Spot)' : 'Direct REST order execution for Futures & Spot'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition"
                >
                  {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showSecret ? (isAr ? 'إخفاء المفتاح' : 'Hide Secret') : (isAr ? 'إظهار المفتاح' : 'Show Secret')}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  Binance API Key:
                </label>
                <input
                  type="text"
                  placeholder="vmPUZE6mv9SD5VNHkP6a7OqjP..."
                  value={binanceKey}
                  onChange={(e) => setBinanceKey(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  Binance API Secret:
                </label>
                <input
                  type={showSecret ? 'text' : 'password'}
                  placeholder="••••••••••••••••••••••••••••••••••••••••"
                  value={binanceSecret}
                  onChange={(e) => setBinanceSecret(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  {isAr ? 'نوع الحساب والتداول:' : 'Account Type:'}
                </label>
                <select
                  value={binanceAccountType}
                  onChange={(e) => setBinanceAccountType(e.target.value as any)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="FUTURES_USDT">USDT-M Futures (عقود آجلة رافعة مالية)</option>
                  <option value="SPOT">Spot Trading (تداول فوري بدون رافعة)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="text-slate-200 font-bold">{isAr ? 'بيئة الاختبار التجريبية (Testnet):' : 'Use Binance Testnet:'}</div>
                  <div className="text-[11px] text-slate-400">{isAr ? 'تفعيل لتجربة أوامر وهمية على شبكة بايننس' : 'For demo execution testing'}</div>
                </div>
                <input
                  type="checkbox"
                  checked={binanceTestnet}
                  onChange={(e) => setBinanceTestnet(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1 font-sans">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                {isAr ? 'إرشادات الأمان لمفاتيح Binance:' : 'Binance API Security Instructions:'}
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-amber-300/80 text-[11px]">
                <li>{isAr ? 'فعّل صلاحية: Enable Reading و Enable Futures فقط.' : 'Enable "Enable Reading" & "Enable Futures" permissions only.'}</li>
                <li>{isAr ? '⚠️ لا تقم بتفعيل صلاحية السحب (Enable Withdrawals) إطلاقاً.' : '⚠️ Never enable Withdrawal permissions for 100% security.'}</li>
              </ul>
            </div>
          </div>
        )}

        {/* JUSTMARKETS FORM */}
        {selectedBroker === 'JUSTMARKETS' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
                  JM
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {isAr ? 'ربط حساب JustMarkets المباشر' : 'JustMarkets Live Account & Bridge Connection'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isAr ? 'تداول الفوركس، الذهب XAUUSD، والمؤشرات بحسابك الحقيقي' : 'Trade Forex, Gold & Indices with zero delay'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  {isAr ? 'رقم حساب التداول (Account Login):' : 'Account Login Number:'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5082194"
                  value={jmLogin}
                  onChange={(e) => setJmLogin(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  {isAr ? 'اسم سيرفر البروكر (Server Name):' : 'Broker Server Name:'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. JustMarkets-Live or JustMarkets-Real2"
                  value={jmServer}
                  onChange={(e) => setJmServer(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  {isAr ? 'توكن التفويض (API Token / Secret):' : 'API Token / Secret (Optional):'}
                </label>
                <input
                  type={showSecret ? 'text' : 'password'}
                  placeholder="••••••••••••••••••••••••"
                  value={jmToken}
                  onChange={(e) => setJmToken(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  {isAr ? 'رابط خادم الجسر المباشر (Custom Direct Endpoint - اختياري):' : 'Direct REST Bridge URL (Optional):'}
                </label>
                <input
                  type="text"
                  placeholder="https://your-vps-bridge.com/api/justmarkets"
                  value={jmRestEndpoint}
                  onChange={(e) => setJmRestEndpoint(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-300 space-y-1 font-sans">
              <div className="font-bold flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-sky-400" />
                {isAr ? 'ميزة التنفيذ المباشر لـ JustMarkets:' : 'JustMarkets Direct Execution Perks:'}
              </div>
              <p className="text-sky-300/80 text-[11px]">
                {isAr
                  ? 'يتم توجيه أوامر الشراء والبيع والوقف المتحرك (Trailing Stop) فوراً لحسابك مع تأمين الأرباح عند تحقيق الهدف الأول.'
                  : 'Orders and dynamic trailing stops are routed directly with real-time slippage protection.'}
              </p>
            </div>
          </div>
        )}

        {/* XM FORM */}
        {selectedBroker === 'XM' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                  XM
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {isAr ? 'ربط حساب XM Global المباشر' : 'XM Global Live Account & Bridge Connection'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isAr ? 'تداول الفوركس، الذهب، والمؤشرات العالمية عبر حساب XM الحقيقي' : 'Trade Forex, Gold & Global Indices on live XM account'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  {isAr ? 'رقم حساب XM (Account Login ID):' : 'XM Account Login ID:'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. 8830129"
                  value={xmLogin}
                  onChange={(e) => setXmLogin(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  {isAr ? 'اسم سيرفر XM (Server Name):' : 'XM Server Name:'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. XMGlobal-Real 55"
                  value={xmServer}
                  onChange={(e) => setXmServer(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  {isAr ? 'توكن التفويض (API Token):' : 'XM API Token (Optional):'}
                </label>
                <input
                  type={showSecret ? 'text' : 'password'}
                  placeholder="••••••••••••••••••••••••"
                  value={xmToken}
                  onChange={(e) => setXmToken(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  {isAr ? 'رابط الخادم المباشر (Custom Direct Endpoint):' : 'Direct REST Bridge URL (Optional):'}
                </label>
                <input
                  type="text"
                  placeholder="https://your-bridge-server.com/api/xm"
                  value={xmRestEndpoint}
                  onChange={(e) => setXmRestEndpoint(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* BYBIT FORM */}
        {selectedBroker === 'BYBIT' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                  BY
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Bybit v5 Unified Trading API</h3>
                  <p className="text-xs text-slate-400">Direct order execution for Linear Futures & Spot</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Bybit API Key:</label>
                <input
                  type="text"
                  placeholder="Your Bybit API Key"
                  value={bybitKey}
                  onChange={(e) => setBybitKey(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Bybit API Secret:</label>
                <input
                  type={showSecret ? 'text' : 'password'}
                  placeholder="••••••••••••••••••••••••"
                  value={bybitSecret}
                  onChange={(e) => setBybitSecret(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* CUSTOM REST FORM */}
        {selectedBroker === 'CUSTOM_REST' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                  API
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {isAr ? 'ربط أي بروكر خارجي يدعم REST API' : 'Custom REST API Broker Gateway'}
                  </h3>
                  <p className="text-xs text-slate-400">Connect Exness, Deriv, Interactive Brokers, or Prop Firm API</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">
                  {isAr ? 'اسم شركة الوساطة:' : 'Broker Name:'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Exness or Deriv"
                  value={customBrokerName}
                  onChange={(e) => setCustomBrokerName(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">Base API URL:</label>
                <input
                  type="text"
                  placeholder="https://api.yourbroker.com/v1"
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">API Key / Token:</label>
                <input
                  type="text"
                  placeholder="API Key"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1.5">API Secret (Optional):</label>
                <input
                  type={showSecret ? 'text' : 'password'}
                  placeholder="API Secret"
                  value={customApiSecret}
                  onChange={(e) => setCustomApiSecret(e.target.value)}
                  className="w-full bg-slate-950 text-white px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Validation Status Feedback Banner */}
        {validationResult && (
          <div
            className={`p-4 rounded-xl text-xs flex items-start gap-3 transition-all ${
              validationResult.success
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
            }`}
          >
            {validationResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-bold text-sm">
                {validationResult.success
                  ? (isAr ? 'تم التحقق والاتصال بنجاح! ✅' : 'Connection Successfully Verified! ✅')
                  : (isAr ? 'فشل التحقق من البيانات ❌' : 'Validation Failed ❌')}
              </div>
              <p className="text-xs leading-relaxed opacity-90">{validationResult.message}</p>
              {validationResult.balance !== undefined && (
                <div className="font-mono text-xs pt-1 flex items-center gap-4 text-emerald-400">
                  <span>{isAr ? 'الرصيد المتاح:' : 'Available Balance:'} <b>${validationResult.balance.toLocaleString()} {validationResult.currency || 'USD'}</b></span>
                  {validationResult.latencyMs && <span>{isAr ? 'زمن الاستجابة:' : 'Latency:'} <b>{validationResult.latencyMs}ms</b></span>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'يتم حفظ المفاتيح مشفرة ومحمية في الخادم' : 'Credentials are encrypted and stored securely'}</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={validating}
              onClick={handleValidateConnection}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-700 disabled:opacity-50"
            >
              {validating ? (
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              ) : (
                <Zap className="w-4 h-4 text-amber-400" />
              )}
              <span>{isAr ? 'فحص وصحة الاتصال المباشر' : 'Validate Connection'}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isAr ? 'حفظ وتفعيل التداول' : 'Save & Enable Live'}</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
