import { Action } from "@ngrx/store";

import * as MembersActions from "./members.actions";
import { reducer } from "./members.reducer";
import { State, initialState } from "./members.state";
import { mockCrossBorderRules } from "./members.mocks";
import {
    AsyncStatus,
    RiskClass,
    Salary,
    ContactType,
    MemberProfile,
    MemberDependent,
    MemberFlexDollar,
    MemberContact,
    MemberQualifyingEvent,
    ApiError,
} from "@empowered/constants";

describe("Members Reducer", () => {
    describe("setSelectedId action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                selectedMemberId: 123,
            };

            const action = MembersActions.setSelectedMemberId({ memberId: 123 });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadMemberProfile action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                membersEntities: {
                    ids: ["444-123"],
                    entities: {
                        "444-123": {
                            identifiers: {
                                mpGroup: 444,
                                memberId: 123,
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = MembersActions.loadMemberProfile({ mpGroup: 444, memberId: 123 });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadMemberProfileSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                membersEntities: {
                    ids: ["444-123"],
                    entities: {
                        "444-123": {
                            identifiers: {
                                mpGroup: 444,
                                memberId: 123,
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: { id: 123 } as MemberProfile,
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = MembersActions.loadMemberProfileSuccess({
                memberProfileEntity: {
                    identifiers: {
                        mpGroup: 444,
                        memberId: 123,
                    },
                    data: { id: 123 } as MemberProfile,
                },
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadMemberProfileFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                membersEntities: {
                    ids: ["444-123"],
                    entities: {
                        "444-123": {
                            identifiers: {
                                mpGroup: 444,
                                memberId: 123,
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

            const action = MembersActions.loadMemberProfileFailure({
                error: {
                    identifiers: {
                        mpGroup: 444,
                        memberId: 123,
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

    describe("loadSalaries action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                salariesEntities: {
                    ids: ["444-123"],
                    entities: {
                        "444-123": {
                            identifiers: {
                                mpGroup: 444,
                                memberId: 123,
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = MembersActions.loadSalaries({
                mpGroup: 444,
                memberId: 123,
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadSalariessSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                salariesEntities: {
                    ids: ["444-123"],
                    entities: {
                        "444-123": {
                            identifiers: {
                                mpGroup: 444,
                                memberId: 123,
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [{ annualSalary: "909" } as Salary],
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = MembersActions.loadSalariesSuccess({
                salariesEntity: {
                    identifiers: {
                        mpGroup: 444,
                        memberId: 123,
                    },
                    data: [{ annualSalary: "909" } as Salary],
                },
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadSalariesFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                salariesEntities: {
                    ids: ["444-123"],
                    entities: {
                        "444-123": {
                            identifiers: {
                                mpGroup: 444,
                                memberId: 123,
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

            const action = MembersActions.loadSalariesFailure({
                error: {
                    identifiers: {
                        mpGroup: 444,
                        memberId: 123,
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

    describe("loadMemberDependents action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                memberDependentsEntities: {
                    ids: ["444-123"],
                    entities: {
                        "444-123": {
                            identifiers: {
                                mpGroup: 444,
                                memberId: 123,
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = MembersActions.loadMemberDependents({
                mpGroup: 444,
                memberId: 123,
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadMemberDependentsSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                memberDependentsEntities: {
                    ids: ["444-123"],
                    entities: {
                        "444-123": {
                            identifiers: {
                                mpGroup: 444,
                                memberId: 123,
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [{ name: "some dependent" } as MemberDependent],
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = MembersActions.loadMemberDependentsSuccess({
                memberDependentsEntity: {
                    identifiers: {
                        mpGroup: 444,
                        memberId: 123,
                    },
                    data: [{ name: "some dependent" } as MemberDependent],
                },
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadMemberDependentsFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                memberDependentsEntities: {
                    ids: ["444-123"],
                    entities: {
                        "444-123": {
                            identifiers: {
                                mpGroup: 444,
                                memberId: 123,
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

            const action = MembersActions.loadMemberDependentsFailure({
                error: {
                    identifiers: {
                        mpGroup: 444,
                        memberId: 123,
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

    describe("loadRiskClasses action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                riskClassesEntities: {
                    ids: ["444-123"],
                    entities: {
                        "444-123": {
                            identifiers: {
                                mpGroup: 444,
                                memberId: 123,
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = MembersActions.loadRiskClasses({
                mpGroup: 444,
                memberId: 123,
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
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
                    ids: ["444-123"],
                    entities: {
                        "444-123": {
                            identifiers: {
                                mpGroup: 444,
                                memberId: 123,
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: {
                                    memberRiskClasses: [{ name: "some-risk-class-name" } as RiskClass],
                                    aflacCarrierRiskClasses: [
                                        { name: "some-risk-class-name" } as RiskClass,
                                        { name: "some-other-risk-class-name" } as RiskClass,
                                    ],
                                },
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = MembersActions.loadRiskClassesSuccess({
                riskClassesEntity: {
                    identifiers: {
                        mpGroup: 444,
                        memberId: 123,
                    },
                    data: {
                        memberRiskClasses: [{ name: "some-risk-class-name" } as RiskClass],
                        aflacCarrierRiskClasses: [
                            { name: "some-risk-class-name" } as RiskClass,
                            { name: "some-other-risk-class-name" } as RiskClass,
                        ],
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

    describe("loadRiskClassesFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                riskClassesEntities: {
                    ids: ["444-123"],
                    entities: {
                        "444-123": {
                            identifiers: {
                                mpGroup: 444,
                                memberId: 123,
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

            const action = MembersActions.loadRiskClassesFailure({
                error: {
                    identifiers: {
                        mpGroup: 444,
                        memberId: 123,
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

    describe("getQualifyingEventSet action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                qualifyingEventsEntities: {
                    ids: ["444-123"],
                    entities: {
                        "444-123": {
                            identifiers: {
                                mpGroup: 444,
                                memberId: 123,
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = MembersActions.loadQualifyingEvents({
                mpGroup: 444,
                memberId: 123,
            });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("getQualifyingEventSetSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                qualifyingEventsEntities: {
                    ids: ["444-123"],
                    entities: {
                        "444-123": {
                            identifiers: {
                                mpGroup: 444,
                                memberId: 123,
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [{ memberComment: "some member comment" } as MemberQualifyingEvent],
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = MembersActions.loadQualifyingEventsSuccess({
                qualifyingEventsEntity: {
                    identifiers: {
                        mpGroup: 444,
                        memberId: 123,
                    },
                    data: [{ memberComment: "some member comment" } as MemberQualifyingEvent],
                },
            });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("getQualifyingEventSetFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                qualifyingEventsEntities: {
                    ids: ["444-123"],
                    entities: {
                        "444-123": {
                            identifiers: {
                                mpGroup: 444,
                                memberId: 123,
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

            const action = MembersActions.loadQualifyingEventsFailure({
                error: {
                    identifiers: {
                        mpGroup: 444,
                        memberId: 123,
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

    describe("loadMemberContacts action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                memberContactsEntities: {
                    ids: ["444-123"],
                    entities: {
                        "444-123": {
                            identifiers: {
                                mpGroup: 444,
                                memberId: 123,
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = MembersActions.loadMemberContacts({
                mpGroup: 444,
                memberId: 123,
            });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadMemberContactsSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                memberContactsEntities: {
                    ids: ["444-123"],
                    entities: {
                        "444-123": {
                            identifiers: {
                                mpGroup: 444,
                                memberId: 123,
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [{ contactType: ContactType.HOME } as MemberContact],
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = MembersActions.loadMemberContactsSuccess({
                memberContactsEntity: {
                    identifiers: {
                        mpGroup: 444,
                        memberId: 123,
                    },
                    data: [{ contactType: ContactType.HOME } as MemberContact],
                },
            });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadMemberContactsFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                memberContactsEntities: {
                    ids: ["444-123"],
                    entities: {
                        "444-123": {
                            identifiers: {
                                mpGroup: 444,
                                memberId: 123,
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

            const action = MembersActions.loadMemberContactsFailure({
                error: {
                    identifiers: {
                        mpGroup: 444,
                        memberId: 123,
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

    describe("loadMemberFlexDollars action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                memberFlexDollarsEntities: {
                    ids: ["444-123"],
                    entities: {
                        "444-123": {
                            identifiers: {
                                mpGroup: 444,
                                memberId: 123,
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = MembersActions.loadMemberFlexDollars({
                mpGroup: 444,
                memberId: 123,
            });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadMemberFlexDollarsSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                memberFlexDollarsEntities: {
                    ids: ["444-123"],
                    entities: {
                        "444-123": {
                            identifiers: {
                                mpGroup: 444,
                                memberId: 123,
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [{ amount: 311 } as MemberFlexDollar],
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = MembersActions.loadMemberFlexDollarsSuccess({
                memberFlexDollarsEntity: {
                    identifiers: {
                        mpGroup: 444,
                        memberId: 123,
                    },
                    data: [{ amount: 311 } as MemberFlexDollar],
                },
            });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadMemberFlexDollarsFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                memberFlexDollarsEntities: {
                    ids: ["444-123"],
                    entities: {
                        "444-123": {
                            identifiers: {
                                mpGroup: 444,
                                memberId: 123,
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

            const action = MembersActions.loadMemberFlexDollarsFailure({
                error: {
                    identifiers: {
                        mpGroup: 444,
                        memberId: 123,
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

    describe("getCrossBorderRules action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                crossBorderRulesEntities: {
                    ids: ["444-123"],
                    entities: {
                        "444-123": {
                            identifiers: {
                                mpGroup: 444,
                                memberId: 123,
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = MembersActions.loadCrossBorderRules({
                mpGroup: 444,
                memberId: 123,
            });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("getCrossBorderRulesSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                crossBorderRulesEntities: {
                    ids: ["444-123"],
                    entities: {
                        "444-123": {
                            identifiers: {
                                mpGroup: 444,
                                memberId: 123,
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: mockCrossBorderRules,
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = MembersActions.loadCrossBorderRulesSuccess({
                crossBorderRulesEntity: {
                    identifiers: {
                        mpGroup: 444,
                        memberId: 123,
                    },
                    data: mockCrossBorderRules,
                },
            });

            const state = reducer({ ...initialState }, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("getCrossBorderRulesFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                crossBorderRulesEntities: {
                    ids: ["444-123"],
                    entities: {
                        "444-123": {
                            identifiers: {
                                mpGroup: 444,
                                memberId: 123,
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

            const action = MembersActions.loadCrossBorderRulesFailure({
                error: {
                    identifiers: {
                        mpGroup: 444,
                        memberId: 123,
                    },
                    data: { message: "some api error message" } as ApiError,
                },
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
