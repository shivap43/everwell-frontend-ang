import { ApiError, AsyncStatus } from "@empowered/constants";
import { Action } from "@ngrx/store";
import * as ProductsActions from "./products.actions";
import { reducer } from "./products.reducer";
import { State, initialState } from "./products.state";

describe("Products Reducer", () => {
    describe("setSelectedProductId action", () => {
        it("should set productId", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                selectedProductId: 777,
            };

            const action = ProductsActions.setSelectedProductId({ productId: 777 });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadProducts action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                products: {
                    status: AsyncStatus.LOADING,
                },
            };

            const action = ProductsActions.loadProducts();

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadProductsSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                products: {
                    status: AsyncStatus.SUCCEEDED,
                    value: [
                        {
                            id: 123,
                            name: "some product",
                            code: "",
                        },
                    ],
                    error: null,
                },
            };

            const action = ProductsActions.loadProductsSuccess({
                products: [
                    {
                        id: 123,
                        name: "some product",
                        code: "",
                    },
                ],
            });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadProductsFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                products: {
                    status: AsyncStatus.FAILED,
                    value: null,
                    error: {
                        message: "some api error",
                    } as ApiError,
                },
            };

            const action = ProductsActions.loadProductsFailure({
                error: {
                    message: "some api error",
                } as ApiError,
            });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("unknown action", () => {
        it("should return the previous state", () => {
            const action = {
                type: "Unknown",
            } as Action;

            const result = reducer(initialState, action);

            // Expected for state to not change when using an unknown action
            expect(result).toBe(initialState);
        });
    });
});
