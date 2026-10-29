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

- **D10 — Balanço geral dos grupos em uma única chamada** (substitui versões anteriores
  que calculavam no cliente via N+1 de `GET /api/groups/{id}/balances`): existe o
  endpoint agregado `GET /api/groups/overviews`, que devolve por grupo
  `{ id, name, createdAtUtc, participantCount, totalPaidInCents }`. A tela "Meus
  grupos" consome só esse endpoint; nada de somas de saldo no cliente.
- **D11 — Avatares por iniciais** (cor derivada determinística do nome) — sem upload,
  sem campo de foto (backend não possui).
- **D12 — Sem chip de categoria de grupo** ("Praia & Férias") e sem modos de grupo
  decorativos no MVP — backend não possui campo categoria. Fica fora até decisão de produto.
- **D13 — Bottom nav com só 2 itens: "Grupos" e "Ajustes".** A aba "Atividade" dos
  protótipos não existe por falta de endpoint de feed; reabrir apenas com decisão de
  escopo no backend.
- **D14 — Copy honesta:** remover prova social fictícia ("Mais de 40 mil rachas…") e
  link de "Termos" sem página; manter "rachaae" apenas como placeholder de marca,
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

- **D19 — Tema claro/escuro:** somente **Claro ou Escuro**, padrão **claro** — sem
  modo "auto" seguindo o sistema (removido a pedido do usuário; preferência em
  `localStorage` `gem-theme` e toggle em Ajustes). Paleta escura em
  `_tokens.scss` sob `[data-theme="dark"]` (superfícies/cores derivam de tokens;
  bordas e sombras "hard editorial" derivam do `--color-ink`, quase-branco no
  escuro). Tokens de texto sobre cores fortes: `--on-accent` (`#20211e` claro /
  `#1a1c20` escuro) e `--on-danger` (branco). Script inline no `index.html`
  aplica o tema salvo antes do bootstrap — ao introduzir CSP no backend, esse
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
  participante usando **o nome de exibição salvo da conta (prioridade)** e, sem
  nome, a parte local do e-mail capitalizada; escondido quando o nome resultante
  já existe no grupo (case-insensitive). O nome de exibição é opcional, definido
  em Ajustes (`PUT /api/auth/name` — ver backend `business-rules.md` §1) e
  mantém a regra NÃO haver vínculo `User`↔`Participant` — é apenas um atalho de
  preenchimento; criar participante automaticamente ao criar grupo segue
  proibido (regra do backend).

## Dados

- **D22 — Remoção de participante recalcula saldos (decisão de produto aprovada
  pelo usuário; substitui o bloqueio por 409):** `DELETE /api/groups/{id}/participants/{id}`
  aceita participante com histórico:
  - despesas **pagas** por ele são excluídas;
  - nas demais, as cotas dele são redistribuídas igualmente entre os restantes
    (ordem de seleção preservada, restante na 1ª cota);
  - despesas que ficassem sem participantes na divisão são excluídas;
  - tudo transacional no backend. A soma das cotas continua == total e a soma
    dos saldos == 0.
  A UI confirma com copy condicional: quando o participante é referenciado por
  despesas (pagador ou cota, computado nas despesas já carregadas), o modal diz
  que despesas pagas por ele serão excluídas e as cotas recalculadas; caso
  contrário, apenas "Remover X do grupo?". Reaberto só por decisão de produto.
- **D23 – Pagamentos (acertos) e plano de quitação (decisão de produto aprovada
  pelo usuário):** o usuário pode registrar uma transferência de dinheiro entre
  dois participantes do grupo (**modelo "pagamento livre"**: valor em BRL livre,
  quitação total ou parcial), lista-los na seção "Pagamentos" do detalhe e
  excluí-los (definitivo; saldos recalculados). O backend também expõe
  `GET /api/groups/{id}/settlement-plan` com sugestão gulosa e determinística
  (maiores credores/devedores primeiro, empate por id, ≤ n−1 transferências)
  exibida em "Como acertar"; cada linha tem botão "Registrar" que abre o modal
  pré-preenchido (pagador, receptor e valor). Saldo passa a considerar
  pagamentos: `totalPaidInCents − totalOwedInCents + totalReceivedInCents −
  totalSentInCents` (`ParticipantBalanceResponse` atualizado, aditivo). O
  registro é contábil — sem comprovante, edição ou confirmação de recebimento.
  Removed "pagamentos" da lista de fora-do-escopo (backend e frontend).
- **D24 – Ajustes de pagamentos e compartilhamento (decisões de produto aprovadas
  pelo usuário):**
  (a) **Correção da convenção de saldo** (backend + docs): um pagamento **quita
  dívida** — saldo = `pagou em despesas + pagamentos enviados − cotas atribuídas
  − pagamentos recebidos`. Registrando o valor exato, o "Como acertar" volta a
  ficar vazio (era o inverso).
  (b) **Pagador entra no rateio automaticamente** ao ser escolhido na despesa
  (seguindo o comportamento real, ainda desmarcável manualmente).
  (c) **Botões de copiar** (pequenos, ícone `content_copy` → `check` por ~2s):
  saldos (por pessoa: recebe/deve/quitado), plano "Como acertar" (devedor →
  credor com valor) e cada despesa (descrição — valor — pagador — dividido por
  nomes). Texto pt-BR via helper central `copyToClipboard` (Clipboard API com
  fallback `execCommand`).
