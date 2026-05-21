# AgendaPro v0.6.0.9 — Notifications & Communication

Sprint focada em tornar a comunicação dos agendamentos mais profissional e operacional, sem implementar disparos automáticos avançados ainda.

## Implementado

- Confirmação pública de agendamento com resumo limpo.
- Botão para copiar resumo após solicitar agendamento.
- Botão para enviar mensagem pelo WhatsApp após solicitar agendamento.
- Central de comunicação no dashboard da empresa.
- Mensagens prontas por status do agendamento.
- Copiar mensagem personalizada para o cliente.
- Abrir WhatsApp com mensagem pronta.
- Enviar/processar e-mail básico quando Resend estiver configurado.
- Fallback elegante quando Resend não estiver configurado.
- Registro de comunicação no metadata do agendamento.
- Log/auditoria via `agendapro_client_activity_logs`.
- Endpoint seguro `send-booking-message` com validação de sessão e propriedade da agenda.

## Variáveis opcionais

```env
RESEND_API_KEY=
RESEND_EMAIL_FROM=AgendaPro <contato@seudominio.com>
```

Se o Resend não estiver configurado, o sistema não quebra. Ele informa que o envio real de e-mail está pendente e mantém os fluxos de copiar/WhatsApp funcionando.

## SQL

Execute no Supabase:

```txt
docs/AGENDAPRO_V0609_NOTIFICATIONS_COMMUNICATION.sql
```

## Não incluído nesta sprint

- WhatsApp automático via API oficial.
- Lembretes automáticos recorrentes.
- Notificação push.
- SMS.
- Envio em massa.
- Google Agenda.

Esses itens ficam para sprints futuras.
