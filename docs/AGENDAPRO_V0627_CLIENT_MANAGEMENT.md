# AgendaPro v0.6.2.7 — Client Management

Sprint criada a partir da base oficial estável `v0.6.2.4` e da continuidade `v0.6.2.6`, sem mexer em env, runtime, Supabase core ou fluxo do BAT.

## Implementado

- Nova experiência visual da aba **Clientes** no painel da empresa.
- Agrupamento automático de clientes a partir dos agendamentos já carregados.
- Identificação por WhatsApp, e-mail ou nome.
- KPIs de clientes únicos, recorrentes, sem retorno e receita estimada.
- Filtro por status: todos, novos, ativos, recorrentes e sem retorno.
- Busca por nome, WhatsApp, e-mail ou serviço.
- Carteira de clientes com último serviço, último contato e total de agendamentos.
- Painel **Cliente 360º** com contato, histórico, próximo atendimento, receita estimada e observação interna.
- Drawer completo do cliente com histórico de agendamentos.
- Botões para WhatsApp, copiar resumo e abrir próximo agendamento.
- Observação interna vinculada ao último agendamento via endpoint já existente.
- SVGs leves, mini gráfico, glow emerald, hover premium, animações e `prefers-reduced-motion`.

## Preservado

- Não houve SQL novo obrigatório.
- Não houve alteração no core de database/env/runtime.
- Não houve mudança na autenticação base.
- Não houve alteração em Vercel env flow.
- README.md e TESTES_E2E.md continuam fora do ZIP.
- BAT limpo do AgendaPro preservado.

## Validação

- `node --check` validado em APIs/arquivos backend disponíveis.
- `npm install`/`npm run build` não foram concluídos no ambiente de geração por lentidão/trava de dependências, mas o pacote mantém registry público no `.npmrc` e BAT com correção de package-lock/registry.

## Commit sugerido

```bash
git commit -m "feat: add client management dashboard"
```
