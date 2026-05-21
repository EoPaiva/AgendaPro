# AgendaPro v0.5.8 — Availability Engine

Implementação incremental do motor profissional de disponibilidade.

## Adicionado

- Utilitário central `src/lib/availability.ts`.
- Validação backend em `server/availability.js`.
- Horários dinâmicos na página pública `/agendar/:slug`.
- Seleção de data na página pública.
- Bloqueio de horários ocupados por status confirmado, concluído, ausente e pendente quando configurado.
- Validação novamente no backend antes de salvar solicitação pública.
- Configuração de disponibilidade no criador de agenda.
- Configuração de disponibilidade no dashboard privado.
- Bloqueio de dias inteiros e horários específicos.
- Buffer antes/depois, antecedência mínima, janela futura, intervalo de slots e reserva de pendentes.
- Ações administrativas adicionais: confirmar, cancelar, recusar, concluir, faltou, reagendar e WhatsApp.
- Endpoint consolidado: `POST /api/client?action=update-schedule-config`.

## Segurança

A página pública nunca confia apenas no frontend. O endpoint de criação de agendamento valida conflito novamente antes de salvar.
