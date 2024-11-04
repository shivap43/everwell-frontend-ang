import {
    AsyncStatus,
    EnrollmentMethod,
    EnrollmentRider,
    EnrollmentDependent,
    EnrollmentBeneficiary,
    Enrollments,
} from "@empowered/constants";
import { EnrollmentMethodDetail } from "@empowered/api";

import { AccountsPartialState, ACCOUNTS_FEATURE_KEY } from "../accounts/accounts.reducer";
import { MembersPartialState, MEMBERS_FEATURE_KEY } from "../members/members.reducer";
import { AccountsState } from "../accounts";
import { MembersState } from "../members";
import { EnrollmentsPartialState, ENROLLMENTS_FEATURE_KEY } from "./enrollments.reducer";
import { SharedPartialState, SHARED_FEATURE_KEY } from "../shared/shared.reducer";
import * as EnrollmentsSelectors from "./enrollments.selectors";
import {
    downloadPreliminaryFormEntityAdapter,
    emailPreliminaryFormEntityAdapter,
    enrollmentBeneficiariesEntityAdapter,
    enrollmentDependentsEntityAdapter,
    enrollmentMethodDetailsEntityAdapter,
    enrollmentRidersEntityAdapter,
    enrollmentsEntityAdapter,
    importPolicyEntityAdapter,
    initialState,
} from "./enrollments.state";
import { SharedState } from "../shared";
import { HttpResponse } from "@angular/common/http";

