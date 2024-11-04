import { ComponentType } from "@angular/cdk/overlay";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { AccountTypes, DualPlanYearService, StaticUtilService } from "@empowered/ngxs-store";
import { of, throwError } from "rxjs";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Directive, EventEmitter, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { DatePipe } from "@angular/common";
import { AccountService, AflacAlwaysService, Configuration, EnrollmentService, MemberService } from "@empowered/api";
import { CoverageSummaryComponent } from "./coverage-summary.component";
import { MaskApplierService, NgxMaskPipe, MaskService } from "ngx-mask";
import { PayrollFrequencyCalculatorPipe } from "@empowered/ui";
import {
    mockStaticUtilService,
    mockAccountService,
    mockDatePipe,
    mockEmpoweredModalService,
    mockMemberService,
    mockStore,
    MockReplaceTagPipe,
    MockPayrollFrequencyCalculatorPipe,
    mockDualPlanYearService,
    mockDateService,
    mockRouter,
    mockLanguageService,
} from "@empowered/testing";
import {
    Gender,
    GroupAttribute,
    DateFormats,
    Product,
    EbsPaymentRecord,
    ToastType,
    EbsPaymentFileEnrollment,
    Enrollments,
    Accounts,
    Contact,
    SitusState,
    ProspectType,
    ProspectInformation,
    StatusTypeValues,
    PartnerAccountType,
    GroupedCartItems,
} from "@empowered/constants";
import { EmpoweredModalService } from "@empowered/common-services";
import { DateService } from "@empowered/date";
import { ActivatedRoute, Router } from "@angular/router";
import { LanguageService } from "@empowered/language";
import { StoreModule } from "@ngrx/store";

const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () =>
                of({
                    type: "Remove",
                    fromContEbs: true,
                    failedEbsPaymentCallback: true,
                }),
        } as MatDialogRef<any>),
} as MatDialog;

export const mockEnrollmentService = {
    updateEbsPaymentOnFile: (memberId: string, mpGroup: number, ebsPmt: EbsPaymentFileEnrollment) => of({}),
};

const mockOpenDialog = {
    afterClosed: () =>
        of({
            accountName: "some account name",
            paymentType: "CREDIT_CARD",
        }),
    componentInstance: {
        isEbsRequiredFlow: new EventEmitter(),
    },
} as MatDialogRef<any>;

const mockData = [
    {
        enrolledPlans: [
            {
                enrollmentId: 221,
                planName: "Aflac Lump Sum Cancer",
            },
            {
                enrollmentId: 223,
                planName: "Aflac Lump Sum Cancer",
            },
            {
                enrollmentId: 224,
                planName: "Aflac Lump Sum Cancer",
            },
            {
                enrollmentId: 225,
                planName: "Aflac Lump Sum Cancer",
            },
        ],
        paymentMethod: {
            id: 13,
            billingName: {
                firstName: "Tim",
                lastName: "Jones",
            },
            paymentType: "CREDIT_CARD",
            billingAddress: {
                address1: "Marvel",
                address2: "",
                city: "SAVANAH",
                state: "GA",
                zip: "31401",
            },
            sameAddressAsHome: true,
            tokens: [{}],
            lastFour: "1111",
            expirationMonth: 5,
            expirationYear: 2028,
            type: "VISA",
            tempusTokenIdentityGuid: "30b3655a-7b11-4f09-8326-1e1261031632",
            tempusPostalCode: "30009",
            accountName: "Tim Jones",
        },
        paymentAmount: 122.2,
        paymentFrequency: "MONTHLY",
    },
];

@Directive({
    selector: "[hasPermission]",
})
class MockHasPermissionDirective {
    @Input("hasPermission") permission: string;
}

@Directive({
    selector: "[isRestricted]",
})
class MockIsRestrictedDirective {
    @Input() isRestricted;
}

const mockPayrollFrequencyCalculatorPipe = {
    transform: () => 1,
};

@Directive({
    selector: "[configEnabled]",
})
class MockConfigEnabledDirective {
    @Input("configEnabled") configName: string;
}

