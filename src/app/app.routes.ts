import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'kittens',
    loadComponent: () =>
      import('./pages/kittens/kittens.component').then((m) => m.KittensComponent),
  },
  {
    path: 'kittens/:id',
    loadComponent: () => import('./pages/kitten/kitten.component').then((m) => m.KittenComponent),
  },
  {
    path: 'parents',
    loadComponent: () =>
      import('./pages/parents/parents.component').then((m) => m.ParentsComponent),
  },
  {
    path: 'parents/:id',
    loadComponent: () => import('./pages/parent/parent.component').then((m) => m.ParentComponent),
  },
  {
    path: 'families',
    loadComponent: () =>
      import('./pages/families/families.component').then((m) => m.FamiliesComponent),
  },
];
