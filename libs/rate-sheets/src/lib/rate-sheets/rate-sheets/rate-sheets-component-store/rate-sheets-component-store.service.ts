import { Injectable } from "@angular/core";
import { AsyncData, CountryState, PayFrequency, RateSheetSettings, RiskClass } from "@empowered/constants";
import { NGRXStore } from "@empowered/ngrx-store";
import { ComponentStore } from "@ngrx/component-store";
import { combineLatest, Observable } from "rxjs";
import { distinctUntilChanged, map, startWith } from "rxjs/operators";
import {
    benefitAmountStatesAdapter,
    coverageLevelStatesAdapter,
    eliminationPeriodStatesAdapter,
    getPanelEntityId,
    planSeriesPlansStatesAdapter,
    RATE_SHEETS_COMPONENT_STORE_DEFAULT_STATE,
    riderStatesAdapter,
} from "./rate-sheets-component-store.constant";
import {
    RateSheetBenefitAmountState,
    RateSheetCoverageLevelState,
    RateSheetEliminationPeriodState,
    RateSheetPanelIdentifiers,
    RateSheetPlanSeriesPlansState,
    RateSheetMoreSettings,
    RateSheetsComponentStoreState,
    RateSheetRidersState,
    AvailableRidersMap,
} from "./rate-sheets-component-store.model";

@Injectable({
    providedIn: "root",
})
export class RateSheetsComponentStoreService extends ComponentStore<RateSheetsComponentStoreState> {
    readonly setCountryState = this.updater(
        (state: RateSheetsComponentStoreState, countryState: AsyncData<CountryState>): RateSheetsComponentStoreState => ({
            ...state,
            countryState,
        }),
    );

    readonly setChannel = this.updater(
        (state: RateSheetsComponentStoreState, channel: AsyncData<string>): RateSheetsComponentStoreState => ({
            ...state,
            channel,
        }),
    );

    readonly setPayFrequency = this.updater(
        (state: RateSheetsComponentStoreState, paymentFrequency: AsyncData<PayFrequency>): RateSheetsComponentStoreState => ({
            ...state,
            paymentFrequency,
        }),
    );

    readonly setRiskClass = this.updater(
        (state: RateSheetsComponentStoreState, riskClass: AsyncData<RiskClass>): RateSheetsComponentStoreState => ({
            ...state,
            riskClass,
        }),
    );

    readonly setAvailableRidersMap = this.updater(
        (state: RateSheetsComponentStoreState, availableRidersMap: AsyncData<AvailableRidersMap>): RateSheetsComponentStoreState => ({
            ...state,
            availableRidersMap,
        }),
    );

    readonly setMoreSettings = this.updater(
        (state: RateSheetsComponentStoreState, moreSettings: AsyncData<RateSheetMoreSettings>): RateSheetsComponentStoreState => ({
            ...state,
            moreSettings,
        }),
    );

    /**
     * Add PlanSeriesPlansStates to RateSheetPlanSeriesPlansState entities without overriding existing RateSheetPlanSeriesPlansState
     */
    readonly addPlanSeriesPlansState = this.updater(
        (state: RateSheetsComponentStoreState, planSeriesPlansState: RateSheetPlanSeriesPlansState): RateSheetsComponentStoreState => ({
            ...state,
            planSeriesPlansStates: planSeriesPlansStatesAdapter.addOne(planSeriesPlansState, state.planSeriesPlansStates),
        }),
    );

    /**
     * Set PlanSeriesPlansStates to RateSheetPlanSeriesPlansState entities and overriding existing RateSheetPlanSeriesPlansState
     */
    readonly upsertPlanSeriesPlansState = this.updater(
        (state: RateSheetsComponentStoreState, planSeriesPlansState: RateSheetPlanSeriesPlansState): RateSheetsComponentStoreState => ({
            ...state,
            planSeriesPlansStates: planSeriesPlansStatesAdapter.upsertOne(planSeriesPlansState, state.planSeriesPlansStates),
        }),
    );

    /**
     * Remove current panel RateSheetPlanSeriesPlansState from RateSheetPlanSeriesPlansState entities
     */
    readonly removePlanSeriesPlansState = this.updater(
        (state: RateSheetsComponentStoreState, panelIdentifiers: RateSheetPanelIdentifiers): RateSheetsComponentStoreState =>
            this.removeOnePlanSeriesPlansState(state, panelIdentifiers),
    );

