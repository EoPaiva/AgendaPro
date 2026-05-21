# AgendaPro v0.6.0.2 — Dev Login Session Fix

Correção do login da Central Dev.

## Problema

O backend `/api/dev?action=login` retorna `token` e `expiresInSeconds`, mas o frontend da Central Dev esperava `data.session`.

Resultado: o toast mostrava acesso autorizado, mas a tela continuava no login porque a sessão local não era criada.

## Correção

O frontend agora aceita os dois formatos:

```txt
{ ok: true, session: { token } }
{ ok: true, token, expiresInSeconds }
```

E cria uma `DevSession` local segura com `token`, `email`, `role` e `expiresAt`.
