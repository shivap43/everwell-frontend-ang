import { Action, createReducer, on } from "@ngrx/store";
import {
    downloadRateSheetEntityAdapter,
    getRateSheetPlanSelectionsEntityId,
    getRateSheetPlanSeriesSettingsEntityId,
    initialState,
    rateSheetPlanSelectionsEntityAdapter,
    rateSheetPlanSeriesOptionBenefitAmountsEntityAdapter,
    rateSheetPlanSeriesOptionsEntityAdapter,
    rateSheetPlanSeriesSettingsEntityAdapter,
    State,
} from "./rate-sheets.state";
import * as RateSheetsActions from "./rate-sheets.actions";
import { AsyncStatus, RateSheetPlanSeriesSettings } from "@empowered/constants";

export const RATE_SHEETS_FEATURE_KEY = "ratesheets";

export interface RateSheetsPartialState {
    readonly [RATE_SHEETS_FEATURE_KEY]: State;
}

const rateSheetsReducer = createReducer(
    initialState,

    on(
        RateSheetsActions.setSelectedProductIndex,
        (state, { productIndex }): State => ({
            ...state,
            selectedProductIndex: productIndex,
        }),
    ),

    on(
        RateSheetsActions.setSelectedPlanSeries,
        (state, { planSeries }): State => ({
            ...state,
            selectedPlanSeries: { planSeries },
        }),
    ),

    on(
        RateSheetsActions.setRateSheetPlanSeriesSettings,
        (state, { productId, planSeriesId, settings }): State => ({
            ...state,
            rateSheetPlanSeriesSettingsEntities: rateSheetPlanSeriesSettingsEntityAdapter.upsertOne(
                {
                    identifiers: { productId, planSeriesId },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: {
                            planSeriesId,
                            settings: {
                                ...state.rateSheetPlanSeriesSettingsEntities.entities[
                                    getRateSheetPlanSeriesSettingsEntityId({ productId, planSeriesId })
                                ]?.data.value?.settings,
                                ...settings,
                            },
                        } as RateSheetPlanSeriesSettings,
                        error: null,
                    },
                },
                { ...state.rateSheetPlanSeriesSettingsEntities },
            ),
        }),
    ),

    on(
        RateSheetsActions.setRateSheetPlanSeriesSelections,
        (state, { productId, planSeriesId, planSelections, planSeriesCategory }): State => ({
            ...state,
            rateSheetPlanSelectionsEntities: rateSheetPlanSelectionsEntityAdapter.upsertOne(
                {
                    identifiers: {
                        productId,
                        planSeriesId,
                        planSeriesCategory,
                    },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: planSelections,
                        error: null,
                    },
                },
                { ...state.rateSheetPlanSelectionsEntities },
            ),
        }),
    ),

    on(
        RateSheetsActions.removeRateSheetPlanSeriesSelections,
        (state, { productId, planSeriesId, planSeriesCategory }): State => ({
            ...state,
            rateSheetPlanSelectionsEntities: rateSheetPlanSelectionsEntityAdapter.removeOne(
                getRateSheetPlanSelectionsEntityId({ productId, planSeriesId, planSeriesCategory }),
                state.rateSheetPlanSelectionsEntities,
            ),
        }),
    ),

    on(
        RateSheetsActions.removeAllRateSheetPlanSeriesSelections,
        (state): State => ({
            ...state,
            rateSheetPlanSelectionsEntities: rateSheetPlanSelectionsEntityAdapter.removeAll(state.rateSheetPlanSelectionsEntities),
        }),
    ),

    on(
        RateSheetsActions.loadPlanSeries,
        (state): State => ({
            ...state,
            planSeries: {
                status: AsyncStatus.LOADING,
            },
        }),
    ),

    on(
        RateSheetsActions.loadPlanSeriesSuccess,
        (state, { planSeries }): State => ({
            ...state,
            planSeries: {
                status: AsyncStatus.SUCCEEDED,
                value: planSeries,
                error: null,
            },
        }),
    ),

    on(
        RateSheetsActions.loadPlanSeriesFailure,
        (state, { error }): State => ({
            ...state,
            planSeries: {
                status: AsyncStatus.FAILED,
                value: null,
                error,
            },
        }),
    ),

    on(
        RateSheetsActions.loadQuickQuotePlans,
        (state): State => ({
            ...state,
            quickQuotePlans: {
                status: AsyncStatus.LOADING,
            },
        }),
    ),

    on(
        RateSheetsActions.loadQuickQuotePlansSuccess,
        (state, { quickQuotePlans }): State => ({
            ...state,
            quickQuotePlans: {
                status: AsyncStatus.SUCCEEDED,
                value: quickQuotePlans,
                error: null,
            },
        }),
    ),

    on(
        RateSheetsActions.loadQuickQuotePlansFailure,
        (state, { error }): State => ({
            ...state,
            quickQuotePlans: {
                status: AsyncStatus.FAILED,
                value: null,
                error,
            },
        }),
    ),

    on(
        RateSheetsActions.loadRateSheetPlanSeriesOptions,
        (rateSheetState, { productId, planSeriesId }): State => ({
            ...rateSheetState,
            rateSheetPlanSeriesOptionsEntities: rateSheetPlanSeriesOptionsEntityAdapter.setOne(
                {
                    identifiers: {
                        productId,
                        planSeriesId,
                    },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...rateSheetState.rateSheetPlanSeriesOptionsEntities },
            ),
        }),
    ),

    on(
        RateSheetsActions.loadRateSheetPlanSeriesOptionsSuccess,
        (rateSheetState, { rateSheetPlanSeriesOptionsEntity }): State => ({
            ...rateSheetState,
            rateSheetPlanSeriesOptionsEntities: rateSheetPlanSeriesOptionsEntityAdapter.setOne(
                {
                    identifiers: { ...rateSheetPlanSeriesOptionsEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [...rateSheetPlanSeriesOptionsEntity.data],
                        error: null,
                    },
                },
                { ...rateSheetState.rateSheetPlanSeriesOptionsEntities },
            ),
        }),
    ),

    on(
        RateSheetsActions.loadRateSheetPlanSeriesOptionsFailure,
        (rateSheetState, { error }): State => ({
            ...rateSheetState,
            rateSheetPlanSeriesOptionsEntities: rateSheetPlanSeriesOptionsEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...rateSheetState.rateSheetPlanSeriesOptionsEntities },
            ),
        }),
    ),

    on(
        RateSheetsActions.downloadRateSheet,
        (
            rateSheetState,
            { state, partnerAccountType, payrollFrequencyId, riskClassId, rateSheetTitle, zipCode, sicCode, eligibleSubscribers },
        ): State => ({
            ...rateSheetState,
            downloadRateSheetEntities: downloadRateSheetEntityAdapter.setOne(
                {
                    identifiers: {
                        state,
                        partnerAccountType,
                        payrollFrequencyId,
                        riskClassId,
                        rateSheetTitle,
                        zipCode,
                        sicCode,
                        eligibleSubscribers,
                    },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...rateSheetState.downloadRateSheetEntities },
            ),
        }),
    ),

    on(
        RateSheetsActions.downloadRateSheetSuccess,
        (rateSheetState, { downloadRateSheetEntity }): State => ({
            ...rateSheetState,
            downloadRateSheetEntities: downloadRateSheetEntityAdapter.setOne(
                {
                    identifiers: { ...downloadRateSheetEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: downloadRateSheetEntity.data,
                        error: null,
                    },
                },
                { ...rateSheetState.downloadRateSheetEntities },
            ),
        }),
    ),

    on(
        RateSheetsActions.downloadRateSheetFailure,
        (rateSheetState, { error }): State => ({
            ...rateSheetState,
            downloadRateSheetEntities: downloadRateSheetEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...rateSheetState.downloadRateSheetEntities },
            ),
        }),
    ),

    on(RateSheetsActions.clearRateSheetPlanSeriesSettings, (rateSheetState) => ({
        ...rateSheetState,
        rateSheetPlanSeriesSettingsEntities: rateSheetPlanSeriesSettingsEntityAdapter.removeAll(
            rateSheetState.rateSheetPlanSeriesSettingsEntities,
        ),
    })),

    on(RateSheetsActions.clearRateSheetPlanSeriesOptions, (rateSheetState) => ({
        ...rateSheetState,
        rateSheetPlanSeriesOptionsEntities: rateSheetPlanSeriesOptionsEntityAdapter.removeAll(
            rateSheetState.rateSheetPlanSeriesOptionsEntities,
        ),
    })),

    on(
        RateSheetsActions.loadRateSheetPlanSeriesOptionBenefitAmounts,
        (rateSheetState, { planSeriesId, state, partnerAccountType, payrollFrequencyId, riskClassId, minAge, maxAge }): State => ({
            ...rateSheetState,
            rateSheetPlanSeriesOptionBenefitAmountsEntities: rateSheetPlanSeriesOptionBenefitAmountsEntityAdapter.setOne(
                {
                    identifiers: {
                        planSeriesId,
                        state,
                        partnerAccountType,
                        payrollFrequencyId,
                        riskClassId,
                        minAge,
                        maxAge,
                    },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...rateSheetState.rateSheetPlanSeriesOptionBenefitAmountsEntities },
            ),
        }),
    ),

    on(
        RateSheetsActions.loadRateSheetPlanSeriesOptionBenefitAmountsSuccess,
        (rateSheetState, { rateSheetPlanSeriesOptionBenefitAmountsEntity }): State => ({
            ...rateSheetState,
            rateSheetPlanSeriesOptionBenefitAmountsEntities: rateSheetPlanSeriesOptionBenefitAmountsEntityAdapter.setOne(
                {
                    identifiers: { ...rateSheetPlanSeriesOptionBenefitAmountsEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [...rateSheetPlanSeriesOptionBenefitAmountsEntity.data],
                        error: null,
                    },
                },
                { ...rateSheetState.rateSheetPlanSeriesOptionBenefitAmountsEntities },
            ),
        }),
    ),

    on(
        RateSheetsActions.loadRateSheetPlanSeriesOptionBenefitAmountsFailure,
        (rateSheetState, { error }): State => ({
            ...rateSheetState,
            rateSheetPlanSeriesOptionBenefitAmountsEntities: rateSheetPlanSeriesOptionBenefitAmountsEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...rateSheetState.rateSheetPlanSeriesOptionBenefitAmountsEntities },
            ),
        }),
    ),

    on(RateSheetsActions.resetRateSheetsState, () => ({
        ...initialState,
    })),
);

// reducer function to mutate the rate sheet state when any rate sheet related action is triggered
export function reducer(state: State | undefined, action: Action): State {
    return rateSheetsReducer(state, action);
}
