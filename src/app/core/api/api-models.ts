// Modelos espelham os contratos do backend (GroupExpenseManagement.Api/Contracts).
// JSON é camelCase. Dinheiro é sempre centavos inteiros.

export interface AuthUser {
  id: string;
  email: string;
  /** Nome de exibição opcional (definido em Ajustes); null quando não definido. */
  name: string | null;
}

export interface GroupSummary {
  id: string;
  name: string;
  createdAtUtc: string;
}

export interface CreateGroupResponse {
  id: string;
}

export interface GroupBalance {
  participantId: string;
  totalPaidInCents: number;
  totalOwedInCents: number;
  balanceInCents: number;
}

export interface Participant {
  id: string;
  name: string;
  createdAtUtc: string;
}

export interface AddParticipantResponse {
  id: string;
}

export interface ExpenseShare {
  participantId: string;
  amountInCents: number;
}

export interface Expense {
  id: string;
  description: string;
  totalAmountInCents: number;
  payerParticipantId: string;
  shares: ExpenseShare[];
  createdAtUtc: string;
}

export interface CreateExpenseResponse {
  id: string;
}

export interface ExpensePayload {
  description: string;
  totalAmountInCents: number;
  payerParticipantId: string;
  participantIds: string[];
}

export interface AuthPayload {
  email: string;
  password: string;
}
