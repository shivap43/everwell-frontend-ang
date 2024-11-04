import { DualPlanYearState, SharedState } from "@empowered/ngxs-store";
import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input, NO_ERRORS_SCHEMA, Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { Configuration, ShoppingCartDisplayService, StaticService } from "@empowered/api";
import { EmpoweredModalService } from "@empowered/common-services";
import {
    mockMatDialog,
    mockRouter,
    MockPayrollFrequencyCalculatorPipe,
    mockShoppingCartDisplayService,
    mockLanguageService,
    mockDateService,
} from "@empowered/testing";
import { PayrollFrequencyCalculatorPipe } from "@empowered/ui";
import { NgxsModule, Store } from "@ngxs/store";
import { PlanSummaryComponent } from "./plan-summary.component";
import {
    Characteristics,
    EnrollmentMethod,
    Enrollments,
    FlexDollarModel,
    GetCartItems,
    MemberDependent,
    PayFrequency,
    PayFrequencyObject,
    Plan,
    PlanOfferingPanel,
    ProductOfferingPanel,
    TaxStatus,
} from "@empowered/constants";
import { VoidCoverageComponent } from "../../benefit-summary/edit-coverage/void-coverage/void-coverage.component";
import { EndCoverageComponent } from "../../benefit-summary/end-coverage/end-coverage.component";
import { of } from "rxjs";
import { LanguageService } from "@empowered/language";
import { DateService } from "@empowered/date";
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
    selector: "[hasPermission]",
})
class MockHasPermissionDirective {
    @Input("hasPermission") permission: string;
}

@Directive({
    selector: "[configEnabled]",
})
class MockConfigEnableDirective {
    @Input("configEnabled") configKey: string;
}

