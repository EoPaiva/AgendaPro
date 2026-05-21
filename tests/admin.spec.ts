import { test, expect } from '@playwright/test';
import { env } from './helpers/env';
import { loginDev } from './helpers/auth';
import { expectAccessDenied } from './helpers/assertions';
import { logStep } from './helpers/logger';

test('visitante não acessa painel dev sem autenticação', async ({ page }) => {
  logStep('START', 'dev sem login');
  await page.goto('/#/dev');
  await expect(page.locator('body')).toContainText(/Acesso interno|Developer|desenvolvedor/i);
  await expect(page.locator('body')).not.toContainText(/Clientes cadastrados|Webhooks/i);
});

test('dev acessa console quando credenciais estão configuradas', async ({ page }) => {
  test.skip(!env.adminEmail || !env.adminPassword, 'Configure TEST_ADMIN_EMAIL e TEST_ADMIN_PASSWORD');
  logStep('START', 'login dev válido');
  await loginDev(page, env.adminEmail, env.adminPassword);
  await expect(page.locator('body')).toContainText(/Developer Console|Visão geral|Console/i);
  logStep('PASS', 'dev console acessado');
});
