import { Component, OnInit, Inject } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { DatePipe } from "@angular/common";
import { DateFormats, MemberCoverageDetails } from "@empowered/constants";
import { Store } from "@ngxs/store";
import { EnrollmentState } from "@empowered/ngxs-store";

const CANCEL = "cancel";

enum AgCoverageLevelNames {
    EMPLOYEE_COVERAGE = "Employee Only",
    EMPLOYEE_AND_SPOUSE_COVERAGE = "Employee + Spouse",
    EMPLOYEE_AND_FAMILY_COVERAGE = "Employee + Family",
    EMPLOYEE_AND_CHILDREN_COVERAGE = "Employee + Children",
}

@Component({
    selector: "empowered-view-plan-details",
    templateUrl: "./view-plan-details.component.html",
    styleUrls: ["./view-plan-details.component.scss"],
})
export class ViewPlanDetailsComponent implements OnInit {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.shoppingExperience.planDetails",
        "primary.portal.common.close",
        "primary.portal.maintenanceBenefitsOffering.products.planName",
        "primary.portal.activityHistory.benefitAmount",
        "primary.portal.shoppingExperience.eliminationPeriod",
        "primary.portal.tpiEnrollment.riders",
        "primary.portal.tpiEnrollment.taxStatus",
        "primary.portal.shoppingExperience.coveredIndividuals",
        "primary.portal.benefitsOffering.coverageStartDate",
        "primary.portal.shoppingExperience.benefitAmount",
        "primary.portal.viewPlanDetails.with",
        "primary.portal.coverage.allEligibleDependents",
    ]);
    isCoverageLevelNameMatch = false;
    memberFullName: string;

    constructor(
        private readonly language: LanguageService,
        private readonly dialogRef: MatDialogRef<ViewPlanDetailsComponent>,
        @Inject(MAT_DIALOG_DATA)
        readonly viewPlanDetails: MemberCoverageDetails,
        private readonly datePipe: DatePipe,
        private readonly store: Store,
    ) {}

    /**
     * ng LifeCycle hook, initial function that gets executed in the component
     */
    ngOnInit(): void {
        this.isCoverageLevelNameMatch = this.isDependentCovered(this.viewPlanDetails.coverageLevel.name);
        this.transformDatesFormat();
        this.fetchMemberName();
    }

    /**
     * To get member full name from store
     */
    fetchMemberName(): void {
        const memberData = this.store.selectSnapshot(EnrollmentState.GetMemberData);
        if (memberData && memberData.info && memberData.info.name) {
            this.memberFullName = `${memberData.info.name.firstName} ${memberData.info.name.lastName}`;
        }
    }

    /**
     * To transform dates format
     */
    transformDatesFormat(): void {
        this.viewPlanDetails.validity.effectiveStarting = this.datePipe.transform(
            this.viewPlanDetails.validity.effectiveStarting,
            DateFormats.MONTH_DAY_YEAR,
        );
        this.viewPlanDetails.validity.expiresAfter = this.datePipe.transform(
            this.viewPlanDetails.validity.expiresAfter,
            DateFormats.MONTH_DAY_YEAR,
        );
    }

    /**
     * will check if dependent covered or not in enrolled plan
     * @param  coverageLevelName selected plan coverage level name
     * @return is dependent covered or not
     */
    isDependentCovered(coverageLevelName: string): boolean {
        return (
            coverageLevelName === AgCoverageLevelNames.EMPLOYEE_AND_CHILDREN_COVERAGE ||
            coverageLevelName === AgCoverageLevelNames.EMPLOYEE_AND_FAMILY_COVERAGE ||
            coverageLevelName === AgCoverageLevelNames.EMPLOYEE_AND_SPOUSE_COVERAGE
        );
    }

    /**
     * Function to close the modal
     */
    closeModal(): void {
        this.dialogRef.close({ type: CANCEL });
    }
}
