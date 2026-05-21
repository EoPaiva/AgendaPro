const { applySecurityHeaders, readJsonBody, cleanText, requireClient, supabaseRequest, handleError, logActivity } = require('../_security');

const allowedChannels = new Set(['copy', 'whatsapp', 'email']);
const allowedTemplates = new Set(['received', 'confirmation', 'cancellation', 'reschedule', 'completed', 'reminder', 'custom']);
function nowIso() { return new Date().toISOString(); }
function htmlEscape(value) { return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
function ownsAgenda(agenda, session) { return Boolean((agenda.client_account_id && agenda.client_account_id === session.accountId) || (agenda.company_id && session.companyId && agenda.company_id === session.companyId) || String(agenda.owner_email || agenda.email || '').toLowerCase() === String(session.email || '').toLowerCase()); }

async function sendResendEmail({ to, subject, message, businessName }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_EMAIL_FROM || process.env.EMAIL_FROM || process.env.MAIL_FROM;
  if (!apiKey || !from) return { sent: false, skipped: true, reason: 'RESEND_API_KEY ou RESEND_EMAIL_FROM não configurado.' };
  if (!to) return { sent: false, skipped: true, reason: 'Cliente sem e-mail cadastrado.' };
  const safeMessage = htmlEscape(message).replace(/\n/g, '<br/>');
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to, subject, html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#0f172a"><h2>${htmlEscape(businessName || 'AgendaPro')}</h2><p style="line-height:1.65">${safeMessage}</p><hr/><small style="color:#64748b">Mensagem enviada pelo AgendaPro.</small></div>`, text: message }) });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(`Resend ${response.status}: ${data?.message || text || response.statusText}`);
  return { sent: true, provider: 'resend', providerId: data?.id || null };
}

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, message: 'Método não permitido.' }); }

  try {
    const session = await requireClient(req);
    const body = readJsonBody(req);
    const slug = cleanText(body.slug, 80);
    const requestId = cleanText(body.requestId || body.id, 120);
    const incomingChannel = cleanText(body.channel || 'copy', 30).toLowerCase();
    const channel = allowedChannels.has(incomingChannel) ? incomingChannel : 'copy';
    const incomingTemplate = cleanText(body.template || 'custom', 40).toLowerCase();
    const template = allowedTemplates.has(incomingTemplate) ? incomingTemplate : 'custom';
    const message = cleanText(body.message, 4000);
    const subject = cleanText(body.subject || 'Atualização do seu agendamento', 180);
    if (!slug || !requestId || !message) return res.status(400).json({ ok: false, message: 'Informe agenda, agendamento e mensagem.' });

    const agendas = await supabaseRequest(`/rest/v1/agendapro_created_agendas?public_slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`, { method: 'GET' });
    const agenda = Array.isArray(agendas) ? agendas[0] : null;
    if (!agenda) return res.status(404).json({ ok: false, message: 'Agenda não encontrada.' });
    if (!ownsAgenda(agenda, session)) return res.status(403).json({ ok: false, message: 'Você não tem permissão para enviar mensagens desta agenda.' });

    const bookingRows = await supabaseRequest(`/rest/v1/agendapro_public_booking_requests?id=eq.${encodeURIComponent(requestId)}&agenda_slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`, { method: 'GET' });
    const current = Array.isArray(bookingRows) ? bookingRows[0] : null;
    if (!current) return res.status(404).json({ ok: false, message: 'Agendamento não encontrado.' });

    const timestamp = nowIso();
    let delivery = { sent: false, skipped: false, reason: '' };
    if (channel === 'email') delivery = await sendResendEmail({ to: current.customer_email, subject, message, businessName: agenda.business_name || 'AgendaPro' });
    else delivery = { sent: true, provider: channel, providerId: null };

    const communicationItem = { at: timestamp, by: session.email, channel, template, subject, status: delivery.sent ? 'sent_or_triggered' : delivery.skipped ? 'skipped' : 'registered', provider: delivery.provider || null, providerId: delivery.providerId || null, reason: delivery.reason || null, messagePreview: message.slice(0, 240) };
    const messageHistory = [...(Array.isArray(current.message_history) ? current.message_history : []), communicationItem];
    const communicationLog = [...(Array.isArray(current.communication_log) ? current.communication_log : []), communicationItem];
    const metadata = { ...(current.metadata || {}), lastCommunication: communicationItem };

    const updated = await supabaseRequest(`/rest/v1/agendapro_public_booking_requests?id=eq.${encodeURIComponent(requestId)}&agenda_slug=eq.${encodeURIComponent(slug)}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ metadata, message_history: messageHistory, communication_log: communicationLog, updated_at: timestamp }) });
    const request = Array.isArray(updated) ? updated[0] : updated;

    await logActivity({ accountId: session.accountId, companyId: session.companyId, action: `booking_message_${channel}`, title: channel === 'email' ? 'E-mail de agendamento processado' : channel === 'whatsapp' ? 'WhatsApp de agendamento acionado' : 'Mensagem de agendamento copiada', description: `${session.email} registrou comunicação ${channel} para o agendamento ${requestId}.`, severity: delivery.skipped ? 'warning' : 'info', metadata: { slug, requestId, channel, template, delivery } });
    return res.status(200).json({ ok: true, channel, template, delivery, request });
  } catch (error) { return handleError(res, error, 'Erro ao registrar mensagem do agendamento.'); }
};
