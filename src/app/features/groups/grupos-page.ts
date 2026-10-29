import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Avatar } from '../../shared/ui/avatar';
import { GroupsApi } from '../../core/api/groups-api';
import { AuthService } from '../../core/auth/auth.service';
import { GroupOverview } from '../../core/api/api-models';
import { getApiErrorMessage } from '../../core/api/api-error';
import { formatBrl } from '../../core/money/money';
import { Title } from '@angular/platform-browser';

const GENERIC_ERROR = 'Não foi possível conectar. Verifique sua internet.';
const GROUP_LIMIT = 10;
const GROUP_LIMIT_PT = `Você pode ter no máximo ${GROUP_LIMIT} grupos.`;

function toFriendlyError(err: unknown): string {
  const message = getApiErrorMessage(err, GENERIC_ERROR);
  return message.includes(`at most ${GROUP_LIMIT} groups`) ? GROUP_LIMIT_PT : message;
}

@Component({
  selector: 'app-grupos-page',
  imports: [RouterLink, ReactiveFormsModule, Avatar],
  templateUrl: './grupos-page.html',
  styleUrl: './grupos-page.scss',
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class GruposPage implements OnInit {
  private readonly router = inject(Router);
  private readonly groupsApi = inject(GroupsApi);
  private readonly title = inject(Title);
  private readonly auth = inject(AuthService);

  protected readonly formatBrl = formatBrl;

  readonly userName = computed(() => {
    const user = this.auth.user();
    if (!user) return '?';
    return user.name?.trim() || user.email.split('@')[0] || '?';
  });

  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly overviews = signal<GroupOverview[]>([]);

  readonly createOpen = signal(false);
  readonly creating = signal(false);
  readonly createError = signal<string | null>(null);
  readonly creationName = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(80)],
  });

  readonly totalParticipants = computed(() =>
    this.overviews().reduce((sum, o) => sum + o.participantCount, 0),
  );

  readonly totalMovement = computed(() =>
    this.overviews().reduce((sum, o) => sum + o.totalPaidInCents, 0),
  );

  readonly nothingOwedAnywhere = computed(
    () =>
      this.overviews().length > 0 &&
      this.overviews().every((o) => o.totalPaidInCents === 0),
  );

  readonly groupLimitReached = computed(
    () => this.overviews().length >= GROUP_LIMIT,
  );

  readonly activeCountLabel = computed(() => {
    const count = this.overviews().length;
    if (this.loading()) return '';
    return `${count} ${count === 1 ? 'ativo' : 'ativos'}`;
  });

  readonly monthLabel = new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: 'numeric',
  })
    .format(new Date())
    .replace(' de ', ' ')
    .toUpperCase();

  ngOnInit(): void {
    this.title.setTitle('Grupos - Rachaae');
    void this.refresh();
  }

  onEscape() {
    this.createOpen.set(false);
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(false);
    try {
      const overviews = await firstValueFrom(this.groupsApi.overviews());
      this.overviews.set(overviews);
    } catch {
      this.loadError.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  openCreation() {
    this.creationName.reset('');
    this.createError.set(null);
    this.createOpen.set(true);
  }

  submitCreation() {
    const name = this.creationName.value.trim();

    this.creating.set(true);
    this.createError.set(null);
    this.groupsApi.create(name).subscribe({
      next: ({ id }) => {
        this.creating.set(false);
        void this.router.navigate(['/grupos', id]);
      },
      error: (err) => {
        this.creating.set(false);
        this.createError.set(toFriendlyError(err));
      },
    });
  }

  closeCreation() {
    this.createOpen.set(false);
  }

  getGroupIcon(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('praia') || lower.includes('viagem') || lower.includes('ubatuba') || lower.includes('ferias') || lower.includes('férias')) return 'surfing';
    if (lower.includes('churrasco') || lower.includes('bbq') || lower.includes('carne')) return 'local_fire_department';
    if (lower.includes('apê') || lower.includes('ape') || lower.includes('casa') || lower.includes('apto') || lower.includes('moradia')) return 'apartment';
    if (lower.includes('serra') || lower.includes('montanha') || lower.includes('natureza')) return 'terrain';
    return 'group';
  }

  getGroupIconColor(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('praia') || lower.includes('viagem') || lower.includes('ubatuba') || lower.includes('ferias') || lower.includes('férias')) return 'primary-fixed';
    if (lower.includes('churrasco') || lower.includes('bbq') || lower.includes('carne')) return 'secondary-fixed';
    if (lower.includes('apê') || lower.includes('ape') || lower.includes('casa') || lower.includes('apto') || lower.includes('moradia')) return 'surface-container-high';
    if (lower.includes('serra') || lower.includes('montanha') || lower.includes('natureza')) return 'surface-container-high';
    return 'primary-fixed';
  }

  getGroupIconTextColor(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('praia') || lower.includes('viagem') || lower.includes('ubatuba') || lower.includes('ferias') || lower.includes('férias')) return 'on-primary-fixed';
    if (lower.includes('churrasco') || lower.includes('bbq') || lower.includes('carne')) return 'on-secondary-fixed';
    return 'on-surface';
  }

  getGroupCategory(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('praia') || lower.includes('viagem') || lower.includes('ubatuba') || lower.includes('ferias') || lower.includes('férias')) return 'Praia & Férias';
    if (lower.includes('churrasco') || lower.includes('bbq') || lower.includes('carne')) return 'Final de semana';
    if (lower.includes('apê') || lower.includes('ape') || lower.includes('casa') || lower.includes('apto') || lower.includes('moradia')) return 'Despesas fixas';
    if (lower.includes('serra') || lower.includes('montanha') || lower.includes('natureza')) return 'Em planejamento';
    return 'Grupo';
  }

  getGroupCategoryColor(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('praia') || lower.includes('viagem') || lower.includes('ubatuba') || lower.includes('ferias') || lower.includes('férias')) return 'tertiary-fixed';
    if (lower.includes('churrasco') || lower.includes('bbq') || lower.includes('carne')) return 'secondary-fixed';
    if (lower.includes('apê') || lower.includes('ape') || lower.includes('casa') || lower.includes('apto') || lower.includes('moradia')) return 'surface-container-high';
    return 'surface-container-high';
  }

  getGroupCategoryTextColor(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('praia') || lower.includes('viagem') || lower.includes('ubatuba') || lower.includes('ferias') || lower.includes('férias')) return 'on-tertiary-fixed';
    if (lower.includes('churrasco') || lower.includes('bbq') || lower.includes('carne')) return 'on-secondary-fixed';
    return 'on-surface-variant';
  }
}
