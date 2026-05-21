const fs = require('fs');
const path = require('path');
const { applySecurityHeaders, requireDev, supabaseRequest, handleError } = require('../_security');

async function safe(path, fallback = [], sourceHealth = null, label = path) {
  const startedAt = Date.now();
  try {
    const data = await supabaseRequest(path);
    const rows = Array.isArray(data) ? data : fallback;
    if (sourceHealth) {
      sourceHealth.push({
        label,
        status: 'ok',
        count: Array.isArray(rows) ? rows.length : 0,
        latencyMs: Date.now() - startedAt,
      });
    }
    return rows;
  } catch {
    console.warn('Dev dashboard optional source ignored.');
    if (sourceHealth) {
      sourceHealth.push({
        label,
        status: 'error',
        count: 0,
        latencyMs: Date.now() - startedAt,
        message: 'Fonte indisponivel ou sem permissao de leitura.',
      });
    }
    return fallback;
  }
}

function hasEnv(...names) {
  return names.some(name => Boolean(process.env[name]));
}

function routeExists(fileName) {
  return fs.existsSync(path.join(__dirname, '..', '..', 'api', fileName));
}

function healthCheck(id, title, status, description, details = '', tab = 'logs') {
  return { id, title, status, description, details, tab };
}

function redactOperationalText(value, max = 240) {
  return String(value || '')
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [redacted]')
    .replace(/(SUPABASE_SERVICE_ROLE_KEY|CLIENT_SESSION_SECRET|DEV_ADMIN_SECRET|DEV_ADMIN_PASSWORD|MERCADO_PAGO_ACCESS_TOKEN)\s*[:=]\s*\S+/gi, '$1=[redacted]')
    .replace(/[A-Za-z0-9_-]{40,}/g, '[redacted]')
    .slice(0, max);
}

function buildOperationalHealth({ sourceHealth, logs }) {
  const devSecretConfigured = String(process.env.DEV_ADMIN_SECRET || '').length >= 16;
  const devLoginConfigured = hasEnv('DEV_ADMIN_EMAIL') && hasEnv('DEV_ADMIN_PASSWORD');
  const mpTokenConfigured = hasEnv('MERCADO_PAGO_ACCESS_TOKEN');
  const mpFallbackConfigured = true;
  const routeStatus = {
    public: routeExists('public.js'),
    client: routeExists('client.js'),
    dev: routeExists('dev.js'),
  };
  const failedSources = sourceHealth.filter(item => item.status === 'error');
  const lastKnownError = logs.find(item => ['critical', 'error'].includes(String(item.severity || '').toLowerCase())) || null;
  const checks = [
    healthCheck(
      'supabase_url',
      'Supabase URL',
      hasEnv('SUPABASE_URL', 'VITE_SUPABASE_URL') ? 'ok' : 'error',
      'URL do Supabase configurada no ambiente de producao.',
      hasEnv('SUPABASE_URL', 'VITE_SUPABASE_URL') ? 'Configurada' : 'Ausente'
    ),
    healthCheck(
      'supabase_service_role',
      'Service role',
      hasEnv('SUPABASE_SERVICE_ROLE_KEY') ? 'ok' : 'error',
      'Chave server-side necessaria para operacoes protegidas.',
      hasEnv('SUPABASE_SERVICE_ROLE_KEY') ? 'Configurada sem exposicao' : 'Ausente'
    ),
    healthCheck(
      'dev_envs',
      'Credenciais Dev',
      devSecretConfigured && devLoginConfigured ? 'ok' : 'error',
      'Central Dev exige login e token assinado no backend.',
      devSecretConfigured && devLoginConfigured ? 'Login dev e segredo de sessao configurados' : 'Revise DEV_ADMIN_SECRET, DEV_ADMIN_EMAIL e DEV_ADMIN_PASSWORD'
    ),
    healthCheck(
      'mercado_pago',
      'Mercado Pago',
      mpTokenConfigured ? 'ok' : mpFallbackConfigured ? 'warning' : 'error',
      'Checkout automatico usa token server-side; links manuais mantem fallback.',
      mpTokenConfigured ? 'Checkout automatico habilitado' : 'Fallback manual ativo'
    ),
    healthCheck(
      'app_url',
      'APP_URL',
      hasEnv('APP_URL', 'VITE_APP_URL') ? 'ok' : 'warning',
      'URL base usada em callbacks, retornos e links do checkout.',
      hasEnv('APP_URL', 'VITE_APP_URL') ? 'Configurada' : 'Fallback por host da requisicao'
    ),
    healthCheck(
      'demo_url',
      'Demo URL',
      hasEnv('VITE_AGENDAPRO_DEMO_URL') ? 'ok' : 'warning',
      'Link externo da demonstracao comercial.',
      hasEnv('VITE_AGENDAPRO_DEMO_URL') ? 'Configurada' : 'Fallback publico padrao'
    ),
    healthCheck(
      'main_tables',
      'Tabelas principais',
      failedSources.length ? 'error' : 'ok',
      'Leitura das principais tabelas operacionais da Central Dev.',
      failedSources.length ? `${failedSources.length} fonte(s) com erro` : `${sourceHealth.length} fonte(s) acessivel(is)`,
      'logs'
    ),
    healthCheck(
      'public_endpoint',
      'Endpoint publico',
      routeStatus.public ? 'ok' : 'error',
      'Rota publica de agenda/agendamento existe no bundle serverless.',
      routeStatus.public ? '/api/public disponivel' : '/api/public ausente',
      'tools'
    ),
    healthCheck(
      'client_endpoint',
      'Endpoint cliente',
      routeStatus.client ? 'ok' : 'error',
      'Rota do painel do cliente existe e continua protegida por sessao.',
      routeStatus.client ? '/api/client disponivel' : '/api/client ausente',
      'clients'
    ),
    healthCheck(
      'dev_endpoint',
      'Endpoint dev protegido',
      routeStatus.dev && devSecretConfigured ? 'ok' : 'error',
      'Esta leitura passou por requireDev antes de montar o diagnostico.',
      routeStatus.dev && devSecretConfigured ? 'Protecao ativa' : 'Rota ou segredo dev ausente',
      'audit'
    ),
    healthCheck(
      'last_known_error',
      'Ultimo erro conhecido',
      lastKnownError ? 'warning' : 'ok',
      'Falha mais recente registrada em logs e alertas operacionais.',
      lastKnownError ? `${lastKnownError.title || lastKnownError.action || 'Erro'} em ${lastKnownError.created_at || 'data nao informada'}` : 'Nenhum erro critico recente carregado',
      'logs'
    ),
  ];
  const summary = checks.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, { ok: 0, warning: 0, error: 0 });
  const score = Math.max(0, Math.round((summary.ok / Math.max(1, checks.length)) * 100 - summary.warning * 4 - summary.error * 10));

  return {
    generatedAt: new Date().toISOString(),
    score,
    summary,
    checks,
    sources: sourceHealth,
    lastKnownError: lastKnownError ? {
      title: redactOperationalText(lastKnownError.title || lastKnownError.action || 'Erro operacional', 120),
      description: redactOperationalText(lastKnownError.description || lastKnownError.message || 'Sem descricao'),
      severity: redactOperationalText(lastKnownError.severity || 'error', 40),
      createdAt: lastKnownError.created_at || null,
      source: redactOperationalText(lastKnownError.source || lastKnownError.entity_type || 'logs', 80),
    } : null,
  };
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

