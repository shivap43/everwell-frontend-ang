import { Action } from "@ngrx/store";
import { EnrollmentMethodDetail } from "@empowered/api";
import * as EnrollmentsActions from "./enrollments.actions";
import { reducer } from "./enrollments.reducer";
import { State, initialState } from "./enrollments.state";
import { GlobalActions } from "../global";
import { AsyncStatus, EnrollmentRider, EnrollmentDependent, EnrollmentBeneficiary, Enrollments, ApiError } from "@empowered/constants";
import { HttpResponse } from "@angular/common/http";

describe("Enrollments Reducer", () => {
    describe("GlobalActions.clearMemberRelatedState action", () => {
        it("should update the state in an immutable way", () => {
            const temporaryInitialState: State = {
                ...initialState,
                enrollmentsEntities: {
                    ids: ["111-222"],
                    entities: {
                        "111-222": {
                            identifiers: { mpGroup: 111, memberId: 222 },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
                selectedEnrollmentId: 111,
            };

            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                selectedEnrollmentId: 111,
            };

            const action = GlobalActions.clearMemberRelatedState();

            const state = reducer(temporaryInitialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("getEnrollments action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                enrollmentsEntities: {
                    ids: ["111-222"],
                    entities: {
                        "111-222": {
                            identifiers: { mpGroup: 111, memberId: 222 },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = EnrollmentsActions.loadEnrollments({ mpGroup: 111, memberId: 222 });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("getEnrollmentsSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                enrollmentsEntities: {
                    ids: ["111-222"],
                    entities: {
                        "111-222": {
                            identifiers: { mpGroup: 111, memberId: 222 },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [{ memberCost: 1 } as Enrollments],
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = EnrollmentsActions.loadEnrollmentsSuccess({
                enrollmentsEntity: {
                    identifiers: { mpGroup: 111, memberId: 222 },
                    data: [{ memberCost: 1 } as Enrollments],
                },
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("getEnrollmentsFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                enrollmentsEntities: {
                    ids: ["111-222"],
                    entities: {
                        "111-222": {
                            identifiers: { mpGroup: 111, memberId: 222 },
                            data: {
                                status: AsyncStatus.FAILED,
                                value: null,
                                error: { message: "some api error message" } as ApiError,
                            },
                        },
                    },
                },
            };

            const action = EnrollmentsActions.loadEnrollmentsFailure({
                error: {
                    identifiers: { mpGroup: 111, memberId: 222 },
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

    describe("loadEnrollmentRiders action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                enrollmentRidersEntities: {
                    ids: ["111-222-1"],
                    entities: {
                        "111-222-1": {
                            identifiers: { mpGroup: 111, memberId: 222, enrollmentId: 1 },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = EnrollmentsActions.loadEnrollmentRiders({ mpGroup: 111, memberId: 222, enrollmentId: 1 });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadEnrollmentRidersSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                enrollmentRidersEntities: {
                    ids: ["111-222-1"],
                    entities: {
                        "111-222-1": {
                            identifiers: { mpGroup: 111, memberId: 222, enrollmentId: 1 },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [{ id: 1 } as EnrollmentRider],
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = EnrollmentsActions.loadEnrollmentRidersSuccess({
                enrollmentRidersEntity: {
                    identifiers: { mpGroup: 111, memberId: 222, enrollmentId: 1 },
                    data: [{ id: 1 } as EnrollmentRider],
                },
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadEnrollmentRidersFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                enrollmentRidersEntities: {
                    ids: ["111-222-1"],
                    entities: {
                        "111-222-1": {
                            identifiers: { mpGroup: 111, memberId: 222, enrollmentId: 1 },
                            data: {
                                status: AsyncStatus.FAILED,
                                value: null,
                                error: { message: "some api error message" } as ApiError,
                            },
                        },
                    },
                },
            };

            const action = EnrollmentsActions.loadEnrollmentRidersFailure({
                error: {
                    identifiers: { mpGroup: 111, memberId: 222, enrollmentId: 1 },
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

    describe("getEnrollmentMethodDetails action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                enrollmentMethodDetailsEntities: {
                    ids: [111],
                    entities: {
                        111: {
                            identifiers: { mpGroup: 111 },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = EnrollmentsActions.loadEnrollmentMethodDetails({ mpGroup: 111 });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("getEnrollmentMethodDetailsSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                enrollmentMethodDetailsEntities: {
                    ids: [111],
                    entities: {
                        111: {
                            identifiers: { mpGroup: 111 },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [{ description: "some description" } as EnrollmentMethodDetail],
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = EnrollmentsActions.loadEnrollmentMethodDetailsSuccess({
                enrollmentMethodDetailsEntity: {
                    identifiers: { mpGroup: 111 },
                    data: [{ description: "some description" } as EnrollmentMethodDetail],
                },
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("getEnrollmentMethodDetailsFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                enrollmentMethodDetailsEntities: {
                    ids: [111],
                    entities: {
                        111: {
                            identifiers: { mpGroup: 111 },
                            data: {
                                status: AsyncStatus.FAILED,
                                value: null,
                                error: { message: "some api error message" } as ApiError,
                            },
                        },
                    },
                },
            };

            const action = EnrollmentsActions.loadEnrollmentMethodDetailsFailure({
                error: {
                    identifiers: { mpGroup: 111 },
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

    describe("unknown action", () => {
        it("should return the previous state", () => {
            const action = {} as Action;

            const result = reducer(initialState, action);

            expect(result).toBe(initialState);
        });
    });

    describe("loadEnrollmentBeneficiaries action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                enrollmentBeneficiariesEntities: {
                    ids: ["333-1-198222"],
                    entities: {
                        ["333-1-198222"]: {
                            identifiers: {
                                memberId: 333,
                                enrollmentId: 1,
                                mpGroup: 198222,
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = EnrollmentsActions.loadEnrollmentBeneficiaries({
                memberId: 333,
                enrollmentId: 1,
                mpGroup: 198222,
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadEnrollmentBeneficiariesSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                enrollmentBeneficiariesEntities: {
                    ids: ["333-1-198222"],
                    entities: {
                        ["333-1-198222"]: {
                            identifiers: {
                                memberId: 333,
                                mpGroup: 198222,
                                enrollmentId: 1,
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [{ allocationType: "PRIMARY" } as EnrollmentBeneficiary],
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = EnrollmentsActions.loadEnrollmentBeneficiariesSuccess({
                enrollmentBeneficiariesEntity: {
                    identifiers: {
                        memberId: 333,
                        enrollmentId: 1,
                        mpGroup: 198222,
                    },
                    data: [{ allocationType: "PRIMARY" } as EnrollmentBeneficiary],
                },
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadEnrollmentBeneficiariesFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                enrollmentBeneficiariesEntities: {
                    ids: ["333-1-198222"],
                    entities: {
                        ["333-1-198222"]: {
                            identifiers: {
                                memberId: 333,
                                enrollmentId: 1,
                                mpGroup: 198222,
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

            const action = EnrollmentsActions.loadEnrollmentBeneficiariesFailure({
                error: {
                    identifiers: {
                        memberId: 333,
                        enrollmentId: 1,
                        mpGroup: 198222,
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

    describe("setSelectedEnrollmentId action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                selectedEnrollmentId: 1,
            };

            const action = EnrollmentsActions.setSelectedEnrollmentId({ enrollmentId: 1 });

            const state = reducer(initialState, action);

            // Compare new state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadEnrollmentDependents action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                enrollmentDependentsEntities: {
                    ids: ["333-1-198222"],
                    entities: {
                        ["333-1-198222"]: {
                            identifiers: {
                                memberId: 333,
                                enrollmentId: 1,
                                mpGroup: 198222,
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = EnrollmentsActions.loadEnrollmentDependents({
                memberId: 333,
                enrollmentId: 1,
                mpGroup: 198222,
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadEnrollmentDependentsSuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                enrollmentDependentsEntities: {
                    ids: ["333-1-198222"],
                    entities: {
                        ["333-1-198222"]: {
                            identifiers: {
                                memberId: 333,
                                mpGroup: 198222,
                                enrollmentId: 1,
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [{ dependentId: 1 } as EnrollmentDependent],
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = EnrollmentsActions.loadEnrollmentDependentsSuccess({
                enrollmentDependentsEntity: {
                    identifiers: {
                        memberId: 333,
                        enrollmentId: 1,
                        mpGroup: 198222,
                    },
                    data: [{ dependentId: 1 } as EnrollmentDependent],
                },
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("loadEnrollmentDependentsFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                enrollmentDependentsEntities: {
                    ids: ["333-1-198222"],
                    entities: {
                        ["333-1-198222"]: {
                            identifiers: {
                                memberId: 333,
                                enrollmentId: 1,
                                mpGroup: 198222,
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

            const action = EnrollmentsActions.loadEnrollmentDependentsFailure({
                error: {
                    identifiers: {
                        memberId: 333,
                        enrollmentId: 1,
                        mpGroup: 198222,
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

    describe("importPolicy action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                importPolicyEntities: {
                    ids: ["222-111"],
                    entities: {
                        "222-111": {
                            identifiers: { memberId: 222, mpGroup: 111 },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };

            const action = EnrollmentsActions.loadImportPolicy({ memberId: 222, mpGroup: 111 });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("importPolicySuccess action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                importPolicyEntities: {
                    ids: ["222-111"],
                    entities: {
                        "222-111": {
                            identifiers: { memberId: 222, mpGroup: 111 },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: "policy",
                                error: null,
                            },
                        },
                    },
                },
            };

            const action = EnrollmentsActions.loadImportPolicySuccess({
                importPolicyEntity: {
                    identifiers: { memberId: 222, mpGroup: 111 },
                    data: "policy",
                },
            });

            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("importPolicyFailure action", () => {
        it("should update the state in an immutable way", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                importPolicyEntities: {
                    ids: ["222-111"],
                    entities: {
                        "222-111": {
                            identifiers: { memberId: 222, mpGroup: 111 },
                            data: {
                                status: AsyncStatus.FAILED,
                                value: null,
                                error: { message: "some api error message" } as ApiError,
                            },
                        },
                    },
                },
            };

            const action = EnrollmentsActions.loadImportPolicyFailure({
                error: {
                    identifiers: { memberId: 222, mpGroup: 111 },
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

    describe("downloadPreliminaryForm action", () => {
        it("should update the state in an immutable way on downloadPreliminaryForm", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                downloadPreliminaryFormEntities: {
                    ids: ["7-/resources/aflac/NY-16800-74-8868"],
                    entities: {
                        "7-/resources/aflac/NY-16800-74-8868": {
                            identifiers: {
                                memberId: 7,
                                preliminaryFormPath: "/resources/aflac/NY-16800",
                                cartItemId: 74,
                                mpGroupId: 8868,
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };
            const action = EnrollmentsActions.downloadPreliminaryForm({
                memberId: 7,
                preliminaryFormPath: "/resources/aflac/NY-16800",
                cartItemId: 74,
                mpGroupId: 8868,
            });
            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("downloadPreliminaryFormSuccess action", () => {
        it("should update the state in an immutable way on downloadPreliminaryFormSuccess", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                downloadPreliminaryFormEntities: {
                    ids: ["7-/resources/aflac/NY-16800-74-8868"],
                    entities: {
                        "7-/resources/aflac/NY-16800-74-8868": {
                            identifiers: {
                                memberId: 7,
                                preliminaryFormPath: "/resources/aflac/NY-16800",
                                cartItemId: 74,
                                mpGroupId: 8868,
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
            const action = EnrollmentsActions.downloadPreliminaryFormSuccess({
                downloadPreliminaryFormEntity: {
                    identifiers: {
                        memberId: 7,
                        preliminaryFormPath: "/resources/aflac/NY-16800",
                        cartItemId: 74,
                        mpGroupId: 8868,
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

    describe("downloadPreliminaryFormFailure action", () => {
        it("should update the state in an immutable way on downloadPreliminaryFormFailure", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                downloadPreliminaryFormEntities: {
                    ids: ["7-/resources/aflac/NY-16800-74-8868"],
                    entities: {
                        "7-/resources/aflac/NY-16800-74-8868": {
                            identifiers: {
                                memberId: 7,
                                preliminaryFormPath: "/resources/aflac/NY-16800",
                                cartItemId: 74,
                                mpGroupId: 8868,
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
            const action = EnrollmentsActions.downloadPreliminaryFormFailure({
                error: {
                    identifiers: {
                        memberId: 7,
                        preliminaryFormPath: "/resources/aflac/NY-16800",
                        cartItemId: 74,
                        mpGroupId: 8868,
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

    describe("emailPreliminaryForm action", () => {
        it("should update the state in an immutable way on emailPreliminaryForm", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                emailPreliminaryFormEntities: {
                    ids: ["7-abcd123@gmail.com-8868"],
                    entities: {
                        "7-abcd123@gmail.com-8868": {
                            identifiers: {
                                memberId: 7,
                                email: "abcd123@gmail.com",
                                mpGroupId: 8868,
                            },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                    },
                },
            };
            const action = EnrollmentsActions.emailPreliminaryForm({
                memberId: 7,
                email: "abcd123@gmail.com",
                mpGroupId: 8868,
                preliminaryForms: [{ preliminaryFormPath: "/resources/aflac/NY-16800", cartItemId: 74 }],
            });
            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("emailPreliminaryFormSuccess action", () => {
        it("should update the state in an immutable way on emailPreliminaryFormSuccess", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                emailPreliminaryFormEntities: {
                    ids: ["7-abcd123@gmail.com-8868"],
                    entities: {
                        "7-abcd123@gmail.com-8868": {
                            identifiers: {
                                memberId: 7,
                                email: "abcd123@gmail.com",
                                mpGroupId: 8868,
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: {} as HttpResponse<unknown>,
                                error: null,
                            },
                        },
                    },
                },
            };
            const action = EnrollmentsActions.emailPreliminaryFormSuccess({
                emailPreliminaryFormEntity: {
                    identifiers: {
                        memberId: 7,
                        email: "abcd123@gmail.com",
                        mpGroupId: 8868,
                    },
                    data: {} as HttpResponse<unknown>,
                },
            });
            const state = reducer(initialState, action);

            // Compare new state to expected state
            expect(state).toStrictEqual(expectedState);

            // Check for immutability
            expect(state).not.toBe(expectedState);
        });
    });

    describe("emailPreliminaryFormFailure action", () => {
        it("should update the state in an immutable way on emailPreliminaryFormFailure", () => {
            // Expectation of new state
            const expectedState: State = {
                ...initialState,
                emailPreliminaryFormEntities: {
                    ids: ["7-abcd123@gmail.com-8868"],
                    entities: {
                        "7-abcd123@gmail.com-8868": {
                            identifiers: {
                                memberId: 7,
                                email: "abcd123@gmail.com",
                                mpGroupId: 8868,
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
            const action = EnrollmentsActions.emailPreliminaryFormFailure({
                error: {
                    identifiers: {
                        memberId: 7,
                        email: "abcd123@gmail.com",
                        mpGroupId: 8868,
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
