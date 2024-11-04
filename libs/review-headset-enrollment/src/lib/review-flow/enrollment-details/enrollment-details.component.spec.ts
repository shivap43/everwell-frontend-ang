import { RouterTestingModule } from "@angular/router/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { Configuration, EnrollmentService, MemberService } from "@empowered/api";
import { StaticUtilService } from "@empowered/ngxs-store";
import { mockStaticUtilService, mockLanguageService, mockEmpoweredModalService, mockMemberService } from "@empowered/testing";
import { LanguageService } from "@empowered/language";
import { EnrollmentDetailsComponent } from "./enrollment-details.component";
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ComponentType } from "@angular/cdk/overlay";
import { of, throwError } from "rxjs";
import { EbsPaymentRecord } from "@empowered/constants";
import { EbsPaymentOnFileEnum } from "@empowered/constants";
import { EmpoweredModalService } from "@empowered/common-services";

const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () => of({ type: "Remove" }),
        } as MatDialogRef<any>),
} as MatDialog;

const mockMatDialogData = {
    enrollmentData: {
        id: 4,
        type: "TELEPHONE_ENROLLMENT",
        planOfferingId: 227,
        state: "GA",
        city: "Columbus",
        status: "PENDING",
        memberCost: 16.59,
        memberCostPerPayPeriod: 16.59,
        totalCost: 16.59,
        totalCostPerPayPeriod: 16.59,
        riskClassId: 3,
        validity: {
            effectiveStarting: "2023-02-01",
        },
        createDate: "2023-01-24T10:52:18",
        taxStatus: "PRETAX",
        tobaccoStatus: "UNDEFINED",
        createdFromFeeds: false,
        ebsPaymentOnFile: {
            CREDIT_CARD_PRESENT: true,
        },
        coverageLevel: {
            id: 27,
            name: "Individual",
            displayOrder: 1,
            iconLocation: "{fileServer}/images/coveragelevels/{pixelSize}/coverage-individual.svg",
            spouseCovered: false,
            retainCoverageLevel: false,
        },
        plan: {
            id: 11282,
            name: "Aflac Cancer Protection Assurance | B70100",
            adminName: "Aflac Cancer Protection Assurance | B70100",
            description: "Aflac Cancer Protection Assurance | B70100",
            productId: 23,
            displayOrder: 13,
            policySeries: "B70100",
            carrierId: 1,
            characteristics: [],
            policyOwnershipType: "INDIVIDUAL",
            pricingModel: "UNIVERSAL",
            pricingEditable: false,
            enrollable: true,
            rider: false,
            dependentPlanIds: [11418, 11285, 11339, 11286, 11340, 11287, 11341, 11531, 11532, 11533, 11382],
            mutuallyExclusivePlanIds: [],
            carrierNameOverride: "Aflac",
        },
        pendingReason: "CUSTOMER_SIGNATURE",
        changeEffectiveStarting: "2023-02-01",
        subscriberApprovalRequiredByDate: "2023-01-31",
    },
    payFrequency: {
        id: 2,
        frequencyType: "MONTHLY",
        name: "Monthly",
        payrollsPerYear: 12,
        displayOrder: 3,
    },
    productDetails: {
        id: 23,
        name: "Cancer",
        adminName: "Cancer",
        description:
            "Cancer insurance can help you and your family better cope financially - and emotionally - if a positive diagnosis of cancer ever occurs.",
        displayOrder: 13,
        valueAddedService: false,
        carrierIds: [1],
        iconLocation: "{fileServer}/images/aflac/products/icon/cancer.svg",
        iconSelectedLocation: "{fileServer}/images/aflac/products/iconselected/cancer.svg",
        cardColorCode: "00c853",
    },
    enrollmentDependents: [],
    enrollmentRiders: [],
    enrollmentBeneficiaries: [],
    memberDetails: {
        id: 45,
        name: {
            firstName: "JEFFREY",
            lastName: "ANDERSON",
            suffix: "",
            maidenName: "",
            nickname: "",
        },
        birthDate: "1963-01-13",
        gender: "MALE",
        profile: {
            maritalStatus: "UNREPORTED",
            languagePreference: "ENGLISH",
            tobaccoStatus: "UNDEFINED",
            medicareEligibility: false,
            correspondenceType: "ELECTRONIC",
            correspondenceLocation: "HOME",
            communicationPreference: "UNDEFINED",
            allowCallCenter: false,
            hiddenFromEmployee: false,
            ineligibleForCoverage: false,
            courtOrdered: false,
            test: false,
        },
        workInformation: {
            occupation: "Tester",
            occupationDescription: "awdawd",
            hireDate: "1990-01-01",
            organizationId: 1,
            payrollFrequencyId: 2,
            termination: {},
            employeeIdRequired: false,
            hoursPerWeek: 40,
            hoursPerWeekRequired: false,
        },
        ssn: "786165156",
        ssnConfirmed: true,
        verificationInformation: {
            verifiedPhone: "8516561516",
            verifiedEmail: "awdawdawd@gmail.com",
            zipCode: "31903",
        },
        registrationStatus: "CIAM_BASIC",
    },
    memberDependents: [],
    existingEnrollment: null,
    userDetails: {
        memberId: "123",
        groupId: "456",
    },
    isAflac: true,
    planId: 1,
};