    /**
     * Add EliminationPeriodStates to EliminationPeriodState entities without overriding existing EliminationPeriodState
     */
    readonly addEliminationPeriodState = this.updater(
        (state: RateSheetsComponentStoreState, eliminationPeriodState: RateSheetEliminationPeriodState): RateSheetsComponentStoreState => ({
            ...state,
            eliminationPeriodStates: eliminationPeriodStatesAdapter.addOne(eliminationPeriodState, state.eliminationPeriodStates),
        }),
    );

    /**
     * Set EliminationPeriodStates to EliminationPeriodState entities and overriding existing EliminationPeriodState
     */
    readonly upsertEliminationPeriodState = this.updater(
        (state: RateSheetsComponentStoreState, eliminationPeriodState: RateSheetEliminationPeriodState): RateSheetsComponentStoreState => ({
            ...state,
            eliminationPeriodStates: eliminationPeriodStatesAdapter.upsertOne(eliminationPeriodState, state.eliminationPeriodStates),
        }),
    );

    /**
     * Remove current panel EliminationPeriodState from EliminationPeriodState entities
     */
    readonly removeEliminationPeriodState = this.updater(
        (state: RateSheetsComponentStoreState, panelIdentifiers: RateSheetPanelIdentifiers): RateSheetsComponentStoreState =>
            this.removeOneEnrollmentPeriodState(state, panelIdentifiers),
    );

    /**
     * Add CoverageLevelStates to CoverageLevelState entities without overriding existing CoverageLevelState
     */
    readonly addCoverageLevelState = this.updater(
        (state: RateSheetsComponentStoreState, coverageLevelState: RateSheetCoverageLevelState): RateSheetsComponentStoreState => ({
            ...state,
            coverageLevelStates: coverageLevelStatesAdapter.addOne(coverageLevelState, state.coverageLevelStates),
        }),
    );

    /**
     * Set CoverageLevelStates to CoverageLevelState entities and overriding existing CoverageLevelState
     */
    readonly upsertCoverageLevelState = this.updater(
        (state: RateSheetsComponentStoreState, coverageLevelState: RateSheetCoverageLevelState): RateSheetsComponentStoreState => ({
            ...state,
            coverageLevelStates: coverageLevelStatesAdapter.upsertOne(coverageLevelState, state.coverageLevelStates),
        }),
    );

    /**
     * Remove current panel coverage level state from CoverageLevelState entities
     */
    readonly removeCoverageLevelState = this.updater(
        (state: RateSheetsComponentStoreState, panelIdentifiers: RateSheetPanelIdentifiers): RateSheetsComponentStoreState =>
            this.removeOneCoverageLevelState(state, panelIdentifiers),
    );

    /**
     * Add BenefitAmountStates to BenefitAmountState entities without overriding existing BenefitAmountState
     */
    readonly addBenefitAmountState = this.updater(
        (state: RateSheetsComponentStoreState, benefitAmountStates: RateSheetBenefitAmountState): RateSheetsComponentStoreState => ({
            ...state,
            benefitAmountStates: benefitAmountStatesAdapter.addOne(benefitAmountStates, state.benefitAmountStates),
        }),
    );

    /**
     * Set BenefitAmountStates to BenefitAmountState entities and overriding existing BenefitAmountState
     */
    readonly upsertBenefitAmountState = this.updater(
        (state: RateSheetsComponentStoreState, benefitAmountState: RateSheetBenefitAmountState): RateSheetsComponentStoreState => ({
            ...state,
            benefitAmountStates: benefitAmountStatesAdapter.upsertOne(benefitAmountState, state.benefitAmountStates),
        }),
    );

    /**
     * Remove current panel benefit amount state from BenefitAmountState entities
     */
    readonly removeBenefitAmountState = this.updater(
        (state: RateSheetsComponentStoreState, panelIdentifiers: RateSheetPanelIdentifiers): RateSheetsComponentStoreState =>
            this.removeOneBenefitAmountState(state, panelIdentifiers),
    );

    /**
     * Add PlanSeriesPlansStates to RateSheetPlanSeriesPlansState entities without overriding existing RateSheetPlanSeriesPlansState
     */
    readonly addRidersState = this.updater(
        (state: RateSheetsComponentStoreState, riderState: RateSheetRidersState): RateSheetsComponentStoreState => ({
            ...state,
            riderStates: riderStatesAdapter.addOne(riderState, state.riderStates),
        }),
    );

    /**
     * Set PlanSeriesPlansStates to RateSheetPlanSeriesPlansState entities and overriding existing RateSheetPlanSeriesPlansState
     */
    readonly upsertRidersState = this.updater(
        (state: RateSheetsComponentStoreState, riderState: RateSheetRidersState): RateSheetsComponentStoreState => ({
            ...state,
            riderStates: riderStatesAdapter.upsertOne(riderState, state.riderStates),
        }),
    );

