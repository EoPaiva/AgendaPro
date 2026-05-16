import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock, MapPin, MessageCircle, Search, Sparkles } from 'lucide-react';
import { Badge } from '../components/Badge';
import { useApp } from '../contexts/AppContext';
import { Appointment, Client } from '../types';
import { currency, uid } from '../utils/format';
import { DAY_KEYS, DAY_LABELS, buildDateOptions, dateKey, generateSlotsForDate, normalizeScheduleConfig, serviceDurationMinutes } from '../lib/availability';

const demoExternalUrl = import.meta.env.VITE_AGENDAPRO_DEMO_URL || 'https://agendapro-demo.vercel.app/';

const publicBusinesses = [
  { name: 'Agenda de exemplo externa', slug: 'demo-externa', segment: 'Demonstração isolada', active: false, description: 'A demonstração completa fica em outro projeto para não misturar dados fictícios com produção.' },
  { name: 'Minha agenda publicada', slug: 'minha-agenda', segment: 'Link real por cliente', active: false, description: 'Cada cliente usa o próprio slug publicado pelo criador de agenda.' }
];

function getBookingSlug() {
  const route = window.location.hash.replace('#', '') || '/agendar';
  const parts = route.split('/').filter(Boolean);
  return parts[1] || '';
}

export function Booking() {
  const slug = getBookingSlug();

  if (!slug) return <BookingChooser />;
  return <RemoteAgendaBooking slug={slug} />;
}


function getLocalPublishedAgenda(): any | null {
  try {
    return JSON.parse(localStorage.getItem('agendapro-agenda-draft') || 'null');
  } catch {
    return null;
  }
}

function normalizePublicAgenda(row: any) {
  const theme = row?.theme || row?.raw_payload?.visual || {};
  const raw = row?.raw_payload || {};
  return {
    slug: row?.public_slug || raw.slug || '',
    publishedAt: row?.published_at || raw.publishedAt || new Date().toISOString(),
    business: {
      name: row?.business_name || raw.business?.name || 'Agenda',
      segment: row?.segment || raw.business?.segment || 'Atendimento com horário marcado',
      whatsapp: row?.whatsapp || raw.business?.whatsapp || '',
      email: row?.email || raw.business?.email || raw.email || '',
      address: row?.address || raw.business?.address || '',
      responsible: raw.business?.responsible || raw.responsible || '',
      description: row?.description || raw.business?.description || 'Agendamento online profissional.'
    },
    visual: {
      primaryColor: theme.primary_color || theme.primaryColor || '#2563EB',
      secondaryColor: theme.secondary_color || theme.secondaryColor || '#0F172A',
      accentColor: theme.accent_color || theme.accentColor || '#10B981',
      logoUrl: theme.logo_url || theme.logoUrl || '',
      slogan: theme.slogan || raw.visual?.slogan || 'Agende seu horário online'
    },
    services: Array.isArray(row?.services) ? row.services : Array.isArray(raw.services) ? raw.services : [],
    team: Array.isArray(row?.team) ? row.team : Array.isArray(raw.team) ? raw.team : [],
    hours: row?.hours || raw.hours || { weekdays: '08:00 às 18:00', saturday: '08:00 às 12:00', interval: '30' },
    scheduleConfig: normalizeScheduleConfig(row?.schedule_config || row?.scheduleConfig || raw.scheduleConfig, row?.hours || raw.hours, row?.rules || raw.rules),
    bookedSlots: Array.isArray(row?.booked_slots) ? row.booked_slots : Array.isArray(row?.bookedSlots) ? row.bookedSlots : [],
    publicBookingDisabled: Boolean(row?.public_booking_disabled),
    accessState: row?.access_state || null,
    rules: row?.rules || raw.rules || { cancellation: 'Aguarde confirmação pelo WhatsApp.' }
  };
}