- **D25 – Limite de 10 grupos por usuário (decisão de produto aprovada pelo
  usuário):** o backend rejeita a 11ª criação com 400 ("A user can have at most
  10 groups."); a contagem considera apenas grupos do criador. A UI desabilita o
  botão "Novo grupo" na lista quando o usuário já tem 10 grupos (tooltip com o
  limite) e traduz o erro do limite para "Você pode ter no máximo 10 grupos."
  no modal de criação.
- **D26 – Todos os botões ficam quadrados (decisão aprovada):** padronização de
  cantos — todo botão (primário, secundário, danger, chip e chips de seleção do
  formulário de despesa) usa radius `--radius-md` (8px). `radius-pill` fica
  reservado a chips de status estáticos e avatar (não são botões).
- **D27 – Reforma de layout: nav na Shell, utilitários de composição e
  responsividade D18 implementada (2026-10-28):** os templates portados dos
  protótipos usavam classes utilitárias de composição (flex/gap/tamanhos) que não
  existiam no SCSS — ícones e blocos saíam do lugar. Mudanças:
  (a) nova camada `src/styles/_utilities.scss` com os utilitários usados (`flex`,
  `items-*`, `gap-space-*`, tamanhos fixos, `bare-input` etc.), todos mapeando para
  tokens; nada de valores mágicos;
  (b) a navegação (bottom nav mobile + sidebar ≥768px) vive só na **Shell**; as
  páginas não replicam `<nav>`; a nav aparece em todas as telas autenticadas
  (inclusive detalhe e formulário) por consistência;
  (c) item "Atividade" removido da nav (rota não existe no MVP — D13 prevê 2 itens);
  (d) avatar real da conta logada (`shared/ui/avatar`, iniciais + cor derivada do
  nome) nos headers, substituindo o círculo decorativo "person"; o avatar
  compartilhado usava `--radius-pill`, que não existia (corrigido para
  `--radius-full`);
  (e) emenda ao D18: o header permanece visível no desktop, deslocado pela largura
  da sidebar, para conservar "voltar" e menu nos detalhes/formulários;
  (f) detalhe do grupo em duas colunas via grid por seção (o antigo seletor `:has`
  não casava com a estrutura real); formulário de despesa em duas colunas
  (valor/descrição | pagador/rateio); `--container-max` regula para 680px/1160px
  (D18);
  (g) espaçamento entre seções do detalhe é o gap do `.page` (margens duplicadas
  removidas); header de grupos exibe nome do usuário, mês corrente e contagem real
  de grupos (antes: "OLÁ, MARINA • ABRIL 2025 / 4 ativos" fixos do protótipo);
  (h) `html, body` usam `width: 100%` (antes `100vw`, que inclui a largura da
  barra de rolagem vertical e provocava scroll horizontal de ~10px no desktop e
  no device emulation), corrigido em 2026-10-29;
  (i) bottom sheet mobile não pode ser cortado: `.modal` ganhou
  `max-height: calc(100dvh - 24px)` + `overflow-y: auto` + `padding-bottom` com
  safe-area, e modal/backdrop sobem para z-index 60 — acima da bottom nav
  (z-50), que fica bloqueada pelo backdrop enquanto o modal está aberto;
  (j) card "Adicionar amigo" do detalhe quebra linha no mobile
  (`.participant-add > .flex` com `flex-wrap: wrap`): input + dois chips
  somavam acima da largura do viewport (393px) e empurravam a página para
  415px, criando scroll horizontal; e os textos de saldo removem o prefixo
  "R$" manual no template (com "R$ R$ X") porque `formatBrl` já devolve o
  símbolo — também corrigido em 2026-10-29.

- **D28 — Marca final "rachaae" (2026-10-29):** o nome "rachaae" era provisório
  (D14). O usuário decidiu a marca: **rachaae** passa a ser o nome definitivo,
  aplicado na sidebar, no header de grupos ("rachaa`e`" com a última letra em
  destaque), na dica da home e no botão do login; `index.html` já usava "Rachaae".
  O nome interno do projeto (`racha-web`) permanece como codename técnico.

- **D29 — Resumo agregado honesto (emenda ao D10, 2026-10-29):** o contrato
  `GroupOverviewResponse` não traz saldo por usuário, então a home remove os
  elementos decorativos fake ("Seu Balanço Geral" com "A receber/Você deve" em
  R$ 0,00, badge "Atualizado agora" e chip fixo "Tudo quitado"). Agora o card
  "Resumo Geral" exibe só o que o contrato entrega: total pago entre os grupos
  e participantes somados; o chip do card do grupo mostra "Sem despesas"
  (total = 0) ou o total pago real do grupo. Quando o backend incluir saldo por
  usuário no overview, este card pode voltar a exibir saldos — não recalcular
  no cliente (regra central de rateio).
