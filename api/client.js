
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
    code: 'ACTION_NOT_FOUND',
    message: 'Nao encontramos essa acao da conta. Atualize a pagina e tente novamente.',
    action: action || null
  });
}

const activateLicenseKey = require('../server/endpoints/activate-license-key');
const createAgenda = require('../server/endpoints/create-agenda');
const clientAgendaDashboard = require('../server/endpoints/client-agenda-dashboard');
const createManualPaymentRequest = require('../server/endpoints/create-manual-payment-request');
const updatePublicBookingStatus = require('../server/endpoints/update-public-booking-status');
const updateScheduleConfig = require('../server/endpoints/update-schedule-config');
const updateClientProfile = require('../server/endpoints/update-client-profile');
const sendBookingMessage = require('../server/endpoints/send-booking-message');
const clientSupport = require('../server/endpoints/client-support');

module.exports = async function handler(req, res) {
  const action = getAction(req);

  if (action === 'activate-license-key') return activateLicenseKey(req, res);
  if (action === 'create-agenda') return createAgenda(req, res);
  if (action === 'agenda-dashboard' || action === 'client-agenda-dashboard' || action === 'list-bookings') return clientAgendaDashboard(req, res);
  if (action === 'create-manual-payment-request') return createManualPaymentRequest(req, res);
  if (action === 'update-public-booking-status') return updatePublicBookingStatus(req, res);
  if (action === 'update-schedule-config') return updateScheduleConfig(req, res);
  if (action === 'update-client-profile') return updateClientProfile(req, res);
  if (action === 'send-booking-message') return sendBookingMessage(req, res);
  if (action === 'support' || action === 'client-support') return clientSupport(req, res);

  return notFound(res, action);
};
