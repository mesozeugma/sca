import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { RepositoryCreateComponent } from './pages/repository-create/repository-create.component';
import { RepositoryEditComponent } from './pages/repository-edit/repository-edit.component';
import { RepositoryViewComponent } from './pages/repository-view/repository-view.component';
import { RepositoriesComponent } from './repositories.component';

const routes: Routes = [
  { path: '', component: RepositoriesComponent },
  { path: 'create', component: RepositoryCreateComponent },
  { path: 'edit/:repositoryId', component: RepositoryEditComponent },
  { path: 'view/:repositoryId', component: RepositoryViewComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RepositoriesRoutingModule {}
