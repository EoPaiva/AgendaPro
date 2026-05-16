import { AnalyticsEvent, Appointment, AuditLog, Automation, Business, Client, DemoScenario, Integration, MessageTemplate, NotificationSetting, PaymentRecord, PermissionGroup, Plan, Professional, Review, Service, SystemLog, Unit, WaitlistItem } from '../types';

export const business: Business = {
  name:'Agenda Modelo Operacional',
  slug:'minha-agenda',
  segment:'Clínica odontológica',
  phone:'(35) 98804-2182',
  address:'Rua Central, 120 - Centro, São José dos Campos',
  instagram:'@agendamodelo',
  primaryColor:'#2563EB',
  logoText:'AD',
  publicMessage:'Agende sua consulta odontológica em poucos passos. Nossa recepção confirmará seu horário pelo WhatsApp.',
  cancellationPolicy:'Cancelamentos devem ser solicitados com até 24h de antecedência. Atrasos acima de 10 minutos podem exigir reagendamento.',
  toleranceMinutes:10,
  minNoticeHours:3,
  maxAdvanceDays:45
};

export const units: Unit[] = [
  {id:'u1',name:'Unidade Principal',address:'Rua Central, 120 - Centro',phone:'(35) 98804-2182',type:'Presencial',active:true},
  {id:'u2',name:'Unidade Especializada',address:'Av. Jardim, 540 - Jardim Europa',phone:'(35) 98804-2199',type:'Presencial',active:true},
  {id:'u3',name:'Atendimento Online',address:'Atendimento online',phone:'(35) 98804-2182',type:'Online',active:true}
];

export const clients: Client[] = [
  {id:'c1',name:'Ana Clara Martins',phone:'(35) 99921-3020',email:'ana@email.com',tags:['Paciente recorrente','Prefere manhã','Ortodontia'],notes:'Usa aparelho fixo. Prefere confirmação por WhatsApp.',totalSpent:2280,lastVisit:'2026-05-03',birth:'1996-08-14',document:'***.420.***-10',preferredProfessional:'p2',noShows:0,satisfaction:5},
  {id:'c2',name:'João Pedro Lima',phone:'(35) 98877-1122',email:'joao@email.com',tags:['Novo paciente','Cirurgia'],notes:'Solicitou avaliação para extração de siso.',totalSpent:150,lastVisit:'2026-05-07',document:'***.112.***-33',preferredProfessional:'p1',noShows:0,satisfaction:4},
  {id:'c3',name:'Mariana Costa',phone:'(35) 99714-0088',email:'mariana@email.com',tags:['VIP','Clareamento'],notes:'Paciente de estética dental. Agenda sempre à tarde.',totalSpent:3740,lastVisit:'2026-04-28',birth:'1992-11-04',preferredProfessional:'p1',noShows:0,satisfaction:5},
  {id:'c4',name:'Rafael Mendes',phone:'(35) 99110-2323',email:'rafael@email.com',tags:['Faltou antes','Confirmar antes'],notes:'Confirmar com 24h de antecedência.',totalSpent:620,lastVisit:'2026-04-19',preferredProfessional:'p2',noShows:1,satisfaction:3},
  {id:'c5',name:'Beatriz Alves',phone:'(35) 99222-9090',email:'beatriz@email.com',tags:['Lista de espera','Implante'],notes:'Deseja encaixe para avaliação de implante.',totalSpent:0,lastVisit:'2026-05-01',preferredProfessional:'p1',noShows:0,satisfaction:0},
  {id:'c6',name:'Lucas Pereira',phone:'(35) 99313-1717',email:'lucas@email.com',tags:['Manutenção mensal'],notes:'Paciente da ortodontia. Pode vir após 17h.',totalSpent:960,lastVisit:'2026-05-02',preferredProfessional:'p2',noShows:0,satisfaction:5}
];

