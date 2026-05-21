# AgendaPro v0.6.3.4 - Services & Professionals Scheduling Rules

## Objetivo

Fortalecer a operacao de servicos, profissionais e disponibilidade sem alterar env, runtime, schema critico do Supabase ou fluxo de Vercel.

## Implementado

- Servicos e profissionais inativos continuam ocultos da pagina publica.
- A pagina publica filtra profissionais compativeis com o servico selecionado.
- O backend recusa servico inativo, profissional inativo ou profissional incompativel com o servico.
- Horarios publicos passam a considerar disponibilidade propria do profissional quando existir.
- Agendamentos antigos sem profissional continuam bloqueando a agenda inteira para preservar compatibilidade.
- Agendamentos novos com profissional identificado bloqueiam apenas o profissional correspondente.
- O dashboard valida servico ativo, duracao valida, profissional ativo, vinculo servico-profissional e horario valido antes da publicacao.
- O editor de servicos ganhou ordem, profissionais vinculados e observacoes internas.
- O editor de equipe ganhou e-mail, servicos atendidos e observacoes de disponibilidade.

## Compatibilidade

- Nenhum SQL novo foi criado.
- Dados continuam salvos em `services`, `team`, `hours`, `rules` e `raw_payload`.
- Backend segue CommonJS com `require/module.exports`.
- `package.json` continua em Node `20.x`.
- Nenhuma env foi alterada.

## Validacao esperada

```powershell
npm install --registry https://registry.npmjs.org/ --no-audit --no-fund
npm run build
node --check server/availability.js
node --check server/endpoints/create-public-booking.js
node --check server/endpoints/get-public-agenda.js
```
