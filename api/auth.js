
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

const registerAccount = require('../server/endpoints/register-account');
const clientLogin = require('../server/endpoints/client-login');

module.exports = async function handler(req, res) {
  const action = getAction(req);

  if (action === 'register-account') return registerAccount(req, res);
  if (action === 'client-login') return clientLogin(req, res);

  return notFound(res, action);
};
