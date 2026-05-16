import { test, expect } from '@playwright/test';
import { loginUser, logoutIfPossible } from './helpers/auth';
import { env } from './helpers/env';
import { logStep } from './helpers/logger';

test('login inválido mostra mensagem amigável', async ({ page }) => {
  logStep('START', 'login inválido');
  await loginUser(page, 'inexistente@emaildeteste.com', 'senha-invalida');
  await expect(page.locator('body')).toContainText(/Não foi possível entrar|Conta não encontrada|inválidos/i);
  logStep('PASS', 'login inválido bloqueado');
});

test('login válido quando credenciais de teste existem', async ({ page }) => {
  test.skip(!env.activeEmail || !env.activePassword, 'Configure TEST_CLIENT_ACTIVE_EMAIL e TEST_CLIENT_ACTIVE_PASSWORD');
  logStep('START', 'login válido');
  await loginUser(page, env.activeEmail, env.activePassword);
  await expect(page.locator('body')).toContainText(/central|painel|Logado/i);
  await logoutIfPossible(page);
  logStep('END', 'login válido finalizado');
});
