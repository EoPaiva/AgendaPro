const crypto = require('crypto');
const { applySecurityHeaders, readJsonBody, cleanText, requireClient, supabaseRequest, handleError } = require('../_security');

const PLAN_VALUES = {
  essential: 49.9,
  professional: 99.9,
  business: 199.9,
  implementation: 100,
};

function normalizeManualPlan(value, fallback = 'professional') {
  const plan = cleanText(value || fallback, 40).toLowerCase();
  return Object.prototype.hasOwnProperty.call(PLAN_VALUES, plan) ? plan : fallback;
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
    const account = session.account;
    const company = session.company;
    const planId = normalizeManualPlan(body.planId || company?.current_plan_id || body.account?.planId);
    const includeImplementation = Boolean(body.includeImplementation);
    const expectedAmount = Number(PLAN_VALUES[planId] || PLAN_VALUES.professional) + (includeImplementation && planId !== 'implementation' ? PLAN_VALUES.implementation : 0);
    const requestedAmount = Number(body.amount || 0);
    const amount = requestedAmount > 0 ? requestedAmount : expectedAmount;
    const externalReference = `MANUAL-${planId.toUpperCase()}-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const paymentLinks = Array.isArray(body.paymentLinks)
      ? body.paymentLinks.map(item => ({ id: cleanText(item.id, 40), label: cleanText(item.label, 120), url: cleanText(item.url, 300) })).filter(item => item.url)
      : [];

    const inserted = await supabaseRequest('/rest/v1/agendapro_manual_payment_requests', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        account_id: session.accountId,
        company_id: session.companyId,
        full_name: account.full_name || account.fullName || null,
        email: session.email,
        whatsapp: account.whatsapp || null,
        business_name: company?.name || cleanText(body.businessName || '', 160) || null,
        plan_id: planId,
        plan_name: cleanText(body.planName || '', 80),
        amount,
        status: 'pending_review',
        include_implementation: includeImplementation,
        note: cleanText(body.note || '', 1200),
        payment_link: cleanText(body.paymentLink || paymentLinks[0]?.url || '', 300),
        payment_reference: externalReference,
        metadata: {
          source: 'client_checkout_manual_v0630',
          user_agent: req.headers['user-agent'] || '',
          external_reference: externalReference,
          expected_amount: expectedAmount,
          amount_mismatch: Math.abs(Number(amount) - Number(expectedAmount)) > 0.01,
          payment_links: paymentLinks,
        },
      }),
    });

    await supabaseRequest('/rest/v1/agendapro_client_activity_logs', {
      method: 'POST',
      body: JSON.stringify({
        account_id: session.accountId,
        company_id: session.companyId,
        action: 'manual_payment_requested',
        title: 'Pagamento manual aguardando confirmacao',
        description: `${session.email} iniciou pagamento manual.`,
        severity: 'warning',
        metadata: { amount, expected_amount: expectedAmount, plan_id: planId, external_reference: externalReference },
      }),
    }).catch(() => null);

    return res.status(200).json({ ok: true, request: Array.isArray(inserted) ? inserted[0] : inserted, externalReference });
  } catch (error) {
    return handleError(res, error, 'Erro ao registrar pagamento manual.');
  }
};
