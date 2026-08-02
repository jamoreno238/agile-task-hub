import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'projects' },
      {
        path: 'projects',
        loadComponent: () => import('./features/projects/project-list/project-list.component').then((m) => m.ProjectListComponent)
      },
      {
        path: 'projects/:projectId/board',
        loadComponent: () => import('./features/board/board-page.component').then((m) => m.BoardPageComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