    /**
     * Remove current panel RateSheetPlanSeriesPlansState from RateSheetPlanSeriesPlansState entities
     */
    readonly removeRidersState = this.updater(
        (state: RateSheetsComponentStoreState, panelIdentifiers: RateSheetPanelIdentifiers): RateSheetsComponentStoreState =>
            this.removeOneRidersState(state, panelIdentifiers),
    );

    constructor(private readonly ngrxStore: NGRXStore) {
        // initial state
        super(RATE_SHEETS_COMPONENT_STORE_DEFAULT_STATE);
    }

    /**
     * @returns {Observable<AsyncData<CountryState>>} CounrtyState AsyncData from dropdown
     */
    selectCountryState(): Observable<AsyncData<CountryState>> {
        return this.select((state) => state.countryState);
    }

    /**
     * AsyncData that don't have AsyncStatus.SUCCEEDED, they are filtered.
     *
     * @returns {Observable<CountryState>} CountryState from dropdown
     */
    selectCountryStateOnAsyncValue(): Observable<CountryState> {
        return this.selectCountryState().pipe(this.ngrxStore.filterForAsyncValue());
    }

    /**
     * @returns {Observable<AsyncData<string>>} Channel AsyncData from dropdown
     */
    selectChannel(): Observable<AsyncData<string>> {
        return this.select((state) => state.channel);
    }

    /**
     * AsyncData that don't have AsyncStatus.SUCCEEDED, they are filtered.
     *
     * @returns {Observable<string>} Channel from dropdown
     */
    selectChannelOnAsyncValue(): Observable<string> {
        return this.selectChannel().pipe(this.ngrxStore.filterForAsyncValue());
    }

    /**
     * @returns {Observable<AsyncData<PayFrequency>>} PaymentFrequency AsyncData from dropdown
     */
    selectPaymentFrequency(): Observable<AsyncData<PayFrequency>> {
        return this.select((state) => state.paymentFrequency);
    }

    /**
     * AsyncData that don't have AsyncStatus.SUCCEEDED, they are filtered.
     *
     * @returns {Observable<PayFrequency>} PaymentFrequency from dropdown
     */
    selectPaymentFrequencyOnAsyncValue(): Observable<PayFrequency> {
        return this.selectPaymentFrequency().pipe(this.ngrxStore.filterForAsyncValue());
    }

    /**
     * @returns {Observable<AsyncData<RiskClass>>} RiskClass AsyncData from dropdown
     */
    selectRiskClass(): Observable<AsyncData<RiskClass>> {
        return this.select((state) => state.riskClass);
    }

    /**
     * AsyncData that don't have AsyncStatus.SUCCEEDED, they are filtered.
     *
     * @returns {Observable<RiskClass>} RiskClass from dropdown
     */
    selectRiskClassOnAsyncValue(): Observable<RiskClass> {
        return this.selectRiskClass().pipe(this.ngrxStore.filterForAsyncValue());
    }

    /**
     * @returns {Observable<AsyncData<AvailableRidersMap>>} AvailableRidersMap AsyncData for selected plan
     */
    selectAvailableRiderMap(): Observable<AsyncData<AvailableRidersMap>> {
        return this.select((state) => state.availableRidersMap);
    }

    /**
     * AsyncData that don't have AsyncStatus.SUCCEEDED, they are filtered.
     *
     * @returns {Observable<AvailableRidersMap>} AvailableRidersMap for selected plan
     */
    selectAvailableRiderMapOnAsyncValue(): Observable<AvailableRidersMap> {
        return this.selectAvailableRiderMap().pipe(this.ngrxStore.filterForAsyncValue());
    }

    /**
     * @returns {Observable<AsyncData<RateSheetMoreSettings>>} MoreSettings AsyncData from dropdown
     */
    selectMoreSettings(): Observable<AsyncData<RateSheetMoreSettings>> {
        return this.select((state) => state.moreSettings);
    }

    /**
     * AsyncData that don't have AsyncStatus.SUCCEEDED, they are filtered.
     *
     * @returns {Observable<RateSheetMoreSettings>} MoreSettings from dropdown
     */
    selectMoreSettingsOnAsyncValue(): Observable<RateSheetMoreSettings> {
        return this.selectMoreSettings().pipe(this.ngrxStore.filterForAsyncValue());
    }

