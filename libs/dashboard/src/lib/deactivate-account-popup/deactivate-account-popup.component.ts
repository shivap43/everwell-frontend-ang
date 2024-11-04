import { Component, OnInit, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";

interface DialogData {
    checkedOutAccount: boolean;
    cancelButton: string;
    deactivateButton: string;
    accountName: any;
    mpGroup: string;
    title: string;
    deactivateMsg: string;
}

@Component({
    selector: "empowered-deactivate-account-popup",
    templateUrl: "./deactivate-account-popup.component.html",
    styleUrls: ["./deactivate-account-popup.component.scss"],
})
export class DeactivateAccountPopupComponent implements OnInit {
    deactivateTitle: string;
    deactivateMsg: string;
    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.common.close",
        "primary.portal.dashboard.deactivateAccount.disableDiactivateMessage",
    ]);
    isAccountCheckedOut = false;

    constructor(
        private readonly dialogRef: MatDialogRef<DeactivateAccountPopupComponent>,
        @Inject(MAT_DIALOG_DATA) readonly data: DialogData,
        private readonly languageService: LanguageService
    ) {}

    ngOnInit(): void {
        this.deactivateTitle = this.data.title.replace("#name", this.data.accountName);
        this.deactivateMsg = this.data.deactivateMsg.replace("#name", this.data.accountName);
        this.isAccountCheckedOut = this.data.checkedOutAccount;
    }

    onCancelClick(): void {
        this.dialogRef.close();
    }
    onDeActivateAccount(): void {
        this.dialogRef.close(this.data.mpGroup);
    }
}
