# Decisões — frontend (ADRs iniciais)

Todas tomadas na sessão inicial da fase frontend (out/2026), agregando preferências do
usuário e restrições do backend. Status: **aceito**; reabrir exige aprovação do usuário
e atualização deste registro.

## Stack e estilo

- **D1 — Angular moderno standalone + signals, sem stores externos (sem NgRx).**
  Simplicidade e consistência; o usuário não tem proficiência frontend — menos abstrações.
- **D2 — Sem kit de UI e sem Tailwind na implementação.**
  Componentes próprios com tokens em SCSS/custom properties (permitir fidelidade total aos
  protótipos editorial hard-shadow). Tailwind só existe nos HTML de protótipo.
- **D3 — Fontes Space Grotesk + Manrope + Material Symbols self-hosted** (`public/fonts/`,
  referenciadas por `fonts/fonts.css`; script de regeneração em `tools/download-fonts.ps1`).
  Inicialmente via CDN no MVP; migração para self-host concluída na etapa de publicação.
- **D4 — Dinheiro como centavos inteiros em toda a UI.** Formatação central `formatBrl`;
  input com máscara própria e conversão testada. Jamais float/double no cliente.
- **D5 — Auth por cookie httpOnly + proxy dev same-origin (`/api → https://localhost:3000`,
  `secure:false`, `ng serve --ssl`). CORS não habilitado.** Cookie SameSite Lax não
  atravessa cross-site: o proxy é obrigatório, não opcional.
- **D6 — Balanceamento de estado por feature: services com signals + cache por rota;
  nada de reatividade global.**
- **D7 — Rotas lazy por feature; guard de auth primeiro via `GET /api/auth/me`.**
- **D8 — Forms reativos; validação estrutural no cliente, regras de domínio no backend.**
- **D9 — Interceptor central de erros (401/403/404/409/400/rede), mensagens pt-BR
  centralizadas; sem vazar existência de grupos em erros.**

## Decisões de escopo e correções sobre os protótipos

- **D10 — Balanço geral entre grupos é calculado no cliente** (soma de `balanceInCents`
  e `totalPaid` por grupo via N+1 de `GET /api/groups/{id}/balances`). Custo aceitável no
  MVP; se o número de grupos crescer muito, criar endpoint agregado no backend
  (mudança de escopo a ser pedida na hora).
- **D11 — Avatares por iniciais** (cor derivada determinística do nome) — sem upload,
  sem campo de foto (backend não possui).
- **D12 — Sem chip de categoria de grupo** ("Praia & Férias") e sem modos de grupo
  decorativos no MVP — backend não possui campo categoria. Fica fora até decisão de produto.
- **D13 — Bottom nav com só 2 itens: "Grupos" e "Ajustes".** A aba "Atividade" dos
  protótipos não existe por falta de endpoint de feed; reabrir apenas com decisão de
  escopo no backend.
- **D14 — Copy honesta:** remover prova social fictícia ("Mais de 40 mil rachas…") e
  link de "Termos" sem página; manter "racha." apenas como placeholder de marca,
  sem envolver funcionalidade.
- **D15 — Preview do rateio no formulário é rotulado "estimativa"** (divisão simples,
  arredondamento visual); a divisão definitiva (centavos exatos, resto na 1ª cota) é
  exclusivamente do backend.

## Infra

- **D16 — Sem e2e no MVP**; testes de componente/unit nos pontos críticos (dinheiro,
  guard, formulário de despesa, mensagens de erro).
- **D17 — Deploy previsto same-origin da API** (ou reverse proxy) — sem CDN cross-domain
  nesta fase, para o cookie httpOnly continuar funcionando.

## Layout adaptativo

- **D18 — Mobile-first com dois breakpoints de media query** (valores fixos, sem
  sistema de grid): **≥768px** troca a bottom nav por sidebar fixa à esquerda
  (`--sidebar-w`), esconde o header sticky e centraliza os modais (diálogo em vez de
  bottom sheet) e põe os cards de grupo em grade; **≥1120px** amplia o container
  (shell 1160px), divide o detalhe do grupo em duas colunas (saldos + participantes
  à esquerda, despesas à direita), o formulário de despesa em duas colunas e apresenta
  o login como split editorial (hero cobalto decorativo, `aria-hidden`, à esquerda).
  Entre 481–767px a bottom nav fica centralizada no container; abaixo de 481px, full-width.

## Tema

- **D19 — Dark mode opcional:** paleta escura registrada em `_tokens.scss` sob
  `[data-theme="dark"]` (todas as superfícies/cores derivam dos tokens; bordas e
  sombras "hard editorial" derivam do `--color-ink`, que vira creme no escuro).
  Preferência do usuário em `localStorage` (`gem-theme`: `auto`/`light`/`dark`),
  gerenciada por `ThemeService` (`src/app/core/theme/`), com toggle
  Auto/Claro/Escuro em Ajustes; padrão "auto" segue `prefers-color-scheme`
  (inclusive ao vivo). Um script inline no `index.html` aplica o tema salvo antes
  do bootstrap para evitar flash — ao introduzir CSP no deploy do backend, esse
  script precisa de hash/nonce.

## Usabilidade

- **D20 — Nomes padrão gerados no backend** (decisão de produto aprovada pelo
  usuário): grupo criado com nome em branco vira "Grupo N" (contador **por
  criador**, prossegue do maior sufixo existente); participante com nome em
  branco vira "Pessoa N" (contador **por grupo**). Implementado no backend
  (`DefaultNameGenerator` + use cases; domínio continua exigindo nome não-vazio;
  renomear grupo não gera default). O frontend trata nome como opcional
  (modal "Novo grupo" e formulário de participante; o detalhe reflete o nome
  real após recarregar).
- **D21 — Atalho "Você" no grupo:** botão que adiciona a própria pessoa como
  participante usando nome derivado da parte local do e-mail (capitalizada),
  escondido quando esse nome já existe no grupo (case-insensitive). Mantém a
  regra NÃO haver vínculo `User`↔`Participant` — é apenas um atalho de
  preenchimento; criar participante automaticamente ao criar grupo segue
  proibido (regra do backend).
