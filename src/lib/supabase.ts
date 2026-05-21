import {
  AnalyticsEvent,
  Appointment,
  AuditLog,
  Automation,
  Business,
  Client,
  Integration,
  MessageTemplate,
  NotificationSetting,
  PaymentRecord,
  Professional,
  Review,
  Service,
  SystemLog,
  Unit,
  WaitlistItem
} from '../types';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://jssymlzkdrnsftnnsbbo.supabase.co';

const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_bL_AvHt81QkmpqKmjbx-UQ_zdbHswjg';

const API = `${SUPABASE_URL}/rest/v1`;

export const supabaseConfig = {
  url: SUPABASE_URL,
  hasKey: Boolean(SUPABASE_KEY),
  isConfigured: Boolean(SUPABASE_URL && SUPABASE_KEY),
};

export interface RemoteAgendaProData {
  business: Business;
  units: Unit[];
  professionals: Professional[];
  services: Service[];
  clients: Client[];
  appointments: Appointment[];
  waitlist: WaitlistItem[];
  messages: MessageTemplate[];
  automations: Automation[];
  integrations: Integration[];
  reviews: Review[];
  auditLogs: AuditLog[];
  systemLogs: SystemLog[];
  payments: PaymentRecord[];
  analyticsEvents: AnalyticsEvent[];
  notificationSettings: NotificationSetting[];
  companyId: string;
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!supabaseConfig.isConfigured) {
    throw new Error('Supabase não configurado.');
  }

  const headers = new Headers(options.headers || {});
  headers.set('apikey', SUPABASE_KEY);
  headers.set('Authorization', `Bearer ${SUPABASE_KEY}`);
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');

  const response = await fetch(`${API}${path}`, { ...options, headers });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Supabase ${response.status}: ${detail || response.statusText}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function roleFromDb(role?: string): Professional['role'] {
  if (!role) return 'Profissional';
  if (/secretária|recepção|atendimento/i.test(role)) return 'Recepção';
  if (/financeiro/i.test(role)) return 'Financeiro';
  if (/assistente/i.test(role)) return 'Assistente';
  if (/desenvolvedor/i.test(role)) return 'Desenvolvedor';
  if (/gestor|principal|administrador/i.test(role)) return 'Administrador';
  return 'Profissional';
}

function statusFromDb(status?: string): Appointment['status'] {
  const map: Record<string, Appointment['status']> = {
    requested: 'Solicitado',
    confirmed: 'Confirmado',
    completed: 'Concluído',
    canceled: 'Cancelado',
    cancelled: 'Cancelado',
    no_show: 'Não compareceu',
    rescheduled: 'Remarcado',
  };
  return map[String(status || '').toLowerCase()] || 'Solicitado';
}

function statusToDb(status: Appointment['status']) {
  const map: Record<Appointment['status'], string> = {
    'Solicitado': 'requested',
    'Confirmado': 'confirmed',
    'Concluído': 'completed',
    'Cancelado': 'canceled',
    'Não compareceu': 'no_show',
    'Remarcado': 'rescheduled',
  };
  return map[status];
}

function paymentFromDb(status?: string): Appointment['payment'] {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'paid') return 'Pago';
  if (normalized === 'cancelled' || normalized === 'canceled') return 'Cancelado';
  if (normalized === 'free') return 'Cortesia';
  return 'Pendente';
}

function paymentToDb(status: Appointment['payment']) {
  if (status === 'Pago') return 'paid';
  if (status === 'Cancelado') return 'canceled';
  if (status === 'Cortesia') return 'free';
  return 'pending';
}

function paymentRecordStatusFromDb(status?: string): PaymentRecord['status'] {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'paid') return 'Pago';
  if (normalized === 'failed') return 'Falhou';
  if (normalized === 'canceled' || normalized === 'cancelled') return 'Cancelado';
  if (normalized === 'simulated' || normalized === 'demo' || normalized === 'test') return 'Teste';
  return 'Pendente';
}

function paymentRecordStatusToDb(status: PaymentRecord['status']) {
  if (status === 'Pago') return 'paid';
  if (status === 'Falhou') return 'failed';
  if (status === 'Cancelado') return 'canceled';
  if (status === 'Teste') return 'simulated';
  return 'pending';
}

function logLevel(level?: string): SystemLog['level'] {
  const upper = String(level || 'info').toUpperCase();
  if (upper === 'WARNING' || upper === 'ERROR' || upper === 'DEBUG' || upper === 'SYSTEM') return upper;
  return 'INFO';
}

