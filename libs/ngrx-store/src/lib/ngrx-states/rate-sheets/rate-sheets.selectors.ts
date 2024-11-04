import {
    AsyncData,
    RateSheetPlanSeriesOption,
    RateSheetPlanSeriesSettings,
    RateSheetCoverageLevelOption,
    RateSheetBenefitAmount,
    RateSheetRider,
    RateSheetPlanSeriesOptionBenefitAmounts,
} from "@empowered/constants";
import { combineAsyncDatas, getAsyncDataFromEntitiesState, mapAsyncData } from "../../ngrx.store.helpers";
import { getCombinedPlanSeriesDetails } from "../../services/rate-sheets/rate-sheets-store-helper.service";
import { createFeatureSelector, createSelector, MemoizedSelector } from "@ngrx/store";
import {
    getDownloadRateSheetEntityId,
    getRateSheetPlanSelectionsEntityId,
    getRateSheetPlanSeriesOptionBenefitAmountsEntityId,
    getRateSheetPlanSeriesOptionsEntityId,
    State,
} from "./rate-sheets.state";
import { PlanSelections } from "@empowered/api";

export const RATE_SHEETS_FEATURE_KEY = "ratesheets";

export const getRateSheetsFeatureState = createFeatureSelector<State>(RATE_SHEETS_FEATURE_KEY);

// PlanSeries object selector
export const getPlanSeries = createSelector(getRateSheetsFeatureState, (state: State) => state.planSeries);

// Quick Quote plans selector
export const getQuickQuotePlans = createSelector(getRateSheetsFeatureState, (state: State) => state.quickQuotePlans);

// Selector to get selected product's index into the combined plan series data array
export const getSelectedProductIndex = createSelector(getRateSheetsFeatureState, (state: State) => state.selectedProductIndex);

// Get selected plan series
export const getSelectedPlanSeries = createSelector(getRateSheetsFeatureState, (state: State) => state.selectedPlanSeries);

// Get plan series settings entities
export const getRateSheetPlansSeriesSettingsEntities = createSelector(
    getRateSheetsFeatureState,
    (state: State) => state.rateSheetPlanSeriesSettingsEntities,
);

// Get plan series settings for the selected plan series id
export const getRateSheetPlansSeriesSettings = (
    productId: number,
    planSeriesId: number,
): MemoizedSelector<object, AsyncData<RateSheetPlanSeriesSettings>> =>
    createSelector(getRateSheetPlansSeriesSettingsEntities, (entitiesState) => {
        const id = getRateSheetPlanSeriesOptionsEntityId({
            productId,
            planSeriesId,
        });
        return getAsyncDataFromEntitiesState(entitiesState, id);
    });

// Get plan selections entities
export const getRateSheetPlanSelectionsEntities = createSelector(
    getRateSheetsFeatureState,
    (state: State) => state.rateSheetPlanSelectionsEntities,
);

// Get plan selections corresponding to specified plan series
export const getRateSheetPlanSelections = (
    productId: number,
    planSeriesId: number,
    planSeriesCategory?: string,
): MemoizedSelector<object, AsyncData<PlanSelections[]>> =>
    createSelector(getRateSheetPlanSelectionsEntities, (entitiesState) => {
        let tempId;
        if (planSeriesCategory) {
            tempId = getRateSheetPlanSelectionsEntityId({
                productId,
                planSeriesId,
                planSeriesCategory,
            });
        } else {
            tempId = getRateSheetPlanSelectionsEntityId({
                productId,
                planSeriesId,
            });
        }
        const id = tempId;
        return getAsyncDataFromEntitiesState(entitiesState, id);
    });

// Get products added to the rate sheet
export const getRateSheetProductSelections = createSelector(getRateSheetPlanSelectionsEntities, (selections) =>
    selections.ids.map(String).reduce((acc, curr) => (acc.includes(+curr) ? acc : [...acc, +curr.split("-")[0]]), [] as number[]),
);

// Get plan series entities included in rate sheet
export const getIncludedPlanSeries = createSelector(
    getRateSheetsFeatureState,
    (state: State) => state.rateSheetPlanSelectionsEntities.entities,
);

// Get combined plan series data array
export const getCombinedQuickQuotePlansAndPlanSeries = createSelector(
    getPlanSeries,
    getQuickQuotePlans,
    (planSeriesAsync, quickQuotePlansAsync) => {
        const combinedAsyncDatas = combineAsyncDatas([planSeriesAsync, quickQuotePlansAsync]);

        return mapAsyncData(combinedAsyncDatas, ({ value: [planSeries, quickQuotePlans] }) =>
            getCombinedPlanSeriesDetails(planSeries, quickQuotePlans),
        );
    },
);

