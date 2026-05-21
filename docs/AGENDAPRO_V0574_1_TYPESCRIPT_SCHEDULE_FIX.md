# AgendaPro v0.5.7.4.1 — TypeScript Schedule Fix

Hotfix para corrigir o erro de build:

```txt
Property 'schedule' does not exist on type 'AgendaDraft'.
```

## Correção

O tipo `AgendaDraft` agora aceita a propriedade opcional `schedule`, usada pelo dashboard operacional completo da agenda real.

Também foi adicionada `confirmation?: string` em `rules`, pois o dashboard usa essa informação como fallback de regra operacional.
