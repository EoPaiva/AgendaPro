# AgendaPro v0.6.0.5 — Correção de fallback e trava de pagamento

Esta versão corrige dois pontos críticos percebidos após o deploy da v0.6.0.4.

## Correções

- O site principal não tenta mais carregar automaticamente uma agenda padrão direto do Supabase pelo frontend.
- A mensagem “Fallback local ativado” não aparece mais no carregamento normal do site principal.
- A landing agora mostra “Site principal ativo” em vez de “Modo demonstração local”.
- Dados reais continuam sendo carregados pelas APIs seguras conforme o contexto:
  - agenda pública;
  - conta logada;
  - Central Dev;
  - backend Vercel com service role.
- O pagamento automático agora exige sessão real de cliente.
- O pagamento manual agora exige sessão real de cliente.
- O link manual do Mercado Pago só abre depois que a solicitação é registrada com sucesso no backend.
- Erros da API de pagamento manual não são mais ignorados.

## Bootstrap remoto legado

O carregamento direto do Supabase pelo frontend ficou desativado por padrão.

Caso queira reativar apenas para desenvolvimento/testes antigos, adicione:

```env
VITE_AGENDAPRO_ENABLE_REMOTE_BOOTSTRAP=true
VITE_AGENDAPRO_DEFAULT_COMPANY_SLUG=minha-agenda
```

Em produção, recomenda-se manter esse bootstrap desligado e usar as APIs do backend.
