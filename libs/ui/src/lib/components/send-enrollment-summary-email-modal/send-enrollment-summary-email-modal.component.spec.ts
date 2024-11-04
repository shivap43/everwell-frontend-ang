import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SendEnrollmentSummaryEmailModalComponent } from "./send-enrollment-summary-email-modal.component";
import { mockLanguageService, mockMatDialog, mockMatDialogData, mockMatDialogRef } from "@empowered/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef, Component, Directive, Input, Pipe, PipeTransform, forwardRef } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { RouterTestingModule } from "@angular/router/testing";
import { LanguageService } from "@empowered/language";
import { NgxsModule, Store } from "@ngxs/store";
import { SendEnrollmentSummaryEmailModalService } from "./send-enrollment-summary-email-modal.service";
import {
    Contact,
    SendEnrollmentSummaryEmailModalAction,
    SendEnrollmentSummaryEmailModalResponseData,
} from "./send-enrollment-summary-email-modal.model";
import { of } from "rxjs";
import { MemberContactListDisplay } from "@empowered/constants";
import { HttpResponse } from "@angular/common/http";

@Directive({
    selector: "[language]",
})
class MockLanguageDirective {
    @Input() language!: string;

    transform(value: any): string {
        return value;
    }
}

const MOCK_CONTACT_DATA: Contact = {
    addressed: {
        address1: "123 Maryland Street,",
        address2: "Central Avenue",
        city: "Sacramento",
        state: "CA",
        zip: "90001",
    },
    emailAddresses: [
        {
            email: "test@gmail.com",
            type: "PERSONAL",
            verified: true,
            primary: true,
            id: 1,
        },
    ],
    phoneNumbers: [
        {
            phoneNumber: 123456789,
            type: "HOME",
            isMobile: true,
            verified: true,
            primary: true,
            id: 1,
        },
    ],
    phoneNumber: "123456789",
    cellPhoneNumber: "123456789",
    email: "test@gmail.com",
    contactId: 1,
    contactType: "HOME",
    addressValidationDate: "2024-06-11T05:59:49",
    immediateContactPreference: "UNKNOWN",
    contactTimeOfDay: "MORNING",
};

const MOCK_CONTACT_RESULT_DATA = [
    {
        type: "email",
        disableField: false,
        contact: "test@gmail.com",
        primary: true,
        formatted: "test@gmail.com",
    },
    {
        type: "phone",
        disableField: false,
        contact: "123456789",
        primary: true,
        formatted: "123456789",
    },
];

const mockContactPhone: MemberContactListDisplay = {
    contact: "123456789",
    disableField: false,
    type: "Home",
    primary: true,
    formatted: "123456789",
};

const mockContactEmail: MemberContactListDisplay = {
    contact: "abc@test.com",
    disableField: false,
    type: "Home",
    primary: true,
    formatted: "abc@test.com",
};

const mockStore = {
    selectSnapshot: () => ({ core: { regex: { EMAIL: "" } } }),
};

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

@Pipe({
    name: "phone",
})
class MockPhonePipe implements PipeTransform {
    transform(value: number, country: string): string {
        return "123-456-7890";
    }
}

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

