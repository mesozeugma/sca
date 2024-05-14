import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AnalyzeCommitsTaskCreateComponent } from './pages/analyze-commits-task-create/analyze-commits-task-create.component';
import { AnalyzeRepositoryTaskCreateComponent } from './pages/analyze-repository-task-create/analyze-repository-task-create.component';
import { TaskViewComponent } from './pages/task-view/task-view.component';
import { TasksComponent } from './tasks.component';

const routes: Routes = [
  {
    path: 'create/analyze-commits',
    component: AnalyzeCommitsTaskCreateComponent,
  },
  {
    path: 'create/analyze-repository',
    component: AnalyzeRepositoryTaskCreateComponent,
  },
  { path: 'view/:taskId', component: TaskViewComponent },
  { path: '', component: TasksComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TasksRoutingModule {}
