import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskStatusType } from '@sca/models';
import { mergeMap } from 'rxjs';

import { DialogService } from '../../../shared/services/dialog.service';
import {
  Task,
  TasksApiService,
} from '../../../shared/services/tasks-api.service';

@Component({
  selector: 'app-task-view',
  templateUrl: './task-view.component.html',
  styleUrls: ['./task-view.component.css'],
})
export class TaskViewComponent implements OnInit {
  taskId = '';
  task?: Task = undefined;

  constructor(
    private readonly dialogService: DialogService,
    private readonly tasksApi: TasksApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.taskId = this.route.snapshot.paramMap.get('taskId') || '';
    this.refreshTask();
  }

  refreshTask() {
    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.tasksApi.getById({ id: this.taskId }).subscribe({
      next: (task) => (this.task = task),
      error: () => {
        this.dialogService.openErrorDialog();
        this.dialogService.closeDialog(pendingActionDialog);
      },
      complete: () => this.dialogService.closeDialog(pendingActionDialog),
    });
  }

  approveTask() {
    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.tasksApi.approve({ id: this.taskId }).subscribe({
      next: () => {
        this.refreshTask();
      },
      error: () => {
        this.dialogService.openErrorDialog();
        this.dialogService.closeDialog(pendingActionDialog);
      },
      complete: () => this.dialogService.closeDialog(pendingActionDialog),
    });
  }

  deleteTask() {
    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.tasksApi
      .delete({ id: this.taskId })
      .pipe(
        mergeMap(() =>
          this.router.navigate(['.'], { relativeTo: this.route.parent })
        )
      )
      .subscribe({
        next: () => {
          // do nothing
        },
        error: () => {
          this.dialogService.openErrorDialog();
          this.dialogService.closeDialog(pendingActionDialog);
        },
        complete: () => this.dialogService.closeDialog(pendingActionDialog),
      });
  }

  needsApproval() {
    return this.task?.status.type === TaskStatusType.WAITING_FOR_APPROVAL;
  }
}
