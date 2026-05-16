const { applySecurityHeaders, requireDev, supabaseRequest, handleError } = require('../_security');

function toCsv(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return '';
  const keys = Array.from(rows.reduce((set, row) => { Object.keys(row || {}).forEach(key => set.add(key)); return set; }, new Set()));
  const escape = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
  return [keys.join(','), ...rows.map(row => keys.map(key => escape(row[key])).join(','))].join('\n');
}

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);
  try {
    await requireDev(req);
    const entity = String((req.query && req.query.entity) || 'clients');
    const allowed = {
      clients:'/rest/v1/agendapro_client_accounts?select=*&limit=500',
      companies:'/rest/v1/agendapro_companies?select=*&limit=500',
      agendas:'/rest/v1/agendapro_created_agendas?select=*&limit=500',
      appointments:'/rest/v1/agendapro_public_booking_requests?select=*&limit=500',
      payments:'/rest/v1/agendapro_payments?select=*&limit=500',
      manual_payments:'/rest/v1/agendapro_manual_payment_requests?select=*&limit=500',
      logs:'/rest/v1/agendapro_client_activity_logs?select=*&limit=1000'
    };
    const path = allowed[entity];
    if (!path) return res.status(400).json({ ok:false, message:'Exportação não suportada.' });
    const rows = await supabaseRequest(path, { method:'GET' });
    res.setHeader('Content-Type','text/csv; charset=utf-8');
    res.setHeader('Content-Disposition',`attachment; filename="agendapro-${entity}.csv"`);
    return res.status(200).send(toCsv(rows));
  } catch (error) {
    return handleError(res, error, 'Erro ao exportar dados.');
  }
};
