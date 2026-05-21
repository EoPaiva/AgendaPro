# AgendaPro v0.6.3.9 — Multi-Unit Foundation

## Objetivo

Preparar o AgendaPro para empresas com mais de uma unidade sem criar uma estrutura pesada de multi-tenant e sem alterar a fundacao estavel de runtime, env, Vercel ou Supabase.

## Entregas

- Campo de unidade preservado em servicos e profissionais.
- Fallback `Unidade principal` para operacoes de unidade unica.
- Filtro por unidade na gestao de agendamentos.
- Badge de unidade nos cards de agendamento.
- Aba `Unidades` com cards operacionais por unidade.
- Pagina publica preparada para escolha de unidade quando houver mais de uma.
- Envio de `unit`, `unitName` e `unitId` no agendamento publico.
- Persistencia da unidade no `metadata` do agendamento publico.
- Relatorio CSV com coluna `unidade`.
- Central Dev exibindo unidade em agendamentos.

## Decisoes tecnicas

- Nenhuma migration SQL foi criada.
- Nenhuma variavel de ambiente foi alterada.
- Nenhum fluxo de Vercel Environment Variables foi alterado.
- Backend segue CommonJS com `require/module.exports`.
- Node 20.x foi preservado no `package.json`.
- A unidade fica em campos locais de servico/equipe e no `metadata` de agendamentos para manter compatibilidade com dados existentes.

## Criterios de aceite

- Negocio com uma unidade continua usando `Unidade principal`.
- Negocio com multiplas unidades consegue filtrar agendamentos por unidade.
- Agendamento publico carrega apenas servicos/profissionais da unidade selecionada.
- Agendamento salvo preserva unidade no `metadata`.
- Build TypeScript deve passar.
