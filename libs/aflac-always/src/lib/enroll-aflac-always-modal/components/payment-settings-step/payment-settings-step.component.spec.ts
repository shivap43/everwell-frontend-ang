import { ComponentFixture, TestBed } from "@angular/core/testing";
import { PaymentSettingsStepComponent } from "./payment-settings-step.component";
import { provideMockStore } from "@ngrx/store/testing";
import { of, throwError } from "rxjs";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { Store, NgxsModule } from "@ngxs/store";
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { DeductionFrequencyComponent } from "./components/deduction-frequency/deduction-frequency.component";
import { PaymentDateComponent } from "./components/payment-date/payment-date.component";
import { EsignatureComponent } from "./components/esignature/esignature.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MatInputModule } from "@angular/material/input";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, Pipe, PipeTransform } from "@angular/core";
import { DatePipe, TitleCasePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { Router } from "@angular/router";
import { mockMatDialog, mockMatDialogData, mockDatePipe, mockRouter, mockMatDialogRef, MockComponent } from "@empowered/testing";
import { AFLAC_ALWAYS_FEATURE_KEY } from "@empowered/ngrx-store/ngrx-states/aflac-always/aflac-always.reducer";
import { AflacAlwaysState } from "@empowered/ngrx-store/ngrx-states/aflac-always";
import { EnrollmentMethod } from "@empowered/constants";
import { AflacService } from "@empowered/api";

@Pipe({
    name: "titlecase",
})
class MockTitleCasePipe implements PipeTransform {
    transform(value: string) {
        return "";
    }
}

const mockedInitialState = {
    [AFLAC_ALWAYS_FEATURE_KEY]: {
        ...AflacAlwaysState.initialState,
        enrollmentIds: [1],
        payFrequency: "MONTHLY",
        enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
        subscriberPaymentId: 1,
    },
};

describe("PaymentSettingsStepComponent", () => {
    let component: PaymentSettingsStepComponent;
    let fixture: ComponentFixture<PaymentSettingsStepComponent>;
    let aflacService: AflacService;
    let fb: FormBuilder;
    let router: Router;

    const mockStore = {
        select: () => of([]),
        selectSnapshot: () => "",
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                PaymentSettingsStepComponent,
                DeductionFrequencyComponent,
                PaymentDateComponent,
                EsignatureComponent,
                MockTitleCasePipe,
                MockComponent,
            ],
            imports: [
                HttpClientTestingModule,
                NgxsModule.forRoot([]),
                FormsModule,
                ReactiveFormsModule,
                MatFormFieldModule,
                MatSelectModule,
                MatDatepickerModule,
                MatSelectModule,
                MatNativeDateModule,
                BrowserAnimationsModule,
                MatInputModule,
                MatCheckboxModule,
                HttpClientTestingModule,
                RouterTestingModule.withRoutes([{ path: "tpi/coverage-summary", component: MockComponent }]),
            ],
            providers: [
                { provide: MatDialogRef, useValue: mockMatDialogRef },
                { provide: Store, useValue: mockStore },
                { provide: MatDialog, useValue: mockMatDialog },
                { provide: MAT_DIALOG_DATA, useValue: mockMatDialogData },
                { provide: DatePipe, useValue: mockDatePipe },
                { provide: Router, useValue: mockRouter },
                { provide: TitleCasePipe, useValue: MockTitleCasePipe },
                FormBuilder,
                provideMockStore({ initialState: mockedInitialState }),
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PaymentSettingsStepComponent);
        fb = TestBed.inject(FormBuilder);
        component = fixture.componentInstance;
        aflacService = TestBed.inject(AflacService);
        router = TestBed.inject(Router);
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onDeductionFrequencyChange()", () => {
        it("should set the pay frequency value", () => {
            const value = "MONTHLY";
            component.onDeductionFrequencyChange(value);
            expect(component.formGroup.controls[component.formKeys.deductionFrequency].value).toBe("MONTHLY");
        });
    });

    describe("onPaymentDateChange()", () => {
        it("should set payment day", () => {
            const spy1 = jest.spyOn(component["ngrxStore"], "dispatch");
            component.onPaymentDateChange("22");
            expect(spy1).toBeCalledTimes(1);
            expect(component.formGroup.controls.paymentDate.value).toBe("22");
        });
    });

    describe("onCheckboxChange()", () => {
        it("should set checkbox", () => {
            component.onCheckboxChange(false);
            expect(component.formGroup.controls.paymentAcknowledgement.value).toBeFalsy();

            component.onCheckboxChange(false);
            expect(component.formGroup.controls.paymentAcknowledgement.value).toBeFalsy();

            component.onCheckboxChange(true);
            expect(component.formGroup.controls.paymentAcknowledgement.value).toBeTruthy();
        });
    });

    describe("onSignatureChange()", () => {
        it("should set esignature value", () => {
            component.isFaceToFace = true;
            component.formGroup.addControl(component.formKeys.eSignature, fb.control(null, [Validators.required]));
            const spy1 = jest.spyOn(component["ngrxStore"], "dispatch");
            component.onSignatureChange("Test Sign");
            expect(spy1).toBeCalledTimes(1);
            expect(component.formGroup.controls[component.formKeys.eSignature].value).toBe("Test Sign");
        });

        it("should set the pin signature value", () => {
            const value = "testPin";
            component.isPinSignature = true;
            component.isFaceToFace = false;
            component.formGroup.addControl(
                component.formKeys.pinSignature,
                fb.control(null, [
                    Validators.required,
                    Validators.maxLength(26),
                    Validators.minLength(3),
                    Validators.pattern(component.validationRegex.ALPHANUMERIC_WITH_UNDERSCORE),
                ]),
            );
            component.onSignatureChange(value);
            expect(component.formGroup.controls[component.formKeys.pinSignature].value).toBe("testPin");
        });
    });

    describe("onSaveAndSubmit()", () => {
        beforeEach(() => {
            component.isFaceToFace = true;
            component.formGroup.addControl(component.formKeys.eSignature, fb.control(null, [Validators.required]));
            const controls = component.formGroup.controls;
            // eslint-disable-next-line guard-for-in
            for (const control in controls) {
                controls[control].clearValidators();
                controls[control].updateValueAndValidity();
            }
            component.formGroup.updateValueAndValidity();
        });

        it("should submit the form successfully", () => {
            jest.spyOn(aflacService, "createAflacAlways").mockReturnValue(of([]));
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.onSaveAndSubmit();
            expect(component.apiError).toBeFalsy();
            expect(spy1).toBeCalledTimes(1);
        });

        it("should throw error", () => {
            const errorPayload = {
                status: 400,
                statusText: "Bad Request",
                error: { status: 400, code: "badParameter", message: "Invalid payload." },
            };
            jest.spyOn(aflacService, "createAflacAlways").mockReturnValue(throwError(errorPayload));
            component.onSaveAndSubmit();
            expect(component.apiError).toBeTruthy();
        });

        it("should navigate to tpi coverage summary page if isModalMode is true", () => {
            component.isModalMode = true;
            fixture.detectChanges();
            const spy1 = jest.spyOn(router, "navigate");
            jest.spyOn(aflacService, "createAflacAlways").mockReturnValue(of([]));
            component.onSaveAndSubmit();
            expect(spy1).toHaveBeenCalledWith(["tpi/coverage-summary"]);
        });

        describe("ngOnDestroy()", () => {
            it("should clean up subscriptions", () => {
                const spy = jest.spyOn(component["unsubscribe$"], "next");
                const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
                fixture.destroy();
                expect(spy).toBeCalledTimes(1);
                expect(spy2).toBeCalledTimes(1);
            });
        });
    });
});
