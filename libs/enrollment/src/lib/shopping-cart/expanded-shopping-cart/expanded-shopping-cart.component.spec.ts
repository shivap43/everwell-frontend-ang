import { ComponentType } from "@angular/cdk/portal";
import { AsyncPipe, CurrencyPipe, DatePipe, TitleCasePipe } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, Component, Directive, Input, Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { RouterTestingModule } from "@angular/router/testing";
import {
    AccountService,
    BenefitsOfferingService,
    CommonService,
    CoreService,
    DependentContact,
    EnrollmentService,
    GetShoppingCart,
    MemberService,
    PayFrequencyObject,
    ShoppingCartDisplayService,
    ShoppingService,
    StaticService,
    SystemFlowCode,
} from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { ACCOUNTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.reducer";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { MEMBERS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/members/members.reducer";
import { ShoppingCartsActions } from "@empowered/ngrx-store/ngrx-states/shopping-carts";
import { SHOPPING_CARTS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/shopping-carts/shopping-carts.reducer";
import * as ShoppingCartsState from "@empowered/ngrx-store/ngrx-states/shopping-carts/shopping-carts.state";
import * as AccountsState from "@empowered/ngrx-store/ngrx-states/accounts/accounts.state";
import * as MembersState from "@empowered/ngrx-store/ngrx-states/members/members.state";
import { UserService, UserState } from "@empowered/user";
import { provideMockStore } from "@ngrx/store/testing";
import { NgxsModule } from "@ngxs/store";
import { Observable, of } from "rxjs";

import {
    CloseOverlay,
    ShopCartService,
    EnrollmentState,
    SetProductOfferingsOfId,
    SetProductPlanOfferings,
    QuoteShopHelperService,
    DualPlanYearState,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { CONTAINER_DATA } from "../injector";
import { ExpandedShoppingCartComponent } from "./expanded-shopping-cart.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { Store } from "@ngxs/store";
import { GlobalActions } from "@empowered/ngrx-store/ngrx-states/global";
import {
    AsyncStatus,
    AppSettings,
    EditPlan,
    AddCartItem,
    MemberProfile,
    MemberDependent,
    PlanOfferingPanel,
    ProductOfferingPanel,
    EnrollmentMethod,
    Gender,
    MemberContact,
} from "@empowered/constants";
import { PayrollFrequencyCalculatorPipe } from "@empowered/ui";
import { SharedService } from "@empowered/common-services";
import { mockDatePipe } from "@empowered/testing";
import { HttpResponse } from "@angular/common/http";

// Mock the imports for the Components used with MatDialog
// Stubbing these components this way is required since these Components are not declared by any related Module
// Since they are not declared by a Module related to this test, TestBed cannot stub them
jest.mock("../employee-required-info/employee-required-info.component");
jest.mock("../create-shopping-cart-quote/create-shopping-cart-quote.component");

const EXPECTED_MP_GROUP = 111;
const EXPECTED_MEMBER_ID = 222;
const EXPECTED_CART_ITEM_ID = 333;
const EXPECTED_PLAN_OFFERING_ID = 888;
const EXPECTED_PRODUCT_OFFERING_ID = 999;
const EXPECTED_PLAN_ID = 555;
const EXPECTED_PRODUCT_ID = 12;

const MOCK_PLAN_OFFERING = { id: EXPECTED_PLAN_OFFERING_ID, cartItem: { id: EXPECTED_CART_ITEM_ID } } as PlanOfferingPanel;

const MOCK_PRODUCT_OFFERING = {
    id: EXPECTED_PRODUCT_OFFERING_ID,
    planOfferings: [MOCK_PLAN_OFFERING],
} as ProductOfferingPanel;

const MOCK_PRODUCT_OFFERINGS: ProductOfferingPanel[] = [MOCK_PRODUCT_OFFERING];

@Directive({
    selector: "[hasPermission]",
})
class MockHasPermissionDirective {
    @Input("hasPermission") permission: string;
}

@Pipe({
    name: "replaceTag",
})
class MockReplaceTagPipe implements PipeTransform {
    transform(value: any, mapObj: any): string {
        return "replaced";
    }
}

@Pipe({
    name: "coverageName",
})
class MockCoverageNamePipe implements PipeTransform {
    transform(value: string): string {
        return "coverage name";
    }
}
@Pipe({
    name: "payrollFrequencyCalculator",
})
class MockPayrollFrequencyCalculatorPipe implements PipeTransform {
    transform(value: number, pfObject?: PayFrequencyObject): number {
        return 1;
    }
}

const mockPayrollFrequencyCalculatorPipe = new MockPayrollFrequencyCalculatorPipe();

@Component({
    template: "",
    selector: "empowered-mon-spinner",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner: boolean;
}
@Component({
    template: "",
    selector: "mon-icon",
})
class MockMonIconComponent {
    @Input() iconSize: number;
}

const mockShoppingCartDisplayService = {
    getAppliedFlexDollarOrIncentivesForCart: (memberId: number, mpGroup: string, cartItemId?: number) => of(null),
    setShoppingCart: (shoppingCart: GetShoppingCart) => {},
} as ShoppingCartDisplayService;

const mockAccountService = {
    getGroupAttributesByName: (groupAttributeNames: string[], mpGroup?: number) => of([]),
    getAccountProducers: (mpGroup?: string) => of([]),
    getAccount: (mpGroup?: string) => of(null),
    getPayFrequencies: (mpGroup?: string) => of([]),
} as AccountService;

const mockCoreService = {
    getCoverageLevel: (coverageLevelId: string) => of(null),
} as CoreService;

const mockShoppingService = {
    getShoppingCart: (memberId: number, mpGroup: number, planYearId?: number[]) => of(null),
    getCartItems: (memberId: number, mpGroup: number, expand?: string, planYearId?: number[]) => of([]),
    getProductOffering: (productOfferingId: number, mpGroup?: number) => of({}),
    getPlanOffering: (planOfferingId: string, mpGroup?: number, expand?: string) => of({}),
    deleteCartItem: (memberId: number, itemId: number, mpGroup: number) => of({}),
    getPlanOfferingRiders: (planOfferingId: string) => of([]),
    getPlanOfferingPricing: (planOfferingId: string) => of([]),
    getProductOfferings: (mpGroup?: number) => of([]),
    updateCartItem: (memberId: number, mpGroup: number, id: number, cart: AddCartItem) => of({}),
} as ShoppingService;

const mockMemberService = {
    getMemberIdentifierTypes: () => of([]),
    getMemberIdentifier: (memberId: MemberDependent["id"], memberIdentifierId: number, masked: boolean, mpGroup: number) => of([]),
    getMemberContact: (memberId: MemberProfile["id"], contactType: string, mpGroup: string) => of({}),
    getMember: (memberId: MemberProfile["id"], fullProfile: boolean = false, mpGroup?: string) => of({}),
    getMemberDependents: (memberId: MemberDependent["id"], fullProfile: boolean = true, mpGroup?: number) => of([]),
    verifyMemberIdentity: (memberId: number, aflacEicPrefs: string, userPrefs: string, systemFlowCode: string, mpGroup?: string) =>
        of(null),
    getMemberConsent: (memberId: number, mpGroup?: number) => of(null),
    getDependentContact: (memberId: number, dependentId: string, mpGroup: number) => of({}),
    saveDependentContact: (contact: DependentContact, memberId: MemberProfile["id"], dependentId: string, mpGroup: number) => of({}),
} as MemberService;

const mockBenefitsOfferingService = {
    getPlanYears: (mpGroup: number, useUnapproved: boolean, inOpenEnrollment?: boolean) => of([]),
    getApprovalRequests: (mpGroup: number, includeNotSubmitted: boolean = false) => of([]),
} as BenefitsOfferingService;

const mockShopCartService = {
    changeHighlightedOverlay: (isOverlay: CloseOverlay) => {},
    changeEditPlan: (editPlan: EditPlan) => {},
    closeExpandedOverlayCart: (isExpanded: any) => {},
} as ShopCartService;

const mockUserService = {
    credential$: of({
        memberId: EXPECTED_MEMBER_ID,
        groupId: 444,
    }),
} as UserService;

const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () => of({ type: "Remove" }),
        } as MatDialogRef<any>),
} as MatDialog;

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
} as LanguageService;

