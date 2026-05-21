const { applySecurityHeaders, requireDev, supabaseRequest, handleError } = require('../_security');

async function safe(path, fallback = []) {
  try {
    const data = await supabaseRequest(path);
    return Array.isArray(data) ? data : fallback;
  } catch {
    console.warn('Dev dashboard optional source ignored.');
    return fallback;
  }
}

function normalizeLog(row, source) {
  return {
    ...row,
    source,
    title: row.title || row.action || 'Evento registrado',
    description: row.description || row.action || 'Sem descrição',
    severity: row.severity || 'info',
    entity_id: row.entity_id || row.company_id || row.account_id || null,
    entity_type: row.entity_type || source,
  };
}

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);

  try {
    requireDev(req);

    const [
      accounts,
      companies,
      payments,
      manualPayments,
      briefings,
      webhooks,
      licenseKeys,
      activityLogs,
      auditLogs,
      agendas,
      appointments,
      settings,
      implementations,
      supportNotes,
      systemAlerts,
    ] = await Promise.all([
      safe('/rest/v1/agendapro_client_accounts?select=*&order=created_at.desc&limit=100'),
      safe('/rest/v1/agendapro_companies?select=*&order=created_at.desc&limit=100'),
      safe('/rest/v1/agendapro_payments?select=*&order=created_at.desc&limit=100'),
      safe('/rest/v1/agendapro_manual_payment_requests?select=*&order=created_at.desc&limit=100'),
      safe('/rest/v1/agendapro_quick_briefings?select=*&order=created_at.desc&limit=100'),
      safe('/rest/v1/agendapro_payment_webhook_events?select=*&order=created_at.desc&limit=100'),
      safe('/rest/v1/agendapro_license_keys?select=id,key_prefix,type,plan_id,duration_days,status,max_uses,uses_count,expires_at,activated_at,activated_email,activated_business_name,notes,metadata,created_at,updated_at&order=created_at.desc&limit=150'),
      safe('/rest/v1/agendapro_client_activity_logs?select=*&order=created_at.desc&limit=100'),
      safe('/rest/v1/agendapro_dev_audit_logs?select=*&order=created_at.desc&limit=100'),
      safe('/rest/v1/agendapro_created_agendas?select=*&order=created_at.desc&limit=100'),
      safe('/rest/v1/agendapro_public_booking_requests?select=*&order=created_at.desc&limit=100'),
      safe('/rest/v1/agendapro_admin_settings?select=*&order=updated_at.desc&limit=100'),
      safe('/rest/v1/agendapro_support_cases?select=*&order=updated_at.desc&limit=100'),
      safe('/rest/v1/agendapro_support_notes?select=*&order=created_at.desc&limit=100'),
      safe('/rest/v1/agendapro_system_alerts?select=*&order=created_at.desc&limit=100'),
    ]);

    const logs = [
      ...auditLogs.map(row => normalizeLog(row, 'auditoria')),
      ...activityLogs.map(row => normalizeLog(row, 'atividade')),
      ...systemAlerts.map(row => normalizeLog(row, 'alerta')),
    ].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 150);

    const estimatedRevenue = payments
      .filter(p => ['paid', 'approved'].includes(String(p.status || '').toLowerCase()))
      .reduce((sum, p) => sum + Number(p.amount || p.value || 0), 0) + manualPayments
      .filter(p => ['approved', 'approved_manual', 'paid'].includes(String(p.status || '').toLowerCase()))
      .reduce((sum, p) => sum + Number(p.amount || p.value || 0), 0);

    return res.status(200).json({
      ok: true,
      metrics: {
        accounts: accounts.length,
        companies: companies.length,
        agendas: agendas.length,
        appointments: appointments.length,
        payments: payments.length,
        manualPayments: manualPayments.length,
        briefings: briefings.length,
        implementations: implementations.length,
        webhooks: webhooks.length,
        availableKeys: licenseKeys.filter(k => k.status === 'available').length,
        estimatedRevenue,
      },
      accounts,
      clients: accounts,
      companies,
      payments,
      manualPayments,
      manualPaymentRequests: manualPayments,
      briefings,
      implementations,
      supportNotes,
      systemAlerts,
      webhooks,
      webhookEvents: webhooks,
      licenseKeys,
      keys: licenseKeys,
      activityLogs,
      auditLogs,
      logs,
      agendas,
      appointments,
      bookingRequests: appointments,
      settings,
      plans: settings.filter(row => String(row.key || '').startsWith('plan:')),
    });
  } catch (error) {
    return handleError(res, error, 'Erro ao carregar painel dev.');
  }
};