    /**
     * Returns an observable of top-level rate sheet settings.
     *
     * @param state selected state
     * @param partnerAccountType selected partner account type
     * @param payrollFrequencyId id of the selected pay/deduction frequency
     * @param riskClassId id of the selected occupation class
     * @param zipCode id of the selected zip code
     * @param sicCode id of the selected SIC code
     * @param eligibleSubscribers number of eligible subscribers
     * @returns observable of settings
     */
    selectRateSheetSettings(): Observable<RateSheetSettings> {
        return combineLatest([
            this.selectCountryStateOnAsyncValue(),
            this.selectChannelOnAsyncValue(),
            this.selectPaymentFrequencyOnAsyncValue(),
            this.selectRiskClassOnAsyncValue(),
            this.selectMoreSettingsOnAsyncValue().pipe(startWith({ zipCode: null, sicCode: null, eligibleSubscribers: null })),
        ]).pipe(
            map(([countryState, channel, payFrequency, riskClass, { zipCode, sicCode, eligibleSubscribers }]) => ({
                state: countryState.abbreviation,
                partnerAccountType: channel,
                payrollFrequencyId: payFrequency.id,
                riskClassId: riskClass.id,
                zipCode,
                sicCode,
                eligibleSubscribers,
            })),
            distinctUntilChanged((a, b) => this.rateSheetSettingsEqual(a, b)),
        );
    }

    /**
     * Compare and return whether rate sheet settings changed.
     *
     * @param first first object
     * @param second second object
     * @returns true if for all keys in first second[key] equals first[key]
     */
    rateSheetSettingsEqual(first: RateSheetSettings, second: RateSheetSettings): boolean {
        return Object.keys(first).every((key) => first[key] === second[key]);
    }
    /**
     * Get RateSheetPlanSeriesPlansState filtered by planSeries id
     *
     * @param panelIdentifiers {RateSheetPanelIdentifiers} - planSeriesId
     * @returns {Observable<RateSheetPlanSeriesPlansState | null>} selected planSeriesPlans
     */
    getPlanSeriesPlansState(panelIdentifiers: RateSheetPanelIdentifiers): Observable<RateSheetPlanSeriesPlansState | null> {
        const id = getPanelEntityId(panelIdentifiers);
        return this.select((state) => state.planSeriesPlansStates.entities[id] ?? null).pipe(this.ngrxStore.filterForNonNullish());
    }

    /**
     * Get EliminationPeriodState filtered by planSeries id
     *
     * @param panelIdentifiers {RateSheetPanelIdentifiers} - planSeriesId
     * @returns {Observable<RateSheetEliminationPeriodState | null>} selected BenefitAmount
     */
    getEliminationPeriodState(panelIdentifiers: RateSheetPanelIdentifiers): Observable<RateSheetEliminationPeriodState | null> {
        const id = getPanelEntityId(panelIdentifiers);
        return this.select((state) => state.eliminationPeriodStates.entities[id] ?? null).pipe(this.ngrxStore.filterForNonNullish());
    }

    /**
     * Get CoverageLevelState filtered by planSeries id
     *
     * @param panelIdentifiers {RateSheetPanelIdentifiers} - planSeriesId
     * @returns {Observable<RateSheetCoverageLevelState | null>} selected BenefitAmount
     */
    getCoverageLevelState(panelIdentifiers: RateSheetPanelIdentifiers): Observable<RateSheetCoverageLevelState | null> {
        const id = getPanelEntityId(panelIdentifiers);
        return this.select((state) => state.coverageLevelStates.entities[id] ?? null).pipe(this.ngrxStore.filterForNonNullish());
    }

    /**
     * Get BenefitAmountState filtered by planSeries id
     *
     * @param panelIdentifiers {RateSheetPanelIdentifiers} - planSeriesId
     * @returns {Observable<RateSheetBenefitAmountState | null>} Observable<BenefitAmountState | null>
     */
    getBenefitAmountState(panelIdentifiers: RateSheetPanelIdentifiers): Observable<RateSheetBenefitAmountState | null> {
        const id = getPanelEntityId(panelIdentifiers);
        return this.select((state) => state.benefitAmountStates.entities[id] ?? null).pipe(this.ngrxStore.filterForNonNullish());
    }

    /**
     * Get RateSheetRidersState filtered by planSeries id
     *
     * @param panelIdentifiers {RateSheetPanelIdentifiers} - planSeriesId
     * @returns {Observable<RateSheetRidersState | null>} Observable<RateSheetRidersState | null>
     */
    getRidersState(panelIdentifiers: RateSheetPanelIdentifiers): Observable<RateSheetRidersState | null> {
        const id = getPanelEntityId(panelIdentifiers);
        return this.select((state) => state.riderStates.entities[id] ?? null).pipe(this.ngrxStore.filterForNonNullish());
    }

