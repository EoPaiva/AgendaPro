import { Page, expect } from '@playwright/test';
import { logStep } from './logger';

export async function expectMercadoPagoPopup(page: Page, expectedUrl: string, trigger: () => Promise<void>) {
  logStep('STEP', 'Validando abertura de link Mercado Pago', { expectedUrl });
  const popupPromise = page.waitForEvent('popup').catch(() => null);
  await trigger();
  const popup = await popupPromise;

  if (popup) {
    await popup.waitForLoadState('domcontentloaded').catch(() => null);
    expect(popup.url()).toContain(expectedUrl.replace('https://', '').replace('http://', '').split('/')[0]);
    await popup.close();
    logStep('PASS', 'Mercado Pago abriu em nova aba');
    return;
  }

  await page.waitForTimeout(800);
  expect(page.url()).toContain('mpago');
  await page.goBack().catch(() => null);
  logStep('PASS', 'Mercado Pago abriu na mesma aba');
}
