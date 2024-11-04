import { Component, Inject } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
    selector: "empowered-ag-offering-submit-popup",
    templateUrl: "./ag-offering-submit-popup.component.html",
    styleUrls: ["./ag-offering-submit-popup.component.scss"],
})
export class AgOfferingSubmitPopupComponent {
    isAdminApprovalRequired: boolean;

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.reviewSubmit.submitToHR.title",
        "primary.portal.reviewSubmit.submitToHQ.title",
        "primary.portal.reviewSubmit.submitToHR.subTitle",
        "primary.portal.reviewSubmit.submitToHQ.subTitle",
        "primary.portal.reviewSubmit.submitToAdmin.subTitle",
        "primary.portal.common.gotIt",
        "primary.portal.reviewSubmit.hQVas.adminAdded.message",
    ]);

    constructor(
        private readonly language: LanguageService,
        @Inject(MAT_DIALOG_DATA)
        readonly data: {
            isSharedAccount: boolean;
            isAutoApproved: boolean;
            isAdminApprovalRequired?: boolean;
        },
    ) {
        this.isAdminApprovalRequired = data.isAdminApprovalRequired ?? true;
    }
}
