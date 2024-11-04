import { AsyncStatus } from "@empowered/constants";
import { ProductsPartialState, PRODUCTS_FEATURE_KEY } from "./products.reducer";
import * as ProductsSelectors from "./products.selectors";
import { initialState } from "./products.state";

describe("Products Selectors", () => {
    let state: ProductsPartialState;

    beforeEach(() => {
        state = {
            [PRODUCTS_FEATURE_KEY]: {
                ...initialState,
                selectedProductId: 222,
                products: {
                    status: AsyncStatus.SUCCEEDED,
                    value: [
                        {
                            id: 111,
                            name: "some product 111",
                            code: "",
                        },
                        {
                            id: 222,
                            name: "some product 222",
                            code: "",
                        },
                        {
                            id: 333,
                            name: "some product 333",
                            code: "",
                        },
                    ],
                    error: null,
                },
            },
        };
    });

    describe("getSelectedProductId", () => {
        it("should get selected productId", () => {
            const result = ProductsSelectors.getSelectedProductId(state);

            expect(result).toBe(222);
        });
    });

    describe("getProducts", () => {
        it("should get all Products", () => {
            const result = ProductsSelectors.getProducts(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [
                    {
                        id: 111,
                        name: "some product 111",
                        code: "",
                    },
                    {
                        id: 222,
                        name: "some product 222",
                        code: "",
                    },
                    {
                        id: 333,
                        name: "some product 333",
                        code: "",
                    },
                ],
                error: null,
            });
        });
    });

    describe("getSelectedProduct", () => {
        it("should get selected Product", () => {
            const result = ProductsSelectors.getSelectedProduct(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: {
                    id: 222,
                    name: "some product 222",
                    code: "",
                },
                error: null,
            });
        });

        it("should get AsyncData with AsyncStatus.LOADING if data has not loaded", () => {
            const result = ProductsSelectors.getSelectedProduct({
                ...state,
                [PRODUCTS_FEATURE_KEY]: {
                    ...state[PRODUCTS_FEATURE_KEY],
                    products: {
                        ...state[PRODUCTS_FEATURE_KEY].products,
                        status: AsyncStatus.LOADING,
                    },
                },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.LOADING,
            });
        });

        it("should get AsyncData with value null if no Product with matching selected productId", () => {
            const result = ProductsSelectors.getSelectedProduct({
                ...state,
                [PRODUCTS_FEATURE_KEY]: {
                    ...state[PRODUCTS_FEATURE_KEY],
                    selectedProductId: -1,
                },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: null,
                error: null,
            });
        });
    });
});
