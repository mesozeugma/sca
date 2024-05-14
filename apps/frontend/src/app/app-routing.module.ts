import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { canActivateAdmin, canActivateGuest } from './shared/guards';

const routes: Routes = [
  {
    path: 'explore',
    loadChildren: () =>
      import('./explore/explore.module').then((m) => m.ExploreModule),
  },
  {
    path: 'repositories',
    loadChildren: () =>
      import('./repositories/repositories.module').then(
        (m) => m.RepositoriesModule
      ),
    canActivateChild: [canActivateAdmin],
  },
  {
    path: 'tasks',
    loadChildren: () =>
      import('./tasks/tasks.module').then((m) => m.TasksModule),
    canActivateChild: [canActivateAdmin],
  },
  {
    path: 'visualizations',
    loadChildren: () =>
      import('./visualizations/visualizations.module').then(
        (m) => m.VisualizationsModule
      ),
  },
  { path: 'login', component: LoginComponent, canActivate: [canActivateGuest] },
  { path: '', component: HomeComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
