import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12; // 96 bits recommended for GCM

export function ensureMasterKey(masterKeyStr?: string): Buffer {
  if (!masterKeyStr) throw new Error('MASTER_ENCRYPTION_KEY not provided');
  // Accept raw or base64 prefix
  if (masterKeyStr.startsWith('base64:')) {
    return Buffer.from(masterKeyStr.replace(/^base64:/, ''), 'base64');
  }
  return Buffer.from(masterKeyStr);
}

export function encryptField(plain: string, masterKey: Buffer): string {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, masterKey, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
}

export function decryptField(token: string, masterKey: Buffer): string {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid encrypted payload');
  const [ivB64, tagB64, encB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const enc = Buffer.from(encB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGO, masterKey, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(enc), decipher.final()]);
  return decrypted.toString('utf8');
}
