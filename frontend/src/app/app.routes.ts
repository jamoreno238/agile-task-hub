import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'projects' },
      {
        path: 'projects',
        loadComponent: () => import('./features/projects/projects-page.component').then((m) => m.ProjectsPageComponent)
      },
      {
        path: 'board',
        loadComponent: () => import('./features/board/board-page.component').then((m) => m.BoardPageComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
