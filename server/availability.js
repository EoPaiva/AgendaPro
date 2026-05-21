const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function toMinutes(value) {
  const [h, m] = String(value || '00:00').split(':').map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

function toTime(total) {
  const h = Math.floor(total / 60).toString().padStart(2, '0');
  const m = (total % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function dateKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(`${date}T12:00:00`);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function weekdayKey(date) {
  return DAY_KEYS[new Date(`${date}T12:00:00`).getDay()] || 'monday';
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function numberFrom(value, fallback) {
  const parsed = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function defaultScheduleConfig(hours = {}, rules = {}) {
  const interval = numberFrom(hours.interval, 30);
  return {
    timezone: 'America/Sao_Paulo',
    slotInterval: interval,
    minAdvanceHours: numberFrom(rules.minAdvance || rules.minNotice, 2),
    maxFutureDays: numberFrom(rules.maxFutureDays, 30),
    reservePendingRequests: true,
    cancellationLimitHours: numberFrom(rules.cancellationLimitHours, 24),
    bufferBeforeMinutes: numberFrom(rules.bufferBeforeMinutes, 0),
    bufferAfterMinutes: numberFrom(rules.bufferAfterMinutes, 0),
    workingDays: {
      monday: { enabled: true, periods: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
      tuesday: { enabled: true, periods: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
      wednesday: { enabled: true, periods: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
      thursday: { enabled: true, periods: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
      friday: { enabled: true, periods: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] },
      saturday: { enabled: Boolean(hours.saturday), periods: hours.saturday ? [{ start: '08:00', end: '12:00' }] : [] },
      sunday: { enabled: false, periods: [] }
    },
    blockedDates: [],
    blockedTimes: [],
    paused: false,
    acceptNewBookings: true,
    closedMessage: 'Agenda indisponível nesta data.',
    cancellationText: rules.cancellation || 'Cancelamentos com até 24h de antecedência.'
  };
}

function normalizeScheduleConfig(raw = {}, hours = {}, rules = {}) {
  const base = defaultScheduleConfig(hours, rules);
  const source = raw || {};
  const workingDays = { ...base.workingDays, ...(source.workingDays || {}) };
  for (const key of DAY_KEYS) {
    const day = workingDays[key] || { enabled: false, periods: [] };
    workingDays[key] = {
      enabled: Boolean(day.enabled),
      periods: Array.isArray(day.periods) ? day.periods.filter(p => p?.start && p?.end) : []
    };
  }
  return {
    ...base,
    ...source,
    slotInterval: numberFrom(source.slotInterval, base.slotInterval),
    minAdvanceHours: numberFrom(source.minAdvanceHours, base.minAdvanceHours),
    maxFutureDays: numberFrom(source.maxFutureDays, base.maxFutureDays),
    cancellationLimitHours: numberFrom(source.cancellationLimitHours, base.cancellationLimitHours),
    bufferBeforeMinutes: numberFrom(source.bufferBeforeMinutes, base.bufferBeforeMinutes),
    bufferAfterMinutes: numberFrom(source.bufferAfterMinutes, base.bufferAfterMinutes),
    reservePendingRequests: source.reservePendingRequests !== false,
    workingDays,
    blockedDates: Array.isArray(source.blockedDates) ? source.blockedDates : [],
    blockedTimes: Array.isArray(source.blockedTimes) ? source.blockedTimes : []
  };
}

function serviceDuration(service = {}) {
  return numberFrom(service.durationMinutes || service.duration || service.minutes, 60);
}

function normalizeStatus(status) {
  const value = String(status || 'requested').toLowerCase();
  if (['confirmado', 'confirmed', 'approved', 'aprovado'].includes(value)) return 'confirmed';
  if (['completed', 'concluded', 'concluido', 'concluído'].includes(value)) return 'completed';
  if (['cancelled', 'canceled', 'cancelado'].includes(value)) return 'cancelled';
  if (['recusado', 'refused', 'rejected'].includes(value)) return 'refused';
  if (['faltou', 'ausente', 'absent', 'no_show', 'noshow'].includes(value)) return 'absent';
  if (['pending', 'pendente', 'requested', 'solicitado', 'pendingconfirmation', 'pending_confirmation', 'pending_review'].includes(value)) return 'requested';
  return value;
}

function occupiesSlot(status, reservePendingRequests = true) {
  const normalized = normalizeStatus(status);
  if (['confirmed', 'completed', 'absent'].includes(normalized)) return true;
  if (reservePendingRequests && normalized === 'requested') return true;
  return false;
}

function appointmentRange(item, fallbackDate) {
  const date = item.requested_date || item.date || item.appointment_date || (item.metadata && item.metadata.date) || fallbackDate;
  const start = item.requested_time || item.startTime || item.time || (item.metadata && (item.metadata.startTime || item.metadata.time));
  const duration = numberFrom(item.duration_minutes || item.durationMinutes || (item.metadata && item.metadata.durationMinutes), 60);
  const end = item.end_time || item.endTime || (item.metadata && item.metadata.endTime) || (start ? toTime(toMinutes(start) + duration) : '');
  return { date, start, end, duration, status: item.status };
}

function isTimeSlotAvailable({ date, startTime, serviceDuration = 60, appointments = [], scheduleConfig = {}, excludeId = null }) {
  const config = normalizeScheduleConfig(scheduleConfig);
  if (config.paused || config.acceptNewBookings === false) return { available: false, reason: config.closedMessage || 'Agenda indisponível.', status: 'blocked' };
  if (!date || !startTime) return { available: false, reason: 'Data e horário obrigatórios.', status: 'blocked' };
  const today = dateKey();
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + config.maxFutureDays);
  if (date < today || date > dateKey(maxDate)) return { available: false, reason: 'Data fora da janela de agendamento.', status: 'blocked' };
  const start = toMinutes(startTime);
  const duration = Number(serviceDuration) + Number(config.bufferBeforeMinutes || 0) + Number(config.bufferAfterMinutes || 0);
  const end = start + duration;
  const startWithBuffer = start - Number(config.bufferBeforeMinutes || 0);
  const endWithBuffer = end;
  const minDate = new Date(Date.now() + Number(config.minAdvanceHours || 0) * 60 * 60 * 1000);
  const slotDate = new Date(`${date}T${startTime}:00`);
  if (slotDate.getTime() < minDate.getTime()) return { available: false, reason: `Agende com pelo menos ${config.minAdvanceHours}h de antecedência.`, status: 'past' };
  const fullDayBlock = config.blockedDates.find(b => b.date === date && b.fullDay !== false);
  if (fullDayBlock) return { available: false, reason: fullDayBlock.reason || 'Agenda fechada nesta data.', status: 'blocked' };
  const day = config.workingDays[weekdayKey(date)];
  if (!day || !day.enabled) return { available: false, reason: 'Este estabelecimento não atende neste dia.', status: 'closed' };
  const insidePeriod = (day.periods || []).some(p => startWithBuffer >= toMinutes(p.start) && endWithBuffer <= toMinutes(p.end));
  if (!insidePeriod) return { available: false, reason: 'Fora do horário de atendimento.', status: 'closed' };
  const manualBlock = (config.blockedTimes || []).find(b => b.date === date && rangesOverlap(startWithBuffer, endWithBuffer, toMinutes(b.start), toMinutes(b.end)));
  if (manualBlock) return { available: false, reason: manualBlock.reason || 'Horário bloqueado manualmente.', status: 'blocked' };
  for (const item of appointments) {
    if (excludeId && item.id === excludeId) continue;
    const appt = appointmentRange(item, date);
    if (appt.date !== date) continue;
    if (!occupiesSlot(appt.status, config.reservePendingRequests)) continue;
    if (rangesOverlap(startWithBuffer, endWithBuffer, toMinutes(appt.start), toMinutes(appt.end))) {
      return { available: false, reason: 'Este horário acabou de ser reservado. Escolha outro horário.', status: 'occupied' };
    }
  }
  return { available: true, reason: 'Disponível', status: 'available', endTime: toTime(start + Number(serviceDuration)) };
}

module.exports = { toMinutes, toTime, dateKey, weekdayKey, normalizeScheduleConfig, serviceDuration, normalizeStatus, occupiesSlot, appointmentRange, isTimeSlotAvailable };
