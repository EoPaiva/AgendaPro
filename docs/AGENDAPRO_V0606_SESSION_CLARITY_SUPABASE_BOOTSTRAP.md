# AgendaPro v0.6.0.6 — Clareza de sessão e bootstrap Supabase

## Objetivo

Esta versão ajusta a experiência do usuário logado e evita que o bootstrap legado do Supabase pareça um erro do sistema principal.

## Alterações

- Header agora mostra claramente quando existe sessão ativa de cliente.
- Botão “Minha conta” vira um chip “Logado” com nome do negócio/cliente.
- Header exibe sinal “conta logada”.
- Adicionado botão discreto para sair da sessão.
- Checkout mostra banner “Você está logado nesta conta”.
- Card de pagamento mostra o e-mail que receberá o vínculo do pagamento.
- Eventos locais avisam o header quando login/cadastro/sessão mudam.
- Bootstrap direto do Supabase continua legado/opcional.
- Falha no bootstrap legado não exibe toast de erro para o usuário final.
- Mensagens internas deixam claro que os dados reais vêm pelas APIs seguras.

## Observação sobre Supabase

Se `VITE_AGENDAPRO_ENABLE_REMOTE_BOOTSTRAP=true` estiver ativo, o frontend tenta ler uma agenda padrão diretamente pelo Supabase usando `VITE_AGENDAPRO_DEFAULT_COMPANY_SLUG`.

Em produção, recomenda-se deixar:

```env
VITE_AGENDAPRO_ENABLE_REMOTE_BOOTSTRAP=false
```

O site principal, a conta do cliente, a Central Dev e as agendas públicas devem operar pelas APIs Vercel/Supabase, não pelo bootstrap legado do frontend.
