import { GetShoppingCart } from "@empowered/api";
import { createFeatureSelector, createSelector, MemoizedSelector } from "@ngrx/store";
import { AccountsSelectors } from "../accounts";
import { MembersSelectors } from "../members";
import { getAsyncDataFromEntitiesState, getIdleAsyncData, mapAsyncData } from "../../ngrx.store.helpers";

import { SHOPPING_CARTS_FEATURE_KEY } from "./shopping-carts.reducer";
import {
    clearCartItemEntityId,
    deleteCartItemEntityId,
    getAppliedFlexDollarEntityId,
    getCartEntityId,
    getCartItemEntityId,
    getCartItemsEntityId,
    State,
} from "./shopping-carts.state";
import { AsyncData, GetCartItems, FlexDollarModel } from "@empowered/constants";

export const getShoppingCartsFeatureState = createFeatureSelector<State>(SHOPPING_CARTS_FEATURE_KEY);

export const getSelectedCartItemId = createSelector(getShoppingCartsFeatureState, (state: State) => state.selectedCartItemId);

export const getCartInfoEntities = createSelector(getShoppingCartsFeatureState, (state: State) => state.cartEntities);

export const getShoppingCart: MemoizedSelector<object, AsyncData<GetShoppingCart>> = createSelector(
    getCartInfoEntities,
    MembersSelectors.getSelectedMemberId,
    AccountsSelectors.getSelectedMPGroup,
    (entitiesState, memberId, mpGroup) => {
        if (!memberId || !mpGroup) {
            return getIdleAsyncData();
        }
        const id = getCartEntityId({ memberId, mpGroup });
        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);

export const getCartItemsSetsEntities = createSelector(getShoppingCartsFeatureState, (state: State) => state.cartItemsSetsEntities);
export const getCartItemsSet: MemoizedSelector<object, AsyncData<GetCartItems[]>> = createSelector(
    getCartItemsSetsEntities,
    MembersSelectors.getSelectedMemberId,
    AccountsSelectors.getSelectedMPGroup,
    (entitiesState, memberId, mpGroup) => {
        if (!memberId || !mpGroup) {
            return getIdleAsyncData();
        }

        const id = getCartItemsEntityId({ memberId, mpGroup });
        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);

export const getCartItemEntities = createSelector(getShoppingCartsFeatureState, (state: State) => state.cartItemSetEntities);

export const getCartItem: MemoizedSelector<object, AsyncData<GetCartItems>> = createSelector(
    getCartItemEntities,
    MembersSelectors.getSelectedMemberId,
    getSelectedCartItemId,
    AccountsSelectors.getSelectedMPGroup,
    (entitiesState, memberId, itemId, mpGroup) => {
        if (!memberId || !itemId || !mpGroup) {
            return getIdleAsyncData();
        }

        const id = getCartItemEntityId({ memberId, itemId, mpGroup });
        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);

export const addCartItemEntities = createSelector(getShoppingCartsFeatureState, (state: State) => state.addToCartItemEntities);

export const updateCartItemEntities = createSelector(getShoppingCartsFeatureState, (state: State) => state.updateCartItemEntities);

export const deleteCartItemEntities = createSelector(getShoppingCartsFeatureState, (state: State) => state.deleteCartItemEntities);

export const deletedCartItem: MemoizedSelector<object, AsyncData<number>> = createSelector(
    deleteCartItemEntities,
    MembersSelectors.getSelectedMemberId,
    AccountsSelectors.getSelectedMPGroup,
    (entitiesState, memberId, mpGroup) => {
        if (!memberId || !mpGroup) {
            return getIdleAsyncData();
        }

        const id = deleteCartItemEntityId({
            memberId,
            mpGroup,
        });

        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);

export const clearCartItemsEntities = createSelector(getShoppingCartsFeatureState, (state: State) => state.clearCartItemsEntities);

export const clearCartItems: MemoizedSelector<object, AsyncData<null>> = createSelector(
    clearCartItemsEntities,
    MembersSelectors.getSelectedMemberId,
    AccountsSelectors.getSelectedMPGroup,
    (entitiesState, memberId, mpGroup) => {
        if (!memberId || !mpGroup) {
            return getIdleAsyncData();
        }
        const id = clearCartItemEntityId({
            memberId,
            mpGroup,
        });
        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);

// #region get cart items product Ids
export const getCartItemsProductIds: MemoizedSelector<object, AsyncData<number[]>> = createSelector(
    getCartItemsSet,
    (cartItemsData): AsyncData<number[]> =>
        mapAsyncData(cartItemsData, ({ value: cartItems }) => cartItems.map((cartItem) => cartItem.planOffering?.plan.productId as number)),
);
// #endregion

export const getAppliedFlexDollarOrIncentivesForCartEntities = createSelector(
    getShoppingCartsFeatureState,
    (state: State) => state.appliedFlexDollarsSetsEntities,
);

export const getAppliedFlexDollarOrIncentivesForCart: MemoizedSelector<object, AsyncData<FlexDollarModel | null>> = createSelector(
    getAppliedFlexDollarOrIncentivesForCartEntities,
    MembersSelectors.getSelectedMemberId,
    AccountsSelectors.getSelectedMPGroup,
    (entitiesState, memberId, mpGroup) => {
        if (!memberId || !mpGroup) {
            return getIdleAsyncData();
        }
        const id = getAppliedFlexDollarEntityId({ memberId, mpGroup });
        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);
