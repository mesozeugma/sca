import { Component, OnInit } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { mergeMap } from 'rxjs';

import { DialogService } from '../../../shared/services/dialog.service';
import {
  RepositoriesApiService,
  RepositoryUpsertOptions,
} from '../../../shared/services/repositories-api.service';

@Component({
  selector: 'app-repository-edit',
  templateUrl: './repository-edit.component.html',
  styleUrls: ['./repository-edit.component.css'],
})
export class RepositoryEditComponent implements OnInit {
  form = this.formBuilder.group({
    repositoryName: ['', [Validators.required]],
    gitCloneUrl: ['', [Validators.required]],
    defaults: this.formBuilder.group({
      buildTool: ['', [Validators.required]],
      isSonarQubeEnabled: [false, [Validators.required]],
      javaVersion: ['', [Validators.required]],
      pythonVersion: ['', [Validators.required]],
      workdir: ['.', [Validators.required]],
    }),
  });
  defaultsOptions: RepositoryUpsertOptions['defaults'] = {
    buildTool: [],
    javaVersion: [],
    pythonVersion: [],
  };
  repositoryId = '';

  constructor(
    private readonly repositoriesApi: RepositoriesApiService,
    private readonly dialogService: DialogService,
    private readonly formBuilder: NonNullableFormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.repositoryId = this.route.snapshot.paramMap.get('repositoryId') || '';
    this.getFormValues();
  }

  getFormValues() {
    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.repositoriesApi
      .getUpsertOptions()
      .pipe(
        mergeMap((options) => {
          this.defaultsOptions = options.defaults;
          return this.repositoriesApi.getById({ id: this.repositoryId });
        })
      )
      .subscribe({
        next: (result) => {
          this.form.setValue({
            repositoryName: result.repositoryName,
            gitCloneUrl: result.gitCloneUrl,
            defaults: result.defaults,
          });
          this.form.controls.repositoryName.disable();
        },
        error: () => {
          this.dialogService.openErrorDialog();
          this.dialogService.closeDialog(pendingActionDialog);
        },
        complete: () => this.dialogService.closeDialog(pendingActionDialog),
      });
  }

  submitForm() {
    const repositoryId = this.repositoryId;
    const repositoryName = this.form.controls.repositoryName.value;
    const gitCloneUrl = this.form.controls.gitCloneUrl.value;
    const defaultsControls = this.form.controls.defaults.controls;

    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.repositoriesApi
      .upsert({
        repositoryId,
        repositoryName,
        gitCloneUrl,
        defaults: {
          buildTool: defaultsControls.buildTool.value,
          isSonarQubeEnabled: defaultsControls.isSonarQubeEnabled.value,
          javaVersion: defaultsControls.javaVersion.value,
          pythonVersion: defaultsControls.pythonVersion.value,
          workdir: defaultsControls.workdir.value,
        },
      })
      .subscribe({
        next: () => {
          this.router.navigate(['view', repositoryId], {
            relativeTo: this.route.parent,
          });
        },
        error: () => {
          this.dialogService.openErrorDialog();
          this.dialogService.closeDialog(pendingActionDialog);
        },
        complete: () => this.dialogService.closeDialog(pendingActionDialog),
      });
  }
}
