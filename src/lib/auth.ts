// ============================================
// Auth: PBKDF2 password hashing + sessioni HMAC-signed via cookie httpOnly
// Funziona su Cloudflare Workers (Web Crypto nativo)
// ============================================

const ITERATIONS = 100_000;
const SESSION_COOKIE = 'nexus_session';
const SESSION_TTL_SEC = 60 * 60 * 24 * 7; // 7 giorni

export type Role = 'admin' | 'editor';

export interface SessionUser {
  uid: string;
  email: string;
  name: string;
  role: Role;
  exp: number; // epoch seconds
}

const encoder = new TextEncoder();

// ---------- base64url helpers ----------
function bytesToB64url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function strToB64url(str: string): string {
  return bytesToB64url(encoder.encode(str));
}

function b64urlToStr(b64url: string): string {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  return atob(padded);
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ---------- PBKDF2 password hashing ----------

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await deriveBits(password, salt);
  return `pbkdf2$${ITERATIONS}$${bytesToHex(salt)}$${bytesToHex(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, iterStr, saltHex, hashHex] = stored.split('$');
    if (scheme !== 'pbkdf2') return false;
    const iterations = parseInt(iterStr, 10);
    const salt = hexToBytes(saltHex);
    const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
      key,
      256
    );
    const expected = hexToBytes(hashHex);
    const got = new Uint8Array(bits);
    if (expected.length !== got.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ got[i];
    return diff === 0;
  } catch {
    return false;
  }
}

async function deriveBits(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: ITERATIONS },
    key,
    256
  );
}

// ---------- HMAC session tokens ----------

function getAuthSecret(): string {
  return process.env.AUTH_SECRET || 'nexus-dev-secret-change-me';
}

async function getHmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(getAuthSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createSessionToken(user: Omit<SessionUser, 'exp'>): Promise<string> {
  const payload: SessionUser = { ...user, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SEC };
  const body = strToB64url(JSON.stringify(payload));
  const key = await getHmacKey();
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return `${body}.${bytesToB64url(new Uint8Array(sig))}`;
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const [body, sigB64] = token.split('.');
    if (!body || !sigB64) return null;
    const key = await getHmacKey();
    const sig = b64urlToBytes(sigB64);
    const valid = await crypto.subtle.verify('HMAC', key, sig as BufferSource, encoder.encode(body));
    if (!valid) return null;
    const payload = JSON.parse(b64urlToStr(body)) as SessionUser;
    if (!payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function b64urlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ---------- Cookie helpers ----------

export function sessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SEC};${secure}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function getCookieValue(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('cookie') || '';
  for (const part of cookieHeader.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

/** Estrae e verifica l'utente dalla sessione nella richiesta. Null se non autenticato. */
export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  const token = getCookieValue(request, SESSION_COOKIE);
  if (!token) return null;
  return verifySessionToken(token);
}

export interface AuthGuard {
  user: SessionUser;
  error?: undefined;
}

export interface AuthGuardError {
  user?: undefined;
  error: Response;
}

/** 401 se non autenticato, 403 se ruolo insufficiente. */
export async function requireRole(request: Request, roles: Role[]): Promise<AuthGuard | AuthGuardError> {
  const user = await getSessionUser(request);
  if (!user) {
    return { error: Response.json({ error: 'Non autenticato. Effettua il login.' }, { status: 401 }) };
  }
  if (!roles.includes(user.role)) {
    return { error: Response.json({ error: 'Permessi insufficienti per questa operazione.' }, { status: 403 }) };
  }
  return { user };
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Amministratore',
  editor: 'Editore',
};
