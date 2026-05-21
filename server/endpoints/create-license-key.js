const crypto = require('crypto');
const { applySecurityHeaders, readJsonBody, cleanText, requireDev, supabaseRequest, handleError, logActivity } = require('../_security');

function hashKey(raw) {
  const secret = process.env.DEV_ADMIN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'agendapro-local-dev-secret';
  return crypto.createHash('sha256').update(`${secret}:${String(raw).trim().toUpperCase()}`).digest('hex');
}

function randomPart(bytes = 3) {
  return crypto.randomBytes(bytes).toString('hex').toUpperCase();
}

function makeKey(type) {
  const prefix = type.includes('business') ? 'AGP-TRIAL-BIZ'
    : type.includes('essential') ? 'AGP-TRIAL-ESS'
      : type.includes('implementation') ? 'AGP-SETUP'
        : type.includes('temporary') ? 'AGP-TEMP'
          : type.includes('custom') ? 'AGP-CUSTOM'
            : 'AGP-TRIAL-PRO';
  return `${prefix}-${randomPart()}-${randomPart()}-${randomPart(2)}`;
}

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Método não permitido.' });
  }

  try {
    const dev = requireDev(req);
    const body = readJsonBody(req);
    const quantity = Math.max(1, Math.min(Number(body.quantity || 1), 50));
    const type = cleanText(body.type || 'trial_professional', 60).toLowerCase();
    const planId = ['essential', 'professional', 'business'].includes(String(body.planId || body.plan_id)) ? String(body.planId || body.plan_id) : 'professional';
    const durationDays = Math.max(1, Math.min(Number(body.durationDays || body.duration_days || 30), 3650));
    const maxUses = Math.max(1, Math.min(Number(body.maxUses || body.max_uses || 1), 500));
    const notes = cleanText(body.notes || '', 500);
    const visibleUntil = Math.max(1, Math.min(Number(body.validityDays || body.validity_days || 90), 3650));
    const keys = [];
    const hashes = new Set();
    const rows = [];

    for (let i = 0; i < quantity; i += 1) {
      let raw = makeKey(type);
      let hash = hashKey(raw);
      let attempts = 0;
      while (hashes.has(hash) && attempts < 10) {
        raw = makeKey(type);
        hash = hashKey(raw);
        attempts += 1;
      }
      if (hashes.has(hash)) throw new Error('Não foi possível gerar uma key única. Tente novamente.');
      hashes.add(hash);
      keys.push(raw);
      rows.push({
        key_hash: hash,
        key_prefix: `${raw.slice(0, 18)}••••`,
        type,
        plan_id: planId,
        duration_days: durationDays,
        status: 'available',
        max_uses: maxUses,
        uses_count: 0,
        expires_at: new Date(Date.now() + visibleUntil * 24 * 60 * 60 * 1000).toISOString(),
        notes,
        metadata: {
          created_by: dev.email,
          created_by_role: 'developer_console',
          plan_id: planId,
          duration_days: durationDays,
          max_uses: maxUses,
          duplicate_guard: 'sha256_unique_hash',
        },
      });
    }

    await supabaseRequest('/rest/v1/agendapro_license_keys', {
      method: 'POST',
      body: JSON.stringify(rows),
    });

    await supabaseRequest('/rest/v1/agendapro_dev_audit_logs', {
      method: 'POST',
      body: JSON.stringify({
        actor_email: dev.email,
        action: 'dev_license_key_create',
        entity_type: 'license_key',
        severity: 'success',
        description: `${quantity} key(s) gerada(s) para o plano ${planId}.`,
        after_data: rows.map(row => ({ key_prefix: row.key_prefix, type: row.type, plan_id: row.plan_id, duration_days: row.duration_days, max_uses: row.max_uses, expires_at: row.expires_at })),
        metadata: { quantity, type, plan_id: planId, max_uses: maxUses },
      }),
    }).catch(() => null);

    await logActivity({
      action: 'dev_license_key_create',
      title: 'Key promocional gerada',
      description: `${quantity} key(s) gerada(s) pela Central Dev.`,
      severity: 'success',
      metadata: { created_by: dev.email, quantity, type, plan_id: planId },
    });

    return res.status(200).json({ ok: true, keys, masked: rows.map(row => row.key_prefix) });
  } catch (error) {
    return handleError(res, error, 'Erro ao gerar key.');
  }
};
