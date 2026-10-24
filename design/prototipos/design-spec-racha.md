# Design System — Racha: Bold & Playful Editorial
Documento de especificação de design (`DESIGN.md`) consolidado para as telas do aplicativo mobile-first **Racha** (Gestão de Despesas em Grupo), abrangendo:
- **Autenticação** (`SCREEN_5`)
- **Meus Grupos** (`SCREEN_21`)
- **Detalhes do Grupo** (`SCREEN_11` / `SCREEN_35`)
- **Nova Despesa** (`SCREEN_9`)
- **Editar Despesa** (`SCREEN_7`)

---

## 1. Visão Geral e Identidade da Marca
- **Nome do Produto:** Racha (`rachaae`)
- **Conceito:** *Bold & Playful Editorial* — Uma abordagem editorial, expressiva, jovem e descontraída, rompendo com o visual asséptico e burocrático de SaaS tradicional e apps bancários convencionais.
- **Princípio Central:** Clareza matemática absoluta na divisão de centavos combinada com personalidade gráfica marcante, microinterações táteis e composições com forte hierarquia tipográfica.

---

## 2. Paleta de Cores (Color Tokens)

### 2.1 Cores Primárias e da Marca
| Token | HEX | Função / Uso |
|---|---|---|
| `color-brand-blue` | `#2546F0` | **Azul-Cobalto:** Identidade primária da marca, logotipo, seleções ativas de pagador, abas selecionadas. |
| `color-brand-orange` | `#FF7139` | **Laranja Vibrante:** Ações primárias e CTAs de conversão (`Criar Conta`, `+ Criar novo grupo`, `+ Nova Despesa`, `Salvar Despesa`). |
| `color-accent-lime` | `#D9F36A` | **Verde-Limão:** Pílulas de destaque contextual, badges informativos (ex: `4 amigos`, `Ritual #04`, destaques de saldo). |
| `color-text-main` | `#20211E` | **Grafite Profundo:** Textos principais, títulos, rótulos e elementos de alto contraste (substitui o preto puro). |
| `color-bg-canvas` | `#F7F3EA` / `#FBF9F4` | **Creme Editorial:** Fundo predominante da aplicação que evoca papel impresso contemporâneo e conforto visual. |
| `color-surface-pure` | `#FFFFFF` | **Branco Puro:** Containers internos de destaque, cartões funcionais, fundos de inputs. |

### 2.2 Cores Semânticas e de Status Financeiro
| Token | HEX | Aplicação |
|---|---|---|
| `color-positive-bg` | `#EBF9D4` / `#D9F36A` | Fundo para valores a receber / saldo positivo. |
| `color-positive-text` | `#2D6A14` / `#166534` | Texto para quantias a receber (`+ R$ 142,50`). |
| `color-negative-bg` | `#FFEFEA` / `#FEE2E2` | Fundo para valores a pagar / saldo devedor. |
| `color-negative-text` | `#C2410C` / `#B91C1C` | Texto para quantias a pagar (`- R$ 38,00`, `- R$ 92,50`). |
| `color-neutral-settled` | `#F3F4F6` | Tag neutra de grupo quitado (`Tudo quitado ✓`). |
| `color-danger` | `#DC2626` | Ações destrutivas (`Excluir esta despesa`, `Excluir grupo`). |

---

## 3. Tipografia (Typography System)

### 3.1 Famílias Tipográficas
- **Principal (Títulos, Valores e Badges):** `Space Grotesk` (Google Fonts), sans-serif geométrica expressiva.
- **Secundária / Fallback (Textos corridos e dados densos):** `Inter` ou `Manrope`, sans-serif neutra com legibilidade otimizada para telas pequenas.

### 3.2 Escala e Hierarquia
- **Display Hero (Logotipo & Boas-vindas):** `32px` – `36px` | Weight: `700` (Bold) | Line Height: `1.1` | Letter Spacing: `-0.03em`
  - Exemplo: *"Sua galera. Suas contas."*
- **Monetary Display (Valores principais):** `28px` – `34px` | Weight: `700` (Bold) | Tabular Figures
  - Exemplo: `R$ 280,00` ou `+ R$ 142,50`
- **Heading 1 (Títulos de Seção e Grupos):** `20px` – `24px` | Weight: `700` (Bold) | Line Height: `1.2`
  - Exemplo: *"Viagem para Ubatuba"*, *"Saldos da Galera"*