    /**
     * Get RateSheetsComponentStoreState with removed RateSheetPlanSeriesPlansState
     * @param state {RateSheetsComponentStoreState} local state for RateSheets Shop. State for things that require user interaction
     * like checking a checkbox
     * @param panelIdentifiers {RateSheetPanelIdentifiers} - planSeriesId
     * @returns {RateSheetsComponentStoreState} RateSheetsComponentStoreState with removed RateSheetPlanSeriesPlansState
     */
    removeOnePlanSeriesPlansState(
        state: RateSheetsComponentStoreState,
        panelIdentifiers: RateSheetPanelIdentifiers,
    ): RateSheetsComponentStoreState {
        const entityId = getPanelEntityId(panelIdentifiers);
        return {
            ...state,
            planSeriesPlansStates: planSeriesPlansStatesAdapter.removeOne(entityId, state.planSeriesPlansStates),
        };
    }

    /**
     * Get RateSheetsComponentStoreState with removed EnrollmentPeriodState
     * @param state {RateSheetsComponentStoreState} local state for RateSheets Shop. State for things that require user interaction
     * like checking a checkbox
     * @param panelIdentifiers {RateSheetPanelIdentifiers} - planSeriesId
     * @returns {RateSheetsComponentStoreState} RateSheetsComponentStoreState with removed EnrollmentPeriodState
     */
    removeOneEnrollmentPeriodState(
        state: RateSheetsComponentStoreState,
        panelIdentifiers: RateSheetPanelIdentifiers,
    ): RateSheetsComponentStoreState {
        const entityId = getPanelEntityId(panelIdentifiers);
        return {
            ...state,
            eliminationPeriodStates: eliminationPeriodStatesAdapter.removeOne(entityId, state.eliminationPeriodStates),
        };
    }

    /**
     * Get RateSheetsComponentStoreState with removed CoverageLevelState
     * @param state {RateSheetsComponentStoreState} local state for RateSheets Shop. State for things that require user interaction
     * like checking a checkbox
     * @param panelIdentifiers {RateSheetPanelIdentifiers} - PlanSeriesId
     * @returns {RateSheetsComponentStoreState} RateSheetsComponentStoreState with removed CoverageLevelState
     */
    removeOneCoverageLevelState(
        state: RateSheetsComponentStoreState,
        panelIdentifiers: RateSheetPanelIdentifiers,
    ): RateSheetsComponentStoreState {
        const entityId = getPanelEntityId(panelIdentifiers);
        return {
            ...state,
            coverageLevelStates: coverageLevelStatesAdapter.removeOne(entityId, state.coverageLevelStates),
        };
    }

    /**
     * Get RateSheetsComponentStoreState with removed BenefitAmountState
     * @param state {RateSheetsComponentStoreState} local state for RateSheets Shop. State for things that require user interaction
     * like checking a checkbox
     * @param panelIdentifiers {RateSheetPanelIdentifiers} - PlanSeriesId
     * @returns {RateSheetsComponentStoreState} RateSheetsComponentStoreState with removed BenefitAmountState
     */
    removeOneBenefitAmountState(
        state: RateSheetsComponentStoreState,
        panelIdentifiers: RateSheetPanelIdentifiers,
    ): RateSheetsComponentStoreState {
        const entityId = getPanelEntityId(panelIdentifiers);
        return {
            ...state,
            benefitAmountStates: benefitAmountStatesAdapter.removeOne(entityId, state.benefitAmountStates),
        };
    }

    /**
     * Get RateSheetsComponentStoreState with removed RateSheetRidersState
     * @param state {RateSheetsComponentStoreState} local state for RateSheets Shop. State for things that require user interaction
     * like checking a checkbox
     * @param panelIdentifiers {RateSheetPanelIdentifiers} - PlanSeriesId
     * @returns {RateSheetsComponentStoreState} RateSheetsComponentStoreState with removed RateSheetRidersState
     */
    removeOneRidersState(state: RateSheetsComponentStoreState, panelIdentifiers: RateSheetPanelIdentifiers): RateSheetsComponentStoreState {
        const entityId = getPanelEntityId(panelIdentifiers);
        return {
            ...state,
            riderStates: riderStatesAdapter.removeOne(entityId, state.riderStates),
        };
    }
}
