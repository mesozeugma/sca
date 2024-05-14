import { Component, OnInit } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { DialogService } from '../../../shared/services/dialog.service';
import {
  RepositoriesApiService,
  RepositoryUpsertOptions,
} from '../../../shared/services/repositories-api.service';

@Component({
  selector: 'app-repository-create',
  templateUrl: './repository-create.component.html',
  styleUrls: ['./repository-create.component.css'],
})
export class RepositoryCreateComponent implements OnInit {
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

  constructor(
    private readonly repositoriesApi: RepositoriesApiService,
    private readonly dialogService: DialogService,
    private readonly formBuilder: NonNullableFormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.getFormValues();
  }

  getFormValues() {
    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.repositoriesApi.getUpsertOptions().subscribe({
      next: (result) => {
        this.defaultsOptions = result.defaults;
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
    const gitCloneUrl = this.form.controls.gitCloneUrl.value;
    const defaultsControls = this.form.controls.defaults.controls;

    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.repositoriesApi
      .create({
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
        next: ({ repositoryId }) => {
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
