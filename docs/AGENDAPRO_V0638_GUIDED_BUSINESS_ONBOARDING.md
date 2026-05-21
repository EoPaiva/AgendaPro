# AgendaPro v0.6.3.8 - Guided Business Onboarding

Sprint focada em reduzir abandono de contas novas sem tocar na fundacao estavel de runtime, env, Supabase ou fluxo de deploy.

## Entregue

- Onboarding empresarial guiado no topo do dashboard para contas ainda sem agenda operando.
- Barra de progresso por etapa com estados de 0%, 15%, 30%, 45%, 60%, 75%, 90% e 100%.
- Proxima acao clara para dados do negocio, contato publico, servico, profissional, horarios, visual, revisao, publicacao e link publico.
- Modo de dashboard menos vazio para contas novas, escondendo metricas operacionais sem dados e destacando preview/acesso ao checklist.
- Secao completa de Onboarding no painel do cliente com checklist clicavel, preview publico, acao principal e checklist operacional.
- Criador de agenda com card de progresso do onboarding e botao para continuar a configuracao no passo correto.
- Central Dev com aba Onboarding para ver clientes em onboarding, clientes travados, prontos para publicar, publicados e contas sem agenda.
- Alertas de clientes travados antes da publicacao, inclusive no resumo da Central Dev e badge lateral.

## Preservado

- CommonJS no backend.
- Node 20.x no `package.json`.
- Nenhuma alteracao em env, Vercel Environment Variables ou secrets.
- Nenhum SQL novo.
- Nenhuma mudanca estrutural em Supabase.
- Funcionalidades anteriores de painel, pagina publica, comunicacao, relatorios, clientes, servicos/equipe e Central Dev.

## Validacao Esperada

```powershell
npm install --registry https://registry.npmjs.org/ --no-audit --no-fund
npm run build
```

Tambem validar que o `package-lock.json` continua sem registry interno e que o dashboard carrega sem overlay de erro.
