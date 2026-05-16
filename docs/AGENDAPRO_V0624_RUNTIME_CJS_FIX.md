# AgendaPro v0.6.2.4 — Stable Core Runtime Fix

Correção principal: remoção de `"type": "module"` do `package.json` para restaurar a execução CommonJS das APIs/serverless na Vercel.

## Por que isso importa

Os arquivos em `api/` e `server/` usam `require()` e `module.exports`. Com `"type": "module"`, o Node/Vercel pode tratar `.js` como ESM e gerar `FUNCTION_INVOCATION_FAILED` antes mesmo de conectar corretamente no Supabase.

## Mantido

- Backend estável herdado da base funcional.
- Frontend/visual das sprints recentes.
- BAT limpo do AgendaPro, sem FitPro e sem `_keys_privadas`.
- `README.md` e `TESTES_E2E.md` fora do ZIP.

## Se persistir erro

1. Confirmar Vercel Environment Variables.
2. Confirmar Node.js 20.x no projeto Vercel.
3. Rodar auditoria SQL somente leitura V3 para checar campos legados.
