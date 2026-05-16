# AgendaPro v0.5.9.1 — Página pública institucional PRIME

## Objetivo

Melhorar a rota `#/agenda/:slug` para seguir o mesmo padrão visual da página pública de agendamento `#/agendar/:slug`, mantendo identidade única, premium e consistente.

## O que foi alterado

```txt
- Hero institucional em estilo Luxury Prime
- Card lateral com avatar/logo, status aberto/fechado e próximo horário
- Seção Sobre
- Cards de serviços com CTA para agendamento
- Cards de profissionais com CTA para agendamento
- Seção Funcionamento com dias e horários reais
- Seção Regras de atendimento
- Seção Contato com WhatsApp, e-mail e endereço quando existirem
- CTA final antes do footer
- Footer premium com dados reais da agenda
- Fallbacks neutros, sem Arena, Clínica Aurora ou demo
- Responsividade mobile/tablet/desktop
```

## Rotas preservadas

```txt
#/agenda/:slug
#/agendar/:slug
#/conta/agenda/:slug/dashboard
```

## Segurança de dados

A página busca a agenda pelo slug real via:

```txt
GET /api/public?action=get-public-agenda&slug=:slug
```

Se a agenda não existir, a página mostra "Agenda não encontrada" e não carrega dados de demo.

## Build

Validado com:

```bash
npm run build
```