export const services: Service[] = [
  {id:'s1',name:'Consulta odontológica inicial',duration:40,price:120,description:'Primeiro atendimento para avaliação geral, diagnóstico inicial e orientação.',online:true,category:'Clínica geral',color:'#2563EB',active:true,professionalIds:['p1','p2']},
  {id:'s2',name:'Limpeza profissional',duration:50,price:180,description:'Profilaxia, remoção de placa e orientação preventiva.',online:true,category:'Clínica geral',color:'#10B981',active:true,professionalIds:['p1']},
  {id:'s3',name:'Avaliação cirúrgica',duration:45,price:150,description:'Avaliação para extrações, implantes e procedimentos cirúrgicos.',online:true,category:'Cirurgia',color:'#0F172A',active:true,professionalIds:['p1']},
  {id:'s4',name:'Extração de siso',duration:90,price:700,description:'Procedimento cirúrgico para remoção de terceiro molar.',online:false,category:'Cirurgia',color:'#DC2626',active:true,professionalIds:['p1']},
  {id:'s5',name:'Implante dentário',duration:120,price:2500,description:'Procedimento de implante com planejamento e acompanhamento.',online:false,category:'Cirurgia',color:'#7C3AED',active:true,professionalIds:['p1']},
  {id:'s6',name:'Avaliação ortodôntica',duration:45,price:120,description:'Avaliação para aparelho, alinhadores e planejamento ortodôntico.',online:true,category:'Ortodontia',color:'#1E3A8A',active:true,professionalIds:['p2']},
  {id:'s7',name:'Instalação de aparelho',duration:90,price:800,description:'Instalação inicial do aparelho ortodôntico.',online:false,category:'Ortodontia',color:'#F59E0B',active:true,professionalIds:['p2']},
  {id:'s8',name:'Manutenção de aparelho',duration:40,price:150,description:'Ajustes mensais, avaliação de evolução e orientações.',online:true,category:'Ortodontia',color:'#0F766E',active:true,professionalIds:['p2']},
  {id:'s9',name:'Clareamento dental',duration:90,price:600,description:'Procedimento estético para clareamento supervisionado.',online:true,category:'Estética dental',color:'#6366F1',active:true,professionalIds:['p1']},
  {id:'s10',name:'Retorno pós-cirúrgico',duration:30,price:100,description:'Acompanhamento após procedimento cirúrgico.',online:true,category:'Pós-operatório',color:'#64748B',active:true,professionalIds:['p1']}
];

export const professionals: Professional[] = [
  {id:'p1',name:'Dra. Helena Martins',role:'Administrador',email:'helena@agendamodelo.com',phone:'(35) 98811-0001',services:['s1','s2','s3','s4','s5','s9','s10'],unit:'Unidade Principal',active:true,bio:'Cirurgiã-dentista principal, especialista em cirurgia oral, implantes e estética dental.',permissions:['all']},
  {id:'p2',name:'Dra. Camila Rocha',role:'Profissional',email:'camila@agendamodelo.com',phone:'(35) 98811-0002',services:['s1','s6','s7','s8'],unit:'Unidade Especializada',active:true,bio:'Cirurgiã-dentista ortodontista, responsável por aparelhos, alinhadores e acompanhamento ortodôntico.',permissions:['view_schedule','edit_own_appointments','view_clients']},
  {id:'p3',name:'Mariana Lopes',role:'Recepção',email:'mariana@agendamodelo.com',phone:'(35) 98811-0003',services:[],unit:'Unidade Principal',active:true,bio:'Secretária de atendimento, responsável pela recepção, confirmações e contato inicial com pacientes.',permissions:['create_appointments','edit_appointments','view_clients','send_messages']},
  {id:'p4',name:'Beatriz Almeida',role:'Recepção',email:'beatriz@agendamodelo.com',phone:'(35) 98811-0004',services:[],unit:'Unidade Principal',active:true,bio:'Secretária administrativa, responsável por cadastros, documentos e reagendamentos.',permissions:['create_clients','edit_clients','create_appointments','edit_appointments']},
  {id:'p5',name:'Juliana Prado',role:'Financeiro',email:'juliana@agendamodelo.com',phone:'(35) 98811-0005',services:[],unit:'Unidade Principal',active:true,bio:'Secretária financeira, responsável por pagamentos, cobranças e acompanhamento financeiro.',permissions:['view_finance','edit_payments','view_reports']},
  {id:'p6',name:'Rafael Nunes',role:'Assistente',email:'rafael@agendamodelo.com',phone:'(35) 98811-0006',services:[],unit:'Unidade Principal',active:true,bio:'Assistente odontológico, responsável por apoio em procedimentos, preparação da sala e suporte aos dentistas.',permissions:['view_schedule','view_clients']}
];

