const crypto = require('crypto');

function getSupabaseConfig() {
  return {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

async function supabaseRequest(path, options = {}) {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) throw new Error('Supabase service role nao configurada.');

  const response = await fetch(`${url.replace(/\/$/, '')}${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${text || response.statusText}`);
  return data;
}

function parseSignature(header) {
  const parts = {};
  String(header || '').split(',').forEach(part => {
    const [key, value] = part.split('=');
    if (key && value) parts[key.trim()] = value.trim();
  });
  return parts;
}

function getMercadoPagoSignatureInfo(req, dataId) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  const signatureHeader = req.headers['x-signature'];
  const requestId = req.headers['x-request-id'];

  if (!secret) return { configured: false, valid: true, storedValue: null, reason: 'secret_not_configured' };
  if (!signatureHeader || !requestId || !dataId) return { configured: true, valid: false, storedValue: false, reason: 'missing_signature_headers' };

  const signature = parseSignature(signatureHeader);
  if (!signature.ts || !signature.v1) return { configured: true, valid: false, storedValue: false, reason: 'invalid_signature_header' };

  const manifest = `id:${dataId};request-id:${requestId};ts:${signature.ts};`;
  const generated = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  try {
    const valid = crypto.timingSafeEqual(Buffer.from(generated), Buffer.from(signature.v1));
    return { configured: true, valid, storedValue: valid, reason: valid ? 'valid' : 'signature_mismatch' };
  } catch {
    return { configured: true, valid: false, storedValue: false, reason: 'signature_compare_failed' };
  }
}

function statusToAgendaPro(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'approved') return 'paid';
  if (normalized === 'rejected') return 'rejected';
  if (normalized === 'cancelled' || normalized === 'canceled') return 'cancelled';
  if (normalized === 'refunded' || normalized === 'charged_back') return 'cancelled';
  if (normalized === 'in_process' || normalized === 'in_mediation') return 'pending_review';
  return 'pending';
}

function accountPaymentStatus(status) {
  if (status === 'paid') return 'approved';
  if (status === 'rejected' || status === 'cancelled') return 'rejected';
  if (status === 'pending_review') return 'manual_pending';
  return 'pending';
}

