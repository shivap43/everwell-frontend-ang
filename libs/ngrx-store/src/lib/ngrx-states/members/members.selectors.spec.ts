import {
    Account,
    AsyncStatus,
    IncomeRate,
    ProductId,
    PayFrequency,
    GroupAttributeName,
    RiskClass,
    Salary,
    RatingCode,
    ContactType,
    MemberProfile,
    WorkInformation,
    MemberDependent,
    MemberFlexDollar,
    MemberContact,
    MemberQualifyingEvent,
} from "@empowered/constants";
import { AccountsPartialState, ACCOUNTS_FEATURE_KEY } from "../accounts/accounts.reducer";
import { AccountsState } from "../accounts";
import { GroupAttributeRecord } from "../accounts/accounts.model";
import { SharedPartialState, SHARED_FEATURE_KEY } from "../shared/shared.reducer";
import { SharedState } from "../shared";
import {
    memberContactsEntityAdapter,
    memberDependentsEntityAdapter,
    initialState,
    memberProfileEntityAdapter,
    qualifyingEventsEntityAdapter,
    riskClassesEntityAdapter,
    salariesEntityAdapter,
} from "./members.state";
import { MembersPartialState, MEMBERS_FEATURE_KEY } from "./members.reducer";
import * as MembersSelectors from "./members.selectors";
import { mockCrossBorderRules } from "./members.mocks";

