import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ContactInfoPopupComponent } from "./contact-info-popup.component";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA, Pipe, PipeTransform } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormBuilder, FormGroup } from "@angular/forms";
import { LanguageService, ReplaceTagPipe } from "@empowered/language";
import { mockAuthenticationService, mockLanguageService, mockMatDialog, mockStaticService, mockStore } from "@empowered/testing";
import { AuthenticationService, StaticService } from "@empowered/api";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { SharedState } from "@empowered/ngxs-store";
import { DependentContactInterface } from "@empowered/constants";
import { Subscription } from "rxjs";

const data = {
    title: "Add phone number",
    inputLabel: "Phone",
    fieldType: ["HOME", "OTHER"],
    isPhone: true,
    inputName: "phonenumber",
    contacttype: "phonetype",
    validatorMaxLength: 12,
    editData: {},
    action: "Add",
    rowIndex: undefined,
    contactLength: 0,
    contactData: [{ id: 13, isMobile: false, phoneNumber: "9876667778", primary: true, type: "HOME", verified: false }],
};

@Pipe({
    name: "replaceTag",
})
class MockReplaceTagPipe implements PipeTransform {
    transform(value: any, mapObj: any): string {
        return "replaced";
    }
}

describe("ContactInfoPopupComponent", () => {
    let component: ContactInfoPopupComponent;
    let fixture: ComponentFixture<ContactInfoPopupComponent>;
    let staticService: StaticService;
    const formBuilder = new FormBuilder();

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ContactInfoPopupComponent, MockReplaceTagPipe],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: StaticService,
                    useValue: mockStaticService,
                },
                FormBuilder,
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: ReplaceTagPipe,
                    useClass: MockReplaceTagPipe,
                },
                {
                    provide: AuthenticationService,
                    useValue: mockAuthenticationService,
                },
            ],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([SharedState])],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ContactInfoPopupComponent);
        component = fixture.componentInstance;
        staticService = TestBed.inject(StaticService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("createFormControls()", () => {
        it("should create contactInfoPopupForm form instance", () => {
            component.contactInfoPopupForm = null;
            component.createFormControls();
            expect(component.contactInfoPopupForm).toBeInstanceOf(FormGroup);
        });
    });

    describe("createFormControls()", () => {
        it("should create contactInfoPopupForm form instance", () => {
            component.contactInfoPopupForm = null;
            component.createFormControls();
            expect(component.contactInfoPopupForm).toBeInstanceOf(FormGroup);
        });
    });

    describe("ngOnInit()", () => {
        it("should call getConfigurations on ngOnInit", () => {
            const spy = jest.spyOn(component, "getConfigurations");
            component.ngOnInit();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("identifyPrimaryContact()", () => {
        it("should set primary contact when identifyPrimaryContact is called", () => {
            component.identifyPrimaryContact([
                { id: 13, isMobile: false, phoneNumber: "9876667778", primary: true, type: "HOME", verified: false },
            ] as DependentContactInterface[]);
            expect(component.primaryContact).toBe("9876667778");
        });
    });

    describe("createFormControls()", () => {
        it("should have phone number in the form when createFormControls is called and type is Phone", () => {
            component.data.isPhone = true;
            component.createFormControls();
            expect(component.contactInfoPopupForm.controls.type.value).toStrictEqual("");
        });
    });

    describe("getConfigurations()", () => {
        it("should call getConfigurations api when 'getConfigurations' is called", () => {
            const spy = jest.spyOn(staticService, "getConfigurations");
            component.getConfigurations();
            expect(spy).toBeCalled();
        });
    });

    describe("removeContactInfo()", () => {
        it("should close mat dialog when 'removeContactInfo' is called", () => {
            const spy = jest.spyOn(component["dialogRef"], "close");
            component.removeContactInfo(false, 0, "ADD");
            expect(spy).toBeCalled();
        });
    });

    describe("onCancelClick()", () => {
        it("should close mat dialog when 'onCancelClick' is called", () => {
            const spy = jest.spyOn(component["dialogRef"], "close");
            component.onCancelClick();
            expect(spy).toBeCalled();
        });
    });

    describe("onSubmit", () => {
        beforeEach(() => {
            const mockFormData = formBuilder.group({
                type: ["Phone"],
                phoneNumber: ["9887766666"],
                extension: [""],
                primary: [true],
                isMobile: [false],
            });
            component.contactInfoPopupForm = mockFormData;
        });

        it("should set the phone data with the form values", () => {
            component.onSubmit();
            expect(component.phoneData.isPhone).toBe(true);
            expect(component.phoneData.verified).toBe(false);
        });
        it("should close the mat dialog", () => {
            const spy = jest.spyOn(component["dialogRef"], "close");
            component.onSubmit();
            expect(spy).toBeCalled();
        });

        it("should set the email data with the form values", () => {
            component.data.isPhone = false;
            component.onSubmit();
            expect(component.emailData.isPhone).toBe(false);
            expect(component.emailData.verified).toBe(false);
        });
    });

    describe("isRequiredField()", () => {
        it("Should return false when control does not match", () => {
            const result = component.isRequiredField("phone");
            expect(result).toBeFalsy();
        });
    });

    describe("getValidationForKey()", () => {
        it("Should return true when control is required", () => {
            component.validationConfigurations = [
                { name: "portal.member.form.contactInfoPopupForm.type", value: "required", dataType: "STRING" },
            ];
            const result = component.getValidationForKey("type");
            expect(result).toBeTruthy();
        });
    });

    describe("settingValidations", () => {
        it("should call getValidationForKey when settingValidations is called with formGroup type", () => {
            const mockFormData = formBuilder.group({
                type: ["Phone"],
                phoneNumber: ["9887766666"],
                extension: [""],
                primary: [true],
                isMobile: [false],
            });
            component.validationConfigurations = [
                { name: "portal.member.form.contactInfoPopupForm.type", value: "required", dataType: "STRING" },
            ];
            const spy = jest.spyOn(component, "getValidationForKey");
            component.settingValidations(mockFormData);
            expect(spy).toBeCalled();
        });
    });

    describe("ngOnDestroy()", () => {
        it("Should unsubscribe from all subscriptions", () => {
            const subscriptionSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.getConfigurationSubscriber = new Subscription();
            component.ngOnDestroy();
            expect(subscriptionSpy).toHaveBeenCalled();
        });
    });
});
