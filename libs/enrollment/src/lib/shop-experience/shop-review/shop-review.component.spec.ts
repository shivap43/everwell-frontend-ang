import { DatePipe } from "@angular/common";
import { HttpResponse } from "@angular/common/http";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";
import { AccountService, CoreService, GetShoppingCart, MemberService, ShoppingCartDisplayService, ShoppingService } from "@empowered/api";
import { AddressMatchingService, EmpoweredModalService, SharedService, TpiServices } from "@empowered/common-services";
import {
    ApiError,
    EnrollmentMethod,
    FlexDollarModel,
    MemberProfile,
    PayFrequency,
    PlanFlexDollarOrIncentives,
    TpiSSOModel,
} from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import {
    EnrollmentState,
    SetErrorForShop,
    SetPlanLevelFlexIncetives,
    StaticUtilService,
    TPIState,
    UtilService,
} from "@empowered/ngxs-store";
import {
    mockAccountService,
    mockActivatedRoute,
    mockAddressMatchingService,
    mockCoreService,
    mockDatePipe,
    mockEmpoweredModalService,
    mockLanguageService,
    mockMemberService,
    MockPayrollFrequencyCalculatorPipe,
    MockReplaceTagPipe,
    mockRouter,
    mockSharedService,
    mockShoppingCartDisplayService,
    mockStaticUtilService,
    mockTpiService,
    mockUtilService,
} from "@empowered/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { of, throwError } from "rxjs";

import { ShopReviewComponent } from "./shop-review.component";
const tpiSSODetail = {
    productId: 12,
    planId: 2,
    user: {
        memberId: 12,
        groupId: 1,
        id: 12,
        producerId: 123,
    },
    modal: true,
} as TpiSSOModel;

describe("ShopReviewComponent", () => {
    let component: ShopReviewComponent;
    let fixture: ComponentFixture<ShopReviewComponent>;
    let store: Store;
    let staticUtilService: StaticUtilService;
    let shoppingService: ShoppingService;
    let accountService: AccountService;
    let memberService: MemberService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ShopReviewComponent, MockPayrollFrequencyCalculatorPipe, MockReplaceTagPipe],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: SharedService,
                    useValue: mockSharedService,
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                {
                    provide: CoreService,
                    useValue: mockCoreService,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
                {
                    provide: TpiServices,
                    useValue: mockTpiService,
                },
                {
                    provide: ShoppingCartDisplayService,
                    useValue: mockShoppingCartDisplayService,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: AddressMatchingService,
                    useValue: mockAddressMatchingService,
                },
                {
                    provide: UtilService,
                    useValue: mockUtilService,
                },
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                {
                    provide: ActivatedRoute,
                    useValue: mockActivatedRoute,
                },
                Store,
            ],
            imports: [HttpClientTestingModule, RouterTestingModule, NgxsModule.forRoot([TPIState, EnrollmentState])],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            enrollment: {
                mpGroup: 12345,
                memberId: 1,
                enrollmentState: "GA",
                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                isOpenEnrollment: true,
                isQLEPeriod: false,
            },
            TPIState: {
                tpiSSODetail,
            },
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ShopReviewComponent);
        component = fixture.componentInstance;
        staticUtilService = TestBed.inject(StaticUtilService);
        accountService = TestBed.inject(AccountService);
        shoppingService = TestBed.inject(ShoppingService);
        memberService = TestBed.inject(MemberService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("getAddressMatchConfigValue()", () => {
        it("should call cacheConfigEnabled and set isAddressMatchingConfigEnabled", () => {
            const spy = jest.spyOn(staticUtilService, "cacheConfigEnabled").mockReturnValue(of(true));
            component.getAddressMatchConfigValue();
            expect(spy).toBeCalledWith("general.feature.validate.address.matching.logic");
            expect(component.isAddressMatchingConfigEnabled).toBe(true);
        });
    });
    describe("fetchReviewPageData()", () => {
        it("should call apis and set data", () => {
            component.planYearId = [1];
            component.isAgentAssisted = true;
            const spy1 = jest.spyOn(shoppingService, "getShoppingCart").mockReturnValue(
                of({
                    productOfferingsInCart: [1, 2, 3],
                    totalCost: 100,
                    locked: false,
                } as GetShoppingCart),
            );
            const spy2 = jest
                .spyOn(accountService, "getPayFrequencies")
                .mockReturnValue(of([{ id: 1, name: "Monthly" }] as PayFrequency[]));
            const spy3 = jest.spyOn(memberService, "getMember").mockReturnValue(
                of({
                    body: {
                        workInformation: {
                            payrollFrequencyId: 1,
                        },
                    },
                } as HttpResponse<MemberProfile>),
            );
            component.fetchReviewPageData();
            expect(spy1).toBeCalledWith(1, 12345, [1]);
            expect(spy2).toBeCalledWith("12345");
            expect(spy3).toBeCalledWith(1, true, "12345");
            expect(component.cartCount).toBe(3);
            expect(component.totalCost).toBe(100);
            expect(component.payfrequencyName).toStrictEqual("Monthly");
            expect(component.locked).toBe(false);
        });
        it("should dispatch an action and set showErrorMessage", () => {
            const error = {
                message: "api error message",
                status: 400,
                error: {
                    status: "400",
                    language: {
                        displayText: "error",
                    },
                },
            };
            jest.spyOn(shoppingService, "getShoppingCart").mockReturnValue(throwError(error));
            const spy = jest.spyOn(store, "dispatch");
            component.fetchReviewPageData();
            expect(spy).toBeCalledWith(new SetErrorForShop(error.error as ApiError));
            expect(component.showErrorMessage).toBe(true);
        });
    });
    describe("setFlexDollars()", () => {
        it("should set flexDollars and dispatch action", () => {
            const flexDollars = {
                planFlexDollarOrIncentives: [
                    { flexDollarOrIncentiveAmount: 100 },
                    { flexDollarOrIncentiveAmount: 200 },
                ] as PlanFlexDollarOrIncentives[],
            } as FlexDollarModel;
            const spy = jest.spyOn(store, "dispatch");
            component.setFlexDollars(flexDollars);
            expect(component.flexDollars).toBe(flexDollars);
            expect(spy).toBeCalledWith(new SetPlanLevelFlexIncetives(flexDollars.planFlexDollarOrIncentives));
            expect(component.totalFlexCost).toBe(300);
        });
    });
});
