# AgendaPro v0.6.3.3 - Client CRM Pro

## Objetivo

Evoluir a area de Clientes para um CRM simples, util e persistente, focado em retorno, recorrencia e relacionamento.

## Implementado

- Classificacao automatica: novo, ativo, recorrente, VIP, sem retorno e inativo.
- Tags automaticas por comportamento: VIP, ja atendido, reativacao, proximo horario e muitos cancelamentos.
- Tags manuais com adicionar/remover pela visao 360 do cliente.
- Filtro por status e por tag.
- Rankings: clientes mais frequentes, maior receita estimada, sem retorno e mais cancelamentos.
- Timeline do cliente com agendamentos e eventos CRM.
- Mensagem pronta de reativacao com copiar e WhatsApp.
- Tentativas de reativacao registradas em `metadata.crmHistory`.
- Tags manuais salvas em `metadata.crmTags` do agendamento mais recente do cliente.

## Backend

- `update-public-booking-status` passa a aceitar `clientTags` e `crmEvent`.
- Persistencia via `metadata`, sem SQL novo e sem alterar schema critico.
- Tambem preserva observacao interna, motivo de cancelamento e motivo de remarcacao dentro de `metadata`.

## Preservado

- Nenhuma env alterada.
- Nenhuma SQL nova.
- CommonJS mantido.
- Node 20.x mantido.
- Fluxos anteriores de agenda publica, Central Dev, pagamentos e dashboard preservados.

## Validacao

```bash
npm install --registry https://registry.npmjs.org/ --no-audit --no-fund
npm run build
node --check server/endpoints/update-public-booking-status.js
```

## Resultado local

- `npm install --registry https://registry.npmjs.org/ --no-audit --no-fund`: passou com aviso esperado de engine local Node 26 vs projeto Node 20.x.
- `npm run build`: passou.
- `node --check server/endpoints/update-public-booking-status.js`: passou.
- Smoke HTTP local em `http://127.0.0.1:5173/`: retornou 200.
- Playwright curto (`tests/publico.spec.ts`): bloqueado pelo Chromium local ausente em `C:\Users\mpaii\AppData\Local\ms-playwright\chromium_headless_shell-1217\chrome-headless-shell-win64\chrome-headless-shell.exe`.
