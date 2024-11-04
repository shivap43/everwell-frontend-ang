import { Component, CUSTOM_ELEMENTS_SCHEMA, Directive, forwardRef, Input, Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { Observable, Subject } from "rxjs";
import { LanguageService } from "@empowered/language";
import { AddCustomerComponent } from "./add-customer.component";
import { ControlValueAccessor, FormBuilder, FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { DatePipe, TitleCasePipe } from "@angular/common";
import { MatDialogConfig, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ComponentType } from "@angular/cdk/portal";
import { of } from "rxjs";
import { AccountService, AuthenticationService, MemberService, StaticService } from "@empowered/api";
import { Configurations, CountryState, Vocabulary, Relations, MemberContact } from "@empowered/constants";
import { MatDatepicker } from "@angular/material/datepicker";
import { EnrollmentMethodState, SharedState, SharedStateModel, StaticUtilService } from "@empowered/ngxs-store";
import { HttpErrorResponse } from "@angular/common/http";
import { mockMemberService, MockReplaceTagPipe, mockMatDialogRef } from "@empowered/testing";
@Component({
    template: "",
    selector: "empowered-mon-spinner",
})
class MockMonSpinnerComponent {
    @Input() enableSpinner: boolean;
}

@Component({
    selector: "mat-dialog-content",
    template: "",
})
class MockDialogContentComponent {}

@Component({
    selector: "mat-option",
    template: "",
})
class MockMatOptionComponent {
    @Input() value!: string;
}

@Component({
    selector: "mat-label",
    template: "",
})
class MockMatLabelComponent {}

@Component({
    selector: "mat-form-field",
    template: "",
})
class MockMatFormFieldComponent {}

@Component({
    selector: "mat-vertical-stepper",
    template: "",
})
class MockMatVerticalStepperComponent {
    @Input() selectedIndex!: boolean;
}

@Component({
    selector: "mat-step",
    template: "",
})
class MockMatStepComponent {
    @Input() selectedIndex!: boolean;
    @Input() completed!: number;
    @Input() stepControl!: FormGroup;
}

@Component({
    selector: "mat-select",
    template: "",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MockMatSelectComponent),
            multi: true,
        },
    ],
})
class MockMatSelectComponent implements ControlValueAccessor {
    @Input() placeholder!: string;
    writeValue(): void {}
    registerOnChange(): void {}
    registerOnTouched(): void {}
}

@Component({
    selector: "mat-error",
    template: "",
})
class MockMatErrorComponent {
    @Input() language!: string;
}

@Component({
    selector: "mat-datepicker",
    template: "",
})
class MockMatDatepickerComponent {}

@Component({
    selector: "mat-datepicker-toggle",
    template: "",
})
class MockMatDatepickerToggleComponent {
    @Input() for!: string;
}

@Directive({
    selector: "[matDatepicker]",
})
class MockMatDatePickerDirective {
    @Input() matDatepicker!: MatDatepicker<unknown>;
}

@Directive({
    selector: "[hasPermission]",
})
class MockHasPermissionDirective {
    @Input("hasPermission") permission: string;
}

@Pipe({
    name: "[DatePipe]",
})
class MockDatePipe implements PipeTransform {
    transform(value: any): string {
        return `${value}`;
    }
}
const mockDatePipe = new MockDatePipe();

const mockMatDialog = {
    open: (component: ComponentType<any>, config?: MatDialogConfig) => ({
        afterClosed: () => of(undefined),
    }),
    close: (response: string) => null,
};

@Component({
    selector: "mon-icon",
    template: "",
})
class MockMonIconComponent {
    @Input() iconSize!: string;
}
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
    selector: "mat-radio-group",
    template: "",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MockMatRadioGroupComponent),
            multi: true,
        },
    ],
})
class MockMatRadioGroupComponent implements ControlValueAccessor {
    writeValue(): void {}
    registerOnChange(): void {}
    registerOnTouched(): void {}
}

@Component({
    selector: "mat-radio-button",
    template: "",
})
class MockMatRadioButtonComponent {
    @Input() value!: string;
}

@Component({
    selector: "mat-hint",
    template: "",
})
class MockMatHintComponent {}

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
    fetchPrimaryLanguageValue: (key: string) => key,
} as LanguageService;

const mockRouteParams = new Subject<Params>();
const mockRoute = {
    snapshot: { params: mockRouteParams.asObservable() },
    parent: { parent: { parent: { parent: { params: mockRouteParams.asObservable() } } } },
};
const mockRouter = {
    url: "some route",
};

const MOCK_REGEX_DATA: SharedStateModel = {
    regex: { NAME_WITH_SPACE_ALLOWED: "value" },
    portal: "portal",
};

