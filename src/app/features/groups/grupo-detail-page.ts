import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { GroupsApi } from '../../core/api/groups-api';
import { ParticipantsApi } from '../../core/api/participants-api';
import { ExpensesApi } from '../../core/api/expenses-api';
import { PaymentsApi } from '../../core/api/payments-api';
import {
  Expense,
  GroupBalance,
  Participant,
  Payment,
  SettlementTransfer,
} from '../../core/api/api-models';
import { getApiErrorMessage } from '../../core/api/api-error';
import { formatBrl, parseAmountInputToCents } from '../../core/money/money';
import { AuthService } from '../../core/auth/auth.service';
import { Avatar } from '../../shared/ui/avatar';
import { copyToClipboard } from '../../core/clipboard/copy-text';
import { Title } from '@angular/platform-browser';

const GENERIC_ERROR = 'Não foi possível conectar. Verifique sua internet.';

interface ConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  action: () => Promise<void>;
}

const shortDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });

@Component({
  selector: 'app-grupo-detail-page',
  imports: [RouterLink, ReactiveFormsModule, Avatar],
  templateUrl: './grupo-detail-page.html',
  styleUrl: './grupo-detail-page.scss',
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class GrupoDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly groupsApi = inject(GroupsApi);
  private readonly participantsApi = inject(ParticipantsApi);
  private readonly expensesApi = inject(ExpensesApi);
  private readonly paymentsApi = inject(PaymentsApi);
  private readonly auth = inject(AuthService);
  private readonly title = inject(Title);

  protected readonly formatBrl = formatBrl;

  readonly groupId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly notFound = signal(false);

  readonly groupName = signal('');
  readonly participants = signal<Participant[]>([]);
  readonly expenses = signal<Expense[]>([]);
  readonly balances = signal<GroupBalance[]>([]);
  readonly payments = signal<Payment[]>([]);
  readonly settlementPlan = signal<SettlementTransfer[]>([]);

  readonly menuOpen = signal(false);
  readonly confirmState = signal<ConfirmState | null>(null);
  readonly renameOpen = signal(false);
  readonly submitting = signal(false);
  readonly actionError = signal<string | null>(null);

  readonly paymentOpen = signal(false);
  readonly paymentError = signal<string | null>(null);

  /** Id do bloco recém-copiado ("balances", "plan", "expense-<id>") para
      mostrar o ícone de confirmação por alguns segundos. */
  readonly copied = signal<string | null>(null);
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;

  readonly newName = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(80)],
  });
  readonly participantNameControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(60)],
  });

  /** Formulário do modal de pagamento: quem paga → para quem → quanto. */
  readonly payerControl = new FormControl<string>('', { nonNullable: true });
  readonly receiverControl = new FormControl<string>('', { nonNullable: true });
  readonly amountControl = new FormControl('', { nonNullable: true });

  readonly participantNames = computed(
    () => new Map(this.participants().map((p) => [p.id, p.name] as const)),
  );

  /** Nome usado no atalho "Você": prioriza o nome de exibição salvo da conta;
      sem nome, deriva da parte local do e-mail. Sem vínculo User↔Participant. */
  readonly yourName = computed<string | null>(() => {
    const user = this.auth.user();
    if (!user) {
      return null;
    }
    const savedName = user.name?.trim();
    if (savedName) {
      return savedName;
    }
    const local = user.email.split('@')[0]?.toLowerCase().trim() ?? '';
    if (!local) {
      return null;
    }
    return local.charAt(0).toUpperCase() + local.slice(1);
  });

  /** Identificação da conta logada para o avatar do header (nome ou e-mail). */
  readonly userLabel = computed(() => {
    const user = this.auth.user();
    if (!user) return '?';
    return user.name?.trim() || user.email.split('@')[0] || '?';
  });

  /** Mês/ano corrente para o selo do cartão do grupo (pt-BR). */
  readonly monthLabel = new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: 'numeric',
  })
    .format(new Date())
    .replace(' de ', ' ')
    .toUpperCase();

  /** Botão "Você": esconde quando não há conta válida ou nome já está no grupo. */
  readonly youAlreadyIn = computed(() => {
    const name = this.yourName();
    if (!name) {
      return true;
    }
    const mine = name.toLowerCase();
    return this.participants().some((p) => p.name.trim().toLowerCase() === mine);
  });

  ngOnInit(): void {
    void this.refresh();
  }

  onEscape() {
    if (this.confirmState()) {
      this.closeConfirm();
    }
    if (this.renameOpen()) {
      this.renameOpen.set(false);
    }
    if (this.paymentOpen()) {
      this.closePayment();
    }
    this.menuOpen.set(false);
  }

  participantName(id: string): string {
    return this.participantNames().get(id) ?? '—';
  }

  totalSpent(): number {
    return this.expenses().reduce((sum, expense) => sum + expense.totalAmountInCents, 0);
  }

  hasHistory(): boolean {
    return this.balances().some((b) => b.totalPaidInCents > 0);
  }

  nobodyOwes(): boolean {
    return (
      this.expenses().length === 0 &&
      this.balances().every((b) => b.balanceInCents === 0)
    );
  }

  dateShort(iso: string): string {
    return shortDate.format(new Date(iso)).replace('.', '');
  }

  shareEstimate(expense: Expense): string {
    const count = expense.shares.length;
    if (count === 0) {
      return '';
    }
    const exact = expense.totalAmountInCents % count === 0;
    const amount = Math.floor(expense.totalAmountInCents / count);
    return exact ? formatBrl(amount) : `≈ ${formatBrl(amount)}`;
  }

  getExpenseCategoryIcon(expense: Expense): string {
    const desc = expense.description.toLowerCase();
    if (desc.includes('mercad') || desc.includes('supermercad') || desc.includes('comida') || desc.includes('bebida') || desc.includes('grocery')) return 'local_grocery_store';
    if (desc.includes('restaurante') || desc.includes('jantar') || desc.includes('almoco') || desc.includes('almoço') || desc.includes('comida') || desc.includes('quiosque') || desc.includes('frutos')) return 'restaurant';
    if (desc.includes('pedágio') || desc.includes('pedagio') || desc.includes('combust') || desc.includes('gasolina') || desc.includes('posto') || desc.includes('uber') || desc.includes('transporte')) return 'local_gas_station';
    if (desc.includes('hotel') || desc.includes('pousada') || desc.includes('hospedagem') || desc.includes('airbnb')) return 'hotel';
    if (desc.includes('uber') || desc.includes('taxi') || desc.includes('99') || desc.includes('carona')) return 'directions_car';
    if (desc.includes('mercado') || desc.includes('supermercado') || desc.includes('feira')) return 'shopping_cart';
    return 'receipt_long';
  }

  getExpenseCategoryColor(expense: Expense): string {
    const desc = expense.description.toLowerCase();
    if (desc.includes('mercad') || desc.includes('supermercad') || desc.includes('comida') || desc.includes('bebida') || desc.includes('grocery')) return 'surface-container-high';
    if (desc.includes('restaurante') || desc.includes('jantar') || desc.includes('almoco') || desc.includes('almoço') || desc.includes('comida') || desc.includes('quiosque') || desc.includes('frutos')) return 'secondary-fixed';
    if (desc.includes('pedágio') || desc.includes('pedagio') || desc.includes('combust') || desc.includes('gasolina') || desc.includes('posto') || desc.includes('uber') || desc.includes('transporte')) return 'surface-container-high';
    if (desc.includes('hotel') || desc.includes('pousada') || desc.includes('hospedagem') || desc.includes('airbnb')) return 'primary-fixed';
    return 'surface-container-high';
  }

  getExpenseCategoryTextColor(expense: Expense): string {
    const desc = expense.description.toLowerCase();
    if (desc.includes('restaurante') || desc.includes('jantar') || desc.includes('almoco') || desc.includes('almoço') || desc.includes('comida') || desc.includes('quiosque') || desc.includes('frutos')) return 'on-secondary-fixed';
    if (desc.includes('hotel') || desc.includes('pousada') || desc.includes('hospedagem') || desc.includes('airbnb')) return 'on-primary-fixed';
    return 'primary';
  }

  getGroupCategory(name: string): { label: string; color: string; textColor: string; icon: string } {
    const lower = name.toLowerCase();
    if (lower.includes('praia') || lower.includes('viagem') || lower.includes('ubatuba') || lower.includes('ferias') || lower.includes('férias')) {
      return { label: 'PRAIA & FÉRIAS', color: 'tertiary-fixed', textColor: 'on-tertiary-fixed', icon: 'calendar_month' };
    }
    if (lower.includes('churrasco') || lower.includes('bbq') || lower.includes('carne') || lower.includes('final de semana') || lower.includes('fim de semana')) {
      return { label: 'FINAL DE SEMANA', color: 'secondary-fixed', textColor: 'on-secondary-fixed', icon: 'calendar_month' };
    }
    if (lower.includes('apê') || lower.includes('ape') || lower.includes('casa') || lower.includes('apto') || lower.includes('moradia') || lower.includes('despesas fixas')) {
      return { label: 'DESPESAS FIXAS', color: 'surface-container-high', textColor: 'on-surface-variant', icon: 'calendar_month' };
    }
    if (lower.includes('serra') || lower.includes('montanha') || lower.includes('natureza') || lower.includes('planejamento')) {
      return { label: 'EM PLANEJAMENTO', color: 'surface-container-high', textColor: 'on-surface-variant', icon: 'calendar_month' };
    }
    return { label: 'GRUPO', color: 'surface-container-high', textColor: 'on-surface-variant', icon: 'calendar_month' };
  }

  confirmDeleteGroup() {
    this.menuOpen.set(false);
    this.confirmState.set({
      title: 'Excluir grupo',
      message: `Excluir "${this.groupName()}" e todas as despesas? Isso não pode ser desfeito.`,
      confirmLabel: 'Excluir grupo',
      action: async () => {
        await firstValueFrom(this.groupsApi.delete(this.groupId));
        await this.router.navigate(['/grupos']);
      },
    });
  }

  confirmRename() {
    this.menuOpen.set(false);
    this.newName.setValue(this.groupName());
    this.renameOpen.set(true);
  }

  submitRename() {
    this.newName.markAsTouched();
    const name = this.newName.value.trim();
    if (!name) {
      return;
    }

    this.submitting.set(true);
    this.actionError.set(null);
    this.groupsApi.rename(this.groupId, name).subscribe({
      next: () => {
        this.submitting.set(false);
        this.groupName.set(name);
        this.renameOpen.set(false);
      },
      error: (err) => {
        this.submitting.set(false);
        this.actionError.set(getApiErrorMessage(err, GENERIC_ERROR));
      },
    });
  }

  addParticipant() {
    const name = this.participantNameControl.value.trim();

    this.participantNameControl.reset('');
    this.participantsApi.add(this.groupId, name).subscribe({
      next: () => void this.refresh({ silent: true }),
      error: (err) => {
        this.actionError.set(getApiErrorMessage(err, GENERIC_ERROR));
        this.participantNameControl.setValue(name);
      },
    });
  }

  /** Atalho: adiciona a própria pessoa como participante (nome derivado do e-mail). */
  addYou() {
    const name = this.yourName();
    if (!name) {
      return;
    }
    this.participantsApi.add(this.groupId, name).subscribe({
      next: () => void this.refresh({ silent: true }),
      error: (err) => {
        this.actionError.set(getApiErrorMessage(err, GENERIC_ERROR));
      },
    });
  }

  confirmDeleteParticipant(participant: Participant) {
    // O backend recalcula tudo ao remover: despesas pagas por ele são
    // excluídas e as cotas dele são redistribuídas entre os restantes.
    const referenced = this
      .expenses()
      .some(
        (expense) =>
          expense.payerParticipantId === participant.id ||
          expense.shares.some((share) => share.participantId === participant.id),
      );
    this.confirmState.set({
      title: 'Remover participante',
      message: referenced
        ? `Remover ${participant.name}? Despesas pagas por ${participant.name} serão excluídas e as cotas serão recalculadas entre os restantes.`
        : `Remover ${participant.name} do grupo?`,
      confirmLabel: 'Remover',
      action: async () => {
        try {
          await firstValueFrom(
            this.participantsApi.delete(this.groupId, participant.id),
          );
          this.actionError.set(null);
        } catch (err) {
          throw new Error(
            getApiErrorMessage(err, `Não foi possível remover ${participant.name}.`),
          );
        }
        await this.refresh({ silent: true });
      },
    });
  }

  confirmDeleteExpense(expense: Expense) {
    this.confirmState.set({
      title: 'Excluir despesa',
      message: `Excluir "${expense.description}"? Os saldos serão recalculados.`,
      confirmLabel: 'Excluir',
      action: async () => {
        await firstValueFrom(this.expensesApi.delete(this.groupId, expense.id));
        await this.refresh({ silent: true });
      },
    });
  }

  runConfirm() {
    const confirm = this.confirmState();
    if (!confirm) {
      return;
    }
    this.submitting.set(true);
    this.actionError.set(null);
    confirm
      .action()
      .then(() => {
        this.submitting.set(false);
        this.confirmState.set(null);
      })
      .catch((err: unknown) => {
        this.submitting.set(false);
        this.actionError.set(
          err instanceof Error ? err.message : GENERIC_ERROR,
        );
      });
  }

  closeConfirm() {
    this.confirmState.set(null);
    this.actionError.set(null);
  }

  openPayment(prefill?: { payerId?: string; receiverId?: string; amountInCents?: number }) {
    this.paymentError.set(null);
    this.payerControl.setValue(prefill?.payerId ?? '');
    this.receiverControl.setValue(prefill?.receiverId ?? '');
    const cents = prefill?.amountInCents;
    this.amountControl.setValue(
      cents !== undefined ? (cents / 100).toFixed(2).replace('.', ',') : '',
    );
    this.paymentOpen.set(true);
  }

  closePayment() {
    this.paymentOpen.set(false);
    this.paymentError.set(null);
    this.payerControl.setValue('');
    this.receiverControl.setValue('');
    this.amountControl.setValue('');
  }

  submitPayment() {
    const payerId = this.payerControl.value;
    const receiverId = this.receiverControl.value;
    const amountInCents = parseAmountInputToCents(this.amountControl.value);

    if (!payerId || !receiverId || amountInCents === null) {
      this.paymentError.set('Escolha quem paga, para quem e um valor válido.');
      return;
    }
    if (payerId === receiverId) {
      this.paymentError.set('Quem paga e quem recebe devem ser pessoas diferentes.');
      return;
    }

    this.submitting.set(true);
    this.paymentsApi.create(this.groupId, { payerParticipantId: payerId, receiverParticipantId: receiverId, amountInCents }).subscribe({
      next: async () => {
        this.submitting.set(false);
        this.closePayment();
        this.actionError.set(null);
        await this.refresh({ silent: true });
      },
      error: (err) => {
        this.submitting.set(false);
        this.paymentError.set(getApiErrorMessage(err, GENERIC_ERROR));
      },
    });
  }

  confirmDeletePayment(payment: Payment) {
    this.confirmState.set({
      title: 'Excluir pagamento',
      message: `Excluir o pagamento de ${this.participantName(payment.payerParticipantId)} para ${this.participantName(payment.receiverParticipantId)} (${formatBrl(payment.amountInCents)})? Os saldos serão recalculados.`,
      confirmLabel: 'Excluir',
      action: async () => {
        await firstValueFrom(this.paymentsApi.delete(this.groupId, payment.id));
        await this.refresh({ silent: true });
      },
    });
  }

  /** Copia texto para área de transferência e mostra ✓ no bloco copiado. */
  private async copy(key: string, buildText: () => string): Promise<void> {
    const ok = await copyToClipboard(buildText());
    this.copied.set(ok ? key : null);
    if (this.copiedTimer !== null) {
      clearTimeout(this.copiedTimer);
    }
    this.copiedTimer = setTimeout(() => this.copied.set(null), 2000);
  }

  /** Texto compartilhável com os saldos atuais do grupo. */
  balanceText(): string {
    const header = `Saldos — ${this.groupName()}`;
    const lines = this.balances().map((b) => {
      const name = this.participantName(b.participantId);
      if (b.balanceInCents > 0) {
        return `${name}: Recebe ${formatBrl(b.balanceInCents)}`;
      }
      if (b.balanceInCents < 0) {
        return `${name}: Deve ${formatBrl(-b.balanceInCents)}`;
      }
      return `${name}: Quitado`;
    });
    return [header, ...lines].join('\n');
  }

  /** Texto compartilhável com o plano sugerido de "Como acertar". */
  settlementText(): string {
    const header = `Como acertar — ${this.groupName()}`;
    const lines = this.settlementPlan().map(
      (t) =>
        `${this.participantName(t.fromParticipantId)} → ${this.participantName(t.toParticipantId)}: ${formatBrl(t.amountInCents)}`,
    );
    return [header, ...lines].join('\n');
  }

  /** Texto compartilhável com os dados de uma despesa. */
  expenseText(expense: Expense): string {
    const payer = this.participantName(expense.payerParticipantId);
    const names = expense.shares
      .map((s) => this.participantName(s.participantId))
      .join(', ');
    return `${this.groupName()} · ${expense.description} — ${formatBrl(expense.totalAmountInCents)} · Pagou ${payer} · Dividido por ${names}`;
  }

  copyBalances() {
    void this.copy('balances', () => this.balanceText());
  }

  copySettlement() {
    void this.copy('plan', () => this.settlementText());
  }

  copyExpense(expense: Expense) {
    void this.copy(`expense-${expense.id}`, () => this.expenseText(expense));
  }

  async refresh({ silent = false }: { silent?: boolean } = {}): Promise<void> {
    if (!silent) {
      this.loading.set(true);
      this.loadError.set(false);
      this.notFound.set(false);
    }

    try {
      const [groups, participants, expenses, balances, payments, settlementPlan] =
        await Promise.all([
          firstValueFrom(this.groupsApi.list()),
          firstValueFrom(this.participantsApi.list(this.groupId)),
          firstValueFrom(this.expensesApi.list(this.groupId)),
          firstValueFrom(this.groupsApi.balances(this.groupId)),
          firstValueFrom(this.paymentsApi.list(this.groupId)),
          firstValueFrom(this.paymentsApi.settlementPlan(this.groupId)),
        ]);

      const summary = groups.find((g) => g.id === this.groupId);
      if (!summary) {
        this.notFound.set(true);
      }

      this.groupName.set(summary?.name ?? '');
      this.title.setTitle(`${summary?.name ?? 'Grupo'} - Rachaae`);
      this.participants.set(participants);
      this.expenses.set(expenses);
      this.balances.set(balances);
      this.payments.set(payments);
      this.settlementPlan.set(settlementPlan);
    } catch (err) {
      if (silent) {
        return;
      }
      if (err instanceof HttpErrorResponse && err.status === 404) {
        this.notFound.set(true);
      } else {
        this.loadError.set(true);
      }
    } finally {
      if (!silent) {
        this.loading.set(false);
      }
    }
  }

  // Helper methods for template
  getMyBalance(): number {
    const user = this.auth.user();
    if (!user) return 0;
    const savedName = user.name?.trim();
    let myName = savedName;
    if (!myName) {
      const local = user.email.split('@')[0]?.toLowerCase().trim() ?? '';
      if (!local) return 0;
      myName = local.charAt(0).toUpperCase() + local.slice(1);
    }
    const myParticipant = this.participants().find(p => p.name.trim().toLowerCase() === myName.toLowerCase());
    if (!myParticipant) return 0;
    const myBalance = this.balances().find(b => b.participantId === myParticipant.id);
    return myBalance?.balanceInCents ?? 0;
  }

  absMyBalance(): number {
    return Math.abs(this.getMyBalance());
  }

  getParticipantSpent(participantId: string): number {
    return this.expenses()
      .filter(e => e.payerParticipantId === participantId)
      .reduce((sum, e) => sum + e.totalAmountInCents, 0);
  }

  isCurrentUser(participantId: string): boolean {
    const user = this.auth.user();
    if (!user) return false;
    const savedName = user.name?.trim();
    if (savedName) {
      return savedName.toLowerCase() === this.participants().find(p => p.id === participantId)?.name.toLowerCase();
    }
    const local = user.email.split('@')[0]?.toLowerCase().trim() ?? '';
    if (!local) return false;
    const derivedName = local.charAt(0).toUpperCase() + local.slice(1);
    return derivedName.toLowerCase() === this.participants().find(p => p.id === participantId)?.name.toLowerCase();
  }

  getParticipantAvatarColor(participantId: string): string {
    const participant = this.participants().find(p => p.id === participantId);
    if (!participant) return 'surface-container-high';
    const colors = ['primary-fixed', 'secondary-fixed', 'tertiary-fixed', 'surface-container-high'];
    const index = this.participants().findIndex(p => p.id === participantId);
    return colors[index % colors.length];
  }

  getParticipantAvatarTextColor(participantId: string): string {
    const color = this.getParticipantAvatarColor(participantId);
    if (color === 'primary-fixed') return 'on-primary-fixed';
    if (color === 'secondary-fixed') return 'on-secondary-fixed';
    if (color === 'tertiary-fixed') return 'on-tertiary-fixed';
    return 'on-surface';
  }

  getParticipantInitial(participantId: string): string {
    const participant = this.participants().find(p => p.id === participantId);
    if (!participant) return '?';
    return participant.name.trim().charAt(0).toUpperCase();
  }

  openNewExpense() {
    void this.router.navigate(['/grupos', this.groupId, 'despesas', 'nova']);
  }
}