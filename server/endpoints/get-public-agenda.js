const { applySecurityHeaders, cleanText, supabaseRequest, handleError, slugify } = require('../_security');

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, message: 'Método não permitido.' });
  }

  try {
    const slug = slugify(cleanText(req.query?.slug || '', 90));
    if (!slug) return res.status(400).json({ ok: false, message: 'Informe o slug da agenda.' });

    const rows = await supabaseRequest(`/rest/v1/agendapro_created_agendas?public_slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=id,business_name,public_slug,segment,address,description,whatsapp,theme,services,team,hours,rules,schedule_config,raw_payload,published_at,status&limit=1`, { method: 'GET' });
    const agenda = Array.isArray(rows) ? rows[0] : null;

    if (!agenda) return res.status(404).json({ ok: false, message: 'Agenda pública não encontrada ou ainda não publicada.' });

    const appointments = await supabaseRequest(`/rest/v1/agendapro_public_booking_requests?agenda_slug=eq.${encodeURIComponent(slug)}&select=id,agenda_slug,service_name,professional_id,professional_name,requested_date,requested_time,status,metadata,created_at&limit=500`, { method: 'GET' }).catch(() => []);
    const booked_slots = Array.isArray(appointments) ? appointments.map(item => ({ id: item.id, agenda_slug: item.agenda_slug, service_name: item.service_name, professional_id: item.professional_id || item.metadata?.professionalId || null, professional_name: item.professional_name || item.metadata?.professionalName || null, requested_date: item.requested_date, requested_time: item.requested_time, status: item.status, metadata: item.metadata || {}, durationMinutes: item.metadata?.durationMinutes, endTime: item.metadata?.endTime })) : [];
    const effectiveScheduleConfig = (agenda.schedule_config && Object.keys(agenda.schedule_config || {}).length) ? agenda.schedule_config : (agenda.raw_payload?.scheduleConfig || null);
    return res.status(200).json({ ok: true, agenda: { ...agenda, schedule_config: effectiveScheduleConfig, booked_slots } });
  } catch (error) {
    return handleError(res, error, 'Erro ao carregar agenda pública.');
  }
};
