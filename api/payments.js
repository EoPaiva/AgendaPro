
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

const createCheckout = require('../server/endpoints/create-checkout');

module.exports = async function handler(req, res) {
  const action = getAction(req);

  if (action === 'create-checkout') return createCheckout(req, res);

  return notFound(res, action);
};
