# AgendaPro v0.6.1.4 — Business Dashboard Pro

## Objetivo

Transformar o painel inicial da empresa em uma área mais clara, executiva e útil para uso diário, sem alterar a arquitetura principal, sem mexer no site demo e sem remover funcionalidades existentes.

## Implementado

🟢 Novo painel executivo da empresa na seção **Início** do dashboard privado.

🟢 Hero operacional com:
- nome da empresa;
- saúde operacional;
- prontidão da agenda;
- total de solicitações;
- ações rápidas para copiar link, abrir agenda e gerenciar agendamentos.

🟢 Faixa de status com:
- status do plano;
- status da agenda;
- agendamentos de hoje;
- pendências importantes.

🟢 Bloco de próximos agendamentos:
- exibe os próximos horários ativos;
- permite abrir detalhes do agendamento;
- mostra serviço, data, horário e status.

🟢 Card de link público:
- copiar link público;
- copiar mensagem pronta para divulgação;
- compartilhar pelo WhatsApp.

🟢 Pendências importantes:
- plano pendente/bloqueado;
- agenda não publicada;
- solicitações pendentes;
- ausência de serviços;
- ausência de profissionais.

🟢 Ações rápidas:
- gerenciar agendamentos;
- abrir comunicação;
- ajustar disponibilidade;
- ver prontidão da agenda.

🟢 Indicadores rápidos:
- conversão;
- ocupação;
- receita estimada;
- clientes.

## Arquivos alterados

- `src/pages/Home.tsx`
- `src/styles.css`
- `package.json`
- `package-lock.json`
- `docs/AGENDAPRO_V0614_BUSINESS_DASHBOARD_PRO.md`

## SQL

Não há SQL obrigatório nesta sprint.

## Build

Validado com:

```bash
npm install
npm run build
```

## Próxima sprint sugerida

`v0.6.1.5 — Public Page Customization`

Foco sugerido:
- personalização visual da página pública;
- logo/imagem da empresa;
- cor principal;
- descrição pública;
- Instagram;
- mensagem de boas-vindas;
- prévia antes de publicar.
