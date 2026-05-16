export type WeekdayKey = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export type SchedulePeriod = { start: string; end: string };
export type WorkingDayConfig = { enabled: boolean; periods: SchedulePeriod[] };
export type BlockedDate = { date: string; reason?: string; fullDay?: boolean };
export type BlockedTime = { date: string; start: string; end: string; reason?: string };

export type ScheduleConfig = {
  timezone: string;
  slotInterval: number;
  minAdvanceHours: number;
  maxFutureDays: number;
  reservePendingRequests: boolean;
  cancellationLimitHours: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  workingDays: Record<WeekdayKey, WorkingDayConfig>;
  blockedDates: BlockedDate[];
  blockedTimes: BlockedTime[];
  paused?: boolean;
  acceptNewBookings?: boolean;
  closedMessage?: string;
  cancellationText?: string;
};

export type AvailabilityAppointment = {
  id?: string;
  status?: string;
  requested_date?: string;
  requested_time?: string;
  date?: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number | string;
  duration_minutes?: number | string;
  metadata?: Record<string, any>;
};

export type SlotState = 'available' | 'selected' | 'occupied' | 'blocked' | 'closed' | 'past';

export type TimeSlot = {
  time: string;
  endTime: string;
  available: boolean;
  status: SlotState;
  reason: string;
};

export const DAY_KEYS: WeekdayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
export const DAY_LABELS: Record<WeekdayKey, string> = {
  sunday: 'Domingo', monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta', thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado'
};

