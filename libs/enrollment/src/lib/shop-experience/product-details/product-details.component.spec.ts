import { DatePipe, TitleCasePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef, NO_ERRORS_SCHEMA, Directive, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import {
    AccountService,
    AuthenticationService,
    BenefitsOfferingService,
    CoreService,
    GetShoppingCart,
    MemberService,
    ReinstatementType,
    ShoppingCartDisplayService,
    ShoppingService,
    StaticService,
    coverageStartFunction,
} from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { NgxsModule, Store } from "@ngxs/store";
import { Subject, Subscription, of } from "rxjs";
import {
    StaticUtilService,
    DualPlanYearService,
    UtilService,
    ShopCartService,
    ApplicationStatusService,
    DualPlanYearState,
} from "@empowered/ngxs-store";
import { ProductDetailsComponent } from "./product-details.component";
import { EmpoweredModalService, SharedService, TpiServices } from "@empowered/common-services";
import {
    mockAccountService,
    mockApplicationService,
    mockAuthenticationService,
    mockBenefitsOfferingService,
    mockCoreService,
    mockDualPlanYearService,
    mockLanguageService,
    mockMatDialog,
    mockMemberService,
    mockRouter,
    mockSharedService,
    mockShoppingCartDisplayService,
    mockStaticService,
    mockStaticUtilService,
    mockStore,
    mockTpiService,
    mockUserService,
    MockReplaceTagPipe,
    MockCoverageNamePipe,
    mockFlexDollarPipe,
} from "@empowered/testing";
import { AflacLegalNamePipe } from "@empowered/ui";
import { UserService } from "@empowered/user";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { DateService } from "@empowered/date";
import {
    AddCartItem,
    Enrollments,
    Characteristics,
    GetCartItems,
    MemberProfile,
    MoreSettings,
    PlanOffering,
    PlanOfferingPanel,
    ProductOfferingPanel,
    ProductId,
    ProductType,
    PlanOfferingPricing,
} from "@empowered/constants";
import { HttpResponse } from "@angular/common/http";
import { Subject, Subscription, of } from "rxjs";
import { StoreModule } from "@ngrx/store";

@Pipe({
    name: "replaceTag",
})
class MockReplaceTagPipe implements PipeTransform {
    transform(value: any, mapObj: any) {
        return "replaced";
    }
}

@Directive({
    selector: "[configEnabled]",
})
class MockConfigEnableDirective {
    @Input("configEnabled") configKey: string;
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
    name: "aflacLegalName",
})
class MockAflacLegalNamePipe implements PipeTransform {
    transform(value: string): string {
        return "legal name";
    }
}

@Pipe({
    name: "flexDollar",
})
class MockFlexDollarPipe implements PipeTransform {
    transform(value: string): string {
        return "flex dollar";
    }
}
const mockRouteParams = new Subject<Params>();
const mockRoute = {
    snapshot: { params: mockRouteParams.asObservable() },
    parent: { parent: { parent: { parent: { params: mockRouteParams.asObservable() } } } },
};
const mockShoppingService = {
    getPlanOfferings: (
        planOfferingId?: string,
        enrollmentMethod?: string,
        state?: string,
        moreSetting?: MoreSettings,
        memberId?: number,
        mpGroup?: number,
        expand?: string,
        referenceDate?: string,
    ) => of([] as PlanOffering[]),
    updateCartItem: (memberId: number, mpGroup: number, id: number, cart: AddCartItem) => of({}),
    getPlanOfferingPricing: (
        planOfferingId: string,
        state?: string,
        moreSetting?: MoreSettings,
        memberId?: number,
        mpGroup?: number,
        parentPlanId?: number,
        parentPlanCoverageLevelId?: number,
        baseBenefitAmount?: number,
        childAge?: number,
        coverageEffectiveDate?: string,
        riskClassId?: number,
        fromApplicationFlow: boolean = false,
        shoppingCartItemId?: number,
        includeFee?: boolean,
    ) => of([]),
    getShoppingCart: (memberId: number, mpGroup: number, planYearId?: number[]) => of({} as GetShoppingCart),
    getPlanCoverageDatesMap: (memberId: number, mpGroup: number) =>
        of({
            "6": {
                isContinuous: true,
                defaultCoverageStartDate: "10-11-2023",
                earliestCoverageStartDate: "10-12-2023",
                latestCoverageStartDate: "10-13-2023",
            },
        }),
    isVASPlanEligible$: new Subject<any>(),
};

