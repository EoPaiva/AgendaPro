# AgendaPro v0.6.1.7 — Account Settings Fix

Correção focada no botão **Salvar alterações** da tela **Configurações → Dados da conta e do negócio**.

## Correções

- Corrige erro ao salvar nome, WhatsApp e negócio no painel do cliente.
- Endpoint `update-client-profile` agora tolera bancos com schema incremental antigo.
- Salva em `agendapro_client_accounts` com fallbacks seguros de colunas.
- Salva em `agendapro_companies` com fallbacks seguros de colunas.
- Mensagem de erro agora orienta rodar o SQL correto quando faltar coluna.
- Inclui SQL incremental `AGENDAPRO_V0617_ACCOUNT_SETTINGS_FIX.sql`.

## SQL

Rode no Supabase:

```sql
-- docs/AGENDAPRO_V0617_ACCOUNT_SETTINGS_FIX.sql
```

## Commit sugerido

```bash
git commit -m "fix: persist account and business settings"
```
