import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ReplaySubject,
  Subject,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  from,
  map,
} from 'rxjs';

import {
  Bookmark,
  BookmarkList,
  BookmarksApiService,
} from '../shared/services/bookmarks-api.service';
import { DialogService } from '../shared/services/dialog.service';

@Component({
  selector: 'app-visualizations',
  templateUrl: './visualizations.component.html',
  styleUrls: ['./visualizations.component.css'],
})
export class VisualizationsComponent implements OnInit {
  bookmarks$ = new ReplaySubject<BookmarkList['items']>(1);
  pagination$ = new Subject<PageEvent>();

  paginationDisabled = true;
  paginationItemCount = 0;
  paginationPageSize = 10;
  paginationPageIndex = 0;

  constructor(
    private readonly bookmarksApi: BookmarksApiService,
    private readonly dialogService: DialogService,
    private readonly route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.paginationPageIndex = parseInt(
      this.route.snapshot.queryParamMap.get('page') || '0'
    );
    this.refreshBookmarks();
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

  refreshBookmarks() {
    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.bookmarksApi
      .list({
        filters: {
          path: [
            '/visualizations/multi-select',
            '/visualizations/side-by-side',
          ],
        },
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
