import { Component, OnInit, Inject, Optional } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { AppSettings } from "@empowered/constants";
import { LanguageService } from "@empowered/language";

export interface InputData {
    cancelButton: string;
    continueButton: string;
    requestType: string;
}

@Component({
    selector: "empowered-policy-change-request-confirmation-popup",
    templateUrl: "./policy-change-request-confirmation-popup.component.html",
    styleUrls: ["./policy-change-request-confirmation-popup.component.scss"],
})
export class PolicyChangeRequestConfirmationPopupComponent implements OnInit {
    policyChangeTitle: string;
    policyChangeMsg: string;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues(["primary.portal.common.close"]);

    constructor(
        private readonly dialogRef: MatDialogRef<PolicyChangeRequestConfirmationPopupComponent>,
        private readonly language: LanguageService,
        @Optional() @Inject(MAT_DIALOG_DATA) readonly data: InputData,
    ) {}

    ngOnInit(): void {
        // TODO - Text will come from language directive
        this.policyChangeTitle = "Continue without completing this change request?";
        this.policyChangeMsg = `${this.data.requestType} request will not be submitted`;
    }

    /**
     * On click on cancel button
     */
    onCancelClick(): void {
        this.dialogRef.close(AppSettings.CANCEL);
    }

    /**
     * On click on continue button
     */
    onContinueClick(): void {
        this.dialogRef.close(AppSettings.CONTINUE);
    }
}