function whatsAppLink(phone?: string, message?: string) {
  const clean = String(phone || '').replace(/\D/g, '');
  if (!clean) return '';
  const target = clean.startsWith('55') ? clean : `55${clean}`;
  return `https://wa.me/${target}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}


function agendaText(value: any, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function servicePriceLabel(service: any) {
  const raw = service?.price ?? service?.value ?? 0;
  const number = Number(String(raw).replace(/[^0-9,.]/g, '').replace(',', '.'));
  if (!Number.isFinite(number) || number <= 0) return 'Sob consulta';
  return `R$ ${number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

function formatShortDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatWhatsappInput(value: string) {
  const clean = value.replace(/\D/g, '').slice(0, 13);
  if (clean.length <= 2) return clean;
  const national = clean.startsWith('55') ? clean.slice(2) : clean;
  const ddd = national.slice(0, 2);
  const first = national.slice(2, national.length > 10 ? 7 : 6);
  const second = national.slice(national.length > 10 ? 7 : 6);
  return [ddd && `(${ddd}`, ddd && ') ', first, second && `-${second}`].filter(Boolean).join('');
}

function summarizeSchedule(config: any) {
  const active = DAY_KEYS.filter(key => config?.workingDays?.[key]?.enabled);
  if (!active.length) return 'Funcionamento sob consulta';
  const firstDay = active[0];
  const periods = config.workingDays[firstDay]?.periods || [];
  const periodText = periods.length ? periods.map((p: any) => `${p.start} às ${p.end}`).join(' / ') : 'horário configurado';
  if (active.length >= 5 && active.includes('monday') && active.includes('friday')) return `Segunda a sexta • ${periodText}`;
  return `${active.map(key => DAY_LABELS[key]).join(', ')} • ${periodText}`;
}

function isOpenNow(config: any) {
  const today = dateKey();
  const key = DAY_KEYS[new Date(`${today}T12:00:00`).getDay()];
  const day = config?.workingDays?.[key];
  if (!day?.enabled) return false;
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return (day.periods || []).some((period: any) => {
    const [sh, sm] = String(period.start || '00:00').split(':').map(Number);
    const [eh, em] = String(period.end || '00:00').split(':').map(Number);
    return minutes >= sh * 60 + sm && minutes <= eh * 60 + em;
  });
}

function nextAvailableLabel(dateOptions: any[], services: any[], appointments: any[], config: any) {
  const service = services?.[0] || { durationMinutes: 60 };
  for (const dateItem of dateOptions) {
    if (!dateItem.availableDay) continue;
    const slots = generateSlotsForDate({ date: dateItem.date, serviceDuration: serviceDurationMinutes(service), appointments, scheduleConfig: config });
    const slot = slots.find(item => item.available);
    if (slot) return `${dateItem.label} às ${slot.time}`;
  }
  return 'Sem horário disponível agora';
}

function getAgendaFooterData(agenda: any, config: any, publicUrl: string, presentationUrl: string) {
  return {
    name: agendaText(agenda?.business?.name, 'Agenda online'),
    description: agendaText(agenda?.business?.description, 'Atendimento com horário marcado.'),
    whatsapp: agendaText(agenda?.business?.whatsapp),
    email: agendaText(agenda?.business?.email),
    address: agendaText(agenda?.business?.address),
    responsible: agendaText(agenda?.business?.responsible || agenda?.team?.[0]?.name),
    rules: agendaText(config?.cancellationText || agenda?.rules?.cancellation, 'Agendamento sujeito à confirmação.'),
    hours: summarizeSchedule(config),
    publicUrl,
    presentationUrl
  };
}

function LuxuryAgendaFooter({ agenda, config, publicUrl, presentationUrl }: { agenda: any; config: any; publicUrl: string; presentationUrl: string }) {
  const data = getAgendaFooterData(agenda, config, publicUrl, presentationUrl);
  const copyLink = () => navigator.clipboard?.writeText(publicUrl);
  return <footer className="luxury-agenda-footer">
    <div className="luxury-footer-grid">
      <section><span className="luxury-footer-mark">Agenda</span><h3>{data.name}</h3><p>{data.description}</p>{data.responsible && <small>Responsável: {data.responsible}</small>}</section>
      {(data.whatsapp || data.email || data.address) && <section><span>Contato</span>{data.whatsapp && <a href={whatsAppLink(data.whatsapp, `Olá! Vim pela página de agendamento da ${data.name}.`)} target="_blank" rel="noopener noreferrer">WhatsApp: {data.whatsapp}</a>}{data.email && <a href={`mailto:${data.email}`}>{data.email}</a>}{data.address && <small>{data.address}</small>}</section>}
      <section><span>Funcionamento</span><p>{data.hours}</p><small>{data.rules}</small></section>
      <section><span>Agenda</span><a href={presentationUrl}>Página de apresentação</a><a href={publicUrl}>Página de agendamento</a><button type="button" onClick={copyLink}>Copiar link</button><small>Powered by AgendaPro</small></section>
    </div>
  </footer>;
}

function RemoteAgendaBooking({ slug }: { slug: string }) {
  const [agenda, setAgenda] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    fetch(`/api/public?action=get-public-agenda&slug=${encodeURIComponent(slug)}`)
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.ok) throw new Error(data?.message || 'Agenda não encontrada.');
        if (active) setAgenda(normalizePublicAgenda(data.agenda));
      })
      .catch(error => {
        if (active) setError(error instanceof Error ? error.message : 'Agenda não encontrada.');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [slug]);

  if (loading) return <div className="booking-page"><main className="booking-shell booking-chooser-shell"><section className="booking-brand"><Badge tone="blue">Carregando</Badge><h1>Buscando agenda...</h1><p>Estamos carregando os dados reais desta agenda.</p></section></main></div>;

  if (error || !agenda) return <div className="booking-page"><main className="booking-shell booking-chooser-shell"><section className="booking-brand"><Badge tone="amber">Agenda não encontrada</Badge><h1>Essa agenda não existe ou ainda não foi publicada.</h1><p>{error || 'Confira o link enviado pelo negócio.'}</p></section><section className="booking-card success-box"><Sparkles size={44}/><h2>Nenhum dado de demonstração foi carregado.</h2><p>Por segurança, agendas reais não usam fallback da demo.</p></section></main></div>;

  return <LocalAgendaBooking agenda={agenda} />;
}

