import { logStep } from './logger';

export async function cleanupTestData() {
  // Limpeza destrutiva deve ser feita apenas em staging com credenciais próprias.
  logStep('WARN', 'Cleanup automático não executado. Use prefixo TESTE_E2E para limpeza manual segura.');
}
