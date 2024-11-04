import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import {
    CarrierId,
    CoverageLevelId,
    PlanOfferingCostInfo,
    PlanOfferingWithCartAndEnrollment,
    CoverageLevel,
    GetCartItems,
    EnrollmentRider,
    PlanOffering,
} from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { EnrollmentsSelectors } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { PlanOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { EliminationPeriod } from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.model";
import { ShoppingCartsSelectors } from "@empowered/ngrx-store/ngrx-states/shopping-carts";
import { ProductId } from "@empowered/ngrx-store/services/plan-offering-helper/plan-offering-helper.constants";
import { select } from "@ngrx/store";
import { combineLatest, Observable, Subject } from "rxjs";
import { map, startWith, switchMap, takeUntil, withLatestFrom } from "rxjs/operators";
import { AgeService } from "../../services/age/age.service";
import { ManageCartItemsHelperService } from "../../services/manage-cart-items/manage-cart-items-helper.service";
import { PlanPanelService } from "../../services/plan-panel/plan-panel.service";
import {
    BenefitAmountState,
    DependentAgeState,
    EliminationPeriodState,
} from "../../services/producer-shop-component-store/producer-shop-component-store.model";
import { ProducerShopComponentStoreService } from "../../services/producer-shop-component-store/producer-shop-component-store.service";
import { ProducerShopHelperService } from "../../services/producer-shop-helper/producer-shop-helper.service";
import { RiderStateWithPlanPricings } from "../../services/rider-component-store/rider-component-store.model";
import { RiderComponentStoreService } from "../../services/rider-component-store/rider-component-store.service";
import { AddUpdateCartButtonState } from "./add-update-cart-button-wrapper.model";

@Component({
    selector: "empowered-add-update-cart-button-wrapper",
    templateUrl: "./add-update-cart-button-wrapper.component.html",
    styleUrls: ["./add-update-cart-button-wrapper.component.scss"],
})
export class AddUpdateCartButtonWrapperComponent implements OnInit, OnDestroy {
    @Input() planPanel!: PlanOfferingWithCartAndEnrollment;

    // Gets selected Plan Offering With cart and enrollment
    // Get PlanOfferingWithCartAndEnrollment using PlanOffering input bind
    selectedPlanOfferingWithCartAndEnrollment$!: Observable<PlanOfferingWithCartAndEnrollment | null>;

    // indicates if cart data is changed or not, returns boolean
    // Observable is based on PlanOffering input bind
    isCartDataChanged$!: Observable<boolean>;

    // Disable Add cart button when data is not changed for edit coverage
    // Observable is based on PlanOffering input bind
    disableAddCart$!: Observable<boolean>;

    private readonly unsubscriber$ = new Subject<void>();

    // Gets selected coverage level using PlanOffering input bind
    private selectedCoverageLevel$!: Observable<CoverageLevel>;

    // Gets selected benefit amount from producerShopComponentStore using PlanOffering input bind
    private selectedBenefitAmount$!: Observable<BenefitAmountState>;

    // Gets selected dependent age from producerShopComponentStore using PlanOffering input bind
    private selectedDependentAge$!: Observable<DependentAgeState>;

    // Gets selected elimination period from producerShopComponentStore using PlanOffering input bind
    private selectedEliminationPeriod$!: Observable<EliminationPeriodState>;

    private riders$!: Observable<PlanOffering[]>;

    // Get Shopping Cart Information
    readonly isShoppingCartLocked$ = this.ngrxStore
        .onAsyncValue(select(ShoppingCartsSelectors.getShoppingCart))
        .pipe(map((cartDetails) => cartDetails.locked));

    private readonly addCartSubject$ = new Subject<void>();
    // Get the enrolled riders
    private readonly enrolledRiders$ = this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.getSelectedEnrollmentRiders));

    // Indicating dependent age is different in dependent age dropdown and enrolled dependent age
    private isDependentAgeChanged$!: Observable<boolean>;

    private readonly enrolledDependentChildren$ = this.ngrxStore.onAsyncValue(
        select(PlanOfferingsSelectors.getSelectedMemberEnrolledDependentChildren),
    );

    readonly addUpdateCartButtonStateEnum = AddUpdateCartButtonState;

    // Translations
    readonly languageStrings = this.getLanguageStrings();

    constructor(
        private readonly languageService: LanguageService,
        private readonly ngrxStore: NGRXStore,
        private readonly manageCartItemsHelperService: ManageCartItemsHelperService,
        private readonly planPanelService: PlanPanelService,
        private readonly producerShopComponentStoreService: ProducerShopComponentStoreService,
        private readonly producerShopHelperService: ProducerShopHelperService,
        private readonly riderComponentStoreService: RiderComponentStoreService,
        private readonly ageService: AgeService,
    ) {}

    /**
     * Get cart object and dispatch the necessary actions for add/update cart
     */
    ngOnInit(): void {
        const panelIdentifiers = this.planPanelService.getPanelIdentifiers(this.planPanel);

        // get selected dependent age from dependentAgeState
        this.selectedDependentAge$ = this.producerShopComponentStoreService.getDependentAgeState(panelIdentifiers);
        // Check if dependent age has changed
        this.isDependentAgeChanged$ = combineLatest([this.selectedDependentAge$, this.enrolledDependentChildren$]).pipe(
            map(([selectedDependentAge, enrolledDependentChildren]) => {
                // NOTE: Juvenile Term life's pricing doesn't change when dependent age changes.
                // If selected plan is Juvenile Whole Life, then compare enrolledDependentChildrenAge and selectedDependentAge
                if (this.planPanel.planOffering.plan.product?.id !== ProductId.JUVENILE_WHOLE_LIFE) {
                    return false;
                }
                const enrolledDependentChildrenAge = this.ageService.getMemberDependentAge(enrolledDependentChildren[0]);
                return enrolledDependentChildrenAge !== selectedDependentAge.dependentAge;
            }),
        );
        // get selected elimination period from producerShopComponentStore
        this.selectedEliminationPeriod$ = this.producerShopComponentStoreService.getEliminationPeriodState(panelIdentifiers);
        this.riders$ = this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getPlanOfferingRiders(this.planPanel.planOffering.id)));

        this.selectedCoverageLevel$ = this.producerShopComponentStoreService
            .getCoverageLevelState(panelIdentifiers)
            .pipe(map((coverageLevelState) => coverageLevelState?.coverageLevel));

        this.selectedBenefitAmount$ = this.producerShopComponentStoreService.getBenefitAmountState(panelIdentifiers);

        this.selectedPlanOfferingWithCartAndEnrollment$ = this.ngrxStore.onAsyncValue(
            select(
                PlanOfferingsSelectors.getPlanOfferingData(
                    panelIdentifiers.planOfferingId,
                    panelIdentifiers.cartId,
                    panelIdentifiers.enrollmentId,
                ),
            ),
        );

        const selectedRiskClassId$ = this.producerShopComponentStoreService
            .getSelectedProductRiskClassOnAsyncValue()
            .pipe(map((riskClass) => riskClass?.id));

        this.isCartDataChanged$ = combineLatest([
            this.selectedDependentAge$,
            this.selectedCoverageLevel$,
            this.selectedPlanOfferingWithCartAndEnrollment$,
            this.selectedBenefitAmount$,
            selectedRiskClassId$,
            this.manageCartItemsHelperService.getSelectedPlanCost(this.planPanel),
            this.riderComponentStoreService.getRiderStatesWithPlanPricings(panelIdentifiers),
        ]).pipe(
            map(
                ([
                    dependentAgeState,
                    coverageLevel,
                    planOfferingWithCartAndEnrollment,
                    benefitAmountState,
                    riskClassId,
                    selectedPlanCost,
                    riderStatesWithPricing,
                ]: [
                    DependentAgeState,
                    CoverageLevel,
                    PlanOfferingWithCartAndEnrollment,
                    BenefitAmountState,
                    number,
                    PlanOfferingCostInfo,
                    RiderStateWithPlanPricings[],
                ]) => {
                    // Check if planOfferingWithCartAndEnrollment still exists
                    // planOfferingWithCartAndEnrollment can become null if it has recently been deleted
                    if (!planOfferingWithCartAndEnrollment) {
                        return false;
                    }

                    return (
                        this.isBaseCartAndSelectedValueDifferent(
                            planOfferingWithCartAndEnrollment,
                            coverageLevel?.id,
                            benefitAmountState?.benefitAmount,
                            riskClassId,
                            dependentAgeState.dependentAge,
                        ) ||
                        this.isRiderCartAndSelectionValueDifferent(
                            planOfferingWithCartAndEnrollment.cartItemInfo,
                            selectedPlanCost,
                            riderStatesWithPricing,
                        )
                    );
                },
            ),
        );

        this.disableAddCart$ = combineLatest([
            this.isDependentAgeChanged$,
            this.selectedCoverageLevel$,
            this.selectedPlanOfferingWithCartAndEnrollment$,
            this.selectedBenefitAmount$,
            this.enrolledRiders$.pipe(startWith([])),
            this.manageCartItemsHelperService.getSelectedPlanCost(this.planPanel),
            this.riderComponentStoreService.getRiderStatesWithPlanPricings(panelIdentifiers),
            this.selectedEliminationPeriod$,
            this.riders$,
        ]).pipe(
            withLatestFrom(this.producerShopHelperService.inOpenEnrollment()),
            map(
                ([
                    [
                        isDependentAgeChanged,
                        coverageLevel,
                        planPanel,
                        benefitAmountState,
                        enrolledRiders,
                        selectedPlanCost,
                        riderStatesWithPricing,
                        eliminationPeriodState,
                        riders,
                    ],
                    inOpenEnrollment,
                ]: [
                    [
                        boolean,
                        CoverageLevel,
                        PlanOfferingWithCartAndEnrollment,
                        BenefitAmountState,
                        EnrollmentRider[],
                        PlanOfferingCostInfo,
                        RiderStateWithPlanPricings[],
                        EliminationPeriodState,
                        PlanOffering[],
                    ],
                    boolean,
                ]) => {
                    // Check if planOfferingWithCartAndEnrollment still exists
                    // planOfferingWithCartAndEnrollment can become null if it has recently been deleted
                    if (!planPanel) {
                        return true;
                    }
                    if (riders.length > 0 && riderStatesWithPricing?.length === 0) {
                        return true;
                    }

                    // Enrollment should be present
                    return (
                        planPanel?.enrollment &&
                        // enrolled rider and current selected value should be same
                        !this.isEnrolledRiderAndSelectionValueDifferent(enrolledRiders, selectedPlanCost, riderStatesWithPricing) &&
                        // it should not be allowed for re enroll
                        !this.producerShopHelperService.isOEAndEnrollmentDueToExpire(planPanel.enrollment, inOpenEnrollment) &&
                        // enrolled plan and current selected value should be same
                        !this.isEnrolledPlanAndSelectedValueDifferent(
                            planPanel,
                            coverageLevel?.id,
                            benefitAmountState?.benefitAmount,
                            isDependentAgeChanged,
                            eliminationPeriodState.eliminationPeriod,
                        )
                    );
                },
            ),
        );

        this.addCartSubject$
            .pipe(
                // triggers add to cart logic by opening knockout dialog
                switchMap(() => this.manageCartItemsHelperService.openKnockoutDialog()),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();
    }

    /**
     * triggers update/ add item to cart logic
     */
    addUpdateCart(): void {
        this.addCartSubject$.next();
    }

    /**
     * cart data is assumed as changed when cart item data and current selected values are different
     * We add a check on coverageLevelId, benefitAmount if present, riskClassOverrideId
     * @param planData plan Data with cart and enrollment
     * @param coverageLevelId coverage level id
     * @param benefitAmount benefit amount
     * @param riskClassId risk class id
     * @param dependentAge selected dependent age
     * @returns boolean indicating if cart data is different or not
     */
    isBaseCartAndSelectedValueDifferent(
        planData: PlanOfferingWithCartAndEnrollment,
        coverageLevelId: number,
        benefitAmount: number,
        riskClassId: number,
        dependentAge: number,
    ): boolean {
        if (!planData?.cartItemInfo) {
            return false;
        }

        if (planData.planOffering.plan.carrierId === CarrierId.AFLAC && planData.cartItemInfo.riskClassOverrideId !== riskClassId) {
            return true;
        }
        // NOTE: Juvenile Term life's pricing doesn't change when dependent age changes.
        // If selected plan is Juvenile Whole Life,
        // then compare dependent age value between cart item data and selected value
        const dependentAgeChanged =
            planData.planOffering.plan.product.id === ProductId.JUVENILE_WHOLE_LIFE && planData.cartItemInfo.dependentAge !== dependentAge;

        return (
            dependentAgeChanged ||
            planData.cartItemInfo.coverageLevelId !== coverageLevelId ||
            (planData.cartItemInfo.benefitAmount && planData.cartItemInfo.benefitAmount !== benefitAmount)
        );
    }

    /**
     * Gets if current rider selection is different from existing cart riders
     * @param cartItemInfo cart item info
     * @param selectedPlanCost selected base plan cose info
     * @param riderStatesWithPricing rider state selection data with pricing
     * @returns {boolean} indicating if rider cart and current selection values are different
     */
    isRiderCartAndSelectionValueDifferent(
        cartItemInfo: GetCartItems,
        selectedPlanCost: PlanOfferingCostInfo,
        riderStatesWithPricing: RiderStateWithPlanPricings[],
    ): boolean {
        const existingRiderCarts = cartItemInfo?.riders.filter((riderCart) => riderCart.coverageLevelId !== CoverageLevelId.DECLINED);
        const checkedRidersData = riderStatesWithPricing.filter((riderData) => riderData.riderState.checked);

        // If 0 valid riders in cart and 0 selected riders, then no different selection
        if (!existingRiderCarts?.length && !checkedRidersData?.length) {
            return false;
        }

        // If number of valid riders in cart and selected riders are not equal, then different selection of riders
        if (existingRiderCarts?.length !== checkedRidersData?.length) {
            return true;
        }

        // if number of riders in cart and selected riders are equal
        // then have to check for at least one difference of plan offering id, coverage level id's, benefit amounts etc.
        const selectedRiderCarts = this.manageCartItemsHelperService.getRiderCarts([], selectedPlanCost, checkedRidersData);
        return selectedRiderCarts.some((selectedRiderCart) => {
            const existingRiderCart = existingRiderCarts.find((cartItem) => cartItem.planOfferingId === selectedRiderCart.planOfferingId);

            // If we are not able to get existing Rider cart for any selected cart, then selection is different
            if (!existingRiderCart) {
                return true;
            }

            return (
                // Checking if coverage levels are different
                selectedRiderCart.coverageLevelId !== existingRiderCart.coverageLevelId ||
                // Checking if benefit amount exits and they are different
                (existingRiderCart.benefitAmount && selectedRiderCart.benefitAmount !== existingRiderCart.benefitAmount)
            );
        });
    }

    /**
     * Gets if current rider selection is different from existing cart riders
     * @param enrolledRiders enrolled riders info
     * @param selectedPlanCost selected base plan cost info
     * @param riderStatesWithPricing rider state selection data with pricing
     * @returns {boolean} indicating if enrolled rider and current selection values are different
     */
    isEnrolledRiderAndSelectionValueDifferent(
        enrolledRiders: EnrollmentRider[],
        selectedPlanCost: PlanOfferingCostInfo,
        riderStatesWithPricing: RiderStateWithPlanPricings[],
    ): boolean {
        const checkedRidersData = riderStatesWithPricing.filter((riderData) => riderData.riderState.checked);
        // If 0 valid riders are enrolled and 0 selected riders, then no different selection
        if (!enrolledRiders?.length && !checkedRidersData?.length) {
            return false;
        }
        // If number of valid enrolled riders and selected riders are not equal, then different selection of riders
        if (enrolledRiders?.length !== checkedRidersData?.length) {
            return true;
        }
        // if number of enrolled riders and selected riders are equal
        // then have to check for at least one difference of plan offering id, coverage level id's, benefit amounts etc.
        const selectedRidersData = checkedRidersData.map((riderData) => {
            const { riderState, pricingDatas } = riderData;
            const riderPricingData = pricingDatas.find(
                (pricingData) => pricingData.baseCoverageLevel.id === selectedPlanCost.planOfferingPricingCoverage?.coverageLevel.id,
            );
            const riderPlanOfferingPricing = riderState.checked ? riderPricingData?.riderPlanOfferingPricing : null;
            return {
                planId: riderState.riderPlanId,
                benefitAmount: riderPlanOfferingPricing?.benefitAmount,
                coverageLevelId: riderPlanOfferingPricing?.coverageLevelId,
            };
        });
        return selectedRidersData.some((selectedRider) => {
            const existingEnrolledRider = enrolledRiders.find((enrolledRider) => enrolledRider.plan.id === selectedRider.planId);
            // If we are not able to get existing enrolled rider then selection is different
            if (!existingEnrolledRider) {
                return true;
            }
            return (
                // Checking if coverage levels are different
                selectedRider.coverageLevelId !== existingEnrolledRider.coverageLevel.id ||
                // Checking if benefit amount exits and they are different
                (existingEnrolledRider.benefitAmount && selectedRider.benefitAmount !== existingEnrolledRider.benefitAmount)
            );
        });
    }
    /**
     * gets if plan is auto enrolled or not
     * @param planData plan offering with coverage dates
     * @param coverageLevelId selected coverage level id
     * @param benefitAmount selected benefit amount
     * @param isDependentAgeChanged boolean indicating dependent age is different in dependent age dropdown and enrolled dependent age
     * @param selectedEliminationPeriod selected elimination period
     * @returns boolean indicating if plan details is changed
     */
    isEnrolledPlanAndSelectedValueDifferent(
        planPanel: PlanOfferingWithCartAndEnrollment,
        coverageLevelId: number,
        benefitAmount: number,
        isDependentAgeChanged: boolean,
        selectedEliminationPeriod: EliminationPeriod,
    ): boolean {
        const isCoverageLevelChanged = planPanel.enrollment?.coverageLevel.id !== coverageLevelId;
        const isEliminationPeriodChanged = planPanel.enrollment?.coverageLevel.eliminationPeriod
            ? planPanel.enrollment?.coverageLevel.eliminationPeriod !== selectedEliminationPeriod.eliminationPeriod
            : false;

        return (
            isEliminationPeriodChanged ||
            isDependentAgeChanged ||
            isCoverageLevelChanged ||
            ((planPanel.enrollment.benefitAmount || benefitAmount) && planPanel.enrollment.benefitAmount !== benefitAmount)
        );
    }

    /**
     * Get a Record of translations using LanguageService
     * @returns {Record<string, string>} Record of translations
     */
    getLanguageStrings(): Record<string, string> {
        return this.languageService.fetchPrimaryLanguageValues(["primary.portal.producerShopPage.toolTipText.anotherUserIsUpdatingCart"]);
    }
    /**
     * Clean up rxjs subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscriber$.next();
        this.unsubscriber$.complete();
    }
}
