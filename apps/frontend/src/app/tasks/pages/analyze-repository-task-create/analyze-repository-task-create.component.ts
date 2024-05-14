import { Component, OnInit } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ReplaySubject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  from,
  mergeMap,
  startWith,
} from 'rxjs';

import { DialogService } from '../../../shared/services/dialog.service';
import {
  RepositoriesApiService,
  Repository,
  RepositoryList,
} from '../../../shared/services/repositories-api.service';
import { TasksApiService } from '../../../shared/services/tasks-api.service';

@Component({
  selector: 'app-analyze-repository-task-create',
  templateUrl: './analyze-repository-task-create.component.html',
  styleUrls: ['./analyze-repository-task-create.component.css'],
})
export class AnalyzeRepositoryTaskCreateComponent implements OnInit {
  form = this.formBuilder.group({
    repository: [null as Repository | null, [Validators.required]],
    gitRef: ['', [Validators.required]],
  });

  repositories$ = new ReplaySubject<RepositoryList['items']>(1);
  autocompleteRepository$ = new ReplaySubject<string>(1);
  repositoryId?: string;

  constructor(
    private readonly repositoriesApi: RepositoriesApiService,
    private readonly tasksApi: TasksApiService,
    private readonly dialogService: DialogService,
    private readonly formBuilder: NonNullableFormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const repositoryId =
      this.route.snapshot.queryParamMap.get('repositoryId') || undefined;
    this.repositoryId = repositoryId;
    this.repositories$.next([]);

    if (repositoryId) {
      this.form.controls.repository.disable();
      this.getRepository(repositoryId);
    } else {
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
    }
  }

  getRepository(repositoryId: string) {
    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.repositoriesApi.getById({ id: repositoryId }).subscribe({
      next: (repository) => {
        this.repositories$.next([repository]);
        this.form.patchValue({ repository });
      },
      error: () => {
        this.dialogService.openErrorDialog();
        this.dialogService.closeDialog(pendingActionDialog);
      },
      complete: () => this.dialogService.closeDialog(pendingActionDialog),
    });
  }

  displayRepository(value?: Repository | null) {
    return value ? value.repositoryName : '';
  }

  submitForm() {
    const repositoryId = this.form.controls.repository.value?.id;
    const gitRef = this.form.controls.gitRef.value;
    if (repositoryId === undefined) {
      return;
    }

    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.tasksApi
      .createAnalyzeRepositoryTask({ repositoryId, gitRef })
      .pipe(
        mergeMap(() => {
          if (repositoryId === this.repositoryId) {
            return from(
              this.router.navigate(['/repositories', 'view', repositoryId])
            );
          } else {
            return from(
              this.router.navigate(['.'], { relativeTo: this.route.parent })
            );
          }
        })
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
