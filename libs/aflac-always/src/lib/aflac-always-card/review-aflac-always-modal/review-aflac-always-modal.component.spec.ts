import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReviewAflacAlwaysModalComponent } from "../review-aflac-always-modal/review-aflac-always-modal.component";
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { Component, CUSTOM_ELEMENTS_SCHEMA, forwardRef, Input } from "@angular/core";
import {
    mockAppFlowService,
    mockEmpoweredModalService,
    mockLanguageService,
    mockMatDialog,
    mockMemberService,
    mockRouter,
    mockStore,
} from "@empowered/testing";
import { Router } from "@angular/router";
import { Configuration, MemberService } from "@empowered/api";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { FormBuilder, FormControl, FormGroup, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators } from "@angular/forms";
import { NgxsModule, Store } from "@ngxs/store";
import { AppFlowService, SharedState } from "@empowered/ngxs-store";
import { of } from "rxjs";
import { ReviewAflacAlwaysModalData } from "libs/api/src/lib/services/member/models/review-aflac-always-modal.data";
import { EmpoweredModalService } from "@empowered/common-services";

const mockData = {
    mpGroupId: 1,
    memberId: 1,
    showEnrollmentMethod: true,
};

@Component({
    selector: "mat-form-field",
    template: "",
})
class MockMatFormFieldComponent {}

@Component({
    selector: "mat-checkbox",
    template: "",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MockMatCheckboxComponent),
            multi: true,
        },
    ],
})
class MockMatCheckboxComponent {
    @Input() value!: string;
    writeValue(): void {}
    registerOnChange(): void {}
    registerOnTouched(): void {}
}

@Component({
    selector: "mat-error",
    template: "",
})
class MockMatErrorComponent {}
const mockPaymentData: ReviewAflacAlwaysModalData[] = [
    {
        enrolledPlans: [
            {
                enrollmentId: 291,
                planName: "Aflac Lump Sum Cancer",
            },
        ],
        paymentMethod: {
            id: 8,
            billingName: {
                firstName: "Sam",
                lastName: "A",
            },
            paymentType: "BANK_DRAFT",
            billingAddress: {
                address1: "123",
                address2: "",
                city: "atlanta",
                state: "GA",
                zip: "30333",
            },
            sameAddressAsHome: true,
            bankName: "AVS Provider",
            accountName: "Sam A",
            accountType: "CHECKING",
            routingNumber: "122199983",
            accountNumberLastFour: "5678",
            tempusTokenIdentityGuid: "6f7f8754-839e-4e4a-9acd-ca689f8a6d67",
        },
        paymentAmount: 18.2,
        paymentFrequency: "MONTHLY",
    },
];

