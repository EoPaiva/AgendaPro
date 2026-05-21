import { useEffect, useMemo, useState, type ComponentType, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, ArrowRight, BadgeCheck, BarChart3, Bell, Bot, Building2, CalendarCheck, CalendarClock, CheckCircle2, ChevronDown, ClipboardList, Clock, Clock3, Cookie, CreditCard, Database, Download, Eye, FileText, Headphones, KanbanSquare, KeyRound, Layers3, LayoutDashboard, LifeBuoy, Link2, ListChecks, Lock, LogIn, LogOut, Mail, MessageSquareText, MousePointerClick, Palette, QrCode, RefreshCcw, Rocket, Scale, ScrollText, Search, Send, Settings, ShieldCheck, SlidersHorizontal, Sparkles, Star, UserPlus, Users, UsersRound, Wand2, Webhook, Wrench, Zap } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Badge } from '../components/Badge';
import { useApp } from '../contexts/AppContext';
import { currency } from '../utils/format';
import { DAY_KEYS, DAY_LABELS, activePublicItems, buildDateOptions, dateKey, defaultScheduleConfig, generateSlotsForDate, normalizeBookingStatus, normalizeScheduleConfig, professionalMatchesService, professionalScheduleConfig, scheduleHasEnabledPeriod, serviceDurationMinutes, serviceHasValidDuration, teamForService, type ScheduleConfig } from '../lib/availability';
import { friendlyErrorMessage } from '../lib/errors';

const fade = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.45 }
};

const pageTitles: Record<string, string> = {
  '/': 'AgendaPro — Agenda Online Profissional',
  '/conta': 'AgendaPro | Conta do Cliente',
  '/conta/login': 'AgendaPro | Entrar',
  '/conta/cadastro': 'AgendaPro | Criar Conta',
  '/conta/painel': 'AgendaPro | Painel do Cliente',
  '/conta/criar-agenda': 'AgendaPro | Criador de Agenda',
  '/agenda': 'AgendaPro | Página de Apresentação',
  '/dev': 'AgendaPro | Developer Console',
  '/checkout': 'AgendaPro | Checkout Seguro',
  '/pagamento': 'AgendaPro | Status do Pagamento',
  '/planos': 'AgendaPro | Planos',
  '/demo': 'AgendaPro | Demonstração',
  '/termos': 'AgendaPro | Termos de Uso',
  '/privacidade': 'AgendaPro | Política de Privacidade',
  '/cookies': 'AgendaPro | Política de Cookies',
  '/lgpd': 'AgendaPro | LGPD e Direitos do Titular',
  '/confianca': 'AgendaPro | Central de Confiança'
};

function usePageTitle(route: string) {
  useEffect(() => {
    const key = Object.keys(pageTitles).filter(item => route.startsWith(item)).sort((a, b) => b.length - a.length)[0] || '/';
    document.title = pageTitles[key] || pageTitles['/'];
  }, [route]);
}

const features: Array<[string, string, ComponentType<{ size?: number }>]> = [
  ['Agendamento online', 'Clientes escolhem serviço, data e horário em uma página pública simples.', CalendarClock],
  ['Clientes com histórico', 'Cadastro com contato, tags, observações, recorrência e atendimentos anteriores.', UsersRound],
  ['Equipe e permissões', 'Administrador, recepção, profissional e financeiro com acessos diferentes.', ShieldCheck],
  ['Página pública personalizável', 'Logo, cores, capa, textos, preços e seções visíveis por cliente.', Palette],
  ['Mensagens prontas', 'Modelos para confirmação, lembrete, remarcação, pós-atendimento e lista de espera.', MessageSquareText],
  ['Automações', 'Fluxos preparados para lembretes, pesquisa de satisfação e reativação de clientes.', Zap],
  ['Relatórios executivos', 'Ocupação, receita estimada, serviços mais buscados e saúde da agenda.', BarChart3],
  ['IA assistida', 'Insights demonstrativos para resumir o dia e sugerir próximas ações.', Bot]
];

const segments = [
  ['Clínicas', 'Consultas, retornos, profissionais, confirmações e pacientes recorrentes.'],
  ['Barbearias', 'Cortes, barba, combos, encaixes e agenda por profissional.'],
  ['Salões e estética', 'Serviços, pacotes, profissionais e lista de espera.'],
  ['Consultorias', 'Reuniões, diagnósticos, mentorias e agenda online.'],
  ['Personal trainers', 'Aulas, avaliações, recorrência e horários fixos.'],
  ['Escritórios', 'Atendimento com horário marcado, equipe e histórico.'],
  ['Assistência técnica', 'Visitas, diagnósticos, serviços e retornos.'],
  ['Autônomos', 'Agenda profissional sem complicação e sem planilha.']
];

const plans = [
  {
    id: 'essential',
    name: 'Essencial',
    price: 49.9,
    setup: 100,
    description: 'Para quem quer começar com uma agenda online simples e profissional.',
    features: ['Agenda online', 'Página pública', 'Serviços e clientes', 'Mensagens prontas', 'Configuração guiada']
  },
  {
    id: 'professional',
    name: 'Profissional',
    price: 99.9,
    setup: 100,
    description: 'Para negócios que recebem agendamentos todos os dias.',
    features: ['Tudo do Essencial', 'Equipe', 'Lista de espera', 'Relatórios', 'Financeiro básico', 'Personalização visual'],
    highlighted: true
  },
  {
    id: 'business',
    name: 'Empresa',
    price: 199.9,
    setup: 100,
    description: 'Para equipes, clínicas e operações que precisam de mais controle.',
    features: ['Tudo do Profissional', 'Multiunidade', 'Permissões por função', 'Dashboard executivo', 'Suporte prioritário', 'Implantação assistida']
  }
];

const mercadoPagoLinks: Record<string, string> = {
  essential: import.meta.env.VITE_MERCADO_PAGO_ESSENTIAL_LINK || 'https://mpago.la/2aynw39',
  professional: import.meta.env.VITE_MERCADO_PAGO_PROFESSIONAL_LINK || 'https://mpago.la/1D2cMK7',
  business: import.meta.env.VITE_MERCADO_PAGO_BUSINESS_LINK || 'https://mpago.la/1ZJRTao',
  implementation: import.meta.env.VITE_MERCADO_PAGO_IMPLEMENTATION_LINK || 'https://mpago.la/17N4Eme'
};

type PaymentFallbackLink = { id: string; label: string; url: string };

function getManualPaymentLinks(planId: string, includeImplementation = false): PaymentFallbackLink[] {
  const plan = plans.find(item => item.id === planId) || plans[1];
  const links: PaymentFallbackLink[] = [{ id: plan.id, label: `Plano ${plan.name}`, url: mercadoPagoLinks[plan.id] || mercadoPagoLinks.professional }];
  if (includeImplementation && plan.id !== 'implementation') links.push({ id: 'implementation', label: 'Implantação assistida', url: mercadoPagoLinks.implementation });
  return links.filter(item => item.url);
}

const demoExternalUrl = import.meta.env.VITE_AGENDAPRO_DEMO_URL || 'https://agendapro-demo.vercel.app/';

type ClientAccount = {
  fullName: string;
  email: string;
  whatsapp: string;
  businessName: string;
  planId: string;
  planName: string;
  paymentStatus: 'approved' | 'approved_manual' | 'pending' | 'rejected' | 'manual_pending' | 'none';
  subscriptionStatus: 'active' | 'pending' | 'expired' | 'cancelled' | 'suspended' | 'trial';
  expiresAt?: string;
  implementationStatus?: 'not_hired' | 'awaiting_briefing' | 'reviewing' | 'building' | 'waiting_approval' | 'finished';
  agendaStatus?: 'not_created' | 'draft' | 'published';
  publicSlug?: string;
  publicLink?: string;
  createdAt?: string;
  licenseSource?: string;
};

type AgendaDraft = {
  business: { name: string; segment: string; whatsapp: string; address: string; description: string; email?: string; responsible?: string; category?: string };
  visual: { primaryColor: string; secondaryColor: string; accentColor: string; logoUrl: string; bannerUrl?: string; slogan: string; instagram?: string; siteUrl?: string; welcome?: string };
  conversion?: { headline?: string; subtitle?: string; benefits?: string[] | string; differentials?: string[] | string; testimonials?: Array<{ quote: string; author: string }> | string; experienceYears?: string; estimatedAppointments?: string; trustBadges?: string[] | string };
  services: Array<{ id?: string; name: string; duration: string; durationMinutes?: number | string; price: string | number; value?: string | number; description: string; category?: string; active?: boolean; highlight?: boolean; order?: number | string; professionalsText?: string; professionalNames?: string[]; internalNotes?: string }>;
  team: Array<{ id?: string; name: string; role: string; whatsapp: string; email?: string; specialty?: string; avatarUrl?: string; active?: boolean; servicesText?: string; serviceNames?: string[]; availabilityNotes?: string; scheduleConfig?: Partial<ScheduleConfig>; schedule?: Partial<ScheduleConfig>; availability?: Partial<ScheduleConfig> | Record<string, any> }>;
  hours: { weekdays: string; saturday: string; interval: string };
  schedule?: { weekdays?: string[]; start?: string; end?: string; break?: string };
  scheduleConfig?: ScheduleConfig;
  rules: { minNotice: string; cancellation: string; notesRequired: boolean; confirmation?: string; maxFutureDays?: string; reservePendingRequests?: boolean; cancellationLimitHours?: string; bufferBeforeMinutes?: string; bufferAfterMinutes?: string };
  slug: string;
  publishedAt?: string;
  ownerEmail?: string;
  ownerId?: string;
  bookedSlots?: any[];
};

type BookingTemplateKey = 'received' | 'confirmation' | 'reschedule' | 'cancellation' | 'reminder' | 'completed' | 'reactivation' | 'payment_pending' | 'welcome';
type BookingMessageTemplate = {
  key: BookingTemplateKey;
  label: string;
  description: string;
  subject: string;
  body: string;
};

const bookingMessageTemplates: BookingMessageTemplate[] = [
  {
    key: 'confirmation',
    label: 'Confirmação',
    description: 'Confirma o horário escolhido pelo cliente.',
    subject: 'Agendamento confirmado - {servico}',
    body: `Olá, {cliente}! Tudo bem?

Seu agendamento foi confirmado na {empresa}.

Serviço: {servico}
Profissional: {profissional}
Data: {data}
Horário: {horario}
Endereço: {endereco}

Qualquer dúvida, estamos à disposição.`
  },
  {
    key: 'reschedule',
    label: 'Remarcação',
    description: 'Comunica alteração de data ou horário.',
    subject: 'Agendamento remarcado - {empresa}',
    body: `Olá, {cliente}! Tudo bem?

Seu agendamento na {empresa} foi remarcado.

Novo horário: {data} às {horario}
Serviço: {servico}
Profissional: {profissional}

Se precisar ajustar novamente, fale com a gente pelo WhatsApp: {whatsapp}.`
  },
  {
    key: 'cancellation',
    label: 'Cancelamento',
    description: 'Informa cancelamento e abre caminho para novo horário.',
    subject: 'Agendamento cancelado - {empresa}',
    body: `Olá, {cliente}! Tudo bem?

Seu agendamento na {empresa} precisou ser cancelado.

Serviço: {servico}
Data: {data}
Horário: {horario}

Podemos verificar uma nova opção de horário para você: {link_agenda}`
  },
  {
    key: 'reminder',
    label: 'Lembrete',
    description: 'Lembra o cliente antes do atendimento.',
    subject: 'Lembrete do seu agendamento - {empresa}',
    body: `Olá, {cliente}! Passando para lembrar do seu agendamento na {empresa}.

Serviço: {servico}
Profissional: {profissional}
Data: {data}
Horário: {horario}
Endereço: {endereco}

Qualquer dúvida, estamos à disposição.`
  },
  {
    key: 'completed',
    label: 'Pós-atendimento',
    description: 'Agradece e incentiva retorno depois do atendimento.',
    subject: 'Obrigado pela preferência - {empresa}',
    body: `Olá, {cliente}! Obrigado pela preferência.

Seu atendimento na {empresa} foi marcado como concluído.

Serviço: {servico}
Data: {data}

Foi um prazer atender você. Quando quiser, agende seu próximo horário por aqui: {link_agenda}`
  },
  {
    key: 'reactivation',
    label: 'Reativação',
    description: 'Chama clientes sem retorno recente.',
    subject: 'Vamos agendar seu próximo horário? - {empresa}',
    body: `Olá, {cliente}! Tudo bem?

Aqui é da {empresa}. Percebemos que já faz um tempo desde seu último atendimento.

Quer que a gente veja um novo horário para {servico}?

Você também pode agendar direto por aqui: {link_agenda}`
  },
  {
    key: 'payment_pending',
    label: 'Pagamento pendente',
    description: 'Lembra pendência financeira sem tom agressivo.',
    subject: 'Pendência do seu atendimento - {empresa}',
    body: `Olá, {cliente}! Tudo bem?

Identificamos uma pendência relacionada ao seu atendimento na {empresa}.

Serviço: {servico}
Data: {data}
Horário: {horario}

Fale com a gente pelo WhatsApp {whatsapp} para regularizar ou tirar dúvidas.`
  },
  {
    key: 'welcome',
    label: 'Boas-vindas',
    description: 'Mensagem inicial para apresentar a agenda pública.',
    subject: 'Boas-vindas à agenda da {empresa}',
    body: `Olá, {cliente}! Boas-vindas à agenda da {empresa}.

Por aqui você pode escolher serviço, profissional, data e horário com mais praticidade.

Link da agenda: {link_agenda}
WhatsApp: {whatsapp}
Endereço: {endereco}`
  },
  {
    key: 'received',
    label: 'Solicitação recebida',
    description: 'Confirma recebimento enquanto o pedido ainda está pendente.',
    subject: 'Solicitação recebida - {empresa}',
    body: `Olá, {cliente}! Tudo bem?

Recebemos sua solicitação de agendamento na {empresa}.

Serviço: {servico}
Profissional: {profissional}
Data: {data}
Horário: {horario}

Em breve retornaremos com a confirmação.`
  }
];

const messageTemplateVariableKeys = ['{cliente}', '{empresa}', '{servico}', '{profissional}', '{data}', '{horario}', '{whatsapp}', '{link_agenda}', '{endereco}'];
const bookingMessageTemplateMap = bookingMessageTemplates.reduce<Record<string, BookingMessageTemplate>>((map, template) => {
  map[template.key] = template;
  return map;
}, {});

function defaultMessageTemplateDrafts() {
  return bookingMessageTemplates.reduce<Record<string, string>>((map, template) => {
    map[template.key] = template.body;
    return map;
  }, {});
}

function messageTemplateStorageKey(slug: string) {
  return `agendapro-message-templates:${slugify(slug || 'agenda')}`;
}

function normalizeBookingMessageTemplateKey(value: string): BookingTemplateKey {
  const key = String(value || '').toLowerCase().replace(/-/g, '_');
  if (key === 'post_attendance' || key === 'pos_atendimento' || key === 'post') return 'completed';
  if (key === 'payment' || key === 'payment_pending') return 'payment_pending';
  if (bookingMessageTemplateMap[key]) return key as BookingTemplateKey;
  return 'confirmation';
}

function loadMessageTemplateDrafts(slug: string) {
  const defaults = defaultMessageTemplateDrafts();
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(messageTemplateStorageKey(slug)) : '';
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object') return defaults;
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 56) || 'cliente-agendapro';
}

function getStoredClient(): ClientAccount | null {
  try {
    return JSON.parse(localStorage.getItem('agendapro-client-account') || localStorage.getItem('agendapro-checkout-lead') || 'null');
  } catch {
    return null;
  }
}

function saveStoredClient(account: ClientAccount) {
  localStorage.setItem('agendapro-client-account', JSON.stringify(account));
  localStorage.setItem('agendapro-checkout-lead', JSON.stringify(account));
  notifyClientAuthChanged();
}

function getClientToken() {
  return localStorage.getItem('agendapro-client-token') || '';
}

function notifyClientAuthChanged() {
  window.dispatchEvent(new Event('agendapro:client-auth-changed'));
}

function saveClientToken(token?: string) {
  if (token) {
    localStorage.setItem('agendapro-client-token', token);
    notifyClientAuthChanged();
  }
}

function clearClientAuth() {
  localStorage.removeItem('agendapro-client-token');
  localStorage.removeItem('agendapro-client-session');
  notifyClientAuthChanged();
}

function hasClientSession() {
  return Boolean(getClientToken() && getStoredClient());
}

function authHeaders(): HeadersInit {
  const token = getClientToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function agendaStorageKey(account: ClientAccount | null = getStoredClient()) {
  const identity = account?.email || account?.businessName || 'anonymous';
  return `agendapro-agenda-draft:${slugify(identity)}`;
}

function getStoredAgenda(): AgendaDraft | null {
  const account = getStoredClient();
  try {
    const scoped = localStorage.getItem(agendaStorageKey(account));
    if (scoped) return JSON.parse(scoped);

    const legacy = JSON.parse(localStorage.getItem('agendapro-agenda-draft') || 'null');
    if (!legacy || !account) return null;

    const belongsToAccount =
      legacy.ownerEmail === account.email ||
      legacy.slug === account.publicSlug ||
      legacy.slug === slugify(account.businessName || '');

    return belongsToAccount ? legacy : null;
  } catch {
    return null;
  }
}

function saveStoredAgenda(agenda: AgendaDraft) {
  const account = getStoredClient();
  const scopedAgenda = { ...agenda, ownerEmail: account?.email, ownerId: account?.email };
  localStorage.setItem(agendaStorageKey(account), JSON.stringify(scopedAgenda));
  localStorage.setItem('agendapro-agenda-draft:last', JSON.stringify(scopedAgenda));
}

function resolveClientAgendaSlug(account?: ClientAccount | null, agenda?: AgendaDraft | null) {
  return agenda?.slug || account?.publicSlug || slugify(account?.businessName || 'minha-agenda');
}

function hasMeaningfulScheduleConfig(value: any) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Boolean(
    value.workingDays ||
    value.slotInterval ||
    value.minAdvanceHours !== undefined ||
    value.maxFutureDays !== undefined ||
    (Array.isArray(value.blockedDates) && value.blockedDates.length) ||
    (Array.isArray(value.blockedTimes) && value.blockedTimes.length)
  );
}

function pickScheduleConfig(...values: any[]) {
  return values.find(hasMeaningfulScheduleConfig) || {};
}

function normalizePublicAgenda(row: any): AgendaDraft | null {
  if (!row) return null;
  const theme = row.theme || row.theme_config || row.raw_payload?.visual || {};
  const raw = row.raw_payload || {};
  return {
    business: {
      name: row.business_name || raw.business?.name || 'Agenda',
      segment: row.segment || raw.business?.segment || 'Atendimento com horário marcado',
      whatsapp: row.whatsapp || raw.business?.whatsapp || '',
      email: row.email || raw.business?.email || raw.email || '',
      responsible: raw.business?.responsible || row.responsible || raw.responsible || '',
      category: row.category || raw.business?.category || row.segment || raw.business?.segment || '',
      address: row.address || raw.business?.address || '',
      description: row.description || raw.business?.description || 'Conheça nossos serviços e agende seu horário online com praticidade.'
    },
    visual: {
      primaryColor: theme.primary_color || theme.primaryColor || '#2563EB',
      secondaryColor: theme.secondary_color || theme.secondaryColor || '#0F172A',
      accentColor: theme.accent_color || theme.accentColor || '#10B981',
      logoUrl: theme.logo_url || theme.logoUrl || '',
      bannerUrl: theme.banner_url || theme.bannerUrl || raw.visual?.bannerUrl || '',
      instagram: theme.instagram || raw.visual?.instagram || '',
      siteUrl: theme.site_url || theme.siteUrl || raw.visual?.siteUrl || '',
      welcome: theme.welcome || raw.visual?.welcome || '',
      slogan: theme.slogan || raw.visual?.slogan || 'Agende seu horário online'
    },
    conversion: raw.conversion || row.conversion || theme.conversion || {},
    services: Array.isArray(row.services) ? row.services : Array.isArray(raw.services) ? raw.services : [],
    team: Array.isArray(row.team) ? row.team : Array.isArray(raw.team) ? raw.team : [],
    hours: row.hours || raw.hours || { weekdays: '08:00 às 18:00', saturday: '08:00 às 12:00', interval: '30' },
    schedule: row.schedule || raw.schedule,
    scheduleConfig: normalizeScheduleConfig(pickScheduleConfig(row.schedule_config, row.scheduleConfig, raw.scheduleConfig), row.hours || raw.hours, row.rules || raw.rules),
    bookedSlots: Array.isArray(row.booked_slots) ? row.booked_slots : Array.isArray(row.bookedSlots) ? row.bookedSlots : [],
    rules: row.rules || raw.rules || { minNotice: '2 horas', cancellation: 'Cancelamentos com até 24h de antecedência.', notesRequired: false, confirmation: 'Confirmação manual pelo WhatsApp.' },
    slug: row.public_slug || raw.slug || 'agenda',
    publishedAt: row.published_at || raw.publishedAt,
    ownerEmail: row.owner_hint || undefined
  };
}

function whatsappHref(phone?: string, message?: string) {
  const clean = String(phone || '').replace(/\D/g, '');
  if (!clean) return '';
  const target = clean.startsWith('55') ? clean : `55${clean}`;
  return `https://wa.me/${target}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}

function agendaCleanText(value: any, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function agendaPriceLabel(service: any = {}) {
  const raw = service.price ?? service.value ?? 0;
  const number = Number(String(raw).replace(/[^0-9,.]/g, '').replace(',', '.'));
  if (!Number.isFinite(number) || number <= 0) return 'Sob consulta';
  return `R$ ${number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function agendaServiceDurationLabel(service: any = {}) {
  return `${serviceDurationMinutes(service)} min`;
}

function formatPublicDateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

function summarizeAgendaSchedule(config: ScheduleConfig) {
  const active = DAY_KEYS.filter(key => config.workingDays?.[key]?.enabled);
  if (!active.length) return 'Funcionamento sob consulta';
  const weekdayGroup = active.includes('monday') && active.includes('friday') && active.length >= 5;
  const first = active[0];
  const periods = config.workingDays[first]?.periods || [];
  const periodText = periods.length ? periods.map(period => `${period.start} às ${period.end}`).join(' / ') : 'horário configurado';
  return weekdayGroup ? `Segunda a sexta • ${periodText}` : `${active.map(key => DAY_LABELS[key]).join(', ')} • ${periodText}`;
}

function agendaIsOpenNow(config: ScheduleConfig) {
  const today = dateKey();
  const dayKey = DAY_KEYS[new Date(`${today}T12:00:00`).getDay()];
  const day = config.workingDays?.[dayKey];
  if (!day?.enabled) return false;
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return (day.periods || []).some(period => {
    const [sh, sm] = String(period.start || '00:00').split(':').map(Number);
    const [eh, em] = String(period.end || '00:00').split(':').map(Number);
    return minutes >= sh * 60 + sm && minutes <= eh * 60 + em;
  });
}

function nextAgendaSlotLabel(services: any[], appointments: any[], config: ScheduleConfig) {
  const service = services?.[0] || { durationMinutes: 60 };
  const options = buildDateOptions(config, 21);
  for (const item of options) {
    if (!item.availableDay) continue;
    const slots = generateSlotsForDate({ date: item.date, serviceDuration: serviceDurationMinutes(service), appointments, scheduleConfig: config });
    const slot = slots.find(candidate => candidate.available);
    if (slot) return `${item.label} às ${slot.time}`;
  }
  return 'Sem horário disponível agora';
}

function agendaMapHref(address?: string) {
  const value = agendaCleanText(address);
  return value ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}` : '';
}

function getAgendaPresentationFooterData(agenda: AgendaDraft, config: ScheduleConfig, publicUrl: string, bookingUrl: string) {
  return {
    name: agendaCleanText(agenda.business?.name, 'Agenda online'),
    description: agendaCleanText(agenda.business?.description, 'Conheça nossos serviços e agende seu horário online com praticidade.'),
    whatsapp: agendaCleanText(agenda.business?.whatsapp),
    email: agendaCleanText(agenda.business?.email),
    address: agendaCleanText(agenda.business?.address),
    responsible: agendaCleanText(agenda.business?.responsible || agenda.team?.[0]?.name),
    hours: summarizeAgendaSchedule(config),
    rules: agendaCleanText(config.cancellationText || agenda.rules?.cancellation, 'Após solicitar o agendamento, aguarde a confirmação pelo estabelecimento.'),
    publicUrl,
    bookingUrl
  };
}

type ClientAccessKey = 'active' | 'trial' | 'pending' | 'manual_pending' | 'rejected' | 'expired' | 'suspended' | 'cancelled';

type ClientAccessDecision = {
  key: ClientAccessKey;
  active: boolean;
  tone: 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'purple';
  label: string;
  title: string;
  message: string;
  actionLabel: string;
  actionHref: string;
  checklist: string[];
};

function isPastDate(value?: string) {
  if (!value) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.getTime() < Date.now();
}

function getClientAccessDecision(account?: ClientAccount | null): ClientAccessDecision {
  const planId = account?.planId || 'professional';
  const payment = String(account?.paymentStatus || 'none').toLowerCase();
  const subscription = String(account?.subscriptionStatus || 'pending').toLowerCase();
  const expiredByDate = Boolean(account?.expiresAt && isPastDate(account.expiresAt));

  if (!account) {
    return { key: 'pending', active: false, tone: 'amber', label: 'Sem conta', title: 'Crie ou entre em uma conta para continuar.', message: 'A área privada do AgendaPro precisa de uma conta vinculada.', actionLabel: 'Criar conta', actionHref: '#/conta/cadastro', checklist: ['Criar conta', 'Escolher plano', 'Concluir liberação'] };
  }

  if (['suspended', 'blocked'].includes(subscription)) {
    return { key: 'suspended', active: false, tone: 'red', label: 'Plano suspenso', title: 'Sua conta está temporariamente suspensa.', message: 'O acesso ao criador, dashboard e ações operacionais fica bloqueado até regularização pela Central Dev ou suporte.', actionLabel: 'Falar com suporte', actionHref: `https://wa.me/55${String(account.whatsapp || '').replace(/\D/g, '')}`, checklist: ['Falar com suporte', 'Regularizar pendência', 'Aguardar reativação'] };
  }

  if (subscription === 'cancelled' || subscription === 'canceled') {
    return { key: 'cancelled', active: false, tone: 'red', label: 'Plano cancelado', title: 'Seu plano foi cancelado.', message: 'Para voltar a usar a agenda, escolha um plano e faça uma nova liberação.', actionLabel: 'Reativar plano', actionHref: `#/checkout/${planId}`, checklist: ['Selecionar plano', 'Gerar novo pagamento', 'Aguardar aprovação'] };
  }

  if (subscription === 'expired' || expiredByDate) {
    return { key: 'expired', active: false, tone: 'red', label: 'Plano vencido', title: 'Seu plano ou licença venceu.', message: 'A agenda não deve operar com plano vencido. Regularize o acesso para voltar a gerenciar e receber novos agendamentos.', actionLabel: 'Regularizar pagamento', actionHref: `#/checkout/${planId}`, checklist: ['Abrir checkout', 'Efetuar pagamento', 'Aguardar liberação'] };
  }

  if (payment === 'rejected') {
    return { key: 'rejected', active: false, tone: 'red', label: 'Pagamento reprovado', title: 'O pagamento foi reprovado.', message: 'Revise os dados, envie um novo pagamento ou solicite análise manual.', actionLabel: 'Tentar novamente', actionHref: `#/checkout/${planId}`, checklist: ['Revisar pagamento', 'Enviar novo comprovante', 'Aguardar análise'] };
  }

  if (payment === 'manual_pending') {
    return { key: 'manual_pending', active: false, tone: 'amber', label: 'Pagamento em análise', title: 'Seu pagamento manual está em análise.', message: 'O acesso será liberado quando a Central Dev confirmar o recebimento. O link manual não libera acesso automaticamente.', actionLabel: 'Ver pagamentos', actionHref: '#/conta/pagamentos', checklist: ['Pagamento enviado', 'Conferência manual', 'Liberação do plano'] };
  }

  if (subscription === 'trial') {
    return { key: 'trial', active: true, tone: 'green', label: 'Trial ativo', title: 'Seu acesso de teste está liberado.', message: 'Você pode criar, publicar e gerenciar sua agenda até o vencimento da licença.', actionLabel: 'Criar agenda', actionHref: '#/conta/criar-agenda', checklist: ['Acesso liberado', 'Configurar agenda', 'Publicar link'] };
  }

  if (payment === 'approved' || payment === 'approved_manual' || subscription === 'active') {
    return { key: 'active', active: true, tone: 'green', label: 'Plano ativo', title: 'Seu acesso está liberado.', message: 'Você pode criar, publicar, gerenciar agendamentos e usar o painel operacional.', actionLabel: 'Abrir agenda', actionHref: '#/conta/criar-agenda', checklist: ['Plano ativo', 'Agenda liberada', 'Operação disponível'] };
  }

  return { key: 'pending', active: false, tone: 'amber', label: 'Aguardando pagamento', title: 'Conclua o pagamento para liberar a agenda.', message: 'O criador e os recursos operacionais ficam bloqueados até pagamento aprovado, key ativa ou liberação manual.', actionLabel: 'Pagar plano', actionHref: `#/checkout/${planId}`, checklist: ['Escolher plano', 'Efetuar pagamento', 'Aguardar liberação'] };
}

function isClientAccessActive(account?: ClientAccount | null) {
  return getClientAccessDecision(account).active;
}


type AgendaReadinessIssue = {
  key: string;
  title: string;
  description: string;
  ok: boolean;
  required?: boolean;
  actionLabel?: string;
  step?: number;
};

type AgendaReadiness = {
  score: number;
  status: 'incomplete' | 'almost' | 'ready';
  label: string;
  tone: 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'slate';
  canPublish: boolean;
  completed: number;
  total: number;
  issues: AgendaReadinessIssue[];
  missing: AgendaReadinessIssue[];
};

function getAgendaReadiness(agenda?: Partial<AgendaDraft> | null, account?: ClientAccount | null): AgendaReadiness {
  const business = agenda?.business || {} as AgendaDraft['business'];
  const services = Array.isArray(agenda?.services) ? agenda.services : [];
  const team = Array.isArray(agenda?.team) ? agenda.team : [];
  const rules = agenda?.rules || {} as AgendaDraft['rules'];
  const scheduleConfig = normalizeScheduleConfig(agenda?.scheduleConfig || (agenda as any)?.schedule_config || (agenda as any)?.raw_payload?.scheduleConfig, agenda?.hours, rules);
  const enabledDays = DAY_KEYS.filter(day => scheduleConfig.workingDays?.[day]?.enabled && (scheduleConfig.workingDays?.[day]?.periods || []).some(period => period.start && period.end));
  const normalizedSlug = slugify(agenda?.slug || account?.publicSlug || business.name || '');
  const activeServices = activePublicItems(services).filter(service => String(service?.name || '').trim());
  const activeTeam = activePublicItems(team).filter(member => String(member?.name || '').trim());
  const invalidDurationServices = activeServices.filter(service => !serviceHasValidDuration(service));
  const servicesWithoutProfessional = activeServices.filter(service => teamForService(activeTeam, service).length === 0);
  const professionalsWithoutSchedule = activeTeam.filter(member => !scheduleHasEnabledPeriod(professionalScheduleConfig(scheduleConfig, member)));
  const contact = business.whatsapp || business.email || account?.whatsapp || account?.email;
  const issues: AgendaReadinessIssue[] = [
    { key: 'business', title: 'Dados do negócio', description: business.name ? 'Nome do negócio informado.' : 'Informe o nome público do negócio.', ok: Boolean(String(business.name || '').trim()), required: true, actionLabel: 'Editar negócio', step: 0 },
    { key: 'slug', title: 'Link público', description: normalizedSlug.length >= 3 ? `Slug pronto: ${normalizedSlug}` : 'Defina um slug válido para o link público.', ok: normalizedSlug.length >= 3, required: true, actionLabel: 'Corrigir slug', step: 0 },
    { key: 'contact', title: 'Contato público', description: contact ? 'WhatsApp ou e-mail disponível para suporte ao cliente.' : 'Informe WhatsApp ou e-mail para o cliente falar com a empresa.', ok: Boolean(contact), required: true, actionLabel: 'Adicionar contato', step: 0 },
    { key: 'services', title: 'Serviços cadastrados', description: activeServices.length ? `${activeServices.length} serviço(s) ativo(s) na página pública.` : 'Cadastre pelo menos um serviço ativo.', ok: activeServices.length > 0, required: true, actionLabel: 'Cadastrar serviço', step: 2 },
    { key: 'service_duration', title: 'Duração dos serviços', description: invalidDurationServices.length ? `${invalidDurationServices.length} serviço(s) sem duração válida.` : 'Todos os serviços ativos têm duração válida.', ok: activeServices.length > 0 && invalidDurationServices.length === 0, required: true, actionLabel: 'Corrigir duração', step: 2 },
    { key: 'team', title: 'Profissionais', description: activeTeam.length ? `${activeTeam.length} profissional(is) ativo(s).` : 'Cadastre pelo menos um profissional ou responsável.', ok: activeTeam.length > 0, required: true, actionLabel: 'Cadastrar profissional', step: 3 },
    { key: 'service_professionals', title: 'Vínculo serviço-profissional', description: servicesWithoutProfessional.length ? `${servicesWithoutProfessional.length} serviço(s) sem profissional compatível.` : 'Serviços ativos possuem profissional compatível.', ok: activeServices.length > 0 && activeTeam.length > 0 && servicesWithoutProfessional.length === 0, required: true, actionLabel: 'Vincular profissionais', step: 3 },
    { key: 'professional_schedule', title: 'Agenda dos profissionais', description: professionalsWithoutSchedule.length ? `${professionalsWithoutSchedule.length} profissional(is) sem horário válido.` : 'Profissionais ativos herdam ou possuem horário válido.', ok: activeTeam.length > 0 && professionalsWithoutSchedule.length === 0, required: true, actionLabel: 'Configurar horários', step: 4 },
    { key: 'schedule', title: 'Disponibilidade', description: enabledDays.length ? `${enabledDays.length} dia(s) com horário configurado.` : 'Configure dias e horários de atendimento.', ok: enabledDays.length > 0, required: true, actionLabel: 'Configurar horários', step: 4 },
    { key: 'description', title: 'Apresentação pública', description: business.description ? 'Descrição pública preenchida.' : 'Adicione uma descrição curta para melhorar a página pública.', ok: Boolean(String(business.description || '').trim()), required: false, actionLabel: 'Melhorar descrição', step: 0 },
    { key: 'rules', title: 'Regras de atendimento', description: rules.cancellation ? 'Política de cancelamento configurada.' : 'Defina uma política de cancelamento simples.', ok: Boolean(String(rules.cancellation || '').trim()), required: false, actionLabel: 'Ajustar regras', step: 5 }
  ];
  const completed = issues.filter(issue => issue.ok).length;
  const requiredMissing = issues.filter(issue => issue.required && !issue.ok);
  const score = Math.round((completed / issues.length) * 100);
  const canPublish = requiredMissing.length === 0;
  const status = canPublish ? 'ready' : score >= 70 ? 'almost' : 'incomplete';
  return {
    score,
    status,
    label: status === 'ready' ? 'Pronta para publicar' : status === 'almost' ? 'Quase pronta' : 'Agenda incompleta',
    tone: status === 'ready' ? 'green' : status === 'almost' ? 'amber' : 'red',
    canPublish,
    completed,
    total: issues.length,
    issues,
    missing: issues.filter(issue => !issue.ok)
  };
}

function statusTone(status?: string): 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'purple' {
  if (['approved', 'approved_manual', 'active', 'trial', 'published', 'finished', 'confirmed', 'completed', 'rescheduled', 'paid', 'available', 'resolved'].includes(String(status))) return 'green';
  if (['rejected', 'cancelled', 'expired', 'suspended', 'revoked', 'disabled', 'failed', 'error', 'deleted'].includes(String(status))) return 'red';
  if (['pending', 'manual_pending', 'pending_review', 'needs_adjustment', 'awaiting_briefing', 'building', 'draft', 'not_created', 'paused'].includes(String(status))) return 'amber';
  return 'slate';
}

function statusLabel(status?: string) {
  const map: Record<string, string> = {
    approved: 'Aprovado',
    pending: 'Pendente',
    rejected: 'Reprovado',
    manual_pending: 'Aguardando confirmação manual',
    active: 'Ativa',
    trial: 'Trial ativo',
    expired: 'Vencida',
    cancelled: 'Cancelada',
    not_hired: 'Não contratada',
    awaiting_briefing: 'Aguardando briefing',
    reviewing: 'Em análise',
    building: 'Em configuração',
    waiting_approval: 'Aguardando aprovação',
    finished: 'Finalizada',
    not_created: 'Não criada',
    draft: 'Em configuração',
    published: 'Publicada',
    confirmed: 'Confirmado',
    completed: 'Concluído',
    requested: 'Pendente',
    solicitado: 'Pendente',
    refused: 'Recusado',
    recusado: 'Recusado',
    absent: 'Faltou',
    ausente: 'Faltou',
    no_show: 'Faltou',
    pending_review: 'Aguardando análise',
    rescheduled: 'Remarcado',
    approved_manual: 'Aprovado manualmente',
    paid: 'Pago',
    needs_adjustment: 'Solicitar ajuste',
    suspended: 'Suspensa',
    paused: 'Pausada',
    disabled: 'Desativada',
    revoked: 'Revogada',
    available: 'Disponível',
    failed: 'Falhou',
    error: 'Erro',
    processed: 'Processado',
    resolved: 'Resolvido',
    converted: 'Convertido',
    deleted: 'Arquivado'
  };
  return map[String(status || 'none')] || 'Pendente';
}

function bookingStatusKey(status?: string) {
  const normalized = normalizeBookingStatus(status);
  if (normalized === 'requested') return 'pending';
  return normalized || 'pending';
}

function bookingStatusLabel(status?: string) {
  return statusLabel(bookingStatusKey(status));
}

function bookingActionText(status: string) {
  const map: Record<string, string> = {
    pending: 'pendente',
    confirmed: 'confirmado',
    cancelled: 'cancelado',
    completed: 'concluído',
    rescheduled: 'remarcado',
    refused: 'recusado',
    absent: 'faltou'
  };
  return map[status] || status;
}



function AnimatedNumber({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
    const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setDisplay(target);
      return;
    }
    let frame = 0;
    const totalFrames = 24;
    const start = display;
    const delta = target - start;
    let raf = 0;
    const tick = () => {
      frame += 1;
      const progress = 1 - Math.pow(1 - frame / totalFrames, 3);
      setDisplay(Math.round(start + delta * progress));
      if (frame < totalFrames) raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [value]);
  return <>{prefix}{display.toLocaleString('pt-BR')}{suffix}</>;
}

function MiniSparkline({ values }: { values: number[] }) {
  const safe = values.length ? values : [0, 0, 0, 0];
  const max = Math.max(...safe, 1);
  const min = Math.min(...safe, 0);
  const spread = Math.max(max - min, 1);
  const points = safe.map((value, index) => {
    const x = (index / Math.max(safe.length - 1, 1)) * 120;
    const y = 36 - ((value - min) / spread) * 28;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return <svg className="mini-sparkline" viewBox="0 0 120 42" role="img" aria-label="Tendência visual"><polyline points={points} fill="none" pathLength="1" /></svg>;
}

function bookingSummaryText(item: any, fallbackBusinessName = 'AgendaPro') {
  return [
    'Agendamento AgendaPro',
    `Empresa: ${fallbackBusinessName}`,
    `Cliente: ${item?.customer_name || item?.name || 'Cliente'}`,
    `WhatsApp: ${item?.customer_phone || item?.phone || 'Não informado'}`,
    item?.customer_email ? `E-mail: ${item.customer_email}` : null,
    `Serviço: ${item?.service_name || 'Atendimento'}`,
    item?.professional_name ? `Profissional: ${item.professional_name}` : null,
    `Data: ${item?.requested_date || item?.date || 'Não informada'}`,
    `Horário: ${item?.requested_time || item?.time || 'Não informado'}`,
    `Status: ${bookingStatusLabel(item?.status)}`,
    item?.notes ? `Observação do cliente: ${item.notes}` : null,
    item?.internal_note ? `Observação interna: ${item.internal_note}` : null
  ].filter(Boolean).join('\n');
}

export function Home({ route = '/' }: { route?: string }) {
  usePageTitle(route);
  if (route.startsWith('/funcionalidades')) return <FeaturesPage />;
  if (route.startsWith('/para-quem')) return <SegmentsPage />;
  if (route.startsWith('/planos')) return <PlansPage />;
  if (route.startsWith('/privacidade')) return <PrivacyPage />;
  if (route.startsWith('/termos')) return <TermsPage />;
  if (route.startsWith('/cookies')) return <CookiesPage />;
  if (route.startsWith('/lgpd')) return <LGPDPage />;
  if (route.startsWith('/confianca')) return <TrustCenterPage />;
  if (route.startsWith('/403')) return <AccessDeniedPage />;
  if (route.startsWith('/404')) return <NotFoundPage />;
  if (route.startsWith('/dev')) return <DeveloperConsolePage />;
  if (route.startsWith('/agenda/')) return <AgendaPresentationPage route={route} />;
  if (route.startsWith('/conta')) return <AccountRouter route={route} />;
  if (route.startsWith('/checkout')) return <CheckoutPage route={route} />;
  if (route.startsWith('/pagamento')) return <PaymentReturnPage route={route} />;
  if (route.startsWith('/onboarding')) return <AgendaBuilderPage />;
  if (route.startsWith('/contratar/sucesso')) return <ContractSuccessPage />;
  if (route.startsWith('/contratar') || route.startsWith('/implantacao')) return <ContractPage />;
  if (route.startsWith('/demo')) return <DemoRedirectPage />;
  return route === '/' ? <CommercialHome /> : <NotFoundPage />;
}

function PublicShell({ children }: { children: ReactNode }) {
  return <div className="public-page"><Header /><main>{children}</main><Footer /><CookieConsent /><UtilityDock /></div>;
}

function AccessDeniedPage() {
  return <PublicShell>
    <section className="page-hero security-page">
      <Badge tone="red">403</Badge>
      <h1>Acesso negado.</h1>
      <p>Esta área é privada. Entre com a conta correta ou volte para sua central.</p>
      <div className="hero-actions" style={{ justifyContent: 'center' }}>
        <a className="btn primary" href="#/conta/login">Entrar</a>
        <a className="btn secondary" href="#/conta/painel">Minha conta</a>
      </div>
    </section>
  </PublicShell>;
}

function NotFoundPage() {
  return <PublicShell>
    <section className="page-hero security-page">
      <Badge tone="slate">404</Badge>
      <h1>Página não encontrada.</h1>
      <p>Essa rota não existe, foi movida ou não está disponível para seu acesso.</p>
      <div className="hero-actions" style={{ justifyContent: 'center' }}>
        <a className="btn primary" href="#/">Voltar ao início</a>
        <a className="btn secondary" href="#/conta">Minha conta</a>
      </div>
    </section>
  </PublicShell>;
}

function LegalHero({ tone, label, title, description, icon: Icon }: { tone: 'green' | 'blue' | 'slate' | 'red'; label: string; title: string; description: string; icon: ComponentType<{ size?: number }> }) {
  return <section className="page-hero legal-hero trust-legal-hero">
    <Badge tone={tone}>{label}</Badge>
    <div className="legal-hero-icon"><Icon size={30}/></div>
    <h1>{title}</h1>
    <p>{description}</p>
  </section>;
}

function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return <article>
    <h2>{title}</h2>
    <p>{children}</p>
  </article>;
}

function PrivacyPage() {
  return <PublicShell>
    <LegalHero tone="green" label="Privacidade" icon={ShieldCheck} title="Política de Privacidade do AgendaPro." description="Como tratamos dados de contas, empresas, agendas, pagamentos, suporte e solicitações de agendamento dentro da plataforma." />
    <section className="section legal-content legal-content-pro">
      <LegalSection title="Dados coletados">Podemos tratar nome, e-mail, WhatsApp, nome do negócio, endereço, plano escolhido, status de pagamento, dados de agenda, serviços, equipe, disponibilidade, solicitações de agendamento e registros técnicos necessários para segurança.</LegalSection>
      <LegalSection title="Finalidades">Os dados são usados para criar conta, autenticar acesso, configurar agendas, publicar páginas, registrar solicitações, processar pagamentos, prestar suporte, auditar ações administrativas e melhorar a operação do produto.</LegalSection>
      <LegalSection title="Bases legais">O tratamento pode ocorrer para execução de contrato, cumprimento de obrigação legal ou regulatória, legítimo interesse operacional e consentimento quando aplicável, especialmente em preferências de cookies e comunicações opcionais.</LegalSection>
      <LegalSection title="Compartilhamento">Dados podem ser processados por provedores necessários à operação, como Vercel, Supabase, Mercado Pago, Resend e serviços de mensageria quando configurados, sempre limitados ao necessário para funcionamento, segurança e suporte.</LegalSection>
      <LegalSection title="Pagamentos">Pagamentos são processados pelo Mercado Pago. O AgendaPro armazena status, referências, logs e dados necessários para liberar, bloquear, auditar ou revisar planos e pagamentos manuais.</LegalSection>
      <LegalSection title="Retenção">Os dados são mantidos pelo período necessário para operação da conta, suporte, auditoria, segurança, obrigações legais e histórico comercial. Solicitações de exclusão podem ser avaliadas conforme viabilidade técnica e obrigações aplicáveis.</LegalSection>
      <LegalSection title="Segurança">Utilizamos separação entre frontend e backend, variáveis sensíveis protegidas, APIs serverless, logs operacionais, políticas de acesso e práticas de minimização para reduzir exposição de dados.</LegalSection>
      <LegalSection title="Direitos do titular">O titular pode solicitar confirmação de tratamento, acesso, correção, atualização, portabilidade, anonimização, bloqueio, eliminação ou revisão de consentimentos pelo canal de contato do responsável.</LegalSection>
    </section>
  </PublicShell>;
}

function TermsPage() {
  return <PublicShell>
    <LegalHero tone="blue" label="Termos" icon={FileText} title="Termos de Uso do AgendaPro." description="Regras comerciais e operacionais para uso da plataforma, criação de agendas, pagamentos, suporte e publicação de páginas." />
    <section className="section legal-content legal-content-pro">
      <LegalSection title="Aceite dos termos">Ao criar conta, configurar uma agenda, contratar um plano ou usar o painel, o usuário declara que leu e aceita estas regras de uso.</LegalSection>
      <LegalSection title="Objeto da plataforma">O AgendaPro é uma plataforma digital para criação, publicação e gestão de agendas profissionais, incluindo serviços, profissionais, horários, solicitações, pagamentos e suporte operacional.</LegalSection>
      <LegalSection title="Responsabilidade do usuário">A empresa ou profissional é responsável pelas informações cadastradas, preços, disponibilidade, atendimento, cumprimento dos horários, relacionamento com clientes finais e veracidade dos dados publicados.</LegalSection>
      <LegalSection title="Uso permitido">O sistema deve ser usado para fins lícitos, profissionais e compatíveis com agendamento e gestão. É proibido tentar explorar falhas, burlar pagamentos, acessar dados de terceiros ou usar a plataforma para atividades ilegais.</LegalSection>
      <LegalSection title="Planos e acesso">Recursos pagos podem depender de plano ativo, pagamento aprovado, licença válida ou liberação manual. Contas pendentes, vencidas, suspensas ou canceladas podem ter funcionalidades bloqueadas.</LegalSection>
      <LegalSection title="Pagamentos e reembolsos">Pagamentos podem ocorrer por checkout Mercado Pago ou análise manual. Reembolsos, cancelamentos e ajustes devem respeitar o canal de atendimento, status da contratação e condições comerciais combinadas.</LegalSection>
      <LegalSection title="Disponibilidade">O AgendaPro busca manter operação estável, mas pode passar por manutenções, melhorias, instabilidades de provedores externos, indisponibilidade temporária ou alterações necessárias de segurança.</LegalSection>
      <LegalSection title="Limitação de responsabilidade">A plataforma organiza a operação, mas não garante resultados comerciais, comparecimento de clientes, faturamento, ausência de cancelamentos ou qualidade do atendimento prestado pela empresa cadastrada.</LegalSection>
      <LegalSection title="Propriedade intelectual">Código, identidade, telas, fluxos, documentação, estrutura, marca, layouts e recursos do AgendaPro são protegidos. Não é permitido copiar, revender, clonar ou criar produto concorrente sem autorização expressa.</LegalSection>
      <LegalSection title="Suspensão e encerramento">Contas podem ser suspensas ou encerradas por inadimplência, abuso, violação destes termos, risco de segurança, fraude, uso indevido ou solicitação do responsável.</LegalSection>
    </section>
  </PublicShell>;
}

function CookiesPage() {
  return <PublicShell>
    <LegalHero tone="slate" label="Cookies" icon={Cookie} title="Política de Cookies do AgendaPro." description="Como usamos dados locais, preferências e recursos técnicos para manter o site seguro, funcional e mais simples de usar." />
    <section className="section legal-content legal-content-pro">
      <LegalSection title="Cookies necessários">São usados para manter sessão, segurança, preferências essenciais, estado da interface e funcionamento básico. Esses recursos não devem ser desativados porque sustentam o uso do sistema.</LegalSection>
      <LegalSection title="Cookies funcionais">Podem guardar preferências visuais, consentimento de cookies, dados temporários de formulário e configurações que melhoram a experiência sem envolver recursos estritamente obrigatórios.</LegalSection>
      <LegalSection title="Cookies analíticos">Podem ser usados futuramente para entender uso, páginas acessadas, erros, desempenho e melhoria de produto. Quando não necessários, podem ser recusados pela central de preferências.</LegalSection>
      <LegalSection title="Terceiros">Provedores como Vercel, Supabase, Mercado Pago e Resend podem usar tecnologias próprias necessárias para hospedagem, autenticação, banco, pagamento, envio de e-mails e segurança.</LegalSection>
      <LegalSection title="Preferências">O usuário pode aceitar todos, rejeitar não necessários ou salvar uma configuração personalizada. A escolha fica registrada no navegador e pode ser alterada nesta página.</LegalSection>
      <LegalSection title="Dados locais">Além de cookies tradicionais, o site pode usar localStorage para sessão, preferências, rascunhos, estado do painel e melhoria de experiência. Dados sensíveis devem permanecer protegidos no backend.</LegalSection>
    </section>
    <CookiePreferencesPanel />
  </PublicShell>;
}

function LGPDPage() {
  return <PublicShell>
    <LegalHero tone="green" label="LGPD" icon={Scale} title="LGPD e Direitos do Titular." description="Central simples para explicar os direitos relacionados a dados pessoais tratados pelo AgendaPro." />
    <section className="section legal-content legal-content-pro">
      <LegalSection title="Confirmação e acesso">O titular pode solicitar confirmação sobre o tratamento de dados e acesso às informações relacionadas à sua conta, agenda ou solicitação.</LegalSection>
      <LegalSection title="Correção">É possível solicitar correção de dados incompletos, inexatos ou desatualizados, como nome, e-mail, WhatsApp, empresa, endereço ou dados públicos da agenda.</LegalSection>
      <LegalSection title="Anonimização, bloqueio ou eliminação">Quando aplicável, o titular pode solicitar anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade.</LegalSection>
      <LegalSection title="Portabilidade">Quando tecnicamente possível, dados estruturados podem ser fornecidos para portabilidade, respeitando segredos comerciais, segurança e limitações do sistema.</LegalSection>
      <LegalSection title="Revogação de consentimento">Preferências opcionais, como cookies não necessários e comunicações facultativas, podem ser revisadas ou revogadas sem afetar funcionalidades essenciais.</LegalSection>
      <LegalSection title="Como solicitar">Envie uma solicitação pelo canal oficial de suporte, informando nome, e-mail, empresa ou agenda relacionada. Podemos pedir validação de identidade para proteger os dados.</LegalSection>
    </section>
  </PublicShell>;
}

function TrustCenterPage() {
  return <PublicShell>
    <LegalHero tone="blue" label="Confiança" icon={BadgeCheck} title="Central de Confiança AgendaPro." description="Resumo executivo das práticas de segurança, privacidade, pagamentos e operação que sustentam o produto." />
    <section className="section trust-center-strip">
      <div><ShieldCheck size={22}/><strong>Dados protegidos</strong><span>Separação entre frontend, backend e segredos de produção.</span></div>
      <div><CreditCard size={22}/><strong>Pagamentos auditáveis</strong><span>Status, logs e revisão manual quando necessário.</span></div>
      <div><Database size={22}/><strong>Supabase estruturado</strong><span>SQL versionado, RLS e Service Role apenas no backend.</span></div>
      <div><FileText size={22}/><strong>Documentos legais</strong><span>Termos, Privacidade, Cookies e LGPD acessíveis.</span></div>
    </section>
    <section className="section legal-content legal-content-pro">
      <LegalSection title="Arquitetura segura">O AgendaPro evita expor chaves sensíveis no frontend. Operações críticas passam por APIs serverless e validação de sessão quando envolvem dados privados.</LegalSection>
      <LegalSection title="Auditoria operacional">Ações administrativas, pagamentos, keys e operações relevantes podem gerar logs para rastreabilidade e suporte.</LegalSection>
      <LegalSection title="Controle de acesso">Planos, status de conta e permissões determinam quais áreas podem ser usadas, reduzindo risco de operação indevida.</LegalSection>
      <LegalSection title="Transparência">Links legais ficam disponíveis no rodapé, no banner de cookies e nas páginas dedicadas para consulta simples.</LegalSection>
    </section>
  </PublicShell>;
}

type CookiePrefs = { necessary: true; functional: boolean; analytics: boolean; updatedAt: string };
const COOKIE_PREFS_KEY = 'agendapro-cookie-preferences';

function readCookiePrefs(): CookiePrefs | null {
  try {
    const raw = localStorage.getItem(COOKIE_PREFS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCookiePrefs(next: CookiePrefs) {
  localStorage.setItem(COOKIE_PREFS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('agendapro:cookie-preferences-changed'));
}

function CookieConsent() {
  const [prefs, setPrefs] = useState<CookiePrefs | null>(() => readCookiePrefs());
  const [customOpen, setCustomOpen] = useState(false);
  const [functional, setFunctional] = useState(true);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const sync = () => setPrefs(readCookiePrefs());
    window.addEventListener('agendapro:cookie-preferences-changed', sync);
    return () => window.removeEventListener('agendapro:cookie-preferences-changed', sync);
  }, []);

  if (prefs) return null;

  const persist = (next: Omit<CookiePrefs, 'necessary' | 'updatedAt'>) => saveCookiePrefs({ necessary: true, ...next, updatedAt: new Date().toISOString() });

  return <div className="cookie-consent" role="dialog" aria-label="Preferências de cookies">
    <div>
      <strong><Cookie size={17}/> Privacidade e cookies</strong>
      <p>Usamos recursos necessários para sessão e segurança. Você pode aceitar todos ou manter apenas o essencial.</p>
      <nav><a href="#/cookies">Política de Cookies</a><a href="#/privacidade">Privacidade</a><a href="#/lgpd">LGPD</a></nav>
      {customOpen && <div className="cookie-preferences-inline">
        <label><input type="checkbox" checked disabled/> Necessários <small>sempre ativos</small></label>
        <label><input type="checkbox" checked={functional} onChange={event => setFunctional(event.target.checked)}/> Funcionais</label>
        <label><input type="checkbox" checked={analytics} onChange={event => setAnalytics(event.target.checked)}/> Analíticos</label>
      </div>}
    </div>
    <div className="cookie-actions">
      <button type="button" onClick={() => persist({ functional: false, analytics: false })}>Rejeitar não necessários</button>
      <button type="button" onClick={() => setCustomOpen(!customOpen)}>{customOpen ? 'Fechar opções' : 'Configurar'}</button>
      {customOpen ? <button type="button" className="primary" onClick={() => persist({ functional, analytics })}>Salvar preferências</button> : <button type="button" className="primary" onClick={() => persist({ functional: true, analytics: true })}>Aceitar todos</button>}
    </div>
  </div>;
}

function CookiePreferencesPanel() {
  const [functional, setFunctional] = useState(() => readCookiePrefs()?.functional ?? true);
  const [analytics, setAnalytics] = useState(() => readCookiePrefs()?.analytics ?? false);
  const [saved, setSaved] = useState(false);
  const current = readCookiePrefs();

  const submit = () => {
    saveCookiePrefs({ necessary: true, functional, analytics, updatedAt: new Date().toISOString() });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2800);
  };

  return <section className="section cookie-center-panel">
    <div>
      <span>Central de preferências</span>
      <h2>Controle seus cookies não essenciais.</h2>
      <p>Cookies necessários permanecem ativos para manter login, segurança e funcionamento básico. Os demais podem ser ajustados abaixo.</p>
      {current?.updatedAt && <small>Última atualização: {new Date(current.updatedAt).toLocaleString('pt-BR')}</small>}
    </div>
    <div className="cookie-toggle-list">
      <label><input type="checkbox" checked disabled/> <strong>Necessários</strong><small>Login, segurança, sessão e preferências essenciais.</small></label>
      <label><input type="checkbox" checked={functional} onChange={event => setFunctional(event.target.checked)}/> <strong>Funcionais</strong><small>Preferências e melhoria de experiência.</small></label>
      <label><input type="checkbox" checked={analytics} onChange={event => setAnalytics(event.target.checked)}/> <strong>Analíticos</strong><small>Medição futura de uso, erros e performance.</small></label>
      <button type="button" className="btn primary" onClick={submit}>{saved ? 'Preferências salvas' : 'Salvar preferências'}</button>
    </div>
  </section>;
}


function UtilityDock() {
  const goTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  return <div className="utility-dock clean-dock" aria-label="Atalhos rápidos">
    <a href="#/conta"><ShieldCheck size={17}/><span>Conta</span></a>
    <a href="#/planos"><Rocket size={17}/><span>Planos</span></a>
    <button type="button" onClick={goTop}><ArrowRight size={17}/><span>Topo</span></button>
  </div>;
}

function CommercialHome() {
  const { dataSource, syncStatus } = useApp();
  return <PublicShell>
    <section className="hero commercial-hero commercial-hero-clean premium-hero">
      <motion.div {...fade} className="hero-copy">
        <span className="eyebrow"><ShieldCheck size={16} /> SaaS executivo para negócios com horário marcado</span>
        <h1>Agenda online profissional para negócios que vivem de horários marcados.</h1>
        <p>O AgendaPro centraliza agendamentos, clientes, serviços, equipe, comunicação, pagamentos e página pública em uma experiência simples para pessoas leigas e profissional para empresas em crescimento.</p>
        <div className="hero-actions">
          <a className="btn primary" href={demoExternalUrl} target="_blank" rel="noopener noreferrer">Ver demonstração <ArrowRight size={18} /></a>
          <a className="btn secondary" href="#/contratar">Contratar AgendaPro</a>
          <a className="btn secondary" href={demoExternalUrl} target="_blank" rel="noopener noreferrer">Testar demo externa</a>
        </div>
        <div className="trust-row">
          <span><CheckCircle2 /> Configuração guiada</span>
          <span><CheckCircle2 /> Pagamento seguro</span>
          <span><CheckCircle2 /> Página pública</span>
        </div>
        <div className="sync-pill"><Database size={15} /> {dataSource === 'supabase' ? 'Supabase conectado' : 'Site principal ativo'} <small>{syncStatus}</small></div>
      </motion.div>
    </section>

    <SaaSFlowBand />

    <section className="problem commercial-problem">
      <motion.div {...fade}>
        <h2>O cliente conhece, contrata, paga e cria a própria agenda.</h2>
        <p>Depois do pagamento aprovado ou ativação de key, o painel do cliente libera o criador real de AgendaPro: negócio, serviços, equipe, horários, regras, tema e publicação do link.</p>
      </motion.div>
    </section>

    <section className="section" id="features">
      <div className="section-title"><span>Funcionalidades</span><h2>Completo por trás. Simples para quem usa.</h2></div>
      <FeatureGrid limit={8} />
    </section>

    <section className="section guided-flow">
      <div className="section-title"><span>Fluxo do cliente</span><h2>Do pagamento ao link público de agendamento.</h2></div>
      <FlowRows />
    </section>

    <section className="section split">
      <div>
        <span className="label">Criador de AgendaPro</span>
        <h2>O cliente cria a própria agenda depois que o acesso é liberado.</h2>
        <p>O painel guia a configuração do negócio, identidade visual, serviços, equipe, horários, regras e página pública.</p>
      </div>
      <div className="onboarding-options">
        <article><Wand2 /><h3>Modo guiado</h3><p>Etapas claras para publicar a agenda sem depender de conhecimento técnico.</p></article>
        <article><Palette /><h3>Personalização</h3><p>Logo, capa, cores, textos e seções da página pública.</p></article>
      </div>
    </section>

    <section className="section demo-preview">
      <div>
        <span className="eyebrow"><BadgeCheck size={16} /> Demonstração aplicada</span>
        <h2>Veja uma demonstração externa do AgendaPro.</h2>
        <p>A demo completa fica em outro deploy, com dados fictícios isolados do ambiente principal.</p>
      </div>
      <div className="demo-actions">
        <a className="btn primary" href={demoExternalUrl} target="_blank" rel="noopener noreferrer">Abrir demo externa</a>
        <a className="btn secondary" href={demoExternalUrl} target="_blank" rel="noopener noreferrer">Ver página demo</a>
        <a className="btn secondary" href="#/conta">Minha conta</a>
      </div>
    </section>

    <section className="section pricing" id="pricing"><PlanCards compact /></section>
  </PublicShell>;
}

function SaaSFlowBand() {
  const items = [
    ['01', 'Conta criada', 'Cliente, negócio, plano e senha vinculados.'],
    ['02', 'Plano liberado', 'Pagamento aprovado, key ativa ou confirmação manual.'],
    ['03', 'Criador habilitado', 'Serviços, equipe, horários e identidade visual.'],
    ['04', 'Agenda publicada', 'Página própria pronta para receber agendamentos.']
  ];

  return <section className="saas-flow-band" aria-label="Fluxo do AgendaPro">
    <div className="saas-flow-head">
      <span className="eyebrow"><Sparkles size={15}/> Fluxo real do SaaS</span>
      <p>Da contratação à agenda publicada, tudo acontece em uma jornada clara e guiada.</p>
    </div>
    <div className="saas-flow-items">
      {items.map(([number, title, description]) => <article key={number}>
        <b>{number}</b>
        <div><strong>{title}</strong><span>{description}</span></div>
      </article>)}
    </div>
  </section>;
}

function FlowRows() {
  const rows = [
    ['Dono contrata', 'Escolhe o plano, cria conta, decide se quer implantação assistida e segue para um pagamento vinculado ao cadastro.'],
    ['Acesso é liberado', 'Pagamento aprovado, key promocional ativa ou pagamento manual confirmado pelo desenvolvedor.'],
    ['Cria a agenda', 'Configura negócio, marca, equipe, serviços, horários, regras de atendimento e página pública.'],
    ['Publica o link', 'Recebe uma página pública exclusiva por slug para compartilhar no WhatsApp, Instagram ou QR Code.'],
    ['Cliente final agenda', 'Escolhe serviço, horário, informa contato e envia a solicitação sem depender de conversa manual.']
  ];
  const [open, setOpen] = useState(0);
  return <div className="flow-accordion-v3">{rows.map(([title, description], index) => {
    const active = open === index;
    return <article key={title} className={active ? 'active' : ''}>
      <button type="button" onClick={() => setOpen(active ? -1 : index)}>
        <b>{String(index + 1).padStart(2, '0')}</b>
        <div>
          <strong>{title}</strong>
          {active && <p>{description}</p>}
        </div>
        <ChevronDown size={18} className={active ? 'rotated' : ''} />
      </button>
    </article>;
  })}</div>;
}

function FeatureGrid({ limit }: { limit?: number }) {
  const list = limit ? features.slice(0, limit) : features;
  return <div className="feature-grid">{list.map(([title, description, Icon]) => <motion.article {...fade} className="feature-card" key={title}>
    <div><Icon /></div><h3>{title}</h3><p>{description}</p>
  </motion.article>)}</div>;
}

function FeaturesPage() {
  return <PublicShell>
    <section className="page-hero"><Badge tone="blue">Funcionalidades</Badge><h1>Tudo que um negócio precisa para organizar atendimentos.</h1><p>Agenda, clientes, equipe, mensagens, automações, relatórios, pagamentos, permissões e página pública personalizável.</p></section>
    <section className="section"><FeatureGrid /></section>
  </PublicShell>;
}

function SegmentsPage() {
  return <PublicShell>
    <section className="page-hero"><Badge tone="green">Para quem é</Badge><h1>Adaptável para qualquer operação com horário marcado.</h1><p>A linguagem do sistema é simples: serviços, clientes, equipe, horários e confirmações.</p></section>
    <section className="section"><div className="segment-cards">{segments.map(([title, description]) => <article key={title}><Building2 /><h3>{title}</h3><p>{description}</p><a href={demoExternalUrl} target="_blank" rel="noopener noreferrer">Ver exemplo</a></article>)}</div></section>
    <section className="section universal-segment"><div><Badge tone="green">Não encontrou seu segmento?</Badge><h2>Se o seu negócio depende de horários, reservas, atendimentos ou agenda, o AgendaPro também serve para você.</h2><p>Clínicas, barbearias e salões são exemplos. A estrutura se adapta a qualquer operação que precise organizar atendimento com data, hora, cliente, equipe e confirmação.</p></div><a className="btn primary" href="#/conta/cadastro">Adaptar para meu negócio</a></section>
  </PublicShell>;
}

function PlansPage() {
  return <PublicShell>
    <section className="page-hero"><Badge tone="blue">Planos</Badge><h1>Comece simples e evolua conforme o negócio cresce.</h1><p>Todos os planos podem receber implantação assistida como adicional opcional.</p></section>
    <section className="section pricing"><PlanCards /></section>
  </PublicShell>;
}

function PlanCards({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? 'plan-grid-v3 compact' : 'plan-grid-v3'}>{plans.map(plan => <article key={plan.id} className={plan.highlighted ? 'highlighted' : ''}>
    {plan.highlighted && <span className="plan-badge-v3">Mais escolhido</span>}
    <div className="plan-head-v3">
      <h3>{plan.name}</h3>
      <p>{plan.description}</p>
    </div>
    <strong className="plan-price-v3">{currency(plan.price)}<small>/mês</small></strong>
    <ul>{plan.features.map(feature => <li key={feature}><CheckCircle2 size={16} />{feature}</li>)}</ul>
    <a className="btn primary full" href={`#/checkout/${plan.id}`}>Contratar {plan.name}</a>
  </article>)}</div>;
}

function DemoRedirectPage() {
  return <PublicShell>
    <section className="page-hero"><Badge tone="purple">Demo externa</Badge><h1>A demonstração agora fica fora do site principal.</h1><p>O AgendaPro principal permanece como ambiente real de produção. A demo deve rodar em outro repositório, outro deploy e outro ambiente para não misturar dados fictícios com dados reais.</p><div className="hero-actions" style={{ justifyContent: 'center' }}><a className="btn primary" href={demoExternalUrl} target="_blank" rel="noopener noreferrer">Abrir demonstração externa</a><a className="btn secondary" href="#/planos">Voltar aos planos</a></div></section>
  </PublicShell>;
}

function ContractPage() {
  const { pushToast } = useApp();
  const [briefing, setBriefing] = useState({ businessName: '', fullName: '', email: '', whatsapp: '', segment: 'Clínica', planId: 'professional', message: '' });
  const [sending, setSending] = useState(false);
  const updateBriefing = (field: keyof typeof briefing, value: string) => setBriefing(current => ({ ...current, [field]: value }));
  const submitBriefing = async () => {
    if (!briefing.businessName || !briefing.email || !briefing.whatsapp) {
      pushToast({ tone: 'warning', title: 'Dados obrigatórios', message: 'Informe negócio, e-mail e WhatsApp.' });
      return;
    }
    setSending(true);
    try {
      const response = await fetch('/api/public?action=create-briefing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...briefing, wantsImplementation: true, source: 'contract_page' }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) throw new Error(data?.message || 'Não foi possível enviar o briefing.');
      pushToast({ tone: 'success', title: 'Briefing recebido', message: 'A solicitação apareceu no painel do desenvolvedor.' });
      setBriefing(current => ({ ...current, message: '' }));
    } catch (error) {
      pushToast({ tone: 'warning', title: 'Briefing não enviado', message: friendlyErrorMessage(error, 'Nao foi possivel enviar agora. Tente novamente em instantes.', 'public') });
    } finally {
      setSending(false);
    }
  };

  return <PublicShell>
    <section className="page-hero"><Badge tone="amber">Contratar</Badge><h1>Escolha o plano e decida se quer implantação assistida.</h1><p>O fluxo correto é: criar conta, escolher plano, marcar implantação opcional e pagar tudo vinculado ao mesmo cadastro.</p></section>
    <section className="section contract-flow-grid refined-contract">
      <article className="contract-route-card featured-route"><MousePointerClick /><span className="eyebrow">Configuração guiada</span><h2>Quero configurar sozinho</h2><p>Ideal para pagar e seguir o criador de AgendaPro para cadastrar negócio, equipe, serviços, horários e página pública.</p><div className="route-steps"><span>1. Criar conta</span><span>2. Pagar plano</span><span>3. Criar agenda</span></div><a className="btn primary full" href="#/conta/cadastro">Criar conta e escolher plano</a></article>
      <article className="contract-route-card implementation-addon-card"><Rocket /><span className="eyebrow">Adicional opcional</span><h2>Implantação assistida por R$ 100</h2><p>Para quem prefere receber serviços, profissionais, horários, página pública e configurações iniciais prontos.</p><div className="route-steps"><span>1. Marcar implantação</span><span>2. Enviar briefing</span><span>3. Receber em 24h a 48h*</span></div><a className="btn primary full" href="#/checkout/professional?implantacao=sim">Contratar com implantação</a><a className="btn secondary full" href="#briefing-rapido">Enviar briefing rápido</a><small>*Após briefing completo, caso não haja imprevistos.</small></article>
    </section>
    <section className="section split briefing-section" id="briefing-rapido">
      <div><Badge tone="blue">Briefing rápido</Badge><h2>Solicitação salva para o painel do desenvolvedor.</h2><p>Use para pedir implantação assistida ou tirar dúvidas antes de finalizar a contratação.</p><div className="payment-note"><LifeBuoy /><div><b>Implantação assistida — 24h a 48h</b><span>Prazo estimado após pagamento e recebimento completo do briefing, caso não haja imprevistos.</span></div></div></div>
      <form className="lead-form" onSubmit={(e) => { e.preventDefault(); submitBriefing(); }}><h3>Enviar briefing rápido</h3><input className="field" value={briefing.businessName} onChange={event => updateBriefing('businessName', event.target.value)} placeholder="Nome do negócio" /><input className="field" value={briefing.fullName} onChange={event => updateBriefing('fullName', event.target.value)} placeholder="Seu nome" /><input className="field" value={briefing.email} onChange={event => updateBriefing('email', event.target.value)} placeholder="E-mail" type="email" /><input className="field" value={briefing.whatsapp} onChange={event => updateBriefing('whatsapp', event.target.value)} placeholder="WhatsApp" /><select className="field" value={briefing.segment} onChange={event => updateBriefing('segment', event.target.value)}><option>Clínica</option><option>Barbearia</option><option>Estética</option><option>Consultoria</option><option>Outro</option></select><textarea className="field" value={briefing.message} onChange={event => updateBriefing('message', event.target.value)} placeholder="O que você precisa configurar?" /><button className="btn primary full" type="submit" disabled={sending}>{sending ? 'Enviando...' : 'Enviar briefing'}</button></form>
    </section>
  </PublicShell>;
}

function AccountRouter({ route }: { route: string }) {
  if (route.startsWith('/conta/cadastro')) return <AccountRegisterPage />;
  if (route.startsWith('/conta/login')) return <AccountLoginPage />;
  if (route.startsWith('/conta/criar-agenda')) return <AgendaBuilderPage />;
  if (route.startsWith('/conta/agenda/') && route.includes('/dashboard')) return <PrivateAgendaDashboardPage route={route} />;
  if (route.startsWith('/conta/dashboard')) return <AccountDashboardBridge />;
  if (route.startsWith('/conta/painel')) return <ClientPortalPage />;
  if (route.startsWith('/conta/planos')) return <ClientPortalPage initialTab="plans" />;
  if (route.startsWith('/conta/pagamentos')) return <ClientPortalPage initialTab="payments" />;
  if (route.startsWith('/conta/configuracao')) return <ClientPortalPage initialTab="settings" />;
  return <AccountEntryPage />;
}

function AccountEntryPage() {
  const account = getStoredClient();
  return <PublicShell>
    <section className="page-hero account-clean-hero"><Badge tone="blue">Conta do cliente</Badge><h1>Entre, crie sua conta ou continue sua AgendaPro.</h1><p>Depois do pagamento aprovado ou key ativa, o painel libera o criador real da agenda.</p><div className="hero-actions" style={{ justifyContent: 'center' }}><a className="btn primary" href="#/conta/cadastro">Criar conta</a><a className="btn secondary" href="#/conta/login">Entrar</a>{account && <a className="btn secondary" href="#/conta/painel">Continuar painel</a>}</div></section>
    <section className="section account-entry-grid"><article><UserPlus /><h2>Criar conta</h2><p>Nome, e-mail, WhatsApp, negócio, plano e senha para vincular pagamento e licença.</p><a className="btn primary full" href="#/conta/cadastro">Começar</a></article><article><LogIn /><h2>Entrar</h2><p>Acesse a central do cliente para ver plano, pagamento, key, agenda e configurações.</p><a className="btn secondary full" href="#/conta/login">Entrar na conta</a></article><article><KeyRound /><h2>Ativar key</h2><p>Recebeu uma licença de teste? Entre no painel e ative para liberar o criador da agenda.</p><a className="btn secondary full" href="#/conta/painel">Ativar no painel</a></article></section>
  </PublicShell>;
}

function AccountRegisterPage() {
  const { pushToast } = useApp();
  const [form, setForm] = useState({ fullName: '', email: '', whatsapp: '', businessName: '', planId: 'professional', password: '' });
  const [loading, setLoading] = useState(false);
  const plan = plans.find(item => item.id === form.planId) || plans[1];
  const valid = form.fullName.length > 2 && /.+@.+\..+/.test(form.email) && form.whatsapp.replace(/\D/g, '').length >= 10 && form.businessName.length > 1 && form.password.length >= 6;
  const update = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }));
  const submit = async () => {
    if (!valid) {
      pushToast({ tone: 'warning', title: 'Complete o cadastro', message: 'Preencha nome, e-mail, WhatsApp, negócio e senha.' });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth?action=register-account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, planId: plan.id }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.token) throw new Error(data?.message || 'Não foi possível criar sua conta com segurança.');
      const account: ClientAccount = { fullName: form.fullName, email: form.email.toLowerCase(), whatsapp: form.whatsapp, businessName: form.businessName, planId: plan.id, planName: plan.name, paymentStatus: 'pending', subscriptionStatus: 'pending', implementationStatus: 'not_hired', agendaStatus: 'not_created', publicSlug: data.publicSlug || data.company?.slug || slugify(form.businessName), createdAt: new Date().toISOString() };
      saveClientToken(data.token);
      saveStoredClient(account);
      localStorage.setItem('agendapro-client-session', JSON.stringify({ email: account.email, loggedAt: new Date().toISOString() }));
      pushToast({ tone: 'success', title: 'Conta criada', message: 'Agora o pagamento e a agenda ficam vinculados a esta conta.' });
      window.location.hash = `#/checkout/${plan.id}`;
    } catch (error) {
      pushToast({ tone: 'warning', title: 'Cadastro não concluído', message: friendlyErrorMessage(error, 'Nao foi possivel criar a conta agora. Tente novamente em instantes.', 'client') });
    } finally {
      setLoading(false);
    }
  };
  return <PublicShell>
    <section className="page-hero"><Badge tone="blue">Criar conta</Badge><h1>Cadastre o cliente antes de pagar.</h1><p>Assim o pagamento, a key e o criador de agenda ficam vinculados à conta correta.</p></section>
    <section className="section account-form-shell"><article className="account-card wide"><span className="eyebrow"><UserPlus size={16}/> Cadastro do contratante</span><div className="checkout-form-grid"><label><span>Nome completo</span><input value={form.fullName} onChange={e => update('fullName', e.target.value)} placeholder="Nome do contratante" /></label><label><span>E-mail</span><input value={form.email} onChange={e => update('email', e.target.value)} placeholder="cliente@email.com" /></label><label><span>WhatsApp</span><input value={form.whatsapp} onChange={e => update('whatsapp', e.target.value)} placeholder="(35) 99999-9999" /></label><label><span>Nome do negócio</span><input value={form.businessName} onChange={e => update('businessName', e.target.value)} placeholder="Barbearia Prime" /></label><label><span>Plano escolhido</span><select value={form.planId} onChange={e => update('planId', e.target.value)}>{plans.map(item => <option key={item.id} value={item.id}>{item.name} — {currency(item.price)}/mês</option>)}</select></label><label><span>Senha</span><input type="password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="Mínimo 6 caracteres" /></label></div><button className="btn primary full" type="button" disabled={!valid || loading} onClick={submit}>{loading ? 'Criando...' : 'Criar conta e ir ao pagamento'}</button><a className="btn secondary full" href="#/conta/login">Já tenho conta</a></article></section>
  </PublicShell>;
}

function AccountLoginPage() {
  const { pushToast } = useApp();
  const [email, setEmail] = useState(getStoredClient()?.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = async () => {
    if (!email || !password) {
      pushToast({ tone: 'warning', title: 'Informe e-mail e senha', message: 'Use os dados cadastrados para entrar.' });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth?action=client-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.token || !data?.account) throw new Error(data?.message || 'Conta não encontrada.');
      const account: ClientAccount = {
        fullName: data.account.full_name || data.account.fullName || email,
        email: data.account.email || email,
        whatsapp: data.account.whatsapp || '',
        businessName: data.company?.name || data.account.metadata?.business_name || 'Minha AgendaPro',
        planId: data.company?.current_plan_id || 'professional',
        planName: plans.find(item => item.id === (data.company?.current_plan_id || 'professional'))?.name || 'Profissional',
        paymentStatus: ['active', 'trial'].includes(String(data.company?.subscription_status || data.account.status).toLowerCase()) ? 'approved' : 'pending',
        subscriptionStatus: String(data.company?.subscription_status || data.account.status).toLowerCase() === 'active' ? 'active' : String(data.company?.subscription_status || data.account.status).toLowerCase() === 'trial' ? 'trial' : 'pending',
        expiresAt: data.company?.plan_expires_at || data.account.metadata?.expires_at || undefined,
        implementationStatus: 'not_hired',
        agendaStatus: data.company?.onboarding_status === 'published' ? 'published' : 'not_created',
        publicSlug: data.company?.public_slug || data.company?.slug || undefined,
        createdAt: data.account.created_at
      };
      saveClientToken(data.token);
      saveStoredClient(account);
      localStorage.setItem('agendapro-client-session', JSON.stringify({ email: account.email, loggedAt: new Date().toISOString() }));
      pushToast({ tone: 'success', title: 'Login realizado', message: 'Abrindo central do cliente.' });
      window.location.hash = '#/conta/painel';
    } catch (error) {
      pushToast({ tone: 'warning', title: 'Não foi possível entrar', message: friendlyErrorMessage(error, 'Confira e-mail e senha.', 'client') });
    } finally {
      setLoading(false);
    }
  };
  return <PublicShell>
    <section className="page-hero"><Badge tone="blue">Entrar</Badge><h1>Acesse sua Central do Cliente.</h1><p>Veja plano, pagamentos, key, implantação e criação da sua agenda.</p></section>
    <section className="section account-form-shell"><article className="account-card login-card"><span className="eyebrow"><LogIn size={16}/> Acesso do cliente</span><label><span>E-mail</span><input className="field" value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@email.com" /></label><label><span>Senha</span><input className="field" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha" /></label><button className="btn primary full" onClick={login} disabled={loading}>{loading ? 'Entrando...' : 'Entrar no painel'}</button><a className="btn secondary full" href="#/conta/cadastro">Criar conta</a></article></section>
  </PublicShell>;
}

function ClientShell({ children, active = 'summary', setActive }: { children: ReactNode; active?: string; setActive?: (tab: string) => void }) {
  const account = getStoredClient();
  const go = (tab: string) => setActive ? setActive(tab) : window.location.hash = tab === 'summary' ? '#/conta/painel' : `#/conta/${tab}`;
  const logout = () => { clearClientAuth(); window.location.hash = '#/conta/login'; };
  const tabs = [['summary', 'Resumo'], ['plans', 'Planos'], ['payments', 'Pagamentos'], ['license', 'Licença / Key'], ['agenda', 'Criar agenda'], ['settings', 'Configurações']];
  return <section className="client-console client-console-premium"><aside className="client-sidebar"><b>Central do Cliente</b><span>{account?.fullName || 'AgendaPro'}</span>{tabs.map(([id, label]) => <button key={id} type="button" onClick={() => go(id)} className={active === id ? 'active' : ''}>{label}</button>)}<button type="button" onClick={logout}>Sair</button></aside><main className="client-main">{children}</main></section>;
}


function PrivateAgendaDashboardPage({ route }: { route: string }) {
  const { pushToast } = useApp();
  const parts = route.split('/').filter(Boolean);
  const slug = parts[2] || getStoredAgenda()?.slug || getStoredClient()?.publicSlug || 'minha-agenda';
  const account = getStoredClient();
  const agenda = getStoredAgenda();
  const [remote, setRemote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [section, setSection] = useState('Início');
  const [query, setQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [bookingActionLoading, setBookingActionLoading] = useState('');
  const [communicationLoading, setCommunicationLoading] = useState('');
  const [activeTemplateKey, setActiveTemplateKey] = useState<BookingTemplateKey>('confirmation');
  const [messageTemplateDrafts, setMessageTemplateDrafts] = useState<Record<string, string>>(() => loadMessageTemplateDrafts(slug));
  const ownsLocal = Boolean(account && (account.publicSlug === slug || agenda?.slug === slug));

  const loadDashboard = async (silent = false) => {
    if (!getClientToken()) return;
    if (!silent) setLoading(true);
    try {
      const response = await fetch(`/api/client?action=agenda-dashboard&slug=${encodeURIComponent(slug)}`, { headers: { ...authHeaders() } });
      const raw = await response.text();
      let data: any = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch { data = {}; }
      if (!response.ok || !data?.ok) throw new Error(data?.message || raw || 'Acesso negado.');
      setRemote(data.agenda);
      const nextAppointments = Array.isArray(data.appointments) ? data.appointments : [];
      setAppointments(nextAppointments);
      setSelectedBooking((current: any | null) => current ? nextAppointments.find((item: any) => item.id === current.id) || current : current);
      const normalizedRemote = normalizePublicAgenda(data.agenda);
      if (normalizedRemote) {
        saveStoredAgenda(normalizedRemote);
        const currentAccount = getStoredClient();
        if (currentAccount) saveStoredClient({ ...currentAccount, agendaStatus: 'published', publicSlug: normalizedRemote.slug, publicLink: `${window.location.origin}${window.location.pathname}#/agendar/${normalizedRemote.slug}`, businessName: normalizedRemote.business.name || currentAccount.businessName, whatsapp: normalizedRemote.business.whatsapp || currentAccount.whatsapp });
      }
      if (silent) pushToast({ tone: 'success', title: 'Dados sincronizados', message: 'Agendamentos atualizados com o Supabase.' });
    } catch (error) {
      const message = friendlyErrorMessage(error, 'Voce nao tem permissao para esta agenda.', 'client');
      if (!ownsLocal || silent) pushToast({ tone: 'warning', title: 'Não foi possível carregar', message });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(false);
  }, [slug]);
  useEffect(() => {
    setMessageTemplateDrafts(loadMessageTemplateDrafts(slug));
    setActiveTemplateKey('confirmation');
  }, [slug]);
  useEffect(() => {
    try {
      localStorage.setItem(messageTemplateStorageKey(slug), JSON.stringify(messageTemplateDrafts));
    } catch {}
  }, [slug, JSON.stringify(messageTemplateDrafts)]);

  if (!getClientToken() || !account) return <PublicShell><section className="page-hero"><Badge tone="amber">Área protegida</Badge><h1>Faça login para gerenciar esta agenda.</h1><p>Dashboards privados não podem ser acessados apenas pelo link.</p><div className="hero-actions" style={{ justifyContent: 'center' }}><a className="btn primary" href="#/conta/login">Entrar</a><a className="btn secondary" href="#/conta/cadastro">Criar conta</a></div></section></PublicShell>;
  if (!ownsLocal && !remote) return <ClientShell active="agenda"><article className="client-panel-card"><Badge tone="red">Acesso negado</Badge><h2>Você não tem permissão para acessar esta agenda.</h2><p>Entre com a conta dona da agenda ou volte para a sua central.</p><a className="btn primary full" href="#/conta/painel">Voltar ao meu painel</a></article></ClientShell>;

  const sourceAgenda = remote || agenda || {};
  const businessName = sourceAgenda?.business_name || sourceAgenda?.business?.name || account.businessName || 'Minha agenda';
  const businessWhatsapp = sourceAgenda?.business?.whatsapp || sourceAgenda?.whatsapp || account.whatsapp || '';
  const businessAddress = sourceAgenda?.business?.address || sourceAgenda?.address || 'Endereço não informado';
  const businessSegment = sourceAgenda?.business?.segment || sourceAgenda?.segment || 'Serviços com horário marcado';
  const businessDescription = sourceAgenda?.business?.description || sourceAgenda?.description || 'Agenda online configurada para receber solicitações, organizar atendimentos e facilitar a comunicação com clientes.';
  const services = Array.isArray(sourceAgenda?.services) ? sourceAgenda.services : Array.isArray(agenda?.services) ? agenda.services : [];
  const team = Array.isArray(sourceAgenda?.team) ? sourceAgenda.team : Array.isArray(agenda?.team) ? agenda.team : [];
  const schedule = sourceAgenda?.schedule || agenda?.schedule || { weekdays: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'], start: '08:00', end: '18:00', break: '12:00 às 13:00' };
  const rules = sourceAgenda?.rules || agenda?.rules || { cancellation: 'Cancelamentos com até 24h de antecedência.', minNotice: '2h', confirmation: 'Confirmação manual pelo WhatsApp.' };
  const scheduleConfig = normalizeScheduleConfig(pickScheduleConfig(sourceAgenda?.schedule_config, sourceAgenda?.scheduleConfig, sourceAgenda?.raw_payload?.scheduleConfig, agenda?.scheduleConfig), sourceAgenda?.hours || agenda?.hours, rules);
  const [localScheduleConfig, setLocalScheduleConfig] = useState<ScheduleConfig>(scheduleConfig);
  useEffect(() => { setLocalScheduleConfig(scheduleConfig); }, [JSON.stringify(scheduleConfig)]);
  const [statusFilter, setStatusFilter] = useState('todos');
  const [clientStatusFilter, setClientStatusFilter] = useState<'all' | 'new' | 'active' | 'recurring' | 'vip' | 'no_return' | 'inactive'>('all');
  const [clientTagFilter, setClientTagFilter] = useState('all');
  const [reportPeriod, setReportPeriod] = useState<'today' | '7d' | '30d' | 'month' | 'previous' | 'all'>('30d');
  const [reportServiceFilter, setReportServiceFilter] = useState('all');
  const [reportProfessionalFilter, setReportProfessionalFilter] = useState('all');
  const [reportStatusFilter, setReportStatusFilter] = useState('all');
  const [localServices, setLocalServices] = useState<any[]>(services);
  const [localTeam, setLocalTeam] = useState<any[]>(team);
  useEffect(() => { setLocalServices(services); }, [JSON.stringify(services)]);
  useEffect(() => { setLocalTeam(team); }, [JSON.stringify(team)]);
  const published = sourceAgenda?.published_at || agenda?.publishedAt || account.agendaStatus === 'published';
  const presentationLink = `${window.location.origin}${window.location.pathname}#/agenda/${slug}`;
  const bookingLink = `${window.location.origin}${window.location.pathname}#/agendar/${slug}`;
  const publicUrlShort = `${window.location.host}/#/agendar/${slug}`;
  const cleanStatus = (status: string) => bookingStatusKey(status);
  const pending = appointments.filter(item => cleanStatus(item.status) === 'pending');
  const confirmed = appointments.filter(item => cleanStatus(item.status) === 'confirmed');
  const cancelled = appointments.filter(item => cleanStatus(item.status) === 'cancelled');
  const completed = appointments.filter(item => cleanStatus(item.status) === 'completed');
  const rescheduled = appointments.filter(item => cleanStatus(item.status) === 'rescheduled');
  const refused = appointments.filter(item => cleanStatus(item.status) === 'refused');
  const absent = appointments.filter(item => cleanStatus(item.status) === 'absent');
  const todayKey = dateKey();
  const liveSlots = generateSlotsForDate({ date: todayKey, serviceDuration: serviceDurationMinutes(services?.[0] || {}), appointments, scheduleConfig: localScheduleConfig });
  const freeToday = liveSlots.filter(slot => slot.available).length;
  const busyToday = liveSlots.filter(slot => !slot.available).length;
  const baseServicePrice = Number(services?.[0]?.price || 0);
  const revenue = appointments.filter(item => !['cancelled','cancelado'].includes(cleanStatus(item.status))).reduce((sum, item) => sum + Number(item.value || item.price || baseServicePrice || 0), 0);
  const clients = Array.from(new Map(appointments.map((item, index) => [item.customer_phone || item.phone || item.customer_email || item.customer_name || `cliente-${index}`, item])).values());
  const healthScore = Math.min(98, Math.max(58, Math.round(74 + confirmed.length * 4 + completed.length * 3 - pending.length * 2 - cancelled.length * 5)));
  const occupation = Math.min(96, Math.max(8, Math.round(((appointments.length || 1) / Math.max((services.length || 1) * 6, 6)) * 100)));
  const conversion = Math.min(94, Math.max(12, Math.round(((confirmed.length + completed.length) / Math.max(appointments.length, 1)) * 100)));
  const todayAppointments = appointments.filter(item => (item.requested_date || item.date) === todayKey);
  const filteredAppointments = appointments.filter(item => {
    const byStatus = statusFilter === 'todos' || cleanStatus(item.status) === statusFilter;
    if (!byStatus) return false;
    if (!query.trim()) return true;
    const haystack = `${item.customer_name || item.name || ''} ${item.customer_phone || item.phone || ''} ${item.customer_email || ''} ${item.service_name || ''} ${item.professional_name || ''} ${item.requested_date || ''} ${item.requested_time || ''} ${item.status || ''}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });
  const copy = async (link: string) => { await navigator.clipboard?.writeText(link); pushToast({ tone: 'success', title: 'Link copiado', message: 'Link público copiado.' }); };
  const updateAppointmentStatus = async (id: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rescheduled' | 'refused' | 'absent', options: { date?: string; time?: string; internalNote?: string; cancellationReason?: string; rescheduleReason?: string; clientTags?: string[]; crmEvent?: any; confirm?: boolean; successMessage?: string } = {}) => {
    if (!id) return pushToast({ tone: 'warning', title: 'Solicitação sem ID', message: 'Este item não pode ser atualizado porque ainda não veio do banco.' });
    const confirmationMap: Record<string, string> = {
      confirmed: 'Confirmar este agendamento?', cancelled: 'Tem certeza que deseja cancelar este agendamento?', refused: 'Tem certeza que deseja recusar este agendamento?', completed: 'Marcar este atendimento como concluído?', absent: 'Tem certeza que deseja marcar como faltou?', rescheduled: 'Salvar remarcação deste agendamento?'
    };
    if (options.confirm !== false && confirmationMap[status] && !window.confirm(confirmationMap[status])) return;
    setBookingActionLoading(`${id}:${status}`);
    try {
      const response = await fetch('/api/client?action=update-public-booking-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ slug, requestId: id, status, date: options.date, time: options.time, internalNote: options.internalNote, cancellationReason: options.cancellationReason, rescheduleReason: options.rescheduleReason, clientTags: options.clientTags, crmEvent: options.crmEvent })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) throw new Error(data?.message || 'Não foi possível atualizar o agendamento.');
      const updated = data.request || {};
      const hydrated = {
        ...updated,
        internal_note: updated.internal_note || updated.metadata?.internalNote,
        cancellation_reason: updated.cancellation_reason || updated.metadata?.cancellationReason,
        reschedule_reason: updated.reschedule_reason || updated.metadata?.rescheduleReason,
      };
      setAppointments(current => current.map(item => item.id === id ? { ...item, ...hydrated } : item));
      setSelectedBooking((current: any | null) => current?.id === id ? { ...current, ...hydrated } : current);
      pushToast({ tone: 'success', title: 'Agendamento atualizado', message: options.successMessage || `Status alterado para ${bookingStatusLabel(updated.status || status)}.` });
    } catch (error) {
      pushToast({ tone: 'warning', title: 'Não foi possível atualizar', message: friendlyErrorMessage(error, 'Nao foi possivel atualizar agora. Tente novamente.', 'client') });
    } finally {
      setBookingActionLoading('');
    }
  };
  const rescheduleAppointment = (item: any) => {
    const nextDate = window.prompt('Nova data (AAAA-MM-DD)', item.requested_date || dateKey());
    if (!nextDate) return;
    const nextTime = window.prompt('Novo horário (HH:MM)', item.requested_time || item.time || '09:00');
    if (!nextTime) return;
    const rescheduleReason = window.prompt('Motivo/observação da remarcação', item.reschedule_reason || '') || '';
    updateAppointmentStatus(item.id, 'rescheduled', { date: nextDate, time: nextTime, rescheduleReason });
  };
  const cancelAppointment = (item: any) => {
    const cancellationReason = window.prompt('Motivo do cancelamento (opcional)', item.cancellation_reason || '') || '';
    updateAppointmentStatus(item.id, 'cancelled', { cancellationReason });
  };
  const saveBookingInternalNote = (item: any) => {
    const internalNote = window.prompt('Observação interna da empresa', item.internal_note || item.metadata?.internalNote || '') || '';
    if (!internalNote.trim() && !item.internal_note) return;
    updateAppointmentStatus(item.id, cleanStatus(item.status) as any, { internalNote, confirm: false });
  };
  const copyBookingSummary = async (item: any) => {
    const text = bookingSummaryText(item, businessName);
    await navigator.clipboard?.writeText(text);
    pushToast({ tone: 'success', title: 'Resumo copiado', message: 'Resumo do agendamento copiado.' });
  };
  const saveScheduleConfig = async () => {
    try {
      const response = await fetch('/api/client?action=update-schedule-config', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ slug, scheduleConfig: localScheduleConfig }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) throw new Error(data?.message || 'Não foi possível salvar disponibilidade.');
      const savedScheduleConfig = data.scheduleConfig || localScheduleConfig;
      setLocalScheduleConfig(savedScheduleConfig);
      setRemote((current: any) => current ? { ...current, schedule_config: savedScheduleConfig, raw_payload: { ...(current.raw_payload || {}), scheduleConfig: savedScheduleConfig }, hours: { ...(current.hours || {}), interval: String(savedScheduleConfig.slotInterval) }, rules: { ...(current.rules || {}), cancellation: savedScheduleConfig.cancellationText, minNotice: `${savedScheduleConfig.minAdvanceHours} horas` } } : current);
      const localAgenda = getStoredAgenda();
      if (localAgenda?.slug === slug) saveStoredAgenda({ ...localAgenda, scheduleConfig: savedScheduleConfig, hours: { ...(localAgenda.hours || {}), interval: String(savedScheduleConfig.slotInterval) }, rules: { ...(localAgenda.rules || {}), cancellation: savedScheduleConfig.cancellationText || localAgenda.rules?.cancellation || '', minNotice: `${savedScheduleConfig.minAdvanceHours} horas` } });
      pushToast({ tone: 'success', title: 'Disponibilidade salva', message: 'A página pública já usa essas regras e continuará igual após atualizar a página.' });
    } catch (error) {
      pushToast({ tone: 'warning', title: 'Não foi possível salvar', message: friendlyErrorMessage(error, 'Nao foi possivel salvar agora. Tente novamente.', 'client') });
    }
  };
  const blockQuickTime = () => {
    const blockDate = window.prompt('Data do bloqueio (AAAA-MM-DD)', dateKey());
    if (!blockDate) return;
    const start = window.prompt('Hora inicial (HH:MM)', '10:00');
    if (!start) return;
    const end = window.prompt('Hora final (HH:MM)', '11:00');
    if (!end) return;
    const reason = window.prompt('Motivo opcional', 'Bloqueio manual') || 'Bloqueio manual';
    setLocalScheduleConfig(current => ({ ...current, blockedTimes: [...(current.blockedTimes || []), { date: blockDate, start, end, reason }] }));
  };
  const serviceStatus = (service: any) => service?.active === false ? 'inativo' : 'ativo';
  const serviceDurationLabel = (service: any) => `${serviceDurationMinutes(service) || Number(service?.duration || 60) || 60} min`;
  const servicePriceLabel = (service: any) => {
    const value = Number(service?.price || service?.value || 0);
    return value > 0 ? currency(value) : 'Valor sob consulta';
  };
  const splitEditorList = (value: any) => String(value || '').split(/[,;\n|]+/).map(item => item.trim()).filter(Boolean);
  const normalizeServiceForSave = (service: any, index: number) => {
    const professionalNames = splitEditorList(service.professionalsText || service.professionalNames);
    return {
      ...service,
      order: Number(service.order || index + 1),
      professionalNames,
      professionalsText: service.professionalsText || professionalNames.join(', '),
      internalNotes: service.internalNotes || service.notesInternal || ''
    };
  };
  const normalizeTeamForSave = (member: any) => {
    const serviceNames = splitEditorList(member.servicesText || member.serviceNames);
    return {
      ...member,
      serviceNames,
      servicesText: member.servicesText || serviceNames.join(', '),
      email: member.email || '',
      availabilityNotes: member.availabilityNotes || member.scheduleNotes || ''
    };
  };
  const updateLocalService = (index: number, patch: Record<string, any>) => setLocalServices(current => current.map((item, i) => i === index ? { ...item, ...patch } : item));
  const updateLocalTeam = (index: number, patch: Record<string, any>) => setLocalTeam(current => current.map((item, i) => i === index ? { ...item, ...patch } : item));
  const addLocalService = () => setLocalServices(current => [...current, { name: 'Novo serviço', duration: '60', durationMinutes: '60', price: '0', description: 'Descreva o serviço para a página pública.', category: 'Geral', active: true, highlight: false, order: current.length + 1, professionalsText: '', internalNotes: '' }]);
  const addLocalTeamMember = () => setLocalTeam(current => [...current, { name: 'Novo profissional', role: 'Profissional', specialty: 'Atendimento', whatsapp: businessWhatsapp, email: '', avatarUrl: '', active: true, servicesText: '', availabilityNotes: '' }]);
  const removeLocalService = (index: number) => { if (window.confirm('Remover este serviço da agenda?')) setLocalServices(current => current.filter((_, i) => i !== index)); };
  const removeLocalTeamMember = (index: number) => { if (window.confirm('Remover este profissional da agenda?')) setLocalTeam(current => current.filter((_, i) => i !== index)); };
  const saveTeamServices = async () => {
    const nextServices = localServices.filter(item => String(item?.name || '').trim()).map(normalizeServiceForSave);
    const nextTeam = localTeam.filter(item => String(item?.name || '').trim()).map(normalizeTeamForSave);
    const nextAgenda: AgendaDraft = {
      ...(readinessAgenda as AgendaDraft),
      services: nextServices,
      team: nextTeam,
      scheduleConfig: localScheduleConfig,
      publishedAt: published ? (sourceAgenda?.published_at || agenda?.publishedAt || new Date().toISOString()) : undefined,
      slug
    };
    try {
      const response = await fetch('/api/client?action=create-agenda', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ agenda: nextAgenda, account }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) throw new Error(data?.message || 'Não foi possível salvar serviços e equipe.');
      if (data.agenda) setRemote(data.agenda);
      saveStoredAgenda(nextAgenda);
      pushToast({ tone: 'success', title: 'Operação salva', message: 'Serviços, profissionais e horários foram sincronizados com a agenda pública.' });
    } catch (error) {
      pushToast({ tone: 'warning', title: 'Não foi possível salvar', message: friendlyErrorMessage(error, 'Nao foi possivel salvar agora. Tente novamente.', 'client') });
    }
  };
  const activeLocalServices = activePublicItems(localServices.filter(item => String(item?.name || '').trim()));
  const activeLocalTeam = activePublicItems(localTeam.filter(item => String(item?.name || '').trim()));
  const serviceHealthAlerts = [
    !activeLocalServices.length ? 'Cadastre pelo menos um serviço ativo para a página pública receber agendamentos.' : '',
    activeLocalServices.some(service => !serviceHasValidDuration(service)) ? 'Existe serviço ativo sem duração válida.' : '',
    !activeLocalTeam.length ? 'Adicione pelo menos um profissional ativo para organizar o atendimento.' : '',
    activeLocalServices.some(service => teamForService(activeLocalTeam, service).length === 0) ? 'Existe serviço ativo sem profissional compatível.' : '',
    activeLocalTeam.some(member => !scheduleHasEnabledPeriod(professionalScheduleConfig(localScheduleConfig, member))) ? 'Existe profissional ativo sem horário válido.' : '',
    !Object.values(localScheduleConfig.workingDays || {}).some((day: any) => day?.enabled) ? 'Nenhum dia de atendimento está ativo.' : ''
  ].filter(Boolean);

  const openWhatsApp = (phone: string, name?: string) => {
    const clean = String(phone || '').replace(/\D/g, '');
    if (!clean) return pushToast({ tone: 'warning', title: 'WhatsApp ausente', message: 'Este agendamento não tem telefone cadastrado.' });
    const target = clean.startsWith('55') ? clean : `55${clean}`;
    window.open(`https://wa.me/${target}?text=${encodeURIComponent(`Olá ${name || ''}, tudo bem? Aqui é da ${businessName}. Recebemos sua solicitação de agendamento.`)}`, '_blank');
  };
  const bookingCustomerName = (item: any) => item?.customer_name || item?.name || 'cliente';
  const bookingServiceName = (item: any) => item?.service_name || primaryService || 'atendimento';
  const bookingProfessionalName = (item: any) => item?.professional_name || item?.metadata?.professionalName || 'equipe responsável';
  const bookingDateText = (item: any) => {
    const value = item?.requested_date || item?.date || '';
    if (!value) return 'data a confirmar';
    try { return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR'); } catch { return value; }
  };
  const bookingTimeText = (item: any) => item?.requested_time || item?.time || '--:--';
  const bookingTemplateVariables = (item: any = {}) => {
    const reason = item?.cancellation_reason || item?.reschedule_reason || item?.metadata?.reason || '';
    const previousDate = item?.previous_requested_date ? bookingDateText({ requested_date: item.previous_requested_date }) : '';
    const previousTime = item?.previous_requested_time || '';
    return {
      cliente: bookingCustomerName(item),
      empresa: businessName,
      servico: bookingServiceName(item),
      profissional: bookingProfessionalName(item),
      data: bookingDateText(item),
      horario: bookingTimeText(item),
      whatsapp: item?.customer_phone || item?.phone || businessWhatsapp || 'WhatsApp não informado',
      link_agenda: bookingLink,
      endereco: businessAddress || 'Endereço não informado',
      motivo: reason || 'sem motivo informado',
      data_anterior: previousDate || 'data anterior',
      horario_anterior: previousTime || '--:--'
    };
  };
  const renderBookingTemplate = (body: string, item: any) => {
    const variables = bookingTemplateVariables(item);
    return String(body || '').replace(/\{([a-zA-Z0-9_]+)\}/g, (match: string, key: string) => String((variables as Record<string, string>)[key] || match));
  };
  const createBookingMessage = (item: any, template: string = 'confirmation') => {
    const templateKey = normalizeBookingMessageTemplateKey(template);
    const fallbackBody = bookingMessageTemplateMap[templateKey]?.body || bookingMessageTemplateMap.confirmation.body;
    return renderBookingTemplate(messageTemplateDrafts[templateKey] || fallbackBody, item);
  };
  const bookingMessageSubject = (item: any, template: string) => {
    const templateKey = normalizeBookingMessageTemplateKey(template);
    const fallbackSubject = bookingMessageTemplateMap[templateKey]?.subject || bookingMessageTemplateMap.confirmation.subject;
    return renderBookingTemplate(fallbackSubject, item);
  };
  const registerBookingCommunication = async (item: any, channel: 'copy' | 'whatsapp' | 'email', template: string, message: string) => {
    if (!item?.id) return { ok: false, skipped: true, message: 'Agendamento sem ID.' } as any;
    const templateKey = normalizeBookingMessageTemplateKey(template);
    const key = `${item.id}:${channel}:${templateKey}`;
    setCommunicationLoading(key);
    try {
      const response = await fetch('/api/client?action=send-booking-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ slug, requestId: item.id, channel, template: templateKey, message, subject: bookingMessageSubject(item, templateKey) })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) throw new Error(data?.message || 'Não foi possível registrar a comunicação.');
      if (data.request) {
        setAppointments(current => current.map(row => row.id === item.id ? { ...row, ...data.request } : row));
        setSelectedBooking((current: any | null) => current?.id === item.id ? { ...current, ...data.request } : current);
      }
      return data;
    } finally {
      setCommunicationLoading('');
    }
  };
  const copyBookingMessage = async (item: any, template = 'confirmation') => {
    const message = createBookingMessage(item, template);
    await navigator.clipboard?.writeText(message);
    try { await registerBookingCommunication(item, 'copy', template, message); } catch {}
    pushToast({ tone: 'success', title: 'Mensagem copiada', message: 'Texto pronto copiado para enviar ao cliente.' });
  };
  const openBookingWhatsApp = async (item: any, template = 'confirmation') => {
    const clean = String(item?.customer_phone || item?.phone || '').replace(/\D/g, '');
    if (!clean) return pushToast({ tone: 'warning', title: 'WhatsApp ausente', message: 'Este cliente não tem WhatsApp cadastrado.' });
    const message = createBookingMessage(item, template);
    try { await registerBookingCommunication(item, 'whatsapp', template, message); } catch {}
    const target = clean.startsWith('55') ? clean : `55${clean}`;
    window.open(`https://wa.me/${target}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };
  const sendBookingEmail = async (item: any, template = 'confirmation') => {
    if (!item?.customer_email) return pushToast({ tone: 'warning', title: 'E-mail ausente', message: 'Este cliente não informou e-mail.' });
    const message = createBookingMessage(item, template);
    try {
      const data = await registerBookingCommunication(item, 'email', template, message);
      if (data?.delivery?.skipped) {
        pushToast({ tone: 'info', title: 'E-mail não configurado', message: data.delivery.reason || 'Configure o Resend para envio real.' });
      } else {
        pushToast({ tone: 'success', title: 'E-mail processado', message: 'Mensagem enviada ou registrada com sucesso.' });
      }
    } catch (error) {
      pushToast({ tone: 'warning', title: 'Falha no envio', message: friendlyErrorMessage(error, 'Nao foi possivel registrar a mensagem agora.', 'client') });
    }
  };
  const navItems: Array<[string, ComponentType<{ size?: number }>]> = [
    ['Início', BarChart3], ['Agendamentos', CalendarCheck], ['Onboarding', Rocket], ['Agenda', CalendarClock], ['Recepção', ClipboardList], ['Profissional', UserPlus], ['Clientes', UsersRound], ['Serviços', FileText], ['Equipe', UsersRound], ['Permissões', Lock], ['Identidade visual', Palette], ['Unidades', Building2], ['Disponibilidade', Clock], ['Lista de espera', ListChecks], ['Mensagens', MessageSquareText], ['Automações', Zap], ['IA Assistida', Bot], ['Página pública', QrCode], ['Financeiro', CreditCard], ['Relatórios', BarChart3], ['Segurança', ShieldCheck]
  ];
  const sampleTimes = ['08:00', '08:30', '09:00', '09:30', '10:30', '11:30', '14:00', '15:30', '16:30', '17:30'];
  const greeting = new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite';
  const primaryService = services?.[0]?.name || 'Atendimento inicial';
  const permissions = [
    ['Administrador', 'Acesso total à agenda, páginas, serviços, equipe, pagamento e segurança.'],
    ['Recepção', 'Confirma solicitações, remarca horários, chama clientes e acompanha lista de espera.'],
    ['Profissional', 'Visualiza a própria agenda, atendimentos confirmados e dados essenciais do cliente.'],
    ['Financeiro', 'Acompanha receita estimada, pagamentos e status de plano.']
  ];
  const messageTemplates = bookingMessageTemplates;
  const messagePreviewBooking = selectedBooking || filteredAppointments[0] || {
    id: 'message-preview',
    customer_name: 'Cliente exemplo',
    customer_phone: businessWhatsapp,
    customer_email: account.email,
    service_name: primaryService,
    professional_name: localTeam[0]?.name || 'Equipe responsável',
    requested_date: todayKey,
    requested_time: sampleTimes[2],
    status: 'confirmed'
  };
  const activeTemplate = bookingMessageTemplateMap[activeTemplateKey] || bookingMessageTemplateMap.confirmation;
  const activeTemplatePreview = createBookingMessage(messagePreviewBooking, activeTemplateKey);
  const activeTemplateVariables = bookingTemplateVariables(messagePreviewBooking);
  const bookingCommunicationHistory = (item: any) => {
    const sources = [
      item?.metadata?.communicationHistory,
      item?.message_history,
      item?.communication_log,
      item?.metadata?.lastCommunication ? [item.metadata.lastCommunication] : []
    ];
    const seen = new Set<string>();
    return sources.flatMap(source => Array.isArray(source) ? source : []).filter((event: any) => {
      const marker = `${event?.at || ''}:${event?.channel || ''}:${event?.template || ''}:${event?.messagePreview || ''}`;
      if (seen.has(marker)) return false;
      seen.add(marker);
      return true;
    });
  };
  const selectedBookingCommunicationHistory = selectedBooking ? bookingCommunicationHistory(selectedBooking) : [];
  const updateMessageTemplateDraft = (key: BookingTemplateKey, value: string) => {
    setMessageTemplateDrafts(current => ({ ...current, [key]: value }));
    setActiveTemplateKey(key);
  };
  const resetMessageTemplateDraft = (key: BookingTemplateKey) => {
    const fallback = bookingMessageTemplateMap[key]?.body || bookingMessageTemplateMap.confirmation.body;
    setMessageTemplateDrafts(current => ({ ...current, [key]: fallback }));
    setActiveTemplateKey(key);
    pushToast({ tone: 'success', title: 'Modelo restaurado', message: 'Texto padrão recuperado para este template.' });
  };
  const copyTemplateVariable = async (variable: string) => {
    await navigator.clipboard?.writeText(variable);
    pushToast({ tone: 'success', title: 'Variável copiada', message: `${variable} pronta para usar no modelo.` });
  };
  const copyTemplateMessage = async (key: BookingTemplateKey, item: any = messagePreviewBooking) => {
    const message = createBookingMessage(item, key);
    await navigator.clipboard?.writeText(message);
    if (item?.id && item.id !== 'message-preview') {
      try { await registerBookingCommunication(item, 'copy', key, message); } catch {}
    }
    pushToast({ tone: 'success', title: 'Mensagem copiada', message: 'Template preenchido com variáveis reais.' });
  };
  const openTemplateWhatsApp = async (key: BookingTemplateKey, item: any = messagePreviewBooking) => openBookingWhatsApp(item, key);
  const automations = [
    ['Lembrete automático', 'Enviar lembrete antes do atendimento.', 'Pronto para configurar'],
    ['Pesquisa de satisfação', 'Solicitar avaliação após conclusão.', 'Recomendado'],
    ['Reativação', 'Chamar clientes sem retorno recente.', 'Em planejamento'],
    ['Lista de espera', 'Avisar quando surgir horário livre.', 'Operacional']
  ];
  const onboardingSteps = [
    ['Conta criada', 'Cliente e negócio vinculados.', true],
    ['Plano liberado', account.paymentStatus === 'approved' ? 'Pagamento/key aprovado.' : 'Aguardando liberação.', account.paymentStatus === 'approved'],
    ['Agenda configurada', `${services.length} serviço(s) e ${team.length} profissional(is).`, services.length > 0 || team.length > 0],
    ['Página publicada', published ? 'Links públicos disponíveis.' : 'Publicação pendente.', Boolean(published)],
    ['Operação ativa', appointments.length ? 'Solicitações recebidas.' : 'Aguardando primeiros agendamentos.', appointments.length > 0]
  ];

  const readinessAgenda = normalizePublicAgenda(sourceAgenda) || agenda || {
    business: { name: businessName, segment: businessSegment, whatsapp: businessWhatsapp, address: businessAddress, description: businessDescription },
    visual: { primaryColor: '#2563EB', secondaryColor: '#0F172A', accentColor: '#10B981', logoUrl: '', bannerUrl: '', instagram: '', siteUrl: '', welcome: '', slogan: '' },
    services,
    team,
    hours: { weekdays: '', saturday: '', interval: String(localScheduleConfig.slotInterval || 30) },
    scheduleConfig: localScheduleConfig,
    rules,
    slug
  } as AgendaDraft;
  const publicationReadiness = getAgendaReadiness(readinessAgenda, account);
  const activePlan = ['approved', 'active', 'trial'].includes(String(account.paymentStatus || account.subscriptionStatus || '').toLowerCase()) || ['active', 'trial'].includes(String(account.subscriptionStatus || '').toLowerCase());
  const planBadgeTone = activePlan ? 'green' : ['pending', 'manual_pending', 'under_review'].includes(String(account.paymentStatus || '').toLowerCase()) ? 'amber' : 'red';
  const planHeadline = activePlan ? 'Plano liberado' : ['pending', 'manual_pending', 'under_review'].includes(String(account.paymentStatus || '').toLowerCase()) ? 'Pagamento em análise' : 'Acesso limitado';
  const agendaHeadline = published ? 'Agenda publicada' : publicationReadiness.canPublish ? 'Pronta para publicar' : 'Agenda incompleta';
  const nextAppointments = appointments
    .filter(item => !['cancelled', 'completed', 'refused', 'absent'].includes(cleanStatus(item.status)))
    .sort((a, b) => `${a.requested_date || a.date || ''} ${a.requested_time || a.time || ''}`.localeCompare(`${b.requested_date || b.date || ''} ${b.requested_time || b.time || ''}`))
    .slice(0, 4);
  const publicShareMessage = `Olá! Você pode agendar seu horário com ${businessName} pelo link: ${bookingLink}`;
  const dashboardAlerts = [
    !activePlan ? { tone: 'amber', title: 'Plano precisa de atenção', text: 'Regularize ou aguarde aprovação para manter a agenda disponível.' } : null,
    !published ? { tone: 'blue', title: agendaHeadline, text: publicationReadiness.canPublish ? 'Sua agenda já pode ser publicada.' : 'Conclua o checklist para liberar o link público.' } : null,
    pending.length ? { tone: 'purple', title: `${pending.length} pendente(s)`, text: 'Confirme ou trate as solicitações recebidas.' } : null,
    !services.length ? { tone: 'amber', title: 'Cadastre serviços', text: 'Sem serviço, o cliente final não consegue escolher o que agendar.' } : null,
    !team.length ? { tone: 'amber', title: 'Cadastre profissionais', text: 'Adicione pelo menos um profissional para organizar os atendimentos.' } : null
  ].filter(Boolean) as Array<{ tone: string; title: string; text: string }>;
  const visualTrend = [pending.length, confirmed.length, completed.length, Math.max(appointments.length, 1), freeToday, Math.max(revenue / Math.max(baseServicePrice || 1, 1), 0)].map(Number);
  const smartSignals = [
    { label: 'Conversão', value: conversion, suffix: '%', hint: `${confirmed.length + completed.length} de ${appointments.length || 0} tratados`, tone: 'green' },
    { label: 'Ocupação', value: occupation, suffix: '%', hint: `${busyToday} ocupado(s) hoje`, tone: 'blue' },
    { label: 'Prontidão', value: publicationReadiness.score, suffix: '%', hint: agendaHeadline, tone: publicationReadiness.canPublish ? 'green' : 'amber' },
    { label: 'Receita estimada', value: Math.round(revenue), prefix: 'R$ ', hint: 'com base nos serviços/agendamentos', tone: 'purple' }
  ];

  const appointmentDateValue = (item: any) => String(item.requested_date || item.date || item.created_at?.slice?.(0, 10) || '').slice(0, 10);
  const serviceNameOf = (item: any) => String(item.service_name || item.metadata?.serviceName || primaryService || 'Atendimento');
  const professionalNameOf = (item: any) => String(item.professional_name || item.metadata?.professionalName || 'Equipe');
  const periodStart = (() => {
    const now = new Date();
    if (reportPeriod === 'today') return todayKey;
    if (reportPeriod === '7d') { const date = new Date(now); date.setDate(date.getDate() - 6); return date.toISOString().slice(0, 10); }
    if (reportPeriod === '30d') { const date = new Date(now); date.setDate(date.getDate() - 29); return date.toISOString().slice(0, 10); }
    if (reportPeriod === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    if (reportPeriod === 'previous') return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
    return '';
  })();
  const periodEnd = (() => {
    const now = new Date();
    if (reportPeriod === 'previous') return new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
    return todayKey;
  })();
  const periodAppointments = appointments.filter(item => {
    if (reportPeriod === 'all') return true;
    const value = appointmentDateValue(item);
    return Boolean(value && value >= periodStart && value <= periodEnd);
  });
  const reportServiceOptions = ['all', ...Array.from(new Set(periodAppointments.map(serviceNameOf).filter(Boolean)))];
  const reportProfessionalOptions = ['all', ...Array.from(new Set(periodAppointments.map(professionalNameOf).filter(Boolean)))];
  const reportStatusOptions = ['all', ...Array.from(new Set(periodAppointments.map(item => cleanStatus(item.status)).filter(Boolean)))];
  const reportAppointments = periodAppointments.filter(item => {
    const byService = reportServiceFilter === 'all' || serviceNameOf(item) === reportServiceFilter;
    const byProfessional = reportProfessionalFilter === 'all' || professionalNameOf(item) === reportProfessionalFilter;
    const byStatus = reportStatusFilter === 'all' || cleanStatus(item.status) === reportStatusFilter;
    return byService && byProfessional && byStatus;
  });
  const reportPending = reportAppointments.filter(item => cleanStatus(item.status) === 'pending');
  const reportConfirmed = reportAppointments.filter(item => cleanStatus(item.status) === 'confirmed');
  const reportCompleted = reportAppointments.filter(item => cleanStatus(item.status) === 'completed');
  const reportCancelled = reportAppointments.filter(item => cleanStatus(item.status) === 'cancelled');
  const reportRescheduled = reportAppointments.filter(item => cleanStatus(item.status) === 'rescheduled');
  const reportAbsent = reportAppointments.filter(item => cleanStatus(item.status) === 'absent');
  const reportActive = reportAppointments.filter(item => !['cancelled', 'refused', 'absent'].includes(cleanStatus(item.status)));
  const reportClients = Array.from(new Map(reportAppointments.map((item, index) => [item.customer_phone || item.customer_whatsapp || item.customer_email || item.customer_name || `cliente-${index}`, item])).values());
  const reportRevenue = reportActive.reduce((sum, item) => sum + Number(item.value || item.price || baseServicePrice || 0), 0);
  const reportConfirmationRate = Math.round(((reportConfirmed.length + reportCompleted.length) / Math.max(reportAppointments.length, 1)) * 100);
  const reportCancelRate = Math.round((reportCancelled.length / Math.max(reportAppointments.length, 1)) * 100);
  const reportAttendanceRate = Math.round((reportCompleted.length / Math.max(reportCompleted.length + reportAbsent.length, 1)) * 100);
  const reportAverageTicket = Math.round(reportRevenue / Math.max(reportActive.length, 1));
  const reportCapacity = reportPeriod === 'today' ? 6 : reportPeriod === '7d' ? 28 : ['30d','month','previous'].includes(reportPeriod) ? 120 : 180;
  const reportOccupation = Math.min(100, Math.round((reportActive.length / Math.max((services.length || 1) * reportCapacity, 1)) * 100));
  const countBy = (items: any[], getter: (item: any) => string) => Object.entries(items.reduce((acc: Record<string, number>, item) => {
    const key = getter(item) || 'Não informado';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]);
  const sumBy = (items: any[], getter: (item: any) => string, valueGetter: (item: any) => number) => Object.entries(items.reduce((acc: Record<string, number>, item) => {
    const key = getter(item) || 'Não informado';
    acc[key] = (acc[key] || 0) + valueGetter(item);
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]);
  const servicesRank = countBy(reportAppointments, serviceNameOf);
  const servicesRevenueRank = sumBy(reportActive, serviceNameOf, item => Number(item.value || item.price || baseServicePrice || 0));
  const professionalsRank = countBy(reportAppointments, professionalNameOf);
  const hoursRank = countBy(reportAppointments, item => String(item.requested_time || item.time || '--:--'));
  const daysRank = countBy(reportAppointments, item => {
    const value = appointmentDateValue(item);
    return value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short' }) : 'Sem data';
  });
  const statusesRank = [
    ['Pendentes', reportPending.length], ['Confirmados', reportConfirmed.length], ['Concluídos', reportCompleted.length], ['Cancelados', reportCancelled.length], ['Remarcados', reportRescheduled.length], ['Faltas', reportAbsent.length]
  ] as Array<[string, number]>;
  const reportClientGroups = Array.from(reportAppointments.reduce((acc: Map<string, any[]>, item: any, index: number) => {
    const key = String(item.customer_phone || item.customer_whatsapp || item.customer_email || item.customer_name || `cliente-${index}`);
    acc.set(key, [...(acc.get(key) || []), item]);
    return acc;
  }, new Map<string, any[]>()).values());
  const reportDaysSince = (value?: string) => {
    if (!value) return 9999;
    const date = new Date(`${value}T12:00:00`);
    return Number.isFinite(date.getTime()) ? Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000)) : 9999;
  };
  const reportRecurringClients = reportClientGroups.filter(group => group.length > 1).length;
  const reportNoReturnClients = reportClientGroups.filter(group => group.length === 1 && reportDaysSince(appointmentDateValue(group[0])) > 30).length;
  const topService = servicesRank[0]?.[0] || 'Sem dados ainda';
  const topHour = hoursRank[0]?.[0] || '--:--';
  const topDay = daysRank[0]?.[0] || 'Sem dados';
  const periodLabel = reportPeriod === 'today' ? 'Hoje' : reportPeriod === '7d' ? 'Últimos 7 dias' : reportPeriod === '30d' ? 'Últimos 30 dias' : reportPeriod === 'month' ? 'Este mês' : reportPeriod === 'previous' ? 'Mês anterior' : 'Todo o histórico';
  const executiveReportText = `${periodLabel}: sua agenda teve ${reportAppointments.length} solicitação(ões). O serviço mais procurado foi ${topService}. A taxa de cancelamento está em ${reportCancelRate}%. O melhor horário foi ${topHour}.`;
  const heatmapHours = ['08','09','10','11','12','13','14','15','16','17','18'];
  const heatmapDays = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  const heatmapValue = (dayLabel: string, hour: string) => reportAppointments.filter(item => {
    const date = appointmentDateValue(item);
    const day = date ? new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '') : '';
    return day.toLowerCase().startsWith(dayLabel.slice(0, 3).toLowerCase()) && String(item.requested_time || item.time || '').startsWith(hour);
  }).length;
  const heatmapMax = Math.max(1, ...heatmapDays.flatMap(day => heatmapHours.map(hour => heatmapValue(day, hour))));
  const reportSummary = {
    periodo: periodLabel,
    filtros: { servico: reportServiceFilter, profissional: reportProfessionalFilter, status: reportStatusFilter },
    agenda: businessName,
    geradoEm: new Date().toISOString(),
    totalAgendamentos: reportAppointments.length,
    pendentes: reportPending.length,
    confirmados: reportConfirmed.length,
    concluidos: reportCompleted.length,
    cancelados: reportCancelled.length,
    remarcados: reportRescheduled.length,
    faltas: reportAbsent.length,
    clientesUnicos: reportClients.length,
    clientesRecorrentes: reportRecurringClients,
    clientesSemRetorno: reportNoReturnClients,
    receitaEstimada: reportRevenue,
    ticketMedioEstimado: reportAverageTicket,
    taxaConfirmacao: reportConfirmationRate,
    taxaCancelamento: reportCancelRate,
    taxaComparecimento: reportAttendanceRate,
    ocupacaoEstimada: reportOccupation,
    servicoMaisSolicitado: topService,
    servicoMaisLucrativo: servicesRevenueRank[0]?.[0] || 'Sem dados ainda',
    profissionalMaisSolicitado: professionalsRank[0]?.[0] || 'Sem dados ainda',
    horarioMaisProcurado: topHour,
    diaMaisForte: topDay,
    resumoExecutivo: executiveReportText
  };
  const exportReport = async (format: 'txt' | 'json') => {
    const text = format === 'json'
      ? JSON.stringify(reportSummary, null, 2)
      : `AgendaPro — Relatório executivo\nAgenda: ${businessName}\nPeríodo: ${periodLabel}\nGerado em: ${new Date().toLocaleString('pt-BR')}\n\n${executiveReportText}\n\nAgendamentos: ${reportAppointments.length}\nConfirmados: ${reportConfirmed.length}\nPendentes: ${reportPending.length}\nConcluídos: ${reportCompleted.length}\nCancelados: ${reportCancelled.length}\nRemarcados: ${reportRescheduled.length}\nFaltas: ${reportAbsent.length}\nClientes únicos: ${reportClients.length}\nClientes recorrentes: ${reportRecurringClients}\nClientes sem retorno: ${reportNoReturnClients}\nReceita estimada: ${currency(reportRevenue)}\nTicket médio estimado: ${currency(reportAverageTicket)}\nTaxa de confirmação: ${reportConfirmationRate}%\nTaxa de cancelamento: ${reportCancelRate}%\nTaxa de comparecimento: ${reportAttendanceRate}%\nOcupação estimada: ${reportOccupation}%\nServiço mais solicitado: ${topService}\nServiço mais lucrativo: ${servicesRevenueRank[0]?.[0] || 'Sem dados ainda'}\nProfissional mais solicitado: ${professionalsRank[0]?.[0] || 'Sem dados ainda'}\nHorário mais procurado: ${topHour}\nDia mais forte: ${topDay}`;
    await navigator.clipboard?.writeText(text);
    pushToast({ tone: 'success', title: format === 'json' ? 'JSON copiado' : 'Resumo copiado', message: 'Relatório copiado para a área de transferência.' });
  };
  const downloadReportCsv = () => {
    const header = ['data','hora','cliente','servico','profissional','status','valor'];
    const rows = reportAppointments.map(item => [appointmentDateValue(item), item.requested_time || item.time || '', item.customer_name || item.name || '', serviceNameOf(item), professionalNameOf(item), cleanStatus(item.status), String(item.value || item.price || baseServicePrice || 0)]);
    const csv = [header, ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agendapro-relatorio-${slug}-${reportPeriod}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    pushToast({ tone: 'success', title: 'CSV gerado', message: 'Arquivo simples de relatório baixado.' });
  };

  const normalizeContact = (value: any) => String(value || '').replace(/\D/g, '');
  const appointmentStamp = (item: any) => `${appointmentDateValue(item) || item.created_at?.slice?.(0, 10) || ''} ${item.requested_time || item.time || item.created_at || ''}`;
  const daysSince = (value?: string) => {
    if (!value) return 9999;
    const date = new Date(`${value}T12:00:00`);
    if (!Number.isFinite(date.getTime())) return 9999;
    return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
  };
  const uniqueTextList = (values: any[]) => Array.from(new Set(values.map(item => String(item || '').trim()).filter(Boolean)));
  const appointmentCrmTags = (item: any) => Array.isArray(item?.metadata?.crmTags) ? item.metadata.crmTags : Array.isArray(item?.crmTags) ? item.crmTags : [];
  const appointmentCrmHistory = (item: any) => Array.isArray(item?.metadata?.crmHistory) ? item.metadata.crmHistory : [];
  const crmAutoTags = (profile: any) => uniqueTextList([
    profile.statusLabel,
    profile.total >= 5 || profile.valueTotal >= 1500 ? 'VIP' : '',
    profile.completedCount > 0 ? 'Já atendido' : '',
    profile.cancelledCount >= 2 ? 'Muitos cancelamentos' : '',
    profile.lastDays > 30 ? 'Reativação' : '',
    profile.upcoming ? 'Próximo horário' : '',
  ]);
  const customerProfiles = Array.from(appointments.reduce((map: Map<string, any>, item: any, index: number) => {
    const phone = normalizeContact(item.customer_phone || item.customer_whatsapp || item.phone);
    const email = String(item.customer_email || item.email || '').toLowerCase().trim();
    const name = String(item.customer_name || item.client_name || item.name || 'Cliente').trim();
    const key = phone || email || `${slugify(name)}-${index}`;
    const current = map.get(key) || { key, name, phone, email, appointments: [] as any[] };
    current.name = current.name === 'Cliente' && name ? name : current.name;
    current.phone = current.phone || phone;
    current.email = current.email || email;
    current.appointments.push(item);
    map.set(key, current);
    return map;
  }, new Map<string, any>()).values()).map((profile: any) => {
    const sorted = [...profile.appointments].sort((a, b) => appointmentStamp(b).localeCompare(appointmentStamp(a)));
    const latest = sorted[0] || {};
    const upcoming = [...profile.appointments]
      .filter(item => appointmentDateValue(item) >= todayKey && !['cancelled', 'completed', 'refused', 'absent'].includes(cleanStatus(item.status)))
      .sort((a, b) => appointmentStamp(a).localeCompare(appointmentStamp(b)))[0] || null;
    const serviceRank = countBy(profile.appointments, item => String(item.service_name || item.metadata?.serviceName || primaryService || 'Atendimento'));
    const completedCount = profile.appointments.filter((item: any) => cleanStatus(item.status) === 'completed').length;
    const cancelledCount = profile.appointments.filter((item: any) => cleanStatus(item.status) === 'cancelled').length;
    const lastDate = appointmentDateValue(latest);
    const lastDays = daysSince(lastDate);
    const valueTotal = profile.appointments.reduce((sum: number, item: any) => sum + Number(item.value || item.price || baseServicePrice || 0), 0);
    const statusKey = upcoming ? 'active' : valueTotal >= 1500 || profile.appointments.length >= 5 ? 'vip' : profile.appointments.length >= 2 ? 'recurring' : lastDays > 60 ? 'inactive' : lastDays > 30 ? 'no_return' : 'new';
    const statusLabel = statusKey === 'active' ? 'Ativo' : statusKey === 'vip' ? 'VIP' : statusKey === 'recurring' ? 'Recorrente' : statusKey === 'inactive' ? 'Inativo' : statusKey === 'no_return' ? 'Sem retorno' : 'Novo';
    const manualTags = uniqueTextList(profile.appointments.flatMap((item: any) => appointmentCrmTags(item)));
    const crmHistory = profile.appointments.flatMap((item: any) => appointmentCrmHistory(item));
    const timeline = [
      ...sorted.map((item: any) => ({
        type: 'booking',
        at: appointmentStamp(item),
        title: bookingStatusLabel(item.status),
        detail: `${item.service_name || item.metadata?.serviceName || primaryService || 'Atendimento'} · ${appointmentDateValue(item) || 'sem data'} às ${item.requested_time || item.time || '--:--'}`
      })),
      ...crmHistory.map((event: any) => ({
        type: 'crm',
        at: event.at || '',
        title: event.type === 'reactivation' ? 'Reativação registrada' : event.type === 'tags_updated' ? 'Tags atualizadas' : 'Evento CRM',
        detail: event.note || event.channel || event.message || 'Registro operacional'
      }))
    ].sort((a: any, b: any) => String(b.at || '').localeCompare(String(a.at || ''))).slice(0, 18);
    const reactivationMessage = `Olá, ${profile.name}! Tudo bem? Aqui é da ${businessName}. Percebi que já faz um tempo desde seu último atendimento. Quer que eu veja um horário para você esta semana?`;
    return {
      ...profile,
      latest,
      upcoming,
      lastDate,
      lastDays,
      statusKey,
      statusLabel,
      tags: uniqueTextList([...manualTags, ...crmAutoTags({ statusLabel, total: profile.appointments.length, valueTotal, completedCount, cancelledCount, lastDays, upcoming })]),
      manualTags,
      crmHistory,
      timeline,
      reactivationMessage,
      completedCount,
      cancelledCount,
      total: profile.appointments.length,
      topService: serviceRank[0]?.[0] || 'Atendimento',
      valueTotal,
      internalNote: latest.internal_note || latest.metadata?.internalNote || profile.appointments.find((item: any) => item.internal_note)?.internal_note || ''
    };
  }).sort((a: any, b: any) => appointmentStamp(b.latest).localeCompare(appointmentStamp(a.latest)));
  const customerSearch = query.trim().toLowerCase();
  const filteredCustomerProfiles = customerProfiles.filter((profile: any) => {
    const byStatus = clientStatusFilter === 'all' || profile.statusKey === clientStatusFilter;
    const byTag = clientTagFilter === 'all' || profile.tags.includes(clientTagFilter);
    const haystack = `${profile.name} ${profile.phone} ${profile.email} ${profile.topService} ${profile.statusLabel} ${profile.tags.join(' ')}`.toLowerCase();
    return byStatus && byTag && (!customerSearch || haystack.includes(customerSearch));
  });
  const customerTags = uniqueTextList(customerProfiles.flatMap((profile: any) => profile.tags)).sort((a, b) => a.localeCompare(b));
  const recurringCustomers = customerProfiles.filter((profile: any) => profile.statusKey === 'recurring');
  const vipCustomers = customerProfiles.filter((profile: any) => profile.statusKey === 'vip' || profile.tags.includes('VIP'));
  const noReturnCustomers = customerProfiles.filter((profile: any) => profile.statusKey === 'no_return');
  const inactiveCustomers = customerProfiles.filter((profile: any) => profile.statusKey === 'inactive');
  const customerRankings = {
    frequent: [...customerProfiles].sort((a: any, b: any) => b.total - a.total).slice(0, 4),
    revenue: [...customerProfiles].sort((a: any, b: any) => b.valueTotal - a.valueTotal).slice(0, 4),
    noReturn: [...customerProfiles].filter((profile: any) => profile.statusKey === 'no_return' || profile.statusKey === 'inactive').sort((a: any, b: any) => b.lastDays - a.lastDays).slice(0, 4),
    cancelled: [...customerProfiles].filter((profile: any) => profile.cancelledCount > 0).sort((a: any, b: any) => b.cancelledCount - a.cancelledCount).slice(0, 4),
  };
  const customerNextActions = [
    noReturnCustomers.length || inactiveCustomers.length ? `Reativar ${noReturnCustomers.length + inactiveCustomers.length} cliente(s) sem retorno.` : 'Nenhum cliente parado crítico no momento.',
    pending.length ? `Confirmar ${pending.length} agendamento(s) pendente(s).` : 'Sem pendências de confirmação.',
    vipCustomers.length ? `${vipCustomers.length} cliente(s) VIP merecem acompanhamento próximo.` : recurringCustomers.length ? `${recurringCustomers.length} cliente(s) recorrente(s) podem receber oferta de retorno.` : 'Quando clientes repetirem, eles aparecerão como recorrentes.'
  ];
  const customerProfileText = (profile: any) => `AgendaPro — Cliente 360º\nNegócio: ${businessName}\nCliente: ${profile.name}\nWhatsApp: ${profile.phone || 'não informado'}\nE-mail: ${profile.email || 'não informado'}\nStatus: ${profile.statusLabel}\nTags: ${profile.tags?.join(', ') || 'sem tags'}\nAgendamentos: ${profile.total}\nConcluídos: ${profile.completedCount}\nCancelados: ${profile.cancelledCount}\nÚltimo serviço: ${profile.topService}\nÚltima data: ${profile.lastDate || 'sem data'}\nPróximo atendimento: ${profile.upcoming ? `${appointmentDateValue(profile.upcoming)} às ${profile.upcoming.requested_time || profile.upcoming.time || '--:--'}` : 'não agendado'}\nReceita estimada: ${currency(profile.valueTotal)}\nObservação interna: ${profile.internalNote || 'sem observação'}`;
  const copyCustomerProfile = async (profile: any) => {
    await navigator.clipboard?.writeText(customerProfileText(profile));
    pushToast({ tone: 'success', title: 'Cliente copiado', message: 'Resumo 360º copiado para a área de transferência.' });
  };
  const saveCustomerInternalNote = async (profile: any) => {
    const target = profile.latest || profile.appointments?.[0];
    if (!target?.id) return pushToast({ tone: 'warning', title: 'Sem agendamento vinculado', message: 'Este cliente ainda não possui um registro editável no banco.' });
    const internalNote = window.prompt('Observação interna do cliente', profile.internalNote || '') || '';
    if (!internalNote.trim() && !profile.internalNote) return;
    await updateAppointmentStatus(target.id, cleanStatus(target.status) as any, { internalNote, confirm: false });
    setSelectedCustomer((current: any | null) => current?.key === profile.key ? { ...current, internalNote } : current);
  };
  const saveCustomerTags = async (profile: any, nextTags: string[], note = 'Tags do cliente atualizadas') => {
    const target = profile.latest || profile.appointments?.[0];
    if (!target?.id) return pushToast({ tone: 'warning', title: 'Sem agendamento vinculado', message: 'Este cliente ainda não possui um registro editável no banco.' });
    const cleanTags = uniqueTextList(nextTags).slice(0, 12);
    await updateAppointmentStatus(target.id, cleanStatus(target.status) as any, { clientTags: cleanTags, crmEvent: { type: 'tags_updated', note: cleanTags.join(', ') }, confirm: false, successMessage: note });
    setSelectedCustomer((current: any | null) => current?.key === profile.key ? { ...current, manualTags: cleanTags, tags: uniqueTextList([...cleanTags, ...current.tags.filter((tag: string) => !current.manualTags?.includes(tag))]) } : current);
  };
  const addCustomerTag = async (profile: any) => {
    const tag = window.prompt('Nova tag do cliente', '');
    if (!tag?.trim()) return;
    await saveCustomerTags(profile, [...(profile.manualTags || []), tag], 'Tag adicionada ao cliente.');
  };
  const removeCustomerTag = async (profile: any, tag: string) => {
    if (!profile.manualTags?.includes(tag)) return;
    await saveCustomerTags(profile, profile.manualTags.filter((item: string) => item !== tag), 'Tag removida do cliente.');
  };
  const registerCustomerReactivation = async (profile: any, channel: 'copy' | 'whatsapp') => {
    const target = profile.latest || profile.appointments?.[0];
    if (!target?.id) return;
    await updateAppointmentStatus(target.id, cleanStatus(target.status) as any, { crmEvent: { type: 'reactivation', channel, message: profile.reactivationMessage }, confirm: false, successMessage: 'Tentativa de reativacao registrada no CRM.' });
  };
  const copyReactivationMessage = async (profile: any) => {
    await navigator.clipboard?.writeText(profile.reactivationMessage);
    await registerCustomerReactivation(profile, 'copy');
  };
  const openCustomerReactivationWhatsApp = async (profile: any) => {
    const clean = String(profile.phone || '').replace(/\D/g, '');
    if (!clean) return pushToast({ tone: 'warning', title: 'WhatsApp ausente', message: 'Este cliente não tem WhatsApp cadastrado.' });
    await registerCustomerReactivation(profile, 'whatsapp');
    const target = clean.startsWith('55') ? clean : `55${clean}`;
    window.open(`https://wa.me/${target}?text=${encodeURIComponent(profile.reactivationMessage)}`, '_blank');
  };

  return <section className="real-agenda-dashboard real-agenda-dashboard-plus premium-motion-scope">
    <aside className="real-agenda-sidebar">
      <a className="real-agenda-brand" href="#/conta/painel"><span><CalendarCheck size={20}/></span><b>AgendaPro</b></a>
      <small>{businessName}</small>
      <div className="real-agenda-mode"><span>Modo de uso</span><strong>Gestor</strong></div>
      <nav>{navItems.map(([label, Icon]) => <button key={label} type="button" className={section === label ? 'active' : ''} onClick={() => setSection(label)}><Icon size={18}/>{label}</button>)}</nav>
      <button className="real-agenda-exit" type="button" onClick={() => window.location.hash = '#/conta/painel'}><LogOut size={18}/> Voltar à conta</button>
    </aside>

    <main className="real-agenda-main">
      <header className="real-agenda-topbar dashboard-demo-topbar">
        <div><Badge tone={published ? 'green' : 'amber'}>{published ? 'Agenda publicada' : 'Rascunho'}</Badge><h1>{section}</h1><p>{businessName} • {businessSegment} • protegido para {account.email}</p></div>
        <div className="real-agenda-top-actions"><button className="btn secondary compact" onClick={() => loadDashboard(true)} disabled={loading}>{loading ? 'Sincronizando...' : 'Sincronizar'}</button><button className="btn secondary compact">Todas as unidades</button><button className="btn secondary compact">{businessName}</button><a className="btn secondary compact" href={presentationLink}>Página pública</a></div>
      </header>

      {section === 'Início' && <>
        <section className="business-dashboard-hero">
          <div className="business-hero-copy">
            <span className="eyebrow"><Sparkles size={16}/> Painel executivo da empresa</span>
            <h2>{greeting}. Aqui está o controle diário da {businessName}.</h2>
            <p>Veja plano, publicação, link público, próximos horários e pendências sem precisar caçar informação em menus diferentes.</p>
            <div className="business-hero-actions">
              <button className="btn primary" onClick={() => copy(bookingLink)}>Copiar link público</button>
              <a className="btn secondary" href={bookingLink} target="_blank" rel="noopener noreferrer">Abrir agenda</a>
              <button className="btn secondary" onClick={() => setSection('Agendamentos')}>Ver agendamentos</button>
            </div>
          </div>
          <div className="business-hero-card">
            <Badge tone={published && activePlan ? 'green' : activePlan ? 'blue' : 'amber'}>{published && activePlan ? 'Operação ativa' : 'Atenção operacional'}</Badge>
            <strong><AnimatedNumber value={healthScore} suffix="%"/></strong>
            <span>saúde operacional</span>
            <small>{publicationReadiness.score}% de prontidão · {appointments.length} solicitação(ões)</small>
          </div>
        </section>

        <section className="business-status-ribbon">
          <article>
            <span>Plano</span>
            <b>{planHeadline}</b>
            <small>{account.planName || 'Plano não identificado'} · {statusLabel(account.paymentStatus)}</small>
            <Badge tone={planBadgeTone as any}>{activePlan ? 'Liberado' : 'Verificar'}</Badge>
          </article>
          <article>
            <span>Agenda</span>
            <b>{agendaHeadline}</b>
            <small>{published ? 'Link público disponível' : `${publicationReadiness.score}% de prontidão`}</small>
            <Badge tone={published ? 'green' : publicationReadiness.canPublish ? 'blue' : 'amber'}>{published ? 'Publicada' : 'Rascunho'}</Badge>
          </article>
          <article>
            <span>Hoje</span>
            <b><AnimatedNumber value={todayAppointments.length}/> agendamento(s)</b>
            <small>{freeToday} horário(s) livre(s) · {busyToday} ocupado(s)</small>
            <Badge tone={todayAppointments.length ? 'green' : 'blue'}>{todayAppointments.length ? 'Movimento' : 'Livre'}</Badge>
          </article>
          <article>
            <span>Pendências</span>
            <b>{dashboardAlerts.length ? <AnimatedNumber value={dashboardAlerts.length}/> : 'Tudo certo'}</b>
            <small>{dashboardAlerts.length ? 'itens para revisar' : 'operação sem alertas críticos'}</small>
            <Badge tone={dashboardAlerts.length ? 'amber' : 'green'}>{dashboardAlerts.length ? 'Atenção' : 'OK'}</Badge>
          </article>
        </section>

        <motion.section className="visual-intelligence-board" {...fade}>
          <div className="visual-intelligence-head">
            <span className="eyebrow"><Activity size={16}/> Inteligência visual</span>
            <h3>Dados rápidos para decidir sem esforço.</h3>
            <p>Métricas calculadas a partir da agenda atual, sem inventar números externos.</p>
          </div>
          <div className="visual-intelligence-grid">
            {smartSignals.map(signal => <article key={signal.label} className={`smart-signal-card tone-${signal.tone}`}>
              <span>{signal.label}</span>
              <b><AnimatedNumber value={signal.value} prefix={signal.prefix} suffix={signal.suffix}/></b>
              <small>{signal.hint}</small>
              <div className="smart-progress"><i style={{ width: `${Math.min(100, Math.max(4, signal.value))}%` }}/></div>
            </article>)}
            <article className="smart-signal-card smart-signal-wide">
              <span>Tendência operacional</span>
              <b>{appointments.length ? 'Fluxo ativo' : 'Aguardando dados'}</b>
              <small>Pendentes, confirmados, concluídos, livres e receita estimada em uma leitura compacta.</small>
              <MiniSparkline values={visualTrend}/>
            </article>
          </div>
        </motion.section>

        <section className="business-command-grid">
          <article className="business-panel business-panel-main">
            <div className="panel-heading"><div><h3>Próximos agendamentos</h3><p>Agenda compacta para o uso diário da empresa.</p></div><button onClick={() => setSection('Agendamentos')}>Gerenciar</button></div>
            {nextAppointments.length ? <div className="business-next-list">{nextAppointments.map(item => <button key={item.id || `${item.customer_phone}-${item.requested_time}`} onClick={() => setSelectedBooking(item)}>
              <strong>{item.requested_time || item.time || '--:--'}</strong>
              <span><b>{item.customer_name || item.name || 'Cliente'}</b><small>{item.service_name || primaryService} · {item.requested_date || item.date || 'sem data'}</small></span>
              <em className={`status-${cleanStatus(item.status)}`}>{bookingStatusLabel(item.status)}</em>
            </button>)}</div> : <div className="business-empty-state"><CalendarClock/><b>Nenhum próximo agendamento</b><span>Compartilhe o link público para começar a receber solicitações.</span><button className="btn primary compact" onClick={() => copy(bookingLink)}>Copiar link</button></div>}
          </article>

          <article className="business-panel public-link-panel">
            <Badge tone="blue">Link público</Badge>
            <h3>Compartilhe sua agenda</h3>
            <p>{publicUrlShort}</p>
            <button className="btn primary full" onClick={() => copy(bookingLink)}>Copiar link</button>
            <button className="btn secondary full" onClick={() => navigator.clipboard?.writeText(publicShareMessage).then(() => pushToast({ tone: 'success', title: 'Mensagem copiada', message: 'Texto para WhatsApp copiado.' }))}>Copiar mensagem</button>
            <a className="btn secondary full" href={`https://wa.me/?text=${encodeURIComponent(publicShareMessage)}`} target="_blank" rel="noopener noreferrer">Compartilhar WhatsApp</a>
          </article>
        </section>

        <section className="business-command-grid lower">
          <article className="business-panel">
            <div className="panel-heading"><div><h3>Pendências importantes</h3><p>O que mais impacta sua operação agora.</p></div><button onClick={() => setSection('Onboarding')}>Checklist</button></div>
            {dashboardAlerts.length ? <div className="business-alert-list">{dashboardAlerts.slice(0, 5).map((alert, index) => <button key={`${alert.title}-${index}`} onClick={() => alert.title.toLowerCase().includes('agenda') ? setSection('Onboarding') : alert.title.toLowerCase().includes('pendente') ? setSection('Agendamentos') : setSection('Configurações')}>
              <Badge tone={alert.tone as any}>{String(index + 1).padStart(2, '0')}</Badge>
              <span><b>{alert.title}</b><small>{alert.text}</small></span>
              <ArrowRight size={16}/>
            </button>)}</div> : <div className="business-empty-state compact"><CheckCircle2/><b>Nenhuma pendência crítica</b><span>Continue acompanhando os agendamentos e divulgue o link público.</span></div>}
          </article>

          <article className="business-panel quick-actions-panel">
            <h3>Ações rápidas</h3>
            <button onClick={() => setSection('Agendamentos')}><CalendarCheck size={18}/><span>Gerenciar agendamentos</span></button>
            <button onClick={() => setSection('Mensagens')}><MessageSquareText size={18}/><span>Mensagens prontas</span></button>
            <button onClick={() => setSection('Disponibilidade')}><Clock size={18}/><span>Ajustar horários</span></button>
            <button onClick={() => setSection('Onboarding')}><Rocket size={18}/><span>Ver prontidão</span></button>
          </article>

          <article className="business-panel mini-metrics-panel">
            <h3>Indicadores rápidos</h3>
            <div><span>Conversão</span><b>{conversion}%</b></div>
            <div><span>Ocupação</span><b>{occupation}%</b></div>
            <div><span>Receita estimada</span><b>{currency(revenue)}</b></div>
            <div><span>Clientes</span><b>{clients.length}</b></div>
          </article>
        </section>
      </>}

      {section === 'Onboarding' && <section className="smart-onboarding-grid"><article className="real-panel smart-publication-panel"><div className="panel-heading"><div><Badge tone={publicationReadiness.tone}>Sprint 11</Badge><h3>Publicação inteligente</h3><p>O AgendaPro analisa a agenda antes de liberar o link público, evitando páginas sem serviço, profissional, horário ou contato.</p></div><strong className={`publication-score ${publicationReadiness.status}`}>{publicationReadiness.score}%</strong></div><div className="smart-publish-progress"><i style={{ width: `${publicationReadiness.score}%` }} /></div><div className="publication-status-line"><b>{publicationReadiness.label}</b><span>{publicationReadiness.canPublish ? 'Todos os itens obrigatórios estão prontos.' : `${publicationReadiness.missing.filter(item => item.required).length} pendência(s) obrigatória(s).`}</span></div><div className="smart-publish-list dashboard-mode">{publicationReadiness.issues.map(item => <a key={item.key} className={item.ok ? 'done' : item.required ? 'required' : ''} href="#/conta/criar-agenda"><span>{item.ok ? <CheckCircle2 size={17}/> : <AlertTriangle size={17}/>}</span><b>{item.title}</b><small>{item.description}</small>{!item.ok && <em>{item.actionLabel}</em>}</a>)}</div></article><article className="real-panel"><h3>Próxima melhor ação</h3><p>{!publicationReadiness.canPublish ? 'Corrija as pendências obrigatórias antes de divulgar a agenda.' : !published ? 'A agenda está pronta. Publique para liberar os links.' : appointments.length ? 'Confirme as solicitações pendentes.' : 'Divulgue o link público para receber os primeiros agendamentos.'}</p><a className="btn primary full" href={!published ? '#/conta/criar-agenda' : bookingLink}>{!published ? (publicationReadiness.canPublish ? 'Publicar agenda' : 'Corrigir pendências') : 'Abrir agendamento'}</a><a className="btn secondary full" href={presentationLink} target="_blank" rel="noopener noreferrer">Ver prévia pública</a></article><article className="real-panel"><Badge tone="blue">Setup operacional</Badge><h3>Checklist geral</h3><div className="dashboard-step-list compact">{onboardingSteps.map(([title, desc, ok], index) => <div key={String(title)} className={ok ? 'done' : ''}><strong>{String(index + 1).padStart(2, '0')}</strong><span><b>{title}</b><small>{desc}</small></span><CheckCircle2 size={20}/></div>)}</div></article></section>}

      {section === 'Agendamentos' && <section className="booking-management-shell">
        <div className="booking-management-hero">
          <div><Badge tone="purple">Sprint 08</Badge><h2>Gestão real dos agendamentos</h2><p>Receba, filtre, confirme, remarque, conclua, cancele e audite cada solicitação enviada pela página pública.</p></div>
          <div className="booking-hero-actions"><button className="btn secondary compact" onClick={() => loadDashboard(true)} disabled={loading}>{loading ? 'Sincronizando...' : 'Atualizar dados'}</button><button className="btn primary compact" onClick={() => copy(bookingLink)}>Copiar link público</button></div>
        </div>
        <div className="booking-kpi-strip">
          <article><span>Hoje</span><b><AnimatedNumber value={todayAppointments.length}/></b><small>agendamento(s)</small></article>
          <article><span>Pendentes</span><b><AnimatedNumber value={pending.length}/></b><small>aguardando ação</small></article>
          <article><span>Confirmados</span><b><AnimatedNumber value={confirmed.length + rescheduled.length}/></b><small>agenda ocupada</small></article>
          <article><span>Concluídos</span><b><AnimatedNumber value={completed.length}/></b><small>atendimentos feitos</small></article>
          <article><span>Cancelados</span><b><AnimatedNumber value={cancelled.length + refused.length + absent.length}/></b><small>baixados/recusados</small></article>
        </div>
        <article className="real-panel booking-management-panel">
          <div className="booking-toolbar">
            <div className="booking-filter-pills">{[['todos','Todos'],['pending','Pendentes'],['confirmed','Confirmados'],['rescheduled','Remarcados'],['completed','Concluídos'],['cancelled','Cancelados']].map(([id,label]) => <button key={id} className={statusFilter === id ? 'active' : ''} onClick={() => setStatusFilter(id)}>{label}</button>)}</div>
            <label className="real-search"><Search size={16}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por nome, WhatsApp, serviço, profissional..." /></label>
          </div>
          {filteredAppointments.length ? <div className="booking-list">{filteredAppointments.map(item => { const statusKey = cleanStatus(item.status); return <article key={item.id || `${item.customer_phone}-${item.requested_date}-${item.requested_time}`} className={`booking-row-card status-${statusKey}`}>
            <div className="booking-row-time"><b>{item.requested_time || item.time || '--:--'}</b><span>{item.requested_date || item.date || 'sem data'}</span></div>
            <div className="booking-row-main"><strong>{item.customer_name || item.name || 'Cliente'}</strong><span>{item.service_name || primaryService} {item.professional_name ? `• ${item.professional_name}` : ''}</span><small>{item.customer_phone || item.phone || 'sem WhatsApp'} {item.customer_email ? `• ${item.customer_email}` : ''}</small>{item.internal_note && <em>Obs. interna: {item.internal_note}</em>}</div>
            <div className="booking-row-status"><span className={`booking-status-pill status-${statusKey}`}>{bookingStatusLabel(item.status)}</span><small>{item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : 'Recebido'}</small></div>
            <div className="booking-row-actions"><button onClick={() => setSelectedBooking(item)}>Detalhes</button>{['pending','refused'].includes(statusKey) && <button disabled={bookingActionLoading === `${item.id}:confirmed`} onClick={() => updateAppointmentStatus(item.id, 'confirmed')}>Confirmar</button>}{['pending','confirmed','rescheduled'].includes(statusKey) && <button onClick={() => rescheduleAppointment(item)}>Remarcar</button>}{['confirmed','rescheduled'].includes(statusKey) && <button onClick={() => updateAppointmentStatus(item.id, 'completed')}>Concluir</button>}{!['cancelled','completed'].includes(statusKey) && <button className="danger" onClick={() => cancelAppointment(item)}>Cancelar</button>}<button onClick={() => copyBookingSummary(item)}>Copiar</button><button onClick={() => openWhatsApp(item.customer_phone || item.phone, item.customer_name || item.name)}>WhatsApp</button></div>
          </article>; })}</div> : <div className="real-empty"><CalendarClock/><b>{query || statusFilter !== 'todos' ? 'Nenhum resultado encontrado' : 'Nenhum agendamento recebido ainda'}</b><span>{query || statusFilter !== 'todos' ? 'Tente limpar filtros ou buscar por outro termo.' : 'Compartilhe seu link público para começar a receber horários.'}</span><a className="btn primary compact" href={bookingLink}>Abrir página de agendamento</a></div>}
        </article>
      </section>}

      {section === 'Agenda' && <section className="real-panel"><div className="panel-heading"><div><h3>Agenda operacional de hoje</h3><p>Horários reais gerados pela disponibilidade da agenda. Livres, ocupados e bloqueados aparecem no mesmo quadro.</p></div><div className="real-button-row"><button onClick={blockQuickTime}>Bloquear horário</button><a className="btn secondary compact" href={bookingLink}>Abrir agendamento</a></div></div><div className="availability-kpis"><article><b>{freeToday}</b><span>livres hoje</span></article><article><b>{busyToday}</b><span>ocupados/bloqueados</span></article><article><b>{pending.length}</b><span>pendentes</span></article><article><b>{confirmed.length}</b><span>confirmados</span></article></div><div className="real-time-grid agenda-board-grid">{liveSlots.length ? liveSlots.map(slot => { const item = appointments.find(appt => (appt.requested_date || dateKey()) === todayKey && (appt.requested_time || appt.time) === slot.time); return <article key={slot.time} className={!slot.available ? 'busy' : ''}><b>{slot.time}</b><span>{item?.customer_name || item?.name || (slot.available ? 'Horário livre' : slot.reason)}</span><small>{item?.service_name || (slot.available ? 'Disponível para agendamento' : slot.status)}</small>{item?.id && <button onClick={() => updateAppointmentStatus(item.id, 'confirmed')}>Confirmar</button>}</article>; }) : <div className="real-empty"><CalendarClock/><b>Dia sem horários gerados</b><span>Confira as configurações de disponibilidade.</span></div>}</div></section>}

      {section === 'Recepção' && <section className="real-dashboard-grid"><article className="real-panel large"><h3>Fila da recepção</h3><p>Solicitações que precisam de triagem, confirmação ou contato.</p>{pending.length ? pending.map(item => <div className="real-appointment-row detailed" key={item.id}><strong>{item.requested_time || '--:--'}</strong><div><b>{item.customer_name}</b><span>{item.service_name || primaryService}</span><small>{item.customer_phone}</small></div><em>{statusLabel(item.status)}</em><button onClick={() => updateAppointmentStatus(item.id, 'confirmed')}>Confirmar</button><button onClick={() => updateAppointmentStatus(item.id, 'refused')}>Recusar</button><button onClick={() => updateAppointmentStatus(item.id, 'cancelled')}>Cancelar</button><button onClick={() => rescheduleAppointment(item)}>Reagendar</button><button onClick={() => openWhatsApp(item.customer_phone, item.customer_name)}>WhatsApp</button></div>) : <div className="real-empty"><ClipboardList/><b>Nenhuma pendência</b><span>A recepção está organizada no momento.</span></div>}</article><article className="real-panel"><h3>Ações de recepção</h3><ul className="real-action-list"><li><MousePointerClick size={18}/> Confirmar solicitações novas.</li><li><MessageSquareText size={18}/> Chamar clientes sem resposta.</li><li><ListChecks size={18}/> Organizar lista de espera.</li><li><Clock size={18}/> Ver horários livres.</li></ul></article></section>}

      {section === 'Profissional' && <section className="real-dashboard-grid"><article className="real-panel large"><h3>Visão do profissional</h3><p>Atendimentos confirmados, serviços e clientes do dia.</p>{confirmed.length || completed.length ? [...confirmed, ...completed].slice(0, 8).map(item => <div className="real-appointment-row" key={item.id}><strong>{item.requested_time || '--:--'}</strong><div><b>{item.customer_name}</b><span>{item.service_name || primaryService}</span><small>{item.notes || 'Sem observação clínica/operacional.'}</small></div><em className={`status-${cleanStatus(item.status)}`}>{statusLabel(item.status)}</em><button onClick={() => updateAppointmentStatus(item.id, 'completed')}>Concluir</button><button onClick={() => updateAppointmentStatus(item.id, 'cancelled')}>Cancelar</button><button onClick={() => updateAppointmentStatus(item.id, 'absent')}>Faltou</button><button onClick={() => rescheduleAppointment(item)}>Reagendar</button><button onClick={() => openWhatsApp(item.customer_phone, item.customer_name)}>WhatsApp</button></div>) : <div className="real-empty"><UserPlus/><b>Nenhum atendimento confirmado</b><span>Confirme solicitações para aparecerem na visão profissional.</span></div>}</article><article className="real-panel"><h3>Profissionais ativos</h3>{team.length ? team.map((member: any, index: number) => <div className="mini-dashboard-row" key={index}><UsersRound size={18}/><span><b>{member.name}</b><small>{member.role || 'Profissional'} • {member.whatsapp || 'WhatsApp não informado'}</small></span></div>) : <p>Nenhum profissional cadastrado.</p>}</article></section>}

      {section === 'Clientes' && <section className="client-management-pro-section">
        <div className="client-management-hero">
          <div className="client-management-bg" aria-hidden="true"><svg viewBox="0 0 620 240"><path d="M28 184 C128 56 210 204 306 94 S474 34 590 120"/><path d="M42 206 C150 138 230 156 324 126 S470 80 590 48"/></svg></div>
          <div><Badge tone="green">Cliente 360º</Badge><h3>Gestão real dos clientes que agendam com {businessName}.</h3><p>Agrupamento automático por WhatsApp, e-mail ou nome, com histórico, recorrência, último atendimento, próximo horário e ações rápidas.</p></div>
          <div className="client-management-actions"><button onClick={() => copyCustomerProfile(customerProfiles[0])} disabled={!customerProfiles.length}><FileText size={16}/> Copiar destaque</button><button onClick={() => loadDashboard(true)}><RefreshCcw size={16}/> Atualizar</button></div>
        </div>
        <div className="client-kpi-grid">
          <article><UsersRound/><span>Clientes únicos</span><b>{customerProfiles.length}</b><small>gerados pelos agendamentos</small></article>
          <article><Star/><span>Recorrentes</span><b>{recurringCustomers.length}</b><small>com 2+ agendamentos</small></article>
          <article><Clock3/><span>Sem retorno</span><b>{noReturnCustomers.length}</b><small>último contato há 30+ dias</small></article>
          <article><CreditCard/><span>Receita estimada</span><b>{currency(customerProfiles.reduce((sum: number, profile: any) => sum + profile.valueTotal, 0))}</b><small>baseada no histórico</small></article>
        </div>
        <div className="client-management-toolbar">
          <div className="real-search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nome, WhatsApp, e-mail ou serviço" /></div>
          <select value={clientStatusFilter} onChange={event => setClientStatusFilter(event.target.value as any)}><option value="all">Todos os clientes</option><option value="new">Novos</option><option value="active">Ativos</option><option value="recurring">Recorrentes</option><option value="vip">VIP</option><option value="no_return">Sem retorno</option><option value="inactive">Inativos</option></select>
          <select value={clientTagFilter} onChange={event => setClientTagFilter(event.target.value)}><option value="all">Todas as tags</option>{customerTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}</select>
        </div>
        <div className="client-ranking-grid">
          <article><span>Mais frequentes</span>{customerRankings.frequent.length ? customerRankings.frequent.map((profile: any) => <button key={profile.key} onClick={() => setSelectedCustomer(profile)}><b>{profile.name}</b><small>{profile.total} agendamento(s)</small></button>) : <small>Sem histÃ³rico suficiente</small>}</article>
          <article><span>Maior receita</span>{customerRankings.revenue.length ? customerRankings.revenue.map((profile: any) => <button key={profile.key} onClick={() => setSelectedCustomer(profile)}><b>{profile.name}</b><small>{currency(profile.valueTotal)}</small></button>) : <small>Sem receita estimada</small>}</article>
          <article><span>Sem retorno</span>{customerRankings.noReturn.length ? customerRankings.noReturn.map((profile: any) => <button key={profile.key} onClick={() => setSelectedCustomer(profile)}><b>{profile.name}</b><small>{profile.lastDays} dia(s)</small></button>) : <small>Nenhum cliente parado</small>}</article>
          <article><span>Cancelamentos</span>{customerRankings.cancelled.length ? customerRankings.cancelled.map((profile: any) => <button key={profile.key} onClick={() => setSelectedCustomer(profile)}><b>{profile.name}</b><small>{profile.cancelledCount} cancelado(s)</small></button>) : <small>Sem cancelamentos relevantes</small>}</article>
        </div>
        <div className="client-management-grid">
          <article className="client-list-panel">
            <div className="panel-heading"><div><h3>Carteira de clientes</h3><p>{filteredCustomerProfiles.length} cliente(s) encontrado(s).</p></div></div>
            {filteredCustomerProfiles.length ? <div className="client-profile-list">{filteredCustomerProfiles.map((profile: any) => <button key={profile.key} className={selectedCustomer?.key === profile.key ? 'active' : ''} onClick={() => setSelectedCustomer(profile)}>
              <span className="client-avatar-pro">{String(profile.name || 'CL').slice(0, 2).toUpperCase()}</span>
              <div><b>{profile.name}</b><small>{profile.phone || profile.email || 'Contato não informado'} • {profile.topService}</small><em>{profile.total} agendamento(s) • {profile.statusLabel}</em><span className="client-tag-row">{profile.tags.slice(0, 4).map((tag: string) => <strong key={tag}>{tag}</strong>)}</span></div>
              <i>{profile.lastDate ? new Date(`${profile.lastDate}T12:00:00`).toLocaleDateString('pt-BR') : 'sem data'}</i>
            </button>)}</div> : <div className="client-empty-pro"><UsersRound/><b>Nenhum cliente encontrado</b><span>Quando os primeiros agendamentos chegarem, a carteira será montada automaticamente.</span></div>}
          </article>
          <article className="client-insight-panel">
            <Badge tone="blue">Ações inteligentes</Badge><h3>Próximos movimentos</h3><ul className="real-action-list compact">{customerNextActions.map(action => <li key={action}><Sparkles size={17}/> {action}</li>)}</ul>
            <div className="client-mini-chart"><svg viewBox="0 0 260 90"><polyline points="0,70 42,48 84,56 126,32 168,44 210,20 260,28"/></svg></div>
          </article>
          <article className="client-insight-panel featured">
            {selectedCustomer ? <><Badge tone="green">Visão 360º</Badge><h3>{selectedCustomer.name}</h3><p>{selectedCustomer.statusLabel} • {selectedCustomer.total} agendamento(s) • {currency(selectedCustomer.valueTotal)} estimado(s).</p><div className="client-detail-mini"><span><b>WhatsApp</b>{selectedCustomer.phone || 'Não informado'}</span><span><b>E-mail</b>{selectedCustomer.email || 'Não informado'}</span><span><b>Última data</b>{selectedCustomer.lastDate || 'Sem data'}</span><span><b>Próximo</b>{selectedCustomer.upcoming ? `${appointmentDateValue(selectedCustomer.upcoming)} às ${selectedCustomer.upcoming.requested_time || selectedCustomer.upcoming.time || '--:--'}` : 'Sem próximo horário'}</span></div><div className="client-crm-tags">{selectedCustomer.tags.map((tag: string) => <button key={tag} type="button" className={selectedCustomer.manualTags?.includes(tag) ? 'manual' : ''} onClick={() => removeCustomerTag(selectedCustomer, tag)}>{tag}</button>)}<button type="button" onClick={() => addCustomerTag(selectedCustomer)}>+ tag</button></div><div className="client-reactivation-box"><b>Mensagem de reativação</b><p>{selectedCustomer.reactivationMessage}</p><div><button onClick={() => copyReactivationMessage(selectedCustomer)}>Copiar</button><button onClick={() => openCustomerReactivationWhatsApp(selectedCustomer)}>WhatsApp</button></div></div><div className="client-crm-timeline">{selectedCustomer.timeline.slice(0, 6).map((event: any, index: number) => <span key={`${event.type}-${index}`}><b>{event.title}</b><small>{event.detail}</small></span>)}</div><div className="client-actions-row"><button onClick={() => openWhatsApp(selectedCustomer.phone, selectedCustomer.name)}>WhatsApp</button><button onClick={() => copyCustomerProfile(selectedCustomer)}>Copiar resumo</button><button onClick={() => saveCustomerInternalNote(selectedCustomer)}>Observação</button></div></> : <><Badge tone="amber">Selecione um cliente</Badge><h3>Abra uma visão completa</h3><p>Clique em um cliente da lista para ver contato, histórico, próximo horário e ações rápidas.</p></>}
          </article>
        </div>
      </section>}

      {section === 'Serviços' && <section className="team-services-pro-section premium-service-motion">
        <div className="service-pro-hero"><div><Badge tone="green">Serviços Pro</Badge><h3>Catálogo operacional da agenda</h3><p>Edite serviços, preço, duração, status e destaque público sem sair do painel. A página pública usa estes dados para orientar o cliente final.</p></div><div className="real-button-row"><button className="btn secondary compact" onClick={addLocalService}>Adicionar serviço</button><button className="btn primary compact" onClick={saveTeamServices}>Salvar serviços</button></div></div>
        <div className="service-pro-kpis"><article><FileText/><b>{localServices.length}</b><span>serviços</span></article><article><BadgeCheck/><b>{localServices.filter(s => serviceStatus(s) === 'ativo').length}</b><span>ativos</span></article><article><Star/><b>{localServices.filter(s => s?.highlight).length}</b><span>destaques</span></article><article><Clock/><b>{localServices.reduce((sum, s) => sum + (serviceDurationMinutes(s) || 0), 0)}</b><span>minutos somados</span></article></div>
        {serviceHealthAlerts.length ? <div className="service-pro-alert"><AlertTriangle size={18}/><div><b>Ajustes recomendados</b>{serviceHealthAlerts.map(item => <span key={item}>{item}</span>)}</div></div> : <div className="service-pro-alert success"><CheckCircle2 size={18}/><div><b>Catálogo pronto</b><span>Serviços, equipe e disponibilidade possuem dados suficientes para operar.</span></div></div>}
        <div className="service-editor-grid">{localServices.length ? localServices.map((service: any, index: number) => <article className="service-editor-card" key={service.id || index}><div className="service-card-top"><FileText/><Badge tone={serviceStatus(service) === 'ativo' ? 'green' : 'amber'}>{serviceStatus(service)}</Badge></div><label><span>Nome</span><input value={service.name || ''} onChange={e => updateLocalService(index, { name: e.target.value })}/></label><label><span>Categoria</span><input value={service.category || 'Geral'} onChange={e => updateLocalService(index, { category: e.target.value })}/></label><div className="mini-form-grid"><label><span>Duração</span><input value={service.durationMinutes || service.duration || '60'} onChange={e => updateLocalService(index, { duration: e.target.value, durationMinutes: e.target.value })}/></label><label><span>Preço</span><input value={service.price || service.value || '0'} onChange={e => updateLocalService(index, { price: e.target.value, value: e.target.value })}/></label></div><div className="mini-form-grid"><label><span>Ordem</span><input value={service.order || index + 1} onChange={e => updateLocalService(index, { order: e.target.value })}/></label><label><span>Profissionais vinculados</span><input value={service.professionalsText || ''} placeholder="Ex: Ana, Mateus" onChange={e => updateLocalService(index, { professionalsText: e.target.value, professionalNames: splitEditorList(e.target.value) })}/></label></div><label><span>Descrição pública</span><textarea value={service.description || ''} onChange={e => updateLocalService(index, { description: e.target.value })}/></label><label><span>Observações internas</span><textarea value={service.internalNotes || ''} onChange={e => updateLocalService(index, { internalNotes: e.target.value })}/></label><div className="service-card-meta"><span>{serviceDurationLabel(service)}</span><span>{servicePriceLabel(service)}</span><span>{teamForService(activeLocalTeam, service).length || 0} profissional(is)</span></div><label className="toggle-line compact"><input type="checkbox" checked={service.active !== false} onChange={e => updateLocalService(index, { active: e.target.checked })}/><b>Ativo na página pública</b></label><label className="toggle-line compact"><input type="checkbox" checked={Boolean(service.highlight)} onChange={e => updateLocalService(index, { highlight: e.target.checked })}/><b>Destacar serviço</b></label><div className="real-button-row"><button className="btn secondary compact" onClick={() => updateLocalService(index, { active: service.active === false })}>{service.active === false ? 'Reativar' : 'Pausar'}</button><button className="btn secondary compact danger-soft" onClick={() => removeLocalService(index)}>Remover</button></div></article>) : <article className="service-editor-card empty"><FileText/><h3>Nenhum serviço cadastrado</h3><p>Adicione um serviço para permitir agendamentos na página pública.</p><button className="btn primary compact" onClick={addLocalService}>Cadastrar primeiro serviço</button></article>}</div>
      </section>}

      {section === 'Equipe' && <section className="team-services-pro-section premium-service-motion">
        <div className="service-pro-hero"><div><Badge tone="blue">Equipe Pro</Badge><h3>Profissionais, especialidades e vínculo com serviços</h3><p>Organize quem atende, destaque especialidades e prepare a página pública para mostrar uma equipe mais confiável.</p></div><div className="real-button-row"><button className="btn secondary compact" onClick={addLocalTeamMember}>Adicionar profissional</button><button className="btn primary compact" onClick={saveTeamServices}>Salvar equipe</button></div></div>
        <div className="service-editor-grid team-editor-grid">{localTeam.length ? localTeam.map((member: any, index: number) => <article className="service-editor-card team-editor-card" key={member.id || index}><div className="team-avatar-preview">{member.avatarUrl ? <img src={member.avatarUrl} alt={member.name || 'Profissional'} /> : <span>{String(member.name || 'P').slice(0,2).toUpperCase()}</span>}</div><label><span>Nome</span><input value={member.name || ''} onChange={e => updateLocalTeam(index, { name: e.target.value })}/></label><label><span>Função</span><input value={member.role || 'Profissional'} onChange={e => updateLocalTeam(index, { role: e.target.value })}/></label><label><span>Especialidade</span><input value={member.specialty || ''} onChange={e => updateLocalTeam(index, { specialty: e.target.value })}/></label><div className="mini-form-grid"><label><span>WhatsApp</span><input value={member.whatsapp || ''} onChange={e => updateLocalTeam(index, { whatsapp: e.target.value })}/></label><label><span>E-mail</span><input value={member.email || ''} onChange={e => updateLocalTeam(index, { email: e.target.value })}/></label></div><label><span>Foto por URL</span><input value={member.avatarUrl || ''} onChange={e => updateLocalTeam(index, { avatarUrl: e.target.value })}/></label><label><span>Serviços que atende</span><input value={member.servicesText || ''} placeholder={localServices.map(s => s.name).filter(Boolean).slice(0,3).join(', ') || 'Sem restrição'} onChange={e => updateLocalTeam(index, { servicesText: e.target.value, serviceNames: splitEditorList(e.target.value) })}/></label><label><span>Disponibilidade própria / observações</span><textarea value={member.availabilityNotes || ''} onChange={e => updateLocalTeam(index, { availabilityNotes: e.target.value })}/></label><div className="service-card-meta"><span>{scheduleHasEnabledPeriod(professionalScheduleConfig(localScheduleConfig, member)) ? 'Horário válido' : 'Sem horário válido'}</span><span>{localServices.filter((service: any) => professionalMatchesService(member, service)).length || 0} serviço(s)</span></div><label className="toggle-line compact"><input type="checkbox" checked={member.active !== false} onChange={e => updateLocalTeam(index, { active: e.target.checked })}/><b>Ativo na página pública</b></label><div className="real-button-row"><button className="btn secondary compact" onClick={() => openWhatsApp(member.whatsapp, member.name)}>WhatsApp</button><button className="btn secondary compact danger-soft" onClick={() => removeLocalTeamMember(index)}>Remover</button></div></article>) : <article className="service-editor-card empty"><UsersRound/><h3>Nenhum profissional cadastrado</h3><p>Adicione pelo menos uma pessoa para aparecer na página pública.</p><button className="btn primary compact" onClick={addLocalTeamMember}>Cadastrar profissional</button></article>}</div>
      </section>}

      {section === 'Permissões' && <section className="real-panel"><h3>Permissões por cargo</h3><p>Estrutura operacional para separar administrador, recepção, profissional e financeiro.</p><div className="real-card-grid">{permissions.map(([role, desc]) => <article key={role}><Lock/><h3>{role}</h3><p>{desc}</p><ul><li>Ver dashboard</li><li>Gerenciar agenda</li><li>Atuar conforme função</li></ul></article>)}</div></section>}

      {section === 'Identidade visual' && <section className="real-dashboard-grid"><article className="real-panel"><Badge tone="purple">Marca</Badge><h3>Identidade da página pública</h3><p>{businessDescription}</p><label>Nome<input className="field" readOnly value={businessName}/></label><label>Segmento<input className="field" readOnly value={businessSegment}/></label><label>Cor principal<input className="field" readOnly value={sourceAgenda?.theme?.primary || '#2563EB'}/></label><a className="btn primary full" href="#/conta/criar-agenda">Editar identidade</a></article><article className="real-panel public-preview"><span>{businessName.slice(0, 2).toUpperCase()}</span><h3>{businessName}</h3><p>{businessDescription}</p><small>{businessAddress}</small><a className="btn primary full" href={presentationLink}>Ver apresentação</a></article></section>}

      {section === 'Unidades' && <section className="real-dashboard-grid"><article className="real-panel large"><h3>Unidades</h3><p>Operação atual vinculada ao endereço principal do negócio.</p><div className="unit-card-plus"><Building2 size={28}/><div><b>{businessName}</b><span>{businessAddress}</span><small>WhatsApp: {businessWhatsapp || 'não informado'}</small></div><Badge tone="green">Ativa</Badge></div></article><article className="real-panel"><h3>Expansão</h3><p>Planos avançados podem operar múltiplas unidades, equipes e permissões por local.</p><button className="btn secondary full" onClick={() => pushToast({ tone: 'info', title: 'Módulo preparado', message: 'Multiunidade preparado para expansão.' })}>Solicitar multiunidade</button></article></section>}

      {section === 'Disponibilidade' && <section className="real-dashboard-grid availability-dashboard-grid"><article className="real-panel large"><div className="panel-heading"><div><h3>Configurações de horários</h3><p>Regras reais usadas pela página pública para gerar horários e evitar conflitos.</p></div><button className="btn primary compact" onClick={saveScheduleConfig}>Salvar disponibilidade</button></div><div className="checkout-form-grid"><label><span>Intervalo dos horários</span><select value={localScheduleConfig.slotInterval} onChange={e => setLocalScheduleConfig(current => ({ ...current, slotInterval: Number(e.target.value) }))}><option value="10">10 minutos</option><option value="15">15 minutos</option><option value="20">20 minutos</option><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="60">60 minutos</option></select></label><label><span>Antecedência mínima (h)</span><input value={localScheduleConfig.minAdvanceHours} onChange={e => setLocalScheduleConfig(current => ({ ...current, minAdvanceHours: Number(e.target.value) || 0 }))}/></label><label><span>Janela futura (dias)</span><input value={localScheduleConfig.maxFutureDays} onChange={e => setLocalScheduleConfig(current => ({ ...current, maxFutureDays: Number(e.target.value) || 30 }))}/></label><label><span>Cancelamento permitido até (h)</span><input value={localScheduleConfig.cancellationLimitHours} onChange={e => setLocalScheduleConfig(current => ({ ...current, cancellationLimitHours: Number(e.target.value) || 24 }))}/></label><label><span>Buffer antes (min)</span><input value={localScheduleConfig.bufferBeforeMinutes} onChange={e => setLocalScheduleConfig(current => ({ ...current, bufferBeforeMinutes: Number(e.target.value) || 0 }))}/></label><label><span>Buffer depois (min)</span><input value={localScheduleConfig.bufferAfterMinutes} onChange={e => setLocalScheduleConfig(current => ({ ...current, bufferAfterMinutes: Number(e.target.value) || 0 }))}/></label></div><label className="implementation-check"><input type="checkbox" checked={localScheduleConfig.reservePendingRequests} onChange={e => setLocalScheduleConfig(current => ({ ...current, reservePendingRequests: e.target.checked }))}/><div><b>Reservar horário enquanto solicitação está pendente</b><span>Se ativo, uma solicitação nova já bloqueia o horário até confirmação, recusa ou cancelamento.</span></div></label><label className="implementation-check"><input type="checkbox" checked={localScheduleConfig.acceptNewBookings !== false} onChange={e => setLocalScheduleConfig(current => ({ ...current, acceptNewBookings: e.target.checked }))}/><div><b>Aceitar novos agendamentos</b><span>Desative para pausar a agenda pública temporariamente.</span></div></label><div className="availability-editor-grid">{DAY_KEYS.map(dayKey => { const day = localScheduleConfig.workingDays[dayKey]; const first = day.periods?.[0] || { start: '08:00', end: '18:00' }; const second = day.periods?.[1] || { start: '', end: '' }; return <article key={dayKey}><label className="toggle-line"><input type="checkbox" checked={day.enabled} onChange={e => setLocalScheduleConfig(current => ({ ...current, workingDays: { ...current.workingDays, [dayKey]: { ...current.workingDays[dayKey], enabled: e.target.checked, periods: current.workingDays[dayKey].periods?.length ? current.workingDays[dayKey].periods : [{ start: '08:00', end: '18:00' }] } } }))}/><b>{DAY_LABELS[dayKey]}</b></label><div className="mini-time-row"><input value={first.start} onChange={e => setLocalScheduleConfig(current => { const periods = [...(current.workingDays[dayKey].periods || [{ start: '08:00', end: '18:00' }])]; periods[0] = { ...(periods[0] || first), start: e.target.value }; return { ...current, workingDays: { ...current.workingDays, [dayKey]: { ...current.workingDays[dayKey], periods } } }; })}/><span>às</span><input value={first.end} onChange={e => setLocalScheduleConfig(current => { const periods = [...(current.workingDays[dayKey].periods || [{ start: '08:00', end: '18:00' }])]; periods[0] = { ...(periods[0] || first), end: e.target.value }; return { ...current, workingDays: { ...current.workingDays, [dayKey]: { ...current.workingDays[dayKey], periods } } }; })}/></div><div className="mini-time-row optional"><input placeholder="14:00" value={second.start} onChange={e => setLocalScheduleConfig(current => { const periods = [...(current.workingDays[dayKey].periods || [])]; periods[1] = { ...(periods[1] || { start: '14:00', end: '18:00' }), start: e.target.value }; return { ...current, workingDays: { ...current.workingDays, [dayKey]: { ...current.workingDays[dayKey], periods: periods.filter(p => p.start && p.end) } } }; })}/><span>às</span><input placeholder="18:00" value={second.end} onChange={e => setLocalScheduleConfig(current => { const periods = [...(current.workingDays[dayKey].periods || [])]; periods[1] = { ...(periods[1] || { start: '14:00', end: '18:00' }), end: e.target.value }; return { ...current, workingDays: { ...current.workingDays, [dayKey]: { ...current.workingDays[dayKey], periods: periods.filter(p => p.start && p.end) } } }; })}/></div></article>; })}</div></article><article className="real-panel"><h3>Bloqueios</h3><p>Bloqueie dias inteiros, feriados, folgas ou horários específicos.</p><button className="btn secondary full" onClick={() => { const date = window.prompt('Data sem atendimento (AAAA-MM-DD)', dateKey()); if (date) setLocalScheduleConfig(current => ({ ...current, blockedDates: [...(current.blockedDates || []), { date, reason: window.prompt('Motivo', 'Agenda fechada') || 'Agenda fechada', fullDay: true }] })); }}>Bloquear dia inteiro</button><button className="btn secondary full" onClick={blockQuickTime}>Bloquear horário específico</button><div className="blocked-list">{[...(localScheduleConfig.blockedDates || []), ...(localScheduleConfig.blockedTimes || [])].length ? <>{localScheduleConfig.blockedDates.map((item, index) => <span key={`d-${index}`}>{item.date} • dia inteiro • {item.reason}</span>)}{localScheduleConfig.blockedTimes.map((item, index) => <span key={`t-${index}`}>{item.date} • {item.start} às {item.end} • {item.reason}</span>)}</> : <span>Nenhum bloqueio manual cadastrado.</span>}</div></article></section>}

      {section === 'Lista de espera' && <section className="real-dashboard-grid"><article className="real-panel large"><h3>Lista de espera</h3><p>Clientes que podem ser chamados caso surja uma vaga.</p>{pending.length ? pending.slice(0, 5).map(item => <div className="mini-dashboard-row" key={item.id}><ListChecks size={18}/><span><b>{item.customer_name}</b><small>{item.service_name || primaryService} • aguardando confirmação</small></span><button onClick={() => openWhatsApp(item.customer_phone, item.customer_name)}>Chamar</button></div>) : <div className="real-empty"><ListChecks/><b>Lista vazia</b><span>Solicitações pendentes também podem alimentar esta fila.</span></div>}</article><article className="real-panel"><h3>Automação sugerida</h3><p>Quando um horário for cancelado, chamar automaticamente o próximo interessado.</p><button className="btn secondary full" onClick={() => setSection('Automações')}>Configurar automação</button></article></section>}

      {(section === 'Mensagens' || section === 'Comunicação') && <section className="communication-center-shell">
        <article className="real-panel communication-hero-panel"><div><Badge tone="blue">v0.6.3.7</Badge><h3>Mensagens do agendamento</h3><p>Templates editáveis com variáveis reais para confirmação, remarcação, cancelamento, lembrete, pós-atendimento, reativação, pagamento pendente e boas-vindas.</p></div><button className="btn secondary compact" onClick={() => loadDashboard(true)}>Atualizar agendamentos</button></article>
        <div className="communication-grid">
          <article className="real-panel large"><div className="panel-heading"><div><h3>Clientes para contatar</h3><p>Use uma mensagem pronta e mantenha o histórico no próprio agendamento.</p></div><div className="real-search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar cliente" /></div></div>
            <div className="communication-booking-list">{filteredAppointments.length ? filteredAppointments.slice(0, 12).map(item => { const statusKey = cleanStatus(item.status); const preferredTemplate = statusKey === 'cancelled' ? 'cancellation' : statusKey === 'rescheduled' ? 'reschedule' : statusKey === 'completed' ? 'completed' : statusKey === 'pending' ? 'received' : 'confirmation'; return <div className="communication-booking-row" key={item.id || item.customer_phone}><div><b>{item.customer_name || item.name || 'Cliente'}</b><span>{item.service_name || primaryService} • {item.requested_date || 'sem data'} às {item.requested_time || '--:--'}</span><small>{bookingStatusLabel(item.status)} • {item.customer_phone || item.phone || 'sem WhatsApp'} • {item.customer_email || 'sem e-mail'}</small></div><div><button onClick={() => { setSelectedBooking(item); setActiveTemplateKey(normalizeBookingMessageTemplateKey(preferredTemplate)); }}>Histórico</button><button onClick={() => copyBookingMessage(item, preferredTemplate)}>Copiar</button><button onClick={() => openBookingWhatsApp(item, preferredTemplate)}>WhatsApp</button><button onClick={() => sendBookingEmail(item, preferredTemplate)} disabled={communicationLoading === `${item.id}:email:${normalizeBookingMessageTemplateKey(preferredTemplate)}`}>{communicationLoading === `${item.id}:email:${normalizeBookingMessageTemplateKey(preferredTemplate)}` ? 'Enviando...' : 'E-mail'}</button></div></div>; }) : <div className="real-empty"><MessageSquareText/><b>Nenhum agendamento para comunicação</b><span>Quando clientes solicitarem horários, eles aparecerão aqui.</span></div>}</div>
          </article>
          <article className="real-panel message-template-pro-panel"><div className="panel-heading"><div><h3>Aba Mensagens</h3><p>Escolha um tipo, ajuste o texto e confira o preview preenchido antes de copiar ou abrir o WhatsApp.</p></div><Badge tone="green">{messageTemplates.length} modelos</Badge></div><div className="template-variable-row">{messageTemplateVariableKeys.map(variable => <button key={variable} type="button" onClick={() => copyTemplateVariable(variable)}>{variable}</button>)}</div><div className="message-template-tabs">{messageTemplates.map(template => <button key={template.key} type="button" className={activeTemplateKey === template.key ? 'active' : ''} onClick={() => setActiveTemplateKey(template.key)}><b>{template.label}</b><small>{template.description}</small></button>)}</div><div className="message-template-editor"><label><span>{activeTemplate.label}</span><textarea value={messageTemplateDrafts[activeTemplate.key] || activeTemplate.body} onChange={event => updateMessageTemplateDraft(activeTemplate.key, event.target.value)} /></label><div className="template-preview-box"><b>Preview</b><pre>{activeTemplatePreview}</pre><small>Variáveis: {Object.entries(activeTemplateVariables).filter(([key]) => messageTemplateVariableKeys.includes(`{${key}}`)).map(([key, value]) => `${key}: ${value}`).join(' • ')}</small></div><div className="template-action-row"><button type="button" onClick={() => copyTemplateMessage(activeTemplate.key, messagePreviewBooking)}><MessageSquareText size={15}/> Copiar mensagem</button><button type="button" onClick={() => openTemplateWhatsApp(activeTemplate.key, messagePreviewBooking)}><Send size={15}/> WhatsApp</button><button type="button" onClick={() => resetMessageTemplateDraft(activeTemplate.key)}><RefreshCcw size={15}/> Resetar padrão</button></div></div></article>
        </div>
      </section>}

      {section === 'Automações' && <section className="real-panel"><h3>Automações operacionais</h3><p>Fluxos preparados para reduzir trabalho manual da recepção.</p><div className="real-card-grid">{automations.map(([title, desc, status]) => <article key={title}><Zap/><h3>{title}</h3><p>{desc}</p><Badge tone={status === 'Operacional' ? 'green' : status === 'Recomendado' ? 'blue' : 'amber'}>{status}</Badge></article>)}</div></section>}

      {section === 'IA Assistida' && <section className="real-dashboard-grid"><article className="real-panel large"><Badge tone="purple">IA Assistida</Badge><h3>Resumo inteligente da operação</h3><p>Com base nos dados atuais, a agenda possui {appointments.length} solicitação(ões), {pending.length} pendente(s), {confirmed.length} confirmada(s) e {conversion}% de conversão estimada.</p><ul className="real-action-list"><li><Bot size={18}/> Priorize confirmações pendentes antes de divulgar novos horários.</li><li><Wand2 size={18}/> Use mensagens prontas para reduzir tempo de resposta.</li><li><BarChart3 size={18}/> Receita estimada atual: {currency(revenue)}.</li><li><Rocket size={18}/> Divulgue o link {publicUrlShort} nos canais do negócio.</li></ul></article><article className="real-panel"><h3>Comandos rápidos</h3><button className="btn secondary full" onClick={() => setSection('Agendamentos')}>Ver pendências</button><button className="btn secondary full" onClick={() => setSection('Mensagens')}>Copiar mensagens</button><button className="btn primary full" onClick={() => copy(bookingLink)}>Copiar link público</button></article></section>}

      {section === 'Página pública' && <section className="real-dashboard-grid"><article className="real-panel large"><Badge tone="blue">White-label</Badge><h3>Páginas do negócio</h3><p>Esses links pertencem ao cliente e não levam para a landing comercial do AgendaPro.</p><div className="presentation-links-card"><div><b>Apresentação</b><span>{presentationLink}</span><a className="btn secondary full" href={presentationLink}>Abrir</a><button className="btn secondary full" onClick={() => copy(presentationLink)}>Copiar</button></div><div><b>Agendamento</b><span>{bookingLink}</span><a className="btn secondary full" href={bookingLink}>Abrir</a><button className="btn secondary full" onClick={() => copy(bookingLink)}>Copiar</button></div></div></article><article className="real-panel public-preview"><span>{businessName.slice(0, 2).toUpperCase()}</span><h3>{businessName}</h3><p>{businessAddress}</p><small>{businessWhatsapp || 'WhatsApp não informado'}</small><a className="btn primary full" href={bookingLink}>Agendar agora</a></article></section>}

      {section === 'Financeiro' && <section className="real-dashboard-grid"><article className="real-panel large"><h3>Financeiro operacional</h3><p>Resumo estimado com base nos agendamentos ativos e serviços configurados.</p><div className="finance-grid-plus"><article><span>Receita estimada</span><b>{currency(revenue)}</b></article><article><span>Ticket base</span><b>{currency(baseServicePrice)}</b></article><article><span>Plano</span><b>{account.planName}</b></article><article><span>Status</span><b>{statusLabel(account.paymentStatus)}</b></article></div></article><article className="real-panel"><h3>Ações financeiras</h3><button className="btn secondary full" onClick={() => window.location.hash = '#/conta/payments'}>Ver pagamentos</button><button className="btn secondary full" onClick={() => window.location.hash = '#/conta/plans'}>Melhorar plano</button></article></section>}

      {section === 'Relatórios' && <section className="reports-pro-section premium-report-motion">
        <div className="reports-hero-card">
          <div className="reports-hero-bg" aria-hidden="true"><svg viewBox="0 0 520 220"><path d="M16 170 C120 70 190 210 285 96 S430 36 504 118"/><path d="M22 188 C136 115 186 156 270 132 S400 78 500 46"/></svg></div>
          <div><Badge tone="purple">Relatórios</Badge><h3>Inteligência básica da agenda</h3><p>Dados calculados a partir dos agendamentos reais carregados no painel. Sem inventar números: quando não houver dados, o painel mostra estados vazios e próximos passos.</p></div>
          <div className="report-period-actions"><select value={reportPeriod} onChange={event => setReportPeriod(event.target.value as any)}><option value="today">Hoje</option><option value="7d">Últimos 7 dias</option><option value="30d">Últimos 30 dias</option><option value="month">Este mês</option><option value="previous">Mês anterior</option><option value="all">Tudo</option></select><select value={reportServiceFilter} onChange={event => setReportServiceFilter(event.target.value)}><option value="all">Todos os serviços</option>{reportServiceOptions.filter(item => item !== 'all').map(item => <option key={item} value={item}>{item}</option>)}</select><select value={reportProfessionalFilter} onChange={event => setReportProfessionalFilter(event.target.value)}><option value="all">Todos os profissionais</option>{reportProfessionalOptions.filter(item => item !== 'all').map(item => <option key={item} value={item}>{item}</option>)}</select><select value={reportStatusFilter} onChange={event => setReportStatusFilter(event.target.value)}><option value="all">Todos os status</option>{reportStatusOptions.filter(item => item !== 'all').map(item => <option key={item} value={item}>{bookingStatusLabel(item)}</option>)}</select><button onClick={() => exportReport('txt')}><Download size={16}/> TXT</button><button onClick={() => exportReport('json')}><Database size={16}/> JSON</button><button onClick={downloadReportCsv}><FileText size={16}/> CSV</button></div>
        </div>
        <div className="reports-kpi-grid">
          <article><CalendarCheck/><span>Total</span><b>{reportAppointments.length}</b><small>{periodLabel}</small></article>
          <article><BadgeCheck/><span>Confirmados</span><b>{reportConfirmed.length}</b><small>{reportConfirmationRate}% de confirmação</small></article>
          <article><Clock3/><span>Pendentes</span><b>{reportPending.length}</b><small>precisam de ação</small></article>
          <article><CreditCard/><span>Receita estimada</span><b>{currency(reportRevenue)}</b><small>baseada nos serviços</small></article>
        </div>
        <div className="reports-kpi-grid reports-kpi-grid-secondary">
          <article><CheckCircle2/><span>Concluídos</span><b>{reportCompleted.length}</b><small>{reportAttendanceRate}% de comparecimento</small></article>
          <article><AlertTriangle/><span>Cancelados</span><b>{reportCancelled.length}</b><small>{reportCancelRate}% no período</small></article>
          <article><UsersRound/><span>Recorrentes</span><b>{reportRecurringClients}</b><small>{reportNoReturnClients} sem retorno</small></article>
          <article><CreditCard/><span>Ticket médio</span><b>{currency(reportAverageTicket)}</b><small>estimado por atendimento ativo</small></article>
        </div>
        <div className="reports-insight-grid">
          <article className="reports-chart-card large"><div><Badge tone="green">Performance</Badge><h3>Status dos agendamentos</h3><p>Distribuição simples por status no período selecionado.</p></div><div className="status-bars-pro">{statusesRank.map(([label, value]) => <div key={label}><span>{label}<b>{value}</b></span><i style={{ width: `${Math.min(100, Math.round((value / Math.max(reportAppointments.length, 1)) * 100))}%` }}/></div>)}</div></article>
          <article className="reports-chart-card"><Badge tone="blue">Ocupação</Badge><h3>{reportOccupation}%</h3><p>Estimativa de ocupação com base nos agendamentos ativos do período.</p><div className="report-ring" style={{ ['--report-value' as any]: `${reportOccupation}%` }}><span>{reportOccupation}%</span></div></article>
          <article className="reports-chart-card"><Badge tone="amber">Cancelamentos</Badge><h3>{reportCancelRate}%</h3><p>{reportCancelled.length} cancelado(s) no período. Acompanhe para ajustar confirmação e lembretes.</p><div className="mini-trend-line"><svg viewBox="0 0 220 70"><polyline points="0,54 38,42 76,48 114,28 152,36 190,18 220,24"/></svg></div></article>
        </div>
        <div className="reports-insight-grid bottom">
          <article className="reports-chart-card"><Badge tone="purple">Serviços</Badge><h3>Mais solicitados</h3>{servicesRank.length ? <div className="rank-list-pro">{servicesRank.slice(0, 5).map(([label, value]) => <span key={label}><b>{label}</b><em>{value}</em></span>)}</div> : <div className="report-empty-mini">Nenhum serviço solicitado ainda.</div>}</article>
          <article className="reports-chart-card"><Badge tone="blue">Horários</Badge><h3>Maior procura</h3>{hoursRank.length ? <div className="rank-list-pro">{hoursRank.slice(0, 5).map(([label, value]) => <span key={label}><b>{label}</b><em>{value}</em></span>)}</div> : <div className="report-empty-mini">Nenhum horário registrado ainda.</div>}</article>
          <article className="reports-chart-card"><Badge tone="green">Resumo executivo</Badge><h3>Próximas ações</h3><ul className="real-action-list compact"><li><Clock size={17}/> {reportPending.length ? `Confirme ${reportPending.length} solicitação(ões) pendente(s).` : 'Sem pendências críticas no período.'}</li><li><UsersRound size={17}/> {reportClients.length} cliente(s) único(s) no período.</li><li><Sparkles size={17}/> Serviço em destaque: {topService}.</li><li><CalendarClock size={17}/> Horário com maior procura: {topHour}.</li></ul></article>
        </div>
        <div className="reports-insight-grid bottom">
          <article className="reports-chart-card"><Badge tone="purple">Receita por serviço</Badge><h3>Mais lucrativos</h3>{servicesRevenueRank.length ? <div className="rank-list-pro">{servicesRevenueRank.slice(0, 5).map(([label, value]) => <span key={label}><b>{label}</b><em>{currency(Number(value))}</em></span>)}</div> : <div className="report-empty-mini">Sem receita estimada ainda.</div>}</article>
          <article className="reports-chart-card"><Badge tone="blue">Profissionais</Badge><h3>Mais solicitados</h3>{professionalsRank.length ? <div className="rank-list-pro">{professionalsRank.slice(0, 5).map(([label, value]) => <span key={label}><b>{label}</b><em>{value}</em></span>)}</div> : <div className="report-empty-mini">Nenhum profissional registrado ainda.</div>}</article>
          <article className="reports-chart-card"><Badge tone="amber">Dias fortes</Badge><h3>{topDay}</h3>{daysRank.length ? <div className="rank-list-pro">{daysRank.slice(0, 5).map(([label, value]) => <span key={label}><b>{label}</b><em>{value}</em></span>)}</div> : <div className="report-empty-mini">Sem datas no período.</div>}</article>
        </div>
        <div className="reports-insight-grid reports-advanced-grid">
          <article className="reports-chart-card large"><Badge tone="green">Heatmap</Badge><h3>Procura por dia e horário</h3><p>Quanto mais forte o tom, maior o volume de solicitações naquele horário.</p><div className="report-heatmap"><span></span>{heatmapDays.map(day => <b key={day}>{day}</b>)}{heatmapHours.flatMap(hour => [<b key={`${hour}-label`}>{hour}h</b>, ...heatmapDays.map(day => { const value = heatmapValue(day, hour); return <i key={`${day}-${hour}`} style={{ opacity: Math.max(.12, value / heatmapMax) }} title={`${day} ${hour}h: ${value}`} />; })])}</div></article>
          <article className="reports-chart-card"><Badge tone="blue">Resumo automático</Badge><h3>Executivo</h3><p>{executiveReportText}</p><button className="btn secondary full" onClick={() => exportReport('txt')}>Copiar resumo</button></article>
        </div>
      </section>}

      {section === 'Configurações' && <section className="real-dashboard-grid"><article className="real-panel"><h3>Dados do negócio</h3><label>Nome<input className="field" readOnly value={businessName}/></label><label>WhatsApp<input className="field" readOnly value={businessWhatsapp}/></label><label>Endereço<input className="field" readOnly value={businessAddress}/></label><a className="btn primary full" href="#/conta/criar-agenda">Editar no criador</a></article><article className="real-panel"><h3>Operação</h3><p>Status: <strong>{published ? 'Publicado' : 'Rascunho'}</strong></p><p>Slug: <strong>{slug}</strong></p><p>Conta dona: <strong>{account.email}</strong></p><p>Plano: <strong>{account.planName}</strong></p></article></section>}

      {section === 'Segurança' && <section className="real-dashboard-grid"><article className="real-panel"><Badge tone="green">Protegido</Badge><h3>Dashboard privado</h3><p>Esta rota só deve abrir para a conta dona da agenda. Visitantes e outros clientes devem receber bloqueio.</p><ul className="real-action-list"><li><ShieldCheck size={18}/> Sessão obrigatória</li><li><Lock size={18}/> Validação por slug e conta</li><li><Database size={18}/> Dados carregados via API protegida</li><li><AlertTriangle size={18}/> Sem vínculo com dashboard demo</li></ul></article><article className="real-panel"><Badge tone="blue">Rotas públicas</Badge><h3>Links permitidos para visitantes</h3><p>{presentationLink}</p><p>{bookingLink}</p><button className="btn secondary full" onClick={() => copy(bookingLink)}>Copiar agendamento</button></article></section>}
    </main>
    {selectedBooking && <div className="detail-drawer-backdrop booking-drawer-backdrop" onClick={() => setSelectedBooking(null)}><aside className="detail-drawer booking-detail-drawer" onClick={event => event.stopPropagation()}>
      <button className="drawer-close" onClick={() => setSelectedBooking(null)}>×</button>
      <Badge tone={statusTone(cleanStatus(selectedBooking.status))}>{bookingStatusLabel(selectedBooking.status)}</Badge>
      <h2>{selectedBooking.customer_name || selectedBooking.name || 'Cliente'}</h2>
      <p>{selectedBooking.service_name || primaryService} • {selectedBooking.requested_date || selectedBooking.date || 'sem data'} às {selectedBooking.requested_time || selectedBooking.time || '--:--'}</p>
      <div className="booking-detail-grid">
        <span><b>WhatsApp</b>{selectedBooking.customer_phone || selectedBooking.phone || 'Não informado'}</span>
        <span><b>E-mail</b>{selectedBooking.customer_email || 'Não informado'}</span>
        <span><b>Profissional</b>{selectedBooking.professional_name || selectedBooking.metadata?.professionalName || 'Não definido'}</span>
        <span><b>Recebido em</b>{selectedBooking.created_at ? new Date(selectedBooking.created_at).toLocaleString('pt-BR') : 'Sem data'}</span>
      </div>
      <div className="booking-detail-note"><b>Observação do cliente</b><p>{selectedBooking.notes || selectedBooking.customer_notes || 'Nenhuma observação enviada.'}</p></div>
      <div className="booking-detail-note"><b>Observação interna</b><p>{selectedBooking.internal_note || 'Nenhuma observação interna.'}</p><button onClick={() => saveBookingInternalNote(selectedBooking)}>Editar observação interna</button></div>
      {(selectedBooking.cancellation_reason || selectedBooking.reschedule_reason) && <div className="booking-detail-note warning"><b>Motivo registrado</b><p>{selectedBooking.cancellation_reason || selectedBooking.reschedule_reason}</p></div>}
      <div className="drawer-actions">
        {['pending','refused'].includes(cleanStatus(selectedBooking.status)) && <button onClick={() => updateAppointmentStatus(selectedBooking.id, 'confirmed')}>Confirmar</button>}
        {['pending','confirmed','rescheduled'].includes(cleanStatus(selectedBooking.status)) && <button onClick={() => rescheduleAppointment(selectedBooking)}>Remarcar</button>}
        {['confirmed','rescheduled'].includes(cleanStatus(selectedBooking.status)) && <button onClick={() => updateAppointmentStatus(selectedBooking.id, 'completed')}>Concluir</button>}
        {!['cancelled','completed'].includes(cleanStatus(selectedBooking.status)) && <button className="danger" onClick={() => cancelAppointment(selectedBooking)}>Cancelar</button>}
        <button onClick={() => copyBookingSummary(selectedBooking)}>Copiar resumo</button>
        <button onClick={() => copyBookingMessage(selectedBooking, cleanStatus(selectedBooking.status) === 'pending' ? 'received' : 'confirmation')}>Copiar mensagem</button>
        <button onClick={() => openBookingWhatsApp(selectedBooking, cleanStatus(selectedBooking.status) === 'pending' ? 'received' : 'confirmation')}>WhatsApp pronto</button>
        <button onClick={() => sendBookingEmail(selectedBooking, cleanStatus(selectedBooking.status) === 'pending' ? 'received' : 'confirmation')}>E-mail</button>
      </div>
      <h3>Histórico</h3>
      <div className="booking-history-list">{Array.isArray(selectedBooking.metadata?.history) && selectedBooking.metadata.history.length ? selectedBooking.metadata.history.slice().reverse().map((event: any, index: number) => <span key={index}><b>{event.action || event.nextStatus || 'ação'}</b><small>{event.at ? new Date(event.at).toLocaleString('pt-BR') : 'sem data'} • {event.by || 'sistema'}</small></span>) : <span><b>Recebido</b><small>Este agendamento ainda não possui histórico detalhado.</small></span>}</div>
      <h3>Comunicação</h3>
      <div className="booking-history-list communication-history-list">{selectedBookingCommunicationHistory.length ? selectedBookingCommunicationHistory.slice().reverse().map((event: any, index: number) => <span key={index}><b>{bookingMessageTemplateMap[normalizeBookingMessageTemplateKey(event.template)]?.label || event.template || event.channel || 'mensagem'}</b><small>{event.at ? new Date(event.at).toLocaleString('pt-BR') : 'sem data'} • {event.channel || 'sistema'} • {event.status || 'registrado'}</small></span>) : <span><b>Sem mensagens registradas</b><small>Copie, envie por WhatsApp ou processe por e-mail para registrar comunicação.</small></span>}</div>
      <pre>{bookingSummaryText(selectedBooking, businessName)}</pre>
    </aside></div>}
  {selectedCustomer && <div className="detail-drawer-backdrop booking-drawer-backdrop" onClick={() => setSelectedCustomer(null)}><aside className="detail-drawer booking-detail-drawer customer-detail-drawer" onClick={event => event.stopPropagation()}>
      <button className="drawer-close" onClick={() => setSelectedCustomer(null)}>×</button>
      <Badge tone="green">Cliente 360º</Badge>
      <h2>{selectedCustomer.name}</h2>
      <p>{selectedCustomer.statusLabel} • {selectedCustomer.total} agendamento(s) • {selectedCustomer.topService}</p>
      <div className="booking-detail-grid">
        <span><b>WhatsApp</b>{selectedCustomer.phone || 'Não informado'}</span>
        <span><b>E-mail</b>{selectedCustomer.email || 'Não informado'}</span>
        <span><b>Último atendimento</b>{selectedCustomer.lastDate || 'Sem data'}</span>
        <span><b>Receita estimada</b>{currency(selectedCustomer.valueTotal)}</span>
      </div>
      <div className="booking-detail-note"><b>Observação interna</b><p>{selectedCustomer.internalNote || 'Nenhuma observação interna vinculada ao último agendamento.'}</p><button onClick={() => saveCustomerInternalNote(selectedCustomer)}>Adicionar/editar observação</button></div>
      <h3>Histórico do cliente</h3>
      <div className="booking-history-list">{selectedCustomer.appointments.slice().sort((a: any, b: any) => appointmentStamp(b).localeCompare(appointmentStamp(a))).map((item: any) => <span key={item.id || `${item.customer_name}-${item.requested_date}-${item.requested_time}`}><b>{item.service_name || primaryService}</b><small>{appointmentDateValue(item) || 'sem data'} às {item.requested_time || item.time || '--:--'} • {bookingStatusLabel(item.status)}</small></span>)}</div>
      <div className="drawer-actions"><button onClick={() => openWhatsApp(selectedCustomer.phone, selectedCustomer.name)}>Abrir WhatsApp</button><button onClick={() => copyCustomerProfile(selectedCustomer)}>Copiar resumo</button>{selectedCustomer.upcoming && <button onClick={() => setSelectedBooking(selectedCustomer.upcoming)}>Abrir próximo agendamento</button>}</div>
      <pre>{customerProfileText(selectedCustomer)}</pre>
    </aside></div>}
  </section>;
}

function AccountDashboardBridge() {
  const account = getStoredClient();
  const agenda = getStoredAgenda();
  const slug = resolveClientAgendaSlug(account, agenda);

  useEffect(() => {
    if (!getClientToken() || !account) {
      window.location.hash = '#/conta/login';
      return;
    }

    window.location.hash = `#/conta/agenda/${slug}/dashboard`;
  }, [slug, account]);

  return <PublicShell>
    <section className="page-hero dashboard-bridge-hero">
      <Badge tone="blue">Redirecionando</Badge>
      <h1>Abrindo o dashboard privado da sua agenda.</h1>
      <p>Esta ponte não abre mais a demo. Ela leva para <strong>#/conta/agenda/{slug}/dashboard</strong>, validando a agenda vinculada à conta.</p>
    </section>
  </PublicShell>;
}

function ClientPortalPage({ initialTab = 'summary' }: { initialTab?: string }) {
  const { pushToast } = useApp();
  const [active, setActive] = useState(initialTab);
  const [account, setAccount] = useState<ClientAccount | null>(getStoredClient());
  const agenda = getStoredAgenda();
  const access = getClientAccessDecision(account);
  const isApproved = access.active;
  const expires = account?.expiresAt ? new Date(account.expiresAt).toLocaleDateString('pt-BR') : 'Aguardando aprovação';
  const slug = resolveClientAgendaSlug(account, agenda);
  const dashboardLink = `#/conta/agenda/${slug}/dashboard`;
  const publicLink = `${window.location.origin}${window.location.pathname}#/agendar/${slug}`;
  const presentationLink = `${window.location.origin}${window.location.pathname}#/agenda/${slug}`;
  const hasPublishedAgenda = Boolean(agenda?.publishedAt || account?.agendaStatus === 'published');
  const copyLink = async (link: string, label: string) => {
    try {
      await navigator.clipboard?.writeText(link);
      pushToast({ tone: 'success', title: `${label} copiado`, message: 'O link foi copiado para a área de transferência.' });
    } catch {
      pushToast({ tone: 'warning', title: 'Não foi possível copiar', message: link });
    }
  };
  const refresh = () => setAccount(getStoredClient());
  const activateLocalTrial = (data: Partial<ClientAccount>) => {
    if (!account) return;
    const next: ClientAccount = { ...account, ...data, paymentStatus: 'approved', subscriptionStatus: 'trial', agendaStatus: account.agendaStatus || 'not_created' };
    saveStoredClient(next);
    setAccount(next);
  };
  if (!getClientToken()) return <PublicShell><section className="page-hero"><Badge tone="amber">Sessão necessária</Badge><h1>Faça login para acessar seu painel.</h1><p>As áreas privadas da conta são protegidas e exigem sessão ativa.</p><div className="hero-actions" style={{ justifyContent: 'center' }}><a className="btn primary" href="#/conta/login">Entrar</a><a className="btn secondary" href="#/conta/cadastro">Criar conta</a></div></section></PublicShell>;
  if (!account) return <PublicShell><section className="page-hero"><Badge tone="amber">Conta não encontrada</Badge><h1>Crie uma conta para acessar o painel.</h1><p>O painel do cliente depende do cadastro inicial.</p><div className="hero-actions" style={{ justifyContent: 'center' }}><a className="btn primary" href="#/conta/cadastro">Criar conta</a><a className="btn secondary" href="#/conta/login">Entrar</a></div></section></PublicShell>;

  return <ClientShell active={active} setActive={setActive}>
    <div className="client-head-card client-head-card-v2">
      <div>
        <Badge tone={access.tone}>{access.label}</Badge>
        <h1>{account.businessName}</h1>
        <p>Logado como {account.email}. {access.message}</p>
      </div>
      <div className="client-head-actions">
        {hasPublishedAgenda && <a className="btn primary" href={dashboardLink}>Gerenciar agenda</a>}
        <button className="btn secondary" onClick={refresh}>Atualizar</button>
      </div>
    </div>

    <PlanAccessBanner account={account} access={access} setActive={setActive} />

    {active === 'summary' && <>
      <div className="client-metrics client-metrics-v2">
        <article><span>Plano atual</span><b>{account.planName}</b><small>{account.licenseSource ? 'Licença promocional' : 'Assinatura vinculada'}</small></article>
        <article className={isApproved ? 'ok' : 'warn'}><span>Acesso</span><b>{access.label}</b><small>{statusLabel(account.paymentStatus)} • {statusLabel(account.subscriptionStatus)}</small></article>
        <article><span>Expira em</span><b>{expires}</b><small>{account.expiresAt ? 'Validade da licença/plano' : 'Sem data definida'}</small></article>
        <article><span>Agenda</span><b>{hasPublishedAgenda ? 'Publicada' : statusLabel(account.agendaStatus)}</b><small>{hasPublishedAgenda ? slug : 'Aguardando publicação'}</small></article>
      </div>
      <section className="client-summary-grid">
        <article className="client-focus-card">
          <Badge tone="blue">Próxima ação recomendada</Badge>
          <h2>{hasPublishedAgenda && isApproved ? 'Gerenciar a agenda publicada' : isApproved ? 'Criar ou continuar sua agenda' : access.title}</h2>
          <p>{hasPublishedAgenda && isApproved ? 'Sua agenda já está publicada. Acesse o dashboard privado da agenda para acompanhar solicitações, serviços, equipe e links públicos.' : isApproved ? 'Seu acesso está liberado para configurar negócio, serviços, equipe, horários, tema e publicar a página pública.' : access.message}</p>
          <div className="client-focus-actions">
            {hasPublishedAgenda && isApproved ? <a className="btn primary" href={dashboardLink}>Gerenciar minha agenda</a> : isApproved ? <a className="btn primary" href="#/conta/criar-agenda">Criar minha agenda</a> : <a className="btn primary" href={access.actionHref}>{access.actionLabel}</a>}
            <button className="btn secondary" onClick={() => setActive('license')}>Ativar key</button>
          </div>
        </article>
        <article className="client-links-card">
          <Badge tone={hasPublishedAgenda ? 'green' : 'amber'}>{hasPublishedAgenda ? 'Links públicos' : 'Agenda ainda não publicada'}</Badge>
          <h2>Páginas da agenda</h2>
          <div className="client-link-list">
            <div><span>Apresentação</span><b>{hasPublishedAgenda ? `#/agenda/${slug}` : 'Indisponível'}</b>{hasPublishedAgenda && <a href={presentationLink}>Abrir</a>}</div>
            <div><span>Agendamento</span><b>{hasPublishedAgenda ? `#/agendar/${slug}` : 'Indisponível'}</b>{hasPublishedAgenda && <a href={publicLink}>Abrir</a>}</div>
          </div>
          {hasPublishedAgenda ? <button className="btn secondary full" type="button" onClick={() => copyLink(presentationLink, 'Link de apresentação')}>Copiar apresentação</button> : <a className="btn secondary full" href="#/conta/criar-agenda">Publicar agenda</a>}
        </article>
      </section>
    </>}
    {active === 'plans' && <ClientPlans account={account} setAccount={setAccount} />}
    {active === 'payments' && <ClientPayments account={account} />}
    {active === 'license' && <LicenseActivation account={account} onActivated={activateLocalTrial} />}
    {active === 'agenda' && <AgendaStatusPanel account={account} />}
    {active === 'settings' && <ClientSettings account={account} setAccount={setAccount} />}
  </ClientShell>;
}


function PlanAccessBanner({ account, access, setActive }: { account: ClientAccount; access: ClientAccessDecision; setActive: (tab: string) => void }) {
  const plan = plans.find(item => item.id === account.planId) || plans[1];
  const isBlocked = !access.active;
  const expiryLabel = account.expiresAt ? new Date(account.expiresAt).toLocaleDateString('pt-BR') : 'Sem vencimento definido';
  return <section className={`plan-access-banner ${access.key} ${isBlocked ? 'blocked' : 'released'}`}>
    <div className="plan-access-orb"><Lock size={22}/></div>
    <div className="plan-access-copy">
      <span className="eyebrow">Controle de acesso do plano</span>
      <h2>{access.title}</h2>
      <p>{access.message}</p>
      <div className="plan-access-meta">
        <span>Plano: <b>{plan.name}</b></span>
        <span>Status: <b>{access.label}</b></span>
        <span>Validade: <b>{expiryLabel}</b></span>
      </div>
    </div>
    <div className="plan-access-actions">
      <a className="btn primary" href={access.actionHref}>{access.actionLabel}</a>
      {!access.active && <button className="btn secondary" type="button" onClick={() => setActive('license')}>Tenho uma key</button>}
      <button className="btn secondary" type="button" onClick={() => setActive('payments')}>Ver pagamentos</button>
    </div>
  </section>;
}

function ClientPlans({ account, setAccount }: { account: ClientAccount; setAccount: (a: ClientAccount) => void }) {
  const choose = (planId: string) => {
    const plan = plans.find(item => item.id === planId) || plans[1];
    const next = { ...account, planId: plan.id, planName: plan.name, paymentStatus: 'pending' as const, subscriptionStatus: 'pending' as const };
    saveStoredClient(next);
    setAccount(next);
    window.location.hash = `#/checkout/${plan.id}`;
  };
  return <section className="client-tab-panel client-plans-panel">
    <div className="client-section-header">
      <div><Badge tone="blue">Planos</Badge><h2>Melhorar ou trocar plano</h2><p>Escolha um plano e siga para pagamento vinculado à sua conta. Pagamentos manuais ficam pendentes até confirmação do desenvolvedor.</p></div>
      <div className="current-plan-pill"><span>Plano atual</span><b>{account.planName}</b></div>
    </div>
    <div className="client-plan-grid-v2">
      {plans.map(plan => <article key={plan.id} className={`client-plan-card-v2 ${account.planId === plan.id ? 'active' : ''} ${plan.highlighted ? 'featured' : ''}`}>
        <div className="plan-card-topline"><Badge tone={account.planId === plan.id ? 'green' : plan.highlighted ? 'blue' : 'slate'}>{account.planId === plan.id ? 'Plano atual' : plan.highlighted ? 'Recomendado' : 'Plano'}</Badge>{plan.highlighted && <span>Mais escolhido</span>}</div>
        <h3>{plan.name}</h3>
        <strong>{currency(plan.price)}<small>/mês</small></strong>
        <p>{plan.description}</p>
        <ul>{plan.features.map(feature => <li key={feature}><CheckCircle2 size={15}/>{feature}</li>)}</ul>
        <button className={account.planId === plan.id ? 'btn secondary full' : 'btn primary full'} type="button" onClick={() => choose(plan.id)}>{account.planId === plan.id ? 'Revalidar plano' : `Selecionar ${plan.name}`}</button>
      </article>)}
    </div>
    <div className="client-inline-note"><Rocket size={18}/><div><b>Implantação assistida opcional — R$ 100</b><span>Prazo estimado de 24h a 48h após pagamento e envio completo do briefing, caso não haja imprevistos.</span></div></div>
  </section>;
}

function ClientPayments({ account }: { account: ClientAccount }) {
  const status = account.paymentStatus;
  const access = getClientAccessDecision(account);
  const isApproved = access.active;
  const plan = plans.find(item => item.id === account.planId) || plans[1];
  return <section className="client-tab-panel client-payments-panel">
    <div className="client-section-header">
      <div><Badge tone={access.tone}>Pagamentos</Badge><h2>Status financeiro da conta</h2><p>{access.message}</p></div>
      <a className="btn primary" href={`#/checkout/${account.planId}`}>Ir para checkout</a>
    </div>
    <div className="payment-overview-grid">
      <article className={isApproved ? 'payment-state-card ok' : 'payment-state-card warn'}><span>Acesso atual</span><b>{access.label}</b><small>{access.title}</small></article>
      <article className="payment-state-card"><span>Plano vinculado</span><b>{plan.name}</b><small>{currency(plan.price)}/mês</small></article>
      <article className="payment-state-card"><span>Modo manual</span><b>{status === 'manual_pending' ? 'Aguardando dev' : 'Disponível'}</b><small>O link manual nunca libera acesso automaticamente.</small></article>
    </div>
    <div className="client-timeline-card">
      <h3>Linha de status</h3>
      <div className="payment-timeline">
        <span className={status === 'pending' || status === 'manual_pending' ? 'active' : ''}>Pendente</span>
        <span className={status === 'manual_pending' ? 'active' : ''}>Confirmação dev</span>
        <span className={isApproved ? 'active ok' : ''}>Liberado</span>
        <span className={['rejected','expired','suspended','cancelled'].includes(access.key) ? 'active danger' : ''}>Bloqueado</span>
      </div>
    </div>
    <div className="plan-access-checklist">{access.checklist.map((item, index) => <span key={item}><b>{String(index + 1).padStart(2, '0')}</b>{item}</span>)}</div>
    <div className="client-inline-note"><CreditCard size={18}/><div><b>Pagamento manual</b><span>Ao usar link fixo do Mercado Pago, o cliente deve aguardar conferência e aprovação no painel do desenvolvedor.</span></div></div>
  </section>;
}

function LicenseActivation({ account, onActivated }: { account: ClientAccount; onActivated: (data: Partial<ClientAccount>) => void }) {
  const { pushToast } = useApp();
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const activate = async () => {
    if (!key.trim()) {
      pushToast({ tone: 'warning', title: 'Informe a key', message: 'Cole a licença enviada pelo desenvolvedor.' });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/client?action=activate-license-key', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ key, email: account.email, businessName: account.businessName }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) throw new Error(data?.message || 'Não foi possível ativar a key.');
      onActivated({ planId: data.planId || account.planId, planName: `${data.planName || account.planName} Trial`, expiresAt: data.expiresAt, licenseSource: 'key_promocional' });
      pushToast({ tone: 'success', title: 'Key ativada', message: 'Licença liberada. O botão Criar minha agenda está disponível.' });
    } catch (error) {
      pushToast({ tone: 'warning', title: 'Erro ao ativar key', message: friendlyErrorMessage(error, 'Nao foi possivel ativar a key agora.', 'client') });
    } finally {
      setLoading(false);
    }
  };
  return <article className="client-panel-card license-card"><Badge tone="blue">Licença / Key</Badge><h2>Recebeu uma key de teste?</h2><p>Use a key enviada pelo desenvolvedor para liberar o AgendaPro gratuitamente por tempo limitado. A key é de uso único e fica vinculada ao seu e-mail.</p><div className="key-input-row"><input value={key} onChange={e => setKey(e.target.value.toUpperCase())} placeholder="AGP-TRIAL-XXXX-XXXX" /><button className="btn primary" onClick={activate} disabled={loading}>{loading ? 'Ativando...' : 'Ativar key'}</button></div><div className="payment-note"><ShieldCheck /><div><b>Proteção ativa</b><span>A mesma key não pode ser usada duas vezes, não pode ser ativada se estiver expirada e fica vinculada ao cliente.</span></div></div></article>;
}

function AgendaStatusPanel({ account }: { account: ClientAccount }) {
  const agenda = getStoredAgenda();
  const access = getClientAccessDecision(account);
  const active = access.active;
  const slug = resolveClientAgendaSlug(account, agenda);
  const publicLink = `${window.location.origin}${window.location.pathname}#/agendar/${slug}`;
  const presentationLink = `${window.location.origin}${window.location.pathname}#/agenda/${slug}`;
  const dashboardLink = `#/conta/agenda/${slug}/dashboard`;
  const published = Boolean(agenda?.publishedAt || account.agendaStatus === 'published');
  const services = agenda?.services || [];
  const team = agenda?.team || [];
  return <section className="client-tab-panel client-agenda-panel">
    <div className="client-section-header">
      <div><Badge tone={published && active ? 'green' : active ? 'blue' : access.tone}>{published && active ? 'Agenda publicada' : active ? 'Criador liberado' : access.label}</Badge><h2>{published && active ? 'Sua agenda está pronta para operação.' : active ? 'Criar ou continuar minha agenda' : access.title}</h2><p>{published && active ? 'Gerencie o dashboard privado, links públicos, serviços, equipe e solicitações recebidas.' : active ? 'Configure serviços, equipe, horários, regras e identidade visual para publicar a agenda.' : access.message}</p></div>
      {published && active ? <a className="btn primary" href={dashboardLink}>Gerenciar minha agenda</a> : <a className="btn primary" href={active ? '#/conta/criar-agenda' : access.actionHref}>{active ? 'Criar agenda' : access.actionLabel}</a>}
    </div>
    <div className="agenda-status-grid-v2">
      <article><span>Status</span><b>{published && active ? 'Publicada' : active ? 'Pronta para configurar' : 'Bloqueada'}</b><small>{published ? `Slug: ${slug}` : access.label}</small></article>
      <article><span>Serviços</span><b>{services.length}</b><small>{services.length ? 'cadastrados no criador' : 'nenhum serviço salvo'}</small></article>
      <article><span>Equipe</span><b>{team.length}</b><small>{team.length ? 'profissionais cadastrados' : 'nenhuma pessoa salva'}</small></article>
      <article><span>Dashboard</span><b>{published && active ? 'Disponível' : 'Indisponível'}</b><small>{published && active ? 'rota privada por agenda' : active ? 'publique para liberar' : 'plano bloqueado'}</small></article>
    </div>
    {published && active ? <div className="client-public-actions-grid">
      <a className="btn secondary full" href={dashboardLink}>Abrir dashboard privado</a>
      <a className="btn secondary full" href={presentationLink}>Ver apresentação</a>
      <a className="btn secondary full" href={publicLink}>Ver agendamento</a>
      <a className="btn secondary full" href="#/conta/criar-agenda">Editar agenda</a>
    </div> : <div className="client-agenda-steps">
      {['Dados do negócio', 'Serviços', 'Equipe', 'Horários', 'Regras', 'Publicação'].map((label, index) => <div key={label}><b>{String(index + 1).padStart(2, '0')}</b><span>{label}</span></div>)}
    </div>}
  </section>;
}

function ClientSettings({ account, setAccount }: { account: ClientAccount; setAccount: (a: ClientAccount) => void }) {
  const { pushToast } = useApp();
  const [form, setForm] = useState(account);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!getClientToken()) {
      pushToast({ tone: 'warning', title: 'Sessão expirada', message: 'Faça login novamente para salvar alterações reais.' });
      window.location.hash = '#/conta/login';
      return;
    }
    setSaving(true);
    try {
      const payload = { fullName: form.fullName, whatsapp: form.whatsapp, businessName: form.businessName };
      const response = await fetch('/api/client?action=update-client-profile', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) throw new Error(data?.message || 'Não foi possível salvar no Supabase.');
      const next = { ...account, ...form, email: account.email, fullName: data.account?.full_name || form.fullName, whatsapp: data.account?.whatsapp || form.whatsapp, businessName: data.company?.business_name || data.company?.name || form.businessName };
      saveStoredClient(next);
      setAccount(next);
      setForm(next);
      pushToast({ tone: 'success', title: 'Configurações salvas', message: 'Os dados foram salvos no Supabase e não voltam ao atualizar a página.' });
    } catch (error) {
      pushToast({ tone: 'warning', title: 'Não foi possível salvar', message: friendlyErrorMessage(error, 'Verifique sua sessao e tente novamente.', 'client') });
    } finally {
      setSaving(false);
    }
  };
  return <section className="client-tab-panel client-settings-panel">
    <div className="client-section-header">
      <div><Badge tone="slate">Configurações</Badge><h2>Dados da conta e do negócio</h2><p>Atualize informações básicas usadas no painel, checkout, licença e criação da agenda.</p></div>
      <button className="btn primary" onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar alterações'}</button>
    </div>
    <div className="settings-grid-v2">
      <article>
        <h3>Conta</h3>
        <div className="checkout-form-grid"><label><span>Nome</span><input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /></label><label><span>E-mail de login</span><input value={account.email} readOnly title="O e-mail de login não é alterado por aqui para não quebrar sua sessão." /></label><label><span>WhatsApp</span><input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} /></label><label><span>Negócio</span><input value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} /></label></div>
        <p className="microcopy">O e-mail fica bloqueado aqui porque ele é usado como credencial de login. Para trocar e-mail, use a Central Dev.</p>
      </article>
      <article>
        <h3>Segurança e privacidade</h3>
        <div className="settings-check-list"><span><ShieldCheck size={16}/> Sessão privada por token</span><span><Lock size={16}/> Dashboard protegido por dono da agenda</span><span><FileText size={16}/> Termos e privacidade disponíveis</span><span><LogOut size={16}/> Logout remove a sessão local</span></div>
      </article>
    </div>
  </section>;
}

function AgendaBuilderPage() {
  const { pushToast } = useApp();
  const account = getStoredClient();
  const saved = getStoredAgenda();
  const access = getClientAccessDecision(account);
  const allowed = access.active;
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [agenda, setAgenda] = useState<AgendaDraft>(saved || {
    business: { name: account?.businessName || '', segment: 'Serviços com horário marcado', whatsapp: account?.whatsapp || '', address: '', description: '' },
    visual: { primaryColor: '#2563EB', secondaryColor: '#0F172A', accentColor: '#10B981', logoUrl: '', bannerUrl: '', instagram: '', siteUrl: '', welcome: 'Bem-vindo à nossa agenda online.', slogan: 'Agende seu horário online' },
    conversion: { headline: '', subtitle: '', benefits: ['Atendimento com horário marcado', 'Confirmação pelo WhatsApp', 'Resumo claro antes do envio'], differentials: ['Agenda segura', 'Equipe ativa', 'Serviços organizados'], testimonials: '', experienceYears: '', estimatedAppointments: '', trustBadges: ['Agenda segura', 'Dados protegidos', 'Confirmação manual'] },
    services: [{ name: 'Atendimento inicial', duration: '60', price: '100', description: 'Serviço principal do negócio.' }],
    team: [{ name: account?.fullName || 'Profissional', role: 'Administrador', whatsapp: account?.whatsapp || '' }],
    hours: { weekdays: '08:00 às 18:00', saturday: '08:00 às 12:00', interval: '30' },
    scheduleConfig: defaultScheduleConfig({ interval: '30', saturday: '08:00 às 12:00' }, { minNotice: '2 horas', cancellation: 'Cancelamentos com até 24h de antecedência.' }),
    rules: { minNotice: '2 horas', cancellation: 'Cancelamentos com até 24h de antecedência.', notesRequired: false, maxFutureDays: '30', reservePendingRequests: true, cancellationLimitHours: '24', bufferBeforeMinutes: '0', bufferAfterMinutes: '0' },
    slug: account?.publicSlug || slugify(account?.businessName || 'minha-agenda')
  });
  const publicLink = `${window.location.origin}${window.location.pathname}#/agendar/${agenda.slug}`;
  const readiness = useMemo(() => getAgendaReadiness(agenda, account), [JSON.stringify(agenda), account?.email, account?.whatsapp, account?.publicSlug]);
  const updateBusiness = (key: keyof AgendaDraft['business'], value: string) => setAgenda(current => ({ ...current, business: { ...current.business, [key]: value }, slug: key === 'name' ? slugify(value) : current.slug }));
  const updateVisual = (key: keyof AgendaDraft['visual'], value: string) => setAgenda(current => ({ ...current, visual: { ...current.visual, [key]: value } }));
  const updateConversion = (key: keyof NonNullable<AgendaDraft['conversion']>, value: string) => setAgenda(current => ({ ...current, conversion: { ...(current.conversion || {}), [key]: value } }));
  const conversionText = (value: any) => Array.isArray(value) ? value.map((item: any) => typeof item === 'string' ? item : item?.quote ? `${item.quote} — ${item.author || 'Cliente'}` : item?.label || item?.title || item?.text || '').filter(Boolean).join('\n') : String(value || '');
  const updateService = (index: number, key: keyof AgendaDraft['services'][number], value: string) => setAgenda(current => ({ ...current, services: current.services.map((item, i) => i === index ? { ...item, [key]: value } : item) }));
  const updateTeam = (index: number, key: keyof AgendaDraft['team'][number], value: string) => setAgenda(current => ({ ...current, team: current.team.map((item, i) => i === index ? { ...item, [key]: value } : item) }));
  const updateScheduleConfig = (updater: (current: ScheduleConfig) => ScheduleConfig) => setAgenda(current => ({ ...current, scheduleConfig: updater(normalizeScheduleConfig(current.scheduleConfig, current.hours, current.rules)) }));
  const saveDraft = () => { saveStoredAgenda(agenda); pushToast({ tone: 'success', title: 'Rascunho salvo', message: 'Sua agenda foi salva neste navegador.' }); };
  const publish = async () => {
    if (!account) return;
    if (!readiness.canPublish) {
      const firstMissing = readiness.missing.find(item => item.required) || readiness.missing[0];
      if (typeof firstMissing?.step === 'number') setStep(firstMissing.step);
      pushToast({ tone: 'warning', title: 'Agenda incompleta', message: firstMissing ? `${firstMissing.title}: ${firstMissing.description}` : 'Finalize as pendências antes de publicar.' });
      return;
    }
    setLoading(true);
    const published = { ...agenda, publishedAt: new Date().toISOString() };
    let resultSlug = published.slug;
    try {
      const response = await fetch('/api/client?action=create-agenda', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ account, agenda: published }) });
      const raw = await response.text();
      let data: any = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch { data = {}; }
      if (!response.ok || !data?.ok) throw new Error(data?.message || raw || 'Não foi possível publicar a agenda.');
      resultSlug = data?.slug || published.slug;
    } catch (error) {
      pushToast({ tone: 'warning', title: 'Agenda não publicada', message: friendlyErrorMessage(error, 'Faca login novamente e tente publicar.', 'client') });
      setLoading(false);
      return;
    }
    const normalizedSlug = resultSlug;
    const publishedLocal = { ...published, slug: normalizedSlug };
    saveStoredAgenda(publishedLocal);
    const nextPublicLink = `${window.location.origin}${window.location.pathname}#/agendar/${normalizedSlug}`;
    const next = { ...account, agendaStatus: 'published' as const, publicSlug: normalizedSlug, publicLink: nextPublicLink, businessName: publishedLocal.business.name || account.businessName, whatsapp: publishedLocal.business.whatsapp || account.whatsapp };
    saveStoredClient(next);
    pushToast({ tone: 'success', title: 'Agenda publicada', message: `Sua agenda ${publishedLocal.business.name} foi publicada em /agendar/${normalizedSlug}.` });
    setLoading(false);
    window.location.hash = '#/conta/painel';
  };
  if (!account || !getClientToken()) return <PublicShell><section className="page-hero"><Badge tone="amber">Sessão necessária</Badge><h1>Entre na sua conta antes de criar uma agenda.</h1><p>O criador de agenda é uma área privada e não pode ser acessado apenas pelo navegador.</p><div className="hero-actions" style={{ justifyContent: 'center' }}><a className="btn primary" href="#/conta/login">Entrar</a><a className="btn secondary" href="#/conta/cadastro">Criar conta</a></div></section></PublicShell>;
  if (!allowed) return <PublicShell><section className="page-hero plan-blocked-page"><Badge tone={access.tone}>Acesso bloqueado</Badge><h1>{access.title}</h1><p>{access.message}</p><div className="plan-access-checklist centered">{access.checklist.map((item, index) => <span key={item}><b>{String(index + 1).padStart(2, '0')}</b>{item}</span>)}</div><div className="hero-actions" style={{ justifyContent: 'center' }}><a className="btn primary" href={access.actionHref}>{access.actionLabel}</a><a className="btn secondary" href="#/conta/painel">Voltar ao painel</a></div></section></PublicShell>;
  const steps = ['Negócio', 'Visual', 'Serviços', 'Equipe', 'Horários', 'Regras', 'Publicar'];
  return <ClientShell active="agenda"><div className="builder-head"><div><Badge tone="green">Criador de AgendaPro</Badge><h1>Criar ou editar minha agenda.</h1><p>Configure as informações que serão usadas na página pública do cliente.</p></div><div className="builder-progress">{steps.map((label, index) => <button key={label} className={step === index ? 'active' : ''} onClick={() => setStep(index)}>{index + 1}</button>)}</div></div>
    <section className="agenda-builder-grid"><article className="builder-card">
      {step === 0 && <><h2>Dados do negócio</h2><div className="checkout-form-grid"><label><span>Nome</span><input value={agenda.business.name} onChange={e => updateBusiness('name', e.target.value)} /></label><label><span>Segmento</span><input value={agenda.business.segment} onChange={e => updateBusiness('segment', e.target.value)} /></label><label><span>WhatsApp</span><input value={agenda.business.whatsapp} onChange={e => updateBusiness('whatsapp', e.target.value)} /></label><label><span>Endereço</span><input value={agenda.business.address} onChange={e => updateBusiness('address', e.target.value)} /></label></div><textarea className="field" value={agenda.business.description} onChange={e => updateBusiness('description', e.target.value)} placeholder="Descrição do negócio" /></>}
      {step === 1 && <><h2>Identidade visual</h2><p className="builder-premium-note">Personalize a vitrine pública com cores, logo, capa, mensagem comercial e contatos de confiança. Tudo é salvo junto com a agenda, sem mexer no core do Supabase.</p><div className="checkout-form-grid"><label><span>Cor principal</span><input value={agenda.visual.primaryColor} onChange={e => updateVisual('primaryColor', e.target.value)} /></label><label><span>Cor secundária</span><input value={agenda.visual.secondaryColor} onChange={e => updateVisual('secondaryColor', e.target.value)} /></label><label><span>Cor de destaque</span><input value={agenda.visual.accentColor} onChange={e => updateVisual('accentColor', e.target.value)} /></label><label><span>Logo URL</span><input value={agenda.visual.logoUrl} onChange={e => updateVisual('logoUrl', e.target.value)} placeholder="https://.../logo.png" /></label><label><span>Banner / capa URL</span><input value={agenda.visual.bannerUrl || ''} onChange={e => updateVisual('bannerUrl', e.target.value)} placeholder="https://.../capa.jpg" /></label><label><span>Instagram</span><input value={agenda.visual.instagram || ''} onChange={e => updateVisual('instagram', e.target.value)} placeholder="@seunegocio" /></label><label><span>Site</span><input value={agenda.visual.siteUrl || ''} onChange={e => updateVisual('siteUrl', e.target.value)} placeholder="https://seusite.com" /></label><label><span>Mensagem de boas-vindas</span><input value={agenda.visual.welcome || ''} onChange={e => updateVisual('welcome', e.target.value)} placeholder="Bem-vindo à nossa agenda online." /></label></div><textarea className="field" value={agenda.visual.slogan} onChange={e => updateVisual('slogan', e.target.value)} placeholder="Slogan / chamada comercial" /><div className="conversion-builder-box"><h3>Prova de confiança pública</h3><div className="checkout-form-grid"><label><span>Título comercial opcional</span><input value={agenda.conversion?.headline || ''} onChange={e => updateConversion('headline', e.target.value)} placeholder={agenda.business.name || 'Nome do negócio'} /></label><label><span>Subtítulo de valor</span><input value={agenda.conversion?.subtitle || ''} onChange={e => updateConversion('subtitle', e.target.value)} placeholder="Agende online e aguarde confirmação pelo WhatsApp" /></label><label><span>Anos de experiência</span><input value={agenda.conversion?.experienceYears || ''} onChange={e => updateConversion('experienceYears', e.target.value)} placeholder="Ex: 5" /></label><label><span>Atendimentos estimados</span><input value={agenda.conversion?.estimatedAppointments || ''} onChange={e => updateConversion('estimatedAppointments', e.target.value)} placeholder="Ex: 1200+" /></label></div><textarea className="field" value={conversionText(agenda.conversion?.benefits)} onChange={e => updateConversion('benefits', e.target.value)} placeholder="Benefícios, um por linha" /><textarea className="field" value={conversionText(agenda.conversion?.differentials)} onChange={e => updateConversion('differentials', e.target.value)} placeholder="Diferenciais, um por linha" /><textarea className="field" value={conversionText(agenda.conversion?.trustBadges)} onChange={e => updateConversion('trustBadges', e.target.value)} placeholder="Selos de confiança, um por linha" /><textarea className="field" value={conversionText(agenda.conversion?.testimonials)} onChange={e => updateConversion('testimonials', e.target.value)} placeholder="Depoimentos: texto — autor" /></div></>}
      {step === 2 && <><h2>Serviços</h2>{agenda.services.map((service, index) => <div className="builder-repeater" key={index}><input value={service.name} onChange={e => updateService(index, 'name', e.target.value)} placeholder="Nome do serviço" /><input value={service.duration} onChange={e => updateService(index, 'duration', e.target.value)} placeholder="Duração" /><input value={service.price} onChange={e => updateService(index, 'price', e.target.value)} placeholder="Preço" /><textarea value={service.description} onChange={e => updateService(index, 'description', e.target.value)} placeholder="Descrição" /></div>)}<button className="btn secondary full" onClick={() => setAgenda(current => ({ ...current, services: [...current.services, { name: '', duration: '60', price: '0', description: '' }] }))}>Adicionar serviço</button></>}
      {step === 3 && <><h2>Equipe</h2>{agenda.team.map((member, index) => <div className="builder-repeater" key={index}><input value={member.name} onChange={e => updateTeam(index, 'name', e.target.value)} placeholder="Nome" /><input value={member.role} onChange={e => updateTeam(index, 'role', e.target.value)} placeholder="Cargo" /><input value={member.whatsapp} onChange={e => updateTeam(index, 'whatsapp', e.target.value)} placeholder="WhatsApp" /></div>)}<button className="btn secondary full" onClick={() => setAgenda(current => ({ ...current, team: [...current.team, { name: '', role: 'Profissional', whatsapp: '' }] }))}>Adicionar pessoa</button></>}
      {step === 4 && <><h2>Horários e disponibilidade</h2><p>Configure quando sua página pública deve gerar horários disponíveis.</p><div className="checkout-form-grid"><label><span>Intervalo dos horários</span><select value={normalizeScheduleConfig(agenda.scheduleConfig, agenda.hours, agenda.rules).slotInterval} onChange={e => updateScheduleConfig(current => ({ ...current, slotInterval: Number(e.target.value) }))}><option value="10">10 minutos</option><option value="15">15 minutos</option><option value="20">20 minutos</option><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="60">60 minutos</option></select></label><label><span>Antecedência mínima</span><input value={normalizeScheduleConfig(agenda.scheduleConfig, agenda.hours, agenda.rules).minAdvanceHours} onChange={e => updateScheduleConfig(current => ({ ...current, minAdvanceHours: Number(e.target.value) || 0 }))} /></label><label><span>Dias futuros liberados</span><input value={normalizeScheduleConfig(agenda.scheduleConfig, agenda.hours, agenda.rules).maxFutureDays} onChange={e => updateScheduleConfig(current => ({ ...current, maxFutureDays: Number(e.target.value) || 30 }))} /></label></div><div className="availability-editor-grid">{DAY_KEYS.map(dayKey => { const config = normalizeScheduleConfig(agenda.scheduleConfig, agenda.hours, agenda.rules); const day = config.workingDays[dayKey]; const first = day.periods?.[0] || { start: '08:00', end: '18:00' }; const second = day.periods?.[1] || { start: '', end: '' }; return <article key={dayKey}><label className="toggle-line"><input type="checkbox" checked={day.enabled} onChange={e => updateScheduleConfig(current => ({ ...current, workingDays: { ...current.workingDays, [dayKey]: { ...current.workingDays[dayKey], enabled: e.target.checked, periods: current.workingDays[dayKey].periods?.length ? current.workingDays[dayKey].periods : [{ start: '08:00', end: '18:00' }] } } }))}/><b>{DAY_LABELS[dayKey]}</b></label><div className="mini-time-row"><input value={first.start} onChange={e => updateScheduleConfig(current => { const periods = [...(current.workingDays[dayKey].periods || [{ start: '08:00', end: '18:00' }])]; periods[0] = { ...(periods[0] || first), start: e.target.value }; return { ...current, workingDays: { ...current.workingDays, [dayKey]: { ...current.workingDays[dayKey], periods } } }; })}/><span>às</span><input value={first.end} onChange={e => updateScheduleConfig(current => { const periods = [...(current.workingDays[dayKey].periods || [{ start: '08:00', end: '18:00' }])]; periods[0] = { ...(periods[0] || first), end: e.target.value }; return { ...current, workingDays: { ...current.workingDays, [dayKey]: { ...current.workingDays[dayKey], periods } } }; })}/></div><div className="mini-time-row optional"><input placeholder="14:00" value={second.start} onChange={e => updateScheduleConfig(current => { const periods = [...(current.workingDays[dayKey].periods || [])]; periods[1] = { ...(periods[1] || { start: '14:00', end: '18:00' }), start: e.target.value }; return { ...current, workingDays: { ...current.workingDays, [dayKey]: { ...current.workingDays[dayKey], periods: periods.filter(p => p.start && p.end) } } }; })}/><span>às</span><input placeholder="18:00" value={second.end} onChange={e => updateScheduleConfig(current => { const periods = [...(current.workingDays[dayKey].periods || [])]; periods[1] = { ...(periods[1] || { start: '14:00', end: '18:00' }), end: e.target.value }; return { ...current, workingDays: { ...current.workingDays, [dayKey]: { ...current.workingDays[dayKey], periods: periods.filter(p => p.start && p.end) } } }; })}/></div></article>; })}</div></>}
      {step === 5 && <><h2>Regras avançadas</h2><div className="checkout-form-grid"><label><span>Política de cancelamento</span><input value={agenda.rules.cancellation} onChange={e => setAgenda({ ...agenda, rules: { ...agenda.rules, cancellation: e.target.value } })} /></label><label><span>Limite de cancelamento (h)</span><input value={normalizeScheduleConfig(agenda.scheduleConfig, agenda.hours, agenda.rules).cancellationLimitHours} onChange={e => updateScheduleConfig(current => ({ ...current, cancellationLimitHours: Number(e.target.value) || 24 }))} /></label><label><span>Buffer antes (min)</span><input value={normalizeScheduleConfig(agenda.scheduleConfig, agenda.hours, agenda.rules).bufferBeforeMinutes} onChange={e => updateScheduleConfig(current => ({ ...current, bufferBeforeMinutes: Number(e.target.value) || 0 }))} /></label><label><span>Buffer depois (min)</span><input value={normalizeScheduleConfig(agenda.scheduleConfig, agenda.hours, agenda.rules).bufferAfterMinutes} onChange={e => updateScheduleConfig(current => ({ ...current, bufferAfterMinutes: Number(e.target.value) || 0 }))} /></label></div><label className="implementation-check"><input type="checkbox" checked={normalizeScheduleConfig(agenda.scheduleConfig, agenda.hours, agenda.rules).reservePendingRequests} onChange={e => updateScheduleConfig(current => ({ ...current, reservePendingRequests: e.target.checked }))} /><div><b>Reservar horário enquanto solicitação está pendente</b><span>Evita que dois clientes peçam o mesmo horário antes da confirmação.</span></div></label><label className="implementation-check"><input type="checkbox" checked={agenda.rules.notesRequired} onChange={e => setAgenda({ ...agenda, rules: { ...agenda.rules, notesRequired: e.target.checked } })} /><div><b>Solicitar observação obrigatória</b><span>Útil para diagnósticos, consultas ou atendimentos técnicos.</span></div></label></>}
      {step === 6 && <><h2>Revisar e publicar</h2><p>O AgendaPro valida dados essenciais antes de liberar o link público para clientes finais.</p><div className="smart-publish-card"><div className="smart-publish-score"><Badge tone={readiness.tone}>{readiness.label}</Badge><strong>{readiness.score}%</strong><span>{readiness.completed} de {readiness.total} pontos concluídos</span></div><div className="smart-publish-progress"><i style={{ width: `${readiness.score}%` }} /></div><div className="smart-publish-list">{readiness.issues.map(item => <button key={item.key} type="button" className={item.ok ? 'done' : item.required ? 'required' : ''} onClick={() => typeof item.step === 'number' ? setStep(item.step) : undefined}><span>{item.ok ? <CheckCircle2 size={17}/> : <AlertTriangle size={17}/>}</span><b>{item.title}</b><small>{item.description}</small>{!item.ok && <em>{item.actionLabel}</em>}</button>)}</div></div><div className="copy-box"><span>{publicLink}</span><button type="button" onClick={() => navigator.clipboard?.writeText(publicLink)}>Copiar</button></div><div className="builder-final-actions"><a className="btn secondary full" href={`#/agenda/${agenda.slug}`} target="_blank" rel="noopener noreferrer">Ver prévia pública</a><button className="btn primary full" onClick={publish} disabled={loading || !readiness.canPublish}>{loading ? 'Publicando...' : readiness.canPublish ? 'Publicar agenda' : 'Corrigir pendências'}</button></div>{!readiness.canPublish && <p className="smart-publish-warning"><AlertTriangle size={16}/> Corrija os itens obrigatórios antes de publicar. O rascunho continua salvo.</p>}</>}
      <div className="builder-actions"><button className="btn secondary" onClick={() => setStep(Math.max(0, step - 1))}>Voltar</button><button className="btn secondary" onClick={saveDraft}>Salvar rascunho</button>{step < steps.length - 1 && <button className="btn primary" onClick={() => setStep(Math.min(steps.length - 1, step + 1))}>Continuar</button>}</div>
    </article><aside className="agenda-live-preview public-custom-preview" style={{ ['--preview-primary' as string]: agenda.visual.primaryColor, ['--preview-secondary' as string]: agenda.visual.secondaryColor, ['--preview-accent' as string]: agenda.visual.accentColor }}><div className="preview-glow-orb"/><span>Prévia pública premium</span>{agenda.visual.bannerUrl && <div className="preview-banner" style={{ backgroundImage: `url(${agenda.visual.bannerUrl})` }} />}<div className="preview-brand-row"><div className="preview-logo-dot">{agenda.visual.logoUrl ? <img src={agenda.visual.logoUrl} alt="Logo"/> : (agenda.business.name || 'AP').slice(0,2).toUpperCase()}</div><div><h2>{agenda.business.name || 'Nome do negócio'}</h2><p>{agenda.visual.welcome || agenda.visual.slogan}</p></div></div><small>{agenda.business.segment}</small><div className="preview-social-row">{agenda.visual.instagram && <span>{agenda.visual.instagram}</span>}{agenda.visual.siteUrl && <span>Site conectado</span>}</div><div className="preview-services">{agenda.services.slice(0, 3).map((service, index) => <article key={index}><b>{service.name || 'Serviço'}</b><span>{service.duration} min • R$ {service.price}</span></article>)}</div><button>Agendar horário</button></aside></section>
  </ClientShell>;
}


function AgendaPresentationPage({ route }: { route: string }) {
  const slug = route.split('/').filter(Boolean)[1] || 'minha-agenda';
  const localAgenda = getStoredAgenda();
  const [remoteAgenda, setRemoteAgenda] = useState<AgendaDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const localMatches = Boolean(localAgenda?.slug === slug && localAgenda?.publishedAt);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    fetch(`/api/public?action=get-public-agenda&slug=${encodeURIComponent(slug)}`)
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.ok) throw new Error(data?.message || 'Agenda não encontrada.');
        if (active) setRemoteAgenda(normalizePublicAgenda(data.agenda));
      })
      .catch(() => {
        if (active) {
          setRemoteAgenda(null);
          setNotFound(!localMatches);
        }
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [slug]);

  const agenda = remoteAgenda || (localMatches ? localAgenda : null);

  useEffect(() => {
    if (agenda?.business?.name) document.title = `${agenda.business.name} — Página Oficial`;
  }, [agenda?.business?.name]);

  if (loading && !agenda) return <div className="booking-page client-booking-white-label dynamic-booking luxury-booking-page"><main className="luxury-booking-shell"><section className="luxury-booking-hero luxury-presentation-loading"><div className="luxury-hero-content"><div className="luxury-chip-row"><span className="luxury-status-chip">Carregando agenda</span></div><h1>Preparando página pública...</h1><p>Estamos buscando somente os dados reais desta agenda pelo slug informado.</p></div></section></main></div>;

  if (!agenda || notFound) return <PublicShell><section className="page-hero"><Badge tone="red">Agenda não encontrada</Badge><h1>Esta agenda pública não existe ou ainda não foi publicada.</h1><p>Confira o link enviado pelo negócio. Por segurança, nenhuma agenda real usa dados de demonstração como fallback.</p><div className="hero-actions" style={{ justifyContent: 'center' }}><a className="btn primary" href="#/">Voltar ao início</a></div></section></PublicShell>;

  const business = agenda.business;
  const visual = agenda.visual;
  const scheduleConfig = normalizeScheduleConfig(agenda.scheduleConfig, agenda.hours, agenda.rules);
  const services = activePublicItems(agenda.services?.length ? agenda.services : [{ name: 'Atendimento online', duration: '60', price: '0', description: 'Conheça nossos serviços e agende seu horário online com praticidade.' }]).filter(service => service?.name);
  const team = activePublicItems(agenda.team?.length ? agenda.team : [{ name: business.responsible || 'Profissional responsável', role: business.segment || 'Atendimento', whatsapp: business.whatsapp || '' }]).filter(member => member?.name);
  const appointments = Array.isArray(agenda.bookedSlots) ? agenda.bookedSlots : [];
  const bookingHref = `#/agendar/${slug}`;
  const fullPublicUrl = `${window.location.origin}${window.location.pathname}#/agenda/${slug}`;
  const fullBookingUrl = `${window.location.origin}${window.location.pathname}#/agendar/${slug}`;
  const waLink = whatsappHref(business.whatsapp, `Olá, vim pela página online da ${business.name || 'agenda'} e gostaria de tirar uma dúvida.`);
  const mapHref = agendaMapHref(business.address);
  const openNow = agendaIsOpenNow(scheduleConfig);
  const nextSlot = nextAgendaSlotLabel(services, appointments, scheduleConfig);
  const footerData = getAgendaPresentationFooterData(agenda, scheduleConfig, fullPublicUrl, fullBookingUrl);
  const copyPublicLink = () => navigator.clipboard?.writeText(fullPublicUrl);
  const scrollToServices = () => document.getElementById('agenda-public-services')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const activeDays = DAY_KEYS.filter(day => scheduleConfig.workingDays?.[day]?.enabled);

  return <div className="booking-page client-booking-white-label dynamic-booking luxury-booking-page luxury-presentation-page" style={{ ['--booking-primary' as string]: visual.primaryColor || '#2563EB', ['--booking-secondary' as string]: visual.secondaryColor || '#0F172A', ['--booking-accent' as string]: visual.accentColor || '#10B981', ['--agenda-primary' as string]: visual.primaryColor || '#2563EB', ['--agenda-secondary' as string]: visual.secondaryColor || '#0F172A', ['--agenda-accent' as string]: visual.accentColor || '#10B981' }}>
    <main className="luxury-booking-shell luxury-presentation-shell">
      <section className="luxury-booking-hero luxury-presentation-hero">
        <div className="luxury-hero-content">
          <div className="luxury-chip-row"><span className="luxury-status-chip">Agenda publicada</span><span className={openNow ? 'luxury-open-chip open' : 'luxury-open-chip'}>{openNow ? 'Aberto agora' : 'Fechado agora'}</span>{business.segment && <span className="luxury-open-chip">{business.segment}</span>}</div>
          <h1>{business.name || 'Agenda online'}</h1>
          <p>{business.description || visual.slogan || 'Conheça nossos serviços e agende seu horário online com praticidade.'}</p>
          <div className="luxury-hero-meta">
            <span><Clock size={17}/>{summarizeAgendaSchedule(scheduleConfig)}</span>
            {business.address && <span><Building2 size={17}/>{business.address}</span>}
            {business.whatsapp && <span><MessageSquareText size={17}/>{business.whatsapp}</span>}
          </div>
          <div className="luxury-hero-actions"><a className="btn primary" href={bookingHref}>Agendar agora</a>{waLink && <a className="btn secondary" href={waLink} target="_blank" rel="noopener noreferrer">Falar no WhatsApp</a>}<button className="btn secondary" type="button" onClick={scrollToServices}>Ver serviços</button></div>
        </div>
        <aside className="luxury-hero-panel luxury-presentation-panel">
          <div className="luxury-logo-orb">{visual.logoUrl ? <img src={visual.logoUrl} alt={business.name} /> : String(business.name || 'A').slice(0, 2).toUpperCase()}</div>
          <span>Agende seu horário online</span><strong>{nextSlot}</strong>
          <small>{visual.slogan || 'Atendimento organizado, com confirmação e horário marcado.'}</small>
          <div className="luxury-panel-actions"><a href={bookingHref}>Agendar agora</a>{waLink && <a href={waLink} target="_blank" rel="noopener noreferrer">WhatsApp</a>}</div>
        </aside>
      </section>

      <section className="luxury-info-strip luxury-presentation-strip">
        <article><b>{services.length}</b><span>serviço(s)</span></article>
        <article><b>{team.length}</b><span>profissional(is)</span></article>
        <article><b>{scheduleConfig.slotInterval} min</b><span>intervalo</span></article>
        <article><b>{scheduleConfig.minAdvanceHours}h</b><span>antecedência mínima</span></article>
      </section>

      <section className="luxury-presentation-section luxury-about-section">
        <div className="luxury-section-heading"><span>Sobre</span><h2>Atendimento organizado para uma experiência melhor.</h2><p>{business.description || 'Conheça nossos serviços e agende seu horário online com praticidade.'}</p></div>
        <div className="luxury-about-grid"><article><b>Diferencial</b><p>{visual.slogan || 'Um espaço preparado para oferecer atendimento com qualidade, organização e horário marcado.'}</p></article><article><b>Público atendido</b><p>{business.segment || 'Clientes que buscam atendimento com hora marcada, clareza e praticidade.'}</p></article><article><b>Confirmação</b><p>{agenda.rules?.confirmation || 'Após solicitar o agendamento, aguarde a confirmação pelo estabelecimento.'}</p></article></div>
      </section>

      <section id="agenda-public-services" className="luxury-presentation-section">
        <div className="luxury-section-heading"><span>Serviços</span><h2>Escolha o atendimento ideal e agende online.</h2><p>Serviços exibidos com duração, valor e acesso direto ao agendamento.</p></div>
        <div className="luxury-service-grid luxury-presentation-service-grid">{services.slice(0, 9).map((service, index) => <article key={`${service.name}-${index}`} className="luxury-public-service-card"><div><b>{service.name}</b><small>{service.description || service.category || 'Serviço disponível para agendamento online.'}</small></div><span><Clock size={14}/>{agendaServiceDurationLabel(service)}</span><span>{teamForService(team, service).length || 0} profissional(is)</span><strong>{agendaPriceLabel(service)}</strong><a href={bookingHref}>Agendar serviço</a></article>)}</div>
      </section>

      <section className="luxury-presentation-section">
        <div className="luxury-section-heading"><span>Equipe</span><h2>Profissionais disponíveis</h2><p>{team.length > 1 ? 'Escolha o profissional ideal durante o agendamento.' : 'Atendimento realizado pelo profissional responsável.'}</p></div>
        <div className="luxury-professional-grid luxury-presentation-team-grid">{team.slice(0, 6).map((member, index) => <article key={`${member.name}-${index}`} className="luxury-public-pro-card"><span>{member.avatarUrl ? <img src={member.avatarUrl} alt={member.name} /> : String(member.name || 'P').slice(0, 2).toUpperCase()}</span><b>{member.name || 'Profissional'}</b><small>{member.role || member.specialty || 'Atendimento'}</small><a href={bookingHref}>Agendar com este profissional</a></article>)}</div>
      </section>

      <section className="luxury-presentation-section luxury-public-split">
        <article className="luxury-public-card"><div className="luxury-section-heading"><span>Funcionamento</span><h2>Dias e horários</h2></div><div className="luxury-schedule-list">{DAY_KEYS.map(day => { const config = scheduleConfig.workingDays[day]; if (!config?.enabled) return null; return <div key={day}><b>{DAY_LABELS[day]}</b><small>{config.periods?.length ? config.periods.map(period => `${period.start} às ${period.end}`).join(' / ') : 'Horário configurado'}</small></div>; })}{!activeDays.length && <div><b>Funcionamento</b><small>Sob consulta</small></div>}<div><b>Intervalo</b><small>{scheduleConfig.slotInterval} minutos</small></div>{scheduleConfig.blockedDates?.filter(item => item.fullDay !== false).slice(0, 3).map((block, index) => <div key={`${block.date}-${index}`}><b>Data bloqueada</b><small>{formatPublicDateLabel(block.date)}{block.reason ? ` • ${block.reason}` : ''}</small></div>)}</div></article>
        <article className="luxury-public-card"><div className="luxury-section-heading"><span>Regras</span><h2>Informações importantes</h2></div><ul className="luxury-rules-list"><li>{scheduleConfig.cancellationText || agenda.rules?.cancellation || 'Após solicitar o agendamento, aguarde a confirmação pelo estabelecimento.'}</li><li>Antecedência mínima de {scheduleConfig.minAdvanceHours} hora(s).</li><li>Agendamento disponível para os próximos {scheduleConfig.maxFutureDays} dias.</li><li>Confirmação enviada preferencialmente pelo WhatsApp.</li></ul></article>
      </section>

      <section className="luxury-presentation-section luxury-contact-section">
        <div><span className="luxury-status-chip">Contato</span><h2>Fale com {business.name || 'o estabelecimento'}.</h2><p>Use os canais oficiais cadastrados pela própria agenda.</p></div>
        <div className="luxury-contact-actions">{business.whatsapp && <a className="btn primary" href={waLink} target="_blank" rel="noopener noreferrer">Falar no WhatsApp</a>}{business.email && <a className="btn secondary" href={`mailto:${business.email}`}>Enviar e-mail</a>}{mapHref && <a className="btn secondary" href={mapHref} target="_blank" rel="noopener noreferrer">Ver endereço</a>}<a className="btn secondary" href={bookingHref}>Agendar agora</a></div>
      </section>

      <section className="luxury-final-cta"><h2>Pronto para agendar seu horário?</h2><p>Escolha o serviço ideal e envie sua solicitação em poucos segundos.</p><div className="luxury-hero-actions"><a className="btn primary" href={bookingHref}>Agendar agora</a>{waLink && <a className="btn secondary" href={waLink} target="_blank" rel="noopener noreferrer">Falar no WhatsApp</a>}<button className="btn secondary" type="button" onClick={copyPublicLink}>Copiar página</button></div></section>
    </main>

    <footer className="luxury-agenda-footer luxury-presentation-footer">
      <div className="luxury-footer-grid">
        <section><span className="luxury-footer-mark">Sobre</span><h3>{footerData.name}</h3><p>{footerData.description}</p>{footerData.responsible && <small>Responsável: {footerData.responsible}</small>}</section>
        {(footerData.whatsapp || footerData.email || footerData.address) && <section><span>Contato</span>{footerData.whatsapp && <a href={whatsappHref(footerData.whatsapp, `Olá! Vim pela página da ${footerData.name}.`)} target="_blank" rel="noopener noreferrer">WhatsApp: {footerData.whatsapp}</a>}{footerData.email && <a href={`mailto:${footerData.email}`}>{footerData.email}</a>}{footerData.address && <small>{footerData.address}</small>}</section>}
        <section><span>Funcionamento</span><p>{footerData.hours}</p><small>{footerData.rules}</small></section>
        <section><span>Agenda</span><a href={footerData.publicUrl}>Página pública</a><a href={footerData.bookingUrl}>Agendamento online</a><button type="button" onClick={copyPublicLink}>Copiar link</button><small>Powered by AgendaPro</small></section>
      </div>
    </footer>
  </div>;
}

function MapPinLite() {
  return <span className="map-pin-lite" aria-hidden="true">•</span>;
}

function CheckoutPage({ route }: { route: string }) {
  const { pushToast } = useApp();
  const planId = route.split('/').filter(Boolean)[1]?.split('?')[0] || getStoredClient()?.planId || 'professional';
  const plan = plans.find(item => item.id === planId) || plans[1];
  const account = getStoredClient();
  const [includeImplementation, setIncludeImplementation] = useState(route.includes('implantacao=sim'));
  const [manualOpen, setManualOpen] = useState(false);
  const [manualNote, setManualNote] = useState('');
  const [fallbackInfo, setFallbackInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const total = plan.price + (includeImplementation ? 100 : 0);
  const manualLinks: PaymentFallbackLink[] = Array.isArray(fallbackInfo?.manualLinks) && fallbackInfo.manualLinks.length ? fallbackInfo.manualLinks : getManualPaymentLinks(plan.id, includeImplementation);
  const startCheckout = async () => {
    if (!hasClientSession()) {
      pushToast({ tone: 'warning', title: 'Login obrigatório', message: 'Entre na sua conta antes de iniciar qualquer pagamento.' });
      window.location.hash = account ? '#/conta/login' : '#/conta/cadastro';
      return;
    }
    if (!account) { window.location.hash = '#/conta/cadastro'; return; }
    setLoading(true);
    try {
      const response = await fetch('/api/payments?action=create-checkout', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ planId: plan.id, fullName: account.fullName, email: account.email, whatsapp: account.whatsapp, businessName: account.businessName, password: 'created-account', includeImplementation }) });
      const data = await response.json().catch(() => ({}));
      if (data?.fallback) {
        setFallbackInfo(data);
        setManualOpen(true);
        saveStoredClient({ ...account, planId: plan.id, planName: plan.name, paymentStatus: 'pending', subscriptionStatus: 'pending', implementationStatus: includeImplementation ? 'awaiting_briefing' : account.implementationStatus || 'not_hired' });
        pushToast({ tone: 'info', title: 'Checkout em modo manual', message: data.message || 'Use o link manual e aguarde conferência para liberar o plano.' });
        return;
      }
      if (!response.ok || !data?.initPoint) throw new Error(data?.message || 'Checkout automático não respondeu.');
      saveStoredClient({ ...account, planId: plan.id, planName: plan.name, paymentStatus: 'pending', subscriptionStatus: 'pending', implementationStatus: includeImplementation ? 'awaiting_briefing' : account.implementationStatus || 'not_hired' });
      window.location.href = data.initPoint;
    } catch (error) {
      const message = friendlyErrorMessage(error, 'Tente novamente.', 'client');
      pushToast({ tone: 'warning', title: 'Checkout automático indisponível', message });
      if (!/sessão|login|token|401/i.test(message)) setManualOpen(true);
    } finally {
      setLoading(false);
    }
  };
  const sendManual = async () => {
    if (!hasClientSession()) {
      pushToast({ tone: 'warning', title: 'Login obrigatório', message: 'Entre na sua conta antes de abrir o link manual do Mercado Pago.' });
      window.location.hash = account ? '#/conta/login' : '#/conta/cadastro';
      return;
    }
    if (!account) { window.location.hash = '#/conta/cadastro'; return; }
    const next = { ...account, planId: plan.id, planName: plan.name, paymentStatus: 'manual_pending' as const, subscriptionStatus: 'pending' as const, implementationStatus: includeImplementation ? 'awaiting_briefing' as const : account.implementationStatus || 'not_hired' as const };
    setLoading(true);
    try {
      const response = await fetch('/api/client?action=create-manual-payment-request', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ account: next, planId: plan.id, planName: plan.name, amount: total, note: manualNote, paymentLink: manualLinks[0]?.url || mercadoPagoLinks[plan.id], paymentLinks: manualLinks, includeImplementation }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) throw new Error(data?.message || 'Não foi possível registrar o pagamento manual.');
      saveStoredClient(next);
      pushToast({ tone: 'success', title: 'Solicitação manual registrada', message: data?.externalReference ? `Referência ${data.externalReference} criada para conferência.` : 'Aguarde a confirmação do desenvolvedor para liberação do acesso.' });
      if (manualLinks[0]?.url) window.open(manualLinks[0].url, '_blank', 'noopener,noreferrer');
      window.location.hash = '#/conta/painel';
    } catch (error) {
      pushToast({ tone: 'warning', title: 'Pagamento manual bloqueado', message: friendlyErrorMessage(error, 'Faca login novamente e tente outra vez.', 'client') });
    } finally {
      setLoading(false);
    }
  };
  return <PublicShell>
    <section className="page-hero">
      <Badge tone="green">Checkout seguro</Badge>
      <h1>Pagamento vinculado à conta do cliente.</h1>
      <p>O acesso será liberado automaticamente por API/webhook ou manualmente após confirmação do desenvolvedor.</p>
      {account && hasClientSession() && <div className="checkout-session-banner">
        <span>Você está logado nesta conta</span>
        <strong>{account.businessName || account.fullName}</strong>
        <small>{account.email} • Plano selecionado: {plan.name}</small>
        <a href="#/conta/painel">Abrir painel da conta</a>
      </div>}
    </section>

    <section className="section checkout-grid checkout-grid-expanded">
      <article className="checkout-registration">
        <span className="eyebrow"><Lock size={16}/> Conta vinculada</span>
        <h2>{account?.businessName || 'Cadastre-se antes de pagar'}</h2>
        <p>{account ? `Você está logado como ${account.email}. Este pagamento ficará vinculado a essa conta.` : 'Crie conta para vincular o pagamento ao cliente certo.'}</p>
        {account && hasClientSession() && <div className="linked-account-card">
          <b>Conta ativa no site</b>
          <span>{account.businessName || account.fullName}</span>
          <small>{account.email}</small>
        </div>}
        <label className="implementation-check">
          <input type="checkbox" checked={includeImplementation} onChange={e => setIncludeImplementation(e.target.checked)} />
          <div>
            <b>Adicionar implantação assistida por R$ 100</b>
            <span>Configuração inicial em 24h a 48h após briefing completo, caso não haja imprevistos.</span>
          </div>
        </label>
        {!account && <a className="btn primary full" href="#/conta/cadastro">Criar conta</a>}
      </article>

      <article className="checkout-summary">
        <h2>{plan.name}</h2>
        <p>{plan.description}</p>
        <strong>{currency(plan.price)}<small>/mês</small></strong>
        {includeImplementation && <div className="addon-line"><span>Implantação assistida</span><b>+ R$ 100,00</b></div>}
        <div className="addon-total"><span>Total inicial</span><b>{currency(total)}</b></div>
        <ul>{plan.features.map((feature: string) => <li key={feature}><CheckCircle2 size={16}/>{feature}</li>)}</ul>
      </article>

      <article className="payment-card payment-card-wide">
        <span className="eyebrow"><CreditCard size={16}/> Mercado Pago</span>
        <h2>Realizar pagamento</h2>
        {account && hasClientSession()
          ? <p className="payment-account-confirmation">Sessão ativa: o pagamento será registrado para <b>{account.email}</b>.</p>
          : <p>Use o checkout automático para liberação via webhook. O link manual exige confirmação do desenvolvedor antes de liberar o acesso.</p>}

        {fallbackInfo && <div className="checkout-fallback-card">
          <AlertTriangle size={18}/>
          <div>
            <b>Checkout automático em contingência</b>
            <span>{fallbackInfo.message || 'Use o link manual abaixo e aguarde a conferência do desenvolvedor.'}</span>
            {fallbackInfo.externalReference && <small>Referência: {fallbackInfo.externalReference}</small>}
          </div>
        </div>}

        <div className="payment-methods">
          <button onClick={startCheckout} disabled={loading || !account}><QrCode/> Pix</button>
          <button onClick={startCheckout} disabled={loading || !account}><CreditCard/> Cartão</button>
          <button onClick={startCheckout} disabled={loading || !account}><ClipboardList/> Boleto</button>
        </div>

        <button className="btn primary full" onClick={startCheckout} disabled={loading || !account}>
          {loading ? 'Criando checkout...' : `Pagar ${plan.name}`}
        </button>
        <button className="btn secondary full" onClick={() => {
          if (!hasClientSession()) {
            pushToast({ tone: 'warning', title: 'Login obrigatório', message: 'Entre na sua conta antes de usar o pagamento manual.' });
            window.location.hash = account ? '#/conta/login' : '#/conta/cadastro';
            return;
          }
          setManualOpen(!manualOpen);
        }} disabled={loading || !account}>Usar link manual do Mercado Pago</button>

        {manualOpen && <div className="manual-payment-box">
          <AlertTriangle/>
          <div>
            <b>Pagamento manual não libera acesso automaticamente.</b>
            <p>Após pagar pelo link manual, sua solicitação ficará como “aguardando confirmação”. O desenvolvedor irá conferir o recebimento no Mercado Pago e liberar ou reprovar o acesso manualmente.</p>
            {fallbackInfo?.externalReference && <span className="manual-reference">Referência: {fallbackInfo.externalReference}</span>}
            <div className="manual-link-list">
              {manualLinks.map(link => <a key={link.id} href={link.url} target="_blank" rel="noreferrer">{link.label}</a>)}
            </div>
            <textarea className="field" value={manualNote} onChange={e => setManualNote(e.target.value)} placeholder="Cole ID, e-mail usado no pagamento ou observação/comprovante."/>
            <button className="btn primary full" onClick={sendManual} disabled={loading || !account}>{loading ? 'Registrando...' : 'Registrar pagamento manual e abrir link'}</button>
          </div>
        </div>}
        <a className="btn secondary full" href="#/planos">Voltar aos planos</a>
      </article>
    </section>
  </PublicShell>;
}

function PaymentReturnPage({ route }: { route: string }) {
  const status = route.includes('/pendente') ? 'pending' : route.includes('/erro') ? 'rejected' : 'approved';
  return <PublicShell><section className="page-hero"><Badge tone={status === 'approved' ? 'green' : status === 'rejected' ? 'red' : 'amber'}>Pagamento</Badge><h1>{status === 'approved' ? 'Pagamento recebido para validação.' : status === 'pending' ? 'Pagamento pendente.' : 'Pagamento não concluído.'}</h1><p>{status === 'approved' ? 'A liberação acontece somente após confirmação confiável pelo webhook do Mercado Pago ou aprovação manual do desenvolvedor. Caso já esteja aprovado, acesse o painel e atualize a conta.' : status === 'pending' ? 'Aguarde a confirmação do Mercado Pago. O acesso não será liberado enquanto estiver pendente.' : 'Tente novamente ou fale com suporte.'}</p><div className="hero-actions" style={{ justifyContent: 'center' }}><a className="btn primary" href="#/conta/painel">Ir para o painel</a><a className="btn secondary" href="#/checkout/professional">Voltar ao checkout</a></div></section></PublicShell>;
}


type DevSession = { token: string; email?: string; role?: string; expiresAt?: string };

function getDevSession(): DevSession | null {
  try {
    const raw = localStorage.getItem('agendapro:dev-session');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DevSession;
    if (!parsed?.token) return null;
    if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) {
      localStorage.removeItem('agendapro:dev-session');
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveDevSession(session: DevSession) {
  localStorage.setItem('agendapro:dev-session', JSON.stringify(session));
}

function formatDate(value: any) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}


type DevEditableField = {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'datetime-local';
  options?: Array<[string, string]>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
};

type DevEditTarget = { entity: string; title: string; item: any; fields?: DevEditableField[] };
type DevConfirmTarget = { entity: string; action: string; item: any; payload?: any; title: string; message: string; confirmLabel?: string; requireReason?: boolean; danger?: boolean };

function devValue(item: any, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
}

function toDatetimeLocal(value: any) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function normalizeDevFormPayload(values: Record<string, any>, fields: DevEditableField[]) {
  const dateFields = new Set(fields.filter(field => field.type === 'datetime-local').map(field => field.name));
  const numberFields = new Set(fields.filter(field => field.type === 'number').map(field => field.name));
  const payload: Record<string, any> = {};
  Object.entries(values).forEach(([key, value]) => {
    if (dateFields.has(key)) payload[key] = value ? new Date(String(value)).toISOString() : null;
    else if (numberFields.has(key)) payload[key] = value === '' || value === null ? null : Number(value);
    else if (value === 'true') payload[key] = true;
    else if (value === 'false') payload[key] = false;
    else payload[key] = value;
  });
  return payload;
}

function getDevEditFields(entity: string, item: any): DevEditableField[] {
  const statusOptions: Array<[string, string]> = [['active', 'Ativo'], ['pending', 'Pendente'], ['suspended', 'Suspenso'], ['cancelled', 'Cancelado']];
  const subscriptionOptions: Array<[string, string]> = [['active', 'Ativa'], ['pending', 'Pendente'], ['trial', 'Trial'], ['expired', 'Vencida'], ['cancelled', 'Cancelada'], ['suspended', 'Suspensa']];
  const paymentOptions: Array<[string, string]> = [['approved', 'Aprovado'], ['pending', 'Pendente'], ['manual_pending', 'Manual pendente'], ['rejected', 'Reprovado'], ['none', 'Nenhum']];
  const planOptions: Array<[string, string]> = [['essential', 'Essencial'], ['professional', 'Profissional'], ['business', 'Empresa'], ['implementation', 'Implantação']];
  const agendaStatus: Array<[string, string]> = [['draft', 'Rascunho'], ['published', 'Publicada'], ['paused', 'Pausada'], ['suspended', 'Suspensa']];
  const manualStatus: Array<[string, string]> = [['pending_review', 'Aguardando análise'], ['approved', 'Aprovado'], ['rejected', 'Reprovado'], ['needs_adjustment', 'Solicitar ajuste']];
  const keyStatus: Array<[string, string]> = [['available', 'Disponível'], ['active', 'Ativa'], ['disabled', 'Desativada'], ['revoked', 'Revogada'], ['expired', 'Expirada']];

  if (entity === 'client') return [
    { name: 'full_name', label: 'Nome do cliente', required: true },
    { name: 'email', label: 'E-mail', type: 'email', required: true },
    { name: 'whatsapp', label: 'WhatsApp' },
    { name: 'plan', label: 'Plano', type: 'select', options: planOptions },
    { name: 'status', label: 'Status geral', type: 'select', options: statusOptions },
    { name: 'subscription_status', label: 'Status da assinatura', type: 'select', options: subscriptionOptions },
    { name: 'payment_status', label: 'Status do pagamento', type: 'select', options: paymentOptions },
    { name: 'expires_at', label: 'Expira em', type: 'datetime-local' },
    { name: 'company_id', label: 'Empresa vinculada (ID)' },
    { name: 'internal_note', label: 'Observação interna', type: 'textarea' },
  ];

  if (entity === 'company') return [
    { name: 'name', label: 'Nome da empresa', required: true },
    { name: 'slug', label: 'Slug público', required: true },
    { name: 'current_plan_id', label: 'Plano', type: 'select', options: planOptions },
    { name: 'status', label: 'Status operacional', type: 'select', options: statusOptions },
    { name: 'subscription_status', label: 'Status da assinatura', type: 'select', options: subscriptionOptions },
    { name: 'whatsapp', label: 'WhatsApp' },
    { name: 'email', label: 'E-mail', type: 'email' },
    { name: 'address', label: 'Endereço' },
    { name: 'description', label: 'Descrição pública', type: 'textarea' },
    { name: 'plan_expires_at', label: 'Plano expira em', type: 'datetime-local' },
  ];

  if (entity === 'agenda') return [
    { name: 'business_name', label: 'Nome público da agenda', required: true },
    { name: 'public_slug', label: 'Slug de agendamento', required: true },
    { name: 'status', label: 'Publicação', type: 'select', options: agendaStatus },
    { name: 'whatsapp', label: 'WhatsApp' },
    { name: 'email', label: 'E-mail público', type: 'email' },
    { name: 'address', label: 'Endereço' },
    { name: 'segment', label: 'Segmento' },
    { name: 'description', label: 'Descrição pública', type: 'textarea' },
    { name: 'theme_color', label: 'Cor principal / tema' },
    { name: 'plan_id', label: 'Plano', type: 'select', options: planOptions },
  ];

  if (entity === 'manual_payment') return [
    { name: 'status', label: 'Status', type: 'select', options: manualStatus },
    { name: 'plan_id', label: 'Plano liberado', type: 'select', options: planOptions },
    { name: 'plan_name', label: 'Nome do plano' },
    { name: 'amount', label: 'Valor', type: 'number' },
    { name: 'review_note', label: 'Motivo / parecer interno', type: 'textarea' },
    { name: 'note', label: 'Observação do cliente', type: 'textarea' },
  ];

  if (entity === 'payment') return [
    { name: 'status', label: 'Status', type: 'select', options: [['paid', 'Pago'], ['approved', 'Aprovado'], ['pending', 'Pendente'], ['pending_review', 'Em análise'], ['rejected', 'Reprovado'], ['cancelled', 'Cancelado']] },
    { name: 'amount', label: 'Valor', type: 'number' },
    { name: 'payer_email', label: 'E-mail pagador', type: 'email' },
    { name: 'description', label: 'Descrição', type: 'textarea' },
  ];

  if (entity === 'license_key') return [
    { name: 'status', label: 'Status', type: 'select', options: keyStatus },
    { name: 'type', label: 'Tipo' },
    { name: 'plan_id', label: 'Plano vinculado', type: 'select', options: planOptions },
    { name: 'duration_days', label: 'Duração liberada (dias)', type: 'number' },
    { name: 'max_uses', label: 'Limite de uso', type: 'number' },
    { name: 'expires_at', label: 'Validade da key', type: 'datetime-local' },
    { name: 'notes', label: 'Observação interna', type: 'textarea' },
  ];

  if (entity === 'webhook') return [
    { name: 'status', label: 'Status', type: 'select', options: [['pending', 'Pendente'], ['processed', 'Processado'], ['resolved', 'Resolvido'], ['error', 'Erro'], ['failed', 'Falhou']] },
    { name: 'processed', label: 'Processado?', type: 'select', options: [['true', 'Sim'], ['false', 'Não']] },
    { name: 'processing_error', label: 'Erro / observação técnica', type: 'textarea' },
  ];

  if (entity === 'briefing') return [
    { name: 'status', label: 'Status', type: 'select', options: [['recebido', 'Recebido'], ['em análise', 'Em análise'], ['aguardando cliente', 'Aguardando cliente'], ['aprovado', 'Aprovado'], ['converted', 'Convertido']] },
    { name: 'priority', label: 'Prioridade', type: 'select', options: [['low', 'Baixa'], ['normal', 'Normal'], ['high', 'Alta'], ['urgent', 'Urgente']] },
    { name: 'internal_note', label: 'Observação interna', type: 'textarea' },
    { name: 'notes', label: 'Notas do briefing', type: 'textarea' },
  ];

  if (entity === 'implementation') return [
    { name: 'title', label: 'Título', required: true },
    { name: 'status', label: 'Status', type: 'select', options: [['aguardando briefing', 'Aguardando briefing'], ['aguardando pagamento', 'Aguardando pagamento'], ['configurando agenda', 'Configurando agenda'], ['revisão interna', 'Revisão interna'], ['publicado', 'Publicado'], ['entregue', 'Entregue'], ['problema', 'Problema'], ['completed', 'Concluída']] },
    { name: 'priority', label: 'Prioridade', type: 'select', options: [['low', 'Baixa'], ['normal', 'Normal'], ['high', 'Alta'], ['urgent', 'Urgente']] },
    { name: 'responsible_email', label: 'Responsável interno', type: 'email' },
    { name: 'description', label: 'Descrição / checklist', type: 'textarea' },
    { name: 'resolution', label: 'Resolução / entrega', type: 'textarea' },
  ];

  if (entity === 'plan') return [
    { name: 'id', label: 'ID do plano', disabled: true },
    { name: 'name', label: 'Nome do plano', required: true },
    { name: 'price', label: 'Mensalidade', type: 'number' },
    { name: 'setup', label: 'Implantação assistida', type: 'number' },
    { name: 'payment_link', label: 'Link Mercado Pago' },
    { name: 'status', label: 'Status', type: 'select', options: [['active', 'Ativo'], ['hidden', 'Oculto'], ['paused', 'Pausado']] },
    { name: 'description', label: 'Descrição', type: 'textarea' },
    { name: 'features', label: 'Recursos (separe por vírgula)', type: 'textarea' },
  ];

  if (entity === 'setting') return [
    { name: 'key', label: 'Chave', disabled: Boolean(item?.key) },
    { name: 'description', label: 'Descrição' },
    { name: 'status', label: 'Status', type: 'select', options: [['active', 'Ativo'], ['disabled', 'Desativado'], ['maintenance', 'Manutenção']] },
    { name: 'value', label: 'Valor / JSON / texto', type: 'textarea' },
  ];

  return [{ name: 'status', label: 'Status' }, { name: 'internal_note', label: 'Observação interna', type: 'textarea' }];
}

function getInitialDevForm(entity: string, item: any, fields: DevEditableField[]) {
  const source = item?.value && entity === 'plan' ? { ...item.value, id: item.id || String(item.key || '').replace('plan:', '') } : item || {};
  const initial: Record<string, any> = {};
  fields.forEach(field => {
    let value = devValue(source, [field.name], '');
    if (field.name === 'name' && entity === 'company') value = devValue(source, ['name', 'business_name'], '');
    if (field.name === 'slug' && entity === 'company') value = devValue(source, ['slug', 'public_slug'], '');
    if (field.name === 'full_name' && entity === 'client') value = devValue(source, ['full_name', 'name'], '');
    if (field.name === 'current_plan_id' && entity === 'company') value = devValue(source, ['current_plan_id', 'plan', 'plan_id'], 'professional');
    if (field.name === 'plan_id') value = devValue(source, ['plan_id', 'plan', 'requested_plan'], 'professional');
    if (field.name === 'status') value = devValue(source, ['status', 'subscription_status'], field.options?.[0]?.[0] || 'active');
    if (field.name === 'features' && Array.isArray(value)) value = value.join(', ');
    if (field.name === 'value' && typeof value === 'object') value = JSON.stringify(value, null, 2);
    if (field.type === 'datetime-local') value = toDatetimeLocal(value);
    if (value === true) value = 'true';
    if (value === false) value = 'false';
    initial[field.name] = value ?? '';
  });
  return initial;
}

function normalizeCanonicalEntity(entity: string) {
  const map: Record<string, string> = {
    clients: 'client',
    companies: 'company',
    agendas: 'agenda',
    appointments: 'appointment',
    payments: 'payment',
    manual: 'manual_payment',
    manual_payments: 'manual_payment',
    keys: 'license_key',
    webhooks: 'webhook',
    briefings: 'briefing',
    implementations: 'implementation',
    settings: 'setting',
    plans: 'plan',
  };
  return map[entity] || entity;
}


type DevAdvancedFilters = {
  status: string;
  plan: string;
  entity: string;
  dateFrom: string;
  dateTo: string;
};

const emptyDevFilters: DevAdvancedFilters = {
  status: 'all',
  plan: 'all',
  entity: 'all',
  dateFrom: '',
  dateTo: ''
};

function devString(value: any) {
  return String(value ?? '').toLowerCase();
}

function devEntityToken(item: any) {
  return [item.entity_type, item.type, item.source, item.action, item.company_id, item.account_id, item.agenda_id, item.entity_id].map(devString).join(' ');
}

function devStatusToken(item: any) {
  return devString(item.status || item.payment_status || item.subscription_status || item.severity || item.processed || item.published || item.readiness_status);
}

function devPlanToken(item: any) {
  return devString(item.plan || item.plan_id || item.current_plan_id || item.requested_plan || item.plan_type || item.type);
}

function devDateValue(item: any) {
  return item.created_at || item.updated_at || item.reviewed_at || item.received_at || item.requested_date || item.confirmed_at || item.cancelled_at || item.completed_at || item.rescheduled_at || '';
}

function isWithinDevDateRange(item: any, filters: DevAdvancedFilters) {
  if (!filters.dateFrom && !filters.dateTo) return true;
  const raw = devDateValue(item);
  if (!raw) return false;
  const value = new Date(raw).getTime();
  if (Number.isNaN(value)) return false;
  if (filters.dateFrom) {
    const start = new Date(`${filters.dateFrom}T00:00:00`).getTime();
    if (!Number.isNaN(start) && value < start) return false;
  }
  if (filters.dateTo) {
    const end = new Date(`${filters.dateTo}T23:59:59`).getTime();
    if (!Number.isNaN(end) && value > end) return false;
  }
  return true;
}

function matchesDevAdvancedFilters(item: any, filters: DevAdvancedFilters) {
  const byStatus = filters.status === 'all' || devStatusToken(item).includes(filters.status);
  const byPlan = filters.plan === 'all' || devPlanToken(item).includes(filters.plan);
  const byEntity = filters.entity === 'all' || devEntityToken(item).includes(filters.entity);
  return byStatus && byPlan && byEntity && isWithinDevDateRange(item, filters);
}

function devRelatedLogs(target: any, logs: any[]) {
  const item = target?.raw || target?.data || target || {};
  const ids = [item.id, item.account_id, item.company_id, item.agenda_id, item.entity_id, item.public_slug, item.slug, item.agenda_slug].filter(Boolean).map(String);
  if (!ids.length) return [];
  return logs.filter((log: any) => {
    const text = JSON.stringify(log || {});
    return ids.some(id => id && text.includes(id));
  }).slice(0, 12);
}

function makeDevExportText(title: string, data: any[]) {
  const now = new Date().toLocaleString('pt-BR');
  const lines = [`AgendaPro Central Dev — ${title}`, `Gerado em: ${now}`, `Registros: ${data.length}`, ''];
  data.slice(0, 80).forEach((item, index) => {
    lines.push(`${index + 1}. ${item.name || item.business_name || item.full_name || item.customer_name || item.email || item.id || 'Registro'}`);
    lines.push(`   Status: ${item.status || item.subscription_status || item.payment_status || item.severity || '—'}`);
    lines.push(`   Plano: ${item.plan || item.plan_id || item.current_plan_id || '—'}`);
    lines.push(`   Data: ${item.created_at || item.updated_at || item.requested_date || '—'}`);
  });
  return lines.join('\n');
}

type DevCommercialRow = {
  id: string;
  account?: any;
  company?: any;
  agenda?: any;
  payments: any[];
  manualPayments: any[];
  appointments: any[];
  logs: any[];
  name: string;
  owner: string;
  email: string;
  whatsapp: string;
  plan: string;
  planStatus: string;
  paymentStatus: string;
  agendaStatus: string;
  appointmentsCount: number;
  lastAppointment?: string;
  lastActivity?: string;
  createdAt?: string;
  revenue: number;
  pending: string[];
  risk: 'success' | 'warning' | 'danger';
  filterTokens: string[];
};

function cleanDevStatus(value: any) {
  return String(value || '').toLowerCase().trim();
}

function devIsActiveStatus(value: any) {
  return ['active', 'trial', 'approved', 'approved_manual', 'paid', 'published'].includes(cleanDevStatus(value));
}

function devIsPendingStatus(value: any) {
  return /pending|review|manual|awaiting|analysis|análise|pendente|draft|rascunho/.test(cleanDevStatus(value));
}

function devIsSuspendedStatus(value: any) {
  return /suspended|cancel|expired|rejected|failed|revoked|disabled|vencid|suspens|recus/.test(cleanDevStatus(value));
}

function devLatestDate(items: any[], keys = ['updated_at', 'created_at', 'requested_date', 'reviewed_at']) {
  return items.map(item => {
    const raw = keys.map(key => item?.[key]).find(Boolean);
    const time = raw ? new Date(raw).getTime() : 0;
    return Number.isNaN(time) ? 0 : time;
  }).sort((a, b) => b - a)[0] || 0;
}

function devDateAgeDays(value: any) {
  if (!value) return Number.POSITIVE_INFINITY;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - time) / 86400000);
}

function devSameEntity(item: any, row: { account?: any; company?: any; agenda?: any; email?: string }) {
  const ids = [row.account?.id, row.company?.id, row.agenda?.id].filter(Boolean).map(String);
  const itemIds = [item?.account_id, item?.client_account_id, item?.company_id, item?.linked_company_id, item?.linked_client_account_id, item?.agenda_id].filter(Boolean).map(String);
  if (ids.some(id => itemIds.includes(id))) return true;
  const email = String(row.email || row.account?.email || row.company?.email || '').toLowerCase();
  const itemEmail = String(item?.email || item?.customer_email || item?.payer_email || item?.activated_email || '').toLowerCase();
  if (email && itemEmail && email === itemEmail) return true;
  const slug = String(row.agenda?.public_slug || row.agenda?.slug || row.company?.public_slug || row.company?.slug || '').toLowerCase();
  const itemSlug = String(item?.agenda_slug || item?.public_slug || item?.slug || '').toLowerCase();
  return Boolean(slug && itemSlug && slug === itemSlug);
}

function buildDevCommercialRows(rows: any): DevCommercialRow[] {
  const accounts = rows.clients || [];
  const companies = rows.companies || [];
  const agendas = rows.agendas || [];
  const usedAccountIds = new Set<string>();

  const findAccountForCompany = (company: any) => accounts.find((account: any) =>
    [company.owner_account_id, company.client_account_id, company.account_id].filter(Boolean).map(String).includes(String(account.id)) ||
    (company.email && account.email && String(company.email).toLowerCase() === String(account.email).toLowerCase())
  );

  const makeRow = (account: any, company: any, fallbackIndex: number): DevCommercialRow => {
    if (account?.id) usedAccountIds.add(String(account.id));
    const agenda = agendas.find((item: any) => devSameEntity(item, { account, company, email: account?.email || company?.email }));
    const base = { account, company, agenda, email: account?.email || company?.email || '' };
    const payments = (rows.payments || []).filter((item: any) => devSameEntity(item, base));
    const manualPayments = (rows.manual || []).filter((item: any) => devSameEntity(item, base));
    const appointments = (rows.appointments || []).filter((item: any) => devSameEntity(item, base));
    const logs = (rows.logs || []).filter((item: any) => devSameEntity(item, base)).slice(0, 8);
    const paymentPool = [...payments, ...manualPayments];
    const planStatus = company?.subscription_status || account?.subscription_status || company?.status || account?.status || 'pending';
    const paymentStatus = paymentPool[0]?.status || company?.payment_status || account?.payment_status || 'pending';
    const agendaStatus = agenda?.published || agenda?.is_published || agenda?.status === 'published' ? 'published' : agenda?.status || 'draft';
    const lastAppointmentTime = devLatestDate(appointments, ['requested_date', 'created_at', 'updated_at']);
    const lastActivityTime = Math.max(lastAppointmentTime, devLatestDate(logs), devLatestDate(paymentPool));
    const pending: string[] = [];
    if (!devIsActiveStatus(planStatus)) pending.push('plano pendente');
    if (devIsPendingStatus(paymentStatus)) pending.push('pagamento pendente');
    if (devIsSuspendedStatus(paymentStatus) || devIsSuspendedStatus(planStatus)) pending.push('risco comercial');
    if (!['published', 'active'].includes(cleanDevStatus(agendaStatus))) pending.push('agenda não publicada');
    if (!company?.whatsapp && !company?.phone && !account?.whatsapp && !account?.phone) pending.push('sem WhatsApp');
    if (appointments.length === 0 && ['published', 'active'].includes(cleanDevStatus(agendaStatus))) pending.push('sem agendamentos');
    if (lastActivityTime && devDateAgeDays(lastActivityTime) > 30) pending.push('sem uso recente');
    const risk: DevCommercialRow['risk'] = pending.some(item => /risco|suspens|recus|vencid/.test(item)) ? 'danger' : pending.length ? 'warning' : 'success';
    const revenue = paymentPool.filter((item: any) => ['approved', 'approved_manual', 'paid'].includes(cleanDevStatus(item.status))).reduce((sum: number, item: any) => sum + Number(item.amount || item.value || 0), 0);
    const filterTokens = [
      devIsActiveStatus(planStatus) ? 'active' : '',
      devIsPendingStatus(planStatus) || devIsPendingStatus(paymentStatus) ? 'pending' : '',
      devIsSuspendedStatus(planStatus) || devIsSuspendedStatus(paymentStatus) ? 'suspended expired' : '',
      devIsPendingStatus(paymentStatus) ? 'payment_pending' : '',
      ['published', 'active'].includes(cleanDevStatus(agendaStatus)) ? 'agenda_published' : 'no_agenda',
      /implementation|implant/.test(JSON.stringify({ company, account, manualPayments }).toLowerCase()) ? 'implementation' : '',
      appointments.length >= 5 ? 'high_usage' : '',
      !lastActivityTime || devDateAgeDays(lastActivityTime) > 30 ? 'no_recent' : '',
    ].join(' ');

    return {
      id: String(company?.id || account?.id || `commercial-${fallbackIndex}`),
      account,
      company,
      agenda,
      payments,
      manualPayments,
      appointments,
      logs,
      name: company?.name || company?.business_name || account?.business_name || account?.full_name || account?.name || 'Cliente sem nome',
      owner: account?.full_name || account?.name || company?.owner_name || 'Responsável não informado',
      email: account?.email || company?.email || '',
      whatsapp: company?.whatsapp || company?.phone || account?.whatsapp || account?.phone || '',
      plan: company?.current_plan_id || account?.plan || paymentPool[0]?.plan_id || 'professional',
      planStatus,
      paymentStatus,
      agendaStatus,
      appointmentsCount: appointments.length,
      lastAppointment: lastAppointmentTime ? new Date(lastAppointmentTime).toISOString() : '',
      lastActivity: lastActivityTime ? new Date(lastActivityTime).toISOString() : '',
      createdAt: company?.created_at || account?.created_at || agenda?.created_at || '',
      revenue,
      pending,
      risk,
      filterTokens: filterTokens.split(/\s+/).filter(Boolean),
    };
  };

  const companyRows: DevCommercialRow[] = companies.map((company: any, index: number) => makeRow(findAccountForCompany(company), company, index));
  const accountRows: DevCommercialRow[] = accounts
    .filter((account: any) => !usedAccountIds.has(String(account.id)))
    .map((account: any, index: number) => makeRow(account, null, index + companyRows.length));
  const riskOrder: Record<DevCommercialRow['risk'], number> = { danger: 0, warning: 1, success: 2 };

  return [...companyRows, ...accountRows].sort((a, b) => {
    if (a.risk !== b.risk) return riskOrder[a.risk] - riskOrder[b.risk];
    return new Date(b.lastActivity || b.createdAt || 0).getTime() - new Date(a.lastActivity || a.createdAt || 0).getTime();
  });
}

function DeveloperConsolePage() {
  const { pushToast } = useApp();
  const [session, setSession] = useState(() => getDevSession());
  const [login, setLogin] = useState({ email: '', password: '' });
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string>('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [commercialFilter, setCommercialFilter] = useState('all');
  const [advancedFilters, setAdvancedFilters] = useState<DevAdvancedFilters>(emptyDevFilters);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [editing, setEditing] = useState<DevEditTarget | null>(null);
  const [confirming, setConfirming] = useState<DevConfirmTarget | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [keyForm, setKeyForm] = useState({
    type: 'trial_professional',
    planId: 'professional',
    durationDays: '30',
    quantity: '1',
    maxUses: '1',
    validityDays: '90',
    notes: ''
  });
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);

  const token = session?.token || '';
  const devHeaders = (): Record<string, string> => token ? { Authorization: `Bearer ${token}`, 'x-dev-token': token } : {};

  const nav: Array<[string, ComponentType<{ size?: number }>, string]> = [
    ['overview', LayoutDashboard, 'Visão geral'],
    ['commercial', BarChart3, 'Comercial'],
    ['clients', Users, 'Clientes'],
    ['companies', Building2, 'Empresas'],
    ['agendas', CalendarClock, 'Agendas'],
    ['appointments', Clock3, 'Agendamentos'],
    ['payments', CreditCard, 'Pagamentos'],
    ['manual', BadgeCheck, 'Pagamentos manuais'],
    ['plans', Layers3, 'Planos'],
    ['briefings', ClipboardList, 'Briefings'],
    ['implementations', KanbanSquare, 'Implantações'],
    ['keys', KeyRound, 'Keys'],
    ['webhooks', Webhook, 'Webhooks'],
    ['logs', ScrollText, 'Logs'],
    ['audit', ShieldCheck, 'Auditoria'],
    ['support', Headphones, 'Suporte 360º'],
    ['settings', SlidersHorizontal, 'Configurações'],
    ['health', Activity, 'Saúde do sistema'],
    ['tools', Wrench, 'Ferramentas'],
  ];

  const tabCopy: Record<string, { title: string; description: string }> = {
    overview: { title: 'Visão geral', description: 'Acompanhe a operação do AgendaPro em tempo real, com métricas, alertas e eventos recentes.' },
    commercial: { title: 'Operação comercial', description: 'Acompanhe clientes, planos, pagamentos, publicação, uso e riscos em uma visão executiva.' },
    clients: { title: 'Clientes', description: 'Gerencie clientes, acessos, vínculos, pendências e histórico de suporte.' },
    companies: { title: 'Empresas', description: 'Controle empresas, planos, status, responsáveis e dados públicos.' },
    agendas: { title: 'Agendas', description: 'Gerencie agendas publicadas, links, serviços, profissionais e validações.' },
    appointments: { title: 'Agendamentos', description: 'Acompanhe solicitações, confirmações, cancelamentos e conflitos de horário.' },
    payments: { title: 'Pagamentos', description: 'Monitore pagamentos automáticos, status financeiros, receitas e integrações.' },
    manual: { title: 'Pagamentos manuais', description: 'Analise comprovantes, aprove ou reprove pagamentos e libere planos com segurança.' },
    plans: { title: 'Planos', description: 'Configure planos, preços, limites, recursos e links de pagamento.' },
    briefings: { title: 'Briefings', description: 'Acompanhe informações enviadas por clientes e transforme briefings em implantações.' },
    implementations: { title: 'Implantações', description: 'Gerencie a esteira de configuração, entrega e publicação das agendas.' },
    keys: { title: 'Keys', description: 'Gere, audite, copie, revogue e acompanhe keys promocionais e acessos temporários.' },
    webhooks: { title: 'Webhooks', description: 'Monitore eventos externos, payloads, falhas e reprocessamentos.' },
    logs: { title: 'Logs', description: 'Audite eventos técnicos, ações administrativas e erros do sistema.' },
    audit: { title: 'Auditoria', description: 'Veja ações sensíveis, responsáveis, motivos, antes/depois e entidades afetadas.' },
    support: { title: 'Suporte 360º', description: 'Encontre qualquer cliente e resolva problemas com visão completa da conta.' },
    settings: { title: 'Configurações', description: 'Controle planos, mensagens padrão, integrações, prazos, alertas e permissões.' },
    health: { title: 'Saúde do sistema', description: 'Detecte inconsistências, dados incompletos e integrações com falha.' },
    tools: { title: 'Ferramentas', description: 'Utilitários internos para diagnóstico, testes, links, slugs e operação.' },
  };

  const loadDashboard = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch('/api/dev?action=dashboard', { headers: devHeaders() });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) throw new Error(data?.message || 'Não foi possível carregar a Central Dev.');
      setDashboard(data);
      setLastSync(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      pushToast({ tone: 'success', title: 'Dados sincronizados', message: 'A Central Dev foi atualizada com os dados do Supabase.' });
    } catch (error) {
      pushToast({ tone: 'warning', title: 'Falha ao sincronizar', message: friendlyErrorMessage(error, 'Tente novamente.', 'dev') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (session?.token) loadDashboard(); }, [session?.token]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/dev?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(login)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) throw new Error(data?.message || 'Conta dev não encontrada.');

      const nextSession: DevSession | null = data.session?.token
        ? data.session
        : data.token
          ? {
              token: data.token,
              email: data.email || login.email,
              role: data.role || 'developer',
              expiresAt: new Date(Date.now() + Number(data.expiresInSeconds || 28800) * 1000).toISOString(),
            }
          : null;

      if (!nextSession?.token) throw new Error('Login autorizado, mas a sessão administrativa não foi criada.');
      saveDevSession(nextSession);
      setSession(nextSession);
      setLogin({ email: '', password: '' });
      pushToast({ tone: 'success', title: 'Central Dev liberada', message: 'Acesso administrativo autorizado.' });
    } catch (error) {
      pushToast({ tone: 'warning', title: 'Acesso negado', message: friendlyErrorMessage(error, 'Verifique as credenciais.', 'dev') });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('agendapro:dev-session');
    setSession(null);
    setDashboard(null);
  };

  const money = (value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
  const rows = {
    clients: dashboard?.clients || dashboard?.accounts || [],
    companies: dashboard?.companies || [],
    agendas: dashboard?.agendas || dashboard?.createdAgendas || [],
    appointments: dashboard?.appointments || dashboard?.bookingRequests || [],
    payments: dashboard?.payments || [],
    manual: dashboard?.manualPayments || dashboard?.manualPaymentRequests || [],
    briefings: dashboard?.briefings || [],
    implementations: dashboard?.implementations || [],
    keys: dashboard?.keys || dashboard?.licenseKeys || [],
    webhooks: dashboard?.webhooks || dashboard?.webhookEvents || [],
    logs: dashboard?.logs || dashboard?.activityLogs || [],
    audit: dashboard?.auditLogs || [],
    settings: dashboard?.settings || [],
    supportNotes: dashboard?.supportNotes || [],
    systemAlerts: dashboard?.systemAlerts || []
  };

  const storedPlanMap = new Map((dashboard?.plans || rows.settings.filter((item: any) => String(item.key || '').startsWith('plan:'))).map((item: any) => [String(item.key || '').replace('plan:', ''), item]));
  const adminPlans = plans.map(plan => {
    const saved = storedPlanMap.get(plan.id) as any;
    const value = saved?.value || {};
    return {
      ...plan,
      id: plan.id,
      key: `plan:${plan.id}`,
      price: value.price ?? plan.price,
      setup: value.setup ?? plan.setup,
      payment_link: value.payment_link || mercadoPagoLinks[plan.id],
      description: value.description || plan.description,
      features: value.features || plan.features,
      status: value.status || 'active',
      value,
      saved
    };
  });

  const metrics = {
    clients: rows.clients.length,
    companies: rows.companies.length,
    agendas: rows.agendas.length,
    appointments: rows.appointments.length,
    payments: rows.payments.length,
    manualPending: rows.manual.filter((x: any) => ['pending', 'pending_review', 'needs_adjustment'].includes(String(x.status || '').toLowerCase())).length,
    paymentPending: [...rows.payments, ...rows.manual].filter((x: any) => devIsPendingStatus(x.status)).length,
    paymentsApproved: [...rows.payments, ...rows.manual].filter((x: any) => ['approved', 'approved_manual', 'paid'].includes(cleanDevStatus(x.status))).length,
    revenuePending: [...rows.payments, ...rows.manual].filter((x: any) => devIsPendingStatus(x.status)).reduce((sum: number, x: any) => sum + Number(x.amount || x.value || 0), 0),
    companiesPending: rows.companies.filter((x: any) => devIsPendingStatus(x.subscription_status || x.status || x.payment_status)).length,
    companiesSuspended: rows.companies.filter((x: any) => devIsSuspendedStatus(x.subscription_status || x.status || x.payment_status)).length,
    published: rows.agendas.filter((x: any) => x.published || x.status === 'published').length,
    draftAgendas: rows.agendas.filter((x: any) => !(x.published || x.status === 'published')).length,
    webhooksError: rows.webhooks.filter((x: any) => ['error', 'failed'].includes(String(x.status || x.severity || '').toLowerCase()) || x.processing_error).length,
    logsCritical: rows.logs.filter((x: any) => ['critical', 'error'].includes(String(x.severity || '').toLowerCase())).length,
    revenue: [...rows.payments, ...rows.manual].filter((x: any) => ['approved', 'approved_manual', 'paid'].includes(String(x.status || '').toLowerCase())).reduce((sum: number, x: any) => sum + Number(x.amount || x.value || 0), 0),
    activeAccounts: rows.clients.filter((x: any) => ['active', 'trial'].includes(String(x.status || x.subscription_status || '').toLowerCase())).length,
    activeKeys: rows.keys.filter((x: any) => ['active', 'available'].includes(String(x.status || '').toLowerCase())).length,
    filteredLogs: rows.logs.filter((x: any) => matchesDevAdvancedFilters(x, advancedFilters)).length
  };
  const commercialRows = buildDevCommercialRows(rows);
  const commercialMetrics = {
    total: commercialRows.length,
    active: commercialRows.filter(item => devIsActiveStatus(item.planStatus)).length,
    pending: commercialRows.filter(item => item.filterTokens.includes('pending')).length,
    suspended: commercialRows.filter(item => item.filterTokens.includes('suspended') || item.filterTokens.includes('expired')).length,
    published: commercialRows.filter(item => item.filterTokens.includes('agenda_published')).length,
    noAgenda: commercialRows.filter(item => item.filterTokens.includes('no_agenda')).length,
    highUsage: commercialRows.filter(item => item.filterTokens.includes('high_usage')).length,
    noRecent: commercialRows.filter(item => item.filterTokens.includes('no_recent')).length,
  };

  const searchPool = [
    ...rows.clients.map((x: any) => ({ type: 'Cliente', title: x.name || x.full_name || x.email, subtitle: `${x.email || ''} ${x.whatsapp || x.phone || ''}`, tab: 'clients', raw: x, entity: 'client' })),
    ...rows.companies.map((x: any) => ({ type: 'Empresa', title: x.name || x.business_name, subtitle: `${x.slug || x.public_slug || ''} ${x.email || ''}`, tab: 'companies', raw: x, entity: 'company' })),
    ...rows.agendas.map((x: any) => ({ type: 'Agenda', title: x.business_name || x.name, subtitle: x.public_slug || x.slug || '', tab: 'agendas', raw: x, entity: 'agenda' })),
    ...rows.appointments.map((x: any) => ({ type: 'Agendamento', title: x.customer_name || x.name, subtitle: `${x.agenda_slug || ''} ${x.requested_time || ''}`, tab: 'appointments', raw: x, entity: 'appointment' })),
    ...rows.payments.map((x: any) => ({ type: 'Pagamento', title: x.plan || x.status || x.id, subtitle: `${x.email || x.payer_email || ''} ${x.amount || ''}`, tab: 'payments', raw: x, entity: 'payment' })),
    ...rows.manual.map((x: any) => ({ type: 'Manual', title: x.plan_name || x.plan || x.requested_plan || x.status, subtitle: `${x.email || ''} ${x.amount || ''}`, tab: 'manual', raw: x, entity: 'manual_payment' })),
    ...rows.keys.map((x: any) => ({ type: 'Key', title: x.label || x.plan_id || x.type || 'Key', subtitle: `${x.key_prefix || ''} ${x.status || ''}`, tab: 'keys', raw: x, entity: 'license_key' })),
    ...rows.briefings.map((x: any) => ({ type: 'Briefing', title: x.business_name || x.company_name || x.name || x.email, subtitle: x.status || x.email || '', tab: 'briefings', raw: x, entity: 'briefing' })),
    ...rows.implementations.map((x: any) => ({ type: 'Implantação', title: x.title || x.company_name || x.business_name, subtitle: x.status || x.priority || '', tab: 'implementations', raw: x, entity: 'implementation' })),
  ];

  const globalResults = searchPool.filter(item => {
    const q = query.trim().toLowerCase();
    if (!q) return false;
    return `${item.type} ${item.title || ''} ${item.subtitle || ''} ${JSON.stringify(item.raw || {})}`.toLowerCase().includes(q);
  }).slice(0, 10);

  const runAction = async (entity: string, action: string, item: any, payload: any = {}, reason = '', successMessage?: string) => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/dev?action=execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...devHeaders() },
        body: JSON.stringify({ entity: normalizeCanonicalEntity(entity), action, id: item?.id || item?.key, payload, reason })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) throw new Error(data?.message || 'Ação não concluída.');
      pushToast({ tone: 'success', title: 'Ação executada', message: successMessage || `${action} aplicado com sucesso.` });
      await loadDashboard();
      setEditing(null);
      setConfirming(null);
    } catch (error) {
      pushToast({ tone: 'warning', title: 'Falha na ação', message: friendlyErrorMessage(error, 'Tente novamente.', 'dev') });
    } finally {
      setActionLoading(false);
    }
  };

  const openEdit = (entity: string, item: any, title?: string) => {
    const canonical = normalizeCanonicalEntity(entity);
    setEditing({ entity: canonical, item, title: title || `Editar ${canonical}` });
  };

  const openConfirm = (target: DevConfirmTarget) => setConfirming({ ...target, entity: normalizeCanonicalEntity(target.entity) });

  const saveEdit = async (values: Record<string, any>, fields: DevEditableField[]) => {
    if (!editing) return;
    const payload = normalizeDevFormPayload(values, fields);
    if (editing.entity === 'plan' && typeof payload.features === 'string') payload.features = payload.features.split(',').map((v: string) => v.trim()).filter(Boolean);
    if (editing.entity === 'setting' && typeof payload.value === 'string') {
      try { payload.value = JSON.parse(payload.value); } catch { payload.value = { value: payload.value }; }
    }
    await runAction(editing.entity, 'update', editing.item, payload, '', 'Alterações salvas no Supabase.');
  };

  const createLicenseKeyFromPanel = async () => {
    const quantity = Math.max(1, Math.min(Number(keyForm.quantity || 1), 50));
    const durationDays = Math.max(1, Math.min(Number(keyForm.durationDays || 30), 3650));
    const maxUses = Math.max(1, Math.min(Number(keyForm.maxUses || 1), 500));
    openConfirm({
      entity: 'license_key',
      action: 'create',
      item: { id: 'new' },
      payload: { type: keyForm.type, planId: keyForm.planId, durationDays, quantity, maxUses, validityDays: Number(keyForm.validityDays || 90), notes: keyForm.notes },
      title: 'Gerar key promocional',
      message: `Gerar ${quantity} key(s) para o plano ${keyForm.planId}, duração de ${durationDays} dia(s) e limite de ${maxUses} uso(s)?`,
      confirmLabel: 'Gerar key'
    });
  };

  const confirmCreateKey = async (payload: any) => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/dev?action=create-license-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...devHeaders() },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) throw new Error(data?.message || 'Erro ao gerar key.');
      setGeneratedKeys(Array.isArray(data.keys) ? data.keys : []);
      pushToast({ tone: 'success', title: 'Key gerada', message: 'Copie agora. A key completa aparece somente neste momento.' });
      setConfirming(null);
      await loadDashboard();
    } catch (error) {
      pushToast({ tone: 'warning', title: 'Falha ao gerar key', message: friendlyErrorMessage(error, 'Verifique a tabela agendapro_license_keys.', 'dev') });
    } finally {
      setActionLoading(false);
    }
  };

  const exportEntity = (entity: string) => window.open(`/api/dev?action=export&entity=${entity}`, '_blank', 'noopener,noreferrer');
  const downloadDevText = (name: string, content: string, type = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  };
  const exportFiltered = (entity: string, data: any[]) => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadDevText(`agendapro-${entity}-${stamp}.json`, JSON.stringify({ entity, generatedAt: new Date().toISOString(), filters: advancedFilters, total: data.length, data }, null, 2), 'application/json');
  };
  const exportSummary = (entity: string, data: any[]) => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadDevText(`agendapro-${entity}-resumo-${stamp}.txt`, makeDevExportText(tabCopy[activeTab]?.title || entity, data));
  };
  const copy = async (text: string, label = 'copiado') => { await navigator.clipboard?.writeText(String(text || '')); pushToast({ tone: 'success', title: 'Copiado', message: `${label} copiado.` }); };
  const isDemoLike = (value: any) => /arena|aurora|demo|teste/i.test(String(value || ''));
  const buildPublicLink = (slug: string) => `${window.location.origin}/#/agenda/${slug}`;
  const buildBookingLink = (slug: string) => `${window.location.origin}/#/agendar/${slug}`;

  const statusBadge = (status: any) => {
    const normalized = String(status || 'sem status').toLowerCase();
    const tone = /approved|active|published|success|confirmado|concluído|paid|available|resolved/.test(normalized) ? 'success'
      : /pending|pendente|review|solicitado|needs|paused|draft/.test(normalized) ? 'warning'
      : /error|rejected|cancel|recusado|suspended|critical|revoked|disabled|failed|deleted/.test(normalized) ? 'danger'
      : 'neutral';
    return <span className={`dev-status ${tone}`}>{statusLabel(normalized)}</span>;
  };

  if (!session?.token) {
    return <div className="dev-login-shell">
      <form className="dev-login-card" onSubmit={submit}>
        <Badge tone="purple">Acesso interno</Badge>
        <h1>Central Dev AgendaPro</h1>
        <p>Console operacional protegido para administrar clientes, empresas, agendas, pagamentos, keys, logs e suporte.</p>
        <input value={login.email} onChange={e => setLogin({ ...login, email: e.target.value })} placeholder="E-mail do desenvolvedor" />
        <input type="password" value={login.password} onChange={e => setLogin({ ...login, password: e.target.value })} placeholder="Senha" />
        <button className="btn primary full" disabled={loading}>{loading ? 'Validando...' : 'Entrar na Central Dev'}</button>
      </form>
    </div>;
  }

  const renderMetric = (title: string, value: any, icon: ReactNode, note?: string) => <div className="dev-metric-card">
    <span>{icon}</span><small>{title}</small><b>{value}</b>{note && <em>{note}</em>}
  </div>;

  const renderOverview = () => {
    const alerts = [
      { label: 'Pagamentos manuais pendentes', value: metrics.manualPending, tone: 'warning', tab: 'manual' },
      { label: 'Webhooks com erro', value: metrics.webhooksError, tone: 'danger', tab: 'webhooks' },
      { label: 'Logs críticos', value: metrics.logsCritical, tone: 'danger', tab: 'logs' },
      { label: 'Agendas sem serviço', value: rows.agendas.filter((a: any) => !(a.services || []).length).length, tone: 'warning', tab: 'agendas' },
      { label: 'Dados demo detectados', value: rows.agendas.filter((a: any) => isDemoLike(a.business_name) || isDemoLike(a.public_slug)).length, tone: 'danger', tab: 'agendas' },
    ].filter(a => a.value > 0);

    return <>
      <section className="dev-metrics-grid">
        {renderMetric('Clientes', metrics.clients, <Users size={20} />, 'contas cadastradas')}
        {renderMetric('Empresas', metrics.companies, <Building2 size={20} />, 'vínculos ativos')}
        {renderMetric('Agendas', metrics.agendas, <CalendarClock size={20} />, `${metrics.published} publicadas`)}
        {renderMetric('Agendamentos', metrics.appointments, <Clock3 size={20} />, 'solicitações totais')}
        {renderMetric('Receita validada', money(metrics.revenue), <CreditCard size={20} />, 'manual + automática')}
        {renderMetric('Receita pendente', money(metrics.revenuePending), <AlertTriangle size={20} />, `${metrics.paymentPending} pagamento(s) em análise`)}
        {renderMetric('Empresas suspensas', metrics.companiesSuspended, <ShieldCheck size={20} />, 'risco comercial')}
        {renderMetric('Keys', rows.keys.length, <KeyRound size={20} />, 'licenças geradas')}
      </section>

      <section className="dev-grid-2">
        <div className="dev-panel-card"><div className="dev-card-title"><h3>Funil operacional</h3><span>Briefing → pagamento → agenda → agendamento</span></div>
          <div className="dev-funnel">{[['Briefings', rows.briefings.length], ['Pagamentos', rows.payments.length + rows.manual.length], ['Agendas publicadas', metrics.published], ['Agendamentos', metrics.appointments]].map(([label, value]) => <div key={String(label)}><span>{label}</span><b>{value}</b><div><i style={{ width: `${Math.min(100, Number(value) * 12 + 12)}%` }} /></div></div>)}</div>
        </div>
        <div className="dev-panel-card"><div className="dev-card-title"><h3>Alertas operacionais</h3><span>Itens que exigem atenção</span></div>
          {alerts.length ? alerts.map(alert => <button className={`dev-alert-row ${alert.tone}`} key={alert.label} onClick={() => setActiveTab(alert.tab)}><strong>{alert.label}</strong><span>{alert.value}</span></button>) : <div className="dev-empty-mini">Nenhum alerta crítico detectado.</div>}
        </div>
      </section>

      <section className="dev-panel-card">
        <div className="dev-card-title"><div><h3>Radar comercial</h3><span>Clientes com maior risco operacional ou oportunidade de suporte.</span></div><button type="button" onClick={() => setActiveTab('commercial')}>Abrir operação comercial</button></div>
        <div className="commercial-radar-list">
          {commercialRows.slice(0, 5).map(row => <button key={row.id} className={`commercial-radar-row ${row.risk}`} onClick={() => setSelected({ type: 'Comercial 360º', entity: row.company ? 'company' : 'client', raw: row.company || row.account || row, commercial: row })}>
            <span><b>{row.name}</b><small>{row.email || row.whatsapp || 'sem contato principal'}</small></span>
            <em>{row.pending[0] || 'operação saudável'}</em>
            <strong>{row.appointmentsCount} ag.</strong>
          </button>)}
          {!commercialRows.length && <div className="dev-empty-mini">Sem clientes carregados para análise comercial.</div>}
        </div>
      </section>

      <section className="dev-panel-card"><div className="dev-card-title"><h3>Últimos eventos</h3><span>Ações recentes registradas no sistema</span></div>
        <div className="dev-timeline">
          {rows.logs.slice(0, 8).map((log: any, index: number) => <button key={log.id || index} onClick={() => setSelected({ type: 'Log', data: log })}><i className={`dot ${String(log.severity || 'info').toLowerCase()}`} /><div><b>{log.title || log.action || 'Evento registrado'}</b><span>{log.description || log.type || 'Sem descrição'}</span></div><small>{formatDate(log.created_at)}</small></button>)}
          {!rows.logs.length && <div className="dev-empty-mini">Sem eventos registrados ainda.</div>}
        </div>
      </section>
    </>;
  };

  const renderEntityTable = (entity: string, data: any[], columns: Array<[string, (item: any) => ReactNode]>, actions: (item: any) => ReactNode) => {
    const q = query.trim().toLowerCase();
    const visible = data.filter(item => {
      const text = JSON.stringify(item || {}).toLowerCase();
      const byQuery = !q || text.includes(q);
      const byFilter = filter === 'all' || String(item.status || item.payment_status || item.subscription_status || item.severity || '').toLowerCase().includes(filter);
      return byQuery && byFilter && matchesDevAdvancedFilters(item, advancedFilters);
    });
    const allStatuses = Array.from(new Set(data.map(item => devStatusToken(item)).filter(Boolean))).slice(0, 16);

    return <div className="dev-panel-card">
      <div className="dev-table-toolbar"><div><h3>{tabCopy[activeTab]?.title}</h3><span>{visible.length} de {data.length} registros encontrados</span></div><div><select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Todos</option><option value="active">Ativos</option><option value="pending">Pendentes</option><option value="approved">Aprovados</option><option value="rejected">Reprovados</option><option value="published">Publicados</option><option value="error">Erros</option></select><button type="button" onClick={() => exportEntity(entity)}><Download size={15}/> CSV/API</button><button type="button" onClick={() => exportFiltered(entity, visible)}><Download size={15}/> JSON</button><button type="button" onClick={() => exportSummary(entity, visible)}><FileText size={15}/> Resumo</button></div></div>
      <div className="dev-advanced-filter-bar"><label><span>Status real</span><select value={advancedFilters.status} onChange={e => setAdvancedFilters(prev => ({ ...prev, status: e.target.value }))}><option value="all">Todos</option>{allStatuses.map(status => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></label><label><span>Plano</span><select value={advancedFilters.plan} onChange={e => setAdvancedFilters(prev => ({ ...prev, plan: e.target.value }))}><option value="all">Todos</option><option value="essential">Essencial</option><option value="professional">Profissional</option><option value="business">Empresa</option><option value="implementation">Implantação</option></select></label><label><span>Entidade/log</span><select value={advancedFilters.entity} onChange={e => setAdvancedFilters(prev => ({ ...prev, entity: e.target.value }))}><option value="all">Todas</option><option value="client">Cliente</option><option value="company">Empresa</option><option value="agenda">Agenda</option><option value="booking">Agendamento</option><option value="payment">Pagamento</option><option value="license">Key</option></select></label><label><span>De</span><input type="date" value={advancedFilters.dateFrom} onChange={e => setAdvancedFilters(prev => ({ ...prev, dateFrom: e.target.value }))} /></label><label><span>Até</span><input type="date" value={advancedFilters.dateTo} onChange={e => setAdvancedFilters(prev => ({ ...prev, dateTo: e.target.value }))} /></label><button type="button" onClick={() => { setFilter('all'); setAdvancedFilters(emptyDevFilters); }}>Limpar filtros</button></div>
      {loading ? <div className="dev-skeleton-list">{[1,2,3,4].map(i => <span key={i} />)}</div> : visible.length ? <div className="dev-data-table"><table><thead><tr>{columns.map(([label]) => <th key={label}>{label}</th>)}<th>Ações</th></tr></thead><tbody>{visible.map((item, index) => <tr key={item.id || index}>{columns.map(([label, render]) => <td key={label}>{render(item)}</td>)}<td>{actions(item)}</td></tr>)}</tbody></table></div> : <div className="dev-empty-state"><Search size={28}/><b>Nenhum registro encontrado</b><span>Ajuste filtros, sincronize dados ou verifique se as tabelas foram criadas no Supabase.</span></div>}
    </div>;
  };

  const quickActions = (item: any, entity: string) => {
    const canonical = normalizeCanonicalEntity(entity);
    const slug = item.public_slug || item.slug || item.agenda_slug;
    return <div className="dev-actions">
      <button type="button" onClick={() => setSelected({ type: canonical, data: item })}>Detalhes</button>
      {['client', 'company', 'agenda', 'payment', 'manual_payment', 'license_key', 'webhook', 'briefing', 'implementation'].includes(canonical) && <button type="button" onClick={() => openEdit(canonical, item)}>Editar</button>}
      {canonical === 'client' && <><button type="button" onClick={() => openConfirm({ entity: 'client', action: 'activate', item, payload: { status: 'active', subscription_status: 'active' }, title: 'Ativar cliente', message: 'Ativar este cliente e marcar assinatura como ativa?', confirmLabel: 'Ativar' })}>Ativar</button><button type="button" onClick={() => openConfirm({ entity: 'client', action: 'temporary_access', item, payload: { duration_days: 7, plan: item.plan || item.current_plan_id || 'professional' }, title: 'Liberar acesso temporário', message: 'Liberar 7 dias de acesso temporário para este cliente?', confirmLabel: 'Liberar 7 dias', requireReason: true })}>7 dias</button><button type="button" onClick={() => openConfirm({ entity: 'client', action: 'suspend', item, payload: { status: 'suspended', subscription_status: 'suspended' }, title: 'Suspender cliente', message: 'Suspender este cliente?', confirmLabel: 'Suspender', requireReason: true, danger: true })}>Suspender</button></>}
      {canonical === 'company' && <><button type="button" onClick={() => openConfirm({ entity: 'company', action: 'activate', item, payload: { status: 'active', subscription_status: 'active' }, title: 'Ativar empresa', message: 'Ativar esta empresa?', confirmLabel: 'Ativar' })}>Ativar</button><button type="button" onClick={() => openConfirm({ entity: 'company', action: 'temporary_access', item, payload: { duration_days: 7, current_plan_id: item.current_plan_id || item.plan || 'professional' }, title: 'Liberar acesso temporário', message: 'Liberar 7 dias de acesso temporário para esta empresa?', confirmLabel: 'Liberar 7 dias', requireReason: true })}>7 dias</button><button type="button" onClick={() => openConfirm({ entity: 'company', action: 'suspend', item, payload: { status: 'suspended', subscription_status: 'suspended' }, title: 'Suspender empresa', message: 'Suspender esta empresa?', confirmLabel: 'Suspender', requireReason: true, danger: true })}>Suspender</button>{slug && <><button type="button" onClick={() => window.open(buildPublicLink(slug), '_blank')}>Página</button><button type="button" onClick={() => copy(buildBookingLink(slug), 'Link de agendamento')}>Copiar</button></>}</>}
      {canonical === 'agenda' && <>{slug && <><button type="button" onClick={() => window.open(buildPublicLink(slug), '_blank')}>Pública</button><button type="button" onClick={() => copy(buildBookingLink(slug), 'Link de agendamento')}>Copiar</button><button type="button" onClick={() => window.open(`#/conta/agenda/${slug}/dashboard`, '_blank')}>Dashboard</button></>}<button type="button" onClick={() => openConfirm({ entity: 'agenda', action: 'publish', item, payload: { status: 'published' }, title: 'Publicar agenda', message: 'Publicar esta agenda para acesso público?', confirmLabel: 'Publicar' })}>Publicar</button><button type="button" onClick={() => openConfirm({ entity: 'agenda', action: 'pause', item, payload: { status: 'paused' }, title: 'Pausar agenda', message: 'Pausar esta agenda e impedir novos agendamentos?', confirmLabel: 'Pausar', requireReason: true, danger: true })}>Pausar</button></>}
      {canonical === 'manual_payment' && <><button type="button" onClick={() => openConfirm({ entity: 'manual_payment', action: 'approve', item, payload: { status: 'approved' }, title: 'Aprovar pagamento manual', message: 'Aprovar este pagamento manual e liberar o plano automaticamente?', confirmLabel: 'Aprovar pagamento' })}>Aprovar</button><button type="button" onClick={() => openConfirm({ entity: 'manual_payment', action: 'reject', item, payload: { status: 'rejected' }, title: 'Reprovar pagamento manual', message: 'Reprovar este pagamento sem liberar o plano?', confirmLabel: 'Reprovar', requireReason: true, danger: true })}>Reprovar</button><button type="button" onClick={() => openConfirm({ entity: 'manual_payment', action: 'request_adjustment', item, payload: { status: 'needs_adjustment' }, title: 'Solicitar ajuste', message: 'Marcar este pagamento como aguardando ajuste do cliente?', confirmLabel: 'Solicitar ajuste', requireReason: true })}>Solicitar ajuste</button></>}
      {canonical === 'payment' && <><button type="button" onClick={() => openConfirm({ entity: 'payment', action: 'approve', item, payload: { status: 'paid' }, title: 'Aprovar pagamento automático', message: 'Marcar este pagamento como pago e liberar o plano vinculado?', confirmLabel: 'Aprovar pagamento', requireReason: true })}>Aprovar</button><button type="button" onClick={() => openConfirm({ entity: 'payment', action: 'reject', item, payload: { status: 'rejected' }, title: 'Reprovar pagamento automático', message: 'Marcar este pagamento como reprovado sem liberar acesso?', confirmLabel: 'Reprovar', requireReason: true, danger: true })}>Reprovar</button></>}
      {canonical === 'appointment' && <><button type="button" onClick={() => openConfirm({ entity: 'appointment', action: 'confirm', item, payload: { status: 'confirmed' }, title: 'Confirmar agendamento', message: 'Confirmar este agendamento?', confirmLabel: 'Confirmar' })}>Confirmar</button><button type="button" onClick={() => openConfirm({ entity: 'appointment', action: 'cancel', item, payload: { status: 'cancelled' }, title: 'Cancelar agendamento', message: 'Cancelar este agendamento?', confirmLabel: 'Cancelar', requireReason: true, danger: true })}>Cancelar</button></>}
      {canonical === 'license_key' && <>{(item.key_prefix || item.key_preview || item.masked_key) && <button type="button" onClick={() => copy(item.key_prefix || item.key_preview || item.masked_key, 'Prefixo da key')}>Copiar</button>}<button type="button" onClick={() => openConfirm({ entity: 'license_key', action: 'renew', item, payload: { duration_days: item.duration_days || 30 }, title: 'Renovar validade', message: 'Renovar a validade desta key conforme sua duração configurada?', confirmLabel: 'Renovar' })}>Renovar</button><button type="button" onClick={() => openConfirm({ entity: 'license_key', action: 'revoke', item, payload: { status: 'revoked' }, title: 'Revogar key', message: 'Revogar esta key? Ela não poderá ser usada futuramente.', confirmLabel: 'Revogar', requireReason: true, danger: true })}>Revogar</button><button type="button" onClick={() => openConfirm({ entity: 'license_key', action: 'disable', item, payload: { status: 'disabled' }, title: 'Desativar key', message: 'Desativar temporariamente esta key?', confirmLabel: 'Desativar', requireReason: true })}>Desativar</button><button type="button" onClick={() => openConfirm({ entity: 'license_key', action: 'reactivate', item, payload: { status: 'available' }, title: 'Reativar key', message: 'Reativar esta key?', confirmLabel: 'Reativar' })}>Reativar</button></>}
      {canonical === 'webhook' && <><button type="button" onClick={() => copy(JSON.stringify(item, null, 2), 'Payload')}>Copiar payload</button><button type="button" onClick={() => openConfirm({ entity: 'webhook', action: 'reprocess', item, payload: {}, title: 'Reprocessar webhook', message: 'Marcar este webhook para reprocessamento?', confirmLabel: 'Reprocessar' })}>Reprocessar</button><button type="button" onClick={() => openConfirm({ entity: 'webhook', action: 'resolve', item, payload: {}, title: 'Marcar como resolvido', message: 'Marcar este webhook como resolvido?', confirmLabel: 'Resolver' })}>Resolver</button></>}
      {canonical === 'briefing' && <button type="button" onClick={() => openConfirm({ entity: 'briefing', action: 'convert_to_implementation', item, payload: {}, title: 'Converter briefing', message: 'Converter este briefing em uma implantação?', confirmLabel: 'Converter' })}>Converter</button>}
      {canonical === 'implementation' && <button type="button" onClick={() => openConfirm({ entity: 'implementation', action: 'complete', item, payload: { status: 'completed' }, title: 'Concluir implantação', message: 'Marcar esta implantação como concluída?', confirmLabel: 'Concluir' })}>Concluir</button>}
      {canonical === 'log' && <button type="button" onClick={() => copy(JSON.stringify(item.metadata || item, null, 2), 'Metadata')}>Copiar metadata</button>}
    </div>;
  };

  const renderTab = () => {
    if (activeTab === 'overview') return renderOverview();
    if (activeTab === 'commercial') return <DevCommercialOpsPanel rows={commercialRows} metrics={commercialMetrics} filter={commercialFilter} setFilter={setCommercialFilter} money={money} statusBadge={statusBadge} open={(row: DevCommercialRow) => setSelected({ type: 'Comercial 360º', entity: row.company ? 'company' : 'client', raw: row.company || row.account || row, commercial: row })} setActiveTab={setActiveTab} exportRows={(visible: DevCommercialRow[]) => exportSummary('central-dev-comercial', visible)} copy={copy} />;
    if (activeTab === 'clients') return renderEntityTable('clients', rows.clients, [['Cliente', item => <><b>{item.name || item.full_name || 'Cliente sem nome'}</b><small>{item.email}</small></>], ['WhatsApp', item => item.phone || item.whatsapp || '—'], ['Plano', item => item.plan || item.current_plan_id || '—'], ['Status', item => statusBadge(item.subscription_status || item.status)], ['Criado em', item => formatDate(item.created_at)]], item => quickActions(item, 'client'));
    if (activeTab === 'companies') return renderEntityTable('companies', rows.companies, [['Empresa', item => <><b>{item.name || item.business_name || 'Empresa sem nome'}</b><small>{item.slug || item.public_slug || 'sem slug'}</small></>], ['Contato', item => <><span>{item.email || '—'}</span><small>{item.whatsapp || item.phone || ''}</small></>], ['Plano', item => item.current_plan_id || item.plan || '—'], ['Saúde', item => <>{statusBadge(item.subscription_status || item.status || 'active')}{(isDemoLike(item.name) || isDemoLike(item.public_slug || item.slug)) && <span className="dev-status danger">demo?</span>}</>], ['Criado em', item => formatDate(item.created_at)]], item => quickActions(item, 'company'));
    if (activeTab === 'agendas') return renderEntityTable('agendas', rows.agendas, [['Agenda', item => <><b>{item.business_name || item.name || 'Agenda online'}</b><small>{item.public_slug || item.slug}</small></>], ['Dados', item => <><span>{(item.services || []).length || 0} serviços</span><small>{(item.team || item.professionals || []).length || 0} profissionais</small></>], ['Publicação', item => statusBadge(item.published ? 'published' : item.status)], ['Validação', item => <>{!item.whatsapp && !item.phone ? <span className="dev-status warning">sem WhatsApp</span> : <span className="dev-status success">contato ok</span>}{!(item.services || []).length && <span className="dev-status warning">sem serviços</span>}{isDemoLike(item.business_name) && <span className="dev-status danger">demo?</span>}</>], ['Atualizada', item => formatDate(item.updated_at || item.created_at)]], item => quickActions(item, 'agenda'));
    if (activeTab === 'appointments') return renderEntityTable('appointments', rows.appointments, [['Cliente final', item => <><b>{item.customer_name || item.name || 'Cliente'}</b><small>{item.customer_phone || item.phone}</small></>], ['Agenda', item => item.agenda_slug || item.business_name || '—'], ['Serviço', item => item.service_name || item.service || '—'], ['Data/hora', item => `${item.requested_date || item.date || '—'} ${item.requested_time || item.start_time || ''}`], ['Status', item => statusBadge(item.status)]], item => quickActions(item, 'appointment'));
    if (activeTab === 'payments') return renderEntityTable('payments', rows.payments, [['Pagamento', item => <><b>{item.plan || item.description || 'Plano'}</b><small>{item.external_reference || item.id}</small></>], ['Cliente', item => item.email || item.customer_email || item.payer_email || '—'], ['Valor', item => money(item.amount || item.value)], ['Gateway', item => item.gateway || item.provider || 'Mercado Pago'], ['Status', item => statusBadge(item.status)]], item => quickActions(item, 'payment'));
    if (activeTab === 'manual') return renderEntityTable('manual_payments', rows.manual, [['Solicitação', item => <><b>{item.plan_name || item.plan || item.requested_plan || 'Plano'}</b><small>{item.email || item.customer_email}</small></>], ['Empresa', item => item.company_name || item.business_name || item.company_id || '—'], ['Valor', item => money(item.amount || item.value)], ['Status', item => statusBadge(item.status || 'pending_review')], ['Solicitado em', item => formatDate(item.created_at)]], item => quickActions(item, 'manual_payment'));
    if (activeTab === 'keys') return <>
      <DevKeyGeneratorPanel keyForm={keyForm} setKeyForm={setKeyForm} generatedKeys={generatedKeys} createKey={createLicenseKeyFromPanel} copy={copy} />
      {renderEntityTable('keys', rows.keys, [['Key', item => <><b>{item.label || item.type || 'Key promocional'}</b><small>{item.key_prefix || item.key_preview || item.masked_key || '••••••••••'}</small></>], ['Plano', item => item.plan || item.plan_id || item.plan_type || '—'], ['Uso', item => `${item.uses_count ?? item.used_count ?? item.uses ?? 0}/${item.max_uses || item.limit || 1}`], ['Expira em', item => formatDate(item.expires_at)], ['Status', item => statusBadge(item.status)]], item => quickActions(item, 'license_key'))}
    </>;
    if (activeTab === 'webhooks') return renderEntityTable('webhooks', rows.webhooks, [['Evento', item => <><b>{item.event || item.event_type || item.type || 'Webhook'}</b><small>{item.origin || item.gateway || item.action || 'Mercado Pago'}</small></>], ['Status', item => statusBadge(item.status || (item.processed ? 'processed' : 'pending') || item.severity)], ['Pagamento', item => item.payment_id || item.data_id || item.external_reference || '—'], ['Erro', item => item.processing_error || item.error || item.message || '—'], ['Recebido', item => formatDate(item.created_at || item.received_at)]], item => quickActions(item, 'webhook'));
    if (activeTab === 'logs' || activeTab === 'audit') return renderEntityTable(activeTab === 'audit' ? 'audit' : 'logs', activeTab === 'audit' ? (rows.audit.length ? rows.audit : rows.logs) : rows.logs, [['Evento', item => <><b>{item.title || item.action || item.type}</b><small>{item.description || 'Sem descrição'}</small></>], ['Severidade', item => statusBadge(item.severity || 'info')], ['Entidade', item => item.entity_type || item.company_id || item.account_id || item.entity_id || '—'], ['Origem', item => item.origin || item.source || item.actor_email || 'sistema'], ['Data', item => formatDate(item.created_at)]], item => quickActions(item, 'log'));
    if (activeTab === 'briefings') return <DevKanban title="Briefings" description="Transforme briefings recebidos em implantações, empresas e agendas." items={rows.briefings} columns={['recebido', 'em análise', 'aguardando cliente', 'aprovado', 'converted']} openEdit={(item: any) => openEdit('briefing', item)} openDetails={(item: any) => setSelected({ type: 'Briefing', data: item })} onAction={(item: any) => openConfirm({ entity: 'briefing', action: 'convert_to_implementation', item, payload: {}, title: 'Converter briefing', message: 'Converter este briefing em implantação?', confirmLabel: 'Converter' })} />;
    if (activeTab === 'implementations') return <DevKanban title="Implantações" description="Esteira operacional de implantação assistida." items={rows.implementations} columns={['aguardando briefing', 'aguardando pagamento', 'configurando agenda', 'revisão interna', 'publicado', 'entregue', 'problema', 'completed']} openEdit={(item: any) => openEdit('implementation', item)} openDetails={(item: any) => setSelected({ type: 'Implantação', data: item })} onAction={(item: any) => openConfirm({ entity: 'implementation', action: 'complete', item, payload: { status: 'completed' }, title: 'Concluir implantação', message: 'Marcar esta implantação como concluída?', confirmLabel: 'Concluir' })} />;
    if (activeTab === 'plans') return <DevPlansPanel plans={adminPlans} money={money} openEdit={(item: any) => openEdit('plan', item, 'Editar plano')} />;
    if (activeTab === 'support') return <DevSupport360 query={query} results={searchPool} open={(item: any) => setSelected(item)} edit={(item: any) => item.entity && openEdit(item.entity, item.raw)} copy={copy} />;
    if (activeTab === 'settings') return <DevSettingsPanel settings={rows.settings} openEdit={(item: any) => openEdit('setting', item, 'Configurar item')} />;
    if (activeTab === 'health') return <DevHealthPanel metrics={metrics} rows={rows} isDemoLike={isDemoLike} setActiveTab={setActiveTab} />;
    if (activeTab === 'tools') return <DevToolsPanel copy={copy} />;
    return <div className="dev-empty-state"><Wrench/><b>Área preparada</b><span>Estrutura pronta para expansão segura.</span></div>;
  };

  const sidebarBadge = (key: string) => {
    if (key === 'manual' && metrics.manualPending) return metrics.manualPending;
    if (key === 'commercial' && (commercialMetrics.pending + commercialMetrics.suspended)) return commercialMetrics.pending + commercialMetrics.suspended;
    if (key === 'webhooks' && metrics.webhooksError) return metrics.webhooksError;
    if (key === 'logs' && metrics.logsCritical) return metrics.logsCritical;
    if (key === 'health' && (metrics.webhooksError + metrics.logsCritical)) return metrics.webhooksError + metrics.logsCritical;
    if (key === 'briefings' && rows.briefings.length) return rows.briefings.length;
    return 0;
  };

  return <div className="dev-master-shell">
    <aside className="dev-master-sidebar"><div className="dev-brand"><span>AP</span><div><b>AgendaPro</b><small>Central Dev</small></div></div><nav>{nav.map(([key, Icon, label]) => <button key={key} className={activeTab === key ? 'active' : ''} onClick={() => { setActiveTab(key); setFilter('all'); }}><Icon size={17} /><span>{label}</span>{sidebarBadge(key) ? <em>{sidebarBadge(key)}</em> : null}</button>)}</nav></aside>
    <main className="dev-master-main">
      <header className="dev-master-header"><div><Badge tone="purple">Console operacional</Badge><h1>{tabCopy[activeTab]?.title || 'Central Dev'}</h1><p>{tabCopy[activeTab]?.description}</p></div><div className="dev-header-actions"><div className="dev-search"><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar cliente, empresa, slug, pagamento, key... (Ctrl+K)" />{globalResults.length > 0 && <div className="dev-search-results">{globalResults.map((item, index) => <button key={index} onClick={() => { setActiveTab(item.tab); setSelected(item); }}><b>{item.type}: {item.title}</b><span>{item.subtitle}</span></button>)}</div>}</div><span className="dev-env">Produção</span><span className="dev-connection success">Supabase</span><button type="button" onClick={loadDashboard} disabled={loading}><RefreshCcw size={15}/>{loading ? 'Sincronizando' : 'Atualizar dados'}</button><button type="button" onClick={() => exportEntity(activeTab === 'manual' ? 'manual_payments' : activeTab)}><Download size={15}/> Exportar</button><button type="button" onClick={() => setActiveTab('health')}><Bell size={15}/> Alertas</button><button type="button" onClick={() => setInspectorOpen(true)}><ShieldCheck size={15}/> Inspector</button><button type="button" onClick={logout}><LogOut size={15}/> Sair</button></div></header>
      <div className="dev-sync-row"><span>Última atualização: {lastSync || 'aguardando sincronização'}</span><span>Ambiente protegido • Ações críticas geram logs e auditoria</span></div>
      <section className="dev-master-content">{renderTab()}</section>
    </main>
    {inspectorOpen && <DevInspectorPanel rows={rows} metrics={metrics} close={() => setInspectorOpen(false)} exportSummary={exportSummary} />}
    {commandOpen && <div className="dev-command-backdrop" onClick={() => setCommandOpen(false)}><div className="dev-command" onClick={event => event.stopPropagation()}><div className="dev-command-top"><Search size={17}/><input autoFocus placeholder="Digite uma ação ou busca..." value={query} onChange={e => setQuery(e.target.value)} /></div>{['Buscar cliente', 'Abrir pagamentos manuais', 'Gerar key', 'Ver webhooks com erro', 'Ver logs críticos', 'Rodar diagnóstico', 'Abrir ferramentas'].map((label, index) => <button key={label} onClick={() => { setCommandOpen(false); setActiveTab(['support','manual','keys','webhooks','logs','health','tools'][index]); }}>{label}</button>)}</div></div>}
    {selected && <DetailDrawer selected={selected} close={() => setSelected(null)} copy={copy} logs={rows.logs} openEdit={(entity: string, item: any) => openEdit(entity, item)} />}
    {editing && <DevEditModal target={editing} onClose={() => setEditing(null)} onSave={saveEdit} busy={actionLoading} />}
    {confirming && <DevConfirmModal target={confirming} onClose={() => setConfirming(null)} busy={actionLoading} onConfirm={(reason) => confirming.action === 'create' && confirming.entity === 'license_key' ? confirmCreateKey(confirming.payload || {}) : runAction(confirming.entity, confirming.action, confirming.item, confirming.payload || {}, reason)} />}
  </div>;
}

function DevEditModal({ target, onClose, onSave, busy }: { target: DevEditTarget; onClose: () => void; onSave: (values: Record<string, any>, fields: DevEditableField[]) => void; busy?: boolean }) {
  const fields = target.fields || getDevEditFields(target.entity, target.item);
  const [form, setForm] = useState<Record<string, any>>(() => getInitialDevForm(target.entity, target.item, fields));
  const update = (name: string, value: any) => setForm(prev => ({ ...prev, [name]: value }));
  return <div className="dev-modal-backdrop" onClick={onClose}>
    <form className="dev-action-modal" onClick={event => event.stopPropagation()} onSubmit={event => { event.preventDefault(); onSave(form, fields); }}>
      <div className="dev-modal-head"><div><Badge tone="blue">Edição real</Badge><h2>{target.title}</h2><p>As alterações serão enviadas para o Supabase e registradas na auditoria.</p></div><button type="button" onClick={onClose}>×</button></div>
      <div className="dev-edit-grid">
        {fields.map(field => <label key={field.name} className={field.type === 'textarea' ? 'wide' : ''}><span>{field.label}</span>
          {field.type === 'select' ? <select value={String(form[field.name] ?? '')} disabled={field.disabled} required={field.required} onChange={event => update(field.name, event.target.value)}>{field.options?.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
            : field.type === 'textarea' ? <textarea value={String(form[field.name] ?? '')} disabled={field.disabled} required={field.required} placeholder={field.placeholder} onChange={event => update(field.name, event.target.value)} />
              : <input type={field.type || 'text'} value={String(form[field.name] ?? '')} disabled={field.disabled} required={field.required} placeholder={field.placeholder} onChange={event => update(field.name, event.target.value)} />}
        </label>)}
      </div>
      <div className="dev-modal-actions"><button type="button" onClick={onClose}>Cancelar</button><button type="submit" disabled={busy}>{busy ? 'Salvando...' : 'Salvar alterações'}</button></div>
    </form>
  </div>;
}

function DevConfirmModal({ target, onClose, onConfirm, busy }: { target: DevConfirmTarget; onClose: () => void; onConfirm: (reason: string) => void; busy?: boolean }) {
  const [reason, setReason] = useState('');
  return <div className="dev-modal-backdrop" onClick={onClose}>
    <div className={`dev-action-modal dev-confirm-modal ${target.danger ? 'danger' : ''}`} onClick={event => event.stopPropagation()}>
      <div className="dev-modal-head"><div><Badge tone={target.danger ? 'red' : 'amber'}>Confirmação</Badge><h2>{target.title}</h2><p>{target.message}</p></div><button type="button" onClick={onClose}>×</button></div>
      {target.requireReason && <label className="dev-reason-box"><span>Motivo obrigatório para auditoria</span><textarea value={reason} onChange={event => setReason(event.target.value)} placeholder="Explique o motivo da ação para ficar registrado nos logs." /></label>}
      <div className="dev-modal-actions"><button type="button" onClick={onClose}>Cancelar</button><button type="button" className={target.danger ? 'danger' : ''} disabled={busy || (target.requireReason && !reason.trim())} onClick={() => onConfirm(reason)}>{busy ? 'Executando...' : target.confirmLabel || 'Confirmar'}</button></div>
    </div>
  </div>;
}


function DevKanban({ title, description, items, columns, openEdit, openDetails, onAction }: { title: string; description: string; items: any[]; columns: string[]; openEdit?: (item: any) => void; openDetails?: (item: any) => void; onAction?: (item: any) => void }) {
  return <div className="dev-panel-card"><div className="dev-card-title"><h3>{title}</h3><span>{description}</span></div><div className="dev-kanban">{columns.map(column => {
    const columnItems = (items || []).filter(item => String(item.status || '').toLowerCase() === column.toLowerCase()).slice(0, 8);
    return <div key={column}><h4>{column}</h4>{columnItems.map((item, index) => <article key={item.id || index}><b>{item.company_name || item.business_name || item.name || item.title || 'Registro operacional'}</b><span>{item.email || item.plan || item.priority || item.status || 'Sem detalhes'}</span><div className="kanban-actions">{openDetails && <button type="button" onClick={() => openDetails(item)}>Detalhes</button>}{openEdit && <button type="button" onClick={() => openEdit(item)}>Editar</button>}{onAction && <button type="button" onClick={() => onAction(item)}>{title.includes('Briefing') ? 'Converter' : 'Concluir'}</button>}</div></article>)}{!columnItems.length && <small>Nenhum item</small>}</div>;
  })}</div></div>;
}

function DevKeyGeneratorPanel({ keyForm, setKeyForm, generatedKeys, createKey, copy }: {
  keyForm: { type: string; planId: string; durationDays: string; quantity: string; maxUses: string; validityDays: string; notes: string };
  setKeyForm: Dispatch<SetStateAction<{ type: string; planId: string; durationDays: string; quantity: string; maxUses: string; validityDays: string; notes: string }>>;
  generatedKeys: string[];
  createKey: () => void;
  copy: (text: string, label?: string) => void;
}) {
  return <div className="dev-panel-card dev-key-generator">
    <div className="dev-card-title"><div><h3>Gerar nova key promocional</h3><span>Crie trials, acessos temporários e licenças controladas. A key completa aparece apenas no momento da geração.</span></div><button type="button" onClick={createKey}><KeyRound size={16}/> Gerar key</button></div>
    <div className="dev-key-form-grid">
      <label>Tipo<select value={keyForm.type} onChange={e => setKeyForm(prev => ({ ...prev, type: e.target.value }))}><option value="trial_professional">Trial Profissional</option><option value="trial_business">Trial Business</option><option value="trial_essential">Trial Essencial</option><option value="access_temporary">Acesso temporário</option><option value="implementation">Implantação assistida</option><option value="custom">Plano personalizado</option></select></label>
      <label>Plano liberado<select value={keyForm.planId} onChange={e => setKeyForm(prev => ({ ...prev, planId: e.target.value }))}><option value="essential">Essencial</option><option value="professional">Profissional</option><option value="business">Empresa</option></select></label>
      <label>Duração em dias<input type="number" min="1" max="3650" value={keyForm.durationDays} onChange={e => setKeyForm(prev => ({ ...prev, durationDays: e.target.value }))} /></label>
      <label>Quantidade<input type="number" min="1" max="50" value={keyForm.quantity} onChange={e => setKeyForm(prev => ({ ...prev, quantity: e.target.value }))} /></label>
      <label>Limite de uso<input type="number" min="1" max="500" value={keyForm.maxUses} onChange={e => setKeyForm(prev => ({ ...prev, maxUses: e.target.value }))} /></label>
      <label>Validade da key<input type="number" min="1" max="3650" value={keyForm.validityDays} onChange={e => setKeyForm(prev => ({ ...prev, validityDays: e.target.value }))} /></label>
      <label className="wide">Observação interna<input value={keyForm.notes} onChange={e => setKeyForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Ex: cortesia para teste controlado" /></label>
    </div>
    {generatedKeys.length > 0 && <div className="generated-keys-box"><strong>Keys geradas agora</strong><p>Copie antes de sair desta tela. Por segurança, depois disso o sistema guarda apenas hash/prefixo.</p>{generatedKeys.map(key => <div key={key}><code>{key}</code><button type="button" onClick={() => copy(key, 'Key completa')}>Copiar</button></div>)}</div>}
  </div>;
}

function DevPlansPanel({ plans, money, openEdit }: { plans: any[]; money: (v: any) => string; openEdit: (item: any) => void }) {
  return <div className="dev-plans-grid">{plans.map(plan => <article className="dev-plan-card" key={plan.id}><span>{plan.name}</span><b>{Number(plan.price) ? money(plan.price) : 'Sob regra'}</b><p>{plan.description}</p><small>{plan.status === 'active' ? 'Ativo' : plan.status}</small><button type="button" onClick={() => openEdit(plan)}>Editar configuração</button><button type="button" onClick={() => navigator.clipboard?.writeText(plan.payment_link || '')}>Copiar link MP</button></article>)}</div>;
}

function DevCommercialOpsPanel({ rows, metrics, filter, setFilter, money, statusBadge, open, setActiveTab, exportRows, copy }: { rows: DevCommercialRow[]; metrics: any; filter: string; setFilter: Dispatch<SetStateAction<string>>; money: (v: any) => string; statusBadge: (status: any) => ReactNode; open: (row: DevCommercialRow) => void; setActiveTab: Dispatch<SetStateAction<string>>; exportRows: (rows: DevCommercialRow[]) => void; copy: (text: string, label?: string) => void }) {
  const filters = [
    ['all', 'Todos'],
    ['active', 'Ativos'],
    ['pending', 'Pendentes'],
    ['suspended', 'Suspensos'],
    ['payment_pending', 'Pagamento pendente'],
    ['agenda_published', 'Agenda publicada'],
    ['no_agenda', 'Sem agenda'],
    ['implementation', 'Implantação'],
    ['high_usage', 'Alto uso'],
    ['no_recent', 'Sem uso recente'],
  ];
  const visible = filter === 'all' ? rows : rows.filter(row => row.filterTokens.includes(filter));
  const pendingRows = rows.filter(row => row.pending.length).slice(0, 6);
  const summary = visible.map(row => `${row.name} | ${row.email || row.whatsapp || 'sem contato'} | plano ${row.plan} | pagamento ${row.paymentStatus} | agenda ${row.agendaStatus} | pendências: ${row.pending.join(', ') || 'nenhuma'}`).join('\n');

  return <div className="commercial-ops-panel">
    <section className="commercial-metrics-grid">
      <article><span>Total comercial</span><b>{metrics.total}</b><small>clientes e empresas acompanhados</small></article>
      <article><span>Ativos</span><b>{metrics.active}</b><small>plano ou trial liberado</small></article>
      <article><span>Pendentes</span><b>{metrics.pending}</b><small>pagamento, plano ou publicação</small></article>
      <article><span>Suspensos/vencidos</span><b>{metrics.suspended}</b><small>risco de churn ou bloqueio</small></article>
      <article><span>Agenda publicada</span><b>{metrics.published}</b><small>com página operacional</small></article>
      <article><span>Sem uso recente</span><b>{metrics.noRecent}</b><small>prioridade de suporte</small></article>
    </section>

    <section className="dev-panel-card">
      <div className="dev-card-title"><div><h3>Clientes e empresas</h3><span>{visible.length} de {rows.length} registros comerciais filtrados</span></div><div><button type="button" onClick={() => exportRows(visible)}>Resumo TXT</button><button type="button" onClick={() => copy(summary, 'Resumo comercial')}>Copiar resumo</button></div></div>
      <div className="commercial-filter-pills">{filters.map(([value, label]) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}</button>)}</div>
      <div className="commercial-table">
        {visible.map(row => <article key={row.id} className={`commercial-client-card ${row.risk}`}>
          <button type="button" className="commercial-client-main" onClick={() => open(row)}>
            <span><b>{row.name}</b><small>{row.owner} · {row.email || row.whatsapp || 'sem contato'}</small></span>
            <em>{row.pending[0] || 'operação saudável'}</em>
          </button>
          <div className="commercial-client-grid">
            <span><small>Plano</small><b>{row.plan}</b>{statusBadge(row.planStatus)}</span>
            <span><small>Pagamento</small><b>{row.paymentStatus || '—'}</b>{statusBadge(row.paymentStatus)}</span>
            <span><small>Agenda</small><b>{row.agendaStatus}</b>{statusBadge(row.agendaStatus)}</span>
            <span><small>Uso</small><b>{row.appointmentsCount} agend.</b><em>{row.lastActivity ? formatDate(row.lastActivity) : 'sem atividade'}</em></span>
            <span><small>Receita</small><b>{money(row.revenue)}</b><em>validada</em></span>
          </div>
          <div className="commercial-client-actions">
            <button type="button" onClick={() => open(row)}>Inspector 360º</button>
            {row.whatsapp && <button type="button" onClick={() => window.open(`https://wa.me/${String(row.whatsapp).replace(/\D/g, '')}`, '_blank')}>WhatsApp</button>}
            {row.agenda?.public_slug || row.agenda?.slug || row.company?.public_slug || row.company?.slug ? <button type="button" onClick={() => copy(`${window.location.origin}/#/agendar/${row.agenda?.public_slug || row.agenda?.slug || row.company?.public_slug || row.company?.slug}`, 'Link público')}>Copiar agenda</button> : null}
          </div>
        </article>)}
        {!visible.length && <div className="dev-empty-state"><Search/><b>Nenhum cliente neste filtro</b><span>Troque o filtro ou atualize os dados da Central Dev.</span></div>}
      </div>
    </section>

    <section className="dev-grid-2">
      <div className="dev-panel-card"><div className="dev-card-title"><h3>Alertas comerciais</h3><span>Prioridade prática de atendimento</span></div>
        {pendingRows.length ? pendingRows.map(row => <button key={row.id} className={`dev-alert-row ${row.risk}`} onClick={() => open(row)}><strong>{row.name}</strong><span>{row.pending.slice(0, 2).join(' · ')}</span></button>) : <div className="dev-empty-mini">Sem pendências comerciais detectadas.</div>}
      </div>
      <div className="dev-panel-card"><div className="dev-card-title"><h3>Atalhos operacionais</h3><span>Rotas úteis para resolver gargalos</span></div>
        <div className="commercial-shortcuts">
          <button type="button" onClick={() => setActiveTab('manual')}>Pagamentos manuais</button>
          <button type="button" onClick={() => setActiveTab('payments')}>Pagamentos automáticos</button>
          <button type="button" onClick={() => setActiveTab('agendas')}>Agendas</button>
          <button type="button" onClick={() => setActiveTab('support')}>Suporte 360º</button>
        </div>
      </div>
    </section>
  </div>;
}

function DevSupport360({ query, results, open, edit, copy }: { query: string; results: any[]; open: (item: any) => void; edit: (item: any) => void; copy: (text: string, label?: string) => void }) {
  const visible = query.trim() ? results.slice(0, 20) : results.slice(0, 8);
  return <div className="dev-panel-card"><div className="dev-card-title"><h3>Suporte 360º</h3><span>Busque qualquer cliente, empresa, agenda, pagamento ou slug e abra a visão completa.</span></div><div className="support-grid">{visible.map((item, index) => <article className="support-result-card" key={index}><button type="button" onClick={() => open(item)}><span>{item.type}</span><b>{item.title}</b><small>{item.subtitle || 'Sem detalhe'}</small></button><div><button type="button" onClick={() => edit(item)}>Editar</button>{item.raw?.whatsapp || item.raw?.phone || item.raw?.customer_phone ? <button type="button" onClick={() => window.open(`https://wa.me/${String(item.raw.whatsapp || item.raw.phone || item.raw.customer_phone).replace(/\D/g, '')}`, '_blank')}>WhatsApp</button> : null}{item.raw?.public_slug || item.raw?.slug || item.raw?.agenda_slug ? <button type="button" onClick={() => copy(`${window.location.origin}/#/agendar/${item.raw.public_slug || item.raw.slug || item.raw.agenda_slug}`, 'Link')}>Copiar link</button> : null}</div></article>)}{!visible.length && <div className="dev-empty-state"><Search/><b>Busque para iniciar atendimento</b><span>Digite nome, e-mail, WhatsApp, slug ou protocolo.</span></div>}</div></div>;
}

function DevSettingsPanel({ settings, openEdit }: { settings: any[]; openEdit: (item: any) => void }) {
  const defaults = [
    { key: 'mercado_pago_links', description: 'Links Mercado Pago e fallback manual', value: mercadoPagoLinks, status: 'active' },
    { key: 'default_messages', description: 'Mensagens padrão de aprovação, agendamento e suporte', value: { paymentApproved: 'Seu pagamento foi aprovado.', bookingReceived: 'Recebemos sua solicitação de agendamento.' }, status: 'active' },
    { key: 'implementation_rules', description: 'Prazos e checklist da implantação assistida', value: { setupPrice: 100, sla: '24h a 48h após briefing completo' }, status: 'active' },
    { key: 'permissions', description: 'Permissões e perfis internos da Central Dev', value: { developer: 'all', support: ['read', 'update'] }, status: 'active' },
    { key: 'maintenance_mode', description: 'Modo manutenção e alertas do sistema', value: { enabled: false, message: '' }, status: 'active' },
  ];
  const byKey = new Map(settings.map(item => [item.key, item]));
  const merged = defaults.map(item => byKey.get(item.key) || item).concat(settings.filter(item => !defaults.some(def => def.key === item.key) && !String(item.key || '').startsWith('plan:')));
  return <div className="dev-settings-grid">{merged.map(item => <article className="dev-panel-card" key={item.key}><h3>{item.key}</h3><p>{item.description || 'Configuração interna da operação AgendaPro.'}</p><span className="dev-status success">{item.status || 'active'}</span><button type="button" onClick={() => openEdit(item)}>Configurar</button></article>)}</div>;
}


function DevHealthPanel({ metrics, rows, isDemoLike, setActiveTab }: { metrics: any; rows: any; isDemoLike: (value: any) => boolean; setActiveTab: (tab: string) => void }) {
  const checks = [
    { title: 'Pagamentos manuais pendentes', value: metrics.manualPending || 0, tone: metrics.manualPending ? 'warning' : 'success', tab: 'manual', description: 'Aprovar, reprovar ou solicitar ajuste nos pagamentos enviados manualmente.' },
    { title: 'Webhooks com erro', value: metrics.webhooksError || 0, tone: metrics.webhooksError ? 'danger' : 'success', tab: 'webhooks', description: 'Eventos que precisam de reprocessamento ou resolução manual.' },
    { title: 'Logs críticos', value: metrics.logsCritical || 0, tone: metrics.logsCritical ? 'danger' : 'success', tab: 'logs', description: 'Falhas, alertas e ocorrências registradas pela operação.' },
    { title: 'Agendas incompletas', value: rows.agendas.filter((item: any) => !item.slug || !item.business_name || isDemoLike(item.slug)).length, tone: 'warning', tab: 'agendas', description: 'Agendas sem dados públicos suficientes ou com slug de teste.' },
    { title: 'Keys ativas', value: metrics.activeKeys || 0, tone: 'success', tab: 'keys', description: 'Licenças disponíveis, em uso ou próximas do vencimento.' },
    { title: 'Clientes ativos', value: metrics.activeAccounts || 0, tone: 'success', tab: 'clients', description: 'Contas liberadas para operar o AgendaPro.' }
  ];
  return <div className="dev-panel-card"><div className="dev-card-title"><div><h3>Saúde do sistema</h3><span>Diagnóstico rápido da operação principal, sem depender da demo.</span></div><button type="button" onClick={() => setActiveTab('logs')}>Abrir logs</button></div><div className="dev-health-grid">{checks.map(check => <button key={check.title} className={`dev-health-card ${check.tone}`} type="button" onClick={() => setActiveTab(check.tab)}><span>{check.title}</span><b>{check.value}</b><small>{check.description}</small></button>)}</div></div>;
}

function DevToolsPanel({ copy }: { copy: (text: string, label?: string) => void }) {
  const tools = [
    { title: 'Link da Central Dev', description: 'Copiar rota administrativa protegida.', action: () => copy(`${window.location.origin}${window.location.pathname}#/dev`, 'Link da Central Dev') },
    { title: 'Link da demo externa', description: 'Copiar URL configurada para demonstração separada.', action: () => copy(demoExternalUrl, 'Demo externa') },
    { title: 'Link do painel do cliente', description: 'Copiar rota de login da conta do cliente.', action: () => copy(`${window.location.origin}${window.location.pathname}#/conta/login`, 'Painel do cliente') },
    { title: 'Link de planos', description: 'Copiar página comercial de contratação.', action: () => copy(`${window.location.origin}${window.location.pathname}#/planos`, 'Página de planos') },
    { title: 'SQL v0.6.0.4', description: 'Lembrar arquivo de migração obrigatório antes do deploy.', action: () => copy('docs/AGENDAPRO_V0604_MAIN_DEV_OPERATIONS.sql', 'Arquivo SQL') },
    { title: 'Webhook Mercado Pago', description: 'Copiar endpoint de webhook consolidado.', action: () => copy(`${window.location.origin}/api/mercadopago-webhook`, 'Webhook Mercado Pago') }
  ];
  return <div className="dev-tools-grid">{tools.map(tool => <article className="dev-panel-card" key={tool.title}><h3>{tool.title}</h3><p>{tool.description}</p><button type="button" onClick={tool.action}>Copiar</button></article>)}</div>;
}

function DetailDrawer({ selected, close, copy, logs, openEdit }: { selected: any; close: () => void; copy: (v: string, l?: string) => void; logs: any[]; openEdit: (entity: string, item: any) => void }) {
  const item = selected.raw || selected.data || selected;
  const commercial = selected.commercial as DevCommercialRow | undefined;
  const entity = normalizeCanonicalEntity(selected.entity || selected.type || item.entity_type || 'registro');
  const related = devRelatedLogs(selected, logs);
  const title = item.name || item.business_name || item.customer_name || item.full_name || item.email || item.id || 'Registro';
  const metadata = item.metadata || item.action_metadata || item.raw_payload || item.payload || null;
  return <div className="detail-drawer-backdrop" onClick={close}><aside className="detail-drawer" onClick={event => event.stopPropagation()}><button className="drawer-close" onClick={close}>×</button><Badge tone="purple">{selected.type || 'Detalhes'}</Badge><h2>{title}</h2><p>Visão 360º com dados principais, timeline relacionada, metadata e ações rápidas para suporte.</p><div className="drawer-actions">{['client','company','agenda','payment','manual_payment','license_key','webhook','briefing','implementation'].includes(entity) && <button onClick={() => openEdit(entity, item)}>Editar registro</button>}{item.email && <button onClick={() => copy(item.email, 'E-mail')}>Copiar e-mail</button>}{(item.whatsapp || item.phone || item.customer_phone) && <button onClick={() => window.open(`https://wa.me/${String(item.whatsapp || item.phone || item.customer_phone).replace(/\D/g, '')}`, '_blank')}>WhatsApp</button>}{(item.public_slug || item.slug || item.agenda_slug) && <button onClick={() => copy(`${window.location.origin}/#/agendar/${item.public_slug || item.slug || item.agenda_slug}`, 'Link')}>Copiar agendamento</button>}<button onClick={() => copy(JSON.stringify(commercial || item, null, 2), 'Metadata')}>Copiar JSON</button></div><div className="detail-kpi-grid"><span><b>Status</b><small>{item.status || item.subscription_status || item.payment_status || item.severity || '—'}</small></span><span><b>Plano</b><small>{item.plan || item.plan_id || item.current_plan_id || commercial?.plan || '—'}</small></span><span><b>Criado</b><small>{formatDate(item.created_at || commercial?.createdAt)}</small></span><span><b>Atualizado</b><small>{formatDate(item.updated_at || item.reviewed_at || commercial?.lastActivity)}</small></span></div>{commercial && <section className="drawer-commercial-360"><h3>Operação comercial</h3><div className="detail-kpi-grid"><span><b>Plano</b><small>{commercial.plan} · {commercial.planStatus}</small></span><span><b>Pagamento</b><small>{commercial.paymentStatus}</small></span><span><b>Agenda</b><small>{commercial.agendaStatus}</small></span><span><b>Agendamentos</b><small>{commercial.appointmentsCount}</small></span></div><div className="commercial-pendency-list">{commercial.pending.length ? commercial.pending.map(item => <span key={item}>{item}</span>) : <span>sem pendências comerciais</span>}</div><div className="drawer-actions">{commercial.agenda?.public_slug || commercial.agenda?.slug || commercial.company?.public_slug || commercial.company?.slug ? <button onClick={() => copy(`${window.location.origin}/#/agendar/${commercial.agenda?.public_slug || commercial.agenda?.slug || commercial.company?.public_slug || commercial.company?.slug}`, 'Link público')}>Copiar link público</button> : null}{commercial.whatsapp && <button onClick={() => window.open(`https://wa.me/${String(commercial.whatsapp).replace(/\D/g, '')}`, '_blank')}>Abrir WhatsApp</button>}</div></section>}{related.length > 0 && <section className="drawer-timeline"><h3>Timeline relacionada</h3>{related.map((log: any, index: number) => <article key={log.id || index}><i className={`dot ${String(log.severity || 'info').toLowerCase()}`} /><div><b>{log.title || log.action || 'Evento'}</b><span>{log.description || log.entity_type || 'Sem descrição'}</span><small>{formatDate(log.created_at)} · {log.actor_email || log.origin || log.source || 'sistema'}</small></div></article>)}</section>}{metadata && <section className="drawer-metadata"><h3>Metadata relevante</h3><pre>{JSON.stringify(metadata, null, 2)}</pre></section>}<section className="drawer-metadata"><h3>Registro completo</h3><pre>{JSON.stringify(commercial || item, null, 2)}</pre></section></aside></div>;
}

function DevInspectorPanel({ rows, metrics, close, exportSummary }: { rows: any; metrics: any; close: () => void; exportSummary: (entity: string, data: any[]) => void }) {
  const checks = [
    { title: 'Empresas sem plano ativo', value: rows.companies.filter((item: any) => !['active','trial'].includes(String(item.subscription_status || item.status || '').toLowerCase())).length, tab: 'companies' },
    { title: 'Agendas incompletas', value: rows.agendas.filter((item: any) => !item.public_slug || !(item.services || []).length || !(item.team || item.professionals || []).length).length, tab: 'agendas' },
    { title: 'Pagamentos manuais pendentes', value: metrics.manualPending || 0, tab: 'manual' },
    { title: 'Webhooks com erro', value: metrics.webhooksError || 0, tab: 'webhooks' },
    { title: 'Logs críticos', value: metrics.logsCritical || 0, tab: 'logs' },
    { title: 'Keys próximas do vencimento', value: rows.keys.filter((item: any) => item.expires_at && new Date(item.expires_at).getTime() < Date.now() + 7 * 24 * 60 * 60 * 1000).length, tab: 'keys' },
  ];
  const score = Math.max(0, 100 - checks.reduce((sum, item) => sum + Math.min(18, Number(item.value || 0) * 6), 0));
  return <div className="dev-command-backdrop" onClick={close}><section className="dev-inspector-panel" onClick={event => event.stopPropagation()}><button className="drawer-close" onClick={close}>×</button><Badge tone="green">Inspector</Badge><h2>Raio-X operacional</h2><p>Leitura rápida da Central Dev para identificar gargalos antes de atender cliente real.</p><div className="inspector-score"><b>{score}</b><span>/100</span><small>Saúde operacional estimada</small></div><div className="inspector-grid">{checks.map(item => <article key={item.title} className={item.value ? 'warning' : 'success'}><span>{item.title}</span><b>{item.value}</b><small>{item.value ? 'Exige revisão' : 'Sem pendência detectada'}</small></article>)}</div><div className="drawer-actions"><button onClick={() => exportSummary('central-dev-inspector', [...rows.logs, ...rows.manual, ...rows.webhooks])}>Exportar resumo TXT</button><button onClick={close}>Fechar</button></div></section></div>;
}


function DevTable({ title, items, empty, mapper }: { title: string; items: any[]; empty: string; mapper: (item: any) => ReactNode }) {
  return <article className="dev-table full"><h2>{title}</h2>{items.length ? items.map((item, index) => <div className="dev-row" key={item.id || index}>{mapper(item)}</div>) : <div className="empty-dev-state"><Database/><b>{empty}</b><span>Quando houver dados no Supabase, eles aparecerão aqui.</span></div>}</article>;
}

function ContractSuccessPage() {
  return <PublicShell><section className="page-hero"><Badge tone="green">Solicitação enviada</Badge><h1>Recebemos seu interesse na implantação assistida.</h1><p>A solicitação entra no painel do desenvolvedor para acompanhamento.</p><div className="hero-actions" style={{ justifyContent: 'center', marginTop: '1.4rem' }}><a className="btn primary" href="https://upaiva.dev/" target="_blank" rel="noopener noreferrer">Falar com Mateus Paiva</a><a className="btn secondary" href={demoExternalUrl} target="_blank" rel="noopener noreferrer">Ver demonstração</a><a className="btn secondary" href="#/planos">Voltar aos planos</a></div></section></PublicShell>;
}
