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

- `POST /api/auth/register` `{ email, password }` → `201` `{ id, email, name }`
  (**não cria sessão** — sem cookie; `name` nasce `null`). **Após o 201, o
  frontend executa `POST /api/auth/login` com as mesmas credenciais antes de
  navegar** para qualquer rota autenticada (sem isso a primeira tela falha com
  401 e aparece "Não foi possível carregar seus grupos").
- `400` no cadastro usa corpo `{ errors: [...] }` (descrições do Identity em
  inglês). A tela mapeia para pt-BR **sem vazar o texto cru**: e-mail duplicado
  ("is already taken" na lista) → "Já existe uma conta com este e-mail. Faça
  login."; demais casos → "Verifique os dados informados."
- `POST /api/auth/login` `{ email, password }` → `204` (cookie httpOnly).
- `POST /api/auth/logout` → `204`.
- `GET /api/auth/me` → `200` `{ id, email, name }` (`name` é o nome de exibição opcional da conta), `401` se não autenticado.
- `PUT /api/auth/name` `{ name }` → `204`; nome em branco limpa o valor; >60 chars → `400`.
  Usado em Ajustes ("Nome de exibição") e como prioridade do atalho "Você" no grupo (D21).
- Erros de login: credenciais inválidas (`401`) → "E-mail ou senha incorretos." (texto
  pt-BR local, mesmo com corpo do backend em inglês) ou lockout (`403` após 5 tentativas/15min):
  "Muitas tentativas. Tente novamente em alguns minutos."

### Meus grupos (`/grupos`)

- `GET /api/groups/overviews` (uma única chamada; substitui o antigo N+1 de
  `GET /api/groups` + `balances` por grupo, ver D10) →
  `[ { id, name, createdAtUtc, participantCount, totalPaidInCents } ]`.
  A lista é fonte de nome/id para navegação; `totalPaidInCents` alimenta os chips
  "X pessoa(s)" / "R$ X em despesas" e o banner "Ninguém deve nada por aqui."
  (quando todos os grupos estão com `totalPaidInCents === 0`).
- Criar: `POST /api/groups` `{ name }` → `201 { id }`.
- Renomear: `PUT /api/groups/{id}` `{ name }` → `204`.
- Excluir: `DELETE /api/groups/{id}` → `204`, com modal de confirmação:
  "Excluir grupo e todas as despesas? Isso não pode ser desfeito."
- Nota: **não existe** `GET /api/groups/{id}` — para o header do detalhe, obtenha nome da
  listagem ou do estado de navegação; se vazio (ex.: deep-link), recarregue listagem.
- Botão "Novo grupo" no header da lista; também aparece empty-state.
- **Limite de 10 grupos por usuário (D25)**: ao carregar 10 grupos, o botão
  "Novo grupo" fica desabilitado com tooltip "Você pode ter no máximo 10
  grupos."; se um 400 de limite chegar mesmo assim, o modal traduz:
  "Você pode ter no máximo 10 grupos."

### Detalhe do grupo (`/grupos/:id`)

Carregar em paralelo:

- `GET /api/groups/{id}/participants` → `[ { id, name, createdAtUtc } ]`.
- `GET /api/groups/{id}/balances` (card "Saldos") →
  `[ { participantId, totalPaidInCents, totalOwedInCents, totalReceivedInCents,
       totalSentInCents, balanceInCents } ]`.
- `GET /api/groups/{id}/expenses` →
  `[ { id, description, totalAmountInCents, payerParticipantId,
       shares: [ { participantId, amountInCents } ], createdAtUtc } ]`.
- `GET /api/groups/{id}/payments` →
  `[ { id, payerParticipantId, receiverParticipantId, amountInCents, createdAtUtc } ]`.
- `GET /api/groups/{id}/settlement-plan` →
  `[ { fromParticipantId, toParticipantId, amountInCents } ]`.

Renderização:

- Header: nome do grupo + botões "Adicionar despesa" (primário) e menu "⋯"
  (renomear, excluir grupo).
- Card de saldos: por participante — "Pagou R$ X" (totalPaid) e saldo colorido
  (verde positivo / vermelho negativo, tabular-nums). Banner limão
  "Ninguém deve nada por aqui." quando todos os saldos são 0.
- Botão "+ Pagamento" na seção Saldos abre o modal de acerto; ver seção Pagamentos (D23).
- Botão "copiar" na seção Saldos copia o texto pt-BR dos saldos
  ("Saldos — Grupo\nRenata: Recebe R$ 80,00\nLucas: Deve R$ 80,00") (D24).
- "Como acertar" (D23): quando o settlement-plan não está vazio, card com a
  sugestão de transferências ("Devedor → Credor **R$ X**"), botão "Registrar"
  por linha que abre o modal de pagamento pré-preenchido (pagador, receptor e
  valor em BRL, ex. "80,00") e botão "copiar" que copia o plano em texto
  ("Como acertar — Grupo\nLucas → Renata: R$ 80,00") (D24).
- Pagamentos (D23): seção própria quando `payments.length > 0` — lista
  "Pagador → Receptor", valor + data curta e ação de excluir
  (`DELETE /api/groups/{id}/payments/{paymentId}` → `204`, confirm modal,
  saldos recalculados).
- Modal de pagamento (D23): campos "Quem pagou" e "Para quem" (selects de
  participantes) e "Valor" (texto BRL; conversão por `parseAmountInputToCents`).
  Envia `POST /api/groups/{id}/payments`
  `{ payerParticipantId, receiverParticipantId, amountInCents }` → `201 { id }`;
  em seguida silent refresh. Erros: campos vazios/iguais → mensagem local
  ("Escolha quem paga, para quem e um valor válido." / "Quem paga e quem recebe
  devem ser pessoas diferentes."); validação de domínio (400) usa o texto do
  backend; ESC fecha o modal.
- Despesas: ver item de lista em `design-system.md`. Menu por despesa: "Editar",
  "Excluir" (confirm modal; `DELETE /api/groups/{id}/expenses/{expenseId}` → `204`; sem reload
  total — remover item e recarregar balances).
- Participantes: listar em seção própria (nome caps chip + ações); adicionar
  `POST /api/groups/{id}/participants` `{ name }` → `201 { id }`;
  remover `DELETE /api/groups/{id}/participants/{participantId}` → `204`.
- **Remoção de participante com histórico (D22)** — o backend recalcula:
  despesas pagas por ele são excluídas, as cotas dele são redistribuídas entre os
  restantes e os pagamentos que o envolvem são excluídos (D23); despesas que
  ficassem sem participantes na divisão também são excluídas.
  O modal de confirmação avisa quando o participante é referenciado por despesas:
  "Remover X? Despesas pagas por X serão excluídas e as cotas serão recalculadas
  entre os restantes." (mensagem simples "Remover X do grupo?" quando não referenciado).
  Após remover, recarregar participants/expenses/balances/payments/settlement-plan.
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
- **Pagador entra no rateio automaticamente (D24)**: ao escolher o pagador, ele
  passa a estar selecionado em "Dividir igualmente" (pode ser desmarcado depois).
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
| `409` | mensagem do `error` do corpo (regra de domínio conflituosa) |
| rede/0 | "Não foi possível conectar. Verifique sua internet." |

## Microcopy global

- Botão despesa primário: "Adicionar despesa" (header FAB-like), salvar: "Salvar despesa".
- Confirmação de exclusão de despesa: "Excluir despesa 'X'? Os saldos serão recalculados."
- Placeholder de valor: "0,00" com prefixo R$ fixo.
