export const env = {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:5173',
  adminEmail: process.env.TEST_ADMIN_EMAIL || '',
  adminPassword: process.env.TEST_ADMIN_PASSWORD || '',
  activeEmail: process.env.TEST_CLIENT_ACTIVE_EMAIL || '',
  activePassword: process.env.TEST_CLIENT_ACTIVE_PASSWORD || '',
  pendingEmail: process.env.TEST_CLIENT_PENDING_EMAIL || '',
  pendingPassword: process.env.TEST_CLIENT_PENDING_PASSWORD || '',
  clientAEmail: process.env.TEST_CLIENT_A_EMAIL || '',
  clientAPassword: process.env.TEST_CLIENT_A_PASSWORD || '',
  clientASlug: process.env.TEST_CLIENT_A_AGENDA_SLUG || '',
  clientBEmail: process.env.TEST_CLIENT_B_EMAIL || '',
  clientBPassword: process.env.TEST_CLIENT_B_PASSWORD || '',
  clientBSlug: process.env.TEST_CLIENT_B_AGENDA_SLUG || '',
  mpEssential: process.env.TEST_MP_LINK_ESSENCIAL || 'https://mpago.la/2aynw39',
  mpProfessional: process.env.TEST_MP_LINK_PROFISSIONAL || 'https://mpago.la/1D2cMK7',
  mpBusiness: process.env.TEST_MP_LINK_EMPRESA || 'https://mpago.la/1ZJRTao',
  mpImplementation: process.env.TEST_MP_LINK_IMPLANTACAO || 'https://mpago.la/17N4Eme'
};

export function uniqueEmail(prefix = process.env.TEST_NEW_USER_EMAIL_PREFIX || 'agenda.e2e') {
  return `${prefix}+${Date.now()}@emaildeteste.com`;
}
