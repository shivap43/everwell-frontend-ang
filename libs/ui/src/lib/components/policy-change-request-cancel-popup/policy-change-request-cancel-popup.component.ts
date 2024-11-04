import { Component, OnInit, Inject, Optional } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";

export interface ImportData {
    cancelButton: string;
    backButton?: string;
    gotItButton?: string;
    removeButton?: string;
    requestType: string;
    description: string;
    cancelModalDisplayType: string;
}

@Component({
    selector: "empowered-policy-change-request-cancel-popup",
    templateUrl: "./policy-change-request-cancel-popup.component.html",
    styleUrls: ["./policy-change-request-cancel-popup.component.scss"],
})
export class PolicyChangeRequestCancelPopupComponent implements OnInit {
    policyChangeTitle: string;
    policyChangeMsg: string;
    showPolicyFlowCancelModal: boolean;
    showPolicyFlowRemoveModal: boolean;
    showPolicyFlowNoUpdateModal: boolean;
    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.dashboard.policyChangeRequestFlow.pcrFlow",
        "primary.portal.dashboard.policyChangeRequestFlow.noUpdateOnReviewSubmit",
        "primary.portal.dashboard.policyChangeRequestFlow.remove",
        "primary.portal.dashboard.policyChangeRequestFlow.nextStep",
        "primary.portal.dashboard.policyChangeRequestFlow.continueMessageTitle",
        "primary.portal.dashboard.policyChangeRequestFlow.continueMessage",
        "primary.portal.common.close",
    ]);

    constructor(
        private readonly dialogRef: MatDialogRef<PolicyChangeRequestCancelPopupComponent>,
        @Optional() @Inject(MAT_DIALOG_DATA) readonly data: ImportData,
        private readonly languageService: LanguageService,
    ) {}

    ngOnInit(): void {
        if (this.data.cancelModalDisplayType === this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.pcrFlow"]) {
            this.showPolicyFlowCancelModal = true;
        } else if (this.data.cancelModalDisplayType === this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.remove"]) {
            this.policyChangeTitle = this.data.description;
            this.showPolicyFlowRemoveModal = true;
        } else if (
            this.data.cancelModalDisplayType ===
            this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.noUpdateOnReviewSubmit"]
        ) {
            this.policyChangeTitle = this.data.description;
            this.showPolicyFlowNoUpdateModal = true;
        }
    }

    /**
     * On click on cancel button
     */
    onCancelClick(): void {
        this.dialogRef.close("cancel");
    }

    onCloseClick(): void {
        this.dialogRef.close();
    }

    onGotItClick(): void {
        this.dialogRef.close();
    }
    onBackClick(): void {
        this.dialogRef.close();
    }
    onRemoveClick(): void {
        this.dialogRef.close("remove");
    }
}
