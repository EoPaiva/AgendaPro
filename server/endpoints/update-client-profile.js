const { applySecurityHeaders, readJsonBody, cleanText, cleanPhone, requireClient, supabaseRequest, handleError, logActivity } = require('../_security');

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Método não permitido.' });
  }
  try {
    const session = await requireClient(req);
    const body = readJsonBody(req);
    const fullName = cleanText(body.fullName || body.full_name || session.account.full_name || '', 160);
    const whatsapp = cleanPhone(body.whatsapp || body.phone || session.account.whatsapp || '');
    const businessName = cleanText(body.businessName || body.business_name || session.company?.business_name || session.company?.name || '', 160);

    if (!fullName || !whatsapp || !businessName) {
      return res.status(400).json({ ok: false, message: 'Preencha nome, WhatsApp e nome do negócio.' });
    }

    const accountPayload = {
      full_name: fullName,
      whatsapp,
      phone: whatsapp,
      metadata: { ...(session.account.metadata || {}), business_name: businessName },
      updated_at: new Date().toISOString()
    };
    const updatedAccountRows = await supabaseRequest(`/rest/v1/agendapro_client_accounts?id=eq.${encodeURIComponent(session.accountId)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(accountPayload)
    });

    let updatedCompany = session.company || null;
    if (session.companyId) {
      const companyRows = await supabaseRequest(`/rest/v1/agendapro_companies?id=eq.${encodeURIComponent(session.companyId)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ name: businessName, business_name: businessName, whatsapp, phone: whatsapp, updated_at: new Date().toISOString() })
      });
      updatedCompany = Array.isArray(companyRows) ? companyRows[0] : companyRows;
    }

    await logActivity({
      accountId: session.accountId,
      companyId: session.companyId,
      action: 'client_profile_updated',
      title: 'Perfil atualizado',
      description: `${session.email} atualizou os dados da conta e do negócio.`,
      severity: 'success',
      metadata: { fields: ['full_name', 'whatsapp', 'business_name'] }
    });

    return res.status(200).json({ ok: true, account: Array.isArray(updatedAccountRows) ? updatedAccountRows[0] : updatedAccountRows, company: updatedCompany });
  } catch (error) {
    return handleError(res, error, 'Erro ao salvar configurações da conta.');
  }
};
