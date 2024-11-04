import { createFeatureSelector, createSelector, MemoizedSelector } from "@ngrx/store";
import { ProductContributionLimit } from "@empowered/api";

import { AccountsSelectors } from "../accounts";
import { getAsyncDataFromEntitiesState, getIdleAsyncData } from "../../ngrx.store.helpers";
import { SharedSelectors } from "../shared";
import { ProductsSelectors } from "../products";
import { MembersSelectors } from "../members";
import { PRODUCT_OFFERINGS_FEATURE_KEY } from "./product-offerings.reducer";
import {
    State,
    getProductOfferingsEntityId,
    getDeclineProductOfferingEntityId,
    getPlanYearsEntityId,
    getContributionLimitsEntityId,
} from "./product-offerings.state";
import { AsyncData, ProductOffering, PlanYear } from "@empowered/constants";

// Lookup the 'ProductOfferings' feature state managed by NgRx
export const getProductOfferingsFeatureState = createFeatureSelector<State>(PRODUCT_OFFERINGS_FEATURE_KEY);

export const getSelectedReferenceDate = createSelector(getProductOfferingsFeatureState, (state: State) => state.selectedReferenceDate);

// #region ProductOfferings selectors
export const getProductOfferingSetsEntities = createSelector(
    getProductOfferingsFeatureState,
    (state: State) => state.productOfferingSetsEntities,
);

export const getSelectedProductOfferingSet: MemoizedSelector<object, AsyncData<ProductOffering[]>> = createSelector(
    getProductOfferingSetsEntities,
    AccountsSelectors.getSelectedMPGroup,
    getSelectedReferenceDate,
    (entitiesState, mpGroup, referenceDate) => {
        if (!mpGroup || !referenceDate) {
            return getIdleAsyncData();
        }

        const id = getProductOfferingsEntityId({
            mpGroup,
            // Do not use DateFormat.YEAR_MONTH_DAY like you would for the DatePipe,
            // mm means Day # for DatePipe, but in moment it means Day of Week
            referenceDate,
        });

        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);
// #endregion

// #region Decline ProductOffering
export const getDeclineProductOfferingSetsEntities = createSelector(
    getProductOfferingsFeatureState,
    (state: State) => state.declineProductOfferingEntities,
);

export const getDeclineProductOfferingSets: MemoizedSelector<object, AsyncData<null>> = createSelector(
    getDeclineProductOfferingSetsEntities,
    ProductsSelectors.getSelectedProductOfferingId,
    AccountsSelectors.getSelectedMPGroup,
    SharedSelectors.getSelectedEnrollmentMethod,
    MembersSelectors.getSelectedMemberId,
    (entitiesState, selectedProductOfferingId, mpGroup, enrollmentMethod, memberId) => {
        if (!selectedProductOfferingId || !mpGroup || !memberId) {
            return getIdleAsyncData();
        }

        const productOfferingId = selectedProductOfferingId;
        const id = getDeclineProductOfferingEntityId({
            productOfferingId,
            mpGroup,
            enrollmentMethod,
            memberId,
        });

        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);
// #endregion

// #region PlanYearSets
export const getPlanYearSetsEntities = createSelector(getProductOfferingsFeatureState, (state: State) => state.planYearSetsEntities);

export const getSelectedPlanYearSet: MemoizedSelector<object, AsyncData<PlanYear[]>> = createSelector(
    getPlanYearSetsEntities,
    AccountsSelectors.getSelectedMPGroup,
    (entitiesState, mpGroup) => {
        if (!mpGroup) {
            return getIdleAsyncData();
        }

        const id = getPlanYearsEntityId({ mpGroup });

        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);
// #endregion

// #region Contribution limit
export const getContributionLimitsSetsEntities = createSelector(
    getProductOfferingsFeatureState,
    (state: State) => state.contributionLimitsEntities,
);

export const getSelectedContributionLimitSet: MemoizedSelector<object, AsyncData<ProductContributionLimit>> = createSelector(
    getContributionLimitsSetsEntities,
    AccountsSelectors.getSelectedMPGroup,
    ProductsSelectors.getSelectedProductId,
    (entitiesState, mpGroup, productId) => {
        if (!mpGroup || !productId) {
            return getIdleAsyncData();
        }

        const id = getContributionLimitsEntityId({ mpGroup, productId: productId });

        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);
// #endregion
