import {
    ApiError,
    AsyncStatus,
    PlanSeriesCategory,
    QuickQuotePlanDetails,
    RateSheetPlanSeriesOption,
    RateSheetPlanSeriesOptionBenefitAmounts,
} from "@empowered/constants";
import { initialState, RateSheetPlanSelectionsEntities, State } from "./rate-sheets.state";
import * as RateSheetsActions from "./rate-sheets.actions";
import { reducer } from "./rate-sheets.reducer";

describe("RateSheetsReducer", () => {
    describe("loadPlanSeries action", () => {
        it("should update the rate sheet state in an immutable way on loadPlanSeries", () => {
            const expectedState: State = {
                ...initialState,
                planSeries: {
                    status: AsyncStatus.LOADING,
                },
            };
            const action = RateSheetsActions.loadPlanSeries();
            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadPlanSeriesSuccess action", () => {
        it("should update the rate sheet state in an immutable way on loadPlanSeriesSuccess", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                planSeries: {
                    status: AsyncStatus.SUCCEEDED,
                    value: [
                        {
                            id: 210,
                            code: "some code",
                            name: "some name",
                            plans: [],
                            categories: [PlanSeriesCategory.MAC],
                        },
                    ],
                    error: null,
                },
            };

            const action = RateSheetsActions.loadPlanSeriesSuccess({
                planSeries: [
                    {
                        id: 210,
                        code: "some code",
                        name: "some name",
                        plans: [],
                        categories: [PlanSeriesCategory.MAC],
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

    describe("loadPlanSeriesFailure action", () => {
        it("should update the rate sheet state in an immutable way on loadPlanSeriesFailure", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                planSeries: {
                    status: AsyncStatus.FAILED,
                    value: null,
                    error: {
                        message: "some api error",
                    } as ApiError,
                },
            };

            const action = RateSheetsActions.loadPlanSeriesFailure({
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

    describe("loadQuickQuotePlans action", () => {
        it("should update the rate sheet state in an immutable way on loadQuickQuotePlans", () => {
            const expectedState: State = {
                ...initialState,
                quickQuotePlans: {
                    status: AsyncStatus.LOADING,
                },
            };
            const action = RateSheetsActions.loadQuickQuotePlans({
                state: "Georgia",
                partnerAccountType: "SomePartnerAccount",
                payrollFrequencyId: 1123,
                riskClassId: 345,
                append: [QuickQuotePlanDetails.MIN_ELIGIBLE_SUBSCRIBERS, QuickQuotePlanDetails.MAX_ELIGIBLE_SUBSCRIBERS],
            });
            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadQuickQuotePlansSuccess action", () => {
        it("should update the rate sheet state in an immutable way on loadQuickQuotePlansSuccess", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                quickQuotePlans: {
                    status: AsyncStatus.SUCCEEDED,
                    value: [
                        {
                            id: 210,
                            name: "some name",
                            adminName: "some admin name",
                            carrierId: 21,
                            displayOrder: 2300,
                            description: "some description",
                            missingEmployerFlyer: false,
                        },
                    ],
                    error: null,
                },
            };

            const action = RateSheetsActions.loadQuickQuotePlansSuccess({
                quickQuotePlans: [
                    {
                        id: 210,
                        name: "some name",
                        adminName: "some admin name",
                        carrierId: 21,
                        displayOrder: 2300,
                        description: "some description",
                        missingEmployerFlyer: false,
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

    describe("loadQuickQuotePlansFailure action", () => {
        it("should update the rate sheet state in an immutable way on loadQuickQuotePlansFailure", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                quickQuotePlans: {
                    status: AsyncStatus.FAILED,
                    value: null,
                    error: {
                        message: "some api error",
                    } as ApiError,
                },
            };

            const action = RateSheetsActions.loadQuickQuotePlansFailure({
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

    describe("loadRateSheetPlanSeriesOptions action", () => {
        it("should update the rate sheet state in an immutable way on loadRateSheetPlanSeriesOptions", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                rateSheetPlanSeriesOptionsEntities: {
                    ids: ["1-123"],
                    entities: {
                        "1-123": {
                            identifiers: {
                                planSeriesId: 123,
                                productId: 1,
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };
            const action = RateSheetsActions.loadRateSheetPlanSeriesOptions({
                productId: 1,
                planSeriesId: 123,
                state: "some state",
                partnerAccountType: "some partner account type",
                payrollFrequencyId: 1123,
                riskClassId: 345,
                zipCode: "some zip code",
                sicCode: 342,
                eligibleSubscribers: 450,
            });
            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadRateSheetPlanSeriesOptionsSuccess action", () => {
        it("should update the rate sheet state in an immutable way on loadRateSheetPlanSeriesOptionsSuccess", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                rateSheetPlanSeriesOptionsEntities: {
                    ids: ["1-123"],
                    entities: {
                        "1-123": {
                            identifiers: {
                                productId: 1,
                                planSeriesId: 123,
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [] as RateSheetPlanSeriesOption[],
                                error: null,
                            },
                        },
                    },
                },
            };
            const action = RateSheetsActions.loadRateSheetPlanSeriesOptionsSuccess({
                rateSheetPlanSeriesOptionsEntity: {
                    identifiers: {
                        productId: 1,
                        planSeriesId: 123,
                    },
                    data: [] as RateSheetPlanSeriesOption[],
                },
            });
            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadRateSheetPlanSeriesOptionsFailure action", () => {
        it("should update the rate sheet state in an immutable way on loadRateSheetPlanSeriesOptionsFailure", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                rateSheetPlanSeriesOptionsEntities: {
                    ids: ["1-123"],
                    entities: {
                        "1-123": {
                            identifiers: {
                                productId: 1,
                                planSeriesId: 123,
                            },
                            data: {
                                status: AsyncStatus.FAILED,
                                value: null,
                                error: {
                                    message: "some api error message",
                                } as ApiError,
                            },
                        },
                    },
                },
            };
            const action = RateSheetsActions.loadRateSheetPlanSeriesOptionsFailure({
                error: {
                    identifiers: {
                        productId: 1,
                        planSeriesId: 123,
                    },
                    data: { message: "some api error message" } as ApiError,
                },
            });
            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("downloadRateSheet action", () => {
        it("should update the rate sheet state in an immutable way on downloadRateSheet", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                downloadRateSheetEntities: {
                    ids: ["some state-some partner account type-1123-345-My Rate Sheet-some zip code-342-450"],
                    entities: {
                        "some state-some partner account type-1123-345-My Rate Sheet-some zip code-342-450": {
                            identifiers: {
                                state: "some state",
                                partnerAccountType: "some partner account type",
                                payrollFrequencyId: 1123,
                                riskClassId: 345,
                                rateSheetTitle: "My Rate Sheet",
                                zipCode: "some zip code",
                                sicCode: 342,
                                eligibleSubscribers: 450,
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };
            const action = RateSheetsActions.downloadRateSheet({
                state: "some state",
                partnerAccountType: "some partner account type",
                payrollFrequencyId: 1123,
                riskClassId: 345,
                rateSheetTitle: "My Rate Sheet",
                planSeriesChoices: [],
                zipCode: "some zip code",
                sicCode: 342,
                eligibleSubscribers: 450,
            });
            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("downloadRateSheetSuccess action", () => {
        it("should update the rate sheet state in an immutable way on downloadRateSheetSuccess", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                downloadRateSheetEntities: {
                    ids: ["some state-some partner account type-1123-345-My Rate Sheet-some zip code-342-450"],
                    entities: {
                        "some state-some partner account type-1123-345-My Rate Sheet-some zip code-342-450": {
                            identifiers: {
                                state: "some state",
                                partnerAccountType: "some partner account type",
                                payrollFrequencyId: 1123,
                                riskClassId: 345,
                                rateSheetTitle: "My Rate Sheet",
                                zipCode: "some zip code",
                                sicCode: 342,
                                eligibleSubscribers: 450,
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: "",
                                error: null,
                            },
                        },
                    },
                },
            };
            const action = RateSheetsActions.downloadRateSheetSuccess({
                downloadRateSheetEntity: {
                    identifiers: {
                        state: "some state",
                        partnerAccountType: "some partner account type",
                        payrollFrequencyId: 1123,
                        riskClassId: 345,
                        rateSheetTitle: "My Rate Sheet",
                        zipCode: "some zip code",
                        sicCode: 342,
                        eligibleSubscribers: 450,
                    },
                    data: "",
                },
            });
            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("downloadRateSheetFailure action", () => {
        it("should update the rate sheet state in an immutable way on downloadRateSheetFailure", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                downloadRateSheetEntities: {
                    ids: ["some state-some partner account type-1123-345-My Rate Sheet-some zip code-342-450"],
                    entities: {
                        "some state-some partner account type-1123-345-My Rate Sheet-some zip code-342-450": {
                            identifiers: {
                                state: "some state",
                                partnerAccountType: "some partner account type",
                                payrollFrequencyId: 1123,
                                riskClassId: 345,
                                rateSheetTitle: "My Rate Sheet",
                                zipCode: "some zip code",
                                sicCode: 342,
                                eligibleSubscribers: 450,
                            },
                            data: {
                                status: AsyncStatus.FAILED,
                                value: null,
                                error: {
                                    message: "some api error message",
                                } as ApiError,
                            },
                        },
                    },
                },
            };
            const action = RateSheetsActions.downloadRateSheetFailure({
                error: {
                    identifiers: {
                        state: "some state",
                        partnerAccountType: "some partner account type",
                        payrollFrequencyId: 1123,
                        riskClassId: 345,
                        rateSheetTitle: "My Rate Sheet",
                        zipCode: "some zip code",
                        sicCode: 342,
                        eligibleSubscribers: 450,
                    },
                    data: { message: "some api error message" } as ApiError,
                },
            });
            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("setSelectedProductIndex action", () => {
        it("should save index of the selected product", () => {
            const selectedProductIndex = 0;
            const expectedState: State = {
                ...initialState,
                selectedProductIndex,
            };
            const action = RateSheetsActions.setSelectedProductIndex({ productIndex: 0 });
            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("setSelectedPlanSeries action", () => {
        it("should save id of the selected plan series", () => {
            const selectedPlanSeries = { id: 200, code: "Some code", name: "Some name", categories: [PlanSeriesCategory.MAC] };
            const expectedState: State = {
                ...initialState,
                selectedPlanSeries: { planSeries: selectedPlanSeries },
            };
            const action = RateSheetsActions.setSelectedPlanSeries({
                planSeries: { id: 200, code: "Some code", name: "Some name", categories: [PlanSeriesCategory.MAC] },
            });
            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("setRateSheetPlanSeriesSelections action", () => {
        it("should set plan series selections", () => {
            const rateSheetPlanSelectionsEntities = {
                ids: ["1-200-"],
                entities: {
                    "1-200-": {
                        data: {
                            error: null,
                            status: "succeeded",
                            value: [
                                {
                                    coverageLevelIds: [28, 29],
                                    planId: 12,
                                },
                            ],
                        },
                        identifiers: {
                            productId: 1,
                            planSeriesId: 200,
                            planSeriesCategory: undefined,
                        },
                    },
                },
            } as RateSheetPlanSelectionsEntities;
            const expectedState: State = {
                ...initialState,
                rateSheetPlanSelectionsEntities,
            };
            const action = RateSheetsActions.setRateSheetPlanSeriesSelections({
                productId: 1,
                planSeriesId: 200,
                planSelections: [
                    {
                        planId: 12,
                        coverageLevelIds: [28, 29],
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

    describe("removeRateSheetPlanSeriesSelections action", () => {
        it("should clear selections for specified plan series", () => {
            const expectedState: State = {
                ...initialState,
            };
            let state = reducer(
                { ...initialState },
                RateSheetsActions.setRateSheetPlanSeriesSelections({
                    productId: 1,
                    planSeriesId: 200,
                    planSelections: [
                        {
                            planId: 12,
                            coverageLevelIds: [28, 29],
                        },
                    ],
                }),
            );
            const action = RateSheetsActions.removeRateSheetPlanSeriesSelections({ productId: 1, planSeriesId: 200 });
            state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("removeAllRateSheetPlanSeriesSelections action", () => {
        it("should clear all selections", () => {
            const expectedState: State = {
                ...initialState,
            };
            let state = reducer(
                { ...initialState },
                RateSheetsActions.setRateSheetPlanSeriesSelections({
                    productId: 1,
                    planSeriesId: 200,
                    planSelections: [
                        {
                            planId: 12,
                            coverageLevelIds: [28, 29],
                        },
                    ],
                }),
            );
            const action = RateSheetsActions.removeAllRateSheetPlanSeriesSelections();
            state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("clearRateSheetPlanSeriesSettings action", () => {
        it("should clear all settings", () => {
            const expectedState: State = {
                ...initialState,
            };
            let state = reducer(
                { ...initialState },
                RateSheetsActions.setRateSheetPlanSeriesSettings({
                    productId: 1,
                    planSeriesId: 200,
                    settings: {
                        ageBands: [],
                        genders: [],
                        tobaccoStatuses: [],
                    },
                }),
            );
            const action = RateSheetsActions.clearRateSheetPlanSeriesSettings();
            state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("clearRateSheetPlanSeriesOptions action", () => {
        it("should clear all selections", () => {
            const expectedState: State = {
                ...initialState,
            };
            const action = RateSheetsActions.clearRateSheetPlanSeriesOptions();
            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadRateSheetPlanSeriesOptionBenefitAmounts action", () => {
        it("should update the rate sheet state in an immutable way on loadRateSheetPlanSeriesOptionBenefitAmounts", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                rateSheetPlanSeriesOptionBenefitAmountsEntities: {
                    ids: ["123-some state-some partner account type-1123-345-18-60"],
                    entities: {
                        "123-some state-some partner account type-1123-345-18-60": {
                            identifiers: {
                                planSeriesId: 123,
                                state: "some state",
                                partnerAccountType: "some partner account type",
                                payrollFrequencyId: 1123,
                                riskClassId: 345,
                                minAge: 18,
                                maxAge: 60,
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };
            const action = RateSheetsActions.loadRateSheetPlanSeriesOptionBenefitAmounts({
                planSeriesId: 123,
                state: "some state",
                partnerAccountType: "some partner account type",
                payrollFrequencyId: 1123,
                riskClassId: 345,
                minAge: 18,
                maxAge: 60,
                zipCode: "some zip code",
                sicCode: 342,
                eligibleSubscribers: 450,
                baseBenefitAmount: 45000,
            });
            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadRateSheetPlanSeriesOptionBenefitAmountsSuccess action", () => {
        it("should update the rate sheet state in an immutable way on loadRateSheetPlanSeriesOptionBenefitAmountsSuccess", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                rateSheetPlanSeriesOptionBenefitAmountsEntities: {
                    ids: ["123-some state-some partner account type-1123-345-18-60"],
                    entities: {
                        "123-some state-some partner account type-1123-345-18-60": {
                            identifiers: {
                                planSeriesId: 123,
                                state: "some state",
                                partnerAccountType: "some partner account type",
                                payrollFrequencyId: 1123,
                                riskClassId: 345,
                                minAge: 18,
                                maxAge: 60,
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [] as RateSheetPlanSeriesOptionBenefitAmounts[],
                                error: null,
                            },
                        },
                    },
                },
            };
            const action = RateSheetsActions.loadRateSheetPlanSeriesOptionBenefitAmountsSuccess({
                rateSheetPlanSeriesOptionBenefitAmountsEntity: {
                    identifiers: {
                        planSeriesId: 123,
                        state: "some state",
                        partnerAccountType: "some partner account type",
                        payrollFrequencyId: 1123,
                        riskClassId: 345,
                        minAge: 18,
                        maxAge: 60,
                    },
                    data: [] as RateSheetPlanSeriesOptionBenefitAmounts[],
                },
            });
            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadRateSheetPlanSeriesOptionBenefitAmountsFailure action", () => {
        it("should update the rate sheet state in an immutable way on loadRateSheetPlanSeriesOptionBenefitAmountsFailure", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                rateSheetPlanSeriesOptionBenefitAmountsEntities: {
                    ids: ["123-some state-some partner account type-1123-345-18-60"],
                    entities: {
                        "123-some state-some partner account type-1123-345-18-60": {
                            identifiers: {
                                planSeriesId: 123,
                                state: "some state",
                                partnerAccountType: "some partner account type",
                                payrollFrequencyId: 1123,
                                riskClassId: 345,
                                minAge: 18,
                                maxAge: 60,
                            },
                            data: {
                                status: AsyncStatus.FAILED,
                                value: null,
                                error: {
                                    message: "some api error message",
                                } as ApiError,
                            },
                        },
                    },
                },
            };
            const action = RateSheetsActions.loadRateSheetPlanSeriesOptionBenefitAmountsFailure({
                error: {
                    identifiers: {
                        planSeriesId: 123,
                        state: "some state",
                        partnerAccountType: "some partner account type",
                        payrollFrequencyId: 1123,
                        riskClassId: 345,
                        minAge: 18,
                        maxAge: 60,
                    },
                    data: { message: "some api error message" } as ApiError,
                },
            });
            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });
});
