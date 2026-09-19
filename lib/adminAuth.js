import crypto from 'node:crypto';

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // 8h

function getSecret() {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error('ADMIN_PASSWORD no configurado en .env');
  return secret;
}

// Stateless signed token (expiry + HMAC) instead of an in-memory session store,
// since serverless functions don't share memory across invocations.
export function createAdminToken() {
  const expires = Date.now() + TOKEN_TTL_MS;
  const sig = crypto.createHmac('sha256', getSecret()).update(String(expires)).digest('hex');
  return `${expires}.${sig}`;
}

export function verifyAdminToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const [expiresStr, sig] = token.split('.');
  const expires = Number(expiresStr);
  if (!expires || Date.now() > expires) return false;
  let expectedSig;
  try {
    expectedSig = crypto.createHmac('sha256', getSecret()).update(expiresStr).digest('hex');
  } catch {
    return false;
  }
  const a = Buffer.from(sig || '', 'hex');
  const b = Buffer.from(expectedSig, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function isAdminRequest(req) {
  const auth = req.headers['authorization'] || req.headers['Authorization'] || '';
  const token = String(auth).replace(/^Bearer\s+/i, '').trim();
  return verifyAdminToken(token);
}
