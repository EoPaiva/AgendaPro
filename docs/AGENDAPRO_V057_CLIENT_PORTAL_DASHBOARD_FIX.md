# AgendaPro v0.5.7 — Client Portal + Dashboard Fix

Correções principais:

- `Gerenciar minha agenda` agora aponta diretamente para `#/conta/agenda/:slug/dashboard`.
- `#/conta/dashboard` virou apenas uma ponte de redirecionamento seguro para o dashboard real da agenda publicada.
- A rota demo `#/dashboard` não é mais usada pelo fluxo do cliente.
- O slug da agenda prioriza a agenda publicada em vez do nome do negócio da conta.
- Abas do painel do cliente redesenhadas: Resumo, Planos, Pagamentos, Licença/Key, Criar agenda e Configurações.
- Aba Planos refeita sem barras gigantes, sem espaços vazios e com cards completos.
- Aba Pagamentos refeita com status, linha de situação e aviso de confirmação manual.
- Aba Criar agenda mostra estado real da agenda e ações de dashboard/páginas públicas.
- Configurações recebeu estrutura mais limpa de conta, segurança e privacidade.

Após copiar esta versão, apague `package-lock.json` antigo se ele ainda existir, porque versões anteriores podem conter registry interno do ambiente de build.
