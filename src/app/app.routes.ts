import { Routes } from '@angular/router';
import { KittensComponent } from './pages/kittens/kittens.component';
import { KittenComponent } from './pages/kitten/kitten.component';
import { HomeComponent } from './pages/home/home.component';
import { ParentsComponent } from './pages/parents/parents.component';
import { ParentComponent } from './pages/parent/parent.component';
import { FamiliesComponent } from './pages/families/families.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full',
  },
  { path: 'kittens', component: KittensComponent },
  { path: 'kittens/:id', component: KittenComponent },
  { path: 'parents', component: ParentsComponent },
  { path: 'parents/:id', component: ParentComponent },
  { path: 'families', component: FamiliesComponent },
];
