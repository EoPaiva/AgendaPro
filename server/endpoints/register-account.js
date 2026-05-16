const { applySecurityHeaders, readJsonBody, cleanText, cleanEmail, cleanPhone, normalizePlan, createAuthUser, authWithPassword, supabaseRequest, buildClientSession, handleError, slugify } = require('../_security');

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, message: 'Método não permitido.' }); }
  try {
    const body = readJsonBody(req);
    const planId = normalizePlan(body.planId);
    const fullName = cleanText(body.fullName, 160);
    const email = cleanEmail(body.email);
    const whatsapp = cleanPhone(body.whatsapp);
    const businessName = cleanText(body.businessName, 160);
    const password = String(body.password || '');
    const includeImplementation = Boolean(body.includeImplementation);
    if (!fullName || !email || !whatsapp || !businessName || password.length < 6) return res.status(400).json({ ok: false, message: 'Preencha nome completo, e-mail, WhatsApp, nome do negócio e senha com pelo menos 6 caracteres.' });
    const authResult = await createAuthUser({ email, password, fullName, whatsapp, businessName, planId });
    if (authResult.alreadyExisted) await authWithPassword(email, password);
    let workspace = null;
    try {
      workspace = await supabaseRequest('/rest/v1/rpc/agendapro_create_client_workspace', { method: 'POST', body: JSON.stringify({ p_auth_user_id: authResult.user?.id || null, p_full_name: fullName, p_email: email, p_whatsapp: whatsapp, p_business_name: businessName, p_plan_id: planId }) });
    } catch (error) {
      // Fail securely: sem workspace real, não libera conta nem pagamento.
      throw new Error(`Não foi possível criar o workspace do cliente: ${error.message}`);
    }
    const result = Array.isArray(workspace) ? workspace[0] : workspace;
    const publicSlug = result?.slug || slugify(businessName);
    const session = await buildClientSession(email);
    if (includeImplementation && result?.account_id) {
      await supabaseRequest('/rest/v1/agendapro_client_activity_logs', { method: 'POST', body: JSON.stringify({ account_id: result.account_id, company_id: result.company_id || null, action: 'implementation_requested', title: 'Implantação assistida selecionada', description: 'Cliente marcou implantação assistida de R$ 100 no cadastro.', severity: 'info', metadata: { plan_id: planId, deadline: '24h a 48h após briefing completo, caso não haja imprevistos' } }) }).catch(() => null);
    }
    return res.status(200).json({ ok: true, token: session.token, account: session.account, company: session.company, accountId: result?.account_id || session.account?.id || '', companyId: result?.company_id || session.company?.id || '', subscriptionId: result?.subscription_id || '', alreadyExisted: authResult.alreadyExisted, onboardingSessionId: result?.onboarding_id || '', publicSlug, publicLink: `/#/agendar/${publicSlug}`, includeImplementation });
  } catch (error) { return handleError(res, error, 'Erro ao criar conta antes do pagamento.'); }
};
