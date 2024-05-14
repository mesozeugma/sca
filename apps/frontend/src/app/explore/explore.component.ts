import { Component, OnInit } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ReplaySubject,
  Subject,
  catchError,
  combineLatest,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  from,
  map,
  mergeMap,
  startWith,
} from 'rxjs';

import {
  Bookmark,
  BookmarkList,
  BookmarksApiService,
} from '../shared/services/bookmarks-api.service';
import { DialogService } from '../shared/services/dialog.service';
import {
  RepositoriesApiService,
  RepositoryList,
  RepositoryPublicAnalysesList,
} from '../shared/services/repositories-api.service';
import { distinctUntilChangedJSON } from '../shared/utils/rxjs';

@Component({
  selector: 'app-explore',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.css'],
})
export class ExploreComponent implements OnInit {
  explorers = [
    {
      name: 'class',
      description:
        'Explore project source code by searching for package or class name.',
    },
    {
      name: 'package',
      description:
        'Explore project source code by viewing the package and class tree.',
    },
  ];
  form = this.formBuilder.group({
    repositoryName: ['', [Validators.required]],
    gitCommit: ['', [Validators.required]],
    explorer: [this.explorers[0].name, [Validators.required]],
  });

  bookmarks$ = new ReplaySubject<BookmarkList['items']>(1);
  repositories$ = new ReplaySubject<RepositoryList['items']>(1);
  commits: RepositoryPublicAnalysesList['items'] = [];
  autocompleteAnalysis$ = new ReplaySubject<string>(1);
  autocompleteRepository$ = new ReplaySubject<string>(1);
  pagination$ = new Subject<PageEvent>();

  paginationDisabled = true;
  paginationItemCount = 0;
  paginationPageSize = 10;
  paginationPageIndex = 0;

  constructor(
    private readonly bookmarksApi: BookmarksApiService,
    private readonly repositoriesApi: RepositoriesApiService,
    private readonly dialogService: DialogService,
    private readonly formBuilder: NonNullableFormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.repositories$.next([]);
    this.initAnalysisListing();
    this.refreshBookmarks();
    this.autocompleteRepository$
      .pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        mergeMap((searchText) =>
          this.repositoriesApi.list({ filters: { searchText } }).pipe(
            catchError(() => {
              this.dialogService.openErrorDialog();
              return [];
            })
          )
        )
      )
      .subscribe(({ items }) => this.repositories$.next(items));
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
        this.refreshBookmarks();
      });
  }

  initAnalysisListing(): void {
    combineLatest({
      repositoryName: this.form.controls.repositoryName.valueChanges,
      searchText: this.autocompleteAnalysis$.pipe(startWith('')),
    })
      .pipe(
        debounceTime(300),
        distinctUntilChangedJSON(),
        mergeMap(({ searchText, repositoryName }) =>
          this.repositoriesApi
            .listPublicAnalyses({
              repositoryNames: [repositoryName],
              searchText,
            })
            .pipe(
              catchError(() => {
                this.dialogService.openErrorDialog();
                return [];
              })
            )
        )
      )
      .subscribe(({ items }) => {
        this.commits = items;
      });
  }

  refreshBookmarks() {
    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.bookmarksApi
      .list({
        filters: { path: ['/explore/package'] },
        pagination: {
          page: this.paginationPageIndex,
          limit: this.paginationPageSize,
        },
      })
      .subscribe({
        next: ({ items, totalCount }) => {
          this.paginationItemCount = totalCount;
          this.bookmarks$.next(items);
          this.paginationDisabled = false;
        },
        error: () => {
          this.dialogService.openErrorDialog();
          this.dialogService.closeDialog(pendingActionDialog);
        },
        complete: () => this.dialogService.closeDialog(pendingActionDialog),
      });
  }

  submitForm() {
    const repositoryName = this.form.controls.repositoryName.value;
    const gitCommit = this.form.controls.gitCommit.value;
    const explorer = this.form.controls.explorer.value;

    this.router.navigate([explorer], {
      queryParams: { repositoryName, gitCommit },
      relativeTo: this.route,
    });
  }

  openBookmark(bookmark: Bookmark) {
    this.router.navigate([bookmark.path], {
      queryParams: bookmark.queryParams,
    });
  }

  deleteBookmark(bookmark: Bookmark) {
    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.bookmarksApi.delete({ id: bookmark.id }).subscribe({
      next: () => {
        this.refreshBookmarks();
      },
      error: () => {
        this.dialogService.openErrorDialog();
        this.dialogService.closeDialog(pendingActionDialog);
      },
      complete: () => this.dialogService.closeDialog(pendingActionDialog),
    });
  }
}
