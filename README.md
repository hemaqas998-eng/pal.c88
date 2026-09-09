# pal.c88 - Security, Auth & Price Enhancements

هذا الفرع يضيف بنية أساسية لمصادقة المستخدمين، تشفير أسرار الوسطاء، تحسين نظام تسعير اللحظي، ودعم ربط وسطاء عبر API.

ملاحظة سريعة: لا تقم بوضع المفاتيح أو أسرار الوسطاء في الكود. اس��خدم GitHub Secrets أو متغيرات بيئة على الخادم.

ملفات هامة مُضافة:
- server/encryption.ts  - AES-256-GCM utilities
- server/auth.ts        - simple JWT auth routes and middleware
- server/brokerAdapter/mockBroker.ts - mock broker adapter + registry
- server/routes/brokers.ts - endpoint link broker (encrypts credentials)
- docker-compose.yml    - لتشغيل Postgres (وredis) محلياً للاختبار
- .env.example          - مثال متغيرات بيئة

تشغيل محلي للاختبار:
1. انسخ `.env.example` إلى `.env` وعبّئ القيم (DATABASE_URL, JWT_SECRET, MASTER_ENCRYPTION_KEY ...)
2. شغّل Postgres عبر docker-compose: `docker-compose up -d`
3. ثبت الحزم: `npm install`
4. نفذ الميجريشن (حسب اختيارك ORM). أضف الجداول التالية يدوياً إن لم تستخدم migration:

```sql
-- مثال جداول مبسطة
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  token TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name TEXT,
  adapter_type TEXT,
  priority INT DEFAULT 50,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE broker_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID REFERENCES brokers(id),
  encrypted_api_key TEXT,
  encrypted_api_secret TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  symbol TEXT,
  direction TEXT,
  entry_price NUMERIC,
  stop_loss NUMERIC,
  take_profit1 NUMERIC,
  take_profit2 NUMERIC,
  status TEXT,
  opened_at TIMESTAMP,
  closed_at TIMESTAMP,
  pnl NUMERIC,
  execution_snapshot JSONB
);
```

5. شغّل السيرفر: `npm run dev`

بعد دمج هذا الفرع سأتابع تنفيذ ربط التسعير اللحظي (resolveExecutionPrice) وربطه مع محرك التداول (radarEngine) لضمان أن كل تنفيذ يمر عبر التحقق من الطازج والسلوك fallback.
