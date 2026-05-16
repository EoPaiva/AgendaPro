# AgendaPro v0.6.0.4 — Principal operacional + Central Dev real

## Objetivo

Transformar o site principal do AgendaPro em uma base limpa de produção, sem dependência da demo interna antiga, e tornar a Central Dev um painel administrativo operacional.

## Correções

- Demo antiga removida do fluxo principal.
- `#/demo` agora é somente uma página de redirecionamento para `VITE_AGENDAPRO_DEMO_URL`.
- `#/agendar/:slug` não usa mais fallback fictício específico.
- `Booking.tsx` não trata mais agenda fictícia como agenda oficial.
- `Login.tsx` não aponta mais para demo interna.
- `Dashboard.tsx` legado foi neutralizado.
- README e `.env.example` atualizados.

## Central Dev

A Central Dev recebeu:

- modais de edição;
- modais de confirmação;
- toasts de sucesso/erro;
- ações reais em empresas, agendas, clientes, pagamentos, keys, webhooks, logs, briefings e implantações;
- auditoria em ações críticas;
- criação real de keys com hash e prefixo seguro;
- aprovação/reprovação funcional de pagamento manual;
- suporte 360º com busca global e ações rápidas.

## Migração obrigatória

Executar no Supabase:

```txt
docs/AGENDAPRO_V0604_MAIN_DEV_OPERATIONS.sql
```

Depois fazer redeploy na Vercel.

## Validação local

Executado:

```bash
npm run build
node --check server/endpoints/dev-action.js
node --check server/endpoints/dev-dashboard.js
node --check server/endpoints/create-license-key.js
```

Resultado: build concluído com sucesso. O Vite apenas avisou que o bundle principal passou de 500 kB, sem quebrar a compilação.
