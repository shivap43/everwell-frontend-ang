import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MAT_DIALOG_DATA, MatDialog } from "@angular/material/dialog";
import { forkJoin, Subject } from "rxjs";
import { BenefitsOfferingService, CoreService, DeletePlanChoice, CoverageLevelMigration, PlanReplacement } from "@empowered/api";
import { takeUntil } from "rxjs/operators";

interface ReplacePlanDetails {
    route: any;
    mpGroup: any;
    deletedPlan: any;
    continuous: any;
    enrollmentStartDate: any;
    planDetails: any;
    enrollmentEndDate: any;
    details: any;
    isProductContinuous: any;
}

@Component({
    selector: "empowered-replace-all-plans",
    templateUrl: "./replace-all-plans.component.html",
    styleUrls: ["./replace-all-plans.component.scss"],
})
export class ReplaceAllPlansComponent implements OnInit, OnDestroy {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.maintenanceBenefitsOffering.replacePlan.replacePlans",
        "primary.portal.maintenanceBenefitsOffering.replacePlan.coverageReplacementDate",
        "primary.portal.maintenanceBenefitsOffering.replacePlan.currentPlan",
        "primary.portal.maintenanceBenefitsOffering.replacePlan.newPlan",
        "primary.portal.maintenanceBenefitsOffering.replacePlan.currentPlanCoverageLevel",
        "primary.portal.maintenanceBenefitsOffering.replacePlan.newPlanCoverageLevel",
        "primary.portal.common.select",
        "primary.portal.common.back",
        "primary.portal.common.replace",
        "primary.portal.common.selectPlan",
        "primary.portal.common.close",
    ]);
    mpGroup: any;
    details: any;
    deletedPlan: any;
    ChoiceId: any;
    continuous: any;
    productDetails: any;
    plansDetails: any = [];
    PlanName: any;
    coverageLevelDisplay = [];

    oldPlanName: any;
    plansDetailsId: any;
    newCoverageLevels = [];
    replacingPlan: any;
    oldCoverageLevels: any;
    newCoveragelevelSelected: Event;
    newPlanId: any;
    newCoverageLevelsSelected: number[] = [];
    modifiedEnrollmentEndDate: string;
    planChoices: any;
    oldPlan = [];
    newPlan = [];
    masterData: RemoveAllPlan[] = [];
    replaceObservables = [];
    enrollmentEndDate: any;
    oldPlans = [];
    newPlans = [];
    private readonly unsubscribe$: Subject<void> = new Subject();

    constructor(
        @Inject(MAT_DIALOG_DATA) private readonly replacePlanDetails: ReplacePlanDetails,
        private readonly dialog: MatDialog,
        private readonly language: LanguageService,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly coreService: CoreService,
    ) {}

    ngOnInit(): void {
        this.mpGroup = this.replacePlanDetails.mpGroup;
        this.details = this.replacePlanDetails.planDetails;
        this.enrollmentEndDate = this.replacePlanDetails.deletedPlan.qualifyingEventValidity.expiresAfter;
        this.productDetails = this.replacePlanDetails.details;
        this.continuous = this.replacePlanDetails.continuous;
        this.productDetails.plans.forEach((element) => {
            this.plansDetails.push({ id: element.plan.plan.id, name: element.plan.plan.name });
        });
        this.plansDetails.forEach((_) => {
            this.coverageLevelDisplay.push(false);
        });
        const detailsObservables = [];
        this.plansDetails.forEach((ele) => {
            detailsObservables.push(this.coreService.getCoverageLevels(ele.id.toString()));
        });
        forkJoin(detailsObservables)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.oldCoverageLevels = response;
            });
        // TODO need to check the logic
        // this.plansDetails.forEach((outerElement, i) => {
        //     this.oldPlan.push(outerElement);
        //     this.newPlan[i] = [];
        //     this.plansDetails.forEach((innerElement, j) => {
        //         if (i !== j) {
        //             this.newPlan[i].push(innerElement);
        //         }
        //     });
        // });
        // this.details.plans;
        this.productDetails.plans.forEach((element) => {
            if (element.planChoice.enrollmentsExist) {
                this.oldPlans.push({ id: element.plan.id, name: element.plan.plan.name });
            } else {
                this.newPlans.push({ id: element.plan.id, name: element.plan.plan.name });
            }
        });
    }

    planChange(event: any, index: number): void {
        this.masterData[index] = {
            oldPlanChoiceId: this.oldPlans[index].id,
            newPlanChoiceId: event.value.id,
            coverageLevels: [],
        };
        this.oldCoverageLevels[index].forEach((element, eleIndex) => {
            this.masterData[index].coverageLevels[eleIndex] = { oldLevelId: null, newLevelId: null };
        });
        this.coreService
            .getCoverageLevels(event.value.id.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.newCoverageLevels[index] = response;
            });
        this.coverageLevelDisplay[index] = true;
    }
    coverageChange(event: any, mainIndex: number, coverageLevelIndex: number): void {
        this.masterData[mainIndex].coverageLevels[coverageLevelIndex].oldLevelId = this.oldCoverageLevels[mainIndex][coverageLevelIndex].id;

        this.masterData[mainIndex].coverageLevels[coverageLevelIndex].newLevelId = event.value.id;
    }
    onNext(): void {
        this.masterData.forEach((element) => {
            const data: DeletePlanChoice = {};
            const coverageLevel: CoverageLevelMigration[] = [];
            element.coverageLevels.forEach((itr, idx) => {
                coverageLevel[idx] = {
                    previousCoverageLevelId: null,
                    newCoverageLevelId: null,
                };
                coverageLevel[idx].previousCoverageLevelId = itr.oldLevelId;
                coverageLevel[idx].newCoverageLevelId = itr.newLevelId;
            });
            const replaceModal: PlanReplacement = {
                newPlanId: element.newPlanChoiceId,
                coverageLevelMigrations: coverageLevel,
            };
            data.planReplacement = replaceModal;
            this.pushReplaceObservables(data, element.oldPlanChoiceId);
        });
        forkJoin(this.replaceObservables)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.deleteNewPlan();
            });
    }
    pushReplaceObservables(deletedPlan: any, choiceId: number): void {
        this.replaceObservables.push(
            this.benefitOfferingService.deletePlanChoice(deletedPlan, choiceId, this.replacePlanDetails.mpGroup, this.enrollmentEndDate),
        );
    }
    cancel(): void {
        this.dialog.closeAll();
    }
    deleteNewPlan(): void {
        const newPlanObservables = [];
        const data: DeletePlanChoice = {};
        this.newPlans.forEach((plan) => {
            newPlanObservables.push(
                this.benefitOfferingService.deletePlanChoice(data, plan.id, this.replacePlanDetails.mpGroup, this.enrollmentEndDate),
            );
        });
        forkJoin(newPlanObservables)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.cancel();
            });
    }

    /**
     * This method destroys all subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
interface RemoveAllPlan {
    oldPlanChoiceId: number;
    newPlanChoiceId: number;
    coverageLevels: CoverageLevels[];
}
interface CoverageLevels {
    oldLevelId: number;
    newLevelId: number;
}
