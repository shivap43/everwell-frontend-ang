import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ApprovalRequest } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { ProductsPlansQuasiService } from "../../products-plans-quasi";

@Component({
    selector: "empowered-changes-review-pop-up",
    templateUrl: "./changes-review-pop-up.component.html",
    styleUrls: ["./changes-review-pop-up.component.scss"],
})
export class ChangesReviewPopUpComponent {
    languageStrings = this.language.fetchPrimaryLanguageValues([
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.reviewModalTitle",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.reviewModalDesc",
        "primary.portal.maintenanceBenefitsOffering.approval.requestedChanges",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.reviewModalUpdates",
        "primary.portal.maintenanceBenefitsOffering.changesReviewPopUp.resubmitOfferingReview",
        "primary.portal.common.gotIt",
    ]);
    isAdmin: boolean;

    /**
     * This method will be automatically invoked when an instance of the class is created.
     * @param approvalRequest is injected data while opening dialog
     * @param language is reference of LanguageService
     * @param quasiService is reference of ProductsPlansQuasiService
     */
    constructor(
        @Inject(MAT_DIALOG_DATA) readonly approvalRequest: ApprovalRequest,
        private readonly language: LanguageService,
        private readonly quasiService: ProductsPlansQuasiService
    ) {
        this.isAdmin = this.quasiService.isAdminLoggedIn();
    }
}
