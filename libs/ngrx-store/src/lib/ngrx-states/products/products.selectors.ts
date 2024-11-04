import { createFeatureSelector, createSelector, MemoizedSelector } from "@ngrx/store";
import { State } from "./products.state";
import { PRODUCTS_FEATURE_KEY } from "./products.reducer";
import { mapAsyncData } from "../../ngrx.store.helpers";
import { AsyncData, Product } from "@empowered/constants";

// Lookup the 'Products' feature state managed by NgRx
export const getProductsFeatureState = createFeatureSelector<State>(PRODUCTS_FEATURE_KEY);

export const getSelectedProductId = createSelector(getProductsFeatureState, (state: State) => state.selectedProductId);

export const getSelectedProductOfferingId = createSelector(getProductsFeatureState, (state: State) => state.selectedProductOfferingId);

export const getProducts = createSelector(getProductsFeatureState, (state: State) => state.products);

export const getSelectedProduct: MemoizedSelector<object, AsyncData<Product | null>> = createSelector(
    getProducts,
    getSelectedProductId,
    (productsData: AsyncData<Product[]>, productId?: number | null): AsyncData<Product | null> =>
        mapAsyncData(productsData, ({ value: products }) => products.find((product) => product.id === productId) ?? null),
);
