import { Component, OnInit } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Observable,
  ReplaySubject,
  Subject,
  catchError,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  from,
  map,
  mergeMap,
  tap,
} from 'rxjs';

import { BookmarksApiService } from '../../../shared/services/bookmarks-api.service';
import { DialogService } from '../../../shared/services/dialog.service';
import {
  ExploreApiService,
  PackageExploreResult,
} from '../../../shared/services/explore-api.service';
import { TokenService } from '../../../shared/services/token.service';

@Component({
  selector: 'app-package-explorer',
  templateUrl: './package-explorer.component.html',
  styleUrls: ['./package-explorer.component.css'],
})
export class PackageExplorerComponent implements OnInit {
  bookmarkForm = this.formBuilder.group({
    name: ['', [Validators.required]],
  });

  isNoDataAvailable = false;
  _packageTree: string[] = [];
  get packageTree() {
    return this._packageTree;
  }
  set packageTree(value: string[]) {
    this._packageTree = value;
    this.packageTreeChanges$.next(value);
  }
  packageTreeChanges$ = new Subject<string[]>();
  items$ = new ReplaySubject<PackageExploreResult['items']>(1);
  itemsRefreshRequests$ = new Subject<void>();
  pagination$ = new Subject<PageEvent>();

  paginationDisabled = true;
  paginationItemCount = 0;
  paginationPageSize = 10;
  paginationPageIndex = 0;

  constructor(
    private readonly bookmarksApi: BookmarksApiService,
    private readonly exploreApi: ExploreApiService,
    private readonly dialogService: DialogService,
    private readonly tokenService: TokenService,
    private readonly formBuilder: NonNullableFormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const queryParamMap = this.route.snapshot.queryParamMap;
    const repositoryName = queryParamMap.get('repositoryName') || '';
    const gitCommit = queryParamMap.get('gitCommit') || '';
    this.paginationPageIndex = parseInt(queryParamMap.get('page') || '0');

    this.refreshDataAvailability(repositoryName, gitCommit);
    this.itemsRefreshRequests$
      .pipe(
        debounceTime(100),
        mergeMap(() => this.refreshItems(repositoryName, gitCommit))
      )
      .subscribe(() => {
        // do nothing
      });
    this.packageTreeChanges$
      .pipe(
        distinctUntilChanged((a, b) => a.join('.') === b.join('.')),
        concatMap((packageTree) =>
          from(
            this.router.navigate([], {
              queryParams: {
                package: packageTree.length > 0 ? packageTree.join('.') : null,
              },
              queryParamsHandling: 'merge',
              relativeTo: this.route,
            })
          )
        )
      )
      .subscribe(() => this.itemsRefreshRequests$.next());
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
        this.itemsRefreshRequests$.next();
      });

    this.packageTree = queryParamMap.get('package')?.split('.') || [];
  }

  isLoggedIn() {
    return this.tokenService.isLoggedIn();
  }

  refreshItems(
    repositoryName: string,
    gitCommit: string
  ): Observable<PackageExploreResult> {
    return this.exploreApi
      .explorePackage({
        repositoryName,
        gitCommit,
        packageName: this.packageTree.join('.'),
        pagination: {
          limit: this.paginationPageSize,
          page: this.paginationPageIndex,
        },
      })
      .pipe(
        catchError(() => {
          this.paginationItemCount = 0;
          this.items$.next([]);
          this.dialogService.openErrorDialog();
          return [];
        }),
        tap(({ items, totalCount }) => {
          this.paginationItemCount = totalCount;
          this.items$.next(items);
          this.paginationDisabled = false;
        })
      );
  }

  refreshDataAvailability(repositoryName: string, gitCommit: string) {
    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.exploreApi
      .explorePackage({
        repositoryName,
        gitCommit,
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

  getIcon(item: { type: string }) {
    switch (item.type) {
      case 'package':
        return 'folder';
      case 'class':
        return 'code';
      default:
        return 'question_mark';
    }
  }

  open(item: PackageExploreResult['items'][0]) {
    if (item.type === 'package') {
      this.packageTree = [...this.packageTree, item.value];
    }
  }

  backToPackageIndex(index: number) {
    this.packageTree = this.packageTree.slice(0, index + 1);
  }

  submitBookmarkForm() {
    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.bookmarksApi
      .createFromCurrentPath(this.bookmarkForm.controls.name.value)
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
