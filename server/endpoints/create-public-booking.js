const { applySecurityHeaders, readJsonBody, cleanText, cleanEmail, cleanPhone, supabaseRequest, handleError, slugify, logActivity } = require('../_security');
const { normalizeScheduleConfig, serviceDuration, isTimeSlotAvailable, toMinutes, toTime } = require('../availability');

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

  const agendas = await supabaseRequest(`/rest/v1/agendapro_created_agendas?public_slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=id,account_id,company_id,business_name,email,public_slug,services,hours,rules,raw_payload&limit=1`,{method:'GET'});
  const agenda = Array.isArray(agendas) ? agendas[0] : null;
  if(!agenda) return res.status(404).json({ok:false,message:'Agenda pública não encontrada ou não publicada.'});

  const services = Array.isArray(agenda.services) ? agenda.services : Array.isArray(agenda.raw_payload?.services) ? agenda.raw_payload.services : [];
  const selectedService = services.find(item => String(item.id || item.name) === String(serviceId || serviceName)) || services.find(item => item.name === serviceName) || services[0] || {};
  const durationMinutes = Number(body.durationMinutes || serviceDuration(selectedService));
  const scheduleConfig = normalizeScheduleConfig(agenda.raw_payload?.scheduleConfig, agenda.hours, agenda.rules);
  const existing = await supabaseRequest(`/rest/v1/agendapro_public_booking_requests?agenda_slug=eq.${encodeURIComponent(slug)}&requested_date=eq.${encodeURIComponent(date)}&select=id,requested_date,requested_time,status,metadata&limit=500`,{method:'GET'}).catch(()=>[]);
  const availability = isTimeSlotAvailable({ date, startTime: time, serviceDuration: durationMinutes, appointments: Array.isArray(existing) ? existing : [], scheduleConfig });
  if(!availability.available) return res.status(409).json({ok:false,message:availability.reason || 'Este horário acabou de ser reservado. Escolha outro horário.'});

  const endTime = toTime(toMinutes(time) + durationMinutes);
  const inserted = await supabaseRequest('/rest/v1/agendapro_public_booking_requests',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({agenda_id:agenda.id,account_id:agenda.account_id||null,company_id:agenda.company_id||null,agenda_slug:slug,business_name:agenda.business_name,customer_name:name,customer_phone:phone,customer_whatsapp:phone,customer_email:email || null,service_id:serviceId || selectedService.id || null,service_name:serviceName || selectedService.name || null,professional_id:professionalId || null,professional_name:professionalName || null,requested_date:date,requested_time:time,status:'requested',notes,customer_note:notes,metadata:{source:'public_booking_v0629',serviceId:serviceId || selectedService.id || selectedService.name || null,professionalId:professionalId || null,professionalName:professionalName || null,durationMinutes,endTime,date,startTime:time,ux:'public_booking_ux_pro'}})});
  await logActivity({ accountId: agenda.account_id || null, companyId: agenda.company_id || null, action: 'public_booking_created', title: 'Agendamento recebido', description: `${name} solicitou ${serviceName || 'um atendimento'} para ${date} às ${time}.`, severity: 'success', metadata: { slug, serviceName, professionalName, date, time, durationMinutes } });
  return res.status(200).json({ok:true,request:Array.isArray(inserted)?inserted[0]:inserted});
 }catch(error){ return handleError(res,error,'Erro ao solicitar agendamento.');}
};