const mockStaticService = {
    getConfigurations: (names: string, mpGroup?: number, partnerId?: string) => of([] as Configurations[]),
    getStates: () => of([] as CountryState[]),
    getGenders: () => of(["male", "female", "others"]),
} as StaticService;

const mockAccountService = {
    getVocabularies: (mpGroup: string) => of(["language1", "language2"]),
    getDependentRelations: (mpGroup: number) => of([] as Relations[]),
} as AccountService;

const mockStaticUtilService = {
    cacheConfigValue: (configName: string) => of("some-config-value"),
    cacheConfigEnabled: (configName: string) => of(true),
    hasPermission: (permission: string) => of(true),
    cacheConfigs: (configNames: string[]) => of([{ name: "config-name", value: "config-value", dataType: "string" }]),
    fetchConfigs: (configNames: string[], mpGroup?: number) => of([{ name: "config-name", value: "config-value", dataType: "string" }]),
} as StaticUtilService;

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}

describe("AddCustomerComponent", () => {
    let component: AddCustomerComponent;
    let fixture: ComponentFixture<AddCustomerComponent>;
    let store: Store;
    let memberService: MemberService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                AddCustomerComponent,
                MockMonSpinnerComponent,
                MockHasPermissionDirective,
                MockDialogContentComponent,
                MockMatLabelComponent,
                MockMatFormFieldComponent,
                MockMonIconComponent,
                MockMatCheckboxComponent,
                MockMatVerticalStepperComponent,
                MockMatStepComponent,
                MockMatErrorComponent,
                MockMatDatepickerToggleComponent,
                MockMatDatepickerComponent,
                MockMatSelectComponent,
                MockMatOptionComponent,
                MockMatDatePickerDirective,
                MockMatRadioGroupComponent,
                MockMatRadioButtonComponent,
                MockMatHintComponent,
                MockReplaceTagPipe,
                MockRichTooltipDirective,
            ],
            providers: [
                FormBuilder,
                TitleCasePipe,
                {
                    provide: ActivatedRoute,
                    useValue: mockRoute,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                RouterTestingModule,
                { provide: DatePipe, useValue: mockDatePipe },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {
                        mpGroup: 111,
                    },
                },
                {
                    provide: StaticService,
                    useValue: mockStaticService,
                },
                {
                    provide: AuthenticationService,
                    useValue: {},
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
            ],
            imports: [
                NgxsModule.forRoot([SharedState, EnrollmentMethodState]),
                MatDialogModule,
                HttpClientTestingModule,
                ReactiveFormsModule,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            core: {
                regex: { NAME_WITH_SPACE_ALLOWED: "value" },
                portal: "portal",
            },
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AddCustomerComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        memberService = TestBed.inject(MemberService);
        jest.spyOn(console, "warn").mockImplementation(jest.fn());
        fixture.detectChanges();
        // Fix for subscription/promises leak within test file
        // Remove After fix.
        jest.useFakeTimers();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe("dobRequired()", () => {
        it("should check if birthDate has value", () => {
            component.isLoading = false;
            component.employeeForm.setValue({
                firstName: "firstname",
                lastName: "lastname",
                birthDate: "",
                genderName: "",
                address1: "",
                address2: "",
                city: "",
                state: "",
                zip: "",
                emailAddress: "",
                phoneNumber: "",
                preferredLanguage: Vocabulary.ENGLISH,
                deliveryPreferance: "",
                sendTo: "",
                phoneType: "",
                cellType: false,
            });
            component.dobRequired();
            expect(component.employeeForm.invalid).toBeTruthy();
        });
    });

    describe("emailAdressRequired()", () => {
        it("should set email error when delivery preference is electronic", () => {
            component.employeeForm.patchValue({
                deliveryPreferance: "Electronic",
                emailAddress: "",
            });
            component.employeeForm.controls.emailAddress.setErrors({ required: true });
            component.emailAdressRequired();
            expect(component.employeeForm.controls.emailAddress.invalid).toBeTruthy();
        });
        it("should allow to submit form without email if delivery preference is paper", () => {
            component.employeeForm.patchValue({
                deliveryPreferance: "Paper",
                emailAddress: "",
            });
            component.employeeForm.controls.emailAddress.setErrors(null);
            component.emailAdressRequired();
            expect(component.employeeForm.controls.emailAddress.valid).toBeTruthy();
        });
        it("should allow to submit form with email if delivery preference is electronic", () => {
            component.employeeForm.patchValue({
                deliveryPreferance: "Electronic",
                emailAddress: "email",
            });
            component.employeeForm.controls.emailAddress.setErrors(null);
            component.emailAdressRequired();
            expect(component.employeeForm.controls.emailAddress.valid).toBeTruthy();
        });
    });

    describe("onPreferenceChange()", () => {
        beforeEach(() => {
            component.isEmailOptional = true;
        });
        it("should display email mandatory tooltip when delivery preference is Electronic", () => {
            const deliveryPreference = {
                value: "Electronic",
            };
            component.onPreferenceChange(deliveryPreference);
            expect(component.isEmailOptional).toBeFalsy();
            expect(component.isPaper).toBeFalsy();
        });
        it("should display email optional tooltip when delivery preference is not Electronic", () => {
            const deliveryPreference = {};
            component.employeeForm.patchValue({
                deliveryPreferance: "Paper",
            });
            component.onPreferenceChange(deliveryPreference);
            expect(component.isPaper).toBeTruthy();
        });
    });

    describe("closeFormOnSuccess()", () => {
        it("should close the dialog", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.closeFormOnSuccess("111");
            expect(spy1).toBeCalledWith("111");
        });
    });

    describe("nextAfterVerifyAdress()", () => {
        it("should call saveMemberContact function", () => {
            const spy1 = jest.spyOn(component, "saveMemberContact");
            component.nextAfterVerifyAdress();
            expect(spy1).toBeCalledTimes(1);
        });
    });

    describe("closeModal()", () => {
        it("should close address-verify modal", () => {
            component.openAddressModal = false;
            component.changeStepper = 1;
            component.addressResp = false;
            component.closeModal();
            expect(component.openAddressModal).toBeFalsy();
            expect(component.changeStepper).toEqual(1);
            expect(component.addressResp).toBeFalsy();
        });
    });

    describe("closeForm()", () => {
        it("should close mat dialog 'AddCustomerComponent'", () => {
            const spy = jest.spyOn(component["dialogRef"], "close");
            component.closeForm();
            expect(spy).toBeCalled();
        });
    });

    describe("closeFormOnSuccess()", () => {
        it("should close mat dialog 'AddCustomerComponent' with memberId", () => {
            const spy = jest.spyOn(component["dialogRef"], "close");
            component.closeFormOnSuccess("12819");
            expect(spy).toBeCalledWith("12819");
        });
    });

    describe("phoneNumberValid()", () => {
        it("should disable 'is mobile number' checkbox if phone number is invalid and empty", () => {
            component.employeeForm.controls.phoneNumber.setValue("");
            component.employeeForm.controls.phoneNumber.markAsTouched();
            component.phoneNumberValid();
            expect(component.disableCheckBox).toBe(true);
        });

        it("should enable 'is mobile number' checkbox if phone number is valid", () => {
            component.employeeForm.controls.phoneNumber.setValue("987-35-3537");
            component.employeeForm.controls.phoneNumber.markAsTouched();
            component.phoneNumberValid();
            expect(component.disableCheckBox).toBe(false);
        });
    });

    describe("getEmployeeFormErrorMessage()", () => {
        beforeEach(() => {
            component.employeeForm.controls.genderName.reset();
            component.employeeForm.controls.state.reset();
        });

        it("should return 'selection required' error string if control is invalid and a dropdown", () => {
            component.employeeForm.controls.genderName.setValue("");
            component.employeeForm.controls.genderName.markAsTouched();
            expect(component.getEmployeeFormErrorMessage("genderName")).toBe("primary.portal.common.selectionRequired");
        });

        it("should return 'required field' error string if control is invalid and not a dropdown", () => {
            component.employeeForm.controls.birthDate.setValue("");
            component.employeeForm.controls.birthDate.markAsTouched();
            expect(component.getEmployeeFormErrorMessage("birthDate")).toBe("primary.portal.common.requiredField");
        });

        it("should return '' error string if control is valid", () => {
            component.employeeForm.controls.emailAddress.setValue("hellotestingtesting@yahoo.com");
            component.employeeForm.controls.emailAddress.markAsTouched();
            expect(component.getEmployeeFormErrorMessage("emailAddress")).toBe("");
        });
    });

    describe("handleCreateMemberError()", () => {
        it("should assign workInfoMsg with 'primary.portal.census.manualEntry.duplicate' error message", () => {
            const error = {
                status: 409,
            } as HttpErrorResponse;
            component.handleCreateMemberError(error);
            expect(component.workInfoMsg).toEqual("primary.portal.census.manualEntry.duplicate");
        });

        it("should assign workInfoMsg with 'primary.portal.censusManualEntry.internalServerError' error message", () => {
            const error = {
                status: 500,
            } as HttpErrorResponse;
            component.handleCreateMemberError(error);
            expect(component.workInfoMsg).toEqual("primary.portal.censusManualEntry.internalServerError");
        });

        it("should assign workInfoMsg with 'primary.portal.censusManualEntry.permissionDenied' error message", () => {
            const error = {
                status: 403,
            } as HttpErrorResponse;
            component.handleCreateMemberError(error);
            expect(component.workInfoMsg).toEqual("primary.portal.censusManualEntry.permissionDenied");
        });
    });

    describe("validateHyphenApostrophe()", () => {
        it("should return true if string starts/ends with hyphen/apostrophe", () => {
            expect(component.validateHyphenApostrophe("-abcd")).toEqual(true);
        });
    });

    describe("worksiteLocationEnabled$", () => {
        it("Get worksiteLocationEnable config", (done) => {
            expect.assertions(1);
            component.worksiteLocationEnabled$.subscribe((config) => {
                expect(config).toBe(true);
                done();
            });
        });
    });

    describe("addWorkStateAndZipFormControls()", () => {
        beforeEach(() => {
            component.workInfoForm = new FormGroup({
                employerName: new FormControl(""),
                jobTitle: new FormControl(""),
            });
        });
        it("Should add state and zip form control to workInfoForm", (done) => {
            expect.assertions(1);
            component["worksiteLocationEnabled$"].subscribe((config) => {
                component.addWorkStateAndZipFormControls();
                component.workInfoForm.addControl("workState", new FormControl(""));
                component.workInfoForm.addControl("workZip", new FormControl(""));
                expect(config).toBe(true);
                done();
            });
        });
    });

    describe("checkWorkInfoZipCode()", () => {
        beforeEach(() => {
            component.workInfoForm = new FormGroup({
                employerName: new FormControl(""),
                jobTitle: new FormControl(""),
                workState: new FormControl(""),
                workZip: new FormControl(""),
            });
        });
        it("Should set error when workZip length is not 5 or 9", () => {
            const workZip = "303";
            const workState = "GA";
            component.checkWorkInfoZipCode(workZip, workState);
            component.workInfoForm.controls.workZip.setErrors({ length: true });
        });

        it("Should set error for workZip must be provided with workState", () => {
            const workZip = "";
            const workState = "GA";
            component.checkWorkInfoZipCode(workZip, workState);
            component.workInfoForm.controls.workZip.setErrors({ workZipRequired: true });
            component.workInfoForm.controls.workZip.markAsTouched();
        });

        it("Should set error for workState must be provided with workZip", () => {
            const workZip = "30350";
            const workState = "";
            component.checkWorkInfoZipCode(workZip, workState);
            component.workInfoForm.controls.workState.setErrors({ workStateRequired: true });
            component.workInfoForm.controls.workState.markAsTouched();
        });

        it("Should reset workZip and WorkState form controls", () => {
            const workZip = "";
            const workState = "";
            component.checkWorkInfoZipCode(workZip, workState);
            component.workInfoForm.controls.workState.reset();
            component.workInfoForm.controls.workZip.reset();
        });

        it("Should set multiple error for workZip length and workState must be provided with workZip", () => {
            const workZip = "303";
            const workState = "";
            component.checkWorkInfoZipCode(workZip, workState);
            component.workInfoForm.controls.workZip.setErrors({ length: true });
            component.workInfoForm.controls.workState.setErrors({ workStateRequired: true });
            component.workInfoForm.controls.workZip.markAsTouched();
        });
    });

    describe("saveMemberWorkStateAndZip()", () => {
        beforeEach(() => {
            component.memberId = "1";
        });
        it("should save member work state and zip", () => {
            component.workInfoForm.controls.workZip.setValue("30350");
            component.workInfoForm.controls.workState.setValue("GA");
            const workAddress = {
                state: component.workInfoForm.controls.workState.value,
                zip: component.workInfoForm.controls.workZip.value,
            };
            const memberWorkInfoDetails = {
                address: workAddress,
            } as MemberContact;
            const spy2 = jest.spyOn(memberService, "saveMemberContact");
            component.saveMemberWorkStateAndZip();
            expect(spy2).toBeCalledWith(+component.memberId, "WORK", memberWorkInfoDetails, "111");
        });
    });

    describe("saveMemberContactObservable()", () => {
        it("should save work state and zip if user added zip", () => {
            const saveMemberContactObservables: Observable<void>[] = [];
            component.workInfoForm.controls.workZip.setValue("30350");
            const spy2 = jest.spyOn(component, "saveMemberWorkStateAndZip");
            jest.spyOn(memberService, "saveMemberContact").mockReturnValue(of(void {}));
            component.saveMemberContactObservable();
            expect(spy2).toBeCalled();
            expect(saveMemberContactObservables).toEqual([]);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy1 = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
            component.ngOnDestroy();
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
});
