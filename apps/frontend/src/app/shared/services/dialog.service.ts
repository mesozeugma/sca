import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import { ErrorDialogComponent } from '../components/error-dialog/error-dialog.component';
import { PendingActionDialogComponent } from '../components/pending-action-dialog/pending-action-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private readonly dialogs = new Map<
    string,
    MatDialogRef<ErrorDialogComponent | PendingActionDialogComponent>
  >();
  private id = 0;

  constructor(private readonly dialog: MatDialog) {}

  private nextId() {
    return String(this.id++);
  }

  closeDialog(id: string) {
    this.dialogs.get(id)?.close();
    this.dialogs.delete(id);
  }

  openErrorDialog() {
    const dialogId = this.nextId();
    const createdDialog = this.dialog.open(ErrorDialogComponent, {
      closeOnNavigation: true,
      disableClose: true,
    });

    this.dialogs.set(dialogId, createdDialog);
    createdDialog.afterClosed().subscribe({
      next: () => {
        // do nothing
      },
      error: () => {
        this.dialogs.delete(dialogId);
      },
      complete: () => {
        this.dialogs.delete(dialogId);
      },
    });

    return dialogId;
  }

  openPendingActionDialog() {
    const dialogId = this.nextId();
    const createdDialog = this.dialog.open(PendingActionDialogComponent, {
      closeOnNavigation: true,
      disableClose: true,
    });

    this.dialogs.set(dialogId, createdDialog);
    createdDialog.afterClosed().subscribe({
      next: () => {
        // do nothing
      },
      error: () => {
        this.dialogs.delete(dialogId);
      },
      complete: () => {
        this.dialogs.delete(dialogId);
      },
    });

    return dialogId;
  }
}