@Directive({
    selector: "[configEnabled]",
})
class MockConfigEnableDirective {
    @Input("configEnabled") configKey: string;
}

describe("ProductDetailsComponent", () => {
    let component: ProductDetailsComponent;
    let fixture: ComponentFixture<ProductDetailsComponent>;
    let memberService: MemberService;
    let shoppingService: ShoppingService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                ProductDetailsComponent,
                AflacLegalNamePipe,
                MockReplaceTagPipe,
                MockCoverageNamePipe,
                mockFlexDollarPipe,
                MockConfigEnableDirective,
            ],
            imports: [
                HttpClientTestingModule,
                NgxsModule.forRoot([DualPlanYearState, EnrollmentState, SharedState]),
                StoreModule.forRoot({}),
            ],
            providers: [
                DatePipe,
                TitleCasePipe,
                ChangeDetectorRef,
                ShopCartService,
                DateService,
                {
                    provide: AuthenticationService,
                    useValue: {},
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
                {
                    provide: ShoppingService,
                    useValue: mockShoppingService,
                },
                {
                    provide: CoreService,
                    useValue: mockCoreService,
                },
                {
                    provide: BenefitsOfferingService,
                    useValue: mockBenefitsOfferingService,
                },
                {
                    provide: ShoppingCartDisplayService,
                    useValue: mockShoppingCartDisplayService,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
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
                    provide: StaticService,
                    useValue: mockStaticService,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: TpiServices,
                    useValue: mockTpiService,
                },
                {
                    provide: StaticService,
                    useValue: mockStaticService,
                },
                {
                    provide: SharedService,
                    useValue: mockSharedService,
                },
                { provide: Store, useValue: mockStore },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                { provide: LanguageService, useValue: mockLanguageService },
                {
                    provide: ActivatedRoute,
                    useValue: mockRoute,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockMatDialog,
                },
                {
                    provide: BenefitsOfferingService,
                    useValue: mockBenefitsOfferingService,
                },
                {
                    provide: DualPlanYearService,
                    useValue: mockDualPlanYearService,
                },
                {
                    provide: AuthenticationService,
                    useValue: mockAuthenticationService,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockMatDialog,
                },
                {
                    provide: ApplicationStatusService,
                    useValue: mockApplicationService,
                },
                { provide: LanguageService, useValue: mockLanguageService },
                UtilService,
            ],
            imports: [HttpClientTestingModule, MatDialogModule, NgxsModule.forRoot([DualPlanYearState])],
            schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ProductDetailsComponent);
        TestBed.inject(DateService);
        memberService = TestBed.inject(MemberService);
        shoppingService = TestBed.inject(ShoppingService);
        component = fixture.componentInstance;
    });
    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("getAgeOfMemberOnCoverageEffectiveDate()", () => {
        it("should return age of the member based on coverage effective date of the cart when method is invoked", () => {
            jest.useFakeTimers().setSystemTime(new Date("2023/10/01"));
            const planOffering = {
                id: 12456,
                validity: {
                    effectiveStarting: "2023-10-01",
                    expiresAfter: "2024-10-31",
                },
                coverageStartFunction: coverageStartFunction.NEXT_FIRST_OF_MONTHNEXT_FIRST_OF_MONTH,
            } as PlanOfferingPanel;
            component.isOpenEnrollment = [];
            component.memberProfile = { id: 123, birthDate: "1963-11-29" } as MemberProfile;
            const res = component.getAgeOfMemberOnCoverageEffectiveDate(planOffering);
            expect(res).toStrictEqual(59);
            jest.useRealTimers();
        });
    });

    describe("getPayFrequencyData()", () => {
        it("should get member profile details when the method is invoked", () => {
            const memberData = {
                body: {
                    birthDate: "1963-11-01",
                    profile: {
                        test: true,
                    },
                },
            } as HttpResponse<MemberProfile>;
            const spy = jest.spyOn(memberService, "getMember").mockReturnValue(of(memberData));
            component.getPayFrequencyData();
            expect(spy).toBeCalledTimes(1);
            expect(component.memberProfile.birthDate).toStrictEqual("1963-11-01");
        });
    });

    describe("coverageStartDate$", () => {
        it("default start date value", (done) => {
            const spy = jest.spyOn(shoppingService, "getPlanCoverageDatesMap");
            component.planOfferings = [{ id: 6 }] as PlanOfferingPanel[];
            component.ngOnInit();
            expect(spy).toBeCalledTimes(1);
            component.coverageStartDate$.subscribe((defaultStartDate) => {
                expect(defaultStartDate).toBe("10-11-2023");
                done();
            });
        });
    });

    describe("sortPlans()", () => {
        it("should place items with enrollment at top and sort according to cartItem id", () => {
            component.enrolledPlanOfferings = [];
            component.planOfferings = [];
            component.inCartPlanOfferings = [
                { cartItem: { id: 200 } },
                { cartItem: { id: 150 } },
                { cartItem: { id: 100, enrollmentId: 200 } },
                { cartItem: { id: 120, enrollmentId: 150 } },
                { cartItem: { id: 20, enrollmentId: 50 } },
                { cartItem: { id: 1 } },
                { cartItem: { id: 10, enrollmentId: 100 } },
            ] as PlanOfferingPanel[];
            component.sortPlans();
            expect(component.inCartPlanOfferings).toStrictEqual([
                { cartItem: { id: 10, enrollmentId: 100 } },
                { cartItem: { id: 20, enrollmentId: 50 } },
                { cartItem: { id: 100, enrollmentId: 200 } },
                { cartItem: { id: 120, enrollmentId: 150 } },
                { cartItem: { id: 1 } },
                { cartItem: { id: 150 } },
                { cartItem: { id: 200 } },
            ]);
        });

        it("should sort enrolled plans according to id", () => {
            component.enrolledPlanOfferings = [
                { enrollment: { id: 100 } },
                { enrollment: { id: 90 } },
                { enrollment: { id: 80 } },
            ] as PlanOfferingPanel[];
            component.inCartPlanOfferings = [];
            component.planOfferings = [];
            component.sortPlans();
            expect(component.enrolledPlanOfferings).toStrictEqual([
                { enrollment: { id: 80 } },
                { enrollment: { id: 90 } },
                { enrollment: { id: 100 } },
            ]);
        });

        it("should sort plans according to id", () => {
            component.planOfferings = [{ plan: { id: 100 } }, { plan: { id: 90 } }, { plan: { id: 80 } }] as PlanOfferingPanel[];
            component.inCartPlanOfferings = [];
            component.enrolledPlanOfferings = [];
            component.sortPlans();
            expect(component.planOfferings).toStrictEqual([{ plan: { id: 80 } }, { plan: { id: 90 } }, { plan: { id: 100 } }]);
        });
    });

    describe("findInCartPlans()", () => {
        beforeEach(() => {
            component.inCartPlanOfferings = [];
            component.totalSelectedPlans = 0;
            component.planOfferings = [{ id: 1 }, { id: 2 }] as PlanOfferingPanel[];
            component.cartItems = [{ id: 10, planOfferingId: 1 }] as GetCartItems[];
        });
        it("should populate inCartPlanOfferings and planOffering against cartItems", () => {
            component.productOffering = {} as ProductOfferingPanel;
            component.findInCartPlans();
            expect(component.inCartPlanOfferings[0]).toStrictEqual({
                ...component.planOfferings[0],
                cartItem: component.cartItems[0],
                inCart: true,
                showSummary: true,
            });
            expect(component.totalSelectedPlans).toBe(1);
            expect(component.planOfferings[0]).toStrictEqual({ id: 1, inCart: true, showSummary: true, cartItem: component.cartItems[0] });
        });

        it("should populate inCartPlanOfferings and not planOffering against cartItems", () => {
            component.productOffering = { productType: "STACKABLE" } as ProductOfferingPanel;
            component.findInCartPlans();
            expect(component.inCartPlanOfferings[0]).toStrictEqual({
                ...component.planOfferings[0],
                cartItem: component.cartItems[0],
                inCart: true,
                showSummary: true,
            });
            expect(component.totalSelectedPlans).toBe(1);
            expect(component.planOfferings[0]).toStrictEqual({ id: 1 });
        });
    });

    describe("findEnrolledPlans()", () => {
        beforeEach(() => {
            component.inCartPlanOfferings = [];
            component.totalSelectedPlans = 0;
            component.productOffering = { productType: ProductType.MEDICAL } as ProductOfferingPanel;
            component.planOfferings = [{ plan: { id: 1 } }, { plan: { id: 2 } }] as PlanOfferingPanel[];
            component.enrollments = [
                { reinstatement: ReinstatementType.OPTIONAL, reinstatementPeriodEndDate: "2023-10-01", plan: { id: 2 } },
            ] as Enrollments[];
        });
        it("should set inCart to false for reinstatement plan", () => {
            component.findEnrolledPlans();
            expect(component.totalSelectedPlans).toBe(1);
            expect(component.planOfferings[1].inCart).toBeFalsy();
            expect(component.isLapsedRequiredReinstate).toBeFalsy();
        });

        it("should set inCart to true for enrolled plan", () => {
            component.enrollments = [{ plan: { id: 2 } }] as Enrollments[];
            component.findEnrolledPlans();
            expect(component.totalSelectedPlans).toBe(1);
            expect(component.planOfferings[1].inCart).toBeTruthy();
            expect(component.isLapsedRequiredReinstate).toBeFalsy();
        });
    });

    describe("setPlanExpanded()", () => {
        it("Should set the planExpanded variable to true when plan is expanded", () => {
            component.setPlanExpanded(true);
            expect(component.isPlanExpanded).toBe(true);
        });
    });

    describe("getDefaultPricing", () => {
        it("should return the highest priced offering for SHORT_TERM_DISABILITY", () => {
            const mockData = [
                { coverageLevelId: 27, benefitAmount: 6000, maxAge: 75, memberCost: 3.8285, minAge: 18, totalCost: 3.8285 },
                {
                    coverageLevelId: 29,
                    benefitAmount: 500,
                    maxAge: 75,
                    memberCost: 1.8285,
                    minAge: 18,
                    totalCost: 1.8285,
                },
            ];
            component.shortTermDisablilityCheck = true;
            const result = component.getDefaultPricing(mockData);
            expect(result.benefitAmount).toEqual(6000);
        });

        it("should return the lowest priced offering for other products", () => {
            const mockData = [
                { coverageLevelId: 27, benefitAmount: 6000, maxAge: 75, memberCost: 3.8285, minAge: 18, totalCost: 3.8285 },
                {
                    coverageLevelId: 29,
                    benefitAmount: 500,
                    maxAge: 75,
                    memberCost: 1.8285,
                    minAge: 18,
                    totalCost: 1.8285,
                },
            ];
            component.shortTermDisablilityCheck = false;
            const result = component.getDefaultPricing(mockData);
            expect(result.benefitAmount).toEqual(500);
        });
    });

    describe("isWageWorksCompanyProvidedPlan", () => {
        it("should set isWageWorksCompanyProvidedPlan to true if any plan has AUTOENROLLABLE characteristic", () => {
            component.planOfferings = [
                { plan: { characteristics: [] } } as PlanOfferingPanel,
                { plan: { characteristics: [Characteristics.AUTOENROLLABLE] } } as PlanOfferingPanel,
                { plan: { characteristics: [Characteristics.STACKABLE] } } as PlanOfferingPanel,
            ];
            component.isWageWorksCompanyProvidedPlan();
            expect(component.isWageWorksCompanyProvided).toBe(true);
        });

        it("should not set isWageWorksCompanyProvidedPlan to true if any plan has AUTOENROLLABLE characteristic", () => {
            component.planOfferings = [
                { plan: { characteristics: [Characteristics.STACKABLE] } } as PlanOfferingPanel,
                { plan: { characteristics: [] } } as PlanOfferingPanel,
            ];
            component.isWageWorksCompanyProvidedPlan();
            expect(component.isWageWorksCompanyProvided).toBe(false);
        });

        it("should handle empty planofferings gracefully", () => {
            component.planOfferings = [];
            component.isWageWorksCompanyProvidedPlan();
            expect(component.isWageWorksCompanyProvided).toBe(false);
        });

        it("should handle planofferings with no characteristics gracefully", () => {
            component.planOfferings = [
                { plan: { characteristics: [] } } as PlanOfferingPanel,
                { plan: { characteristics: null } } as PlanOfferingPanel,
                { plan: { characteristics: [Characteristics.STACKABLE] } } as PlanOfferingPanel,
            ];
            component.isWageWorksCompanyProvidedPlan();
            expect(component.isWageWorksCompanyProvided).toBe(false);
        });
    });

    describe("getSelectedPricing", () => {
        it("should return the correct pricing object if both id and benfiAmount match", () => {
            const pricingArray: PlanOfferingPricing[] = [
                { coverageLevelId: 1, benefitAmount: 5000, maxAge: 75, memberCost: 3.8285, minAge: 18, totalCost: 3.8285 },
                { coverageLevelId: 2, benefitAmount: 10000, maxAge: 75, memberCost: 3.8285, minAge: 18, totalCost: 3.8285 },
                { coverageLevelId: 3, benefitAmount: 15000, maxAge: 75, memberCost: 3.8285, minAge: 18, totalCost: 3.8285 },
            ];
            const result = component.getSelectedPricing(pricingArray, 2, 10000);
            expect(result).toEqual({
                coverageLevelId: 2,
                benefitAmount: 10000,
                maxAge: 75,
                memberCost: 3.8285,
                minAge: 18,
                totalCost: 3.8285,
            });
        });

        it("should return the first pricing object if id matches and benfiAmount is not provided", () => {
            const pricingArray: PlanOfferingPricing[] = [
                { coverageLevelId: 1, benefitAmount: 5000, maxAge: 75, memberCost: 3.8285, minAge: 18, totalCost: 3.8285 },
                { coverageLevelId: 2, benefitAmount: 10000, maxAge: 75, memberCost: 3.8285, minAge: 18, totalCost: 3.8285 },
                { coverageLevelId: 3, benefitAmount: 15000, maxAge: 75, memberCost: 3.8285, minAge: 18, totalCost: 3.8285 },
            ];
            const result = component.getSelectedPricing(pricingArray, 2, undefined);
            expect(result).toEqual({
                coverageLevelId: 2,
                benefitAmount: 10000,
                maxAge: 75,
                memberCost: 3.8285,
                minAge: 18,
                totalCost: 3.8285,
            });
        });

        it("should return the first pricing object if no match is found", () => {
            const pricingArray: PlanOfferingPricing[] = [
                { coverageLevelId: 1, benefitAmount: 5000, maxAge: 75, memberCost: 3.8285, minAge: 18, totalCost: 3.8285 },
                { coverageLevelId: 2, benefitAmount: 10000, maxAge: 75, memberCost: 3.8285, minAge: 18, totalCost: 3.8285 },
                { coverageLevelId: 3, benefitAmount: 15000, maxAge: 75, memberCost: 3.8285, minAge: 18, totalCost: 3.8285 },
            ];
            const result = component.getSelectedPricing(pricingArray, 4, 20000);
            expect(result).toEqual({
                coverageLevelId: 1,
                benefitAmount: 5000,
                maxAge: 75,
                memberCost: 3.8285,
                minAge: 18,
                totalCost: 3.8285,
            });
        });

        it("should return undefined if pricingArray is empty", () => {
            const pricingArray: PlanOfferingPricing[] = [];
            const result = component.getSelectedPricing(pricingArray, 1, 5000);
            expect(result).toBeUndefined();
        });

        it("should return undefined if pricingArray is undefined", () => {
            const result = component.getSelectedPricing(undefined, 1, 5000);

            expect(result).toBeUndefined();
        });
    });

    describe("ngOnDestroy()", () => {
        it("Should unsubscribe from all subscriptions", () => {
            const subscriptionSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.subscriptions = [new Subscription()];
            component.ngOnDestroy();
            expect(subscriptionSpy).toHaveBeenCalled();
        });
    });
});
