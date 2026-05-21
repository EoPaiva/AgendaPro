const { applySecurityHeaders, readJsonBody, cleanText, cleanEmail, cleanPhone, normalizePlan, supabaseRequest, handleError } = require('../_security');

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Metodo nao permitido.' });
  }

  try {
    const body = readJsonBody(req);
    const payload = {
      business_name: cleanText(body.businessName, 160),
      full_name: cleanText(body.fullName, 160),
      email: cleanEmail(body.email),
      whatsapp: cleanPhone(body.whatsapp),
      segment: cleanText(body.segment, 120),
      plan_id: normalizePlan(body.planId || 'professional'),
      wants_implementation: Boolean(body.wantsImplementation),
      message: cleanText(body.message, 1200),
      status: 'novo',
      source: cleanText(body.source || 'site', 80),
      metadata: { deadline: '24h a 48h apos briefing completo, caso nao haja imprevistos' }
    };

    if (!payload.business_name || !payload.full_name || !payload.email || !payload.whatsapp) {
      return res.status(400).json({ ok: false, message: 'Preencha negocio, nome, e-mail e WhatsApp.' });
    }

    const inserted = await supabaseRequest('/rest/v1/agendapro_quick_briefings', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(payload)
    });
    return res.status(200).json({ ok: true, briefing: Array.isArray(inserted) ? inserted[0] : inserted });
  } catch (error) {
    return handleError(res, error, 'Erro ao salvar briefing rapido.');
  }
};
