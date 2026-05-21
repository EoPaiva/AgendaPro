# AgendaPro v0.6.3.5 - Public Booking Conversion Pro

## Objetivo

Melhorar a conversao da pagina publica de agendamento sem alterar env, runtime, schema critico, Supabase core ou fluxo de Vercel.

## Implementado

- Hero publico com copy mais comercial e selo de agenda segura.
- Suporte a campos opcionais em `raw_payload.conversion`.
- Beneficios, diferenciais, selos de confianca, anos de experiencia, atendimentos estimados e depoimentos manuais.
- Blocos de prova de confianca com fallback honesto, sem inventar numeros.
- FAQ publico com confirmacao, remarcacao, cancelamento, pagamento, duracao e local.
- CTA fixo inferior no mobile com acao de agendamento e WhatsApp.
- Campos de conversao no criador de agenda, salvos junto com o payload da agenda.
- Microinteracoes e estados mobile preservando `prefers-reduced-motion`.

## Compatibilidade

- Nenhum SQL novo.
- Nenhuma env alterada.
- Backend continua CommonJS.
- Node permanece `20.x`.
- Agendamento publico continua enviando os mesmos dados essenciais.

## Validacao esperada

```powershell
npm install --registry https://registry.npmjs.org/ --no-audit --no-fund
npm run build
node --check server/endpoints/create-public-booking.js
```
