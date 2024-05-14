import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskStatusType } from '@sca/models';
import {
  ReplaySubject,
  Subject,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  from,
  map,
  mergeMap,
} from 'rxjs';

import { DialogService } from '../../../shared/services/dialog.service';
import {
  RepositoriesApiService,
  Repository,
  RepositoryAnalysesList,
} from '../../../shared/services/repositories-api.service';
import {
  TaskList,
  TasksApiService,
} from '../../../shared/services/tasks-api.service';

@Component({
  selector: 'app-repository-view',
  templateUrl: './repository-view.component.html',
  styleUrls: ['./repository-view.component.css'],
})
export class RepositoryViewComponent implements OnInit {
  repositoryId = '';
  repository$ = new ReplaySubject<Repository>(1);
  analyses$ = new ReplaySubject<RepositoryAnalysesList['items']>(1);
  tasks$ = new ReplaySubject<TaskList['items']>(1);
  pagination$ = new Subject<PageEvent>();

  paginationDisabled = true;
  paginationItemCount = 0;
  paginationPageSize = 10;
  paginationPageIndex = 0;

  constructor(
    private readonly repositoriesApi: RepositoriesApiService,
    private readonly tasksApi: TasksApiService,
    private readonly dialogService: DialogService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.paginationPageIndex = parseInt(
      this.route.snapshot.queryParamMap.get('page') || '0'
    );
    this.repositoryId = this.route.snapshot.paramMap.get('repositoryId') || '';

    this.getRepository();
    this.refreshAnalyses();
    this.refreshTasks();
    this.pagination$
      .pipe(
        map((e) => e.pageIndex),
        distinctUntilChanged(),
        concatMap((page) =>
          from(
            this.router.navigate([], {
              queryParams: {
                page,
              },
              queryParamsHandling: 'merge',
              relativeTo: this.route,
            })
          ).pipe(map(() => page))
        ),
        debounceTime(100)
      )
      .subscribe((pageIndex) => {
        this.paginationPageIndex = pageIndex;
        this.refreshAnalyses();
      });
  }

  getRepository() {
    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.repositoriesApi.getById({ id: this.repositoryId }).subscribe({
      next: (result) => {
        this.repository$.next(result);
      },
      error: () => {
        this.dialogService.openErrorDialog();
        this.dialogService.closeDialog(pendingActionDialog);
      },
      complete: () => this.dialogService.closeDialog(pendingActionDialog),
    });
  }

  refreshAnalyses() {
    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.repositoriesApi
      .listAnalyses({
        pagination: {
          page: this.paginationPageIndex,
          limit: this.paginationPageSize,
        },
        repositoryId: this.repositoryId,
      })
      .subscribe({
        next: ({ items, totalCount }) => {
          this.paginationItemCount = totalCount;
          this.analyses$.next(items);
          this.paginationDisabled = false;
        },
        error: () => {
          this.dialogService.openErrorDialog();
          this.dialogService.closeDialog(pendingActionDialog);
        },
        complete: () => this.dialogService.closeDialog(pendingActionDialog),
      });
  }

  refreshTasks() {
    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.tasksApi
      .listByRepository({
        pagination: {
          page: 0,
          limit: 20,
        },
        repositoryId: this.repositoryId,
      })
      .subscribe({
        next: ({ items }) => {
          this.tasks$.next(items);
        },
        error: () => {
          this.dialogService.openErrorDialog();
          this.dialogService.closeDialog(pendingActionDialog);
        },
        complete: () => this.dialogService.closeDialog(pendingActionDialog),
      });
  }

  approveTask(id: string) {
    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.tasksApi.approve({ id }).subscribe({
      next: () => {
        this.refreshTasks();
      },
      error: () => {
        this.dialogService.openErrorDialog();
        this.dialogService.closeDialog(pendingActionDialog);
      },
      complete: () => this.dialogService.closeDialog(pendingActionDialog),
    });
  }

  deleteAnalysis(id: string) {
    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.repositoriesApi.deleteAnalysis({ id }).subscribe({
      next: () => {
        this.refreshAnalyses();
      },
      error: () => {
        this.dialogService.openErrorDialog();
        this.dialogService.closeDialog(pendingActionDialog);
      },
      complete: () => this.dialogService.closeDialog(pendingActionDialog),
    });
  }

  taskNeedsApproval(task: TaskList['items'][0]) {
    return task.status.type === TaskStatusType.WAITING_FOR_APPROVAL;
  }

  deleteRepository() {
    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.repositoriesApi
      .delete({ id: this.repositoryId })
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
}