const mockEnrollmentService = {
    getEnrollments: (memberId: number, mpGroup: number, expand?: string) => of([]),
} as EnrollmentService;

const mockStaticUtilService = {
    cacheConfigEnabled: (configName: string) => of(true),
    cacheConfigValue: (configName: string) => of("some-config-value"),
    hasPermission: (permission: string) => of(true),
} as StaticUtilService;

const mockStaticService = {
    getConfigurations: (names: string, mpGroup?: number, partnerId?: string) => of([]),
} as StaticService;

const mockSharedService = {
    checkPayrollMethodAndIdv: (
        enrollmentMethod: string,
        isPayrollHeadsetIDV: boolean,
        isPayrollCallCenterIDV: boolean,
        isPayrollVirtualF2FIDV: boolean,
    ) => true,
    checkAgentSelfEnrolled: () => of(true),
    isSSNRequiredForPartialCensus: (mpGroup: number): Observable<boolean> => of(true),
    isEmployerNameFieldEnabled: (mpGroup: number) => of([true, false]),
} as SharedService;

const mockCommonService = {
    getLanguages: (tagName: string) => of([]),
} as CommonService;

@Directive({
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}

describe("ExpandedShoppingCartComponent", () => {
    let component: ExpandedShoppingCartComponent;
    let fixture: ComponentFixture<ExpandedShoppingCartComponent>;
    let ngrxStore: NGRXStore;
    let store: Store;
    let shopCartService: ShopCartService;
    let shoppingService: ShoppingService;
    let quoteShopHelperService: QuoteShopHelperService;
    let staticUtilService: StaticUtilService;
    let memberService: MemberService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                ExpandedShoppingCartComponent,
                MockMonSpinnerComponent,
                MockMonIconComponent,
                MockHasPermissionDirective,
                MockReplaceTagPipe,
                MockCoverageNamePipe,
                MockPayrollFrequencyCalculatorPipe,
                MockRichTooltipDirective,
            ],
            imports: [
                NgxsModule.forRoot([EnrollmentState, UserState, DualPlanYearState]),
                ReactiveFormsModule,
                RouterTestingModule,
                HttpClientTestingModule,
            ],
            providers: [
                NGRXStore,
                provideMockStore({
                    initialState: {
                        [ACCOUNTS_FEATURE_KEY]: {
                            ...AccountsState.initialState,
                            selectedMPGroup: EXPECTED_MP_GROUP,
                        },
                        [MEMBERS_FEATURE_KEY]: {
                            ...MembersState.initialState,
                            selectedMemberId: EXPECTED_MEMBER_ID,
                        },
                        [SHOPPING_CARTS_FEATURE_KEY]: {
                            ...ShoppingCartsState.initialState,
                            selectedCartItemId: EXPECTED_CART_ITEM_ID,
                            deleteCartItemEntities: ShoppingCartsState.deleteCartItemEntityAdapter.setOne(
                                {
                                    identifiers: {
                                        memberId: EXPECTED_MEMBER_ID,
                                        mpGroup: EXPECTED_MP_GROUP,
                                    },
                                    data: {
                                        status: AsyncStatus.SUCCEEDED,
                                        value: null,
                                        error: null,
                                    },
                                },
                                {
                                    ...ShoppingCartsState.initialState.deleteCartItemEntities,
                                },
                            ),
                        },
                    },
                }),
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                {
                    provide: PayrollFrequencyCalculatorPipe,
                    useValue: mockPayrollFrequencyCalculatorPipe,
                },
                {
                    provide: ShoppingCartDisplayService,
                    useValue: mockShoppingCartDisplayService,
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
                {
                    provide: CoreService,
                    useValue: mockCoreService,
                },
                {
                    provide: ShoppingService,
                    useValue: mockShoppingService,
                },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: CONTAINER_DATA,
                    useValue: {
                        activatedRoute: {
                            snapshot: {
                                params: {
                                    id: String(EXPECTED_MEMBER_ID), // memberId
                                },
                            },
                        },
                        mpGroup: EXPECTED_MP_GROUP,
                    },
                },
                {
                    provide: BenefitsOfferingService,
                    useValue: mockBenefitsOfferingService,
                },
                {
                    provide: ShopCartService,
                    useValue: mockShopCartService,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                UtilService,
                {
                    provide: EnrollmentService,
                    useValue: mockEnrollmentService,
                },
                // EmpoweredModalService,
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: StaticService,
                    useValue: mockStaticService,
                },
                {
                    provide: SharedService,
                    useValue: mockSharedService,
                },
                {
                    provide: CommonService,
                    useValue: mockCommonService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        ngrxStore = TestBed.inject(NGRXStore);
        shopCartService = TestBed.inject(ShopCartService);
        shoppingService = TestBed.inject(ShoppingService);
        quoteShopHelperService = TestBed.inject(QuoteShopHelperService);
        staticUtilService = TestBed.inject(StaticUtilService);
        store = TestBed.inject(Store);
        memberService = TestBed.inject(MemberService);

        // Mock NGXS state
        store.reset({
            ...store.snapshot(),
            enrollment: {
                // EnrollmentState.GetProductOfferings
                productOfferings: MOCK_PRODUCT_OFFERINGS,
                // EnrollmentState.GetProductPlanData
                productPlanData: MOCK_PRODUCT_OFFERINGS,
            },
        });
    });

    describe("ngOnInit()", () => {
        it("should call shoppingCartDisplay method on load once", () => {
            // Create a fresh component so it runs the inside functions
            fixture = TestBed.createComponent(ExpandedShoppingCartComponent);
            component = fixture.componentInstance;
            const spy1 = jest.spyOn(component, "shoppingCartDisplay");
            fixture.detectChanges();
            expect(spy1).toBeCalledTimes(1);
        });
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ExpandedShoppingCartComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe("editPlan()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        describe("when user is Member", () => {
            beforeEach(() => {
                component.isMember = true;
            });

            it("should use shopCartService.changeEditPlan", () => {
                const spy = jest.spyOn(shopCartService, "changeEditPlan");

                component.editPlan({
                    id: EXPECTED_CART_ITEM_ID,
                    productOfferingId: EXPECTED_PRODUCT_OFFERING_ID,
                    planOfferingId: EXPECTED_PLAN_OFFERING_ID,
                });
                expect(spy).toBeCalledWith({
                    editProductId: EXPECTED_PRODUCT_OFFERING_ID,
                    editPlanId: EXPECTED_PLAN_OFFERING_ID,
                    cartItemId: EXPECTED_CART_ITEM_ID,
                    isCloseOverlay: true,
                });
            });
        });

        describe("when user is not Member (Producer)", () => {
            beforeEach(() => {
                component.isMember = false;
                jest.clearAllMocks();
            });

            it("should not be member", () => {
                expect(component.isMember).toBe(false);
            });

            it("should dispatch ngrx action for saving cart, plan and product id's", () => {
                const spy1 = jest.spyOn(ngrxStore, "dispatch");

                component.editPlan({
                    id: EXPECTED_CART_ITEM_ID,
                    productOfferingId: EXPECTED_PRODUCT_OFFERING_ID,
                    planOfferingId: EXPECTED_PLAN_OFFERING_ID,
                    planId: EXPECTED_PLAN_ID,
                    productId: EXPECTED_PRODUCT_ID,
                });

                // Expect dispatch action of ShoppingCartsActions.setSelectedCartItemId
                expect(spy1).toBeCalledWith(
                    GlobalActions.setSelectedCartItemIdentifiers({
                        cartItemId: EXPECTED_CART_ITEM_ID,
                        planOfferingId: EXPECTED_PLAN_OFFERING_ID,
                        planId: EXPECTED_PLAN_ID,
                        productId: EXPECTED_PRODUCT_ID,
                    }),
                );
            });
        });

        it("should close overlay", () => {
            const spy1 = jest.spyOn(shopCartService, "closeExpandedOverlayCart");
            const spy2 = jest.spyOn(shopCartService, "changeHighlightedOverlay");

            component.editPlan({
                id: EXPECTED_CART_ITEM_ID,
                productOfferingId: EXPECTED_PRODUCT_OFFERING_ID,
                planOfferingId: EXPECTED_PLAN_OFFERING_ID,
                planId: EXPECTED_PLAN_ID,
            });

            expect(spy1).toBeCalledWith({
                isCloseOverlay: true,
            });
            expect(spy2).toBeCalledWith({
                isCartOpen: false,
            });
        });
    });

    describe("editPlanAsProducer", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        describe("handling old producer shop", () => {
            it("should update old producer shop state through QuoteShopHelperService using NGXS", () => {
                const spy1 = jest.spyOn(quoteShopHelperService, "changeSelectedProductOfferingIndex");
                const spy2 = jest.spyOn(quoteShopHelperService, "changeSelectedPlanIndex");

                component.editPlanAsProducer({
                    id: EXPECTED_CART_ITEM_ID,
                    productOfferingId: EXPECTED_PRODUCT_OFFERING_ID,
                    planOfferingId: EXPECTED_PLAN_OFFERING_ID,
                    planId: EXPECTED_PLAN_ID,
                });

                expect(spy1).toBeCalledWith(0);
                expect(spy2).toBeCalledWith(0);
            });
        });

        describe("handling new producer shop", () => {
            beforeEach(() => {
                // Mock NGXS state to have empty productOfferings and productPlanData
                store.reset({
                    ...store.snapshot(),
                    enrollment: {
                        // EnrollmentState.GetProductOfferings
                        productOfferings: [],
                        // EnrollmentState.GetProductPlanData
                        productPlanData: [],
                    },
                });
            });

            it("should NOT update old producer shop state through QuoteShopHelperService using NGXS", () => {
                const spy1 = jest.spyOn(quoteShopHelperService, "changeSelectedProductOfferingIndex");
                const spy2 = jest.spyOn(quoteShopHelperService, "changeSelectedPlanIndex");

                component.editPlanAsProducer({
                    id: EXPECTED_CART_ITEM_ID,
                    productOfferingId: EXPECTED_PRODUCT_OFFERING_ID,
                    planOfferingId: EXPECTED_PLAN_OFFERING_ID,
                    planId: EXPECTED_PLAN_ID,
                });

                expect(spy1).not.toBeCalled();
                expect(spy2).not.toBeCalled();
            });

            it("should update NGRX state", () => {
                const spy = jest.spyOn(component, "setSelectedCartDataToNgrxStore");

                component.editPlanAsProducer({
                    id: EXPECTED_CART_ITEM_ID,
                    productOfferingId: EXPECTED_PRODUCT_OFFERING_ID,
                    planOfferingId: EXPECTED_PLAN_OFFERING_ID,
                    planId: EXPECTED_PLAN_ID,
                });

                expect(spy).toBeCalledWith({
                    id: EXPECTED_CART_ITEM_ID,
                    productOfferingId: EXPECTED_PRODUCT_OFFERING_ID,
                    planOfferingId: EXPECTED_PLAN_OFFERING_ID,
                    planId: EXPECTED_PLAN_ID,
                });
            });
        });
    });

    describe("removePlan()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        describe("when portal is PRODUCER", () => {
            beforeEach(() => {
                component.portal = "PRODUCER";
            });

            it("should use PRODUCER for portal", () => {
                expect(component.portal).toBe("PRODUCER");
                expect(AppSettings.PORTAL_PRODUCER).toBe("PRODUCER");
            });

            it("should NOT use ShoppingService.deleteCartItem", () => {
                const spy = jest.spyOn(shoppingService, "deleteCartItem");

                expect(component.portal).toBe("PRODUCER");

                component.removePlan(EXPECTED_CART_ITEM_ID, "777", EXPECTED_PLAN_OFFERING_ID, EXPECTED_PRODUCT_OFFERING_ID);

                expect(spy).not.toBeCalled();
            });

            it("should dispatch ngrx action of ShoppingCartsActions.deleteCartItem before handling closed event with PRODUCER portal", () => {
                const spy1 = jest.spyOn(ngrxStore, "dispatch");
                const spy2 = jest.spyOn(component, "updateProducerShoppingCart");

                component.removePlan(EXPECTED_CART_ITEM_ID, "777", EXPECTED_PLAN_OFFERING_ID, EXPECTED_PRODUCT_OFFERING_ID);

                // Expect dispatch action of ShoppingCartsActions.deleteCartItem
                expect(spy1).toBeCalledWith(
                    ShoppingCartsActions.deleteCartItem({
                        memberId: EXPECTED_MEMBER_ID,
                        mpGroup: EXPECTED_MP_GROUP,
                        cartItemId: EXPECTED_CART_ITEM_ID,
                    }),
                );

                const spy1Order = spy1.mock.invocationCallOrder[0];
                const spy2Order = spy2.mock.invocationCallOrder[0];

                // expect updateProducerShoppingCart function to be called once
                expect(spy2).toBeCalledTimes(1);
                // expect dispatch action of ShoppingCartsActions.deleteCartItem to be called before updateProducerShoppingCart
                expect(spy1Order).toBeLessThan(spy2Order);
            });
        });

        describe("portal is NOT PRODUCER", () => {
            beforeEach(() => {
                component.portal = "MEMBER";
                jest.clearAllMocks();
            });

            it("should not use PRODUCER for portal", () => {
                expect(component.portal).not.toBe("PRODUCER");
            });

            it("should use ShoppingService.deleteCartItem instead of ngrx", () => {
                const spy = jest.spyOn(shoppingService, "deleteCartItem");

                component.removePlan(EXPECTED_CART_ITEM_ID, "777", EXPECTED_PLAN_OFFERING_ID, EXPECTED_PRODUCT_OFFERING_ID);

                expect(spy).toBeCalledWith(String(EXPECTED_MEMBER_ID), EXPECTED_CART_ITEM_ID, EXPECTED_MP_GROUP);
            });

            it("should set cartFlag to true if cartLoop is empty", () => {
                component.cartFlag = false;
                component.cartLoop = [];

                component.removePlan(EXPECTED_CART_ITEM_ID, "777", EXPECTED_PLAN_OFFERING_ID, EXPECTED_PRODUCT_OFFERING_ID);

                expect(component.cartLoop).toStrictEqual([]);
                expect(component.cartFlag).toBe(true);
            });

            it("should NOT set cartFlag if cartLoop is NOT empty", () => {
                // Set cartFlag using a Symbol so that the source can only be from this test
                const booleanSymbol = Symbol("fake-boolean") as unknown as boolean;
                component.cartFlag = booleanSymbol;
                component.cartLoop = [{ id: 1, carrierId: 2 }];

                expect(component.cartLoop[0].id).not.toBe(EXPECTED_CART_ITEM_ID);

                component.removePlan(EXPECTED_CART_ITEM_ID, "777", EXPECTED_PLAN_OFFERING_ID, EXPECTED_PRODUCT_OFFERING_ID);

                expect(component.cartFlag).toBe(booleanSymbol);
                expect(component.cartLoop).toStrictEqual([{ id: 1, carrierId: 2 }]);
            });

            it("should set cartFlag to true if cartLoop only contains cartItem with matching cartItemId", () => {
                component.cartFlag = false;
                component.cartLoop = [{ id: EXPECTED_CART_ITEM_ID, carrierId: 2 }];

                expect(component.cartLoop[0].id).toBe(EXPECTED_CART_ITEM_ID);
                expect(component.cartLoop.length).toBe(1);

                component.removePlan(EXPECTED_CART_ITEM_ID, "777", EXPECTED_PLAN_OFFERING_ID, EXPECTED_PRODUCT_OFFERING_ID);

                expect(component.cartLoop).toStrictEqual([]);
                expect(component.cartFlag).toBe(true);
            });

            it("should close overlay if cartLoop contains cartItem with matching cartItemId", () => {
                const spy1 = jest.spyOn(component, "shoppingCartDisplay");
                const spy2 = jest.spyOn(shopCartService, "closeExpandedOverlayCart");
                const spy3 = jest.spyOn(shopCartService, "changeHighlightedOverlay");

                component.cartLoop = [{ id: EXPECTED_CART_ITEM_ID, carrierId: 2 }];

                expect(component.cartLoop[0].id).toBe(EXPECTED_CART_ITEM_ID);

                component.removePlan(EXPECTED_CART_ITEM_ID, "777", EXPECTED_PLAN_OFFERING_ID, EXPECTED_PRODUCT_OFFERING_ID);

                expect(spy1).toBeCalledTimes(1);
                expect(spy2).toBeCalledWith({
                    isCloseOverlay: true,
                });
                expect(spy3).toBeCalledWith({
                    isCartOpen: false,
                });
            });

            it("should clear productOfferingsDeclined", () => {
                component.productOfferingsDeclined = ["moo"];
                component.cartLoop = [{ id: EXPECTED_CART_ITEM_ID, carrierId: 2 }];

                component.removePlan(EXPECTED_CART_ITEM_ID, "777", EXPECTED_PLAN_OFFERING_ID, EXPECTED_PRODUCT_OFFERING_ID);

                expect(component.productOfferingsDeclined).toStrictEqual([]);
            });

            it("should update product offering and plan offering that it is not in cart", () => {
                const spy = jest.spyOn(store, "dispatch").mockReturnValue(of(null));

                component.cartLoop = [{ id: EXPECTED_CART_ITEM_ID, carrierId: 2 }];

                component.removePlan(EXPECTED_CART_ITEM_ID, "777", EXPECTED_PLAN_OFFERING_ID, EXPECTED_PRODUCT_OFFERING_ID);

                expect(spy).toHaveBeenNthCalledWith(
                    1,
                    new SetProductOfferingsOfId({
                        ...MOCK_PRODUCT_OFFERING,
                        inCart: false,
                        planOfferings: [
                            {
                                ...MOCK_PLAN_OFFERING,
                                inCart: false,
                            },
                        ],
                    }),
                );
                expect(spy).toHaveBeenNthCalledWith(
                    2,
                    new SetProductPlanOfferings(EXPECTED_PRODUCT_OFFERING_ID, [
                        {
                            ...MOCK_PLAN_OFFERING,
                            inCart: false,
                        },
                    ]),
                );
            });
        });
    });

    describe("updateProducerShoppingCart()", () => {
        it("updateProducerShoppingCart closed event with PRODUCER portal should call shoppingCartDisplay and shopCartService.changeHighlightedOverlay", (done) => {
            expect.assertions(5);

            const spy1 = jest.spyOn(component, "shoppingCartDisplay");
            const spy2 = jest.spyOn(shopCartService, "changeHighlightedOverlay");
            component.portal = "PRODUCER";
            // When two items in cart
            component.cartLoop = [
                { id: 1, carrierId: 2 },
                { id: 2, carrierId: 2 },
            ];
            component.cartFlag = false;
            component.carrierCreateQuoteResponse = [2];

            component.updateProducerShoppingCart(1).subscribe(() => {
                // expect shoppingCartDisplay to be called once
                expect(spy1).toBeCalledTimes(1);
                // expect shopCartService.changeHighlightedOverlay to be called once
                expect(spy2).toBeCalledWith({
                    isCartOpen: false,
                });
                // Other values manipulated as part of updateProducerShoppingCart
                expect(component.cartFlag).toBe(false);
                expect(component.cartLoop).toStrictEqual([{ id: 2, carrierId: 2 }]);
                expect(component.carrierEligibility).toBe(true);
                done();
            });
        });

        it("updateProducerShoppingCart closed event with other than PRODUCER portal should not call shoppingCartDisplay and shopCartService.changeHighlightedOverlay", (done) => {
            expect.assertions(5);

            const spy1 = jest.spyOn(component, "shoppingCartDisplay");
            const spy2 = jest.spyOn(ngrxStore, "onAsyncValue");
            component.portal = "MEMBER";
            component.cartLoop = [];
            component.cartFlag = false;

            component.updateProducerShoppingCart(1).subscribe(() => {
                // expect shoppingCartDisplay to not be called
                expect(spy1).toBeCalledTimes(0);
                // expect shopCartService.changeHighlightedOverlay to not be called
                expect(spy2).toBeCalledTimes(0);
                // Other values manipulated as part of updateProducerShoppingCart
                expect(component.cartLoop.length).toBe(0);
                expect(component.cartFlag).toBe(false);
                expect(component.cartLoop).toStrictEqual([]);

                done();
            });
        });

        it("updateProducerShoppingCart closed event with PRODUCER portal should call shoppingCartDisplay and cartFlag to be true", (done) => {
            expect.assertions(5);

            const spy1 = jest.spyOn(component, "shoppingCartDisplay");
            const spy2 = jest.spyOn(shopCartService, "changeHighlightedOverlay");
            component.portal = "PRODUCER";
            // When one item in cart
            component.cartLoop = [{ id: 1, carrierId: 2 }];
            component.carrierCreateQuoteResponse = [2];

            component.updateProducerShoppingCart(1).subscribe(() => {
                // expect shoppingCartDisplay to be called once
                expect(spy1).toBeCalledTimes(1);
                // expect shopCartService.changeHighlightedOverlay to be called once
                expect(spy2).toBeCalledWith({
                    isCartOpen: false,
                });
                // Other values manipulated as part of updateProducerShoppingCart
                expect(component.cartFlag).toBe(true);
                expect(component.cartLoop).toStrictEqual([]);
                expect(component.carrierEligibility).toBe(false);

                done();
            });
        });
    });

    describe("Verify EBS Email Required", () => {
        beforeEach(() => {
            component.isEBSPaymentConfigEnabled = false;
            component.isEBSIndicator = false;
            component.memberContactInfo = {
                address: {
                    state: "",
                    zip: "",
                },
                emailAddresses: [],
            };
            component.memberWorkContact = {
                address: {
                    state: "",
                    zip: "",
                },
                emailAddresses: [],
            };
            jest.clearAllMocks();
        });

        it("EBS config should not be true", () => {
            expect(component.isEBSPaymentConfigEnabled).toBe(false);
        });

        it("EBS indicator should not be true", () => {
            expect(component.isEBSIndicator).toBe(false);
        });

        it("Verify only EBS config enabled", () => {
            component.isEBSPaymentConfigEnabled = true;
            const checkEBS = component.checkEBSEmail();
            expect(checkEBS).toBe(false);
        });

        it("Verify only EBS indicator enabled", () => {
            component.isEBSIndicator = true;
            const checkEBS = component.checkEBSEmail();
            expect(checkEBS).toBe(false);
        });

        it("Verify both EBS config & indicator enabled & no email", () => {
            component.isEBSPaymentConfigEnabled = true;
            component.isEBSIndicator = true;
            const checkEBS = component.checkEBSEmail();
            expect(checkEBS).toBe(true);
        });

        it("Verify both EBS config & indicator enabled & has contact email", () => {
            component.isEBSPaymentConfigEnabled = true;
            component.isEBSIndicator = true;
            component.memberContactInfo.emailAddresses = [
                {
                    email: "test@test.com",
                    verified: true,
                    primary: true,
                },
            ];
            const checkEBS = component.checkEBSEmail();
            expect(checkEBS).toBe(false);
        });

        it("Verify both EBS config & indicator enabled & has work email", () => {
            component.isEBSPaymentConfigEnabled = true;
            component.isEBSIndicator = true;
            component.memberWorkContact.emailAddresses = [
                {
                    email: "test@test.com",
                    verified: true,
                    primary: true,
                },
            ];
            const checkEBS = component.checkEBSEmail();
            expect(checkEBS).toBe(false);
        });
    });
    describe("Enrollment method is CALL_CENTER and Flow is Payroll", () => {
        beforeEach(() => {
            component.enrollmentObj = {
                enrollmentMethod: EnrollmentMethod.CALL_CENTER,
                enrollmentState: "GA",
                headSetState: "GA",
                headSetStateAbbreviation: "GA",
                enrollmentStateAbbreviation: "GA",
                userType: "",
                memberId: 1,
                mpGroup: "",
            };
            component.isPayroll = true;
        });

        it("should set systemFlowCode as CALL_CENTER_PAYROLL", () => {
            component.getEnrollmentFlow();
            expect(component.systemFlowCode).toBe(SystemFlowCode.CALL_CENTER_PAYROLL);
        });
    });

    describe("Enrollment method is HEADSET and Flow is Payroll", () => {
        beforeEach(() => {
            component.enrollmentObj = {
                enrollmentMethod: EnrollmentMethod.HEADSET,
                enrollmentState: "GA",
                headSetState: "GA",
                headSetStateAbbreviation: "GA",
                enrollmentStateAbbreviation: "GA",
                userType: "",
                memberId: 1,
                mpGroup: "",
            };
            component.isPayroll = true;
        });

        it("should set systemFlowCode as HEADSET_PAYROLL", () => {
            component.getEnrollmentFlow();
            expect(component.systemFlowCode).toBe(SystemFlowCode.HEADSET_PAYROLL);
        });
    });

    describe("Enrollment method is VIRTUAL_FACE_TO_FACE and Flow is Payroll", () => {
        beforeEach(() => {
            component.enrollmentObj = {
                enrollmentMethod: EnrollmentMethod.VIRTUAL_FACE_TO_FACE,
                enrollmentState: "GA",
                headSetState: "GA",
                headSetStateAbbreviation: "GA",
                enrollmentStateAbbreviation: "GA",
                userType: "",
                memberId: 1,
                mpGroup: "",
            };
            component.isPayroll = true;
        });

        it("should set systemFlowCode as VIRTUALF2F_PAYROLL", () => {
            component.getEnrollmentFlow();
            expect(component.systemFlowCode).toBe(SystemFlowCode.VIRTUALF2F_PAYROLL);
        });
    });

    describe("Enrollment method is CALL_CENTER and Flow is Direct", () => {
        beforeEach(() => {
            component.enrollmentObj = {
                enrollmentMethod: EnrollmentMethod.CALL_CENTER,
                enrollmentState: "GA",
                headSetState: "GA",
                headSetStateAbbreviation: "GA",
                enrollmentStateAbbreviation: "GA",
                userType: "",
                memberId: 1,
                mpGroup: "",
            };
            component.isDirect = true;
        });

        it("should set systemFlowCode as CALL_CENTER_DIRECT", () => {
            component.getEnrollmentFlow();
            expect(component.systemFlowCode).toBe(SystemFlowCode.CALL_CENTER_DIRECT);
        });
    });

    describe("Enrollment method is HEADSET and Flow is Direct", () => {
        beforeEach(() => {
            component.enrollmentObj = {
                enrollmentMethod: EnrollmentMethod.HEADSET,
                enrollmentState: "GA",
                headSetState: "GA",
                headSetStateAbbreviation: "GA",
                enrollmentStateAbbreviation: "GA",
                userType: "",
                memberId: 1,
                mpGroup: "",
            };
            component.isDirect = true;
        });

        it("should set systemFlowCode as HEADSET_DIRECT", () => {
            component.getEnrollmentFlow();
            expect(component.systemFlowCode).toBe(SystemFlowCode.HEADSET_DIRECT);
        });
    });
    describe("Enrollment method is CALL_CENTER and Flow is Payroll", () => {
        beforeEach(() => {
            component.enrollmentObj = {
                enrollmentMethod: EnrollmentMethod.CALL_CENTER,
                enrollmentState: "GA",
                headSetState: "GA",
                headSetStateAbbreviation: "GA",
                enrollmentStateAbbreviation: "GA",
                userType: "",
                memberId: 1,
                mpGroup: "",
            };
            component.isPayroll = true;
        });

        it("should set systemFlowCode as CALL_CENTER_PAYROLL", () => {
            component.getEnrollmentFlow();
            expect(component.systemFlowCode).toBe(SystemFlowCode.CALL_CENTER_PAYROLL);
        });
    });

    describe("Enrollment method is HEADSET and Flow is Payroll", () => {
        beforeEach(() => {
            component.enrollmentObj = {
                enrollmentMethod: EnrollmentMethod.HEADSET,
                enrollmentState: "GA",
                headSetState: "GA",
                headSetStateAbbreviation: "GA",
                enrollmentStateAbbreviation: "GA",
                userType: "",
                memberId: 1,
                mpGroup: "",
            };
            component.isPayroll = true;
        });

        it("should set systemFlowCode as HEADSET_PAYROLL", () => {
            component.getEnrollmentFlow();
            expect(component.systemFlowCode).toBe(SystemFlowCode.HEADSET_PAYROLL);
        });
    });

    describe("Enrollment method is VIRTUAL_FACE_TO_FACE and Flow is Payroll", () => {
        beforeEach(() => {
            component.enrollmentObj = {
                enrollmentMethod: EnrollmentMethod.VIRTUAL_FACE_TO_FACE,
                enrollmentState: "GA",
                headSetState: "GA",
                headSetStateAbbreviation: "GA",
                enrollmentStateAbbreviation: "GA",
                userType: "",
                memberId: 1,
                mpGroup: "",
            };
            component.isPayroll = true;
        });

        it("should set systemFlowCode as VIRTUALF2F_PAYROLL", () => {
            component.getEnrollmentFlow();
            expect(component.systemFlowCode).toBe(SystemFlowCode.VIRTUALF2F_PAYROLL);
        });
    });

    describe("Enrollment method is CALL_CENTER and Flow is Direct", () => {
        beforeEach(() => {
            component.enrollmentObj = {
                enrollmentMethod: EnrollmentMethod.CALL_CENTER,
                enrollmentState: "GA",
                headSetState: "GA",
                headSetStateAbbreviation: "GA",
                enrollmentStateAbbreviation: "GA",
                userType: "",
                memberId: 1,
                mpGroup: "",
            };
            component.isDirect = true;
        });

        it("should set systemFlowCode as CALL_CENTER_DIRECT", () => {
            component.getEnrollmentFlow();
            expect(component.systemFlowCode).toBe(SystemFlowCode.CALL_CENTER_DIRECT);
        });
    });

    describe("Enrollment method is HEADSET and Flow is Direct", () => {
        beforeEach(() => {
            component.enrollmentObj = {
                enrollmentMethod: EnrollmentMethod.HEADSET,
                enrollmentState: "GA",
                headSetState: "GA",
                headSetStateAbbreviation: "GA",
                enrollmentStateAbbreviation: "GA",
                userType: "",
                memberId: 1,
                mpGroup: "",
            };
            component.isDirect = true;
        });

        it("should set systemFlowCode as HEADSET_DIRECT", () => {
            component.getEnrollmentFlow();
            expect(component.systemFlowCode).toBe(SystemFlowCode.HEADSET_DIRECT);
        });
    });

    describe("To get the permission from user", () => {
        it("should set create member permission correctly", () => {
            const spy = jest.spyOn(staticUtilService, "hasPermission").mockReturnValueOnce(of(true));
            component.getPermissions();
            expect(spy).toBeCalledWith("core.census.create.member");
            expect(component.canCreateMember).toBe(true);
        });

        it("should set create test member permission correctly", () => {
            const spy = jest.spyOn(staticUtilService, "hasPermission").mockReturnValueOnce(of(true));
            component.getPermissions();
            expect(spy).toBeCalledWith("core.census.create.member.test");
            expect(component.canCreateTestMember).toBe(true);
        });

        it("should set address match config value correctly", () => {
            const spy = jest.spyOn(staticUtilService, "cacheConfigEnabled").mockReturnValueOnce(of(true));
            component.getPermissions();
            expect(spy).toBeCalledWith("general.feature.validate.address.matching.logic");
            expect(component.addressMatchConfig).toBe(true);
        });

        it("should set coverage date bold visibility config value correctly", () => {
            const spy = jest.spyOn(staticUtilService, "cacheConfigEnabled").mockReturnValueOnce(of(true));
            component.getPermissions();
            expect(spy).toBeCalledWith("core.shopping.coverageEffectiveDate.contentUpdate.enabled");
            expect(component.isCoverageBoldConfigEnabled).toBe(true);
        });
    });

    describe("checkMemberPersonalDetails()", () => {
        it("should return true if member's personal details are present", () => {
            component.memberInfo = {
                name: { firstName: "Sample", lastName: "LastName" },
                birthDate: "01-01-1999",
                gender: Gender.MALE,
            };
            expect(component.checkMemberPersonalDetails()).toBe(true);
        });

        it("should return false if member's personal details are absent", () => {
            component.memberInfo = {
                name: { firstName: "Sample", lastName: "LastName" },
                birthDate: "01-01-1999",
            } as MemberProfile;
            expect(component.checkMemberPersonalDetails()).toBe(false);
        });
    });

    describe("isEmployerNameFieldRequired()", () => {
        it("should return true when config is on, field is not readonly and member doesn't have employerName", () => {
            component.memberInfo = {
                workInformation: {
                    employerName: undefined,
                },
            } as MemberProfile;
            component.isEmployerNameFieldEnabled = true;
            component.isEmployerNameFieldReadOnly = false;
            expect(component.isEmployerNameFieldRequired()).toBe(true);
        });

        it("should return false when config is on, field is readonly and member doesn't have employerName", () => {
            component.memberInfo = {
                workInformation: {
                    employerName: undefined,
                },
            } as MemberProfile;
            component.isEmployerNameFieldEnabled = true;
            component.isEmployerNameFieldReadOnly = true;
            expect(component.isEmployerNameFieldRequired()).toBe(false);
        });

        it("should return false when config is on, field is not readonly and member has employerName", () => {
            component.memberInfo = {
                workInformation: {
                    employerName: "Sample Employer Name",
                },
            } as MemberProfile;
            component.isEmployerNameFieldEnabled = true;
            component.isEmployerNameFieldReadOnly = true;
            expect(component.isEmployerNameFieldRequired()).toBe(false);
        });
    });
    describe("checkCorrespondenceTypeAndEmail", () => {
        it("should return true when validation is passed", () => {
            component.memberInfo = { profile: { correspondenceType: "ELECTRONIC" } } as MemberProfile;
            component.memberContactInfo = { emailAddresses: [{ email: "test@gmil.com" }] } as MemberContact;
            component.memberWorkContact = { emailAddresses: [{ email: "test@gmail.com" }] } as MemberContact;
            const result1 = component.checkCorrespondenceTypeAndEmail();
            expect(result1).toBe(true);
            component.memberContactInfo = { emailAddresses: [] } as MemberContact;
            const result2 = component.checkCorrespondenceTypeAndEmail();
            expect(result2).toBe(true);
            component.memberContactInfo = { emailAddresses: [] } as MemberContact;
            component.memberWorkContact = { emailAddresses: [] } as MemberContact;
            const result3 = component.checkCorrespondenceTypeAndEmail();
            expect(result3).toBe(false);
            component.memberInfo = { profile: { correspondenceType: "PAPER" } } as MemberProfile;
            const result4 = component.checkCorrespondenceTypeAndEmail();
            expect(result4).toBe(true);
        });
    });
    describe("checkEBSEmail()", () => {
        beforeEach(() => {
            component.isEBSPaymentConfigEnabled = true;
            component.isEBSIndicator = true;
            component.memberContactInfo = { emailAddresses: [] } as MemberContact;
        });
        it("should return true based on validation when memberWorkContact is there", () => {
            component.memberWorkContact = { emailAddresses: [] } as MemberContact;
            const result1 = component.checkEBSEmail();
            expect(result1).toBe(true);
        });
        it("should return true based on validation when memberWorkContact is not there", () => {
            component.memberWorkContact = null;
            const result1 = component.checkEBSEmail();
            expect(result1).toBe(true);
        });
    });
    describe("checkDependentAddress()", () => {
        beforeEach(() => {
            component.mpGroup = 12345;
            jest.clearAllMocks();
        });
        it("should call getDependentContact and saveDependentContact if dependent address is empty", () => {
            component.memberInfo = { id: 1, address: { address1: "street1", city: "newCity" } } as MemberProfile;
            component.memberContactInfo = { address: { address1: "street1", city: "newCity" } } as MemberContact;
            component.dependentList = [{ id: 1, address: {} }] as MemberDependent[];
            const spy1 = jest.spyOn(memberService, "getDependentContact").mockReturnValue(of({ address: {} } as DependentContact));
            const spy2 = jest.spyOn(memberService, "saveDependentContact").mockReturnValue(of({} as HttpResponse<Response>));
            component.checkDependentAddress();
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledWith({ address: { address1: "street1", address2: "", city: "newCity" } }, 1, "1", 12345);
        });
        it("should not call saveDependentContact if dependent address is there", () => {
            component.memberInfo = { id: 1, address: { address1: "street1", city: "newCity" } } as MemberProfile;
            component.dependentList = [{ id: 1, address: { address1: "street1", city: "newCity" } }] as MemberDependent[];
            jest.spyOn(memberService, "getDependentContact").mockReturnValue(
                of({ address: { address1: "street1", address2: "", city: "newCity" } } as DependentContact),
            );
            const spy = jest.spyOn(memberService, "saveDependentContact").mockReturnValue(of({} as HttpResponse<Response>));
            component.checkDependentAddress();
            expect(spy).not.toBeCalled();
        });
    });
});
