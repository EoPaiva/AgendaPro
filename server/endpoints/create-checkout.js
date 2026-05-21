const crypto = require('crypto');
const {
  applySecurityHeaders,
  readJsonBody,
  cleanText,
  requireClient,
  supabaseRequest,
  handleError,
  logActivity,
} = require('../_security');

const PLAN_CATALOG = {
  essential: { id: 'essential', name: 'Essencial', price: 49.9, description: 'Plano Essencial AgendaPro' },
  professional: { id: 'professional', name: 'Profissional', price: 99.9, description: 'Plano Profissional AgendaPro' },
  business: { id: 'business', name: 'Empresa', price: 199.9, description: 'Plano Empresa AgendaPro' },
  implementation: { id: 'implementation', name: 'Implantacao assistida', price: 100, description: 'Implantacao assistida AgendaPro' },
};

const MANUAL_PAYMENT_LINKS = {
  essential: process.env.VITE_MERCADO_PAGO_ESSENTIAL_LINK || 'https://mpago.la/2aynw39',
  professional: process.env.VITE_MERCADO_PAGO_PROFESSIONAL_LINK || 'https://mpago.la/1D2cMK7',
  business: process.env.VITE_MERCADO_PAGO_BUSINESS_LINK || 'https://mpago.la/1ZJRTao',
  implementation: process.env.VITE_MERCADO_PAGO_IMPLEMENTATION_LINK || 'https://mpago.la/17N4Eme',
};

function getAppUrl(req) {
  const configured = process.env.APP_URL || process.env.VITE_APP_URL;
  if (configured) return configured.replace(/\/$/, '');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
}

function requestedPlanId(value) {
  const raw = cleanText(value || 'professional', 40).toLowerCase();
  return Object.prototype.hasOwnProperty.call(PLAN_CATALOG, raw) ? raw : null;
}

function buildFallbackLinks(planId, includeImplementation) {
  const links = [];
  const primary = MANUAL_PAYMENT_LINKS[planId] || MANUAL_PAYMENT_LINKS.professional;
  links.push({ id: planId, label: PLAN_CATALOG[planId]?.name || 'Plano AgendaPro', url: primary });
  if (includeImplementation && planId !== 'implementation') {
    links.push({ id: 'implementation', label: PLAN_CATALOG.implementation.name, url: MANUAL_PAYMENT_LINKS.implementation });
  }
  return links.filter(item => item.url);
}

