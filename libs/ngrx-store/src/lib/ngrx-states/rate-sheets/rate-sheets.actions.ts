import {
    AgeBand,
    ApiError,
    Gender,
    Plan,
    PlanSeries,
    PlanSeriesChoice,
    QuickQuotePlanDetails,
    RateSheetPlanSeriesOption,
    RateSheetPlanSeriesOptionBenefitAmounts,
    TobaccoStatus,
} from "@empowered/constants";
import { createAction, props, union } from "@ngrx/store";
import {
    DownloadRateSheetEntity,
    RateSheetPlanSeriesOptionBenefitAmountsEntity,
    RateSheetPlanSeriesOptionsEntity,
} from "./rate-sheets.model";
import { PlanSelections } from "@empowered/api";

// action called to get the PlanSeries object
export const loadPlanSeries = createAction("[RateSheets/API] Load Plan Series");

// action automatically triggered on successful retrieval of PlanSeries object
export const loadPlanSeriesSuccess = createAction("[RateSheets/API] Load Plan Series Success", props<{ planSeries: PlanSeries[] }>());

// action automatically triggered on failure to retrieve PlanSeries object
export const loadPlanSeriesFailure = createAction("[RateSheets/API] Load Plan Series Failure", props<{ error: ApiError }>());

// action called to get the RateSheetPlanSeriesOptions object
export const loadRateSheetPlanSeriesOptions = createAction(
    "[RateSheets/API] Load Rate Sheet Plan Series Options",
    props<{
        productId: number;
        planSeriesId: number;
        state: string;
        partnerAccountType: string;
        payrollFrequencyId: number;
        riskClassId: number;
        zipCode?: string;
        sicCode?: number;
        eligibleSubscribers?: number;
    }>(),
);

// action automatically triggered on successful retrieval of RateSheetPlanSeriesOptions object
export const loadRateSheetPlanSeriesOptionsSuccess = createAction(
    "[RateSheets/API] Load Rate Sheet Plan Series Options Success",
    props<{ rateSheetPlanSeriesOptionsEntity: RateSheetPlanSeriesOptionsEntity<RateSheetPlanSeriesOption[]> }>(),
);

// action automatically triggered on failure to retrieve RateSheetPlanSeriesOptions object
export const loadRateSheetPlanSeriesOptionsFailure = createAction(
    "[RateSheets/API] Load Rate Sheet Plan Series Options Failure",
    props<{ error: RateSheetPlanSeriesOptionsEntity<ApiError> }>(),
);

// action called to download the customized rate sheet pdf
export const downloadRateSheet = createAction(
    "[RateSheets/API] Download Rate Sheet",
    props<{
        state: string;
        partnerAccountType: string;
        payrollFrequencyId: number;
        riskClassId: number;
        rateSheetTitle: string;
        planSeriesChoices: PlanSeriesChoice[];
        zipCode?: string;
        sicCode?: number;
        eligibleSubscribers?: number;
    }>(),
);

// action automatically triggered on successful download of the customized rate sheet pdf
export const downloadRateSheetSuccess = createAction(
    "[RateSheets/API] Download Rate Sheet Success",
    props<{ downloadRateSheetEntity: DownloadRateSheetEntity<string> }>(),
);

// action automatically triggered on failure to download the customized rate sheet pdf
export const downloadRateSheetFailure = createAction(
    "[RateSheets/API] Download Rate Sheet Failure",
    props<{ error: DownloadRateSheetEntity<ApiError> }>(),
);

// action called to load Quick Quote plans
export const loadQuickQuotePlans = createAction(
    "[RateSheets/API] Load Quick Quote Plans",
    props<{
        state: string;
        partnerAccountType: string;
        payrollFrequencyId: number;
        riskClassId: number;
        append?: QuickQuotePlanDetails[];
    }>(),
);

// action automatically triggered on successful loading of Quick Quote plans
export const loadQuickQuotePlansSuccess = createAction(
    "[RateSheets/API] Load Quick Quote Plans Success",
    props<{ quickQuotePlans: Plan[] }>(),
);

// action automatically triggered on faliure to load Quick Quote plans
export const loadQuickQuotePlansFailure = createAction("[RateSheets/API] Load Quick Quote Plans Failure", props<{ error: ApiError }>());

// action to set the selected product's index in the combined plan and plan series data
export const setSelectedProductIndex = createAction("[RateSheets] Set Selected Product", props<{ productIndex: number }>());

