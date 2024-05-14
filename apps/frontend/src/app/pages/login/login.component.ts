import { Component } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AdminApiService } from '../../shared/services/admin-api.service';
import { DialogService } from '../../shared/services/dialog.service';
import { TokenService } from '../../shared/services/token.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  form = this.formBuilder.group({
    token: ['', [Validators.required]],
  });

  constructor(
    private readonly adminApi: AdminApiService,
    private readonly tokenService: TokenService,
    private readonly dialogService: DialogService,
    private readonly formBuilder: NonNullableFormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  submitForm() {
    const token = this.form.controls.token.value;

    this.tokenService.saveToken(token);

    const pendingActionDialog = this.dialogService.openPendingActionDialog();

    this.adminApi.whoAmI().subscribe({
      next: ({ isAdmin }) => {
        if (isAdmin) {
          this.router.navigate(['.'], { relativeTo: this.route.parent });
        } else {
          this.tokenService.deleteToken();
          this.form.reset();
          this.dialogService.openErrorDialog();
        }
      },
      error: () => {
        this.dialogService.openErrorDialog();
        this.dialogService.closeDialog(pendingActionDialog);
      },
      complete: () => this.dialogService.closeDialog(pendingActionDialog),
    });
  }
}