// Selector to get selected product's details
export const getSelectedProduct = createSelector(
    getCombinedQuickQuotePlansAndPlanSeries,
    getSelectedProductIndex,
    (productDetailsAsync, selectedProductIndex) => mapAsyncData(productDetailsAsync, ({ value }) => value[selectedProductIndex]),
);

// #region RateSheetPlanSeriesOptions selector
export const getRateSheetPlanSeriesOptionsEntities = createSelector(
    getRateSheetsFeatureState,
    (state: State) => state.rateSheetPlanSeriesOptionsEntities,
);

// Get plan series options for the selected plan series id
export const getRateSheetPlanSeriesOptions = (
    productId: number,
    planSeriesId: number,
): MemoizedSelector<object, AsyncData<RateSheetPlanSeriesOption[]>> =>
    createSelector(getRateSheetPlanSeriesOptionsEntities, (entitiesState) => {
        const id = getRateSheetPlanSeriesOptionsEntityId({
            productId,
            planSeriesId,
        });
        return getAsyncDataFromEntitiesState(entitiesState, id);
    });
// #end region

export const getCoverageData = (planSeriesOptionsData: AsyncData<RateSheetPlanSeriesOption[]>): AsyncData<RateSheetCoverageLevelOption[]> =>
    mapAsyncData(planSeriesOptionsData, ({ value: planSeriesOptions }) => {
        const coverageOptions: RateSheetCoverageLevelOption[] = [];
        planSeriesOptions.forEach((plan) => {
            if (!plan.coverageLevelOptions?.some((data) => data.eliminationPeriod)) {
                plan.coverageLevelOptions?.forEach((planCoverageOptions) => {
                    if (!coverageOptions.find((option) => option.id === planCoverageOptions.id)) {
                        coverageOptions.push(planCoverageOptions);
                    }
                });
            }
        });
        return coverageOptions;
    });
export const getEliminationData = (
    planSeriesOptionsData: AsyncData<RateSheetPlanSeriesOption[]>,
): AsyncData<RateSheetCoverageLevelOption[]> =>
    mapAsyncData(planSeriesOptionsData, ({ value: planSeriesOptions }) => {
        const eliminationOptions: RateSheetCoverageLevelOption[] = [];
        planSeriesOptions.forEach((plan) => {
            if (plan.coverageLevelOptions?.some((data) => data.eliminationPeriod)) {
                plan.coverageLevelOptions?.forEach((planCoverageOptions) => {
                    if (!eliminationOptions.find((option) => option.id === planCoverageOptions.id)) {
                        eliminationOptions.push(planCoverageOptions);
                    }
                });
            }
        });
        return eliminationOptions;
    });

// Selector to get the coverage period options
export const getCoverageOptions = (
    productId: number,
    planSeriesId: number,
): MemoizedSelector<object, AsyncData<RateSheetCoverageLevelOption[]>> =>
    createSelector(getRateSheetPlanSeriesOptions(productId, planSeriesId), (planSeriesOptions) => getCoverageData(planSeriesOptions));

// Selector to get the elimination period options
export const getEliminationOptions = (
    productId: number,
    planSeriesId: number,
): MemoizedSelector<object, AsyncData<RateSheetCoverageLevelOption[]>> =>
    createSelector(getRateSheetPlanSeriesOptions(productId, planSeriesId), (planSeriesOptions) => getEliminationData(planSeriesOptions));

// #region getBenefitAmountOptions selector
export const getBenefitAmountData = (planSeriesOptionsData: AsyncData<RateSheetPlanSeriesOption[]>): AsyncData<RateSheetBenefitAmount[]> =>
    mapAsyncData(planSeriesOptionsData, ({ value: planSeriesOptions }) => {
        const benefitAmountOptions: RateSheetBenefitAmount[] = [];
        planSeriesOptions.forEach((plan) => {
            if (plan.benefitAmounts) {
                plan.benefitAmounts.forEach((benefitAmount) => {
                    if (
                        benefitAmountOptions.find((benefitAmountOption) => benefitAmountOption.amount === benefitAmount.amount) ===
                        undefined
                    ) {
                        benefitAmountOptions.push(benefitAmount);
                    }
                });
            }
        });
        return benefitAmountOptions;
    });

