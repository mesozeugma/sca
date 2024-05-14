import { Component, OnInit } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ReplaySubject,
  Subject,
  concatMap,
  distinctUntilChanged,
  from,
  map,
} from 'rxjs';

import { DialogService } from '../../../shared/services/dialog.service';
import {
  ClassExploreResult,
  ExploreApiService,
} from '../../../shared/services/explore-api.service';

@Component({
  selector: 'app-class-explorer',
  templateUrl: './class-explorer.component.html',
  styleUrls: ['./class-explorer.component.css'],
})
export class ClassExplorerComponent implements OnInit {
  form = this.formBuilder.group({
    searchText: [
      '',
      [
        Validators.required,
        Validators.minLength(1),
        Validators.pattern(/^[^?*]+$/),
      ],
    ],
  });
  searchText = '';
  repositoryName = '';
  gitCommit = '';
  isNoDataAvailable = false;

  items$ = new ReplaySubject<ClassExploreResult['items']>(1);
  pagination$ = new Subject<PageEvent>();

  paginationDisabled = true;
  paginationItemCount = 0;
  paginationPageSize = 10;
  paginationPageIndex = 0;

  constructor(
    private readonly exploreApi: ExploreApiService,
    private readonly dialogService: DialogService,
    private readonly formBuilder: NonNullableFormBuilder,
    private readonly route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const queryParamMap = this.route.snapshot.queryParamMap;
    this.repositoryName = queryParamMap.get('repositoryName') || '';
    this.gitCommit = queryParamMap.get('gitCommit') || '';
    this.paginationPageIndex = parseInt(queryParamMap.get('page') || '0');

    this.refreshDataAvailability();
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
        )
      )
      .subscribe((pageIndex) => {
        this.paginationPageIndex = pageIndex;
        this.refreshItems();
      });
    this.refreshItems();
  }

  refreshItems(): void {
    const searchText = this.searchText;
    if (searchText.length === 0) {
      this.paginationItemCount = 0;
      this.items$.next([]);
      this.paginationDisabled = true;
      return;
    }

    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.exploreApi
      .exploreClass({
        repositoryName: this.repositoryName,
        gitCommit: this.gitCommit,
        searchText: this.searchText,
        pagination: {
          limit: this.paginationPageSize,
          page: this.paginationPageIndex,
        },
      })
      .subscribe({
        next: ({ items, totalCount }) => {
          this.paginationItemCount = totalCount;
          this.items$.next(items);
          this.paginationDisabled = false;
        },
        error: () => {
          this.dialogService.openErrorDialog();
          this.dialogService.closeDialog(pendingActionDialog);
        },
        complete: () => this.dialogService.closeDialog(pendingActionDialog),
      });
  }

  refreshDataAvailability() {
    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.exploreApi
      .explorePackage({
        repositoryName: this.repositoryName,
        gitCommit: this.gitCommit,
        packageName: '',
        pagination: { limit: 1, page: 0 },
      })
      .subscribe({
        next: ({ totalCount }) => {
          this.isNoDataAvailable = totalCount === 0;
        },
        error: () => {
          this.dialogService.openErrorDialog();
          this.dialogService.closeDialog(pendingActionDialog);
        },
        complete: () => this.dialogService.closeDialog(pendingActionDialog),
      });
  }

  submitForm() {
    this.searchText = this.form.controls.searchText.value;
    this.refreshItems();
  }
}
