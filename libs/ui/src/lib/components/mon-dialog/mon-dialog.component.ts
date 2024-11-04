import { Component, OnInit, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { MonDialogData } from "./mon-dialog.model";

@Component({
    selector: "empowered-mon-dialog",
    templateUrl: "./mon-dialog.component.html",
    styleUrls: ["./mon-dialog.component.scss"],
})
export class MonDialogComponent implements OnInit {
    closeButtonEnabled: boolean;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.close",
        "primary.portal.common.cancel",
        "primary.portal.administrators.addAdmin",
        "primary.portal.thirdParty.overlapEditExisting",
    ]);
    constructor(
        private readonly dialogRef: MatDialogRef<MonDialogComponent>,
        @Inject(MAT_DIALOG_DATA) readonly data: MonDialogData,
        private readonly language: LanguageService,
    ) {}
    /**
     * lifecycle method to set boolean value for hiding and showing close button
     */
    ngOnInit(): void {
        this.closeButtonEnabled = true;
        if (this.data.hideCloseButton) {
            this.closeButtonEnabled = false;
        }
    }
    /**
     * function to define actions on click of primary button
     */
    primaryButtonClick(): void {
        if (this.data.primaryButton && this.data.primaryButton.buttonAction) {
            this.data.primaryButton.buttonAction();
            this.dialogRef.close(this.data.primaryButton.buttonTitle);
        } else if (this.data.primaryButton.buttonTitle === this.languageStrings["primary.portal.administrators.addAdmin"]) {
            this.dialogRef.close(true);
        }
    }
    /**
     * function to close pop-up on click of close button
     */
    closePopup(): void {
        if (this.data.primaryButton.buttonTitle === this.languageStrings["primary.portal.thirdParty.overlapEditExisting"]) {
            this.secondaryButtonClick();
        } else {
            this.dialogRef.close();
        }
    }
    /**
     * function to define actions on click of secondary button
     */
    secondaryButtonClick(): void {
        if (this.data.secondaryButton && this.data.secondaryButton.buttonAction) {
            this.data.secondaryButton.buttonAction();
            this.dialogRef.close(this.data.secondaryButton.buttonTitle);
        } else if (this.data.secondaryButton.buttonTitle === this.languageStrings["primary.portal.common.cancel"]) {
            this.dialogRef.close(false);
        }
    }
}
