# AgendaPro v0.6.3.7 - Notifications Templates Pro

## Objetivo

Melhorar a comunicacao manual e semiautomatica do dashboard do cliente com modelos editaveis, preview preenchido por variaveis e registro seguro no historico do agendamento.

## Entregue

- Aba `Mensagens` no dashboard privado, mantendo compatibilidade com a antiga secao `Comunicacao`.
- Templates editaveis para confirmacao, remarcacao, cancelamento, lembrete, pos-atendimento, reativacao, pagamento pendente, boas-vindas e solicitacao recebida.
- Variaveis suportadas no editor: `{cliente}`, `{empresa}`, `{servico}`, `{profissional}`, `{data}`, `{horario}`, `{whatsapp}`, `{link_agenda}` e `{endereco}`.
- Preview instantaneo da mensagem com dados reais do agendamento selecionado ou exemplo seguro quando nao houver agendamento.
- Acoes de copiar mensagem, abrir WhatsApp com texto preenchido e resetar template para o padrao.
- Historico de comunicacao exibido no drawer do agendamento a partir de `metadata.communicationHistory`, `message_history`, `communication_log` ou `metadata.lastCommunication`.
- Backend aceitando novos templates sem exigir WhatsApp API real.
- Fallback backend para salvar em `metadata` quando colunas opcionais `message_history` ou `communication_log` nao existirem.

## Preservado

- CommonJS no backend.
- Node 20.x no `package.json`.
- Fluxo de envs/Vercel sem alteracao.
- Estrutura critica do Supabase sem SQL novo obrigatorio.
- Pagina publica, Central Dev, relatorios, clientes, servicos/equipe e comunicacao existente.
- Estetica premium com microinteracoes e layout responsivo.

## Validacao esperada

```bash
npm install --registry https://registry.npmjs.org/ --no-audit --no-fund
npm run build
node --check server/endpoints/send-booking-message.js
```

## Commit

```bash
git commit -m "feat: add notification templates for bookings"
```
