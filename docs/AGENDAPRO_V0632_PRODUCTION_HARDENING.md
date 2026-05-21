# AgendaPro v0.6.3.2 - Production Hardening

## Objetivo

Endurecer a experiencia de producao sem mexer em env, runtime, banco ou fluxo critico da base estabilizada.

## Implementado

- Backend agora classifica erros por codigo (`SESSION_EXPIRED`, `ACCESS_DENIED`, `PLAN_OR_PAYMENT_REQUIRED`, `VALIDATION_ERROR`, `ACTION_NOT_FOUND`, `INTERNAL_ERROR`).
- Erros tecnicos como Supabase, secrets, service role, token e JSON interno deixam de aparecer para usuario comum.
- Central Dev continua podendo ver detalhes tecnicos nos endpoints administrativos.
- Actions inexistentes em `/api/*` retornam codigo claro e mensagem amigavel.
- `dev-action` registra tentativa de entidade/action nao suportada no audit trail antes de responder.
- Frontend usa helper unico para mensagens de erro em publico, cliente e Central Dev.
- Empty state reutilizavel ficou mais acessivel (`role=status`, `aria-live`) e ganhou area propria para CTA/hint.

## Preservado

- CommonJS no backend.
- Node 20.x no `package.json`.
- Nenhuma env alterada.
- Nenhuma SQL nova.
- Nenhum fluxo Vercel/Supabase core alterado.
- Sprint v0.6.2.9 e melhorias v0.6.3.0/v0.6.3.1 preservadas.

## Validacao esperada

```bash
npm install --registry https://registry.npmjs.org/ --no-audit --no-fund
npm run build
node --check server/_security.js
node --check api/client.js
node --check api/public.js
node --check api/dev.js
node --check api/payments.js
node --check server/endpoints/dev-action.js
```

## Resultado local

- `npm install --registry https://registry.npmjs.org/ --no-audit --no-fund`: passou com aviso esperado de engine local Node 26 vs projeto Node 20.x.
- `npm run build`: passou.
- `node --check` nos endpoints alterados: passou.
- Smoke HTTP local em `http://127.0.0.1:5173/`: retornou 200.
- `npm run test:e2e -- --reporter=line`: bloqueado pelo ambiente local porque o Chromium do Playwright nao esta instalado em `C:\Users\mpaii\AppData\Local\ms-playwright\chromium_headless_shell-1217\chrome-headless-shell-win64\chrome-headless-shell.exe`.
