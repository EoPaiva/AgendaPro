# AgendaPro v0.6.1.1 — Publicação Inteligente da Agenda

## Objetivo

Impedir que agendas incompletas sejam publicadas e guiar o cliente com um checklist claro antes de liberar o link público.

## Entregue nesta sprint

+ Checklist inteligente no criador de agenda.
+ Score de prontidão da agenda.
+ Estados: Agenda incompleta, Quase pronta e Pronta para publicar.
+ Bloqueio de publicação quando faltar dado obrigatório.
+ Prévia pública antes da publicação.
+ Painel Onboarding com diagnóstico de publicação.
+ Validação backend antes de salvar agenda publicada.
+ Persistência de `readiness_status`, `readiness_score` e `validation_issues` no Supabase.
+ Logs com score/status de prontidão.

## Itens obrigatórios para publicação

01. Nome do negócio.
02. Slug público válido.
03. WhatsApp ou e-mail de contato.
04. Pelo menos um serviço com duração válida.
05. Pelo menos um profissional.
06. Pelo menos um dia/horário de disponibilidade.

## Itens recomendados

01. Descrição pública.
02. Política de cancelamento.

## SQL

Execute:

```sql
-- docs/AGENDAPRO_V0611_SMART_AGENDA_PUBLICATION.sql
```

## Commit sugerido

```bash
git add .
git commit -m "feat: add smart agenda publication checklist"
git push -u origin main --force-with-lease
```
