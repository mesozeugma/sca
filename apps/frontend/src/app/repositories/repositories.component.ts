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
  RepositoriesApiService,
  RepositoryList,
} from '../shared/services/repositories-api.service';

@Component({
  selector: 'app-repositories',
  templateUrl: './repositories.component.html',
  styleUrls: ['./repositories.component.css'],
})
export class RepositoriesComponent implements OnInit {
  repositories: RepositoryList['items'] = [];
  pagination$ = new Subject<PageEvent>();

  paginationDisabled = true;
  paginationItemCount = 0;
  paginationPageSize = 10;
  paginationPageIndex = 0;

  constructor(
    private readonly repositoriesApi: RepositoriesApiService,
    private readonly dialogService: DialogService,
    private readonly route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.paginationPageIndex = parseInt(
      this.route.snapshot.queryParamMap.get('page') || '0'
    );
    this.refreshRepositories();
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
        this.refreshRepositories();
      });
  }

  refreshRepositories() {
    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.repositoriesApi
      .list({
        pagination: {
          page: this.paginationPageIndex,
          limit: this.paginationPageSize,
        },
      })
      .subscribe({
        next: ({ items, totalCount }) => {
          this.paginationItemCount = totalCount;
          this.repositories = items;
          this.paginationDisabled = false;
        },
        error: () => {
          this.dialogService.openErrorDialog();
          this.dialogService.closeDialog(pendingActionDialog);
        },
        complete: () => this.dialogService.closeDialog(pendingActionDialog),
      });
  }
}
