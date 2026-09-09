import express from 'express';
import { summary } from '../metrics.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const s = summary();
    res.json({ success: true, metrics: s });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'failed to fetch metrics' });
  }
});

export default router;
