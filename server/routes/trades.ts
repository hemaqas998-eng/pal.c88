import express from 'express';
import { resolveExecutionPrice } from '../marketDataEnhancements.js';
import { radarEngine } from '../server/radarEngine.js';

const router = express.Router();

// POST /api/trades/open
router.post('/open', async (req: any, res) => {
  try {
    const user = req.user;
    const { symbol, direction, lotSize, stopLoss, takeProfit1, takeProfit2, takeProfit3, brokerId } = req.body;
    if (!symbol || !direction) return res.status(400).json({ error: 'symbol and direction required' });

    // Require a fresh price; prefer broker confirm
    const exec = await resolveExecutionPrice(symbol, { maxAgeMs: 2500, requireBrokerConfirm: true, brokerId: brokerId || 'mock' });

    if (!exec.ok) {
      return res.status(409).json({ success: false, error: exec.error || 'No fresh price available' });
    }

    const params: any = {
      symbol,
      direction,
      lotSize,
      stopLoss,
      takeProfit1,
      takeProfit2,
      takeProfit3,
      rationale: `User ${user.id} open via API`,
    };

    // attach execution snapshot details to rationale or later to trade
    const result = radarEngine.openTradeDirectly(params);
    if (!result.success) {
      return res.status(500).json({ success: false, message: result.message });
    }

    // attach execution snapshot metadata into trade object (best-effort)
    if (result.trade) {
      // mutate trade to include execution snapshot
      (result.trade as any).executionSnapshot = {
        price: exec.price,
        source: exec.source,
        timestamp: exec.timestamp,
        ageMs: exec.ageMs,
        fromCache: !!exec.fromCache
      };
    }

    res.json({ success: true, trade: result.trade, execution: exec });
  } catch (err: any) {
    console.error('open trade error', err);
    res.status(500).json({ error: err.message || 'server error' });
  }
});

export default router;