export const getBenefitAmountOptions = (
    productId: number,
    planSeriesId: number,
): MemoizedSelector<object, AsyncData<RateSheetBenefitAmount[]>> =>
    createSelector(getRateSheetPlanSeriesOptions(productId, planSeriesId), getSelectedProduct, (planSeriesOptions) =>
        getBenefitAmountData(planSeriesOptions),
    );
// #end region

export const getRiderData = (planSeriesOptionsData: AsyncData<RateSheetPlanSeriesOption[]>): AsyncData<RateSheetRider[]> =>
    mapAsyncData(planSeriesOptionsData, ({ value: planSeriesOptions }) =>
        // Return an array of riders without duplicate rider names
        planSeriesOptions.reduce<RateSheetRider[]>(
            (a, c) => [...a, ...c.riders?.filter((rider) => !a.some((addedRider) => addedRider.planName === rider.planName))],
            [],
        ),
    );

// Selector to get the rider options
export const getRiderOptions = (productId: number, planSeriesId: number): MemoizedSelector<object, AsyncData<RateSheetRider[]>> =>
    createSelector(getRateSheetPlanSeriesOptions(productId, planSeriesId), (planSeriesOptions) => getRiderData(planSeriesOptions));

export const getPlansFilteredRiderData = (
    planSeriesOptionsData: AsyncData<RateSheetPlanSeriesOption[]>,
): AsyncData<RateSheetPlanSeriesOption[]> =>
    mapAsyncData(planSeriesOptionsData, ({ value: planSeriesOptions }) => {
        const plansWithFilteredRiders: RateSheetPlanSeriesOption[] = [];
        planSeriesOptions.forEach((planData, i) => {
            const filteredRiders = planData.riders.filter(
                (obj, index) => index === planData.riders.findIndex((o) => obj.planName === o.planName),
            );
            plansWithFilteredRiders.push(JSON.parse(JSON.stringify(planData)));
            plansWithFilteredRiders[i].riders = filteredRiders;
        });
        return plansWithFilteredRiders;
    });

export const getPlansFilteredRiderOptions = (
    productId: number,
    planSeriesId: number,
): MemoizedSelector<object, AsyncData<RateSheetPlanSeriesOption[]>> =>
    createSelector(getRateSheetPlanSeriesOptions(productId, planSeriesId), (planSeriesOptions) =>
        getPlansFilteredRiderData(planSeriesOptions),
    );

// #region DownloadRateSheetResponse selector
export const getDownloadRateSheetEntities = createSelector(getRateSheetsFeatureState, (state: State) => state.downloadRateSheetEntities);

export const getDownloadRateSheetResponse = (
    state: string,
    partnerAccountType: string,
    payrollFrequencyId: number,
    riskClassId: number,
    rateSheetTitle: string,
    zipCode?: string,
    sicCode?: number,
    eligibleSubscribers?: number,
): MemoizedSelector<object, AsyncData<string>> =>
    createSelector(getDownloadRateSheetEntities, (entitiesState) => {
        const id = getDownloadRateSheetEntityId({
            state,
            partnerAccountType,
            payrollFrequencyId,
            riskClassId,
            rateSheetTitle,
            zipCode,
            sicCode,
            eligibleSubscribers,
        });
        return getAsyncDataFromEntitiesState(entitiesState, id);
    });
// #end region

// #region RateSheetPlanSeriesOptionBenefitAmounts selector
export const getRateSheetPlanSeriesOptionBenefitAmountsEntities = createSelector(
    getRateSheetsFeatureState,
    (state: State) => state.rateSheetPlanSeriesOptionBenefitAmountsEntities,
);

// Get plan series option benefit amounts for the selected age ranges
export const getRateSheetPlanSeriesOptionBenefitAmounts = (
    planSeriesId: number,
    state: string,
    partnerAccountType: string,
    payrollFrequencyId: number,
    riskClassId: number,
    minAge: number,
    maxAge: number,
): MemoizedSelector<object, AsyncData<RateSheetPlanSeriesOptionBenefitAmounts[]>> =>
    createSelector(getRateSheetPlanSeriesOptionBenefitAmountsEntities, (entitiesState) => {
        const id = getRateSheetPlanSeriesOptionBenefitAmountsEntityId({
            planSeriesId,
            state,
            partnerAccountType,
            payrollFrequencyId,
            riskClassId,
            minAge,
            maxAge,
        });
        return getAsyncDataFromEntitiesState(entitiesState, id);
    });
// #end region
