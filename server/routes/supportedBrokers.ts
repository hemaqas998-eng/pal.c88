import express from 'express';
import { requireAuth } from '../auth.js';

const router = express.Router();

const SUPPORTED_BROKERS = [
  { id: 'binance', name: 'Binance', asset: 'crypto', api: ['rest','ws'], docs: 'https://binance-docs.github.io/apidocs/spot/en/' },
  { id: 'bybit', name: 'Bybit', asset: 'crypto', api: ['rest','ws'], docs: 'https://bybit-exchange.github.io/docs/linear/' },
  { id: 'kraken', name: 'Kraken', asset: 'crypto', api: ['rest','ws'], docs: 'https://docs.kraken.com/' },
  { id: 'coinbase', name: 'Coinbase Exchange', asset: 'crypto', api: ['rest','ws'], docs: 'https://docs.cloud.coinbase.com/exchange/docs' },
  { id: 'kucoin', name: 'KuCoin', asset: 'crypto', api: ['rest','ws'], docs: 'https://docs.kucoin.com/' },
  { id: 'oanda', name: 'OANDA', asset: 'forex', api: ['rest'], docs: 'https://developer.oanda.com/rest-live-v20/introduction/' },
  { id: 'fxcm', name: 'FXCM', asset: 'forex', api: ['rest'], docs: 'https://www.fxcm.com/uk/algorithmic-trading/' },
  { id: 'ig', name: 'IG', asset: 'forex', api: ['rest','fix'], docs: 'https://labs.ig.com/' },
  { id: 'saxo', name: 'Saxo', asset: 'multi', api: ['rest'], docs: 'https://www.developer.saxo/openapi/overview' },
  { id: 'ibkr', name: 'Interactive Brokers (IB)', asset: 'multi', api: ['gateway'], docs: 'https://www.interactivebrokers.com/en/index.php?f=16040' },
  { id: 'exness', name: 'Exness (MT5)', asset: 'forex', api: ['mt5-bridge'], docs: 'https://www.exness.com/' },
  { id: 'xm', name: 'XM (MT4/MT5)', asset: 'forex', api: ['mt5-bridge'], docs: 'https://www.xm.com/' },
  { id: 'justmarkets', name: 'JustMarkets (MT5)', asset: 'forex', api: ['mt5-bridge'], docs: 'https://justforex.com/' },
  { id: 'alpaca', name: 'Alpaca', asset: 'equities', api: ['rest','stream'], docs: 'https://alpaca.markets/docs/api-documentation/' },
  { id: 'tradier', name: 'Tradier', asset: 'equities', api: ['rest'], docs: 'https://developer.tradier.com/' },
  { id: 'tiingo', name: 'Tiingo', asset: 'fx,stock', api: ['ws','rest'], docs: 'https://api.tiingo.com/' },
  { id: 'twelvedata', name: 'TwelveData', asset: 'multi', api: ['ws','rest'], docs: 'https://twelvedata.com/docs' },
  { id: 'finnhub', name: 'Finnhub', asset: 'multi', api: ['ws','rest'], docs: 'https://finnhub.io/docs/api' },
  { id: 'deriv', name: 'Deriv', asset: 'fx,commodities', api: ['ws'], docs: 'https://developers.deriv.com/docs/' }
];

router.get('/', requireAuth, (req, res) => {
  res.json({ supported: SUPPORTED_BROKERS });
});

export default router;
