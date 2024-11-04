import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { PortalType } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { ConfirmationDialogData } from "@empowered/ui";
import { SharedState } from "@empowered/ngxs-store";
import { Store } from "@ngxs/store";

// TODO: This component can be moved to shared and can be used in member components
@Component({
    selector: "empowered-dependent-exit-dialog",
    templateUrl: "dependent-exit-dialog.component.html",
})
export class DependentExitDialogComponent {
    message: string;
    confirmButtonText: string;
    dismissButtonText: string;
    portal: string;
    isMMP = false;
    languageStrings = {
        ariaCancel: this.language.fetchPrimaryLanguageValue("primary.portal.common.cancel"),
    };

    constructor(
        private readonly dialogRef: MatDialogRef<DependentExitDialogComponent>,
        @Inject(MAT_DIALOG_DATA) readonly data: ConfirmationDialogData,
        private readonly language: LanguageService,
        private readonly store: Store,
    ) {
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.isMMP = this.portal === PortalType.MEMBER;
    }

    primaryButtonClick(): void {
        if (this.data.primaryButton && this.data.primaryButton.buttonAction) {
            this.data.primaryButton.buttonAction();
            this.dialogRef.close("primary.portal.common.save");
        }
    }

    closePopup(): void {
        this.dialogRef.close();
    }

    secondaryButtonClick(): void {
        if (this.data.secondaryButton && this.data.secondaryButton.buttonAction) {
            this.data.secondaryButton.buttonAction();
            this.dialogRef.close("primary.portal.common.doNotSave");
        }
    }
}
