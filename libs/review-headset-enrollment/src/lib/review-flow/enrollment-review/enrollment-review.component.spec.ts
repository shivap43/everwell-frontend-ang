import { RouterTestingModule } from "@angular/router/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { Configuration, EnrollmentService, MemberService } from "@empowered/api";
import {
    mockStaticUtilService,
    mockLanguageService,
    mockEmpoweredModalService,
    mockMemberService,
    mockAppFlowService,
} from "@empowered/testing";
import { LanguageService } from "@empowered/language";
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ComponentType } from "@angular/cdk/overlay";
import { of, throwError } from "rxjs";
import { EmpoweredModalService } from "@empowered/common-services";
import { EbsPaymentRecord } from "@empowered/constants";
import { EbsPaymentOnFileEnum } from "@empowered/constants";
import { EnrollmentReviewComponent } from "./enrollment-review.component";
import { AppFlowService, StaticUtilService } from "@empowered/ngxs-store";
import { DatePipe } from "@angular/common";
import { StoreModule } from "@ngrx/store";
import { ReviewAflacAlwaysModalData } from "libs/api/src/lib/services/member/models/review-aflac-always-modal.data";
import { MatCheckbox, MatCheckboxChange } from "@angular/material/checkbox";

const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) =>
        ({
            afterClosed: () => of({ type: "Remove" }),
        } as MatDialogRef<any>),
} as MatDialog;