function LocalAgendaBooking({ agenda }: { agenda: any }) {
  const { pushToast } = useApp();
  const [serviceIndex, setServiceIndex] = useState(0);
  const [professionalIndex, setProfessionalIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState(dateKey());
  const [time, setTime] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const [success, setSuccess] = useState(false);
  const [lastRequest, setLastRequest] = useState<any | null>(null);

  const services = Array.isArray(agenda.services) && agenda.services.length ? agenda.services : [{ id: 'service_1', name: 'Atendimento inicial', description: 'Atendimento profissional com horário marcado.', durationMinutes: 60, price: 0, active: true }];
  const team = Array.isArray(agenda.team) && agenda.team.length ? agenda.team : [{ id: 'team_1', name: agenda.business?.name || 'Equipe responsável', role: 'Atendimento', specialty: agenda.business?.segment || 'Serviços com horário marcado' }];
  const service = services[serviceIndex] || services[0];
  const professional = team[professionalIndex] || team[0];
  const durationMinutes = serviceDurationMinutes(service);
  const scheduleConfig = useMemo(() => normalizeScheduleConfig(agenda.scheduleConfig, agenda.hours, agenda.rules), [agenda]);
  const bookedSlots = Array.isArray(agenda.bookedSlots) ? agenda.bookedSlots : [];
  const dateOptions = useMemo(() => buildDateOptions(scheduleConfig, 18), [scheduleConfig]);
  const validDateOptions = dateOptions.filter(item => item.availableDay).slice(0, 14);
  const slots = useMemo(() => generateSlotsForDate({ date: selectedDate, serviceDuration: durationMinutes, appointments: bookedSlots, scheduleConfig }), [selectedDate, durationMinutes, bookedSlots, scheduleConfig]);
  const publicUrl = `${window.location.origin}${window.location.pathname}#/agendar/${agenda.slug}`;
  const presentationUrl = `${window.location.origin}${window.location.pathname}#/agenda/${agenda.slug}`;
  const whatsappHref = whatsAppLink(agenda.business?.whatsapp, `Olá! Vim pela página de agendamento da ${agenda.business?.name}. Gostaria de tirar uma dúvida.`);
  const nextSlot = nextAvailableLabel(dateOptions, services, bookedSlots, scheduleConfig);
  const openNow = isOpenNow(scheduleConfig);

  useEffect(() => { document.title = `${agenda.business?.name || 'Agenda'} — Agendamento Online`; }, [agenda.business?.name]);
  useEffect(() => { setTime(''); }, [selectedDate, serviceIndex, professionalIndex]);

  const selectedSlot = slots.find(slot => slot.time === time);
  const bookingDisabled = Boolean(agenda.publicBookingDisabled);
  const disabledReason = agenda.accessState?.message || 'Esta agenda está temporariamente indisponível para novos agendamentos.';
  const canSend = Boolean(!bookingDisabled && form.name.trim() && form.phone.trim() && selectedDate && time && service);
  const buildPublicConfirmationMessage = (data: any) => `Olá! Acabei de solicitar um agendamento em ${agenda.business?.name || 'AgendaPro'}.

Serviço: ${data.serviceName}
Profissional: ${data.professionalName}
Data: ${formatDateLabel(data.date)}
Horário: ${data.time}
Nome: ${data.name}

Aguardo a confirmação.`;
  const copyPublicConfirmation = async () => {
    if (!lastRequest) return;
    await navigator.clipboard?.writeText(buildPublicConfirmationMessage(lastRequest));
    pushToast({ tone: 'success', title: 'Mensagem copiada', message: 'Resumo do agendamento copiado.' });
  };


  const request = async () => {
    if (bookingDisabled) {
      pushToast({ tone: 'warning', title: 'Agenda indisponível', message: disabledReason });
      return;
    }
    if (!canSend) {
      pushToast({ tone: 'warning', title: 'Dados obrigatórios', message: 'Informe serviço, data, horário, nome e WhatsApp.' });
      return;
    }
    if (!selectedSlot?.available) {
      pushToast({ tone: 'warning', title: 'Horário indisponível', message: selectedSlot?.reason || 'Este horário acabou de ser reservado. Escolha outro horário.' });
      return;
    }
    const last = Number(localStorage.getItem(`agp-public-booking-${agenda.slug}`) || 0);
    if (Date.now() - last < 30000) {
      pushToast({ tone: 'warning', title: 'Aguarde alguns segundos', message: 'Para evitar spam, espere antes de enviar outra solicitação.' });
      return;
    }
    try {
      const response = await fetch('/api/public?action=create-public-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: agenda.slug,
          name: form.name,
          phone: form.phone,
          email: form.email,
          notes: form.notes,
          professionalName: professional?.name,
          serviceId: service.id || service.name,
          serviceName: service.name,
          durationMinutes,
          date: selectedDate,
          time
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) throw new Error(data?.message || 'Não foi possível enviar a solicitação.');
      const requestSummary = { requestId: data?.request?.id, name: form.name, phone: form.phone, email: form.email, notes: form.notes, serviceName: service.name, professionalName: professional?.name || 'Equipe', date: selectedDate, time, durationMinutes, priceLabel: servicePriceLabel(service) };
      localStorage.setItem(`agp-public-booking-${agenda.slug}`, String(Date.now()));
      setLastRequest(requestSummary);
      setSuccess(true);
      pushToast({ tone: 'success', title: 'Solicitação enviada', message: 'A empresa recebeu seu pedido e retornará pelo WhatsApp.' });
      setForm({ name: '', phone: '', email: '', notes: '' });
      setTime('');
    } catch (error) {
      pushToast({ tone: 'warning', title: 'Solicitação não enviada', message: error instanceof Error ? error.message : 'Tente novamente em instantes.' });
    }
  };

  const scrollToBooking = () => document.getElementById('luxury-booking-flow')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return <div className="booking-page client-booking-white-label dynamic-booking luxury-booking-page" style={{ ['--booking-primary' as string]: agenda.visual?.primaryColor || '#2563EB', ['--booking-secondary' as string]: agenda.visual?.secondaryColor || '#0F172A', ['--booking-accent' as string]: agenda.visual?.accentColor || '#10B981' }}>
    <main className="luxury-booking-shell">
      <section className="luxury-booking-hero">
        <div className="luxury-hero-content">
          <div className="luxury-chip-row"><span className="luxury-status-chip">Agenda publicada</span><span className={openNow ? 'luxury-open-chip open' : 'luxury-open-chip'}>{openNow ? 'Aberto agora' : 'Fechado agora'}</span></div>
          <h1>{agenda.business?.name}</h1>
          <p>{agenda.business?.description || agenda.visual?.slogan || 'Agendamento online profissional, simples e seguro.'}</p>
          <div className="luxury-hero-meta">
            {agenda.business?.address && <span><MapPin size={17}/>{agenda.business.address}</span>}
            {agenda.business?.whatsapp && <span><MessageCircle size={17}/>{agenda.business.whatsapp}</span>}
            <span><Clock size={17}/>{summarizeSchedule(scheduleConfig)}</span>
          </div>
          <div className="luxury-hero-actions"><button className="btn primary" type="button" onClick={scrollToBooking} disabled={bookingDisabled}>{bookingDisabled ? 'Agenda indisponível' : 'Agendar agora'}</button>{whatsappHref && <a className="btn secondary" href={whatsappHref} target="_blank" rel="noopener noreferrer">Falar no WhatsApp</a>}</div>
        </div>
        <aside className="luxury-hero-panel">
          <div className="luxury-logo-orb">{String(agenda.business?.name || 'A').slice(0, 2).toUpperCase()}</div>
          <span>Próximo horário disponível</span><strong>{nextSlot}</strong>
          <small>{bookingDisabled ? disabledReason : scheduleConfig.acceptNewBookings === false ? 'Novos agendamentos pausados no momento.' : 'Escolha serviço, data e horário para solicitar atendimento.'}</small>
          <button type="button" onClick={() => navigator.clipboard?.writeText(publicUrl)}>Copiar link da agenda</button>
        </aside>
      </section>

      <section className="luxury-info-strip">
        <article><b>{services.length}</b><span>serviço(s) online</span></article>
        <article><b>{team.length}</b><span>profissional(is)</span></article>
        <article><b>{scheduleConfig.slotInterval} min</b><span>intervalo da agenda</span></article>
        <article><b>{scheduleConfig.minAdvanceHours}h</b><span>antecedência mínima</span></article>
      </section>

      <section id="luxury-booking-flow" className="luxury-booking-grid">
        <article className="luxury-booking-card luxury-flow-card">
          {bookingDisabled && !success && <div className="success-box luxury-success-box booking-disabled-box"><Clock size={52} /><span className="luxury-status-chip">Agenda indisponível</span><h2>Novos agendamentos estão pausados.</h2><p>{disabledReason}</p>{agenda.business?.whatsapp && <a className="btn secondary full" href={whatsAppLink(agenda.business.whatsapp, `Olá! Vim pela página da ${agenda.business?.name} e gostaria de verificar disponibilidade.`)} target="_blank" rel="noopener noreferrer">Falar com a empresa</a>}</div>}
          {success ? <div className="success-box luxury-success-box">
            <CheckCircle2 size={52} />
            <span className="luxury-status-chip">Solicitação registrada</span>
            <h2>Agendamento solicitado com sucesso.</h2>
            <p>A empresa recebeu seu pedido. Você receberá a confirmação pelo WhatsApp quando o estabelecimento aprovar ou ajustar o horário.</p>
            {lastRequest && <div className="summary-box luxury-confirmation-summary"><b>{lastRequest.serviceName}</b><span>{formatDateLabel(lastRequest.date)} às {lastRequest.time}</span><span>{lastRequest.professionalName}</span><span>{lastRequest.name}</span></div>}
            <button className="btn secondary full" type="button" onClick={copyPublicConfirmation}>Copiar resumo</button>
            {agenda.business?.whatsapp && lastRequest && <a className="btn secondary full" href={whatsAppLink(agenda.business.whatsapp, buildPublicConfirmationMessage(lastRequest))} target="_blank" rel="noopener noreferrer">Enviar mensagem pelo WhatsApp</a>}
            <button className="btn primary full" type="button" onClick={() => setSuccess(false)}>Fazer outro agendamento</button>
          </div> : <>
            <div className="luxury-stepper"><span className="active">1 Serviço</span><span className={team.length ? 'active' : ''}>2 Profissional</span><span className={selectedDate ? 'active' : ''}>3 Data</span><span className={time ? 'active' : ''}>4 Horário</span><span className={canSend ? 'active' : ''}>5 Revisão</span></div>
            <div className="luxury-section-heading"><span>Etapa 1</span><h2>Escolha o serviço</h2><p>Selecione o atendimento desejado para calcular duração, disponibilidade e valor.</p></div>
            <div className="luxury-service-grid">{services.map((item: any, index: number) => <button key={item.id || item.name || index} type="button" className={serviceIndex === index ? 'selected' : ''} onClick={() => setServiceIndex(index)}><b>{item.name || 'Atendimento'}</b><small>{item.description || item.category || 'Serviço disponível para agendamento online.'}</small><span><Clock size={14}/>{serviceDurationMinutes(item)} min</span><strong>{servicePriceLabel(item)}</strong></button>)}</div>

            <div className="luxury-section-heading"><span>Etapa 2</span><h2>Profissional</h2><p>{team.length > 1 ? 'Escolha quem realizará o atendimento.' : 'Profissional responsável pré-selecionado.'}</p></div>
            <div className="luxury-professional-grid">{team.map((member: any, index: number) => <button key={member.id || member.name || index} type="button" className={professionalIndex === index ? 'selected' : ''} onClick={() => setProfessionalIndex(index)}><span>{String(member.name || 'P').slice(0, 2).toUpperCase()}</span><b>{member.name || 'Profissional'}</b><small>{member.role || member.specialty || 'Atendimento'}</small></button>)}</div>

            <div className="luxury-section-heading"><span>Etapa 3</span><h2>Data</h2><p>Mostramos apenas datas dentro da janela de agendamento configurada pelo estabelecimento.</p></div>
            <div className="luxury-date-strip">{dateOptions.slice(0, 14).map(item => <button key={item.date} type="button" disabled={!item.availableDay} className={`${selectedDate === item.date ? 'selected' : ''} ${!item.availableDay ? 'muted' : ''}`} onClick={() => item.availableDay && setSelectedDate(item.date)}><b>{item.label}</b><span>{item.weekday}</span><small>{formatShortDate(item.date)}</small></button>)}</div>

            <div className="luxury-section-heading"><span>Etapa 4</span><h2>Horário</h2><p>Horários ocupados, bloqueados ou fora do expediente ficam indisponíveis automaticamente.</p></div>
            {slots.length ? <div className="luxury-time-grid">{slots.map(slot => <button key={slot.time} disabled={!slot.available} title={slot.reason} type="button" className={`${time === slot.time ? 'selected' : ''} ${!slot.available ? `disabled ${slot.status}` : ''}`} onClick={() => slot.available && setTime(slot.time)}><b>{slot.time}</b><small>{slot.available ? 'Disponível' : slot.status === 'occupied' ? 'Ocupado' : slot.status === 'blocked' ? 'Bloqueado' : 'Indisponível'}</small></button>)}</div> : <div className="empty-availability luxury-empty-state"><CalendarDays/><b>Não há horários disponíveis nesta data.</b><span>{scheduleConfig.closedMessage || 'Escolha outro dia ou fale com a empresa pelo WhatsApp.'}</span></div>}

            <div className="luxury-section-heading"><span>Etapa 5</span><h2>Seus dados</h2><p>Seus dados serão usados apenas para confirmar o agendamento.</p></div>
            <div className="luxury-form-grid"><input className="field" placeholder="Nome completo" value={form.name} onChange={e => setForm({...form,name:e.target.value})}/><input className="field" placeholder="WhatsApp" value={form.phone} onChange={e => setForm({...form,phone:formatWhatsappInput(e.target.value)})}/><input className="field" placeholder="E-mail opcional" value={form.email} onChange={e => setForm({...form,email:e.target.value})}/><textarea className="field" placeholder="Observação opcional" value={form.notes} onChange={e => setForm({...form,notes:e.target.value})}/></div>
            <p className="luxury-trust-copy">Você receberá a confirmação pelo WhatsApp. O horário fica sujeito à aprovação do estabelecimento.</p>
          </>}
        </article>

        {!success && <aside className="luxury-summary-card">
          <span className="luxury-status-chip">Resumo</span>
          <h3>Revise sua solicitação</h3>
          <div className="luxury-summary-list"><p><b>Serviço</b><span>{service?.name || 'Selecione'}</span></p><p><b>Profissional</b><span>{professional?.name || 'Equipe'}</span></p><p><b>Data</b><span>{selectedDate ? formatDateLabel(selectedDate) : 'Escolha uma data'}</span></p><p><b>Horário</b><span>{time || 'Escolha um horário'}</span></p><p><b>Duração</b><span>{durationMinutes} minutos</span></p><p><b>Valor</b><span>{servicePriceLabel(service)}</span></p></div>
          <button className="btn primary full" onClick={request} disabled={!canSend}>{bookingDisabled ? 'Agenda indisponível' : 'Confirmar solicitação'}</button>
          <small>Ao enviar, o estabelecimento receberá a solicitação e poderá confirmar, recusar ou reagendar.</small>
        </aside>}
      </section>

      <section className="luxury-rules-grid">
        <article><h3>Funcionamento</h3><p>{summarizeSchedule(scheduleConfig)}</p><small>Intervalos, dias bloqueados e pausas são respeitados automaticamente.</small></article>
        <article><h3>Regras de agendamento</h3><p>{scheduleConfig.cancellationText || agenda.rules?.cancellation || 'Cancelamentos e remarcações seguem as regras do estabelecimento.'}</p><small>Antecedência mínima: {scheduleConfig.minAdvanceHours}h • Janela: {scheduleConfig.maxFutureDays} dias</small></article>
      </section>
    </main>
    <LuxuryAgendaFooter agenda={agenda} config={scheduleConfig} publicUrl={publicUrl} presentationUrl={presentationUrl}/>
  </div>;
}

function BookingChooser() {
  return <div className="booking-page">
    <main className="booking-shell booking-chooser-shell">
      <section className="booking-brand">
        <Badge tone="blue">Agendamento online</Badge>
        <h1>Use um link público de agenda real.</h1>
        <p>O site principal não carrega mais dados de demonstração. Use um slug publicado por cliente ou abra a demo externa isolada.</p>
        <div className="booking-info"><span><Search /> Link por cliente</span><span><Sparkles /> Página em preparação</span></div>
      </section>
      <section className="booking-card">
        <h2>Atalhos seguros</h2><a className="btn primary full" href={demoExternalUrl} target="_blank" rel="noopener noreferrer">Abrir demo externa</a>
        <div className="public-business-list">
          {publicBusinesses.map(item => <a key={item.slug} className={item.active ? 'active' : ''} href={`#/agendar/${item.slug}`}>
            <b>{item.name}</b>
            <span>{item.segment}</span>
            <small>{item.active ? 'Agenda real publicada' : 'Atalho informativo'}</small>
          </a>)}
        </div>
      </section>
    </main>
  </div>;
}

function PreparedBusinessPage({ business }: { business: typeof publicBusinesses[number] }) {
  return <div className="booking-page">
    <main className="booking-shell booking-chooser-shell">
      <section className="booking-brand">
        <Badge tone="amber">Página em preparação</Badge>
        <h1>{business.name}</h1>
        <p>{business.description}</p>
        <div className="policy"><strong>Como funcionará</strong><p>Esta página será liberada quando o negócio concluir a configuração da própria agenda.</p></div>
      </section>
      <section className="booking-card success-box">
        <Sparkles size={44} />
        <h2>Página pública em preparação</h2>
        <p>Este endereço público está reservado para a agenda deste negócio.</p>
        <div className="summary-box"><b>Link público</b><span>{window.location.origin}{window.location.pathname}#/agendar/{business.slug}</span></div>
      </section>
    </main>
  </div>;
}

function ActiveBookingPage() {
  const { business, services, professionals, appointments, setAppointments, clients, setClients, pushToast, addLog } = useApp();
  const [step, setStep] = useState(1);
  const [service, setService] = useState(services[0]?.id || '');
  const [time, setTime] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const selected = services.find(s => s.id === service) || services[0];
  const availableTimes = ['08:30', '09:00', '10:30', '14:00', '15:30', '16:00'];
  const slug = business.slug || 'minha-agenda';
  const publicUrl = `${window.location.origin}${window.location.pathname}#/agendar/${slug}`;
  const activeServices = useMemo(() => services.filter(item => item.active && item.online), [services]);
  useEffect(() => { document.title = `${business.name} — Agendamento Online`; }, [business.name]);

  const update = (key: keyof typeof form, value: string) => setForm({ ...form, [key]: value });
  const confirm = () => {
    if (!form.name.trim() || !form.phone.trim()) {
      pushToast({ tone: 'warning', title: 'Dados obrigatórios', message: 'Informe nome e WhatsApp para solicitar o agendamento.' });
      return;
    }
    const existing = clients.find(c => c.phone.replace(/\D/g, '') === form.phone.replace(/\D/g, ''));
    const client: Client = existing || { id: uid(), name: form.name, phone: form.phone, email: form.email || 'não informado', tags: ['Novo cliente'], notes: form.notes || 'Cliente criado pela página pública.', totalSpent: 0, lastVisit: '2026-05-10' };
    if (!existing) setClients([client, ...clients]);
    const appointment: Appointment = { id: uid(), clientId: client.id, serviceId: selected.id, professionalId: professionals[0]?.id || 'p1', date: '2026-05-11', time: time || availableTimes[0], duration: selected.duration, value: selected.price, status: 'Solicitado', channel: 'Online', notes: form.notes || 'Solicitado pela página pública.', history: ['Solicitação criada pela página pública'], payment: 'Pendente', unit: professionals[0]?.unit || 'Unidade Centro' };
    setAppointments([appointment, ...appointments]);
    pushToast({ tone: 'success', title: 'Solicitação enviada', message: 'Seu horário foi solicitado com sucesso.' });
    addLog({ level: 'INFO', origin: 'PublicBooking', message: 'Agendamento solicitado pela página pública.', details: `Cliente: ${client.name} • Serviço: ${selected.name} • Horário: ${appointment.time}` });
    setStep(4);
  };

  return <div className="booking-page client-booking-white-label">
    <main className="booking-shell">
      <section className="booking-brand">
        <Badge tone="blue">Página pública</Badge>
        <h1>Agende seu horário com {business.name}</h1>
        <p>{business.publicMessage}</p>
        <div className="booking-info"><span><MapPin /> {business.address}</span><span><MessageCircle /> {business.phone}</span></div>
        <div className="policy"><strong>Política de cancelamento</strong><p>{business.cancellationPolicy}</p></div>
        <div className="copy-box"><span>{publicUrl}</span><button type="button" onClick={() => navigator.clipboard?.writeText(publicUrl)}>Copiar</button></div>
      </section>
      <section className="booking-card">
        <div className="steps"><span className={step >= 1 ? 'active' : ''}>Serviço</span><span className={step >= 2 ? 'active' : ''}>Data</span><span className={step >= 3 ? 'active' : ''}>Dados</span><span className={step >= 4 ? 'active' : ''}>Confirmação</span></div>
        {step === 1 && <div><h2>Escolha um serviço</h2><div className="service-list">{activeServices.map(s => <button className={service === s.id ? 'selected' : ''} key={s.id} onClick={() => setService(s.id)}><b>{s.name}</b><span><Clock size={14} />{s.duration} min</span><strong>{currency(s.price)}</strong></button>)}</div><button className="btn primary full" onClick={() => setStep(2)}>Continuar</button></div>}
        {step === 2 && <div><h2>Escolha um horário</h2><div className="day-box"><CalendarDays /><div><strong>Segunda, 11 de maio</strong><p>Horários disponíveis para {selected?.name}</p></div></div><div className="time-grid">{availableTimes.map(t => <button key={t} className={time === t ? 'selected' : ''} onClick={() => setTime(t)}>{t}</button>)}</div><button className="btn primary full" onClick={() => time ? setStep(3) : pushToast({ tone: 'warning', title: 'Escolha um horário', message: 'Selecione um horário disponível para continuar.' })}>Continuar</button></div>}
        {step === 3 && <div><h2>Seus dados</h2><input className="field" placeholder="Nome completo" value={form.name} onChange={e => update('name', e.target.value)} /><input className="field" placeholder="WhatsApp" value={form.phone} onChange={e => update('phone', e.target.value)} /><input className="field" placeholder="E-mail opcional" value={form.email} onChange={e => update('email', e.target.value)} /><textarea className="field" placeholder="Observação opcional" value={form.notes} onChange={e => update('notes', e.target.value)} /><button className="btn primary full" onClick={confirm}>Confirmar solicitação</button></div>}
        {step === 4 && <div className="success-box"><CheckCircle2 size={46} /><h2>Agendamento solicitado</h2><p>Seu horário está aguardando confirmação. O negócio retornará pelo WhatsApp.</p><div className="summary-box"><b>{selected?.name}</b><span>11/05/2026 às {time}</span><span>{form.name}</span></div><button type="button" className="btn secondary full" onClick={() => setStep(1)}>Fazer novo agendamento</button></div>}
      </section>
    </main>
  </div>;
}
