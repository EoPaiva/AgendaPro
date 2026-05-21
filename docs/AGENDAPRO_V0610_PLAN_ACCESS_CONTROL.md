# AgendaPro v0.6.1.0 — Plan Access Control

## Objetivo

Adicionar bloqueio e liberação clara por status de plano, pagamento e validade da licença.

## Implementado

- Banner de acesso no painel do cliente.
- Estados claros: ativo, trial, pendente, pagamento manual em análise, reprovado, vencido, suspenso e cancelado.
- Criador de agenda bloqueado quando o plano não está liberado.
- Dashboard privado bloqueado quando o plano não está liberado.
- Edição de disponibilidade, gestão de agendamentos e comunicação protegidas no backend.
- Página pública pode informar agenda indisponível quando a empresa está sem acesso ativo.
- Solicitação pública bloqueada se a empresa estiver vencida, suspensa, cancelada ou pendente.
- SQL incremental com campos de acesso e tabela de eventos.

## Arquivos principais

- `src/pages/Home.tsx`
- `src/pages/Booking.tsx`
- `src/styles.css`
- `server/_security.js`
- `server/endpoints/create-agenda.js`
- `server/endpoints/client-agenda-dashboard.js`
- `server/endpoints/update-schedule-config.js`
- `server/endpoints/update-public-booking-status.js`
- `server/endpoints/send-booking-message.js`
- `server/endpoints/get-public-agenda.js`
- `server/endpoints/create-public-booking.js`
- `docs/AGENDAPRO_V0610_PLAN_ACCESS_CONTROL.sql`

## Observação

Esta sprint não implementa cobrança recorrente automática completa nem cancelamento automático por data em job agendado. Ela prepara e aplica a lógica operacional de bloqueio/liberação nas APIs e na interface.
