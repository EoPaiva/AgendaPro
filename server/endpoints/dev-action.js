const { applySecurityHeaders, readJsonBody, cleanText, requireDev, supabaseRequest, handleError, logActivity, slugify } = require('../_security');

function normalizeStatus(value) {
  const text = cleanText(value, 60).toLowerCase();
  const map = {
    aprovado: 'approved', aprovar: 'approved', approve: 'approved', approved: 'approved', paid: 'paid',
    rejeitado: 'rejected', reprovar: 'rejected', reject: 'rejected', rejected: 'rejected', recusado: 'rejected',
    ajuste: 'needs_adjustment', ajustar: 'needs_adjustment', needs_adjustment: 'needs_adjustment', request_adjustment: 'needs_adjustment',
    cancelado: 'cancelled', cancel: 'cancelled', cancelled: 'cancelled',
    ativo: 'active', ativar: 'active', active: 'active',
    suspenso: 'suspended', suspender: 'suspended', suspended: 'suspended',
    pausado: 'paused', pausar: 'paused', paused: 'paused',
    publicar: 'published', publish: 'published', published: 'published',
    rascunho: 'draft', draft: 'draft',
    confirm: 'confirmed', confirmar: 'confirmed', confirmed: 'confirmed',
    concluir: 'completed', complete: 'completed', completed: 'completed',
    faltou: 'no_show', no_show: 'no_show',
    revogada: 'revoked', revoke: 'revoked', revogar: 'revoked', revoked: 'revoked',
    disabled: 'disabled', disable: 'disabled', desativar: 'disabled',
    available: 'available', reativar: 'available', reactivate: 'available',
    deleted: 'deleted', excluir: 'deleted', arquivar: 'deleted',
    resolvido: 'resolved', resolve: 'resolved', resolved: 'resolved',
    erro: 'error', error: 'error', failed: 'failed',
    pending: 'pending', pendente: 'pending', pending_review: 'pending_review',
  };
  return map[text] || text || 'pending';
}

function compact(payload) {
  const next = {};
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined) return;
    if (typeof value === 'string' && value.trim() === '') {
      next[key] = null;
      return;
    }
    next[key] = value;
  });
  return next;
}

function pick(payload, allowed) {
  const result = {};
  allowed.forEach(key => {
    if (payload[key] !== undefined) result[key] = payload[key];
  });
  return compact(result);
}

function normalizePayload(payload) {
  const next = { ...(payload || {}) };
  ['name', 'business_name', 'full_name', 'email', 'payer_email', 'whatsapp', 'phone', 'address', 'description', 'notes', 'note', 'review_note', 'internal_note', 'processing_error', 'title'].forEach(key => {
    if (next[key] !== undefined && next[key] !== null) next[key] = cleanText(next[key], key.includes('description') || key.includes('note') || key.includes('error') ? 1200 : 240);
  });
  ['plan', 'plan_id', 'current_plan_id', 'status', 'subscription_status', 'payment_status', 'onboarding_status', 'type', 'priority'].forEach(key => {
    if (next[key] !== undefined && next[key] !== null) next[key] = cleanText(next[key], 80).toLowerCase();
  });
  ['duration_days', 'max_uses', 'uses_count', 'readiness_score', 'reprocess_count'].forEach(key => {
    if (next[key] !== undefined && next[key] !== null && next[key] !== '') next[key] = Number(next[key]);
  });
  ['amount', 'value', 'price', 'setup'].forEach(key => {
    if (next[key] !== undefined && next[key] !== null && next[key] !== '') next[key] = Number(String(next[key]).replace(',', '.'));
  });
  ['published', 'processed', 'signature_valid', 'include_implementation', 'is_active'].forEach(key => {
    if (next[key] !== undefined && next[key] !== null) next[key] = next[key] === true || next[key] === 'true' || next[key] === '1' || next[key] === 'yes';
  });
  if (next.slug) next.slug = slugify(next.slug);
  if (next.public_slug) next.public_slug = slugify(next.public_slug);
  if (next.expires_at) next.expires_at = new Date(next.expires_at).toISOString();
  if (next.plan_expires_at) next.plan_expires_at = new Date(next.plan_expires_at).toISOString();
  return next;
}

