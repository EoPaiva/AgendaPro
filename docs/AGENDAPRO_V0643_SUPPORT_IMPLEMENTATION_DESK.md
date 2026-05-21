# AgendaPro v0.6.4.3 - Support & Implementation Desk

Sprint focada em melhorar o fluxo de suporte e implantacao assistida sem criar SQL novo e sem alterar a fundacao de env/runtime.

## Implementado

- Nova aba `Suporte` na Central do Cliente.
- Rota `#/conta/suporte` e `#/conta/implantacao` apontando para o painel de suporte.
- Cliente pode abrir chamado de suporte ou solicitar implantacao assistida.
- Chamados sao criados pela API `api/client?action=support` usando a tabela existente `agendapro_support_cases`.
- Cliente ve somente status basico, prioridade, datas, historico publico e retorno publico.
- Notas internas continuam restritas a Central Dev.
- WhatsApp de suporte adicionado como CTA contextual.
- Central Dev separa chamados de suporte das implantacoes pela metadata/titulo.
- Central Dev ganhou painel de chamados com KPIs, status rapido, nota interna, responsavel e busca 360.
- `dev-action` agora atualiza `support_case` e registra notas internas em `agendapro_support_notes`.

## Preservado

- Sem SQL novo.
- Sem alteracao em Supabase URL, service role, Vercel env flow ou secrets.
- Backend continua CommonJS.
- Node 20.x preservado.
- Estrutura critica existente de suporte/implantacao reaproveitada.

## Validacao esperada

- `npm install --registry https://registry.npmjs.org/ --no-audit --no-fund`
- `npm run build`
- `node --check` nos endpoints alterados.
- E2E publico quando o Chromium do Playwright estiver instalado localmente.
