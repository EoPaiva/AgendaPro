import { test, expect } from '@playwright/test';
import { env } from './helpers/env';
import { loginUser } from './helpers/auth';
import { goToAgendaDashboard } from './helpers/agenda';
import { expectAccessDenied, expectNoPrivateLeak } from './helpers/assertions';
import { logStep } from './helpers/logger';

test('cliente A não acessa dashboard do cliente B', async ({ page }) => {
  test.skip(!env.clientAEmail || !env.clientAPassword || !env.clientBSlug, 'Configure Cliente A e slug do Cliente B');
  logStep('START', 'isolamento Cliente A x Cliente B');
  await loginUser(page, env.clientAEmail, env.clientAPassword);
  await goToAgendaDashboard(page, env.clientBSlug);
  await expectAccessDenied(page);
  await expectNoPrivateLeak(page, env.clientBSlug);
  logStep('PASS', 'Cliente A bloqueado na agenda do Cliente B');
});

test('cliente B não acessa dashboard do cliente A', async ({ page }) => {
  test.skip(!env.clientBEmail || !env.clientBPassword || !env.clientASlug, 'Configure Cliente B e slug do Cliente A');
  logStep('START', 'isolamento Cliente B x Cliente A');
  await loginUser(page, env.clientBEmail, env.clientBPassword);
  await goToAgendaDashboard(page, env.clientASlug);
  await expectAccessDenied(page);
  logStep('PASS', 'Cliente B bloqueado na agenda do Cliente A');
});

test('cliente dono acessa dashboard próprio', async ({ page }) => {
  test.skip(!env.clientAEmail || !env.clientAPassword || !env.clientASlug, 'Configure Cliente A completo');
  logStep('START', 'dashboard próprio');
  await loginUser(page, env.clientAEmail, env.clientAPassword);
  await goToAgendaDashboard(page, env.clientASlug);
  await expect(page.locator('body')).toContainText(/Dashboard privado|Solicitações|Serviços/i);
  logStep('PASS', 'dashboard próprio carregou');
});
