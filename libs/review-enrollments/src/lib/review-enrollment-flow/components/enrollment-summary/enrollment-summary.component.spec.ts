import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EnrollmentSummaryComponent } from "./enrollment-summary.component";
import { DateService } from "@empowered/date";
import {
    mockAccountService,
    mockCoreService,
    mockDatePipe,
    mockDateService,
    mockEnrollmentsService,
    mockLanguageService,
    mockMatDialog,
    mockMemberService,
} from "@empowered/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Pipe, PipeTransform } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { RouterTestingModule } from "@angular/router/testing";
import { LanguageService } from "@empowered/language";
import { NgxsModule } from "@ngxs/store";
import { ReviewFlowService } from "../../services/review-flow.service";
import { MatDialog } from "@angular/material/dialog";
import {
    AccountService,
    EnrollmentService,
    CoreService,
    MemberService,
    MemberEnrollmentSummary,
    MemberEnrollmentDetail,
    MemberEnrollmentCoverage,
} from "@empowered/api";
import { CurrencyPipe, DatePipe, LowerCasePipe, TitleCasePipe } from "@angular/common";
import {
    Carrier,
    CoverageLevel,
    CoverageValidity,
    EnrollmentBeneficiary,
    Enrollments,
    GuaranteedIssue,
    MemberBeneficiary,
    Name,
    Plan,
    Product,
    TaxStatus,
    Validity,
} from "@empowered/constants";
import { of, Subject } from "rxjs";

@Pipe({
    name: "[currency]",
})
class MockCurrencyPipe implements PipeTransform {
    transform(value: any): string {
        return `$${value}`;
    }
}
const mockCurrencyPipe = new MockCurrencyPipe();

@Pipe({
    name: "titlecase",
})
class MockTitleCasePipe implements PipeTransform {
    transform(value: string) {
        return "";
    }
}

@Pipe({
    name: "lowercase",
})
class MockLowerCasePipe implements PipeTransform {
    transform(value: string) {
        return "";
    }
}

