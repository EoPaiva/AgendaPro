import { Page, expect } from '@playwright/test';
import { logStep } from './logger';

export async function goToLogin(page: Page) {
  logStep('STEP', 'Acessando login do cliente');
  await page.goto('/#/conta/login');
}

export async function loginUser(page: Page, email: string, password: string) {
  logStep('STEP', 'Tentando login de usuário', { email, password: '********' });
  await goToLogin(page);
  await page.getByPlaceholder(/cliente@email.com|email/i).fill(email);
  await page.getByPlaceholder(/senha/i).fill(password);
  await page.getByRole('button', { name: /Entrar/i }).click();
}

export async function loginDev(page: Page, email: string, password: string) {
  logStep('STEP', 'Tentando login dev', { email, password: '********' });
  await page.goto('/#/dev');
  await page.locator('input').first().fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /Entrar/i }).click();
}

export async function logoutIfPossible(page: Page) {
  logStep('STEP', 'Tentando logout');
  const logout = page.getByRole('button', { name: /Sair/i }).first();
  if (await logout.count()) await logout.click();
  await expect(page.locator('body')).not.toContainText(/Logado como/i);
  logStep('PASS', 'Logout validado quando disponível');
}
