
function getAction(req) {
  if (req.query && req.query.action) return String(req.query.action);
  try {
    const url = new URL(req.url || '', 'http://localhost');
    return String(url.searchParams.get('action') || '');
  } catch {
    return '';
  }
}

function notFound(res, action) {
  return res.status(404).json({
    ok: false,
    message: `Ação de API não encontrada: ${action || 'sem action'}.`
  });
}

const devLogin = require('../server/endpoints/dev-login');
const devDashboard = require('../server/endpoints/dev-dashboard');
const createLicenseKey = require('../server/endpoints/create-license-key');
const resolveManualPayment = require('../server/endpoints/resolve-manual-payment');
const createBriefing = require('../server/endpoints/create-briefing');
const devAction = require('../server/endpoints/dev-action');
const devExport = require('../server/endpoints/dev-export');

module.exports = async function handler(req, res) {
  const action = getAction(req);

  if (action === 'login' || action === 'dev-login') return devLogin(req, res);
  if (action === 'dashboard' || action === 'dev-dashboard') return devDashboard(req, res);
  if (action === 'create-license-key') return createLicenseKey(req, res);
  if (action === 'resolve-manual-payment') return resolveManualPayment(req, res);
  if (action === 'create-briefing') return createBriefing(req, res);
  if (action === 'execute' || action === 'dev-action') return devAction(req, res);
  if (action === 'export' || action === 'dev-export') return devExport(req, res);

  return notFound(res, action);
};
