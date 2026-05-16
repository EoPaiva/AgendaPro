# AgendaPro v0.6.2.0 — Real Supabase Schema Alignment

## Objetivo

Corrigir de forma estrutural os erros em ações ligadas ao Supabase sem alterar a database compartilhada.

## Correções

- Adicionada camada de compatibilidade no backend para filtrar payloads enviados ao Supabase conforme o schema real do AgendaPro.
- Proteção contra colunas antigas/legadas em inserts e updates via PostgREST.
- Reparo automático de conta/empresa quando o usuário existe no Auth, mas falta na tabela operacional `agendapro_client_accounts`.
- Reparo de sessão quando token válido encontra conta desalinhada.
- Compatibilidade reforçada para salvar perfil, publicar agenda, criar agendamento, atualizar status, logs e mensagens.
- Mantido `SUPABASE_SERVICE_ROLE_KEY` somente no backend.
- Não exige SQL novo.

## Observação

Esta sprint não cria, altera ou apaga tabelas. A auditoria read-only indicou 0 tabelas/colunas faltando, então a correção foi feita no código.

## Commit sugerido

```bash
git commit -m "fix: align backend with real Supabase schema"
```
