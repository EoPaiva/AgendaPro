import { test, expect } from '@playwright/test';
import { logStep } from './helpers/logger';

test('landing funciona no projeto mobile', async ({ page, isMobile }) => {
  logStep('START', 'mobile landing');
  await page.goto('/');
  await expect(page.locator('body')).toContainText(/Agenda online profissional/i);
  if (isMobile) {
    const menu = page.getByRole('button', { name: /menu/i }).first();
    if (await menu.count()) await menu.click();
  }
  logStep('PASS', 'mobile básico validado');
});
