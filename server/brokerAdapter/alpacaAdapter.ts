import fetch from 'node-fetch';
import { BrokerAdapter } from './mockBroker.js';
import { registerAdapter } from './mockBroker.js';

export class AlpacaAdapter implements BrokerAdapter {
  id: string;
  name: string;
  baseUrl: string;

  constructor(id = 'alpaca', name = 'Alpaca', baseUrl = 'https://paper-api.alpaca.markets') {
    this.id = id;
    this.name = name;
    this.baseUrl = baseUrl;
  }

  async getQuote(symbol: string, apiKey?: string, apiSecret?: string) {
    // Use latest trade endpoint (requires API key)
    const s = symbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const endpoint = `https://data.alpaca.markets/v2/stocks/${s}/quotes/latest`;
    if (!apiKey || !apiSecret) throw new Error('Alpaca API key required for quote');
    const resp = await fetch(endpoint, { headers: { 'APCA-API-KEY-ID': apiKey, 'APCA-API-SECRET-KEY': apiSecret } });
    if (!resp.ok) throw new Error('Alpaca quote failed');
    const data = await resp.json();
    // data.quote: { ap, bp } etc. choose mid
    const q = data.quote;
    const price = q ? ((q.ap + q.bp) / 2) : null;
    return { price: price || 0, timestamp: Date.now() };
  }

  async placeOrder(params: {
    symbol: string;
    side: 'buy' | 'sell';
    qty: number | string;
    type: 'market' | 'limit';
    time_in_force?: 'day' | 'gtc';
    limit_price?: number;
    apiKey: string;
    apiSecret: string;
  }) {
    const { symbol, side, qty, type, time_in_force = 'day', limit_price, apiKey, apiSecret } = params as any;
    const endpoint = `${this.baseUrl}/v2/orders`;
    const body: any = {
      symbol: symbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase(),
      qty: qty.toString(),
      side,
      type,
      time_in_force
    };
    if (type === 'limit' && limit_price) body.limit_price = limit_price;

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(`Alpaca order failed: ${JSON.stringify(data)}`);
    return data;
  }

  async testCredentials(apiKey?: string, apiSecret?: string) {
    if (!apiKey || !apiSecret) return false;
    try {
      const resp = await fetch(`${this.baseUrl}/v2/account`, { headers: { 'APCA-API-KEY-ID': apiKey, 'APCA-API-SECRET-KEY': apiSecret } });
      return resp.ok;
    } catch (e) {
      return false;
    }
  }
}

try { registerAdapter(new AlpacaAdapter()); } catch (e) {}
