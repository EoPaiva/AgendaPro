# AgendaPro v0.6.1.9 — Database Compatibility Hotfix

## Objetivo
Corrigir falhas gerais de ações ligadas ao Supabase quando o banco possui as tabelas/colunas principais, mas o backend ainda tentava acessar nomes de colunas antigos ou incompatíveis.

## Corrigido

- Login com reparo automático quando o usuário existe no Supabase Auth, mas falta registro em `agendapro_client_accounts`.
- Publicação e leitura de agenda pública usando `client_account_id`, `is_published`, `professionals`, `theme_config` e `public_description`.
- Dashboard da agenda usando `client_account_id` em vez de `account_id`.
- Disponibilidade salvando somente em `schedule_config`, `availability` e `raw_payload`.
- Agendamentos públicos sem colunas inexistentes como `customer_phone`, `notes` e `account_id`.
- Gestão de agendamentos sem `action_metadata`/`previous_requested_date` quando o schema auditado não exige essas colunas.
- Comunicação do agendamento usando `message_history`, `communication_log` e `metadata`.
- Pagamento manual usando `client_account_id`.
- License keys usando o schema auditado: `key_value`, `key_masked`, `used_count`, `valid_until`, `linked_client_account_id` e `linked_company_id`.
- Central Dev aceita `DEV_ADMIN_TOKEN` além de `DEV_ADMIN_SECRET`.
- Controle de acesso por plano ficou mais tolerante com `plan_status`, `payment_status`, `subscription_status` e `status`.

## SQL
Não exige SQL novo se a auditoria já retornou 0 faltando.

## Validação técnica
- `node --check` executado nos endpoints serverless e APIs alteradas.

## Commit sugerido
`fix: stabilize Supabase schema compatibility across AgendaPro APIs`