async function getOne(table, id) {
  if (!id) return null;
  const rows = await supabaseRequest(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&select=*&limit=1`, { method: 'GET' }).catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : rows;
}

async function patchById(table, id, payload) {
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
  return supabaseRequest(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(payload),
  });
}

async function postRows(table, payload) {
  return supabaseRequest(`/rest/v1/${table}`, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(payload),
  });
}

async function upsertRows(table, payload, onConflict = 'key') {
  return supabaseRequest(`/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(payload),
  });
}

async function writeAudit({ admin, action, entity, id, severity = 'info', description, beforeData = null, afterData = null, metadata = {} }) {
  const row = {
    actor_email: admin.email || null,
    action: `dev_${entity}_${action}`,
    entity_type: entity,
    entity_id: id || null,
    severity,
    description: description || `Central Dev executou ${action} em ${entity}${id ? ` (${id})` : ''}.`,
    before_data: beforeData,
    after_data: afterData,
    metadata: { ...metadata, source: 'central_dev', actor_role: admin.role || 'developer' },
  };

  await postRows('agendapro_dev_audit_logs', row).catch(error => {
    console.warn('Dev audit ignored.');
  });

  await logActivity({
    accountId: metadata.account_id || beforeData?.account_id || afterData?.account_id || null,
    companyId: metadata.company_id || beforeData?.company_id || afterData?.company_id || null,
    action: row.action,
    title: description || 'Ação administrativa executada',
    description: row.description,
    severity,
    metadata: row.metadata,
  });
}

async function activateManualPayment({ payment, admin, reason, payload, now }) {
  const planId = payment.plan_id || payload.plan_id || payload.plan || 'professional';
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await postRows('agendapro_payments', {
    account_id: payment.account_id || null,
    company_id: payment.company_id || null,
    external_reference: `MANUAL-${payment.id}`,
    amount: Number(payment.amount || payload.amount || 0),
    currency: 'BRL',
    provider: 'manual_mercado_pago',
    status: 'paid',
    description: `Pagamento manual ${payment.plan_name || planId}`,
    payer_email: payment.email || payload.email || null,
    approved_at: now,
    paid_at: now,
    metadata: { manual_payment_request_id: payment.id, reviewed_by: admin.email, reason: reason || null },
  }).catch(() => console.warn('Manual payment mirror ignored.'));

  if (payment.account_id) {
    await patchById('agendapro_client_accounts', payment.account_id, compact({
      status: 'active',
      payment_status: 'approved',
      subscription_status: 'active',
      plan: planId,
      expires_at: expiresAt,
      updated_at: now,
      metadata: { ...(payment.metadata || {}), manual_payment_approved_by: admin.email, manual_payment_approved_at: now },
    })).catch(() => console.warn('Account activation ignored.'));
  }

  if (payment.company_id) {
    await patchById('agendapro_companies', payment.company_id, compact({
      status: 'active',
      current_plan_id: planId,
      subscription_status: 'active',
      plan_started_at: now,
      plan_expires_at: expiresAt,
      onboarding_status: 'payment_approved',
      readiness_score: 20,
      updated_at: now,
    })).catch(() => console.warn('Company activation ignored.'));
  }
}

