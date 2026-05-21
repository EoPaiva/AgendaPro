# AgendaPro v0.6.2.8 — Team & Services Pro

## Implementado

- Área de Serviços Pro no painel da empresa.
- Edição rápida de nome, categoria, duração, preço, descrição, status e destaque do serviço.
- Adicionar, pausar, reativar e remover serviços com confirmação.
- Área de Equipe Pro com nome, função, especialidade, WhatsApp, foto por URL e serviços vinculados.
- Adicionar e remover profissionais.
- Salvamento de serviços/equipe usando a rota estável `create-agenda`, sem alterar env, runtime ou core Supabase.
- Alertas de saúde operacional para serviço sem duração, ausência de equipe ou agenda sem dias ativos.
- KPIs de catálogo: serviços, ativos, destaques e soma de duração.
- Visual premium com glow emerald, light sweep, hover refinado, cards alinhados e animações leves.
- Respeito a `prefers-reduced-motion`.

## Preservado

- Base oficial estável v0.6.2.4.
- Fluxo de env via Vercel.
- Runtime CommonJS/Node estável.
- Conexão Supabase existente.
- BAT limpo do AgendaPro.
- Sem SQL novo obrigatório.
- Sem README.md e sem TESTES_E2E.md no ZIP.

## Commit sugerido

```bash
git commit -m "feat: improve team and services management"
```
