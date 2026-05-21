const { applySecurityHeaders, readJsonBody, cleanText, requireDev, supabaseRequest, handleError } = require('../_security');
module.exports=async function handler(req,res){
 applySecurityHeaders(res);
 if(req.method!=='POST'){res.setHeader('Allow','POST'); return res.status(405).json({ok:false,message:'Método não permitido.'});}
 try{
  requireDev(req);
  const body = readJsonBody(req); const id = cleanText(body.id,80); const decision = body.decision === 'approved' ? 'approved' : 'rejected';
  if(!id) return res.status(400).json({ok:false,message:'Informe o id.'});
  const rows = await supabaseRequest(`/rest/v1/agendapro_manual_payment_requests?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({status:decision==='approved'?'approved_manual':'rejected_manual',reviewed_at:new Date().toISOString(),review_note:cleanText(body.note||'',800)})});
  const reqRow = Array.isArray(rows) ? rows[0] : rows;
  if(decision==='approved' && reqRow){
    await supabaseRequest('/rest/v1/agendapro_payments',{method:'POST',body:JSON.stringify({account_id:reqRow.account_id||null,company_id:reqRow.company_id||null,external_reference:`MANUAL-${id}`,amount:reqRow.amount||0,provider:'manual_mercado_pago',status:'paid',description:`Pagamento manual ${reqRow.plan_name||''}`,payer_email:reqRow.email,approved_at:new Date().toISOString(),paid_at:new Date().toISOString(),metadata:{manual_payment_request_id:id}})}).catch(()=>null);
    if(reqRow.account_id) await supabaseRequest(`/rest/v1/agendapro_client_accounts?id=eq.${reqRow.account_id}`,{method:'PATCH',body:JSON.stringify({status:'active'})}).catch(()=>null);
    if(reqRow.company_id) await supabaseRequest(`/rest/v1/agendapro_companies?id=eq.${reqRow.company_id}`,{method:'PATCH',body:JSON.stringify({subscription_status:'active',plan_started_at:new Date().toISOString(),plan_expires_at:new Date(Date.now()+30*24*60*60*1000).toISOString(),onboarding_status:'payment_approved',readiness_score:20})}).catch(()=>null);
  }
  return res.status(200).json({ok:true,status:decision,request:reqRow});
 }catch(error){ return handleError(res,error,'Erro ao resolver pagamento manual.', { exposeDetails: true });}
};
