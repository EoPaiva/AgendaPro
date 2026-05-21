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

function serviceHasValidDuration(service = {}) {
  const raw = service.durationMinutes ?? service.duration ?? service.minutes;
  const parsed = Number(String(raw ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) && parsed >= 10;
}

function publicItemIsActive(item = {}) {
  const status = String(item.status || '').toLowerCase();
  return item.active !== false && !['inactive', 'inativo', 'paused', 'pausado', 'disabled'].includes(status);
}

function activePublicItems(items = [], fallback = []) {
  const hasSource = Array.isArray(items) && items.length > 0;
  const source = hasSource ? items : fallback;
  const active = source.filter(item => publicItemIsActive(item));
  return hasSource ? active : (active.length ? active : source);
}

function matchToken(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function splitLinkText(value) {
  return String(value || '').split(/[,;\n|]+/).map(item => item.trim()).filter(Boolean);
}

function linkedValues(value) {
  if (value == null || value === false) return [];
  if (Array.isArray(value)) return value.flatMap(item => linkedValues(item));
  if (typeof value === 'object') {
    return [value.id, value.name, value.title, value.label, value.email].filter(Boolean).map(item => String(item));
  }
  return splitLinkText(String(value));
}

function linkSet(values) {
  return new Set((values || []).flatMap(value => linkedValues(value)).map(value => matchToken(value)).filter(Boolean));
}

function entityKeys(entity = {}) {
  return linkSet([entity.id, entity.uid, entity.slug, entity.name, entity.title, entity.label, entity.email]);
}

function serviceProfessionalLinks(service = {}) {
  return linkSet([
    service.professionalIds,
    service.professional_ids,
    service.professionalId,
    service.professional_id,
    service.professionalNames,
    service.professionals,
    service.professionalsText,
    service.teamIds,
    service.team_ids,
    service.teamNames,
    service.team
  ]);
}

function professionalServiceLinks(professional = {}) {
  return linkSet([
    professional.serviceIds,
    professional.service_ids,
    professional.serviceId,
    professional.service_id,
    professional.serviceNames,
    professional.services,
    professional.servicesText,
    professional.serviceText
  ]);
}

function professionalMatchesService(professional = {}, service = {}) {
  if (!professional || !service) return false;
  const professionalKeys = entityKeys(professional);
  const serviceKeys = entityKeys(service);
  const serviceLinks = serviceProfessionalLinks(service);
  const professionalLinks = professionalServiceLinks(professional);
  if (serviceLinks.size && !Array.from(professionalKeys).some(key => serviceLinks.has(key))) return false;
  if (professionalLinks.size && !Array.from(serviceKeys).some(key => professionalLinks.has(key))) return false;
  return true;
}

function teamForService(team = [], service = {}) {
  return activePublicItems(team).filter(member => professionalMatchesService(member, service));
}

function hasScheduleData(value) {
  return Boolean(value && typeof value === 'object' && (
    value.workingDays ||
    value.blockedDates ||
    value.blockedTimes ||
    value.slotInterval ||
    value.minAdvanceHours ||
    value.maxFutureDays ||
    value.acceptNewBookings === false ||
    value.paused === true
  ));
}

function uniqueScheduleItems(items) {
  const seen = new Set();
  return (items || []).filter(item => {
    const key = JSON.stringify(item || {});
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function professionalScheduleConfig(baseConfig = {}, professional = {}) {
  const candidate =
    professional.scheduleConfig ||
    professional.schedule_config ||
    (professional.availability && (professional.availability.scheduleConfig || professional.availability.schedule_config)) ||
    professional.availability ||
    professional.schedule;
  const base = normalizeScheduleConfig(baseConfig);
  if (!hasScheduleData(candidate)) return base;
  return normalizeScheduleConfig({
    ...base,
    ...candidate,
    workingDays: candidate.workingDays ? { ...base.workingDays, ...candidate.workingDays } : base.workingDays,
    blockedDates: uniqueScheduleItems([...(base.blockedDates || []), ...(Array.isArray(candidate.blockedDates) ? candidate.blockedDates : [])]),
    blockedTimes: uniqueScheduleItems([...(base.blockedTimes || []), ...(Array.isArray(candidate.blockedTimes) ? candidate.blockedTimes : [])])
  });
}

function scheduleHasEnabledPeriod(configInput = {}) {
  const config = normalizeScheduleConfig(configInput);
  return DAY_KEYS.some(key => Boolean(config.workingDays && config.workingDays[key] && config.workingDays[key].enabled && (config.workingDays[key].periods || []).some(period => period.start && period.end)));
}

function appointmentMatchesProfessional(appointment = {}, professional = {}) {
  const professionalKeys = entityKeys(professional);
  if (!professionalKeys.size) return true;
  const metadata = appointment.metadata || {};
  const appointmentLinks = linkSet([
    appointment.professional_id,
    appointment.professionalId,
    appointment.professional_name,
    appointment.professionalName,
    metadata.professional_id,
    metadata.professionalId,
    metadata.professional_name,
    metadata.professionalName
  ]);
  if (!appointmentLinks.size) return true;
  return Array.from(professionalKeys).some(key => appointmentLinks.has(key));
}

function appointmentsForProfessional(appointments = [], professional = {}) {
  return (Array.isArray(appointments) ? appointments : []).filter(appointment => appointmentMatchesProfessional(appointment, professional));
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

module.exports = { toMinutes, toTime, dateKey, weekdayKey, normalizeScheduleConfig, serviceDuration, serviceHasValidDuration, publicItemIsActive, activePublicItems, professionalMatchesService, teamForService, professionalScheduleConfig, scheduleHasEnabledPeriod, appointmentMatchesProfessional, appointmentsForProfessional, normalizeStatus, occupiesSlot, appointmentRange, isTimeSlotAvailable };
