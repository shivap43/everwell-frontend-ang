import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { ControlValueAccessor, FormBuilder, FormControl, NG_VALUE_ACCESSOR } from "@angular/forms";
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ContactInfoPopupComponent } from "./contact-info-popup.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { RouterTestingModule } from "@angular/router/testing";
import { SharedState, AccountInfoState } from "@empowered/ngxs-store";
import { AuthenticationService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { Component, CUSTOM_ELEMENTS_SCHEMA, Directive, forwardRef, Input, Pipe, PipeTransform } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { of, Subscription } from "rxjs";
import { UserService } from "@empowered/user";

const mockMatDialogRef = {
    close: () => {},
} as MatDialogRef<ContactInfoPopupComponent>;

@Component({
    selector: "mon-icon",
    template: "",
})
class MockMonIconComponent {
    @Input() iconSize!: string;
}

@Component({
    selector: "mat-form-field",
    template: "",
})
class MockMatFormFieldComponent {}

@Component({
    selector: "mat-label",
    template: "",
})
class MockMatLabelComponent {}

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
    @Input() value!: string;
    writeValue(): void {}
    registerOnChange(): void {}
    registerOnTouched(): void {}
}

@Component({
    selector: "mat-option",
    template: "",
})
class MockMatOptionComponent {}

const mockLanguageService = {
    fetchPrimaryLanguageValues: (tagNames: string[]) =>
        tagNames.reduce((languages: Record<string, string>, tagName: string) => {
            languages[tagName] = tagName;
            return languages;
        }, {}),
    fetchSecondaryLanguageValue: (tagName: string) => tagName,
    fetchSecondaryLanguageValues: (tagNames: string[]) => ({}),
    fetchPrimaryLanguageValue: (tagName: string) => tagName,
} as LanguageService;

const mockUserService = {
    portal$: of("producer"),
    credential$: of({
        adminId: 4224,
        tpa: false,
        groupId: 23423,
    }),
} as UserService;

@Component({
    selector: "mon-alert",
    template: "",
})
class MockMonAlertComponent {}

@Directive({
    selector: "[empoweredNumberValidation]",
})
class MockNumberValidationDirective {
    @Input() allowDecimals: boolean;
    @Input() allowDashes: boolean;
}

@Directive({
    selector: "[empoweredPhoneNumberFormat]",
})
class MockPhoneNumberFormatDirective {
    @Input() includeDialingCode = false;
}

@Pipe({
    name: "titlecase",
})
class MockTitleCasePipe implements PipeTransform {
    transform(value: string) {
        return "Savings";
    }
}
const MP_GROUP_ID = 23423;
const ACCOUNT_NUMBER = 342342;
const MEMBER_ID = 3432;

describe("ContactInfoPopupComponent", () => {
    let component: ContactInfoPopupComponent;
    let fixture: ComponentFixture<ContactInfoPopupComponent>;
    let store: Store;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [
                    ContactInfoPopupComponent,
                    MockMatFormFieldComponent,
                    MockMonIconComponent,
                    MockMatLabelComponent,
                    MockMatSelectComponent,
                    MockMatOptionComponent,
                    MockMatCheckboxComponent,
                    MockMonAlertComponent,
                    MockNumberValidationDirective,
                    MockPhoneNumberFormatDirective,
                    MockTitleCasePipe,
                ],
                imports: [
                    MatDialogModule,
                    HttpClientTestingModule,
                    NgxsModule.forRoot([SharedState, AccountInfoState]),
                    RouterTestingModule,
                    ReactiveFormsModule,
                ],
                providers: [
                    {
                        provide: MatDialogRef,
                        useValue: mockMatDialogRef,
                    },
                    {
                        provide: MAT_DIALOG_DATA,
                        useValue: {
                            rowData: { primary: true },
                            inputName: "email",
                            type: ["sample_type"],
                            extension: "sample_extension",
                            email: "sample_email",
                            contactLength: 1,
                            contactData: [
                                {
                                    email: "abc@abc.com",
                                    primary: false,
                                },
                            ],
                        },
                    },
                    { provide: AuthenticationService, useValue: {} },
                    FormBuilder,
                    { provide: LanguageService, useValue: mockLanguageService },
                    {
                        provide: UserService,
                        useValue: mockUserService,
                    },
                ],
                schemas: [CUSTOM_ELEMENTS_SCHEMA],
            }).compileComponents();
        }),
    );

    beforeEach(() => {
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            core: {
                regex: { someRegex: "SAMPLE_REGEX" },
                configs: [
                    {
                        name: "config_name",
                        value: "config_value",
                        dataType: "config_datatype",
                    },
                ],
                permissions: ["true"],
                queryParams: {
                    memberId: MEMBER_ID.toString(),
                    groupId: MP_GROUP_ID.toString(),
                },
            },
            accountInfo: {
                mpGroupId: MP_GROUP_ID,
                accountInfo: { accountNumber: ACCOUNT_NUMBER },
            },
        });
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(ContactInfoPopupComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("initializeContactPopupForm()", () => {
        describe("contactInfoPopupForm for email", () => {
            const emailFormData = {
                email: "abcbca@abc.com",
                type: "PERSONAL",
                primary: false,
            };

            beforeEach(() => {
                component.initializeContactPopupForm(false, false);
                component.contactInfoPopupForm.setValue(emailFormData);
            });

            it("should be valid", () => {
                expect(component.contactInfoPopupForm.valid).toBe(true);
            });
        });

        describe("contactInfoPopupForm for phone", () => {
            const phoneFormData = {
                phoneNumber: "454-564-6574",
                type: "HOME",
                isMobile: true,
                primary: true,
                extension: null,
            };

            beforeEach(() => {
                component.data.isPhone = true;
                component.initializeContactPopupForm(true, false);
                component.contactInfoPopupForm.setValue(phoneFormData);
            });

            it("should be valid", () => {
                expect(component.contactInfoPopupForm.valid).toBe(true);
            });
        });
    });

    describe("onCancelClick()", () => {
        it("should close the dialog", () => {
            const spy = jest.spyOn(component["dialogRef"], "close");
            component.onCancelClick();
            expect(spy).toHaveBeenCalled();
        });
    });

    describe("ngOnDestroy", () => {
        it("should unsubsribe from all subscriptions", () => {
            const spy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.ngOnDestroy();
            expect(spy).toHaveBeenCalled();
        });
    });
});
