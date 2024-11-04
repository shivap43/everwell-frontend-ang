import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ConfirmationDialogData } from "./confirmation-dialog.model";
import { LanguageService } from "@empowered/language";
import { Store } from "@ngxs/store";
import { SharedState } from "@empowered/ngxs-store";
import { PortalType } from "@empowered/constants";

const SAVE = "Save";
const DONT_SAVE = "Don't Save";

@Component({
    selector: "empowered-confirmation-dialog",
    templateUrl: "confirmation-dialog.component.html",
})
export class ConfirmationDialogComponent {
    message: string;
    confirmButtonText: string;
    dismissButtonText: string;
    portal: string;
    isMMP = false;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues(["primary.portal.common.close"]);

    constructor(
        private readonly language: LanguageService,
        private readonly dialogRef: MatDialogRef<ConfirmationDialogComponent>,
        @Inject(MAT_DIALOG_DATA) readonly data: ConfirmationDialogData,
        private readonly store: Store,
    ) {
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.isMMP = this.portal === PortalType.MEMBER;
    }

    primaryButtonClick(): void {
        if (this.data.primaryButton && this.data.primaryButton.buttonAction) {
            this.data.primaryButton.buttonAction();
            this.dialogRef.close(SAVE);
        }
    }
    closePopup(): void {
        this.dialogRef.close();
    }

    secondaryButtonClick(): void {
        if (this.data.secondaryButton && this.data.secondaryButton.buttonAction) {
            this.data.secondaryButton.buttonAction();
            this.dialogRef.close(DONT_SAVE);
        }
    }
}
