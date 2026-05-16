import { test } from '@playwright/test';
import { expectAccessDenied } from './helpers/assertions';
import { logStep } from './helpers/logger';

const privateRoutes = [
  '/#/conta/painel',
  '/#/conta/criar-agenda',
  '/#/conta/agenda/arena/dashboard',
  '/#/conta/dashboard',
  '/#/dev'
];

test.describe('rotas privadas sem login', () => {
  for (const route of privateRoutes) {
    test(`bloqueia acesso direto em ${route}`, async ({ page }) => {
      logStep('START', 'rota protegida sem login', { route });
      await page.goto(route);
      await expectAccessDenied(page);
      logStep('END', 'rota protegida validada', { route });
    });
  }
});
