const { applySecurityHeaders, readJsonBody, cleanEmail, issueSignedToken, safeEqual, handleError } = require('../_security');

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok:false, message:'Método não permitido.' }); }
  try {
    const body = readJsonBody(req);
    const email = cleanEmail(body.email);
    const password = String(body.password || '');
    const allowedEmail = cleanEmail(process.env.DEV_ADMIN_EMAIL || '');
    const allowedPassword = String(process.env.DEV_ADMIN_PASSWORD || '');
    if (!allowedEmail || !allowedPassword) return res.status(500).json({ ok:false, message:'DEV_ADMIN_EMAIL e DEV_ADMIN_PASSWORD não configurados na Vercel.' });
    if (!safeEqual(email, allowedEmail) || !safeEqual(password, allowedPassword)) return res.status(401).json({ ok:false, message:'Credenciais inválidas.' });
    const token = issueSignedToken('dev', { email: allowedEmail, role: 'developer' }, 1000 * 60 * 60 * 8);
    return res.status(200).json({ ok:true, token, expiresInSeconds: 60 * 60 * 8 });
  } catch (error) { return handleError(res, error, 'Erro ao entrar no painel dev.'); }
};
