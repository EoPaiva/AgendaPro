# AgendaPro v0.6.1.8 — Publish Schema Compatibility Fix

## Objetivo

Corrigir a publicação da agenda quando o Supabase já possui as tabelas e colunas principais, mas o endpoint de publicação ainda tentava usar nomes legados/incompatíveis.

## Corrigido

- `account_id` trocado para `client_account_id` em `agendapro_created_agendas`.
- `published` trocado para `is_published`.
- `team` trocado para `professionals`.
- `theme` trocado para `theme_config`.
- `description` trocado para `public_description`.
- Dados extras como `public_link`, `segment`, `address`, `hours` e `rules` ficam em `raw_payload`.
- Verificação de slug agora usa `client_account_id`.
- Busca da empresa principal agora considera `company_id`, `client_account_id`, `owner_email` e `email`.
- Log de atividade usa colunas compatíveis com `agendapro_client_activity_logs`.

## SQL

Não precisa rodar SQL nesta sprint, desde que a auditoria tenha mostrado 0 tabelas/colunas faltando.

## Commit sugerido

```bash
git commit -m "fix: align agenda publish endpoint with Supabase schema"
```
