import { test, expect } from '@playwright/test';
import { logStep } from './helpers/logger';

test('SEO básico da landing', async ({ page }) => {
  logStep('START', 'SEO público');
  await page.goto('/');
  await expect(page).toHaveTitle(/AgendaPro/i);
  const description = await page.locator('meta[name="description"]').getAttribute('content');
  expect(description || '').toContain('Agenda online');
  logStep('PASS', 'SEO básico validado');
});
