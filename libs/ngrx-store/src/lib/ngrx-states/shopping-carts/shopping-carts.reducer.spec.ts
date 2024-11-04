import { Action } from "@ngrx/store";

import * as ShoppingCartsActions from "./shopping-carts.actions";
import { initialState, State } from "./shopping-carts.state";
import { reducer } from "./shopping-carts.reducer";
import { AsyncStatus, FlexDollarModel, PlanFlexDollarOrIncentives, AggregateFlexDollarOrIncentive, ApiError } from "@empowered/constants";

describe("ShoppingCarts Reducer", () => {
    describe("setSelectedCartIteId action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                selectedCartItemId: 55,
            };

            const action = ShoppingCartsActions.setSelectedCartItemId({ cartItemId: 55 });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);
        });
    });

    describe("loadAppliedFlexDollars action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                appliedFlexDollarsSetsEntities: {
                    ids: ["111-333"],
                    entities: {
                        "111-333": {
                            identifiers: {
                                memberId: 111,
                                mpGroup: 333,
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = ShoppingCartsActions.loadAppliedFlexDollars({
                memberId: 111,
                mpGroup: 333,
            });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadAppliedFlexDollarsSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                appliedFlexDollarsSetsEntities: {
                    ids: ["111-333"],
                    entities: {
                        "111-333": {
                            identifiers: {
                                memberId: 111,
                                mpGroup: 333,
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
                    },
                },
            };

            const action = ShoppingCartsActions.loadAppliedFlexDollarsSuccess({
                appliedFlexDollars: {
                    identifiers: {
                        memberId: 111,
                        mpGroup: 333,
                    },
                    data: {
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
                },
            });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadAppliedFlexDollarsFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                appliedFlexDollarsSetsEntities: {
                    ids: ["111-333"],
                    entities: {
                        "111-333": {
                            identifiers: {
                                memberId: 111,
                                mpGroup: 333,
                            },
                            data: {
                                status: AsyncStatus.FAILED,
                                value: null,
                                error: { message: "some api error message" } as ApiError,
                            },
                        },
                    },
                },
            };

            const action = ShoppingCartsActions.loadAppliedFlexDollarsFailure({
                error: {
                    identifiers: {
                        memberId: 111,
                        mpGroup: 333,
                    },
                    data: { message: "some api error message" } as ApiError,
                },
            });

            const state = reducer(initialState, action);

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

            expect(result).toBe(initialState);
        });
    });
});