export function toMinutes(value: string) {
  const [h, m] = String(value || '00:00').split(':').map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

export function toTime(total: number) {
  const normalized = Math.max(0, Math.round(total));
  const h = Math.floor(normalized / 60).toString().padStart(2, '0');
  const m = (normalized % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function dateKey(date: Date | string = new Date()) {
  const d = date instanceof Date ? date : new Date(`${date}T12:00:00`);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function weekdayKey(date: string): WeekdayKey {
  return DAY_KEYS[new Date(`${date}T12:00:00`).getDay()] || 'monday';
}

export function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

function numberFrom(value: any, fallback: number) {
  const parsed = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function defaultScheduleConfig(hours: any = {}, rules: any = {}): ScheduleConfig {
  const interval = Math.max(10, numberFrom(hours.interval, 30));
  return {
    timezone: 'America/Sao_Paulo',
    slotInterval: interval,
    minAdvanceHours: Math.max(0, numberFrom(rules.minAdvanceHours || rules.minAdvance || rules.minNotice, 2)),
    maxFutureDays: Math.max(1, numberFrom(rules.maxFutureDays, 30)),
    reservePendingRequests: true,
    cancellationLimitHours: Math.max(0, numberFrom(rules.cancellationLimitHours, 24)),
    bufferBeforeMinutes: Math.max(0, numberFrom(rules.bufferBeforeMinutes, 0)),
    bufferAfterMinutes: Math.max(0, numberFrom(rules.bufferAfterMinutes, 0)),
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

export function normalizeScheduleConfig(raw: any = {}, hours: any = {}, rules: any = {}): ScheduleConfig {
  const base = defaultScheduleConfig(hours, rules);
  const source = raw || {};
  const workingDays = { ...base.workingDays, ...(source.workingDays || {}) } as Record<WeekdayKey, WorkingDayConfig>;
  DAY_KEYS.forEach(key => {
    const day = workingDays[key] || { enabled: false, periods: [] };
    workingDays[key] = { enabled: Boolean(day.enabled), periods: Array.isArray(day.periods) ? day.periods.filter(p => p?.start && p?.end) : [] };
  });
  return {
    ...base,
    ...source,
    slotInterval: Math.max(10, numberFrom(source.slotInterval, base.slotInterval)),
    minAdvanceHours: Math.max(0, numberFrom(source.minAdvanceHours, base.minAdvanceHours)),
    maxFutureDays: Math.max(1, numberFrom(source.maxFutureDays, base.maxFutureDays)),
    cancellationLimitHours: Math.max(0, numberFrom(source.cancellationLimitHours, base.cancellationLimitHours)),
    bufferBeforeMinutes: Math.max(0, numberFrom(source.bufferBeforeMinutes, base.bufferBeforeMinutes)),
    bufferAfterMinutes: Math.max(0, numberFrom(source.bufferAfterMinutes, base.bufferAfterMinutes)),
    reservePendingRequests: source.reservePendingRequests !== false,
    workingDays,
    blockedDates: Array.isArray(source.blockedDates) ? source.blockedDates : [],
    blockedTimes: Array.isArray(source.blockedTimes) ? source.blockedTimes : []
  };
}

export function serviceDurationMinutes(service: any = {}) {
  return Math.max(10, numberFrom(service.durationMinutes || service.duration || service.minutes, 60));
}

export function normalizeBookingStatus(status?: string) {
  const value = String(status || 'pending').toLowerCase();
  if (['confirmado', 'confirmed', 'approved', 'aprovado'].includes(value)) return 'confirmed';
  if (['completed', 'concluded', 'concluido', 'concluído'].includes(value)) return 'completed';
  if (['cancelled', 'canceled', 'cancelado'].includes(value)) return 'cancelled';
  if (['recusado', 'refused', 'rejected'].includes(value)) return 'refused';
  if (['faltou', 'ausente', 'absent', 'no_show', 'noshow'].includes(value)) return 'absent';
  if (['rescheduled', 'remarcado', 'remarcada'].includes(value)) return 'rescheduled';
  if (['pending', 'pendente', 'requested', 'solicitado', 'pendingconfirmation', 'pending_confirmation', 'pending_review'].includes(value)) return 'pending';
  return value;
}

export function bookingOccupiesSlot(status?: string, reservePendingRequests = true) {
  const normalized = normalizeBookingStatus(status);
  if (['confirmed', 'completed', 'absent', 'rescheduled'].includes(normalized)) return true;
  if (reservePendingRequests && normalized === 'pending') return true;
  return false;
}

export function appointmentRange(item: AvailabilityAppointment, fallbackDate?: string) {
  const date = item.requested_date || item.date || item.metadata?.date || fallbackDate || dateKey();
  const start = item.requested_time || item.startTime || item.time || item.metadata?.startTime || item.metadata?.time || '';
  const duration = Math.max(10, numberFrom(item.duration_minutes || item.durationMinutes || item.metadata?.durationMinutes, 60));
  const end = item.endTime || item.metadata?.endTime || (start ? toTime(toMinutes(start) + duration) : '');
  return { date, start, end, duration, status: item.status };
}

export function isTimeSlotAvailable(params: {
  date: string;
  startTime: string;
  serviceDuration: number;
  appointments?: AvailabilityAppointment[];
  scheduleConfig?: Partial<ScheduleConfig>;
  excludeId?: string | null;
}) {
  const { date, startTime, serviceDuration, appointments = [], excludeId = null } = params;
  const config = normalizeScheduleConfig(params.scheduleConfig);
  if (config.paused || config.acceptNewBookings === false) return { available: false, reason: config.closedMessage || 'Agenda indisponível.', status: 'blocked' as SlotState };
  const today = dateKey();
  const maxDate = addDays(new Date(), Number(config.maxFutureDays));
  if (date < today || date > dateKey(maxDate)) return { available: false, reason: 'Data fora da janela de agendamento.', status: 'blocked' as SlotState };
  const start = toMinutes(startTime);
  const startWithBuffer = start - Number(config.bufferBeforeMinutes || 0);
  const end = start + Number(serviceDuration) + Number(config.bufferAfterMinutes || 0);
  const slotDate = new Date(`${date}T${startTime}:00`);
  const minDate = new Date(Date.now() + Number(config.minAdvanceHours || 0) * 60 * 60 * 1000);
  if (slotDate.getTime() < minDate.getTime()) return { available: false, reason: `Agende com pelo menos ${config.minAdvanceHours}h de antecedência.`, status: 'past' as SlotState };
  const fullDayBlock = config.blockedDates.find(block => block.date === date && block.fullDay !== false);
  if (fullDayBlock) return { available: false, reason: fullDayBlock.reason || 'Agenda fechada nesta data.', status: 'blocked' as SlotState };
  const day = config.workingDays[weekdayKey(date)];
  if (!day || !day.enabled) return { available: false, reason: 'Este estabelecimento não atende neste dia.', status: 'closed' as SlotState };
  const insidePeriod = (day.periods || []).some(period => startWithBuffer >= toMinutes(period.start) && end <= toMinutes(period.end));
  if (!insidePeriod) return { available: false, reason: 'Fora do horário de atendimento.', status: 'closed' as SlotState };
  const manualBlock = config.blockedTimes.find(block => block.date === date && rangesOverlap(startWithBuffer, end, toMinutes(block.start), toMinutes(block.end)));
  if (manualBlock) return { available: false, reason: manualBlock.reason || 'Horário bloqueado manualmente.', status: 'blocked' as SlotState };
  for (const item of appointments) {
    if (excludeId && item.id === excludeId) continue;
    const appt = appointmentRange(item, date);
    if (appt.date !== date || !appt.start || !appt.end) continue;
    if (!bookingOccupiesSlot(appt.status, config.reservePendingRequests)) continue;
    if (rangesOverlap(startWithBuffer, end, toMinutes(appt.start), toMinutes(appt.end))) return { available: false, reason: 'Este horário acabou de ser reservado. Escolha outro horário.', status: 'occupied' as SlotState };
  }
  return { available: true, reason: 'Disponível', status: 'available' as SlotState, endTime: toTime(start + Number(serviceDuration)) };
}

export function generateSlotsForDate(params: {
  date: string;
  serviceDuration: number;
  appointments?: AvailabilityAppointment[];
  scheduleConfig?: Partial<ScheduleConfig>;
}) {
  const config = normalizeScheduleConfig(params.scheduleConfig);
  const day = config.workingDays[weekdayKey(params.date)];
  if (!day || !day.enabled) return [] as TimeSlot[];
  const slots: TimeSlot[] = [];
  for (const period of day.periods || []) {
    const periodStart = toMinutes(period.start);
    const periodEnd = toMinutes(period.end);
    for (let current = periodStart; current + params.serviceDuration <= periodEnd; current += config.slotInterval) {
      const time = toTime(current);
      const state = isTimeSlotAvailable({ date: params.date, startTime: time, serviceDuration: params.serviceDuration, appointments: params.appointments || [], scheduleConfig: config });
      slots.push({ time, endTime: state.endTime || toTime(current + params.serviceDuration), available: state.available, status: state.status, reason: state.reason });
    }
  }
  return slots;
}

export function buildDateOptions(configInput?: Partial<ScheduleConfig>, total = 14) {
  const config = normalizeScheduleConfig(configInput);
  const max = Math.min(Math.max(config.maxFutureDays, total), 60);
  const options: Array<{ date: string; label: string; weekday: string; availableDay: boolean }> = [];
  for (let i = 0; i <= max && options.length < total; i++) {
    const d = addDays(new Date(), i);
    const key = dateKey(d);
    const day = config.workingDays[weekdayKey(key)];
    const blocked = config.blockedDates.some(block => block.date === key && block.fullDay !== false);
    options.push({ date: key, label: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), weekday: DAY_LABELS[weekdayKey(key)], availableDay: Boolean(day?.enabled && !blocked) });
  }
  return options;
}
