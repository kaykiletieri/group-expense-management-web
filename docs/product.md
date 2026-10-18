# produto — Frontend

## Visão

Aplicação web mobile-first em pt-BR para organizar despesas compartilhadas em grupos:
criar grupos, cadastrar pessoas, registrar despesas com pagador e participantes do rateio
e consultar saldos. O nome "racha." usado nos protótipos é **provisório** — não considere
marca-final em decisões de código (identificadores em inglês permanecem neutros).

## Persona

Usuário comum administrando rachas no celular (viagens, contas de casa, eventos).
Usa a aplicação em Poucas sessões curtas: criar grupo, lançar despesa, conferir quem deve o quê.

## Escopo do MVP (frontend)

1. Cadastro, login e logout (conta única por e-mail; auxiliar de força de senha é cosmético).
2. Lista "Meus grupos" com balanço geral calculado no cliente.
3. Criar grupo (só nome), renomear e excluir grupo.
4. Detalhe do grupo: card de saldos por participante, lista de despesas, gestão de participantes.
5. Nova despesa / editar despesa (valor, descrição, pagador, rateio igualitário).
6. Excluir despesa.
7. Pagamentos (acertos): registrar pagador → receptor com valor livre, lista e exclusão; plano "Como acertar" sugerido (D23).
8. Menu "Ajustes" mínimo (conta logada, sair).

## Fora de escopo (não antecipar)

Ver seção 9 de `../AGENTS.md`: confirmação/comprovante de transferências reais, notificações, divisões
personalizadas, categorias de grupo, fotos/avatares de participantes, colaboração
multiusuário, compartilhamento de grupo entre contas.

## Posicionamento dos dados

- A UI nunca recalcula rateio/saldos; apresenta o que o backend retorna.
- Preview de rateio no formulário é aproximação por divisão simples (total ÷ participantes,
  formatação truncada), rotulada como estimativa — o valor definitivo vem do backend.
- Participante não precisa de conta; não há vínculo User↔Participant.

## Aderência aos protótipos

Layout, componentes e microcopy seguem `../design/prototipos/`, com as exceções
decididas em `decisions.md` (D10–D14): sem categorias de grupo, sem feed "Atividade",
sem prova social fictícia, avatares por iniciais.
