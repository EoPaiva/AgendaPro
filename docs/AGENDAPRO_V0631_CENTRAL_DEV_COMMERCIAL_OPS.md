# AgendaPro v0.6.3.1 — Central Dev Commercial Ops

Sprint focada em transformar a Central Dev em um painel comercial operacional mais rápido para acompanhar clientes, planos, pagamentos, publicação, uso e risco.

## Implementado

- Nova aba `Comercial` na Central Dev.
- Visão consolidada por cliente/empresa com plano, pagamento, agenda, uso, receita validada e pendências.
- Filtros comerciais rápidos: ativos, pendentes, suspensos, pagamento pendente, agenda publicada, sem agenda, implantação, alto uso e sem uso recente.
- Métricas executivas de operação comercial.
- Radar comercial na visão geral com clientes que exigem atenção.
- Alertas comerciais priorizados por risco.
- Atalhos para pagamentos manuais, pagamentos automáticos, agendas e suporte 360.
- Drawer 360 enriquecido com contexto comercial, pendências, link público e WhatsApp.
- Exportação/cópia de resumo comercial sem expor secrets.

## Preservado

- Central Dev protegida por sessão dev.
- Endpoints existentes da Central Dev.
- CommonJS no backend.
- Node 20.x.
- Sem SQL novo.
- Sem alteração em env, Vercel Environment Variables ou secrets.
- Fluxo de Mercado Pago hardening da v0.6.3.0.

## Validação esperada

- `npm run build`.
- `node --check` nos endpoints já alterados.
- Verificação de package-lock sem registry interno.