// action to set the selected plan series
export const setSelectedPlanSeries = createAction("[RateSheets] Set Selected Plan Series", props<{ planSeries: PlanSeries }>());

// action to set plan series settings (selected options) for the selected plan
export const setRateSheetPlanSeriesSettings = createAction(
    "[RateSheets] Set Rate Sheet Plan Series Settings",
    props<{
        productId: number;
        planSeriesId: number;
        settings: { ageBands?: AgeBand[]; genders?: Gender[]; tobaccoStatuses?: TobaccoStatus[] };
    }>(),
);

// action to set plan selections for a give series
export const setRateSheetPlanSeriesSelections = createAction(
    "[RateSheets] Set Rate Sheet Plan Series Selections",
    props<{ productId: number; planSeriesId: number; planSelections: PlanSelections[]; planSeriesCategory?: string }>(),
);

// action to remove specified plan series selection
export const removeRateSheetPlanSeriesSelections = createAction(
    "[RateSheets] Remove Rate Sheet Plan Series Selections",
    props<{ productId: number; planSeriesId: number; planSeriesCategory?: string }>(),
);

// action to remove all plan series selections
export const removeAllRateSheetPlanSeriesSelections = createAction("[RateSheets] Remove All Rate Sheet Plan Series Selections");

// action to clear plan series settings (selected options) for the selected plan
export const clearRateSheetPlanSeriesSettings = createAction("[RateSheets] Clear Rate Sheets PlanSeries Settings");

// action to clear plan series options for the selected plan
export const clearRateSheetPlanSeriesOptions = createAction("[RateSheets] Clear Rate Sheets PlanSeries Options");

// action to reset state
export const resetRateSheetsState = createAction("[RateSheets] Reset Rate Sheets");

// action called to get the RateSheetPlanSeriesOptionBenefitAmounts object
export const loadRateSheetPlanSeriesOptionBenefitAmounts = createAction(
    "[RateSheets/API] Load Rate Sheet Plan Series Option Benefit Amounts",
    props<{
        planSeriesId: number;
        state: string;
        partnerAccountType: string;
        payrollFrequencyId: number;
        riskClassId: number;
        minAge: number;
        maxAge: number;
        zipCode?: string;
        sicCode?: number;
        eligibleSubscribers?: number;
        baseBenefitAmount?: number;
    }>(),
);

// action automatically triggered on successful retrieval of RateSheetPlanSeriesOptionBenefitAmounts object
export const loadRateSheetPlanSeriesOptionBenefitAmountsSuccess = createAction(
    "[RateSheets/API] Load Rate Sheet Plan Series Option Benefit Amounts Success",
    props<{
        rateSheetPlanSeriesOptionBenefitAmountsEntity: RateSheetPlanSeriesOptionBenefitAmountsEntity<
            RateSheetPlanSeriesOptionBenefitAmounts[]
        >;
    }>(),
);

// action automatically triggered on failure to retrieve RateSheetPlanSeriesOptionBenefitAmounts object
export const loadRateSheetPlanSeriesOptionBenefitAmountsFailure = createAction(
    "[RateSheets/API] Load Rate Sheet Plan Series Option Benefit Amounts Failure",
    props<{ error: RateSheetPlanSeriesOptionBenefitAmountsEntity<ApiError> }>(),
);

const actions = union({
    setSelectedProductIndex,
    setSelectedPlanSeries,
    setRateSheetPlanSeriesSettings,
    setRateSheetPlanSeriesSelections,
    removeRateSheetPlanSeriesSelections,
    removeAllRateSheetPlanSeriesSelections,

    loadPlanSeries,
    loadPlanSeriesSuccess,
    loadPlanSeriesFailure,

    loadRateSheetPlanSeriesOptions,
    loadRateSheetPlanSeriesOptionsSuccess,
    loadRateSheetPlanSeriesOptionsFailure,

    downloadRateSheet,
    downloadRateSheetSuccess,
    downloadRateSheetFailure,

    loadQuickQuotePlans,
    loadQuickQuotePlansSuccess,
    loadQuickQuotePlansFailure,

    clearRateSheetPlanSeriesSettings,
    clearRateSheetPlanSeriesOptions,
    resetRateSheetsState,

    loadRateSheetPlanSeriesOptionBenefitAmounts,
    loadRateSheetPlanSeriesOptionBenefitAmountsSuccess,
    loadRateSheetPlanSeriesOptionBenefitAmountsFailure,
});

export type ActionsUnion = typeof actions;
