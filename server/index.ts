import express from 'express';
import supportedBrokers from './routes/supportedBrokers.js';
import authRouter, { requireAuth } from './auth.js';
import brokersRouter from './routes/brokers.js';
import brokersTestRouter from './routes/brokersTest.js';
import tradesRouter from './routes/trades.js';
import metricsRouter from './routes/metrics.js';
import './radarEngine-wrapper.js';
import { radarEngine } from './radarEngine.js';

const app = express();
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/brokers', requireAuth, brokersRouter);
app.use('/api/brokers/test', requireAuth, brokersTestRouter);
app.use('/api/trades', requireAuth, tradesRouter);
app.use('/api/supported-brokers', requireAuth, supportedBrokers);
app.use('/api/metrics', requireAuth, metricsRouter);

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    radarEngine.resetPaperTrades(0);
  } catch (e) {
    console.warn('Failed to reset paper trades on startup:', e);
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start();
