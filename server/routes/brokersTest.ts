import express from 'express';
import { ensureMasterKey, decryptField } from '../encryption.js';
import { Pool } from 'pg';
import { BinanceAdapter } from '../brokerAdapter/binanceAdapterFull.js';
import { AlpacaAdapter } from '../brokerAdapter/alpacaAdapter.js';

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const masterKey = ensureMasterKey(process.env.MASTER_ENCRYPTION_KEY);

// POST /api/brokers/test { adapterType, apiKey, apiSecret }
router.post('/test', async (req: any, res) => {
  try {
    const { adapterType, apiKey, apiSecret } = req.body;
    if (!adapterType) return res.status(400).json({ error: 'adapterType required' });

    if (adapterType === 'binance') {
      const adapter = new BinanceAdapter();
      const ok = await adapter.testCredentials(apiKey, apiSecret);
      return res.json({ success: ok });
    }

    if (adapterType === 'alpaca') {
      const adapter = new AlpacaAdapter();
      const ok = await adapter.testCredentials(apiKey, apiSecret);
      return res.json({ success: ok });
    }

    // For other adapters, return not implemented
    return res.status(501).json({ error: 'Adapter test not implemented for ' + adapterType });
  } catch (err: any) {
    console.error('broker test error', err);
    res.status(500).json({ error: err.message || 'server error' });
  }
});

export default router;
