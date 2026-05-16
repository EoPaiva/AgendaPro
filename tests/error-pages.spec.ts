import { test } from '@playwright/test';
import { expectNotFound, expectAccessDenied } from './helpers/assertions';
import { logStep } from './helpers/logger';

test('rota inexistente mostra 404', async ({ page }) => {
  logStep('START', '404');
  await page.goto('/#/rota-inexistente-e2e');
  await expectNotFound(page);
});

test('403 visual funciona', async ({ page }) => {
  logStep('START', '403');
  await page.goto('/#/403');
  await expectAccessDenied(page);
});
