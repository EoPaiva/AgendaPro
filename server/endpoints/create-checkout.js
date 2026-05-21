const crypto = require('crypto');
const { applySecurityHeaders, readJsonBody, cleanText, normalizePlan, requireClient, supabaseRequest, handleError } = require('../_security');

const PLAN_CATALOG = {
  essential: { id: 'essential', name: 'Essencial', price: 49.9, description: 'Plano Essencial AgendaPro' },
  professional: { id: 'professional', name: 'Profissional', price: 99.9, description: 'Plano Profissional AgendaPro' },
  business: { id: 'business', name: 'Empresa', price: 199.9, description: 'Plano Empresa AgendaPro' }
};
function getAppUrl(req) { const configured = process.env.APP_URL || process.env.VITE_APP_URL; if (configured) return configured.replace(/\/$/, ''); const host = req.headers['x-forwarded-host'] || req.headers.host; const proto = req.headers['x-forwarded-proto'] || 'https'; return `${proto}://${host}`; }
module.exports = async function handler(req,res){
 applySecurityHeaders(res);
 if(req.method!=='POST'){res.setHeader('Allow','POST'); return res.status(405).json({ok:false,message:'Método não permitido.'});}
 try{
  const session = await requireClient(req);
  const body = readJsonBody(req);
  const planId = normalizePlan(body.planId);
  const plan = PLAN_CATALOG[planId] || PLAN_CATALOG.professional;
  const includeImplementation = Boolean(body.includeImplementation);
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if(!accessToken) return res.status(500).json({ok:false,message:'MERCADO_PAGO_ACCESS_TOKEN não configurado na Vercel.'});
  const appUrl = getAppUrl(req);
  const externalReference = `AGENDAPRO-${plan.id.toUpperCase()}-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const payerName = session.account.full_name || cleanText(body.fullName || 'Cliente AgendaPro',160);
  const payerPhone = session.account.whatsapp || cleanText(body.whatsapp || '',40);
  const businessName = session.company?.name || cleanText(body.businessName || '',160) || payerName;
  const amount = Number(plan.price) + (includeImplementation ? 100 : 0);
  let checkoutSession = null;
  try{
    const inserted = await supabaseRequest('/rest/v1/agendapro_checkout_sessions', { method:'POST', headers:{Prefer:'return=representation'}, body:JSON.stringify({ account_id:session.accountId, company_id:session.companyId, plan_id:plan.id, checkout_type:includeImplementation?'plan_with_implementation':'plan', provider:'mercado_pago', external_reference:externalReference, payer_name:payerName, payer_email:session.email, payer_phone:payerPhone, business_name:businessName, business_slug:session.company?.slug || null, amount, currency:'BRL', status:'created', success_url:`${appUrl}/#/pagamento/sucesso`, pending_url:`${appUrl}/#/pagamento/pendente`, failure_url:`${appUrl}/#/pagamento/erro`, metadata:{include_implementation:includeImplementation, source:'checkout_api_secure'} }) });
    checkoutSession = Array.isArray(inserted) ? inserted[0] : inserted;
  }catch(error){ console.warn('checkout session warning:', error.message); }
  const preferencePayload = {
    items:[
      { id: plan.id, title:`AgendaPro — Plano ${plan.name}`, description:plan.description, quantity:1, currency_id:'BRL', unit_price:Number(plan.price) },
      ...(includeImplementation ? [{ id:'implementation', title:'AgendaPro — Implantação Assistida', description:'Configuração inicial em 24h a 48h após briefing completo, caso não haja imprevistos.', quantity:1, currency_id:'BRL', unit_price:100 }] : [])
    ],
    payer:{ name:payerName, email:session.email, phone:{ number:String(payerPhone||'').replace(/\D/g,'') } },
    external_reference:externalReference,
    metadata:{ account_id:session.accountId, company_id:session.companyId, email:session.email, business_name:businessName, plan_id:plan.id, checkout_session_id:checkoutSession?.id || null, include_implementation:includeImplementation },
    back_urls:{ success:`${appUrl}/#/pagamento/sucesso`, pending:`${appUrl}/#/pagamento/pendente`, failure:`${appUrl}/#/pagamento/erro` },
    auto_return:'approved',
    notification_url:`${appUrl}/api/mercadopago-webhook`,
    statement_descriptor:'AGENDAPRO',
    payment_methods:{ installments:12 }
  };
  const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', { method:'POST', headers:{ Authorization:`Bearer ${accessToken}`, 'Content-Type':'application/json' }, body:JSON.stringify(preferencePayload) });
  const mpData = await mpResponse.json();
  if(!mpResponse.ok) return res.status(mpResponse.status).json({ok:false,message:'Mercado Pago recusou a criação do checkout.',detail:mpData});
  if(checkoutSession?.id){ await supabaseRequest(`/rest/v1/agendapro_checkout_sessions?id=eq.${checkoutSession.id}`, { method:'PATCH', body:JSON.stringify({ status:'redirected', mp_preference_id:mpData.id, mp_init_point:mpData.init_point, mp_sandbox_init_point:mpData.sandbox_init_point }) }).catch(()=>null); }
  await supabaseRequest('/rest/v1/agendapro_client_activity_logs',{method:'POST',body:JSON.stringify({account_id:session.accountId,company_id:session.companyId,action:'checkout_created',title:'Checkout criado',description:`Checkout seguro criado para ${session.email}.`,severity:'info',metadata:{external_reference:externalReference,plan_id:plan.id,amount}})}).catch(()=>null);
  return res.status(200).json({ok:true,initPoint:mpData.init_point || mpData.sandbox_init_point,preferenceId:mpData.id,externalReference,checkoutSessionId:checkoutSession?.id || null});
 }catch(error){ return handleError(res,error,'Erro inesperado ao criar checkout.'); }
};
