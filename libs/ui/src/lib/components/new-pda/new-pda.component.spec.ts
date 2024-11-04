import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { AuthenticationService } from "@empowered/api";
import { of, Subscription } from "rxjs";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, Pipe, PipeTransform } from "@angular/core";
import { DatePipe } from "@angular/common";
import { FormBuilder, FormControl } from "@angular/forms";
import { RouterTestingModule } from "@angular/router/testing";
import { NgxMaskPipe } from "ngx-mask";
import { SharedState } from "@empowered/ngxs-store";
import { NewPdaComponent } from "./new-pda.component";
import { MockMonSpinnerComponent } from "@empowered/testing";
import { MatMenuModule } from "@angular/material/menu";
import { MatFooterRowDef, MatHeaderRowDef, MatRowDef } from "@angular/material/table";
import { StoreModule } from "@ngrx/store";

const mockAuthenticationService = {
    login: (
        portal: string,
        credential?: {
            username: string;
            password: string;
        },
        mpGroup?: string,
    ) => of({ user: { username: credential?.username } }),
} as AuthenticationService;

const mockDialogRef = {
    close: () => {},
} as MatDialogRef<NewPdaComponent>;

@Pipe({
    name: "[date]",
})
class MockDatePipe implements PipeTransform {
    transform(value: any, ...args: any[]) {
        return String(value);
    }
}

