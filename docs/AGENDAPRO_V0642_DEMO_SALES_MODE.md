# AgendaPro v0.6.4.2 - Demo & Sales Mode

Sprint focada em deixar a demonstracao e a venda mais claras sem misturar dados ficticios com o ambiente principal.

## Implementado

- Pagina `#/demo` transformada em uma experiencia comercial completa.
- Aviso visivel de ambiente demonstrativo e orientacao para nao usar dados reais na demo.
- Botao principal mantendo a demo externa via `VITE_AGENDAPRO_DEMO_URL`, sem alterar fluxo de env.
- CTAs para abrir demo externa, comparar planos, contratar e falar no WhatsApp.
- Cards explicando isolamento da demo, dados ficticios, roteiro de venda e proximo passo.
- Roteiro de avaliacao da demo em quatro etapas.
- Pagina `#/planos` enriquecida com beneficios, comparativo de planos e CTA final.
- Cards dos planos agora oferecem contratacao e conversa no WhatsApp quando a pagina completa de planos e exibida.

## Preservado

- Dados demo nao sao salvos no ambiente principal por esta sprint.
- Nenhuma alteracao em Supabase critico, envs reais, runtime, Vercel env flow ou banco.
- Backend CommonJS e Node 20.x preservados.
- Link externo da demo continua usando `VITE_AGENDAPRO_DEMO_URL` com fallback atual.

## Validacao esperada

- `npm install --registry https://registry.npmjs.org/ --no-audit --no-fund`
- `npm run build`
- Teste E2E publico quando o Chromium do Playwright estiver instalado localmente.
