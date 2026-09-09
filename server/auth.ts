import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { ensureMasterKey } from './encryption.js';

const router = express.Router();
const SALT_ROUNDS = 12;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret';

// Simple user table assumptions: users(id UUID, email text unique, password_hash text, created_at timestamp)

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query('INSERT INTO users(email, password_hash, created_at) VALUES($1,$2,NOW()) RETURNING id,email,created_at', [email, hash]);
    const user = result.rows[0];
    res.json({ success: true, user: { id: user.id, email: user.email } });
  } catch (err: any) {
    console.error('register error', err.message || err);
    res.status(500).json({ error: err.message || 'server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
    const result = await pool.query('SELECT id, email, password_hash FROM users WHERE email=$1 LIMIT 1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const access = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '15m' });
    const refresh = jwt.sign({ sub: user.id }, JWT_REFRESH_SECRET, { expiresIn: '30d' });

    // Store refresh token in DB (simple implementation)
    await pool.query('INSERT INTO refresh_tokens(user_id, token, created_at) VALUES($1,$2,NOW())', [user.id, refresh]);

    res.json({ accessToken: access, refreshToken: refresh });
  } catch (err: any) {
    console.error('login error', err.message || err);
    res.status(500).json({ error: err.message || 'server error' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Missing refresh token' });
    try {
      const decoded: any = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      const userId = decoded.sub;
      const check = await pool.query('SELECT token FROM refresh_tokens WHERE user_id=$1 AND token=$2 LIMIT 1', [userId, refreshToken]);
      if (check.rowCount === 0) return res.status(401).json({ error: 'Invalid refresh token' });
      const access = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '15m' });
      res.json({ accessToken: access });
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'server error' });
  }
});

export function requireAuth(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.slice('Bearer '.length);
  try {
    const payload: any = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export default router;
