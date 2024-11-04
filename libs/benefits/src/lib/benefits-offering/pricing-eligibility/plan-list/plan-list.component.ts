import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { Store } from "@ngxs/store";
import { BenefitsOfferingService } from "@empowered/api";
import { DataFilter } from "@empowered/ui";
import { LanguageService } from "@empowered/language";

import { MatSelect } from "@angular/material/select";
import { take } from "rxjs/operators";
import { BenefitsOfferingState, SetProductCombinations, SideNavService, UtilService } from "@empowered/ngxs-store";

const statusConstant = {
    COMPLETED: "Completed",
    NOT_STARTED: "Not started",
    INCOMPLETE: "Incomplete",
};
@Component({
    selector: "empowered-plan-list",
    templateUrl: "./plan-list.component.html",
    styleUrls: ["./plan-list.component.scss"],
    providers: [DataFilter],
})
export class PlanListComponent implements OnInit, OnDestroy {
    productList = [];
    priceEligibilityCombinations = [];
    mpGroup: number;
    status: string;
    isLoading = true;
    productFilterList = [];
    activityFilterList: string[] = ["Completed", "Incomplete", "Not started"];
    filter;
    planCombinationData = [];
    productName: string;
    activityStatus: string;
    productNameLabel: string;
    activityStatusLabel: string;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.planList.title",
        "primary.portal.planList.description",
        "primary.portal.planList.descriptionanchor",
        "primary.portal.planList.descriptionupto",
        "primary.portal.planList.filterheading",
        "primary.portal.planList.filterProductLabel",
        "primary.portal.common.clear",
        "primary.portal.planList.filterActivityLabel",
        "primary.portal.planList.setPriceBtn",
        "primary.portal.planList.setEligibilityBtn",
        "primary.portal.planList.resumeBtn",
        "primary.portal.planList.priceSetText",
        "primary.portal.common.view",
        "primary.portal.common.edit",
        "primary.portal.common.for",
        "primary.portal.common.or",
        "primary.portal.planList.inComplete",
        "primary.portal.planList.descriptionanchor",
        "primary.portal.common.reset",
        "primary.portal.common.apply",
        "primary.portal.common.cancel",
        "primary.portal.planList.viewOrEdit",
        "primary.portal.common.back",
        "primary.portal.common.next",
    ]);

    filterOpen = false;
    @ViewChild("benefitAmtSelect") mySelect;
    constructor(
        private readonly router: Router,
        private readonly store: Store,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly dataFilter: DataFilter,
        private readonly language: LanguageService,
        private readonly sideNavService: SideNavService,
        private readonly utilService: UtilService,
    ) {
        this.mpGroup = this.store.selectSnapshot(BenefitsOfferingState.getMPGroup);
        this.getSelectedProductsAndPlans();
    }
    ngOnInit(): void {
        this.filter = {
            query: {
                product_id: null,
                combinationStatus: "",
            },
        };
        // FIXME - This is some temporary code to allow navigation to Step 7.
        this.sideNavService.stepClicked$.next(4);
    }

    getSelectedProductsAndPlans(): void {
        const productPlanList = this.store
            .selectSnapshot(BenefitsOfferingState.getpanelProducts)
            .filter((pannel) => pannel.productChoice != null && pannel.groupEligibility);
        if (productPlanList.length) {
            productPlanList.forEach((element) => {
                const tempListObj = {
                    plansDetails: element.plans.filter(
                        (x) =>
                            x.planChoice !== null && x.planChoice.plan.policyOwnershipType === "GROUP" && x.planChoice.plan.pricingEditable,
                    ),
                    productDetails: element.product,
                };
                this.productList.push(tempListObj);
            });
            this.getCombinations();
            this.isLoading = false;
        } else {
            this.isLoading = false;
        }
    }

    getCombinations(): void {
        this.productList.forEach((product) => {
            product.plansDetails.forEach((plan) => {
                const choiceId = plan.planChoice.id;
                this.getPlanPricingEligibilityCombinations(choiceId, this.mpGroup, product);
            });
        });
    }

    getPlanPricingEligibilityCombinations(planChoiceId: number, mpGroup: number, product: any): void {
        this.isLoading = true;
        this.benefitsOfferingService
            .getPlanPricingEligibilityCombinations(planChoiceId, mpGroup, true)
            .pipe(take(1))
            .subscribe(
                (result) => {
                    this.benefitsOfferingService
                        .getChoicePricingTemplate(planChoiceId.toString(), this.mpGroup.toString(), true)
                        .pipe(take(1))
                        .subscribe(
                            (pricingTemplate) => {
                                if (pricingTemplate && pricingTemplate.length) {
                                    const resultClasses = result.filter((response) => response.classes.length);
                                    const resultRegions = result.filter((response) => response.regions.length);
                                    const resultPrices = result.filter((response) => response.priceOrRates.length && response.eligible);
                                    const ineligibleCombinations = result.filter((response) => response.eligible === false);
                                    const planWithValidChoiceId = product.plansDetails.find(
                                        (validPlan) => validPlan.planChoice.id === planChoiceId,
                                    );
                                    const totalLengthCombination = ineligibleCombinations.length + resultPrices.length;
                                    // TODO :- Need language service for status string
                                    if (!resultClasses.length && !resultRegions.length && !resultPrices.length) {
                                        this.status = statusConstant.NOT_STARTED;
                                    } else if (
                                        (resultClasses.length || resultRegions.length) &&
                                        (!resultPrices.length || totalLengthCombination !== result.length)
                                    ) {
                                        this.status = statusConstant.INCOMPLETE;
                                    } else if (
                                        resultClasses.length &&
                                        resultRegions.length &&
                                        resultPrices.length &&
                                        totalLengthCombination === result.length
                                    ) {
                                        this.status = statusConstant.COMPLETED;
                                    } else if (
                                        (resultClasses.length || resultRegions.length) &&
                                        resultPrices.length &&
                                        totalLengthCombination === result.length
                                    ) {
                                        this.status = statusConstant.COMPLETED;
                                    }
                                    const resultObj = {
                                        choiceId: planChoiceId,
                                        combinationStatus: this.status,
                                        choicePlan: planWithValidChoiceId,
                                        product: product,
                                        product_id: product.productDetails.id,
                                        combinations: result,
                                        pricingTemplate: pricingTemplate,
                                    };
                                    this.priceEligibilityCombinations.push(resultObj);
                                    this.isLoading = false;
                                    this.priceEligibilityCombinations.sort((x, y) => x.choiceId - y.choiceId);
                                    this.planCombinationData = this.priceEligibilityCombinations;
                                }
                            },
                            (err) => {
                                this.isLoading = false;
                            },
                        );
                },
                (err) => {
                    this.isLoading = false;
                },
            );
    }

    applyFilters(selectFilter: MatSelect): void {
        this.filter = this.utilService.copy(this.filter);
        this.priceEligibilityCombinations = this.planCombinationData;
        this.priceEligibilityCombinations = this.dataFilter.transform(this.priceEligibilityCombinations, this.filter);
        selectFilter.close();
    }

    resetFilters(selectFilterReset: MatSelect): void {
        this.filter = {
            query: {
                product_id: null,
                combinationStatus: "",
            },
        };
        this.productName = "";
        this.activityStatus = "";
        this.priceEligibilityCombinations = this.planCombinationData;
        selectFilterReset.close();
    }

    navigateToPricingEligibility(planId: number): void {
        const url = `${this.router.url}/${planId}`;
        this.router.navigate([url], { skipLocationChange: true });
    }
    matSelectOpenHandler(isOpen: boolean): void {
        this.filterOpen = isOpen;
    }
    // FIXME - This is some temporary code to allow navigation to Step 7.
    onBack(): void {
        this.sideNavService.stepClicked$.next(3);
    }
    onNext(): void {
        this.sideNavService.defaultStepPositionChanged$.next(6);
    }

    ngOnDestroy(): void {
        this.store.dispatch(new SetProductCombinations(this.planCombinationData));
    }
}
