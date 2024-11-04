import { createReducer, on, Action } from "@ngrx/store";
import * as PlanOfferingsActions from "./plan-offerings.actions";
import {
    initialState,
    State,
    planOfferingsEntityAdapter,
    coverageLevelsEntityAdapter,
    planOfferingPricingsEntityAdapter,
    coverageDatesRecordEntityAdapter,
    planOfferingRidersEntityAdapter,
    knockOutQuestionsEntityAdapter,
    loadKnockoutResponsesEntityAdapter,
    saveKnockoutResponsesEntityAdapter,
} from "./plan-offerings.state";
import { GlobalActions } from "../global";
import { AsyncStatus } from "@empowered/constants";

export const PLAN_OFFERINGS_FEATURE_KEY = "planOfferings";

export interface PlanOfferingsPartialState {
    readonly [PLAN_OFFERINGS_FEATURE_KEY]: State;
}

const planOfferingsReducer = createReducer(
    initialState,

    // Reinitialize PlanOfferingsState when all Member related state is cleared
    on(
        GlobalActions.clearMemberRelatedState,
        (state): State => ({
            ...initialState,
            selectedPlanId: state.selectedPlanId,
            selectedPlanOfferingId: state.selectedPlanOfferingId,
            selectedDependentPlanOfferingIds: state.selectedDependentPlanOfferingIds,
            selectedShopPageType: state.selectedShopPageType,
            coverageLevelsEntities: state.coverageLevelsEntities,
        }),
    ),

    // Set which memberId is associated with the currently selected MemberProfile (and all related instances such as Salaries)
    on(
        PlanOfferingsActions.setSelectedShopPageType,
        (state, { shopPageType }): State => ({
            ...state,
            selectedShopPageType: shopPageType,
        }),
    ),

    // #region PlanOfferings
    on(
        PlanOfferingsActions.loadPlanOfferings,
        (state, { mpGroup, memberId, enrollmentMethod, stateAbbreviation, referenceDate }): State => ({
            ...state,
            planOfferingsEntities: planOfferingsEntityAdapter.setOne(
                {
                    identifiers: {
                        mpGroup,
                        memberId,
                        enrollmentMethod,
                        stateAbbreviation,
                        referenceDate,
                    },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.planOfferingsEntities },
            ),
        }),
    ),
    on(
        PlanOfferingsActions.loadPlanOfferingsSuccess,
        (state, { planOfferingsEntity }): State => ({
            ...state,
            planOfferingsEntities: planOfferingsEntityAdapter.setOne(
                {
                    identifiers: { ...planOfferingsEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [...planOfferingsEntity.data],
                        error: null,
                    },
                },
                { ...state.planOfferingsEntities },
            ),
        }),
    ),
    on(
        PlanOfferingsActions.loadPlanOfferingsFailure,
        (state, { error }): State => ({
            ...state,
            planOfferingsEntities: planOfferingsEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.planOfferingsEntities },
            ),
        }),
    ),
    // #endregion

    // #region PlanOfferingRiders
    on(
        PlanOfferingsActions.loadPlanOfferingRiders,
        (state, { planOfferingId, mpGroup, memberId, enrollmentMethod, stateAbbreviation, coverageEffectiveDate }): State => ({
            ...state,
            planOfferingRidersEntities: planOfferingRidersEntityAdapter.setOne(
                {
                    identifiers: {
                        planOfferingId,
                        mpGroup,
                        memberId,
                        enrollmentMethod,
                        stateAbbreviation,
                        coverageEffectiveDate,
                    },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.planOfferingRidersEntities },
            ),
        }),
    ),
    on(
        PlanOfferingsActions.loadPlanOfferingRidersSuccess,
        (state, { planOfferingRidersEntity }): State => ({
            ...state,
            planOfferingRidersEntities: planOfferingRidersEntityAdapter.setOne(
                {
                    identifiers: { ...planOfferingRidersEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [...planOfferingRidersEntity.data],
                        error: null,
                    },
                },
                { ...state.planOfferingRidersEntities },
            ),
        }),
    ),
    on(
        PlanOfferingsActions.loadPlanOfferingRidersFailure,
        (state, { error }): State => ({
            ...state,
            planOfferingRidersEntities: planOfferingRidersEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.planOfferingRidersEntities },
            ),
        }),
    ),
    // #endregion

    // #region CoverageDatesRecords
    on(
        PlanOfferingsActions.loadCoverageDateRecord,
        (state, { mpGroup, memberId, coverageDatesEnrollmentType, referenceDate }): State => ({
            ...state,
            coverageDatesRecordEntities: coverageDatesRecordEntityAdapter.setOne(
                {
                    identifiers: {
                        mpGroup,
                        memberId,
                        coverageDatesEnrollmentType,
                        referenceDate,
                    },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.coverageDatesRecordEntities },
            ),
        }),
    ),
    on(
        PlanOfferingsActions.loadCoverageDateRecordSuccess,
        (state, { coverageDatesRecordEntity }): State => ({
            ...state,
            coverageDatesRecordEntities: coverageDatesRecordEntityAdapter.setOne(
                {
                    identifiers: { ...coverageDatesRecordEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: coverageDatesRecordEntity.data,
                        error: null,
                    },
                },
                { ...state.coverageDatesRecordEntities },
            ),
        }),
    ),
    on(
        PlanOfferingsActions.loadCoverageDateRecordFailure,
        (state, { error }): State => ({
            ...state,
            coverageDatesRecordEntities: coverageDatesRecordEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.coverageDatesRecordEntities },
            ),
        }),
    ),
    // #endregion

    // #region CoverageLevels
    on(
        PlanOfferingsActions.loadCoverageLevels,
        (state, { planId, mpGroup, parentCoverageLevelId, fetchRetainRiders, stateCode }): State => ({
            ...state,
            coverageLevelsEntities: coverageLevelsEntityAdapter.setOne(
                {
                    identifiers: { planId, mpGroup, parentCoverageLevelId, fetchRetainRiders, stateCode },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.coverageLevelsEntities },
            ),
        }),
    ),
    on(
        PlanOfferingsActions.loadCoverageLevelsSuccess,
        (state, { coverageLevelsEntity }): State => ({
            ...state,
            coverageLevelsEntities: coverageLevelsEntityAdapter.setOne(
                {
                    identifiers: { ...coverageLevelsEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [...coverageLevelsEntity.data],
                        error: null,
                    },
                },
                { ...state.coverageLevelsEntities },
            ),
        }),
    ),
    on(
        PlanOfferingsActions.loadCoverageLevelsFailure,
        (state, { error }): State => ({
            ...state,
            coverageLevelsEntities: coverageLevelsEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.coverageLevelsEntities },
            ),
        }),
    ),
    // #endregion

    // #region KnockoutQuestions
    on(
        PlanOfferingsActions.loadKnockoutQuestions,
        (state, { planOfferingId, mpGroup, memberId, stateAbbreviation }): State => ({
            ...state,
            knockoutQuestionsEntities: knockOutQuestionsEntityAdapter.setOne(
                {
                    identifiers: { planOfferingId, mpGroup, memberId, stateAbbreviation },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.knockoutQuestionsEntities },
            ),
        }),
    ),
    on(
        PlanOfferingsActions.loadKnockoutQuestionsSuccess,
        (state, { knockoutQuestionsEntity }): State => ({
            ...state,
            knockoutQuestionsEntities: knockOutQuestionsEntityAdapter.setOne(
                {
                    identifiers: { ...knockoutQuestionsEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [...knockoutQuestionsEntity.data],
                        error: null,
                    },
                },
                { ...state.knockoutQuestionsEntities },
            ),
        }),
    ),
    on(
        PlanOfferingsActions.loadKnockoutQuestionsFailure,
        (state, { error }): State => ({
            ...state,
            knockoutQuestionsEntities: knockOutQuestionsEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.knockoutQuestionsEntities },
            ),
        }),
    ),
    // #endregion

    // #region load KnockoutResponses
    on(
        PlanOfferingsActions.loadKnockoutResponses,
        (state, { mpGroup, memberId }): State => ({
            ...state,
            loadKnockoutResponsesEntities: loadKnockoutResponsesEntityAdapter.setOne(
                {
                    identifiers: { mpGroup, memberId },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.loadKnockoutResponsesEntities },
            ),
        }),
    ),
    on(
        PlanOfferingsActions.loadKnockoutResponsesSuccess,
        (state, { knockoutResponsesEntity }): State => ({
            ...state,
            loadKnockoutResponsesEntities: loadKnockoutResponsesEntityAdapter.setOne(
                {
                    identifiers: { ...knockoutResponsesEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [...knockoutResponsesEntity.data],
                        error: null,
                    },
                },
                { ...state.loadKnockoutResponsesEntities },
            ),
        }),
    ),
    on(
        PlanOfferingsActions.loadKnockoutResponsesFailure,
        (state, { error }): State => ({
            ...state,
            loadKnockoutResponsesEntities: loadKnockoutResponsesEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.loadKnockoutResponsesEntities },
            ),
        }),
    ),
    // #endregion

    // #region save KnockoutResponses
    on(
        PlanOfferingsActions.saveKnockoutResponses,
        (state, { mpGroup, memberId }): State => ({
            ...state,
            saveKnockoutResponsesEntities: saveKnockoutResponsesEntityAdapter.setOne(
                {
                    identifiers: { mpGroup, memberId },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.saveKnockoutResponsesEntities },
            ),
        }),
    ),
    on(
        PlanOfferingsActions.saveKnockoutResponsesSuccess,
        (state, { knockoutResponsesEntity }): State => ({
            ...state,
            saveKnockoutResponsesEntities: saveKnockoutResponsesEntityAdapter.setOne(
                {
                    identifiers: { ...knockoutResponsesEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: null,
                        error: null,
                    },
                },
                { ...state.saveKnockoutResponsesEntities },
            ),
        }),
    ),
    on(
        PlanOfferingsActions.saveKnockoutResponsesFailure,
        (state, { error }): State => ({
            ...state,
            saveKnockoutResponsesEntities: saveKnockoutResponsesEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.saveKnockoutResponsesEntities },
            ),
        }),
    ),
    // #endregion

    // #region PlanOfferingPricings
    on(
        PlanOfferingsActions.loadPlanOfferingPricings,
        (state, action): State => ({
            ...state,
            planOfferingPricingsEntities: planOfferingPricingsEntityAdapter.setOne(
                {
                    identifiers: {
                        planOfferingId: action.planOfferingId,
                        memberId: action.memberId,
                        mpGroup: action.mpGroup,
                        stateAbbreviation: action.stateAbbreviation,
                        parentPlanId: action.parentPlanId,
                        parentPlanCoverageLevelId: action.parentPlanCoverageLevelId,
                        baseBenefitAmount: action.baseBenefitAmount,
                        memberIsTobaccoUser: action.memberIsTobaccoUser,
                        spouseIsTobaccoUser: action.spouseIsTobaccoUser,
                        coverageEffectiveDate: action.coverageEffectiveDate,
                        riskClassId: action.riskClassId,
                        shoppingCartItemId: action.shoppingCartItemId,
                        includeFee: action.includeFee,
                    },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.planOfferingPricingsEntities },
            ),
        }),
    ),
    on(
        PlanOfferingsActions.loadPlanOfferingPricingsSuccess,
        (state, { planOfferingPricingsEntity }): State => ({
            ...state,
            planOfferingPricingsEntities: planOfferingPricingsEntityAdapter.setOne(
                {
                    identifiers: { ...planOfferingPricingsEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [...planOfferingPricingsEntity.data],
                        error: null,
                    },
                },
                { ...state.planOfferingPricingsEntities },
            ),
        }),
    ),
    on(
        PlanOfferingsActions.loadPlanOfferingPricingsFailure,
        (state, { error }): State => ({
            ...state,
            planOfferingPricingsEntities: planOfferingPricingsEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.planOfferingPricingsEntities },
            ),
        }),
    ),
    on(
        PlanOfferingsActions.setSelectedPlanId,
        GlobalActions.setSelectedPlanPanelIdentifiers,
        GlobalActions.setSelectedCartItemIdentifiers,
        (state, { planId }): State => ({
            ...state,
            selectedPlanId: planId,
        }),
    ),
    on(
        PlanOfferingsActions.setSelectedPlanOfferingId,
        GlobalActions.setSelectedPlanPanelIdentifiers,
        GlobalActions.setSelectedCartItemIdentifiers,
        (state, { planOfferingId }): State => ({
            ...state,
            selectedPlanOfferingId: planOfferingId,
        }),
    ),
);
// #endregion

export function reducer(state: State | undefined, action: Action): State {
    return planOfferingsReducer(state, action);
}
