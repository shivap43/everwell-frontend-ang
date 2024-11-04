import { GetShoppingCart } from "@empowered/api";
import { AddToCartItem, UpdateCartItem, ApiError, GetCartItems, FlexDollarModel } from "@empowered/constants";
import { createAction, props, union } from "@ngrx/store";
import { AddToCartEntity, CartItemsEntity, DeleteCartItemEntity, LoadCartItemEntity, UpdateCartItemEntity } from "./shopping-carts.model";

// Set the selected cart Item ID
export const setSelectedCartItemId = createAction(
    "[ShoppingCarts/Shopping/API] Set Selected Cart Item Id",
    props<{ cartItemId: number }>(),
);

// #region Get Shopping Cart
export const loadShoppingCart = createAction(
    "[ShoppingCarts/Shopping/API] Load Cart",
    props<{ memberId: number; mpGroup: number; planYearIds?: number[] }>(),
);

export const loadShoppingCartSuccess = createAction(
    "[ShoppingCarts/Shopping/API] Load Cart Success",
    props<{ shoppingCart: CartItemsEntity<GetShoppingCart> }>(),
);

export const loadShoppingCartFailure = createAction(
    "[ShoppingCarts/Shopping/API] Load Cart Failure",
    props<{ error: CartItemsEntity<ApiError> }>(),
);
// #endregion

// #region GetCartItems
export const loadCartItemsSet = createAction(
    "[ShoppingCarts/Shopping/API] Load CartItems",
    props<{ memberId: number; mpGroup: number; expand?: string; planYearIds?: number[] }>(),
);

export const loadCartItemsSetSuccess = createAction(
    "[ShoppingCarts/Shopping/API] Load CartItems Success",
    props<{ cartItemsSet: CartItemsEntity<GetCartItems[]> }>(),
);

export const loadCartItemsSetFailure = createAction(
    "[ShoppingCarts/Shopping/API] Load CartItems Failure",
    props<{ error: CartItemsEntity<ApiError> }>(),
);
// #endregion

// #region GetCartItem
export const loadCartItem = createAction(
    "[ShoppingCarts/Shopping/API] Load CartItem",
    props<{ memberId: number; itemId: number; mpGroup: number }>(),
);

export const loadCartItemSuccess = createAction(
    "[ShoppingCarts/Shopping/API] Load CartItem Success",
    props<{ cartItemSet: LoadCartItemEntity<GetCartItems> }>(),
);

export const loadCartItemFailure = createAction(
    "[ShoppingCarts/Shopping/API] Load CartItem Failure",
    props<{ error: LoadCartItemEntity<ApiError> }>(),
);
// #endregion

// #region AddCartItems
export const addCartItem = createAction(
    "[ShoppingCarts/Shopping/API]  Add CartItem",
    props<{ memberId: number; mpGroup: number; addCartObject: AddToCartItem }>(),
);

export const addCartItemSuccess = createAction(
    "[ShoppingCarts/Shopping/API] Add CartItem Success",
    props<{ addCartResponse: AddToCartEntity<number | null> }>(),
);

export const addCartItemFailure = createAction(
    "[ShoppingCarts/Shopping/API] Add CartItem Failure",
    props<{ error: AddToCartEntity<ApiError> }>(),
);
// #endregion

// #region UpdateCartItems
export const updateCartItem = createAction(
    "[ShoppingCarts/Shopping/API]  Update CartItem",
    props<{ memberId: number; mpGroup: number; cartItemId: number; updateCartObject: UpdateCartItem }>(),
);

export const updateCartItemsSets = createAction(
    "[ShoppingCarts/Shopping/API]  updateCartItemsSets",
    props<{ memberId: number; mpGroup: number; updateCartObjects: UpdateCartItem[] }>(),
);

export const updateCartItemSuccess = createAction(
    "[ShoppingCarts/Shopping/API] Update CartItem Success",
    props<{ updateCartResponse: UpdateCartItemEntity<number | null> }>(),
);

export const updateCartItemFailure = createAction(
    "[ShoppingCarts/Shopping/API] Update CartItem Failure",
    props<{ error: UpdateCartItemEntity<ApiError> }>(),
);
// #endregion

// #region DeleteCartItems
export const deleteCartItem = createAction(
    "[ShoppingCarts/Shopping/API]  Delete CartItem",
    props<{ memberId: number; mpGroup: number; cartItemId: number }>(),
);

export const deleteCartItemSuccess = createAction(
    "[ShoppingCarts/Shopping/API] Delete CartItem Success",
    props<{ deleteCartItemResponse: DeleteCartItemEntity<number> }>(),
);

export const deleteCartItemFailure = createAction(
    "[ShoppingCarts/Shopping/API] Delete CartItem Failure",
    props<{ error: DeleteCartItemEntity<ApiError> }>(),
);
// #endregion

// #region ClearCartItems
export const clearCartItems = createAction(
    "[ShoppingCarts/Shopping/API]  Clear CartItem",
    props<{ memberId: number; mpGroup: number; ignoreGroupPlans?: boolean }>(),
);

export const clearCartItemsSuccess = createAction(
    "[ShoppingCarts/Shopping/API] Clear CartItem Success",
    props<{ clearCartItemResponse: CartItemsEntity<null> }>(),
);

export const clearCartItemsFailure = createAction(
    "[ShoppingCarts/Shopping/API] Clear CartItem Failure",
    props<{ error: CartItemsEntity<ApiError> }>(),
);
// #endregion

// #region AppliedFlexDollars
export const loadAppliedFlexDollars = createAction(
    "[ShoppingCarts/Shopping/API] Load AppliedFlexDollars",
    props<{ memberId: number; mpGroup: number }>(),
);

export const loadAppliedFlexDollarsSuccess = createAction(
    "[ShoppingCarts/Shopping/API] Load AppliedFlexDollars Success",
    props<{ appliedFlexDollars: CartItemsEntity<FlexDollarModel | null> }>(),
);

export const loadAppliedFlexDollarsFailure = createAction(
    "[ShoppingCarts/Shopping/API] Load AppliedFlexDollars Failure",
    props<{ error: CartItemsEntity<ApiError> }>(),
);
// #endregion

// #region Delete Cart Items Sets
export const deleteCartItemsSets = createAction(
    "[ShoppingCarts/Shopping/API]  DeleteCartItemsSets",
    props<{ memberId: number; mpGroup: number; cartItemIds: number[] }>(),
);
// #endregion

const actions = union({
    setSelectedCartItemId,

    loadCartItemsSet,
    loadCartItemsSetSuccess,
    loadCartItemsSetFailure,

    loadCartItem,
    loadCartItemSuccess,
    loadCartItemFailure,

    addCartItem,
    addCartItemSuccess,
    addCartItemFailure,

    updateCartItem,
    updateCartItemSuccess,
    updateCartItemFailure,

    deleteCartItem,
    deleteCartItemSuccess,
    deleteCartItemFailure,

    clearCartItems,
    clearCartItemsSuccess,
    clearCartItemsFailure,

    loadShoppingCart,
    loadShoppingCartSuccess,
    loadShoppingCartFailure,

    loadAppliedFlexDollars,
    loadAppliedFlexDollarsSuccess,
    loadAppliedFlexDollarsFailure,

    deleteCartItemsSets,
});

export type ActionsUnion = typeof actions;
