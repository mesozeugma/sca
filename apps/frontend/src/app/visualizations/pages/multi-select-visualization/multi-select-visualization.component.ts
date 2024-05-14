import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ReplaySubject,
  catchError,
  combineLatest,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  from,
  mergeMap,
  startWith,
} from 'rxjs';

import { Dashboard } from '../../../shared/interfaces/dashboard.interface';
import { BookmarksApiService } from '../../../shared/services/bookmarks-api.service';
import { DashboardsApiService } from '../../../shared/services/dashboards-api.service';
import { DialogService } from '../../../shared/services/dialog.service';
import {
  RepositoriesApiService,
  RepositoryPublicAnalysesList,
} from '../../../shared/services/repositories-api.service';
import { TokenService } from '../../../shared/services/token.service';
import { distinctUntilChangedJSON } from '../../../shared/utils/rxjs';

@Component({
  selector: 'app-multi-select-visualization',
  templateUrl: './multi-select-visualization.component.html',
  styleUrls: ['./multi-select-visualization.component.css'],
})
export class MultiSelectVisualizationComponent implements OnInit {
  autocompleteRepositoryForm = this.formBuilder.control('');
  form = this.formBuilder.group({
    dateStart: ['', [Validators.required]],
    dateEnd: ['', [Validators.required]],
    repositories: [
      [] as string[],
      [Validators.required, Validators.minLength(1), Validators.maxLength(10)],
    ],
    codeQuantity: [false, [Validators.required]],
    codeQuality: [false, [Validators.required]],
    bookmarkName: [''],
  });
  repositories: string[] = [];
  commits: RepositoryPublicAnalysesList['items'] = [];
  dashboard: Dashboard | undefined;
  autocompleteDate$ = new ReplaySubject<string>(1);
  autocompleteRepository$ = new ReplaySubject<string>(1);
  @ViewChild('repositoryInput') repositoryInput!: ElementRef<HTMLInputElement>;

  constructor(
    private readonly bookmarksApi: BookmarksApiService,
    private readonly dashboardsApi: DashboardsApiService,
    private readonly repositoriesApi: RepositoriesApiService,
    private readonly dialogService: DialogService,
    private readonly tokenService: TokenService,
    private readonly formBuilder: NonNullableFormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.initDateListing();
    this.form.valueChanges
      .pipe(
        distinctUntilChangedJSON(),
        concatMap((values) => this.saveFormStateToRoute(values))
      )
      .subscribe(() => {
        // do nothing
      });
    this.loadFormStateFromRoute();

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
      .subscribe(
        ({ items }) =>
          (this.repositories = items
            .map((e) => e.repositoryName)
            .filter((e) => !this.form.controls.repositories.value.includes(e)))
      );
  }

  initDateListing(): void {
    combineLatest({
      repositoryNames: this.form.controls.repositories.valueChanges,
      searchText: this.autocompleteDate$.pipe(startWith('')),
    })
      .pipe(
        debounceTime(300),
        distinctUntilChangedJSON(),
        mergeMap(({ searchText, repositoryNames }) =>
          this.repositoriesApi
            .listPublicAnalyses({
              repositoryNames,
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

  isLoggedIn() {
    return this.tokenService.isLoggedIn();
  }

  addRepository(event: MatChipInputEvent) {
    console.log('add');
    const value = (event.value || '').trim();

    if (value) {
      const currentValue = this.form.controls.repositories.value;
      this.form.controls.repositories.setValue([...currentValue, value]);
      this.repositories = this.repositories.filter((e) => e !== value);
    }

    event.chipInput?.clear();
    this.autocompleteRepositoryForm.setValue('');
  }

  selectRepository(value: string) {
    const currentValue = this.form.controls.repositories.value;
    this.form.controls.repositories.setValue([...currentValue, value]);
    this.repositories = this.repositories.filter((e) => e !== value);

    this.repositoryInput.nativeElement.value = '';
    this.autocompleteRepositoryForm.setValue('');
  }

  deselectRepository(repository: string) {
    const currentValue = this.form.controls.repositories.value;
    this.form.controls.repositories.setValue([
      ...currentValue.filter((e) => e !== repository),
    ]);
  }

  submitForm() {
    const dateStart = this.form.controls.dateStart.value;
    const dateEnd = this.form.controls.dateEnd.value;
    if (dateStart.length === 0 || dateEnd.length === 0) return;
    const codeQuantity = this.form.controls.codeQuantity.value;
    const codeQuality = this.form.controls.codeQuality.value;
    const repositories = this.form.controls.repositories.value;

    this.dashboard = undefined;
    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.dashboardsApi
      .getMultiSelect({
        from: dateStart,
        to: dateEnd,
        repositories,
        panels: {
          codeQuantity,
          codeQuality,
        },
      })
      .subscribe({
        next: (result) => {
          this.dashboard = result;
        },
        error: () => {
          this.dialogService.openErrorDialog();
          this.dialogService.closeDialog(pendingActionDialog);
        },
        complete: () => this.dialogService.closeDialog(pendingActionDialog),
      });
  }

  saveFormStateToRoute(values: (typeof this.form)['value']) {
    const queryParams = new Map<string, string>();
    for (const [key, value] of Object.entries(values)) {
      if (key === 'bookmarkName') {
        continue;
      }
      if (typeof value === 'boolean') {
        queryParams.set(key, value.toString());
      } else if (Array.isArray(value) && value.length > 0) {
        queryParams.set(
          key,
          value
            .filter((e) => e.length > 0)
            .map((e) => encodeURIComponent(e))
            .join('/')
        );
      } else if (typeof value === 'string' && value.length > 0) {
        queryParams.set(key, value);
      }
    }
    return from(
      this.router.navigate([], {
        queryParams: Object.fromEntries(queryParams.entries()),
        relativeTo: this.route,
      })
    );
  }

  loadFormStateFromRoute() {
    const queryParams = this.route.snapshot.queryParamMap;
    for (const [name, control] of Object.entries(this.form.controls)) {
      const value = queryParams.get(name);
      if (name === 'panels') {
        continue;
      }
      if (value === null || value.length === 0) {
        continue;
      }
      if (typeof control.value === 'boolean') {
        control.setValue(value === 'true');
      } else if (typeof control.value === 'string') {
        control.setValue(value);
      } else {
        control.setValue(value.split('/').map((e) => decodeURIComponent(e)));
      }
    }
  }

  saveBookmark() {
    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.bookmarksApi
      .createFromCurrentPath(this.form.controls.bookmarkName.value)
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
