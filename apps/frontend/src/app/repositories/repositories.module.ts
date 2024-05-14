import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { MaterialModule } from '../material/material.module';
import { TruncatePipe } from '../shared/pipes/truncate.pipe';

import { RepositoryCreateComponent } from './pages/repository-create/repository-create.component';
import { RepositoryEditComponent } from './pages/repository-edit/repository-edit.component';
import { RepositoryViewComponent } from './pages/repository-view/repository-view.component';
import { RepositoriesRoutingModule } from './repositories-routing.module';
import { RepositoriesComponent } from './repositories.component';

@NgModule({
  declarations: [
    RepositoriesComponent,
    RepositoryEditComponent,
    RepositoryCreateComponent,
    RepositoryViewComponent,
    TruncatePipe,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    RepositoriesRoutingModule,
  ],
})
export class RepositoriesModule {}
