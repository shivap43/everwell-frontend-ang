import { Injectable } from "@angular/core";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { EnrollmentsSelectors } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { getEntityId } from "@empowered/ngrx-store/ngrx.store.helpers";
import { PlanOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { RXJSService } from "@empowered/ngrx-store/services/rxjs/rxjs.service";
import { SharedSelectors } from "@empowered/ngrx-store/ngrx-states/shared";
import { select } from "@ngrx/store";
import { combineLatest, Observable, of } from "rxjs";
import { distinctUntilChanged, map, switchMap, take, tap, withLatestFrom } from "rxjs/operators";
import {
    getPanelEntityId,
    riderStatesAdapter,
    selectAllRiderEntities,
} from "../producer-shop-component-store/producer-shop-component-store.constant";
import {
    AddRiderOptions,
    PanelIdentifiers,
    ProducerShopState,
    UpdateRiderOptions,
} from "../producer-shop-component-store/producer-shop-component-store.model";
import { ProducerShopComponentStoreService } from "../producer-shop-component-store/producer-shop-component-store.service";
import { RiderState, RiderStateValidationOptions } from "../rider-state/rider-state.model";
import { ValidateRiderStateService } from "../validate-rider-state/validate-rider-state.service";
import { RiderStateWithBenefitAmount, RiderStateWithPlanPricings } from "./rider-component-store.model";
import { PlanPanelService } from "../plan-panel/plan-panel.service";
import { PlanOfferingService } from "../plan-offering/plan-offering.service";
import {
    AsyncStatus,
    ClientErrorResponseCode,
    TobaccoInformation,
    Exceptions,
    CoverageLevel,
    EnrollmentRider,
    PlanOfferingPricing,
} from "@empowered/constants";

@Injectable()
export class RiderComponentStoreService {
    private readonly selectedMemberHasSpouseDependent$ = this.ngrxStore
        .onAsyncValue(select(MembersSelectors.getSelectedSpouseDependent))
        .pipe(map((spouseDependent) => !!spouseDependent));

    private readonly selectedMemberHasChildDependent$ = this.ngrxStore
        .onAsyncValue(select(MembersSelectors.getSelectedChildDependents))
        .pipe(map((childDependents) => !!childDependents.length));

    private readonly selectedEnrollments$ = this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.getSelectedEnrollments));

    private readonly selectedEnrollmentRiders$ = this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.getAllSelectedEnrollmentRiders));

    private readonly mandatoryRiderPlanIds$ = this.ngrxStore.onAsyncValue(select(SharedSelectors.getMandatoryRiderPlanIds));

    private readonly addOnRiderPlanIds$ = this.ngrxStore.onAsyncValue(select(SharedSelectors.getAddOnRiderPlanIds));

    private readonly riderBrokerPlanIds$ = this.ngrxStore.onAsyncValue(select(SharedSelectors.getRiderBrokerPlanIds));

    private readonly riskClassId$ = this.producerShopComponentStoreService.getSelectedProductRiskClassOnAsyncValue().pipe(
        map((riskClass) => riskClass?.id),
        distinctUntilChanged(),
    );
    // Observable of boolean to check whether plan offering is supplementary plan
    readonly isSupplementaryPlan$ = this.ngrxStore
        .onAsyncValue(select(PlanOfferingsSelectors.getSelectedPlanOffering))
        .pipe(map((planOffering) => this.planOfferingService.planOfferingHasSupplementaryPlan(planOffering)));

    private readonly coverageEffectiveDate$ = this.producerShopComponentStoreService
        .getSelectedProductCoverageDateOnAsyncValue()
        .pipe(map((coverageDate) => coverageDate?.date));

    // get tobacco information from more settings
    private readonly selectedTobaccoInformation$ = this.producerShopComponentStoreService.selectTobaccoInformationOnAsyncValue();
    // Get coverage levels for all plan panel from component store
    private readonly coverageLevels$ = this.producerShopComponentStoreService.getCoverageLevelStates();
    // Get benefit amounts for all plan panel from component store
    private readonly benefitAmounts$ = this.producerShopComponentStoreService.getBenefitAmountStates();
    // Get all Enrollments (not specific to any one Plan Offering)
    private readonly enrollments$ = this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.getSelectedEnrollments)).pipe(
        // Avoid redundant emitted values when no enrollments have changed
        this.rxjsService.distinctArrayUntilChanged(),
    );
    /**
     * Add RiderStates to RiderStates entities without overriding existing RiderStates.
     *
     * Use {@link getRiderStateValidationOptions} to get the majority of AddRiderOptions, you should only have to add `riderStates`
     */
    readonly addRiderStates = this.producerShopComponentStoreService.updater(
        (state: ProducerShopState, options: AddRiderOptions): ProducerShopState => {
            const {
                riderStates,
                memberHasSpouse,
                memberHasChild,
                enrollments,
                enrollmentRiders,
                mandatoryRiderPlanIds,
                addOnRiderPlanIds,
                riderBrokerPlanIds,
                allBaseBenefitAmounts,
                allBaseCoverageLevels,
            } = options;

            // Add RiderStates to a temporary snapshot of existing RiderStates entities without validating them
            // This will NOT override any existing RiderStates
            const updatedRiderStatesEntities = riderStatesAdapter.addMany(riderStates, state.riderStates);

            // Get all RiderStates from temporary snapshot of RiderStates entities
            const allRiderStates = selectAllRiderEntities(updatedRiderStatesEntities);

            // Validate and update all RiderStates based on each other in temporary snapshot of RiderStates entities
            const validatedAllRiderStates = this.validateRiderStateService.getValidatedRiderStates(allRiderStates, {
                memberHasSpouse,
                memberHasChild,
                enrollments,
                enrollmentRiders,
                mandatoryRiderPlanIds,
                addOnRiderPlanIds,
                riderBrokerPlanIds,
                allBaseBenefitAmounts,
                allBaseCoverageLevels,
            });

            // Insert and override any existing RiderStates using new validated RiderStates of temporary snapshot of RiderStates entities
            const finalRiderStates = riderStatesAdapter.upsertMany(validatedAllRiderStates, state.riderStates);

            return {
                ...state,
                riderStates: finalRiderStates,
            };
        },
    );

    /**
     * Remove RidersStates from RiderState entities
     */
    readonly removeRidersStates = this.producerShopComponentStoreService.updater(
        (state: ProducerShopState, riderStates: RiderState[]): ProducerShopState => {
            const entityIds = riderStates.map((riderState) =>
                getEntityId(riderState.riderPlanOfferingId, getPanelEntityId(riderState.identifiers)),
            );

            return {
                ...state,
                riderStates: riderStatesAdapter.removeMany(entityIds, state.riderStates),
            };
        },
    );

    /**
     * Remove all RidersStates with matching PanelIdentifier from RiderState entities
     */
    readonly removeRidersStatesByPanelIdentifier = this.producerShopComponentStoreService.updater(
        (state: ProducerShopState, panelIdentifier: PanelIdentifiers): ProducerShopState => {
            // Get all RiderStates from temporary snapshot of RiderStates entities
            const allRiderStates = selectAllRiderEntities(state.riderStates);

            const entityIds = this.filterRiderStatesByPanelIdentifiers(allRiderStates, panelIdentifier).map((riderState) =>
                getEntityId(riderState.riderPlanOfferingId, getPanelEntityId(riderState.identifiers)),
            );

            return {
                ...state,
                riderStates: riderStatesAdapter.removeMany(entityIds, state.riderStates),
            };
        },
    );

    /**
     * Set RiderStates to RiderStates entities and overriding existing RiderStates
     *
     * Use {@link getRiderStateValidationOptions} to get the majority of AddRiderOptions, you should only have to add `riderStates`
     */
    readonly upsertRiderStates = this.producerShopComponentStoreService.updater(
        (state: ProducerShopState, options: AddRiderOptions): ProducerShopState => {
            const {
                riderStates,
                memberHasSpouse,
                memberHasChild,
                enrollments,
                enrollmentRiders,
                mandatoryRiderPlanIds,
                addOnRiderPlanIds,
                riderBrokerPlanIds,
                allBaseBenefitAmounts,
                allBaseCoverageLevels,
                isSupplementaryPlan,
            } = options;

            // Set RiderStates to a temporary snapshot of existing RiderStates entities without validating them
            // This will override any existing RiderStates
            const updatedRiderStatesEntities = riderStatesAdapter.upsertMany(riderStates, state.riderStates);

            // Get all RiderStates from temporary snapshot of RiderStates entities
            const allRiderStates = selectAllRiderEntities(updatedRiderStatesEntities);

            // Validate and update all RiderStates based on each other in temporary snapshot of RiderStates entities
            const validatedAllRiderStates: RiderState[] = this.validateRiderStateService.getValidatedRiderStates(
                allRiderStates,
                {
                    memberHasSpouse,
                    memberHasChild,
                    enrollments,
                    enrollmentRiders,
                    mandatoryRiderPlanIds,
                    addOnRiderPlanIds,
                    riderBrokerPlanIds,
                    allBaseBenefitAmounts,
                    allBaseCoverageLevels,
                },
                isSupplementaryPlan,
            );

            // Insert and override any existing RiderStates using new validated RiderStates of temporary snapshot of RiderStates entities
            const finalRiderStates = riderStatesAdapter.upsertMany(validatedAllRiderStates, state.riderStates);

            return {
                ...state,
                riderStates: finalRiderStates,
            };
        },
    );

    /**
     * Update existing RiderStates to be unchecked. Provide `panelIdentifiers` to filter each RiderStates to uncheck.
     *
     * By providing all of UpdateRiderOptions,
     * RiderStates that are required to be checked will properly stay checked.
     * Will also uncheck RiderStates that are dependent on other RiderStates being checked
     *
     * Use {@link getRiderStateValidationOptions} to get the majority of UpdateRiderOptions, you should only have to add `riderStates`
     */
    readonly uncheckRiderStates = this.producerShopComponentStoreService.updater(
        (state: ProducerShopState, options: UpdateRiderOptions): ProducerShopState => {
            const {
                panelIdentifiers,
                memberHasSpouse,
                memberHasChild,
                enrollments,
                enrollmentRiders,
                mandatoryRiderPlanIds,
                addOnRiderPlanIds,
                riderBrokerPlanIds,
                selectedPanelEnrollmentRiders,
                allBaseCoverageLevels,
                allBaseBenefitAmounts,
            } = options;

            // Get all RiderStates from temporary snapshot of RiderStates entities
            const allRiderStates = selectAllRiderEntities(state.riderStates);

            // If RiderState has matching PanelIdentifier, it should be unchecked
            const updatedRiderStates = allRiderStates.map((riderState) => {
                if (!panelIdentifiers.some((panelIdentifier) => this.isPanelRiderState(panelIdentifier, riderState))) {
                    return riderState;
                }

                return this.getUncheckedRiderState(riderState, selectedPanelEnrollmentRiders);
            });

            // Validate and update all RiderStates based on each other in temporary snapshot of RiderStates entities
            const validatedAllRiderStates = this.validateRiderStateService.getValidatedRiderStates(updatedRiderStates, {
                memberHasSpouse,
                memberHasChild,
                enrollments,
                enrollmentRiders,
                mandatoryRiderPlanIds,
                addOnRiderPlanIds,
                riderBrokerPlanIds,
                allBaseCoverageLevels,
                allBaseBenefitAmounts,
            });

            // Insert and override any existing RiderStates using new validated RiderStates of temporary snapshot of RiderStates entities
            const finalRiderStates = riderStatesAdapter.upsertMany(validatedAllRiderStates, state.riderStates);

            return {
                ...state,
                riderStates: finalRiderStates,
            };
        },
    );

    constructor(
        private readonly rxjsService: RXJSService,
        private readonly ngrxStore: NGRXStore,
        private readonly producerShopComponentStoreService: ProducerShopComponentStoreService,
        private readonly validateRiderStateService: ValidateRiderStateService,
        private readonly planPanelService: PlanPanelService,
        private readonly planOfferingService: PlanOfferingService,
    ) {}

    /**
     * Gets all RiderStates. This reflects the current RiderStates stored.
     * If Member Dependents (spouse / child) or selected PlanOffering CoverageLevel changes
     * are supposed to toggle disabled/checked state, use {@link selectAllValidatedRiderStates} instead
     *
     * @returns {Observable<RiderState[]>} Observable<RiderState[]>
     */
    selectAllRiderStates(): Observable<RiderState[]> {
        return this.producerShopComponentStoreService.select((state) => selectAllRiderEntities(state.riderStates));
    }

    /**
     * Filters RiderStates by PanelIdentifiers. This reflects the current RiderStates stored.
     * If Member Dependents (spouse / child) or selected PlanOffering CoverageLevel changes
     * are supposed to toggle disabled/checked state, use {@link selectValidatedRiderStates} instead
     *
     * @param panelIdentifiers {PanelIdentifiers} - BASE PlanOffering id + cart id + enrollment id
     * @returns {Observable<RiderState[]>} Observable<RiderState[]>
     */
    selectRiderStates(panelIdentifiers: PanelIdentifiers): Observable<RiderState[]> {
        return this.selectAllRiderStates().pipe(
            map((riderStates) => this.filterRiderStatesByPanelIdentifiers(riderStates, panelIdentifiers)),
        );
    }

    /**
     * Get all validated versions of each RiderState. Properties of RiderStates will update based on each other.
     * This means that the emitted value might not match what is stored.
     *
     * See {@link getValidatedRiderState} for more details on how validation is done
     *
     * @returns Observable<RiderState[]> Validated RiderStates
     */
    selectAllValidatedRiderStates(): Observable<RiderState[]> {
        return combineLatest([this.selectAllRiderStates(), this.getRiderStateValidationOptions(), this.isSupplementaryPlan$]).pipe(
            map(([riderStates, riderStateValidationOptions, isSupplementaryPlan]) =>
                this.validateRiderStateService.getValidatedRiderStates(
                    riderStates,
                    {
                        ...riderStateValidationOptions,
                    },
                    isSupplementaryPlan,
                ),
            ),
        );
    }

    /**
     * Get all validated versions of each RiderState filtered by planOfferingId
     *
     * See {@link getValidatedRiderState} for more details on how validation is done
     *
     * @param panelIdentifiers {PanelIdentifiers} - BASE PlanOffering id + cart id + enrollment id
     * @returns {Observable<RiderState[]>} Observable<RiderState[]> Validated RiderStates
     */
    selectValidatedRiderStates(panelIdentifiers: PanelIdentifiers): Observable<RiderState[]> {
        return this.selectAllValidatedRiderStates().pipe(
            map((riderStates) => this.filterRiderStatesByPanelIdentifiers(riderStates, panelIdentifiers)),
        );
    }

    /**
     * Get CoverageLevels for BASE PlanOffering using its planId
     * @param basePlanId {number} BASE PlanOffering Plan id
     * @returns {Observable<CoverageLevel[]>} CoverageLevels for BASE PlanOffering
     */
    getBaseCoveragelevels(basePlanId: number): Observable<CoverageLevel[]> {
        return this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getCoverageLevels(basePlanId))).pipe(
            // Since Coverage Level api calls are made frequently, onAsyncValue for selected CoverageLevels
            // will emit multiple times for each api call,
            // to prevent this, we can check if the array of CoverageLevels change using their ids
            this.rxjsService.distinctArrayUntilChanged(),
        );
    }

    /**
     * Gets RIDER PlanOffering CoverageLevels based on a specific BASE PlanOffering's CoverageLevel.
     * Used to get the RIDER PlanOffering pricing that is used for populating the table
     * @param riderPlanId {number} - RIDER PlanOffering Plan id
     * @param baseCoverageLevelId {number} - BASE PlanOffering CoverageLevel id
     * @param isSupplementaryPlan if selected plan is supplementary or not
     * @returns {Observable<CoverageLevel[]>} Rider's CoverageLevels
     */
    getRiderCoverageLevels(riderPlanId: number, baseCoverageLevelId: number, isSupplementaryPlan: boolean): Observable<CoverageLevel[]> {
        return this.ngrxStore
            .onAsyncValue(select(PlanOfferingsSelectors.getCoverageLevels(riderPlanId, baseCoverageLevelId, isSupplementaryPlan)))
            .pipe(
                // Since Coverage Level api calls are made frequently, onAsyncValue for selected CoverageLevels
                // will emit multiple times for each api call,
                // to prevent this, we can check if the array of CoverageLevels change using their ids
                this.rxjsService.distinctArrayUntilChanged(),
            );
    }

    /**
     * Get Pricing for RIDER PlanOffering.
     * This is not the Pricing that populate the table rows
     * since they do not consider the BASE PlanOffering's selected CoverageLevel
     * @param riderState {RiderState} - State of RIDER PlanOffering
     * @param riskClassId {number} - selected RiskClass id
     * @param coverageEffectiveDate  {string} - selected CoverageEffectiveDate
     * @param riderParentPlanId {number} - RIDER parent Plan id
     * @param baseBenefitAmount {number} - selected BenefitAmount numeric value of parent BASE / RIDER parent Plan
     * @returns {Observable<PlanOfferingPricing[]>} Rider's PlanOfferingPricings without checking BASE PlanOffering CoverageLevel
     */
    getRiderPlanOfferingPricings(
        riderState: RiderState,
        riskClassId: number,
        coverageEffectiveDate: string,
        selectedTobaccoInformation: TobaccoInformation,
        includeFee: boolean,
        baseBenefitAmount?: number | null,
        parentCoverageLevelId?: number | null,
        shoppingCartItemId?: number | null,
    ): Observable<PlanOfferingPricing[]> {
        return this.ngrxStore
            .pipe(
                select(
                    PlanOfferingsSelectors.getPlanOfferingPricings(
                        includeFee,
                        selectedTobaccoInformation.memberIsTobaccoUser,
                        selectedTobaccoInformation.spouseIsTobaccoUser,
                        riderState.riderPlanOfferingId,
                        riskClassId,
                        coverageEffectiveDate,
                        riderState.riderParentPlanId,
                        baseBenefitAmount,
                        parentCoverageLevelId,
                        shoppingCartItemId,
                    ),
                ),
            )
            .pipe(
                // If pricing api fails for riders due to 400, response still should be returned with empty array
                map((priceData) =>
                    priceData.status === AsyncStatus.FAILED && +priceData.error?.status === ClientErrorResponseCode.RESP_400
                        ? { value: [], status: AsyncStatus.SUCCEEDED }
                        : priceData,
                ),
                this.ngrxStore.filterForAsyncValue(),
            );
    }

    /**
     * Get CoverageLevel by name. Normally getting CoverageLevel by anything but id is appropriate.
     *
     * This handles a special case for Riders dropdown.
     * This is because the Riders dropdown only has the CoverageLevel name for its mat-selects.
     *
     * @param coverageLevels {CoverageLevel[]} source of CoverageLevels
     * @param coverageLevelName {string} name to filter CoverageLevels with
     * @param enrolledRidersOfAdditionalUnitParentPlan {EnrollmentRider[]} enrolled riders for additional unit plan
     * @param isSupplementaryPlan {boolean} plan belongs to A/U or not
     * @param riderPlanPolicySeries {string} rider plan policy series
     * @returns {CoverageLevel | null} CoverageLevel with name
     */
    getCoverageLevelByName(
        coverageLevels: CoverageLevel[],
        coverageLevelName: string | null,
        enrolledRidersOfAdditionalUnitParentPlan: EnrollmentRider[],
        isSupplementaryPlan: boolean,
        riderPlanPolicySeries: string,
    ): CoverageLevel | null {
        if (!coverageLevelName) {
            return null;
        }
        // if base plan has some rider enrolled then only retain riders coverage levels should be displayed in supplementary plan
        // else retain rider coverage levels should be removed
        if (
            isSupplementaryPlan &&
            enrolledRidersOfAdditionalUnitParentPlan?.some(
                (parentPlanRiders) => parentPlanRiders.plan.policySeries === riderPlanPolicySeries,
            )
        ) {
            coverageLevels = coverageLevels.filter((riderCoverageLevel) => riderCoverageLevel.retainCoverageLevel);
        } else {
            coverageLevels = coverageLevels.filter((riderCoverageLevel) => !riderCoverageLevel.retainCoverageLevel);
        }
        return coverageLevels.find((coverageLevel) => coverageLevelName === coverageLevel.name) ?? null;
    }

    /**
     * Filter PlanOfferingPricings based on RIDER PlanOffering state and possible CoverageLevels
     * @param riderState {RiderState} - state of RIDER Plan Offering. Includes selected values for benefitAmount, etc
     * @param riderPlanOfferingPricings {PlanOfferingPricing[]} - RIDER PlanOfferingPricings
     * @param riderCoverageLevels {CoverageLevel[]} - RIDER CoverageLevels
     * @param enrolledRidersOfAdditionalUnitParentPlan {EnrollmentRider[]} enrolled riders for additional unit plan
     * @param isSupplementaryPlan {boolean} plan belongs to A/U or not
     * @param baseCoverageLevelId {number} - CoverageLevel id of base plan
     * @returns {PlanOfferingPricings} Filtered PlanOfferingPricings related to rider state
     */
    getFilteredRiderPlanOfferingPricing(
        riderState: RiderState,
        riderPlanOfferingPricings: PlanOfferingPricing[],
        riderCoverageLevels: CoverageLevel[],
        enrolledRidersOfAdditionalUnitParentPlan: EnrollmentRider[],
        isSupplementaryPlan: boolean,
        baseCoverageLevelId: number,
    ): PlanOfferingPricing | null {
        const riderSelectedCoverageLevel: CoverageLevel | undefined = this.getCoverageLevelByName(
            riderCoverageLevels,
            riderState.selectedCoverageLevelName,
            enrolledRidersOfAdditionalUnitParentPlan,
            isSupplementaryPlan,
            riderState.planPolicySeries,
        );
        // Filtering Enrollment Requirements of riders based on plan id
        const enrollmentRequirement = riderState.enrollmentRequirements?.filter(
            (enrollment) => enrollment.relatedPlanId === riderState.planId,
        );
        return (
            riderPlanOfferingPricings.find((pricing) => {
                // If RiderState has selectedBenefitAmount, pricing must match that BenefitAmountnumeric value
                if (riderState.selectedBenefitAmount && pricing.benefitAmount !== riderState.selectedBenefitAmount) {
                    return false;
                }

                // Check if RiderState has a selected CoverageLevel,
                // If it does, the displayed pricing must match that CoverageLevel
                if (riderSelectedCoverageLevel) {
                    return riderSelectedCoverageLevel?.id === pricing.coverageLevelId;
                }

                // If RiderState has no selected CoverageLevel, any will do
                // If rider has enrollment requirement, comparing enrollmentRequirement coverageLevel id with baseCoverageLevel id
                // Find the first pricing that has any RIDER CoverageLevel
                if (enrollmentRequirement?.length) {
                    return (
                        riderCoverageLevels.map(({ id }) => id).includes(pricing.coverageLevelId) &&
                        enrollmentRequirement?.find((enrollment) => enrollment.coverageLevels?.some(({ id }) => id === baseCoverageLevelId))
                    );
                } else {
                    return riderCoverageLevels.map(({ id }) => id).includes(pricing.coverageLevelId);
                }
            }) ?? null
        );
    }

    /**
     * Get RIDER PlanOfferingPricings for each BASE PlanOffering's CoverageLevels
     * @param riderState {RiderState} - state of RIDER Plan Offering. Includes selected values for benefitAmount, etc
     * @param baseCoverageLevels {CoverageLevel[]} - BASE CoverageLevels
     * @param enrolledRidersOfAdditionalUnitParentPlan {EnrollmentRider[]} enrolled riders for additional unit plan
     * @param riderPlanOfferingPricings {PlanOfferingPricing[]} - RIDER PlanOfferingPricings
     * @param isSupplementaryPlan if selected plan is supplementary or not
     * @returns {Observable<{ riderPlanOfferingPricing: PlanOfferingPricing; baseCoverageLevel: CoverageLevel }[]>} RIDER Pricing
     * for BASE CoverageLevel
     */
    getBaseCoverageLevelRiderPlanOfferingPricings(
        riderState: RiderState,
        baseCoverageLevels: CoverageLevel[],
        enrolledRidersOfAdditionalUnitParentPlan: EnrollmentRider[],
        riderPlanOfferingPricings: PlanOfferingPricing[],
        isSupplementaryPlan: boolean,
    ): Observable<{ riderPlanOfferingPricing: PlanOfferingPricing; baseCoverageLevel: CoverageLevel }[]> {
        // Avoid doing combineLatest of empty array
        // This will result in the Observable completing
        if (!baseCoverageLevels.length) {
            return of([]);
        }

        return combineLatest(
            baseCoverageLevels.map((baseCoverageLevel) =>
                this.getRiderCoverageLevels(riderState.riderPlanId, baseCoverageLevel.id, isSupplementaryPlan).pipe(
                    map((riderCoverageLevels) =>
                        this.getFilteredRiderPlanOfferingPricing(
                            riderState,
                            riderPlanOfferingPricings,
                            riderCoverageLevels,
                            enrolledRidersOfAdditionalUnitParentPlan,
                            isSupplementaryPlan,
                            baseCoverageLevel.id,
                        ),
                    ),
                    map((riderPlanOfferingPricing) => ({ riderPlanOfferingPricing, baseCoverageLevel })),
                ),
            ),
        );
    }

    /**
     * Gets baseBenefitAmount used to determine a Rider's PlanOfferings when user is adding Rider to Shopping Cart
     *
     * `baseBenefitAmount` is determined in this order
     * 1. RIDER PlanOffering's selected BenefitAmount
     * 2. RIDER PlanOffering's parent RIDER PlanOffering's selected BenefitAmount
     * 3. BASE PlanOffering's selected BenefitAmount if base plan id and riderParentPlanId matches
     *
     * @param riderState {RiderState} RiderState of RIDER PlanOffering. Contains parentPlanId and selectedBenefitAmount.
     * @param basePlanOfferingBenefitAmount {number} - (Optional) BASE PlanOffering's selected BenefitAmount numeric value
     * @param basePlanId {number} - (Optional) BASE PlanOffering's plan id
     * @param isSupplementaryPlan {boolean} - (Optional) plan is supplementary or not
     * @returns {number} baseBenefitAmount used to determine a Rider's PlanOfferings
     */
    getBaseBenefitAmount(
        riderState: RiderState,
        mandatoryRiderPlanIds: number[],
        basePlanOfferingBenefitAmount?: number | null,
        basePlanId?: number | null,
        isSupplementaryPlan?: boolean,
    ): number | null {
        // If basePlan id isn't matched with rider parent planId dont send the base benefit amount in case of supplementary plan
        if (isSupplementaryPlan && riderState.riderParentPlanId !== basePlanId) {
            return null;
        }

        // Base PlanOffering's selected BenefitAmount if base plan id and riderParentPlanId matches for supplemenatry plan
        if (isSupplementaryPlan && riderState.riderParentPlanId === basePlanId) {
            return basePlanOfferingBenefitAmount;
        }

        // RIDER PlanOffering's selected BenefitAmount & selected plan id doesn't belongs to parent plan id
        if (riderState.selectedBenefitAmount && riderState.riderParentPlanId !== riderState.planId) {
            return riderState.selectedBenefitAmount;
        }

        // RIDER PlanOffering's parent RIDER PlanOffering's selected BenefitAmount
        if (riderState.riderParentPlanSelectedBenefitAmount) {
            return riderState.riderParentPlanSelectedBenefitAmount;
        }

        // BASE PlanOffering's selected BenefitAmount if base plan id and riderParentPlanId matches or is one of the mandatory riders
        return riderState.riderParentPlanId === riderState.planId || mandatoryRiderPlanIds.includes(riderState.riderPlanId)
            ? basePlanOfferingBenefitAmount
            : null;
    }

    /**
     * Returns parentPlanCoverageLevelId if BASE Plan id matches RIDER PlanOffering parentPlanId
     * @param riderState {RiderState} RiderState of RIDER PlanOffering. Contains parentPlanId and selectedBenefitAmount.
     * @param basePlanId {number} BASE PlanOffering Plan id
     * @returns {number} parentPlanCoverageLevelId if BASE Plan id
     */
    getParentCoverageLevelId(riderState: RiderState, basePlanId: number): number | null {
        if (riderState.riderParentPlanId !== basePlanId) {
            return null;
        }

        return riderState.parentPlanCoverageLevelId ?? null;
    }

    /**
     * Get All validated RiderStates and their baseBenefitAmount
     *
     * @param panelIdentifiers {PanelIdentifiers} - BASE PlanOffering id + cart id + enrollment id
     * @returns {Observable<{ riderPlanOfferingPricing: PlanOfferingPricing; baseCoverageLevel: CoverageLevel }[]>} RIDER Pricing
     * for BASE CoverageLevel
     */
    getRiderStatesWithBaseBenefitAmount(panelIdentifiers: PanelIdentifiers): Observable<RiderStateWithBenefitAmount[]> {
        return this.selectValidatedRiderStates(panelIdentifiers).pipe(
            switchMap((riderStates) => {
                // Avoid doing combineLatest of empty array
                // This will result in the Observable completing
                if (!riderStates.length) {
                    return of([]);
                }

                return combineLatest(
                    riderStates.map((riderState) => {
                        // Gets Panel identifiers from rider state
                        const riderPanelIdentifiers = this.getPanelIdentifiersFromRiderState(riderState);

                        return this.producerShopComponentStoreService.getBenefitAmountState(riderPanelIdentifiers).pipe(
                            withLatestFrom(this.mandatoryRiderPlanIds$),
                            switchMap(([benefitAmountState, mandatoryRiderPlanIds]) =>
                                this.isSupplementaryPlan$.pipe(
                                    map((isSupplementaryPlan) => ({ benefitAmountState, isSupplementaryPlan, mandatoryRiderPlanIds })),
                                ),
                            ),
                            map(({ benefitAmountState, isSupplementaryPlan, mandatoryRiderPlanIds }) => {
                                const baseBenefitAmount = this.getBaseBenefitAmount(
                                    riderState,
                                    mandatoryRiderPlanIds,
                                    benefitAmountState?.benefitAmount,
                                    riderState.planId,
                                    isSupplementaryPlan,
                                );
                                return {
                                    riderState,
                                    baseBenefitAmount,
                                };
                            }),
                            take(1),
                        );
                    }),
                );
            }),
        );
    }

    /**
     * Get a single RIDER PlanOffering Pricings used to display pricings to add Rider to Shopping Cart
     *
     * @param riderState {RiderState} - state of RIDER Plan Offering. Includes selected values for benefitAmount, etc
     * @param basePlanId {number} - parent Plan id
     * @param mandatoryRiderPlanIds {number[]} - Mandatory rider plan ids(config)
     * @param isSupplementaryPlan if selected plan is supplementary or not
     * @param selectedTobaccoInformation {TobaccoInformation} selected tobacco information
     * @param riskClassId {number} - selected RiskClass id
     * @param coverageEffectiveDate {string} - selected CoverageEffectiveDate
     * @param basePlanOfferingBenefitAmount {number} - (Optional) BASE PlanOffering's selected BenefitAmount numeric value
     * @param shoppingCartItemId {number} - cart item id, if present in cart
     * @returns Observable<RiderStateWithPlanPricings>
     */
    getRiderStateWithPlanPricings(
        riderState: RiderState,
        basePlanId: number,
        mandatoryRiderPlanIds: number[],
        isSupplementaryPlan: boolean,
        selectedTobaccoInformation: TobaccoInformation,
        riskClassId?: number | null,
        coverageEffectiveDate?: string | null,
        basePlanOfferingBenefitAmount?: number | null,
        shoppingCartItemId?: number | null,
    ): Observable<RiderStateWithPlanPricings> {
        /* If the rider's parentPlanId matches the plan id of the selected plan
        Then pass the basePlan's selected benefit amount. Else pass the baseRider benefit amount
        NOTE: Its not mandatory for a rider to have a baseRider or a base parentPlanId set.
        Benefit amount is important only when a rider has a parentPlanId set or
        depends on another rider to determine the pricing
        */
        const baseBenefitAmount = this.getBaseBenefitAmount(
            riderState,
            mandatoryRiderPlanIds,
            basePlanOfferingBenefitAmount,
            basePlanId,
            isSupplementaryPlan,
        );

        const parentCoverageLevelId = this.getParentCoverageLevelId(riderState, basePlanId);

        const includeFee = mandatoryRiderPlanIds.includes(riderState.riderPlanId);

        return this.getRiderPlanOfferingPricings(
            riderState,
            riskClassId,
            coverageEffectiveDate,
            selectedTobaccoInformation,
            includeFee,
            baseBenefitAmount,
            parentCoverageLevelId,
            shoppingCartItemId,
        ).pipe(
            withLatestFrom(
                this.getBaseCoveragelevels(riderState.planId),
                this.getEnrolledRidersOfAdditionalUnitParentPlan(riderState.planId, isSupplementaryPlan),
            ),
            switchMap(([riderPlanOfferingPricings, baseCoverageLevels, enrolledRidersOfAdditionalUnitParentPlan]) =>
                this.getBaseCoverageLevelRiderPlanOfferingPricings(
                    riderState,
                    baseCoverageLevels,
                    enrolledRidersOfAdditionalUnitParentPlan,
                    riderPlanOfferingPricings,
                    isSupplementaryPlan,
                ),
            ),
            map((pricingDatas) => ({
                riderState,
                pricingDatas,
                baseBenefitAmount,
            })),
        );
    }

    /**
     * Get multiple RIDER PlanOffering Pricings used to display pricings to add Rider to Shopping Cart
     *
     * @param panelIdentifiers {PanelIdentifiers} BASE PlanOffering Plan id
     * @returns Observable<RiderStateWithPlanPricings[]>
     */
    getRiderStatesWithPlanPricings(panelIdentifiers: PanelIdentifiers): Observable<RiderStateWithPlanPricings[]> {
        const riderStates$ = this.selectValidatedRiderStates(panelIdentifiers);
        const basePlanOfferingBenefitAmountState$ = this.producerShopComponentStoreService.getBenefitAmountState(panelIdentifiers);

        const shoppingCartItemId = panelIdentifiers.cartId;
        // NOTE: Dependent Age doesn't required to get Riders pricing
        // Get Rider Pricings to populate table
        return combineLatest([
            riderStates$,
            basePlanOfferingBenefitAmountState$,
            this.riskClassId$,
            this.coverageEffectiveDate$,
            this.selectedTobaccoInformation$,
            this.mandatoryRiderPlanIds$,
        ]).pipe(
            withLatestFrom(this.isSupplementaryPlan$),
            switchMap(
                ([
                    [
                        riderStates,
                        benefitAmountState,
                        riskClassId,
                        coverageEffectiveDate,
                        selectedTobaccoInformation,
                        mandatoryRiderPlanIds,
                    ],
                    isSupplementaryPlan,
                ]) => {
                    const basePlanOfferingBenefitAmount = benefitAmountState?.benefitAmount ?? null;

                    // Avoid doing combineLatest of empty array
                    // This will result in the Observable completing
                    if (!riderStates.length) {
                        return of([]);
                    }

                    return combineLatest(
                        riderStates.map((riderState) =>
                            this.getRiderStateWithPlanPricings(
                                riderState,
                                riderState.planId,
                                mandatoryRiderPlanIds,
                                isSupplementaryPlan,
                                selectedTobaccoInformation,
                                riskClassId,
                                coverageEffectiveDate,
                                basePlanOfferingBenefitAmount,
                                shoppingCartItemId,
                            ),
                        ),
                    );
                },
            ),
        );
    }

    /**
     * Get RiderStateValidationOptions used for adding/updating RiderStates
     * and getting RiderStates. These values are required to validate the expected state of each RiderState. RiderStates are expected to be
     * enabled / disabled / checked for various reasons outside of the RiderStates themselves.
     *
     * Commonly used to get the majority of the properties needed for `AddRiderOptions` or `UpdateRiderOptions`
     *
     * @returns {Observable<RiderStateValidationOptions>} RiderStateValidationOptions used for adding/updating RiderStates
     * and getting RiderStates
     */
    getRiderStateValidationOptions(): Observable<RiderStateValidationOptions> {
        // We have to break up this combineLatest into parts since there's more than 6 Observables
        // This is because trying to use more than 6 results in lost types (each Observable gets type any)
        return combineLatest([
            this.selectedMemberHasSpouseDependent$,
            this.selectedMemberHasChildDependent$,
            this.coverageLevels$.pipe(map((coverageLevelDictionary) => Object.values(coverageLevelDictionary))),
            this.benefitAmounts$.pipe(map((benefitAmountDictionary) => Object.values(benefitAmountDictionary))),
            combineLatest([
                this.selectedEnrollments$,
                this.selectedEnrollmentRiders$,
                this.mandatoryRiderPlanIds$,
                this.addOnRiderPlanIds$,
                this.riderBrokerPlanIds$,
            ]),
        ]).pipe(
            map(
                ([
                    memberHasSpouse,
                    memberHasChild,
                    allBaseCoverageLevels,
                    allBaseBenefitAmounts,
                    [enrollments, enrollmentRiders, mandatoryRiderPlanIds, addOnRiderPlanIds, riderBrokerPlanIds],
                ]) => ({
                    memberHasSpouse,
                    memberHasChild,
                    allBaseCoverageLevels,
                    allBaseBenefitAmounts,
                    enrollments,
                    enrollmentRiders,
                    mandatoryRiderPlanIds,
                    addOnRiderPlanIds,
                    riderBrokerPlanIds,
                }),
            ),
        );
    }

    /**
     * Get unchecked RiderStates based on an existing Array of RiderStates
     * where each enabled RiderState is unchecked and
     * its selectable values are reset back to first possible value
     *
     * @param riderStates {RiderState[]} Original array of RiderStates
     * @returns {RiderState[]} All enabled RiderStates unchecked and selectable values are reset back to first possible value
     */
    getUncheckedRiderStates(riderStates: RiderState[], enrolledRiders?: EnrollmentRider[]): RiderState[] {
        return riderStates.map((riderState) => this.getUncheckedRiderState(riderState, enrolledRiders));
    }

    /**
     * Get unchecked RiderState based on an existing RiderState
     * where if enabled, it will become unchecked and
     * its selectable values are reset back to first possible value
     *
     * @param riderState {RiderState}
     * @param enrolledRiderIds ids of all enrolled riders
     * @returns {RiderState} unchecked RiderState if it isn't disabled
     */
    getUncheckedRiderState(riderState: RiderState, enrolledRiders?: EnrollmentRider[]): RiderState {
        const isRiderEnrolled = enrolledRiders?.find((rider) => rider.plan.id === riderState.riderPlanId);
        // Only uncheck enabled RiderStates
        // Normally when a RiderState is checked and disabled, it is because they are mandatory / always checked
        const checked = riderState.disabled ? riderState.checked : !!isRiderEnrolled;
        return {
            ...riderState,
            checked: checked,
            // Reset other selectable values: coverageLevelName, benefitAmount, eliminationPeriodName
            // Even though these mat-selects will likely be disabled after RiderState is unchecked,
            // This will make the mat-select default back to the first selectable value
            selectedCoverageLevelName: riderState.coverageLevelNames[0] ?? riderState.selectedCoverageLevelName ?? null,
            selectedBenefitAmount: riderState.benefitAmounts[0] ?? riderState.selectedBenefitAmount ?? null,
            selectedEliminationPeriodName: riderState.eliminationPeriodNames[0] ?? riderState.selectedEliminationPeriodName ?? null,
        };
    }

    /**
     * gets panel identifiers from rider state
     * @param riderState rider state holding rider local store data
     * @returns {PanelIdentifiers} panel identifiers from rider state
     */
    getPanelIdentifiersFromRiderState(riderState: RiderState): PanelIdentifiers {
        const { planOfferingId, cartId, enrollmentId } = riderState.identifiers;

        return { planOfferingId, cartId, enrollmentId };
    }

    /**
     * checks if current rider state belongs to a plan panel or not based on panel identifiers
     * @param panelIdentifiers panel identifiers
     * @param riderState rider state from local store
     * @returns {boolean} indicating if rider state belongs to a plan panel or not
     */
    isPanelRiderState(panelIdentifiers: PanelIdentifiers, riderState: RiderState): boolean {
        const currentRiderPanelIdentifiers = this.getPanelIdentifiersFromRiderState(riderState);
        // Checks if current state belongs to plan panel based on panelIdentifiers
        return this.planPanelService.isSamePlanPanel(panelIdentifiers, currentRiderPanelIdentifiers);
    }

    /**
     * Rider state is returned after filtering spouse exception rider benefit amounts
     * @param riderStates current rider state
     * @param riderStatesWithAllBenefitAmounts initial rider state with all benefit amounts
     * @param spouseException spouse exception data
     * @param riderPlanIdsForException spouse exception rider plan ids
     * @param selectedPlanBenefitAmount selected benefit amount of plan
     * @returns rider state with filtered benefit amounts if its a spouse exception rider or rider state
     */
    getSpouseExceptionRiderData(
        riderStates: RiderState[],
        riderStatesWithAllBenefitAmounts: RiderState[],
        spouseException: Exceptions[],
        riderPlanIdsForException: number[],
        selectedPlanBenefitAmount: number,
    ): RiderState[] {
        return riderStates.map((riderState) => {
            if (!riderPlanIdsForException.includes(riderState.riderPlanId) || !spouseException) {
                return riderState;
            }
            const riderWithInitialBenefitAmounts = riderStatesWithAllBenefitAmounts.find(
                (riderWithAllBenefitAmount) => riderWithAllBenefitAmount.riderPlanOfferingId === riderState.riderPlanOfferingId,
            );
            const filteredBenefitAmounts = riderWithInitialBenefitAmounts.benefitAmounts.filter(
                (benefitAmount) => benefitAmount <= selectedPlanBenefitAmount * (spouseException[0].restrictionValue / 100),
            );
            const isBenefitAmountsChanged = filteredBenefitAmounts.length !== riderState.benefitAmounts.length;
            return {
                ...riderState,
                benefitAmounts: filteredBenefitAmounts.length >= 2 ? filteredBenefitAmounts : [],
                checked: isBenefitAmountsChanged ? false : riderState.checked,
                selectedBenefitAmount: isBenefitAmountsChanged
                    ? riderWithInitialBenefitAmounts.benefitAmounts[0]
                    : riderState.selectedBenefitAmount,
            };
        });
    }

    /**
     * Filters RiderStates by PanelIdentifiers
     *
     * @param riderStates {RiderState[]} Original array of RiderStates
     * @param panelIdentifiers {PanelIdentifiers} - BASE PlanOffering id + cart id + enrollment id
     * @returns {RiderState[]} Filtered RiderStates by PanelIdentifiers
     */
    filterRiderStatesByPanelIdentifiers(riderStates: RiderState[], panelIdentifiers: PanelIdentifiers): RiderState[] {
        return riderStates.filter((riderState) => this.isPanelRiderState(panelIdentifiers, riderState));
    }

    /**
     * Get EnrollmentRiders where PlanPanel's Plan is a dependent Plan of Enrollment.
     * PlanPanel's Plan must also be a Supplementary Plan
     * @param planId {number} selected plan id
     * @param isSupplementaryPlan {boolean} plan belongs to A/U or not
     * @returns Observable<EnrollmentRider[]> EnrollmentRiders where PlanPanel's Plan is a dependent Plan of Enrollment
     */
    getEnrolledRidersOfAdditionalUnitParentPlan(planId: number, isSupplementaryPlan: boolean): Observable<EnrollmentRider[]> {
        return this.enrollments$.pipe(
            switchMap((enrollments) => {
                const enrollment = enrollments?.find(
                    (possibleEnrollment) => possibleEnrollment.plan.dependentPlanIds?.includes(planId) && isSupplementaryPlan,
                );
                if (!enrollment) {
                    return of([]);
                }
                return this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.getEnrollmentRiders(enrollment.id)));
            }),
        );
    }
}
