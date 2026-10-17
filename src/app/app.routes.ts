import { Routes } from '@angular/router';
import { Shell } from './core/layout/shell';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page').then((m) => m.LoginPage),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'grupos' },
      {
        path: 'grupos',
        loadComponent: () => import('./features/groups/grupos-page').then((m) => m.GruposPage),
      },
      {
        path: 'ajustes',
        loadComponent: () =>
          import('./features/settings/ajustes-page').then((m) => m.AjustesPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
