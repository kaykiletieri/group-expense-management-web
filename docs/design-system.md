# Design System — "Bold & Playful Editorial"

Base: protótipos em `../design/prototipos/` + `design-tokens-originais.md` + `design-spec-racha.md`.
Implementação em SCSS com custom properties (sem Tailwind, sem kit de UI).

## 1. Fundamentos

### Cores

| Token | Valor | Uso |
|---|---|---|
| `--color-canvas` | `#FBF9F4` | fundo da página |
| `--color-surface` | `#F7F3EA` | fundo de seções/listas |
| `--color-card` | `#FFFFFF` | cards |
| `--color-ink` | `#20211E` | texto principal |
| `--color-ink-soft` | `#6B6A61` | texto secundário |
| `--color-line` | `#20211E` | bordas (`1.5px`) — "hard editorial" |
| `--color-primary` | `#2546F0` | azul cobalto — seleção/links/bordas de destaque |
| `--color-cta` | `#FF7139` | laranja — ações primárias (botões) |
| `--color-positive` | `#D9F36A` | verde-limão — chips/saldos quitados/positivos |
| `--color-error` | `#D7402B` | erros, saldos negativos |
| `--color-success-text` | `#3E7C2B` | texto de valores positivos (chip quadro é o limão) |

Regras: nunca usar azul/limão/laranja em texto corrido longo (contraste); o creme é o fundo
padrão — não usar branco puro de página.

### Tipografia

- **Space Grotesk** — headlines, valores monetários, labels caps.
   pesos: 500/600/700.
- **Manrope** — corpo, formulários, listas. pesos: 400/500/600/700/800.
- Valores monetários: `font-variant-numeric: tabular-nums`.
- Micro-labels (`label-caps`): uppercase, 11px, `letter-spacing: 0.08em`, peso 600.
- Escala: display 32px/1.1, h1 24–28px, h2 20px, body 15–16px, caption 13px.

### Raio, borda, sombra "hard offset"

- Radius: sm `4px`, md `8px`, card `12–16px`, pill `999px`.
- Borda padrão: `1.5px solid var(--color-ink)`.
- Sombras duras **sem blur**: `box-shadow: 3px 3px 0 var(--color-ink)` (botões/chips ativos
  podem usar `4px 4px 0`, com `translate(-2px,-2px)` no hover/press).
- Foco visível: `outline: 2px solid var(--color-primary); outline-offset: 2px`.

### Espaçamento

Base de 4px: `4 / 8 / 12 / 16 / 20 / 24 / 32 / 48`. Container mobile: largura máx ~480px
centralizado, `padding-inline: 16px`.

## 2. Componentes (contrato visual)

### Header de app

Barra creme com borda inferior 1.5px grafite. Título Space Grotesk 600. Ação à direita
(ícone + botão). Versão detalhe: seta voltar + nome do grupo.

### Botões

- **Primário**: laranja `--color-cta`, texto/bn grafite, radius 8–12px, sombra dura 3px,
  altura 44–52px, fonte Space Grotesk 700 (ou 600).
- **Secundário (outline)**: branco, borda 1.5px grafite, sombra dura; hover lêvemente elevado.
- **Terciário/link**: texto cobalto, sublinhado no hover.
- Estados: `:active` reduz sombra e desloca 1–2px; desabilitado 45% opacidade sem sombra.

### Card

Branco, borda 1.5px, radius 12–16px, sombra dura opcional `3px 3px 0`. Padding 16–20px.
Cards de saldo: coluna esquerda avatar+nome, direita valor alinhado à direita (`tabular-nums`).

### Chips

- **Seleção (ética/participante)**: limão `--color-positive` com check, borda grafite,
  sombra dura; não-selecionado: branco com borda e texto normal.
- **Status**: "Quitado" limão; "Deve" branco com borda; contagens pequenas são mini-chips
  de grafite invertido.
- `pill`, padding 8–14px, fonte 12–13px, peso 700 para selecionado.

### Campos de formulário

- Input branco, borda 1.5px grafite, radius 8px, altura 44–52px; label caps acima.
- Foco: borda cobalto + outline; erro: borda vermelha + mensagem 12px vermelha abaixo
  (ícone material `error` opcional).