export const appointments: Appointment[] = [
  {id:'a1',clientId:'c1',serviceId:'s8',professionalId:'p2',date:'2026-05-10',time:'09:00',duration:40,value:150,status:'Confirmado',channel:'Online',notes:'Manutenção mensal do aparelho. Paciente prefere manhã.',history:['Agendamento criado','Confirmação enviada','Paciente confirmou'],payment:'Pago',unit:'Unidade Especializada'},
  {id:'a2',clientId:'c2',serviceId:'s3',professionalId:'p1',date:'2026-05-10',time:'10:30',duration:45,value:150,status:'Solicitado',channel:'WhatsApp',notes:'Avaliação para extração de siso. Aguardando confirmação.',history:['Solicitação recebida pelo WhatsApp'],payment:'Pendente',unit:'Unidade Principal'},
  {id:'a3',clientId:'c3',serviceId:'s9',professionalId:'p1',date:'2026-05-10',time:'14:00',duration:90,value:600,status:'Confirmado',channel:'Online',notes:'Sessão de clareamento. Paciente VIP.',history:['Agendamento criado','Mensagem de preparo enviada'],payment:'Pago',unit:'Unidade Principal'},
  {id:'a4',clientId:'c4',serviceId:'s1',professionalId:'p2',date:'2026-05-11',time:'08:30',duration:40,value:120,status:'Remarcado',channel:'Recepção',notes:'Remarcado por conflito do paciente.',history:['Agendamento criado','Remarcado para 11/05'],payment:'Pendente',unit:'Unidade Especializada'},
  {id:'a5',clientId:'c6',serviceId:'s8',professionalId:'p2',date:'2026-05-11',time:'17:30',duration:40,value:150,status:'Confirmado',channel:'Manual',notes:'Paciente só consegue vir após 17h.',history:['Agendamento recorrente criado'],payment:'Pendente',unit:'Unidade Especializada'}
];

export const waitlist: WaitlistItem[] = [
  {id:'w1',name:'Beatriz Alves',phone:'(35) 99222-9090',preference:'Sexta-feira à tarde',service:'Implante dentário',priority:'Alta',source:'WhatsApp'},
  {id:'w2',name:'Lucas Pereira',phone:'(35) 99313-1717',preference:'Qualquer horário depois das 17h',service:'Manutenção de aparelho',priority:'Normal',source:'Recepção'},
  {id:'w3',name:'Daniela Freitas',phone:'(35) 98818-5522',preference:'Encaixe ainda hoje',service:'Consulta odontológica inicial',priority:'Alta',source:'Instagram'}
];

