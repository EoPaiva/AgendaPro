const { applySecurityHeaders, readJsonBody, cleanEmail, authWithPassword, buildClientSession, handleError } = require('../_security');

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok:false, message:'Método não permitido.' }); }
  try {
    const body = readJsonBody(req);
    const email = cleanEmail(body.email);
    const password = String(body.password || '');
    if (!email || !password) return res.status(400).json({ ok:false, message:'Informe e-mail e senha.' });
    await authWithPassword(email, password);
    const session = await buildClientSession(email);
    return res.status(200).json({ ok:true, token: session.token, account: session.account, company: session.company });
  } catch (error) { return handleError(res, error, 'Erro ao entrar na conta.'); }
};
