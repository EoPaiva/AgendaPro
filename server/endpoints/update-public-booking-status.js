const { applySecurityHeaders, readJsonBody, cleanText, requireClient, supabaseRequest, handleError, logActivity } = require('../_security');
const { normalizeScheduleConfig, serviceDuration, isTimeSlotAvailable } = require('../availability');

const allowed = new Set(['requested', 'pending', 'confirmed', 'cancelled', 'canceled', 'completed', 'refused', 'rejected', 'absent', 'no_show']);
const statusMap = { pending: 'requested', canceled: 'cancelled', rejected: 'refused', no_show: 'absent' };

function cleanList(value, maxItems = 20) {
  if (!Array.isArray(value)) return null;
  return Array.from(new Set(value.map(item => cleanText(item, 60)).filter(Boolean))).slice(0, maxItems);
}

function cleanCrmEvent(value, session) {
  if (!value || typeof value !== 'object') return null;
  return {
    at: new Date().toISOString(),
    by: session.email,
    type: cleanText(value.type || 'crm_event', 80),
    channel: cleanText(value.channel || '', 80) || null,
    note: cleanText(value.note || '', 500) || null,
    message: cleanText(value.message || '', 1200) || null,
  };
}

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Método não permitido.' });
  }

  try {
    const session = await requireClient(req);
    const body = readJsonBody(req);
    const slug = cleanText(body.slug, 80);
    const requestId = cleanText(body.requestId, 120);
    const incomingStatus = cleanText(body.status, 40).toLowerCase();
    const status = statusMap[incomingStatus] || incomingStatus;

    if (!slug || !requestId || !allowed.has(incomingStatus)) {
      return res.status(400).json({ ok: false, message: 'Informe agenda, solicitação e status válido.' });
    }

    const agendas = await supabaseRequest(`/rest/v1/agendapro_created_agendas?public_slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`, { method: 'GET' });
    const agenda = Array.isArray(agendas) ? agendas[0] : null;

    if (!agenda) return res.status(404).json({ ok: false, message: 'Agenda não encontrada.' });

    const ownsByAccount = agenda.account_id && agenda.account_id === session.accountId;
    const ownsByCompany = agenda.company_id && session.companyId && agenda.company_id === session.companyId;
    const ownsByEmail = String(agenda.email || '').toLowerCase() === String(session.email || '').toLowerCase();

    if (!ownsByAccount && !ownsByCompany && !ownsByEmail) {
      return res.status(403).json({ ok: false, message: 'Você não tem permissão para alterar esta agenda.' });
    }

    const currentRows = await supabaseRequest(`/rest/v1/agendapro_public_booking_requests?id=eq.${encodeURIComponent(requestId)}&agenda_slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`, { method: 'GET' });
    const current = Array.isArray(currentRows) ? currentRows[0] : null;
    if (!current) return res.status(404).json({ ok: false, message: 'Solicitação não encontrada.' });

    const nextDate = cleanText(body.date || current.requested_date || current.metadata?.date || '', 40);
    const nextTime = cleanText(body.time || current.requested_time || current.metadata?.startTime || '', 40);
    const services = Array.isArray(agenda.services) ? agenda.services : Array.isArray(agenda.raw_payload?.services) ? agenda.raw_payload.services : [];
    const selectedService = services.find(item => String(item.id || item.name) === String(current.metadata?.serviceId || current.service_name)) || services.find(item => item.name === current.service_name) || services[0] || {};
    const durationMinutes = Number(current.metadata?.durationMinutes || body.durationMinutes || serviceDuration(selectedService));

    if (['confirmed', 'completed', 'absent', 'requested'].includes(status) && nextDate && nextTime) {
      const scheduleConfig = normalizeScheduleConfig(agenda.raw_payload?.scheduleConfig, agenda.hours, agenda.rules);
      const existing = await supabaseRequest(`/rest/v1/agendapro_public_booking_requests?agenda_slug=eq.${encodeURIComponent(slug)}&requested_date=eq.${encodeURIComponent(nextDate)}&select=id,requested_date,requested_time,status,metadata&limit=500`,{method:'GET'}).catch(()=>[]);
      const availability = isTimeSlotAvailable({ date: nextDate, startTime: nextTime, serviceDuration: durationMinutes, appointments: Array.isArray(existing) ? existing : [], scheduleConfig, excludeId: requestId });
      if(!availability.available) return res.status(409).json({ ok: false, message: availability.reason || 'Este horário acabou de ser reservado. Escolha outro horário.' });
    }

    const metadata = { ...(current.metadata || {}), updated_by: session.email, source: 'client_dashboard', history: [...(Array.isArray(current.metadata?.history) ? current.metadata.history : []), { at: new Date().toISOString(), status, by: session.email, previousStatus: current.status, previousDate: current.requested_date, previousTime: current.requested_time }] };
    if (body.internalNote !== undefined) metadata.internalNote = cleanText(body.internalNote, 1200);
    if (body.cancellationReason !== undefined) metadata.cancellationReason = cleanText(body.cancellationReason, 800);
    if (body.rescheduleReason !== undefined) metadata.rescheduleReason = cleanText(body.rescheduleReason, 800);
    const clientTags = cleanList(body.clientTags);
    if (clientTags) metadata.crmTags = clientTags;
    const crmEvent = cleanCrmEvent(body.crmEvent, session);
    if (crmEvent) metadata.crmHistory = [...(Array.isArray(current.metadata?.crmHistory) ? current.metadata.crmHistory : []), crmEvent].slice(-60);
    const patch = { status, updated_at: new Date().toISOString(), metadata };
    if (body.date) patch.requested_date = nextDate;
    if (body.time) patch.requested_time = nextTime;

    const updated = await supabaseRequest(`/rest/v1/agendapro_public_booking_requests?id=eq.${encodeURIComponent(requestId)}&agenda_slug=eq.${encodeURIComponent(slug)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch)
    });

    const request = Array.isArray(updated) ? updated[0] : updated;

    await logActivity({
      accountId: session.accountId,
      companyId: session.companyId,
      action: 'public_booking_status_updated',
      title: 'Status de agendamento atualizado',
      description: `Solicitação ${requestId} marcada como ${status}.`,
      severity: 'info',
      metadata: { slug, requestId, status, date: nextDate, time: nextTime }
    });

    return res.status(200).json({ ok: true, request });
  } catch (error) {
    return handleError(res, error, 'Erro ao atualizar solicitação.');
  }
};