async function safePatchCheckoutSession(checkoutSession, payload) {
  if (!checkoutSession?.id) return;
  await supabaseRequest(`/rest/v1/agendapro_checkout_sessions?id=eq.${encodeURIComponent(checkoutSession.id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }).catch(() => console.warn('checkout session patch ignored.'));
}

function checkoutFallbackResponse({ res, checkoutSession, externalReference, plan, amount, includeImplementation, reason }) {
  const links = buildFallbackLinks(plan.id, includeImplementation);
  return res.status(200).json({
    ok: true,
    fallback: true,
    mode: 'manual_review',
    message: 'Checkout automatico indisponivel no momento. Use o pagamento manual; o acesso sera liberado apos conferencia.',
    reason,
    plan: { id: plan.id, name: plan.name, amount },
    manualLink: links[0]?.url || '',
    manualLinks: links,
    externalReference,
    checkoutSessionId: checkoutSession?.id || null,
  });
}

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Metodo nao permitido.' });
  }

  try {
    const session = await requireClient(req);
    const body = readJsonBody(req);
    const planId = requestedPlanId(body.planId);

    if (!planId) return res.status(400).json({ ok: false, message: 'Plano invalido para checkout.' });

    const plan = PLAN_CATALOG[planId];
    const includeImplementation = Boolean(body.includeImplementation) && plan.id !== 'implementation';
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const appUrl = getAppUrl(req);
    const externalReference = `AGENDAPRO-${plan.id.toUpperCase()}-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const payerName = session.account.full_name || cleanText(body.fullName || 'Cliente AgendaPro', 160);
    const payerPhone = session.account.whatsapp || cleanText(body.whatsapp || '', 40);
    const businessName = session.company?.name || cleanText(body.businessName || '', 160) || payerName;
    const amount = Number(plan.price) + (includeImplementation ? Number(PLAN_CATALOG.implementation.price) : 0);
    let checkoutSession = null;

    await logActivity({
      accountId: session.accountId,
      companyId: session.companyId,
      action: 'checkout_attempted',
      title: 'Tentativa de checkout',
      description: `Checkout iniciado para ${session.email}.`,
      severity: 'info',
      metadata: {
        external_reference: externalReference,
        plan_id: plan.id,
        amount,
        token_configured: Boolean(accessToken),
        include_implementation: includeImplementation,
      },
    });

    try {
      const inserted = await supabaseRequest('/rest/v1/agendapro_checkout_sessions', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          account_id: session.accountId,
          company_id: session.companyId,
          plan_id: plan.id,
          checkout_type: plan.id === 'implementation' ? 'implementation' : includeImplementation ? 'plan_with_implementation' : 'plan',
          provider: 'mercado_pago',
          external_reference: externalReference,
          payer_name: payerName,
          payer_email: session.email,
          payer_phone: payerPhone,
          business_name: businessName,
          business_slug: session.company?.slug || null,
          amount,
          currency: 'BRL',
          status: 'created',
          success_url: `${appUrl}/#/pagamento/sucesso`,
          pending_url: `${appUrl}/#/pagamento/pendente`,
          failure_url: `${appUrl}/#/pagamento/erro`,
          metadata: {
            include_implementation: includeImplementation,
            expected_amount: amount,
            manual_links: buildFallbackLinks(plan.id, includeImplementation),
            source: 'checkout_api_secure_v0630',
          },
        }),
      });
      checkoutSession = Array.isArray(inserted) ? inserted[0] : inserted;
    } catch (error) {
      console.warn('checkout session warning.');
    }

    if (!accessToken) {
      await safePatchCheckoutSession(checkoutSession, {
        status: 'manual_fallback',
        metadata: {
          ...(checkoutSession?.metadata || {}),
          fallback_reason: 'missing_mercado_pago_token',
          fallback_at: new Date().toISOString(),
        },
      });
      await logActivity({
        accountId: session.accountId,
        companyId: session.companyId,
        action: 'checkout_manual_fallback',
        title: 'Checkout em fallback manual',
        description: 'Mercado Pago automatico indisponivel; pagamento manual oferecido ao cliente.',
        severity: 'warning',
        metadata: { external_reference: externalReference, plan_id: plan.id, amount, reason: 'missing_mercado_pago_token' },
      });
      return checkoutFallbackResponse({ res, checkoutSession, externalReference, plan, amount, includeImplementation, reason: 'missing_mercado_pago_token' });
    }

    const preferencePayload = {
      items: [
        {
          id: plan.id,
          title: `AgendaPro - Plano ${plan.name}`,
          description: plan.description,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: Number(plan.price),
        },
        ...(includeImplementation
          ? [{
              id: 'implementation',
              title: 'AgendaPro - Implantacao assistida',
              description: 'Configuracao inicial em 24h a 48h apos briefing completo, caso nao haja imprevistos.',
              quantity: 1,
              currency_id: 'BRL',
              unit_price: Number(PLAN_CATALOG.implementation.price),
            }]
          : []),
      ],
      payer: { name: payerName, email: session.email, phone: { number: String(payerPhone || '').replace(/\D/g, '') } },
      external_reference: externalReference,
      metadata: {
        account_id: session.accountId,
        company_id: session.companyId,
        email: session.email,
        business_name: businessName,
        plan_id: plan.id,
        checkout_session_id: checkoutSession?.id || null,
        expected_amount: amount,
        include_implementation: includeImplementation,
      },
      back_urls: {
        success: `${appUrl}/#/pagamento/sucesso`,
        pending: `${appUrl}/#/pagamento/pendente`,
        failure: `${appUrl}/#/pagamento/erro`,
      },
      auto_return: 'approved',
      notification_url: `${appUrl}/api/mercadopago-webhook`,
      statement_descriptor: 'AGENDAPRO',
      payment_methods: { installments: 12 },
    };

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(preferencePayload),
    });
    const mpData = await mpResponse.json().catch(() => ({}));

    if (!mpResponse.ok) {
      await safePatchCheckoutSession(checkoutSession, {
        status: 'manual_fallback',
        metadata: {
          ...(checkoutSession?.metadata || {}),
          fallback_reason: 'mercado_pago_preference_error',
          mp_status: mpResponse.status,
          fallback_at: new Date().toISOString(),
        },
      });
      await logActivity({
        accountId: session.accountId,
        companyId: session.companyId,
        action: 'checkout_gateway_fallback',
        title: 'Mercado Pago recusou checkout',
        description: 'Checkout automatico falhou e fallback manual foi oferecido.',
        severity: 'warning',
        metadata: { external_reference: externalReference, plan_id: plan.id, amount, mp_status: mpResponse.status },
      });
      return checkoutFallbackResponse({ res, checkoutSession, externalReference, plan, amount, includeImplementation, reason: 'mercado_pago_preference_error' });
    }

    if (checkoutSession?.id) {
      await safePatchCheckoutSession(checkoutSession, {
        status: 'redirected',
        mp_preference_id: mpData.id,
        mp_init_point: mpData.init_point,
        mp_sandbox_init_point: mpData.sandbox_init_point,
      });
    }

    await logActivity({
      accountId: session.accountId,
      companyId: session.companyId,
      action: 'checkout_created',
      title: 'Checkout criado',
      description: `Checkout seguro criado para ${session.email}.`,
      severity: 'info',
      metadata: { external_reference: externalReference, plan_id: plan.id, amount, preference_id: mpData.id },
    });

    return res.status(200).json({
      ok: true,
      initPoint: mpData.init_point || mpData.sandbox_init_point,
      preferenceId: mpData.id,
      externalReference,
      checkoutSessionId: checkoutSession?.id || null,
    });
  } catch (error) {
    return handleError(res, error, 'Erro inesperado ao criar checkout.');
  }
};