async function safePatchEvent(eventRecord, payload) {
  if (!eventRecord?.id) return;
  await supabaseRequest(`/rest/v1/agendapro_payment_webhook_events?id=eq.${encodeURIComponent(eventRecord.id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ ...payload, updated_at: new Date().toISOString() }),
  }).catch(error => console.warn('Webhook event patch warning:', error.message));
}

async function safeLogActivity({ accountId, companyId, action, title, description, severity = 'info', metadata = {} }) {
  await supabaseRequest('/rest/v1/agendapro_client_activity_logs', {
    method: 'POST',
    body: JSON.stringify({ account_id: accountId || null, company_id: companyId || null, action, title, description, severity, metadata }),
  }).catch(error => console.warn('Webhook activity log warning:', error.message));
}

async function updateAccessFromPayment({ checkoutSession, status, payment, externalReference, approvedAt }) {
  if (!checkoutSession) return;

  const paymentStatus = accountPaymentStatus(status);
  const planId = checkoutSession.plan_id || payment.metadata?.plan_id || 'professional';
  const now = new Date().toISOString();
  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const paid = status === 'paid';
  const rejected = paymentStatus === 'rejected';

  if (!paid && !rejected) {
    await safeLogActivity({
      accountId: checkoutSession.account_id,
      companyId: checkoutSession.company_id,
      action: 'payment_pending',
      title: 'Pagamento em analise',
      description: 'Mercado Pago ainda nao aprovou o pagamento. O acesso existente foi preservado.',
      severity: 'info',
      metadata: { external_reference: externalReference, status, mp_payment_id: String(payment.id || '') },
    });
    return;
  }

  if (checkoutSession.account_id) {
    await supabaseRequest(`/rest/v1/agendapro_client_accounts?id=eq.${encodeURIComponent(checkoutSession.account_id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: paid ? 'active' : rejected ? 'pending' : 'pending',
        payment_status: paymentStatus,
        subscription_status: paid ? 'active' : 'pending',
        access_status: paid ? 'active' : 'pending',
        plan: planId,
        expires_at: paid ? periodEnd : null,
        plan_expires_at: paid ? periodEnd : null,
        updated_at: now,
      }),
    }).catch(error => console.warn('Account payment status update warning:', error.message));
  }

  if (checkoutSession.company_id) {
    await supabaseRequest(`/rest/v1/agendapro_companies?id=eq.${encodeURIComponent(checkoutSession.company_id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: paid ? 'active' : rejected ? 'pending' : 'pending',
        payment_status: paymentStatus,
        subscription_status: paid ? 'active' : 'pending',
        access_status: paid ? 'active' : 'pending',
        current_plan_id: planId,
        plan_started_at: paid ? (approvedAt || now) : null,
        plan_expires_at: paid ? periodEnd : null,
        onboarding_status: paid ? 'payment_approved' : 'payment_pending',
        readiness_score: paid ? 20 : 10,
        updated_at: now,
      }),
    }).catch(error => console.warn('Company payment status update warning:', error.message));
  }

  if (paid && planId !== 'implementation') {
    await supabaseRequest('/rest/v1/agendapro_subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        checkout_session_id: checkoutSession.id,
        account_id: checkoutSession.account_id || null,
        company_id: checkoutSession.company_id || null,
        plan_id: planId,
        plan_name: planId,
        status: 'active',
        external_reference: externalReference,
        started_at: approvedAt || now,
        current_period_end: periodEnd.slice(0, 10),
        metadata: {
          payer_email: payment.payer?.email || checkoutSession.payer_email,
          source: 'mercado_pago_webhook_v0630',
        },
      }),
    }).catch(error => console.warn('Subscription insert warning:', error.message));
  }

  await safeLogActivity({
    accountId: checkoutSession.account_id,
    companyId: checkoutSession.company_id,
    action: paid ? 'payment_approved' : rejected ? 'payment_rejected' : 'payment_pending',
    title: paid ? 'Pagamento aprovado' : rejected ? 'Pagamento recusado' : 'Pagamento em analise',
    description: paid ? 'Mercado Pago confirmou o pagamento e o plano foi liberado.' : rejected ? 'Mercado Pago recusou o pagamento.' : 'Mercado Pago ainda nao aprovou o pagamento.',
    severity: paid ? 'success' : rejected ? 'warning' : 'info',
    metadata: { external_reference: externalReference, status, mp_payment_id: String(payment.id || '') },
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Metodo nao permitido.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const dataId = body?.data?.id || body?.id || req.query?.['data.id'] || req.query?.id || null;
  const eventType = body?.type || req.query?.type || body?.topic || null;
  const action = body?.action || null;
  const signature = getMercadoPagoSignatureInfo(req, dataId);
  let eventRecord = null;

  try {
    const inserted = await supabaseRequest('/rest/v1/agendapro_payment_webhook_events', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        provider: 'mercado_pago',
        event_id: String(body?.id || dataId || ''),
        event_type: eventType,
        action,
        data_id: String(dataId || ''),
        live_mode: Boolean(body?.live_mode),
        signature_valid: signature.storedValue,
        processed: false,
        status: signature.valid ? 'received' : 'signature_error',
        payload: body || {},
        metadata: {
          signature_configured: signature.configured,
          signature_reason: signature.reason,
          source: 'mercado_pago_webhook_v0630',
        },
      }),
    });
    eventRecord = Array.isArray(inserted) ? inserted[0] : inserted;
  } catch (error) {
    console.warn('Webhook event save warning:', error.message);
  }

  if (!dataId) {
    await safePatchEvent(eventRecord, {
      status: 'ignored',
      processed: false,
      processing_error: 'Webhook recebido sem data.id.',
      processed_at: new Date().toISOString(),
    });
    return res.status(200).json({ ok: true, accepted: true, processed: false, message: 'Webhook recebido sem data.id.' });
  }

  if (!signature.valid) {
    await safePatchEvent(eventRecord, {
      status: 'signature_error',
      processed: false,
      processing_error: 'Assinatura Mercado Pago invalida ou ausente.',
      processed_at: new Date().toISOString(),
      metadata: { ...(eventRecord?.metadata || {}), signature_reason: signature.reason },
    });
    return res.status(200).json({ ok: false, accepted: true, processed: false, message: 'Assinatura invalida registrada para analise.' });
  }

  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      await safePatchEvent(eventRecord, {
        status: 'pending_manual_review',
        processed: false,
        processing_error: 'MERCADO_PAGO_ACCESS_TOKEN ausente; evento aguardando revisao manual.',
        processed_at: new Date().toISOString(),
      });
      return res.status(200).json({ ok: true, accepted: true, processed: false, message: 'Evento recebido e aguardando revisao manual.' });
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const payment = await mpResponse.json().catch(() => ({}));

    if (!mpResponse.ok) {
      await safePatchEvent(eventRecord, {
        status: 'gateway_error',
        processed: false,
        processing_error: `Mercado Pago ${mpResponse.status}`,
        processed_at: new Date().toISOString(),
      });
      return res.status(200).json({ ok: false, accepted: true, processed: false, message: 'Evento recebido; consulta ao pagamento falhou.' });
    }

    const externalReference = payment.external_reference || payment.metadata?.external_reference || '';
    const status = statusToAgendaPro(payment.status);
    const approvedAt = payment.status === 'approved' ? (payment.date_approved || new Date().toISOString()) : null;
    let checkoutSession = null;

    if (externalReference) {
      const sessions = await supabaseRequest(
        `/rest/v1/agendapro_checkout_sessions?external_reference=eq.${encodeURIComponent(externalReference)}&select=*`,
        { method: 'GET' }
      );
      checkoutSession = Array.isArray(sessions) ? sessions[0] : null;

      await supabaseRequest(`/rest/v1/agendapro_checkout_sessions?external_reference=eq.${encodeURIComponent(externalReference)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          mp_payment_id: String(payment.id || dataId),
          mp_collection_id: payment.collection_id ? String(payment.collection_id) : null,
          mp_merchant_order_id: payment.order?.id ? String(payment.order.id) : null,
          metadata: {
            ...(checkoutSession?.metadata || {}),
            payment_status: payment.status,
            payment_status_detail: payment.status_detail,
            payment_method_id: payment.payment_method_id,
            payment_type_id: payment.payment_type_id,
            last_webhook_at: new Date().toISOString(),
          },
        }),
      }).catch(error => console.warn('Checkout session update warning:', error.message));
    }

    const existingPayments = await supabaseRequest(
      `/rest/v1/agendapro_payments?mp_payment_id=eq.${encodeURIComponent(String(payment.id || dataId))}&select=id`,
      { method: 'GET' }
    );

    const paymentPayload = {
      checkout_session_id: checkoutSession?.id || null,
      account_id: checkoutSession?.account_id || null,
      company_id: checkoutSession?.company_id || null,
      external_reference: externalReference || null,
      mp_payment_id: String(payment.id || dataId),
      mp_preference_id: checkoutSession?.mp_preference_id || null,
      amount: Number(payment.transaction_amount || checkoutSession?.amount || 0),
      currency: 'BRL',
      provider: 'Mercado Pago',
      status,
      description: `AgendaPro - ${checkoutSession?.plan_id || 'pagamento'}`,
      payment_method_id: payment.payment_method_id || null,
      payment_type_id: payment.payment_type_id || null,
      payer_email: payment.payer?.email || checkoutSession?.payer_email || null,
      installments: payment.installments || null,
      approved_at: approvedAt,
      paid_at: approvedAt,
      raw_response: payment,
      metadata: {
        source: 'mercado_pago_webhook_v0630',
        status_detail: payment.status_detail || null,
      },
    };

    if (Array.isArray(existingPayments) && existingPayments.length) {
      await supabaseRequest(`/rest/v1/agendapro_payments?id=eq.${encodeURIComponent(existingPayments[0].id)}`, {
        method: 'PATCH',
        body: JSON.stringify(paymentPayload),
      });
    } else {
      await supabaseRequest('/rest/v1/agendapro_payments', {
        method: 'POST',
        body: JSON.stringify(paymentPayload),
      });
    }

    await updateAccessFromPayment({ checkoutSession, status, payment, externalReference, approvedAt });

    if (checkoutSession?.id) {
      await supabaseRequest(`/rest/v1/agendapro_onboarding_sessions?checkout_session_id=eq.${encodeURIComponent(checkoutSession.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: status === 'paid' ? 'payment_approved' : 'payment_pending',
          current_step: status === 'paid' ? 'business' : 'payment',
          completed_steps: status === 'paid' ? ['registration', 'payment'] : ['registration'],
          readiness_score: status === 'paid' ? 20 : 10,
        }),
      }).catch(error => console.warn('Onboarding update warning:', error.message));
    }

    await safePatchEvent(eventRecord, {
      status: status === 'paid' ? 'processed' : status,
      processed: true,
      processing_error: null,
      processed_at: new Date().toISOString(),
      metadata: {
        ...(eventRecord?.metadata || {}),
        external_reference: externalReference,
        mp_payment_id: String(payment.id || dataId),
        payment_status: payment.status,
        agenda_status: status,
      },
    });

    return res.status(200).json({
      ok: true,
      accepted: true,
      processed: true,
      status,
      externalReference,
    });
  } catch (error) {
    console.error('mercadopago-webhook error:', error.message || error);

    await safePatchEvent(eventRecord, {
      status: 'error',
      processed: false,
      processing_error: error.message || 'Erro desconhecido',
      processed_at: new Date().toISOString(),
    });

    return res.status(200).json({
      ok: false,
      accepted: true,
      processed: false,
      message: 'Webhook recebido, mas o processamento precisa de revisao.',
    });
  }
};
