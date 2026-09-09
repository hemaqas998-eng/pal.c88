import crypto from 'crypto';
import fetch from 'node-fetch';
import querystring from 'querystring';
import { BrokerAdapter } from './mockBroker.js';

export class BinanceAdapter implements BrokerAdapter {
  id: string;
  name: string;
  baseUrl: string;

  constructor(id = 'binance', name = 'Binance', baseUrl = 'https://api.binance.com') {
    this.id = id;
    this.name = name;
    this.baseUrl = baseUrl;
  }

  async getQuote(symbol: string) {
    const s = symbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const endpoint = `${this.baseUrl}/api/v3/ticker/price?symbol=${s}`;
    const resp = await fetch(endpoint, { method: 'GET' });
    if (!resp.ok) throw new Error(`Binance public quote failed: ${resp.status}`);
    const data = await resp.json();
    return { price: parseFloat(data.price), timestamp: Date.now() };
  }

  // placeOrder requires apiKey & apiSecret
  async placeOrder(params: {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'LIMIT' | 'MARKET';
    quantity: number;
    price?: number;
    apiKey: string;
    apiSecret: string;
    test?: boolean;
    recvWindow?: number;
  }) {
    const {
      symbol, side, type, quantity, price, apiKey, apiSecret, test = false, recvWindow = 5000
    } = params;

    const s = symbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const timestamp = Date.now();
    let payload: any = { symbol: s, side, type, quantity: quantity.toString(), timestamp };
    if (type === 'LIMIT') {
      payload.price = price?.toString() || '0';
      payload.timeInForce = 'GTC';
    }
    payload.recvWindow = recvWindow;

    const qs = querystring.stringify(payload);
    const signature = crypto.createHmac('sha256', apiSecret).update(qs).digest('hex');
    const fullQs = `${qs}&signature=${signature}`;
    const endpoint = `${this.baseUrl}/api/v3/order${test ? '/test' : ''}`;

    const resp = await fetch(`${endpoint}?${fullQs}`, {
      method: 'POST',
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }
    if (!resp.ok) throw new Error(`Binance order failed: ${resp.status} ${JSON.stringify(data)}`);
    return data;
  }

  async testCredentials(apiKey?: string, apiSecret?: string) {
    // try to call account endpoint requires signature - use timestamp and a small call
    if (!apiKey || !apiSecret) return false;
    try {
      const timestamp = Date.now();
      const qs = `timestamp=${timestamp}`;
      const signature = crypto.createHmac('sha256', apiSecret).update(qs).digest('hex');
      const endpoint = `${this.baseUrl}/api/v3/account?${qs}&signature=${signature}`;
      const resp = await fetch(endpoint, { headers: { 'X-MBX-APIKEY': apiKey } });
      return resp.ok;
    } catch (e) {
      return false;
    }
  }
}
