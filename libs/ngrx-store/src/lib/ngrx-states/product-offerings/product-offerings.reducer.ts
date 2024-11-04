import { createReducer, on, Action } from "@ngrx/store";

import * as ProductOfferingsActions from "./product-offerings.actions";
import {
    initialState,
    State,
    productOfferingSetsEntityAdapter,
    declineProductOfferingEntityAdapter,
    planYearSetsEntityAdapter,
    contributionLimitsEntityAdapter,
} from "./product-offerings.state";
import { GlobalActions } from "../global";
import { AsyncStatus } from "@empowered/constants";

export const PRODUCT_OFFERINGS_FEATURE_KEY = "productOfferings";

export interface ProductOfferingsPartialState {
    readonly [PRODUCT_OFFERINGS_FEATURE_KEY]: State;
}

const productOfferingsReducer = createReducer(
    initialState,

    // Reinitialize ProductOfferingsState when all Member related state is cleared
    on(
        GlobalActions.clearMemberRelatedState,
        (state): State => ({
            ...initialState,
            selectedReferenceDate: state.selectedReferenceDate,
            productOfferingSetsEntities: state.productOfferingSetsEntities,
            planYearSetsEntities: state.planYearSetsEntities,
        }),
    ),

    on(
        ProductOfferingsActions.setSelectedReferenceDate,
        (state, { referenceDate }): State => ({
            ...state,
            selectedReferenceDate: referenceDate,
        }),
    ),

    // #region ProductOfferingSets
    on(
        ProductOfferingsActions.loadProductOfferingSet,
        (state, action): State => ({
            ...state,
            productOfferingSetsEntities: productOfferingSetsEntityAdapter.setOne(
                {
                    identifiers: {
                        mpGroup: action.mpGroup,
                        referenceDate: action.referenceDate,
                    },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.productOfferingSetsEntities },
            ),
        }),
    ),
    on(
        ProductOfferingsActions.loadProductOfferingSetSuccess,
        (state, { productOfferingSet }): State => ({
            ...state,
            productOfferingSetsEntities: productOfferingSetsEntityAdapter.setOne(
                {
                    identifiers: { ...productOfferingSet.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [...productOfferingSet.data],
                        error: null,
                    },
                },
                { ...state.productOfferingSetsEntities },
            ),
        }),
    ),
    on(
        ProductOfferingsActions.loadProductOfferingSetFailure,
        (state, { error }): State => ({
            ...state,
            productOfferingSetsEntities: productOfferingSetsEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.productOfferingSetsEntities },
            ),
        }),
    ),
    // #endregion

    // #region DeclineProductOffering
    on(
        ProductOfferingsActions.declineProductOffering,
        (state, action): State => ({
            ...state,
            declineProductOfferingEntities: declineProductOfferingEntityAdapter.setOne(
                {
                    identifiers: {
                        productOfferingId: action.productOfferingId,
                        memberId: action.memberId,
                        enrollmentMethod: action.enrollmentMethod,
                        mpGroup: action.mpGroup,
                    },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.declineProductOfferingEntities },
            ),
        }),
    ),
    on(
        ProductOfferingsActions.declineProductOfferingSuccess,
        (state, { declineProductOfferingEntity }): State => ({
            ...state,
            declineProductOfferingEntities: declineProductOfferingEntityAdapter.setOne(
                {
                    identifiers: { ...declineProductOfferingEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: declineProductOfferingEntity.data,
                        error: null,
                    },
                },
                { ...state.declineProductOfferingEntities },
            ),
        }),
    ),
    on(
        ProductOfferingsActions.declineProductOfferingFailure,
        (state, { error }): State => ({
            ...state,
            declineProductOfferingEntities: declineProductOfferingEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.declineProductOfferingEntities },
            ),
        }),
    ),
    // #endregion

    // #region PlanYearSets
    on(
        ProductOfferingsActions.loadPlanYearSet,
        (state, { mpGroup }): State => ({
            ...state,
            planYearSetsEntities: planYearSetsEntityAdapter.setOne(
                {
                    identifiers: { mpGroup },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.planYearSetsEntities },
            ),
        }),
    ),
    on(
        ProductOfferingsActions.loadPlanYearSetSuccess,
        (state, { planYearSet }): State => ({
            ...state,
            planYearSetsEntities: planYearSetsEntityAdapter.setOne(
                {
                    identifiers: { ...planYearSet.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [...planYearSet.data],
                        error: null,
                    },
                },
                { ...state.planYearSetsEntities },
            ),
        }),
    ),
    on(
        ProductOfferingsActions.loadPlanYearSetFailure,
        (state, { error }): State => ({
            ...state,
            planYearSetsEntities: planYearSetsEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.planYearSetsEntities },
            ),
        }),
    ),
    // #endregion

    // #region Contribution limit set
    on(
        ProductOfferingsActions.loadContributionLimit,
        (state, { mpGroup, productId }): State => ({
            ...state,
            contributionLimitsEntities: contributionLimitsEntityAdapter.setOne(
                {
                    identifiers: { mpGroup, productId },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                { ...state.contributionLimitsEntities },
            ),
        }),
    ),
    on(
        ProductOfferingsActions.loadContributionLimitSuccess,
        (state, { contributionLimitEntity }): State => ({
            ...state,
            contributionLimitsEntities: contributionLimitsEntityAdapter.setOne(
                {
                    identifiers: { ...contributionLimitEntity.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: contributionLimitEntity.data,
                        error: null,
                    },
                },
                { ...state.contributionLimitsEntities },
            ),
        }),
    ),
    on(
        ProductOfferingsActions.loadContributionLimitFailure,
        (state, { error }): State => ({
            ...state,
            contributionLimitsEntities: contributionLimitsEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.contributionLimitsEntities },
            ),
        }),
    ),
    // #endregion
);

export function reducer(state: State | undefined, action: Action): State {
    return productOfferingsReducer(state, action);
}
