const crypto = require('crypto');

function getSupabaseConfig() {
  return {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY
  };
}

async function supabaseRequest(path, options = {}) {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) throw new Error('Supabase service role não configurada.');

  const response = await fetch(`${url.replace(/\/$/, '')}${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
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

function parseSignature(header) {
  const parts = {};
  String(header || '').split(',').forEach(part => {
    const [key, value] = part.split('=');
    if (key && value) parts[key.trim()] = value.trim();
  });
  return parts;
}

function verifyMercadoPagoSignature(req, dataId) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  const signatureHeader = req.headers['x-signature'];
  const requestId = req.headers['x-request-id'];

  if (!secret || !signatureHeader || !requestId || !dataId) return false;

  const signature = parseSignature(signatureHeader);
  if (!signature.ts || !signature.v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${signature.ts};`;
  const generated = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(generated), Buffer.from(signature.v1));
  } catch {
    return false;
  }
}

function statusToAgendaPro(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'approved') return 'paid';
  if (normalized === 'rejected') return 'failed';
  if (normalized === 'cancelled' || normalized === 'canceled') return 'canceled';
  if (normalized === 'refunded' || normalized === 'charged_back') return 'canceled';
  return 'pending';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Método não permitido.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const dataId =
    body?.data?.id ||
    body?.id ||
    req.query?.['data.id'] ||
    req.query?.id ||
    null;

  const eventType = body?.type || req.query?.type || body?.topic || null;
  const action = body?.action || null;
  const signatureValid = verifyMercadoPagoSignature(req, dataId);

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
        signature_valid: signatureValid,
        processed: false,
        payload: body || {}
      })
    });
    eventRecord = Array.isArray(inserted) ? inserted[0] : inserted;
  } catch (error) {
    console.warn('Webhook event save warning:', error.message);
  }

  if (!dataId) {
    return res.status(200).json({ ok: true, message: 'Webhook recebido sem data.id.' });
  }

  if (!signatureValid) {
    if (eventRecord?.id) {
      await supabaseRequest(`/rest/v1/agendapro_payment_webhook_events?id=eq.${eventRecord.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          processed: false,
          processing_error: 'Assinatura Mercado Pago inválida ou ausente.',
          processed_at: new Date().toISOString()
        })
      }).catch(() => null);
    }
    return res.status(401).json({ ok: false, message: 'Assinatura Mercado Pago inválida.' });
  }

  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado.');

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const payment = await mpResponse.json();
    if (!mpResponse.ok) throw new Error(JSON.stringify(payment));

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
            last_webhook_at: new Date().toISOString()
          }
        })
      });
    }

    const existingPayments = await supabaseRequest(
      `/rest/v1/agendapro_payments?mp_payment_id=eq.${encodeURIComponent(String(payment.id || dataId))}&select=id`,
      { method: 'GET' }
    );

    const paymentPayload = {
      checkout_session_id: checkoutSession?.id || null,
      external_reference: externalReference || null,
      mp_payment_id: String(payment.id || dataId),
      mp_preference_id: checkoutSession?.mp_preference_id || null,
      amount: Number(payment.transaction_amount || checkoutSession?.amount || 0),
      provider: 'Mercado Pago',
      status,
      description: `AgendaPro — ${checkoutSession?.plan_id || 'pagamento'}`,
      payment_method_id: payment.payment_method_id || null,
      payment_type_id: payment.payment_type_id || null,
      payer_email: payment.payer?.email || checkoutSession?.payer_email || null,
      installments: payment.installments || null,
      approved_at: approvedAt,
      paid_at: approvedAt,
      raw_response: payment
    };

    if (Array.isArray(existingPayments) && existingPayments.length) {
      await supabaseRequest(`/rest/v1/agendapro_payments?id=eq.${existingPayments[0].id}`, {
        method: 'PATCH',
        body: JSON.stringify(paymentPayload)
      });
    } else {
      await supabaseRequest('/rest/v1/agendapro_payments', {
        method: 'POST',
        body: JSON.stringify(paymentPayload)
      });
    }

    if (status === 'paid' && checkoutSession?.plan_id && checkoutSession.plan_id !== 'implementation') {
      await supabaseRequest('/rest/v1/agendapro_subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          checkout_session_id: checkoutSession.id,
          plan_id: checkoutSession.plan_id,
          plan_name: checkoutSession.plan_id,
          status: 'active',
          external_reference: externalReference,
          started_at: approvedAt || new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          metadata: {
            payer_email: payment.payer?.email || checkoutSession.payer_email,
            source: 'mercado_pago_webhook'
          }
        })
      }).catch(error => console.warn('Subscription insert warning:', error.message));
    }

    if (checkoutSession?.id) {
      await supabaseRequest(`/rest/v1/agendapro_onboarding_sessions?checkout_session_id=eq.${checkoutSession.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: status === 'paid' ? 'payment_approved' : 'payment_pending',
          current_step: status === 'paid' ? 'business' : 'payment',
          completed_steps: status === 'paid' ? ['registration', 'payment'] : ['registration'],
          readiness_score: status === 'paid' ? 20 : 10
        })
      }).catch(error => console.warn('Onboarding update warning:', error.message));
    }

    if (eventRecord?.id) {
      await supabaseRequest(`/rest/v1/agendapro_payment_webhook_events?id=eq.${eventRecord.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          processed: true,
          processed_at: new Date().toISOString()
        })
      });
    }

    return res.status(200).json({
      ok: true,
      processed: true,
      status,
      externalReference
    });
  } catch (error) {
    console.error('mercadopago-webhook error:', error);

    if (eventRecord?.id) {
      await supabaseRequest(`/rest/v1/agendapro_payment_webhook_events?id=eq.${eventRecord.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          processed: false,
          processing_error: error.message || 'Erro desconhecido',
          processed_at: new Date().toISOString()
        })
      }).catch(() => null);
    }

    return res.status(200).json({
      ok: false,
      message: error.message || 'Erro ao processar webhook.'
    });
  }
};
