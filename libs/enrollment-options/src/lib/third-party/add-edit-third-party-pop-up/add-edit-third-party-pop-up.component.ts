import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-add-edit-third-party-pop-up",
    templateUrl: "./add-edit-third-party-pop-up.component.html",
    styleUrls: ["./add-edit-third-party-pop-up.component.scss"],
})
export class AddEditThirdPartyPopUpComponent {
    showCancel = false;
    closeIcon = false;
    languageStrings = this.language.fetchPrimaryLanguageValues([
        "primary.portal.thirdParty.adjacentDates",
        "primary.portal.common.cancel",
        "primary.portal.thirdParty.overlapEditExisting",
    ]);

    constructor(
        private readonly language: LanguageService,
        private readonly dialogRef: MatDialogRef<AddEditThirdPartyPopUpComponent>,
        @Inject(MAT_DIALOG_DATA) readonly data: string
    ) {}

    /**
     * function to define actions on click of primary button
     */
    primaryButtonClick(): void {
        this.dialogRef.close(this.languageStrings["primary.portal.thirdParty.overlapEditExisting"]);
    }

    /**
     * function to define actions on click of secondary button
     */
    secondaryButtonClick(): void {
        this.dialogRef.close(this.languageStrings["primary.portal.common.cancel"]);
    }
}
