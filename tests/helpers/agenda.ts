import { Page, expect } from '@playwright/test';
import { logStep } from './logger';

export async function goToAgendaDashboard(page: Page, slug: string) {
  logStep('STEP', 'Acessando dashboard privado da agenda', { slug });
  await page.goto(`/#/conta/agenda/${slug}/dashboard`);
}

export async function createTestAgenda(page: Page, name: string) {
  logStep('STEP', 'Criando agenda de teste', { name });
  await page.goto('/#/conta/criar-agenda');
  await expect(page.locator('body')).toContainText(/Criar|editar minha agenda|Criador/i);
}
