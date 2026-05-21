export type ErrorAudience = 'public' | 'client' | 'dev';

const technicalPatterns = [
  /supabase/i,
  /service role/i,
  /dev_admin/i,
  /client_session_secret/i,
  /access_token/i,
  /secret/i,
  /fetch failed/i,
  /failed to fetch/i,
  /networkerror/i,
  /unexpected token/i,
  /json/i,
  /stack/i,
  /vercel/i
];

function normalizeMessage(value: unknown) {
  if (!value) return '';
  if (value instanceof Error) return value.message || '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && 'message' in value) return String((value as { message?: unknown }).message || '');
  return String(value);
}

export function friendlyErrorMessage(error: unknown, fallback = 'Nao foi possivel concluir agora. Tente novamente em instantes.', audience: ErrorAudience = 'client') {
  const raw = normalizeMessage(error).trim();
  if (!raw) return fallback;
  if (audience === 'dev') return raw.slice(0, 800);

  const lower = raw.toLowerCase();
  if (lower.includes('sess') || lower.includes('token') || lower.includes('401')) return 'Faca login novamente para continuar.';
  if (lower.includes('acesso') || lower.includes('403')) return 'Seu acesso nao permite executar esta acao agora.';
  if (lower.includes('pagamento') || lower.includes('plano') || lower.includes('assinatura')) return raw.slice(0, 220);
  if (technicalPatterns.some(pattern => pattern.test(raw))) return fallback;

  return raw.slice(0, 220);
}

export function apiFailureMessage(data: any, fallback: string, audience: ErrorAudience = 'client') {
  return friendlyErrorMessage(data?.message || data?.error || data?.detail, fallback, audience);
}