const mockDatePipe = {
    transform: (date: string) => date,
} as DatePipe;
describe("PlanSummaryComponent", () => {
    let component: PlanSummaryComponent;
    let fixture: ComponentFixture<PlanSummaryComponent>;
    let empoweredModalService: EmpoweredModalService;
    let shoppingCartDisplayService: ShoppingCartDisplayService;
    let store: Store;
    let dateService: DateService;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PlanSummaryComponent, MockReplaceTagPipe, MockHasPermissionDirective, MockConfigEnableDirective],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([DualPlanYearState, SharedState]), StoreModule.forRoot({})],
            providers: [
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: PayrollFrequencyCalculatorPipe,
                    useClass: MockPayrollFrequencyCalculatorPipe,
                },
                EmpoweredModalService,
                StaticService,
                Configuration,
                {
                    provide: ShoppingCartDisplayService,
                    useValue: mockShoppingCartDisplayService,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: DateService,
                    useValue: mockDateService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlanSummaryComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            dualPlanYear: {
                oeDualPlanYear: { id: 1 },
                isDualPlanYear: false,
                planYearsData: [],
            },
        });
        empoweredModalService = TestBed.inject(EmpoweredModalService);
        shoppingCartDisplayService = TestBed.inject(ShoppingCartDisplayService);
        component.enrollment = {
            plan: {
                name: "Dental",
                carrierId: 70,
            },
            id: 2,
            taxStatus: TaxStatus.PRETAX,
            validity: { effectiveStarting: "13-08-2023", expiresAfter: "12-08-2024" },
            enrolledDependents: [{ dependentId: 10, name: "steven" }],
        } as Enrollments;
        component.mpGroup = 12345;
        component.memberId = 1;
        component.memberName = "klaasen";
        component.product = { id: 3, product: { id: 11 } } as ProductOfferingPanel;
        dateService = TestBed.inject(DateService);
    });

    describe("PlanSummaryComponent", () => {
        it("should create component", () => {
            expect(component).toBeTruthy();
        });
    });

    describe("showPlanDetailsPopup()", () => {
        it("should open plan detail component popup", () => {
            component.planSummary = {
                planId: 1,
                name: "Dental matrix",
                planOfferingId: 2,
                totalCost: 3,
                taxStatus: null,
                coveredIndividuals: null,
                status: null,
                benefitAmount: null,
            };
            component.planOffering = {
                plan: {
                    carrier: {
                        id: 70,
                    },
                },
            } as PlanOfferingPanel;
            component.showPlanDetailsPopup();
        });
    });

    describe("isVoid()", () => {
        beforeEach(() => {
            component.enrollment = {
                status: "APPROVED",
                plan: {
                    characteristics: [],
                },
            } as unknown as Enrollments;
            component.planOffering = {
                cartItem: null,
            } as unknown as PlanOfferingPanel;
        });
        it("should show withdraw link if there is an enrollment", () => {
            component.isVoid();
            expect(component.isVoidCoverage).toBe(true);
        });
        it("should not show withdraw link if there is a cartItem present", () => {
            component.planOffering.cartItem = {} as unknown as GetCartItems;
            component.isVoid();
            expect(component.isVoidCoverage).toBe(false);
        });

        it("should not show withdraw link for AUTOENROLLABLE", () => {
            component.enrollment.plan.characteristics = [Characteristics.AUTOENROLLABLE];
            component.isVoid();
            expect(component.isVoidCoverage).toBe(false);
        });
        it("should not show withdraw link if a cartItem is present", () => {
            component.planOffering.cartItem = {} as unknown as GetCartItems;
            component.isVoid();
            expect(component.isVoidCoverage).toBe(false);
        });
    });

    describe("getTaxStatus()", () => {
        it("should return PRE-TAX tax status", () => {
            component.languageStrings = { "primary.portal.quoteShop.preTax": "PRE-TAX" };
            expect(component.getTaxStatus("PRETAX")).toBe("PRE-TAX");
        });
    });
    describe("showVoidCoveragePopup()", () => {
        it("should call openDialog", () => {
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            component.showVoidCoveragePopup();
            expect(spy).toBeCalledWith(VoidCoverageComponent, {
                data: {
                    planName: "Dental",
                    mpGroup: 12345,
                    memberId: 1,
                    enrollId: 2,
                    isShop: true,
                    productId: 3,
                },
                panelClass: "emp-modal-lib",
            });
        });
    });
    describe("openEndCoveragePopup()", () => {
        it("should call openDialog", () => {
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            component.openEndCoveragePopup();
            expect(spy).toBeCalledWith(EndCoverageComponent, {
                data: {
                    memberId: 1,
                    employeeName: "klaasen",
                    mpGroup: 12345,
                    enrollmentId: 2,
                    enrollmentTaxStatus: "PRETAX",
                    coverageStartDate: "13-08-2023",
                    expiresAfter: "12-08-2024",
                    planName: "Dental",
                    isShop: true,
                    productId: 3,
                    isArgus: true,
                },
                panelClass: "emp-modal-lib",
            });
        });
    });
    describe("getPlanFlexDollars()", () => {
        it("should call getAppliedFlexDollarOrIncentivesForCart", () => {
            const spy = jest.spyOn(shoppingCartDisplayService, "getAppliedFlexDollarOrIncentivesForCart").mockReturnValue(
                of({
                    planFlexDollarOrIncentives: [
                        {
                            planId: 1,
                            flexDollarOrIncentiveAmount: 10,
                        },
                        {
                            planId: 2,
                            flexDollarOrIncentiveAmount: 15,
                        },
                    ],
                } as FlexDollarModel),
            );
            component.enrollmentState = "GA";
            component.cartItem = { id: 2 } as GetCartItems;
            component.getPlanFlexDollars();
            expect(spy).toBeCalledWith(1, "12345", 2);
            expect(component.planFlexDollars).toStrictEqual([
                {
                    planId: 1,
                    flexDollarOrIncentiveAmount: 10,
                },
                {
                    planId: 2,
                    flexDollarOrIncentiveAmount: 15,
                },
            ]);
            expect(component.flexCost).toBe(25);
        });
    });
    describe("getEnrolledDependent()", () => {
        it("should return dependant", () => {
            component.memberDependents = [
                { id: 10, name: "steven" },
                { id: 20, name: "jeffery" },
            ] as MemberDependent[];
            const dependant = component.getEnrolledDependent();
            expect(dependant).toStrictEqual({ id: 10, name: "steven" });
        });
    });
    describe("getTaxStatus()", () => {
        it("should return tax status", () => {
            const taxStatus1 = component.getTaxStatus("POSTTAX");
            expect(taxStatus1).toStrictEqual("primary.portal.quoteShop.postTax");
            const taxStatus2 = component.getTaxStatus("PRETAX");
            expect(taxStatus2).toStrictEqual("primary.portal.quoteShop.preTax");
            component.isOpenEnrollment = true;
            const taxStatus3 = component.getTaxStatus("VARIABLE");
            expect(taxStatus3).toStrictEqual("primary.portal.quoteShop.preTax");
            component.isOpenEnrollment = false;
            const taxStatus4 = component.getTaxStatus("VARIABLE");
            expect(taxStatus4).toStrictEqual("primary.portal.quoteShop.postTax");
        });
    });

    describe("convertDate()", () => {
        it("should converted date", () => {
            const date = component.convertDate("2021-12-31");
            expect(date).toStrictEqual("12/31/2021");
        });
    });
    describe("getDependentAge()", () => {
        it("should call getDifferenceInYears and return dependent age", () => {
            const spy = jest.spyOn(dateService, "getDifferenceInYears").mockReturnValue(2);
            const dependentAge = component.getDependentAge("01-17-2024");
            expect(spy).toBeCalledTimes(1);
            expect(dependentAge).toBe(2);
        });
    });
    describe("getCartObject()", () => {
        beforeEach(() => {
            component.enrollmentMethod = EnrollmentMethod.FACE_TO_FACE;
            component.enrollmentState = "GA";
        });
        it("should return cart item object", () => {
            component.enrollment = {
                planOfferingId: 10,
                totalCost: 100,
                coverageLevel: { id: 1 },
                benefitAmount: 1000,
            } as Enrollments;
            const cartItem = component.getCartObject();
            expect(cartItem).toStrictEqual({
                planOfferingId: 10,
                memberCost: 100,
                totalCost: 100,
                enrollmentMethod: "FACE_TO_FACE",
                enrollmentState: "GA",
                coverageLevelId: 1,
                benefitAmount: 1000,
            });
        });
        it("it should use coverageLevelId if coverageLevel object is not present in the enrollment", () => {
            component.enrollment = {
                planOfferingId: 10,
                totalCost: 100,
                coverageLevelId: 2,
            } as Enrollments;
            const cartItem = component.getCartObject();
            expect(cartItem).toStrictEqual({
                planOfferingId: 10,
                memberCost: 100,
                totalCost: 100,
                enrollmentMethod: "FACE_TO_FACE",
                enrollmentState: "GA",
                coverageLevelId: 2,
            });
        });
    });
    describe("isDependentCovered()", () => {
        it("should return boolean if dependent covered", () => {
            const isDependentCovered1 = component.isDependentCovered("Named Insured / Spouse Only");
            expect(isDependentCovered1).toBe(true);
            const isDependentCovered2 = component.isDependentCovered("One Parent Family");
            expect(isDependentCovered2).toBe(true);
            const isDependentCovered3 = component.isDependentCovered("Two Parent Family");
            expect(isDependentCovered3).toBe(true);
            const isDependentCovered4 = component.isDependentCovered("Individual");
            expect(isDependentCovered4).toBe(false);
        });
    });
    describe("getCartRidersArray()", () => {
        it("should return modifies cart riders", () => {
            component.planOffering = {
                ridersData: [
                    { plan: { id: 1, name: "Hospital" } },
                    { plan: { id: 2, name: "Dental" } },
                    { plan: { id: 3, name: "Vision" } },
                ],
            } as PlanOfferingPanel;
            component.cartItem = {
                riders: [
                    { planId: 1, coverageLevelId: 1, benefitAmount: 1000 },
                    { planId: 2, coverageLevelId: 1, benefitAmount: 2000 },
                ],
            } as GetCartItems;
            const ridersData = component.getCartRidersArray();
            expect(ridersData).toStrictEqual(["Hospital with $1000 Benefit Amount", "Dental with $2000 Benefit Amount"]);
        });
        it("should return empty array if riders are not present", () => {
            component.cartItem = { riders: [] } as GetCartItems;
            const ridersData = component.getCartRidersArray();
            expect(ridersData).toStrictEqual([]);
        });
    });
    describe("getEnrollmentRidersArray()", () => {
        it("should return modifies cart riders and should set planSummary totalCost", () => {
            component.payFrequencyObject = {} as PayFrequencyObject;
            component.planSummary = {
                name: "Plan",
                planOfferingId: 1,
                planId: 2,
                totalCost: 0,
                baseCost: 0,
                adjustments: 0,
                benefitAmount: 1000,
                taxStatus: "Pres Tax",
                coveredIndividuals: [],
                status: "Enrolled",
            };
            component.enrollment = {
                riders: [
                    { plan: { id: 1, name: "Hospital" }, benefitAmount: 1000, totalCost: 100, memberCostPerPayPeriod: 10 },
                    { plan: { id: 2, name: "Dental" }, benefitAmount: 2000, totalCost: 200, memberCostPerPayPeriod: 10 },
                ],
            } as Enrollments;
            const ridersData = component.getEnrollmentRidersArray();
            expect(ridersData).toStrictEqual(["Hospital with $1000 Benefit Amount", "Dental with $2000 Benefit Amount"]);
            expect(component.planSummary.totalCost).toBe(300);
            expect(component.planSummary.baseCost).toBe(300);
            expect(component.planSummary.adjustments).toBe(280);
        });
        it("should return empty array if enrollment riders are not present", () => {
            component.enrollment = {
                riders: [],
            } as Enrollments;
            const ridersData = component.getEnrollmentRidersArray();
            expect(ridersData).toStrictEqual([]);
        });
    });
    describe("getContributionAmount()", () => {
        it("should return contribution amount", () => {
            component.payFrequency = { payrollsPerYear: 12 } as PayFrequency;
            const contributionAmount = component.getContributionAmount(5);
            expect(contributionAmount).toBe(60);
        });
    });

    describe("displayEditButton()", () => {
        beforeEach(() => {
            component.planOffering = { agentAssistanceRequired: false, plan: {} } as unknown as PlanOfferingPanel;
            component.planSummary = {
                name: "Plan",
                planOfferingId: 1,
                planId: 2,
                totalCost: 0,
                baseCost: 0,
                adjustments: 0,
                benefitAmount: 1000,
                taxStatus: "Pres Tax",
                coveredIndividuals: [],
                status: "Enrolled",
            };
            component.product = { id: 1, product: { id: 1, name: "HOSPITAL", code: "1" } };
        });

        it("should hide plan Edit button if no conditions met", () => {
            expect(component.displayEditButton()).toBeFalsy();
        });

        it("should hide plan Edit button if agentAssistanceRequired is true", () => {
            component.planOffering.agentAssistanceRequired = true;
            expect(component.displayEditButton()).toBeFalsy();
        });

        it("should hide plan Edit button if the plan summary status is lapsed", () => {
            component.planSummary.status = "Lapsed";
            expect(component.displayEditButton()).toBeFalsy();
        });

        it("should show plan Edit button if the plan summary status is inCart", () => {
            component.planSummary.status = "IN_CART";
            expect(component.displayEditButton()).toBeTruthy();
        });

        it("should hide plan Edit button if its company provided plans", () => {
            component.planSummary.status = "COMPANY_PROVIDED";
            expect(component.displayEditButton()).toBeFalsy();
        });

        it("should show plan Edit button if its company provided plans but the product is VISION or DENTAL", () => {
            component.planSummary.status = "COMPANY_PROVIDED";
            component.product.product.id = 30;
            expect(component.displayEditButton()).toBeTruthy();
            component.product.product.id = 13;
            expect(component.displayEditButton()).toBeTruthy();
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
            component.ngOnDestroy();
            expect(spy).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
});
