import {
    Account,
    AsyncStatus,
    GroupAttributeName,
    ProductId,
    PayFrequency,
    RiskClass,
    Exceptions,
    ExceptionType,
    RatingCode,
    Admin,
} from "@empowered/constants";
import { GroupAttributeRecord } from "./accounts.model";
import {
    accountEntityAdapter,
    dualPeoRiskClassIdsSetsEntityAdapter,
    groupAttributeRecordEntityAdapter,
    initialState,
    payFrequenciesEntitiesAdapter,
    riskClassesEntityAdapter,
} from "./accounts.state";
import { AccountsPartialState, ACCOUNTS_FEATURE_KEY } from "./accounts.reducer";
import * as AccountsSelectors from "./accounts.selectors";
import { SharedPartialState, SHARED_FEATURE_KEY } from "../shared/shared.reducer";
import { SharedState } from "../shared";

describe("Accounts Selectors", () => {
    let state: AccountsPartialState & SharedPartialState;

    beforeEach(() => {
        state = {
            [ACCOUNTS_FEATURE_KEY]: {
                ...initialState,
                selectedMPGroup: 222,
                accountEntities: accountEntityAdapter.setOne(
                    {
                        identifiers: { mpGroup: 222 },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: { name: "account-222", payFrequencyId: 2, ratingCode: RatingCode.PEO } as Account,
                            error: null,
                        },
                    },
                    { ...initialState.accountEntities },
                ),
                payFrequenciesEntities: payFrequenciesEntitiesAdapter.setOne(
                    {
                        identifiers: { mpGroup: 222 },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [
                                { id: 1, name: "pay-frequency-22-first" } as PayFrequency,
                                { id: 2, name: "pay-frequency-22" } as PayFrequency,
                                { id: 3, name: "pay-frequency-22-last" } as PayFrequency,
                            ],
                            error: null,
                        },
                    },
                    { ...initialState.payFrequenciesEntities },
                ),
                groupAttributeRecordEntities: groupAttributeRecordEntityAdapter.setOne(
                    {
                        identifiers: { mpGroup: 222 },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: {
                                "some-old-group-attribute": {
                                    id: 1,
                                    attribute: "some-old-group-attribute",
                                    value: "some-old-value-22",
                                },
                                [GroupAttributeName.INDUSTRY_CODE]: {
                                    attribute: GroupAttributeName.INDUSTRY_CODE,
                                    id: 98989898,
                                    value: "account-risk-class-3",
                                },
                            } as GroupAttributeRecord,
                            error: null,
                        },
                    },
                    { ...initialState.groupAttributeRecordEntities },
                ),
                riskClassesEntities: riskClassesEntityAdapter.setOne(
                    {
                        identifiers: { mpGroup: 222 },
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
                    { ...initialState.riskClassesEntities },
                ),
                dualPeoRiskClassIdsSetsEntities: dualPeoRiskClassIdsSetsEntityAdapter.setOne(
                    {
                        identifiers: { mpGroup: 222 },
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
                    { ...initialState.dualPeoRiskClassIdsSetsEntities },
                ),
                exceptionsEntities: {
                    ids: [`222-${ExceptionType.AG_SPOUSE_BENEFIT_PERCENTAGE}`],
                    entities: {
                        [`222-${ExceptionType.AG_SPOUSE_BENEFIT_PERCENTAGE}`]: {
                            identifiers: { mpGroup: 222, exceptionType: ExceptionType.AG_SPOUSE_BENEFIT_PERCENTAGE },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [{ type: "some exception type" } as Exceptions],
                                error: null,
                            },
                        },
                    },
                },
                accountAdminsEntities: {
                    ids: ["222"],
                    entities: {
                        ["222"]: {
                            identifiers: { mpGroup: 222 },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [{ id: 1 } as Admin],
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

    describe("getSelectedMPGroup", () => {
        it("should get selected mpGroup", () => {
            const result = AccountsSelectors.getSelectedMPGroup(state);

            expect(result).toBe(222);
        });
    });

    describe("getAccountEntities", () => {
        it("should get Accounts entities", () => {
            const result = AccountsSelectors.getAccountEntities(state);

            expect(result).toStrictEqual(state[ACCOUNTS_FEATURE_KEY].accountEntities);
        });
    });

    describe("getSelectedAccount", () => {
        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = AccountsSelectors.getSelectedAccount({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get selected Account", () => {
            const result = AccountsSelectors.getSelectedAccount(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: { name: "account-222", payFrequencyId: 2, ratingCode: RatingCode.PEO } as Account,
                error: null,
            });
        });
    });

    // describe("getAccountLists", () => {
    //     it("should get AccountLists", () => {
    //         const result = AccountsSelectors.getAccountLists(state);

    //         expect(result).toStrictEqual({
    //             status: AsyncStatus.SUCCEEDED,
    //             value: [{ id: 222 } as AccountList],
    //             error: null,
    //         });
    //     });
    // });

    describe("getPayFrequenciessEntities", () => {
        it("should get PayFrequenciess entities", () => {
            const result = AccountsSelectors.getPayFrequenciessEntities(state);

            expect(result).toStrictEqual(state[ACCOUNTS_FEATURE_KEY].payFrequenciesEntities);
        });
    });

    describe("getSelectedPayFrequencies", () => {
        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = AccountsSelectors.getSelectedPayFrequencies({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get selected PayFrequencies", () => {
            const result = AccountsSelectors.getSelectedPayFrequencies(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [
                    { id: 1, name: "pay-frequency-22-first" } as PayFrequency,
                    { id: 2, name: "pay-frequency-22" } as PayFrequency,
                    { id: 3, name: "pay-frequency-22-last" } as PayFrequency,
                ],
                error: null,
            });
        });
    });

    describe("getSelectedAccountPayFrequency", () => {
        it("should get selected PayFrequencies", () => {
            const result = AccountsSelectors.getSelectedAccountPayFrequency(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: { id: 2, name: "pay-frequency-22" } as PayFrequency,
                error: null,
            });
        });

        it("should get null if account has payFrequency id that doesn't match anything", () => {
            const result = AccountsSelectors.getSelectedAccountPayFrequency.projector(
                {
                    status: AsyncStatus.SUCCEEDED,
                    value: { name: "account-222", payFrequencyId: 909, ratingCode: RatingCode.PEO } as Account,
                },
                {
                    status: AsyncStatus.SUCCEEDED,
                    value: [
                        { id: 1, name: "pay-frequency-22-first" } as PayFrequency,
                        { id: 2, name: "pay-frequency-22" } as PayFrequency,
                        { id: 3, name: "pay-frequency-22-last" } as PayFrequency,
                    ],
                    error: null,
                },
            );

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: null,
                error: null,
            });
        });

        it("should get null if account doesn't have payFrequency id", () => {
            const result = AccountsSelectors.getSelectedAccountPayFrequency.projector(
                {
                    status: AsyncStatus.SUCCEEDED,
                    value: { name: "account-222", ratingCode: RatingCode.PEO } as Account,
                },
                {
                    status: AsyncStatus.SUCCEEDED,
                    value: [
                        { id: 1, name: "pay-frequency-22-first" } as PayFrequency,
                        { id: 2, name: "pay-frequency-22" } as PayFrequency,
                        { id: 3, name: "pay-frequency-22-last" } as PayFrequency,
                    ],
                    error: null,
                },
            );

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: null,
                error: null,
            });
        });
    });

    describe("getGroupAttributeRecordEntities", () => {
        it("should get GroupAttributeRecord entities", () => {
            const result = AccountsSelectors.getGroupAttributeRecordEntities(state);

            expect(result).toStrictEqual(state[ACCOUNTS_FEATURE_KEY].groupAttributeRecordEntities);
        });
    });

    describe("getSelectedGroupAttributeRecord", () => {
        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = AccountsSelectors.getSelectedGroupAttributeRecord({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get selected GroupAttributeRecord", () => {
            const result = AccountsSelectors.getSelectedGroupAttributeRecord(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: {
                    "some-old-group-attribute": {
                        id: 1,
                        attribute: "some-old-group-attribute",
                        value: "some-old-value-22",
                    },
                    [GroupAttributeName.INDUSTRY_CODE]: {
                        attribute: GroupAttributeName.INDUSTRY_CODE,
                        id: 98989898,
                        value: "account-risk-class-3",
                    },
                } as GroupAttributeRecord,
                error: null,
            });
        });
    });

    describe("getRiskClassesEntities", () => {
        it("should get RiskClasses entities", () => {
            const result = AccountsSelectors.getRiskClassesEntities(state);

            expect(result).toStrictEqual(state[ACCOUNTS_FEATURE_KEY].riskClassesEntities);
        });
    });

    describe("getSelectedPossibleStandardRiskClasses", () => {
        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = AccountsSelectors.getSelectedPossibleStandardRiskClasses({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get selected RiskClasses", () => {
            const result = AccountsSelectors.getSelectedPossibleStandardRiskClasses(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [
                    { id: 1, name: "account-risk-class-1" },
                    { id: 2, name: "account-risk-class-2" },
                    { id: 3, name: "account-risk-class-3" },
                ],
                error: null,
            });
        });
    });

    describe("getSelectedStandardRiskClass", () => {
        it("should get RiskClass based on GroupAttributes", () => {
            const result = AccountsSelectors.getSelectedStandardRiskClass(state);
            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: { id: 3, name: "account-risk-class-3" },
                error: null,
            });
        });
    });

    describe("getDualPeoRiskClassIdsSetsEntities", () => {
        it("should get DualPeoRiskClassIdsSets entities", () => {
            const result = AccountsSelectors.getDualPeoRiskClassIdsSetsEntities(state);

            expect(result).toStrictEqual(state[ACCOUNTS_FEATURE_KEY].dualPeoRiskClassIdsSetsEntities);
        });
    });

    describe("getSelectedDualPeoRiskClassIdsSet", () => {
        it("should get selected DualPeoRiskClassIdsSet", () => {
            const result = AccountsSelectors.getSelectedDualPeoRiskClassIdsSet(state);

            expect(result).toStrictEqual({
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
            });
        });
    });

    describe("getSelectedDualPeoRiskClassIds", () => {
        it("should get selected DualPeoRiskClassIds", () => {
            const result = AccountsSelectors.getSelectedDualPeoRiskClassIds(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: {
                    [ProductId.ACCIDENT]: [2],
                    [ProductId.SHORT_TERM_DISABILITY]: [4],
                },
                error: null,
            });
        });

        it("should get AsyncData with AsyncStatus.IDLE when there is no selected DualPeoRiskClassIdsSet", () => {
            const result = AccountsSelectors.getSelectedDualPeoRiskClassIds({
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
    });

    describe("getSelectedAflacCarrierDualPeoRiskClassIds", () => {
        it("should get selected AflacCarrierDualPeoRiskClassIds", () => {
            const result = AccountsSelectors.getSelectedAflacCarrierDualPeoRiskClassIds(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: {
                    [ProductId.ACCIDENT]: [1, 2, 3],
                    [ProductId.SHORT_TERM_DISABILITY]: [3, 4, 5],
                },
                error: null,
            });
        });

        it("should get AsyncData with AsyncStatus.IDLE when there is no selected DualPeoRiskClassIdsSet", () => {
            const result = AccountsSelectors.getSelectedAflacCarrierDualPeoRiskClassIds({
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
    });

    describe("getSelectedPossibleDualRiskClassSets", () => {
        it("should filter all RiskClasses using DualPeoRiskClassIds", () => {
            const result = AccountsSelectors.getSelectedPossibleDualRiskClassSets(state);

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

    describe("getSelectedDualRiskClasses", () => {
        it("should filter all RiskClasses using DualPeoRiskClassIds", () => {
            const result = AccountsSelectors.getSelectedDualRiskClasses(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [
                    { id: 2, name: "shared-risk-class-2", productId: ProductId.ACCIDENT },
                    {
                        id: 4,
                        name: "shared-risk-class-4",
                        productId: ProductId.SHORT_TERM_DISABILITY,
                    },
                ],
                error: null,
            });
        });
    });

    describe("getSelectedRatingCode", () => {
        it("should get the RatingCode from selected Account", () => {
            const result = AccountsSelectors.getSelectedRatingCode(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: RatingCode.PEO,
                error: null,
            });
        });
    });

    describe("filterRiskClassesByIds()", () => {
        it("should get RiskClasses where its id within riskClassIds", () => {
            const riskClasses: RiskClass[] = [
                { id: 1, name: "first" },
                { id: 2, name: "second" },
                { id: 3, name: "third" },
                { id: 4, name: "fourth" },
            ];

            expect(AccountsSelectors.filterRiskClassesByIds([2, 3], riskClasses)).toStrictEqual([
                { id: 2, name: "second" },
                { id: 3, name: "third" },
            ]);
        });
    });

    describe("getExceptionsEntities", () => {
        it("should get Exceptions entities", () => {
            const result = AccountsSelectors.getExceptionsEntities(state);

            expect(result).toStrictEqual(state[ACCOUNTS_FEATURE_KEY].exceptionsEntities);
        });
    });

    describe("getSelectedSpouseExceptions", () => {
        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = AccountsSelectors.getSelectedSpouseExceptions({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get selected SpouseExceptions", () => {
            const result = AccountsSelectors.getSelectedSpouseExceptions(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [{ type: "some exception type" } as Exceptions],
                error: null,
            });
        });
    });
    describe("getAccountAdminSetEntities", () => {
        it("should get AccountAdmins entities", () => {
            const result = AccountsSelectors.getAccountAdminEntities(state);

            expect(result).toStrictEqual(state[ACCOUNTS_FEATURE_KEY].accountAdminsEntities);
        });
    });

    describe("getSelectedAccountAdmins", () => {
        it("should get selected AccountAdmins", () => {
            const result = AccountsSelectors.getSelectedAccountAdmins(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [{ id: 1 } as Admin],
                error: null,
            });
        });

        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = AccountsSelectors.getSelectedAccountAdmins({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });
    });
});
