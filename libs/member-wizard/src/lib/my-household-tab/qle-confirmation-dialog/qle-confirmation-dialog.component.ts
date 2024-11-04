import { Component } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";

import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-qle-confirmation-dialog",
    templateUrl: "./qle-confirmation-dialog.component.html",
    styleUrls: ["./qle-confirmation-dialog.component.scss"],
})
export class QleConfirmationDialogComponent {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.enrollment.header",
        "primary.portal.common.close",
        "primary.portal.common.cancel",
        "primary.portal.myHouseHoldTab.qleConfirmationDialog.confirmationTitle",
        "primary.portal.myHouseHoldTab.qleConfirmationDialog.confirmationDescription",
        "primary.portal.myHouseHoldTab.qleConfirmationDialog.noContinue",
        "primary.portal.myHouseHoldTab.qleConfirmationDialog.yesComplete",
    ]);

    constructor(
        private readonly dialogRef: MatDialogRef<QleConfirmationDialogComponent>,
        private readonly language: LanguageService
    ) {}

    closePopup(): void {
        this.dialogRef.close();
    }
    secondaryButtonClick(): void {}
    primaryButtonClick(): void {}
}
