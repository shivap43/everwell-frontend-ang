import { takeUntil } from "rxjs/operators";
import { TPIRestrictionsForHQAccountsService } from "@empowered/common-services";
import {
    Component,
    OnInit,
    Input,
    AfterViewChecked,
    ChangeDetectorRef,
    EventEmitter,
    Output,
    OnChanges,
    OnDestroy,
    SimpleChanges,
} from "@angular/core";
import { LanguageModel } from "@empowered/api";
import { Store, Select } from "@ngxs/store";
import { EnrollmentState, SetExitPopupStatus, ShopCartService, AppFlowService } from "@empowered/ngxs-store";

import { Observable, Subject } from "rxjs";
import { FormControl, FormBuilder } from "@angular/forms";
import { LanguageService, LanguageState } from "@empowered/language";
import { CarrierId, CoverageLevel, PlanOfferingPricing, PlanOfferingPanel } from "@empowered/constants";

@Component({
    selector: "empowered-coverage-level-selection",
    templateUrl: "./coverage-level-selection.component.html",
    styleUrls: ["./coverage-level-selection.component.scss"],
})
export class CoverageLevelSelectionComponent implements OnInit, AfterViewChecked, OnChanges, OnDestroy {
    @Input() isRiderCoverage: boolean;
    @Input() planOfferingObj: PlanOfferingPanel;
    @Input() currentCoverageLevel: PlanOfferingPricing;
    @Input() productOfferingId: number;
    @Output() updateAmount = new EventEmitter<PlanOfferingPricing>();
    isLoading: boolean;
    data: CoverageLevel[];
    pricingData: PlanOfferingPricing[];
    currentCoverage: PlanOfferingPricing;
    isRiderCoverageFlag: boolean;
    coverageSelectInput: FormControl;
    coverageSelectRadio: FormControl;
    riderCoverage: CoverageLevel;
    primaryLanguages: LanguageModel[];
    secondaryLanguages: LanguageModel[];
    isAllCoverageZero: boolean;
    languageStrings = {
        selectOption: this.language.fetchPrimaryLanguageValue("primary.portal.shoppingExperience.selectOption"),
        coverageDisabled: this.language.fetchPrimaryLanguageValue("primary.portal.shoppingExperience.coverageDisabled"),
        reviewAnswers: this.language.fetchPrimaryLanguageValue("primary.portal.shoppingExperience.reviewAnswers"),
    };
    showDisableCoverageMessage: boolean;
    knockoutData: Array<any>;
    applicableCoverageLevels: CoverageLevel[];
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    @Select(EnrollmentState.GetKnockOutData) knockoutData$: Observable<Array<any>>;
    mpGroup: number;

    constructor(
        private readonly shopCartService: ShopCartService,
        private readonly store: Store,
        private readonly cd: ChangeDetectorRef,
        private readonly fb: FormBuilder,
        private readonly language: LanguageService,
        private readonly tpiRestrictions: TPIRestrictionsForHQAccountsService,
        private readonly appFlow: AppFlowService,
    ) {
        this.primaryLanguages = this.store.selectSnapshot(LanguageState.languageList);
        this.secondaryLanguages = this.store.selectSnapshot(LanguageState.secondaryLanguageList);
        this.knockoutData$.pipe(takeUntil(this.unsubscribe$)).subscribe((x) => {
            this.knockoutData = x;
            this.checkForDisabledCoverages();
        });
    }

