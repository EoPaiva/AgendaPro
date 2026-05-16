import { test, expect } from '@playwright/test';
import { logStep } from './helpers/logger';

test('visitante acessa landing e páginas públicas básicas', async ({ page }) => {
  logStep('START', 'publico.spec.ts - landing pública');
  await page.goto('/');
  await expect(page).toHaveTitle(/AgendaPro/i);
  await expect(page.locator('body')).toContainText(/Agenda online profissional/i);

  await page.goto('/#/planos');
  await expect(page.locator('body')).toContainText(/Planos/i);

  await page.goto('/#/privacidade');
  await expect(page.locator('body')).toContainText(/Política de Privacidade/i);

  await page.goto('/#/termos');
  await expect(page.locator('body')).toContainText(/Termos de Uso/i);
  logStep('END', 'publico.spec.ts finalizado');
});
