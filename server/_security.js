const crypto = require('crypto');

function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
}

function readJsonBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body || {};
}

function cleanText(value, max = 500) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function cleanEmail(value) {
  return cleanText(value, 180).toLowerCase();
}

function cleanPhone(value) {
  return cleanText(value, 40);
}

function normalizePlan(planId) {
  const allowed = new Set(['essential', 'professional', 'business', 'implementation']);
  const value = cleanText(planId, 40).toLowerCase();
  return allowed.has(value) ? value : 'professional';
}

function getSupabaseConfig() {
  return {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY
  };
}

function requireConfig(value, name) {
  if (!value) throw new Error(`${name} não configurado na Vercel.`);
  return value;
}

function getClientSecret() {
  const { serviceKey } = getSupabaseConfig();
  return process.env.CLIENT_SESSION_SECRET || serviceKey;
}

function getDevSecret() {
  const secret = process.env.DEV_ADMIN_SECRET;
  if (!secret || secret.length < 16) throw new Error('DEV_ADMIN_SECRET precisa estar configurado e ter pelo menos 16 caracteres.');
  return secret;
}

function signPayload(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function safeEqual(a, b) {
  try {
    const aa = Buffer.from(String(a || ''));
    const bb = Buffer.from(String(b || ''));
    return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
  } catch { return false; }
}

function issueSignedToken(kind, claims, ttlMs) {
  const secret = kind === 'dev' ? getDevSecret() : requireConfig(getClientSecret(), 'CLIENT_SESSION_SECRET ou SUPABASE_SERVICE_ROLE_KEY');
  const payload = Buffer.from(JSON.stringify({ kind, iat: Date.now(), exp: Date.now() + ttlMs, jti: crypto.randomBytes(12).toString('hex'), ...claims })).toString('base64url');
  return `${payload}.${signPayload(payload, secret)}`;
}

function verifySignedToken(token, expectedKind) {
  if (!token || !String(token).includes('.')) return null;
  const [payload, signature] = String(token).split('.');
  const secret = expectedKind === 'dev' ? getDevSecret() : requireConfig(getClientSecret(), 'CLIENT_SESSION_SECRET ou SUPABASE_SERVICE_ROLE_KEY');
  if (!safeEqual(signPayload(payload, secret), signature)) return null;
  let claims;
  try { claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { return null; }
  if (claims.kind !== expectedKind) return null;
  if (!claims.exp || Number(claims.exp) < Date.now()) return null;
  return claims;
}

function getBearer(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  const value = Array.isArray(header) ? header[0] : header;
  return String(value).startsWith('Bearer ') ? String(value).slice(7).trim() : '';
}

async function supabaseRequest(path, options = {}) {
  const { url, serviceKey } = getSupabaseConfig();
  requireConfig(url, 'SUPABASE_URL');
  requireConfig(serviceKey, 'SUPABASE_SERVICE_ROLE_KEY');
  const response = await fetch(`${url.replace(/\/$/, '')}${path}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${text || response.statusText}`);
  return data;
}

async function authWithPassword(email, password) {
  const { url, anonKey, serviceKey } = getSupabaseConfig();
  requireConfig(url, 'SUPABASE_URL');
  const key = anonKey || serviceKey;
  requireConfig(key, 'SUPABASE_ANON_KEY ou SUPABASE_SERVICE_ROLE_KEY');
  const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error('E-mail ou senha inválidos.');
  return data;
}

async function createAuthUser({ email, password, fullName, whatsapp, businessName, planId }) {
  const { url, serviceKey } = getSupabaseConfig();
  requireConfig(url, 'SUPABASE_URL');
  requireConfig(serviceKey, 'SUPABASE_SERVICE_ROLE_KEY');
  const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: fullName, phone: whatsapp, business_name: businessName, agendapro_plan: planId } })
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (response.ok) return { user: data, alreadyExisted: false };
  if (String(text).toLowerCase().includes('already') || String(text).toLowerCase().includes('registered')) return { user: null, alreadyExisted: true };
  throw new Error(`Supabase Auth ${response.status}: ${text || response.statusText}`);
}

async function getAccountByEmail(email) {
  const rows = await supabaseRequest(`/rest/v1/agendapro_client_accounts?email=eq.${encodeURIComponent(email)}&select=*&limit=1`, { method: 'GET' });
  return Array.isArray(rows) ? rows[0] : null;
}

async function logActivity({ accountId = null, companyId = null, action = 'event', title = '', description = '', severity = 'info', metadata = {} }) {
  try {
    await supabaseRequest('/rest/v1/agendapro_client_activity_logs', {
      method: 'POST',
      body: JSON.stringify({ account_id: accountId, company_id: companyId, action, title, description, severity, metadata })
    });
  } catch (error) {
    console.warn('Activity log ignored:', error.message);
  }
}

async function getPrimaryCompany(accountId) {
  if (!accountId) return null;
  let companies = await supabaseRequest(`/rest/v1/agendapro_companies?owner_account_id=eq.${encodeURIComponent(accountId)}&select=*&limit=1`, { method: 'GET' }).catch(() => []);
  if (Array.isArray(companies) && companies[0]) return companies[0];
  const links = await supabaseRequest(`/rest/v1/agendapro_account_companies?account_id=eq.${encodeURIComponent(accountId)}&is_active=eq.true&select=company_id&limit=1`, { method: 'GET' }).catch(() => []);
  if (Array.isArray(links) && links[0]?.company_id) {
    companies = await supabaseRequest(`/rest/v1/agendapro_companies?id=eq.${encodeURIComponent(links[0].company_id)}&select=*&limit=1`, { method: 'GET' }).catch(() => []);
    return Array.isArray(companies) ? companies[0] : null;
  }
  return null;
}

async function buildClientSession(email) {
  const account = await getAccountByEmail(email);
  if (!account) throw new Error('Conta não encontrada.');
  const company = await getPrimaryCompany(account.id);
  const token = issueSignedToken('client', { email: account.email, accountId: account.id, companyId: company?.id || null, slug: company?.slug || null }, 1000 * 60 * 60 * 24 * 7);
  return { token, account, company };
}

async function requireClient(req) {
  const token = getBearer(req) || req.headers['x-client-token'];
  const claims = verifySignedToken(token, 'client');
  if (!claims?.email) {
    const err = new Error('Sessão do cliente ausente ou expirada. Faça login novamente.');
    err.statusCode = 401;
    throw err;
  }
  const account = await getAccountByEmail(claims.email);
  if (!account) {
    const err = new Error('Conta não encontrada.');
    err.statusCode = 404;
    throw err;
  }
  const company = await getPrimaryCompany(account.id);
  return { claims, account, company, email: account.email, accountId: account.id, companyId: company?.id || null };
}

function requireDev(req) {
  const token = req.headers['x-dev-token'];
  const claims = verifySignedToken(token, 'dev');
  if (!claims) {
    const err = new Error('Token dev inválido ou expirado.');
    err.statusCode = 401;
    throw err;
  }
  return claims;
}

function handleError(res, error, fallback = 'Erro interno.') {
  applySecurityHeaders(res);
  const status = error.statusCode || 500;
  return res.status(status).json({ ok: false, message: error.message || fallback });
}

function slugify(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 56) || 'cliente-agendapro';
}

module.exports = { applySecurityHeaders, readJsonBody, cleanText, cleanEmail, cleanPhone, normalizePlan, supabaseRequest, authWithPassword, createAuthUser, issueSignedToken, verifySignedToken, requireClient, requireDev, handleError, slugify, getAccountByEmail, getPrimaryCompany, buildClientSession, safeEqual, logActivity };