function channelFromDb(channel?: string): MessageTemplate['channel'] {
  const normalized = String(channel || '').toLowerCase();
  if (normalized.includes('email') || normalized.includes('e-mail')) return 'E-mail';
  if (normalized.includes('push')) return 'Push';
  if (normalized.includes('system') || normalized.includes('sistema')) return 'Sistema';
  return 'WhatsApp';
}

function integrationStatus(status?: string): Integration['status'] {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'connected' || normalized === 'conectado') return 'Conectado';
  if (normalized === 'simulated' || normalized === 'simulado') return 'Simulado';
  if (normalized === 'planned' || normalized === 'planejado') return 'Planejado';
  return 'Não conectado';
}

function integrationCategory(provider?: string): Integration['category'] {
  const p = String(provider || '').toLowerCase();
  if (p.includes('calendar')) return 'Agenda';
  if (p.includes('whatsapp') || p.includes('resend') || p.includes('email')) return 'Comunicação';
  if (p.includes('stripe') || p.includes('mercado')) return 'Pagamento';
  if (p.includes('oauth')) return 'Segurança';
  if (p.includes('sentry') || p.includes('analytics')) return 'Monitoramento';
  return 'Produtividade';
}

function formatPhone(phone?: string) {
  if (!phone) return 'não informado';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 11) return `(${digits.slice(-11, -9)}) ${digits.slice(-9, -4)}-${digits.slice(-4)}`;
  return phone;
}

function dateTimeBR(value?: string) {
  if (!value) return new Date().toLocaleString('pt-BR');
  return new Date(value).toLocaleString('pt-BR');
}