describe("CoverageSummaryComponent", () => {
    let component: CoverageSummaryComponent;
    let fixture: ComponentFixture<CoverageSummaryComponent>;
    let staticUtil: StaticUtilService;
    let accountService: AccountService;
    let memberService: MemberService;
    let empoweredModalService: EmpoweredModalService;
    let store: Store;
    let enrollmentService: EnrollmentService;
    let dualPlanYearService: DualPlanYearService;
    let aflacAlwaysService: AflacAlwaysService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                CoverageSummaryComponent,
                MockConfigEnabledDirective,
                MockPayrollFrequencyCalculatorPipe,
                MockHasPermissionDirective,
                MockIsRestrictedDirective,
                MockReplaceTagPipe,
            ],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([]), StoreModule.forRoot({})],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            providers: [
                DatePipe,
                NgxMaskPipe,
                FormBuilder,
                Configuration,
                { provide: Store, useValue: mockStore },
                { provide: PayrollFrequencyCalculatorPipe, useValue: mockPayrollFrequencyCalculatorPipe },
                { provide: MatDialog, useValue: mockMatDialog },
                { provide: MaskService, useValue: {} },
                { provide: MaskApplierService, useValue: {} },
                { provide: MatDialogRef, useValue: {} },
                { provide: staticUtil, useValue: mockStaticUtilService },
                { provide: accountService, useValue: mockAccountService },
                { provide: DatePipe, useValue: mockDatePipe },
                { provide: memberService, useValue: mockMemberService },
                { provide: empoweredModalService, useValue: mockEmpoweredModalService },
                { provide: enrollmentService, useValue: mockEnrollmentService },
                { provide: DualPlanYearService, useClass: mockDualPlanYearService },
                { provide: DateService, useValue: mockDateService },
                { provide: Router, useValue: mockRouter },
                { provide: ActivatedRoute, useValue: {} },
                { provide: LanguageService, useValue: mockLanguageService },
            ],
        }).compileComponents();
        staticUtil = TestBed.inject(StaticUtilService);
        empoweredModalService = TestBed.inject(EmpoweredModalService);
        memberService = TestBed.inject(MemberService);
        accountService = TestBed.inject(AccountService);
        store = TestBed.inject(Store);
        enrollmentService = TestBed.inject(EnrollmentService);
        dualPlanYearService = TestBed.inject(DualPlanYearService);
        aflacAlwaysService = TestBed.inject(AflacAlwaysService);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CoverageSummaryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        component.memberId = 5;
        component.accountId = 12345;
        component.cartItems = [];
        component.memberDetails = {
            memberId: 5,
            groupId: 12345,
            name: {
                firstName: "johny",
            },
        };
        component.dualPlanYearData = {
            oeYear: "2023",
            qleYear: "2023",
        };
        component.contactForm = new FormGroup({});
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should be able to enable EBS indicator", (done) => {
        const spy1 = jest
            .spyOn(accountService, "getGroupAttributesByName")
            .mockReturnValue(of([{ attribute: "ebs_indicator", id: 1, value: "true" }] as GroupAttribute[]));
        component.ngOnInit();
        expect(spy1).toBeCalled();
        component.isEBSIndicator$.subscribe((indicator) => {
            expect(indicator).toBe(true);
            done();
        });
    });

    it("should get payment methods for aflac always", () => {
        const spy = jest.spyOn(memberService, "getPaymentMethodsForAflacAlways").mockReturnValue(of(mockData));
        component.ngOnInit();
        expect(spy).toBeCalled();
        expect(component.isEnrolled).toBeTruthy();
    });

    it("should get the required info for producer portal", () => {
        const spy1 = jest.spyOn(component, "getMemberInfo");
        component.isMemberPortal = false;
        component.getRequiredInfo();
        expect(spy1).toBeCalled();
    });

    it("should get the required info for member portal", () => {
        const spy1 = jest.spyOn(component, "setMemberRequiredInfo");
        component.isMemberPortal = true;
        component.memberDetails = { groupId: 12344 };
        component.getRequiredInfo();
        expect(spy1).toBeCalled();
    });

    it("should check for incomplete required info", () => {
        expect(component.isCompletedRequiredInfo()).toStrictEqual(0);
    });

    it("should check for complete required info", () => {
        component.emailContacts = [{}];
        component.ssnConfirmationEnabled = false;
        component.MemberInfo = {
            ssn: "12344",
            ssnConfirmed: true,
            name: { firstName: "", lastName: "" },
            birthDate: "",
            gender: Gender.MALE,
        };
        expect(component.isCompletedRequiredInfo()).toStrictEqual(false);
    });

    it("should get Producer Details", () => {
        const spy = jest.spyOn(accountService, "getAccountProducers");
        component.getProducerDetails();
        expect(spy).toBeCalled();
    });

    it("should transform date", () => {
        const date = new Date("2021-12-12");
        expect(component.dateTransform("2021-12-12")).toBe(mockDatePipe.transform(date, DateFormats.YEAR_MONTH_DAY));
    });

    it("should download file", () => {
        const spy = jest.spyOn(window, "open");
        window.open = () => window;
        component.downloadFile();
    });

    it("should set Member Required Info", () => {
        const spy = jest.spyOn(component, "setMemberRequiredInfo").mockReturnValue(of([{ id: 1, name: "true" }] as Product[]));
        component.isMemberPortal = true;
        component.getRequiredInfo();
        expect(spy).toBeCalled();
    });

    it("should set required info", () => {
        const spy = jest.spyOn(component, "getMemberInfo").mockReturnValue(of([{ id: 1, name: "true" }] as Product[]));
        component.isMemberPortal = false;
        component.getRequiredInfo();
        expect(spy).toBeCalled();
    });

    it("check getEbsPaymentOnFile on load", (done) => {
        const spy1 = jest
            .spyOn(memberService, "getEbsPaymentOnFile")
            .mockReturnValue(of({ CREDIT_CARD_PRESENT: true } as EbsPaymentRecord));
        memberService.getEbsPaymentOnFile(1, 2).subscribe(() => {
            expect(spy1).toBeCalled();
            done();
        });
    });

    it("check member service getEbsPaymentOnFile failure condition", (done) => {
        jest.spyOn(empoweredModalService, "openDialog").mockReturnValue(mockOpenDialog);
        jest.spyOn(memberService, "getEbsPaymentOnFile").mockReturnValue(throwError(new Error("Request failed")));
        component.gotoAflacEBS();
        memberService.getEbsPaymentOnFile(1, 2).subscribe(
            () => {},
            (error) => {
                expect(error.message).toBe("Request failed");
                done();
            },
        );
    });

    it("check member service getEbsPaymentOnFile success condition", (done) => {
        jest.spyOn(empoweredModalService, "openDialog").mockReturnValue(mockOpenDialog);
        const spy1 = jest
            .spyOn(memberService, "getEbsPaymentOnFile")
            .mockReturnValue(of({ CREDIT_CARD_PRESENT: true } as EbsPaymentRecord));
        component.gotoAflacEBS();
        memberService.getEbsPaymentOnFile(1, 2).subscribe((response: EbsPaymentRecord) => {
            expect(spy1).toBeCalled();
            expect(response.CREDIT_CARD_PRESENT).toBe(true);
            done();
        });
    });

    it("check opening of modal", () => {
        jest.spyOn(empoweredModalService, "openDialog").mockReturnValue(mockOpenDialog);
        const spy1 = jest.spyOn(empoweredModalService, "openDialog");
        component.gotoAflacEBS();
        expect(spy1).toBeCalledTimes(1);
    });

    describe("getConfigurationSpecifications", () => {
        it(" check fetchConfigs", () => {
            const spy1 = jest.spyOn(staticUtil, "fetchConfigs");
            component.getConfigurationSpecifications();
            expect(spy1).toBeCalledTimes(1);
        });

        it(" check cacheConfigs", () => {
            const spy1 = jest.spyOn(staticUtil, "cacheConfigs");
            component.getConfigurationSpecifications();
            expect(spy1).toBeCalledTimes(1);
        });
    });

    describe("toast open", () => {
        it("testing toast opening with error", () => {
            const toastSpy = jest.spyOn(store, "dispatch");
            const spy1 = jest
                .spyOn(memberService, "getEbsPaymentOnFile")
                .mockReturnValue(of({ CREDIT_CARD_PRESENT: true } as EbsPaymentRecord));
            const spy2 = jest.spyOn(enrollmentService, "updateEbsPaymentOnFile").mockReturnValue(of({}));
            component.callEbsPaymentOnFile([1], false, true);
            expect(toastSpy).toBeCalledTimes(1);
        });

        it("toast should open if openToast is called directly", () => {
            const spy = jest.spyOn(store, "dispatch");
            component.openToast("successful", ToastType.SUCCESS, 1000);
            expect(spy).toBeCalled();
        });
    });

    describe("check latest member assignment after dialog close of required info modal", () => {
        it("check assignment of member info and ssn", (done) => {
            jest.spyOn(empoweredModalService, "openDialog").mockReturnValue(mockOpenDialog);
            component.emailContacts = [{ contactType: "WORK", emailAddresses: [{ email: "testing123@gmail.com" }] }];
            component.ssnConfirmationEnabled = false;
            component.MemberInfo = {
                ssn: "",
                ssnConfirmed: false,
                name: { firstName: "", lastName: "" },
                birthDate: "",
                gender: Gender.MALE,
            };
            const spy1 = jest.spyOn(memberService, "getMember");
            component.gotoAflacEBS();
            component.ebsReqDialog?.afterClosed().subscribe(() => {
                expect(spy1).toBeCalledTimes(1);
                done();
            });
        });
        it("check assignment of member emails", (done) => {
            jest.spyOn(empoweredModalService, "openDialog").mockReturnValue(mockOpenDialog);
            component.emailContacts = [];
            component.ssnConfirmationEnabled = true;
            component.MemberInfo = {
                ssn: "102030406",
                ssnConfirmed: true,
                name: { firstName: "", lastName: "" },
                birthDate: "",
                gender: Gender.MALE,
            };
            const spy1 = jest.spyOn(memberService, "getMemberContacts");
            component.gotoAflacEBS();
            component.ebsReqDialog?.afterClosed().subscribe(() => {
                expect(spy1).toBeCalledTimes(1);
                done();
            });
        });
    });

    describe("check failed payment after dialog close", () => {
        it("callEbsPaymentOnFile is called with failed payment from updateEbsPaymentCallbackStatus", () => {
            const spy1 = jest
                .spyOn(memberService, "getEbsPaymentOnFile")
                .mockReturnValue(of({ CREDIT_CARD_MISSING: true } as EbsPaymentRecord));
            const spy2 = jest.spyOn(enrollmentService, "updateEbsPaymentOnFile").mockReturnValue(of({}));
            component.callEbsPaymentOnFile([1], true, true);
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
            expect(component.ebsPaymentFailed).toBe(true);
        });
    });

    describe("checkAflacAlways()", () => {
        it("should return false if config is disabled", (done) => {
            expect.assertions(4);
            const spy1 = jest.spyOn(staticUtil, "cacheConfigEnabled").mockReturnValue(of(false));
            const spy2 = jest.spyOn(accountService, "getAccount").mockReturnValue(of({} as Accounts));
            const spy3 = jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(of([]));
            component.checkAflacAlways();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
            expect(spy3).toBeCalled();
            component.isAflacAlways$.subscribe((data) => {
                expect(data).toStrictEqual(false);
                done();
            });
        });

        it("should return true if Union AND List Bill with qualifying product", (done) => {
            expect.assertions(4);
            const spy1 = jest.spyOn(staticUtil, "cacheConfigEnabled").mockReturnValue(of(true));
            const spy2 = jest.spyOn(accountService, "getAccount").mockReturnValue(
                of({
                    id: 1,
                    name: "test",
                    contact: {} as Contact<"user">,
                    primaryContact: {} as Contact<"default">,
                    situs: {
                        state: {
                            abbreviation: "VA",
                            name: "Virginia",
                        },
                        zip: "24541",
                    } as SitusState,
                    payFrequencyId: 1,
                    type: ProspectType.CLIENT,
                    prospectInformation: {
                        sicIrNumber: "test",
                        taxId: "test",
                    } as ProspectInformation,
                    subordinateProducerId: 1,
                    typeId: 1,
                    status: StatusTypeValues.ACTIVE,
                    partnerAccountType: PartnerAccountType.UNION,
                    partnerId: 1,
                    employeeCount: 1,
                    productsCount: 1,
                    daysToEnroll: 1,
                    enrollmentAssistanceAgreement: false,
                } as Accounts),
            );
            const spy3 = jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(
                of([
                    {
                        id: 1,
                        attribute: AccountTypes.LIST_BILL_ACCOUNT,
                        value: "true",
                    },
                ]),
            );
            component.checkAflacAlways();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
            expect(spy3).toBeCalled();
            component.isAflacAlways$.subscribe((data) => {
                expect(data).toStrictEqual(true);
                done();
            });
        });

        it("should return true if qualifying account (Payroll) with qualifying product", (done) => {
            expect.assertions(4);
            const spy1 = jest.spyOn(staticUtil, "cacheConfigEnabled").mockReturnValue(of(true));
            const spy2 = jest.spyOn(accountService, "getAccount").mockReturnValue(
                of({
                    id: 1,
                    name: "test",
                    contact: {} as Contact<"user">,
                    primaryContact: {} as Contact<"default">,
                    situs: {
                        state: {
                            abbreviation: "VA",
                            name: "Virginia",
                        },
                        zip: "24541",
                    } as SitusState,
                    payFrequencyId: 1,
                    type: ProspectType.CLIENT,
                    prospectInformation: {
                        sicIrNumber: "test",
                        taxId: "test",
                    } as ProspectInformation,
                    subordinateProducerId: 1,
                    typeId: 1,
                    status: StatusTypeValues.ACTIVE,
                    partnerAccountType: PartnerAccountType.PAYROLL,
                    partnerId: 1,
                    employeeCount: 1,
                    productsCount: 1,
                    daysToEnroll: 1,
                    enrollmentAssistanceAgreement: false,
                } as Accounts),
            );
            const spy3 = jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(of([]));
            component.checkAflacAlways();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
            expect(spy3).toBeCalled();
            component.isAflacAlways$.subscribe((data) => {
                expect(data).toStrictEqual(true);
                done();
            });
        });

        it("should return false if ebs account", (done) => {
            expect.assertions(4);
            const spy1 = jest.spyOn(staticUtil, "cacheConfigEnabled").mockReturnValue(of(true));
            const spy2 = jest.spyOn(accountService, "getAccount").mockReturnValue(of({} as Accounts));
            const spy3 = jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(
                of([
                    {
                        id: 1,
                        attribute: AccountTypes.EBS_ACCOUNT,
                        value: "true",
                    },
                ]),
            );
            component.checkAflacAlways();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
            expect(spy3).toBeCalled();
            component.isAflacAlways$.subscribe((data) => {
                expect(data).toStrictEqual(false);
                done();
            });
        });

        it("should return false if ach account", (done) => {
            expect.assertions(4);
            const spy1 = jest.spyOn(staticUtil, "cacheConfigEnabled").mockReturnValue(of(true));
            const spy2 = jest.spyOn(accountService, "getAccount").mockReturnValue(of({} as Accounts));
            const spy3 = jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(
                of([
                    {
                        id: 1,
                        attribute: AccountTypes.ACH_ACCOUNT,
                        value: "true",
                    },
                ]),
            );
            component.checkAflacAlways();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
            expect(spy3).toBeCalled();
            component.isAflacAlways$.subscribe((data) => {
                expect(data).toStrictEqual(false);
                done();
            });
        });

        it("should return false if direct bill account", (done) => {
            expect.assertions(4);
            const spy1 = jest.spyOn(staticUtil, "cacheConfigEnabled").mockReturnValue(of(true));
            const spy2 = jest.spyOn(accountService, "getAccount").mockReturnValue(
                of({
                    id: 1,
                    name: "test",
                    contact: {} as Contact<"user">,
                    primaryContact: {} as Contact<"default">,
                    situs: {
                        state: {
                            abbreviation: "VA",
                            name: "Virginia",
                        },
                        zip: "24541",
                    } as SitusState,
                    payFrequencyId: 1,
                    type: ProspectType.CLIENT,
                    prospectInformation: {
                        sicIrNumber: "test",
                        taxId: "test",
                    } as ProspectInformation,
                    subordinateProducerId: 1,
                    typeId: 1,
                    status: StatusTypeValues.ACTIVE,
                    partnerAccountType: PartnerAccountType.PAYROLLDIRECTBILL,
                    partnerId: 1,
                    employeeCount: 1,
                    productsCount: 1,
                    daysToEnroll: 1,
                    enrollmentAssistanceAgreement: false,
                } as Accounts),
            );
            const spy3 = jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(of([]));
            component.checkAflacAlways();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
            expect(spy3).toBeCalled();
            component.isAflacAlways$.subscribe((data) => {
                expect(data).toStrictEqual(false);
                done();
            });
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy1 = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spy1).toHaveBeenCalled();
            expect(spy2).toHaveBeenCalled();
        });
    });

    describe("getEnrolledRiderIds()", () => {
        it("should return all enrolled rider id for selected plan", () => {
            const result = component.getEnrolledRiderIds([111, 222, 555], [
                {
                    plan: {
                        id: 111,
                    },
                },
                {
                    plan: {
                        id: 333,
                    },
                },
            ] as Enrollments[]);
            expect(result).toStrictEqual([111]);
        });
    });
    describe("checkQleOeCoverage()", () => {
        beforeEach(() => {
            component.enrollData = { data: [], beneficiaries: [], enrollmentRiders: [], enrollmentDependents: [] };
            jest.spyOn(dualPlanYearService, "groupCartItems").mockReturnValue({
                vasPlans: [],
                preTaxPlans: [],
                postTaxPlans: [],
            } as GroupedCartItems);
        });
        it("should call groupCartItems and return false if auto enrollable plans are there", () => {
            const spy = jest.spyOn(dualPlanYearService, "groupCartItems").mockReturnValue({
                vasPlans: [{ planOffering: { plan: { characteristics: ["", "AUTOENROLLABLE"] } } }],
                preTaxPlans: [],
                postTaxPlans: [],
            } as GroupedCartItems);
            const result = component.checkQleOeCoverage("");
            expect(spy).toBeCalled();
            expect(result).toBe(false);
        });
        it("should return true if auto enrollable plans are not there", () => {
            jest.spyOn(dualPlanYearService, "groupCartItems").mockReturnValue({
                vasPlans: [{ planOffering: { plan: { characteristics: ["", "SUPPLEMENTARY"] } } }],
                preTaxPlans: [],
                postTaxPlans: [],
            } as GroupedCartItems);
            const result = component.checkQleOeCoverage("");
            expect(result).toBe(true);
        });
        it("should return true if enrollData is there, coverageType is Qle Shop, isQleDuringOeEnrollment is true and enrollment has qualifyingEventId", () => {
            component.enrollData.data = [{ qualifyingEventId: 1 }];
            component.isQleDuringOeEnrollment = true;
            const result = component.checkQleOeCoverage("Qle Shop");
            expect(result).toBe(true);
        });
        it("should return boolean when enrollData is there, coverageType is Qle Shop, isQleAfterOeEnrollment is true and effectiveStarting is in past or future", () => {
            component.enrollData.data = [{ validity: { effectiveStarting: new Date("05-25-2020") } }];
            component.currentDate = new Date();
            component.isQleDuringOeEnrollment = false;
            component.isQleAfterOeEnrollment = true;
            const result1 = component.checkQleOeCoverage("Qle Shop");
            expect(result1).toBe(true);
            component.enrollData.data = [{ validity: { effectiveStarting: new Date("05-25-2025") } }];
            component.currentDate = new Date("05-25-2020");
            const result2 = component.checkQleOeCoverage("Qle Shop");
            expect(result2).toBe(false);
        });
        it("should return true if coverageType is Oe Shop and qualifyingEventId is not there", () => {
            component.enrollData.data = [{ validity: { effectiveStarting: new Date("05-25-2020") } }];
            const result = component.checkQleOeCoverage("Oe Shop");
            expect(result).toBe(true);
        });
        it("should return boolean when enrollData is there, coverageType is New PY Qle Shop and effectiveStarting is in past or future", () => {
            component.enrollData.data = [{ validity: { effectiveStarting: new Date("05-25-2025") } }];
            component.currentDate = new Date("05-25-2020");
            const result1 = component.checkQleOeCoverage("New PY Qle Shop");
            expect(result1).toBe(true);
            component.enrollData.data = [{ validity: { effectiveStarting: new Date("05-25-2020") } }];
            component.currentDate = new Date("05-25-2025");
            const result2 = component.checkQleOeCoverage("New PY Qle Shop");
            expect(result2).toBe(false);
        });
        it("should return false if enrollData is not there", () => {
            component.enrollData.data = [];
            const result = component.checkQleOeCoverage("New PY Qle Shop");
            expect(result).toBe(false);
        });
    });
    describe("updateQleCoverage()", () => {
        it("should call checkCartItems and openDialog", () => {
            const spy1 = jest.spyOn(dualPlanYearService, "checkCartItems").mockReturnValue("Oe Shop");
            const spy2 = jest.spyOn(empoweredModalService, "openDialog");
            component.updateQleCoverage();
            expect(spy1).toBeCalledWith([], 5, 12345, "Qle Shop");
            expect(spy2).toBeCalledTimes(1);
        });
        it("should call setSelectedShop", () => {
            jest.spyOn(dualPlanYearService, "checkCartItems").mockReturnValue("Qle Shop");
            const spy = jest.spyOn(dualPlanYearService, "setSelectedShop");
            component.updateQleCoverage();
            expect(spy).toBeCalledWith("Qle Shop");
        });
    });
    describe("shopNextPlanYearCoverage()", () => {
        it("should call checkCartItems and openDialog", () => {
            component.isQleDuringOeEnrollment = true;
            const spy1 = jest.spyOn(dualPlanYearService, "checkCartItems").mockReturnValue("Qle Shop");
            const spy2 = jest.spyOn(empoweredModalService, "openDialog");
            component.shopNextPlanYearCoverage();
            expect(spy1).toBeCalledWith([], 5, 12345, "Oe Shop");
            expect(spy2).toBeCalledTimes(1);
        });
        it("should call setSelectedShop", () => {
            component.isQleDuringOeEnrollment = false;
            jest.spyOn(dualPlanYearService, "checkCartItems").mockReturnValue("Oe Shop");
            const spy = jest.spyOn(dualPlanYearService, "setSelectedShop");
            component.shopNextPlanYearCoverage();
            expect(spy).toBeCalledWith("New PY Qle Shop");
        });
    });
    describe("setOfferListDescriptionTag()", () => {
        it("should set offerListDescription", () => {
            component.setOfferListDescriptionTag();
            expect(component.offerListDescription).toStrictEqual("primary.portal.coverage.offerlistDescription");
        });
    });

    describe("sendToCustomer()", () => {
        it("should send reminder email to customer for aflac always enrollment", () => {
            component.contactForm.addControl("contacts", new FormControl({ contact: "abc@gmail.com", type: "email" }));
            component.isEnrolled = true;
            const spy = jest.spyOn(aflacAlwaysService, "requestAflacAlwaysSignature");
            component.sendToCustomer();
            expect(spy).toBeCalled();
        });
        it("should send reminder SMS to customer for aflac always enrollment", () => {
            component.contactForm.addControl("contacts", new FormControl({ contact: "7869543423", type: "phoneNumber" }));
            component.isEnrolled = true;
            const spy = jest.spyOn(aflacAlwaysService, "requestAflacAlwaysSignature");
            component.sendToCustomer();
            expect(spy).toBeCalled();
        });
    });
});
