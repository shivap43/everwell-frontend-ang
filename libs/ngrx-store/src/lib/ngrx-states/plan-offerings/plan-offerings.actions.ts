import { createAction, props, union } from "@ngrx/store";
import { KnockoutQuestion, ApplicationResponseBaseType } from "@empowered/api";
import {
    CoverageDatesEnrollmentType,
    EnrollmentMethod,
    ShopPageType,
    ApiError,
    CoverageLevel,
    PlanOffering,
    CoverageDatesRecord,
    ApplicationResponse,
    PlanOfferingPricing,
} from "@empowered/constants";
import {
    CoverageDatesRecordsEntity,
    CoverageLevelEntity,
    PlanOfferingsEntity,
    PlanOfferingPricingsEntity,
    PlanOfferingRidersEntity,
    KnockoutQuestionsEntity,
    LoadKnockoutResponsesEntity,
    SaveKnockoutResponsesEntity,
} from "./plan-offerings.model";

// Set the selected plan ID
export const setSelectedPlanId = createAction("[PlanOfferings/Shopping/API] Set Selected Plan Id", props<{ planId: number }>());

// Set the selected plan offering ID
export const setSelectedPlanOfferingId = createAction(
    "[PlanOfferings/Shopping/API] Set Selected Plan Offering Id",
    props<{ planOfferingId: number }>(),
);

// Set which shop page type is associated with the currently selected CoverageDatesRecord
export const setSelectedShopPageType = createAction(
    "[CoverageDateRecords] Set Selected ShopPage Type",
    props<{ shopPageType: ShopPageType }>(),
);

// #region PlanOfferings
export const loadPlanOfferings = createAction(
    "[PlanOfferings/Shopping/API] Load PlanOfferings",
    props<{
        enrollmentMethod: EnrollmentMethod;
        mpGroup: number;
        memberId: number;
        stateAbbreviation: string;
        referenceDate: string; // Uses this format DateFormat.YEAR_MONTH_DAY_UPPERCASE
        productOfferingIds: number[];
    }>(),
);

export const loadPlanOfferingsSuccess = createAction(
    "[PlanOfferings/Shopping/API] Load PlanOfferings Success",
    props<{ planOfferingsEntity: PlanOfferingsEntity<PlanOffering[]> }>(),
);

export const loadPlanOfferingsFailure = createAction(
    "[PlanOfferings/Shopping/API] Load PlanOfferings Failure",
    props<{ error: PlanOfferingsEntity<ApiError> }>(),
);
// #endregion

// #region PlanOfferingRiders
export const loadPlanOfferingRiders = createAction(
    "[PlanOfferingRiders/Shopping/API] Load PlanOfferingRiders",
    props<{
        planOfferingId: number;
        enrollmentMethod: EnrollmentMethod;
        mpGroup: number;
        memberId: number;
        stateAbbreviation: string;
        coverageEffectiveDate?: string;
    }>(),
);

export const loadPlanOfferingRidersSuccess = createAction(
    "[PlanOfferingRiders/Shopping/API] Load PlanOfferingRiders Success",
    props<{ planOfferingRidersEntity: PlanOfferingRidersEntity<PlanOffering[]> }>(),
);

export const loadPlanOfferingRidersFailure = createAction(
    "[PlanOfferingRiders/Shopping/API] Load PlanOfferingRiders Failure",
    props<{ error: PlanOfferingRidersEntity<ApiError> }>(),
);
// #endregion

// #region CoverageDatesRecords
export const loadCoverageDateRecord = createAction(
    "[CoverageDateRecords/Shopping/API] Load CoverageDateRecords",
    props<{
        mpGroup: number;
        memberId: number;
        coverageDatesEnrollmentType: CoverageDatesEnrollmentType;
        referenceDate: string;
    }>(),
);

export const loadCoverageDateRecordSuccess = createAction(
    "[CoverageDateRecords/Shopping/API] Load CoverageDateRecords Success",
    props<{ coverageDatesRecordEntity: CoverageDatesRecordsEntity<CoverageDatesRecord> }>(),
);

export const loadCoverageDateRecordFailure = createAction(
    "[CoverageDateRecords/Shopping/API] Load CoverageDateRecords Failure",
    props<{ error: CoverageDatesRecordsEntity<ApiError> }>(),
);
// #endregion

export const loadPlanOfferingPricings = createAction(
    "[PlanPricing/Shopping/API] Load Plan Pricing",
    props<{
        // NOTE: 'memberPayrollFrequencyId' and 'memberAge'- is required only in case of generic quote
        mpGroup: number;
        memberId: number;
        planOfferingId: number;
        includeFee: boolean;
        stateAbbreviation?: string;
        memberIsTobaccoUser?: boolean | null;
        spouseIsTobaccoUser?: boolean | null;
        parentPlanId?: number;
        parentPlanCoverageLevelId?: number;
        baseBenefitAmount?: number;
        coverageEffectiveDate?: string;
        riskClassId?: number;
        shoppingCartItemId?: number;
    }>(),
);

