# AgendaPro v0.5.7.1 — API Consolidation for Vercel Hobby

## Motivo

O plano Hobby da Vercel permite no máximo 12 Serverless Functions por deployment.

Como cada arquivo dentro de `/api` vira uma função, o projeto ultrapassou o limite.

## Correção

As APIs foram consolidadas em roteadores:

```txt
/api/auth
/api/client
/api/dev
/api/payments
/api/public
/api/mercadopago-webhook
```

Os handlers internos foram movidos para:

```txt
/server/_security.js
/server/endpoints/
```

Assim o projeto fica abaixo do limite do plano Hobby sem precisar pagar Pro.

## Atenção

O webhook do Mercado Pago continua em:

```txt
/api/mercadopago-webhook
```

Não altere essa URL no Mercado Pago se ela já estiver configurada assim.

## Validação

Antes do deploy:

```bash
npm install
npm run build
```

Depois do deploy, testar:

```txt
/api/auth?action=client-login
/api/payments?action=create-checkout
/api/public?action=create-public-booking
/api/dev?action=login
```