export async function fetchAgendaProDemo(slug = 'minha-agenda'): Promise<RemoteAgendaProData> {
  const companies = await request<any[]>(`/agendapro_companies?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`);
  const company = companies[0];

  if (!company) {
    throw new Error(`Empresa demo "${slug}" não encontrada no Supabase. Rode o SQL de setup primeiro.`);
  }

  const companyId = company.id;
  const [
    units,
    team,
    services,
    clients,
    appointments,
    waitlist,
    messages,
    automations,
    integrations,
    reviews,
    auditLogs,
    systemLogs,
    payments,
    analytics,
    notifications,
  ] = await Promise.all([
    request<any[]>(`/agendapro_units?company_id=eq.${companyId}&select=*&order=created_at.asc`),
    request<any[]>(`/agendapro_team_members?company_id=eq.${companyId}&select=*&order=created_at.asc`),
    request<any[]>(`/agendapro_services?company_id=eq.${companyId}&select=*&order=created_at.asc`),
    request<any[]>(`/agendapro_clients?company_id=eq.${companyId}&select=*&order=created_at.asc`),
    request<any[]>(`/agendapro_appointments?company_id=eq.${companyId}&select=*&order=date.asc,start_time.asc`),
    request<any[]>(`/agendapro_waitlist_entries?company_id=eq.${companyId}&select=*&order=created_at.desc`),
    request<any[]>(`/agendapro_message_templates?company_id=eq.${companyId}&select=*&order=created_at.asc`),
    request<any[]>(`/agendapro_automations?company_id=eq.${companyId}&select=*&order=created_at.asc`),
    request<any[]>(`/agendapro_integrations?company_id=eq.${companyId}&select=*&order=created_at.asc`),
    request<any[]>(`/agendapro_reviews?company_id=eq.${companyId}&select=*&order=created_at.desc`),
    request<any[]>(`/agendapro_audit_logs?company_id=eq.${companyId}&select=*&order=created_at.desc`),
    request<any[]>(`/agendapro_system_logs?company_id=eq.${companyId}&select=*&order=created_at.desc`),
    request<any[]>(`/agendapro_payments?company_id=eq.${companyId}&select=*&order=created_at.desc`),
    request<any[]>(`/agendapro_analytics_events?company_id=eq.${companyId}&select=*&order=created_at.desc`),
    request<any[]>(`/agendapro_notification_settings?company_id=eq.${companyId}&select=*&order=created_at.asc`),
  ]);

  const unitById = new Map(units.map((u) => [u.id, u]));
  const serviceById = new Map(services.map((s) => [s.id, s]));

  return {
    companyId,
    business: {
      name: company.name,
      slug: company.slug,
      segment: company.segment || 'Clínica odontológica',
      phone: formatPhone(company.phone),
      address: company.address || 'Endereço não informado',
      instagram: company.instagram || '@agendapro',
      primaryColor: company.primary_color || '#2563EB',
      logoText: String(company.name || 'AP').split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase(),
      publicMessage: company.description || 'Agende seu horário online em poucos passos.',
      cancellationPolicy: 'Cancelamentos devem ser solicitados com pelo menos 24 horas de antecedência. Atrasos superiores a 10 minutos podem exigir remarcação.',
      toleranceMinutes: 10,
      minNoticeHours: 3,
      maxAdvanceDays: 45,
    } as Business,
    units: units.map((unit): Unit => ({
      id: unit.id,
      name: unit.name,
      address: unit.address || 'Endereço não informado',
      phone: formatPhone(unit.phone),
      type: unit.unit_type === 'online' ? 'Online' : unit.unit_type === 'hybrid' ? 'Híbrida' : 'Presencial',
      active: Boolean(unit.is_active),
    })),
    professionals: team.map((member): Professional => ({
      id: member.id,
      name: member.name,
      role: roleFromDb(member.role),
      email: member.email || 'sem-email@demo.local',
      phone: formatPhone(member.phone),
      services: [],
      unit: unitById.get(member.unit_id)?.name || 'Unidade principal',
      active: Boolean(member.is_active),
      bio: member.bio || member.specialty || 'Membro da equipe.',
      permissions: [],
    })),
    services: services.map((service): Service => ({
      id: service.id,
      name: service.name,
      duration: Number(service.duration_minutes || 30),
      price: Number(service.price || 0),
      description: service.description || 'Serviço disponível para agendamento.',
      online: Boolean(service.is_active),
      category: service.category || 'Geral',
      color: service.color || '#2563EB',
      active: Boolean(service.is_active),
      professionalIds: [],
    })),
    clients: clients.map((client): Client => ({
      id: client.id,
      name: client.name,
      phone: formatPhone(client.phone),
      email: client.email || 'não informado',
      tags: client.tags || [],
      notes: client.notes || 'Sem observações internas.',
      totalSpent: Number(client.total_spent || 0),
      lastVisit: client.last_visit || '',
      birth: client.birth_date || undefined,
      noShows: 0,
      satisfaction: 0,
    })),
    appointments: appointments.map((appointment): Appointment => {
      const service = serviceById.get(appointment.service_id);
      const unit = unitById.get(appointment.unit_id);
      return {
        id: appointment.id,
        clientId: appointment.client_id || '',
        serviceId: appointment.service_id || '',
        professionalId: appointment.professional_id || '',
        date: appointment.date,
        time: String(appointment.start_time || '09:00').slice(0, 5),
        duration: Number(service?.duration_minutes || 30),
        value: Number(appointment.value || service?.price || 0),
        status: statusFromDb(appointment.status),
        channel: appointment.source === 'public_booking' ? 'Online' : appointment.source === 'whatsapp' ? 'WhatsApp' : 'Recepção',
        notes: appointment.notes || 'Sem observações.',
        history: [`Criado em ${dateTimeBR(appointment.created_at)}`],
        payment: paymentFromDb(appointment.payment_status),
        unit: unit?.name || 'Unidade principal',
      };
    }),
    waitlist: waitlist.map((item): WaitlistItem => ({
      id: item.id,
      name: item.client_name,
      phone: formatPhone(item.phone),
      preference: item.preferred_period || 'Primeiro horário disponível',
      service: item.service_name || 'Serviço não informado',
      priority: item.status === 'priority' ? 'Alta' : 'Normal',
      source: 'Página pública',
    })),
    messages: messages.map((message): MessageTemplate => ({
      id: message.id,
      category: message.category || 'Geral',
      title: message.title,
      channel: channelFromDb(message.channel),
      content: message.content,
    })),
    automations: automations.map((automation): Automation => ({
      id: automation.id,
      name: automation.name,
      status: automation.is_active ? 'Ativa' : 'Inativa',
      channel: channelFromDb(automation.channel),
      trigger: automation.trigger_event || 'Evento demonstrativo',
      message: automation.message || 'Mensagem automática.',
      lastRun: automation.last_run_at ? dateTimeBR(automation.last_run_at) : 'Nunca executada',
    })),
    integrations: integrations.map((integration): Integration => ({
      id: integration.id,
      name: integration.provider,
      description: integration.metadata?.description || 'Integração planejada para evolução SaaS.',
      status: integrationStatus(integration.status),
      category: integrationCategory(integration.provider),
      lastSync: integration.status === 'simulated' ? 'Simulação ativa' : 'Não conectado',
    })),
    reviews: reviews.map((review): Review => ({
      id: review.id,
      clientId: review.client_id || '',
      professionalId: review.professional_id || '',
      serviceId: review.service_id || '',
      rating: Number(review.rating || 5),
      comment: review.comment || 'Avaliação registrada.',
      date: String(review.created_at || '').slice(0, 10),
    })),
    auditLogs: auditLogs.map((log): AuditLog => ({
      id: log.id,
      date: dateTimeBR(log.created_at),
      actor: log.actor_name || 'Sistema',
      role: roleFromDb(log.actor_role),
      action: log.action,
      target: log.entity || 'Sistema',
      details: JSON.stringify(log.metadata || {}),
    })),
    systemLogs: systemLogs.map((log): SystemLog => ({
      id: log.id,
      date: dateTimeBR(log.created_at),
      level: logLevel(log.level),
      origin: log.source || 'Supabase',
      message: log.message,
      details: JSON.stringify(log.metadata || {}),
    })),
    payments: payments.map((payment): PaymentRecord => ({
      id: payment.id,
      date: String(payment.created_at || '').slice(0, 10),
      description: payment.description || 'Pagamento registrado.',
      provider: String(payment.provider || '').toLowerCase().includes('mercado') ? 'Mercado Pago' : String(payment.provider || '').toLowerCase().includes('stripe') ? 'Stripe' : 'Manual',
      amount: Number(payment.amount || 0),
      status: paymentRecordStatusFromDb(payment.status),
    })),
    analyticsEvents: analytics.map((event): AnalyticsEvent => ({
      id: event.id,
      date: String(event.created_at || '').slice(0, 10),
      event: event.event_type || 'Evento',
      source: event.source || event.page || 'Sistema',
      value: Number(event.metadata?.value || 1),
    })),
    notificationSettings: notifications.map((notification): NotificationSetting => ({
      id: notification.id,
      title: notification.channel === 'whatsapp' ? 'Notificações por WhatsApp' : notification.channel === 'email' ? 'Notificações por e-mail' : 'Notificações push',
      channel: channelFromDb(notification.channel),
      enabled: Boolean(notification.is_enabled),
      description: 'Preferência carregada do Supabase para a empresa demo.',
    })),
  };
}

