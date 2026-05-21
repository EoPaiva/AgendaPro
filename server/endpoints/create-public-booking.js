const { applySecurityHeaders, readJsonBody, cleanText, cleanEmail, cleanPhone, supabaseRequest, handleError, slugify, logActivity } = require('../_security');
const { normalizeScheduleConfig, serviceDuration, serviceHasValidDuration, activePublicItems, professionalMatchesService, professionalScheduleConfig, appointmentsForProfessional, isTimeSlotAvailable, toMinutes, toTime } = require('../availability');

module.exports = async function handler(req,res){
 applySecurityHeaders(res);
 if(req.method !== 'POST'){res.setHeader('Allow','POST'); return res.status(405).json({ok:false,message:'Método não permitido.'});}
 try{
  const body = readJsonBody(req);
  const slug = slugify(body.slug || body.agendaSlug || '');
  const name = cleanText(body.name,160);
  const phone = cleanPhone(body.phone);
  const email = cleanEmail(body.email || '');
  const serviceId = cleanText(body.serviceId || '',120);
  const serviceName = cleanText(body.serviceName,160);
  const professionalId = cleanText(body.professionalId || '',120);
  const professionalName = cleanText(body.professionalName || '',160);
  const date = cleanText(body.date || body.requestedDate || '',40);
  const time = cleanText(body.time,40);
  const notes = cleanText(body.notes,1200);
  if(!slug || !name || !phone || !date || !time) return res.status(400).json({ok:false,message:'Informe nome, WhatsApp, data e horário.'});

  const agendas = await supabaseRequest(`/rest/v1/agendapro_created_agendas?public_slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=id,account_id,company_id,business_name,email,public_slug,services,team,hours,rules,raw_payload&limit=1`,{method:'GET'});
  const agenda = Array.isArray(agendas) ? agendas[0] : null;
  if(!agenda) return res.status(404).json({ok:false,message:'Agenda pública não encontrada ou não publicada.'});

  const services = activePublicItems(Array.isArray(agenda.services) ? agenda.services : Array.isArray(agenda.raw_payload?.services) ? agenda.raw_payload.services : []);
  const team = activePublicItems(Array.isArray(agenda.team) ? agenda.team : Array.isArray(agenda.raw_payload?.team) ? agenda.raw_payload.team : Array.isArray(agenda.raw_payload?.professionals) ? agenda.raw_payload.professionals : []);
  const selectedService = services.find(item => String(item.id || item.name) === String(serviceId || serviceName)) || services.find(item => item.name === serviceName);
  if(!selectedService) return res.status(400).json({ok:false,message:'Serviço indisponível ou inativo nesta agenda.'});
  if(!serviceHasValidDuration(body.durationMinutes ? { durationMinutes: body.durationMinutes } : selectedService)) return res.status(400).json({ok:false,message:'Este serviço está sem duração válida. Fale com a empresa pelo WhatsApp.'});
  const selectedProfessional = team.find(item => String(item.id || item.name) === String(professionalId || professionalName)) || team.find(item => item.name === professionalName);
  if(!selectedProfessional) return res.status(400).json({ok:false,message:'Profissional indisponível ou inativo para este serviço.'});
  if(!professionalMatchesService(selectedProfessional, selectedService)) return res.status(400).json({ok:false,message:'Este profissional não atende o serviço selecionado.'});
  const durationMinutes = Number(body.durationMinutes || serviceDuration(selectedService));
  const baseScheduleConfig = normalizeScheduleConfig(agenda.raw_payload?.scheduleConfig, agenda.hours, agenda.rules);
  const scheduleConfig = professionalScheduleConfig(baseScheduleConfig, selectedProfessional);
  const existing = await supabaseRequest(`/rest/v1/agendapro_public_booking_requests?agenda_slug=eq.${encodeURIComponent(slug)}&requested_date=eq.${encodeURIComponent(date)}&select=id,requested_date,requested_time,professional_id,professional_name,status,metadata&limit=500`,{method:'GET'}).catch(()=>[]);
  const professionalAppointments = appointmentsForProfessional(Array.isArray(existing) ? existing : [], selectedProfessional);
  const availability = isTimeSlotAvailable({ date, startTime: time, serviceDuration: durationMinutes, appointments: professionalAppointments, scheduleConfig });
  if(!availability.available) return res.status(409).json({ok:false,message:availability.reason || 'Este horário acabou de ser reservado. Escolha outro horário.'});

  const endTime = toTime(toMinutes(time) + durationMinutes);
  const inserted = await supabaseRequest('/rest/v1/agendapro_public_booking_requests',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({agenda_id:agenda.id,account_id:agenda.account_id||null,company_id:agenda.company_id||null,agenda_slug:slug,business_name:agenda.business_name,customer_name:name,customer_phone:phone,customer_whatsapp:phone,customer_email:email || null,service_id:serviceId || selectedService.id || selectedService.name || null,service_name:serviceName || selectedService.name || null,professional_id:professionalId || selectedProfessional.id || selectedProfessional.name || null,professional_name:professionalName || selectedProfessional.name || null,requested_date:date,requested_time:time,status:'requested',notes,customer_note:notes,metadata:{source:'public_booking_v0629',serviceId:serviceId || selectedService.id || selectedService.name || null,serviceName:serviceName || selectedService.name || null,professionalId:professionalId || selectedProfessional.id || selectedProfessional.name || null,professionalName:professionalName || selectedProfessional.name || null,durationMinutes,endTime,date,startTime:time,professionalScheduleApplied:Boolean(selectedProfessional.scheduleConfig || selectedProfessional.schedule_config || selectedProfessional.availability || selectedProfessional.schedule),ux:'public_booking_ux_pro'}})});
  await logActivity({ accountId: agenda.account_id || null, companyId: agenda.company_id || null, action: 'public_booking_created', title: 'Agendamento recebido', description: `${name} solicitou ${serviceName || selectedService.name || 'um atendimento'} para ${date} às ${time}.`, severity: 'success', metadata: { slug, serviceName: serviceName || selectedService.name, professionalName: professionalName || selectedProfessional.name, date, time, durationMinutes } });
  return res.status(200).json({ok:true,request:Array.isArray(inserted)?inserted[0]:inserted});
 }catch(error){ return handleError(res,error,'Erro ao solicitar agendamento.');}
};
