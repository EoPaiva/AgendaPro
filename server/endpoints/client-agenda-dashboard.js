const { applySecurityHeaders, requireClient, cleanText, supabaseRequest, handleError } = require('../_security');
module.exports = async function handler(req,res){
 applySecurityHeaders(res);
 if(req.method !== 'GET'){res.setHeader('Allow','GET'); return res.status(405).json({ok:false,message:'Método não permitido.'});}
 try{
  const session = await requireClient(req);
  const slug = cleanText(req.query?.slug || '', 80);
  if(!slug) return res.status(400).json({ok:false,message:'Informe o slug da agenda.'});
  const rows = await supabaseRequest(`/rest/v1/agendapro_created_agendas?public_slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`,{method:'GET'});
  const agenda = Array.isArray(rows) ? rows[0] : null;
  if(!agenda) return res.status(404).json({ok:false,message:'Agenda não encontrada.'});
  const ownsByAccount = agenda.account_id && agenda.account_id === session.accountId;
  const ownsByCompany = agenda.company_id && session.companyId && agenda.company_id === session.companyId;
  const ownsByEmail = String(agenda.email || '').toLowerCase() === String(session.email || '').toLowerCase();
  if(!ownsByAccount && !ownsByCompany && !ownsByEmail) return res.status(403).json({ok:false,message:'Você não tem permissão para acessar esta agenda.'});
  const appointments = await supabaseRequest(`/rest/v1/agendapro_public_booking_requests?agenda_slug=eq.${encodeURIComponent(slug)}&select=*&order=requested_date.asc,requested_time.asc&limit=500`,{method:'GET'}).catch(()=>[]);
  return res.status(200).json({ok:true,agenda,appointments});
 }catch(error){ return handleError(res,error,'Erro ao carregar dashboard da agenda.');}
};