async function upsert(table: string, body: Record<string, unknown>) {
  return request(`/${table}?on_conflict=id`, {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(body),
  });
}

export async function removeById(table: string, id: string) {
  if (!isUuid(id)) return;
  await request(`/${table}?id=eq.${id}`, { method: 'DELETE' });
}

export async function upsertService(companyId: string, service: Service) {
  if (!isUuid(service.id)) return;
  await upsert('agendapro_services', {
    id: service.id,
    company_id: companyId,
    name: service.name,
    description: service.description,
    category: service.category,
    duration_minutes: service.duration,
    price: service.price,
    color: service.color,
    is_active: service.active,
  });
}

export async function upsertClient(companyId: string, client: Client) {
  if (!isUuid(client.id)) return;
  await upsert('agendapro_clients', {
    id: client.id,
    company_id: companyId,
    name: client.name,
    phone: client.phone,
    email: client.email,
    notes: client.notes,
    tags: client.tags,
    total_spent: client.totalSpent,
    last_visit: client.lastVisit || null,
    birth_date: client.birth || null,
  });
}

export async function upsertAppointment(companyId: string, appointment: Appointment) {
  if (!isUuid(appointment.id)) return;
  const start = appointment.time;
  const [h, m] = start.split(':').map(Number);
  const endDate = new Date(2026, 0, 1, h || 0, m || 0);
  endDate.setMinutes(endDate.getMinutes() + appointment.duration);
  const end = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

  await upsert('agendapro_appointments', {
    id: appointment.id,
    company_id: companyId,
    client_id: isUuid(appointment.clientId) ? appointment.clientId : null,
    service_id: isUuid(appointment.serviceId) ? appointment.serviceId : null,
    professional_id: isUuid(appointment.professionalId) ? appointment.professionalId : null,
    date: appointment.date,
    start_time: appointment.time,
    end_time: end,
    status: statusToDb(appointment.status),
    payment_status: paymentToDb(appointment.payment),
    value: appointment.value,
    source: appointment.channel === 'Online' ? 'public_booking' : appointment.channel.toLowerCase(),
    notes: appointment.notes,
  });
}

export async function insertSystemLog(companyId: string, log: Omit<SystemLog, 'id' | 'date'>) {
  await request('/agendapro_system_logs', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      company_id: companyId,
      level: log.level.toLowerCase(),
      source: log.origin,
      message: log.message,
      metadata: { details: log.details },
    }),
  });
}

export async function insertAuditLog(companyId: string, log: Omit<AuditLog, 'id' | 'date'>) {
  await request('/agendapro_audit_logs', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      company_id: companyId,
      actor_name: log.actor,
      actor_role: log.role,
      action: log.action,
      entity: log.target,
      metadata: { details: log.details },
    }),
  });
}

export async function insertImplementationRequest(payload: Record<string, unknown>) {
  await request('/agendapro_implementation_requests', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(payload),
  });
}

export async function insertPublicBooking(companyId: string, client: Client, appointment: Appointment) {
  await upsertClient(companyId, client);
  await upsertAppointment(companyId, appointment);
}