describe("EnrollmentSummaryComponent", () => {
    let component: EnrollmentSummaryComponent;
    let fixture: ComponentFixture<EnrollmentSummaryComponent>;
    let dateService: DateService;
    let enrollmentsService: EnrollmentService;
    let memberService: MemberService;
    let accountService: AccountService;
    let coreService: CoreService;
    let matDialog: MatDialog;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EnrollmentSummaryComponent, MockTitleCasePipe, MockLowerCasePipe],
            imports: [HttpClientTestingModule, ReactiveFormsModule, NgxsModule.forRoot([]), RouterTestingModule],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                ReviewFlowService,
                {
                    provide: DateService,
                    useValue: mockDateService,
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
                {
                    provide: EnrollmentService,
                    useValue: mockEnrollmentsService,
                },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: CurrencyPipe,
                    useValue: mockCurrencyPipe,
                },
                {
                    provide: TitleCasePipe,
                    useClass: MockTitleCasePipe,
                },
                {
                    provide: LowerCasePipe,
                    useClass: MockLowerCasePipe,
                },
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                {
                    provide: CoreService,
                    useValue: mockCoreService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EnrollmentSummaryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        dateService = TestBed.inject(DateService);
        enrollmentsService = TestBed.inject(EnrollmentService);
        memberService = TestBed.inject(MemberService);
        accountService = TestBed.inject(AccountService);
        coreService = TestBed.inject(CoreService);
        matDialog = TestBed.inject(MatDialog);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnDestroy()", () => {
        it("should cleanup subscriptions", () => {
            const next = jest.spyOn(component["unsubscribe$"], "next");
            const complete = jest.spyOn(component["unsubscribe$"], "complete");
            component.ngOnDestroy();
            expect(next).toBeCalledTimes(1);
            expect(complete).toBeCalledTimes(1);
        });
    });

    describe("dateTransform()", () => {
        it("should format the date correctly when Date object is passed", () => {
            const spy = jest.spyOn(dateService, "format");
            component.dateTransform(new Date("2024-07-25T00:00:00Z"));
            expect(spy).toHaveBeenCalled();
        });
    });

    describe("pullRiderEnrollmentData()", () => {
        it("should add EnrolledRiders when enrollment object has riderOfEnrollmentId", () => {
            const mockPlan = { id: 5 } as Plan;
            const mockCoverageLevel = { id: 5 } as CoverageLevel;
            const mockGuranteedIssue = { id: 5 } as GuaranteedIssue;
            const mockValidity = { effectiveStarting: "07/30/2024" } as Validity;
            const mockCoverageValidity = { effectiveStarting: "07/30/2024" } as CoverageValidity;
            const mockEnrollments: Enrollments[] = [
                {
                    id: 1,
                    planId: 1,
                    plan: mockPlan,
                    coverageLevelId: 1,
                    coverageLevel: mockCoverageLevel,
                    status: "Test",
                    carrierStatus: "Test",
                    memberCost: 1000,
                    memberCostPerPayPeriod: 1,
                    totalCost: 1000,
                    totalCostPerPayPeriod: 1,
                    benefitAmount: 1000,
                    guaranteedIssue: mockGuranteedIssue,
                    validity: mockValidity,
                    createDate: "07/25/2024",
                    dependents: mockCoverageValidity,
                    taxStatus: TaxStatus.PRETAX,
                    tobaccoStatus: "Test",
                    salaryMultiplier: 5,
                    policyNumber: "P1025",
                    reinstatement: "Test",
                    approvedDate: "07/24/2024",
                    approvedAdminId: 1,
                    riderOfEnrollmentId: 1,
                },
                {
                    id: 1,
                    planId: 1,
                    plan: mockPlan,
                    coverageLevelId: 1,
                    coverageLevel: mockCoverageLevel,
                    status: "Test",
                    carrierStatus: "Test",
                    memberCost: 1000,
                    memberCostPerPayPeriod: 1,
                    totalCost: 1000,
                    totalCostPerPayPeriod: 1,
                    benefitAmount: 1000,
                    guaranteedIssue: mockGuranteedIssue,
                    validity: mockValidity,
                    createDate: "07/25/2024",
                    dependents: mockCoverageValidity,
                    taxStatus: TaxStatus.PRETAX,
                    tobaccoStatus: "Test",
                    salaryMultiplier: 5,
                    policyNumber: "P1025",
                    reinstatement: "Test",
                    approvedDate: "07/24/2024",
                    approvedAdminId: 1,
                },
            ];

            const expectedEnrolledRiders: Enrollments[] = [
                {
                    id: 1,
                    planId: 1,
                    plan: mockPlan,
                    coverageLevelId: 1,
                    coverageLevel: mockCoverageLevel,
                    status: "Test",
                    carrierStatus: "Test",
                    memberCost: 1000,
                    memberCostPerPayPeriod: 1,
                    totalCost: 1000,
                    totalCostPerPayPeriod: 1,
                    benefitAmount: 1000,
                    guaranteedIssue: mockGuranteedIssue,
                    validity: mockValidity,
                    createDate: "07/25/2024",
                    dependents: mockCoverageValidity,
                    taxStatus: TaxStatus.PRETAX,
                    tobaccoStatus: "Test",
                    salaryMultiplier: 5,
                    policyNumber: "P1025",
                    reinstatement: "Test",
                    approvedDate: "07/24/2024",
                    approvedAdminId: 1,
                    riderOfEnrollmentId: 1,
                },
            ];
            component.pullRiderEnrollmentData(mockEnrollments);
            expect(component.enrolledRiders).toStrictEqual(expectedEnrolledRiders);
        });
    });

    describe("setGlobalValues()", () => {
        it("should assign values to specific fields when member enrollment details are valid and producer is primary producer", () => {
            const mockCoverages = [{ productKey: 1 }] as MemberEnrollmentCoverage[];
            const mockMemberEnrollmentDetails: MemberEnrollmentDetail = {
                coverages: mockCoverages,
                preTaxTotal: 1000,
                postTaxTotal: 1200,
            };
            const mockMemberEnrollments: MemberEnrollmentSummary = {
                payFrequencyType: "Monthly",
                latestEnrollmentDate: "2024-07-25T00:00:00Z'",
                currentCoverage: mockMemberEnrollmentDetails,
                updatedAndNewCoverage: mockMemberEnrollmentDetails,
            };
            const mockProducer = [
                {
                    role: "PRIMARY_PRODUCER",
                    producer: {
                        name: {
                            firstName: "Jack",
                            lastName: "Y",
                        },
                        emailAddress: "jackt12@test.com",
                        phoneNumber: "123456789",
                    },
                },
            ];
            const spy = jest.spyOn(dateService, "format");
            component.setGlobalValues(mockMemberEnrollments, mockProducer);
            expect(component.enrollData.payFrequencyType).toBe("Monthly");
            expect(component.enrollData.preTaxTotal).toBe(1000);
            expect(component.enrollData.postTaxTotal).toBe(1200);
            expect(component.enrollData.costTotal).toBe(2200);
            expect(component.enrollData.agentName).toBe("Jack Y");
            expect(component.enrollData.agentEmail).toBe("jackt12@test.com");
            expect(component.enrollData.agentPhone).toBe("123456789");
            expect(spy).toHaveBeenCalled();
        });
        it("should not assign values to specific fields when member enrollment details are valid and producer is not primary producer", () => {
            const mockCoverages = [{ productKey: 1 }] as MemberEnrollmentCoverage[];
            const mockMemberEnrollmentDetails: MemberEnrollmentDetail = {
                coverages: mockCoverages,
                preTaxTotal: 1000,
                postTaxTotal: 1200,
            };
            const mockMemberEnrollments: MemberEnrollmentSummary = {
                payFrequencyType: "Monthly",
                latestEnrollmentDate: "2024-07-25T00:00:00Z'",
                currentCoverage: mockMemberEnrollmentDetails,
                updatedAndNewCoverage: mockMemberEnrollmentDetails,
            };
            const mockProducer = [
                {
                    role: "SECONDARY_PRODUCER",
                    producer: {
                        name: {
                            firstName: "Jack",
                            lastName: "Y",
                        },
                        emailAddress: "jackt12@test.com",
                        phoneNumber: "123456789",
                    },
                },
            ];
            const spy = jest.spyOn(dateService, "format");
            component.setGlobalValues(mockMemberEnrollments, mockProducer);
            expect(component.enrollData.payFrequencyType).toBe("Monthly");
            expect(component.enrollData.preTaxTotal).toBe(1000);
            expect(component.enrollData.postTaxTotal).toBe(1200);
            expect(component.enrollData.costTotal).toBe(2200);
            expect(component.enrollData.agentEmail).toBeUndefined();
            expect(component.enrollData.agentPhone).toBeUndefined();
            expect(spy).toHaveBeenCalled();
        });
    });

    describe("getCoverageDate()", () => {
        it("should return date when expiresAfter is not present", () => {
            const spy = jest.spyOn(dateService, "format");
            const mockValidity = {
                effectiveStarting: "25/07/2024",
            } as Validity;
            const result = component.getCoverageDate(mockValidity);
            expect(spy).toHaveBeenCalled();
            expect(result).toBe("25/07/2024");
        });
        it("should return formatted string when expiresAfter is present", () => {
            const spy = jest.spyOn(dateService, "format");
            const mockValidity = {
                effectiveStarting: "25/07/2024",
                expiresAfter: "29/07/2024",
            } as Validity;
            const result = component.getCoverageDate(mockValidity);
            expect(spy).toHaveBeenCalled();
            expect(result).toBe("25/07/2024 - 29/07/2024");
        });
    });

    describe("getCoverageDate()", () => {
        it("should return dependentPlanId if riderEnrollment plan id matches", () => {
            const mockDependentPlans = [1, 2, 3];
            const mockPlan = { id: 1 } as Plan;
            const mockRiderEnrollments = [{ plan: mockPlan }] as Enrollments[];
            const result = component.getEnrolledRiderIds(mockDependentPlans, mockRiderEnrollments);
            expect(result).toStrictEqual([1]);
        });
        it("should return empty array if dependentPlanId and riderEnrollment plan id does not match", () => {
            const mockDependentPlans = [1, 2, 3];
            const mockPlan = { id: 4 } as Plan;
            const mockRiderEnrollments = [{ plan: mockPlan }] as Enrollments[];
            const result = component.getEnrolledRiderIds(mockDependentPlans, mockRiderEnrollments);
            expect(result).toStrictEqual([]);
        });
    });

    describe("openPlanDetails()", () => {
        it("should open mat dialog when openPlanDetails is called", () => {
            const spy = jest.spyOn(matDialog, "open");
            component.mpGroupId = 1;
            const mockCarrier = { id: 70, name: "Test" } as Carrier;
            const data = {
                plan: { id: 1, name: "Test", dependentPlanIds: [1], enrolledRiders: 1, carrier: mockCarrier, product: { id: 1 } },
                state: "GA",
            };
            component.openPlanDetails(data);
            expect(spy).toHaveBeenCalled();
        });
    });

    describe("getEnrollmentSummaryData()", () => {
        it("should make isSpinnerLoading falase when getEnrollmentSummaryData is executed", () => {
            component.isSpinnerLoading = true;
            const mockEnrollmentBenificiary = [{ beneficiaryId: 5 }] as EnrollmentBeneficiary[];
            const mockEnrollmentValidity = { effectiveStarting: "05/30/2024" } as Validity;
            const mockCoverages = [
                {
                    productKey: 1,
                    productName: "TestProduct",
                    beneficiaries: mockEnrollmentBenificiary,
                    coverageDates: mockEnrollmentValidity,
                    taxStatus: "pre-tax",
                },
            ] as MemberEnrollmentCoverage[];
            const mockMemberEnrollmentDetails: MemberEnrollmentDetail = {
                coverages: mockCoverages,
                preTaxTotal: 1000,
                postTaxTotal: 1200,
            };
            const mockEnrollmentSummary = {
                payFrequencyType: "Monthly",
                latestEnrollmentDate: "2024-07-25T00:00:00Z'",
                currentCoverage: mockMemberEnrollmentDetails,
                updatedAndNewCoverage: mockMemberEnrollmentDetails,
            } as MemberEnrollmentSummary;
            const mockPlan = { id: 5 } as Plan;
            const mockCoverageLevel = { id: 5 } as CoverageLevel;
            const mockGuranteedIssue = { id: 5 } as GuaranteedIssue;
            const mockValidity = { effectiveStarting: "07/30/2024" } as Validity;
            const mockCoverageValidity = { effectiveStarting: "07/30/2024" } as CoverageValidity;
            const mockEnrollments: Enrollments[] = [
                {
                    id: 1,
                    planId: 1,
                    plan: mockPlan,
                    coverageLevelId: 1,
                    coverageLevel: mockCoverageLevel,
                    status: "Test",
                    carrierStatus: "Test",
                    memberCost: 1000,
                    memberCostPerPayPeriod: 1,
                    totalCost: 1000,
                    totalCostPerPayPeriod: 1,
                    benefitAmount: 1000,
                    guaranteedIssue: mockGuranteedIssue,
                    validity: mockValidity,
                    createDate: "07/25/2024",
                    dependents: mockCoverageValidity,
                    taxStatus: TaxStatus.PRETAX,
                    tobaccoStatus: "Test",
                    salaryMultiplier: 5,
                    policyNumber: "P1025",
                    reinstatement: "Test",
                    approvedDate: "07/24/2024",
                    approvedAdminId: 1,
                    riderOfEnrollmentId: 1,
                },
            ];
            const mockProducts = [
                {
                    id: 1,
                    name: "TestProduct",
                    iconSelectedLocation: "TestLocation",
                    cardColorCode: "#000",
                },
            ] as Product[];
            const mockName = {
                firstName: "Will",
                lastName: "W",
            } as Name;
            const mockTrusteeName = {
                firstName: "Jaccob",
                lastName: "W",
            } as Name;
            const mockMemeberBenificiary = [
                {
                    id: 5,
                    type: "Test",
                    name: mockName,
                    trustee: mockTrusteeName,
                },
            ] as MemberBeneficiary[];
            const mockProducer = [
                {
                    role: "PRIMARY_PRODUCER",
                    producer: {
                        name: {
                            firstName: "Jack",
                            lastName: "Y",
                        },
                        emailAddress: "jackt12@test.com",
                        phoneNumber: "123456789",
                    },
                },
            ];
            jest.spyOn(enrollmentsService, "getMemberEnrollmentSummary").mockReturnValue(of(mockEnrollmentSummary));
            jest.spyOn(enrollmentsService, "searchMemberEnrollments").mockReturnValue(of(mockEnrollments));
            jest.spyOn(memberService, "getMemberBeneficiaries").mockReturnValue(of(mockMemeberBenificiary));
            jest.spyOn(accountService, "getAccountProducers").mockReturnValue(of(mockProducer));
            jest.spyOn(coreService, "getProducts").mockReturnValue(of(mockProducts));
            component.enrollData.currentCoverageData = [];
            component.getEnrollmentSummaryData(1, 2);
            expect(component.isSpinnerLoading).toBe(false);
        });
    });
});
