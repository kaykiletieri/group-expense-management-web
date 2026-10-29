import { ChangeDetectionStrategy, Component, input } from '@angular/core';

// Paleta pastel de avatares (iniciais) — determinística pelo nome (D11).
const AVATAR_CLASSES = ['av-co', 'av-or', 'av-li', 'av-ro', 'av-te', 'av-am'] as const;

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function avatarClassOf(name: string): string {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return AVATAR_CLASSES[Math.abs(hash) % AVATAR_CLASSES.length];
}

@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="avatar {{ cls }}" [style.width.px]="size()" [style.height.px]="size()">
    {{ text }}
  </span>`,
  styles: `
    .avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: var(--border-width) solid var(--border-color);
      border-radius: var(--radius-full);
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 13px;
      user-select: none;
      flex-shrink: 0;
    }
    .av-co { background: var(--color-primary); color: var(--on-accent); }
    .av-or { background: var(--color-cta); color: var(--on-accent); }
    .av-li { background: var(--color-positive); color: var(--on-accent); }
    .av-ro { background: #f3c4dc; color: var(--on-accent); }
    .av-te { background: #a8dcd9; color: var(--on-accent); }
    .av-am { background: #f5d97b; color: var(--on-accent); }
  `,
})
export class Avatar {
  readonly name = input.required<string>();
  readonly size = input(40);

  get cls(): string {
    return avatarClassOf(this.name());
  }

  get text(): string {
    return initialsOf(this.name());
  }
}
