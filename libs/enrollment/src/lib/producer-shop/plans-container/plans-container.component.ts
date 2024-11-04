import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ApplicationStatusTypes } from "@empowered/api";
import {
    AlertType,
    AsyncData,
    AsyncStatus,
    CarrierId,
    CombinedOfferingWithCartAndEnrollment,
    CrossBorderAlertType,
    EnrollmentEnums,
    EnrollmentMethod,
    PlanOfferingPricingsIdentifiers,
    PlanOfferingWithCartAndEnrollment,
    Characteristics,
    PlanType,
    MissingInfoType,
    CoverageLevel,
    PlanOffering,
    EnrollmentRider,
    Enrollments,
    PlanOfferingPricing,
} from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { getErrorMessage } from "@empowered/ngrx-store";
import { AccountsSelectors } from "@empowered/ngrx-store/ngrx-states/accounts";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { EnrollmentsActions, EnrollmentsSelectors } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { PlanOfferingsActions, PlanOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { EliminationPeriod } from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.model";
import { ProductOfferingsActions, ProductOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/product-offerings";
import { ProductsSelectors } from "@empowered/ngrx-store/ngrx-states/products";
import { getEnrollmentStatus } from "@empowered/ngrx-store/services/enrollment-helper/enrollment-helper.service";
import { RXJSService } from "@empowered/ngrx-store/services/rxjs/rxjs.service";
import { SharedSelectors } from "@empowered/ngrx-store/ngrx-states/shared";
import { select } from "@ngrx/store";
import { combineLatest, Observable, of, Subject } from "rxjs";
import { distinctUntilChanged, filter, map, startWith, switchMap, takeUntil, tap, withLatestFrom } from "rxjs/operators";
import { DependentAgeService } from "../services/dependent-age/dependent-age.service";
import { PlanOfferingService } from "../services/plan-offering/plan-offering.service";
import { ProducerShopComponentStoreService } from "../services/producer-shop-component-store/producer-shop-component-store.service";
import { ProducerShopHelperService } from "../services/producer-shop-helper/producer-shop-helper.service";
import { RiderComponentStoreService } from "../services/rider-component-store/rider-component-store.service";
import { PlansContainerData, PlanOfferingPricingsActionProperties, AlertMessage } from "./plans-container.model";
import { ShoppingCartsSelectors } from "@empowered/ngrx-store/ngrx-states/shopping-carts";
import { PanelIdentifiers } from "../services/producer-shop-component-store/producer-shop-component-store.model";
import { PlanPanelService } from "../services/plan-panel/plan-panel.service";
import { AsyncStateService } from "../services/async-state/async-state.service";
import { TpiRestrictionsHelperService } from "../services/tpi-restriction-helper/tpi-restrictions-helper.service";
import { DateService } from "@empowered/date";

@Component({
    selector: "empowered-plans-container",
    templateUrl: "./plans-container.component.html",
    styleUrls: ["./plans-container.component.scss"],
})
export class PlansContainerComponent implements OnInit, OnDestroy {
    private readonly unsubscriber$ = new Subject<void>();

    // Combined offering data of selected product
    readonly combinedOfferingWithCartAndEnrollment$ = this.ngrxStore
        .onAsyncValue(select(PlanOfferingsSelectors.getSelectedProductCombinedOfferingWithCartAndEnrollment))
        .pipe(
            filter((combinedOfferingWithCartAndEnrollment) =>
                Boolean(combinedOfferingWithCartAndEnrollment?.planOfferingsWithCartAndEnrollment.length),
            ),
        );

    // Gets member info
    readonly memberInfo$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedMemberProfile));
    // get tobacco information from more settings
    private readonly selectedTobaccoInformation$ = this.producerShopComponentStoreService.selectTobaccoInformationOnAsyncValue();

    // Selected plan offering id
    private readonly selectedPlanOfferingId$ = this.ngrxStore.pipe(select(PlanOfferingsSelectors.getSelectedPlanOfferingId));

    private readonly selectedPlanOffering$ = this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getSelectedPlanOffering));

    private readonly mandatoryRiderPlanIds$ = this.ngrxStore.onAsyncValue(select(SharedSelectors.getMandatoryRiderPlanIds));

    // Translations
    readonly languageStrings = this.getLanguageStrings();

    private readonly coverageEffectiveDate$ = this.producerShopComponentStoreService
        .getSelectedProductCoverageDateOnAsyncValue()
        .pipe(map((coverageDate) => coverageDate?.date));

    private readonly riskClassId$ = this.producerShopComponentStoreService.getSelectedProductRiskClassOnAsyncValue().pipe(
        map((riskClass) => riskClass?.id),
        distinctUntilChanged(),
    );

    // Gets selected Plan Offering With CoverageDates
    private readonly selectedPlanOfferingData$ = this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getSelectedPlanOfferingData));

    private readonly selectedRiders$ = this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getSelectedPlanOfferingRiders)).pipe(
        // Since PlanOffering riders api calls are made frequently, onAsyncValue for selected PlanOffering riders
        // will emit multiple times for each api call,
        // to prevent this, we can check if the array of PlanOffering riders change using their ids
        this.rxjsService.distinctArrayUntilChanged(),
    );

    // Get rider states with benefit amount info for selected plan
    private readonly riderStatesWithBenefitAmount$ = this.selectedPlanOfferingData$.pipe(
        switchMap((planPanel) => {
            // Return no benefit amounts if there is no selected PlanOffering with PanelIdentifiers
            // This can happen when loading selected Enrollment.id or CartItem.id
            // Or when a PlanOffering has been added or removed from cart
            if (!planPanel) {
                return of([]);
            }

            return this.riderComponentStoreService.getRiderStatesWithBaseBenefitAmount(
                this.planPanelService.getPanelIdentifiers(planPanel),
            );
        }),
    );

    private readonly shoppingCartItemId$ = this.selectedPlanOfferingData$.pipe(map((planPanel) => planPanel?.cartItemInfo?.id));

    private readonly crossBorderRestrictions$ = this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getCrossBorderRestrictions));

    // Get whole enrollment set
    private readonly enrollments$ = this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.getSelectedEnrollments)).pipe(
        // Avoid redundent emitted values when no enrollments have changed
        this.rxjsService.distinctArrayUntilChanged(),
    );

    // provides combined offering along with cross border restriction data
    readonly combinedOfferingData$: Observable<PlansContainerData> = combineLatest([
        this.combinedOfferingWithCartAndEnrollment$,
        this.crossBorderRestrictions$,
    ]).pipe(
        map(([combinedOfferingWithCartAndEnrollment, crossBorderRestrictions]) => {
            const restrictions = Object.values(crossBorderRestrictions)?.filter((restriction) => restriction !== CrossBorderAlertType.NONE);

            // Filter enrollable plans
            const enrollablePlans = combinedOfferingWithCartAndEnrollment.planOfferingsWithCartAndEnrollment.filter(
                (planOfferingWithCartAndEnrollment) =>
                    this.planOfferingService.getPlan(planOfferingWithCartAndEnrollment.planOffering).enrollable === true,
            );
            // Check if all enrollable plans have same missing info
            const isSameMissingInfoForEnrollablePlans = enrollablePlans.every(
                (planOfferingWithCartAndEnrollment) =>
                    // if selected plan is supplementary or planOffering has the missing information
                    this.planOfferingService.planOfferingHasSupplementaryPlan(planOfferingWithCartAndEnrollment.planOffering) ||
                    planOfferingWithCartAndEnrollment.planOffering.missingInformation ===
                        enrollablePlans[0].planOffering.missingInformation,
            );

            // Get enrollment at combined offering level for enrollment status
            const combinedOfferingEnrollment = combinedOfferingWithCartAndEnrollment.planOfferingsWithCartAndEnrollment.filter(
                (plan) => plan.enrollment,
            )[0]?.enrollment;

            return {
                combinedOffering: combinedOfferingWithCartAndEnrollment,
                enrollmentRestrictionType: restrictions[0],
                allPlansRestricted: combinedOfferingWithCartAndEnrollment.planOfferingsWithCartAndEnrollment.length === restrictions.length,
                // If all enrollable plans have same missing info, missing info alert should be shown on top of page
                missingInformation: isSameMissingInfoForEnrollablePlans ? enrollablePlans[0].planOffering.missingInformation : null,
                // Gets enrollment status for combinedOfferings with enrollment
                enrollmentStatus: combinedOfferingEnrollment ? getEnrollmentStatus(combinedOfferingEnrollment) : null,
            };
        }),
    );
    // Check for open enrollment
    private readonly isOE$ = this.producerShopHelperService.inOpenEnrollment();

    // Gets selected planYears set
    private readonly planYears$ = this.ngrxStore.onAsyncValue(select(ProductOfferingsSelectors.getSelectedPlanYearSet));

    // Gets selected plan id
    private readonly selectedPlanId$ = this.ngrxStore.pipe(select(PlanOfferingsSelectors.getSelectedPlanId));

    // Get selected BenefitAmountState using selected plan Id
    private readonly selectedBenefitAmount$ = this.selectedPlanOfferingData$.pipe(
        switchMap((planPanel) => {
            // Return no benefit amount if there is no selected PlanOffering with PanelIdentifiers
            // This can happen when loading selected Enrollment.id or CartItem.id
            // Or when a PlanOffering has been added or removed from cart
            if (!planPanel) {
                return of(null);
            }

            return this.producerShopComponentStoreService.getBenefitAmountState(this.planPanelService.getPanelIdentifiers(planPanel));
        }),
    );

    // Gets selected enrollment
    private readonly selectedEnrolledData$ = this.selectedPlanId$.pipe(
        withLatestFrom(this.enrollments$),
        map(([planId, enrollments]) => enrollments.find((enrollment) => enrollment?.plan?.id === planId)),
    );

    // provides if decline coverage is to be shown or not
    readonly showDeclineCoverage$ = combineLatest([this.combinedOfferingData$, this.selectedEnrolledData$]).pipe(
        withLatestFrom(this.isOE$, this.planYears$),
        map(([[combinedOfferingData, selectedEnrolledData], isOE, planYears]) => {
            let futureCoverageStartBeforeCurrentEnrollmentEnds = false;
            const isApplicationStatusEnrolled = combinedOfferingData.enrollmentStatus === ApplicationStatusTypes.Enrolled;
            const isApplicationStatusActive = combinedOfferingData.enrollmentStatus === ApplicationStatusTypes.Active;
            // If product is enrolled and in OE period, Check for enrollment expire date > future coverage start date,
            // then set "futureCoverageStartBeforeCurrentEnrollmentEnds" as true.
            if (isApplicationStatusEnrolled && isOE && planYears.length && selectedEnrolledData?.validity?.expiresAfter) {
                const enrollmentEndDate = selectedEnrolledData?.validity?.expiresAfter
                    ? this.dateService.toDate(selectedEnrolledData.validity.expiresAfter)
                    : undefined;
                const futureCoverageStartDate = this.dateService.toDate(planYears[planYears.length - 1].coveragePeriod.effectiveStarting);
                futureCoverageStartBeforeCurrentEnrollmentEnds = enrollmentEndDate > futureCoverageStartDate;
            }

            // Hide "Decline coverage" button if any of the following conditions are true.
            return !(
                combinedOfferingData.allPlansRestricted || // When all plans are restricted
                // When all plans are either auto enrolled or redirect plans
                this.isAllAutoEnrolledOrRedirectPlans(combinedOfferingData.combinedOffering) ||
                isApplicationStatusActive || // When application status is Active
                isApplicationStatusEnrolled || // When application status is Enrolled.
                // When product is enrolled and in OE period,
                // And enrollment expire-date > future coverage start-date
                futureCoverageStartBeforeCurrentEnrollmentEnds
            );
        }),
    );

    // Gets mpGroup
    private readonly mpGroup$ = this.ngrxStore.pipe(select(AccountsSelectors.getSelectedMPGroup));

    // Gets member id
    private readonly memberId$ = this.ngrxStore.pipe(select(MembersSelectors.getSelectedMemberId));

    // Gets enrollment method
    private readonly enrollmentMethod$ = this.ngrxStore.pipe(select(SharedSelectors.getSelectedEnrollmentMethod));

    // Gets selected product offering id
    private readonly selectedProductOfferingId$ = this.ngrxStore.pipe(select(ProductsSelectors.getSelectedProductOfferingId));

    // Gets selected product id
    private readonly selectedProductId$ = this.ngrxStore.pipe(select(ProductsSelectors.getSelectedProductId));

    // Get the product ids for additional units from config
    private readonly getProductIdsForAdditionalUnit$ = this.ngrxStore.onAsyncValue(select(SharedSelectors.getProductIdsForAdditionalUnit));

    // Whether selected product id is part of additional units
    readonly importPolicyForAdditionalUnit$ = combineLatest([this.getProductIdsForAdditionalUnit$, this.selectedProductId$]).pipe(
        map(([productIdsForAdditionalUnit, productId]) => productIdsForAdditionalUnit.includes(productId)),
    );

    // Get the product id for buy up from config
    private readonly getProductIdForBuyUpPlan$ = this.ngrxStore.onAsyncValue(select(SharedSelectors.getProductIdForBuyUpPlan));

    // Whether selected product id is part of buy up plans
    readonly importPolicyForBuyUpPlan$ = combineLatest([this.getProductIdForBuyUpPlan$, this.selectedProductId$]).pipe(
        map(([productIdsForBuyUpPlan, productId]) => productIdsForBuyUpPlan === productId),
    );
    // Observable of boolean whether the cart is locked or not
    readonly isShoppingCartLocked$: Observable<boolean> = this.ngrxStore
        .onAsyncValue(select(ShoppingCartsSelectors.getShoppingCart))
        .pipe(map((shoppingCart) => shoppingCart.locked));
    // Get flag to determine that policy link should be visible or not
    // It should be visible only for Aflac carrier with either additional unit or buy ups product ids
    readonly displayImportPolicyLink$ = combineLatest([
        this.selectedPlanOfferingData$,
        this.importPolicyForAdditionalUnit$,
        this.importPolicyForBuyUpPlan$,
    ]).pipe(
        map(
            ([selectedPlanOfferingData, additionalUnitImportOptions, buyUpImportOptions]) =>
                selectedPlanOfferingData?.planOffering?.plan.carrierId === CarrierId.AFLAC &&
                (additionalUnitImportOptions || buyUpImportOptions),
        ),
    );

    // Disable the decline coverage button if selected productId is declined
    readonly disableCoverageButton$: Observable<boolean> = combineLatest([
        this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.getDeclineProductOfferingIds)),
        this.selectedProductId$,
    ]).pipe(map(([declinedProductIds, selectedProductId]): boolean => declinedProductIds.includes(selectedProductId)));

    // combine decline product param set
    readonly declineProductParamSet$ = combineLatest([
        this.mpGroup$,
        this.memberId$,
        this.enrollmentMethod$,
        this.selectedProductOfferingId$,
    ]);

    readonly missingInfoType = MissingInfoType;

    private readonly planOfferingId$ = this.ngrxStore.pipe(select(PlanOfferingsSelectors.getSelectedPlanOfferingId));

    private readonly selectedStateAbbreviation$ = this.ngrxStore
        .onAsyncValue(select(MembersSelectors.getSelectedMemberEnrollmentStateAbbreviation))
        .pipe(distinctUntilChanged());

    readonly CrossBorderAlertType = CrossBorderAlertType;
    private enrolledBasePlanRiders$ = new Observable<EnrollmentRider[]>();

    alertMessage$: Observable<AlertMessage | null>;

    // indicates if dependent is required for Juvenile plans
    readonly isDependentRequired$ = this.tpiRestrictionsHelper.isDependentRequiredForJuvenile();

    readonly disableDeclineCoverage$ = combineLatest([this.isDependentRequired$, this.isShoppingCartLocked$]).pipe(
        map(([isDependentRequired, isCartLocked]) => isDependentRequired || isCartLocked),
    );

    constructor(
        private readonly ngrxStore: NGRXStore,
        private readonly languageService: LanguageService,
        private readonly route: Router,
        private readonly router: ActivatedRoute,
        private readonly planPanelService: PlanPanelService,
        private readonly producerShopComponentStoreService: ProducerShopComponentStoreService,
        private readonly riderComponentStoreService: RiderComponentStoreService,
        private readonly producerShopHelperService: ProducerShopHelperService,
        private readonly planOfferingService: PlanOfferingService,
        private readonly rxjsService: RXJSService,
        private readonly dependentAgeService: DependentAgeService,
        private readonly asyncStateService: AsyncStateService,
        private readonly tpiRestrictionsHelper: TpiRestrictionsHelperService,
        private readonly dateService: DateService,
    ) {
        combineLatest([
            this.planOfferingId$.pipe(this.ngrxStore.filterForNonNullish()),
            this.mpGroup$,
            this.memberId$,
            this.selectedStateAbbreviation$,
        ])
            .pipe(
                tap(([planOfferingId, mpGroup, memberId, stateAbbreviation]) =>
                    this.ngrxStore.dispatch(
                        PlanOfferingsActions.loadKnockoutQuestions({
                            planOfferingId,
                            mpGroup,
                            memberId,
                            stateAbbreviation,
                        }),
                    ),
                ),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();
    }

    /**
     * Initializes on load
     */
    ngOnInit(): void {
        // Generate a possible simple error message
        this.alertMessage$ = combineLatest([
            this.asyncStateService.getAlertMessage(AlertType.DANGER),
            // Start with null to avoid waiting during loading state
            this.combinedOfferingData$.pipe(startWith(null)),
        ]).pipe(
            map(([apiErrorMessage, combinedOfferingData]) => {
                if (apiErrorMessage) {
                    return apiErrorMessage;
                }

                // Used for handling error messages involving CrossBorders
                const enrollmentRestrictionType = combinedOfferingData?.enrollmentRestrictionType;

                // Handle "danger" Alerts
                if (enrollmentRestrictionType === CrossBorderAlertType.ERROR) {
                    return { language: "primary.portal.quoteShop.plansDisplay.crossBorderRestriction", alertType: AlertType.DANGER };
                }

                // Handle "warning" Alerts
                if (enrollmentRestrictionType === CrossBorderAlertType.WARNING) {
                    return { language: "primary.portal.enrollmentMethod.missingEAAWarning", alertType: AlertType.WARNING };
                }

                // Don't display an general alert message
                // This doesn't mean that there won't be any kind of alert message shown since there's more
                // complex cases being handled outside of this Observable
                return null;
            }),
        );

        const stateAbbreviation$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedMemberEnrollmentStateAbbreviation));

        this.selectedPlanOfferingData$
            .pipe(
                switchMap((planPanel) => this.enrollments$.pipe(map((enrollments) => ({ planPanel, enrollments })))),
                switchMap(({ planPanel, enrollments }) => {
                    // Return no benefit amounts if there is no selected PlanOffering with PanelIdentifiers
                    // This can happen when loading selected Enrollment.id or CartItem.id
                    // Or when a PlanOffering has been added or removed from cart
                    if (!planPanel) {
                        return of({ planPanel, benefitAmounts: [], enrollments });
                    }

                    return this.getBeneiftAmounts(planPanel).pipe(map((benefitAmounts) => ({ planPanel, benefitAmounts, enrollments })));
                }),
                map(
                    ({
                        planPanel,
                        benefitAmounts,
                        enrollments,
                    }: {
                        planPanel: PlanOfferingWithCartAndEnrollment | null;
                        benefitAmounts: number[];
                        enrollments: Enrollments[];
                    }) => {
                        // Return no selected benefit amount if there is no selected PlanOffering with PanelIdentifiers
                        // This can happen when loading selected Enrollment.id or CartItem.id
                        // Or when a PlanOffering has been added or removed from cart
                        if (!planPanel) {
                            return {
                                benefitAmount: null,
                                panelIdentifiers: null,
                            };
                        }

                        const panelIdentifiers = this.planPanelService.getPanelIdentifiers(planPanel);
                        // flag to check supplementary plan
                        const isSupplementaryPlan = this.planOfferingService.planOfferingHasSupplementaryPlan(planPanel.planOffering);
                        // find the enrolled base plan for supplementary plan to set the coverage attributes
                        const enrolledBasePlan = enrollments.find(
                            (enrollment) =>
                                isSupplementaryPlan && enrollment.plan.dependentPlanIds?.includes(planPanel.planOffering.plan.id),
                        );
                        const cartItemBenefitAmount = planPanel?.cartItemInfo?.benefitAmount;

                        const enrollmentBenefitAmount = planPanel?.enrollment?.benefitAmount ?? enrolledBasePlan?.benefitAmount;
                        const defaultBenefitAmount = benefitAmounts[0];

                        const benefitAmount = cartItemBenefitAmount ?? enrollmentBenefitAmount ?? defaultBenefitAmount ?? null;

                        return { benefitAmount, panelIdentifiers };
                    },
                ),
                tap(({ benefitAmount, panelIdentifiers }: { benefitAmount: number | null; panelIdentifiers: PanelIdentifiers | null }) => {
                    if (!panelIdentifiers) {
                        return;
                    }

                    // Update the local store for benefit amount same as enrolled base plan
                    this.producerShopComponentStoreService.addBenefitAmountState({
                        benefitAmount,
                        panelIdentifiers,
                    });
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        this.selectedPlanOfferingData$
            .pipe(
                switchMap((planPanel) => this.enrollments$.pipe(map((enrollments) => ({ planPanel, enrollments })))),
                switchMap(({ planPanel, enrollments }) => {
                    // Return no selected coverage levels if there is no selected PlanOffering with PanelIdentifiers
                    // This can happen when loading selected Enrollment.id or CartItem.id
                    // Or when a PlanOffering has been added or removed from cart
                    if (!planPanel) {
                        return of({
                            planPanel: null,
                            enrollments,
                            coverageLevels: [],
                        });
                    }

                    const planId = this.planOfferingService.getPlanId(planPanel.planOffering);

                    return this.ngrxStore
                        .onAsyncValue(select(PlanOfferingsSelectors.getCoverageLevels(planId)))
                        .pipe(map((coverageLevels) => ({ planPanel, coverageLevels, enrollments })));
                }),
                tap(
                    ({
                        planPanel,
                        coverageLevels,
                        enrollments,
                    }: {
                        planPanel: PlanOfferingWithCartAndEnrollment | null;
                        coverageLevels: CoverageLevel[];
                        enrollments: Enrollments[];
                    }) => {
                        // Skip defaulting coverage levels if there is no selected PlanOffering with PanelIdentifiers
                        // This can happen when loading selected Enrollment.id or CartItem.id
                        // Or when a PlanOffering has been added or removed from cart
                        if (!planPanel) {
                            return;
                        }

                        const panelIdentifiers = this.planPanelService.getPanelIdentifiers(planPanel);

                        // Assign default coverage level as empty object if plan doesn't have any coverage level present
                        const defaultCoverageLevel = coverageLevels.length ? coverageLevels[0] : ({} as CoverageLevel);

                        // flag to check supplementary plan
                        const isSupplementaryPlan = this.planOfferingService.planOfferingHasSupplementaryPlan(planPanel.planOffering);

                        // find the enrolled base plan for supplementary plan to set the coverage attributes
                        const enrolledBasePlan = enrollments.find(
                            (enrollment) =>
                                isSupplementaryPlan && enrollment.plan.dependentPlanIds?.includes(planPanel.planOffering.plan.id),
                        );
                        // If cartItemInfo is not present then default coverageLevel will be the coverageLevel at 0 index
                        // If cartItemInfo is present then we have to compare coverage level id's to get the default coverageLevel on load
                        const cartItemCoverageLevel = planPanel?.cartItemInfo
                            ? coverageLevels.find(({ id }) => id === planPanel.cartItemInfo.coverageLevelId)
                            : null;

                        const enrollmentCoverageLevelId = planPanel?.enrollment?.coverageLevel.id ?? enrolledBasePlan?.coverageLevel.id;
                        // We need to find coverage level with Id to match coverage level object.
                        const enrollmentCoverageLevel = enrollmentCoverageLevelId
                            ? coverageLevels.find(({ id }) => id === enrollmentCoverageLevelId)
                            : null;

                        const coverageLevel = cartItemCoverageLevel ?? enrollmentCoverageLevel ?? defaultCoverageLevel;

                        this.producerShopComponentStoreService.addCoverageLevelState({
                            panelIdentifiers,
                            coverageLevel,
                        });

                        const eliminationPeriod = coverageLevel?.eliminationPeriod ? (coverageLevel as EliminationPeriod) : null;

                        this.producerShopComponentStoreService.addEliminationPeriodState({
                            eliminationPeriod,
                            panelIdentifiers,
                        });
                    },
                ),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();
        // Get the selected enrolled riders for supplementary base plan
        this.enrolledBasePlanRiders$ = combineLatest([this.selectedPlanOfferingData$, this.enrollments$]).pipe(
            switchMap(([planPanel, enrollmentsData]) => {
                // Return no Enrollment Riders if there is no selected PlanOffering with PanelIdentifiers
                // This can happen when loading selected Enrollment.id or CartItem.id
                // Or when a PlanOffering has been added or removed from cart
                if (!planPanel) {
                    return of([]);
                }

                const isSupplementaryPlan = this.planOfferingService.planOfferingHasSupplementaryPlan(planPanel.planOffering);
                const enrolledPlan = enrollmentsData?.find(
                    (enrollment) => enrollment.plan.dependentPlanIds?.includes(planPanel.planOffering.plan.id) && isSupplementaryPlan,
                );

                if (!enrolledPlan) {
                    return of([]);
                }

                return this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.getEnrollmentRiders(enrolledPlan.id)));
            }),
        );

        // Set default value for dependent Age dropdown
        this.selectedPlanOfferingData$
            .pipe(
                switchMap((planPanel) => {
                    // Return 0 as dependent age if there is no selected PlanOffering with PanelIdentifiers
                    // This can happen when loading selected Enrollment.id or CartItem.id
                    // Or when a PlanOffering has been added or removed from cart
                    if (!planPanel) {
                        return of({ planPanel: null, dependentAge: 0 });
                    }

                    // get dependentAge
                    return this.dependentAgeService
                        .getDefaultMemberDependentChildAge(planPanel)
                        .pipe(map((dependentAge) => ({ planPanel, dependentAge })));
                }),
                tap(({ planPanel, dependentAge }: { planPanel: PlanOfferingWithCartAndEnrollment | null; dependentAge: number }) => {
                    // Skip defaulting dependent age if there is no selected PlanOffering with PanelIdentifiers
                    // This can happen when loading selected Enrollment.id or CartItem.id
                    // Or when a PlanOffering has been added or removed from cart
                    if (!planPanel) {
                        return;
                    }

                    const panelIdentifiers = this.planPanelService.getPanelIdentifiers(planPanel);

                    // Add dependent age default value to DependentAgeState
                    this.producerShopComponentStoreService.addDependentAgeState({
                        dependentAge,
                        panelIdentifiers,
                    });
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // Expand first plan panel only when product is loaded first time
        this.selectedProductOfferingId$
            .pipe(
                distinctUntilChanged(),
                withLatestFrom(this.combinedOfferingWithCartAndEnrollment$, this.selectedPlanOfferingId$.pipe(startWith(0))),
                tap(([_, combinedOffering, selectedPlanOfferingId]) => {
                    if (
                        combinedOffering.planOfferingsWithCartAndEnrollment.every(
                            (planOfferingWithCartAndEnrollment) =>
                                planOfferingWithCartAndEnrollment.planOffering.id !== selectedPlanOfferingId,
                        )
                    ) {
                        this.onPlanSelection(combinedOffering.planOfferingsWithCartAndEnrollment[0]);
                    }
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        combineLatest([this.mpGroup$, this.memberId$, this.selectedPlanOfferingData$])
            .pipe(
                tap(([mpGroup, memberId, planPanel]) => {
                    // Return if there is no plan panel and skip checking for enrollment id
                    // Skip trying to get Enrollment Beneficiaries or Dependents since if there is no PlanPanel, there won't be
                    // an enrollment id
                    // if there is no selected PlanOffering with PanelIdentifiers
                    // This can happen when loading selected Enrollment.id or CartItem.id
                    // Or when a PlanOffering has been added or removed from cart
                    if (!planPanel) {
                        return;
                    }
                    const enrollmentId = planPanel.enrollment?.id;

                    // Return if there is no selectedEnrollment Id
                    if (!enrollmentId) {
                        return;
                    }

                    // Dispatch only if there is an enrollment
                    this.ngrxStore.dispatch(
                        EnrollmentsActions.loadEnrollmentBeneficiaries({
                            memberId,
                            enrollmentId,
                            mpGroup,
                        }),
                    );

                    // `dispatchIfIdle` will reduce redundant api calls
                    this.ngrxStore.dispatchIfIdle(
                        EnrollmentsActions.loadEnrollmentDependents({
                            memberId,
                            enrollmentId,
                            mpGroup,
                        }),
                        EnrollmentsSelectors.getEnrollmentDependents(enrollmentId),
                    );
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // Dispatch ngrx action for CoverageLevels if no api call has been made yet
        combineLatest([this.mpGroup$, this.selectedPlanId$])
            .pipe(
                // Get CoverageLevels AsyncData
                withLatestFrom(this.ngrxStore.pipe(select(PlanOfferingsSelectors.getSelectedCoverageLevels))),
                tap(([[mpGroup, planId], coverageLevelsAsyncData]) => {
                    // Avoid making redundent api calls if data is still IDLE
                    if (coverageLevelsAsyncData.status !== AsyncStatus.IDLE) {
                        return;
                    }

                    this.ngrxStore.dispatch(
                        PlanOfferingsActions.loadCoverageLevels({
                            planId,
                            mpGroup,
                            // fetchRetainRiders is always false for BASE PlanOfferings,
                            // this value might be true for RIDER PlanOfferings only
                            fetchRetainRiders: false,
                        }),
                    );
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // Dispatch ngrx action for PlanOfferingPricings if no api call has been made for previous call failed
        combineLatest([
            stateAbbreviation$,
            this.selectedTobaccoInformation$,
            this.shoppingCartItemId$,
            // Get the latest riskClassId based on dropdown and selected productId
            this.riskClassId$,
            // Get the latest coverageEfectiveDate based on dropdown and selected productId
            this.coverageEffectiveDate$,
        ])
            .pipe(
                withLatestFrom(this.mpGroup$, this.memberId$, this.selectedPlanOfferingId$),
                tap(
                    ([
                        [stateAbbreviation, selectedTobaccoInformation, shoppingCartItemId, riskClassId, coverageEffectiveDate],
                        mpGroup,
                        memberId,
                        planOfferingId,
                    ]) => {
                        // Avoid dispatching action when api call would be redundent since AsyncStatus is still IDLE
                        this.ngrxStore.dispatchIfIdle(
                            PlanOfferingsActions.loadPlanOfferingPricings({
                                mpGroup,
                                planOfferingId,
                                memberId,
                                stateAbbreviation,
                                riskClassId,
                                coverageEffectiveDate,
                                memberIsTobaccoUser: selectedTobaccoInformation.memberIsTobaccoUser,
                                spouseIsTobaccoUser: selectedTobaccoInformation.spouseIsTobaccoUser,
                                shoppingCartItemId,
                                includeFee: false,
                            }),
                            PlanOfferingsSelectors.getSelectedPlanOfferingPricings(
                                riskClassId,
                                coverageEffectiveDate,
                                null,
                                null,
                                null,
                                selectedTobaccoInformation,
                                shoppingCartItemId,
                            ),
                        );
                    },
                ),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        combineLatest([
            this.selectedPlanOfferingId$,
            this.enrollmentMethod$,
            this.mpGroup$,
            this.memberId$,
            stateAbbreviation$,
            this.coverageEffectiveDate$,
        ])
            .pipe(
                tap(([planOfferingId, enrollmentMethod, mpGroup, memberId, stateAbbreviation, coverageEffectiveDate]) =>
                    this.ngrxStore.dispatchIfIdle(
                        PlanOfferingsActions.loadPlanOfferingRiders({
                            planOfferingId,
                            enrollmentMethod,
                            mpGroup,
                            memberId,
                            stateAbbreviation,
                            coverageEffectiveDate,
                        }),
                        PlanOfferingsSelectors.getPlanOfferingRiders(planOfferingId),
                    ),
                ),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // Using selected PlanOffering Rider and (parent) Coveragelevels AsyncDatas,
        // Select child CoverageLevels AsyncDatas and retain Rider / Parent CoverageLevels
        const riderCoveragelevelsDatas$: Observable<
        {
            rider: PlanOffering;
            parentCoverageLevel: CoverageLevel;
            coverageLevelsData: AsyncData<CoverageLevel[]>;
        }[]
        > = this.selectedPlanOffering$.pipe(
            // It's important to get the Riders / CoverageLevels by PlanOffering id instead of using the selected selectors
            // This is because, if we don't, the combineLatest will emit multiple times as all the selectors shift to the proper
            // PlanOffering id
            // By setting them manually, the selectors will only listen for the right PlanOffering
            switchMap((planOffering) =>
                combineLatest([
                    this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getPlanOfferingRiders(planOffering?.id))),
                    this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getCoverageLevels(planOffering?.plan.id))),
                ]).pipe(map(([riders, parentCoverageLevels]) => ({ planOffering, riders, parentCoverageLevels }))),
            ),
            map(({ planOffering, riders, parentCoverageLevels }) => {
                // Get array of arrays of parent CoverageLevels -> CoverageLevel[][]
                // Also include the PlanOffering (Rider) instance
                const nestedParentCoverageLevels = riders.map((rider) =>
                    parentCoverageLevels.map((parentCoverageLevel) => ({
                        parentCoverageLevel,
                        rider,
                    })),
                );

                return {
                    // Flatten array of arrays to a single array:
                    // CoverageLevel[][] -> CoverageLevel[]
                    flattenValues: nestedParentCoverageLevels.flat(),
                    planOffering,
                };
            }),
            switchMap(({ flattenValues, planOffering }) => {
                // Avoid doing combineLatest of empty array
                // This will result in the Observable completing
                if (!flattenValues.length) {
                    return of([]);
                }

                return combineLatest(
                    // Get the stored ngrx AsyncDatas of CoveragLevels for each parent CoverageLevel
                    flattenValues.map(({ parentCoverageLevel, rider }) =>
                        this.ngrxStore
                            .pipe(
                                select(
                                    PlanOfferingsSelectors.getCoverageLevels(
                                        rider.plan.id,
                                        parentCoverageLevel.id,
                                        this.planOfferingService.planOfferingHasSupplementaryPlan(planOffering),
                                    ),
                                ),
                            )
                            .pipe(
                                // Combine return value with used rider and parentCoverageLevel
                                map((coverageLevelsData) => ({
                                    rider,
                                    parentCoverageLevel,
                                    coverageLevelsData,
                                })),
                            ),
                    ),
                );
            }),
        );

        // Dispatch ngrx action for (child) CoverageLevels if no api call has been made for previous call failed
        riderCoveragelevelsDatas$
            .pipe(
                // Check if every value of the previous array matches the new values
                // This is done to avoid redundent dispatches if riders or parent CoverageLevels haven't changed
                this.rxjsService.distinctArrayUntilChanged((previous, current) => {
                    const previousRider = previous.rider;
                    const previousParentCoverageLevel = previous.parentCoverageLevel;

                    const currentRider = current.rider;
                    const currentParentCoverageLevel = current.parentCoverageLevel;

                    return previousRider.id === currentRider?.id && previousParentCoverageLevel.id === currentParentCoverageLevel?.id;
                }),
                // Avoid making redundent api calls by filtering out AsyncData that is IDLE
                map((riderCoveragelevelsDatas) =>
                    riderCoveragelevelsDatas.filter(
                        (existingRiderCoveragelevelsData) => existingRiderCoveragelevelsData.coverageLevelsData.status === AsyncStatus.IDLE,
                    ),
                ),
                withLatestFrom(this.mpGroup$, this.selectedPlanOffering$),
                tap(([riderCoveragelevelsDatas, mpGroup, selectedPlanOffering]) => {
                    riderCoveragelevelsDatas.forEach(({ rider, parentCoverageLevel }) => {
                        const fetchRetainRiders = this.planOfferingService.planOfferingHasSupplementaryPlan(selectedPlanOffering);

                        this.ngrxStore.dispatch(
                            PlanOfferingsActions.loadCoverageLevels({
                                planId: rider.plan.id,
                                parentCoverageLevelId: parentCoverageLevel.id,
                                mpGroup,
                                fetchRetainRiders,
                            }),
                        );
                    });
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // Get all EnrollmentRiders AsyncDatas using Enrollments and retain Enrollment / EnrollmentRider
        const enrollmentRidersDatas$: Observable<
        {
            enrollment: Enrollments;
            enrollmentRidersData: AsyncData<EnrollmentRider[]>;
        }[]
        > = this.enrollments$.pipe(
            switchMap((enrollments) => {
                // Avoid doing combineLatest of empty array
                // This will result in the Observable completing
                if (!enrollments.length) {
                    return of([]);
                }

                return combineLatest(
                    // Get the stored ngrx AsyncDatas of CoveragLevels for each parent CoverageLevel
                    enrollments.map((enrollment) =>
                        this.ngrxStore.pipe(select(EnrollmentsSelectors.getEnrollmentRiders(enrollment.id))).pipe(
                            // Combine return enrollmentRidersData with used Enrollments
                            // reference to Enrollments is needed to dispatch actions later
                            map((enrollmentRidersData) => ({
                                enrollment,
                                enrollmentRidersData,
                            })),
                        ),
                    ),
                );
            }),
        );

        // Check all concatenated EnrollmentRiders AsyncDatas
        enrollmentRidersDatas$
            .pipe(
                // Check if every value of the previous array matches the new values
                // This is done to avoid redundent dispatches if enrollments haven't changed
                this.rxjsService.distinctArrayUntilChanged((previous, current) => {
                    const previousEnrollment = previous.enrollment;
                    const currentEnrollment = current.enrollment;

                    return previousEnrollment.id === currentEnrollment?.id;
                }),
                withLatestFrom(this.mpGroup$, this.memberId$),
                tap(([enrollmentRidersDatas, mpGroup, memberId]) => {
                    enrollmentRidersDatas.forEach(({ enrollmentRidersData, enrollment }) => {
                        // Avoid making redundent api calls if data is still IDLE
                        if (enrollmentRidersData.status !== AsyncStatus.IDLE) {
                            return;
                        }

                        // Dispatch for any EnrollmentRiders that are still IDLE
                        this.ngrxStore.dispatch(
                            EnrollmentsActions.loadEnrollmentRiders({
                                mpGroup,
                                memberId,
                                enrollmentId: enrollment.id,
                            }),
                        );
                    });
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        // NOTE: Dependent Age doesn't required to get Riders pricing
        // Select the PlanOfferingPricings AsyncData for each PlanOffering
        const riderPlanOfferingPricingsDatas$: Observable<PlanOfferingPricingsActionProperties[]> = combineLatest([
            // Riders from api response
            this.selectedRiders$,
            // RiderStates that maintain state of Riders in their dropdowns
            // Collect the current selected benefitAmount for each RiderState and check BASE PlanOffering if it has a selected BenefitAmount
            // Get the state of any baseBenefitAmount changes
            this.riderStatesWithBenefitAmount$,
            // Get the latest state abbreviation based on enrollment-settings location dropdown
            this.selectedStateAbbreviation$,
            this.selectedTobaccoInformation$,
            combineLatest([
                // Get the latest riskClassId based on dropdown and selected productId
                this.riskClassId$,
                // Get the latest coverageEfectiveDate based on dropdown and selected productId
                this.coverageEffectiveDate$,
                // Get the latest benefit amount
                this.selectedBenefitAmount$,
                this.shoppingCartItemId$,
                this.mandatoryRiderPlanIds$,
            ]),
        ]).pipe(
            withLatestFrom(this.mpGroup$, this.memberId$, this.selectedPlanId$, this.enrolledBasePlanRiders$.pipe(startWith([]))),
            map(
                ([
                    [
                        riders,
                        riderStatesWithBenefitAmount,
                        stateAbbreviation,
                        selectedTobaccoInformation,
                        [riskClassId, coverageEffectiveDate, selectedBenefitAmount, shoppingCartItemId, mandatoryRiderPlanIds],
                    ],
                    mpGroup,
                    memberId,
                    selectedPlanId,
                    enrolledRiders,
                ]) => {
                    // First set of api calls shouldn't include extra params like baseBenefitAmount
                    // These api calls are used to populate benefit amounts mat-selects for riders dropdown only
                    const staticRiderPricingDatas = riders.map((rider) =>
                        this.getPlanOfferingPricingData({
                            mpGroup,
                            memberId,
                            stateAbbreviation,
                            planOfferingId: rider.id,
                            includeFee: mandatoryRiderPlanIds.includes(rider.plan.id),
                            riskClassId,
                            coverageEffectiveDate,
                            parentPlanId: rider.parentPlanId,
                            parentPlanCoverageLevelId: selectedPlanId === rider.parentPlanId ? rider.parentPlanCoverageLevelId : null,
                            // Get baseBenefitAmount checking possible BASE PlanOffering PlanOffering (and not RIDER PlanOffering)
                            // If selected planId not belongs to parentPlanId of rider then will look for enrolled riders baseBenefitAmount
                            baseBenefitAmount:
                                selectedPlanId === rider.parentPlanId
                                    ? selectedBenefitAmount?.benefitAmount
                                    : this.getBaseBenefitAmountForEnrolledRider(enrolledRiders, rider),
                            memberIsTobaccoUser: selectedTobaccoInformation.memberIsTobaccoUser,
                            spouseIsTobaccoUser: selectedTobaccoInformation.spouseIsTobaccoUser,
                            shoppingCartItemId,
                        }),
                    );

                    // Second set of api calls should include any extra params needed to populate pricing table
                    // These api calls will depend on the overall state of Riders and their dependencies changing selected values
                    const dynamicRiderPricingDatas = riderStatesWithBenefitAmount.map((riderStateWithBenefitAmount) => {
                        // Get baseBenefitAmount checking possible BASE PlanOffering and RIDER PlanOffering
                        const { baseBenefitAmount, riderState } = riderStateWithBenefitAmount;

                        const parentPlanCoverageLevelId =
                            selectedPlanId === riderState.riderParentPlanId ? riderState.parentPlanCoverageLevelId : null;

                        return this.getPlanOfferingPricingData({
                            mpGroup,
                            memberId,
                            stateAbbreviation,
                            planOfferingId: riderState.riderPlanOfferingId,
                            includeFee: mandatoryRiderPlanIds.includes(riderState.riderPlanId),
                            riskClassId,
                            coverageEffectiveDate,
                            parentPlanId: riderState.riderParentPlanId,
                            parentPlanCoverageLevelId,
                            baseBenefitAmount,
                            memberIsTobaccoUser: selectedTobaccoInformation.memberIsTobaccoUser,
                            spouseIsTobaccoUser: selectedTobaccoInformation.spouseIsTobaccoUser,
                            shoppingCartItemId,
                        });
                    });

                    return [...staticRiderPricingDatas, ...dynamicRiderPricingDatas];
                },
            ),
        );

        // Dispatch ngrx action for PlanOfferingPricings if no api call has been made for previous call failed
        riderPlanOfferingPricingsDatas$
            .pipe(
                tap((values) => {
                    values.forEach(({ selector, identifiers }) => {
                        // Avoid dispatching action when api call would be redundent since AsyncStatus is still IDLE
                        this.ngrxStore.dispatchIfIdle(PlanOfferingsActions.loadPlanOfferingPricings(identifiers), selector);
                    });
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        combineLatest([this.selectedPlanOffering$, this.mpGroup$])
            .pipe(
                filter(([selectedPlanOffering]) => {
                    if (!selectedPlanOffering) {
                        return false;
                    }

                    const productId = selectedPlanOffering.plan?.product?.id;
                    const characteristics = selectedPlanOffering.plan?.characteristics ?? [];

                    // carrier id should be among Wageworks
                    return (
                        selectedPlanOffering?.plan.carrierId === CarrierId.WAGEWORKS ||
                        // product id should be among HSA or FSA
                        EnrollmentEnums.productIds.HSA.includes(productId) ||
                        (EnrollmentEnums.productIds.FSA.includes(productId) &&
                            // Shouldn't be auto enrollable
                            !characteristics.includes(Characteristics.AUTOENROLLABLE))
                    );
                }),
                map(([selectedPlanOffering, mpGroup]) => {
                    this.ngrxStore.dispatch(
                        ProductOfferingsActions.loadContributionLimit({
                            mpGroup,
                            productId: selectedPlanOffering.plan.product.id,
                        }),
                    );
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();
    }

    /**
     * Sets selected plan data to store on selection
     * @param planOfferingWithCartAndEnrollment {PlanOfferingWithCartAndEnrollment} plan offering with coverage date
     */
    onPlanSelection(planOfferingWithCartAndEnrollment: PlanOfferingWithCartAndEnrollment): void {
        this.producerShopHelperService.setSelectedPlanDataToStore(planOfferingWithCartAndEnrollment);
    }

    /**
     * Check if all plans are of either auto enrolled or redirect plans
     * @param combinedOffering {CombinedOfferingWithCartAndEnrollment} combined offerings with cart and enrollment data
     * @returns boolean as true if all plans are either auto enrolled or redirect plans
     */
    isAllAutoEnrolledOrRedirectPlans(combinedOffering: CombinedOfferingWithCartAndEnrollment): boolean {
        return combinedOffering?.planOfferingsWithCartAndEnrollment.every(
            (planOfferingWithCartAndEnrollment) =>
                planOfferingWithCartAndEnrollment.planOffering.plan.characteristics.includes(Characteristics.AUTOENROLLABLE) ||
                planOfferingWithCartAndEnrollment.planOffering.type === PlanType.REDIRECT,
        );
    }

    /**
     *
     * @param enrolledRiders enrolled riders info for existing coverage
     * @param rider selected rider
     * @returns base benefit amount of enrolled rider with same policy series and parent plan id
     */
    getBaseBenefitAmountForEnrolledRider(enrolledRiders: EnrollmentRider[], rider: PlanOffering): number | null {
        return (
            enrolledRiders?.find(
                (enrolledRider) =>
                    enrolledRider?.plan.id === rider?.parentPlanId && enrolledRider?.plan.policySeries === rider?.plan.policySeries,
            )?.benefitAmount ?? null
        );
    }
    /**
     * Get a Record of translations using LanguageService
     * @returns {Record<string, string>} Record of translations
     */
    getLanguageStrings(): Record<string, string> {
        return this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.quoteShop.plansDisplay.salaryMissing",
            "primary.portal.shopQuote.peo.product.notAvailable",
            "primary.portal.quoteShop.plansDisplay.productPlanData",
            "primary.portal.shopQuote.productStatusInfo",
            "primary.portal.quoteShop.declineCoverage",
            "primary.portal.shoppingCart.planOfferings.inCart",
            "primary.portal.quoteShop.dependency.override",
            "primary.portal.quoteShopMpp.plansDisplay.purchaseAdditionalUnits",
            "primary.portal.quoteShopMpp.plansDisplay.purchaseBuyUps",
            "primary.portal.producerShopPage.toolTipText.anotherUserIsUpdatingCart",
        ]);
    }

    /**
     * Navigates to Work tab of member profile
     */
    navigateToProfileWorkTab(): void {
        this.route.navigate(["../../../../../memberadd"], {
            relativeTo: this.router,
            queryParams: { tabId: 1 },
        });
    }

    /**
     * Navigates to member profile
     */
    navigateToMemberProfile(): void {
        this.route.navigate(["../../../../../memberadd"], {
            relativeTo: this.router,
        });
    }

    /**
     * Dispatch declineProductOffering action to decline selected product.
     * Dispatch loadEnrollment action to get latest enrollment.
     * @param mpGroup mpGroup
     * @param memberId selected member Id
     * @param enrollmentMethod selected enrollment method
     * @param selectedProductOfferingId selected productOffering Id
     */
    declineCoverage([mpGroup, memberId, enrollmentMethod, selectedProductOfferingId]: [number, number, EnrollmentMethod, number]): void {
        this.ngrxStore.dispatch(
            ProductOfferingsActions.declineProductOffering({
                productOfferingId: selectedProductOfferingId,
                memberId: memberId,
                enrollmentMethod: enrollmentMethod,
                mpGroup: mpGroup,
            }),
        );
    }

    /**
     * If cartItemInfo is not present then default plan price will be the price at 0 index
     * If cartItemInfo is present then we have to compare coverage level id's,
     * benefit amount if present, risk class id if present to get the default price on load
     * @param planPrices plan offering prices
     * @param planOfferingData plan offering with cart and enrollment data
     * @returns default plan offering pricing to be loaded
     */
    getDefaultPrice(planPrices: PlanOfferingPricing[], planOfferingData: PlanOfferingWithCartAndEnrollment): PlanOfferingPricing {
        return planOfferingData?.cartItemInfo
            ? planPrices.find(
                (planOfferingPricing) =>
                    planOfferingPricing.coverageLevelId === planOfferingData.cartItemInfo.coverageLevelId &&
                      (!planOfferingPricing.benefitAmount ||
                          planOfferingPricing.benefitAmount === planOfferingData.cartItemInfo.benefitAmount) &&
                      (planOfferingData.planOffering.plan.carrierId !== CarrierId.AFLAC ||
                          !planOfferingPricing.carrierRiskClassId ||
                          planOfferingPricing.carrierRiskClassId === planOfferingData.cartItemInfo.riskClassOverrideId),
            )
            : planPrices[0];
    }

    /**
     * Get identifiers to dispatch PlanOffering Action and use selectors.
     * Used to avoid redundent api calls by checking AsyncData if it has AsyncStatus.IDLE
     *
     * @param riderPricingIdentifiers {PlanOfferingPricingsIdentifiers} Identifiers to dispatch NGRX PlanOffering Pricing Action
     * @returns {PlanOfferingPricingsActionProperties} NGRX PlanOffering Pricing Action identifiers and related selector
     */
    getPlanOfferingPricingData(riderPricingIdentifiers: PlanOfferingPricingsIdentifiers): PlanOfferingPricingsActionProperties {
        return {
            identifiers: riderPricingIdentifiers,
            selector: PlanOfferingsSelectors.getPlanOfferingPricings(
                riderPricingIdentifiers.includeFee,
                riderPricingIdentifiers.memberIsTobaccoUser,
                riderPricingIdentifiers.spouseIsTobaccoUser,
                riderPricingIdentifiers.planOfferingId,
                riderPricingIdentifiers.riskClassId,
                riderPricingIdentifiers.coverageEffectiveDate,
                riderPricingIdentifiers.parentPlanId,
                riderPricingIdentifiers.baseBenefitAmount,
                riderPricingIdentifiers.parentPlanCoverageLevelId,
                riderPricingIdentifiers.shoppingCartItemId,
            ),
        };
    }

    getBeneiftAmounts(planPanel: PlanOfferingWithCartAndEnrollment): Observable<number[]> {
        const panelIdentifiers = this.planPanelService.getPanelIdentifiers(planPanel);
        const shoppingCartItemId = planPanel.cartItemInfo?.id;

        return combineLatest([
            // Get the latest riskClassId based on dropdown and selected productId
            this.riskClassId$,
            // Get the latest coverageEfectiveDate based on dropdown and selected productId
            this.coverageEffectiveDate$,
            this.producerShopComponentStoreService
                .getEliminationPeriodState(panelIdentifiers)
                .pipe(map((state) => state.eliminationPeriod)),
            this.selectedTobaccoInformation$,
        ]).pipe(
            switchMap(([riskClassId, coverageEffectiveDate, eliminationPeriod, selectedTobaccoInformation]) =>
                this.ngrxStore.onAsyncValue(
                    select(
                        PlanOfferingsSelectors.getBenefitAmounts(
                            selectedTobaccoInformation,
                            planPanel.planOffering.id,
                            riskClassId,
                            coverageEffectiveDate,
                            eliminationPeriod?.id,
                            shoppingCartItemId,
                        ),
                    ),
                ),
            ),
        );
    }

    /**
     * Used to track the current item opened in plans loop
     * @param index index of the loop
     * @param item current item
     * @returns string with combination of planOfferingId , cartItem Id and enrollment to track the changes
     */
    trackByPanelIdentifiers(index: number, item: PlanOfferingWithCartAndEnrollment): string {
        return item.planOffering.id.toString() + item.cartItemInfo?.id.toString() + item.enrollment?.id.toString();
    }

    /**
     * Clean up rxjs subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscriber$.next();
        this.unsubscriber$.complete();
    }
}