async function updateCommercialAccess({ accountId, companyId, planId = 'professional', paymentStatus = 'approved', subscriptionStatus = 'active', accessStatus = 'active', expiresAt = null, admin, reason, now }) {
  if (accountId) {
    await patchById('agendapro_client_accounts', accountId, compact({
      status: accessStatus === 'active' ? 'active' : 'pending',
      payment_status: paymentStatus,
      subscription_status: subscriptionStatus,
      access_status: accessStatus,
      plan: planId,
      expires_at: expiresAt,
      plan_expires_at: expiresAt,
      updated_at: now,
      access_metadata: { source: 'central_dev', reviewed_by: admin.email, reason, updated_at: now },
    })).catch(() => console.warn('Account commercial access ignored.'));
  }

  if (companyId) {
    await patchById('agendapro_companies', companyId, compact({
      status: accessStatus === 'active' ? 'active' : 'pending',
      payment_status: paymentStatus,
      subscription_status: subscriptionStatus,
      access_status: accessStatus,
      current_plan_id: planId,
      plan_started_at: accessStatus === 'active' ? now : undefined,
      plan_expires_at: expiresAt,
      onboarding_status: accessStatus === 'active' ? 'payment_approved' : 'payment_pending',
      readiness_score: accessStatus === 'active' ? 20 : 10,
      updated_at: now,
      access_metadata: { source: 'central_dev', reviewed_by: admin.email, reason, updated_at: now },
    })).catch(() => console.warn('Company commercial access ignored.'));
  }
}

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Método não permitido.' });
  }

  try {
    const admin = await requireDev(req);
    const body = readJsonBody(req);
    const action = cleanText(body.action, 80);
    const entity = cleanText(body.entity, 80);
    const id = cleanText(body.id, 140);
    const reason = cleanText(body.reason || body.payload?.reason || '', 1200);
    const payload = normalizePayload(body.payload && typeof body.payload === 'object' ? body.payload : {});
    const now = new Date().toISOString();

    if (!action || !entity) return res.status(400).json({ ok: false, message: 'Informe entidade e ação.' });

    let result = null;
    let beforeData = null;
    let afterData = null;
    let severity = 'info';
    let auditDescription = '';

    if (entity === 'manual_payment') {
      if (!id) return res.status(400).json({ ok: false, message: 'Informe o pagamento manual.' });
      beforeData = await getOne('agendapro_manual_payment_requests', id);
      if (!beforeData) return res.status(404).json({ ok: false, message: 'Pagamento manual não encontrado.' });
      const status = normalizeStatus(payload.status || action);
      const patch = compact({
        ...pick(payload, ['plan_id', 'plan_name', 'amount', 'note', 'payment_link']),
        status,
        reviewed_at: ['approved', 'rejected', 'needs_adjustment'].includes(status) ? now : payload.reviewed_at,
        reviewed_by: ['approved', 'rejected', 'needs_adjustment'].includes(status) ? admin.email : payload.reviewed_by,
        review_note: reason || payload.review_note || payload.note || null,
        updated_at: now,
        metadata: { ...(beforeData.metadata || {}), source: 'central_dev', action, reason, reviewed_by: admin.email, reviewed_at: now },
      });
      result = await patchById('agendapro_manual_payment_requests', id, patch);
      afterData = Array.isArray(result) ? result[0] : result;
      if (status === 'approved') await activateManualPayment({ payment: afterData || beforeData, admin, reason, payload, now });
      severity = status === 'approved' ? 'success' : status === 'rejected' ? 'warning' : 'info';
      auditDescription = status === 'approved' ? 'Pagamento manual aprovado e plano liberado.' : status === 'rejected' ? 'Pagamento manual reprovado sem liberar plano.' : 'Pagamento manual atualizado pela Central Dev.';
    } else if (entity === 'payment') {
      if (!id) return res.status(400).json({ ok: false, message: 'Informe o pagamento.' });
      beforeData = await getOne('agendapro_payments', id);
      if (!beforeData) return res.status(404).json({ ok: false, message: 'Pagamento não encontrado.' });
      const status = normalizeStatus(payload.status || action);
      const mappedStatus = ['approved', 'paid'].includes(status) ? 'paid' : ['rejected', 'failed'].includes(status) ? 'rejected' : status;
      const patch = compact({
        ...pick(payload, ['amount', 'description', 'payer_email', 'metadata']),
        status: mappedStatus,
        approved_at: mappedStatus === 'paid' ? (beforeData.approved_at || now) : payload.approved_at,
        paid_at: mappedStatus === 'paid' ? (beforeData.paid_at || now) : payload.paid_at,
        metadata: { ...(beforeData.metadata || {}), ...(payload.metadata || {}), source: 'central_dev', action, reason, reviewed_by: admin.email, reviewed_at: now },
        updated_at: now,
      });
      result = await patchById('agendapro_payments', id, patch);
      afterData = Array.isArray(result) ? result[0] : result;
      let session = null;
      if (beforeData.checkout_session_id) session = await getOne('agendapro_checkout_sessions', beforeData.checkout_session_id).catch(() => null);
      const accountId = beforeData.account_id || session?.account_id || payload.account_id || null;
      const companyId = beforeData.company_id || session?.company_id || payload.company_id || null;
      const planId = session?.plan_id || payload.plan_id || beforeData.plan_id || 'professional';
      if (mappedStatus === 'paid') {
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await updateCommercialAccess({ accountId, companyId, planId, paymentStatus: 'approved', subscriptionStatus: 'active', accessStatus: 'active', expiresAt, admin, reason, now });
      } else if (mappedStatus === 'rejected') {
        await updateCommercialAccess({ accountId, companyId, planId, paymentStatus: 'rejected', subscriptionStatus: 'pending', accessStatus: 'pending', expiresAt: null, admin, reason, now });
      }
      severity = mappedStatus === 'paid' ? 'success' : mappedStatus === 'rejected' ? 'warning' : 'info';
      auditDescription = mappedStatus === 'paid' ? 'Pagamento automático marcado como aprovado e plano liberado.' : mappedStatus === 'rejected' ? 'Pagamento automático marcado como recusado.' : 'Pagamento automático atualizado pela Central Dev.';
    } else if (entity === 'client') {
      if (!id) return res.status(400).json({ ok: false, message: 'Informe o cliente.' });
      beforeData = await getOne('agendapro_client_accounts', id);
      if (action === 'temporary_access') {
        const planId = payload.plan || payload.plan_id || beforeData?.plan || 'professional';
        const expiresAt = new Date(Date.now() + Number(payload.duration_days || 7) * 24 * 60 * 60 * 1000).toISOString();
        payload.status = 'active';
        payload.plan = planId;
        payload.payment_status = 'approved_manual';
        payload.subscription_status = 'active';
        payload.access_status = 'active';
        payload.expires_at = expiresAt;
        payload.plan_expires_at = expiresAt;
        payload.internal_note = reason || payload.internal_note || beforeData?.internal_note || null;
      }
      const allowed = pick(payload, ['full_name', 'name', 'email', 'phone', 'whatsapp', 'status', 'plan', 'payment_status', 'subscription_status', 'access_status', 'expires_at', 'plan_expires_at', 'company_id', 'internal_note', 'metadata']);
      allowed.updated_at = now;
      result = await patchById('agendapro_client_accounts', id, allowed);
      afterData = Array.isArray(result) ? result[0] : result;
      severity = action === 'temporary_access' ? 'warning' : 'info';
      auditDescription = action === 'temporary_access' ? 'Acesso temporário liberado pela Central Dev.' : 'Cliente atualizado pela Central Dev.';
    } else if (entity === 'company') {
      if (!id) return res.status(400).json({ ok: false, message: 'Informe a empresa.' });
      beforeData = await getOne('agendapro_companies', id);
      if (action === 'temporary_access') {
        const planId = payload.current_plan_id || payload.plan || beforeData?.current_plan_id || beforeData?.plan || 'professional';
        const expiresAt = new Date(Date.now() + Number(payload.duration_days || 7) * 24 * 60 * 60 * 1000).toISOString();
        payload.status = 'active';
        payload.current_plan_id = planId;
        payload.payment_status = 'approved_manual';
        payload.subscription_status = 'active';
        payload.access_status = 'active';
        payload.plan_started_at = now;
        payload.plan_expires_at = expiresAt;
      }
      const allowed = pick(payload, ['name', 'business_name', 'slug', 'public_slug', 'category', 'status', 'phone', 'whatsapp', 'email', 'address', 'description', 'plan', 'current_plan_id', 'payment_status', 'subscription_status', 'access_status', 'plan_started_at', 'plan_expires_at', 'onboarding_status', 'theme_color', 'metadata']);
      if (allowed.public_slug && !allowed.slug) allowed.slug = allowed.public_slug;
      allowed.updated_at = now;
      result = await patchById('agendapro_companies', id, allowed);
      afterData = Array.isArray(result) ? result[0] : result;
      severity = action === 'temporary_access' || ['suspended', 'cancelled'].includes(String(allowed.status || allowed.subscription_status)) ? 'warning' : 'info';
      auditDescription = action === 'temporary_access' ? 'Acesso temporário da empresa liberado pela Central Dev.' : 'Empresa atualizada pela Central Dev.';
    } else if (entity === 'agenda') {
      if (!id) return res.status(400).json({ ok: false, message: 'Informe a agenda.' });
      beforeData = await getOne('agendapro_created_agendas', id);
      const status = ['publish', 'publicar'].includes(action) ? 'published' : ['pause', 'pausar'].includes(action) ? 'paused' : ['reactivate', 'reativar'].includes(action) ? 'published' : payload.status;
      const allowed = pick({ ...payload, status }, ['business_name', 'public_slug', 'status', 'published', 'phone', 'whatsapp', 'email', 'address', 'description', 'segment', 'plan_id', 'theme_color', 'theme', 'services', 'team', 'hours', 'rules', 'schedule_config', 'raw_payload', 'metadata']);
      if (allowed.status === 'published' && !allowed.published_at) allowed.published_at = now;
      if (allowed.status === 'published') allowed.published = true;
      if (['paused', 'draft', 'suspended'].includes(String(allowed.status))) allowed.published = false;
      allowed.updated_at = now;
      result = await patchById('agendapro_created_agendas', id, allowed);
      afterData = Array.isArray(result) ? result[0] : result;
      auditDescription = 'Agenda atualizada pela Central Dev.';
    } else if (entity === 'appointment') {
      if (!id) return res.status(400).json({ ok: false, message: 'Informe o agendamento.' });
      beforeData = await getOne('agendapro_public_booking_requests', id);
      const status = normalizeStatus(payload.status || action);
      result = await patchById('agendapro_public_booking_requests', id, compact({
        ...pick(payload, ['customer_name', 'customer_phone', 'customer_email', 'service_name', 'requested_time', 'notes']),
        status,
        updated_at: now,
        metadata: { ...(beforeData?.metadata || {}), source: 'central_dev', action, reason, reviewed_by: admin.email },
      }));
      afterData = Array.isArray(result) ? result[0] : result;
      auditDescription = `Agendamento marcado como ${status}.`;
    } else if (entity === 'license_key') {
      if (!id) return res.status(400).json({ ok: false, message: 'Informe a key.' });
      beforeData = await getOne('agendapro_license_keys', id);
      const status = ['revoke', 'disable', 'reactivate', 'delete'].includes(action) ? normalizeStatus(action) : payload.status;
      const allowed = pick({ ...payload, status }, ['type', 'plan_id', 'duration_days', 'status', 'max_uses', 'uses_count', 'expires_at', 'notes', 'metadata']);
      if (action === 'renew' && !allowed.expires_at) allowed.expires_at = new Date(Date.now() + Number(payload.duration_days || beforeData?.duration_days || 30) * 24 * 60 * 60 * 1000).toISOString();
      if (allowed.status === 'revoked') allowed.revoked_at = now;
      allowed.updated_at = now;
      allowed.metadata = { ...(beforeData?.metadata || {}), ...(allowed.metadata || {}), last_dev_action: action, reviewed_by: admin.email, reason };
      result = await patchById('agendapro_license_keys', id, allowed);
      afterData = Array.isArray(result) ? result[0] : result;
      severity = ['revoked', 'disabled', 'deleted'].includes(String(allowed.status)) ? 'warning' : 'info';
      auditDescription = `Key atualizada: ${allowed.status || action}.`;
    } else if (entity === 'webhook') {
      if (!id) return res.status(400).json({ ok: false, message: 'Informe o webhook.' });
      beforeData = await getOne('agendapro_payment_webhook_events', id);
      const allowed = pick(payload, ['status', 'processed', 'processing_error', 'metadata']);
      if (action === 'resolve') {
        allowed.status = 'resolved';
        allowed.processed = true;
        allowed.processing_error = null;
        allowed.resolved_at = now;
        allowed.resolved_by = admin.email;
      }
      if (action === 'reprocess') {
        allowed.status = 'pending';
        allowed.processed = false;
        allowed.processing_error = null;
        allowed.reprocess_count = Number(beforeData?.reprocess_count || 0) + 1;
        allowed.metadata = { ...(beforeData?.metadata || {}), reprocess_requested_by: admin.email, reprocess_requested_at: now };
      }
      result = await patchById('agendapro_payment_webhook_events', id, compact({ ...allowed, updated_at: now }));
      afterData = Array.isArray(result) ? result[0] : result;
      severity = action === 'reprocess' ? 'warning' : 'info';
      auditDescription = `Webhook ${action === 'reprocess' ? 'reprocessado' : 'atualizado'} pela Central Dev.`;
    } else if (entity === 'briefing') {
      if (!id) return res.status(400).json({ ok: false, message: 'Informe o briefing.' });
      beforeData = await getOne('agendapro_quick_briefings', id);
      if (action === 'convert_to_implementation') {
        const inserted = await postRows('agendapro_support_cases', {
          client_id: beforeData?.account_id || null,
          company_id: beforeData?.company_id || null,
          title: `Implantação — ${beforeData?.business_name || beforeData?.company_name || beforeData?.name || 'AgendaPro'}`,
          description: beforeData?.notes || beforeData?.description || 'Implantação criada a partir de briefing.',
          status: 'aguardando briefing',
          priority: payload.priority || 'normal',
          responsible_email: admin.email,
          metadata: { source: 'briefing', briefing_id: id, original: beforeData || {} },
        }).catch(() => null);
        const implementationId = Array.isArray(inserted) ? inserted[0]?.id : inserted?.id;
        result = await patchById('agendapro_quick_briefings', id, compact({ status: 'converted', converted_at: now, converted_to_implementation_id: implementationId, internal_note: reason || payload.internal_note || null, updated_at: now }));
      } else {
        result = await patchById('agendapro_quick_briefings', id, compact({ ...pick(payload, ['status', 'internal_note', 'priority', 'notes', 'metadata']), updated_at: now }));
      }
      afterData = Array.isArray(result) ? result[0] : result;
      auditDescription = action === 'convert_to_implementation' ? 'Briefing convertido em implantação.' : 'Briefing atualizado pela Central Dev.';
    } else if (entity === 'implementation') {
      if (!id) return res.status(400).json({ ok: false, message: 'Informe a implantação.' });
      beforeData = await getOne('agendapro_support_cases', id);
      const status = ['complete', 'concluir'].includes(action) ? 'completed' : payload.status;
      result = await patchById('agendapro_support_cases', id, compact({ ...pick({ ...payload, status }, ['title', 'description', 'status', 'priority', 'responsible_email', 'resolution', 'metadata']), updated_at: now }));
      afterData = Array.isArray(result) ? result[0] : result;
      auditDescription = 'Implantação atualizada pela Central Dev.';
    } else if (entity === 'setting' || entity === 'plan') {
      const key = entity === 'plan' ? `plan:${cleanText(payload.id || payload.key || body.id || 'custom', 80).toLowerCase()}` : cleanText(payload.key || body.id, 120);
      if (!key) return res.status(400).json({ ok: false, message: 'Informe a chave de configuração.' });
      beforeData = (await supabaseRequest(`/rest/v1/agendapro_admin_settings?key=eq.${encodeURIComponent(key)}&select=*&limit=1`).catch(() => []))[0] || null;
      const value = entity === 'plan'
        ? { name: payload.name, price: payload.price, setup: payload.setup, status: payload.status || 'active', payment_link: payload.payment_link, description: payload.description, features: payload.features }
        : (typeof payload.value === 'object' ? payload.value : { value: payload.value, status: payload.status, description: payload.description });
      result = await upsertRows('agendapro_admin_settings', { key, value, description: payload.description || beforeData?.description || key, updated_by: admin.email, updated_at: now }, 'key');
      afterData = Array.isArray(result) ? result[0] : result;
      auditDescription = entity === 'plan' ? 'Plano/configuração comercial atualizado.' : 'Configuração interna atualizada.';
    } else if (entity === 'support_note') {
      const note = cleanText(payload.note || reason, 2000);
      if (!note) return res.status(400).json({ ok: false, message: 'Informe a observação de suporte.' });
      result = await postRows('agendapro_support_notes', {
        entity_type: payload.entity_type || payload.target_entity || 'general',
        entity_id: payload.entity_id || id || null,
        client_id: payload.client_id || null,
        company_id: payload.company_id || null,
        agenda_id: payload.agenda_id || null,
        author_email: admin.email,
        priority: payload.priority || 'normal',
        status: payload.status || 'open',
        note,
        metadata: { source: 'central_dev', action },
      });
      afterData = Array.isArray(result) ? result[0] : result;
      auditDescription = 'Observação de suporte adicionada.';
    } else {
      await writeAudit({
        admin,
        action: action || 'unknown_action',
        entity: entity || 'unknown_entity',
        id,
        severity: 'warning',
        description: 'A Central Dev recebeu uma acao inexistente ou ainda nao automatizada.',
        beforeData: null,
        afterData: null,
        metadata: { reason, payload, unknown_action: action, unknown_entity: entity },
      });
      return res.status(400).json({ ok: false, code: 'DEV_ACTION_NOT_SUPPORTED', message: 'Essa acao ainda nao possui automacao segura na Central Dev.' });
    }

    await writeAudit({
      admin,
      action,
      entity,
      id,
      severity,
      description: auditDescription,
      beforeData,
      afterData,
      metadata: { reason, account_id: afterData?.account_id || beforeData?.account_id, company_id: afterData?.company_id || beforeData?.company_id },
    });

    return res.status(200).json({ ok: true, action, entity, result, before: beforeData, after: afterData });
  } catch (error) {
    return handleError(res, error, 'Erro ao executar acao administrativa.');
  }
};
