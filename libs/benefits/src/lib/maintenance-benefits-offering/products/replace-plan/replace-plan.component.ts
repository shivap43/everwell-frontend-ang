import { CoreService, DeletePlanChoice, PlanReplacement, BenefitsOfferingService, CoverageLevelMigration } from "@empowered/api";
import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";

export interface ReplacePlanDetails {
    route: any;
    mpGroup: any;
    deletedPlan: any;
    choiceId: any;
    continuous: any;
    enrollmentStartDate: any;
    planDetails: any;
    productDetails: any;
    enrollmentEndDate: any;
}

@Component({
    selector: "empowered-replace-plan",
    templateUrl: "./replace-plan.component.html",
    styleUrls: ["./replace-plan.component.scss"],
})
export class ReplacePlanComponent implements OnInit, OnDestroy {
    mpGroup: any;
    details: any;
    deletedPlan: any;
    ChoiceId: any;
    continuous: any;
    productDetails: any;
    plansDetails: any = [];
    private unsubscribe$ = new Subject<void>();
    PlanName: any;
    coverageLevelDisplay = false;
    replaceButtonClicked = "replace";
    backButtonClicked = "back";
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.maintenanceBenefitsOffering.replacePlan.title",
        "primary.portal.maintenanceBenefitsOffering.replacePlan.coverageReplacementDate",
        "primary.portal.maintenanceBenefitsOffering.replacePlan.currentPlan",
        "primary.portal.maintenanceBenefitsOffering.replacePlan.newPlan",
        "primary.portal.maintenanceBenefitsOffering.replacePlan.currentPlanCoverageLevel",
        "primary.portal.maintenanceBenefitsOffering.replacePlan.newPlanCoverageLevel",
        "primary.portal.common.select",
        "primary.portal.common.back",
        "primary.portal.common.replace",
        "primary.portal.common.close",
        "primary.portal.common.cancel",
    ]);
    oldPlanName: any;
    plansDetailsId: any;
    newCoverageLevels: any;
    replacingPlan: any;
    oldCoverageLevels: any;
    newCoveragelevelSelected: Event;
    newPlanId: any;
    newCoverageLevelsSelected: number[] = [];
    modifiedEnrollmentEndDate: string;

    constructor(
        @Inject(MAT_DIALOG_DATA) private readonly replacePlanDetails: ReplacePlanDetails,
        private readonly dialogRef: MatDialogRef<ReplacePlanComponent>,
        private readonly language: LanguageService,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly coreService: CoreService,
    ) {}

    ngOnInit(): void {
        this.mpGroup = this.replacePlanDetails.mpGroup;
        this.details = this.replacePlanDetails.planDetails;
        this.deletedPlan = this.replacePlanDetails.deletedPlan;
        this.ChoiceId = this.replacePlanDetails.choiceId;
        this.productDetails = this.replacePlanDetails.productDetails;
        this.continuous = this.replacePlanDetails.continuous;
        this.productDetails.plans.forEach((element) => {
            if (this.ChoiceId !== element.plan.id) {
                this.plansDetails.push({ id: element.plan.plan.id, name: element.plan.plan.name });
            } else {
                this.oldPlanName = { name: element.plan.plan.name, id: element.plan.plan.id };
                this.coreService
                    .getCoverageLevels(this.oldPlanName.id.toString())
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe((response) => {
                        this.oldCoverageLevels = response;
                    });
            }
        });
    }
    coverageChange(event: any, index: number): void {
        this.newCoveragelevelSelected = event.value.id;
        this.newCoverageLevelsSelected[index] = event.value.id;
    }
    planChange(event: any, planName: any): void {
        const dropDownData = this.plansDetails.find((data: any) => data === event.value);
        this.coverageLevelDisplay = true;
        this.newPlanId = dropDownData.id;
        this.coreService
            .getCoverageLevels(dropDownData.id.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.newCoverageLevels = response;
            });
        // this.getCoverageLevels(this.)
    }

    onNext(): void {
        const data: DeletePlanChoice = {};
        const coverageLevel: CoverageLevelMigration[] = [];
        this.oldCoverageLevels.forEach((itr, index) => {
            coverageLevel[index] = { previousCoverageLevelId: null, newCoverageLevelId: null };
            coverageLevel[index].previousCoverageLevelId = itr.id;
            coverageLevel[index].newCoverageLevelId = this.newCoverageLevelsSelected[index];
        });
        const replaceModal: PlanReplacement = { newPlanId: this.newPlanId, coverageLevelMigrations: coverageLevel };
        data.planReplacement = replaceModal;
        this.deletePlanChoice(data);
    }
    deletePlanChoice(deletedPlan: any): void {
        this.benefitOfferingService
            .deletePlanChoice(
                deletedPlan,
                this.replacePlanDetails.choiceId,
                this.replacePlanDetails.mpGroup,
                this.replacePlanDetails.enrollmentEndDate,
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.closeModal(this.replaceButtonClicked);
            });
    }
    /**
     * Close the dialog box based on the button clicked
     * @param option the button clicked
     */
    closeModal(option: string): void {
        this.dialogRef.close({ data: option });
    }

    /**
     * Unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
