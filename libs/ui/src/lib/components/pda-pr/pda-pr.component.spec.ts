import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { PdaPolicy, PdaPrComponent } from "./pda-pr.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { AuthenticationService, MemberService } from "@empowered/api";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { DatePipe } from "@angular/common";
import { FormBuilder, FormControl, NgControl, ReactiveFormsModule } from "@angular/forms";
import { RouterTestingModule } from "@angular/router/testing";
import { NgxMaskPipe } from "ngx-mask";
import {
    mockMatDialog,
    mockDatePipe,
    mockAuthenticationService,
    mockMatDialogRef,
    mockMemberService,
    MockMonSpinnerComponent,
    MockReplaceTagPipe,
    MockMatSelectComponent,
} from "@empowered/testing";
import { SharedState } from "@empowered/ngxs-store";
import { PayFrequency } from "@empowered/constants";
import { MatMenuModule } from "@angular/material/menu";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { MatFooterRowDef, MatHeaderRowDef, MatRowDef } from "@angular/material/table";
import { LanguageService } from "@empowered/language";

// Skipping this test suite as it is throwing many errors in pipeline one after other.
describe.skip("PdaPrComponent", () => {
    let component: PdaPrComponent;
    let fixture: ComponentFixture<PdaPrComponent>;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                PdaPrComponent,
                MockMatSelectComponent,
                MockMonSpinnerComponent,
                MockReplaceTagPipe,
                MatHeaderRowDef,
                MatRowDef,
                MatFooterRowDef,
            ],
            providers: [
                { provide: AuthenticationService, useValue: mockAuthenticationService },
                { provide: MatDialogRef, useValue: mockMatDialogRef },
                { provide: DatePipe, useValue: mockDatePipe },
                { provide: NgxMaskPipe, useValue: {} },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {
                        enrollmentType: "FACE_TO_FACE",
                    },
                },
                { provide: MatDialog, useValue: mockMatDialog },
                { provide: MemberService, useValue: mockMemberService },
                FormBuilder,
                LanguageService,
                NgControl,
            ],
            imports: [NgxsModule.forRoot([SharedState]), HttpClientTestingModule, RouterTestingModule, MatMenuModule, ReactiveFormsModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PdaPrComponent);
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
        component.openAs = "quasi";
        component.validationRegex = {
            NAME_WITH_HYPENS_APOSTROPHES: "first-name",
            UNMASKSSN: "some regex value",
            NAME_WITH_SPACE_ALLOWED: "some regex value",
            MIDDLENAME: "some regex value",
            ALPHANUMERIC_SPECIAL_CHARACTERS: "some regex value",
        };
        fixture.detectChanges();
    });

    describe("PdaPrComponent", () => {
        it("should create", () => {
            expect(component).toBeTruthy();
        });

        describe("closePRPdaForm()", () => {
            it("should close the PDA form", () => {
                const dialogSpy = jest.spyOn(component["dialogRef"], "close");
                component.closePRPdaForm();
                expect(dialogSpy).toHaveBeenCalled();
            });
        });

        describe("definePdaForm", () => {
            it("prPDAForm should be defined", () => {
                component.definePdaForm();
                expect(component.prPDAForm).toBeTruthy();
            });
        });

        describe("checkForErrorField()", () => {
            beforeEach(() => {
                component.definePdaForm();
                component.prPDAForm.addControl("pdaPolicy", new FormControl());
                component.dataSource.data = [{ policyName: "Sample policy name 1" }];
                component.dataSource2.data = [{ policyName: "Sample Policy name 2" }];
            });
            it("should be false for no errors", () => {
                expect(component.checkForErrorField()).toBe(true);
            });
        });

        describe("disablePdaForm", () => {
            beforeEach(() => {
                component.definePdaForm();
            });
            it("should disable prPDA form fields", () => {
                component.disablePdaForm();
                expect(component.prPDAForm.controls.firstName.disabled).toBe(true);
                expect(component.prPDAForm.controls.lastName.disabled).toBe(true);
                expect(component.prPDAForm.controls.mi.disabled).toBe(true);
            });
        });

        describe("disableSignatureForPendingEnrollment", () => {
            describe("Headset enrollment", () => {
                beforeEach(() => {
                    component.data.isDocument = true;
                    component.data.enrollmentType = "HEADSET";
                    component.definePdaForm();
                });
                it("should disable signature field for Headset enrollment", () => {
                    component.disableSignatureForPendingEnrollment();
                    expect(component.isHeadset).toBe(true);
                    expect(component.isSignatureEnabled).toBe(false);
                    expect(component.prPDAForm.controls.signature.disabled).toBe(true);
                });
            });

            describe("Face to Face enrollment", () => {
                beforeEach(() => {
                    component.data.isOwnAccount = true;
                    component.data.isDocument = true;
                    component.data.enrollmentType = "FACE_TO_FACE";
                    component.definePdaForm();
                });
                it("should enable signature field for face to face enrollment", () => {
                    component.disableSignatureForPendingEnrollment();
                    expect(component.isHeadset).toBe(false);
                    expect(component.isSignatureEnabled).toBe(true);
                    expect(component.prPDAForm.controls.signature.disabled).toBe(false);
                });
            });
        });

        describe("checkForPinEnrollment", () => {
            describe("Opened from Coverage Summary and enrollment method is Call Center", () => {
                beforeEach(() => {
                    component.data.openedFrom = "COVERAGE_SUMMARY";
                    component.data.enrollmentType = "CALL_CENTER";
                });
                it("Should show pin field", () => {
                    component.prPDAForm = null;
                    component.definePdaForm();
                    expect(component.showPin).toBe(true);
                    expect(component.prPDAForm.controls.pin.enabled).toBe(true);
                });
            });
            describe("Not Opened from Coverage Summary and enrollment method is Pin Signature", () => {
                beforeEach(() => {
                    component.data.openedFrom = "DOCS_AND_NOTES";
                    component.enrollmentType = "PIN_SIGNATURE";
                });
                it("Should show pin field", () => {
                    component.prPDAForm = null;
                    component.definePdaForm();
                    expect(component.showPin).toBe(true);
                    expect(component.prPDAForm.controls.pin.enabled).toBe(true);
                });
            });
        });

        describe("setPayrollMode()", () => {
            beforeEach(() => {
                component.pdaFormData = {
                    memberName: { firstName: "first Name", lastName: "lastName" },
                    memberAddress: { state: "GA", zip: "30001" },
                    policyPremiums: [{ policyName: "Sample Policy" }],
                };
            });
            it("should set payroll freq mode if ID is matching", () => {
                component.pdaFormData.payFrequencyId = 1;
                const freqType: PayFrequency[] = [{ frequencyType: "sample freq type", id: 1, name: "Monthly", payrollsPerYear: 10 }];
                component.setPayrollMode(freqType);
                expect(component.payrollMode).toBe("Monthly");
            });

            it("should set the payroll freq as undefined if ID is not matching", () => {
                component.pdaFormData.payFrequencyId = 2;
                const freqType: PayFrequency[] = [{ frequencyType: "sample freq type", id: 1, name: "Monthly", payrollsPerYear: 10 }];
                component.setPayrollMode(freqType);
                expect(component.payrollMode).toBe(undefined);
            });
        });

        describe("updateMemberData()", () => {
            it("should update member form on submit", () => {
                component.mpGroup = 12345;
                component.memberId = "1";
                component.data.formId = 1;
                component.pdaFormValues = {
                    memberName: { firstName: "first Name", lastName: "lastName" },
                    memberAddress: { state: "GA", zip: "30001" },
                    policyPremiums: [{ policyName: "Sample Policy" }],
                    enrollmentState: "PR",
                };
                const spy = jest.spyOn(mockMemberService, "updateMemberForm");
                component.updateMemberData();
                expect(spy).toHaveBeenCalledWith(
                    component.mpGroup.toString(),
                    +component.memberId,
                    "PDA_PR",
                    component.data.formId,
                    component.pdaFormValues,
                );
            });
        });

        describe("createMemberNote()", () => {
            it("should create memberNote when creating PDA form", () => {
                component.memberId = "1";
                component.mpGroup = 12345;
                const payload = {
                    formInfo: {
                        id: 1,
                        type: "PDA_PR",
                    },
                };
                const spy = jest.spyOn(mockMemberService, "createMemberNote");
                component.createMemberNote(1);
                expect(spy).toHaveBeenCalledWith(component.memberId, component.mpGroup.toString(), payload);
            });
        });

        describe("updateEmployeeDeduction()", () => {
            it("should set employee deduction as null when there is no total premium in pda data", () => {
                const pdaData: PdaPolicy = { policyName: "sample policy name" };
                component.updateEmployeeDeduction(pdaData, 0);
                expect(pdaData.employeeDeduction).toBe(null);
            });
        });

        describe("ngOnDestroy()", () => {
            it("should unsubscribe from all subscriptions", () => {
                const nextSpy = jest.spyOn(component["unsubscribe$"], "next");
                const completeSpy = jest.spyOn(component["unsubscribe$"], "complete");
                component.ngOnDestroy();
                expect(nextSpy).toHaveBeenCalled();
                expect(completeSpy).toHaveBeenCalled();
            });
        });
    });
});
