import { createAction, props, union } from "@ngrx/store";
import { ApiError, Product } from "@empowered/constants";

export const setSelectedProductId = createAction("[Products] Set Selected Products", props<{ productId: number }>());

export const setSelectedProductOfferingId = createAction("[Products] Set Selected ProductOffering", props<{ productOfferingId: number }>());

// #region Products
export const loadProducts = createAction("[Products/Core/API] Load Products");

export const loadProductsSuccess = createAction("[Products/Core/API] Load Products Success", props<{ products: Product[] }>());

export const loadProductsFailure = createAction("[Products/Core/API] Load Products Failure", props<{ error: ApiError }>());
// #endregion

const actions = union({
    setSelectedProductId,

    loadProducts,
    loadProductsSuccess,
    loadProductsFailure,
});

export type ActionsUnion = typeof actions;
