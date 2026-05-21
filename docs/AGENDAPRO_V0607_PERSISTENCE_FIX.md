# AgendaPro v0.6.0.7 — Persistence Fix

Correção focada no site principal.

## Problema corrigido

Ao alterar dados da agenda, principalmente disponibilidade/horários, a interface salvava visualmente, mas após atualizar a página alguns campos voltavam ao estado anterior.

## Causa

As versões anteriores salvavam `scheduleConfig` dentro de `raw_payload`, mas o dashboard privado priorizava a coluna `schedule_config`. Quando essa coluna estava vazia (`{}`), o painel carregava o padrão antigo e ignorava o que tinha sido salvo no `raw_payload`.

## Correções

- `create-agenda` agora salva `schedule_config` na coluna própria e também no payload completo.
- `update-schedule-config` agora atualiza a coluna `schedule_config`, `raw_payload`, `hours`, `rules` e `updated_at`.
- Dashboard privado não prioriza mais `{}` vazio quando existe uma configuração real no payload.
- Dashboard atualiza estado remoto e localStorage após salvar disponibilidade.
- Login passa a respeitar `public_slug` da empresa quando existir.
- Cadastro/publicação de agenda atualiza a empresa com `public_slug` e `onboarding_status`.
- Configurações da conta agora salvam no Supabase via `/api/client?action=update-client-profile`.
- E-mail de login ficou somente leitura na tela de configurações para evitar quebrar sessão.

## SQL

Rode no Supabase:

```sql
-- docs/AGENDAPRO_V0607_PERSISTENCE_FIX.sql
```
