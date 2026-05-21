# AgendaPro v0.6.0.8 — Booking Management

Sprint focada em transformar os agendamentos recebidos pela página pública em uma área operacional no painel privado da empresa.

## Adicionado

- Área **Agendamentos** no dashboard privado da agenda.
- KPIs de hoje, pendentes, confirmados, concluídos e cancelados.
- Filtros por status e busca por nome, WhatsApp, serviço, profissional e horário.
- Ações reais: confirmar, cancelar, remarcar, concluir, copiar resumo e abrir WhatsApp.
- Drawer de detalhes do agendamento com cliente, contato, serviço, data, horário, status, observações e histórico.
- Observação interna salva no Supabase.
- Motivo de cancelamento e motivo de remarcação.
- Timestamps de confirmação, cancelamento, conclusão e remarcação.
- Logs/auditoria via `agendapro_client_activity_logs`.

## SQL obrigatório

Execute no Supabase:

```sql
-- docs/AGENDAPRO_V0608_BOOKING_MANAGEMENT.sql
```

## Observações

- Esta sprint não implementa WhatsApp automático via API oficial.
- O botão WhatsApp abre conversa com mensagem pronta.
- A remarcação reaproveita o motor de disponibilidade quando possível.
- A empresa só consegue alterar agendamentos da agenda vinculada à própria conta.