describe("SendEnrollmentSummaryEmailModalComponent", () => {
    let component: SendEnrollmentSummaryEmailModalComponent;
    let fixture: ComponentFixture<SendEnrollmentSummaryEmailModalComponent>;
    let sendEnrollmentSummaryService: SendEnrollmentSummaryEmailModalService<SendEnrollmentSummaryEmailModalComponent>;
    let sendEnrollmentDialog: MatDialogRef<SendEnrollmentSummaryEmailModalComponent, SendEnrollmentSummaryEmailModalResponseData>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                SendEnrollmentSummaryEmailModalComponent,
                MockLanguageDirective,
                MockMatRadioGroupComponent,
                MockPhonePipe,
                MockNumberValidationDirective,
                MockPhoneNumberFormatDirective,
            ],
            imports: [HttpClientTestingModule, ReactiveFormsModule, NgxsModule.forRoot([]), RouterTestingModule],
            providers: [
                SendEnrollmentSummaryEmailModalService,
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockMatDialogData,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SendEnrollmentSummaryEmailModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        sendEnrollmentSummaryService = TestBed.inject(SendEnrollmentSummaryEmailModalService);
        sendEnrollmentDialog = TestBed.inject(MatDialogRef);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("getEmailAndPhoneDetails()", () => {
        it("should call getEmailAndPhoneDetails()", () => {
            jest.spyOn(sendEnrollmentSummaryService, "getEmailAndPhoneDetails").mockReturnValue(of([MOCK_CONTACT_DATA]));
            component.getEmailAndPhoneDetails();
            expect(sendEnrollmentSummaryService.getEmailAndPhoneDetails).toHaveBeenCalled();
        });

        it("should call getEmailAndPhoneDetails() and should populate data in contactList", () => {
            jest.spyOn(sendEnrollmentSummaryService, "getEmailAndPhoneDetails").mockReturnValue(of([MOCK_CONTACT_DATA]));
            component.data.contactList = [];
            component.getEmailAndPhoneDetails();
            expect(component.data.contactList).toEqual(MOCK_CONTACT_RESULT_DATA);
        });
    });

    describe("populateContactList()", () => {
        it("should call populateContactList() and should populate data in contactList", () => {
            component.result = [MOCK_CONTACT_DATA];
            component.data.contactList = [];
            component.populateContactList();
            expect(component.data.contactList).toEqual(MOCK_CONTACT_RESULT_DATA);
        });

        it("should call populateContactList() and contactlist should be emmpty if result object is empty", () => {
            component.result = [];
            component.data.contactList = [];
            component.populateContactList();
            expect(component.data.contactList).toEqual([]);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should destroy subscriptions", () => {
            const spy1 = jest.spyOn(component.unsubscribe$, "next");
            const spy2 = jest.spyOn(component.unsubscribe$, "complete");
            component.ngOnDestroy();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
        });
    });

    describe("test cases for phone and email related methods", () => {
        it("onPhoneNotOnFile", () => {
            component.onPhoneNotOnFile();
            expect(component.showPhone).toBeTruthy();
            expect(component.showEmail).toBeFalsy();
        });

        it("onPhoneSelection", () => {
            component.onPhoneSelection(mockContactPhone);
            expect(component.showPhone).toBeFalsy();
            expect(component.showEmail).toBeFalsy();
            expect(component.form.controls.email.valid).toBeTruthy();
            expect(component.form.controls.phone.valid).toBeTruthy();
        });

        it("onEmailNotOnFile", () => {
            component.onEmailNotOnFile();
            expect(component.showEmail).toBeTruthy();
            expect(component.showPhone).toBeFalsy();
        });

        it("onEmailSelection", () => {
            component.onEmailSelection(mockContactEmail);
            expect(component.showEmail).toBeFalsy();
            expect(component.showPhone).toBeFalsy();
            expect(component.form.controls.email.valid).toBeTruthy();
            expect(component.form.controls.phone.valid).toBeTruthy();
        });
    });

    describe("onEmailInput()", () => {
        it("should set email input in form and service", () => {
            const event = { target: { value: "abc@gmail.com" } } as unknown as Event;
            component.onEmailInput(event);
            expect(sendEnrollmentSummaryService.email).toEqual("abc@gmail.com");
            expect(component.form.controls.selected.valid).toBeTruthy();
        });
    });

    describe("onPhoneInput()", () => {
        it("should set phone number input in form and service", () => {
            const event = { target: { value: "9876543210" } } as unknown as Event;
            component.onPhoneInput(event);
            expect(sendEnrollmentSummaryService.phone).toEqual("9876543210");
            expect(component.form.controls.selected.valid).toBeTruthy();
        });
    });

    describe("onSubmit()", () => {
        it("should select email/phone number before send", () => {
            component.onSubmit();
            const spy = jest.spyOn(component, "send").mockImplementation();
            expect(component.form.controls.selected.touched).toBe(true);
            expect(component.form.controls.email.touched).toBe(true);
            expect(component.form.controls.phone.touched).toBe(true);
            expect(spy).not.toBeCalled();
        });

        it("should validate email on send", () => {
            const spy = jest.spyOn(component, "send").mockImplementation();
            component.form.controls.selected.setValue("abc@gmail.com");
            component.form.controls.email.setValue("abc@gmail.com");
            component.showEmail = true;
            component.onSubmit();
            expect(component.form.controls.selected.valid).toBe(true);
            expect(component.form.controls.selected.touched).toBe(false);
            expect(component.form.controls.email.valid).toBe(true);
            expect(component.form.controls.email.touched).toBe(false);
            expect(spy).toBeCalled();
        });

        it("should validate phone number on send", () => {
            const spy = jest.spyOn(component, "send").mockImplementation();
            component.form.controls.selected.setValue("9876543210");
            component.form.controls.phone.setValue("9876543210");
            component.showPhone = true;
            component.onSubmit();
            expect(component.form.controls.selected.valid).toBe(true);
            expect(component.form.controls.selected.touched).toBe(false);
            expect(component.form.controls.phone.valid).toBe(true);
            expect(component.form.controls.phone.touched).toBe(false);
            expect(spy).toBeCalled();
        });
    });

    describe("send()", () => {
        it("send email and close dialog", () => {
            component.mpGroup = 12345;
            component.memberId = 1;
            sendEnrollmentSummaryService.email = "abc@gmail.com";
            const spy = jest.spyOn(sendEnrollmentSummaryService, "send").mockReturnValue(of({} as HttpResponse<void>));
            const spy1 = jest.spyOn(sendEnrollmentDialog, "close");
            component.send();
            expect(spy).toBeCalledWith(12345, 1, { email: "abc@gmail.com" });
            expect(spy1).toBeCalledWith({ action: SendEnrollmentSummaryEmailModalAction.SEND });
        });

        it("send text on phone number and close dialog", () => {
            component.mpGroup = 12345;
            component.memberId = 1;
            sendEnrollmentSummaryService.phone = "9876543210";
            const spy = jest.spyOn(sendEnrollmentSummaryService, "send").mockReturnValue(of({} as HttpResponse<void>));
            const spy1 = jest.spyOn(sendEnrollmentDialog, "close");
            component.send();
            expect(spy).toBeCalledWith(12345, 1, { phoneNumber: "9876543210" });
            expect(spy1).toBeCalledWith({ action: SendEnrollmentSummaryEmailModalAction.SEND });
        });
    });

    describe("resetForms()", () => {
        it("should resetForms", () => {
            component.resetForms();
            expect(component.form.controls.email.touched).toBeFalsy();
            expect(component.form.controls.phone.touched).toBeFalsy();
        });

        it("should reset Forms on calling onPhoneNotOnFile", () => {
            component.onPhoneNotOnFile();
            expect(component.form.controls.email.touched).toBeFalsy();
            expect(component.form.controls.phone.touched).toBeFalsy();
        });

        it("should reset Forms on calling onEmailNotOnFile", () => {
            component.onEmailNotOnFile();
            expect(component.form.controls.email.touched).toBeFalsy();
            expect(component.form.controls.phone.touched).toBeFalsy();
        });

        it("should reset Forms on calling onEmailSelection", () => {
            component.onEmailSelection(mockContactEmail);
            expect(component.form.controls.email.touched).toBeFalsy();
            expect(component.form.controls.phone.touched).toBeFalsy();
        });

        it("should reset Forms on calling onPhoneSelection", () => {
            component.onPhoneSelection(mockContactPhone);
            expect(component.form.controls.email.touched).toBeFalsy();
            expect(component.form.controls.phone.touched).toBeFalsy();
        });
    });
});
