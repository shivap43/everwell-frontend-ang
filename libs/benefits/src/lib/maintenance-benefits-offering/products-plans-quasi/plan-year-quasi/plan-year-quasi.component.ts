import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { ProductsPlansQuasiService } from "../services/products-plans-quasi.service";
import { Store } from "@ngxs/store";

import {
    BenefitsOfferingState,
    MapPlanChoicesToNewPlanYearPanel,
    SetManagePlanYearChoice,
    SetNewPlanYearValue,
    UpdateCurrentPlanYearId,
    UtilService,
} from "@empowered/ngxs-store";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { PlanChoice, PlanYear } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { DateService } from "@empowered/date";
import { AccountService } from "@empowered/api";

@Component({
    selector: "empowered-plan-year-quasi",
    templateUrl: "./plan-year-quasi.component.html",
    styleUrls: ["./plan-year-quasi.component.scss"],
})
export class PlanYearQuasiComponent implements OnInit, OnDestroy {
    userChoice: string;
    existingChoice: string;
    planYears: PlanYear[] = [];
    currentPlanYearId: number;
    productId: number;
    approvedPlanChoices = [];
    unApprovedPlanChoices = [];
    carriersForApproval: string[];
    private readonly unsubscribe$ = new Subject<void>();
    isActivePlanYear = false;
    isSubmitted = false;
    mpGroup: number;
    isNewPlanYear: boolean;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.maintenanceBenefitsOffering.planYearQuasi.managePlans",
        "primary.portal.maintenanceBenefitsOffering.planYearQuasi.newPlanYear",
        "primary.portal.maintenanceBenefitsOffering.planYearQuasi.updatesToPlanYear",
        "primary.portal.common.next",
    ]);

    constructor(
        private readonly quasiService: ProductsPlansQuasiService,
        private readonly store: Store,
        private readonly language: LanguageService,
        @Inject(MAT_DIALOG_DATA) readonly data: any,
        private readonly utilService: UtilService,
        private readonly dateService: DateService,
        private readonly accountService: AccountService,
    ) {}

    /**
     * @description Angular Life cycle hook
     * initialize component for previously created plan year
     * @memberof PlanYearQuasiComponent
     */
    ngOnInit(): void {
        this.quasiService.carriersForApproval.pipe(takeUntil(this.unsubscribe$)).subscribe((value) => {
            this.carriersForApproval = value;
        });
        this.mpGroup = this.store.selectSnapshot(BenefitsOfferingState.getMPGroup);
        this.existingChoice = this.store.selectSnapshot(BenefitsOfferingState.GetManagePlanYearChoice);
        if (this.existingChoice) {
            this.userChoice = this.existingChoice;
        }
        this.approvedPlanChoices = this.store.selectSnapshot(BenefitsOfferingState.getPlanChoices);
        this.unApprovedPlanChoices = this.store.selectSnapshot(BenefitsOfferingState.getUnapprovedPlanChoices);
        this.quasiService.stepClicked$.next(1);
        this.productId = this.data.productInformation.plans[0].plan.plan.productId;
        this.planYears = this.utilService.copy(this.data.planYears);
        this.currentPlanYearId = this.data.productInformation.plans[0].planYear.id;
        this.getPlanYearWithMatchingProduct();
        this.getActivePlanYears();
        this.isNewPlanYear = this.store.selectSnapshot(BenefitsOfferingState.getNewPlanYearValue);
    }
    updateSelection(choice: any): void {
        this.userChoice = choice.value;
        if (this.userChoice !== "new_plan" && this.userChoice !== "current_plan") {
            const choices = Array.from(new Set(this.approvedPlanChoices.concat(this.unApprovedPlanChoices)));
            const planYearPlans = choices.filter(
                (eachPlanChoice) => eachPlanChoice.continuous === false && eachPlanChoice.planYearId === choice.value,
            );
            this.store.dispatch(new MapPlanChoicesToNewPlanYearPanel([]));
            this.store.dispatch(new MapPlanChoicesToNewPlanYearPanel(planYearPlans));
        }
        if (this.userChoice === "current_plan" && this.isNewPlanYear) {
            this.accountService.clearPendingElements(this.mpGroup).pipe(takeUntil(this.unsubscribe$)).subscribe();
            this.store.dispatch(new SetNewPlanYearValue(false));
        }
    }
    getPlanYearWithMatchingProduct(): void {
        const planYears = [];
        let currentPlanYear;
        const index = this.planYears.findIndex((py) => py.id === this.currentPlanYearId);
        if (index > -1) {
            const planYear = this.utilService.copy(this.planYears);
            currentPlanYear = planYear[index];
            this.planYears.splice(index, 1);
        }
        this.planYears.forEach((py) => {
            const ids = this.getPlanYearRelatedChoices(py.id);
            if (ids.length && ids.length === 1 && ids[0] === this.productId) {
                planYears.push(py);
            }
        });
        if (planYears.length) {
            this.planYears = planYears;
            this.arrangeFuturePlanYears(currentPlanYear);
        } else {
            this.planYears = [];
        }
    }
    /**
     * Method to arrange Future Plan Years
     * @param py : Current plan year to find future plan year
     */
    arrangeFuturePlanYears(py: PlanYear): void {
        const currentCoverageStartDate = py.coveragePeriod.effectiveStarting;
        this.planYears = this.planYears.filter((planYear) =>
            this.dateService.checkIsAfter(
                this.dateService.toDate(planYear.coveragePeriod.effectiveStarting),
                this.dateService.toDate(currentCoverageStartDate),
            ),
        );
    }
    /**
     * Dispatch stores based on option selected and navigate to next step
     */
    onNext(): void {
        if (this.userChoice) {
            this.isSubmitted = true;
            this.store.dispatch(new SetManagePlanYearChoice(this.userChoice));
            if (this.userChoice === "new_plan") {
                this.store.dispatch(new MapPlanChoicesToNewPlanYearPanel([]));
                this.store.dispatch(new UpdateCurrentPlanYearId(null));
            } else if (this.userChoice === "current_plan") {
                const choices = this.store
                    .selectSnapshot(BenefitsOfferingState.GetUserPlanChoices)
                    .filter((plan) => plan.planYearId === this.currentPlanYearId);
                this.store.dispatch(new MapPlanChoicesToNewPlanYearPanel([]));
                this.store.dispatch(new MapPlanChoicesToNewPlanYearPanel(choices));
                this.store.dispatch(new UpdateCurrentPlanYearId(this.currentPlanYearId));
            } else if (+this.userChoice) {
                this.store.dispatch(new UpdateCurrentPlanYearId(+this.userChoice));
            }
            this.quasiService.defaultStepPositionChanged$.next(3);
        }
    }

    /**
     * to fetch the product id related to plan year
     * @params planChoices plan choices
     * @params planYearId plan year id
     * @return list of product ids
     */
    getPlanYearRelatedProduct(planChoices: PlanChoice[], planYearId: number): number[] {
        const planYearPlans = planChoices.filter(
            (eachPlanChoice) =>
                eachPlanChoice.continuous === false &&
                eachPlanChoice.planYearId === planYearId &&
                eachPlanChoice.plan.productId === this.productId,
        );
        const planYearProducts = planYearPlans.map((eachPlanYearChoice) => eachPlanYearChoice.plan.productId);
        const productIds = [];
        planYearProducts.forEach((prod) => {
            if (productIds.findIndex((product) => product === prod) === -1) {
                productIds.push(prod);
            }
        });
        return productIds;
    }
    getPlanYearRelatedChoices(planYearId: number): number[] {
        const unapprovedProductIds = this.getPlanYearRelatedProduct(this.unApprovedPlanChoices, planYearId);
        const approvedProductIds = this.getPlanYearRelatedProduct(this.approvedPlanChoices, planYearId);
        return Array.from(new Set(unapprovedProductIds.concat(approvedProductIds)));
    }
    /**
     * function to get active plan years depending upon carrier form and coverage start date
     */
    getActivePlanYears(): void {
        this.isActivePlanYear =
            this.data.productInformation &&
            this.carriersForApproval.findIndex((value) => value === this.data.productInformation.carrierId.toString()) !== -1 &&
            this.dateService.toDate(this.data.productInformation.plans[0].planYear.coveragePeriod.effectiveStarting) <= new Date();
    }
    /**
     * ng life cycle hook
     * used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
