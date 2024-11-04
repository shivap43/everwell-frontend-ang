import { ComponentType } from "@angular/cdk/portal";
import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { RouterTestingModule } from "@angular/router/testing";
import { InputType, KnockoutQuestion, Enrollment, CartItem, ApplicationResponseBaseType, MemberQLETypes } from "@empowered/api";

import {
    AddToCartItem,
    AsyncStatus,
    EnrollmentMethod,
    PlanOfferingCostInfo,
    PlanOfferingWithCartAndEnrollment,
    ProductId,
    QuestionTitles,
    UpdateCartItem,
    KnockoutType,
    Option,
    Question,
    Salary,
    RiderCart,
    CoverageLevel,
    CountryState,
    EnrollmentRequirement,
    PlanOffering,
    GetCartItems,
    Enrollments,
    ProducerCredential,
    ApplicationResponse,
    DependencyTypes,
    MemberContact,
    StatusType,
    MemberQualifyingEvent,
    CoverageLevelId,
    ContraintsType,
    Plan,
} from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { AccountsState } from "@empowered/ngrx-store/ngrx-states/accounts";
import { AccountsPartialState, ACCOUNTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.reducer";
import { AuthState } from "@empowered/ngrx-store/ngrx-states/auth";
import { AuthPartialState, AUTH_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/auth/auth.reducer";
import { EnrollmentsState } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { EnrollmentsPartialState, ENROLLMENTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/enrollments/enrollments.reducer";
import { MembersState } from "@empowered/ngrx-store/ngrx-states/members";
import { MembersPartialState, MEMBERS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/members/members.reducer";
import { PlanOfferingsActions, PlanOfferingsState } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import {
    PlanOfferingsPartialState,
    PLAN_OFFERINGS_FEATURE_KEY,
} from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.reducer";
import {
    coverageLevelsEntityAdapter,
    knockOutQuestionsEntityAdapter,
} from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.state";
import { ProductOfferingsState } from "@empowered/ngrx-store/ngrx-states/product-offerings";
import {
    ProductOfferingsPartialState,
    PRODUCT_OFFERINGS_FEATURE_KEY,
} from "@empowered/ngrx-store/ngrx-states/product-offerings/product-offerings.reducer";
import { ProductsState } from "@empowered/ngrx-store/ngrx-states/products";
import { ProductsPartialState, PRODUCTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/products/products.reducer";
import { SharedState } from "@empowered/ngrx-store/ngrx-states/shared";
import { SharedPartialState, SHARED_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/shared/shared.reducer";
import { ShoppingCartsActions, ShoppingCartsState } from "@empowered/ngrx-store/ngrx-states/shopping-carts";
import {
    ShoppingCartsPartialState,
    SHOPPING_CARTS_FEATURE_KEY,
} from "@empowered/ngrx-store/ngrx-states/shopping-carts/shopping-carts.reducer";
import { updateCartItemEntityAdapter } from "@empowered/ngrx-store/ngrx-states/shopping-carts/shopping-carts.state";
import { MockStore, provideMockStore } from "@ngrx/store/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { of } from "rxjs/internal/observable/of";
import { PlanOfferingService } from "../plan-offering/plan-offering.service";
import {
    AnsweredKnockoutQuestion,
    AnswerKnockoutQuestionValue,
    KnockoutDialogResponse,
    PlanKnockoutEligibility,
    ProductCoverageDate,
} from "../producer-shop-component-store/producer-shop-component-store.model";
import { ProducerShopComponentStoreService } from "../producer-shop-component-store/producer-shop-component-store.service";
import { RiderStateWithPlanPricings } from "../rider-component-store/rider-component-store.model";
import { RiderComponentStoreService } from "../rider-component-store/rider-component-store.service";
import {
    AnsweredData,
    InEligibleAnswerData,
    KnockoutQuestionsAndInelgibleAnswers,
    PlanOfferingOptions,
} from "./manage-cart-items-helper.model";

import { ManageCartItemsHelperService } from "./manage-cart-items-helper.service";

const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () => of({}),
        } as MatDialogRef<any>),
} as MatDialog;

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) => ({}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

const mockStore = {
    dispatch: () => of({}),
    select: () => of({}),
};

const mockInitialState = {
    [SHARED_FEATURE_KEY]: {
        ...SharedState.initialState,
        selectedEnrollmentMethod: EnrollmentMethod.HEADSET,
        selectedCity: "Atlanta",
        selectedCountryState: {
            abbreviation: "GA",
            name: "Georgia",
        } as CountryState,
        selectedHeadsetState: {
            abbreviation: "GA",
            name: "Georgia",
        } as CountryState,
        countryStates: {
            status: AsyncStatus.SUCCEEDED,
            value: [
                {
                    abbreviation: "GA",
                    name: "Georgia",
                },
                {
                    abbreviation: "AZ",
                    name: "Arizona",
                },
                {
                    abbreviation: "NY",
                    name: "New York",
                },
            ] as CountryState[],
            error: null,
        },
    },
    [ACCOUNTS_FEATURE_KEY]: {
        ...AccountsState.initialState,
        selectedMPGroup: 111,
    },
    [MEMBERS_FEATURE_KEY]: {
        ...MembersState.initialState,
        selectedMemberId: 222,
        memberContactsEntities: {
            ids: [111 - 222],
            entities: {
                "111-222": {
                    identifiers: {
                        mpGroup: 111,
                        memberId: 222,
                    },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [{}] as MemberContact[],
                        error: null,
                    },
                },
            },
        },
        qualifyingEventsEntities: {
            ids: [111 - 222],
            entities: {
                "111-222": {
                    identifiers: {
                        mpGroup: 111,
                        memberId: 222,
                    },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [
                            {
                                id: 111,
                                type: {
                                    code: MemberQLETypes.NEW_HIRE,
                                },
                                status: StatusType.INPROGRESS,
                                enrollmentValidity: {
                                    effectiveStarting: "2022-05-13",
                                    expiresAfter: "9999-05-13",
                                },
                                coverageStartDates: [
                                    {
                                        productId: ProductId.ACCIDENT,
                                    },
                                ],
                            },
                        ] as MemberQualifyingEvent[],
                        error: null,
                    },
                },
            },
        },
        salariesEntities: {
            ids: [111 - 222],
            entities: {
                "111-222": {
                    identifiers: {
                        mpGroup: 111,
                        memberId: 222,
                    },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [{ annualSalary: "choose me!", hourlyWage: "some hourly wage", hoursPerYear: 104 } as Salary],
                        error: null,
                    },
                },
            },
        },
    },
    [SHOPPING_CARTS_FEATURE_KEY]: {
        ...ShoppingCartsState.initialState,
        updateCartItemEntities: updateCartItemEntityAdapter.setOne(
            {
                identifiers: {
                    memberId: 222,
                    mpGroup: 111,
                    enrollmentMethod: EnrollmentMethod.HEADSET,
                    enrollmentState: "GA",
                },
                data: {
                    status: AsyncStatus.SUCCEEDED,
                    value: 2,
                    error: null,
                },
            },
            { ...ShoppingCartsState.initialState.updateCartItemEntities },
        ),
    },
    [AUTH_FEATURE_KEY]: {
        ...AuthState.initialState,
        user: {
            status: AsyncStatus.SUCCEEDED,
            value: { producerId: 333 } as ProducerCredential,
            error: null,
        },
    },
    [PRODUCTS_FEATURE_KEY]: {
        ...ProductsState.initialState,
        selectedProductId: 1,
    },
    [PLAN_OFFERINGS_FEATURE_KEY]: {
        ...PlanOfferingsState.initialState,
        selectedPlanOfferingId: 11,
        selectedPlanId: 1,
        selectedCoverageLevelId: 27,
        knockoutQuestionsEntities: knockOutQuestionsEntityAdapter.setOne(
            {
                identifiers: {
                    planOfferingId: 11,
                    stateAbbreviation: "AL",
                    mpGroup: 111,
                    memberId: 222,
                },
                data: {
                    status: AsyncStatus.SUCCEEDED,
                    value: [
                        {
                            id: 1,
                            title: QuestionTitles.ELIGIBILITY_QUESTIONS,
                            question: {
                                text: "TEXT",
                                id: 12,
                                options: [
                                    {
                                        knockoutType: KnockoutType.KNOCKOUT,
                                    },
                                ] as Option[],
                            } as Question,
                        },
                    ] as KnockoutQuestion[],
                    error: null,
                },
            },
            { ...PlanOfferingsState.initialState.knockoutQuestionsEntities },
        ),
        coverageLevelsEntities: coverageLevelsEntityAdapter.setOne(
            {
                identifiers: { mpGroup: 111, planId: 1, fetchRetainRiders: false },
                data: {
                    status: AsyncStatus.SUCCEEDED,
                    value: [{ name: "Individual", id: 27, eliminationPeriod: "0/7" } as CoverageLevel],
                    error: null,
                },
            },
            { ...PlanOfferingsState.initialState.coverageLevelsEntities },
        ),
    },
    [PRODUCT_OFFERINGS_FEATURE_KEY]: {
        ...ProductOfferingsState.initialState,
        selectedReferenceDate: "16-05-2022",
    },
    [ENROLLMENTS_FEATURE_KEY]: {
        ...EnrollmentsState.initialState,
        enrollmentsEntities: {
            ids: [111 - 222],
            entities: {
                "111-222": {
                    identifiers: { memberId: 333, mpGroup: 111 },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [{ status: "ACTIVE", plan: { id: 1 } as Plan } as Enrollments],
                        error: null,
                    },
                },
            },
        },
    },
} as SharedPartialState &
AccountsPartialState &
MembersPartialState &
ShoppingCartsPartialState &
AuthPartialState &
ProductsPartialState &
PlanOfferingsPartialState &
ProductOfferingsPartialState &
EnrollmentsPartialState;
describe("ManageCartItemsHelperService", () => {
    let mockDialog: MatDialog;
    let service: ManageCartItemsHelperService;
    let producerShopComponentStoreService: ProducerShopComponentStoreService;
    let ngrxStore: NGRXStore;
    let store: MockStore<
    SharedPartialState &
    AccountsPartialState &
    MembersPartialState &
    ShoppingCartsPartialState &
    AuthPartialState &
    ProductsPartialState &
    PlanOfferingsPartialState &
    ProductOfferingsPartialState
    >;
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, RouterTestingModule, NgxsModule.forRoot([])],
            providers: [
                NGRXStore,
                provideMockStore({ initialState: mockInitialState }),
                ProducerShopComponentStoreService,
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                { provide: Store, useValue: mockStore },
                DatePipe,
                PlanOfferingService,
                ManageCartItemsHelperService,
                RiderComponentStoreService,
            ],
        });

        service = TestBed.inject(ManageCartItemsHelperService);
        producerShopComponentStoreService = TestBed.inject(ProducerShopComponentStoreService);
        mockDialog = TestBed.inject(MatDialog);
    });
    beforeEach(() => {
        store = TestBed.inject(MockStore);
        ngrxStore = TestBed.inject(NGRXStore);

        jest.spyOn(store, "dispatch").mockImplementation(() => {
            /* stub */
        });
        // Ignore trying to use cache and always dispatch action
        jest.spyOn(ngrxStore, "dispatch").mockImplementation((action) => {
            store.dispatch(action);
        });
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    describe("getRiderCarts()", () => {
        let mockRiderStateWithPlanPricing: RiderStateWithPlanPricings;
        let mockExistingRiderCart: RiderCart;
        let mockSelectedPlanCost: PlanOfferingCostInfo;

        beforeEach(() => {
            mockRiderStateWithPlanPricing = {
                riderState: {
                    riderPlanOfferingId: 555,
                    riderParentPlanId: 444,
                    checked: true,
                    disabled: false,
                },
                pricingDatas: [
                    {
                        baseCoverageLevel: { id: 777 },
                        riderPlanOfferingPricing: {
                            coverageLevelId: 888,
                            memberCost: 333,
                            totalCost: 333,
                            benefitAmount: 222,
                        },
                    },
                ],
            } as RiderStateWithPlanPricings;

            mockExistingRiderCart = { planOfferingId: 555, cartItemId: 111 } as RiderCart;

            mockSelectedPlanCost = { planOfferingPricingCoverage: { coverageLevel: { id: 777 } } } as PlanOfferingCostInfo;
        });

        it("should get RiderCart from RiderStates and existing RiderCarts", () => {
            expect(service.getRiderCarts([mockExistingRiderCart], mockSelectedPlanCost, [mockRiderStateWithPlanPricing])).toStrictEqual([
                {
                    cartItemId: 111,
                    planOfferingId: 555,
                    benefitAmount: 222,
                    coverageLevelId: 888,
                    memberCost: 333,
                    totalCost: 333,
                    baseRiderId: 444,
                },
            ]);
        });

        it("should have declined CoverageLevel if RiderState is not checked", () => {
            const expectedResult = [
                {
                    cartItemId: 111,
                    planOfferingId: 555,
                    benefitAmount: undefined,
                    coverageLevelId: CoverageLevelId.DECLINED,
                    memberCost: 0,
                    totalCost: 0,
                    baseRiderId: 444,
                },
            ];

            expect(
                service.getRiderCarts([mockExistingRiderCart], mockSelectedPlanCost, [
                    { ...mockRiderStateWithPlanPricing, riderState: { ...mockRiderStateWithPlanPricing.riderState, checked: false } },
                ]),
            ).toStrictEqual(expectedResult);
        });

        it("should exclude RiderState has DependencyType REQUIRES_BROKERS_PLAN_SELECTION and is unchecked and disabled", () => {
            expect(
                service.getRiderCarts([mockExistingRiderCart], mockSelectedPlanCost, [
                    {
                        ...mockRiderStateWithPlanPricing,
                        riderState: {
                            ...mockRiderStateWithPlanPricing.riderState,
                            checked: false,
                            disabled: true,
                            enrollmentRequirements: [
                                { dependencyType: DependencyTypes.REQUIRES_BROKERS_PLAN_SELECTION } as EnrollmentRequirement,
                            ],
                        },
                    },
                ]),
            ).toStrictEqual([]);
        });

        it("should exclude RiderCart that does NOT have any cartItemId if baseCartItemId is passed", () => {
            expect(
                service.getRiderCarts(
                    [{ ...mockExistingRiderCart, cartItemId: undefined }],
                    mockSelectedPlanCost,
                    [mockRiderStateWithPlanPricing],
                    -1,
                ),
            ).toStrictEqual([]);
        });

        it("should include RiderCart that does have any cartItemId if baseCartItemId is passed", () => {
            expect(
                service.getRiderCarts(
                    [{ ...mockExistingRiderCart, cartItemId: 111 }],
                    mockSelectedPlanCost,
                    [mockRiderStateWithPlanPricing],
                    -1,
                ),
            ).toStrictEqual([
                {
                    cartItemId: 111,
                    planOfferingId: 555,
                    benefitAmount: 222,
                    coverageLevelId: 888,
                    memberCost: 333,
                    totalCost: 333,
                    baseRiderId: 444,
                },
            ]);
        });
    });

    describe("isAutoEnrolledUpdateNeeded()", () => {
        it("should return true if CartItem is acknowledged", () => {
            expect(service.isAutoEnrolledUpdateNeeded({ acknowledged: false } as GetCartItems, EnrollmentMethod.CALL_CENTER, "GA")).toBe(
                true,
            );
        });

        it("should return true if CartItem EnrollmentMethod DOES NOT match argument", () => {
            expect(
                service.isAutoEnrolledUpdateNeeded(
                    { acknowledged: true, enrollmentMethod: EnrollmentMethod.CALL_CENTER, enrollmentState: "GA" } as GetCartItems,
                    EnrollmentMethod.PIN_SIGNATURE,
                    "GA",
                ),
            ).toBe(true);
        });

        it("should return true if CartItem EnrollmentState DOES NOT match argument", () => {
            expect(
                service.isAutoEnrolledUpdateNeeded(
                    { acknowledged: true, enrollmentMethod: EnrollmentMethod.CALL_CENTER, enrollmentState: "AZ" } as GetCartItems,
                    EnrollmentMethod.PIN_SIGNATURE,
                    "GA",
                ),
            ).toBe(true);
        });

        it("should return false if CartItem is NOT acknowledged and EnrollmentMethod matches argument", () => {
            expect(
                service.isAutoEnrolledUpdateNeeded(
                    { acknowledged: true, enrollmentMethod: EnrollmentMethod.CALL_CENTER, enrollmentState: "GA" } as GetCartItems,
                    EnrollmentMethod.CALL_CENTER,
                    "GA",
                ),
            ).toBe(false);
        });

        it("should return false if knockout type is not valid", () => {
            const knockOutType = KnockoutType.NOT_APPLICABLE;
            expect(service.isKnockoutTypeValid(knockOutType)).toBe(false);
        });

        it("should return true if knock out type is valid", () => {
            const knockOutType = KnockoutType.SPOUSE_KNOCKOUT;
            expect(service.isKnockoutTypeValid(knockOutType)).toBe(true);
        });
    });
    describe("getDefaultReplaceDialogResponse()", () => {
        it("should return replace plan dialog response", () => {
            const cartObject = {
                enrollmentMethod: EnrollmentMethod.VIRTUAL_FACE_TO_FACE,
                enrollmentState: "Georgia",
            } as AddToCartItem;
            const knockoutPlanEligibility = {
                planOfferingId: 111,
                knockoutType: KnockoutType.KNOCKOUT,
                cartObject,
            } as PlanKnockoutEligibility;
            const previousCartItem = service.getPreviousCartItem({ "111": knockoutPlanEligibility }, 111);
            const selectedPlanData = {
                planOffering: {
                    id: 111,
                } as PlanOffering,
                cartItemInfo: cartObject,
            } as PlanOfferingWithCartAndEnrollment;
            const result = {
                isReplace: false,
                selectedPlanOfferingWithCartAndEnrollment: selectedPlanData,
                previousCartItem: previousCartItem,
                isActiveEnrollment: false,
            };
            expect(service.getDefaultReplaceDialogResponse(selectedPlanData, { "111": knockoutPlanEligibility })).toStrictEqual(result);
        });
    });
    describe("getPreviousCartItem()", () => {
        it("should return previous cart object if plan is not eligible previously", () => {
            const cartObject = {
                enrollmentMethod: EnrollmentMethod.VIRTUAL_FACE_TO_FACE,
                enrollmentState: "Georgia",
            } as AddToCartItem;
            const planKnockoutEligibility = {
                planOfferingId: 111,
                knockoutType: KnockoutType.KNOCKOUT,
                cartObject,
            } as PlanKnockoutEligibility;

            expect(service.getPreviousCartItem({ "111": planKnockoutEligibility }, 111)).toBe(cartObject);
        });
        it("should return null if plan had knockout type other than KnockoutType.KNOCKOUT", () => {
            const cartObject = {
                enrollmentMethod: EnrollmentMethod.VIRTUAL_FACE_TO_FACE,
                enrollmentState: "Georgia",
            } as AddToCartItem;
            const planKnockoutEligibility = {
                planOfferingId: 111,
                knockoutType: KnockoutType.NOT_APPLICABLE,
                cartObject,
            } as PlanKnockoutEligibility;

            expect(service.getPreviousCartItem({ "111": planKnockoutEligibility }, 111)).toBe(null);
        });
    });
    describe("getKnockoutOption()", () => {
        it("should return valid option if knockout type is valid", () => {
            const option1 = {
                knockoutType: KnockoutType.KNOCKOUT,
                value: "yes",
            } as Option;
            const option2 = {
                knockoutType: KnockoutType.KNOCKOUT,
                value: "no",
            } as Option;
            const knockoutQuestion = {
                id: 1,
                question: {
                    id: 12,
                    inputType: InputType.RADIO,
                    options: [option1, option2],
                } as Question,
            } as KnockoutQuestion;
            const knockoutDialogResponse = {
                value: ["yes"],
            } as KnockoutDialogResponse;

            expect(service.getKnockoutOption(knockoutQuestion, knockoutDialogResponse)).toBe(option1);
            knockoutQuestion.question.inputType = InputType.CHECKBOX;
            expect(service.getKnockoutOption(knockoutQuestion, knockoutDialogResponse)).toBe(option1);
        });

        it("should return null if knockout type is invalid", () => {
            const option1 = {
                knockoutType: KnockoutType.NOT_APPLICABLE,
                value: "yes",
            } as Option;
            const option2 = {
                knockoutType: KnockoutType.NOT_APPLICABLE,
                value: "no",
            } as Option;
            const knockoutQuestion = {
                id: 1,
                question: {
                    id: 12,
                    inputType: InputType.RADIO,
                    options: [option1, option2],
                } as Question,
            } as KnockoutQuestion;
            const knockoutDialogResponse = {
                value: ["yes"],
            } as KnockoutDialogResponse;

            expect(service.getKnockoutOption(knockoutQuestion, knockoutDialogResponse)).toBe(null);
            knockoutQuestion.question.inputType = InputType.MULTISELECT;
            expect(service.getKnockoutOption(knockoutQuestion, knockoutDialogResponse)).toBe(null);
        });
    });
    describe("setKnockoutAsEligible()", () => {
        let planOffering: PlanOffering;
        let enrollment: Enrollment;
        let cartItem: CartItem;
        let planOfferingWithCartAndEnrollment: PlanOfferingWithCartAndEnrollment;
        let option1: Option;
        let option2: Option;
        let cartObject: AddToCartItem;
        let knockoutQuestions: KnockoutQuestion[];
        let planKnockoutEligibility: PlanKnockoutEligibility;

        beforeEach(() => {
            planOffering = {
                id: 11,
            } as PlanOffering;
            enrollment = {
                id: 15,
            } as Enrollment;
            cartItem = {
                id: 1,
            } as CartItem;
            planOfferingWithCartAndEnrollment = {
                planOffering: planOffering,
                enrollment: enrollment,
                cartItemInfo: cartItem,
            } as PlanOfferingWithCartAndEnrollment;

            option1 = {
                knockoutType: KnockoutType.NOT_APPLICABLE,
                value: "yes",
            } as Option;
            option2 = {
                knockoutType: KnockoutType.NOT_APPLICABLE,
                value: "no",
            } as Option;

            cartObject = {
                enrollmentMethod: EnrollmentMethod.VIRTUAL_FACE_TO_FACE,
                enrollmentState: "Georgia",
            } as AddToCartItem;

            knockoutQuestions = [
                {
                    id: 1,
                    question: {
                        id: 12,
                        key: "14",
                        inputType: InputType.RADIO,
                        options: [option1, option2],
                    } as Question,
                } as KnockoutQuestion,
            ];
            planKnockoutEligibility = {
                planOfferingId: 111,
                knockoutType: KnockoutType.NOT_APPLICABLE,
                questions: [
                    {
                        id: 12,
                        question: { id: 1, key: "14" } as Question,
                    } as KnockoutQuestion,
                ],
                cartObject,
            } as PlanKnockoutEligibility;
        });

        it("should not set plan knockout data if knockout type is not valid", () => {
            service.setKnockoutAsEligible(planOfferingWithCartAndEnrollment, { "1": planKnockoutEligibility }, knockoutQuestions);
            const spy1 = jest.spyOn(producerShopComponentStoreService, "setPlanKnockoutEligibility");
            expect(spy1).toBeCalledTimes(0);
        });
        it("should not set plan knockout data if all questions from previous knockout haven't been answered", () => {
            knockoutQuestions[0].question.key = "13";
            planKnockoutEligibility.knockoutType = KnockoutType.KNOCKOUT;
            service.setKnockoutAsEligible(planOfferingWithCartAndEnrollment, { "1": planKnockoutEligibility }, knockoutQuestions);
            const spy1 = jest.spyOn(producerShopComponentStoreService, "setPlanKnockoutEligibility");
            expect(spy1).toBeCalledTimes(0);
        });
        it("should set plan knockout data if all questions from previous knockout haven been answered and knockout type is valid", () => {
            knockoutQuestions[0].question.key = "14";
            planKnockoutEligibility.knockoutType = KnockoutType.KNOCKOUT;
            const spy1 = jest.spyOn(producerShopComponentStoreService, "setPlanKnockoutEligibility").mockReturnValueOnce(of().subscribe());
            service.setKnockoutAsEligible(planOfferingWithCartAndEnrollment, { "1": planKnockoutEligibility }, knockoutQuestions);
            expect(spy1).toBeCalledTimes(1);
            expect(spy1).toBeCalledWith([
                { planOfferingId: planOfferingWithCartAndEnrollment.planOffering.id, knockoutType: KnockoutType.NOT_APPLICABLE },
            ]);
        });
        it("should get responses list to be saved", () => {
            const knockoutQuestion = {
                id: 1,
                question: {
                    id: 12,
                    key: "14",
                    inputType: InputType.RADIO,
                    options: [option1, option2],
                } as Question,
            } as KnockoutQuestion;

            const answeredData = [
                {
                    knockoutQuestion: knockoutQuestion,
                    answer: "yes",
                } as AnsweredData,
            ];
            expect(service.getResponsesFromPreviousAnswers(answeredData)).toStrictEqual([
                {
                    stepId: answeredData[0].knockoutQuestion.id,
                    value: [answeredData[0].answer],
                    key: answeredData[0].knockoutQuestion.question.key,
                    type: ContraintsType.QUESTION,
                    planQuestionId: answeredData[0].knockoutQuestion.question.id,
                },
            ]);
        });
    });
    describe("getUnansweredKnockoutQuestions()", () => {
        it("should return knockout questions that are not answered", (done) => {
            expect.assertions(2);
            const knockoutQuestion = [
                {
                    id: 1,
                    question: {
                        id: 12,
                    } as Question,
                },
            ] as KnockoutQuestion[];
            const spy = jest.spyOn(service, "getEligibilityKnockoutQuestions").mockReturnValueOnce(of(knockoutQuestion));
            service.getUnansweredKnockoutQuestions(27).subscribe((result) => {
                expect(result).toStrictEqual(knockoutQuestion);
                expect(spy).toBeCalledWith(27);
                done();
            });
        });
    });

    describe("saveKnockoutResponses()", () => {
        it("should return cart item id,member id and mpgroup id", (done) => {
            expect.assertions(3);
            const cartObject = {
                cartItemId: 2,
            } as UpdateCartItem;
            const responses = [
                {
                    stepId: 333,
                    type: "KnockoutResponses",
                },
            ] as ApplicationResponse[];
            const spy1 = jest.spyOn(ngrxStore, "dispatch");
            service.saveKnockoutResponses(cartObject, responses).subscribe((result) => {
                expect(result).toStrictEqual([2, 222, 111]);
                expect(spy1).toBeCalledWith(
                    PlanOfferingsActions.saveKnockoutResponses({
                        mpGroup: 111,
                        memberId: 222,
                        cartItemId: 2,
                        responses: responses,
                        applicationResponseBaseType: ApplicationResponseBaseType.SHOP,
                    }),
                );
                expect(spy1).toBeCalledTimes(2);
                done();
            });
        });
    });
    describe("getCartItemsWithUpdatedDate()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            jest.useFakeTimers();
            jest.setSystemTime(new Date("2022-05-13"));
        });
        afterAll(() => {
            jest.useRealTimers();
        });
        it.skip("should return cart item with updated date", (done) => {
            // TODO: Need to refactor this test
            expect.assertions(1);
            const cartItems = [
                {
                    id: 111,
                    planOffering: {
                        id: 222,
                        plan: {
                            productId: 1,
                            carrierId: 1,
                        },
                    },
                    coverageEffectiveDate: "13/5/2022",
                },
            ] as GetCartItems[];
            const productCoverageDates = [
                {
                    productId: ProductId.ACCIDENT,
                    productName: "Accident",
                    date: "14/5/2022",
                },
            ] as ProductCoverageDate[];
            const updatedCartItem = [
                {
                    ...cartItems[0],
                    planOfferingId: 222,
                    assistingAdminId: 333,
                    cartItemId: 111,
                    enrollmentMethod: EnrollmentMethod.HEADSET,
                    subscriberQualifyingEventId: 111,
                    coverageEffectiveDate: "14/5/2022",
                },
            ] as UpdateCartItem[];

            service.getCartItemsWithUpdatedDate(cartItems, productCoverageDates).subscribe((result) => {
                expect(result).toStrictEqual(updatedCartItem);
                done();
            });
        });

        it("should return cart item with empty array for plan having non aflac carrier id", (done) => {
            expect.assertions(1);
            const cartItems = [
                {
                    id: 111,
                    planOffering: {
                        id: 222,
                        plan: {
                            productId: 1,
                            carrierId: 59,
                        },
                    },
                    coverageEffectiveDate: "13/5/2022",
                },
            ] as GetCartItems[];
            const productCoverageDates = [
                {
                    productName: "VSP Vision",
                    date: "14/5/2022",
                },
            ] as ProductCoverageDate[];

            service.getCartItemsWithUpdatedDate(cartItems, productCoverageDates).subscribe((result) => {
                expect(result).toStrictEqual([]);
                done();
            });
        });
    });

    describe("getAnswersIneligibleData()", () => {
        it("should return ineligible as true when all questions have required constraint", (done) => {
            expect.assertions(2);
            const knockoutQuestion = [
                {
                    id: 1,
                    question: {
                        id: 12,
                    } as Question,
                },
            ] as KnockoutQuestion[];
            const spy1 = jest.spyOn(service, "getUnansweredKnockoutQuestions").mockReturnValueOnce(of(knockoutQuestion));
            service.getAnswersIneligibleData(27).subscribe((result) => {
                expect(result).toStrictEqual({ isIneligible: true });
                expect(spy1).toBeCalledWith(27);
                done();
            });
        });
        it("should return ineligibility answer data ", (done) => {
            expect.assertions(3);
            const mockValue = [
                { id: 1, key: "1", answer: AnswerKnockoutQuestionValue.NA },
                { id: 2, key: "2", answer: AnswerKnockoutQuestionValue.YES },
                { id: 3, key: "3", answer: AnswerKnockoutQuestionValue.NO },
            ] as AnsweredKnockoutQuestion[];

            producerShopComponentStoreService.setAnsweredKnockoutQuestions(mockValue);
            const knockoutQuestion = [
                {
                    id: 2,
                    question: {
                        id: 12,
                        key: "2",
                        options: [
                            {
                                value: AnswerKnockoutQuestionValue.YES,
                                knockoutType: KnockoutType.KNOCKOUT,
                            },
                        ],
                        requiredConstraint: [
                            {
                                questionId: 11,
                            },
                        ],
                        hideUnlessConstraint: [
                            {
                                questionId: 10,
                            },
                        ],
                    } as Question,
                },
            ] as KnockoutQuestion[];
            const ineligibleAnswersData = {
                isIneligible: true,
                answeredData: [
                    {
                        knockoutQuestion: knockoutQuestion[0],
                        answer: AnswerKnockoutQuestionValue.YES,
                    },
                ],
            } as InEligibleAnswerData;
            const spy1 = jest.spyOn(service, "getUnansweredKnockoutQuestions").mockReturnValueOnce(of(knockoutQuestion));
            const spy2 = jest.spyOn(service, "getEligibilityKnockoutQuestions").mockReturnValueOnce(of(knockoutQuestion));
            service.getAnswersIneligibleData().subscribe((result) => {
                expect(result).toStrictEqual(ineligibleAnswersData);
                expect(spy1).toBeCalledTimes(1);
                expect(spy2).toBeCalledTimes(1);
                done();
            });
        });
    });

    describe("addUpdateToCartPlan()", () => {
        let cartObjectToUpdate;
        let responses;
        let cartObjectToAdd;
        let selectedPlanDetails;
        beforeEach(() => {
            cartObjectToUpdate = {
                cartItemId: 2,
            } as UpdateCartItem;
            cartObjectToAdd = {
                planOfferingId: 555,
            } as AddToCartItem;
            responses = [{ stepId: 11 }] as ApplicationResponse[];
            selectedPlanDetails = {} as PlanOfferingWithCartAndEnrollment;
        });
        it("should dispatch updateCart action for current cart object and save application responses", (done) => {
            expect.assertions(4);
            const spy1 = jest.spyOn(service, "getCartObject").mockReturnValueOnce(of(cartObjectToUpdate));
            const spy2 = jest.spyOn(ngrxStore, "dispatch");
            const spy3 = jest.spyOn(service, "saveKnockoutResponses").mockReturnValueOnce(of([2, 222, 111]));
            service.addUpdateToCartPlan(selectedPlanDetails, null, responses).subscribe((result) => {
                expect(result).toStrictEqual([2, 222, 111]);
                expect(spy1).toBeCalledWith(selectedPlanDetails);
                expect(spy2).toBeCalledWith(
                    ShoppingCartsActions.updateCartItem({
                        memberId: 222,
                        mpGroup: 111,
                        cartItemId: 2,
                        updateCartObject: cartObjectToUpdate,
                    }),
                );
                expect(spy3).toBeCalledWith(cartObjectToUpdate, responses);
                done();
            });
        });
        it("should dispatch addToCart action for current cart object and save application responses", (done) => {
            expect.assertions(4);
            const spy1 = jest.spyOn(service, "getCartObject").mockReturnValueOnce(of(cartObjectToAdd));
            const spy2 = jest.spyOn(ngrxStore, "dispatch");
            const spy3 = jest.spyOn(service, "saveKnockoutResponses").mockReturnValueOnce(of([null, 222, 111]));
            service.addUpdateToCartPlan(selectedPlanDetails, null, responses).subscribe((result) => {
                expect(result).toStrictEqual([null, 222, 111]);
                expect(spy1).toBeCalledWith(selectedPlanDetails);
                expect(spy2).toBeCalledWith(
                    ShoppingCartsActions.addCartItem({
                        memberId: 222,
                        mpGroup: 111,
                        addCartObject: cartObjectToAdd,
                    }),
                );
                expect(spy3).toBeCalledWith(cartObjectToAdd, responses);
                done();
            });
        });
    });

    describe("addUpdateBucketPlanToCart()", () => {
        it("should dispatch updateCart action if cart object has cart item id", (done) => {
            expect.assertions(3);
            const cartObject = {
                cartItemId: 2,
            } as UpdateCartItem;
            const spy1 = jest.spyOn(service, "addUpdateBucketPlanToCartObject").mockReturnValueOnce(of(cartObject));
            const spy2 = jest.spyOn(ngrxStore, "dispatch");
            service.addUpdateBucketPlanToCart(null, 2).subscribe((result) => {
                expect(result).toBeUndefined();
                expect(spy1).toBeCalledTimes(1);
                expect(spy2).toBeCalledWith(
                    ShoppingCartsActions.updateCartItem({
                        memberId: 222,
                        mpGroup: 111,
                        cartItemId: 2,
                        updateCartObject: cartObject,
                    }),
                );
                done();
            });
        });
        it("should dispatch addToCart action if cart object does not have cart item id", (done) => {
            expect.assertions(3);
            const cartObject = {
                planOfferingId: 555,
            } as UpdateCartItem;
            const spy1 = jest.spyOn(service, "addUpdateBucketPlanToCartObject").mockReturnValueOnce(of(cartObject));
            const spy2 = jest.spyOn(ngrxStore, "dispatch");
            service.addUpdateBucketPlanToCart(null, null).subscribe((result) => {
                expect(result).toBeUndefined();
                expect(spy1).toBeCalledTimes(1);
                expect(spy2).toBeCalledWith(
                    ShoppingCartsActions.addCartItem({
                        memberId: 222,
                        mpGroup: 111,
                        addCartObject: cartObject,
                    }),
                );
                done();
            });
        });
    });

    describe("knockoutQuestionsSubmit()", () => {
        it("should check for replace cart if knockout questions has valid answers", (done) => {
            expect.assertions(3);
            const mockKnockDialogResponse = [{ stepId: 1 }] as KnockoutDialogResponse[];
            producerShopComponentStoreService.setKnockoutDialogResponse(mockKnockDialogResponse);
            const knockoutQuestionsAndInelgibleAnswers = {
                knockoutQuestions: [{}],
                answersIneligibleData: {
                    isIneligible: false,
                },
            } as KnockoutQuestionsAndInelgibleAnswers;
            const spy1 = jest
                .spyOn(service, "getKnockoutQuestionsAndInelgibleAnswers")
                .mockReturnValue(of(knockoutQuestionsAndInelgibleAnswers));
            const spy2 = jest.spyOn(service, "replaceCartCheck").mockReturnValueOnce(of([2, 111, 222]));
            service.knockoutQuestionsSubmit([{}] as ApplicationResponse[], false).subscribe((result) => {
                expect(result).toStrictEqual([2, 111, 222]);
                expect(spy1).toBeCalledTimes(1);
                expect(spy2).toBeCalledTimes(1);
                done();
            });
        });
        it("should add to cart if no option answered to trigger knockout dialog or not eligible dialog", (done) => {
            expect.assertions(3);
            const mockKnockDialogResponse = [{ stepId: 1, key: "12" }] as KnockoutDialogResponse[];
            producerShopComponentStoreService.setKnockoutDialogResponse(mockKnockDialogResponse);
            const knockoutQuestionsAndInelgibleAnswers = {
                knockoutQuestions: [
                    {
                        question: {
                            key: "11",
                        },
                    },
                ],
                answersIneligibleData: {
                    isIneligible: true,
                },
            } as KnockoutQuestionsAndInelgibleAnswers;
            const spy1 = jest
                .spyOn(service, "getKnockoutQuestionsAndInelgibleAnswers")
                .mockReturnValue(of(knockoutQuestionsAndInelgibleAnswers));
            const spy2 = jest.spyOn(service, "replaceCartCheck").mockReturnValueOnce(of([2, 111, 222]));
            service.knockoutQuestionsSubmit([{}] as ApplicationResponse[], false).subscribe((result) => {
                expect(result).toStrictEqual([2, 111, 222]);
                expect(spy1).toBeCalledTimes(1);
                expect(spy2).toBeCalledTimes(1);
                done();
            });
        });
        it("should trigger not eligible dialog if answered option found and open knockout dialog", (done) => {
            expect.assertions(5);
            const mockKnockDialogResponse = [{ stepId: 1, key: "11" }] as KnockoutDialogResponse[];
            producerShopComponentStoreService.setKnockoutDialogResponse(mockKnockDialogResponse);
            const knockoutQuestionsAndInelgibleAnswers = {
                knockoutQuestions: [
                    {
                        question: {
                            key: "11",
                        },
                    },
                ] as KnockoutQuestion[],
                answersIneligibleData: {
                    isIneligible: true,
                } as InEligibleAnswerData,
                selectedPlanOfferingWithCartAndEnrollment: {} as PlanOfferingWithCartAndEnrollment,
            } as KnockoutQuestionsAndInelgibleAnswers;
            const option = {
                value: "OPTION",
                knockoutText: "TEXT",
                knockoutType: KnockoutType.SPOUSE_KNOCKOUT,
            } as Option;
            const response = {
                afterClosed: () => of({ action: PlanOfferingOptions.EDIT }),
            } as MatDialogRef<any>;
            const spy1 = jest
                .spyOn(service, "getKnockoutQuestionsAndInelgibleAnswers")
                .mockReturnValue(of(knockoutQuestionsAndInelgibleAnswers));
            const spy2 = jest.spyOn(service, "getKnockoutOption").mockReturnValueOnce(option);
            const spy3 = jest.spyOn(mockDialog, "open").mockReturnValueOnce(response);
            const spy4 = jest.spyOn(service, "openKnockoutDialog").mockReturnValueOnce(of([2, 111, 222]));
            service.knockoutQuestionsSubmit([{}] as ApplicationResponse[], false).subscribe((result) => {
                expect(result).toStrictEqual([2, 111, 222]);
                expect(spy1).toBeCalledTimes(1);
                expect(spy2).toBeCalledTimes(1);
                expect(spy3).toBeCalledTimes(1);
                expect(spy4).toBeCalledTimes(1);
                done();
            });
        });
        it.skip("should trigger not eligible dialog if answered option found and setKnockoutAsInEligible", (done) => {
            // TODO: Need to refactor this test
            expect.assertions(5);
            const mockKnockDialogResponse = [{ stepId: 1, key: "11" }] as KnockoutDialogResponse[];
            producerShopComponentStoreService.setKnockoutDialogResponse(mockKnockDialogResponse);
            const knockoutQuestionsAndInelgibleAnswers = {
                knockoutQuestions: [
                    {
                        question: {
                            key: "11",
                        },
                    },
                ] as KnockoutQuestion[],
                answersIneligibleData: {
                    isIneligible: true,
                } as InEligibleAnswerData,
                selectedPlanOfferingWithCartAndEnrollment: {} as PlanOfferingWithCartAndEnrollment,
            } as KnockoutQuestionsAndInelgibleAnswers;
            const option = {
                value: "OPTION",
                knockoutText: "TEXT",
                knockoutType: KnockoutType.SPOUSE_KNOCKOUT,
            } as Option;
            const response = {
                afterClosed: () => of({ action: PlanOfferingOptions.ELIGIBILITY_CHECK, knockoutType: KnockoutType.SPOUSE_KNOCKOUT }),
            } as MatDialogRef<any>;
            const cartItem = {
                cartItemId: 2,
            } as UpdateCartItem;
            const spy1 = jest
                .spyOn(service, "getKnockoutQuestionsAndInelgibleAnswers")
                .mockReturnValue(of(knockoutQuestionsAndInelgibleAnswers));
            const spy2 = jest.spyOn(service, "getKnockoutOption").mockReturnValueOnce(option);
            const spy3 = jest.spyOn(mockDialog, "open").mockReturnValueOnce(response);
            const spy4 = jest.spyOn(service, "setKnockoutAsInEligible").mockReturnValueOnce(of(cartItem));
            service.knockoutQuestionsSubmit([{}] as ApplicationResponse[], false).subscribe((result) => {
                expect(result).toStrictEqual(cartItem);
                expect(spy1).toBeCalledTimes(1);
                expect(spy2).toBeCalledTimes(1);
                expect(spy3).toBeCalledTimes(2);
                expect(spy4).toBeCalledTimes(1);
                done();
            });
        });
    });

    describe("openKnockoutDialog()", () => {
        it("should check for replace cart if knockout questions has valid answers", (done) => {
            expect.assertions(4);
            const mockKnockDialogResponse = [{ stepId: 1 }] as KnockoutDialogResponse[];
            producerShopComponentStoreService.setKnockoutDialogResponse(mockKnockDialogResponse);
            const knockoutQuestionsAndInelgibleAnswers = {
                knockoutQuestions: [{}],
                answersIneligibleData: {
                    isIneligible: false,
                },
            } as KnockoutQuestionsAndInelgibleAnswers;
            const applicationResponses = [{ stepId: 11 }] as ApplicationResponse[];
            const spy1 = jest
                .spyOn(service, "getKnockoutQuestionsAndInelgibleAnswers")
                .mockReturnValue(of(knockoutQuestionsAndInelgibleAnswers));
            const spy2 = jest.spyOn(service, "getResponsesFromPreviousAnswers").mockReturnValueOnce(applicationResponses);
            const spy3 = jest.spyOn(service, "replaceCartCheck").mockReturnValueOnce(of([2, 111, 222]));
            service.openKnockoutDialog().subscribe((result) => {
                expect(result).toStrictEqual([2, 111, 222]);
                expect(spy1).toBeCalledTimes(1);
                expect(spy2).toBeCalledTimes(1);
                expect(spy3).toBeCalledTimes(1);
                done();
            });
        });
        it.skip("should trigger KnockoutQuestionsDialogComponent and set answers to component store", (done) => {
            // TODO: Need to refactor this test
            expect.assertions(6);
            const mockKnockDialogResponse = [{ stepId: 1, key: "11" }] as KnockoutDialogResponse[];
            producerShopComponentStoreService.setKnockoutDialogResponse(mockKnockDialogResponse);
            const knockoutQuestionsAndInelgibleAnswers = {
                knockoutQuestions: [
                    {
                        question: {
                            key: "11",
                        },
                    },
                ] as KnockoutQuestion[],
                answersIneligibleData: {
                    isIneligible: true,
                } as InEligibleAnswerData,
                selectedPlanOfferingWithCartAndEnrollment: {} as PlanOfferingWithCartAndEnrollment,
            } as KnockoutQuestionsAndInelgibleAnswers;
            const applicationResponses = [{ stepId: 11, planQuestionId: 11, value: ["yes"], key: "1" }] as ApplicationResponse[];
            const knockoutDialogResponses = [{ stepId: 11, planQuestionId: 11, value: ["yes"], key: "1" }] as KnockoutDialogResponse[];
            const dialogResponse = {
                afterClosed: () => of({ responses: applicationResponses }),
            } as MatDialogRef<any>;
            const spy1 = jest
                .spyOn(service, "getKnockoutQuestionsAndInelgibleAnswers")
                .mockReturnValue(of(knockoutQuestionsAndInelgibleAnswers));
            const spy2 = jest.spyOn(mockDialog, "open").mockReturnValueOnce(dialogResponse);
            const spy3 = jest.spyOn(producerShopComponentStoreService, "setKnockoutDialogResponse");
            const spy4 = jest.spyOn(producerShopComponentStoreService, "setAnsweredKnockoutQuestions");
            const spy5 = jest.spyOn(service, "knockoutQuestionsSubmit").mockReturnValue(of([2, 111, 222]));
            service.openKnockoutDialog().subscribe((result) => {
                expect(result).toStrictEqual([2, 111, 222]);
                expect(spy1).toBeCalledTimes(1);
                expect(spy2).toBeCalledTimes(3);
                expect(spy3).toBeCalledWith(knockoutDialogResponses);
                expect(spy4).toBeCalledWith([{ id: 11, key: "1", answer: "yes" }] as AnsweredKnockoutQuestion[]);
                expect(spy5).toBeCalledTimes(1);
                done();
            });
        });
    });

    describe("setKnockoutAsInEligible()", () => {
        it("should set plan knockout eligibility to component store", (done) => {
            expect.assertions(3);
            const planDetails = {
                planOffering: {
                    id: 555,
                },
            } as PlanOfferingWithCartAndEnrollment;
            const knockoutQuestions = [
                {
                    id: 11,
                },
            ] as KnockoutQuestion[];
            const cartObject = {
                cartItemId: 2,
            } as UpdateCartItem;
            const spy1 = jest.spyOn(service, "getCartObject").mockReturnValueOnce(of(cartObject));
            const spy2 = jest.spyOn(producerShopComponentStoreService, "setPlanKnockoutEligibility");
            service.setKnockoutAsInEligible(planDetails, knockoutQuestions, KnockoutType.SPOUSE_KNOCKOUT).subscribe((result) => {
                expect(result).toStrictEqual(cartObject);
                expect(spy1).toBeCalledTimes(1);
                expect(spy2).toBeCalledWith([
                    {
                        planOfferingId: planDetails.planOffering.id,
                        knockoutType: KnockoutType.SPOUSE_KNOCKOUT,
                        questions: knockoutQuestions,
                        cartObject: cartObject,
                    },
                ]);
                done();
            });
        });
    });
    describe("updateAutoEnrolledCartData()", () => {
        it("should return updated auto enrolled cart object", (done) => {
            expect.assertions(2);
            const planOfferingsWithCartAndEnrollment = [
                {
                    cartItemInfo: {
                        id: 2,
                        planOffering: {
                            id: 555,
                        },
                    },
                },
            ] as PlanOfferingWithCartAndEnrollment[];

            const updatedCartObject = [
                {
                    ...planOfferingsWithCartAndEnrollment[0].cartItemInfo,
                    planOfferingId: 555,
                    acknowledged: true,
                    assistingAdminId: 333,
                    enrollmentMethod: EnrollmentMethod.HEADSET,
                    cartItemId: 2,
                    subscriberQualifyingEventId: 111,
                    enrollmentState: "GA",
                },
            ] as UpdateCartItem[];
            const spy1 = jest.spyOn(service, "isAutoEnrolledUpdateNeeded").mockReturnValueOnce(true);
            service.updateAutoEnrolledCartData(planOfferingsWithCartAndEnrollment).subscribe((result) => {
                expect(result).toStrictEqual(updatedCartObject);
                expect(spy1).toBeCalledTimes(1);
                done();
            });
        });
    });
});
