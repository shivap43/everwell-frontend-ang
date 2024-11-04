import { Action } from "@ngrx/store";
import {
    AsyncStatus,
    CoverageDatesEnrollmentType,
    EnrollmentMethod,
    EnrollmentType,
    ShopPageType,
    Question,
    TaxStatus,
    CoverageLevel,
    PlanOffering,
    PlanOfferingPricing,
    ApiError,
} from "@empowered/constants";
import { KnockoutQuestion } from "@empowered/api";
import * as PlanOfferingsActions from "./plan-offerings.actions";
import { reducer } from "./plan-offerings.reducer";
import { State, initialState } from "./plan-offerings.state";

describe("PlanOfferings Reducer", () => {
    describe("setSelectedPlanOfferingId action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                selectedPlanOfferingId: 555,
            };

            const action = PlanOfferingsActions.setSelectedPlanOfferingId({ planOfferingId: 555 });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);
        });
    });

    describe("setSelectedShopPageType action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                selectedShopPageType: ShopPageType.SINGLE_QLE_SHOP,
            };

            const action = PlanOfferingsActions.setSelectedShopPageType({
                shopPageType: ShopPageType.SINGLE_QLE_SHOP,
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("setSelectedPlanId action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                selectedPlanId: 22,
            };

            const action = PlanOfferingsActions.setSelectedPlanId({ planId: 22 });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadPlanOfferings action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                planOfferingsEntities: {
                    ids: [`111-333-${EnrollmentMethod.FACE_TO_FACE}-AZ-1990-09-09`],
                    entities: {
                        [`111-333-${EnrollmentMethod.FACE_TO_FACE}-AZ-1990-09-09`]: {
                            identifiers: {
                                mpGroup: 111,
                                memberId: 333,
                                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                                stateAbbreviation: "AZ",
                                referenceDate: "1990-09-09",
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = PlanOfferingsActions.loadPlanOfferings({
                mpGroup: 111,
                memberId: 333,
                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                stateAbbreviation: "AZ",
                referenceDate: "1990-09-09",
                productOfferingIds: [1],
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadPlanOfferingsSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                planOfferingsEntities: {
                    ids: [`111-333-${EnrollmentMethod.FACE_TO_FACE}-AZ-1990-09-09`],
                    entities: {
                        [`111-333-${EnrollmentMethod.FACE_TO_FACE}-AZ-1990-09-09`]: {
                            identifiers: {
                                mpGroup: 111,
                                memberId: 333,
                                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                                stateAbbreviation: "AZ",
                                referenceDate: "1990-09-09",
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [{ taxStatus: TaxStatus.POSTTAX } as PlanOffering],
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = PlanOfferingsActions.loadPlanOfferingsSuccess({
                planOfferingsEntity: {
                    identifiers: {
                        mpGroup: 111,
                        memberId: 333,
                        enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                        stateAbbreviation: "AZ",
                        referenceDate: "1990-09-09",
                    },
                    data: [{ taxStatus: TaxStatus.POSTTAX } as PlanOffering],
                },
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadPlanOfferingsFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                planOfferingsEntities: {
                    ids: [`111-333-${EnrollmentMethod.FACE_TO_FACE}-AZ-1990-09-09`],
                    entities: {
                        [`111-333-${EnrollmentMethod.FACE_TO_FACE}-AZ-1990-09-09`]: {
                            identifiers: {
                                mpGroup: 111,
                                memberId: 333,
                                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                                stateAbbreviation: "AZ",
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

            const action = PlanOfferingsActions.loadPlanOfferingsFailure({
                error: {
                    identifiers: {
                        mpGroup: 111,
                        memberId: 333,
                        enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                        stateAbbreviation: "AZ",
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

    describe("loadPlanOfferingRiders action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                planOfferingRidersEntities: {
                    ids: [`555-111-333-${EnrollmentMethod.FACE_TO_FACE}-AZ-`],
                    entities: {
                        [`555-111-333-${EnrollmentMethod.FACE_TO_FACE}-AZ-`]: {
                            identifiers: {
                                planOfferingId: 555,
                                mpGroup: 111,
                                memberId: 333,
                                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                                stateAbbreviation: "AZ",
                                coverageEffectiveDate: undefined,
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = PlanOfferingsActions.loadPlanOfferingRiders({
                planOfferingId: 555,
                mpGroup: 111,
                memberId: 333,
                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                stateAbbreviation: "AZ",
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadPlanOfferingRidersSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                planOfferingRidersEntities: {
                    ids: [`555-111-333-${EnrollmentMethod.FACE_TO_FACE}-AZ-`],
                    entities: {
                        [`555-111-333-${EnrollmentMethod.FACE_TO_FACE}-AZ-`]: {
                            identifiers: {
                                planOfferingId: 555,
                                mpGroup: 111,
                                memberId: 333,
                                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                                stateAbbreviation: "AZ",
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [{ taxStatus: TaxStatus.PRETAX } as PlanOffering],
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = PlanOfferingsActions.loadPlanOfferingRidersSuccess({
                planOfferingRidersEntity: {
                    identifiers: {
                        planOfferingId: 555,
                        mpGroup: 111,
                        memberId: 333,
                        enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                        stateAbbreviation: "AZ",
                    },
                    data: [{ taxStatus: TaxStatus.PRETAX } as PlanOffering],
                },
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadPlanOfferingRidersFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                planOfferingRidersEntities: {
                    ids: [`555-111-333-${EnrollmentMethod.FACE_TO_FACE}-AZ-`],
                    entities: {
                        [`555-111-333-${EnrollmentMethod.FACE_TO_FACE}-AZ-`]: {
                            identifiers: {
                                planOfferingId: 555,
                                mpGroup: 111,
                                memberId: 333,
                                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                                stateAbbreviation: "AZ",
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

            const action = PlanOfferingsActions.loadPlanOfferingRidersFailure({
                error: {
                    identifiers: {
                        planOfferingId: 555,
                        mpGroup: 111,
                        memberId: 333,
                        enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                        stateAbbreviation: "AZ",
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

    describe("loadCoverageDateRecord action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                coverageDatesRecordEntities: {
                    ids: [`111-333-${EnrollmentType.QUALIFYING_LIFE_EVENT}-1990-09-09`],
                    entities: {
                        [`111-333-${EnrollmentType.QUALIFYING_LIFE_EVENT}-1990-09-09`]: {
                            identifiers: {
                                mpGroup: 111,
                                memberId: 333,
                                coverageDatesEnrollmentType: CoverageDatesEnrollmentType.QUALIFYING_LIFE_EVENT,
                                referenceDate: "1990-09-09",
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = PlanOfferingsActions.loadCoverageDateRecord({
                mpGroup: 111,
                memberId: 333,
                coverageDatesEnrollmentType: CoverageDatesEnrollmentType.QUALIFYING_LIFE_EVENT,
                referenceDate: "1990-09-09",
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadCoverageDateRecordSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                coverageDatesRecordEntities: {
                    ids: [`111-333-${EnrollmentType.QUALIFYING_LIFE_EVENT}-1990-09-09`],
                    entities: {
                        [`111-333-${EnrollmentType.QUALIFYING_LIFE_EVENT}-1990-09-09`]: {
                            identifiers: {
                                mpGroup: 111,
                                memberId: 333,
                                coverageDatesEnrollmentType: CoverageDatesEnrollmentType.QUALIFYING_LIFE_EVENT,
                                referenceDate: "1990-09-09",
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: {
                                    121212: {
                                        defaultCoverageStartDate: "1985-01-05",
                                        earliestCoverageStartDate: "1985-01-30",
                                        latestCoverageStartDate: "1985-12-01",
                                        isContinuous: true,
                                    },
                                },
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = PlanOfferingsActions.loadCoverageDateRecordSuccess({
                coverageDatesRecordEntity: {
                    identifiers: {
                        mpGroup: 111,
                        memberId: 333,
                        coverageDatesEnrollmentType: CoverageDatesEnrollmentType.QUALIFYING_LIFE_EVENT,
                        referenceDate: "1990-09-09",
                    },
                    data: {
                        121212: {
                            defaultCoverageStartDate: "1985-01-05",
                            earliestCoverageStartDate: "1985-01-30",
                            latestCoverageStartDate: "1985-12-01",
                            isContinuous: true,
                        },
                    },
                },
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadCoverageDateRecordFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                coverageDatesRecordEntities: {
                    ids: [`111-333-${EnrollmentType.QUALIFYING_LIFE_EVENT}-1990-09-09`],
                    entities: {
                        [`111-333-${EnrollmentType.QUALIFYING_LIFE_EVENT}-1990-09-09`]: {
                            identifiers: {
                                mpGroup: 111,
                                memberId: 333,
                                coverageDatesEnrollmentType: CoverageDatesEnrollmentType.QUALIFYING_LIFE_EVENT,
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

            const action = PlanOfferingsActions.loadCoverageDateRecordFailure({
                error: {
                    identifiers: {
                        mpGroup: 111,
                        memberId: 333,
                        coverageDatesEnrollmentType: CoverageDatesEnrollmentType.QUALIFYING_LIFE_EVENT,
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

    describe("loadCoverageLevel action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                coverageLevelsEntities: {
                    ids: ["198222-11-false--"],
                    entities: {
                        ["198222-11-false--"]: {
                            identifiers: {
                                mpGroup: 198222,
                                planId: 11,
                                parentCoverageLevelId: undefined,
                                fetchRetainRiders: false,
                                stateCode: undefined,
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = PlanOfferingsActions.loadCoverageLevels({
                planId: 11,
                mpGroup: 198222,
                fetchRetainRiders: false,
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadCoverageLevelsSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                coverageLevelsEntities: {
                    ids: ["198222-11-false--"],
                    entities: {
                        ["198222-11-false--"]: {
                            identifiers: {
                                mpGroup: 198222,
                                planId: 11,
                                fetchRetainRiders: false,
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [{ name: "Individual" } as CoverageLevel],
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = PlanOfferingsActions.loadCoverageLevelsSuccess({
                coverageLevelsEntity: {
                    identifiers: {
                        mpGroup: 198222,
                        planId: 11,
                        fetchRetainRiders: false,
                    },
                    data: [{ name: "Individual" } as CoverageLevel],
                },
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadCoverageLevelsFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                coverageLevelsEntities: {
                    ids: ["198222-11-false--"],
                    entities: {
                        ["198222-11-false--"]: {
                            identifiers: {
                                mpGroup: 198222,
                                planId: 11,
                                fetchRetainRiders: false,
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

            const action = PlanOfferingsActions.loadCoverageLevelsFailure({
                error: {
                    identifiers: {
                        mpGroup: 198222,
                        planId: 11,
                        fetchRetainRiders: false,
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

    describe("loadKnockoutQuestions action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                knockoutQuestionsEntities: {
                    ids: ["11-198222-222-AL"],
                    entities: {
                        ["11-198222-222-AL"]: {
                            identifiers: {
                                planOfferingId: 11,
                                stateAbbreviation: "AL",
                                mpGroup: 198222,
                                memberId: 222,
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = PlanOfferingsActions.loadKnockoutQuestions({
                planOfferingId: 11,
                mpGroup: 198222,
                memberId: 222,
                stateAbbreviation: "AL",
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadKnockoutQuestionsSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                knockoutQuestionsEntities: {
                    ids: ["11-198222-222-AL"],
                    entities: {
                        ["11-198222-222-AL"]: {
                            identifiers: {
                                planOfferingId: 11,
                                stateAbbreviation: "AL",
                                mpGroup: 198222,
                                memberId: 222,
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [
                                    {
                                        id: 1111,
                                        title: "title",
                                        body: "body",
                                        question: { text: "Question Text" } as Question,
                                    } as KnockoutQuestion,
                                ],
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = PlanOfferingsActions.loadKnockoutQuestionsSuccess({
                knockoutQuestionsEntity: {
                    identifiers: {
                        planOfferingId: 11,
                        stateAbbreviation: "AL",
                        mpGroup: 198222,
                        memberId: 222,
                    },
                    data: [
                        {
                            id: 1111,
                            title: "title",
                            body: "body",
                            question: { text: "Question Text" } as Question,
                        } as KnockoutQuestion,
                    ],
                },
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadKnockoutQuestionsFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                knockoutQuestionsEntities: {
                    ids: ["11-198222-222-AL"],
                    entities: {
                        ["11-198222-222-AL"]: {
                            identifiers: {
                                planOfferingId: 11,
                                mpGroup: 198222,
                                memberId: 222,
                                stateAbbreviation: "AL",
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

            const action = PlanOfferingsActions.loadKnockoutQuestionsFailure({
                error: {
                    identifiers: {
                        planOfferingId: 11,
                        mpGroup: 198222,
                        memberId: 222,
                        stateAbbreviation: "AL",
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

    describe("loadPlanOfferingPricings action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                planOfferingPricingsEntities: {
                    ids: ["555-333-111----------false"],
                    entities: {
                        ["555-333-111----------false"]: {
                            identifiers: {
                                mpGroup: 111,
                                memberId: 333,
                                planOfferingId: 555,
                                memberIsTobaccoUser: null,
                                spouseIsTobaccoUser: null,
                                baseBenefitAmount: undefined,
                                coverageEffectiveDate: undefined,
                                includeFee: false,
                                parentPlanCoverageLevelId: undefined,
                                parentPlanId: undefined,
                                riskClassId: undefined,
                                shoppingCartItemId: undefined,
                                stateAbbreviation: undefined,
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = PlanOfferingsActions.loadPlanOfferingPricings({
                mpGroup: 111,
                memberId: 333,
                planOfferingId: 555,
                memberIsTobaccoUser: null,
                spouseIsTobaccoUser: null,
                includeFee: false,
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadPlanOfferingPricingsSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                planOfferingPricingsEntities: {
                    ids: ["555-333-111----------false"],
                    entities: {
                        ["555-333-111----------false"]: {
                            identifiers: {
                                mpGroup: 111,
                                memberId: 333,
                                planOfferingId: 555,
                                memberIsTobaccoUser: null,
                                spouseIsTobaccoUser: null,
                                baseBenefitAmount: undefined,
                                coverageEffectiveDate: undefined,
                                parentPlanCoverageLevelId: undefined,
                                parentPlanId: undefined,
                                riskClassId: undefined,
                                shoppingCartItemId: undefined,
                                stateAbbreviation: undefined,
                                includeFee: false,
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [{ benefitAmount: 9000 } as PlanOfferingPricing],
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = PlanOfferingsActions.loadPlanOfferingPricingsSuccess({
                planOfferingPricingsEntity: {
                    identifiers: {
                        mpGroup: 111,
                        memberId: 333,
                        planOfferingId: 555,
                        memberIsTobaccoUser: null,
                        spouseIsTobaccoUser: null,
                        baseBenefitAmount: undefined,
                        coverageEffectiveDate: undefined,
                        parentPlanCoverageLevelId: undefined,
                        parentPlanId: undefined,
                        riskClassId: undefined,
                        shoppingCartItemId: undefined,
                        stateAbbreviation: undefined,
                        includeFee: false,
                    },
                    data: [{ benefitAmount: 9000 } as PlanOfferingPricing],
                },
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadPlanOfferingPricingsFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                planOfferingPricingsEntities: {
                    ids: ["555-333-111----------false"],
                    entities: {
                        ["555-333-111----------false"]: {
                            identifiers: {
                                mpGroup: 111,
                                memberId: 333,
                                planOfferingId: 555,
                                memberIsTobaccoUser: null,
                                spouseIsTobaccoUser: null,
                                baseBenefitAmount: undefined,
                                coverageEffectiveDate: undefined,
                                parentPlanCoverageLevelId: undefined,
                                parentPlanId: undefined,
                                riskClassId: undefined,
                                shoppingCartItemId: undefined,
                                stateAbbreviation: undefined,
                                includeFee: false,
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

            const action = PlanOfferingsActions.loadPlanOfferingPricingsFailure({
                error: {
                    identifiers: {
                        mpGroup: 111,
                        memberId: 333,
                        planOfferingId: 555,
                        memberIsTobaccoUser: null,
                        spouseIsTobaccoUser: null,
                        baseBenefitAmount: undefined,
                        coverageEffectiveDate: undefined,
                        parentPlanCoverageLevelId: undefined,
                        parentPlanId: undefined,
                        riskClassId: undefined,
                        shoppingCartItemId: undefined,
                        stateAbbreviation: undefined,
                        includeFee: false,
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
