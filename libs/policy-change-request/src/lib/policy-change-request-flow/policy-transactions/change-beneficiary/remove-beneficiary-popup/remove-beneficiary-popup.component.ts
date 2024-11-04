import { Component } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-remove-beneficiary-popup",
    templateUrl: "./remove-beneficiary-popup.component.html",
    styleUrls: ["./remove-beneficiary-popup.component.scss"],
})
export class RemoveBeneficiaryPopupComponent {
    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.policyChangeRequest.transactions.cancel",
        "primary.portal.policyChangeRequest.transactions.remove",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.removeBenificiary.confirmationPopoup",
    ]);

    constructor(
        private readonly dialogRef: MatDialogRef<RemoveBeneficiaryPopupComponent>,
        private readonly languageService: LanguageService
    ) {}

    /**
     * On click on cancel button
     */
    onCancelClick(): void {
        this.dialogRef.close({ remove: false });
    }
    /**
     * On click on continue button
     */
    onRemoveClick(): void {
        this.dialogRef.close({ remove: true });
    }
}