export const logs: SystemLog[] = [
  {id:'l1',date:'2026-05-10 08:10',level:'SYSTEM',origin:'AppBootstrap',message:'Aplicação inicializada em modo Pré-alpha v0.2.',details:'Ambiente demonstrativo com dados da Agenda Modelo Operacional.'},
  {id:'l2',date:'2026-05-10 08:12',level:'INFO',origin:'AppointmentsService',message:'Agendamentos carregados com sucesso.',details:'5 registros sincronizados do localStorage.'},
  {id:'l3',date:'2026-05-10 08:18',level:'WARNING',origin:'AvailabilityService',message:'Existem horários livres sem divulgação.',details:'4 horários disponíveis amanhã.'},
  {id:'l4',date:'2026-05-10 08:22',level:'ERROR',origin:'ReminderSimulator',message:'Falha simulada ao enviar lembrete.',details:'Integração real com WhatsApp ainda não conectada.'},
  {id:'l5',date:'2026-05-10 08:24',level:'DEBUG',origin:'OnboardingState',message:'Checklist de configuração validado.',details:'Serviços, horários, equipe e página pública configurados.'}
];

export const auditLogs: AuditLog[] = [
  {id:'al1',date:'2026-05-10 08:32',actor:'Mariana Lopes',role:'Recepção',action:'Confirmou agendamento',target:'Ana Clara Martins',details:'Confirmação enviada pelo WhatsApp.'},
  {id:'al2',date:'2026-05-10 08:45',actor:'Dra. Helena Martins',role:'Administrador',action:'Alterou política de cancelamento',target:'Configurações da clínica',details:'Tolerância mantida em 10 minutos.'},
  {id:'al3',date:'2026-05-10 09:05',actor:'Juliana Prado',role:'Financeiro',action:'Registrou pagamento',target:'Clareamento dental',details:'Pagamento marcado como pago.'},
  {id:'al4',date:'2026-05-10 09:20',actor:'Sistema',role:'Desenvolvedor',action:'Executou automação',target:'Lembrete 24h antes',details:'Execução simulada concluída.'}
];

export const reviews: Review[] = [
  {id:'r1',clientId:'c1',professionalId:'p2',serviceId:'s8',rating:5,comment:'Atendimento muito organizado e rápido. Recebi lembrete antes do horário.',date:'2026-05-03'},
  {id:'r2',clientId:'c3',professionalId:'p1',serviceId:'s9',rating:5,comment:'Experiência excelente, clínica pontual e equipe muito atenciosa.',date:'2026-04-28'},
  {id:'r3',clientId:'c4',professionalId:'p2',serviceId:'s1',rating:3,comment:'Bom atendimento, mas precisei remarcar por atraso pessoal.',date:'2026-04-19'},
  {id:'r4',clientId:'c6',professionalId:'p2',serviceId:'s8',rating:5,comment:'A manutenção do aparelho foi bem tranquila e organizada.',date:'2026-05-02'}
];

export const automations: Automation[] = [
  {id:'auto1',name:'Lembrete 24h antes',status:'Ativa',channel:'WhatsApp',trigger:'24 horas antes do atendimento',message:'Olá, {{cliente}}! Lembrando do seu horário amanhã às {{hora}} para {{serviço}}.',lastRun:'2026-05-10 08:00'},
  {id:'auto2',name:'Confirmação automática',status:'Ativa',channel:'WhatsApp',trigger:'Agendamento confirmado',message:'Seu horário está confirmado para {{data}} às {{hora}}.',lastRun:'2026-05-10 08:15'},
  {id:'auto3',name:'Pesquisa de satisfação',status:'Pausada',channel:'E-mail',trigger:'Após atendimento concluído',message:'Como foi sua experiência na {{empresa}}?',lastRun:'2026-05-08 18:00'},
  {id:'auto4',name:'Reativação de paciente inativo',status:'Inativa',channel:'WhatsApp',trigger:'45 dias sem retorno',message:'Olá, {{cliente}}! Faz um tempo desde seu último atendimento. Deseja agendar um retorno?',lastRun:'Nunca executada'}
];