export const loadPlanOfferingPricingsSuccess = createAction(
    "[PlanPricing/Shopping/API] Load PlanPricing Success",
    props<{ planOfferingPricingsEntity: PlanOfferingPricingsEntity<PlanOfferingPricing[]> }>(),
);

export const loadPlanOfferingPricingsFailure = createAction(
    "[PlanPricing/Shopping/API] Load PlanPricing Failure",
    props<{ error: PlanOfferingPricingsEntity<ApiError> }>(),
);

export const loadCoverageLevels = createAction(
    "[CoverageLevel/Shopping/API] Load Coverage Level",
    props<{
        planId: number;
        mpGroup: number;
        fetchRetainRiders: boolean;
        parentCoverageLevelId?: number;
        stateCode?: string;
    }>(),
);

export const loadCoverageLevelsSuccess = createAction(
    "[CoverageLevel/Shopping/API] Load Coverage Level Success",
    props<{ coverageLevelsEntity: CoverageLevelEntity<CoverageLevel[]> }>(),
);

export const loadCoverageLevelsFailure = createAction(
    "[CoverageLevel/Shopping/API] Load Coverage Level Failure",
    props<{ error: CoverageLevelEntity<ApiError> }>(),
);

export const loadKnockoutQuestions = createAction(
    "[KnockoutQuestions/Shopping/API] Load Knockout Questions",
    props<{
        planOfferingId: number;
        mpGroup: number;
        memberId: number;
        stateAbbreviation: string;
    }>(),
);

export const loadKnockoutQuestionsSuccess = createAction(
    "[KnockoutQuestions/Shopping/API] Load Knockout Questions Success",
    props<{ knockoutQuestionsEntity: KnockoutQuestionsEntity<KnockoutQuestion[]> }>(),
);

export const loadKnockoutQuestionsFailure = createAction(
    "[KnockoutQuestions/Shopping/API] Load Knockout Questions Failure",
    props<{ error: KnockoutQuestionsEntity<ApiError> }>(),
);

export const loadKnockoutResponses = createAction(
    "[KnockoutResponses/Shopping/API] Load Knockout Responses",
    props<{
        mpGroup: number;
        memberId: number;
        cartItemIds: number[];
    }>(),
);

export const loadKnockoutResponsesSuccess = createAction(
    "[KnockoutResponses/Shopping/API] Load Knockout Responses Success",
    props<{ knockoutResponsesEntity: LoadKnockoutResponsesEntity<ApplicationResponse[][]> }>(),
);

export const loadKnockoutResponsesFailure = createAction(
    "[KnockoutResponses/Shopping/API] Load Knockout Responses Failure",
    props<{ error: LoadKnockoutResponsesEntity<ApiError> }>(),
);

export const saveKnockoutResponses = createAction(
    "[KnockoutResponses/Shopping/API] Save Knockout Responses",
    props<{
        mpGroup: number;
        memberId: number;
        cartItemId: number;
        responses: ApplicationResponse[];
        applicationResponseBaseType: ApplicationResponseBaseType;
    }>(),
);

export const saveKnockoutResponsesSuccess = createAction(
    "[KnockoutResponses/Shopping/API] Save Knockout Responses Success",
    props<{ knockoutResponsesEntity: SaveKnockoutResponsesEntity<null> }>(),
);

export const saveKnockoutResponsesFailure = createAction(
    "[KnockoutResponses/Shopping/API] Save Knockout Responses Failure",
    props<{ error: SaveKnockoutResponsesEntity<ApiError> }>(),
);

const actions = union({
    setSelectedPlanId,
    setSelectedPlanOfferingId,
    setSelectedShopPageType,

    loadPlanOfferings,
    loadPlanOfferingsSuccess,
    loadPlanOfferingsFailure,

    loadPlanOfferingRiders,
    loadPlanOfferingRidersSuccess,
    loadPlanOfferingRidersFailure,

    loadCoverageDateRecord,
    loadCoverageDateRecordSuccess,
    loadCoverageDateRecordFailure,

    loadCoverageLevels,
    loadCoverageLevelsSuccess,
    loadCoverageLevelsFailure,

    loadKnockoutQuestions,
    loadKnockoutQuestionsSuccess,
    loadKnockoutQuestionsFailure,

    loadPlanOfferingPricings,
    loadPlanOfferingPricingsSuccess,
    loadPlanOfferingPricingsFailure,

    loadKnockoutResponses,
    loadKnockoutResponsesSuccess,
    loadKnockoutResponsesFailure,

    saveKnockoutResponses,
    saveKnockoutResponsesSuccess,
    saveKnockoutResponsesFailure,
});

export type ActionsUnion = typeof actions;
