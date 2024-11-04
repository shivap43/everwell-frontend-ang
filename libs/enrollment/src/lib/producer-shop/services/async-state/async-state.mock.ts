import { KnockoutQuestion } from "@empowered/api";
import {
    AsyncStatus,
    CoverageDatesEnrollmentType,
    EnrollmentMethod,
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
import { AccountsState } from "@empowered/ngrx-store/ngrx-states/accounts";
import { AccountsPartialState, ACCOUNTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.reducer";
import { EnrollmentsState } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { EnrollmentsPartialState, ENROLLMENTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/enrollments/enrollments.reducer";
import { enrollmentsEntityAdapter } from "@empowered/ngrx-store/ngrx-states/enrollments/enrollments.state";
import { MembersState } from "@empowered/ngrx-store/ngrx-states/members";
import { mockCrossBorderRules, mockMemberContacts } from "@empowered/ngrx-store/ngrx-states/members/members.mocks";
import { MembersPartialState, MEMBERS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/members/members.reducer";
import { crossBorderRulesEntityAdapter, memberContactsEntityAdapter } from "@empowered/ngrx-store/ngrx-states/members/members.state";
import { PlanOfferingsState } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import {
    PlanOfferingsPartialState,
    PLAN_OFFERINGS_FEATURE_KEY,
} from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.reducer";
import {
    coverageDatesRecordEntityAdapter,
    coverageLevelsEntityAdapter,
    knockOutQuestionsEntityAdapter,
    planOfferingPricingsEntityAdapter,
    planOfferingRidersEntityAdapter,
    planOfferingsEntityAdapter,
} from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.state";
import { ProductOfferingsState } from "@empowered/ngrx-store/ngrx-states/product-offerings";
import {
    ProductOfferingsPartialState,
    PRODUCT_OFFERINGS_FEATURE_KEY,
} from "@empowered/ngrx-store/ngrx-states/product-offerings/product-offerings.reducer";
import { productOfferingSetsEntityAdapter } from "@empowered/ngrx-store/ngrx-states/product-offerings/product-offerings.state";
import { ProductsState } from "@empowered/ngrx-store/ngrx-states/products";
import { ProductsPartialState, PRODUCTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/products/products.reducer";
import { SharedState } from "@empowered/ngrx-store/ngrx-states/shared";
import { SharedPartialState, SHARED_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/shared/shared.reducer";
import { ShoppingCartsState } from "@empowered/ngrx-store/ngrx-states/shopping-carts";
import {
    ShoppingCartsPartialState,
    SHOPPING_CARTS_FEATURE_KEY,
} from "@empowered/ngrx-store/ngrx-states/shopping-carts/shopping-carts.reducer";
import { cartItemsSetsEntityAdapter } from "@empowered/ngrx-store/ngrx-states/shopping-carts/shopping-carts.state";

export const initialState = {
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
                    value: [{ id: 11, product: { id: 8 } } as ProductOffering],
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
        ...PlanOfferingsState.initialState,
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
                                characteristics: [] as Characteristics[],
                                product: { id: 8 } as Product,
                            } as Plan,
                        } as PlanOffering,
                    ],
                    error: null,
                },
            },
            { ...PlanOfferingsState.initialState.planOfferingsEntities },
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
            { ...PlanOfferingsState.initialState.planOfferingRidersEntities },
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
            { ...PlanOfferingsState.initialState.knockoutQuestionsEntities },
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
            { ...PlanOfferingsState.initialState.coverageLevelsEntities },
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
            { ...PlanOfferingsState.initialState.coverageDatesRecordEntities },
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
                ...PlanOfferingsState.initialState.planOfferingPricingsEntities,
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
} as PlanOfferingsPartialState &
AccountsPartialState &
MembersPartialState &
EnrollmentsPartialState &
SharedPartialState &
ProductOfferingsPartialState &
ProductsPartialState &
ShoppingCartsPartialState;
