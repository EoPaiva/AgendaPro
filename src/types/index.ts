export type Status = 'Solicitado' | 'Confirmado' | 'Concluído' | 'Cancelado' | 'Não compareceu' | 'Remarcado';
export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG' | 'SYSTEM';
export type Role = 'Administrador' | 'Gerente' | 'Recepção' | 'Profissional' | 'Financeiro' | 'Desenvolvedor' | 'Assistente';
export type UserMode = 'Gestor' | 'Recepção' | 'Profissional' | 'Desenvolvedor';
export type Segment = 'Clínica odontológica' | 'Clínica' | 'Barbearia' | 'Salão' | 'Estética' | 'Psicologia' | 'Consultoria' | 'Personal Trainer' | 'Arquitetura' | 'Advocacia' | 'Educação' | 'Assistência técnica' | 'Outro';
export type IntegrationStatus = 'Conectado' | 'Simulado' | 'Planejado' | 'Não conectado';
export type PaymentStatus = 'Pago' | 'Pendente' | 'Falhou' | 'Cancelado' | 'Teste';
export type AutomationStatus = 'Ativa' | 'Inativa' | 'Pausada';
export type NotificationChannel = 'WhatsApp' | 'E-mail' | 'Push' | 'Sistema';

export interface Appointment {
  id:string;
  clientId:string;
  serviceId:string;
  professionalId:string;
  date:string;
  time:string;
  duration:number;
  value:number;
  status:Status;
  channel:'Online'|'Manual'|'WhatsApp'|'Recepção';
  notes:string;
  history:string[];
  payment:'Pago'|'Pendente'|'Cancelado'|'Cortesia';
  unit:string;
}

export interface Client {
  id:string;
  name:string;
  phone:string;
  email:string;
  tags:string[];
  notes:string;
  totalSpent:number;
  lastVisit:string;
  birth?:string;
  document?:string;
  preferredProfessional?:string;
  noShows?:number;
  satisfaction?:number;
}

export interface Service {
  id:string;
  name:string;
  duration:number;
  price:number;
  description:string;
  online:boolean;
  category:string;
  color:string;
  active:boolean;
  professionalIds:string[];
}

export interface Professional {
  id:string;
  name:string;
  role:Role;
  email:string;
  phone:string;
  services:string[];
  unit:string;
  active:boolean;
  bio:string;
  permissions:string[];
}

export interface Unit {
  id:string;
  name:string;
  address:string;
  phone:string;
  type:'Presencial'|'Online'|'Híbrida';
  active:boolean;
}

export interface WaitlistItem {
  id:string;
  name:string;
  phone:string;
  preference:string;
  service:string;
  priority:'Normal'|'Alta';
  source:'WhatsApp'|'Instagram'|'Página pública'|'Recepção';
}

export interface SystemLog {
  id:string;
  date:string;
  level:LogLevel;
  origin:string;
  message:string;
  details:string;
}

export interface AuditLog {
  id:string;
  date:string;
  actor:string;
  role:Role;
  action:string;
  target:string;
  details:string;
}

export interface Business {
  name:string;
  slug:string;
  segment:Segment;
  phone:string;
  address:string;
  instagram:string;
  primaryColor:string;
  publicMessage:string;
  cancellationPolicy:string;
  logoText:string;
  toleranceMinutes:number;
  minNoticeHours:number;
  maxAdvanceDays:number;
}

export interface Toast {
  id:string;
  title:string;
  message:string;
  tone:'success'|'info'|'warning'|'error';
}

export interface Review {
  id:string;
  clientId:string;
  professionalId:string;
  serviceId:string;
  rating:number;
  comment:string;
  date:string;
}

export interface Automation {
  id:string;
  name:string;
  status:AutomationStatus;
  channel:NotificationChannel;
  trigger:string;
  message:string;
  lastRun:string;
}

export interface MessageTemplate {
  id:string;
  category:string;
  title:string;
  channel:NotificationChannel;
  content:string;
}

export interface Integration {
  id:string;
  name:string;
  description:string;
  status:IntegrationStatus;
  category:'Agenda'|'Comunicação'|'Pagamento'|'Segurança'|'Monitoramento'|'Produtividade';
  lastSync:string;
}

export interface Plan {
  id:string;
  name:string;
  price:number;
  description:string;
  features:string[];
  highlighted?:boolean;
}

export interface PaymentRecord {
  id:string;
  date:string;
  description:string;
  provider:'Stripe'|'Mercado Pago'|'Manual';
  amount:number;
  status:PaymentStatus;
}

export interface PermissionGroup {
  role:Role;
  description:string;
  permissions:string[];
}

export interface AnalyticsEvent {
  id:string;
  date:string;
  event:string;
  source:string;
  value:number;
}

export interface NotificationSetting {
  id:string;
  title:string;
  channel:NotificationChannel;
  enabled:boolean;
  description:string;
}

export interface DemoScenario {
  id:string;
  name:string;
  segment:Segment;
  description:string;
}
