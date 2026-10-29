import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, Observable } from 'rxjs';
import { ExpensesApi } from '../../core/api/expenses-api';
import { ParticipantsApi } from '../../core/api/participants-api';
import { GroupsApi } from '../../core/api/groups-api';
import { Participant } from '../../core/api/api-models';
import { getApiErrorMessage } from '../../core/api/api-error';
import { formatBrl, parseAmountInputToCents } from '../../core/money/money';
import { Avatar } from '../../shared/ui/avatar';
import { Title } from '@angular/platform-browser';
import { AuthService } from '../../core/auth/auth.service';

const GENERIC_ERROR = 'Não foi possível conectar. Verifique sua internet.';

@Component({
  selector: 'app-expense-form-page',
  imports: [RouterLink, ReactiveFormsModule, Avatar],
  templateUrl: './expense-form-page.html',
  styleUrl: './expense-form-page.scss',
})
export class ExpenseFormPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly expensesApi = inject(ExpensesApi);
  private readonly participantsApi = inject(ParticipantsApi);
  private readonly groupsApi = inject(GroupsApi);
  private readonly auth = inject(AuthService);
  private readonly title = inject(Title);

  readonly groupId = this.route.snapshot.paramMap.get('id') ?? '';
  private readonly expenseId = this.route.snapshot.paramMap.get('expenseId');

  readonly loading = signal(this.expenseId !== null);
  readonly notFound = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly participants = signal<Participant[]>([]);
  /** Nome real do grupo (via GET /api/groups), para o chip do cabeçalho. */
  readonly groupName = signal('');
  readonly payerId = signal<string | null>(null);
  readonly splitIds = signal<ReadonlySet<string>>(new Set());
  readonly amountText = signal('');

  readonly isEdit = this.expenseId !== null;

  /** Identificação do usuário logado para o avatar do header (nome ou e-mail). */
  readonly userLabel = computed(() => {
    const user = this.auth.user();
    if (!user) return '?';
    return user.name?.trim() || user.email.split('@')[0] || '?';
  });

  /** Parcela exibida ao lado de cada participante (divisão igualitária). */
  readonly splitPercentLabel = computed(() => {
    const count = this.splitIds().size;
    if (count === 0) return '—';
    return `${Math.round((100 / count) * 10) / 10}%`.replace('.', ',');
  });

  readonly form = this.formBuilder.nonNullable.group({
    description: ['', [Validators.required, Validators.maxLength(120)]],
    amount: ['', [Validators.required]],
  });

  protected readonly formatBrl = formatBrl;
  protected readonly parseAmountInputToCents = parseAmountInputToCents;


  ngOnInit(): void {
    this.title.setTitle(this.expenseId ? 'Editar despesa - Rachaae' : 'Nova despesa - Rachaae');
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const [groups, participants] = await Promise.all([
        firstValueFrom(this.groupsApi.list()),
        firstValueFrom(this.participantsApi.list(this.groupId)),
      ]);
      this.groupName.set(groups.find((g) => g.id === this.groupId)?.name ?? 'Grupo');
      this.participants.set(participants);

      if (this.expenseId === null) {
        // Default: select all participants for split
        const allIds = new Set(participants.map(p => p.id));
        this.splitIds.set(allIds);
        // Default: first participant as payer
        if (participants.length > 0) {
          this.payerId.set(participants[0].id);
        }
        return;
      }

      const expenses = await firstValueFrom(this.expensesApi.list(this.groupId));
      const expense = expenses.find((e) => e.id === this.expenseId);
      if (!expense) {
        this.notFound.set(true);
        return;
      }

      this.form.setValue({
        description: expense.description,
        amount: centsToInput(expense.totalAmountInCents),
      });
      this.amountText.set(this.form.value.amount!);
      this.payerId.set(expense.payerParticipantId);
      this.splitIds.set(new Set(expense.shares.map((s) => s.participantId)));
    } catch {
      this.errorMessage.set(GENERIC_ERROR);
    } finally {
      this.loading.set(false);
    }
  }

  setPayer(participantId: string) {
    this.payerId.set(participantId);
    const next = new Set(this.splitIds());
    next.add(participantId);
    this.splitIds.set(next);
  }

  toggleSplit(participantId: string) {
    const next = new Set(this.splitIds());
    if (next.has(participantId)) {
      next.delete(participantId);
    } else {
      next.add(participantId);
    }
    this.splitIds.set(next);
  }

  toggleAllSplit() {
    const allChecked = this.participants().every(p => this.splitIds().has(p.id));
    const next = new Set(this.splitIds());
    this.participants().forEach(p => {
      if (allChecked) {
        next.delete(p.id);
      } else {
        next.add(p.id);
      }
    });
    this.splitIds.set(next);
  }

  attempted = signal(false);

  showError(field: 'description' | 'amount'): boolean {
    return this.attempted() && this.form.controls[field].invalid;
  }

  amountInvalid(): boolean {
    if (this.amountText().length === 0 && this.form.controls.amount.pristine) {
      return false;
    }
    const raw = this.amountText().trim();
    return raw !== '' && parseAmountInputToCents(raw) === null;
  }

  payerInvalid(): boolean {
    return this.attempted() && this.payerId() === null;
  }

  splitInvalid(): boolean {
    return this.attempted() && this.splitIds().size === 0;
  }

  readonly estimate = computed<{ label: string } | null>(() => {
    const cents = parseAmountInputToCents(this.amountText().trim());
    const count = this.splitIds().size;
    if (cents === null || count === 0) {
      return null;
    }
    const exact = cents % count === 0;
    const label = exact ? formatBrl(cents / count) : `≈ ${formatBrl(Math.floor(cents / count))}`;
    return { label };
  });

  backLink(): string[] {
    return ['/grupos', this.groupId];
  }

  goBack() {
    this.router.navigate(this.backLink());
  }

  submit() {
    this.attempted.set(true);
    this.errorMessage.set(null);

    const cents = parseAmountInputToCents(this.form.controls.amount.value.trim());
    const payer = this.payerId();
    const split = [...this.splitIds()];

    if (
      this.form.invalid ||
      cents === null ||
      payer === null ||
      split.length === 0
    ) {
      return;
    }

    const payload = {
      description: this.form.value.description!.trim(),
      totalAmountInCents: cents,
      payerParticipantId: payer,
      participantIds: split,
    };

    this.submitting.set(true);
    const request$: Observable<unknown> =
      this.expenseId === null
        ? this.expensesApi.create(this.groupId, payload)
        : this.expensesApi.update(this.groupId, this.expenseId, payload);

    request$.subscribe({
      next: () => {
        void this.router.navigate(['/grupos', this.groupId]);
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(getApiErrorMessage(err, GENERIC_ERROR));
      },
    });
  }

  // Helper methods for template
  getParticipantCount(): number {
    return this.participants().length;
  }

  getRitualNumber(): number {
    return 4;
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

  getParticipantRole(participant: Participant): string {
    if (this.payerId() === participant.id) return 'Pagador(a)';
    if (this.isCurrentUser(participant.id)) return 'Você bancou';
    return 'Amigo(a)';
  }
}

/** 3334 → "33,34" (texto de input, sem símbolo). */
function centsToInput(cents: number): string {
  const reais = Math.floor(Math.abs(cents) / 100);
  const centavos = Math.abs(cents) % 100;
  const sign = cents < 0 ? '-' : '';
  return `${sign}${reais},${centavos.toString().padStart(2, '0')}`;
}