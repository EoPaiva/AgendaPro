# AgendaPro v0.6.3.0 — Mercado Pago Hardening

Sprint focada em deixar pagamento, fallback manual, webhook e liberação administrativa mais resilientes sem alterar runtime, variáveis de ambiente ou estrutura crítica do Supabase.

## Implementado

- Checkout automático com contingência segura quando o token do Mercado Pago não está disponível ou quando a API externa falha.
- Resposta de fallback manual sem erro 500 para o cliente, com referência externa e links oficiais do Mercado Pago.
- Registro de tentativa de checkout em sessão própria, com metadata `checkout_api_secure_v0630`.
- Solicitação manual de pagamento com plano, valor esperado, links enviados e referência rastreável.
- Webhook do Mercado Pago tolerante a falhas, com validação de assinatura quando o segredo estiver configurado.
- Webhook passa a registrar eventos, estados de processamento e erros sanitizados sem vazar tokens.
- Mapeamento de status do pagamento para liberação, pendência, reprovação ou cancelamento.
- Atualização de contas, empresas e assinaturas quando pagamento aprovado for confirmado.
- Central Dev com ações para aprovar/reprovar pagamentos automáticos.
- Central Dev com liberação temporária de 7 dias para cliente ou empresa, exigindo motivo.
- Checkout público com painel claro de contingência, referência manual e múltiplos links de pagamento.

## Preservado

- CommonJS no backend.
- Node 20.x.
- Fluxo de variáveis pela Vercel.
- Supabase service role apenas no backend.
- Sem SQL novo nesta sprint.
- Sem uso de `.env` local, `_keys_privadas`, `ENV_BACKUP` ou `ENV_DEST`.
- Melhorias da v0.6.2.9 no agendamento público.

## Validação esperada

- `node --check` nos endpoints alterados.
- `npm run build`.
- Conferência de package-lock sem registry interno.
