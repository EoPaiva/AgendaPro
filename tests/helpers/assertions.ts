import { expect, Page } from '@playwright/test';
import { logStep } from './logger';

export async function expectAccessDenied(page: Page) {
  logStep('STEP', 'Validando bloqueio de acesso');
  await expect(page.locator('body')).toContainText(/Acesso negado|Sessão necessária|Faça login|Área protegida|Conta necessária/i);
  logStep('PASS', 'Acesso bloqueado corretamente');
}

export async function expectNotFound(page: Page) {
  logStep('STEP', 'Validando página 404');
  await expect(page.locator('body')).toContainText(/Página não encontrada|404/i);
  logStep('PASS', '404 exibido corretamente');
}

export async function expectNoPrivateLeak(page: Page, forbiddenText: string) {
  await expect(page.locator('body')).not.toContainText(forbiddenText);
}
