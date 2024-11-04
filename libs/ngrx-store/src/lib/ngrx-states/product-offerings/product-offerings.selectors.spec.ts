import { ProductContributionLimit } from "@empowered/api";

import {
    contributionLimitsEntityAdapter,
    initialState,
    planYearSetsEntityAdapter,
    productOfferingSetsEntityAdapter,
} from "./product-offerings.state";
import { ProductOfferingsPartialState, PRODUCT_OFFERINGS_FEATURE_KEY } from "./product-offerings.reducer";
import * as ProductOfferingsSelectors from "./product-offerings.selectors";
import { AccountsPartialState, ACCOUNTS_FEATURE_KEY } from "../accounts/accounts.reducer";
import { ProductsPartialState, PRODUCTS_FEATURE_KEY } from "../products/products.reducer";
import { AccountsState } from "../accounts";
import { ProductsState } from "../products";
import { AsyncStatus, PlanYearType, ProductOffering, PlanYear } from "@empowered/constants";

describe("ProductOfferings Selectors", () => {
    let state: ProductOfferingsPartialState & AccountsPartialState & ProductsPartialState;

    beforeEach(() => {
        state = {
            [ACCOUNTS_FEATURE_KEY]: {
                ...AccountsState.initialState,
                selectedMPGroup: 111,
            },
            [PRODUCTS_FEATURE_KEY]: {
                ...ProductsState.initialState,
                selectedProductId: 53,
            },
            [PRODUCT_OFFERINGS_FEATURE_KEY]: {
                ...initialState,
                selectedReferenceDate: "1990-09-09",
                productOfferingSetsEntities: productOfferingSetsEntityAdapter.setOne(
                    {
                        identifiers: {
                            mpGroup: 111,
                            referenceDate: "1990-09-09",
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [{ id: 555 } as ProductOffering],
                            error: null,
                        },
                    },
                    { ...initialState.productOfferingSetsEntities },
                ),
                planYearSetsEntities: planYearSetsEntityAdapter.setOne(
                    {
                        identifiers: { mpGroup: 111 },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [{ type: PlanYearType.AFLAC_GROUP } as PlanYear],
                            error: null,
                        },
                    },
                    { ...initialState.planYearSetsEntities },
                ),
                contributionLimitsEntities: contributionLimitsEntityAdapter.setOne(
                    {
                        identifiers: { mpGroup: 111, productId: 53 },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: {
                                minContribution: 10,
                                maxContribution: 1000,
                                minFamilyContribution: 10,
                                maxFamilyContribution: 1000,
                            } as ProductContributionLimit,
                            error: null,
                        },
                    },
                    { ...initialState.contributionLimitsEntities },
                ),
            },
        };

        // Tests involve current date, so we should mock the current date
        jest.spyOn(Date, "now").mockReturnValue(new Date("1990/09/09").valueOf());
    });

    describe("getSelectedReferenceDate", () => {
        it("should get selected referenceDate", () => {
            const result = ProductOfferingsSelectors.getSelectedReferenceDate(state);

            expect(result).toBe("1990-09-09");
        });
    });

    describe("getProductOfferingSetsEntities", () => {
        it("should get ProductOfferingSets Entities State", () => {
            const result = ProductOfferingsSelectors.getProductOfferingSetsEntities(state);

            expect(result).toStrictEqual(state[PRODUCT_OFFERINGS_FEATURE_KEY].productOfferingSetsEntities);
        });
    });

    describe("getSelectedProductOfferingSet", () => {
        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = ProductOfferingsSelectors.getSelectedProductOfferingSet({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get selected ProductOfferingSet", () => {
            const result = ProductOfferingsSelectors.getSelectedProductOfferingSet(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [{ id: 555 } as ProductOffering],
                error: null,
            });
        });
    });

    describe("getPlanYearSetsEntities", () => {
        it("should get PlanOfferings Entities State", () => {
            const result = ProductOfferingsSelectors.getPlanYearSetsEntities(state);

            expect(result).toStrictEqual(state[PRODUCT_OFFERINGS_FEATURE_KEY].planYearSetsEntities);
        });
    });

    describe("getSelectedPlanYearSet", () => {
        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = ProductOfferingsSelectors.getSelectedPlanYearSet({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get selected PlanYearSet", () => {
            const result = ProductOfferingsSelectors.getSelectedPlanYearSet(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [{ type: PlanYearType.AFLAC_GROUP } as PlanYear],
                error: null,
            });
        });
    });

    describe("getContributionLimitsSetsEntities", () => {
        it("should get ContributionLimitsSets Entities State", () => {
            const result = ProductOfferingsSelectors.getContributionLimitsSetsEntities(state);

            expect(result).toStrictEqual(state[PRODUCT_OFFERINGS_FEATURE_KEY].contributionLimitsEntities);
        });
    });

    describe("getSelectedContributionLimitSet", () => {
        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = ProductOfferingsSelectors.getSelectedContributionLimitSet({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
                [PRODUCTS_FEATURE_KEY]: { ...state[PRODUCTS_FEATURE_KEY], selectedProductId: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get selected ContributionLimitSet", () => {
            const result = ProductOfferingsSelectors.getSelectedContributionLimitSet(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: {
                    minContribution: 10,
                    maxContribution: 1000,
                    minFamilyContribution: 10,
                    maxFamilyContribution: 1000,
                } as ProductContributionLimit,
                error: null,
            });
        });
    });
});