describe("EnrollmentReviewComponent", () => {
    let component: EnrollmentReviewComponent;
    let fixture: ComponentFixture<EnrollmentReviewComponent>;
    let empoweredModalService: EmpoweredModalService;
    let enrollmentService: EnrollmentService;
    let memberService: MemberService;
    let staticUtilService: StaticUtilService;
    let appFlowService: AppFlowService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EnrollmentReviewComponent],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([]), RouterTestingModule, StoreModule.forRoot({})],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            providers: [
                FormBuilder,
                Configuration,
                { provide: LanguageService, useValue: mockLanguageService },
                { provide: MatDialog, useValue: mockMatDialog },
                { provide: MatDialogRef, useValue: {} },
                { provide: empoweredModalService, useValue: mockEmpoweredModalService },
                { provide: enrollmentService, useValue: {} },
                { provide: memberService, useValue: mockMemberService },
                { provide: staticUtilService, useValue: mockStaticUtilService },
                { provide: DatePipe, useValue: {} },
                { provide: AppFlowService, useValue: mockAppFlowService },
            ],
        }).compileComponents();
        empoweredModalService = TestBed.inject(EmpoweredModalService);
        enrollmentService = TestBed.inject(EnrollmentService);
        memberService = TestBed.inject(MemberService);
        staticUtilService = TestBed.inject(StaticUtilService);
        appFlowService = TestBed.inject(AppFlowService);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EnrollmentReviewComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
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

    describe("enableFormControlsOnSuccess", () => {
        beforeEach(() => {
            component.secondFormGroup = new FormGroup({
                signature: new FormControl({ value: "", disabled: true }, Validators.required),
                privacyNote: new FormControl({ value: false, disabled: true }, Validators.required),
            });
        });

        it("should keep the form control disabled due to empty enrollment and/or empty/undefined AA", () => {
            component.enrollmentsListData = [{}];
            component.enableFormControlsOnSuccess();
            expect(component.secondFormGroup.controls.signature.disabled).toBeTruthy();
            expect(component.secondFormGroup.controls.privacyNote.disabled).toBeTruthy();
        });

        it("should enable the form control when enrollments are available but no AA", () => {
            component.enrollmentsListData = [{ status: "APPROVED" }, { status: "REJECTED" }];
            component.enableFormControlsOnSuccess();
            expect(component.secondFormGroup.controls.signature.enabled).toBeTruthy();
            expect(component.secondFormGroup.controls.privacyNote.enabled).toBeTruthy();
        });

        it("should enable the form control while no enrollment but AA present", () => {
            component.enrollmentsListData = [];
            component.isEnrolled = true;
            component.reviewAflacAlwaysStatus = "APPROVE";
            component.enableFormControlsOnSuccess();
            expect(component.secondFormGroup.controls.signature.enabled).toBeTruthy();
            expect(component.secondFormGroup.controls.privacyNote.enabled).toBeTruthy();
        });

        it("should enable the form control while both enrollment and AA present", () => {
            component.enrollmentsListData = [{ status: "APPROVED" }];
            component.isEnrolled = true;
            component.reviewAflacAlwaysStatus = "APPROVE";
            component.enableFormControlsOnSuccess();
            expect(component.secondFormGroup.controls.signature.enabled).toBeTruthy();
            expect(component.secondFormGroup.controls.privacyNote.enabled).toBeTruthy();
        });
    });

    describe("saveEnrollmentSignatures()", () => {
        beforeEach(() => {
            component.memberId = 1;
            component.groupId = 22222;
            component.secondFormGroup = new FormGroup({
                signature: new FormControl("", Validators.required),
                privacyNote: new FormControl(false, Validators.required),
                hipaaConsent: new FormControl(false, Validators.required),
            });
        });

        it("should not invoke service if the form is invalid", () => {
            const spy = jest.spyOn(enrollmentService, "approveOrRejectPendingEnrollments").mockReturnValue(of({}));
            component.saveEnrollmentSignatures();
            expect(spy).not.toHaveBeenCalled();
        });

        it("should not invoke service if the form is valid but missing enrollment status", () => {
            component.secondFormGroup.setValue({ privacyNote: true, signature: "Test", hipaaConsent: false });
            component.enrollmentsListData = [{}];
            const spy = jest.spyOn(enrollmentService, "approveOrRejectPendingEnrollments").mockReturnValue(of({}));
            component.saveEnrollmentSignatures();
            expect(spy).not.toHaveBeenCalled();
        });

        it("should invoke service with enrollment detail ONLY when the form is valid and enrollment status is present", () => {
            component.secondFormGroup.setValue({ privacyNote: true, signature: "Test", hipaaConsent: false });
            component.enrollmentsListData = [{ status: "APPROVED" }];
            const spy = jest.spyOn(enrollmentService, "approveOrRejectPendingEnrollments").mockReturnValue(of({}));
            component.saveEnrollmentSignatures();
            expect(spy).toHaveBeenCalledWith(1, 22222, { signature: "Test", enrollmentReviews: [], aflacAlwaysReview: null });
        });

        it("should invoke service with AA detail ONLY when the form is valid and AA is present", () => {
            component.secondFormGroup.setValue({ privacyNote: true, signature: "Test", hipaaConsent: false });
            component.enrollmentsListData = [];
            component.paymentData = [
                { enrolledPlans: [{ enrollmentId: 1 }, { enrollmentId: 2 }] },
                { enrolledPlans: [{ enrollmentId: 3 }] },
            ] as unknown as ReviewAflacAlwaysModalData[];
            component.isEnrolled = true;
            component.reviewAflacAlwaysStatus = "APPROVE";
            const spy = jest.spyOn(enrollmentService, "approveOrRejectPendingEnrollments").mockReturnValue(of({}));
            component.saveEnrollmentSignatures();
            expect(spy).toHaveBeenCalledWith(1, 22222, {
                signature: "Test",
                enrollmentReviews: [],
                aflacAlwaysReview: { enrollmentIds: [1, 2, 3], verificationAction: "APPROVE", initial: undefined },
            });
        });

        it("should invoke service with both enrollment and AA detail when the form is valid and both present", () => {
            component.secondFormGroup.setValue({ privacyNote: true, signature: "Test", hipaaConsent: false });
            component.enrollmentsListData = [{ status: "APPROVED" }];
            component.paymentData = [
                { enrolledPlans: [{ enrollmentId: 1 }, { enrollmentId: 2 }] },
                { enrolledPlans: [{ enrollmentId: 3 }] },
            ] as unknown as ReviewAflacAlwaysModalData[];
            component.isEnrolled = true;
            component.reviewAflacAlwaysStatus = "APPROVE";
            const spy = jest.spyOn(enrollmentService, "approveOrRejectPendingEnrollments").mockReturnValue(of({}));
            component.saveEnrollmentSignatures();
            expect(spy).toHaveBeenCalledWith(1, 22222, {
                signature: "Test",
                enrollmentReviews: [],
                aflacAlwaysReview: { enrollmentIds: [1, 2, 3], verificationAction: "APPROVE", initial: undefined },
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

    describe("changeHipaaValue()", () => {
        it("should set isHipaaChecked as true", () => {
            const event = { checked: true } as MatCheckbox;
            component.changeHipaaValue(event);
            expect(component.isHipaaChecked).toBeTruthy();
        });

        it("should set isHipaaChecked as false", () => {
            const event = { checked: false } as MatCheckbox;
            component.changeHipaaValue(event);
            expect(component.isHipaaChecked).toBeFalsy();
        });
    });

    describe("disableHipaaConsent()", () => {
        beforeEach(() => {
            jest.restoreAllMocks();
            jest.resetModules();
            jest.clearAllMocks();
            jest.resetAllMocks();
            component.secondFormGroup = new FormGroup({
                hipaaConsent: new FormControl(),
            });
        });
        it("should form be enabled when username matches and form is defined", () => {
            appFlowService.readHipaaConsentForm = of(["testUserName"]);
            component.userName = "testUserName";
            component.disableHipaaConsent();
            expect(component.memberList).toStrictEqual(["testUserName"]);
            expect(component.secondFormGroup.controls.hipaaConsent.enabled).toBeTruthy();
        });

        it("should form be enabled when username does not matches and form is defined", () => {
            appFlowService.readHipaaConsentForm = of(["testUserName2"]);
            component.userName = "testUserName";
            component.disableHipaaConsent();
            expect(component.memberList).toStrictEqual(["testUserName2"]);
            expect(component.secondFormGroup.controls.hipaaConsent.disabled).toBeTruthy();
        });
    });

    describe("setValidatorsOnBlur()", () => {
        it("should set validatiors in form", () => {
            component.secondFormGroup = new FormGroup({
                hipaaConsent: new FormControl(),
                signature: new FormControl(),
                privacyNote: new FormControl(),
            });
            expect(component.secondFormGroup.controls.signature?.validator).toBeNull();
            expect(component.secondFormGroup.controls.privacyNote?.validator).toBeNull();
            component.setValidatorsOnBlur();
            expect(component.secondFormGroup.controls.signature.hasValidator(Validators.required)).toBeTruthy();
            expect(component.secondFormGroup.controls.privacyNote.hasValidator(Validators.required)).toBeTruthy();
        });
    });
});
