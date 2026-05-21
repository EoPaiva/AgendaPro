const { applySecurityHeaders, readJsonBody, cleanText, requireClient, supabaseRequest, handleError, logActivity } = require('../_security');

const SUPPORT_PRIORITIES = new Set(['low', 'normal', 'high', 'urgent']);
const SUPPORT_TYPES = new Set(['support', 'implementation']);

function normalizePriority(value) {
  const priority = cleanText(value, 30).toLowerCase();
  return SUPPORT_PRIORITIES.has(priority) ? priority : 'normal';
}

function normalizeType(value) {
  const type = cleanText(value, 40).toLowerCase();
  return SUPPORT_TYPES.has(type) ? type : 'support';
}

function caseStatusFor(type) {
  return type === 'implementation' ? 'aguardando briefing' : 'open';
}

function publicCase(row) {
  const metadata = row?.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  return {
    id: row.id,
    title: row.title || 'Chamado AgendaPro',
    description: row.description || '',
    status: row.status || 'open',
    priority: row.priority || 'normal',
    type: metadata.kind || metadata.type || (String(row.title || '').toLowerCase().includes('implant') ? 'implementation' : 'support'),
    resolution: row.resolution || '',
    history: Array.isArray(metadata.public_history) ? metadata.public_history : [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function safeList(path) {
  try {
    const rows = await supabaseRequest(path);
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

async function listCases(session) {
  const paths = [
    `/rest/v1/agendapro_support_cases?client_id=eq.${encodeURIComponent(session.accountId)}&select=*&order=updated_at.desc&limit=50`,
  ];
  if (session.companyId) {
    paths.push(`/rest/v1/agendapro_support_cases?company_id=eq.${encodeURIComponent(session.companyId)}&select=*&order=updated_at.desc&limit=50`);
  }
  const groups = await Promise.all(paths.map(safeList));
  const byId = new Map();
  groups.flat().forEach(row => {
    if (row?.id) byId.set(String(row.id), row);
  });
  return [...byId.values()]
    .sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime())
    .map(publicCase);
}

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);

  try {
    const session = await requireClient(req);

    if (req.method === 'GET') {
      const cases = await listCases(session);
      return res.status(200).json({ ok: true, cases });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ ok: false, message: 'Metodo nao permitido.' });
    }

    const body = readJsonBody(req);
    const type = normalizeType(body.type || body.kind);
    const priority = normalizePriority(body.priority);
    const fallbackTitle = type === 'implementation' ? 'Solicitacao de implantacao assistida' : 'Solicitacao de suporte';
    const title = cleanText(body.title || fallbackTitle, 180);
    const description = cleanText(body.description || body.message, 1800);

    if (!description) {
      return res.status(400).json({ ok: false, message: 'Descreva o que voce precisa.' });
    }

    const now = new Date().toISOString();
    const metadata = {
      source: 'client_portal',
      kind: type,
      requester_email: session.email,
      requester_name: session.account?.full_name || '',
      business_name: session.company?.business_name || session.company?.name || '',
      public_history: [
        { at: now, label: type === 'implementation' ? 'Implantacao solicitada' : 'Chamado aberto', status: caseStatusFor(type) }
      ]
    };

    const inserted = await supabaseRequest('/rest/v1/agendapro_support_cases', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        client_id: session.accountId,
        company_id: session.companyId || null,
        title,
        description,
        status: caseStatusFor(type),
        priority,
        metadata,
        created_at: now,
        updated_at: now,
      })
    });
    const supportCase = Array.isArray(inserted) ? inserted[0] : inserted;

    await logActivity({
      accountId: session.accountId,
      companyId: session.companyId,
      action: type === 'implementation' ? 'implementation_support_requested' : 'support_case_created',
      title: type === 'implementation' ? 'Implantacao assistida solicitada' : 'Chamado de suporte criado',
      description: `${session.email} abriu um chamado pelo painel do cliente.`,
      severity: priority === 'urgent' ? 'warning' : 'info',
      metadata: { support_case_id: supportCase?.id || null, type, priority }
    });

    return res.status(200).json({ ok: true, case: publicCase(supportCase), cases: await listCases(session) });
  } catch (error) {
    return handleError(res, error, 'Erro ao processar suporte da conta.');
  }
};