export const messageTemplates: MessageTemplate[] = [
  {id:'mt1',category:'Confirmação',title:'Confirmação de horário',channel:'WhatsApp',content:'Olá, {{cliente}}! Seu horário para {{serviço}} está confirmado para {{data}} às {{hora}}.'},
  {id:'mt2',category:'Lembrete',title:'Lembrete 24h antes',channel:'WhatsApp',content:'Olá, {{cliente}}! Passando para lembrar do seu atendimento amanhã às {{hora}} na {{empresa}}.'},
  {id:'mt3',category:'Pós-atendimento',title:'Agradecimento',channel:'WhatsApp',content:'Obrigado pela presença, {{cliente}}! A equipe da {{empresa}} agradece sua confiança.'},
  {id:'mt4',category:'Reativação',title:'Cliente inativo',channel:'WhatsApp',content:'Oi, {{cliente}}! Faz um tempo desde seu último atendimento. Quer agendar um retorno esta semana?'},
  {id:'mt5',category:'Cancelamento',title:'Aviso de cancelamento',channel:'WhatsApp',content:'Olá, {{cliente}}. Seu horário foi cancelado conforme solicitado. Podemos remarcar para outro dia?'},
  {id:'mt6',category:'Lista de espera',title:'Vaga disponível',channel:'WhatsApp',content:'Olá, {{cliente}}! Surgiu um horário disponível para {{serviço}}. Deseja confirmar?'}
];

export const integrations: Integration[] = [
  {id:'int1',name:'WhatsApp Business API',description:'Envio real de confirmações, lembretes e mensagens automáticas.',status:'Simulado',category:'Comunicação',lastSync:'Simulação ativa'},
  {id:'int2',name:'Google Calendar',description:'Sincronização de eventos, bloqueios e agenda profissional.',status:'Planejado',category:'Agenda',lastSync:'Não sincronizado'},
  {id:'int3',name:'Google Login / OAuth',description:'Login seguro com provedores externos.',status:'Planejado',category:'Segurança',lastSync:'Não conectado'},
  {id:'int4',name:'Stripe',description:'Assinaturas SaaS, cartões e gestão de planos.',status:'Planejado',category:'Pagamento',lastSync:'Modo teste'},
  {id:'int5',name:'Mercado Pago',description:'Pagamentos no Brasil com PIX, cartão e boleto.',status:'Planejado',category:'Pagamento',lastSync:'Modo teste'},
  {id:'int6',name:'Resend / E-mail transacional',description:'E-mails de confirmação, recuperação e comunicação.',status:'Simulado',category:'Comunicação',lastSync:'Simulação ativa'},
  {id:'int7',name:'Sentry',description:'Monitoramento de erros e estabilidade da aplicação.',status:'Simulado',category:'Monitoramento',lastSync:'Eventos demonstrativos'},
  {id:'int8',name:'Analytics',description:'Métricas de uso, conversão e comportamento.',status:'Simulado',category:'Monitoramento',lastSync:'Dados locais'}
];

export const plans: Plan[] = [
  {id:'plan1',name:'Essencial',price:49,description:'Para profissionais que estão começando a organizar horários.',features:['1 profissional','Página pública','Até 80 agendamentos/mês','Clientes básicos']},
  {id:'plan2',name:'Profissional',price:89,description:'Para negócios que recebem agendamentos todos os dias.',features:['Agendamentos ilimitados','Lembretes automáticos','Relatórios','Financeiro simples','Lista de espera'],highlighted:true},
  {id:'plan3',name:'Empresa',price:149,description:'Para equipes, unidades e operações com mais controle.',features:['Equipe completa','Permissões por função','Multiunidade','Audit logs','Suporte prioritário']}
];

export const payments: PaymentRecord[] = [
  {id:'pay1',date:'2026-05-01',description:'Assinatura Plano Profissional',provider:'Stripe',amount:89,status:'Pago'},
  {id:'pay2',date:'2026-05-08',description:'Implantação assistida demonstrativa',provider:'Mercado Pago',amount:197,status:'Teste'},
  {id:'pay3',date:'2026-05-10',description:'Cobrança simulada de upgrade',provider:'Mercado Pago',amount:149,status:'Pendente'}
];

