# AgendaPro v0.6.2.5 — Public Page Customization + Premium Motion

Sprint focada em evoluir a página pública da agenda sem tocar no core sensível estabilizado.

## Implementado

- Personalização pública com URL de logo, banner/capa, Instagram, site e mensagem de boas-vindas.
- Prévia pública premium no criador de agenda.
- Página pública com hero premium, banner opcional, logo real quando informada e CTA com light sweep.
- SVGs decorativos leves, grids sutis, glow emerald, pulse discreto e microinterações.
- Cards comerciais para confiança, horários inteligentes e contato direto.
- Hover premium em serviços, profissionais, datas e horários.
- Respeito a `prefers-reduced-motion`.
- Persistência via `theme` e `raw_payload` já usados pelo backend estável.

## Preservações obrigatórias

- Não altera env flow.
- Não usa `_keys_privadas`.
- Não mexe em service role, runtime, autenticação base ou estrutura crítica de database.
- Não adiciona SQL obrigatório.
- Não inclui README.md nem TESTES_E2E.md no ZIP.
