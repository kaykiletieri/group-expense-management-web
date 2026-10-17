# Arquitetura — Frontend Angular

## Stack

- **Angular** (versão estável mais recente no momento do scaffold via `ng new`; manter
  upgrades pontuais, nunca downgrade de versão). Componentes **standalone**, **signals**,
  templates com control flow moderno (`@if`, `@for`, `@defer`).
- **SCSS** com tokens de design em custom properties CSS (ver `design-system.md`).
  **Sem Tailwind** na implementação (o Tailwind existe só nos protótipos) e **sem kit de UI**
  (sem Angular Material, PrimeNG etc.).
- **Sem NgRx / stores externos**: estado via `signal()` em services.effects não usado
  diretamente para estado; preferir computeds e calls explícitos.
- Fontes via Google Fonts CDN no MVP; self-host na etapa de publicação (D3).
- Ícones: Material Symbols Outlined (fonte).

## Scaffold

O repo é o root da aplicação: `ng new racha-web --directory . --style=scss --ssr=false`
(ajustar flags na execução). Nome interno provisório `racha-web` até marca final ser decidida.

## Organização de pastas (alvo)

```
src/
  app/
    core/            # interceptors, guards, formatadores de dinheiro, api clients
    design/          # tokens scss, botões/cards/chips base, ícones
    features/
      auth/          # login, cadastro, guard
      groups/        # lista, criar, detalhe, participantes
      expenses/      # nova/editar despesa
      settings/      # ajustes (conta, logout)
    shared/          # componentes reutilizáveis (empty state, avatar iniciais, modal)
```

- Cada feature com rotas lazy (`loadChildren`/`loadComponent`).
- Rotas: `/login`, `/grupos`, `/grupos/novo`, `/grupos/:id`,
  `/grupos/:id/despesas/nova`, `/grupos/:id/despesas/:expenseId/editar`, `/ajustes`.

## HTTP e auth

- `HttpClient` com base `"api"` (mesma origem, via proxy em dev).
- **Interceptor central**:
  - `401` → redirecionar para `/login` (exceto em rotas públicas);
  - `404` → tratar como "não encontrado" na tela em questão (sem distinção de existência);
  - `409`/`400` → surfaced mensagem do corpo `{"error": "..."}` no contexto do formulário;
  - erros de rede → mensagem genérica "Não foi possível conectar. Verifique sua internet."
- Autenticação é cookie httpOnly (`gem_session`) — nada de tokens em localStorage/JS.
- Guard `authGuard`: rotas protegidas consultam `GET /api/auth/me` (ou cache do service).

## Dev/proxy (decisão fechada)

- `proxy.conf.json`: `"/api" → "https://localhost:3000"` com `secure: false` (certificado
  dev self-signed) — a API roda em `https://localhost:3000` (ver launchSettings do backend).
- `ng serve --ssl` no dev server para ambiente `http` seguro; cookie Secure + SameSite Lax
  funciona por ser same-origin através do proxy.
- CORS no backend não é necessário nessa configuração e não deve ser habilitado para o dev.

## Formatação de dinheiro

- Função central `formatBrl(cents: number): string` (ex.: `3334 → "R$ 33,34"`), com
  `Intl.NumberFormat('pt-BR', …)` e **inteiro em centavos** como único tipo monetário.
- Inputs de valor: campo com máscara simples propria (vírgula decimal), converter entrada
  para centavos com arredondamento determinístico; testar essa conversão.

## Testes

- Runner padrão do Angular CLI (conforme versão instada; `ng test`).
- Prioridade: formatação de dinheiro + máscara, guard auth, formulário de despesa
  (validações e montagem do payload), mensagens de erro 409/401.
- Sem e2e no MVP.

## Deploy (direção, não implementado ainda)

Servir os assets estáticos na mesma origem da API (ou reverse proxy), para o cookie
continuar same-origin. Nada de CDN de domínio cruzado nesta fase.