- Campo de valor: prefixo "R$" fixo, alinhamento à direita, máscara de vírgula decimal.

### Avatar

Círculo com **iniciais** (duas letras) em fundo pastel derivado determinístico do nome
(hash) e borda 1.5px. Sem fotos (D11). 40px nas listas, 32px em chips.

### Bottom navigation (mobile)

Barra fixa inferior, fundo branco, borda superior 1.5px, 2 itens ativos no MVP:
"Grupos" e "Ajustes" (D13). Item ativo: cobalto + label caps; inativo: grafite suave.

### Modais

Superfície branca, radius 16px, borda 1.5px, sombra dura, título Space Grotesk, botões
primário/secundário, backdrop 50% grafite. Usar modal nativo Angular (`@angular/cdk`
overlay é desnecessário — preferir componente simples), sem futura dependência.

### Lista de despesas (item)

- Linha: descrição (Manrope 600) + data caps à esquerda; valor à direita Space Grotesk 700.
- Sub-linha: avatar do pagador + "pagou" caps; menu "⋯" com editar/excluir.
- Cotas ("Quem divide"): avatares + valor por pessoa em caption.

### Empty state & loading

- Empty: ilustração tipográfica (sem imagens externas), título + 1 frase + CTA
  (ex.: "Nenhum grupo ainda. Crie o primeiro.").
- Loading: skeletons coerentes (blocos cinza creme com pulse) — sem spinners girando
  quando possível.

## 3. Microcopy (pt-BR)

Fonte: `design-spec-racha.md`. Princípios: frases curtas, tom leve mas claro,
nunca prometer função inexistente. Exemplos:

- "Ninguém deve nada por aqui." (banner verde)
- "Este participante tem despesas associadas e não pode ser removido." (texto do 409)
- CTAs: "Criar grupo", "Adicionar", "Salvar despesa", "Excluir".

"racha." no header é placeholder (D14) até a marca final.

## 4. Responsividade (decisão D18)

Base mobile-first com duas media queries:

- **≥768px**: sidebar fixa à esquerda no lugar da bottom nav (links Grupos/Ajustes,
  ativo com fundo verde-limão), header sticky oculto, container mais largo
  (680px), modais como **diálogo centralizado** em vez de bottom sheet, cards de
  grupo em grade `auto-fit`.
- **≥1120px**: container amplo (1160px); detalhe do grupo em **duas colunas**
  (saldos + participantes à esquerda, despesas à direita, cabeçalho atravessando
  o topo); formulário de despesa em duas colunas (valor/descrição | pagador/rateio);
  login como **split** — hero decorativo cobalto ("racha.", tagline em verde-limão)
  à esquerda, card do formulário à direita (marca/tagline do card se ocultam para
  não duplicar).

O nav duplicado no DOM (sidebar e bottom nav) nunca fica visível ao mesmo tempo;
o oculto usa `display: none` e sai da árvore de acessibilidade.

## 5. Tema claro/escuro (decisão D19)

Tema escuro disponível via toggle **Auto / Claro / Escuro** em Ajustes (padrão
"auto" segue o sistema). Toda a paleta escura vive em `src/styles/_tokens.scss`
sob `[data-theme="dark"]`:

| Papel | Claro | Escuro |
| --- | --- | --- |
| canvas | `#fbf9f4` | `#191a17` |
| surface | `#f7f3ea` | `#232420` |
| card | `#ffffff` | `#2b2c26` |
| ink (+bordas/sombras) | `#20211e` | `#f0ecdd` (creme) |
| primary | `#2546f0` | `#7a8cff` |
| cta | `#ff7139` | `#ff7139` (inalterado) |
| positive | `#d9f36a` | `#d9f36a` (inalterado) |
| error | `#d7402b` | `#ef6a52` |

Regras: **nunca** use cinzas/hex literais para superfícies, bordas, hovers,
backdrop ou scrollbar — use os tokens (`--divider`, `--hover-tint`, `--backdrop`,
`--scrollbar-thumb`). O hero do login é decorativo e mantém o cobalto fixo nos
dois temas. O script inline no `index.html` evita flash de tema errado ao recarregar.