    /**
     * Angular life cycle hook
     * Calling getAllRequiredData() method
     * Taking snapshot of Enrollment state to get mpGroup
     * Setting values to coverageSelectRadio and coverageSelectInput
     */
    ngOnInit(): void {
        this.isLoading = false;
        this.mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
        this.isAllCoverageZero = false;
        this.coverageSelectInput.setValue("");
        this.coverageSelectRadio.setValue("");
        this.isRiderCoverageFlag = false;
        this.getAllRequiredData();
        this.coverageSelectRadio.setValue(this.pricingData[0]);
        if (this.currentCoverage) {
            this.coverageSelectInput.setValue(this.currentCoverage.coverageLevelId);
        }
    }
    selectCoverage($event: any): void {
        this.currentCoverage = this.pricingData.filter((x) => x.coverageLevelId === $event)[0];
        if (this.currentCoverage.benefitAmount) {
            this.pricingData
                .filter((x) => x.coverageLevelId === $event)
                .forEach((element1) => {
                    if (element1.memberCost < this.currentCoverage.memberCost) {
                        this.currentCoverage = element1;
                    }
                });
        }
        this.updateAmount.emit(this.currentCoverage);
        this.store.dispatch(new SetExitPopupStatus(true));
    }
    selectByDefaultCoverageLevel(): void {
        if (!this.currentCoverageLevel) {
            this.currentCoverage = this.pricingData[0];
            this.pricingData.forEach((element) => {
                if (this.currentCoverage.memberCost > element.memberCost) {
                    this.currentCoverage = element;
                    this.coverageSelectRadio.setValue(this.currentCoverage);
                }
            });
            this.updateAmount.emit(this.currentCoverage);
        } else {
            this.currentCoverage = this.currentCoverageLevel;
            this.coverageSelectRadio.setValue(this.currentCoverage);
        }
    }
    getCoverageAmountById(id: number): number {
        if (this.pricingData.length) {
            const data = this.pricingData.filter((x) => x.coverageLevelId === id);
            if (data.length) {
                return data.reduce((x: PlanOfferingPricing, y: PlanOfferingPricing) => {
                    if (x.memberCost > y.memberCost) {
                        return y;
                    }
                    return x;
                }).memberCost;
            }
        }
        return -1;
    }
    getPlanOfferingPricingById(id: number): PlanOfferingPricing {
        const tmp = this.pricingData.filter((x) => x.coverageLevelId === id).pop();
        if (!tmp.benefitAmount) {
            return tmp;
        }
        return this.pricingData
            .filter((x) => x.coverageLevelId === id)
            .reduce((x: PlanOfferingPricing, y: PlanOfferingPricing) => {
                if (x.benefitAmount < y.benefitAmount) {
                    return x;
                }
                return y;
            });
    }
    /**
     * Initializes required variables
     * @returns nothing
     */
    getAllRequiredData(): void {
        this.data = this.planOfferingObj.coverageLevel;
        this.pricingData = this.planOfferingObj.planPricing;
        this.tpiRestrictions
            .canAccessTPIRestrictedModuleInHQAccount(null, null, this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (canAccess) =>
                    (this.applicableCoverageLevels =
                        canAccess || this.planOfferingObj.plan.carrier.id !== CarrierId.AFLAC
                            ? this.data
                            : this.appFlow.restrictCoverageLevelsBasedOnDependents(
                                this.store.selectSnapshot(EnrollmentState.GetMemberDependents),
                                this.store.selectSnapshot(EnrollmentState.GetMemberDependentsRelation),
                                this.data,
                            )),
            );

        if (!this.planOfferingObj.selectedPricing) {
            this.selectByDefaultCoverageLevel();
        } else if (this.data) {
            const priceDetail: PlanOfferingPricing[] = [];
            this.planOfferingObj.coverageLevel.forEach((coverageLevel) =>
                priceDetail.push(...this.planOfferingObj.planPricing.filter((pricing) => pricing.coverageLevelId === coverageLevel.id)),
            );
            this.currentCoverage = this.data.some(
                (coverageLevel) => coverageLevel.id === this.planOfferingObj.selectedPricing.coverageLevelId,
            )
                ? this.planOfferingObj.selectedPricing
                : this.getDefaultPricing(priceDetail);
        }
        this.checkForDisabledCoverages();
    }
    /**
     * @description to get the default price of the plan
     * @param data {PlanOfferingPricing[]} array of plan offering pricing
     * @return {PlanOfferingPricing} the object of plan offer pricing which contains the coverage level id
     */
    getDefaultPricing(data: PlanOfferingPricing[]): PlanOfferingPricing {
        let lowestPrice = null;
        if (data && data.length) {
            lowestPrice = data[0];
            data.forEach((element1) => {
                if (lowestPrice.memberCost > element1.memberCost) {
                    lowestPrice = element1;
                }
            });
        }
        return lowestPrice;
    }
    isSingleRiderCoverage(): boolean {
        return this.data.filter((x) => x.id !== 2).length > 1;
    }
    /**
     * function is used on change of coverage level selection
     * @param changes {SimpleChanges}
     */
    ngOnChanges(changes: SimpleChanges): void {
        this.data = this.planOfferingObj.coverageLevel;
        this.pricingData = this.planOfferingObj.planPricing;
        if (!this.coverageSelectRadio) {
            this.coverageSelectRadio.setValue("");
        }
        if (changes.currentCoverageLevel && !this.isRiderCoverage) {
            this.currentCoverage = changes.currentCoverageLevel.currentValue;
            this.coverageSelectRadio.setValue(this.currentCoverage, { onlySelf: true });
            this.coverageSelectRadio.updateValueAndValidity();
        }
        if (this.isRiderCoverage) {
            const priceDetail = this.planOfferingObj.planPricing.filter((pricing) =>
                this.planOfferingObj.coverageLevel.some((coverageLevel) => coverageLevel.id === pricing.coverageLevelId),
            );
            if (!this.planOfferingObj.selectedPricing) {
                this.selectByDefaultCoverageLevel();
            }
            this.currentCoverage = this.data.some(
                (coverageLevel) => coverageLevel.id === this.planOfferingObj.selectedPricing.coverageLevelId,
            )
                ? this.setRiderSelection()
                : this.getDefaultPricing(priceDetail);
            if (this.currentCoverage && this.coverageSelectInput) {
                this.coverageSelectInput.setValue(this.currentCoverage.coverageLevelId);
            }
        }
    }
    /**
     * function is used to set rider selection on change
     * @returns PlanOfferingPricing of selected rider
     */
    setRiderSelection(): PlanOfferingPricing {
        this.planOfferingObj.selectedCoverage = this.data.find(
            (coverageLevel) => coverageLevel.id === this.planOfferingObj.selectedPricing.coverageLevelId,
        );
        return this.planOfferingObj.selectedPricing;
    }
    ngAfterViewChecked(): void {
        if (this.planOfferingObj.planPricing.filter((x) => x.totalCost > 0).length === 0) {
            this.isAllCoverageZero = true;
        }
        this.cd.detectChanges();
    }

    checkForDisabledCoverages(): void {
        this.showDisableCoverageMessage = false;
        if (this.knockoutData && this.knockoutData.length && this.data) {
            let resetCoverage = false;
            this.knockoutData.forEach((koData) => {
                if (koData.planId === this.planOfferingObj.plan.id) {
                    this.data = this.data.map((coverage) => {
                        if (koData.coverageLevel === coverage.id) {
                            coverage = {
                                ...coverage,
                                ...{ disabled: koData.disable },
                            };
                            if (koData.disable) {
                                resetCoverage = true;
                            }
                        }
                        return coverage;
                    });
                }
            });
            if (resetCoverage) {
                this.showDisableCoverageMessage = true;
                const coverageLvl = this.data.find((cov) => !cov["disabled"]);
                if (coverageLvl) {
                    this.selectCoverage(coverageLvl.id);
                }
            }
        }
    }
    /**
     * function to display knockout questions for plans
     */
    reviewKnockoutQuestions(): void {
        const data = this.knockoutData.find((x) => x.planId === this.planOfferingObj.plan.id);
        if (data) {
            this.shopCartService.displayReviewKnockoutDialog(data);
        }
    }
    /**
     * method to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
