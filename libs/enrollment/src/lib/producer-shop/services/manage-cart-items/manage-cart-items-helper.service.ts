import {
    BenefitAmountState,
    CoverageLevelState,
    DependentAgeState,
    EliminationPeriodState,
    KnockoutDialogResponse,
    PanelIdentifiers,
    PlanKnockoutEligibility,
    ProductCoverageDate,
} from "../producer-shop-component-store/producer-shop-component-store.model";
import { Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { InputType, KnockoutQuestion, ApplicationResponseBaseType } from "@empowered/api";
import {
    AnsweredData,
    InEligibleAnswerData,
    KnockoutQuestionsAndInelgibleAnswers,
    PlanOfferingOptions,
    ReplaceDialogResponse,
} from "./manage-cart-items-helper.model";

import {
    AddToCartItem,
    CarrierId,
    CombinedOfferingWithCartAndEnrollment,
    CoverageDatesEnrollmentType,
    CoverageLevelId,
    EnrollmentMethod,
    PlanOfferingCostInfo,
    PlanOfferingWithCartAndEnrollment,
    TobaccoInformation,
    UpdateCartItem,
    KnockoutType,
    Option,
    RiderCart,
    GetCartItems,
    ProducerCredential,
    ApplicationResponse,
    AgAppResponse,
    MemberProfile,
    DependencyTypes,
    ContraintsType,
} from "@empowered/constants";
import { AccountsSelectors } from "@empowered/ngrx-store/ngrx-states/accounts";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { AuthSelectors } from "@empowered/ngrx-store/ngrx-states/auth";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { PlanOfferingsActions, PlanOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { SharedSelectors } from "@empowered/ngrx-store/ngrx-states/shared";
import { ShoppingCartsActions, ShoppingCartsSelectors } from "@empowered/ngrx-store/ngrx-states/shopping-carts";
import { EmpoweredModalService } from "@empowered/common-services";
import { select } from "@ngrx/store";
import { combineLatest, EMPTY, Observable, of } from "rxjs";
import { filter, map, switchMap, take, tap, withLatestFrom } from "rxjs/operators";
// eslint-disable-next-line max-len
import { KnockoutQuestionsDialogComponent } from "../../../knockout-questions/knockout-questions-dialog/knockout-questions-dialog.component";
import { NotEligibleDialogComponent } from "../../../knockout-questions/not-eligible-dialog/not-eligible-dialog.component";
import { ReplacePlanDialogComponent } from "../../../replace-plan-dialog/replace-plan-dialog.component";
import { AnsweredKnockoutQuestion } from "../producer-shop-component-store/producer-shop-component-store.model";
import { ProducerShopComponentStoreService } from "../producer-shop-component-store/producer-shop-component-store.service";
import { Dictionary } from "@ngrx/entity";
import { KnockoutDialogData } from "../../../knockout-questions/knockout-questions-dialog/knockout-questions-dialog.model";
import { EnrollmentsSelectors } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { RiderComponentStoreService } from "../rider-component-store/rider-component-store.service";
import { RiderStateWithPlanPricings } from "../rider-component-store/rider-component-store.model";
import { ProductId } from "@empowered/ngrx-store/services/plan-offering-helper/plan-offering-helper.constants";
import { PlanPanelService } from "../plan-panel/plan-panel.service";
import { ROUND } from "../../plans-container/bucket-plan/bucket-plan.model";
import { ActiveEnrollment, DualPlanYearService } from "@empowered/ngxs-store";

@Injectable()
export class ManageCartItemsHelperService {
    private readonly coverageEffectiveDate$ = this.producerShopComponentStoreService
        .getSelectedProductCoverageDateOnAsyncValue()
        // TODO [Coverage Dates]: coverageDate?.date isn't optional on its interface, so it shouldn't need optional chaining.
        // Please update this logic or the interface or report to java team
        .pipe(map((coverageDate) => coverageDate?.date));

    // The selected RiskClass Id for the selected Product
    // Note that this isn't always the selected RiskClass in the Enrollment Settings
    // We don't want to pass that RiskClass if carrierId is AFLAC (pass null) or
    // if productId is SHORT_TERM_DISABILITY (pass the second RiskClass if there's two)
    private readonly riskClassId$ = this.producerShopComponentStoreService
        .getSelectedProductRiskClassOnAsyncValue()
        .pipe(map((riskClass) => riskClass?.id));

    // Gets qualifying event id
    private readonly qualifyingEvent$ = this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getQualifyingEventId));

    // Gets selected CountryState and city details
    private readonly selectedCountryStateAndCity$ = this.ngrxStore.onAsyncValue(
        select(MembersSelectors.getSelectedMemberEnrollmentCountryStateAndCity),
    );

    private readonly coverageLevels$ = this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getSelectedCoverageLevels));

    // Gets selected CountryState
    private readonly selectedCountryState$ = this.selectedCountryStateAndCity$.pipe(map(({ countryState }) => countryState));

    // Gets selected enrollment method
    private readonly selectedEnrollmentMethod$ = this.ngrxStore.pipe(select(SharedSelectors.getSelectedEnrollmentMethod));
    // Gets group admin ID
    private readonly assistingAdminId$ = this.ngrxStore
        .pipe(select(AuthSelectors.selectUserCredential))
        .pipe(map((resp) => (resp.value ? resp.value.adminId || (resp.value as ProducerCredential).producerId : null)));

    // Gets selected coverage dates
    private readonly selectedCoverageDates$ = this.producerShopComponentStoreService.selectProductCoverageDatesOnAsyncValue();

    // Get MpGroup ID
    readonly mpGroup$ = this.ngrxStore.pipe(select(AccountsSelectors.getSelectedMPGroup));

    // Get member ID
    readonly memberId$ = this.ngrxStore.pipe(select(MembersSelectors.getSelectedMemberId));

    // Gets selected Plan Offering With CoverageDates
    readonly selectedPlanOfferingWithCartAndEnrollment$ = this.ngrxStore.onAsyncValue(
        select(PlanOfferingsSelectors.getSelectedPlanOfferingData),
    );

    // Get selected product offerings
    readonly productCombinedOfferingWithCartAndEnrollment$ = this.ngrxStore.onAsyncValue(
        select(PlanOfferingsSelectors.getSelectedProductCombinedOfferingWithCartAndEnrollment),
    );

    private readonly knockoutDialogResponse$ = this.producerShopComponentStoreService.selectKnockoutDialogResponse();

    private readonly answeredKnockoutQuestions$ = this.producerShopComponentStoreService.selectAnsweredKnockoutQuestions();

    // Gets plan eligibility based on knockout data
    readonly knockoutPlanEligibility$ = this.producerShopComponentStoreService.selectPlanKnockoutEligibility();

    private readonly existingCartItems$ = this.ngrxStore.onAsyncValue(select(ShoppingCartsSelectors.getCartItemsSet));

    // Triggered after cart item is updated
    private readonly cartItemUpdated$ = this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getUpdatedCartItem));

    // Triggered after cart item is added
    private readonly cartItemAdded$ = this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getAddedCartItem));

    // Gets enrollments
    private readonly enrollments$ = this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.getSelectedEnrollments));

    // Gets enrollment Types to be passed for coverage dates
    private readonly coverageDatesEnrollmentType$ = this.ngrxStore.pipe(
        select(PlanOfferingsSelectors.getSelectedCoverageDatesEnrollmentType),
    );

    readonly payFrequency$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedMemberPayFrequency));

    // Gets member info
    private readonly memberInfo$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedMemberProfile));

    private selectedDependentAge$: Observable<DependentAgeState>;
    // Get Tobacco status of member and spouse
    private readonly selectedTobaccoInformation$ = this.producerShopComponentStoreService.selectTobaccoInformationOnAsyncValue();
    // Get combined offerings with coverage dates record
    private readonly combinedOfferings$ = this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getSelectedCombinedOfferings));

    constructor(
        private readonly ngrxStore: NGRXStore,
        private readonly producerShopComponentStoreService: ProducerShopComponentStoreService,
        private readonly dialog: MatDialog,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly dualPlanYearService: DualPlanYearService,
        private readonly riderComponentStoreService: RiderComponentStoreService,
        private readonly planPanelService: PlanPanelService,
    ) {}

    /**
     * Method to gets the plan pricing, coverage , benefit amount details of selected plan panel
     * @param planPanel selected plan panel data with cart and enrollment
     * @returns Observable<PlanOfferingCostInfo>
     */
    getSelectedPlanCost(planPanel: PlanOfferingWithCartAndEnrollment): Observable<PlanOfferingCostInfo> {
        const panelIdentifiers = this.planPanelService.getPanelIdentifiers(planPanel);
        const shoppingCartItemId = planPanel.cartItemInfo?.id;

        return combineLatest([
            // Get the latest riskClassId based on dropdown and selected productId
            this.riskClassId$,
            // Get the latest coverageEfectiveDate based on dropdown and selected productId
            this.coverageEffectiveDate$,
            // Get benefitAmount for planOffering plan
            this.producerShopComponentStoreService.getBenefitAmountState(panelIdentifiers),
            // Get eliminationPeriod for planOffering plan
            this.producerShopComponentStoreService.getEliminationPeriodState(panelIdentifiers),
            this.producerShopComponentStoreService.getCoverageLevelState(panelIdentifiers),
            // Get Tobacco status based on dropdown
            this.selectedTobaccoInformation$,
            // Get dependentAge based on dropdown for planOffering plan (Juvenile Plans)
            this.producerShopComponentStoreService.getDependentAgeState(panelIdentifiers),
        ]).pipe(
            switchMap(
                ([
                    riskClassId,
                    coverageEffectiveDate,
                    benefitAmountState,
                    eliminationPeriodState,
                    coverageLevels,
                    tobaccoInformation,
                    dependentAgeState,
                ]: [
                    number,
                    string,
                    BenefitAmountState,
                    EliminationPeriodState,
                    CoverageLevelState,
                    TobaccoInformation,
                    DependentAgeState,
                ]) =>
                    this.ngrxStore.onAsyncValue(
                        select(
                            PlanOfferingsSelectors.getSelectedPlanCostDetails(
                                riskClassId,
                                coverageEffectiveDate,
                                coverageLevels?.coverageLevel?.id,
                                benefitAmountState?.benefitAmount,
                                eliminationPeriodState?.eliminationPeriod?.id,
                                tobaccoInformation,
                                dependentAgeState.dependentAge,
                                shoppingCartItemId,
                            ),
                        ),
                    ),
            ),
        );
    }

    /**
     * Gets the RiderCarts needed to set/update cart
     *
     * @param existingRiderCarts {RiderCart[]} The previous RiderCarts from cart items api response
     * @param selectedPlanCost {PlanOfferingCostInfo} General plan cost information
     * @param riderStatesWithPricing {RiderStateWithPlanPricings[]} RiderStates and their cost information
     * @param baseCartItemId {number} base cart item id, to check if its update or add cart item
     * @returns RiderCarts for setting or updating cart
     */
    getRiderCarts(
        existingRiderCarts: RiderCart[],
        selectedPlanCost: PlanOfferingCostInfo,
        riderStatesWithPricing: RiderStateWithPlanPricings[],
        baseCartItemId?: number,
    ): RiderCart[] {
        // Skip passing the rider which has dependency type of broker plan selection
        // With mandatory disabled and unchecked
        riderStatesWithPricing = riderStatesWithPricing.filter(
            (riderStateWithPricing) =>
                !(
                    riderStateWithPricing.riderState.enrollmentRequirements?.find(
                        (enrollmentRequirement) => enrollmentRequirement.dependencyType === DependencyTypes.REQUIRES_BROKERS_PLAN_SELECTION,
                    ) &&
                    !riderStateWithPricing.riderState.checked &&
                    riderStateWithPricing.riderState.disabled
                ),
        );
        // Based on which RiderStates are checked or unchecked, create RiderCarts
        // unchecked riders must be passed with coverage level id 2 to get the cart item id
        const allRiderCarts: RiderCart[] = riderStatesWithPricing.map((riderData) => {
            const { riderState, pricingDatas } = riderData;

            const riderPricingData = pricingDatas.find(
                (pricingData) => pricingData.baseCoverageLevel.id === selectedPlanCost.planOfferingPricingCoverage?.coverageLevel.id,
            );

            const riderPlanOfferingPricing = riderState.checked ? riderPricingData?.riderPlanOfferingPricing : null;

            const existingCartRider = existingRiderCarts.find((riderCart) => riderCart.planOfferingId === riderState.riderPlanOfferingId);

            return {
                cartItemId: existingCartRider?.cartItemId,
                planOfferingId: riderState.riderPlanOfferingId,
                benefitAmount: riderPlanOfferingPricing?.benefitAmount,
                coverageLevelId: riderPlanOfferingPricing?.coverageLevelId || CoverageLevelId.DECLINED,
                memberCost: riderPlanOfferingPricing?.memberCost || 0,
                totalCost: riderPlanOfferingPricing?.totalCost || 0,
                baseRiderId: riderState.riderParentPlanId ?? null,
            };
        });

        // If base cart item id is present then its update cart item flow. For update all rider carts should have cart item id.
        // This is added to sync the logic with develop, as we have to ignore some riders in first stackable plan cart if its update
        if (baseCartItemId) {
            return allRiderCarts.filter((riderCart) => riderCart.cartItemId);
        }

        return allRiderCarts;
    }

    /**
     * Create the cart instance used to set or update cart items
     * @param selectedPlanDetails selected plan details with cart and enrollment
     * @returns {AddToCartItem | UpdateCartItem} instance used to set or update cart items
     */
    getCartObject(selectedPlanDetails: PlanOfferingWithCartAndEnrollment): Observable<AddToCartItem | UpdateCartItem> {
        const planOfferingId = selectedPlanDetails.planOffering.id;
        const panelIdentifiers = this.planPanelService.getPanelIdentifiers(selectedPlanDetails);
        this.selectedDependentAge$ = this.producerShopComponentStoreService.getDependentAgeState(panelIdentifiers);
        return combineLatest([
            this.getSelectedPlanCost(selectedPlanDetails),
            this.assistingAdminId$,
            this.riskClassId$,
            this.selectedCountryStateAndCity$,
            // NOTE: To bypass the six arguments limitation for combineLatest
            // We are combining two combineLatest
            // This is not necessary for the latest version of RXJS 7
            combineLatest([
                this.selectedCoverageDates$,
                this.selectedEnrollmentMethod$,
                this.riderComponentStoreService.getRiderStatesWithPlanPricings(panelIdentifiers),
                this.existingCartItems$,
                this.selectedDependentAge$,
                this.combinedOfferings$,
            ]),
        ]).pipe(
            take(1),
            map(
                ([
                    selectedPlanCost,
                    assistingAdminId,
                    selectedRiskClass,
                    selectedStateAndCity,
                    [
                        selectedCoverageDates,
                        selectedEnrollmentMethod,
                        riderStatesWithPricing,
                        existingCartItems,
                        dependentAgeState,
                        combinedOfferings,
                    ],
                ]) => {
                    let coverageEffectiveDate = selectedCoverageDates.find(
                        (coverageDate) => coverageDate.productId === selectedPlanDetails.planOffering.plan.product.id,
                    )?.date;
                    // If carrier id belongs to VSP, then assign coverageEffectiveDate with defaultCoverageStartDate
                    // of VSP individual plan instead of assigning date of plan at product level
                    if (selectedPlanDetails.planOffering.plan?.carrierId === CarrierId.VSP_INDIVIDUAL_VISION) {
                        coverageEffectiveDate = combinedOfferings
                            .find(
                                // get the combined offering with selected product id i.e. VSP
                                (combinedOffering) =>
                                    combinedOffering.productOffering?.product?.id === selectedPlanDetails.planOffering.plan.product.id,
                            )
                            ?.planOfferingsWithCoverageDates.find(
                                // get the plan offering object with selected plan offering id to get the mapped default coverage date
                                (planOfferingsWithCoverageDate) =>
                                    planOfferingsWithCoverageDate.planOffering.id === selectedPlanDetails.planOffering.id,
                            )?.defaultCoverageStartDate;
                    }
                    const existingRiderCarts =
                        existingCartItems.find((cartItem) => cartItem.id === selectedPlanDetails.cartItemInfo?.id)?.riders ?? [];

                    const addCartObject: AddToCartItem | UpdateCartItem = {
                        assistingAdminId,
                        benefitAmount: selectedPlanCost.selectedBenefitAmount,
                        coverageEffectiveDate,
                        coverageLevelId: selectedPlanCost.planOfferingPricingCoverage.coverageLevel.id,
                        enrollmentCity: selectedStateAndCity.city,
                        enrollmentId: selectedPlanDetails.enrollment?.id,
                        enrollmentMethod: selectedEnrollmentMethod,
                        enrollmentState: selectedStateAndCity.countryState.abbreviation,
                        memberCost: selectedPlanCost.planOfferingPricingCoverage.planOfferingPricing.memberCost,
                        planOfferingId,
                        productOfferingId: selectedPlanDetails.planOffering.productOfferingId,
                        riders: this.getRiderCarts(
                            existingRiderCarts,
                            selectedPlanCost,
                            riderStatesWithPricing,
                            selectedPlanDetails.cartItemInfo?.id,
                        ),
                        riskClassOverrideId: selectedRiskClass,
                        subscriberQualifyingEventId: selectedPlanCost.subscriberQualifyingEventId,
                        totalCost: selectedPlanCost.planOfferingPricingCoverage.planOfferingPricing.totalCost,
                        ...(selectedPlanDetails.cartItemInfo && {
                            cartItemId: selectedPlanDetails.cartItemInfo?.id,
                        }),
                        // dependent age must be included in cart for juvenile plans only
                        ...((selectedPlanDetails.planOffering.plan.product.id === ProductId.JUVENILE_TERM_LIFE ||
                            selectedPlanDetails.planOffering.plan.product.id === ProductId.JUVENILE_WHOLE_LIFE) && {
                            dependentAge: dependentAgeState.dependentAge,
                        }),
                    };

                    return addCartObject;
                },
            ),
        );
    }

    /**
     * gets updateCartItem array to be update for auto enrolled plans
     * @param planList list of auto enrolled plan offerings with coverage dates
     * @returns observable of updateCartItem array
     */
    updateAutoEnrolledCartData(planOfferingsWithCartAndEnrollment: PlanOfferingWithCartAndEnrollment[]): Observable<UpdateCartItem[]> {
        return combineLatest([
            this.assistingAdminId$,
            this.selectedCountryState$,
            this.selectedEnrollmentMethod$,
            this.qualifyingEvent$,
        ]).pipe(
            take(1),
            map(([assistingAdminId, enrollmentState, enrollmentMethod, subscriberQualifyingEventId]) =>
                planOfferingsWithCartAndEnrollment
                    .filter((planOfferingWithCartAndEnrollment) => {
                        const cartItemInfo = planOfferingWithCartAndEnrollment.cartItemInfo;

                        // Avoid updating any PlanOffering's CartItem state if it doesn't have CartItem anyway
                        if (!cartItemInfo) {
                            return false;
                        }

                        return this.isAutoEnrolledUpdateNeeded(cartItemInfo, enrollmentMethod, enrollmentState.abbreviation);
                    })
                    .map((planData) => {
                        const updateCartObject: UpdateCartItem = {
                            ...planData.cartItemInfo,
                            planOfferingId: planData.cartItemInfo.planOffering?.id,
                            acknowledged: true,
                            assistingAdminId,
                            enrollmentMethod,
                            cartItemId: planData.cartItemInfo.id,
                            subscriberQualifyingEventId,
                            enrollmentState: enrollmentState.abbreviation,
                        };
                        return updateCartObject;
                    }),
            ),
        );
    }

    /**
     * Gets cart items with newly updated coverage date
     * @param cartItems list of cart items
     * @param productCoverageDates product coverage dates
     * @returns observable of cartItems with updated coverage date
     */
    getCartItemsWithUpdatedDate(cartItems: GetCartItems[], productCoverageDates: ProductCoverageDate[]): Observable<UpdateCartItem[]> {
        return combineLatest([this.assistingAdminId$, this.selectedEnrollmentMethod$, this.qualifyingEvent$]).pipe(
            take(1),
            map(([assistingAdminId, enrollmentMethod, subscriberQualifyingEventId]) =>
                cartItems
                    .filter((cartItem) => {
                        // Array of all known Aflac CarrierIds
                        const aflacCarrierIds = [CarrierId.AFLAC, CarrierId.AFLAC_GROUP];
                        // Should not consider the cartItems which belongs to non aflac plans
                        if (!aflacCarrierIds.includes(cartItem.planOffering.plan.carrierId)) {
                            return false;
                        }
                        const productCoverageDate = productCoverageDates.find(
                            (productDate) => productDate.productId === cartItem.planOffering.plan.productId,
                        );
                        // Filter only those cart items for which product coverage date is changed
                        return productCoverageDate && productCoverageDate.date !== cartItem.coverageEffectiveDate;
                    })
                    .map((cartItem) => {
                        const productCoverageDate = productCoverageDates.find(
                            (productDate) => productDate.productId === cartItem.planOffering.plan.productId,
                        );
                        const updateCartObject: UpdateCartItem = {
                            ...cartItem,
                            planOfferingId: cartItem.planOffering?.id,
                            assistingAdminId,
                            cartItemId: cartItem.id,
                            enrollmentMethod,
                            subscriberQualifyingEventId,
                            coverageEffectiveDate: productCoverageDate.date,
                        };
                        return updateCartObject;
                    }),
            ),
        );
    }

    /**
     * Indicates if update is needed for this auto enrolled plan
     *
     * @param cartItemInfo {GetCartItems} CartItem assosiated with PlanOffering of auto enrolled Plan
     * @param enrollmentMethod {EnrollmentMethod} enrollment method
     * @param enrollmentState {EnrollmentState} enrollment state
     * @returns boolean indicating if update of auto enrolled plan is needed or not
     */
    isAutoEnrolledUpdateNeeded(cartItemInfo: GetCartItems, enrollmentMethod: EnrollmentMethod, enrollmentState: string): boolean {
        return (
            !cartItemInfo.acknowledged ||
            cartItemInfo.enrollmentMethod !== enrollmentMethod ||
            cartItemInfo.enrollmentState !== enrollmentState
        );
    }

    /**
     * Get the KnockoutQuestions and its Inelgible Answers given the selected PlanOffering
     *
     * @returns Observable<KnockoutQuestionsAndInelgibleAnswers | null>
     */
    getKnockoutQuestionsAndInelgibleAnswers(): Observable<KnockoutQuestionsAndInelgibleAnswers | null> {
        return this.selectedPlanOfferingWithCartAndEnrollment$.pipe(
            switchMap((selectedPlanOfferingWithCartAndEnrollment) => {
                if (!selectedPlanOfferingWithCartAndEnrollment) {
                    return of(null);
                }

                const panelIdentifiers = this.planPanelService.getPanelIdentifiers(selectedPlanOfferingWithCartAndEnrollment);
                return this.producerShopComponentStoreService.getCoverageLevelState(panelIdentifiers).pipe(
                    switchMap((coverageLevelState) =>
                        combineLatest([
                            this.getEligibilityKnockoutQuestions(coverageLevelState?.coverageLevel?.id),
                            this.getAnswersIneligibleData(coverageLevelState?.coverageLevel?.id),
                        ]),
                    ),
                    map(([knockoutQuestions, answersIneligibleData]) => ({
                        knockoutQuestions,
                        answersIneligibleData,
                        selectedPlanOfferingWithCartAndEnrollment,
                    })),
                );
            }),
        );
    }

    /**
     * Observable to implement add to cart logic
     * @param fromSpouseKnockout indicates if addToCart logic is triggered from update spouse responses
     * @returns Observable of AddToCartItem or  UpdateCartItem or number or number
     */
    openKnockoutDialog(fromSpouseKnockout?: boolean): Observable<void | AddToCartItem | UpdateCartItem | [number, number, number]> {
        return combineLatest([
            this.mpGroup$,
            this.memberId$,
            this.getKnockoutQuestionsAndInelgibleAnswers(),
            this.knockoutDialogResponse$,
        ]).pipe(
            take(1),
            switchMap(([mpGroup, memberId, knockoutQuestionsAndInelgibleAnswers, knockoutDialogResponse]) => {
                if (!knockoutQuestionsAndInelgibleAnswers) {
                    return EMPTY;
                }

                const { knockoutQuestions, answersIneligibleData, selectedPlanOfferingWithCartAndEnrollment } =
                    knockoutQuestionsAndInelgibleAnswers;

                if (!answersIneligibleData.isIneligible) {
                    const responses = this.getResponsesFromPreviousAnswers(answersIneligibleData.answeredData);
                    return this.replaceCartCheck(selectedPlanOfferingWithCartAndEnrollment, responses, fromSpouseKnockout);
                }

                const knockoutQuestionDialogData: KnockoutDialogData = {
                    mpGroup,
                    memberId,
                    knockoutQuestions,
                    response: knockoutDialogResponse,
                    // before opening dialog, checks to see if answers have already been answered and
                    // if so, we assume answers are to be edited
                    isEdit: knockoutDialogResponse.some((response) =>
                        knockoutQuestions.find((knockoutQuestion) => knockoutQuestion.question.key === response.key),
                    ),
                    isProducer: true,
                    salaries$: this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedSalaries)),
                };

                return this.dialog
                    .open(KnockoutQuestionsDialogComponent, {
                        width: "750px",
                        data: knockoutQuestionDialogData,
                    })
                    .afterClosed()
                    .pipe(
                        switchMap((knockoutResult) => {
                            const responses: ApplicationResponse[] = knockoutResult.responses;
                            if (knockoutResult.responses?.length) {
                                this.producerShopComponentStoreService.setKnockoutDialogResponse(knockoutResult.responses);
                                const answeredKnockoutQuestions: AnsweredKnockoutQuestion[] = responses.map((response) => ({
                                    id: response.planQuestionId,
                                    answer: response.value[0],
                                    key: response.key,
                                }));

                                this.producerShopComponentStoreService.setAnsweredKnockoutQuestions(answeredKnockoutQuestions);
                                return this.knockoutQuestionsSubmit(responses, fromSpouseKnockout);
                            }
                            return EMPTY;
                        }),
                    );
            }),
        );
    }

    /**
     * Gets responses list to be saved based on answeredDataList
     * @param answeredDataList answered data list
     * @returns application response list
     */
    getResponsesFromPreviousAnswers(answeredDataList: AnsweredData[]): ApplicationResponse[] {
        return answeredDataList.map((answeredData) => {
            // TODO [Knockout Questions]: value type in ApplicationResponse has to be changed(Out of shop-rewrite scope)
            // from string[] | AgAppResponse[] | { [key: string]: string | number }[]
            // to (string | AgAppResponse | { [key: string]: string | number })[]
            // Using type assertion for now
            const value = [answeredData.answer] as
                | [string]
                | [AgAppResponse]
                | [
                      {
                          [key: string]: string | number;
                      },
                  ];

            return {
                stepId: answeredData.knockoutQuestion.id,
                value,
                key: answeredData.knockoutQuestion.question.key,
                type: ContraintsType.QUESTION,
                planQuestionId: answeredData.knockoutQuestion.question.id,
            };
        });
    }

    /**
     * @function isKnockoutTypeValid
     * @description Function uses KnockoutType, a property of Options of Questions,
     * to help determine eligibility or ineligibility for an offer
     * @param {KnockoutType} knockoutType from Options within Question
     * @returns {boolean} boolean indicating if knockoutType(s) is/are valid
     */
    isKnockoutTypeValid(knockoutType: KnockoutType): boolean {
        return knockoutType === KnockoutType.KNOCKOUT || knockoutType === KnockoutType.SPOUSE_KNOCKOUT;
    }

    /**
     * Observable to check on knockoutQuestionsSubmit and opens Not eligible dialog or adds items to cart
     * @param responses response list
     * @param fromSpouseKnockout indicates if addToCart logic is triggered from update spouse responses
     * @returns Observable AddToCartItem or  UpdateCartItem or number or number to be used in add cart logic implementation
     */
    knockoutQuestionsSubmit(
        responses: ApplicationResponse[],
        fromSpouseKnockout: boolean,
    ): Observable<void | AddToCartItem | UpdateCartItem | [number, number, number]> {
        return combineLatest([this.getKnockoutQuestionsAndInelgibleAnswers(), this.knockoutDialogResponse$]).pipe(
            take(1),
            switchMap(([knockoutQuestionsAndInelgibleAnswers, knockoutDialogResponses]) => {
                if (!knockoutQuestionsAndInelgibleAnswers) {
                    return EMPTY;
                }

                const { knockoutQuestions, answersIneligibleData, selectedPlanOfferingWithCartAndEnrollment } =
                    knockoutQuestionsAndInelgibleAnswers;

                if (!answersIneligibleData.isIneligible) {
                    return this.replaceCartCheck(selectedPlanOfferingWithCartAndEnrollment, responses, fromSpouseKnockout);
                }

                // Compares responses from dialog to possible knockout question options
                // and returns option if it has a valid knockout type
                const knockoutOption: Option | undefined = knockoutDialogResponses
                    .map((knockoutDialogResponse) => {
                        const possibleKnockoutQuestion = knockoutQuestions.find(
                            (knockoutQuestion) => knockoutQuestion.question.key === knockoutDialogResponse.key,
                        );
                        if (!possibleKnockoutQuestion) {
                            return null;
                        }
                        return this.getKnockoutOption(possibleKnockoutQuestion, knockoutDialogResponse);
                    })
                    .find((option) => !!option);

                // No option answered to trigger knockout dialog or not eligible dialog, so add to cart
                if (!knockoutOption) {
                    return this.replaceCartCheck(selectedPlanOfferingWithCartAndEnrollment, responses, fromSpouseKnockout);
                }

                // Answered option found, trigger not eligible dialog and so NOT added to cart
                return this.dialog
                    .open(NotEligibleDialogComponent, {
                        width: "750px",
                        data: {
                            knockout: {
                                text: knockoutOption.knockoutText,
                                type: knockoutOption.knockoutType,
                            },
                            isProducer: true,
                        },
                    })
                    .afterClosed()
                    .pipe(
                        switchMap((result) => {
                            // if user clicks on edit, open knockout dialog again
                            if (result.action === PlanOfferingOptions.EDIT) {
                                return this.openKnockoutDialog(fromSpouseKnockout);
                            }
                            // if user click on Ok, check for eligibility
                            if (result.action === PlanOfferingOptions.ELIGIBILITY_CHECK) {
                                return this.setKnockoutAsInEligible(
                                    selectedPlanOfferingWithCartAndEnrollment,
                                    knockoutQuestions,
                                    result.knockoutType,
                                );
                            }
                            // if user closes the dialog from "X" button, without clicking on Edit or OK buttons
                            return EMPTY;
                        }),
                    );
            }),
        );
    }

    /**
     * @function getKnockoutOption
     * @description Compares responses from dialog to possible knockout question options and returns option if it has a valid knockout type
     * @param {KnockoutQuestion} knockoutQuestion is a knockout question that, depending on its 'type',
     * may be able to prevent a user from adding to cart.
     * @param {KnockoutDialogResponse} knockoutDialogResponse is a selected response from a set of possible responses
     * to be compared to knockout values.
     * @returns {Option | null} Option that is an object with keys of type and text used to populate a NotEligibleDialog template or null
     */
    getKnockoutOption(knockoutQuestion: KnockoutQuestion, knockoutDialogResponse: KnockoutDialogResponse): Option | null {
        // Finding which option has the same value as the user response
        const matchingValueOption =
            knockoutQuestion.question.options.find((option) => {
                // Checking only first response value in type radio
                if (knockoutQuestion.question.inputType === InputType.RADIO) {
                    return knockoutDialogResponse.value[0] === option.value;
                }
                if (knockoutQuestion.question.inputType === InputType.CHECKBOX) {
                    return knockoutDialogResponse.value.some((responseValue) => responseValue === option.value);
                }
                return false;
            }) ?? null;
        // If no found value or if value is not valid, return null
        if (!matchingValueOption || !this.isKnockoutTypeValid(matchingValueOption.knockoutType)) {
            return null;
        }
        // Returning an assumed valid option
        return matchingValueOption;
    }

    /**
     * Observable build add to cart object
     * @param panelIdentifiers panel identifiers
     * @returns Observable with addToCart object of type AddToCartItem
     */
    addUpdateBucketPlanToCartObject(panelIdentifiers: PanelIdentifiers): Observable<AddToCartItem> {
        return combineLatest([this.selectedEnrollmentMethod$, this.selectedCountryState$]).pipe(
            withLatestFrom(
                this.assistingAdminId$,
                this.qualifyingEvent$,
                this.coverageLevels$,
                this.payFrequency$,
                this.producerShopComponentStoreService.getAnnualContributionState(panelIdentifiers),
            ),
            map(
                ([
                    [enrollmentMethod, enrollmentState],
                    assistingAdminId,
                    subscriberQualifyingEventId,
                    coverageLevel,
                    payFrequency,
                    annualContributionState,
                ]) => {
                    const calculatedCost = Number(
                        (annualContributionState.annualContribution / payFrequency?.payrollsPerYear).toFixed(ROUND.FOUR),
                    );
                    return {
                        planOfferingId: panelIdentifiers.planOfferingId,
                        memberCost: calculatedCost,
                        totalCost: calculatedCost,
                        coverageLevelId: coverageLevel[0]?.id,
                        enrollmentMethod,
                        enrollmentState: enrollmentState.abbreviation,
                        assistingAdminId,
                        subscriberQualifyingEventId,
                    };
                },
            ),
        );
    }

    /**
     * Observable to trigger add/update to cart dispatch action for bucket plans
     * @param panelIdentifiers panel identifiers
     * @returns Observable of void
     */
    addUpdateBucketPlanToCart(panelIdentifiers: PanelIdentifiers, cartItemId: number): Observable<void> {
        return this.addUpdateBucketPlanToCartObject(panelIdentifiers).pipe(
            withLatestFrom(this.mpGroup$, this.memberId$),
            map(([addCartObject, mpGroup, memberId]) => {
                if (!cartItemId) {
                    return this.ngrxStore.dispatch(
                        ShoppingCartsActions.addCartItem({
                            memberId,
                            mpGroup,
                            addCartObject,
                        }),
                    );
                }
                return this.ngrxStore.dispatch(
                    ShoppingCartsActions.updateCartItem({
                        memberId,
                        mpGroup,
                        cartItemId,
                        updateCartObject: { ...addCartObject, cartItemId },
                    }),
                );
            }),
        );
    }

    /**
     * Observable to replace/ add to cart when plan is eligible, based on knockout questions
     * @param selectedPlanData selected planOfferingData with cart and enrollment to be replaced with cartItem
     * @param responses response list
     * @param fromSpouseKnockout indicates if addToCart logic is triggered from update spouse responses
     * @returns Observable with number or number or number to be used in add cart item logic
     */
    replaceCartCheck(
        selectedPlanData: PlanOfferingWithCartAndEnrollment,
        responses: ApplicationResponse[],
        fromSpouseKnockout: boolean,
    ): Observable<[number, number, number]> {
        const panelIdentifiers = this.planPanelService.getPanelIdentifiers(selectedPlanData);
        return combineLatest([
            this.productCombinedOfferingWithCartAndEnrollment$,
            this.memberId$,
            this.mpGroup$,
            this.knockoutPlanEligibility$,
            this.producerShopComponentStoreService
                .getCoverageLevelState(panelIdentifiers)
                .pipe(switchMap((coverageLevelState) => this.getEligibilityKnockoutQuestions(coverageLevelState?.coverageLevel?.id))),
        ]).pipe(
            withLatestFrom(this.enrollments$, this.coverageDatesEnrollmentType$, this.memberInfo$),
            take(1),
            switchMap(
                ([
                    [combinedOfferingWithCartAndEnrollment, memberId, mpGroup, knockoutPlanEligibility, knockoutQuestions],
                    enrollments,
                    enrollmentType,
                    memberInfo,
                ]) => {
                    // As we entered replace check after answering knockout questions correctly, set knockout as eligible
                    this.setKnockoutAsEligible(selectedPlanData, knockoutPlanEligibility, knockoutQuestions);

                    // If its triggered from update spouse knockout response, replace check is not needed
                    if (fromSpouseKnockout) {
                        return of({
                            isReplace: null,
                        });
                    }

                    // Gets default replace dialog response to be sent for next switch map
                    const replaceDialogResponse = this.getDefaultReplaceDialogResponse(selectedPlanData, knockoutPlanEligibility);

                    if (this.planPanelService.planOfferingHasStackablePlan(selectedPlanData)) {
                        // return the default replace dialog response if its stackable, as replace logic will not be applicable
                        return of(replaceDialogResponse);
                    }

                    // Check if find if its cart item replace
                    const isCartItemReplace =
                        // Should have at least one cart item
                        combinedOfferingWithCartAndEnrollment?.planOfferingsWithCartAndEnrollment.some(
                            (planOfferingWithCartAndEnrollment) => planOfferingWithCartAndEnrollment.cartItemInfo,
                        ) &&
                        // and should not have at least one cart item matching with the selected plan id
                        !combinedOfferingWithCartAndEnrollment?.planOfferingsWithCartAndEnrollment.some(
                            (planOfferingWithCartAndEnrollment) =>
                                planOfferingWithCartAndEnrollment.cartItemInfo &&
                                planOfferingWithCartAndEnrollment.planOffering.plan.id === selectedPlanData.planOffering.plan.id,
                        );

                    // If isCartItemReplace is false and enrollmentType is QUALIFYING_LIFE_EVENT
                    // Have to check for enrollment replace condition
                    let enrollmentReplaceData: ActiveEnrollment;
                    if (!isCartItemReplace && enrollmentType === CoverageDatesEnrollmentType.QUALIFYING_LIFE_EVENT) {
                        enrollmentReplaceData = this.dualPlanYearService.checkForActiveEnrollments(
                            selectedPlanData.planOffering,
                            enrollments,
                        );
                    }

                    // Either cart item replace or enrollment replace data with sameProductActiveEnrollment, open the replacement dialog
                    // return the updated replace dialog response from dialog
                    if (isCartItemReplace || enrollmentReplaceData?.sameProductActiveEnrollment) {
                        return this.openReplaceDialog(
                            memberId,
                            mpGroup,
                            replaceDialogResponse,
                            enrollmentReplaceData,
                            combinedOfferingWithCartAndEnrollment,
                            selectedPlanData,
                            memberInfo,
                        );
                    }

                    // return the default replace dialog response if its not cart item replace or enrollment replace
                    return of(replaceDialogResponse);
                },
            ),
            //  even if isReplace is false/true the below switchMap is in scope ,hence filtering for null
            filter((replaceDialogResponse: ReplaceDialogResponse) => replaceDialogResponse.isReplace !== null),
            switchMap((replaceDialogResponse: ReplaceDialogResponse) => {
                // if isReplace is false or isActive enrollment we can directly add
                if (!replaceDialogResponse.isReplace || replaceDialogResponse.isActiveEnrollment) {
                    return this.addUpdateToCartPlan(
                        replaceDialogResponse.selectedPlanOfferingWithCartAndEnrollment,
                        replaceDialogResponse.previousCartItem,
                        responses,
                    );
                }
                // else we have to wait till deletedCartItem is success and then add new cart item
                return this.ngrxStore
                    .onAsyncValue(select(ShoppingCartsSelectors.deletedCartItem))
                    .pipe(
                        switchMap(() =>
                            this.addUpdateToCartPlan(
                                replaceDialogResponse.selectedPlanOfferingWithCartAndEnrollment,
                                replaceDialogResponse.previousCartItem,
                                responses,
                            ),
                        ),
                    );
            }),
        );
    }

    /**
     * Gets default replace dialog response
     * @param selectedPlanData selected plan offering with cart and enrollment data
     * @param knockoutPlanEligibility knockout plan eligibility data
     * @returns ReplaceDialogResponse
     */
    getDefaultReplaceDialogResponse(
        selectedPlanData: PlanOfferingWithCartAndEnrollment,
        knockoutPlanEligibility: Dictionary<PlanKnockoutEligibility>,
    ): ReplaceDialogResponse {
        return {
            // isReplace will be false by default
            isReplace: false,
            // selected plan offering with cart and enrollment data
            selectedPlanOfferingWithCartAndEnrollment: selectedPlanData,
            // If plan is ineligible previously, then the previous cart item from knockout data has to be added
            previousCartItem: this.getPreviousCartItem(knockoutPlanEligibility, selectedPlanData.planOffering.id),
            // isActiveEnrollment will be false by default
            isActiveEnrollment: false,
        };
    }

    /**
     * Opens replace dialog and returns replace dialog response based on conditions
     * @param memberId member id
     * @param mpGroup mpGroup
     * @param replaceDialogResponse default replace dialog response
     * @param enrollmentReplaceData enrollment replace data
     * @param combinedOfferingWithCartAndEnrollment product combined offering data with cart and enrollment
     * @param selectedPlanData selected plan data with cart and enrollment
     * @param memberInfo member info
     * @returns ReplaceDialogResponse based on cart item or enrollment replace
     */
    openReplaceDialog(
        memberId: number,
        mpGroup: number,
        replaceDialogResponse: ReplaceDialogResponse,
        enrollmentReplaceData: ActiveEnrollment,
        combinedOfferingWithCartAndEnrollment: CombinedOfferingWithCartAndEnrollment,
        selectedPlanData: PlanOfferingWithCartAndEnrollment,
        memberInfo: MemberProfile,
    ): Observable<ReplaceDialogResponse> {
        // Gets data from enrollment replace data or sets variables as undefined
        const { sameProductActiveEnrollment, planEdit, replacePlan } = enrollmentReplaceData ?? {};

        // Gets existing inCart plan
        const inCartPlan = combinedOfferingWithCartAndEnrollment.planOfferingsWithCartAndEnrollment.find((plan) => plan.cartItemInfo);

        // Dialog data is different for enrollmentReplace and Cart replace
        // Enrollment replace needs multiple values like plan edit or plan replace etc.
        // Cart item replace needs only plan name
        const dialogData = enrollmentReplaceData
            ? {
                  productName: selectedPlanData.planOffering.plan.product.name,
                  empName: memberInfo.name.firstName,
                  isDualPlanYear: true,
                  planEdit,
                  replacePlan,
              }
            : { planName: inCartPlan.planOffering.plan.name };

        // Opening replace dialog with respective dialog data
        const replacePlanDialogComponent = this.empoweredModalService.openDialog(ReplacePlanDialogComponent, {
            data: dialogData,
        });

        return replacePlanDialogComponent.afterClosed().pipe(
            map((resp) => {
                if (resp?.action === PlanOfferingOptions.REPLACE && !sameProductActiveEnrollment) {
                    // if response is success from replace dialog and not having sameProductActiveEnrollment
                    // delete the exiting car item
                    this.ngrxStore.dispatch(
                        ShoppingCartsActions.deleteCartItem({
                            memberId,
                            mpGroup,
                            cartItemId: inCartPlan.cartItemInfo.id,
                        }),
                    );
                }
                // isReplace is set to boolean is pop returns response  or null when no response
                // null is when user clicks on close icon ,in this case the below switchMap should not run
                // add required data to default replaceDialogResponse
                return {
                    ...replaceDialogResponse,
                    isReplace: resp ? resp.action === PlanOfferingOptions.REPLACE : null,
                    isActiveEnrollment: sameProductActiveEnrollment,
                };
            }),
        );
    }

    /**
     * // Gets previous cart item from knockout data, if plan is not eligible previously
     * @param knockoutPlanEligibility knockout plan eligibility data
     * @param planOfferingId plan offering id
     * @returns previous cart item
     */
    getPreviousCartItem(
        knockoutPlanEligibility: Dictionary<PlanKnockoutEligibility>,
        planOfferingId: number,
    ): AddToCartItem | UpdateCartItem {
        // we have to consider previous cart item if its only KnockoutType.KNOCKOUT
        if (knockoutPlanEligibility[planOfferingId]?.knockoutType === KnockoutType.KNOCKOUT) {
            return knockoutPlanEligibility[planOfferingId]?.cartObject;
        }
        return null;
    }

    /**
     * sets current plan knockout data as ineligible
     * @param planDetails plan details with planOffering, cart and enrollment data
     * @param knockoutQuestions list of knockout questions
     * @param knockoutType knockout type
     * @returns AddToCartItem | UpdateCartItem
     */
    setKnockoutAsInEligible(
        planDetails: PlanOfferingWithCartAndEnrollment,
        knockoutQuestions: KnockoutQuestion[],
        knockoutType: KnockoutType,
    ): Observable<AddToCartItem | UpdateCartItem> {
        return this.getCartObject(planDetails).pipe(
            tap((cartObject) => {
                this.producerShopComponentStoreService.setPlanKnockoutEligibility([
                    {
                        planOfferingId: planDetails.planOffering.id,
                        knockoutType: knockoutType,
                        questions: knockoutQuestions,
                        cartObject: cartObject,
                    },
                ]);
            }),
        );
    }

    /**
     * sets plan knockout data as eligible for matching questions
     * @param planOfferingWithCartAndEnrollment plan offering details with cart and enrollment
     * @param knockoutPlanEligibility previous knockout eligibility data
     * @param knockoutQuestions list of knockout questions
     */
    setKnockoutAsEligible(
        planOfferingWithCartAndEnrollment: PlanOfferingWithCartAndEnrollment,
        knockoutPlanEligibility: Dictionary<PlanKnockoutEligibility>,
        knockoutQuestions: KnockoutQuestion[],
    ): void {
        Object.values(knockoutPlanEligibility).forEach((previousKnockoutData) => {
            if (
                this.isKnockoutTypeValid(previousKnockoutData.knockoutType) &&
                // All questions for previous knockout have to be answered to set knockoutType as KnockoutType.NOT_APPLICABLE
                previousKnockoutData.questions.every((previousKnockoutQuestion) =>
                    knockoutQuestions.some(
                        (currentKnockoutQuestion) => previousKnockoutQuestion.question.key === currentKnockoutQuestion.question.key,
                    ),
                )
            ) {
                this.producerShopComponentStoreService.setPlanKnockoutEligibility([
                    {
                        planOfferingId: planOfferingWithCartAndEnrollment.planOffering.id,
                        knockoutType: KnockoutType.NOT_APPLICABLE,
                    },
                ]);
            }
        });
    }

    /**
     * Observable to add/ update cart item
     * @param planDetails plan details
     * @param previousCartItem previous ineligible plan cart item
     * @param responses response list
     * @returns Observable with number or number or number to be used in add cart item logic
     */
    addUpdateToCartPlan(
        planDetails: PlanOfferingWithCartAndEnrollment,
        previousCartItem: AddToCartItem | UpdateCartItem,
        responses: ApplicationResponse[],
    ): Observable<[number, number, number]> {
        return this.getCartObject(planDetails).pipe(
            map(
                (currentCartObject) =>
                    // If previous ineligible plan cart item is present, that has to be added.
                    previousCartItem ?? currentCartObject,
            ),
            withLatestFrom(this.mpGroup$, this.memberId$),
            tap(([cartObject, mpGroup, memberId]: [AddToCartItem | UpdateCartItem, number, number]) => {
                // For narrowing type between AddToCartItem | UpdateCartItem, using below check
                // cartObject when type is UpdateCartItem will have cartItemId and AddToCartItem will not have cartItemId
                if ("cartItemId" in cartObject) {
                    this.ngrxStore.dispatch(
                        ShoppingCartsActions.updateCartItem({
                            memberId,
                            mpGroup,
                            cartItemId: cartObject.cartItemId,
                            updateCartObject: cartObject,
                        }),
                    );
                } else {
                    this.ngrxStore.dispatch(
                        ShoppingCartsActions.addCartItem({
                            memberId,
                            mpGroup,
                            addCartObject: cartObject,
                        }),
                    );
                }
            }),
            // if we do not have responses to be saved no need to run the below saveKnockoutResponses
            filter(() => !!responses?.length),
            // In below saveKnockoutResponses, we are listening to above updateCartItem, addCartItem dispatch success response
            switchMap(([cartObject]) => this.saveKnockoutResponses(cartObject, responses)),
            take(1),
        );
    }

    /**
     * Saves knockout responses
     * @param cartObject cart object
     * @param responses response list
     * @returns Observable of number, number, number
     */
    saveKnockoutResponses(
        cartObject: AddToCartItem | UpdateCartItem,
        responses: ApplicationResponse[],
    ): Observable<[number, number, number]> {
        // Listening to add or update dispatch success response
        // saving the responses against the cart item id from this success response
        // responses should not be saved until the previous add or update dispatch actions are success
        return ("cartItemId" in cartObject ? this.cartItemUpdated$ : this.cartItemAdded$).pipe(
            withLatestFrom(this.memberId$, this.mpGroup$),
            tap(([cartItemId, memberId, mpGroup]) => {
                this.ngrxStore.dispatch(
                    PlanOfferingsActions.saveKnockoutResponses({
                        mpGroup,
                        memberId,
                        cartItemId: +cartItemId,
                        responses,
                        applicationResponseBaseType: ApplicationResponseBaseType.SHOP,
                    }),
                );
                this.ngrxStore.dispatch(ShoppingCartsActions.loadAppliedFlexDollars({ memberId, mpGroup }));
            }),
        );
    }

    /**
     * Get PlanOffering's eligibility knockout questions by DoverageLevel id
     * @param coverageLevelId {number} PlanOffering's selected CoverageLevel id
     * @returns {Observable<KnockoutQuestion[]>} PlanOffering's eligibility knockout questions
     */
    getEligibilityKnockoutQuestions(coverageLevelId?: number | null): Observable<KnockoutQuestion[]> {
        return this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getEligibilityKnockoutQuestions(coverageLevelId)));
    }

    /**
     * Get PlanOffering's unanswered eligibility knockout questions by DoverageLevel id
     * @param coverageLevelId {number} PlanOffering's selected CoverageLevel id
     * @returns {Observable<KnockoutQuestion[]>} PlanOffering's unanswered eligibility knockout questions
     */
    getUnansweredKnockoutQuestions(coverageLevelId?: number | null): Observable<KnockoutQuestion[]> {
        return combineLatest([this.getEligibilityKnockoutQuestions(coverageLevelId), this.answeredKnockoutQuestions$]).pipe(
            map(([eligibilityKnockoutQuestions, answeredKnockoutQuestions]) =>
                eligibilityKnockoutQuestions.filter(
                    (eligibilityKnockoutQuestion) => !answeredKnockoutQuestions[eligibilityKnockoutQuestion.question.key],
                ),
            ),
        );
    }

    /**
     * Check if member is eligible based on EligibilityKnockoutQuestions answers
     * @param coverageLevelId {number} PlanOffering's selected CoverageLevel id
     * @returns {Observable<InEligibleAnswerData>} Data that shows if answers make member not eligible
     */
    getAnswersIneligibleData(coverageLevelId?: number | null): Observable<InEligibleAnswerData> {
        // Knockout questions are ineligible when an answer has KnockoutType of KNOCKOUT or of SPOUSE_KNOCKOUT
        return this.getUnansweredKnockoutQuestions(coverageLevelId).pipe(
            switchMap((unansweredKnockoutQuestions) => {
                // unanswered questions which have dependencies should not block the user
                if (
                    unansweredKnockoutQuestions.length &&
                    unansweredKnockoutQuestions.every((unansweredQuestion) => !unansweredQuestion.question.requiredConstraint?.length)
                ) {
                    return of({ isIneligible: true });
                }
                return combineLatest([this.getEligibilityKnockoutQuestions(coverageLevelId), this.answeredKnockoutQuestions$]).pipe(
                    map(([eligibilityKnockoutQuestions, answeredKnockoutQuestions]) => {
                        const answersData = eligibilityKnockoutQuestions.map((eligibilityKnockoutQuestion) => {
                            const answeredQuestion = answeredKnockoutQuestions[eligibilityKnockoutQuestion.question.key];
                            if (!answeredQuestion) {
                                return {
                                    inEligibility: !(eligibilityKnockoutQuestion.question.hideUnlessConstraint.length > 0),
                                };
                            }
                            const knockoutType = eligibilityKnockoutQuestion.question.options.find(
                                (option) => option.value === answeredQuestion.answer,
                            )?.knockoutType;
                            return {
                                inEligibility: this.isKnockoutTypeValid(knockoutType),
                                answeredData: {
                                    knockoutQuestion: eligibilityKnockoutQuestion,
                                    answer: answeredQuestion.answer,
                                },
                            };
                        });
                        return {
                            isIneligible: answersData.some((answerData) => answerData.inEligibility),
                            answeredData: answersData
                                .filter((answerData) => answerData.answeredData)
                                .map((answerData) => answerData.answeredData),
                        };
                    }),
                );
            }),
        );
    }
}