class MockMaskPipe implements PipeTransform {
    transform(value: any, ...args: any[]) {
        return String(value);
    }
}
describe("NewPdaComponent", () => {
    let component: NewPdaComponent;
    let fixture: ComponentFixture<NewPdaComponent>;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [NewPdaComponent, MockMonSpinnerComponent, MatHeaderRowDef, MatRowDef, MatFooterRowDef],
            providers: [
                { provide: AuthenticationService, useValue: mockAuthenticationService },
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: DatePipe, useClass: MockDatePipe },
                { provide: NgxMaskPipe, useClass: MockMaskPipe },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {
                        enrollmentType: "FACE_TO_FACE",
                    },
                },
                FormBuilder,
            ],
            imports: [
                NgxsModule.forRoot([SharedState]),
                HttpClientTestingModule,
                RouterTestingModule,
                MatMenuModule,
                StoreModule.forRoot({}),
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(NewPdaComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            core: {
                regex: { sampleRegex: "Sample_Validation_Regex" },
                configs: [
                    {
                        name: "config_name",
                        value: "config_value",
                        dataType: "config_datatype",
                    },
                ],
            },
        });
        fixture.detectChanges();
    });

    describe("PdaPrComponent", () => {
        beforeEach(() => {
            component.showPRStateForm = false;
        });
        it("should create", () => {
            expect(component).toBeTruthy();
        });

        describe("closePRPdaForm()", () => {
            it("should close the PDA form", () => {
                const dialogSpy = jest.spyOn(component["dialogRef"], "close");
                component.closePdaForm();
                expect(dialogSpy).toHaveBeenCalled();
            });
        });

        describe("definePdaForm", () => {
            it("prPDAForm should be defined", () => {
                component.definePdaForm();
                expect(component.pdaForm).toBeTruthy();
            });
        });

        describe("checkForErrorField()", () => {
            beforeEach(() => {
                component.definePdaForm();
                component.pdaForm.addControl("pdaPolicy", new FormControl());
                component.dataSource.data = [{ policyName: "Sample policy name 1" }];
                component.dataSource2.data = [{ policyName: "Sample Policy name 2" }];
            });
            it("should be false for no errors", () => {
                expect(component.checkForErrorField()).toBe(true);
            });
        });

        describe("checkForPinEnrollment", () => {
            beforeEach(() => {
                component.enrollmentMethod = "CALL_CENTER";
                component.definePdaForm();
            });
            it("PIN control should be present", () => {
                expect(component.showPin).toBe(true);
            });
        });

        describe("checkAflacCondition", () => {
            describe("Headset Enrollment", () => {
                beforeEach(() => {
                    component.enrollmentMethod = "HEADSET";
                    component.definePdaForm();
                });
                it("Applicant Signature #1 and #2 should be disabled, if there are no products added", () => {
                    component.hasOldPostTax = false;
                    component.hasOldPreTax = false;
                    component.hasNewPreTax = false;
                    component.hasNewPostTax = false;
                    component.checkAflacCondition();
                    expect(component.isSignatureEnabled).toBe(false);
                    expect(component.isSignature2Enabled).toBe(false);
                    expect(component.pdaForm.controls.signature.disabled).toBe(true);
                    expect(component.pdaForm.controls.signature2.disabled).toBe(true);
                });
                it("Applicant Signature #1 nd #2 should be disabled, if old tax and new tax has values", () => {
                    component.hasOldPostTax = true;
                    component.hasOldPreTax = true;
                    component.hasNewPreTax = true;
                    component.hasNewPostTax = true;
                    component.checkAflacCondition();
                    expect(component.isSignatureEnabled).toBe(false);
                    expect(component.isSignature2Enabled).toBe(false);
                    expect(component.pdaForm.controls.signature.disabled).toBe(true);
                    expect(component.pdaForm.controls.signature2.disabled).toBe(true);
                });
            });
            describe("Face to Face Enrollment", () => {
                beforeEach(() => {
                    component.enrollmentMethod = "FACE_TO_FACE";
                    component.definePdaForm();
                });
                it("Applicant Signature #1 should be disabled and #2 should be enabled, if there are no enrollments", () => {
                    component.hasOldPostTax = false;
                    component.hasOldPreTax = false;
                    component.hasNewPreTax = false;
                    component.hasNewPostTax = false;
                    component.checkAflacCondition();
                    expect(component.isSignatureEnabled).toBe(false);
                    expect(component.isSignature2Enabled).toBe(true);
                    expect(component.pdaForm.controls.signature.disabled).toBe(true);
                    expect(component.pdaForm.controls.signature2.disabled).toBe(false);
                });
                it("Applicant Signature #1 should be enabled and #2 should be disabled, if there are items with New Pre and Post Tax prices", () => {
                    component.hasOldPostTax = false;
                    component.hasOldPreTax = false;
                    component.hasNewPreTax = true;
                    component.hasNewPostTax = true;
                    component.checkAflacCondition();
                    expect(component.isSignatureEnabled).toBe(true);
                    expect(component.isSignature2Enabled).toBe(false);
                    expect(component.pdaForm.controls.signature.disabled).toBe(false);
                    expect(component.pdaForm.controls.signature2.disabled).toBe(true);
                });
            });
        });

        describe("disablePdaForm()", () => {
            beforeEach(() => {
                component.enrollmentMethod = "HEADSET";
                component.definePdaForm();
            });
            it("should disable PdaForm", () => {
                component.disablePdaForm();
                expect(component.pdaForm.controls.ssn.disabled).toBe(true);
                expect(component.pdaForm.controls.employerName.disabled).toBe(true);
                expect(component.pdaForm.controls.employerPayrollAccountNumber.disabled).toBe(true);
                expect(component.pdaForm.controls.firstName.disabled).toBe(true);
                expect(component.pdaForm.controls.lastName.disabled).toBe(true);
                expect(component.pdaForm.controls.mi.disabled).toBe(true);
            });
        });

        describe("checkForHeadSetEnrollment()", () => {
            beforeEach(() => {
                component.enrollmentMethod = "HEADSET";
                component.definePdaForm();
            });
            it("should check for Headset enrollment", () => {
                component.checkForHeadSetEnrollment();
                expect(component.isHeadset).toBe(true);
                expect(component.pdaForm.controls.signature.disabled).toBe(true);
                expect(component.pdaForm.controls.signature2.disabled).toBe(true);
                expect(component.isSignatureEnabled).toBe(false);
                expect(component.isSignature2Enabled).toBe(false);
            });
        });

        describe("ngOnDestroy()", () => {
            it("should unsubscribe from all subscriptions", () => {
                const subscriptionSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
                component.ngOnDestroy();
                expect(subscriptionSpy).toHaveBeenCalled();
            });
        });
    });
});
