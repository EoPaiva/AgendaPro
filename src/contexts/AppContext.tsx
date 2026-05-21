import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import {
  analyticsEvents as analyticsSeed,
  appointments as appointmentSeed,
  auditLogs as auditSeed,
  automations as automationSeed,
  business as businessSeed,
  clients as clientSeed,
  demoScenarios as demoSeed,
  integrations as integrationSeed,
  logs as logSeed,
  messageTemplates as messageSeed,
  notificationSettings as notificationSeed,
  payments as paymentSeed,
  permissions as permissionSeed,
  plans as planSeed,
  professionals as professionalSeed,
  reviews as reviewSeed,
  services as serviceSeed,
  units as unitSeed,
  waitlist as waitlistSeed
} from '../data/seed';
import {
  AnalyticsEvent,
  Appointment,
  AuditLog,
  Automation,
  Business,
  Client,
  DemoScenario,
  Integration,
  MessageTemplate,
  NotificationSetting,
  PaymentRecord,
  PermissionGroup,
  Plan,
  Professional,
  Review,
  Service,
  SystemLog,
  Toast,
  Unit,
  UserMode,
  WaitlistItem
} from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { uid } from '../utils/format';
import {
  fetchAgendaProDemo,
  insertAuditLog,
  insertSystemLog,
  isUuid,
  removeById,
  supabaseConfig,
  upsertAppointment,
  upsertClient,
  upsertService
} from '../lib/supabase';

interface AppContextValue {
  business:Business; setBusiness:(b:Business)=>void;
  appointments:Appointment[]; setAppointments:(a:Appointment[])=>void;
  clients:Client[]; setClients:(c:Client[])=>void;
  services:Service[]; setServices:(s:Service[])=>void;
  professionals:Professional[]; setProfessionals:(p:Professional[])=>void;
  units:Unit[]; setUnits:(u:Unit[])=>void;
  waitlist:WaitlistItem[]; setWaitlist:(w:WaitlistItem[])=>void;
  logs:SystemLog[]; addLog:(log:Omit<SystemLog,'id'|'date'>)=>void; clearLogs:()=>void;
  auditLogs:AuditLog[]; addAudit:(audit:Omit<AuditLog,'id'|'date'>)=>void; setAuditLogs:(a:AuditLog[])=>void;
  reviews:Review[]; setReviews:(r:Review[])=>void;
  automations:Automation[]; setAutomations:(a:Automation[])=>void;
  messages:MessageTemplate[]; setMessages:(m:MessageTemplate[])=>void;
  integrations:Integration[]; setIntegrations:(i:Integration[])=>void;
  plans:Plan[]; payments:PaymentRecord[]; setPayments:(p:PaymentRecord[])=>void;
  permissions:PermissionGroup[]; setPermissions:(p:PermissionGroup[])=>void;
  analyticsEvents:AnalyticsEvent[]; setAnalyticsEvents:(a:AnalyticsEvent[])=>void;
  notificationSettings:NotificationSetting[]; setNotificationSettings:(n:NotificationSetting[])=>void;
  demoScenarios:DemoScenario[];
  toasts:Toast[]; pushToast:(toast:Omit<Toast,'id'>)=>void; dismissToast:(id:string)=>void;
  selectedMode:UserMode; setSelectedMode:(m:UserMode)=>void;
  selectedUnit:string; setSelectedUnit:(u:string)=>void;
  selectedDemo:string; setSelectedDemo:(d:string)=>void;
  dataSource:'supabase'|'localStorage';
  syncStatus:string;
  remoteCompanyId:string|null;
  reloadFromSupabase:()=>Promise<void>;
}
const AppContext=createContext<AppContextValue|null>(null);

function changedIds<T extends {id:string}>(previous:T[], next:T[]) {
  const nextIds = new Set(next.map(item => item.id));
  return previous.filter(item => !nextIds.has(item.id));
}

