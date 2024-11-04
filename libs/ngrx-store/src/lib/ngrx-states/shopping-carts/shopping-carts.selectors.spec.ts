import {
    AsyncStatus,
    EnrollmentMethod,
    GetCartItems,
    FlexDollarModel,
    PlanFlexDollarOrIncentives,
    AggregateFlexDollarOrIncentive,
} from "@empowered/constants";

import { AccountsPartialState, ACCOUNTS_FEATURE_KEY } from "../accounts/accounts.reducer";
import { MembersPartialState, MEMBERS_FEATURE_KEY } from "../members/members.reducer";
import { SharedPartialState, SHARED_FEATURE_KEY } from "../shared/shared.reducer";
import { AccountsState } from "../accounts";
import { MembersState } from "../members";
import { SharedState } from "../shared";
import { appliedFlexDollarEntityAdapter, cartItemEntityAdapter, cartItemsSetsEntityAdapter, initialState } from "./shopping-carts.state";
import * as ShoppingCartsSelectors from "./shopping-carts.selectors";
import { ShoppingCartsPartialState, SHOPPING_CARTS_FEATURE_KEY } from "./shopping-carts.reducer";

describe("ShoppingCarts Selectors", () => {
    let state: ShoppingCartsPartialState & AccountsPartialState & MembersPartialState & SharedPartialState;

    beforeEach(() => {
        state = {
            [ACCOUNTS_FEATURE_KEY]: {
                ...AccountsState.initialState,
                selectedMPGroup: 111,
            },
            [MEMBERS_FEATURE_KEY]: {
                ...MembersState.initialState,
                selectedMemberId: 333,
            },
            [SHARED_FEATURE_KEY]: {
                ...SharedState.initialState,
                selectedEnrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                selectedCountryState: {
                    name: "Arizona",
                    abbreviation: "AZ",
                },
            },
            [SHOPPING_CARTS_FEATURE_KEY]: {
                ...initialState,
                selectedCartItemId: 11,
                cartItemsSetsEntities: cartItemsSetsEntityAdapter.setOne(
                    {
                        identifiers: {
                            mpGroup: 111,
                            memberId: 333,
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [
                                {
                                    id: 555,
                                    planOfferingId: 11,
                                    memberCost: 4,
                                    totalCost: 4,
                                    coverageLevelId: 2,
                                    benefitAmount: 2,
                                    enrollmentState: "AZ",
                                } as GetCartItems,
                            ],
                            error: null,
                        },
                    },
                    { ...initialState.cartItemsSetsEntities },
                ),
                cartItemSetEntities: cartItemEntityAdapter.setOne(
                    {
                        identifiers: {
                            mpGroup: 111,
                            itemId: 4,
                            memberId: 333,
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: {
                                id: 555,
                                planOfferingId: 11,
                                memberCost: 4,
                                totalCost: 4,
                                coverageLevelId: 2,
                                benefitAmount: 2,
                                enrollmentState: "AZ",
                            } as GetCartItems,
                            error: null,
                        },
                    },
                    { ...initialState.cartItemSetEntities },
                ),
                appliedFlexDollarsSetsEntities: appliedFlexDollarEntityAdapter.setOne(
                    {
                        identifiers: {
                            memberId: 333,
                            mpGroup: 111,
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: {
                                aggregateFlexDollarOrIncentives: [
                                    {
                                        flexDollarOrIncentiveName: "incentive",
                                        flexDollarOrIncentiveAmount: 888,
                                    },
                                ] as AggregateFlexDollarOrIncentive[],
                                planFlexDollarOrIncentives: [
                                    {
                                        planId: 200,
                                    },
                                ] as PlanFlexDollarOrIncentives[],
                            } as FlexDollarModel,
                            error: null,
                        },
                    },
                    { ...initialState.appliedFlexDollarsSetsEntities },
                ),
            },
        };
    });
    describe("getSelectedCartItemId", () => {
        it("should get selected cart itemId", () => {
            const result = ShoppingCartsSelectors.getSelectedCartItemId(state);

            expect(result).toBe(11);
        });
    });

    describe("getCartItemsSetsEntities", () => {
        it("should get PlanOfferings Entities State", () => {
            const result = ShoppingCartsSelectors.getCartItemsSetsEntities(state);

            expect(result).toStrictEqual(state[SHOPPING_CARTS_FEATURE_KEY].cartItemsSetsEntities);
        });
    });
    describe("getAppliedFlexDollarOrIncentivesForCartEntities", () => {
        it("should get applied flex dollars entities", () => {
            const result = ShoppingCartsSelectors.getAppliedFlexDollarOrIncentivesForCartEntities(state);

            expect(result).toStrictEqual(state[SHOPPING_CARTS_FEATURE_KEY].appliedFlexDollarsSetsEntities);
        });
    });
    describe("getAppliedFlexDollarOrIncentivesForCart", () => {
        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = ShoppingCartsSelectors.getAppliedFlexDollarOrIncentivesForCart({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get IDLE AsyncData if no selected memberId", () => {
            const result = ShoppingCartsSelectors.getAppliedFlexDollarOrIncentivesForCart({
                ...state,
                [MEMBERS_FEATURE_KEY]: { ...state[MEMBERS_FEATURE_KEY], selectedMemberId: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get AppliedFlexDollar", () => {
            const result = ShoppingCartsSelectors.getAppliedFlexDollarOrIncentivesForCart(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: {
                    aggregateFlexDollarOrIncentives: [
                        {
                            flexDollarOrIncentiveName: "incentive",
                            flexDollarOrIncentiveAmount: 888,
                        },
                    ] as AggregateFlexDollarOrIncentive[],
                    planFlexDollarOrIncentives: [
                        {
                            planId: 200,
                        },
                    ] as PlanFlexDollarOrIncentives[],
                } as FlexDollarModel,
                error: null,
            });
        });
    });
});
