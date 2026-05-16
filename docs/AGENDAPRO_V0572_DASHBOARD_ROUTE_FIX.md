# AgendaPro v0.5.7.2 — Dashboard Route Fix

## Problema corrigido

O cliente criava/publicava uma agenda, mas ao clicar em gerenciamento acabava na rota antiga:

```txt
#/dashboard
```

Essa rota renderizava o dashboard demo da Clínica Aurora Dental.

## Correção

- A rota antiga `#/dashboard` agora é uma ponte protegida.
- Se existir sessão do cliente, ela redireciona para:

```txt
#/conta/agenda/:slug/dashboard
```

- Se não existir sessão, redireciona para:

```txt
#/conta/login
```

- A ponte `#/conta/dashboard` também redireciona diretamente para o dashboard privado da agenda vinculada.
- Links de demo foram movidos para `#/demo/clinica-aurora-dental` para não confundir com dashboard real do cliente.

## Resultado esperado

Para a agenda `arena`, o destino correto é:

```txt
#/conta/agenda/arena/dashboard
```

Nunca mais:

```txt
#/dashboard
```
