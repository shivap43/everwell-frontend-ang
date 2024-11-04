import { Component, OnInit, Inject } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

import { PlanPanelModel, AppSettings } from "@empowered/constants";

@Component({
    selector: "empowered-employee-minimun-popup",
    templateUrl: "./employee-minimun-popup.component.html",
    styleUrls: ["./employee-minimun-popup.component.scss"],
})
export class EmployeeMinimunPopupComponent implements OnInit {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.cancel",
        "primary.portal.benefitOffering.employeeMinimumPopup.mimimumRequirement",
        "primary.portal.benefitOffering.employeeMinimumPopup.employeeEstimate",
        "primary.portal.benefitOffering.employeeMinimumPopup.planCountMore",
        "primary.portal.benefitOffering.employeeMinimumPopup.thisPlan",
        "primary.portal.common.back",
        "primary.portal.common.gotIt",
        "primary.portal.benefitOffering.employeeMinimumPopup.planCountMoreForSinglePlan",
        "primary.portal.common.cancelChange",
        "primary.portal.benefitOffering.employeeMinimumPopup.employeeEstimateForPlans",
    ]);
    planDisableMessage: string;

    constructor(
        private readonly language: LanguageService,
        private readonly dialogRef: MatDialogRef<EmployeeMinimunPopupComponent>,
        @Inject(MAT_DIALOG_DATA)
        readonly plans: {
            ineligiblePlans: PlanPanelModel[];
            eligibleEmployeeInformation: any;
            recentEstimate: number;
        },
    ) {}

    ngOnInit(): void {
        if (this.plans.ineligiblePlans.length > 1) {
            this.planDisableMessage = this.languageStrings["primary.portal.benefitOffering.employeeMinimumPopup.planCountMore"];
        } else {
            this.planDisableMessage = this.languageStrings["primary.portal.benefitOffering.employeeMinimumPopup.thisPlan"];
        }
    }

    /**
     * Method is invoked on click of Cancel button
     */
    cancelUpdate(): void {
        this.dialogRef.close(AppSettings.CANCEL);
    }

    /**
     * Method is called on click of Got It on popup
     */
    onGotIt(): void {
        this.dialogRef.close(true);
    }

    /**
     * Method invoked on click of back button on popup
     */
    onBack(): void {
        this.dialogRef.close(false);
    }
}
