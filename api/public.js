
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

const createPublicBooking = require('../server/endpoints/create-public-booking');
const createBriefing = require('../server/endpoints/create-briefing');
const getPublicAgenda = require('../server/endpoints/get-public-agenda');

module.exports = async function handler(req, res) {
  const action = getAction(req);

  if (action === 'get-public-agenda') return getPublicAgenda(req, res);
  if (action === 'create-public-booking') return createPublicBooking(req, res);
  if (action === 'create-briefing') return createBriefing(req, res);

  return notFound(res, action);
};
