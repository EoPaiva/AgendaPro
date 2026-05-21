# AgendaPro v0.5.7.5 — Real Multi-Tenant Agenda Isolation + WhatsApp

Correção crítica do fluxo multi-cliente.

## Corrigido

```txt
- /agendar/:slug não cai mais na demo da Clínica Aurora quando a agenda real não é encontrada.
- /agenda/:slug não usa fallback visual de demo para agendas reais.
- Agenda pública passa a ser carregada por slug real via /api/public?action=get-public-agenda.
- Rascunho local de agenda passa a ser escopado por conta/e-mail, evitando que uma conta nova herde a agenda antiga "arena".
- Publicação da agenda atualiza o publicSlug da conta com o slug retornado pelo backend.
- Agendamentos públicos são enviados para o slug real carregado da URL.
- Botões de WhatsApp abrem wa.me com mensagem pronta.
```

## Nova rota pública de API

```txt
GET /api/public?action=get-public-agenda&slug=salaodebeleza
```

Retorna apenas dados públicos da agenda publicada.

## Regra de segurança

Se o slug não existir ou não estiver publicado, o sistema mostra agenda não encontrada.

Nunca deve carregar Clínica Aurora Dental como fallback de uma agenda real.
