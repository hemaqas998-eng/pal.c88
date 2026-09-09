import { BrokerAdapter } from './mockBroker.js';
import { registerAdapter } from './mockBroker.js';

export class IBKRAdapter implements BrokerAdapter {
  id: string;
  name: string;
  constructor(id = 'ibkr', name = 'InteractiveBrokers') {
    this.id = id;
    this.name = name;
  }

  async getQuote(symbol: string) {
    throw new Error('IBKR adapter requires IB Gateway connection and is not implemented in mock');
  }

  async testCredentials() {
    return false;
  }
}

try { registerAdapter(new IBKRAdapter()); } catch (e) {}