describe("Members Selectors", () => {
    let state: MembersPartialState & AccountsPartialState & SharedPartialState;

    beforeEach(() => {
        state = {
            [ACCOUNTS_FEATURE_KEY]: {
                ...AccountsState.initialState,
                selectedMPGroup: 111,
                accountEntities: AccountsState.accountEntityAdapter.setOne(
                    {
                        identifiers: { mpGroup: 111 },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: { name: "account-no-rating-code" } as Account,
                            error: null,
                        },
                    },
                    { ...AccountsState.initialState.accountEntities },
                ),
                groupAttributeRecordEntities: AccountsState.groupAttributeRecordEntityAdapter.setOne(
                    {
                        identifiers: { mpGroup: 111 },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: {
                                [GroupAttributeName.INDUSTRY_CODE]: {
                                    attribute: GroupAttributeName.INDUSTRY_CODE,
                                    id: 98989898,
                                    value: "account-risk-class-3",
                                },
                            } as GroupAttributeRecord,
                            error: null,
                        },
                    },
                    { ...AccountsState.initialState.groupAttributeRecordEntities },
                ),
                payFrequenciesEntities: AccountsState.payFrequenciesEntitiesAdapter.setOne(
                    {
                        identifiers: { mpGroup: 111 },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [{ id: 5, name: "Weekly" } as PayFrequency],
                            error: null,
                        },
                    },
                    { ...AccountsState.initialState.payFrequenciesEntities },
                ),
                riskClassesEntities: AccountsState.riskClassesEntityAdapter.setOne(
                    {
                        identifiers: { mpGroup: 111 },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [
                                { id: 1, name: "account-risk-class-1" },
                                { id: 2, name: "account-risk-class-2" },
                                { id: 3, name: "account-risk-class-3" },
                            ],
                            error: null,
                        },
                    },
                    { ...AccountsState.initialState.riskClassesEntities },
                ),
                dualPeoRiskClassIdsSetsEntities: AccountsState.dualPeoRiskClassIdsSetsEntityAdapter.setOne(
                    {
                        identifiers: { mpGroup: 111 },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: {
                                dualPeoRiskClassIds: {
                                    [ProductId.ACCIDENT]: [2],
                                    [ProductId.SHORT_TERM_DISABILITY]: [4],
                                },
                                aflacCarrierDualPeoRiskClassIds: {
                                    [ProductId.ACCIDENT]: [1, 2, 3],
                                    [ProductId.SHORT_TERM_DISABILITY]: [3, 4, 5],
                                },
                            },
                            error: null,
                        },
                    },
                    { ...AccountsState.initialState.dualPeoRiskClassIdsSetsEntities },
                ),
            },
            [MEMBERS_FEATURE_KEY]: {
                ...initialState,
                selectedMemberId: 222,
                membersEntities: memberProfileEntityAdapter.setOne(
                    {
                        identifiers: {
                            mpGroup: 111,
                            memberId: 222,
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: {
                                id: 222,
                                workInformation: {
                                    payrollFrequencyId: 5,
                                } as WorkInformation,
                            } as MemberProfile,
                            error: null,
                        },
                    },
                    {
                        ...initialState.membersEntities,
                    },
                ),
                salariesEntities: salariesEntityAdapter.setOne(
                    {
                        identifiers: {
                            mpGroup: 111,
                            memberId: 222,
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [
                                { annualSalary: "not me" } as Salary,
                                { annualSalary: "not me either" } as Salary,
                                {
                                    annualSalary: "choose me!",
                                    hourlyWage: "some hourly wage",
                                    hoursPerYear: 104,
                                } as Salary,
                            ],
                            error: null,
                        },
                    },
                    {
                        ...initialState.salariesEntities,
                    },
                ),
                memberDependentsEntities: memberDependentsEntityAdapter.setOne(
                    {
                        identifiers: {
                            mpGroup: 111,
                            memberId: 222,
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [{ name: "some dependent" } as MemberDependent],
                            error: null,
                        },
                    },
                    {
                        ...initialState.memberDependentsEntities,
                    },
                ),
                riskClassesEntities: riskClassesEntityAdapter.setOne(
                    {
                        identifiers: {
                            mpGroup: 111,
                            memberId: 222,
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
                    {
                        ...initialState.riskClassesEntities,
                    },
                ),
                qualifyingEventsEntities: qualifyingEventsEntityAdapter.setOne(
                    {
                        identifiers: {
                            mpGroup: 111,
                            memberId: 222,
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [{ memberComment: "some member comment" } as MemberQualifyingEvent],
                            error: null,
                        },
                    },
                    {
                        ...initialState.qualifyingEventsEntities,
                    },
                ),
                memberContactsEntities: memberContactsEntityAdapter.setOne(
                    {
                        identifiers: {
                            mpGroup: 111,
                            memberId: 222,
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [{ contactType: ContactType.HOME } as MemberContact],
                            error: null,
                        },
                    },
                    {
                        ...initialState.memberContactsEntities,
                    },
                ),
                memberFlexDollarsEntities: {
                    ids: ["111-222"],
                    entities: {
                        "111-222": {
                            identifiers: {
                                mpGroup: 111,
                                memberId: 222,
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [{ amount: 311 } as MemberFlexDollar],
                                error: null,
                            },
                        },
                    },
                },
                crossBorderRulesEntities: {
                    ids: ["111-222"],
                    entities: {
                        "111-222": {
                            identifiers: {
                                mpGroup: 111,
                                memberId: 222,
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: mockCrossBorderRules,
                                error: null,
                            },
                        },
                    },
                },
            },
            [SHARED_FEATURE_KEY]: {
                ...SharedState.initialState,
                riskClasses: {
                    status: AsyncStatus.SUCCEEDED,
                    value: [
                        { id: 1, name: "shared-risk-class-1" },
                        { id: 2, name: "shared-risk-class-2" },
                        { id: 3, name: "shared-risk-class-3" },
                        { id: 4, name: "shared-risk-class-4" },
                        { id: 5, name: "shared-risk-class-5" },
                    ],
                    error: null,
                },
            },
        };
    });

    describe("getSelectedMemberId", () => {
        it("should get selected memberId", () => {
            const result = MembersSelectors.getSelectedMemberId(state);

            expect(result).toBe(222);
        });
    });

    describe("getMemberProfileEntities", () => {
        it("should MemberProfiles entity", () => {
            const result = MembersSelectors.getMemberProfileEntities(state);

            expect(result).toStrictEqual(state[MEMBERS_FEATURE_KEY].membersEntities);
        });
    });

    describe("getSelectedMember", () => {
        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = MembersSelectors.getSelectedMemberProfile({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get IDLE AsyncData if no selected memberId", () => {
            const result = MembersSelectors.getSelectedMemberProfile({
                ...state,
                [MEMBERS_FEATURE_KEY]: { ...state[MEMBERS_FEATURE_KEY], selectedMemberId: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should selected MemberProfile", () => {
            const result = MembersSelectors.getSelectedMemberProfile(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: {
                    id: 222,
                    workInformation: {
                        payrollFrequencyId: 5,
                    } as WorkInformation,
                } as MemberProfile,
                error: null,
            });
        });
    });

    describe("getSalariesEntities", () => {
        it("should Salaries entities", () => {
            const result = MembersSelectors.getSalariesEntities(state);

            expect(result).toStrictEqual(state[MEMBERS_FEATURE_KEY].salariesEntities);
        });
    });

    describe("getSelectedSalaries", () => {
        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = MembersSelectors.getSelectedSalaries({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get IDLE AsyncData if no selected memberId", () => {
            const result = MembersSelectors.getSelectedSalaries({
                ...state,
                [MEMBERS_FEATURE_KEY]: { ...state[MEMBERS_FEATURE_KEY], selectedMemberId: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get selected Salaries", () => {
            const result = MembersSelectors.getSelectedSalaries(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [
                    { annualSalary: "not me" } as Salary,
                    { annualSalary: "not me either" } as Salary,
                    { annualSalary: "choose me!", hourlyWage: "some hourly wage", hoursPerYear: 104 } as Salary,
                ],
                error: null,
            });
        });
    });

    describe("getMemberDependentsEntities", () => {
        it("should Member Dependents entities", () => {
            const result = MembersSelectors.getMemberDependentsEntities(state);

            expect(result).toStrictEqual(state[MEMBERS_FEATURE_KEY].memberDependentsEntities);
        });
    });

    describe("getSelectedMemberDependents", () => {
        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = MembersSelectors.getSelectedMemberDependents({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get IDLE AsyncData if no selected memberId", () => {
            const result = MembersSelectors.getSelectedMemberDependents({
                ...state,
                [MEMBERS_FEATURE_KEY]: { ...state[MEMBERS_FEATURE_KEY], selectedMemberId: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get SelectedDependents", () => {
            const result = MembersSelectors.getSelectedMemberDependents(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [{ name: "some dependent" } as MemberDependent],
                error: null,
            });
        });
    });

    describe("getRiskClassesEntities", () => {
        it("should get RiskClasses entities", () => {
            const result = MembersSelectors.getRiskClassesEntities(state);

            expect(result).toStrictEqual(state[MEMBERS_FEATURE_KEY].riskClassesEntities);
        });
    });

    describe(" getSelectedMemberRiskClassesSet", () => {
        it("should get MemberRiskClassesSet selected ", () => {
            const result = MembersSelectors.getSelectedMemberRiskClassesSet(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: {
                    memberRiskClasses: [{ name: "some-risk-class-name" } as RiskClass],
                    aflacCarrierRiskClasses: [
                        { name: "some-risk-class-name" } as RiskClass,
                        { name: "some-other-risk-class-name" } as RiskClass,
                    ],
                },
                error: null,
            });
        });
    });

    describe("getSelectedMemberRiskClasses", () => {
        it("should get selected MemberRiskClasses", () => {
            const result = MembersSelectors.getSelectedMemberRiskClasses(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [{ name: "some-risk-class-name" } as RiskClass],
                error: null,
            });
        });

        it("should get AsyncData with AsyncStatus.IDLE when there is no selected MemberRiskClassesSet", () => {
            const result = MembersSelectors.getSelectedMemberRiskClasses({
                ...state,
                [MEMBERS_FEATURE_KEY]: {
                    ...state[MEMBERS_FEATURE_KEY],
                    selectedMemberId: null,
                },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });
    });

    describe("getSelectedPossibleRiskClassSets", () => {
        it("should get an empty array if no RatingCode is valid", () => {
            const result = MembersSelectors.getSelectedPossibleRiskClassSets(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [],
                error: null,
            });
        });

        it("should get AsyncData<RatingCode | null> if status isn't AsyncStatus.SUCCEEDED", () => {
            const result = MembersSelectors.getSelectedPossibleRiskClassSets({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: {
                    ...state[ACCOUNTS_FEATURE_KEY],
                    accountEntities: AccountsState.accountEntityAdapter.setOne(
                        {
                            identifiers: { mpGroup: 111 },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                        { ...AccountsState.initialState.accountEntities },
                    ),
                },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.LOADING,
            });
        });

        it("should get possible RiskClasses for RatingCode.STANDARD", () => {
            const result = MembersSelectors.getSelectedPossibleRiskClassSets({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: {
                    ...state[ACCOUNTS_FEATURE_KEY],
                    accountEntities: AccountsState.accountEntityAdapter.setOne(
                        {
                            identifiers: { mpGroup: 111 },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: { name: "account-standard", ratingCode: RatingCode.STANDARD } as Account,
                                error: null,
                            },
                        },
                        { ...AccountsState.initialState.accountEntities },
                    ),
                },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [
                    [
                        { id: 1, name: "account-risk-class-1" },
                        { id: 2, name: "account-risk-class-2" },
                        { id: 3, name: "account-risk-class-3" },
                    ],
                ],
                error: null,
            });
        });

        it("should get possible RiskClasses for RatingCode.PEO", () => {
            const result = MembersSelectors.getSelectedPossibleRiskClassSets({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: {
                    ...state[ACCOUNTS_FEATURE_KEY],
                    accountEntities: AccountsState.accountEntityAdapter.setOne(
                        {
                            identifiers: { mpGroup: 111 },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: { name: "account-peo", ratingCode: RatingCode.PEO } as Account,
                                error: null,
                            },
                        },
                        { ...AccountsState.initialState.accountEntities },
                    ),
                },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [[{ name: "some-risk-class-name" } as RiskClass, { name: "some-other-risk-class-name" } as RiskClass]],
                error: null,
            });
        });

        it("should get possible RiskClasses for RatingCode.DUAL", () => {
            const result = MembersSelectors.getSelectedPossibleRiskClassSets({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: {
                    ...state[ACCOUNTS_FEATURE_KEY],
                    accountEntities: AccountsState.accountEntityAdapter.setOne(
                        {
                            identifiers: { mpGroup: 111 },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: { name: "account-dual", ratingCode: RatingCode.DUAL } as Account,
                                error: null,
                            },
                        },
                        { ...AccountsState.initialState.accountEntities },
                    ),
                },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [
                    [
                        { id: 1, name: "shared-risk-class-1", productId: ProductId.ACCIDENT },
                        { id: 2, name: "shared-risk-class-2", productId: ProductId.ACCIDENT },
                        { id: 3, name: "shared-risk-class-3", productId: ProductId.ACCIDENT },
                    ],
                    [
                        { id: 3, name: "shared-risk-class-3", productId: ProductId.SHORT_TERM_DISABILITY },
                        { id: 4, name: "shared-risk-class-4", productId: ProductId.SHORT_TERM_DISABILITY },
                        { id: 5, name: "shared-risk-class-5", productId: ProductId.SHORT_TERM_DISABILITY },
                    ],
                ],
                error: null,
            });
        });
    });

    describe("getSelectedRiskClasses", () => {
        it("should get an empty array if no RatingCode is valid", () => {
            const result = MembersSelectors.getSelectedRiskClasses(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [],
                error: null,
            });
        });

        it("should get AsyncData<RatingCode | null> if status isn't AsyncStatus.SUCCEEDED", () => {
            const result = MembersSelectors.getSelectedRiskClasses({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: {
                    ...state[ACCOUNTS_FEATURE_KEY],
                    accountEntities: AccountsState.accountEntityAdapter.setOne(
                        {
                            identifiers: { mpGroup: 111 },
                            data: {
                                status: AsyncStatus.LOADING,
                            },
                        },
                        { ...AccountsState.initialState.accountEntities },
                    ),
                },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.LOADING,
            });
        });

        it("should get possible RiskClasses for RatingCode.STANDARD", () => {
            const result = MembersSelectors.getSelectedRiskClasses({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: {
                    ...state[ACCOUNTS_FEATURE_KEY],
                    accountEntities: AccountsState.accountEntityAdapter.setOne(
                        {
                            identifiers: { mpGroup: 111 },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: { name: "account-standard", ratingCode: RatingCode.STANDARD } as Account,
                                error: null,
                            },
                        },
                        { ...AccountsState.initialState.accountEntities },
                    ),
                },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [{ id: 3, name: "account-risk-class-3" }],
                error: null,
            });
        });

        it("should get possible RiskClasses for RatingCode.PEO", () => {
            const result = MembersSelectors.getSelectedRiskClasses({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: {
                    ...state[ACCOUNTS_FEATURE_KEY],
                    accountEntities: AccountsState.accountEntityAdapter.setOne(
                        {
                            identifiers: { mpGroup: 111 },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: { name: "account-peo", ratingCode: RatingCode.PEO } as Account,
                                error: null,
                            },
                        },
                        { ...AccountsState.initialState.accountEntities },
                    ),
                },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [{ name: "some-risk-class-name" } as RiskClass],
                error: null,
            });
        });

        it("should get possible RiskClasses for RatingCode.DUAL", () => {
            const result = MembersSelectors.getSelectedRiskClasses({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: {
                    ...state[ACCOUNTS_FEATURE_KEY],
                    accountEntities: AccountsState.accountEntityAdapter.setOne(
                        {
                            identifiers: { mpGroup: 111 },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: { name: "account-dual", ratingCode: RatingCode.DUAL } as Account,
                                error: null,
                            },
                        },
                        { ...AccountsState.initialState.accountEntities },
                    ),
                },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [
                    { id: 2, name: "shared-risk-class-2", productId: ProductId.ACCIDENT },
                    { id: 4, name: "shared-risk-class-4", productId: ProductId.SHORT_TERM_DISABILITY },
                ],
                error: null,
            });
        });
    });

    describe("getSelectedPossiblePeoRiskClasses", () => {
        it("should get selected AflacCarrierRiskClasses", () => {
            const result = MembersSelectors.getSelectedPossiblePeoRiskClasses(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [{ name: "some-risk-class-name" } as RiskClass, { name: "some-other-risk-class-name" } as RiskClass],
                error: null,
            });
        });

        it("should get AsyncData with AsyncStatus.IDLE when there is no selected MemberRiskClassesSet", () => {
            const result = MembersSelectors.getSelectedPossiblePeoRiskClasses({
                ...state,
                [MEMBERS_FEATURE_KEY]: {
                    ...state[MEMBERS_FEATURE_KEY],
                    selectedMemberId: null,
                },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });
    });

    describe("getSelectedPeoRiskClasses", () => {
        it("should get the first AflacCarrierRiskClass", () => {
            const result = MembersSelectors.getSelectedPeoRiskClasses(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: { name: "some-risk-class-name" } as RiskClass,
                error: null,
            });
        });
    });

    describe("getQualifyEventsEntities", () => {
        it("should get QualifyEventsSets entities", () => {
            const result = MembersSelectors.getQualifyEventsEntities(state);

            expect(result).toStrictEqual(state[MEMBERS_FEATURE_KEY].qualifyingEventsEntities);
        });
    });

    describe("getSelectedQualifyEvents", () => {
        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = MembersSelectors.getSelectedQualifyEvents({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get IDLE AsyncData if no selected memberId", () => {
            const result = MembersSelectors.getSelectedQualifyEvents({
                ...state,
                [MEMBERS_FEATURE_KEY]: { ...state[MEMBERS_FEATURE_KEY], selectedMemberId: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get selected QualifyEventsSet", () => {
            const result = MembersSelectors.getSelectedQualifyEvents(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [{ memberComment: "some member comment" } as MemberQualifyingEvent],
                error: null,
            });
        });
    });

    describe("getMemberContactsEntities", () => {
        it("should get MemberMemberContacts entities", () => {
            const result = MembersSelectors.getMemberContactsEntities(state);

            expect(result).toStrictEqual(state[MEMBERS_FEATURE_KEY].memberContactsEntities);
        });
    });

    describe("getSelectedMemberContacts", () => {
        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = MembersSelectors.getSelectedMemberContacts({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get IDLE AsyncData if no selected memberId", () => {
            const result = MembersSelectors.getSelectedMemberContacts({
                ...state,
                [MEMBERS_FEATURE_KEY]: { ...state[MEMBERS_FEATURE_KEY], selectedMemberId: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get selected MemberContactsSet", () => {
            const result = MembersSelectors.getSelectedMemberContacts(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [{ contactType: ContactType.HOME } as MemberContact],
                error: null,
            });
        });
    });

    describe("getSelectedMemberPayFrequency", () => {
        it("should get selected member's pay frequency", () => {
            const result = MembersSelectors.getSelectedMemberPayFrequency(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: {
                    id: 5,
                    name: "Weekly",
                },
                error: null,
            });
        });

        it("should get null if member doesn't have a pay frequency", () => {
            const result = MembersSelectors.getSelectedMemberPayFrequency({
                ...state,
                [MEMBERS_FEATURE_KEY]: {
                    ...state[MEMBERS_FEATURE_KEY],
                    membersEntities: memberProfileEntityAdapter.setOne(
                        {
                            identifiers: {
                                mpGroup: 111,
                                memberId: 222,
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: {
                                    id: 222,
                                    // Remove pay frequency
                                    workInformation: {} as WorkInformation,
                                } as MemberProfile,
                                error: null,
                            },
                        },
                        {
                            ...initialState.membersEntities,
                        },
                    ),
                },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: null,
                error: null,
            });
        });
    });

    describe("getSelectedPayFrequency", () => {
        it("should get member pay frequency if it's defined", () => {
            expect(
                MembersSelectors.getSelectedPayFrequency.projector(
                    {
                        status: AsyncStatus.SUCCEEDED,
                        value: {
                            id: 2,
                            name: "some member pay frequency",
                        },
                        error: null,
                    },
                    {
                        status: AsyncStatus.SUCCEEDED,
                        value: {
                            id: 3,
                            name: "some account pay frequency",
                        },
                        error: null,
                    },
                    {
                        status: AsyncStatus.SUCCEEDED,
                        value: [
                            {
                                id: 1,
                                name: "some other account pay frequency",
                            },
                            {
                                id: 4,
                                name: "some last account pay frequency",
                            },
                        ],
                        error: null,
                    },
                ),
            ).toEqual({
                status: AsyncStatus.SUCCEEDED,
                value: {
                    id: 2,
                    name: "some member pay frequency",
                },
                error: null,
            });
        });

        it("should get account pay frequency if it's defined and member pay frequency is null", () => {
            expect(
                MembersSelectors.getSelectedPayFrequency.projector(
                    {
                        status: AsyncStatus.SUCCEEDED,
                        value: null,
                        error: null,
                    },
                    {
                        status: AsyncStatus.SUCCEEDED,
                        value: {
                            id: 3,
                            name: "some account pay frequency",
                        },
                        error: null,
                    },
                    {
                        status: AsyncStatus.SUCCEEDED,
                        value: [
                            {
                                id: 1,
                                name: "some other account pay frequency",
                            },
                            {
                                id: 4,
                                name: "some last account pay frequency",
                            },
                        ],
                        error: null,
                    },
                ),
            ).toEqual({
                status: AsyncStatus.SUCCEEDED,
                value: {
                    id: 3,
                    name: "some account pay frequency",
                },
                error: null,
            });
        });

        it("should get the first pay frequency if it's defined and account/member pay frequency is null", () => {
            expect(
                MembersSelectors.getSelectedPayFrequency.projector(
                    {
                        status: AsyncStatus.SUCCEEDED,
                        value: null,
                        error: null,
                    },
                    {
                        status: AsyncStatus.SUCCEEDED,
                        value: null,
                        error: null,
                    },
                    {
                        status: AsyncStatus.SUCCEEDED,
                        value: [
                            {
                                id: 1,
                                name: "some other account pay frequency",
                            },
                            {
                                id: 4,
                                name: "some last account pay frequency",
                            },
                        ],
                        error: null,
                    },
                ),
            ).toEqual({
                status: AsyncStatus.SUCCEEDED,
                value: {
                    id: 1,
                    name: "some other account pay frequency",
                },
                error: null,
            });
        });
    });

    describe("getSelectedSalarySummary", () => {
        it("should use the last salary found to create summary", () => {
            const result = MembersSelectors.getSelectedSalarySummary(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: {
                    annualTotal: "choose me!",
                    hourlyTotal: "choose me!",
                    hourlyWage: "some hourly wage",
                    hoursPerWeek: 2, // 104 / 52 (WEEKS_PER_YEAR)
                    incomeRate: IncomeRate.HOURLY,
                },
                error: null,
            });
        });
    });

    describe("getMemberFlexDollarsEntities", () => {
        it("should get MemberFlexDollars entities", () => {
            const result = MembersSelectors.getMemberFlexDollarsEntities(state);

            expect(result).toStrictEqual(state[MEMBERS_FEATURE_KEY].memberFlexDollarsEntities);
        });
    });

    describe("getSelectedMemberFlexDollars", () => {
        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = MembersSelectors.getSelectedMemberFlexDollars({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get IDLE AsyncData if no selected memberId", () => {
            const result = MembersSelectors.getSelectedMemberFlexDollars({
                ...state,
                [MEMBERS_FEATURE_KEY]: { ...state[MEMBERS_FEATURE_KEY], selectedMemberId: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get selected MemberFlexDollars", () => {
            const result = MembersSelectors.getSelectedMemberFlexDollars(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [{ amount: 311 } as MemberFlexDollar],
                error: null,
            });
        });
    });
});
