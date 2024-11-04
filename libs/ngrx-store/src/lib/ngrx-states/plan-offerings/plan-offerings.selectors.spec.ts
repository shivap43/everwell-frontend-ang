import {
    AsyncStatus,
    CarrierId,
    CoverageDatesEnrollmentType,
    EnrollmentMethod,
    ProductId,
    ShopPageType,
    Question,
    Characteristics,
    TaxStatus,
    PlanYearType,
    CoverageLevel,
    Plan,
    PlanOffering,
    Product,
    ProductOffering,
    GetCartItems,
    Enrollments,
    PlanOfferingPricing,
    PlanYear,
} from "@empowered/constants";
import { KnockoutQuestion } from "@empowered/api";

import { AccountsPartialState, ACCOUNTS_FEATURE_KEY } from "../accounts/accounts.reducer";
import { MembersPartialState, MEMBERS_FEATURE_KEY } from "../members/members.reducer";
import { EnrollmentsPartialState, ENROLLMENTS_FEATURE_KEY } from "../enrollments/enrollments.reducer";
import { SharedPartialState, SHARED_FEATURE_KEY } from "../shared/shared.reducer";
import { ProductsPartialState, PRODUCTS_FEATURE_KEY } from "../products/products.reducer";
import { ProductOfferingsPartialState, PRODUCT_OFFERINGS_FEATURE_KEY } from "../product-offerings/product-offerings.reducer";
import { MembersState } from "../members";
import { EnrollmentsState } from "../enrollments";
import { AccountsState } from "../accounts";
import { SharedState } from "../shared";
import { ProductsState } from "../products";
import { ProductOfferingsState } from "../product-offerings";
import { productOfferingSetsEntityAdapter } from "../product-offerings/product-offerings.state";
import { enrollmentsEntityAdapter } from "../enrollments/enrollments.state";
import { mockCrossBorderRules, mockMemberContacts } from "../members/members.mocks";
import { ShoppingCartsPartialState, SHOPPING_CARTS_FEATURE_KEY } from "../shopping-carts/shopping-carts.reducer";
import { ShoppingCartsState } from "../shopping-carts";
import { cartItemsSetsEntityAdapter } from "../shopping-carts/shopping-carts.state";
import {
    initialState,
    planOfferingsEntityAdapter,
    coverageLevelsEntityAdapter,
    coverageDatesRecordEntityAdapter,
    planOfferingPricingsEntityAdapter,
    planOfferingRidersEntityAdapter,
    knockOutQuestionsEntityAdapter,
} from "./plan-offerings.state";
import { PlanOfferingsPartialState, PLAN_OFFERINGS_FEATURE_KEY } from "./plan-offerings.reducer";
import * as PlanOfferingsSelectors from "./plan-offerings.selectors";
import { crossBorderRulesEntityAdapter, memberContactsEntityAdapter } from "../members/members.state";

