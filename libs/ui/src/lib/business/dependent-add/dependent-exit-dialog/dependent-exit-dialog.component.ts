import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { ConfirmationDialogData } from "../../../business/confirmation-dialog/confirmation-dialog.model";

@Component({
    selector: "empowered-dependent-exit-dialog",
    templateUrl: "dependent-exit-dialog.component.html",
})
export class DependentExitDialogComponent {
    message: string;
    confirmButtonText: string;
    dismissButtonText: string;
    languageStrings = {
        ariaCancel: this.language.fetchPrimaryLanguageValue("primary.portal.common.cancel"),
    };

    constructor(
        private readonly dialogRef: MatDialogRef<DependentExitDialogComponent>,
        @Inject(MAT_DIALOG_DATA) readonly data: ConfirmationDialogData,
        private readonly language: LanguageService,
    ) {}

    /**
     * On click of Save button
     */
    primaryButtonClick(): void {
        if (this.data.primaryButton && this.data.primaryButton.buttonAction) {
            this.data.primaryButton.buttonAction();
            this.dialogRef.close("primary.portal.common.save");
        }
    }

    /**
     * This will close the pop up
     */
    closePopup(): void {
        this.dialogRef.close();
    }

    /**
     * On click of Do not Save button
     */
    secondaryButtonClick(): void {
        if (this.data.secondaryButton && this.data.secondaryButton.buttonAction) {
            this.data.secondaryButton.buttonAction();
            this.dialogRef.close("primary.portal.common.doNotSave");
        }
    }
}