describe("ReviewAflacAlwaysModalComponent", () => {
    let component: ReviewAflacAlwaysModalComponent;
    let fixture: ComponentFixture<ReviewAflacAlwaysModalComponent>;
    let matDialogRef: MatDialogRef<ReviewAflacAlwaysModalComponent>;
    let languageService: LanguageService;
    let matDialog: MatDialog;
    let memberService: MemberService;
    let store: Store;
    let fb: FormBuilder;
    let appFlowService: AppFlowService;
    let empoweredModalService: EmpoweredModalService;

    const mockMatDialogRef = {
        close: () => {},
    } as MatDialogRef<ReviewAflacAlwaysModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ReviewAflacAlwaysModalComponent, MockMatErrorComponent, MockMatCheckboxComponent, MockMatFormFieldComponent],
            imports: [RouterTestingModule, HttpClientTestingModule, ReactiveFormsModule, NgxsModule.forRoot([SharedState]), FormsModule],
            providers: [
                FormBuilder,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockData,
                },
                { provide: Router, useValue: mockRouter },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
                Configuration,
                { provide: AppFlowService, useValue: mockAppFlowService },
                { provide: EmpoweredModalService, useValue: mockEmpoweredModalService },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ReviewAflacAlwaysModalComponent);
        store = TestBed.inject(Store);
        fb = TestBed.inject(FormBuilder);
        memberService = TestBed.inject(MemberService);
        component = fixture.componentInstance;
        matDialogRef = TestBed.inject(MatDialogRef);
        languageService = TestBed.inject(LanguageService);
        appFlowService = TestBed.inject(AppFlowService);
        empoweredModalService = TestBed.inject(EmpoweredModalService);
        matDialog = TestBed.inject(MatDialog);
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("fetchLanguageStrings()", () => {
        it("should initialize languageStrings array", () => {
            const spy = jest.spyOn(languageService, "fetchPrimaryLanguageValues");
            const spy2 = jest.spyOn(languageService, "fetchSecondaryLanguageValues");
            component.languageStrings = null;
            component.secondaryLanguageStrings = null;
            component.fetchLanguageStrings();
            expect(spy).toBeCalled();
            expect(spy2).toBeCalled();
            expect(component.languageStrings).toBeTruthy();
            expect(component.secondaryLanguageStrings).toBeTruthy();
        });
    });

    describe("getPaymentMethods()", () => {
        it("should call getPaymentMethodsForAflacAlways on calling getPaymentMethods", () => {
            const spy = jest.spyOn(memberService, "getPaymentMethodsForAflacAlways").mockReturnValue(of(mockPaymentData));
            component.getPaymentMethods();
            expect(component.paymentData).toBe(mockPaymentData);
            expect(spy).toBeCalled();
        });
    });

    describe("defineReviewForm()", () => {
        it("should call defineReviewForm and initialize form", () => {
            component.reviewForm = null;
            component.defineReviewForm();
            expect(component.reviewForm).toBeTruthy();
            expect(component.reviewForm.controls.initials.invalid).toBeTruthy();
        });
    });

    describe("ngOnInit()", () => {
        it("should call getPaymentMethodsForAflacAlways on calling ngOnInit", () => {
            const spy = jest.spyOn(memberService, "getPaymentMethodsForAflacAlways").mockReturnValue(of(mockPaymentData));
            const spy2 = jest.spyOn(languageService, "fetchPrimaryLanguageValues");
            const spy3 = jest.spyOn(languageService, "fetchSecondaryLanguageValues");
            component.ngOnInit();
            expect(spy).toBeCalled();
            expect(spy2).toBeCalled();
            expect(spy3).toBeCalled();
            expect(component.reviewForm).toBeTruthy();
        });

        it("should updateValidator when reviewCheck form value is updated", () => {
            component.ngOnInit();
            component.reviewForm.controls.reviewCheck.setValue(true);
            expect(component.reviewForm.controls.reviewCheck.hasValidator(Validators.requiredTrue)).toBeTruthy();
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

    describe("rejectAflacAlways()", () => {
        it("should not call app flow service if form is invalid", () => {
            const spy = jest.spyOn(appFlowService, "setReviewAflacStatus");
            const spy2 = jest.spyOn(empoweredModalService, "closeDialog");
            component.reviewForm = new FormGroup({
                reviewCheck: new FormControl(null, Validators.required),
                initials: new FormControl("", Validators.required),
            });
            component.rejectAflacAlways();
            expect(component.reviewForm.valid).toBeFalsy();
            expect(spy).not.toHaveBeenCalled();
            expect(spy2).not.toHaveBeenCalled();
        });

        it("should mark form control as touched and call app flow service if form is valid", () => {
            const spy = jest.spyOn(appFlowService, "setReviewAflacStatus");
            const spy2 = jest.spyOn(empoweredModalService, "closeDialog");
            const spy3 = jest.spyOn(appFlowService, "setReviewAflacInitial");
            component.reviewForm = new FormGroup({
                reviewCheck: new FormControl("", Validators.required),
                initials: new FormControl("", Validators.required),
            });
            component.reviewForm.setValue({ reviewCheck: true, initials: "Test" });
            component.rejectAflacAlways();
            expect(component.reviewForm.controls["reviewCheck"].touched).toBeTruthy();
            expect(component.reviewForm.valid).toBeTruthy();
            expect(spy).toHaveBeenCalled();
            expect(spy2).toHaveBeenCalled();
            expect(spy3).toHaveBeenCalled();
        });

        it("should mark form as touched and set Validators when rejectAflacAlways is called", () => {
            component.reviewForm = null;
            component.defineReviewForm();
            component.rejectAflacAlways();
            expect(component.reviewForm.controls.reviewCheck.hasValidator(Validators.requiredTrue)).toBeTruthy();
            expect(component.reviewForm.controls.reviewCheck.touched).toBeTruthy();
        });
    });

    describe("getLastFourDigit()", () => {
        it("should return last four digit of a number", () => {
            const data = 12345678;
            const result = "5678";
            expect(component.getLastFourDigit(data)).toStrictEqual(result);
        });
    });

    describe("updateReviewCheckFormValidator()", () => {
        it("should mark form as touched and set Validators", () => {
            component.reviewForm = null;
            component.defineReviewForm();
            component.updateReviewCheckFormValidator();
            expect(component.reviewForm.controls.reviewCheck.hasValidator(Validators.requiredTrue)).toBeTruthy();
            expect(component.reviewForm.controls.reviewCheck.touched).toBeTruthy();
        });
    });

    describe("formatAccountType()", () => {
        it("should return formatted account number if parameter is not null", () => {
            const data = "SAVINGS";
            const result = "Savings";
            expect(component.formatAccountType(data)).toStrictEqual(result);
        });

        it("should return account number if parameter is empty", () => {
            const data = "";
            const result = "";
            expect(component.formatAccountType(data)).toStrictEqual(result);
        });
    });

    describe("approveAflacAlways", () => {
        beforeEach(() => {
            jest.restoreAllMocks();
            jest.resetModules();
            jest.clearAllMocks();
            jest.resetAllMocks();
            component.reviewForm = new FormGroup({
                reviewCheck: new FormControl("", Validators.required),
                initials: new FormControl("", Validators.required),
            });
        });
        it("should mark all control as touched on click of Approve button", () => {
            component.approveAflacAlways();
            expect(component.reviewForm.controls["reviewCheck"].touched).toBeTruthy();
            expect(component.reviewForm.valid).toBeFalsy();
        });

        it("should call app flow service service if form is invalid", () => {
            const spy = jest.spyOn(appFlowService, "setReviewAflacStatus");
            component.approveAflacAlways();
            expect(component.reviewForm.valid).toBeFalsy();
            expect(spy).not.toHaveBeenCalled();
        });

        it("should call app flow service service if the response is successful and close the dialog", () => {
            component.paymentData = mockPaymentData;
            const spy1 = jest.spyOn(appFlowService, "setReviewAflacStatus");
            const spy2 = jest.spyOn(empoweredModalService, "closeDialog");
            const spy3 = jest.spyOn(appFlowService, "setReviewAflacInitial");
            component.reviewForm.setValue({ reviewCheck: true, initials: "Test" });
            component.approveAflacAlways();
            expect(component.reviewForm.valid).toBeTruthy();
            expect(spy1).toHaveBeenCalled();
            expect(spy2).toHaveBeenCalled();
            expect(spy3).toHaveBeenCalled();
        });
    });
});