describe("EnrollmentDetailsComponent", () => {
    let component: EnrollmentDetailsComponent;
    let fixture: ComponentFixture<EnrollmentDetailsComponent>;
    let staticUtil: StaticUtilService;
    let empoweredModalService: EmpoweredModalService;
    let enrollmentService: EnrollmentService;
    let memberService: MemberService;
    let staticUtilService: StaticUtilService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EnrollmentDetailsComponent],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([]), RouterTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            providers: [
                FormBuilder,
                Configuration,
                { provide: staticUtil, useValue: mockStaticUtilService },
                { provide: LanguageService, useValue: mockLanguageService },
                { provide: MatDialog, useValue: mockMatDialog },
                { provide: MAT_DIALOG_DATA, useValue: mockMatDialogData },
                { provide: MatDialogRef, useValue: {} },
                { provide: empoweredModalService, useValue: mockEmpoweredModalService },
                { provide: enrollmentService, useValue: {} },
                { provide: memberService, useValue: mockMemberService },
                { provide: staticUtilService, useValue: mockStaticUtilService },
            ],
        }).compileComponents();
        staticUtil = TestBed.inject(StaticUtilService);
        empoweredModalService = TestBed.inject(EmpoweredModalService);
        enrollmentService = TestBed.inject(EnrollmentService);
        memberService = TestBed.inject(MemberService);
        staticUtilService = TestBed.inject(StaticUtilService);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EnrollmentDetailsComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("check ebs config", (done) => {
        const spy1 = jest.spyOn(staticUtil, "cacheConfigEnabled").mockReturnValue(of(true));
        component.ngOnInit();
        expect(spy1).toBeCalledWith("general.feature.enable.paylogix_payment");
        component.isEBSPaymentConfigEnabled$.subscribe((config) => {
            expect(config).toBe(true);
            done();
        });
    });

    it("check ebs payment on file", (done) => {
        component.ngOnInit();
        component.ebsPayment$.subscribe((payment) => {
            expect(payment).toBe(true);
            done();
        });
    });

    describe("check gotoAflacEBS", () => {
        it("check opening of modal", () => {
            const spy1 = jest.spyOn(empoweredModalService, "openDialog");
            component.gotoAflacEBS();
            expect(spy1).toBeCalledTimes(1);
        });

        it("check getEbsPaymentOnFile is called", () => {
            const spy1 = jest.spyOn(memberService, "getEbsPaymentOnFile");
            component.gotoAflacEBS();
            component.dialogRef?.afterClosed().subscribe(() => {
                expect(spy1).toBeCalledTimes(1);
            });
        });
    });

    describe("check getEbsInfo", () => {
        it("check cacheConfigEnabled is called", () => {
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigEnabled");
            component.getEbsInfo();
            expect(spy1).toBeCalledTimes(1);
        });

        it("check ebsPayment", () => {
            component.enrollment.enrollmentData.ebsPaymentOnFile = EbsPaymentOnFileEnum.CREDIT_CARD_PRESENT;
            component.getEbsInfo();
            component.ebsPayment$.subscribe((val) => {
                expect(val).toBeTruthy();
            });
        });
    });

    it("check getEbsPaymentOnFile failure condition", (done) => {
        jest.spyOn(mockMemberService, "getEbsPaymentOnFile").mockReturnValue(throwError(new Error("Request failed")));
        component.gotoAflacEBS();
        mockMemberService.getEbsPaymentOnFile(1, 2).subscribe(
            () => {},
            (error) => {
                expect(error.message).toBe("Request failed");
                done();
            },
        );
    });

    it("check getEbsPaymentOnFile success condition", (done) => {
        const spy1 = jest
            .spyOn(mockMemberService, "getEbsPaymentOnFile")
            .mockReturnValue(of({ CREDIT_CARD_PRESENT: true } as EbsPaymentRecord));
        component.gotoAflacEBS();
        mockMemberService.getEbsPaymentOnFile(1, 2).subscribe(() => {
            expect(spy1).toBeCalled();
            done();
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

    describe("onPrelimNoticeClick()", () => {
        it("should make downloadPreliminaryForm api call", () => {
            component.memberId = 7;
            component.onPrelimNoticeClick();
            // enables checkbox
            expect(component.disablePrelimCheckbox).toBe(true);
            // hides error validation
            expect(component.viewFormRequired).toBe(false);
            // show/hide acknowledgement validation
            expect(component.showAcknowledgementError).toBeUndefined();
        });
    });

    describe("onCheckboxChange()", () => {
        it("should enable checkbox and update prelimCheckStatus", () => {
            component.memberId = 7;
            component.onCheckboxChange();
            // enables checkbox
            expect(component.disablePrelimCheckbox).toBe(true);
            // check status
            expect(component.prelimCheckStatus).toBe(false);
        });
    });

    describe("filterPreliminaryNotice()", () => {
        it("should filter and display prelim notice conditionally", () => {
            component.memberId = 7;
            const response = [{ documentName: "PRELIMINARY_NOTICE", documentLink: "/resources/aflac/NY-16800" }];
            component.filterPreliminaryNotice(response);
            // handles displaying prelim link
            expect(component.showPrelimCheck).toBe(true);
            // handles displaying error validation
            expect(component.viewFormRequired).toBe(undefined);
            // enables checkbox
            expect(component.disablePrelimCheckbox).toBe(true);
            // show/hide acknowledgement validation
            expect(component.showAcknowledgementError).toBeUndefined();
        });
    });
});
