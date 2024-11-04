import { Component, Inject, Optional } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { AccountRefreshData } from "@empowered/constants";

@Component({
    selector: "empowered-account-refresh-modal",
    templateUrl: "./account-refresh-modal.component.html",
    styleUrls: ["./account-refresh-modal.component.scss"],
})
export class AccountRefreshModalComponent {
    constructor(
        @Optional() @Inject(MAT_DIALOG_DATA) readonly data: AccountRefreshData,
        private readonly dialogRef: MatDialogRef<AccountRefreshModalComponent>,
    ) {}

    /**
     * on click of it, close the modal
     */
    closeModal(): void {
        this.dialogRef.close();
    }
}
