import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MockStore, provideMockStore } from "@ngrx/store/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { BehaviorSubject, of } from "rxjs";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { AccountsActions, AccountsState } from "@empowered/ngrx-store/ngrx-states/accounts";
import { AccountsPartialState, ACCOUNTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.reducer";
import { MembersActions, MembersState } from "@empowered/ngrx-store/ngrx-states/members";
import { CurrencyPipe, DatePipe } from "@angular/common";
import { UserService } from "@empowered/user";
import { LanguageService } from "@empowered/language";

import { ProducerShopComponent } from "./producer-shop.component";
import { ComponentType } from "@angular/cdk/portal";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { NgxsModule } from "@ngxs/store";
import { EnrollmentsPartialState, ENROLLMENTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/enrollments/enrollments.reducer";
import { EnrollmentsState } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { MembersPartialState, MEMBERS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/members/members.reducer";
import {
    PlanOfferingsPartialState,
    PLAN_OFFERINGS_FEATURE_KEY,
} from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.reducer";
import { PlanOfferingsState } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import {
    Account,
    AsyncData,
    AsyncStatus,
    Channel,
    EnrollmentMethod,
    ShopPageType,
    RatingCode,
    PlanOffering,
    TaxStatus,
    PlanYearType,
    CoveragePeriod,
    PlanYear,
    EnrollmentPeriod,
    CombinedOfferingWithCartAndEnrollment,
    MemberProfile,
} from "@empowered/constants";
import { SharedPartialState, SHARED_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/shared/shared.reducer";
import { SharedState } from "@empowered/ngrx-store/ngrx-states/shared";
import {
    ProductOfferingsPartialState,
    PRODUCT_OFFERINGS_FEATURE_KEY,
} from "@empowered/ngrx-store/ngrx-states/product-offerings/product-offerings.reducer";
import { ProductOfferingsState } from "@empowered/ngrx-store/ngrx-states/product-offerings";
import { ShoppingCartsState } from "@empowered/ngrx-store/ngrx-states/shopping-carts";
import {
    ShoppingCartsPartialState,
    SHOPPING_CARTS_FEATURE_KEY,
} from "@empowered/ngrx-store/ngrx-states/shopping-carts/shopping-carts.reducer";
import { ProductsPartialState, PRODUCTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/products/products.reducer";
import { ProductsState } from "@empowered/ngrx-store/ngrx-states/products";
import { ProducerShopComponentStoreService } from "./services/producer-shop-component-store/producer-shop-component-store.service";
import { RiderComponentStoreService } from "./services/rider-component-store/rider-component-store.service";
import { memberContactsEntityAdapter } from "@empowered/ngrx-store/ngrx-states/members/members.state";
import { mockMemberContacts } from "@empowered/ngrx-store/ngrx-states/members/members.mocks";
import { State } from "@empowered/ngrx-store/ngrx-states/app.state";
import { DualPlanYearHelperService } from "./services/dual-plan-year-helper/dual-plan-year-helper.service";
import { EnrollmentPeriodData, ShopPeriodType } from "./services/dual-plan-year-helper/dual-plan-year-helper.model";
import { DualPlanYearService } from "@empowered/ngxs-store";
import { mockActivatedRoute, mockRouter } from "@empowered/testing";
import { ZeroStateButton, ZeroStateButtonType } from "./plans-container/plans-container.model";

@Component({
    template: "",
    selector: "empowered-new-shopping-cart",
})
class MockNewShoppingCartComponent {}

@Component({
    template: "",
    selector: "empowered-shopping-cart",
})
class MockShoppingCartComponent {}

@Component({
    template: "",
    selector: "empowered-enrollment-settings",
})
class MockEnrollmentSettingsComponent {
    @Input() backdropAnchor!: HTMLElement;
}

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () => of(undefined),
        } as MatDialogRef<any>),
} as MatDialog;

@Component({
    template: "",
    selector: "empowered-products-container",
})
class MockProductsContainerComponent {}

@Component({
    template: "",
    selector: "empowered-plans-container",
})
class MockPlansContainerComponent {}

@Component({
    template: "",
    selector: "empowered-shopping-cart-display",
})
class MockShoppingCartDisplayComponent {}

const mockRouteParams = new BehaviorSubject<Params>({});

const mockRoute = {
    params: mockRouteParams.asObservable(),
} as ActivatedRoute;

@Pipe({
    name: "[DatePipe]",
})
class MockDatePipe implements PipeTransform {
    transform(value: any): string {
        return `${value}`;
    }
}
const mockDatePipe = new MockDatePipe();

const mockUserService = {
    portal$: of("producer"),
} as UserService;

@Pipe({
    name: "[currency]",
})
class MockCurrencyPipe implements PipeTransform {
    transform(value: any): string {
        return `$${value}`;
    }
}
const mockCurrencyPipe = new MockCurrencyPipe();

const mockDualPlanYearService = {
    getReferenceDate: () => "2021-09-01",
} as DualPlanYearService;

describe("ProducerShopComponent", () => {
    let component: ProducerShopComponent;
    let fixture: ComponentFixture<ProducerShopComponent>;
    let store: MockStore<AccountsPartialState>;
    let ngrxStore: NGRXStore;
    let dualPlanYearService: DualPlanYearHelperService;
    let router: Router;
    let route: ActivatedRoute;

    const mockInitialState = {
        [ACCOUNTS_FEATURE_KEY]: {
            ...AccountsState.initialState,
            selectedMPGroup: 111,
            accountEntities: AccountsState.accountEntityAdapter.setAll(
                [
                    {
                        identifiers: { mpGroup: 111 },
                        data: {
                            status: AsyncStatus.SUCCEEDED,
                            value: {
                                ratingCode: RatingCode.PEO,
                            } as Account,
                            error: null,
                        },
                    },
                ],
                {
                    ...AccountsState.initialState.accountEntities,
                },
            ),
        },
        [MEMBERS_FEATURE_KEY]: {
            ...MembersState.initialState,
            selectedMemberId: 222,
            memberContactsEntities: memberContactsEntityAdapter.setOne(
                {
                    identifiers: {
                        mpGroup: 111,
                        memberId: 222,
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
        [PRODUCTS_FEATURE_KEY]: {
            ...ProductsState.initialState,
            selectedProductId: 5,
        },
        [PRODUCT_OFFERINGS_FEATURE_KEY]: {
            ...ProductOfferingsState.initialState,
            selectedReferenceDate: "2021-09-01",
        },
        [PLAN_OFFERINGS_FEATURE_KEY]: {
            ...PlanOfferingsState.initialState,
            selectedShopPageType: ShopPageType.SINGLE_OE_SHOP,
        },
        [SHARED_FEATURE_KEY]: {
            ...SharedState.initialState,
            selectedEnrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
            selectedCountryState: { abbreviation: "AZ", name: "Arizona" },
            selectedHeadsetState: { abbreviation: "AZ", name: "Arizona" },
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
        },
        [ENROLLMENTS_FEATURE_KEY]: {
            ...EnrollmentsState.initialState,
        },
        [SHOPPING_CARTS_FEATURE_KEY]: {
            ...ShoppingCartsState.initialState,
        },
    } as AccountsPartialState &
    MembersPartialState &
    ProductsPartialState &
    ProductOfferingsPartialState &
    PlanOfferingsPartialState &
    SharedPartialState &
    EnrollmentsPartialState &
    ShoppingCartsPartialState;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                ProducerShopComponent,
                MockNewShoppingCartComponent,
                MockEnrollmentSettingsComponent,
                MockProductsContainerComponent,
                MockPlansContainerComponent,
                MockShoppingCartDisplayComponent,
                MockShoppingCartComponent,
            ],
            providers: [
                NGRXStore,
                provideMockStore({ initialState: mockInitialState }),
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: ActivatedRoute,
                    useValue: mockRoute,
                    // useValue: mockActivatedRoute, To use this add param: params: mockRouteParams.asObservable() to mockActivatedRoute.ts
                },
                { provide: DatePipe, useValue: mockDatePipe },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: CurrencyPipe,
                    useValue: mockCurrencyPipe,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: DualPlanYearService,
                    useValue: mockDualPlanYearService,
                },
                ProducerShopComponentStoreService,
                RiderComponentStoreService,
                DualPlanYearHelperService,
            ],
            imports: [RouterTestingModule, HttpClientTestingModule, NgxsModule.forRoot()],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        store = TestBed.inject(MockStore);
        ngrxStore = TestBed.inject(NGRXStore);
        router = TestBed.inject(Router);
        route = TestBed.inject(ActivatedRoute);

        jest.spyOn(store, "dispatch").mockImplementation(() => {
            /* stub */
        });
        // Ignore trying to use cache and always dispatch action
        jest.spyOn(ngrxStore, "dispatch").mockImplementation((action) => {
            store.dispatch(action);
        });
    });

    describe("ngOnInit()", () => {
        it("should dispatch AccountsActions.setDirect false if NOT on direct shop", () => {
            const tempFixture = TestBed.createComponent(ProducerShopComponent);

            const spy = jest.spyOn(ngrxStore, "dispatch");

            jest.spyOn(router, "url", "get").mockReturnValue(Channel.PAYROLL);
            tempFixture.detectChanges();

            expect(spy).toBeCalledWith(AccountsActions.setDirect({ direct: false }));
        });

        it("should dispatch AccountsActions.setDirect true if on direct shop", () => {
            const tempFixture = TestBed.createComponent(ProducerShopComponent);

            const spy = jest.spyOn(ngrxStore, "dispatch");

            jest.spyOn(router, "url", "get").mockReturnValue(Channel.DIRECT);
            tempFixture.detectChanges();

            expect(spy).toBeCalledWith(AccountsActions.setDirect({ direct: true }));
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ProducerShopComponent);
        component = fixture.componentInstance;
        dualPlanYearService = TestBed.inject(DualPlanYearHelperService);
        fixture.detectChanges();
    });
    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("shopLabelText$", () => {
        it("should emit empty string if no ShopPageType is set", (done) => {
            expect.assertions(1);

            store.setState({
                ...mockInitialState,
                [PLAN_OFFERINGS_FEATURE_KEY]: {
                    ...mockInitialState[PLAN_OFFERINGS_FEATURE_KEY],
                    selectedShopPageType: null,
                },
            } as State);

            component.shopLabelText$.subscribe((label) => {
                expect(label).toBe("");
                done();
            });
        });

        it("should get single open enrollment shop label", (done) => {
            expect.assertions(1);

            store.setState({
                ...mockInitialState,
                [PLAN_OFFERINGS_FEATURE_KEY]: {
                    ...mockInitialState[PLAN_OFFERINGS_FEATURE_KEY],
                    selectedShopPageType: ShopPageType.SINGLE_OE_SHOP,
                },
            } as State);

            component.shopLabelText$.subscribe((label) => {
                expect(label).toBe("primary.portal.shop.dualPlanYear.openEnrollmentsShop");
                done();
            });
        });

        it("should get dual open enrollment shop label", (done) => {
            expect.assertions(1);

            store.setState({
                ...mockInitialState,
                [PLAN_OFFERINGS_FEATURE_KEY]: {
                    ...mockInitialState[PLAN_OFFERINGS_FEATURE_KEY],
                    selectedShopPageType: ShopPageType.DUAL_OE_SHOP,
                },
            } as State);

            component.shopLabelText$.subscribe((label) => {
                expect(label).toBe("primary.portal.shop.dualPlanYear.openEnrollmentsShop");
                done();
            });
        });

        it("should get single qualifying life event shop label", (done) => {
            expect.assertions(1);

            store.setState({
                ...mockInitialState,
                [PLAN_OFFERINGS_FEATURE_KEY]: {
                    ...mockInitialState[PLAN_OFFERINGS_FEATURE_KEY],
                    selectedShopPageType: ShopPageType.SINGLE_QLE_SHOP,
                },
            } as State);

            component.shopLabelText$.subscribe((label) => {
                expect(label).toBe("primary.portal.shop.dualPlanYear.lifeEventEnrollmentShop");
                done();
            });
        });

        it("should get dual qualifying life event shop label", (done) => {
            expect.assertions(1);

            store.setState({
                ...mockInitialState,
                [PLAN_OFFERINGS_FEATURE_KEY]: {
                    ...mockInitialState[PLAN_OFFERINGS_FEATURE_KEY],
                    selectedShopPageType: ShopPageType.DUAL_QLE_SHOP,
                },
            } as State);

            component.shopLabelText$.subscribe((label) => {
                expect(label).toBe("primary.portal.shop.dualPlanYear.lifeEventEnrollmentShop");
                done();
            });
        });

        it("should get continuous shop label", (done) => {
            expect.assertions(1);

            store.setState({
                ...mockInitialState,
                [PLAN_OFFERINGS_FEATURE_KEY]: {
                    ...mockInitialState[PLAN_OFFERINGS_FEATURE_KEY],
                    selectedShopPageType: ShopPageType.CONTINUOUS_SHOP,
                },
            } as State);

            component.shopLabelText$.subscribe((label) => {
                expect(label).toBe("primary.portal.shoppingCart.quoteLevelSettings.header.shop");
                done();
            });
        });

        it("should get dual current qualifying life event enrollment shop label", (done) => {
            expect.assertions(1);

            store.setState({
                ...mockInitialState,
                [PLAN_OFFERINGS_FEATURE_KEY]: {
                    ...mockInitialState[PLAN_OFFERINGS_FEATURE_KEY],
                    selectedShopPageType: ShopPageType.DUAL_CURRENT_QLE,
                },
            } as State);

            component.shopLabelText$.subscribe((label) => {
                expect(label).toBe("primary.portal.shop.dualPlanYear.lifeEventCurrentEnrollmentShop");
                done();
            });
        });

        it("should get dual future qualifying life event enrollment shop label", (done) => {
            expect.assertions(1);

            store.setState({
                ...mockInitialState,
                [PLAN_OFFERINGS_FEATURE_KEY]: {
                    ...mockInitialState[PLAN_OFFERINGS_FEATURE_KEY],
                    selectedShopPageType: ShopPageType.DUAL_FUTURE_QLE,
                },
            } as State);

            component.shopLabelText$.subscribe((label) => {
                expect(label).toBe("primary.portal.shop.dualPlanYear.lifeEventFutureEnrollmentShop");
                done();
            });
        });
    });

    describe("fetchRiskClasses()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        const expectedMPGroup = 111;
        const expectedMemberId = 222;

        it("should call fetchRiskClasses when initalized", () => {
            // Simulate component being rendered and ngOnInit gets called
            const tempFixture = TestBed.createComponent(ProducerShopComponent);
            const tempComponent = tempFixture.componentInstance;

            const spy = jest.spyOn(tempComponent, "fetchRiskClasses");

            tempFixture.detectChanges();

            expect(spy).toBeCalled();
        });

        it("should be used to fetch RiskClass[] using current Account, mpGroup, memberId", (done) => {
            expect.assertions(4);

            // Mock route params
            mockRouteParams.next({
                mpGroupId: String(expectedMPGroup),
                memberId: String(expectedMemberId),
            });

            const spy = jest.spyOn(component, "loadRiskClasses");

            component.fetchRiskClasses().subscribe(([account, mpGroup, memberId]) => {
                expect(account.ratingCode).toBe(RatingCode.PEO);
                expect(mpGroup).toBe(expectedMPGroup);
                expect(memberId).toBe(expectedMemberId);
                expect(spy).toBeCalledWith(expectedMPGroup, expectedMemberId, RatingCode.PEO);
                done();
            });
        });

        it("should do nothing if no RatingCode is provided", () => {
            const spy = jest.spyOn(store, "dispatch");

            component.loadRiskClasses(expectedMPGroup, expectedMemberId);

            expect(spy).not.toBeCalledWith(AccountsActions.loadRiskClasses({ mpGroup: expectedMPGroup }));
            expect(spy).not.toBeCalledWith(MembersActions.loadRiskClasses({ memberId: expectedMemberId, mpGroup: expectedMPGroup }));
            expect(spy).not.toBeCalledWith(AccountsActions.loadDualPeoRiskClassIdsSet({ mpGroup: expectedMPGroup }));
        });

        it("should dispatch AccountsActions.loadRiskClasses if RatingCode is STANDARD", () => {
            const spy = jest.spyOn(store, "dispatch");

            component.loadRiskClasses(expectedMPGroup, expectedMemberId, RatingCode.STANDARD);

            expect(spy).toBeCalledWith(AccountsActions.loadRiskClasses({ mpGroup: expectedMPGroup }));
        });

        it("should dispatch AccountsActions.loadRiskClasses if RatingCode is PEO", () => {
            const spy = jest.spyOn(store, "dispatch");

            component.loadRiskClasses(expectedMPGroup, expectedMemberId, RatingCode.PEO);

            expect(spy).toBeCalledWith(MembersActions.loadRiskClasses({ mpGroup: expectedMPGroup, memberId: expectedMemberId }));
        });

        it("should dispatch AccountsActions.loadRiskClasses if RatingCode is DUAL", () => {
            const spy = jest.spyOn(store, "dispatch");

            component.loadRiskClasses(expectedMPGroup, expectedMemberId, RatingCode.DUAL);

            expect(spy).toBeCalledWith(AccountsActions.loadDualPeoRiskClassIdsSet({ mpGroup: expectedMPGroup }));
        });
    });
    describe("getSinglePlanYearShopPageType()", () => {
        it("should be Continuous Shop without having QLE and plan years", () => {
            const continuousEnrollmentPeriodData = {
                planYearsData: [],
                qleEventData: [],
            } as EnrollmentPeriodData;
            const spy = jest.spyOn(dualPlanYearService, "getStandardShopPeriod");
            component.getSinglePlanYearShopPageType(continuousEnrollmentPeriodData);
            expect(spy).toHaveBeenCalledWith(continuousEnrollmentPeriodData.qleEventData, continuousEnrollmentPeriodData.planYearsData);
            expect(component.getSinglePlanYearShopPageType(continuousEnrollmentPeriodData)).toBe(ShopPageType.CONTINUOUS_SHOP);
        });

        it("should be Single OE Shop with plan year with past date", () => {
            const enrollmentPeriodWithPlanYear = {
                planYearsData: [
                    {
                        enrollmentPeriod: {
                            effectiveStarting: "2021-01-01",
                        },
                    },
                ],
                qleEventData: [],
            } as EnrollmentPeriodData;
            const spy = jest.spyOn(dualPlanYearService, "getStandardShopPeriod");
            component.getSinglePlanYearShopPageType(enrollmentPeriodWithPlanYear);
            expect(spy).toHaveBeenCalledWith(enrollmentPeriodWithPlanYear.qleEventData, enrollmentPeriodWithPlanYear.planYearsData);
            expect(component.getSinglePlanYearShopPageType(enrollmentPeriodWithPlanYear)).toBe(ShopPageType.SINGLE_OE_SHOP);
        });

        it("should be Single QLE Shop with QLE having past effectiveStarting date", () => {
            const enrollmentPeriodWithQLE = {
                planYearsData: [],
                qleEventData: [
                    {
                        enrollmentValidity: {
                            effectiveStarting: "2022-02-01",
                            expiresAfter: "2022-06-01",
                        },
                    },
                ],
            } as EnrollmentPeriodData;
            const spy = jest.spyOn(dualPlanYearService, "getStandardShopPeriod").mockImplementation(() => ShopPeriodType.QLE_SHOP);
            component.getSinglePlanYearShopPageType(enrollmentPeriodWithQLE);
            expect(spy).toHaveBeenCalledWith(enrollmentPeriodWithQLE.qleEventData, enrollmentPeriodWithQLE.planYearsData);
            expect(component.getSinglePlanYearShopPageType(enrollmentPeriodWithQLE)).toBe(ShopPageType.SINGLE_QLE_SHOP);
        });
    });

    describe("getDualPlanYearShopPageType()", () => {
        it("should be DUAL QLE", () => {
            const enrollmentPeriodWithDualQLE = {
                isQleDuringOeEnrollment: true,
                selectedShop: ShopPeriodType.QLE_SHOP,
            } as EnrollmentPeriodData;
            expect(component.getDualPlanYearShopPageType(enrollmentPeriodWithDualQLE)).toBe(ShopPageType.DUAL_QLE_SHOP);
        });

        it("should be DUAL OE SHOP", () => {
            const enrollmentPeriodWithDualOE = {
                isQleDuringOeEnrollment: true,
                selectedShop: ShopPeriodType.OE_SHOP,
            } as EnrollmentPeriodData;
            expect(component.getDualPlanYearShopPageType(enrollmentPeriodWithDualOE)).toBe(ShopPageType.DUAL_OE_SHOP);
        });

        it("should be DUAL future QLE", () => {
            const enrollmentPeriodWithOE = {
                isQleDuringOeEnrollment: false,
                selectedShop: ShopPeriodType.OE_SHOP,
            } as EnrollmentPeriodData;
            expect(component.getDualPlanYearShopPageType(enrollmentPeriodWithOE)).toBe(ShopPageType.DUAL_FUTURE_QLE);
        });

        it("should be DUAL current QLE", () => {
            const enrollmentPeriodWithCurrentQLE = {
                isQleDuringOeEnrollment: false,
                selectedShop: ShopPeriodType.QLE_SHOP,
            } as EnrollmentPeriodData;
            expect(component.getDualPlanYearShopPageType(enrollmentPeriodWithCurrentQLE)).toBe(ShopPageType.DUAL_CURRENT_QLE);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy = jest.spyOn(component["unsubscriber$"], "next");
            const spy2 = jest.spyOn(component["unsubscriber$"], "complete");

            fixture.destroy();

            expect(spy).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });

    describe("isPlanOfferingsExistAsync()", () => {
        it("should return true if PlanOfferings array exits from AsyncData.", () => {
            const planOfferingMockData = [
                {
                    id: 1111,
                },
            ] as PlanOffering[];

            const mockAsyncData: AsyncData<PlanOffering[]> = {
                status: AsyncStatus.SUCCEEDED,
                value: planOfferingMockData,
                error: null,
            };

            expect(component.isPlanOfferingsExistAsync(mockAsyncData)).toBe(true);
        });

        it("should return false if AsyncData has failed", () => {
            const mockAsyncData: AsyncData<PlanOffering[]> = {
                status: AsyncStatus.FAILED,
                value: null,
                error: null,
            };

            expect(component.isPlanOfferingsExistAsync(mockAsyncData)).toBe(false);
        });
    });

    describe("navigateToQle()", () => {
        it("should navigate to qle", (done) => {
            const portal = "producer";
            const mpGroup = 12345;
            const memberId = 10;
            const navigateSpy = jest.spyOn(router, "navigate");
            component.navigateToQle(portal, mpGroup, memberId).catch(() => {
                expect(navigateSpy).toBeCalledWith(["/" + portal + "/payroll/" + mpGroup + "/member/" + memberId + "/qle/life-events"]);
                done();
            });
        });
    });

    describe("navigateToBO()", () => {
        it("should navigate to BO", (done) => {
            const portal = "producer";
            const mpGroup = 12345;
            const navigateSpy = jest.spyOn(router, "navigate");
            component.navigateToBO(portal, mpGroup).catch(() => {
                expect(navigateSpy).toBeCalledWith(["/" + portal + "/payroll/" + mpGroup + "/dashboard/benefits/offering"]);
                done();
            });
        });
    });

    describe("navigateToEmployeeOrCustomer()", () => {
        it("should navigate to Direct", (done) => {
            const portal = "employees";
            const mpGroup = 12345;
            const isDirectFlow = true;
            const navigateSpy = jest.spyOn(router, "navigate");
            component.navigateToEmployeeOrCustomer(portal, mpGroup, isDirectFlow).catch(() => {
                expect(navigateSpy).toBeCalledWith(["/" + portal + "/direct/customers/" + mpGroup], {
                    relativeTo: route,
                    queryParamsHandling: "preserve",
                });
                done();
            });
        });

        it("should navigate to prospect - employee", (done) => {
            const portal = "employees";
            const mpGroup = 12345;
            const isDirectFlow = false;
            const url = "/" + portal + "/payroll/prospect/";

            jest.spyOn(router, "url", "get").mockReturnValue(url);

            const navigateSpy = jest.spyOn(router, "navigate");

            component.navigateToEmployeeOrCustomer(portal, mpGroup, isDirectFlow).catch(() => {
                expect(navigateSpy).toBeCalledWith(["/" + portal + "/payroll/prospect/" + mpGroup + "/employees"], {
                    relativeTo: route,
                });
                done();
            });
        });

        it("should navigate to employee", (done) => {
            const portal = "employees";
            const mpGroup = 12345;
            const isDirectFlow = false;
            const url = "/" + portal + "/payroll/";

            jest.spyOn(router, "url", "get").mockReturnValue(url);

            const navigateSpy = jest.spyOn(router, "navigate");

            component.navigateToEmployeeOrCustomer(portal, mpGroup, isDirectFlow).catch(() => {
                expect(navigateSpy).toBeCalledWith(["/" + portal + "/payroll/" + mpGroup + "/dashboard/employees"], {
                    relativeTo: route,
                });
                done();
            });
        });
    });

    describe("getZeroStateButton()", () => {
        it("should return ZeroStateButton", () => {
            const spy = jest.spyOn(component, "getZeroStateButton");
            component.getZeroStateButton(
                null,
                AsyncStatus.SUCCEEDED,
                "Open Enrollment: Shop",
                ZeroStateButtonType.EMPLOYEE,
                "Return to employee listing",
            );
            expect(spy).toReturnWith<ZeroStateButton>({
                errorMessage: null,
                planOfferingAsyncStatus: AsyncStatus.SUCCEEDED,
                shopLabelText: "Open Enrollment: Shop",
                buttonType: ZeroStateButtonType.EMPLOYEE,
                buttonText: "Return to employee listing",
            });
        });
    });

    describe("getZeroStateErrorMessage", () => {
        it("should return empty string if planOfferingsData.status is not failed or succeeded", () => {
            const mockPlanOffering = {
                status: AsyncStatus.LOADING,
                error: null,
                value: [] as PlanOffering[],
            } as AsyncData<PlanOffering[]>;
            const mockPlanYears = [
                {
                    type: PlanYearType.AFLAC_INDIVIDUAL,
                    name: "test plan year",
                    coveragePeriod: { effectiveStarting: "test" } as CoveragePeriod,
                    enrollmentPeriod: { effectiveStarting: "test" } as EnrollmentPeriod,
                },
            ] as PlanYear[];
            const mockIsDirectFlow = true;

            const spy = jest.spyOn(component, "getZeroStateErrorMessage");
            component.getZeroStateErrorMessage(mockPlanOffering, mockPlanYears, mockIsDirectFlow);
            expect(spy).toReturnWith("");
        });
        it("should return productsNotAvailable string if value array is empty", () => {
            const mockPlanOffering = {
                status: AsyncStatus.SUCCEEDED,
                error: null,
                value: [] as PlanOffering[],
            } as AsyncData<PlanOffering[]>;
            const mockPlanYears = [
                {
                    type: PlanYearType.AFLAC_INDIVIDUAL,
                    name: "test plan year",
                    coveragePeriod: { effectiveStarting: "test" } as CoveragePeriod,
                    enrollmentPeriod: { effectiveStarting: "test" } as EnrollmentPeriod,
                },
            ] as PlanYear[];
            const mockIsDirectFlow = true;

            const spy = jest.spyOn(component, "getZeroStateErrorMessage");
            component.getZeroStateErrorMessage(mockPlanOffering, mockPlanYears, mockIsDirectFlow);
            expect(spy).toReturnWith("primary.portal.shopQuote.specificPayroll.productsNotAvailable");
        });
        it("should return empty string if value array is not empty", () => {
            const mockPlanOffering = {
                status: AsyncStatus.SUCCEEDED,
                error: null,
                value: [
                    {
                        id: 1,
                        plan: {
                            id: 1,
                            name: "test plan",
                            adminName: "test plan",
                            carrierId: 1,
                            missingEmployerFlyer: false,
                            displayOrder: 1,
                            description: "test plan",
                        },
                        taxStatus: TaxStatus.PRETAX,
                        agentAssistanceRequired: false,
                    },
                ] as PlanOffering[],
            } as AsyncData<PlanOffering[]>;
            const mockPlanYears = [
                {
                    type: PlanYearType.AFLAC_INDIVIDUAL,
                    name: "test plan year",
                    coveragePeriod: { effectiveStarting: "test" } as CoveragePeriod,
                    enrollmentPeriod: { effectiveStarting: "test" } as EnrollmentPeriod,
                },
            ] as PlanYear[];
            const mockIsDirectFlow = true;

            const spy = jest.spyOn(component, "getZeroStateErrorMessage");
            component.getZeroStateErrorMessage(mockPlanOffering, mockPlanYears, mockIsDirectFlow);
            expect(spy).toReturnWith("");
        });
    });

    describe("checkAndDisplayAutoEnrolledPlanOfferings()", () => {
        it("should call getAutoEnrolledPlanOfferings()", () => {
            const spy = jest.spyOn(component, "getAutoEnrolledPlanOfferings");
            component.checkAndDisplayAutoEnrolledPlanOfferings([] as CombinedOfferingWithCartAndEnrollment[], {} as MemberProfile);
            expect(spy).toBeCalled();
        });
    });
});
