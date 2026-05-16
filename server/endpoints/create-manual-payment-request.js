const { applySecurityHeaders, readJsonBody, cleanText, requireClient, supabaseRequest, handleError } = require('../_security');
module.exports = async function handler(req,res){
 applySecurityHeaders(res);
 if(req.method!=='POST'){res.setHeader('Allow','POST'); return res.status(405).json({ok:false,message:'Método não permitido.'});}
 try{
  const session = await requireClient(req);
  const body = readJsonBody(req);
  const amount = Math.max(0, Number(body.amount || 0));
  const account = session.account; const company = session.company;
  const inserted = await supabaseRequest('/rest/v1/agendapro_manual_payment_requests',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({
   account_id: session.accountId,
   company_id: session.companyId,
   full_name: account.full_name || account.fullName || null,
   email: session.email,
   whatsapp: account.whatsapp || null,
   business_name: company?.name || cleanText(body.businessName || '',160) || null,
   plan_id: cleanText(body.planId || company?.current_plan_id || 'professional',40),
   plan_name: cleanText(body.planName || '',80),
   amount,
   status:'pending_review',
   include_implementation:Boolean(body.includeImplementation),
   note:cleanText(body.note || '', 1200),
   payment_link:cleanText(body.paymentLink || '', 300),
   metadata:{source:'client_checkout_manual', user_agent:req.headers['user-agent'] || ''}
  })});
  await supabaseRequest('/rest/v1/agendapro_client_activity_logs',{method:'POST',body:JSON.stringify({account_id:session.accountId,company_id:session.companyId,action:'manual_payment_requested',title:'Pagamento manual aguardando confirmação',description:`${session.email} iniciou pagamento manual.`,severity:'warning',metadata:{amount}})}).catch(()=>null);
  return res.status(200).json({ok:true,request:Array.isArray(inserted)?inserted[0]:inserted});
 }catch(error){ return handleError(res,error,'Erro ao registrar pagamento manual.'); }
};
