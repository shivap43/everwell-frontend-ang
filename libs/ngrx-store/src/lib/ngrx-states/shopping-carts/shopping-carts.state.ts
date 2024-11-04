import { GetShoppingCart } from "@empowered/api";
import { AsyncData, GetCartItems, FlexDollarModel } from "@empowered/constants";
import { createEntityAdapter, EntityState } from "@ngrx/entity";
import { getEntityId } from "../../ngrx.store.helpers";
import { NullishPartial } from "../../store.model";
import {
    AddToCartEntity,
    AddUpdateCartIdentifiers,
    CartItemsEntity,
    CartItemsIdentifiers,
    DeleteCartItemEntity,
    DeleteCartItemIdentifiers,
    LoadCartItemEntity,
    LoadCartItemIdentifiers,
    UpdateCartItemEntity,
} from "./shopping-carts.model";

// start
export const getCartItemsEntityId = ({ memberId, mpGroup }: CartItemsIdentifiers) => getEntityId(memberId, mpGroup);

export const cartItemsSetsEntityAdapter = createEntityAdapter<CartItemsEntity<AsyncData<GetCartItems[]>>>({
    selectId: ({ identifiers }) => getCartItemsEntityId(identifiers),
});

export type CartItemsSetsState = EntityState<CartItemsEntity<AsyncData<GetCartItems[]>>>;
// #endregion

// #region Get One Cart Item
export const getCartItemEntityId = ({ memberId, itemId, mpGroup }: LoadCartItemIdentifiers) => getEntityId(memberId, itemId, mpGroup);

export const cartItemEntityAdapter = createEntityAdapter<LoadCartItemEntity<AsyncData<GetCartItems>>>({
    selectId: ({ identifiers }) => getCartItemEntityId(identifiers),
});

export type LoadCartItemState = EntityState<LoadCartItemEntity<AsyncData<GetCartItems>>>;
// #endregion

// #region Add Cart Item
// Add/ Update uses the same entityId and Identifiers
export const addUpdateCartItemsEntityId = ({
    memberId,
    mpGroup,
    enrollmentMethod,
    enrollmentState,
}: NullishPartial<AddUpdateCartIdentifiers>) => getEntityId(memberId, mpGroup, enrollmentMethod, enrollmentState);

export const addToCartItemEntityAdapter = createEntityAdapter<AddToCartEntity<AsyncData<number | null>>>({
    selectId: ({ identifiers }) => addUpdateCartItemsEntityId(identifiers),
});

export type AddToCartState = EntityState<AddToCartEntity<AsyncData<number | null>>>;
// #endregion

// #region Update Cart Item
export const updateCartItemEntityAdapter = createEntityAdapter<UpdateCartItemEntity<AsyncData<number | null>>>({
    selectId: ({ identifiers }) => addUpdateCartItemsEntityId(identifiers),
});

export type UpdateCartState = EntityState<UpdateCartItemEntity<AsyncData<number | null>>>;
// #endregion

// #region Delete Cart Item
export const deleteCartItemEntityId = ({ memberId, mpGroup }: DeleteCartItemIdentifiers) => getEntityId(memberId, mpGroup);

export const deleteCartItemEntityAdapter = createEntityAdapter<DeleteCartItemEntity<AsyncData<number>>>({
    selectId: ({ identifiers }) => deleteCartItemEntityId(identifiers),
});

export type DeleteCartItemState = EntityState<DeleteCartItemEntity<AsyncData<number>>>;
// #endregion

// #region Clear Cart Item
export const clearCartItemEntityId = ({ memberId, mpGroup }: CartItemsIdentifiers) => getEntityId(memberId, mpGroup);

export const clearCartItemEntityAdapter = createEntityAdapter<CartItemsEntity<AsyncData<null>>>({
    selectId: ({ identifiers }) => clearCartItemEntityId(identifiers),
});

export type ClearCartItemsState = EntityState<CartItemsEntity<AsyncData<null>>>;
// #endregion

// start shopping cart info
export const getCartEntityId = ({ memberId, mpGroup }: CartItemsIdentifiers) => getEntityId(memberId, mpGroup);

export const cartEntityAdapter = createEntityAdapter<CartItemsEntity<AsyncData<GetShoppingCart>>>({
    selectId: ({ identifiers }) => getCartEntityId(identifiers),
});

export type CartInfoState = EntityState<CartItemsEntity<AsyncData<GetShoppingCart>>>;
// #endregion

// start
export const getAppliedFlexDollarEntityId = ({ memberId, mpGroup }: CartItemsIdentifiers) => getEntityId(memberId, mpGroup);

export const appliedFlexDollarEntityAdapter = createEntityAdapter<CartItemsEntity<AsyncData<FlexDollarModel | null>>>({
    selectId: ({ identifiers }) => getAppliedFlexDollarEntityId(identifiers),
});

export type AppliedFlexDollarsSetsState = EntityState<CartItemsEntity<AsyncData<FlexDollarModel | null>>>;
// #endregion

export interface State {
    selectedCartItemId?: number | null;
    cartItemsSetsEntities: CartItemsSetsState;
    addToCartItemEntities: AddToCartState;
    updateCartItemEntities: UpdateCartState;
    deleteCartItemEntities: DeleteCartItemState;
    cartItemSetEntities: LoadCartItemState;
    clearCartItemsEntities: ClearCartItemsState;
    cartEntities: CartInfoState;
    appliedFlexDollarsSetsEntities: AppliedFlexDollarsSetsState;
}
export const initialState: State = {
    cartItemsSetsEntities: cartItemsSetsEntityAdapter.getInitialState({}),
    addToCartItemEntities: addToCartItemEntityAdapter.getInitialState({}),
    updateCartItemEntities: updateCartItemEntityAdapter.getInitialState({}),
    deleteCartItemEntities: deleteCartItemEntityAdapter.getInitialState({}),
    cartItemSetEntities: cartItemEntityAdapter.getInitialState({}),
    clearCartItemsEntities: clearCartItemEntityAdapter.getInitialState({}),
    cartEntities: cartEntityAdapter.getInitialState({}),
    appliedFlexDollarsSetsEntities: appliedFlexDollarEntityAdapter.getInitialState({}),
};
