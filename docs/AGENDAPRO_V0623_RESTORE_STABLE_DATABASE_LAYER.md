# AgendaPro v0.6.2.3 — Restore Stable Database Layer

Correção emergencial gerada a partir da base antiga funcional enviada pelo usuário.

## Objetivo

Restaurar a camada estável de API/Supabase da versão funcional, mantendo as atualizações recentes de frontend, visual, páginas legais, dashboard premium e documentação das sprints.

## Alterações

- Backend/API principal restaurado a partir da base funcional `AgendaPro-main.zip`.
- Frontend recente preservado.
- Endpoint `send-booking-message` mantido com compatibilidade para a autenticação estável.
- BAT limpo do AgendaPro incluído, sem FitPro, sem `_keys_privadas`, sem `ENV_BACKUP` e sem `ENV_DEST`.
- `README.md` e `TESTES_E2E.md` não entram no ZIP.
- `.gitignore` reforçado para arquivos locais e scripts.

## SQL

Não há SQL novo nesta versão.

## Validação

- `npm install --no-audit --no-fund --registry https://registry.npmjs.org/`
- `npm run build`
- `node --check` nos arquivos críticos de API/backend
