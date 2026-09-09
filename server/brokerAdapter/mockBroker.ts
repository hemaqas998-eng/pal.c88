// Simple mock Broker adapter to illustrate integration

export interface BrokerQuote {
  price: number;
  timestamp?: number;
}

export interface BrokerAdapter {
  id: string;
  name: string;
  getQuote(symbol: string): Promise<BrokerQuote>;
  testCredentials?(): Promise<boolean>;
}

export class MockBrokerAdapter implements BrokerAdapter {
  id: string;
  name: string;
  private latency = 40;
  constructor(id = 'mock', name = 'MockBroker') {
    this.id = id;
    this.name = name;
  }

  async getQuote(symbol: string): Promise<BrokerQuote> {
    // return a fake quote with a small random jitter
    const base = 100;
    const noise = (Math.random() - 0.5) * 0.02 * base;
    await new Promise(r => setTimeout(r, this.latency));
    return { price: +(base + noise).toFixed(4), timestamp: Date.now() };
  }

  async testCredentials() {
    return true;
  }
}

// Simple registry to map brokerId -> adapter instance
const registry: Record<string, BrokerAdapter> = {};
export function registerAdapter(adapter: BrokerAdapter) {
  registry[adapter.id] = adapter;
}

export function getAdapter(brokerId: string): BrokerAdapter | undefined {
  return registry[brokerId];
}

// register a default mock adapter for development
registerAdapter(new MockBrokerAdapter('mock', 'MockBroker'));
