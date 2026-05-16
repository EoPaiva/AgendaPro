import { test, expect } from '@playwright/test';
import { env } from './helpers/env';
import { logStep } from './helpers/logger';

const plans = [
  ['essential', env.mpEssential],
  ['professional', env.mpProfessional],
  ['business', env.mpBusiness]
] as const;

test.describe('links manuais Mercado Pago', () => {
  for (const [plan, expected] of plans) {
    test(`plano ${plan} usa link manual sem liberar automaticamente`, async ({ page }) => {
      logStep('START', 'pagamento manual', { plan, expected });
      await page.goto(`/#/checkout/${plan}`);
      await expect(page.locator('body')).toContainText(/link manual|não libera acesso automaticamente/i);
      await expect(page.locator('body')).not.toContainText(/Acesso liberado/i);
      logStep('PASS', 'checkout manual deixa claro que exige confirmação dev', { plan });
    });
  }
});
