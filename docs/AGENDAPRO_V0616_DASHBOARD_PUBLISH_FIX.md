# AgendaPro v0.6.1.6 — Dashboard + Publish Fix

Correções aplicadas:

- Remove toast indevido de "Não foi possível carregar / Acesso negado" ao abrir o dashboard privado quando existe fallback local da agenda.
- Mantém toast de erro ao clicar manualmente em "Sincronizar" se a API realmente falhar.
- Melhora leitura de resposta da API ao publicar agenda para exibir erro real quando houver JSON/texto.
- Backend de publicação passa a tolerar Supabase sem colunas novas de readiness/publication, usando fallback legado seguro.
- Backend tenta reparar vínculo antigo de agenda com account_id/company_id quando a agenda pertence ao usuário por e-mail/slug.
- SQL incremental adiciona colunas de readiness/publication quando estiverem ausentes.

Arquivo SQL:

`docs/AGENDAPRO_V0616_DASHBOARD_PUBLISH_FIX.sql`
