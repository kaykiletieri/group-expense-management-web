import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, Observable } from 'rxjs';
import { ExpensesApi } from '../../core/api/expenses-api';
import { ParticipantsApi } from '../../core/api/participants-api';
import { Participant } from '../../core/api/api-models';
import { getApiErrorMessage } from '../../core/api/api-error';
import { formatBrl, parseAmountInputToCents } from '../../core/money/money';
import { Avatar } from '../../shared/ui/avatar';

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

  readonly groupId = this.route.snapshot.paramMap.get('id') ?? '';
  private readonly expenseId = this.route.snapshot.paramMap.get('expenseId');

  readonly loading = signal(this.expenseId !== null);
  readonly notFound = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly participants = signal<Participant[]>([]);
  readonly payerId = signal<string | null>(null);
  readonly splitIds = signal<ReadonlySet<string>>(new Set());
  readonly amountText = signal('');

  readonly isEdit = this.expenseId !== null;

  readonly form = this.formBuilder.nonNullable.group({
    description: ['', [Validators.required, Validators.maxLength(120)]],
    amount: ['', [Validators.required]],
  });

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const participants = await firstValueFrom(this.participantsApi.list(this.groupId));
      this.participants.set(participants);

      if (this.expenseId === null) {
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
}

/** 3334 → "33,34" (texto de input, sem símbolo). */
function centsToInput(cents: number): string {
  const reais = Math.floor(Math.abs(cents) / 100);
  const centavos = Math.abs(cents) % 100;
  const sign = cents < 0 ? '-' : '';
  return `${sign}${reais},${centavos.toString().padStart(2, '0')}`;
}
