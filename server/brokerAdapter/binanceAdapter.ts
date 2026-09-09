import fetch from 'node-fetch';
import { BrokerAdapter } from './mockBroker.js';
import { registerAdapter } from './mockBroker.js';

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
    // Binance expects symbols like BTCUSDT
    const s = symbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const endpoint = `${this.baseUrl}/api/v3/ticker/price?symbol=${s}`;
    try {
      const resp = await fetch(endpoint, { method: 'GET' });
      if (!resp.ok) throw new Error('Binance quote failed');
      const data = await resp.json();
      return { price: parseFloat(data.price), timestamp: Date.now() };
    } catch (err) {
      throw err;
    }
  }

  async testCredentials() {
    // public endpoints used here; credential testing would be via REST account endpoint
    return true;
  }
}

// register
try {
  registerAdapter(new BinanceAdapter());
} catch (e) {
  // ignore registration errors in environments where registry not exported
}