describe("Enrollments Selectors", () => {
    let state: EnrollmentsPartialState & AccountsPartialState & MembersPartialState & SharedPartialState;

    beforeEach(() => {
        state = {
            [ACCOUNTS_FEATURE_KEY]: {
                ...AccountsState.initialState,
                selectedMPGroup: 111,
            },
            [MEMBERS_FEATURE_KEY]: {
                ...MembersState.initialState,
                selectedMemberId: 222,
            },
            [ENROLLMENTS_FEATURE_KEY]: {
                ...initialState,
                selectedEnrollmentId: 1,
                enrollmentsEntities: enrollmentsEntityAdapter.setOne(
                    {
                        identifiers: { mpGroup: 111, memberId: 222 },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [{ memberCost: 1, id: 1 } as Enrollments],
                            error: null,
                        },
                    },
                    {
                        ...initialState.enrollmentsEntities,
                    },
                ),
                enrollmentRidersEntities: enrollmentRidersEntityAdapter.setOne(
                    {
                        identifiers: { enrollmentId: 1, mpGroup: 111, memberId: 222 },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [{ memberCost: 1, id: 1 } as EnrollmentRider],
                            error: null,
                        },
                    },
                    {
                        ...initialState.enrollmentRidersEntities,
                    },
                ),
                enrollmentMethodDetailsEntities: enrollmentMethodDetailsEntityAdapter.setOne(
                    {
                        identifiers: { mpGroup: 111 },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [
                                {
                                    name: EnrollmentMethod.CALL_CENTER,
                                    description: "some description",
                                } as EnrollmentMethodDetail,
                                {
                                    name: EnrollmentMethod.FACE_TO_FACE,
                                    description: "some other description",
                                } as EnrollmentMethodDetail,
                            ],
                            error: null,
                        },
                    },
                    {
                        ...initialState.enrollmentMethodDetailsEntities,
                    },
                ),
                importPolicyEntities: importPolicyEntityAdapter.setOne(
                    {
                        identifiers: { memberId: 222, mpGroup: 111 },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: "policy",
                            error: null,
                        },
                    },
                    {
                        ...initialState.importPolicyEntities,
                    },
                ),
                enrollmentBeneficiariesEntities: enrollmentBeneficiariesEntityAdapter.setOne(
                    {
                        identifiers: { memberId: 222, enrollmentId: 1, mpGroup: 111 },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [{ allocationType: "PRIMARY" } as EnrollmentBeneficiary],
                            error: null,
                        },
                    },
                    { ...initialState.enrollmentBeneficiariesEntities },
                ),
                enrollmentDependentsEntities: enrollmentDependentsEntityAdapter.setOne(
                    {
                        identifiers: { memberId: 222, enrollmentId: 1, mpGroup: 111 },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [{ dependentId: 1 } as EnrollmentDependent],
                            error: null,
                        },
                    },
                    { ...initialState.enrollmentDependentsEntities },
                ),
                downloadPreliminaryFormEntities: downloadPreliminaryFormEntityAdapter.setOne(
                    {
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
                    { ...initialState.downloadPreliminaryFormEntities },
                ),
                emailPreliminaryFormEntities: emailPreliminaryFormEntityAdapter.setOne(
                    {
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
                    { ...initialState.emailPreliminaryFormEntities },
                ),
            },
            [SHARED_FEATURE_KEY]: {
                ...SharedState.initialState,
                selectedEnrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
            },
        };
    });

    describe("getEnrollmentsEntities", () => {
        it("should get Enrollment Riders entities", () => {
            const result = EnrollmentsSelectors.getEnrollmentsEntities(state);

            expect(result).toStrictEqual(state[ENROLLMENTS_FEATURE_KEY].enrollmentsEntities);
        });
    });

    describe("getSelectedEnrollments", () => {
        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = EnrollmentsSelectors.getSelectedEnrollments({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get IDLE AsyncData if no selected memberId", () => {
            const result = EnrollmentsSelectors.getSelectedEnrollments({
                ...state,
                [MEMBERS_FEATURE_KEY]: { ...state[MEMBERS_FEATURE_KEY], selectedMemberId: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get selected Enrollments", () => {
            const result = EnrollmentsSelectors.getSelectedEnrollments(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [{ memberCost: 1, id: 1 } as Enrollments],
                error: null,
            });
        });
    });

    describe("getEnrollmentRidersEntities", () => {
        it("should get Enrollment Riders entities", () => {
            const result = EnrollmentsSelectors.getEnrollmentRidersEntities(state);

            expect(result).toStrictEqual(state[ENROLLMENTS_FEATURE_KEY].enrollmentRidersEntities);
        });
    });

    describe("getSelectedEnrollmentRiders", () => {
        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = EnrollmentsSelectors.getSelectedEnrollmentRiders({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get IDLE AsyncData if no selected memberId", () => {
            const result = EnrollmentsSelectors.getSelectedEnrollmentRiders({
                ...state,
                [MEMBERS_FEATURE_KEY]: { ...state[MEMBERS_FEATURE_KEY], selectedMemberId: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get selected EnrollmentRiders", () => {
            const result = EnrollmentsSelectors.getSelectedEnrollmentRiders(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [{ memberCost: 1, id: 1 } as Enrollments],
                error: null,
            });
        });
    });

    describe("getEnrollmentRiders", () => {
        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = EnrollmentsSelectors.getEnrollmentRiders(1)({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get IDLE AsyncData if no selected memberId", () => {
            const result = EnrollmentsSelectors.getEnrollmentRiders(1)({
                ...state,
                [MEMBERS_FEATURE_KEY]: { ...state[MEMBERS_FEATURE_KEY], selectedMemberId: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get selected EnrollmentRiders", () => {
            const result = EnrollmentsSelectors.getEnrollmentRiders(1)(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [{ memberCost: 1, id: 1 } as Enrollments],
                error: null,
            });
        });
    });

    describe("getSelectedEnrollmentId", () => {
        it("should get selected Enrollment id", () => {
            const result = EnrollmentsSelectors.getSelectedEnrollmentId(state);

            expect(result).toStrictEqual(1);
        });
    });

    describe("getEnrollmentMethodDetailsEntities", () => {
        it("should get EnrollmentMethodDetails entities", () => {
            const result = EnrollmentsSelectors.getEnrollmentMethodDetailsEntities(state);

            expect(result).toStrictEqual(state[ENROLLMENTS_FEATURE_KEY].enrollmentMethodDetailsEntities);
        });
    });

    describe("getSelectedEnrollmentMethodDetails", () => {
        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = EnrollmentsSelectors.getSelectedEnrollmentMethodDetails({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get selected EnrollmentMethodDetails", () => {
            const result = EnrollmentsSelectors.getSelectedEnrollmentMethodDetails(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [
                    { name: EnrollmentMethod.CALL_CENTER, description: "some description" } as EnrollmentMethodDetail,
                    {
                        name: EnrollmentMethod.FACE_TO_FACE,
                        description: "some other description",
                    } as EnrollmentMethodDetail,
                ],
                error: null,
            });
        });
    });

    describe("getSelectedEnrollmentMethodDetail", () => {
        it("should get selected EnrollmentMethodDetail", () => {
            const result = EnrollmentsSelectors.getSelectedEnrollmentMethodDetail(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: {
                    name: EnrollmentMethod.FACE_TO_FACE,
                    description: "some other description",
                } as EnrollmentMethodDetail,
                error: null,
            });
        });

        it("should get AsyncData with AsyncStatus.IDLE when there is no selected EnrollmentMethodDetails", () => {
            const result = EnrollmentsSelectors.getSelectedEnrollmentMethodDetail({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: {
                    ...state[ACCOUNTS_FEATURE_KEY],
                    selectedMPGroup: null,
                },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get AsyncData with value null if no EnrollmentMethodDetail with matching selected EnrollmentMethod", () => {
            const result = EnrollmentsSelectors.getSelectedEnrollmentMethodDetail({
                ...state,
                [SHARED_FEATURE_KEY]: {
                    ...state[SHARED_FEATURE_KEY],
                    selectedEnrollmentMethod: EnrollmentMethod.PIN_SIGNATURE,
                },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: null,
                error: null,
            });
        });
    });

    describe("getEnrollmentBeneficiariesEntities", () => {
        it("should get beneficiary info of existing coverages Entities State", () => {
            const result = EnrollmentsSelectors.getEnrollmentBeneficiariesEntities(state);

            expect(result).toStrictEqual(state[ENROLLMENTS_FEATURE_KEY].enrollmentBeneficiariesEntities);
        });
    });

    describe("getEnrollmentBeneficiaries", () => {
        it("should get IDLE AsyncData if no selected enrollment", () => {
            const result = EnrollmentsSelectors.getEnrollmentBeneficiaries({
                ...state,
                [ENROLLMENTS_FEATURE_KEY]: { ...state[ENROLLMENTS_FEATURE_KEY], selectedEnrollmentId: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get beneficiary info of selected existing coverages", () => {
            const result = EnrollmentsSelectors.getEnrollmentBeneficiaries(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [{ allocationType: "PRIMARY" } as EnrollmentBeneficiary],
                error: null,
            });
        });
    });

    describe("getEnrollmentDependentsEntities", () => {
        it("should get dependent info of existing coverage sets Entities State", () => {
            const result = EnrollmentsSelectors.getEnrollmentDependentsEntities(state);
            expect(result).toStrictEqual(state[ENROLLMENTS_FEATURE_KEY].enrollmentDependentsEntities);
        });
    });

    describe("getSelectedEnrollmentDependents", () => {
        it("should get dependent info of selected existing coverage set", () => {
            const result = EnrollmentsSelectors.getSelectedEnrollmentDependents(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [{ dependentId: 1 } as EnrollmentDependent],
                error: null,
            });
        });
    });

    describe("Check for Grandfather enrollment", () => {
        it("should check if an enrollment is Grandfather enrollment or not", () => {
            const result = EnrollmentsSelectors.checkForGrandfatherEnrollment(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: false,
                error: null,
            });
        });
    });

    describe("getImportPolicyEntities", () => {
        it("should get ImportedAflacPoliciesSets entities", () => {
            const result = EnrollmentsSelectors.getImportPolicyEntities(state);
            expect(result).toStrictEqual(state[ENROLLMENTS_FEATURE_KEY].importPolicyEntities);
        });
    });
    describe("getImportPolicy", () => {
        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = EnrollmentsSelectors.getImportPolicy({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });
        it("should get IDLE AsyncData if no selected memberId", () => {
            const result = EnrollmentsSelectors.getImportPolicy({
                ...state,
                [MEMBERS_FEATURE_KEY]: { ...state[MEMBERS_FEATURE_KEY], selectedMemberId: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get selected EnrollmentMethodDetails", () => {
            const result = EnrollmentsSelectors.getImportPolicy(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: "policy",
                error: null,
            });
        });
    });
    describe("enrollmentEligibilityForReinstatement", () => {
        it("should get value as null since enrollment is not eligible for reinstatement", () => {
            const result = EnrollmentsSelectors.enrollmentEligibilityForReinstatement(1)({
                ...state,
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: null,
                error: null,
            });
        });
    });

    describe("getDownloadPreliminaryFormEntities", () => {
        it("should get the download preliminary form entities", () => {
            const result = EnrollmentsSelectors.getDownloadPreliminaryFormEntities(state);
            expect(result).toStrictEqual(state[ENROLLMENTS_FEATURE_KEY].downloadPreliminaryFormEntities);
        });
    });

    describe("getDownloadPreliminaryFormResponse", () => {
        it("should get the download preliminary form response", () => {
            const result = EnrollmentsSelectors.getDownloadPreliminaryFormResponse(7, "/resources/aflac/NY-16800", 74, 8868)(state);
            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: "",
                error: null,
            });
        });
    });

    describe("getEmailPreliminaryFormEntities", () => {
        it("should get the email preliminary form entities", () => {
            const result = EnrollmentsSelectors.getEmailPreliminaryFormEntities(state);
            expect(result).toStrictEqual(state[ENROLLMENTS_FEATURE_KEY].emailPreliminaryFormEntities);
        });
    });

    describe("getEmailPreliminaryFormResponse", () => {
        it("should get the email preliminary form response", () => {
            const result = EnrollmentsSelectors.getEmailPreliminaryFormResponse(7, "abcd123@gmail.com", 8868)(state);
            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: {} as HttpResponse<unknown>,
                error: null,
            });
        });
    });
});
