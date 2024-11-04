import { ComponentStore } from "@ngrx/component-store";
import { Injectable } from "@angular/core";

import { combineLatest, Observable } from "rxjs";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { select } from "@ngrx/store";
import { ProductsSelectors } from "@empowered/ngrx-store/ngrx-states/products";
import { AsyncData, AsyncStatus, CarrierId, ProductId, TobaccoInformation, RiskClass } from "@empowered/constants";
import { PlanOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { map, switchMap } from "rxjs/operators";
import { Dictionary } from "@ngrx/entity/src/models";
import { mapAsyncData } from "@empowered/ngrx-store/ngrx.store.helpers";

import {
    AnsweredKnockoutQuestion,
    EnrollmentDetailsState,
    MoreSettings,
    ProductCoverageDate,
    ProducerShopState,
    KnockoutDialogResponse,
    PlanKnockoutEligibility,
    EliminationPeriodState,
    BenefitAmountState,
    PanelIdentifiers,
    CoverageLevelState,
    DependentAgeState,
    AnnualContributionState,
    ApplicantDetails,
    SpouseDetails,
} from "./producer-shop-component-store.model";
import {
    annualContributionStatesAdapter,
    answeredKnockoutQuestionsAdapter,
    benefitAmountStatesAdapter,
    coverageLevelStatesAdapter,
    dependentAgeStatesAdapter,
    eliminationPeriodStatesAdapter,
    getPanelEntityId,
    planKnockoutEligibilityAdapter,
    PRODUCER_SHOP_COMPONENT_STORE_DEFAULT_STATE,
} from "./producer-shop-component-store.constant";

@Injectable({ providedIn: "root" })
export class ProducerShopComponentStoreService extends ComponentStore<ProducerShopState> {
    private readonly selectedProductId$ = this.ngrxStore.pipe(select(ProductsSelectors.getSelectedProductId));
    private readonly selectedPlanOffering$ = this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getSelectedPlanOffering));
    private readonly selectedCarrierId$ = this.selectedPlanOffering$.pipe(map((planOffering) => planOffering?.plan?.carrierId));

    readonly setRiskClasses = this.updater(
        (state: ProducerShopState, riskClasses: AsyncData<RiskClass[]>): ProducerShopState => ({
            ...state,
            riskClasses,
        }),
    );

    readonly setMoreSettings = this.updater(
        (state: ProducerShopState, moreSettings: AsyncData<MoreSettings>): ProducerShopState => ({
            ...state,
            moreSettings,
        }),
    );

    readonly setApplicantDetails = this.updater(
        (state: ProducerShopState, applicantDetails: AsyncData<ApplicantDetails>): ProducerShopState => ({
            ...state,
            applicantDetails,
        }),
    );

    readonly setSpouseDetails = this.updater(
        (state: ProducerShopState, spouseDetails: AsyncData<SpouseDetails>): ProducerShopState => ({
            ...state,
            spouseDetails,
        }),
    );

    readonly setTobaccoInformation = this.updater(
        (state: ProducerShopState, tobaccoInformation: AsyncData<TobaccoInformation>): ProducerShopState => ({
            ...state,
            tobaccoInformation,
        }),
    );

    readonly setProductCoverageDates = this.updater(
        (state: ProducerShopState, productCoverageDates: AsyncData<ProductCoverageDate[]>): ProducerShopState => ({
            ...state,
            productCoverageDates,
        }),
    );

    readonly setEnrollmentDetailsStates = this.updater(
        (state: ProducerShopState, enrollmentDetailsStates: AsyncData<Record<number, EnrollmentDetailsState>>): ProducerShopState => ({
            ...state,
            enrollmentDetailsStates,
        }),
    );

    readonly setEnrollmentDetailsState = this.updater(
        (state: ProducerShopState, update: { enrollmentDetailsState: EnrollmentDetailsState; enrollmentId: number }): ProducerShopState => {
            const enrollmentDetailsStatesData = state.enrollmentDetailsStates;
            const asyncStatus = enrollmentDetailsStatesData.status;

            if (asyncStatus !== AsyncStatus.SUCCEEDED) {
                return state;
            }

            return {
                ...state,
                enrollmentDetailsStates: mapAsyncData(enrollmentDetailsStatesData, ({ value: enrollmentDetailsStates }) => ({
                    ...enrollmentDetailsStates,
                    [update.enrollmentId]: update.enrollmentDetailsState,
                })),
            };
        },
    );

    readonly setAnsweredKnockoutQuestions = this.updater(
        (state, answeredKnockoutQuestions: AnsweredKnockoutQuestion[]): ProducerShopState => ({
            ...state,
            answeredKnockoutQuestions: answeredKnockoutQuestionsAdapter.upsertMany(
                answeredKnockoutQuestions,
                state.answeredKnockoutQuestions,
            ),
        }),
    );

    readonly setPlanKnockoutEligibility = this.updater(
        (state, planKnockoutEligibilities: PlanKnockoutEligibility[]): ProducerShopState => ({
            ...state,
            planKnockoutEligibility: planKnockoutEligibilityAdapter.upsertMany(planKnockoutEligibilities, state.planKnockoutEligibility),
        }),
    );

    readonly setKnockoutDialogResponse = this.updater(
        (state, knockoutDialogResponse: KnockoutDialogResponse[]): ProducerShopState => ({
            ...state,
            knockoutDialogResponse: [...knockoutDialogResponse],
        }),
    );

    /**
     * Add EliminationPeriodStates to EliminationPeriodState entities without overriding existing EliminationPeriodState
     */
    readonly addEliminationPeriodState = this.updater(
        (state: ProducerShopState, eliminationPeriodState: EliminationPeriodState): ProducerShopState => ({
            ...state,
            eliminationPeriodStates: eliminationPeriodStatesAdapter.addOne(eliminationPeriodState, state.eliminationPeriodStates),
        }),
    );

    /**
     * Set EliminationPeriodStates to EliminationPeriodState entities and overriding existing EliminationPeriodState
     */
    readonly upsertEliminationPeriodState = this.updater(
        (state: ProducerShopState, eliminationPeriodState: EliminationPeriodState): ProducerShopState => ({
            ...state,
            eliminationPeriodStates: eliminationPeriodStatesAdapter.upsertOne(eliminationPeriodState, state.eliminationPeriodStates),
        }),
    );

    /**
     * Remove current panel EliminationPeriodState from EliminationPeriodState entities
     */
    readonly removeEliminationPeriodState = this.updater(
        (state: ProducerShopState, panelIdentifiers: PanelIdentifiers): ProducerShopState =>
            this.removeOneEnrollmentPeriodState(state, panelIdentifiers),
    );

    /**
     * Add CoverageLevelStates to CoverageLevelState entities without overriding existing CoverageLevelState
     */
    readonly addCoverageLevelState = this.updater(
        (state: ProducerShopState, coverageLevelState: CoverageLevelState): ProducerShopState => ({
            ...state,
            coverageLevelStates: coverageLevelStatesAdapter.addOne(coverageLevelState, state.coverageLevelStates),
        }),
    );

    /**
     * Set CoverageLevelStates to CoverageLevelState entities and overriding existing CoverageLevelState
     */
    readonly upsertCoverageLevelState = this.updater(
        (state: ProducerShopState, coverageLevelState: CoverageLevelState): ProducerShopState => ({
            ...state,
            coverageLevelStates: coverageLevelStatesAdapter.upsertOne(coverageLevelState, state.coverageLevelStates),
        }),
    );

    /**
     * Remove current panel coverage level state from CoverageLevelState entities
     */
    readonly removeCoverageLevelState = this.updater(
        (state: ProducerShopState, panelIdentifiers: PanelIdentifiers): ProducerShopState =>
            this.removeOneCoverageLevelState(state, panelIdentifiers),
    );

    /**
     * Add BenefitAmountStates to BenefitAmountState entities without overriding existing BenefitAmountState
     */
    readonly addBenefitAmountState = this.updater(
        (state: ProducerShopState, benefitAmountStates: BenefitAmountState): ProducerShopState => ({
            ...state,
            benefitAmountStates: benefitAmountStatesAdapter.addOne(benefitAmountStates, state.benefitAmountStates),
        }),
    );

    /**
     * Set BenefitAmountStates to BenefitAmountState entities and overriding existing BenefitAmountState
     */
    readonly upsertBenefitAmountState = this.updater(
        (state: ProducerShopState, benefitAmountState: BenefitAmountState): ProducerShopState => ({
            ...state,
            benefitAmountStates: benefitAmountStatesAdapter.upsertOne(benefitAmountState, state.benefitAmountStates),
        }),
    );

    /**
     * Remove current panel benefit amount state from BenefitAmountState entities
     */
    readonly removeBenefitAmountState = this.updater(
        (state: ProducerShopState, panelIdentifiers: PanelIdentifiers): ProducerShopState =>
            this.removeOneBenefitAmountState(state, panelIdentifiers),
    );

    /**
     * Add DependentAgeStates to DependentAgeState entities without overriding existing DependentAgeState
     */
    readonly addDependentAgeState = this.updater(
        (state: ProducerShopState, dependentAgeState: DependentAgeState): ProducerShopState => ({
            ...state,
            dependentAgeStates: dependentAgeStatesAdapter.addOne(dependentAgeState, state.dependentAgeStates),
        }),
    );

    /**
     * Set DependentAgeStates to DependentAgeState entities and overriding existing DependentAgeState
     */
    readonly upsertDependentAgeState = this.updater(
        (state: ProducerShopState, dependentAgeState: DependentAgeState): ProducerShopState => ({
            ...state,
            dependentAgeStates: dependentAgeStatesAdapter.upsertOne(dependentAgeState, state.dependentAgeStates),
        }),
    );

    /**
     * Remove current panel DependentAgeStates from DependentAgeStates entities
     */
    readonly removeDependentAgeState = this.updater(
        (state: ProducerShopState, panelIdentifiers: PanelIdentifiers): ProducerShopState =>
            this.removeOneDependentAgeState(state, panelIdentifiers),
    );

    /**
     * Add AnnualContributionStates to AnnualContributionState entities without overriding existing AnnualContributionState
     */
    readonly addAnnualContributionState = this.updater(
        (state: ProducerShopState, annualContributionState: AnnualContributionState): ProducerShopState => ({
            ...state,
            annualContributionStates: annualContributionStatesAdapter.addOne(annualContributionState, state.annualContributionStates),
        }),
    );

    /**
     * Set AnnualContributionStates to AnnualContributionState entities and overriding existing AnnualContributionState
     */
    readonly upsertAnnualContributionState = this.updater(
        (state: ProducerShopState, annualContributionState: AnnualContributionState): ProducerShopState => ({
            ...state,
            annualContributionStates: annualContributionStatesAdapter.upsertOne(annualContributionState, state.annualContributionStates),
        }),
    );

    /**
     * Remove current panel AnnualContributionStates from AnnualContributionStates entities
     */
    readonly removeAnnualContributionState = this.updater(
        (state: ProducerShopState, panelIdentifiers: PanelIdentifiers): ProducerShopState =>
            this.removeOneAnnualContributionState(state, panelIdentifiers),
    );

    /**
     * Remove current panel benefit local state. This includes EliminationPeriod, CoverageLevel, BenefitAmount
     */
    readonly removeLocalState = this.updater((state: ProducerShopState, panelIdentifiers: PanelIdentifiers): ProducerShopState => {
        const removedEliminationPeriodState = this.removeOneEnrollmentPeriodState(state, panelIdentifiers);
        const removedCoverageLevelState = this.removeOneCoverageLevelState(removedEliminationPeriodState, panelIdentifiers);
        const removedDependentAgeState = this.removeOneDependentAgeState(removedCoverageLevelState, panelIdentifiers);
        return this.removeOneBenefitAmountState(removedDependentAgeState, panelIdentifiers);
    });

    constructor(private readonly ngrxStore: NGRXStore) {
        // initial state
        super(PRODUCER_SHOP_COMPONENT_STORE_DEFAULT_STATE);
    }

    /**
     * @returns {Observable<AsyncData<RiskClass[]>>} RiskClasses AsyncData from dropdown
     */
    selectRiskClasses(): Observable<AsyncData<RiskClass[]>> {
        return this.select((state) => state.riskClasses);
    }

    /**
     * AsyncDatas that don't have AsyncStatus.SUCCEEDED, they are filtered.
     *
     * @returns {Observable<RiskClass[]>} RiskClasses from dropdown
     */
    selectRiskClassesOnAsyncValue(): Observable<RiskClass[]> {
        return this.selectRiskClasses().pipe(this.ngrxStore.filterForAsyncValue());
    }

    /**
     * {@link selectRiskClassesOnAsyncValue} normally returns an array of a single RiskClass.
     *
     * When this happens, the single RiskClass will always be returned.
     *
     * Whenever there are two, this is because the RiskClasses are for Dual PEO.
     * First RiskClass is for Accident and the second is for Short Term Disability.
     *
     * @param productId {number} Determines which RiskClass to return if there are two (Dual PEO)
     * @returns {RiskClass} RiskClass based on product
     */
    selectProductRiskClassOnAsyncValue(productId: number, carrierId: number): Observable<RiskClass | null> {
        return this.selectRiskClassesOnAsyncValue().pipe(
            map((riskClasses) => {
                // If plan's carrierId isn't AFLAC, return null since RiskClass doesn't apply
                if (carrierId !== CarrierId.AFLAC) {
                    return null;
                }

                // When there are more than one RiskClass, the second RiskClass is specific to short term disability
                if (productId === ProductId.SHORT_TERM_DISABILITY) {
                    return riskClasses[riskClasses.length - 1] ?? null;
                }

                return riskClasses[0] ?? null;
            }),
        );
    }

    /**
     * Returns the RiskClass for the selected product
     *
     * @returns {RiskClass} RiskClass based on selected product
     */
    getSelectedProductRiskClassOnAsyncValue(): Observable<RiskClass | null> {
        return combineLatest([this.selectedProductId$, this.selectedCarrierId$]).pipe(
            switchMap(([selectedProductId, selectedCarrierId]) =>
                this.selectProductRiskClassOnAsyncValue(selectedProductId, selectedCarrierId),
            ),
        );
    }

    /**
     * @returns {Observable<AsyncData<ProductCoverageDate[]>>} ProductCoverageDates AsyncData from dropdown
     */
    selectProductCoverageDates(): Observable<AsyncData<ProductCoverageDate[]>> {
        return this.select((state) => state.productCoverageDates);
    }

    /**
     * AsyncDatas that don't have AsyncStatus.SUCCEEDED, they are filtered.
     *
     * @returns {Observable<ProductCoverageDate[]>}
     */
    selectProductCoverageDatesOnAsyncValue(): Observable<ProductCoverageDate[]> {
        return this.selectProductCoverageDates().pipe(this.ngrxStore.filterForAsyncValue());
    }

    /**
     * TODO [Coverage Dates]:
     * @param specificProductId
     * @returns TODO [Coverage Dates]: update this ProductCoverageDate for <insert here>
     */
    selectProductCoverageDateOnAsyncValue(specificProductId: number): Observable<ProductCoverageDate | null> {
        return this.selectProductCoverageDatesOnAsyncValue().pipe(
            map((coverageDates) => coverageDates.find(({ productId }) => productId === specificProductId) ?? null),
        );
    }

    /**
     * TODO [Coverage Dates]:
     * @returns TODO [Coverage Dates]: update this ProductCoverageDate for <insert here>
     */
    getSelectedProductCoverageDateOnAsyncValue(): Observable<ProductCoverageDate | null> {
        return this.selectedProductId$.pipe(switchMap((selecteProductId) => this.selectProductCoverageDateOnAsyncValue(selecteProductId)));
    }

    /**
     * @returns {Observable<AsyncData<MoreSettings>>} MoreSettings AsyncData from dropdown
     */
    selectMoreSettings(): Observable<AsyncData<MoreSettings>> {
        return this.select((state) => state.moreSettings);
    }

    /**
     * @returns {Observable<AsyncData<ApplicantDetails>>} ApplicantDetails AsyncData from dropdown
     */
    selectApplicantDetails(): Observable<AsyncData<ApplicantDetails>> {
        return this.select((state) => state.applicantDetails);
    }

    /**
     * @returns {Observable<AsyncData<SpouseDetails>>} SpouseDetails AsyncData from dropdown
     */
    selectSpouseDetails(): Observable<AsyncData<SpouseDetails>> {
        return this.select((state) => state.spouseDetails);
    }

    /**
     * AsyncDatas that don't have AsyncStatus.SUCCEEDED, they are filtered.
     *
     * @returns {Observable<MoreSettings>} MoreSettings from dropdown
     */
    selectMoreSettingsOnAsyncValue(): Observable<MoreSettings> {
        return this.selectMoreSettings().pipe(this.ngrxStore.filterForAsyncValue());
    }

    /**
     * AsyncDatas that don't have AsyncStatus.SUCCEEDED, they are filtered.
     *
     * @returns {Observable<ApplicantDetails>} ApplicantDetails from dropdown
     */
    selectApplicantDetailsOnAsyncValue(): Observable<ApplicantDetails> {
        return this.selectApplicantDetails().pipe(this.ngrxStore.filterForAsyncValue());
    }

    /**
     * AsyncDatas that don't have AsyncStatus.SUCCEEDED, they are filtered.
     *
     * @returns {Observable<SpouseDetails>} SpouseDetails from dropdown
     */
    selectSpouseDetailsOnAsyncValue(): Observable<SpouseDetails> {
        return this.selectSpouseDetails().pipe(this.ngrxStore.filterForAsyncValue());
    }

    /**
     * @returns {Observable<AsyncData<TobaccoInformation>>} TobaccoInformation AsyncData from dropdown
     */
    selectTobaccoInformation(): Observable<AsyncData<TobaccoInformation>> {
        return this.select((state) => state.tobaccoInformation);
    }

    /**
     * AsyncDatas that don't have AsyncStatus.SUCCEEDED, they are filtered.
     *
     * @returns {Observable<TobaccoInformation>} TobaccoInformation from dropdown
     */
    selectTobaccoInformationOnAsyncValue(): Observable<TobaccoInformation> {
        return this.selectTobaccoInformation().pipe(this.ngrxStore.filterForAsyncValue());
    }

    /**
     * @returns {Observable<AsyncData<ProductCoverageDate[]>>} ProductCoverageDates AsyncData from dropdown
     */
    selectEnrollmentDetailsStates(): Observable<AsyncData<Record<number, EnrollmentDetailsState>>> {
        return this.select((state) => state.enrollmentDetailsStates);
    }

    /**
     * AsyncDatas that don't have AsyncStatus.SUCCEEDED, they are filtered.
     *
     * @returns {Observable<ProductCoverageDate[]>}
     */
    selectEnrollmentDetailsStatesOnAsyncValue(): Observable<Record<number, EnrollmentDetailsState>> {
        return this.selectEnrollmentDetailsStates().pipe(this.ngrxStore.filterForAsyncValue());
    }

    /**
     * Gets a Dictionary of AnsweredKnockoutQuestion where the keys are the AnsweredKnockoutQuestion key property (and not the ids)
     *
     * @returns {Observable<Dictionary<AnsweredKnockoutQuestion>>} Observable<Dictionary<AnsweredKnockoutQuestion>>
     */
    selectAnsweredKnockoutQuestions(): Observable<Dictionary<AnsweredKnockoutQuestion>> {
        return this.select((state) => state.answeredKnockoutQuestions.entities);
    }

    /**
     * Gets a Dictionary of PlanKnockoutEligibility where the keys are the PlanKnockoutEligibility id
     *
     * @returns {Observable<Dictionary<PlanKnockoutEligibility>>} Observable<Dictionary<PlanKnockoutEligibility>>
     */
    selectPlanKnockoutEligibility(): Observable<Dictionary<PlanKnockoutEligibility>> {
        return this.select((state) => state.planKnockoutEligibility.entities);
    }

    /**
     * Gets PlanKnockoutEligibility filtered by plan offering id
     *
     * @param planOfferingId {number} - planOfferingId
     * @returns {Observable<PlanKnockoutEligibility>} Observable<PlanKnockoutEligibility>
     */
    getKnockoutEligibilityByPlanOfferingId(planOfferingId: number): Observable<PlanKnockoutEligibility | null> {
        return this.selectPlanKnockoutEligibility().pipe(map((entities) => entities[planOfferingId] ?? null));
    }

    /**
     * TODO [Knockout Questions]: what is this used for? What is KnockoutDialogResponse in that context?
     * @returns {Observable<KnockoutDialogResponse[]>} Observable<KnockoutDialogResponse[]>
     */
    selectKnockoutDialogResponse(): Observable<KnockoutDialogResponse[]> {
        return this.select((state) => state.knockoutDialogResponse);
    }

    /**
     * Get EliminationPeriodState filtered by BASE PlanOffering id
     *
     * @param panelIdentifiers {PanelIdentifiers} - PlanOffering id + Enrollment id + CartItem id
     * @returns {Observable<EliminationPeriodState | null>} selected BenefitAmount
     */
    getEliminationPeriodState(panelIdentifiers: PanelIdentifiers): Observable<EliminationPeriodState | null> {
        const id = getPanelEntityId(panelIdentifiers);
        return this.select((state) => state.eliminationPeriodStates.entities[id] ?? null).pipe(this.ngrxStore.filterForNonNullish());
    }

    /**
     * Get CoverageLevelState filtered by BASE PlanOffering id
     *
     * @param panelIdentifiers {PanelIdentifiers} - PlanOffering id + Enrollment id + CartItem id
     * @returns {Observable<CoverageLevelState | null>} selected BenefitAmount
     */
    getCoverageLevelState(panelIdentifiers: PanelIdentifiers): Observable<CoverageLevelState | null> {
        const id = getPanelEntityId(panelIdentifiers);
        return this.select((state) => state.coverageLevelStates.entities[id] ?? null).pipe(this.ngrxStore.filterForNonNullish());
    }

    /**
     * Gets coverage level for all available plan panel
     * @returns {Observable<Dictionary<CoverageLevelState> | null>} Dictionary of coverage level states
     */
    getCoverageLevelStates(): Observable<Dictionary<CoverageLevelState> | null> {
        return this.select((state) => state.coverageLevelStates.entities ?? null).pipe(this.ngrxStore.filterForNonNullish());
    }

    /**
     * Get BenefitAmountState filtered by BASE PlanOffering id
     *
     * @param panelIdentifiers {PanelIdentifiers} - PlanOffering id + Enrollment id + CartItem id
     * @returns {Observable<BenefitAmountState | null>} Observable<BenefitAmountState | null>
     */
    getBenefitAmountState(panelIdentifiers: PanelIdentifiers): Observable<BenefitAmountState | null> {
        const id = getPanelEntityId(panelIdentifiers);
        return this.select((state) => state.benefitAmountStates.entities[id] ?? null).pipe(this.ngrxStore.filterForNonNullish());
    }

    /**
     * Get DependentAgeState filtered by BASE PlanOffering id
     *
     * @param panelIdentifiers {PanelIdentifiers} - PlanOffering id + Enrollment id + CartItem id
     * @returns {Observable<DependentAgeState | null>} Observable<DependentAgeState | null>
     */
    getDependentAgeState(panelIdentifiers: PanelIdentifiers): Observable<DependentAgeState | null> {
        const id = getPanelEntityId(panelIdentifiers);
        return this.select((state) => state.dependentAgeStates.entities[id] ?? null).pipe(this.ngrxStore.filterForNonNullish());
    }

    /**
     * Get AnnualContributionState filtered by BASE PlanOffering id
     *
     * @param panelIdentifiers {PanelIdentifiers} - PlanOffering id + Enrollment id + CartItem id
     * @returns {Observable<AnnualContributionState | null>} Observable<AnnualContributionState | null>
     */
    getAnnualContributionState(panelIdentifiers: PanelIdentifiers): Observable<AnnualContributionState | null> {
        const id = getPanelEntityId(panelIdentifiers);
        return this.select((state) => state.annualContributionStates.entities[id] ?? null).pipe(this.ngrxStore.filterForNonNullish());
    }

    /**
     * Gets benefit amount states for all plan panel
     * @returns {Observable<Dictionary<BenefitAmountState> | null>} Dictionary of benefit amount states
     */
    getBenefitAmountStates(): Observable<Dictionary<BenefitAmountState> | null> {
        return this.select((state) => state.benefitAmountStates.entities ?? null).pipe(this.ngrxStore.filterForNonNullish());
    }

    /**
     * Get ProducerShopState with removed EnrollmentPeriodState
     * @param state {ProducerShopState} local state for Producer Shop. State for things that require user interaction
     * like selecting a value in a dropdown
     * @param panelIdentifiers {PanelIdentifiers} - PlanOffering id + Enrollment id + CartItem id
     * @returns {ProducerShopState} ProducerShopState with removed EnrollmentPeriodState
     */
    removeOneEnrollmentPeriodState(state: ProducerShopState, panelIdentifiers: PanelIdentifiers): ProducerShopState {
        const entityId = getPanelEntityId(panelIdentifiers);
        return {
            ...state,
            eliminationPeriodStates: eliminationPeriodStatesAdapter.removeOne(entityId, state.eliminationPeriodStates),
        };
    }

    /**
     * Get ProducerShopState with removed CoverageLevelState
     * @param state {ProducerShopState} local state for Producer Shop. State for things that require user interaction
     * like selecting a value in a dropdown
     * @param panelIdentifiers {PanelIdentifiers} - PlanOffering id + Enrollment id + CartItem id
     * @returns {ProducerShopState} ProducerShopState with removed CoverageLevelState
     */
    removeOneCoverageLevelState(state: ProducerShopState, panelIdentifiers: PanelIdentifiers): ProducerShopState {
        const entityId = getPanelEntityId(panelIdentifiers);
        return {
            ...state,
            coverageLevelStates: coverageLevelStatesAdapter.removeOne(entityId, state.coverageLevelStates),
        };
    }

    /**
     * Get ProducerShopState with removed BenefitAmountState
     * @param state {ProducerShopState} local state for Producer Shop. State for things that require user interaction
     * like selecting a value in a dropdown
     * @param panelIdentifiers {PanelIdentifiers} - PlanOffering id + Enrollment id + CartItem id
     * @returns {ProducerShopState} ProducerShopState with removed BenefitAmountState
     */
    removeOneBenefitAmountState(state: ProducerShopState, panelIdentifiers: PanelIdentifiers): ProducerShopState {
        const entityId = getPanelEntityId(panelIdentifiers);
        return {
            ...state,
            benefitAmountStates: benefitAmountStatesAdapter.removeOne(entityId, state.benefitAmountStates),
        };
    }

    /**
     * Get ProducerShopState with removed DependentAgeState
     * @param state {ProducerShopState} local state for Producer Shop. State for things that require user interaction
     * like selecting a value in a dropdown
     * @param panelIdentifiers {PanelIdentifiers} - PlanOffering id + Enrollment id + CartItem id
     * @returns {ProducerShopState} ProducerShopState with removed DependentAgeState
     */
    removeOneDependentAgeState(state: ProducerShopState, panelIdentifiers: PanelIdentifiers): ProducerShopState {
        const entityId = getPanelEntityId(panelIdentifiers);
        return {
            ...state,
            dependentAgeStates: dependentAgeStatesAdapter.removeOne(entityId, state.dependentAgeStates),
        };
    }

    /**
     * Get ProducerShopState with removed AnnualContributionState
     * @param state {ProducerShopState} local state for Producer Shop. State for things that require user interaction
     * @param panelIdentifiers {PanelIdentifiers} - PlanOffering id + Enrollment id + CartItem id
     * @returns {ProducerShopState} ProducerShopState with removed AnnualContributionState
     */
    removeOneAnnualContributionState(state: ProducerShopState, panelIdentifiers: PanelIdentifiers): ProducerShopState {
        const entityId = getPanelEntityId(panelIdentifiers);
        return {
            ...state,
            annualContributionStates: annualContributionStatesAdapter.removeOne(entityId, state.annualContributionStates),
        };
    }
}
