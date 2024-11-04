import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-remove-plan2",
    templateUrl: "./remove-plan.component.html",
    styleUrls: ["./remove-plan.component.scss"],
})
export class RemovePlanComponent {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.tpiEnrollment.wantToExit",
        "primary.portal.tpiEnrollment.selectionsSaved",
        "primary.portal.tpiEnrollment.selectionsNotSaved",
        "primary.portal.tpiEnrollment.planDetails",
        "primary.portal.tpiEnrollment.accidentAdvantage",
        "primary.portal.tpiEnrollment.coverageLevel",
        "primary.portal.tpiEnrollment.riders",
        "primary.portal.tpiEnrollment.benefitRider",
        "primary.portal.tpiEnrollment.taxStatus",
        "primary.portal.tpiEnrollment.coverageDate",
        "primary.portal.tpiEnrollment.baseCost",
        "primary.portal.tpiEnrollment.employerContribution",
        "primary.portal.tpiEnrollment.yourCost",
        "primary.portal.tpiEnrollment.removePlanName",
        "primary.portal.tpiEnrollment.removePlan",
        "primary.portal.tpiEnrollment.diagnosisBenefit",
        "primary.portal.tpiEnrollment.exit",
        "primary.portal.common.close",
    ]);

    constructor(
        private readonly dialogRef: MatDialogRef<RemovePlanComponent>,
        @Inject(MAT_DIALOG_DATA) readonly stepId: number,
        private readonly language: LanguageService
    ) {}

    /**
     * Close the popup modal
     */
    closePopup(): void {
        this.dialogRef.close({
            stepId: { isSubmit: true },
        });
    }
}
