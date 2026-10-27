import { Component, OnInit, computed, inject, signal, effect } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { GroupsApi } from '../../core/api/groups-api';
import { GroupOverview } from '../../core/api/api-models';
import { getApiErrorMessage } from '../../core/api/api-error';
import { formatBrl } from '../../core/money/money';
import { AuthService } from '../../core/auth/auth.service';

const GENERIC_ERROR = 'Não foi possível conectar. Verifique sua internet.';
const GROUP_LIMIT = 10;

function toFriendlyError(err: unknown): string {
  const message = getApiErrorMessage(err, GENERIC_ERROR);
  return message.includes(`at most ${GROUP_LIMIT} groups`) ? `Você pode ter no máximo ${GROUP_LIMIT} grupos.` : message;
}

interface GroupOverviewExtended extends GroupOverview {
  category?: string;
  expenseCount?: number;
  userBalance?: number;
}

@Component({
  selector: 'app-grupos-page',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './grupos-page.html',
  styleUrl: './grupos-page.scss',
})
export class GruposPage implements OnInit {
  private readonly router = inject(Router);
  private readonly groupsApi = inject(GroupsApi);
  private readonly auth = inject(AuthService);

  readonly formatBrl = formatBrl;

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly overviews = signal<GroupOverviewExtended[]>([]);

  readonly createOpen = signal(false);
  readonly creating = signal(false);
  readonly createError = signal<string | null>(null);
  readonly creationName = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(80)] });
  readonly creationCategory = new FormControl('praia', { nonNullable: true });

  readonly sortAsc = signal(false);
  readonly greetingTime = signal<'manha' | 'tarde' | 'noite'>('tarde');

  ngOnInit(): void {
    this.setGreeting();
    this.loadUserName();
    void this.refresh();
  }

  private setGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) this.greetingTime.set('manha');
    else if (hour < 18) this.greetingTime.set('tarde');
    else this.greetingTime.set('noite');
  }

  private loadUserName(): void {
    const user = this.auth.user();
    if (user?.name) return;
    // Fallback to email local part
  }

  readonly greeting = computed(() => {
    switch (this.greetingTime()) {
      case 'manha': return 'Bom dia,';
      case 'tarde': return 'Boa tarde,';
      default: return 'Boa noite,';
    }
  });

  readonly userName = computed(() => {
    const user = this.auth.user();
    return user?.name || user?.email?.split('@')[0] || '';
  });

  readonly currentMonth = computed(() => {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return `${months[new Date().getMonth()]} ${new Date().getFullYear()}`;
  });

  readonly activeGroupsCount = computed(() => this.overviews().length);

  readonly totalToReceive = computed(() =>
    this.overviews().filter(o => (o.userBalance ?? 0) > 0).reduce((sum, o) => sum + (o.userBalance ?? 0), 0)
  );

  readonly totalToPay = computed(() =>
    this.overviews().filter(o => (o.userBalance ?? 0) < 0).reduce((sum, o) => sum + Math.abs(o.userBalance ?? 0), 0)
  );

  readonly groupLimitReached = computed(() => this.overviews().length >= GROUP_LIMIT);

  async refresh(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(false);
    try {
      const data = await firstValueFrom(this.groupsApi.overviews());
      // Extend with mock category/expenseCount/userBalance for prototype fidelity
      // In real app, these would come from the API
      const extended: GroupOverviewExtended[] = data.map((g, i) => ({
        ...g,
        category: ['praia', 'churrasco', 'casa', 'viagem'][i % 4],
        expenseCount: Math.floor(Math.random() * 10) + 1,
        userBalance: (Math.random() - 0.5) * 50000,
      }));
      this.overviews.set(extended);
    } catch {
      this.loadError.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  toggleSort(): void { this.sortAsc.update(v => !v); }

  openCreation(): void {
    this.creationName.reset('');
    this.creationCategory.reset('praia');
    this.createError.set(null);
    this.createOpen.set(true);
  }

  submitCreation(): void {
    const name = this.creationName.value.trim();
    if (!name && this.groupLimitReached()) return;

    this.creating.set(true);
    this.createError.set(null);
    this.groupsApi.create(name).subscribe({
      next: ({ id }) => { this.creating.set(false); this.createOpen.set(false); void this.router.navigate(['/grupos', id]); },
      error: (err) => { this.creating.set(false); this.createError.set(toFriendlyError(err)); },
    });
  }

  closeCreation(): void { this.createOpen.set(false); }

  getCategoryIcon(cat?: string): string {
    const c = (cat || '').toLowerCase();
    switch (c) {
      case 'praia': return 'surfing';
      case 'churrasco': return 'local_fire_department';
      case 'casa': return 'apartment';
      case 'viagem': return 'luggage';
      default: return 'group';
    }
  }

  getCategoryColor(cat?: string): string {
    const c = (cat || '').toLowerCase();
    switch (c) {
      case 'praia': return 'var(--color-primary)';
      case 'churrasco': return 'var(--color-cta)';
      case 'casa': return 'var(--color-on-surface-variant)';
      case 'viagem': return 'var(--color-positive)';
      default: return 'var(--color-primary)';
    }
  }

  // Safe getters for template
  getCatIcon(overview: GroupOverviewExtended): string { return this.getCategoryIcon(overview.category); }
  getCatColor(overview: GroupOverviewExtended): string { return this.getCategoryColor(overview.category); }
  getExpenseCount(overview: GroupOverviewExtended): number { return overview.expenseCount ?? 0; }
  getUserBalance(overview: GroupOverviewExtended): number { return overview.userBalance ?? 0; }
  abs(n: number): number { return Math.abs(n); }
}