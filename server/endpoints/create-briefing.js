function getSupabaseConfig() {
  return { url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY };
}
async function supabaseRequest(path, options = {}) {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) throw new Error('Supabase service role não configurada na Vercel.');
  const response = await fetch(`${url.replace(/\/$/, '')}${path}`, { ...options, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'application/json', ...(options.headers || {}) } });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${text || response.statusText}`);
  return data;
}
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, message: 'Método não permitido.' }); }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const payload = { business_name: String(body.businessName || '').trim(), full_name: String(body.fullName || '').trim(), email: String(body.email || '').trim().toLowerCase(), whatsapp: String(body.whatsapp || '').trim(), segment: String(body.segment || '').trim(), plan_id: String(body.planId || 'professional'), wants_implementation: Boolean(body.wantsImplementation), message: String(body.message || '').trim(), status: 'novo', source: String(body.source || 'site'), metadata: { deadline: '24h a 48h após briefing completo, caso não haja imprevistos' } };
    if (!payload.business_name || !payload.full_name || !payload.email || !payload.whatsapp) return res.status(400).json({ ok: false, message: 'Preencha negócio, nome, e-mail e WhatsApp.' });
    const inserted = await supabaseRequest('/rest/v1/agendapro_quick_briefings', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(payload) });
    return res.status(200).json({ ok: true, briefing: Array.isArray(inserted) ? inserted[0] : inserted });
  } catch (error) {
    console.error('create-briefing error:', error);
    return res.status(500).json({ ok: false, message: error.message || 'Erro ao salvar briefing rápido.' });
  }
};