function supportCaseKind(row) {
  const metadata = row && typeof row.metadata === 'object' ? row.metadata : {};
  const text = `${metadata.kind || ''} ${metadata.type || ''} ${row?.title || ''} ${row?.description || ''}`.toLowerCase();
  return /implementation|implant/.test(text) ? 'implementation' : 'support';
}

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);

  try {
    requireDev(req);
    const sourceHealth = [];

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
      safe('/rest/v1/agendapro_client_accounts?select=*&order=created_at.desc&limit=100', [], sourceHealth, 'agendapro_client_accounts'),
      safe('/rest/v1/agendapro_companies?select=*&order=created_at.desc&limit=100', [], sourceHealth, 'agendapro_companies'),
      safe('/rest/v1/agendapro_payments?select=*&order=created_at.desc&limit=100', [], sourceHealth, 'agendapro_payments'),
      safe('/rest/v1/agendapro_manual_payment_requests?select=*&order=created_at.desc&limit=100', [], sourceHealth, 'agendapro_manual_payment_requests'),
      safe('/rest/v1/agendapro_quick_briefings?select=*&order=created_at.desc&limit=100', [], sourceHealth, 'agendapro_quick_briefings'),
      safe('/rest/v1/agendapro_payment_webhook_events?select=*&order=created_at.desc&limit=100', [], sourceHealth, 'agendapro_payment_webhook_events'),
      safe('/rest/v1/agendapro_license_keys?select=id,key_prefix,type,plan_id,duration_days,status,max_uses,uses_count,expires_at,activated_at,activated_email,activated_business_name,notes,metadata,created_at,updated_at&order=created_at.desc&limit=150', [], sourceHealth, 'agendapro_license_keys'),
      safe('/rest/v1/agendapro_client_activity_logs?select=*&order=created_at.desc&limit=100', [], sourceHealth, 'agendapro_client_activity_logs'),
      safe('/rest/v1/agendapro_dev_audit_logs?select=*&order=created_at.desc&limit=100', [], sourceHealth, 'agendapro_dev_audit_logs'),
      safe('/rest/v1/agendapro_created_agendas?select=*&order=created_at.desc&limit=100', [], sourceHealth, 'agendapro_created_agendas'),
      safe('/rest/v1/agendapro_public_booking_requests?select=*&order=created_at.desc&limit=100', [], sourceHealth, 'agendapro_public_booking_requests'),
      safe('/rest/v1/agendapro_admin_settings?select=*&order=updated_at.desc&limit=100', [], sourceHealth, 'agendapro_admin_settings'),
      safe('/rest/v1/agendapro_support_cases?select=*&order=updated_at.desc&limit=100', [], sourceHealth, 'agendapro_support_cases'),
      safe('/rest/v1/agendapro_support_notes?select=*&order=created_at.desc&limit=100', [], sourceHealth, 'agendapro_support_notes'),
      safe('/rest/v1/agendapro_system_alerts?select=*&order=created_at.desc&limit=100', [], sourceHealth, 'agendapro_system_alerts'),
    ]);

    const supportCases = implementations;
    const implementationCases = supportCases.filter(row => supportCaseKind(row) === 'implementation');

    const logs = [
      ...auditLogs.map(row => normalizeLog(row, 'auditoria')),
      ...activityLogs.map(row => normalizeLog(row, 'atividade')),
      ...systemAlerts.map(row => normalizeLog(row, 'alerta')),
    ].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 150);
    const operationalHealth = buildOperationalHealth({ sourceHealth, logs });

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
        implementations: implementationCases.length,
        supportCases: supportCases.length,
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
      implementations: implementationCases,
      supportCases,
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
      operationalHealth,
      plans: settings.filter(row => String(row.key || '').startsWith('plan:')),
    });
  } catch (error) {
    return handleError(res, error, 'Erro ao carregar painel dev.');
  }
};