export function AppProvider({children}:{children:ReactNode}){
 const [business,setBusiness]=useLocalStorage('agp-v03-business',businessSeed);
 const [appointments,setRawAppointments]=useLocalStorage('agp-v03-appointments',appointmentSeed);
 const [clients,setRawClients]=useLocalStorage('agp-v03-clients',clientSeed);
 const [services,setRawServices]=useLocalStorage('agp-v03-services',serviceSeed);
 const [professionals,setProfessionals]=useLocalStorage('agp-v03-professionals',professionalSeed);
 const [units,setUnits]=useLocalStorage('agp-v03-units',unitSeed);
 const [waitlist,setWaitlist]=useLocalStorage('agp-v03-waitlist',waitlistSeed);
 const [logs,setRawLogs]=useLocalStorage('agp-v03-logs',logSeed);
 const [auditLogs,setRawAuditLogs]=useLocalStorage('agp-v03-audit-logs',auditSeed);
 const [reviews,setReviews]=useLocalStorage('agp-v03-reviews',reviewSeed);
 const [automations,setAutomations]=useLocalStorage('agp-v03-automations',automationSeed);
 const [messages,setMessages]=useLocalStorage('agp-v03-messages',messageSeed);
 const [integrations,setIntegrations]=useLocalStorage('agp-v03-integrations',integrationSeed);
 const [payments,setPayments]=useLocalStorage('agp-v03-payments',paymentSeed);
 const [permissions,setPermissions]=useLocalStorage('agp-v03-permissions',permissionSeed);
 const [analyticsEvents,setAnalyticsEvents]=useLocalStorage('agp-v03-analytics',analyticsSeed);
 const [notificationSettings,setNotificationSettings]=useLocalStorage('agp-v03-notifications',notificationSeed);
 const [remoteCompanyId,setRemoteCompanyId]=useLocalStorage<string|null>('agp-v03-remote-company-id',null);
 const [dataSource,setDataSource]=useState<'supabase'|'localStorage'>('localStorage');
 const [syncStatus,setSyncStatus]=useState('Site principal ativo. Dados reais são carregados pelas APIs seguras conforme login, agenda pública ou Central Dev.');
 const [toasts,setToasts]=useState<Toast[]>([]);
 const [selectedMode,setSelectedMode]=useState<UserMode>('Gestor');
 const [selectedUnit,setSelectedUnit]=useState('Todas as unidades');
 const [selectedDemo,setSelectedDemo]=useState('Ambiente operacional');
 const plans=planSeed;
 const demoScenarios=demoSeed;

 const pushToast=(toast:Omit<Toast,'id'>)=>{const id=uid(); setToasts(t=>[...t,{...toast,id}]); setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),4200)};
 const dismissToast=(id:string)=>setToasts(t=>t.filter(x=>x.id!==id));

 const reloadFromSupabase=async()=>{
   const legacyBootstrapEnabled = import.meta.env.VITE_AGENDAPRO_ENABLE_REMOTE_BOOTSTRAP === 'true';
   if(!legacyBootstrapEnabled){
     setDataSource('localStorage');
     setSyncStatus('Site principal ativo. Dados reais são carregados pelas APIs seguras conforme login, agenda pública ou Central Dev.');
     return;
   }
   if(!supabaseConfig.isConfigured){
     setDataSource('localStorage');
     setSyncStatus('Bootstrap remoto desativado: Supabase não configurado para leitura direta no frontend.');
     return;
   }
   try{
     const defaultSlug = import.meta.env.VITE_AGENDAPRO_DEFAULT_COMPANY_SLUG || 'minha-agenda';
     setSyncStatus('Conectando ao Supabase e carregando dados operacionais da agenda padrão...');
     const remote=await fetchAgendaProDemo(defaultSlug);
     setBusiness(remote.business);
     setUnits(remote.units.length?remote.units:unitSeed);
     setProfessionals(remote.professionals.length?remote.professionals:professionalSeed);
     setRawServices(remote.services.length?remote.services:serviceSeed);
     setRawClients(remote.clients.length?remote.clients:clientSeed);
     setRawAppointments(remote.appointments.length?remote.appointments:appointmentSeed);
     setWaitlist(remote.waitlist.length?remote.waitlist:waitlistSeed);
     setMessages(remote.messages.length?remote.messages:messageSeed);
     setAutomations(remote.automations.length?remote.automations:automationSeed);
     setIntegrations(remote.integrations.length?remote.integrations:integrationSeed);
     setReviews(remote.reviews.length?remote.reviews:reviewSeed);
     setRawAuditLogs(remote.auditLogs.length?remote.auditLogs:auditSeed);
     setRawLogs(remote.systemLogs.length?remote.systemLogs:logSeed);
     setPayments(remote.payments.length?remote.payments:paymentSeed);
     setAnalyticsEvents(remote.analyticsEvents.length?remote.analyticsEvents:analyticsSeed);
     setNotificationSettings(remote.notificationSettings.length?remote.notificationSettings:notificationSeed);
     setRemoteCompanyId(remote.companyId);
     setDataSource('supabase');
     setSyncStatus('Supabase conectado. Dados operacionais carregados do banco.');
   }catch{
     setDataSource('localStorage');
     setSyncStatus('Site principal ativo. O bootstrap legado não carregou, mas as APIs seguras continuam sendo a fonte dos dados reais.');
   }
 };

 useEffect(()=>{
   void reloadFromSupabase();
   // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);

 const persistSafe = (task:Promise<unknown>) => {
   task.catch(()=>{
     setSyncStatus('A sincronização remota dessa ação falhou. Recarregue os dados ou verifique as APIs/Supabase.');
   });
 };

 const setServices=(next:Service[])=>{
   const previous=services;
   setRawServices(next);
   if(dataSource==='supabase'&&remoteCompanyId){
     next.filter(s=>isUuid(s.id)).forEach(service=>persistSafe(upsertService(remoteCompanyId,service)));
     changedIds(previous,next).filter(s=>isUuid(s.id)).forEach(service=>persistSafe(removeById('agendapro_services',service.id)));
   }
 };

 const setClients=(next:Client[])=>{
   const previous=clients;
   setRawClients(next);
   if(dataSource==='supabase'&&remoteCompanyId){
     next.filter(c=>isUuid(c.id)).forEach(client=>persistSafe(upsertClient(remoteCompanyId,client)));
     changedIds(previous,next).filter(c=>isUuid(c.id)).forEach(client=>persistSafe(removeById('agendapro_clients',client.id)));
   }
 };

 const setAppointments=(next:Appointment[])=>{
   const previous=appointments;
   setRawAppointments(next);
   if(dataSource==='supabase'&&remoteCompanyId){
     next.filter(a=>isUuid(a.id)).forEach(appointment=>persistSafe(upsertAppointment(remoteCompanyId,appointment)));
     changedIds(previous,next).filter(a=>isUuid(a.id)).forEach(appointment=>persistSafe(removeById('agendapro_appointments',appointment.id)));
   }
 };

 const setAuditLogs=(next:AuditLog[])=>setRawAuditLogs(next);
 const clearLogs=()=>setRawLogs([]);
 const addLog=(log:Omit<SystemLog,'id'|'date'>)=>{
   const item={...log,id:uid(),date:new Date().toLocaleString('pt-BR')};
   setRawLogs([item,...logs]);
   if(dataSource==='supabase'&&remoteCompanyId) persistSafe(insertSystemLog(remoteCompanyId,log));
 };
 const addAudit=(audit:Omit<AuditLog,'id'|'date'>)=>{
   const item={...audit,id:uid(),date:new Date().toLocaleString('pt-BR')};
   setRawAuditLogs([item,...auditLogs]);
   if(dataSource==='supabase'&&remoteCompanyId) persistSafe(insertAuditLog(remoteCompanyId,audit));
 };

 const value=useMemo(()=>({business,setBusiness,appointments,setAppointments,clients,setClients,services,setServices,professionals,setProfessionals,units,setUnits,waitlist,setWaitlist,logs,addLog,clearLogs,auditLogs,addAudit,setAuditLogs,reviews,setReviews,automations,setAutomations,messages,setMessages,integrations,setIntegrations,plans,payments,setPayments,permissions,setPermissions,analyticsEvents,setAnalyticsEvents,notificationSettings,setNotificationSettings,demoScenarios,toasts,pushToast,dismissToast,selectedMode,setSelectedMode,selectedUnit,setSelectedUnit,selectedDemo,setSelectedDemo,dataSource,syncStatus,remoteCompanyId,reloadFromSupabase}),[business,appointments,clients,services,professionals,units,waitlist,logs,auditLogs,reviews,automations,messages,integrations,payments,permissions,analyticsEvents,notificationSettings,toasts,selectedMode,selectedUnit,selectedDemo,dataSource,syncStatus,remoteCompanyId]);
 return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp(){const ctx=useContext(AppContext); if(!ctx) throw new Error('useApp must be used within AppProvider'); return ctx;}
