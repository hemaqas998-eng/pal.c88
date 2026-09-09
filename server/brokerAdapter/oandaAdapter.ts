import fetch from 'node-fetch';
import { BrokerAdapter } from './mockBroker.js';
import { registerAdapter } from './mockBroker.js';

export class OandaAdapter implements BrokerAdapter {
  id: string;
  name: string;
  baseUrl: string;
  constructor(id = 'oanda', name = 'OANDA', baseUrl = 'https://api-fxpractice.oanda.com') {
    this.id = id;
    this.name = name;
    this.baseUrl = baseUrl;
  }

  async getQuote(symbol: string) {
    // OANDA uses EUR_USD style
    const s = symbol.replace('/', '_').toUpperCase();
    const endpoint = `${this.baseUrl}/v3/accounts/PRAC/account/summary`; // placeholder; actual quote needs pricing endpoint
    // For now, return error to indicate adapter needs API key for real quote
    throw new Error('OANDA adapter requires account-specific pricing endpoint and API token');
  }

  async testCredentials() {
    return false;
  }
}

try { registerAdapter(new OandaAdapter()); } catch (e) {}
