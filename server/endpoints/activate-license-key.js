const crypto = require('crypto');
const { applySecurityHeaders, readJsonBody, cleanText, requireClient, supabaseRequest, handleError } = require('../_security');
function hashKey(raw){ const secret = process.env.DEV_ADMIN_SECRET; if(!secret) throw new Error('DEV_ADMIN_SECRET não configurado.'); return crypto.createHash('sha256').update(`${secret}:${String(raw).trim().toUpperCase()}`).digest('hex'); }
module.exports = async function handler(req,res){
 applySecurityHeaders(res);
 if(req.method!=='POST'){res.setHeader('Allow','POST'); return res.status(405).json({ok:false,message:'Método não permitido.'});}
 try{
  const session = await requireClient(req);
  const body = readJsonBody(req);
  const raw = cleanText(body.key || '', 80).toUpperCase();
  if(!raw) return res.status(400).json({ok:false,message:'Informe a key.'});
  const keyHash = hashKey(raw);
  const found = await supabaseRequest(`/rest/v1/agendapro_license_keys?key_hash=eq.${encodeURIComponent(keyHash)}&select=*&limit=1`,{method:'GET'});
  const license = Array.isArray(found) ? found[0] : null;
  if(!license) return res.status(404).json({ok:false,message:'Key inválida ou inexistente.'});
  if(license.status === 'revoked') return res.status(400).json({ok:false,message:'Esta key foi revogada.'});
  if(license.status === 'activated' || Number(license.uses_count||0) >= Number(license.max_uses||1)) return res.status(400).json({ok:false,message:'Esta key já foi utilizada.'});
  if(license.expires_at && new Date(license.expires_at).getTime() < Date.now()) return res.status(400).json({ok:false,message:'Esta key expirou antes da ativação.'});
  const activatedAt = new Date();
  const trialEndsAt = new Date(Date.now()+Number(license.duration_days||30)*24*60*60*1000);
  const updated = await supabaseRequest(`/rest/v1/agendapro_license_keys?id=eq.${license.id}&status=eq.available`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({status:'activated',uses_count:Number(license.uses_count||0)+1,activated_at:activatedAt.toISOString(),activated_email:session.email,activated_business_name:session.company?.name || session.account.full_name,metadata:{...(license.metadata||{}),activated_source:'client_portal',account_id:session.accountId,company_id:session.companyId}})});
  if(!Array.isArray(updated) || !updated[0]) return res.status(409).json({ok:false,message:'Esta key já foi utilizada por outra conta.'});
  await supabaseRequest('/rest/v1/agendapro_license_key_redemptions',{method:'POST',body:JSON.stringify({license_key_id:license.id,account_id:session.accountId,company_id:session.companyId,email:session.email,business_name:session.company?.name || session.account.full_name,plan_id:license.plan_id,status:'active',activated_at:activatedAt.toISOString(),expires_at:trialEndsAt.toISOString(),metadata:{raw_prefix:raw.slice(0,15)}})}).catch(()=>null);
  await supabaseRequest(`/rest/v1/agendapro_client_accounts?id=eq.${session.accountId}`,{method:'PATCH',body:JSON.stringify({status:'active',metadata:{...(session.account.metadata||{}),license_source:'key_promocional',license_key_id:license.id,expires_at:trialEndsAt.toISOString()}})}).catch(()=>null);
  if(session.companyId){ await supabaseRequest(`/rest/v1/agendapro_companies?id=eq.${session.companyId}`,{method:'PATCH',body:JSON.stringify({current_plan_id:license.plan_id,subscription_status:'active',plan_started_at:activatedAt.toISOString(),plan_expires_at:trialEndsAt.toISOString(),onboarding_status:'payment_approved',readiness_score:20})}).catch(()=>null); }
  await supabaseRequest('/rest/v1/agendapro_client_activity_logs',{method:'POST',body:JSON.stringify({account_id:session.accountId,company_id:session.companyId,action:'license_key_activated',title:'Key promocional ativada',description:`${session.email} ativou uma licença ${license.type}.`,severity:'success',metadata:{plan_id:license.plan_id,license_key_id:license.id,expires_at:trialEndsAt.toISOString()}})}).catch(()=>null);
  return res.status(200).json({ok:true,planId:license.plan_id,planName:String(license.plan_id||'professional').replace(/^./,c=>c.toUpperCase()),expiresAt:trialEndsAt.toISOString(),durationDays:license.duration_days});
 }catch(error){ return handleError(res,error,'Erro ao ativar key.');}
};
