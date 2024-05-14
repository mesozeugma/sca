import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Subject,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  from,
  map,
} from 'rxjs';

import { DialogService } from '../shared/services/dialog.service';
import {
  TaskList,
  TasksApiService,
} from '../shared/services/tasks-api.service';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css'],
})
export class TasksComponent implements OnInit {
  tasks: TaskList['items'] = [];
  pagination$ = new Subject<PageEvent>();

  paginationDisabled = true;
  paginationItemCount = 0;
  paginationPageSize = 10;
  paginationPageIndex = 0;

  constructor(
    private readonly tasksApi: TasksApiService,
    private readonly dialogService: DialogService,
    private readonly route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.paginationPageIndex = parseInt(
      this.route.snapshot.queryParamMap.get('page') || '0'
    );

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
        this.refreshTasks();
      });
  }

  refreshTasks() {
    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.tasksApi
      .list({
        pagination: {
          page: this.paginationPageIndex,
          limit: this.paginationPageSize,
        },
      })
      .subscribe({
        next: ({ items, totalCount }) => {
          this.paginationItemCount = totalCount;
          this.paginationDisabled = false;
          this.tasks = items;
        },
        error: () => {
          this.dialogService.openErrorDialog();
          this.dialogService.closeDialog(pendingActionDialog);
        },
        complete: () => this.dialogService.closeDialog(pendingActionDialog),
      });
  }

  handlePaginationEvent(event: PageEvent) {
    this.paginationPageIndex = event.pageIndex;
    this.refreshTasks();
  }
}
