import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { MaterialModule } from '../material/material.module';

import { AnalyzeCommitsTaskCreateComponent } from './pages/analyze-commits-task-create/analyze-commits-task-create.component';
import { AnalyzeRepositoryTaskCreateComponent } from './pages/analyze-repository-task-create/analyze-repository-task-create.component';
import { TaskViewComponent } from './pages/task-view/task-view.component';
import { TasksRoutingModule } from './tasks-routing.module';
import { TasksComponent } from './tasks.component';

@NgModule({
  declarations: [
    TasksComponent,
    AnalyzeRepositoryTaskCreateComponent,
    AnalyzeCommitsTaskCreateComponent,
    TaskViewComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    TasksRoutingModule,
  ],
})
export class TasksModule {}