- **Heading 2 / Subtítulos:** `16px` – `18px` | Weight: `600` (SemiBold)
- **Body Regular:** `14px` – `15px` | Weight: `400` / `500` | Line Height: `1.4`
- **Micro-labels / Eyebrows / Badges:** `11px` – `12px` | Weight: `700` | Text Transform: `uppercase` | Letter Spacing: `+0.06em`
  - Exemplo: `QUEM PAGOU A CONTA?`, `VALOR TOTAL`, `DIVIDIR IGUALMENTE ENTRE`

---

## 4. Geometria, Espaçamento e Superfícies

### 4.1 Raios de Borda (`border-radius`)
- **Containers e Cartões Principais:** `16px` – `20px` (`rounded-2xl`)
- **Botões de Ação (CTAs):** `14px` – `16px` (`rounded-xl`)
- **Pílulas, Badges e Tags:** `9999px` (`rounded-full`)
- **Inputs e Campos de Formulário:** `12px` – `14px` (`rounded-lg` / `rounded-xl`)
- **Avatares dos Participantes:** `9999px` (Círculos perfeitos com iniciais expressivas em bold)

### 4.2 Elevação e Sombras
- **Estilo:** *Low-elevation / Flat-tactile*.
- **Evitar:** Sombras difusas e pesadas típicas de neumorphism ou glassmorphism.
- **Uso:** Sombras sutis e definidas (`box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05)`) ou bordas finas com contraste calculado (`1.5px solid rgba(32, 33, 30, 0.08)`).

### 4.3 Grid e Espaçamento Mobile
- **Padding Lateral da Tela:** `16px` a `20px` (garantindo respiro visual uniforme).
- **Ritmo Vertical:** Múltiplos de `4px` e `8px` (`8px`, `12px`, `16px`, `24px`, `32px`).
- **Áreas Mínimas de Toque:** Mínimo de `48px` × `48px` para botões e chips interativos.

---

## 5. Padrões de Componentes

### 5.1 Botões (Buttons & Actions)
- **Primary Action (CTA):** Fundo Laranja Vibrante (`#FF7139`), texto Branco (`#FFFFFF`), tipografia bold em caixa alta ou capitalizada, altura `52px`–`54px`, cantos `14px`.
- **Secondary / Ghost Action:** Fundo Creme Neutro ou Transparente com contorno sutil, texto Grafite ou Azul.
- **Destructive Action:** Texto Vermelho (`#DC2626`) com ícone de lixeira, posicionado de forma isolada para prevenir acidentes.

### 5.2 Chips de Seleção de Participante (Pagador)
- **Estado Inativo:** Fundo Branco ou Creme Claro, borda neutra, avatar discreto, nome do participante em texto cinza/grafite.
- **Estado Ativo (Selecionado):** Fundo Azul-Cobalto (`#2546F0`), texto branco, badge de confirmação com checkmark alaranjado ou branco.

### 5.3 Itens da Lista de Divisão (Cotas)
- Checkbox quadrado arredondado ou pill com check.
- Nome do participante, papel/contexto (ex: *"Você"*, *"Mestre da brasa"*).
- Valor exato calculado em centavos inteiros alinhado à direita em negrito (`R$ 45,00`).

### 5.4 Top Bar & Bottom Navigation
- **Top Bar (Stack Screens):** Ícone de voltar (`arrow-left`), título da tela centralizado ou à esquerda em uppercase reduzido (`EDITAR DESPESA`, `NOVA DESPESA`), botão de perfil ou menu de três pontos à direita.
- **Bottom Navigation (Tab Screens):** Três destinos essenciais: `Grupos` (ativo), `Atividade`, `Ajustes`, com ícones minimalistas e rótulos concisos.

---

## 6. Regras de Negócio e Consistência de Dados Refletidas no Design
1. **Centavos Exatos e Determinísticos:** Todas as cotas e saldos são exibidos em valores redondos ou com duas casas decimais fixas (ex: `R$ 33,34`, `R$ 33,33`), demonstrando visualmente a ausência de discrepâncias de arredondamento.
2. **Independência de Contas:** Participantes são identificados por avatares com nomes e cores próprias no contexto do grupo, sem necessidade de e-mail cadastrado ou conta ativa para os demais integrantes.
3. **Equilíbrio Financeiro Transparente:** O balanço geral do grupo e a soma de saldos individuais resultam em zero exato, evidenciado pela sinalização simétrica de valores positivos (*a receber*) e negativos (*a pagar*).
