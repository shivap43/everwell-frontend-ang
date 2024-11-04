import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { KnockoutType } from "@empowered/constants";
import { LanguageService } from "@empowered/language";

/**
 * @export
 * @class NotEligibleDialogComponent
 */
@Component({
    selector: "empowered-not-eligible-dialog",
    templateUrl: "./not-eligible-dialog.component.html",
    styleUrls: ["./not-eligible-dialog.component.scss"],
})
export class NotEligibleDialogComponent {
    knockout: any;
    isProducer: boolean;
    languageStrings = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.common.close",
        "primary.portal.common.cancel",
        "primary.portal.common.replace",
        "primary.portal.knockout.editResponses",
        "primary.portal.common.ok",
        "primary.portal.knockout.youareIneligible",
        "primary.portal.knockout.spouseIneligible",
        "primary.portal.knockout.applicantIneligible",
    ]);

    /**
     * Creates an instance of NotEligibleDialogComponent.
     * @param {MatDialogRef<NotEligibleDialogComponent>} dialogRef
     * @param {*} data
     * @memberof NotEligibleDialogComponent
     */
    constructor(
        private readonly dialogRef: MatDialogRef<NotEligibleDialogComponent>,
        private readonly languageService: LanguageService,
        @Inject(MAT_DIALOG_DATA) readonly data: any,
    ) {
        this.knockout = KnockoutType;
        this.isProducer = this.data.isProducer;
    }

    /**
     * @function onOK
     * @description Funtion to close the dialog on click of 'OK' button (Out of Scope: MON-744)
     * @memberof NotEligibleDialogComponent
     */
    onOK(): void {
        this.dialogRef.close({ action: "eligibilityCheck", knockoutType: this.data.knockout.type });
    }

    onClose(): void {
        this.dialogRef.close({ action: "ok" });
    }

    /**
     * @function onEdit
     * @description Function to close the dialog on click of 'Edit Responses' button
     * @memberof NotEligibleDialogComponent
     */
    onEdit(): void {
        this.dialogRef.close({ action: "edit" });
    }
}