describe("PlanOfferings Selectors", () => {
    let state: PlanOfferingsPartialState &
    AccountsPartialState &
    MembersPartialState &
    EnrollmentsPartialState &
    SharedPartialState &
    ProductOfferingsPartialState &
    ProductsPartialState &
    ShoppingCartsPartialState;

    beforeEach(() => {
        state = {
            [PRODUCT_OFFERINGS_FEATURE_KEY]: {
                ...ProductOfferingsState.initialState,
                productOfferingSetsEntities: productOfferingSetsEntityAdapter.setOne(
                    {
                        identifiers: {
                            mpGroup: 111,
                            referenceDate: "1990-09-09",
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [{ id: 11, product: { id: 8 } as Product } as ProductOffering],
                            error: null,
                        },
                    },
                    { ...ProductOfferingsState.initialState.productOfferingSetsEntities },
                ),
            },
            [PRODUCTS_FEATURE_KEY]: {
                ...ProductsState.initialState,
                selectedProductId: 8,
            },
            [ACCOUNTS_FEATURE_KEY]: {
                ...AccountsState.initialState,
                selectedMPGroup: 111,
            },
            [MEMBERS_FEATURE_KEY]: {
                ...MembersState.initialState,
                selectedMemberId: 333,
                crossBorderRulesEntities: crossBorderRulesEntityAdapter.setOne(
                    {
                        identifiers: {
                            mpGroup: 111,
                            memberId: 333,
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: mockCrossBorderRules,
                            error: null,
                        },
                    },
                    { ...MembersState.initialState.crossBorderRulesEntities },
                ),
                memberContactsEntities: memberContactsEntityAdapter.setOne(
                    {
                        identifiers: {
                            mpGroup: 111,
                            memberId: 333,
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: mockMemberContacts,
                            error: null,
                        },
                    },
                    { ...MembersState.initialState.memberContactsEntities },
                ),
            },
            [SHOPPING_CARTS_FEATURE_KEY]: {
                ...ShoppingCartsState.initialState,
                cartItemsSetsEntities: cartItemsSetsEntityAdapter.setOne(
                    {
                        identifiers: {
                            mpGroup: 111,
                            memberId: 333,
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [
                                {
                                    id: 555,
                                    planOfferingId: 11,
                                    memberCost: 4,
                                    totalCost: 4,
                                    coverageLevelId: 2,
                                    benefitAmount: 2,
                                    enrollmentState: "AZ",
                                } as GetCartItems,
                            ],
                            error: null,
                        },
                    },
                    { ...ShoppingCartsState.initialState.cartItemsSetsEntities },
                ),
            },
            [ENROLLMENTS_FEATURE_KEY]: {
                ...EnrollmentsState.initialState,
                enrollmentsEntities: enrollmentsEntityAdapter.setOne(
                    {
                        identifiers: { memberId: 333, mpGroup: 111 },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [{ status: "ACTIVE", plan: { id: 1 } as Plan } as Enrollments],
                            error: null,
                        },
                    },
                    { ...EnrollmentsState.initialState.enrollmentsEntities },
                ),
            },
            [SHARED_FEATURE_KEY]: {
                ...SharedState.initialState,
                selectedEnrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                countryStates: {
                    status: AsyncStatus.SUCCEEDED,
                    value: [
                        {
                            name: "Arizona",
                            abbreviation: "AZ",
                        },
                    ],
                    error: null,
                },
                selectedCountryState: {
                    name: "Arizona",
                    abbreviation: "AZ",
                },
                selectedHeadsetState: {
                    name: "Arizona",
                    abbreviation: "AZ",
                },
            },
            [PLAN_OFFERINGS_FEATURE_KEY]: {
                ...initialState,
                selectedPlanId: 11,
                selectedPlanOfferingId: 555,
                selectedDependentPlanOfferingIds: [5551, 5552],
                selectedShopPageType: ShopPageType.DUAL_QLE_SHOP,
                planOfferingsEntities: planOfferingsEntityAdapter.setOne(
                    {
                        identifiers: {
                            mpGroup: 111,
                            memberId: 333,
                            enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                            stateAbbreviation: "AZ",
                            referenceDate: "1990-09-09",
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [
                                {
                                    id: 555,
                                    taxStatus: TaxStatus.POSTTAX,
                                    productOfferingId: 11,
                                    plan: {
                                        carrierId: CarrierId.AFLAC,
                                        characteristics: [] as Characteristics[],
                                        product: { id: 8 } as Product,
                                    } as Plan,
                                } as PlanOffering,
                            ],
                            error: null,
                        },
                    },
                    { ...initialState.planOfferingsEntities },
                ),
                planOfferingRidersEntities: planOfferingRidersEntityAdapter.setMany(
                    [
                        {
                            identifiers: {
                                planOfferingId: 555,
                                mpGroup: 111,
                                memberId: 333,
                                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                                stateAbbreviation: "AZ",
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [{ id: 55500, taxStatus: TaxStatus.PRETAX, productOfferingId: 11 } as PlanOffering],
                                error: null,
                            },
                        },
                        {
                            identifiers: {
                                planOfferingId: 5551,
                                mpGroup: 111,
                                memberId: 333,
                                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                                stateAbbreviation: "AZ",
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [
                                    {
                                        id: 555100,
                                        taxStatus: TaxStatus.PRETAX,
                                        productOfferingId: 555111,
                                    } as PlanOffering,
                                ],
                                error: null,
                            },
                        },
                        {
                            identifiers: {
                                planOfferingId: 5552,
                                mpGroup: 111,
                                memberId: 333,
                                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                                stateAbbreviation: "AZ",
                            },
                            data: {
                                status: AsyncStatus.SUCCEEDED,
                                value: [
                                    {
                                        id: 555200,
                                        taxStatus: TaxStatus.PRETAX,
                                        productOfferingId: 555211,
                                    } as PlanOffering,
                                ],
                                error: null,
                            },
                        },
                    ],
                    { ...initialState.planOfferingRidersEntities },
                ),
                knockoutQuestionsEntities: knockOutQuestionsEntityAdapter.setOne(
                    {
                        identifiers: {
                            planOfferingId: 555,
                            mpGroup: 111,
                            memberId: 333,
                            stateAbbreviation: "AZ",
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
                    { ...initialState.knockoutQuestionsEntities },
                ),
                coverageLevelsEntities: coverageLevelsEntityAdapter.setOne(
                    {
                        identifiers: { mpGroup: 111, planId: 11, fetchRetainRiders: false },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [{ name: "Individual", id: 1, eliminationPeriod: "0/7" } as CoverageLevel],
                            error: null,
                        },
                    },
                    { ...initialState.coverageLevelsEntities },
                ),
                coverageDatesRecordEntities: coverageDatesRecordEntityAdapter.setOne(
                    {
                        identifiers: {
                            mpGroup: 111,
                            memberId: 333,
                            coverageDatesEnrollmentType: CoverageDatesEnrollmentType.QUALIFYING_LIFE_EVENT,
                            referenceDate: "1990-09-09",
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: {
                                555: {
                                    defaultCoverageStartDate: "1985-01-05",
                                    earliestCoverageStartDate: "1985-01-30",
                                    latestCoverageStartDate: "1985-12-01",
                                    isContinuous: true,
                                },
                            },
                            error: null,
                        },
                    },
                    { ...initialState.coverageDatesRecordEntities },
                ),
                planOfferingPricingsEntities: planOfferingPricingsEntityAdapter.setOne(
                    {
                        identifiers: {
                            mpGroup: 111,
                            memberId: 333,
                            planOfferingId: 555,
                            stateAbbreviation: "AZ",
                            baseBenefitAmount: undefined,
                            memberIsTobaccoUser: null,
                            spouseIsTobaccoUser: null,
                            coverageEffectiveDate: undefined,
                            parentPlanCoverageLevelId: undefined,
                            parentPlanId: undefined,
                            riskClassId: 2,
                            shoppingCartItemId: undefined,
                            includeFee: false,
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [{ benefitAmount: 9000, coverageLevelId: 1 } as PlanOfferingPricing],
                            error: null,
                        },
                    },
                    {
                        ...initialState.planOfferingPricingsEntities,
                    },
                ),
            },
            [PRODUCT_OFFERINGS_FEATURE_KEY]: {
                ...ProductOfferingsState.initialState,
                selectedReferenceDate: "1990-09-09",
                planYearSetsEntities: ProductOfferingsState.planYearSetsEntityAdapter.setOne(
                    {
                        identifiers: { mpGroup: 111 },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [{ type: PlanYearType.AFLAC_GROUP } as PlanYear],
                            error: null,
                        },
                    },
                    { ...ProductOfferingsState.initialState.planYearSetsEntities },
                ),
                productOfferingSetsEntities: productOfferingSetsEntityAdapter.setOne(
                    {
                        identifiers: {
                            mpGroup: 111,
                            referenceDate: "1990-09-09",
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [{ id: 11, product: { id: 8 } } as ProductOffering],
                            error: null,
                        },
                    },
                    { ...ProductOfferingsState.initialState.productOfferingSetsEntities },
                ),
            },
        };

        // Tests involve current date, so we should mock the current date
        jest.spyOn(Date, "now").mockReturnValue(new Date("1990/09/09").valueOf());
    });

    describe("getSelectedCoverageDatesEnrollmentType", () => {
        it("should get selected CoverageDatesEnrollmentType", () => {
            const result = PlanOfferingsSelectors.getSelectedCoverageDatesEnrollmentType(state);

            expect(result).toBe(CoverageDatesEnrollmentType.QUALIFYING_LIFE_EVENT);
        });
    });

    describe("getSelectedPlanId", () => {
        it("should get selected planId", () => {
            const result = PlanOfferingsSelectors.getSelectedPlanId(state);

            expect(result).toBe(11);
        });
    });

    describe("getSelectedPlanOfferingId", () => {
        it("should get selected planOfferingId", () => {
            const result = PlanOfferingsSelectors.getSelectedPlanOfferingId(state);

            expect(result).toBe(555);
        });
    });

    describe("getPlanOfferingsState", () => {
        it("should get PlanOfferings Entities State", () => {
            const result = PlanOfferingsSelectors.getPlanOfferingsState(state);

            expect(result).toStrictEqual(state[PLAN_OFFERINGS_FEATURE_KEY].planOfferingsEntities);
        });
    });

    describe("getSelectedPlanOfferings", () => {
        it("should get IDLE AsyncData if no selected country state", () => {
            const result = PlanOfferingsSelectors.getSelectedPlanOfferings({
                ...state,
                [SHARED_FEATURE_KEY]: { ...state[SHARED_FEATURE_KEY], selectedCountryState: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = PlanOfferingsSelectors.getSelectedPlanOfferings({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get IDLE AsyncData if no selected memberId", () => {
            const result = PlanOfferingsSelectors.getSelectedPlanOfferings({
                ...state,
                [MEMBERS_FEATURE_KEY]: { ...state[MEMBERS_FEATURE_KEY], selectedMemberId: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get IDLE AsyncData if no selected referenceDate", () => {
            const result = PlanOfferingsSelectors.getSelectedPlanOfferings({
                ...state,
                [PRODUCT_OFFERINGS_FEATURE_KEY]: {
                    ...state[PRODUCT_OFFERINGS_FEATURE_KEY],
                    selectedReferenceDate: null,
                },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get selected PlanOfferings", () => {
            const result = PlanOfferingsSelectors.getSelectedPlanOfferings(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [
                    {
                        id: 555,
                        taxStatus: TaxStatus.POSTTAX,
                        productOfferingId: 11,
                        plan: {
                            carrierId: CarrierId.AFLAC,
                            characteristics: [] as Characteristics[],
                            product: { id: 8 } as Product,
                        } as Plan,
                    } as PlanOffering,
                ],
                error: null,
            });
        });
    });

    describe("getPlanOfferingRidersEntities", () => {
        it("should get PlanOfferings Entities State", () => {
            const result = PlanOfferingsSelectors.getPlanOfferingRidersEntities(state);

            expect(result).toStrictEqual(state[PLAN_OFFERINGS_FEATURE_KEY].planOfferingRidersEntities);
        });
    });

    describe("getSelectedPlanOfferingRiders", () => {
        it("should get IDLE AsyncData if no selected country state", () => {
            const result = PlanOfferingsSelectors.getSelectedPlanOfferingRiders({
                ...state,
                [SHARED_FEATURE_KEY]: { ...state[SHARED_FEATURE_KEY], selectedCountryState: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get IDLE AsyncData if no selected planOfferingId", () => {
            const result = PlanOfferingsSelectors.getSelectedPlanOfferingRiders({
                ...state,
                [PLAN_OFFERINGS_FEATURE_KEY]: { ...state[PLAN_OFFERINGS_FEATURE_KEY], selectedPlanOfferingId: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = PlanOfferingsSelectors.getSelectedPlanOfferingRiders({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get IDLE AsyncData if no selected memberId", () => {
            const result = PlanOfferingsSelectors.getSelectedPlanOfferingRiders({
                ...state,
                [MEMBERS_FEATURE_KEY]: { ...state[MEMBERS_FEATURE_KEY], selectedMemberId: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get selected PlanOfferingRiders", () => {
            const result = PlanOfferingsSelectors.getSelectedPlanOfferingRiders(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [{ id: 55500, taxStatus: TaxStatus.PRETAX, productOfferingId: 11 } as PlanOffering],
                error: null,
            });
        });
    });

    describe("getCoverageDatesRecordEntities", () => {
        it("should get CoverageDatesRecords Entities State", () => {
            const result = PlanOfferingsSelectors.getCoverageDatesRecordEntities(state);

            expect(result).toStrictEqual(state[PLAN_OFFERINGS_FEATURE_KEY].coverageDatesRecordEntities);
        });
    });

    describe("getSelectedCoverageDatesRecord", () => {
        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = PlanOfferingsSelectors.getSelectedCoverageDatesRecord({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get IDLE AsyncData if no selected memberId", () => {
            const result = PlanOfferingsSelectors.getSelectedCoverageDatesRecord({
                ...state,
                [MEMBERS_FEATURE_KEY]: { ...state[MEMBERS_FEATURE_KEY], selectedMemberId: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get IDLE AsyncData if no selected selectedShopType", () => {
            const result = PlanOfferingsSelectors.getSelectedCoverageDatesRecord({
                ...state,
                [PLAN_OFFERINGS_FEATURE_KEY]: {
                    ...state[PLAN_OFFERINGS_FEATURE_KEY],
                    selectedShopPageType: null,
                },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get selected CoverageDatesRecord", () => {
            const result = PlanOfferingsSelectors.getSelectedCoverageDatesRecord(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: {
                    555: {
                        defaultCoverageStartDate: "1985-01-05",
                        earliestCoverageStartDate: "1985-01-30",
                        latestCoverageStartDate: "1985-12-01",
                        isContinuous: true,
                    },
                },
                error: null,
            });
        });
    });

    describe("getSelectedPlanOfferingsWithCoverageDates", () => {
        it("should get selected PlanOfferingsWithCoverageDateSet", () => {
            const result = PlanOfferingsSelectors.getSelectedPlanOfferingsWithCoverageDates(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [
                    {
                        planOffering: {
                            id: 555,
                            taxStatus: TaxStatus.POSTTAX,
                            productOfferingId: 11,
                            plan: {
                                carrierId: CarrierId.AFLAC,
                                characteristics: [] as Characteristics[],
                                product: { id: 8 } as Product,
                            } as Plan,
                        } as PlanOffering,
                        defaultCoverageStartDate: "1985-01-05",
                        earliestCoverageStartDate: "1985-01-30",
                        latestCoverageStartDate: "1985-12-01",
                        isContinuous: true,
                    },
                ],
                error: null,
            });
        });
    });

    describe("getSelectedCombinedOfferings", () => {
        it("should get selected CombinedOfferings", () => {
            const result = PlanOfferingsSelectors.getSelectedCombinedOfferings(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [
                    {
                        productOffering: { id: 11, product: { id: 8 } as Product } as ProductOffering,
                        planOfferingsWithCoverageDates: [
                            {
                                planOffering: {
                                    id: 555,
                                    taxStatus: TaxStatus.POSTTAX,
                                    productOfferingId: 11,
                                    plan: {
                                        carrierId: CarrierId.AFLAC,
                                        characteristics: [] as Characteristics[],
                                        product: { id: 8 } as Product,
                                    } as Plan,
                                } as PlanOffering,
                                defaultCoverageStartDate: "1985-01-05",
                                earliestCoverageStartDate: "1985-01-30",
                                latestCoverageStartDate: "1985-12-01",
                                isContinuous: true,
                            },
                        ],
                        defaultCoverageStartDate: "1985-01-05",
                        earliestCoverageStartDate: "1985-01-30",
                        latestCoverageStartDate: "1985-12-01",
                    },
                ],
                error: null,
            });
        });
    });

    describe("getCombinedOfferingsWithCartAndEnrollment", () => {
        it("should get selected getCombinedOfferingsWithCartAndEnrollment", () => {
            const result = PlanOfferingsSelectors.getCombinedOfferingsWithCartAndEnrollment(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [
                    {
                        productOffering: { id: 11, product: { id: 8 } as Product } as ProductOffering,
                        planOfferingsWithCartAndEnrollment: [
                            {
                                planOffering: {
                                    id: 555,
                                    taxStatus: TaxStatus.POSTTAX,
                                    productOfferingId: 11,
                                    plan: {
                                        carrierId: CarrierId.AFLAC,
                                        characteristics: [] as Characteristics[],
                                        product: { id: 8 } as Product,
                                    } as Plan,
                                } as PlanOffering,
                                cartItemInfo: {
                                    benefitAmount: 2,
                                    coverageLevelId: 2,
                                    enrollmentState: "AZ",
                                    id: 555,
                                    memberCost: 4,
                                    planOfferingId: 11,
                                    totalCost: 4,
                                } as GetCartItems,
                            },
                        ],
                    },
                ],
                error: null,
            });
        });
    });

    describe("getSelectedProductCombinedOfferingWithCartAndEnrollment", () => {
        it("should get IDLE AsyncData if no selected productId", () => {
            const result = PlanOfferingsSelectors.getSelectedProductCombinedOfferingWithCartAndEnrollment({
                ...state,
                [PRODUCTS_FEATURE_KEY]: { ...state[PRODUCTS_FEATURE_KEY], selectedProductId: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get selected Product CombinedOfferingWithCartAndEnrollment", () => {
            const result = PlanOfferingsSelectors.getSelectedProductCombinedOfferingWithCartAndEnrollment(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: {
                    productOffering: { id: 11, product: { id: 8 } as Product } as ProductOffering,
                    planOfferingsWithCartAndEnrollment: [
                        {
                            planOffering: {
                                id: 555,
                                taxStatus: TaxStatus.POSTTAX,
                                productOfferingId: 11,
                                plan: {
                                    carrierId: CarrierId.AFLAC,
                                    characteristics: [] as Characteristics[],
                                    product: { id: 8 } as Product,
                                } as Plan,
                            } as PlanOffering,
                            cartItemInfo: {
                                benefitAmount: 2,
                                coverageLevelId: 2,
                                enrollmentState: "AZ",
                                id: 555,
                                memberCost: 4,
                                planOfferingId: 11,
                                totalCost: 4,
                            } as GetCartItems,
                        },
                    ],
                },
                error: null,
            });
        });
    });

    describe("getCoverageLevelsEntities", () => {
        it("should get CoverageLevels Entities State", () => {
            const result = PlanOfferingsSelectors.getCoverageLevelsEntities(state);

            expect(result).toStrictEqual(state[PLAN_OFFERINGS_FEATURE_KEY].coverageLevelsEntities);
        });
    });

    describe("getKnockoutQuestionsEntities", () => {
        it("should get KnockoutQuestions Entities State", () => {
            const result = PlanOfferingsSelectors.getKnockoutQuestionsEntities(state);

            expect(result).toStrictEqual(state[PLAN_OFFERINGS_FEATURE_KEY].knockoutQuestionsEntities);
        });
    });

    describe("getSelectedCoverageLevels", () => {
        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = PlanOfferingsSelectors.getSelectedCoverageLevels({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get IDLE AsyncData if no selected planId", () => {
            const result = PlanOfferingsSelectors.getSelectedCoverageLevels({
                ...state,
                [PLAN_OFFERINGS_FEATURE_KEY]: { ...state[PLAN_OFFERINGS_FEATURE_KEY], selectedPlanId: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get selected CoverageLevels", () => {
            const result = PlanOfferingsSelectors.getSelectedCoverageLevels(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [{ name: "Individual", id: 1, eliminationPeriod: "0/7" } as CoverageLevel],
                error: null,
            });
        });
    });

    describe("getSelectedKnockoutQuestions", () => {
        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = PlanOfferingsSelectors.getSelectedKnockoutQuestions({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get IDLE AsyncData if no selected planOfferingId", () => {
            const result = PlanOfferingsSelectors.getSelectedKnockoutQuestions({
                ...state,
                [PLAN_OFFERINGS_FEATURE_KEY]: { ...state[PLAN_OFFERINGS_FEATURE_KEY], selectedPlanOfferingId: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get selected KnockoutQuestions", () => {
            const result = PlanOfferingsSelectors.getSelectedKnockoutQuestions(state);

            expect(result).toStrictEqual({
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
            });
        });
    });

    describe("getPlanOfferingPricingsEntities", () => {
        it("should get PlanOfferingPricings Entities State", () => {
            const result = PlanOfferingsSelectors.getPlanOfferingPricingsEntities(state);

            expect(result).toStrictEqual(state[PLAN_OFFERINGS_FEATURE_KEY].planOfferingPricingsEntities);
        });
    });

    describe("getSelectedPlanOfferingPricings", () => {
        it("should get IDLE AsyncData if no selected country state", () => {
            const result = PlanOfferingsSelectors.getSelectedPlanOfferingPricings(2)({
                ...state,
                [SHARED_FEATURE_KEY]: { ...state[SHARED_FEATURE_KEY], selectedCountryState: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get IDLE AsyncData if no selected mpGroup", () => {
            const result = PlanOfferingsSelectors.getSelectedPlanOfferingPricings(2)({
                ...state,
                [ACCOUNTS_FEATURE_KEY]: { ...state[ACCOUNTS_FEATURE_KEY], selectedMPGroup: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get IDLE AsyncData if no selected memberId", () => {
            const result = PlanOfferingsSelectors.getSelectedPlanOfferingPricings(2)({
                ...state,
                [MEMBERS_FEATURE_KEY]: { ...state[MEMBERS_FEATURE_KEY], selectedMemberId: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get IDLE AsyncData if no selected planOfferingId", () => {
            const result = PlanOfferingsSelectors.getSelectedPlanOfferingPricings(2)({
                ...state,
                [PLAN_OFFERINGS_FEATURE_KEY]: { ...state[PLAN_OFFERINGS_FEATURE_KEY], selectedPlanOfferingId: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get selected PlanOfferingPricings", () => {
            const result = PlanOfferingsSelectors.getSelectedPlanOfferingPricings(2)(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [{ benefitAmount: 9000, coverageLevelId: 1 } as PlanOfferingPricing],
                error: null,
            });
        });
    });

    describe("getSelectedPlanOfferingPricingCoverages", () => {
        it("should get selected getSelectedPlanOfferingPricingCoverages", () => {
            const result = PlanOfferingsSelectors.getSelectedPlanOfferingPricingCoverages(2, "", 9000)(state);

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [
                    {
                        planOfferingPricing: { benefitAmount: 9000, coverageLevelId: 1 } as PlanOfferingPricing,
                        coverageLevel: {
                            name: "Individual",
                            displayName: "Individual",
                            id: 1,
                            eliminationPeriod: "0/7",
                        } as CoverageLevel,
                    },
                ],
                error: null,
            });
        });
    });

    describe("getSelectedEliminationPeriods", () => {
        it("should get IDLE AsyncData if no selected productId", () => {
            const result = PlanOfferingsSelectors.getSelectedEliminationPeriods({
                ...state,
                [PRODUCTS_FEATURE_KEY]: { ...state[PRODUCTS_FEATURE_KEY], selectedProductId: null },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.IDLE,
            });
        });

        it("should get SUCCEEDED AsyncData with empty array for value if selected productId is not ProductId.SHORT_TERM_DISABILITY and not ProductId.LTD", () => {
            const selectedProductId = ProductId.ACCIDENT;

            const result = PlanOfferingsSelectors.getSelectedEliminationPeriods({
                ...state,
                [PRODUCTS_FEATURE_KEY]: { ...state[PRODUCTS_FEATURE_KEY], selectedProductId },
            });

            expect(selectedProductId).not.toBe(ProductId.SHORT_TERM_DISABILITY);
            expect(selectedProductId).not.toBe(ProductId.LTD);
            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                error: null,
                value: [],
            });
        });

        it("should get selected EliminationPeriods", () => {
            const result = PlanOfferingsSelectors.getSelectedEliminationPeriods({
                ...state,
                [PRODUCTS_FEATURE_KEY]: {
                    ...state[PRODUCTS_FEATURE_KEY],
                    selectedProductId: 5,
                },
            });

            expect(result).toStrictEqual({
                status: AsyncStatus.SUCCEEDED,
                value: [
                    {
                        id: 1,
                        eliminationPeriod: "0/7",
                        name: "Individual",
                    },
                ],
                error: null,
            });
        });
    });
});
