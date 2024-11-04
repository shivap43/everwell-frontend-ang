import { AsyncStatus } from "@empowered/constants";
import { createReducer, on, Action } from "@ngrx/store";

import { GlobalActions } from "../global";
import * as ProductsActions from "./products.actions";
import { initialState, State } from "./products.state";

export const PRODUCTS_FEATURE_KEY = "products";

export interface ProductsPartialState {
    readonly [PRODUCTS_FEATURE_KEY]: State;
}

const productsReducer = createReducer(
    initialState,

    on(
        ProductsActions.setSelectedProductId,
        GlobalActions.setSelectedProductOfferingIdentifiers,
        GlobalActions.setSelectedCartItemIdentifiers,
        (state, { productId }): State => ({ ...state, selectedProductId: productId }),
    ),

    on(
        ProductsActions.setSelectedProductOfferingId,
        GlobalActions.setSelectedProductOfferingIdentifiers,
        (state, { productOfferingId }): State => ({ ...state, selectedProductOfferingId: productOfferingId }),
    ),

    // #region Products
    on(
        ProductsActions.loadProducts,
        (state): State => ({
            ...state,
            products: {
                status: AsyncStatus.LOADING,
            },
        }),
    ),
    on(
        ProductsActions.loadProductsSuccess,
        (state, { products }): State => ({
            ...state,
            products: {
                status: AsyncStatus.SUCCEEDED,
                value: products,
                error: null,
            },
        }),
    ),
    on(
        ProductsActions.loadProductsFailure,
        (state, { error }): State => ({
            ...state,
            products: {
                status: AsyncStatus.FAILED,
                value: null,
                error,
            },
        }),
    ),
    // #region Products
);

export function reducer(state: State | undefined, action: Action): State {
    return productsReducer(state, action);
}
