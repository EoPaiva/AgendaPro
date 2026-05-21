# AgendaPro v0.6.2.6 — Basic Reports & Metrics

Sprint focada em relatórios básicos reais no painel da empresa, sem mexer no core de env, runtime, autenticação ou Supabase.

## Implementado

- Nova experiência visual para a aba **Relatórios**.
- Filtros por período: hoje, últimos 7 dias, últimos 30 dias e todo o histórico.
- Total de agendamentos por período.
- Confirmados, pendentes, concluídos, cancelados e remarcados.
- Taxa de confirmação e cancelamento.
- Clientes únicos.
- Receita estimada baseada em valores dos serviços/agendamentos existentes.
- Ocupação estimada simples.
- Serviços mais solicitados.
- Horários mais procurados.
- Resumo executivo com próximas ações.
- Exportação/cópia do relatório em TXT e JSON.
- Cards premium, SVGs leves, barras animadas, mini gráfico e ring visual.
- Respeito a `prefers-reduced-motion`.

## Preservado

- Core de env pela Vercel.
- Runtime CommonJS/Node estável.
- Conexão Supabase/API.
- Login, Central Dev, publicação de agenda e fluxo público.
- BAT limpo do AgendaPro.

## SQL

Não há SQL obrigatório nesta sprint.
