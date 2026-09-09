import express from 'express';
import bodyParser from 'body-parser';
import authRouter, { requireAuth } from './auth.js';
import brokersRouter from './routes/brokers.js';
import tradesRouter from './routes/trades.js';
import './radarEngine-wrapper.js';
import { radarEngine } from './radarEngine.js';

const app = express();
app.use(bodyParser.json());

app.use('/api/auth', authRouter);
app.use('/api/brokers', requireAuth, brokersRouter);
app.use('/api/trades', requireAuth, tradesRouter);

const PORT = process.env.PORT || 3000;

async function start() {
  // On startup, clear any paper trades to ensure no demo trading remains
  try {
    // resetPaperTrades accepts starting balance; set to 0 to remove demo capital
    radarEngine.resetPaperTrades(0);
  } catch (e) {
    console.warn('Failed to reset paper trades on startup:', e);
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start();
