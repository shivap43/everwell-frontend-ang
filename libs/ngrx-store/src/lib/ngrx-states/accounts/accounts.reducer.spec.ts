import { Action } from "@ngrx/store";
import { AccountList, FilterParameters } from "@empowered/api";
import {
    Account,
    AsyncStatus,
    GroupAttributeName,
    ProductId,
    SucceededAsyncData,
    PayFrequency,
    RiskClass,
    Exceptions,
    ExceptionType,
    ApiError,
    Admin,
} from "@empowered/constants";

import * as AccountsActions from "./accounts.actions";
import { reducer } from "./accounts.reducer";
import { State, initialState } from "./accounts.state";
import { GroupAttributeRecord } from "./accounts.model";

describe("Accounts Reducer", () => {
    describe("setDirect action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                direct: true,
            };

            const action = AccountsActions.setDirect({ direct: true });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("setSelectedMPGroup action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                selectedMPGroup: 222,
            };

            const action = AccountsActions.setSelectedMPGroup({ mpGroup: 222 });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadAccount action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                accountEntities: {
                    ids: [333],
                    entities: {
                        333: {
                            identifiers: { mpGroup: 333 },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = AccountsActions.loadAccount({ mpGroup: 333 });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });
    describe("loadAccountSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                accountEntities: {
                    ids: [333],
                    entities: {
                        333: {
                            identifiers: { mpGroup: 333 },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: { name: "account-333" } as Account,
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = AccountsActions.loadAccountSuccess({
                accountsEntity: { identifiers: { mpGroup: 333 }, data: { name: "account-333" } as Account },
            });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });
    describe("loadAccountFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                accountEntities: {
                    ids: [333],
                    entities: {
                        333: {
                            identifiers: { mpGroup: 333 },
                            data: {
                                status: AsyncStatus.FAILED,
                                value: null,
                                error: { message: "some api error message" } as ApiError,
                            },
                        },
                    },
                },
            };

            const action = AccountsActions.loadAccountFailure({
                error: { identifiers: { mpGroup: 333 }, data: { message: "some api error message" } as ApiError },
            });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadPayFrequencies action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                payFrequenciesEntities: {
                    ids: [22],
                    entities: {
                        22: {
                            identifiers: { mpGroup: 22 },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = AccountsActions.loadPayFrequencies({ mpGroup: 22 });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });
    describe("loadPayFrequenciesSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                payFrequenciesEntities: {
                    ids: [22],
                    entities: {
                        22: {
                            identifiers: { mpGroup: 22 },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [{ name: "pay-frequency-22" } as PayFrequency],
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = AccountsActions.loadPayFrequenciesSuccess({
                payFrequenciesEntity: {
                    identifiers: { mpGroup: 22 },
                    data: [{ name: "pay-frequency-22" } as PayFrequency],
                },
            });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });
    describe("loadPayFrequenciesFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                payFrequenciesEntities: {
                    ids: [22],
                    entities: {
                        22: {
                            identifiers: { mpGroup: 22 },
                            data: {
                                status: AsyncStatus.FAILED,
                                value: null,
                                error: { message: "some api error message" } as ApiError,
                            },
                        },
                    },
                },
            };

            const action = AccountsActions.loadPayFrequenciesFailure({
                error: {
                    identifiers: { mpGroup: 22 },
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

    describe("loadGroupAttributeRecord action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                groupAttributeRecordEntities: {
                    ids: [22],
                    entities: {
                        22: {
                            identifiers: { mpGroup: 22 },
                            data: {
                                status: AsyncStatus.LOADING,
                                // Unlike most cases when updating AsyncData within an Entity,
                                // because we want to attempt to retain existing values when making api calls for GroupAttributes,
                                // we update value and error when setting AsyncStatus to LOADING (use null if no existing value)
                                value: null,
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = AccountsActions.loadGroupAttributeRecord({
                mpGroup: 22,
                groupAttributeNames: ["some group attribute name" as GroupAttributeName],
            });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });

        it("should retain existing group attributes when going into a loading state", () => {
            const existingState: State = {
                ...initialState,
                groupAttributeRecordEntities: {
                    ids: [22],
                    entities: {
                        22: {
                            identifiers: { mpGroup: 22 },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                // Some existing group attribute
                                value: {
                                    "some-old-group-attribute": {
                                        id: 1,
                                        attribute: "some-old-group-attribute",
                                        value: "some-old-value-22",
                                    },
                                } as GroupAttributeRecord,
                                error: null,
                            },
                        },
                    },
                },
            };
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                groupAttributeRecordEntities: {
                    ids: [22],
                    entities: {
                        22: {
                            identifiers: { mpGroup: 22 },
                            data: {
                                status: AsyncStatus.LOADING,
                                // Some existing group attribute
                                value: {
                                    "some-old-group-attribute": {
                                        id: 1,
                                        attribute: "some-old-group-attribute",
                                        value: "some-old-value-22",
                                    },
                                } as GroupAttributeRecord,
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = AccountsActions.loadGroupAttributeRecord({
                mpGroup: 22,
                groupAttributeNames: ["some group attribute name" as GroupAttributeName],
            });

            const state = reducer(existingState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });
    describe("loadGroupAttributeRecordSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                groupAttributeRecordEntities: {
                    ids: [22],
                    entities: {
                        22: {
                            identifiers: { mpGroup: 22 },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: {
                                    "some-group-attribute": {
                                        id: 1,
                                        attribute: "some-group-attribute",
                                        value: "some-value-22",
                                    },
                                } as GroupAttributeRecord,
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = AccountsActions.loadGroupAttributeRecordSuccess({
                groupAttributeRecordEntity: {
                    identifiers: { mpGroup: 22 },
                    data: {
                        "some-group-attribute": {
                            id: 1,
                            attribute: "some-group-attribute",
                            value: "some-value-22",
                        },
                    } as GroupAttributeRecord,
                },
            });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });

        it("should merge GroupAttributeRecord with upserting groupAttributeRecordEntity", () => {
            const existingState: State = {
                ...initialState,
                groupAttributeRecordEntities: {
                    ids: [22],
                    entities: {
                        22: {
                            identifiers: { mpGroup: 22 },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: {
                                    // Should be updated
                                    "some-group-attribute": {
                                        id: 1,
                                        attribute: "some-group-attribute",
                                        value: "some-value-22",
                                    },
                                    // Should be untouched
                                    "some-other-group-attribute": {
                                        id: 2,
                                        attribute: "some-other-group-attribute",
                                        value: "some-other-value-22",
                                    },
                                    // Should be removed (set to null)
                                    "some-to-be-nulled-group-attribute": {
                                        id: 3,
                                        attribute: "some-to-be-nulled-group-attribute",
                                        value: "some-to-be-nulled-value-22",
                                    },
                                } as GroupAttributeRecord,
                                error: null,
                            },
                        },
                    },
                },
            };

            // Expectation of new state
            const expectedState = {
                ...initialState,
                groupAttributeRecordEntities: {
                    ids: [22],
                    entities: {
                        22: {
                            identifiers: { mpGroup: 22 },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: {
                                    // Expected update
                                    "some-group-attribute": {
                                        id: 1,
                                        attribute: "some-group-attribute",
                                        value: "some-updated-value-22",
                                    },
                                    // Expected untouched existing value
                                    "some-other-group-attribute": {
                                        id: 2,
                                        attribute: "some-other-group-attribute",
                                        value: "some-other-value-22",
                                    },
                                    // Expected removed value (null)
                                    "some-to-be-nulled-group-attribute": null,
                                } as GroupAttributeRecord,
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = AccountsActions.loadGroupAttributeRecordSuccess({
                groupAttributeRecordEntity: {
                    identifiers: { mpGroup: 22 },
                    data: {
                        // Attempting to update value
                        "some-group-attribute": {
                            id: 1,
                            attribute: "some-group-attribute",
                            value: "some-updated-value-22",
                        },
                        // Intentionally not including "some-other-group-attribute" (so it shouldn't be removed)

                        // Trying to remove "some-to-be-nulled-group-attribute" by setting it to null
                        "some-to-be-nulled-group-attribute": null,
                    } as GroupAttributeRecord,
                },
            });

            const state = reducer(existingState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });

        it("should set groupAttributeRecord with upserting groupAttributeRecordEntity if previous entity didn't have groupAttributeRecord", () => {
            const existingState = {
                ...initialState,
                groupAttributeRecordEntities: {
                    ids: [22],
                    entities: {
                        22: {
                            identifiers: { mpGroup: 22 },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: {
                                    // Intentionally not setting groupAttributeRecord
                                },
                                error: null,
                            } as SucceededAsyncData<GroupAttributeRecord>,
                        },
                    },
                },
            };

            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                groupAttributeRecordEntities: {
                    ids: [22],
                    entities: {
                        22: {
                            identifiers: { mpGroup: 22 },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                // Some new value that should be added
                                value: {
                                    "some-group-attribute": {
                                        id: 1,
                                        attribute: "some-group-attribute",
                                        value: "some-value-22",
                                    },
                                } as GroupAttributeRecord,
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = AccountsActions.loadGroupAttributeRecordSuccess({
                groupAttributeRecordEntity: {
                    identifiers: { mpGroup: 22 },
                    data: {
                        "some-group-attribute": {
                            id: 1,
                            attribute: "some-group-attribute",
                            value: "some-value-22",
                        },
                    } as GroupAttributeRecord,
                },
            });

            const state = reducer(existingState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });
    describe("loadGroupAttributeRecordFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                groupAttributeRecordEntities: {
                    ids: [22],
                    entities: {
                        22: {
                            identifiers: { mpGroup: 22 },
                            data: {
                                status: AsyncStatus.FAILED,
                                value: null,
                                error: { message: "some api error message" } as ApiError,
                            },
                        },
                    },
                },
            };

            const action = AccountsActions.loadGroupAttributeRecordFailure({
                error: {
                    identifiers: { mpGroup: 22 },
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

    describe("loadRiskClasses action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                riskClassesEntities: {
                    ids: [22],
                    entities: {
                        22: {
                            identifiers: { mpGroup: 22 },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = AccountsActions.loadRiskClasses({ mpGroup: 22 });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });
    describe("loadRiskClassesSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                riskClassesEntities: {
                    ids: [22],
                    entities: {
                        22: {
                            identifiers: { mpGroup: 22 },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [{ name: "risk-class-22" } as RiskClass],
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = AccountsActions.loadRiskClassesSuccess({
                riskClassesEntity: {
                    identifiers: { mpGroup: 22 },
                    data: [{ name: "risk-class-22" } as RiskClass],
                },
            });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });
    describe("loadRiskClassesFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                riskClassesEntities: {
                    ids: [22],
                    entities: {
                        22: {
                            identifiers: { mpGroup: 22 },
                            data: {
                                status: AsyncStatus.FAILED,
                                value: null,
                                error: { message: "some api error message" } as ApiError,
                            },
                        },
                    },
                },
            };

            const action = AccountsActions.loadRiskClassesFailure({
                error: {
                    identifiers: { mpGroup: 22 },
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

    describe("loadDualPeoRiskClassIdsSet action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                dualPeoRiskClassIdsSetsEntities: {
                    ids: [22],
                    entities: {
                        22: {
                            identifiers: { mpGroup: 22 },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = AccountsActions.loadDualPeoRiskClassIdsSet({ mpGroup: 22 });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });
    describe("loadDualPeoRiskClassIdsSetSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                dualPeoRiskClassIdsSetsEntities: {
                    ids: [22],
                    entities: {
                        22: {
                            identifiers: { mpGroup: 22 },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: {
                                    dualPeoRiskClassIds: {
                                        [ProductId.ACCIDENT]: [2],
                                        [ProductId.SHORT_TERM_DISABILITY]: [4],
                                    },
                                    aflacCarrierDualPeoRiskClassIds: {
                                        [ProductId.ACCIDENT]: [1, 2, 3],
                                        [ProductId.SHORT_TERM_DISABILITY]: [4, 5, 6],
                                    },
                                },
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = AccountsActions.loadDualPeoRiskClassIdsSetSuccess({
                dualPeoRiskClassIdsSetsEntity: {
                    identifiers: { mpGroup: 22 },
                    data: {
                        dualPeoRiskClassIds: {
                            [ProductId.ACCIDENT]: [2],
                            [ProductId.SHORT_TERM_DISABILITY]: [4],
                        },
                        aflacCarrierDualPeoRiskClassIds: {
                            [ProductId.ACCIDENT]: [1, 2, 3],
                            [ProductId.SHORT_TERM_DISABILITY]: [4, 5, 6],
                        },
                    },
                },
            });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });
    describe("loadDualPeoRiskClassIdsSetFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                dualPeoRiskClassIdsSetsEntities: {
                    ids: [22],
                    entities: {
                        22: {
                            identifiers: { mpGroup: 22 },
                            data: {
                                status: AsyncStatus.FAILED,
                                value: null,
                                error: { message: "some api error message" } as ApiError,
                            },
                        },
                    },
                },
            };

            const action = AccountsActions.loadDualPeoRiskClassIdsSetFailure({
                error: {
                    identifiers: { mpGroup: 22 },
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

    describe("loadExceptions action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                exceptionsEntities: {
                    ids: [`22-${ExceptionType.AG_SPOUSE_BENEFIT_PERCENTAGE}`],
                    entities: {
                        [`22-${ExceptionType.AG_SPOUSE_BENEFIT_PERCENTAGE}`]: {
                            identifiers: { mpGroup: 22, exceptionType: ExceptionType.AG_SPOUSE_BENEFIT_PERCENTAGE },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = AccountsActions.loadExceptions({
                mpGroup: 22,
                exceptionType: ExceptionType.AG_SPOUSE_BENEFIT_PERCENTAGE,
            });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });
    describe("loadExceptionsSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                exceptionsEntities: {
                    ids: [`22-${ExceptionType.AG_SPOUSE_BENEFIT_PERCENTAGE}`],
                    entities: {
                        [`22-${ExceptionType.AG_SPOUSE_BENEFIT_PERCENTAGE}`]: {
                            identifiers: { mpGroup: 22, exceptionType: ExceptionType.AG_SPOUSE_BENEFIT_PERCENTAGE },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [{ type: "some exception type" } as Exceptions],
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = AccountsActions.loadExceptionsSuccess({
                exceptionsEntity: {
                    identifiers: { mpGroup: 22, exceptionType: ExceptionType.AG_SPOUSE_BENEFIT_PERCENTAGE },
                    data: [{ type: "some exception type" } as Exceptions],
                },
            });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });
    describe("loadExceptionsFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                exceptionsEntities: {
                    ids: [`22-${ExceptionType.AG_SPOUSE_BENEFIT_PERCENTAGE}`],
                    entities: {
                        [`22-${ExceptionType.AG_SPOUSE_BENEFIT_PERCENTAGE}`]: {
                            identifiers: { mpGroup: 22, exceptionType: ExceptionType.AG_SPOUSE_BENEFIT_PERCENTAGE },
                            data: {
                                status: AsyncStatus.FAILED,
                                value: null,
                                error: { message: "some api error message" } as ApiError,
                            },
                        },
                    },
                },
            };

            const action = AccountsActions.loadExceptionsFailure({
                error: {
                    identifiers: { mpGroup: 22, exceptionType: ExceptionType.AG_SPOUSE_BENEFIT_PERCENTAGE },
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
    describe("loadAccountAdmin action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                accountAdminsEntities: {
                    ids: ["333"],
                    entities: {
                        ["333"]: {
                            identifiers: { mpGroup: 333 },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = AccountsActions.loadAccountAdmins({
                mpGroup: 333,
            });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });
    describe("loadAccountAdmin action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                accountAdminsEntities: {
                    ids: ["333"],
                    entities: {
                        ["333"]: {
                            identifiers: { mpGroup: 333 },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [{ id: 1 } as Admin],
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = AccountsActions.loadAccountAdminsSuccess({
                accountAdminsEntity: {
                    identifiers: { mpGroup: 333 },
                    data: [{ id: 1 } as Admin],
                },
            });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });
    describe("loadAccountAdminFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                accountAdminsEntities: {
                    ids: ["333"],
                    entities: {
                        ["333"]: {
                            identifiers: { mpGroup: 333 },
                            data: {
                                status: AsyncStatus.FAILED,
                                value: null,
                                error: { message: "some api error message" } as ApiError,
                            },
                        },
                    },
                },
            };

            const action = AccountsActions.loadAccountAdminsFailure({
                error: {
                    identifiers: { mpGroup: 333 },
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
