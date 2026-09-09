import { getAdapter } from '../brokerAdapter/mockBroker.js';
import express from 'express';
import { Pool } from 'pg';
import { ensureMasterKey, encryptField, decryptField } from '../encryption.js';

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const masterKey = ensureMasterKey(process.env.MASTER_ENCRYPTION_KEY);

// POST /api/brokers/link  { name, adapterType, apiKey, apiSecret }
router.post('/link', async (req, res) => {
  try {
    const user = req.user; // must be set by requireAuth
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { name, adapterType, apiKey, apiSecret } = req.body;
    if (!adapterType) return res.status(400).json({ error: 'adapterType required' });

    // encrypt credentials
    const encKey = encryptField(apiKey || '', masterKey);
    const encSecret = encryptField(apiSecret || '', masterKey);

    const result = await pool.query(
      'INSERT INTO brokers(user_id, name, adapter_type, priority, created_at) VALUES($1,$2,$3,$4,NOW()) RETURNING id',
      [user.id, name || adapterType, adapterType, 50]
    );
    const brokerId = result.rows[0].id;
    await pool.query('INSERT INTO broker_credentials(broker_id, encrypted_api_key, encrypted_api_secret, created_at) VALUES($1,$2,$3,NOW())', [brokerId, encKey, encSecret]);

    // test adapter if available (use mock registry)
    const adapter = getAdapter('mock');
    const ok = adapter ? await adapter.testCredentials?.() : true;

    res.json({ success: true, brokerId, connected: !!ok });
  } catch (err: any) {
    console.error('link broker error', err.message || err);
    res.status(500).json({ error: err.message || 'server error' });
  }
});

export default router;
