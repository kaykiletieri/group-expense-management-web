# UI Spec — rotas, telas, contratos e mensagens

Fonte visual: `../design/prototipos/`. Contratos JSON são camelCase; criação retorna `{ id }`.

## Rotas

| Rota | Tela | Protegida | Protótipo de referência |
|---|---|---|---|
| `/login` | Login + cadastro (tabs) | pública | `autentica_o_bold_playful_code.html` |
| `/grupos` | Meus grupos + balanço geral | sim | `meus_grupos_bold_playful_code.html` |
| `/grupos/novo` | Criar grupo (modal-style) | sim | — |
| `/grupos/:id` | Detalhe do grupo | sim | `detalhes_do_grupo_...html` |
| `/grupos/:id/despesas/nova` | Nova despesa | sim | `nova_despesa_...html` |
| `/grupos/:id/despesas/:expenseId/editar` | Editar despesa | sim | `editar_despesa_...html` |
| `/ajustes` | Conta, sair | sim | — |

Grupo criado → navegar para `/grupos/:id`. Grupo excluído → `/grupos`.

## Contratos de API por tela

### Auth

- `POST /api/auth/register` `{ email, password }` → `201` `{ id, email, name }` (já autentica, cookie setado; `name` nasce `null`).
- `POST /api/auth/login` `{ email, password }` → `200` `{ id, email, name }` (cookie).
- `POST /api/auth/logout` → `204`.
- `GET /api/auth/me` → `200` `{ id, email, name }` (`name` é o nome de exibição opcional da conta), `401` se não autenticado.
- `PUT /api/auth/name` `{ name }` → `204`; nome em branco limpa o valor; >60 chars → `400`.
  Usado em Ajustes ("Nome de exibição") e como prioridade do atalho "Você" no grupo (D21).
- Erros de login: credenciais inválidas ou lockout (`403` após 5 tentativas/15min) → mensagem
  única neutra: "E-mail ou senha incorretos." / para 403: "Muitas tentativas. Tente novamente em alguns minutos."

### Meus grupos (`/grupos`)

- `GET /api/groups` → `[ { id, name, createdAtUtc } ]`.
- Saldo geral (D10): para cada grupo, `GET /api/groups/{id}/balances` →
  `[ { participantId, totalPaidInCents, totalOwedInCents, balanceInCents } ]`;
  somar `totalPaidInCents` (ou `balanceInCents`, conforme elemento visual) no cliente:
  banner "Ninguém deve nada por aqui." quando a soma dos saldos == 0.
- Criar: `POST /api/groups` `{ name }` → `201 { id }`.
- Renomear: `PUT /api/groups/{id}` `{ name }` → `204`.
- Excluir: `DELETE /api/groups/{id}` → `204`, com modal de confirmação:
  "Excluir grupo e todas as despesas? Isso não pode ser desfeito."
- Nota: **não existe** `GET /api/groups/{id}` — para o header do detalhe, obtenha nome da
  listagem ou do estado de navegação; se vazio (ex.: deep-link), recarregue listagem.
- Botão "Novo grupo" no header da lista; também aparece empty-state.

### Detalhe do grupo (`/grupos/:id`)

Carregar em paralelo:

- `GET /api/groups/{id}/participants` → `[ { id, name, createdAtUtc } ]`.
- `GET /api/groups/{id}/balances` (card "Saldos").
- `GET /api/groups/{id}/expenses` →
  `[ { id, description, totalAmountInCents, payerParticipantId,
       shares: [ { participantId, amountInCents } ], createdAtUtc } ]`.

Renderização:

- Header: nome do grupo + botões "Adicionar despesa" (primário) e menu "⋯"
  (renomear, excluir grupo).
- Card de saldos: por participante — "Pagou R$ X" (totalPaid) e saldo colorido
  (verde positivo / vermelho negativo, tabular-nums). Banner limão
  "Ninguém deve nada por aqui." quando todos os saldos são 0.
- Despesas: ver item de lista em `design-system.md`. Menu por despesa: "Editar",
  "Excluir" (confirm modal; `DELETE /api/groups/{id}/expenses/{expenseId}` → `204`; sem reload
  total — remover item e recarregar balances).
- Participantes: listar em seção própria (nome caps chip + ações); adicionar
  `POST /api/groups/{id}/participants` `{ name }` → `201 { id }`;
  remover `DELETE /api/groups/{id}/participants/{participantId}` → `204`.
- **409 ao remover participante com despesas** — mensagem em modal/inline:
  "Este participante tem despesas associadas e não pode ser removido."
- Estados: loading (skeletons), erro 404 → tela "Grupo não encontrado" com voltar;
  sem despesas → empty state "Nenhuma despesa por aqui ainda."

### Nova / Editar despesa

Payload comum: `{ description, totalAmountInCents, payerParticipantId, participantIds }`
em `POST /api/groups/{id}/expenses` (201 `{ id }`) e
`PUT /api/groups/{id}/expenses/{expenseId}` (204).

- Campos: Descrição (max ~120), Valor (R$, 2 decimais, centrado em centavos),
  Pagador (chips de participantes, único), estilo "Pagador Único" (D-style),
  sessão "Dividir igualmente" — chips multi-seleção dos participantes (mín. 1),
  preview "R$ total ÷ N = ~R$ k" rotulado "estimativa" (D: backend decide centavos finais).
- Editar pré-carrega com `GET /api/groups/{id}/expenses` e encontra o expense por id
  (não há GET unitário de despesa).
- Validação cliente: descrição obrigatória, valor > 0, pagador obrigatório,
  ≥ 1 participante; regras de domínio (mesmo grupo, sem duplicado) são do backend —
  se 400 chegar, mostrar mensagem do corpo.
- Cancelar (voltar) com dados não salvos: confirm? MVP: sair apenas (sem bloqueio) —
  documentado como decisão leve.

### Ajustes

- Mostrar e-mail (de `/api/auth/me`), botão "Sair" (`POST /api/auth/logout` → `/login`),
  e apontar "Termos" para nada/esta etapa omitida (D14 — sem inventar página).

## Matriz de mensagens central (interceptor)

| Status | Tratamento |
|---|---|
| `401` | redirecionar para `/login` (exceto rotas públicas); sem toast se redirect |
| `403` (login) | "Muitas tentativas. Tente novamente em alguns minutos." |
| `404` | tela/estado local "não encontrado" (não revelar existência) |
| `400` | mensagem do `error` do corpo no formulário/seção |
| `409` | mensagem do `error` do corpo (ex. participante com despesas) |
| rede/0 | "Não foi possível conectar. Verifique sua internet." |

## Microcopy global

- Botão despesa primário: "Adicionar despesa" (header FAB-like), salvar: "Salvar despesa".
- Confirmação de exclusão de despesa: "Excluir despesa 'X'? Os saldos serão recalculados."
- Placeholder de valor: "0,00" com prefixo R$ fixo.
