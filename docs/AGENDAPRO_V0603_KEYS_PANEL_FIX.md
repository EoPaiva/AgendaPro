# AgendaPro v0.6.0.3 — Central Dev Keys Panel Fix

Correção da aba Keys da Central Dev.

## Correções

```txt
- Adicionado painel para gerar nova key promocional.
- Adicionado formulário com tipo, plano, duração, quantidade e observação interna.
- Adicionado retorno visual das keys geradas.
- A key completa aparece somente no momento da geração.
- Adicionadas ações na lista: copiar prefixo, revogar, desativar, reativar e excluir/arquivar.
- Corrigido header dev para enviar x-dev-token além de Authorization.
- Corrigida sincronização com endpoints protegidos da Central Dev.
```

## API usada

```txt
POST /api/dev?action=create-license-key
POST /api/dev?action=execute
```
