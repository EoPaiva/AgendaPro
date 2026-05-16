const { applySecurityHeaders, readJsonBody, cleanText, requireClient, supabaseRequest, handleError, logActivity } = require('../_security');
const { normalizeScheduleConfig } = require('../availability');

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Método não permitido.' });
  }
  try {
    const session = await requireClient(req);
    const body = readJsonBody(req);
    const slug = cleanText(body.slug, 90);
    const scheduleConfig = normalizeScheduleConfig(body.scheduleConfig || {});
    if (!slug) return res.status(400).json({ ok: false, message: 'Informe o slug da agenda.' });

    const rows = await supabaseRequest(`/rest/v1/agendapro_created_agendas?public_slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`, { method: 'GET' });
    const agenda = Array.isArray(rows) ? rows[0] : null;
    if (!agenda) return res.status(404).json({ ok: false, message: 'Agenda não encontrada.' });

    const ownsByAccount = agenda.account_id && agenda.account_id === session.accountId;
    const ownsByCompany = agenda.company_id && session.companyId && agenda.company_id === session.companyId;
    const ownsByEmail = String(agenda.email || '').toLowerCase() === String(session.email || '').toLowerCase();
    if (!ownsByAccount && !ownsByCompany && !ownsByEmail) return res.status(403).json({ ok: false, message: 'Você não tem permissão para alterar esta agenda.' });

    const raw = agenda.raw_payload || {};
    const updatedRaw = { ...raw, scheduleConfig };
    const updated = await supabaseRequest(`/rest/v1/agendapro_created_agendas?id=eq.${agenda.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        schedule_config: scheduleConfig,
        raw_payload: updatedRaw,
        hours: { ...(agenda.hours || {}), interval: String(scheduleConfig.slotInterval) },
        rules: { ...(agenda.rules || {}), cancellation: scheduleConfig.cancellationText, minNotice: `${scheduleConfig.minAdvanceHours} horas` },
        updated_at: new Date().toISOString()
      })
    });

    await logActivity({ accountId: session.accountId, companyId: session.companyId, action: 'schedule_config_updated', title: 'Disponibilidade atualizada', description: `${session.email} atualizou os horários de ${slug}.`, severity: 'success', metadata: { slug } });
    return res.status(200).json({ ok: true, agenda: Array.isArray(updated) ? updated[0] : updated, scheduleConfig });
  } catch (error) {
    return handleError(res, error, 'Erro ao salvar disponibilidade.');
  }
};
