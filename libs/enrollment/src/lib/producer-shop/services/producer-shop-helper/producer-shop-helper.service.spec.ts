import { MembersState } from "@empowered/ngrx-store/ngrx-states/members";
import { TestBed } from "@angular/core/testing";
import { CarrierStatus, MemberQLETypes } from "@empowered/api";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { AccountsState } from "@empowered/ngrx-store/ngrx-states/accounts";
import { ACCOUNTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.reducer";
import { EnrollmentsState } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { ENROLLMENTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/enrollments/enrollments.reducer";
import { GlobalActions } from "@empowered/ngrx-store/ngrx-states/global";
import { MEMBERS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/members/members.reducer";
import { PlanOfferingsState } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { PLAN_OFFERINGS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.reducer";
import { ProductOfferingsState } from "@empowered/ngrx-store/ngrx-states/product-offerings";
import { PRODUCT_OFFERINGS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/product-offerings/product-offerings.reducer";
import { SharedState } from "@empowered/ngrx-store/ngrx-states/shared";
import { SHARED_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/shared/shared.reducer";
import { MockStore, provideMockStore } from "@ngrx/store/testing";
import { PlanOfferingService } from "../plan-offering/plan-offering.service";
import { ProducerShopHelperService } from "./producer-shop-helper.service";
import { mockMemberContacts } from "@empowered/ngrx-store/ngrx-states/members/members.mocks";
import { ShoppingCartsState } from "@empowered/ngrx-store/ngrx-states/shopping-carts";
import { SHOPPING_CARTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/shopping-carts/shopping-carts.reducer";
import { productOfferingSetsEntityAdapter } from "@empowered/ngrx-store/ngrx-states/product-offerings/product-offerings.state";
import {
    AsyncStatus,
    PlanOfferingWithCartAndEnrollment,
    ProductId,
    ShopPageType,
    EnrollmentMethod,
    TaxStatus,
    Plan,
    PlanOffering,
    ProductOffering,
    GetCartItems,
    Enrollments,
    StatusType,
    MemberQualifyingEvent,
    PlanYear,
} from "@empowered/constants";
import { HttpClient, HttpHandler } from "@angular/common/http";
import { Store } from "@ngxs/store";
import { Router } from "@angular/router";
import { DatePipe } from "@angular/common";
import { mockStore, mockRouter, mockDatePipe } from "@empowered/testing";

const MOCK_PLAN_PANEL = {
    planOffering: { id: 1 },
    enrollment: { id: 2 },
    cartItemInfo: { id: 3 },
} as PlanOfferingWithCartAndEnrollment;

describe("ProducerShopHelperService", () => {
    let service: ProducerShopHelperService;
    let planOfferingService: PlanOfferingService;
    let ngrxStore: NGRXStore;
    let store: MockStore;

    const initialState = {
        [ACCOUNTS_FEATURE_KEY]: {
            ...AccountsState.initialState,
            selectedMPGroup: 111,
        },
        [MEMBERS_FEATURE_KEY]: {
            ...MembersState.initialState,
            selectedMemberId: 333,
            memberContactsEntities: {
                ids: ["111-333"],
                entities: {
                    "111-333": {
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
                },
            },
            qualifyingEventsEntities: {
                ids: [111 - 333],
                entities: {
                    "111-333": {
                        identifiers: {
                            mpGroup: 111,
                            memberId: 333,
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [
                                {
                                    id: 333,
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
        [PRODUCT_OFFERINGS_FEATURE_KEY]: {
            ...ProductOfferingsState.initialState,
            selectedReferenceDate: "1990-09-09",
            productOfferingSetsEntities: productOfferingSetsEntityAdapter.setOne(
                {
                    identifiers: {
                        mpGroup: 111,
                        referenceDate: "1990-09-09",
                    },
                    data: {
                        status: AsyncStatus.SUCCEEDED,
                        value: [{ id: 999, product: { id: 9999 } } as ProductOffering],
                        error: null,
                    },
                },
                { ...ProductOfferingsState.initialState.productOfferingSetsEntities },
            ),
        },
        [PLAN_OFFERINGS_FEATURE_KEY]: {
            ...PlanOfferingsState.initialState,
            selectedShopPageType: ShopPageType.SINGLE_OE_SHOP,
            selectedPlanOfferingId: 555,
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
                            value: [
                                {
                                    id: 555,
                                    productOfferingId: 999,
                                    plan: {
                                        productId: 9999,
                                        id: 5554,
                                    },
                                } as PlanOffering,
                            ],
                            error: null,
                        },
                    },
                },
            },
        },
        [SHOPPING_CARTS_FEATURE_KEY]: {
            ...ShoppingCartsState.initialState,
            selectedCartItemId: 777,
            cartItemsSetsEntities: {
                ids: ["333-111"],
                entities: {
                    "333-111": {
                        identifiers: {
                            mpGroup: 111,
                            memberId: 333,
                        },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [
                                {
                                    id: 777,
                                    planOffering: { plan: { id: 5554 } },
                                } as GetCartItems,
                            ],
                            error: null,
                        },
                    },
                },
            },
        },
        [ENROLLMENTS_FEATURE_KEY]: {
            ...EnrollmentsState.initialState,
            selectedEnrollmentId: 888,
            enrollmentsEntities: {
                ids: ["111-333"],
                entities: {
                    "111-333": {
                        identifiers: { memberId: 333, mpGroup: 111 },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: [{ id: 888, status: "ACTIVE", plan: { id: 5554, productId: 9999 } as Plan } as Enrollments],
                            error: null,
                        },
                    },
                },
            },
        },
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                NGRXStore,
                provideMockStore({
                    initialState,
                }),
                HttpClient,
                HttpHandler,
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
            ],
        });
        service = TestBed.inject(ProducerShopHelperService);
        planOfferingService = TestBed.inject(PlanOfferingService);
        ngrxStore = TestBed.inject(NGRXStore);
        store = TestBed.inject(MockStore);
    });

    describe("ProducerShopHelperService creation", () => {
        it("should create ProducerShopHelperService", () => {
            expect(service).toBeTruthy();
        });
    });

    describe("getSelectedEnrollment()", () => {
        it("should return the enrollment object", (done) => {
            expect.assertions(2);
            const spy = jest.spyOn(planOfferingService, "getPlanId").mockReturnValueOnce(1);
            service.getSelectedEnrollment({ ...MOCK_PLAN_PANEL.planOffering, plan: { id: 1 } as Plan }).subscribe((result) => {
                expect(result).toBe({ id: 1 });
            });
            expect(spy).toBeCalledWith({ ...MOCK_PLAN_PANEL.planOffering, plan: { id: 1 } });
            done();
        });
    });
    describe("setSelectedPlanDataToStore()", () => {
        it("should set Selected plan data to Store", () => {
            const spy = jest.spyOn(ngrxStore, "dispatch");
            service.setSelectedPlanDataToStore({ ...MOCK_PLAN_PANEL, planOffering: { id: 1, plan: { id: 1 } } as PlanOffering });
            expect(spy).toBeCalledWith(
                GlobalActions.setSelectedPlanPanelIdentifiers({
                    planId: 1,
                    planOfferingId: 1,
                    cartItemId: 3,
                    enrollmentId: 2,
                }),
            );
        });
    });
    describe("isOEAndEnrollmentDueToExpire()", () => {
        beforeAll(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date("2023-09-15"));
        });
        afterAll(() => {
            jest.useRealTimers();
        });
        it("should check open enrollment is ended or not", () => {
            service.isOEAndEnrollmentDueToExpire(
                {
                    validity: {
                        expiresAfter: "2024-11-11",
                        effectiveStarting: "2021-09-09",
                    },
                    taxStatus: TaxStatus.PRETAX,
                    carrierStatus: CarrierStatus.ACTIVE,
                } as Enrollments,
                true,
            );
        });
    });

    describe("inOpenEnrollment()", () => {
        it("should give true as group is in open enrollment", (done) => {
            expect.assertions(1);
            service.inOpenEnrollment().subscribe((result) => {
                expect(result).toBe(true);
                done();
            });
        });
    });

    describe("isEnrolledPlanInPlanOfferings()", () => {
        it("should give true as enrolled plan is in plan offerings", (done) => {
            expect.assertions(1);
            service
                .isEnrolledPlanInPlanOfferings({
                    enrollment: {
                        plan: {
                            id: 5554,
                        },
                    },
                } as PlanOfferingWithCartAndEnrollment)
                .subscribe((result) => {
                    expect(result).toBe(true);
                    done();
                });
        });
        it("should give false as no enrolled plan is present in plan offering", (done) => {
            expect.assertions(1);
            service.isEnrolledPlanInPlanOfferings({} as PlanOfferingWithCartAndEnrollment).subscribe((result) => {
                expect(result).toBe(false);
                done();
            });
        });
    });

    describe("isSelectedPlanPanel()", () => {
        it("should emit false there is NO PlanPanel in NGRX state", (done) => {
            expect.assertions(1);

            store.setState({
                ...initialState,
                [PLAN_OFFERINGS_FEATURE_KEY]: {
                    ...initialState[PLAN_OFFERINGS_FEATURE_KEY],
                    selectedPlanOfferingId: -1,
                },
            });

            service
                .isSelectedPlanPanel({
                    planOffering: { id: 111 },
                    enrollment: { id: 222 },
                    cartItemInfo: { id: 333 },
                } as PlanOfferingWithCartAndEnrollment)
                .subscribe((value) => {
                    expect(value).toBe(false);
                    done();
                });
        });

        it("should emit true when PlanPanel in NGRX state matches identifiers of argument", (done) => {
            expect.assertions(1);

            service
                .isSelectedPlanPanel({
                    planOffering: { id: 555 },
                    enrollment: { id: 888 },
                    cartItemInfo: { id: 777 },
                } as PlanOfferingWithCartAndEnrollment)
                .subscribe((value) => {
                    expect(value).toBe(true);
                    done();
                });
        });

        it("should emit false when PlanPanel in NGRX state matches identifiers of argument", (done) => {
            expect.assertions(1);

            service
                .isSelectedPlanPanel({
                    planOffering: { id: 111 },
                    enrollment: { id: 222 },
                    cartItemInfo: { id: 333 },
                } as PlanOfferingWithCartAndEnrollment)
                .subscribe((value) => {
                    expect(value).toBe(false);
                    done();
                });
        });
    });

    describe("isActiveQLE()", () => {
        it("should emit true, when there are QLE present", (done) => {
            expect.assertions(1);

            service.isActiveQLE().subscribe((value) => {
                expect(value).toBe(true);
                done();
            });
        });
        it("should emit false, when there are no QLE's present", (done) => {
            expect.assertions(1);

            store.setState({
                ...initialState,
                [MEMBERS_FEATURE_KEY]: {
                    ...initialState[MEMBERS_FEATURE_KEY],

                    qualifyingEventsEntities: {
                        ids: [111 - 333],
                        entities: {
                            "111-333": {
                                identifiers: {
                                    mpGroup: 111,
                                    memberId: 333,
                                },
                                data: {
                                    status: AsyncStatus.SUCCEEDED,
                                    value: [] as MemberQualifyingEvent[],
                                    error: null,
                                },
                            },
                        },
                    },
                },
            });

            service.isActiveQLE().subscribe((value) => {
                expect(value).toBe(false);
                done();
            });
        });
    });

    describe("isEligibleForReEnrollForRenewalPlan()", () => {
        const planYear = {
            coveragePeriod: {
                expiresAfter: "2024-11-11",
                effectiveStarting: "2021-09-09",
            },
        } as PlanYear;
        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date("2023-09-15"));
        });
        it("should return true as enrollments end date matches with PY end date", () => {
            expect(
                service.isEligibleForReEnrollForRenewalPlan(
                    {
                        validity: {
                            expiresAfter: "2024-11-11",
                            effectiveStarting: "2021-09-09",
                        },
                    } as Enrollments,
                    [planYear],
                ),
            ).toBe(true);
        });
        it("should return false as enrollments end date differs with PY end date", () => {
            expect(
                service.isEligibleForReEnrollForRenewalPlan(
                    {
                        validity: {
                            expiresAfter: "2024-11-01",
                            effectiveStarting: "2021-09-09",
                        },
                    } as Enrollments,
                    [planYear],
                ),
            ).toBe(false);
        });
    });
});