export const permissions: PermissionGroup[] = [
  {role:'Administrador',description:'Controle completo da conta, equipe e configurações.',permissions:['Agenda completa','Clientes','Serviços','Equipe','Financeiro','Relatórios','Configurações','Console','Integrações']},
  {role:'Gerente',description:'Gestão operacional sem acesso técnico avançado.',permissions:['Agenda','Clientes','Equipe','Relatórios','Comunicação','Automações']},
  {role:'Recepção',description:'Atendimento diário, confirmação, remarcação e cadastro rápido.',permissions:['Agenda de hoje','Novo agendamento','Clientes','Lista de espera','Mensagens']},
  {role:'Profissional',description:'Acesso aos próprios atendimentos e histórico do paciente.',permissions:['Meus horários','Histórico do paciente','Concluir atendimento','Observações']},
  {role:'Financeiro',description:'Controle de pagamentos, cobranças e assinaturas.',permissions:['Financeiro','Pagamentos','Planos','Relatórios financeiros']},
  {role:'Desenvolvedor',description:'Diagnóstico, logs, eventos técnicos e monitoramento.',permissions:['Console do Sistema','Audit logs','Integrações','Sentry','Analytics']}
];

export const analyticsEvents: AnalyticsEvent[] = [
  {id:'ev1',date:'2026-05-10',event:'Cliques na página pública',source:'Instagram',value:42},
  {id:'ev2',date:'2026-05-10',event:'Agendamentos criados',source:'Página pública',value:8},
  {id:'ev3',date:'2026-05-10',event:'Mensagens copiadas',source:'Recepção',value:15},
  {id:'ev4',date:'2026-05-10',event:'QR Code escaneado',source:'Recepção',value:11},
  {id:'ev5',date:'2026-05-10',event:'Conversão de agendamento',source:'Link na bio',value:31}
];

export const notificationSettings: NotificationSetting[] = [
  {id:'n1',title:'Novo agendamento',channel:'Sistema',enabled:true,description:'Notifica a equipe quando um novo horário é solicitado.'},
  {id:'n2',title:'Lembrete 24h antes',channel:'WhatsApp',enabled:true,description:'Mensagem automática para reduzir faltas.'},
  {id:'n3',title:'Cancelamento de horário',channel:'Push',enabled:true,description:'Aviso rápido para recepção e gestor.'},
  {id:'n4',title:'Falha de pagamento',channel:'E-mail',enabled:false,description:'Aviso administrativo para cobrança e plano.'}
];

export const demoScenarios: DemoScenario[] = [
  {id:'demo1',name:'Agenda Modelo Operacional',segment:'Clínica odontológica',description:'Exemplo externo isolado, mantido fora do ambiente principal.'},
  {id:'demo2',name:'Barbearia Prime',segment:'Barbearia',description:'Exemplo de agenda com cortes, barba, combos e encaixes rápidos.'},
  {id:'demo3',name:'Studio Bella',segment:'Salão',description:'Exemplo para salão de beleza, estética e serviços recorrentes.'},
  {id:'demo4',name:'Consultoria Atlas',segment:'Consultoria',description:'Exemplo para reuniões, mentorias e atendimentos estratégicos.'},
  {id:'demo5',name:'TechFix Assistência',segment:'Assistência técnica',description:'Exemplo para serviços técnicos, visitas e atendimentos por horário.'}
];

export const segments: Record<string, string[]> = {
  'Clínica odontológica':['Consulta odontológica inicial','Limpeza profissional','Avaliação cirúrgica','Manutenção de aparelho','Clareamento dental'],
  'Barbearia':['Corte masculino','Barba','Corte + Barba','Sobrancelha'],
  'Consultoria':['Reunião inicial','Mentoria individual','Diagnóstico','Consultoria estratégica'],
  'Salão':['Corte feminino','Escova','Coloração','Tratamento'],
  'Assistência técnica':['Diagnóstico','Visita técnica','Manutenção','Instalação']
};
