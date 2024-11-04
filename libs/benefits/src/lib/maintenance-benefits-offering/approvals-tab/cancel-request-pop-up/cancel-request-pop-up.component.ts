import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ApprovalRequest } from "@empowered/api";
import { StatusType } from "@empowered/constants";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-cancel-request-pop-up",
    templateUrl: "./cancel-request-pop-up.component.html",
    styleUrls: ["./cancel-request-pop-up.component.scss"],
})
export class CancelRequestPopUpComponent {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.maintenanceBenefitsOffering.cancelRequestPopUp.yesCancelRequest",
        "primary.portal.maintenanceBenefitsOffering.cancelRequestPopUp.integrationAdminApproval",
        "primary.portal.maintenanceBenefitsOffering.cancelRequestPopUp.adminApproval",
        "primary.portal.common.back",
    ]);
    approvalRequestStatusType = StatusType;

    /**
     * This method will be automatically invoked when an instance of the class is created.
     * @param approvalRequest is injected data while opening dialog
     * @param dialogRef is mat-dialog reference of CancelRequestPopUpComponent
     * @param language is reference of LanguageService
     */
    constructor(
        @Inject(MAT_DIALOG_DATA) readonly approvalRequest: ApprovalRequest,
        private readonly dialogRef: MatDialogRef<CancelRequestPopUpComponent>,
        private readonly language: LanguageService
    ) {}

    /**
     * This method will be called to close dialog on click of cancel request
     */
    onSubmit(): void {
        this.dialogRef.close(true);
    }
}
