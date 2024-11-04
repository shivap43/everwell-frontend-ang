import { createReducer, on, Action } from "@ngrx/store";

import {
    addToCartItemEntityAdapter,
    appliedFlexDollarEntityAdapter,
    cartEntityAdapter,
    cartItemEntityAdapter,
    cartItemsSetsEntityAdapter,
    clearCartItemEntityAdapter,
    deleteCartItemEntityAdapter,
    initialState,
    State,
    updateCartItemEntityAdapter,
} from "./shopping-carts.state";
import * as ShoppingCartsActions from "./shopping-carts.actions";
import { GlobalActions } from "../global";
import { AsyncStatus } from "@empowered/constants";

export const SHOPPING_CARTS_FEATURE_KEY = "shoppingCarts";

export interface ShoppingCartsPartialState {
    readonly [SHOPPING_CARTS_FEATURE_KEY]: State;
}

const shoppingCartsReducer = createReducer(
    initialState,

    // Reinitialize ShoppingCartsState when all Member related state is cleared
    on(
        GlobalActions.clearMemberRelatedState,
        (state): State => ({
            ...initialState,
            selectedCartItemId: state.selectedCartItemId,
        }),
    ),

    on(
        ShoppingCartsActions.setSelectedCartItemId,
        GlobalActions.setSelectedPlanPanelIdentifiers,
        GlobalActions.setSelectedCartItemIdentifiers,
        (state, { cartItemId }): State => ({
            ...state,
            selectedCartItemId: cartItemId,
        }),
    ),

    // #region Shopping Cart
    on(
        ShoppingCartsActions.loadShoppingCart,
        (state, { memberId, mpGroup }): State => ({
            ...state,
            cartEntities: cartEntityAdapter.setOne(
                {
                    identifiers: { memberId, mpGroup },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                {
                    ...state.cartEntities,
                },
            ),
        }),
    ),
    on(
        ShoppingCartsActions.loadShoppingCartSuccess,
        (state, { shoppingCart }): State => ({
            ...state,
            cartEntities: cartEntityAdapter.setOne(
                {
                    identifiers: { ...shoppingCart.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: shoppingCart.data,
                        error: null,
                    },
                },
                { ...state.cartEntities },
            ),
        }),
    ),
    on(
        ShoppingCartsActions.loadShoppingCartFailure,
        (state, { error }): State => ({
            ...state,
            cartEntities: cartEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.cartEntities },
            ),
        }),
    ),
    // #endregion

    // #region CartItemsSets
    on(
        ShoppingCartsActions.loadCartItemsSet,
        (state, { memberId, mpGroup }): State => ({
            ...state,
            cartItemsSetsEntities: cartItemsSetsEntityAdapter.setOne(
                {
                    identifiers: { memberId, mpGroup },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                {
                    ...state.cartItemsSetsEntities,
                },
            ),
        }),
    ),
    on(
        ShoppingCartsActions.loadCartItemsSetSuccess,
        (state, { cartItemsSet }): State => ({
            ...state,
            cartItemsSetsEntities: cartItemsSetsEntityAdapter.setOne(
                {
                    identifiers: { ...cartItemsSet.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [...cartItemsSet.data],
                        error: null,
                    },
                },
                { ...state.cartItemsSetsEntities },
            ),
        }),
    ),
    on(
        ShoppingCartsActions.loadCartItemsSetFailure,
        (state, { error }): State => ({
            ...state,
            cartItemsSetsEntities: cartItemsSetsEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.cartItemsSetsEntities },
            ),
        }),
    ),
    // #endregion

    // #region CartItemSet
    on(
        ShoppingCartsActions.loadCartItem,
        (state, { memberId, itemId, mpGroup }): State => ({
            ...state,
            cartItemSetEntities: cartItemEntityAdapter.setOne(
                {
                    identifiers: { memberId, itemId, mpGroup },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                {
                    ...state.cartItemSetEntities,
                },
            ),
        }),
    ),
    on(
        ShoppingCartsActions.loadCartItemSuccess,
        (state, { cartItemSet }): State => ({
            ...state,
            cartItemSetEntities: cartItemEntityAdapter.setOne(
                {
                    identifiers: { ...cartItemSet.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: cartItemSet.data,
                        error: null,
                    },
                },
                { ...state.cartItemSetEntities },
            ),
        }),
    ),
    on(
        ShoppingCartsActions.loadCartItemFailure,
        (state, { error }): State => ({
            ...state,
            cartItemSetEntities: cartItemEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.cartItemSetEntities },
            ),
        }),
    ),
    // #endregion

    // #region AddCartItem
    on(
        ShoppingCartsActions.addCartItem,
        (state, { memberId, mpGroup, addCartObject }): State => ({
            ...state,
            addToCartItemEntities: addToCartItemEntityAdapter.setOne(
                {
                    identifiers: {
                        memberId,
                        mpGroup,
                        enrollmentMethod: addCartObject.enrollmentMethod,
                        enrollmentState: addCartObject.enrollmentState,
                    },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                {
                    ...state.addToCartItemEntities,
                },
            ),
        }),
    ),
    on(
        ShoppingCartsActions.addCartItemSuccess,
        (state, { addCartResponse }): State => ({
            ...state,
            addToCartItemEntities: addToCartItemEntityAdapter.setOne(
                {
                    identifiers: { ...addCartResponse.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: addCartResponse.data,
                        error: null,
                    },
                },
                { ...state.addToCartItemEntities },
            ),
        }),
    ),
    on(
        ShoppingCartsActions.addCartItemFailure,
        (state, { error }): State => ({
            ...state,
            addToCartItemEntities: addToCartItemEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.addToCartItemEntities },
            ),
        }),
    ),
    // #endregion

    // #region UpdateCartItem
    on(
        ShoppingCartsActions.updateCartItem,
        (state, { memberId, mpGroup, updateCartObject }): State => ({
            ...state,
            updateCartItemEntities: updateCartItemEntityAdapter.setOne(
                {
                    identifiers: {
                        memberId,
                        mpGroup,
                        enrollmentMethod: updateCartObject.enrollmentMethod,
                        enrollmentState: updateCartObject.enrollmentState,
                    },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                {
                    ...state.updateCartItemEntities,
                },
            ),
        }),
    ),
    on(
        ShoppingCartsActions.updateCartItemsSets,
        (state, { memberId, mpGroup, updateCartObjects }): State => ({
            ...state,
            updateCartItemEntities: updateCartItemEntityAdapter.setOne(
                {
                    identifiers: {
                        memberId,
                        mpGroup,
                        enrollmentMethod: updateCartObjects[0].enrollmentMethod,
                        enrollmentState: updateCartObjects[0].enrollmentState,
                    },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                {
                    ...state.updateCartItemEntities,
                },
            ),
        }),
    ),
    on(
        ShoppingCartsActions.updateCartItemSuccess,
        (state, { updateCartResponse }): State => ({
            ...state,
            updateCartItemEntities: updateCartItemEntityAdapter.setOne(
                {
                    identifiers: { ...updateCartResponse.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: updateCartResponse.data,
                        error: null,
                    },
                },
                { ...state.updateCartItemEntities },
            ),
        }),
    ),
    on(
        ShoppingCartsActions.updateCartItemFailure,
        (state, { error }): State => ({
            ...state,
            updateCartItemEntities: updateCartItemEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.updateCartItemEntities },
            ),
        }),
    ),
    // #endregion

    // #region DeleteCartItem
    on(
        ShoppingCartsActions.deleteCartItem,
        (state, { memberId, mpGroup, cartItemId }): State => ({
            ...state,
            deleteCartItemEntities: deleteCartItemEntityAdapter.setOne(
                {
                    identifiers: {
                        memberId,
                        mpGroup,
                    },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                {
                    ...state.deleteCartItemEntities,
                },
            ),
        }),
    ),
    on(
        ShoppingCartsActions.deleteCartItemsSets,
        (state, { memberId, mpGroup, cartItemIds }): State => ({
            ...state,
            deleteCartItemEntities: deleteCartItemEntityAdapter.setOne(
                {
                    identifiers: {
                        memberId,
                        mpGroup,
                    },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                {
                    ...state.deleteCartItemEntities,
                },
            ),
        }),
    ),
    on(
        ShoppingCartsActions.deleteCartItemSuccess,
        (state, { deleteCartItemResponse }): State => ({
            ...state,
            deleteCartItemEntities: deleteCartItemEntityAdapter.setOne(
                {
                    identifiers: { ...deleteCartItemResponse.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: deleteCartItemResponse.data,
                        error: null,
                    },
                },
                { ...state.deleteCartItemEntities },
            ),
        }),
    ),
    on(
        ShoppingCartsActions.deleteCartItemFailure,
        (state, { error }): State => ({
            ...state,
            deleteCartItemEntities: deleteCartItemEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.deleteCartItemEntities },
            ),
        }),
    ),
    // #endregion

    // #region ClearCartItem
    on(
        ShoppingCartsActions.clearCartItems,
        (state, { memberId, mpGroup }): State => ({
            ...state,
            clearCartItemsEntities: clearCartItemEntityAdapter.setOne(
                {
                    identifiers: {
                        memberId,
                        mpGroup,
                    },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                {
                    ...state.clearCartItemsEntities,
                },
            ),
        }),
    ),
    on(
        ShoppingCartsActions.clearCartItemsSuccess,
        (state, { clearCartItemResponse }): State => ({
            ...state,
            clearCartItemsEntities: clearCartItemEntityAdapter.setOne(
                {
                    identifiers: { ...clearCartItemResponse.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: null,
                        error: null,
                    },
                },
                { ...state.clearCartItemsEntities },
            ),
        }),
    ),
    on(
        ShoppingCartsActions.clearCartItemsFailure,
        (state, { error }): State => ({
            ...state,
            clearCartItemsEntities: clearCartItemEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.clearCartItemsEntities },
            ),
        }),
    ),
    // #endregion

    // #region AppliedFlexDollars
    on(
        ShoppingCartsActions.loadAppliedFlexDollars,
        (state, { memberId, mpGroup }): State => ({
            ...state,
            appliedFlexDollarsSetsEntities: appliedFlexDollarEntityAdapter.setOne(
                {
                    identifiers: { memberId, mpGroup },
                    data: {
                        status: AsyncStatus.LOADING,
                    },
                },
                {
                    ...state.appliedFlexDollarsSetsEntities,
                },
            ),
        }),
    ),
    on(
        ShoppingCartsActions.loadAppliedFlexDollarsSuccess,
        (state, { appliedFlexDollars }): State => ({
            ...state,
            appliedFlexDollarsSetsEntities: appliedFlexDollarEntityAdapter.setOne(
                {
                    identifiers: { ...appliedFlexDollars.identifiers },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: appliedFlexDollars.data,
                        error: null,
                    },
                },
                { ...state.appliedFlexDollarsSetsEntities },
            ),
        }),
    ),
    on(
        ShoppingCartsActions.loadAppliedFlexDollarsFailure,
        (state, { error }): State => ({
            ...state,
            appliedFlexDollarsSetsEntities: appliedFlexDollarEntityAdapter.setOne(
                {
                    identifiers: { ...error.identifiers },
                    data: {
                        status: AsyncStatus.FAILED,
                        value: null,
                        error: error.data,
                    },
                },
                { ...state.appliedFlexDollarsSetsEntities },
            ),
        }),
    ),
    // #endregion
);

export function reducer(state: State | undefined, action: Action): State {
    return shoppingCartsReducer(state, action);
}
