const { applySecurityHeaders, readJsonBody, cleanText, requireClient, supabaseRequest, handleError, slugify } = require('../_security');
function asArray(value){ return Array.isArray(value) ? value : []; }
module.exports = async function handler(req,res){
 applySecurityHeaders(res);
 if(req.method!=='POST'){res.setHeader('Allow','POST'); return res.status(405).json({ok:false,message:'Método não permitido.'});}
 try{
  const session = await requireClient(req);
  if(!['active','trial'].includes(String(session.account.status || '').toLowerCase()) && !['active','trial'].includes(String(session.company?.subscription_status || '').toLowerCase())) {
    return res.status(403).json({ok:false,message:'Acesso bloqueado. Ative uma key ou aguarde aprovação do pagamento antes de criar a agenda.'});
  }
  const body = readJsonBody(req);
  const agenda = body.agenda || {};
  const business = agenda.business || {};
  const visual = agenda.visual || {};
  const requestedSlug = slugify(agenda.slug || business.name || session.company?.slug || session.company?.name || session.account.full_name);
  const existingSlugRows = await supabaseRequest(`/rest/v1/agendapro_created_agendas?public_slug=eq.${encodeURIComponent(requestedSlug)}&select=id,account_id,company_id,email&limit=1`,{method:'GET'}).catch(()=>[]);
  const existing = Array.isArray(existingSlugRows) ? existingSlugRows[0] : null;
  if(existing && existing.account_id && existing.account_id !== session.accountId) return res.status(409).json({ok:false,message:'Este slug já pertence a outra agenda.'});
  const payload = {
    account_id: session.accountId,
    company_id: session.companyId,
    email: session.email,
    full_name: session.account.full_name || null,
    whatsapp: session.account.whatsapp || business.whatsapp || null,
    business_name: cleanText(business.name || session.company?.name || session.account.full_name || 'AgendaPro',160),
    public_slug: requestedSlug,
    public_link:`/#/agendar/${requestedSlug}`,
    plan_id: session.company?.current_plan_id || body.account?.planId || 'professional',
    status: agenda.publishedAt ? 'published' : 'draft',
    published_at: agenda.publishedAt || null,
    segment: cleanText(business.segment || '',120),
    address: cleanText(business.address || '',250),
    description: cleanText(business.description || '',1200),
    theme:{primary_color:visual.primaryColor,secondary_color:visual.secondaryColor,accent_color:visual.accentColor,logo_url:visual.logoUrl,banner_url:visual.bannerUrl,instagram:visual.instagram,site_url:visual.siteUrl,welcome:visual.welcome,slogan:visual.slogan},
    services: asArray(agenda.services).slice(0,80),
    team: asArray(agenda.team).slice(0,50),
    hours: agenda.hours || {},
    rules: agenda.rules || {},
    schedule_config: agenda.scheduleConfig || agenda.schedule_config || {},
    published: Boolean(agenda.publishedAt),
    raw_payload: agenda
  };
  let result;
  if(existing?.id){
    const rows = await supabaseRequest(`/rest/v1/agendapro_created_agendas?id=eq.${existing.id}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});
    result = Array.isArray(rows)?rows[0]:rows;
  } else {
    const rows = await supabaseRequest('/rest/v1/agendapro_created_agendas',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});
    result = Array.isArray(rows)?rows[0]:rows;
  }
  if(session.companyId){
    await supabaseRequest(`/rest/v1/agendapro_companies?id=eq.${encodeURIComponent(session.companyId)}`,{
      method:'PATCH',
      body:JSON.stringify({
        name: payload.business_name,
        business_name: payload.business_name,
        public_slug: requestedSlug,
        whatsapp: payload.whatsapp,
        phone: payload.whatsapp,
        address: payload.address,
        description: payload.description,
        onboarding_status: payload.status === 'published' ? 'published' : 'draft',
        updated_at: new Date().toISOString()
      })
    }).catch(()=>null);
  }
  await supabaseRequest('/rest/v1/agendapro_client_activity_logs',{method:'POST',body:JSON.stringify({account_id:session.accountId,company_id:session.companyId,action:payload.status==='published'?'agenda_published':'agenda_saved',title:payload.status==='published'?'Agenda publicada':'Agenda salva',description:`${session.email} salvou ${payload.business_name}.`,severity:'success',metadata:{public_slug:requestedSlug}})}).catch(()=>null);
  return res.status(200).json({ok:true,agenda:result,slug:requestedSlug});
 }catch(error){ return handleError(res,error,'Erro ao criar agenda.'); }
};
