# AgendaPro v0.6.3.6 - Reports Pro

## Objetivo

Evoluir os relatorios da agenda para indicadores comerciais uteis, calculados localmente a partir dos agendamentos carregados no painel.

## Implementado

- Filtros por hoje, 7 dias, 30 dias, este mes, mes anterior e todo historico.
- Filtros adicionais por servico, profissional e status.
- Metricas de total, confirmados, pendentes, concluidos, cancelados, faltas e remarcados.
- Taxas de confirmacao, cancelamento e comparecimento.
- Receita estimada, ticket medio e ocupacao estimada.
- Rankings de servicos mais solicitados, servicos mais lucrativos, profissionais, horarios e dias fortes.
- Clientes unicos, recorrentes e sem retorno.
- Heatmap simples por dia e horario.
- Resumo executivo automatico sem IA externa.
- Exportacao por copiar TXT, copiar JSON e baixar CSV simples.

## Compatibilidade

- Nenhum SQL novo.
- Nenhuma env alterada.
- Nenhuma dependencia nova.
- Backend CommonJS e Node `20.x` preservados.
- Estados vazios continuam visiveis quando nao ha dados.

## Validacao esperada

```powershell
npm install --registry https://registry.npmjs.org/ --no-audit --no-fund
npm run build
```
