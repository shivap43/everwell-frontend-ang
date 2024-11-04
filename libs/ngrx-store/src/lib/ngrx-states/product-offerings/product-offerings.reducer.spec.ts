import { Action } from "@ngrx/store";
import { ProductContributionLimit } from "@empowered/api";

import * as ProductOfferingsActions from "./product-offerings.actions";
import { reducer } from "./product-offerings.reducer";
import { State, initialState } from "./product-offerings.state";
import { AsyncStatus, PlanYearType, ProductOffering, PlanYear, ApiError } from "@empowered/constants";

describe("ProductOfferings Reducer", () => {
    describe("setSelectedReferenceDate action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                selectedReferenceDate: "2021-09-20",
            };

            const action = ProductOfferingsActions.setSelectedReferenceDate({ referenceDate: "2021-09-20" });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadProductOfferingSet action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                productOfferingSetsEntities: {
                    ids: ["111-1990-09-09"],
                    entities: {
                        ["111-1990-09-09"]: {
                            identifiers: {
                                mpGroup: 111,
                                referenceDate: "1990-09-09",
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = ProductOfferingsActions.loadProductOfferingSet({
                mpGroup: 111,
                referenceDate: "1990-09-09",
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadProductOfferingSetSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                productOfferingSetsEntities: {
                    ids: ["111-1990-09-09"],
                    entities: {
                        ["111-1990-09-09"]: {
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
                    },
                },
            };

            const action = ProductOfferingsActions.loadProductOfferingSetSuccess({
                productOfferingSet: {
                    identifiers: {
                        mpGroup: 111,
                        referenceDate: "1990-09-09",
                    },
                    data: [{ id: 555 } as ProductOffering],
                },
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadProductOfferingSetFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                productOfferingSetsEntities: {
                    ids: ["111-1990-09-09"],
                    entities: {
                        ["111-1990-09-09"]: {
                            identifiers: {
                                mpGroup: 111,
                                referenceDate: "1990-09-09",
                            },
                            data: {
                                status: AsyncStatus.FAILED,
                                value: null,
                                error: { message: "some error message" } as ApiError,
                            },
                        },
                    },
                },
            };

            const action = ProductOfferingsActions.loadProductOfferingSetFailure({
                error: {
                    identifiers: {
                        mpGroup: 111,
                        referenceDate: "1990-09-09",
                    },
                    data: { message: "some error message" } as ApiError,
                },
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });
    describe("loadPlanYearSet action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                planYearSetsEntities: {
                    ids: [111],
                    entities: {
                        [111]: {
                            identifiers: {
                                mpGroup: 111,
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = ProductOfferingsActions.loadPlanYearSet({
                mpGroup: 111,
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadPlanYearSetSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                planYearSetsEntities: {
                    ids: [111],
                    entities: {
                        [111]: {
                            identifiers: {
                                mpGroup: 111,
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [{ type: PlanYearType.AFLAC_GROUP } as PlanYear],
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = ProductOfferingsActions.loadPlanYearSetSuccess({
                planYearSet: {
                    identifiers: {
                        mpGroup: 111,
                    },
                    data: [{ type: PlanYearType.AFLAC_GROUP } as PlanYear],
                },
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadPlanYearSetFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                planYearSetsEntities: {
                    ids: [111],
                    entities: {
                        [111]: {
                            identifiers: {
                                mpGroup: 111,
                            },
                            data: {
                                status: AsyncStatus.FAILED,
                                value: null,
                                error: { message: "some error message" } as ApiError,
                            },
                        },
                    },
                },
            };

            const action = ProductOfferingsActions.loadPlanYearSetFailure({
                error: {
                    identifiers: {
                        mpGroup: 111,
                    },
                    data: { message: "some error message" } as ApiError,
                },
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
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

    describe("loadContributionLimit action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                contributionLimitsEntities: {
                    ids: ["111-53"],
                    entities: {
                        ["111-53"]: {
                            identifiers: {
                                mpGroup: 111,
                                productId: 53,
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = ProductOfferingsActions.loadContributionLimit({
                mpGroup: 111,
                productId: 53,
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadContributionLimitSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                contributionLimitsEntities: {
                    ids: ["111-53"],
                    entities: {
                        ["111-53"]: {
                            identifiers: {
                                mpGroup: 111,
                                productId: 53,
                            },
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
                    },
                },
            };

            const action = ProductOfferingsActions.loadContributionLimitSuccess({
                contributionLimitEntity: {
                    identifiers: {
                        mpGroup: 111,
                        productId: 53,
                    },
                    data: {
                        minContribution: 10,
                        maxContribution: 1000,
                        minFamilyContribution: 10,
                        maxFamilyContribution: 1000,
                    } as ProductContributionLimit,
                },
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadContributionLimitFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                contributionLimitsEntities: {
                    ids: ["111-53"],
                    entities: {
                        ["111-53"]: {
                            identifiers: {
                                mpGroup: 111,
                                productId: 53,
                            },
                            data: {
                                status: AsyncStatus.FAILED,
                                value: null,
                                error: { message: "some error message" } as ApiError,
                            },
                        },
                    },
                },
            };

            const action = ProductOfferingsActions.loadContributionLimitFailure({
                error: {
                    identifiers: {
                        mpGroup: 111,
                        productId: 53,
                    },
                    data: { message: "some error message" } as ApiError,
                },
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
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
