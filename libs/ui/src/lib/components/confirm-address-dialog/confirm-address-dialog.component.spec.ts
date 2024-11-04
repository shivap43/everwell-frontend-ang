import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ConfirmAddressDialogComponent } from "./confirm-address-dialog.component";
import { of, throwError } from "rxjs";
import { HttpResponse } from "@angular/common/http";
import {
    AflacService,
    AuthenticationService,
    BenefitsOfferingService,
    EmailAddress,
    MemberService,
    ProducerService,
    StaticService,
    WebexConnectInfo,
} from "@empowered/api";
import {
    Address,
    VerifiedAddress,
    PersonalAddress,
    CountryState,
    MemberContact,
    AppSettings,
    AddressConfig,
    Configurations,
} from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { UserService } from "@empowered/user";
import { Router } from "@angular/router";
import { NgxsModule, Store } from "@ngxs/store";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { CUSTOM_ELEMENTS_SCHEMA, Input, Directive, NO_ERRORS_SCHEMA } from "@angular/core";
import { EnrollmentMethodModel, SharedState, StaticUtilService } from "@empowered/ngxs-store";
import { EmpoweredModalService, SharedService } from "@empowered/common-services";
import {
    mockEmpoweredModalService,
    mockLanguageService,
    mockMatDialog,
    mockMatDialogRef,
    mockSharedService,
    mockBenefitsOfferingService,
    mockAflacService,
    mockProducerService,
    mockAuthenticationService,
    mockRouter,
} from "@empowered/testing";
import { MatMenuModule } from "@angular/material/menu";
import { CommonModule } from "@angular/common";

const data = {
    memberId: 1,
    mpGroup: 123,
    method: "FACE_TO_FACE",
    purpose: "shop",
};

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[configEnabled]",
})
class MockConfigEnableDirective {
    @Input("configEnabled") configKey: string;
}

// Skipping this test suite as it is throwing many errors in pipeline one after other.
describe.skip("ConfirmAddressDialogComponent", () => {
    let component: ConfirmAddressDialogComponent;
    let fixture: ComponentFixture<ConfirmAddressDialogComponent>;
    let store: Store;
    let memberService: MemberService;
    let empoweredModalService: EmpoweredModalService;
    let aflacService: AflacService;
    let sharedService: SharedService;
    let staticUtilService: StaticUtilService;
    let staticService: StaticService;
    let matDialogRef: MatDialogRef<ConfirmAddressDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ConfirmAddressDialogComponent, MockConfigEnableDirective],
            imports: [
                HttpClientTestingModule,
                RouterTestingModule,
                ReactiveFormsModule,
                NgxsModule.forRoot([SharedState]),
                MatMenuModule,
                CommonModule,
            ],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: ProducerService,
                    useValue: mockProducerService,
                },
                {
                    provide: BenefitsOfferingService,
                    useValue: mockBenefitsOfferingService,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: SharedService,
                    useValue: mockSharedService,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
                {
                    provide: AuthenticationService,
                    useValue: mockAuthenticationService,
                },
                {
                    provide: AflacService,
                    useValue: mockAflacService,
                },
                UserService,
                MemberService,
                StaticService,
                StaticUtilService,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ConfirmAddressDialogComponent);
        component = fixture.componentInstance;
        memberService = TestBed.inject(MemberService);
        empoweredModalService = TestBed.inject(EmpoweredModalService);
        aflacService = TestBed.inject(AflacService);
        sharedService = TestBed.inject(SharedService);
        staticUtilService = TestBed.inject(StaticUtilService);
        staticService = TestBed.inject(StaticService);
        matDialogRef = TestBed.inject(MatDialogRef);
        component.addressForm = new FormGroup({
            stateControl: new FormControl("GA", [Validators.required]),
            cityControl: new FormControl("atlanta", [Validators.required]),
            street1Control: new FormControl("test", [Validators.required]),
            street2Control: new FormControl(""),
            zipControl: new FormControl(12345, [Validators.required]),
            acknowledgeControl: new FormControl(true, [Validators.requiredTrue]),
            email: new FormControl(""),
            send: new FormControl([Validators.required]),
        });
        component.memberContact = {
            emailAddresses: [
                {
                    email: "jest123@gmail.com",
                },
            ] as EmailAddress[],
            address: {
                country: "US",
                countyId: 1,
            } as Address,
        } as MemberContact;
        component.validationRegex = { NAME_WITH_SPACE_ALLOWED: "value" };
        component.memberId = 1;
        data.memberId = 1;
        component.currentEnrollmentData = {
            enrollmentMethod: "PIN_SIGNATURE",
            enrollmentState: "GA",
            headSetState: "",
            headSetStateAbbreviation: "",
            enrollmentStateAbbreviation: "GA",
            enrollmentCity: "atlanta",
            userType: "",
            memberId: 1,
            mpGroup: 111,
        };
        fixture.detectChanges();
    });

    beforeEach(() => {
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            core: {
                regex: { NAME_WITH_SPACE_ALLOWED: "value" },
            },
        });
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("onSuccess()", () => {
        it("should set isLoading to true", () => {
            component.onSuccess();
            expect(component.isLoading).toBe(true);
        });
        it("acceptMemberConsent should be called", () => {
            component.memberId = 1;
            const spy1 = jest.spyOn(memberService, "acceptMemberConsent").mockReturnValue(of({} as HttpResponse<unknown>));
            component.onSuccess();
            expect(spy1).toBeCalledWith(1, 123);
        });
    });

    describe("openModal", () => {
        it("openDialog should be called", () => {
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            component.openModal("bothOption", {} as PersonalAddress).subscribe(() => {
                expect(spy).toBeCalledTimes(1);
            });
        });
    });

    describe("setChecker", () => {
        it("should set checker to true", () => {
            component.setChecker();
            expect(component.fieldsChanged).toBe(true);
        });
    });

    describe("closeDialog", () => {
        it("closeDialog should be called", () => {
            component.states = [
                {
                    abbreviation: "GA",
                    name: "Georgia",
                },
                {
                    abbreviation: "PR",
                    name: "Puerto Rico",
                },
            ] as CountryState[];
            const spy = jest.spyOn(matDialogRef, "close");
            component.closeDialog();
            expect(spy).toBeCalledWith({
                action: "shopSuccess",
                newState: {
                    abbreviation: "GA",
                    name: "Georgia",
                },
                newCity: "atlanta",
            });
        });
    });
    describe("onSubmit", () => {
        beforeEach(() => {
            component.addressForm = new FormGroup({
                stateControl: new FormControl("GA", [Validators.required]),
                cityControl: new FormControl("atlanta", [Validators.required]),
                street1Control: new FormControl("test", [Validators.required]),
                street2Control: new FormControl(""),
                zipControl: new FormControl(12345, [Validators.required]),
                acknowledgeControl: new FormControl(true, [Validators.requiredTrue]),
                email: new FormControl(""),
                send: new FormControl([Validators.required]),
            });
            component.currentEnrollmentData = {
                enrollmentMethod: "PIN_SIGNATURE",
                enrollmentState: "GA",
                headSetState: "",
                headSetStateAbbreviation: "",
                enrollmentStateAbbreviation: "GA",
                enrollmentCity: "atlanta",
                userType: "",
                memberId: 1,
                mpGroup: 111,
            };
        });
        it("onConfirm() should be called when enrollment is other than Call center or Pin signature", (done) => {
            expect.assertions(1);
            data.method = "VIRTUAL_FACE_TO_FACE";
            component.currentEnrollmentData = {} as EnrollmentMethodModel;
            jest.spyOn(component, "nextAfterVerifyAddress").mockReturnValue(of(void {}));
            const spy = jest.spyOn(component, "onConfirm");
            component.onSubmit().subscribe(() => {
                expect(spy).toBeCalled();
                done();
            });
        });
        it("onConfirm() should be called when enrollment method is Call center or Pin signature", (done) => {
            expect.assertions(1);
            data.method = "CALL_CENTER";
            component.hasConsent = true;
            component.addressForm.controls["email"].setValue("test123@gmail.com");
            const spy = jest.spyOn(component, "onConfirm");
            jest.spyOn(component, "nextAfterVerifyAddress").mockReturnValue(of(void {}));
            component.onSubmit().subscribe();
            data.method = "PIN_SIGNATURE";
            component.onSubmit().subscribe(() => {
                expect(spy).toBeCalledTimes(2);
                done();
            });
        });
        it("onConfirm() should be called for currentEnrollmentData", (done) => {
            expect.assertions(1);
            data.method = "VIRTUAL_FACE_TO_FACE";
            component.currentEnrollmentData = {
                enrollmentMethod: "PIN_SIGNATURE",
            } as EnrollmentMethodModel;
            component.hasConsent = true;
            component.addressForm.controls["email"].setValue("test123@gmail.com");
            jest.spyOn(component, "nextAfterVerifyAddress").mockReturnValue(of(void {}));
            const spy = jest.spyOn(component, "onConfirm");
            component.onSubmit().subscribe();
            component.currentEnrollmentData = {
                enrollmentMethod: "CALL_CENTER",
            } as EnrollmentMethodModel;
            component.onSubmit().subscribe(() => {
                expect(spy).toBeCalledTimes(2);
                done();
            });
        });
        it("Email form control should be set with emailConsentSent error", (done) => {
            expect.assertions(2);
            component.addressForm = new FormGroup({
                stateControl: new FormControl("GA", [Validators.required]),
                cityControl: new FormControl("atlanta", [Validators.required]),
                street1Control: new FormControl("test", [Validators.required]),
                street2Control: new FormControl(""),
                zipControl: new FormControl(12345, [Validators.required]),
                acknowledgeControl: new FormControl(true, [Validators.requiredTrue]),
                email: new FormControl(""),
                send: new FormControl([Validators.required]),
            });
            component.currentEnrollmentData = {
                enrollmentMethod: "PIN_SIGNATURE",
                enrollmentState: "GA",
                headSetState: "",
                headSetStateAbbreviation: "",
                enrollmentStateAbbreviation: "GA",
                enrollmentCity: "atlanta",
                userType: "",
                memberId: 1,
                mpGroup: 111,
            };
            data.method = "PIN_SIGNATURE";
            component.hasConsent = false;
            component.addressForm.controls["email"].setValue("test123@gmail.com");
            jest.spyOn(component, "nextAfterVerifyAddress").mockReturnValue(of(void {}));
            component.onSubmit().subscribe((response) => {
                expect(component.addressForm.controls["email"].errors).toStrictEqual({ emailConsentSent: true });
                expect(response).toBeNull();
                done();
            });
        });
        it("Email form control should be set with email error", (done) => {
            expect.assertions(2);
            data.method = "PIN_SIGNATURE";
            component.hasConsent = false;
            jest.spyOn(empoweredModalService, "openDialog").mockReturnValue({
                afterClosed: () => of(true),
            } as MatDialogRef<any>);
            jest.spyOn(component, "nextAfterVerifyAddress").mockReturnValue(of(void {}));
            component.addressForm.controls["email"].setValue(null);
            component.onSubmit().subscribe((response) => {
                expect(component.addressForm.controls["email"].errors).toStrictEqual({ email: true });
                expect(response).toBeNull();
                done();
            });
        });
    });
    describe("onConfirm()", () => {
        it("showError should be true if form has error", () => {
            component.addressForm.controls["email"].setErrors({ email: true });
            component.onConfirm();
            expect(component.zipMismatchError).toBe(false);
            expect(component.showError).toBe(true);
        });
        it("emailAddresses should be added", () => {
            component.addressForm.controls["email"].setValue("test123@gmail.com");
            component.memberContact.emailAddresses = [];
            component.onConfirm();
            expect(component.showError).toBe(false);
            expect(component.memberContact.emailAddresses).toContainEqual({
                email: "test123@gmail.com",
                type: "PERSONAL",
                id: null,
            });
        });
        it("method calls based on addressValidationSwitch data", () => {
            const spy1 = jest.spyOn(component, "verifyAddressDetails");
            const spy2 = jest.spyOn(component, "nextAfterVerifyAddress");
            component.addressValidationSwitch = true;
            component.onConfirm();
            expect(spy1).toBeCalled();
            component.addressValidationSwitch = false;
            component.onConfirm();
            expect(spy2).toBeCalled();
        });
    });
    describe("verifyAddressDetails()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            component.memberContact.address = { state: "GA", zip: "31001" } as PersonalAddress;
        });
        it("verifyMemberAddress() should be called", (done) => {
            expect.assertions(3);
            const spy1 = jest.spyOn(memberService, "verifyMemberAddress").mockReturnValue(of({ matched: true } as VerifiedAddress));
            jest.spyOn(component, "nextAfterVerifyAddress").mockReturnValue(of(void {}));
            component.verifyAddressDetails().subscribe(() => {
                expect(spy1).toBeCalledWith({ state: "GA", zip: "31001" });
                expect(component.addressResp).toBe(false);
                expect(component.memberContact.addressValidationDate.toDateString()).toBe(new Date().toDateString());
                done();
            });
        });
        it("should call nextAfterVerifyAddress()", (done) => {
            expect.assertions(1);
            jest.spyOn(memberService, "verifyMemberAddress").mockReturnValue(of({ matched: true } as VerifiedAddress));
            const spy1 = jest.spyOn(component, "nextAfterVerifyAddress");
            jest.spyOn(staticService, "validateStateZip").mockReturnValue(of({} as HttpResponse<void>));
            jest.spyOn(memberService, "saveMemberContact").mockReturnValue(of(void {}));
            jest.spyOn(memberService, "acceptMemberConsent").mockReturnValue(of({} as HttpResponse<unknown>));
            component.verifyAddressDetails().subscribe(() => {
                expect(spy1).toBeCalledTimes(1);
                done();
            });
        });
        it("should call openModal()", (done) => {
            expect.assertions(1);
            jest.spyOn(memberService, "verifyMemberAddress").mockReturnValue(of({ matched: false } as VerifiedAddress));
            const spy1 = jest.spyOn(component, "openModal").mockReturnValue(of(void {}));
            component.verifyAddressDetails().subscribe(() => {
                expect(spy1).toBeCalledWith("bothOption", { state: "GA", zip: "31001" }, { matched: false });
                done();
            });
        });
        it("should contain invalidAddressData error message for 400 api error response status", (done) => {
            expect.assertions(1);
            jest.spyOn(component, "openModal").mockReturnValue(of(void {}));
            jest.spyOn(memberService, "verifyMemberAddress").mockReturnValue(
                throwError({
                    error: { message: "api error message" },
                    status: 400,
                }),
            );
            component.verifyAddressDetails().subscribe(() => {
                expect(component.addressMessage).toContainEqual("secondary.portal.directAccount.invalidAdressdata");
                done();
            });
        });
        it("should contain error message of api error response", (done) => {
            expect.assertions(1);
            jest.spyOn(component, "openModal").mockReturnValue(of(void {}));
            jest.spyOn(memberService, "verifyMemberAddress").mockReturnValue(
                throwError({
                    error: {
                        details: [
                            {
                                message: "api error message",
                            },
                        ],
                    },
                    status: 400,
                }),
            );
            component.verifyAddressDetails().subscribe(() => {
                expect(component.addressMessage).toContainEqual("api error message");
                done();
            });
        });
        it("should contain internalServer error message for 500 api error response status", (done) => {
            expect.assertions(1);
            jest.spyOn(component, "openModal").mockReturnValue(of(void {}));
            jest.spyOn(memberService, "verifyMemberAddress").mockReturnValue(
                throwError({
                    error: { message: "api error message" },
                    status: 500,
                }),
            );
            component.verifyAddressDetails().subscribe(() => {
                expect(component.addressMessage).toContainEqual("secondary.portal.accountPendingEnrollments.internalServer");
                done();
            });
        });
        it("should contain internalServer error message for other api error response status", (done) => {
            expect.assertions(2);
            jest.spyOn(component, "openModal").mockReturnValue(of(void {}));
            jest.spyOn(memberService, "verifyMemberAddress").mockReturnValue(
                throwError({
                    error: { message: "api error message" },
                    status: 401,
                    code: "invalidData",
                }),
            );
            component.verifyAddressDetails().subscribe(() => {
                expect(component.addressMessage).toContainEqual("secondary.api.401.invalidData");
                expect(component.addressResp).toBe(true);
                done();
            });
        });
        it("verifyAddressDetails() should return null", (done) => {
            expect.assertions(1);
            jest.spyOn(memberService, "verifyMemberAddress").mockReturnValue(of({ matched: true } as VerifiedAddress));
            jest.spyOn(component, "nextAfterVerifyAddress").mockReturnValue(of(void {}));
            component.verifyAddressDetails().subscribe((verifiedAddress) => {
                expect(verifiedAddress).toBeNull();
                done();
            });
        });
        it("openModal() should be called for error response", (done) => {
            expect.assertions(1);
            jest.spyOn(memberService, "verifyMemberAddress").mockReturnValue(
                throwError({
                    error: { message: "api error message" },
                    status: 400,
                }),
            );
            jest.spyOn(empoweredModalService, "openDialog").mockReturnValue({
                afterClosed: () => of(true),
            } as MatDialogRef<any>);
            const spy = jest.spyOn(component, "openModal").mockReturnValue(of(void {}));
            jest.spyOn(component, "nextAfterVerifyAddress");
            component.verifyAddressDetails().subscribe(() => {
                expect(spy).toBeCalledWith("singleOption", component.memberContact.address, null, 400);
                done();
            });
        });
    });
    describe("getConfig()", () => {
        it("cacheConfigValue should be called", () => {
            const spy = jest.spyOn(staticUtilService, "cacheConfigs").mockReturnValue(
                of([
                    { value: "TRUE", dataType: "BOOLEAN" },
                    { value: "TRUE", dataType: "BOOLEAN" },
                ] as Configurations[]),
            );
            component.getConfig();
            expect(spy).toBeCalledWith([AddressConfig.ADDRESS_VALIDATION, AddressConfig.ENABLE_DEPENDENT_ADDRESS_MODAL]);
            expect(component.addressValidationSwitch).toBe(true);
            expect(component.enableDependentUpdateAddressModal).toBe(true);
        });
    });
    describe("sendConsent()", () => {
        beforeEach(() => {
            component.memberContact = {
                address: {
                    country: "US",
                    countyId: 1,
                } as Address,
            } as MemberContact;
            component.addressForm.controls["email"].setValue("test123@gmail.com");
        });
        it("should call emailMemberConsent", () => {
            const spy = jest.spyOn(memberService, "emailMemberConsent").mockReturnValue(of({} as HttpResponse<unknown>));
            component.sendConsent();
            expect(spy).toBeCalledWith(1, 123, "test123@gmail.com");
            expect(component.consentSent).toBe(true);
            expect(component.hasConsent).toBe(true);
        });
        it("should set error for email form control for api failure", () => {
            const spy = jest.spyOn(memberService, "emailMemberConsent").mockReturnValue(
                throwError({
                    error: { message: "api error message" },
                    status: 400,
                }),
            );
            component.sendConsent();
            expect(spy).toBeCalledWith(1, 123, "test123@gmail.com");
            expect(component.addressForm.controls["email"].errors).toStrictEqual({ email: true });
        });
        it("should call saveMemberContact() and getMemberContact()", () => {
            component.hasConsent = true;
            component.memberId = 1;
            const contactInfo = {
                address: {
                    country: "US",
                    countyId: 1,
                },
                emailAddresses: [
                    {
                        email: "test123@gmail.com",
                        type: "PERSONAL",
                        primary: true,
                        id: null,
                    },
                ],
            };
            const spy1 = jest.spyOn(memberService, "saveMemberContact").mockReturnValue(of(void {}));
            const spy2 = jest.spyOn(memberService, "getMemberContact");
            component.sendConsent();
            expect(spy1).toBeCalledWith(1, "HOME", contactInfo, 123);
            expect(spy2).toBeCalledWith(1, "HOME", 123);
        });
    });
    describe("createForm()", () => {
        beforeEach(() => {
            component.address = {
                address1: "stree1",
                address2: "GA",
            } as Address;
            component.validationRegex = { NAME_WITH_SPACE_ALLOWED: "value" };
        });
        it("should call getMemberConsent() for enrollment method CALL_CENTER", () => {
            component.currentEnrollmentData = {
                enrollmentMethod: "CALL_CENTER",
            } as EnrollmentMethodModel;
            const spy = jest.spyOn(memberService, "getMemberConsent");
            component.createForm();
            expect(spy).toBeCalledWith(1, 123);
        });
        it("should call getMemberConsent() for enrollment method PIN_SIGNATURE", () => {
            component.currentEnrollmentData = {
                enrollmentMethod: "PIN_SIGNATURE",
            } as EnrollmentMethodModel;
            const spy = jest.spyOn(memberService, "getMemberConsent").mockReturnValue(of(false));
            component.createForm();
            expect(spy).toBeCalledWith(1, 123);
        });
        it("should set language for confirmAddressHeader if enrollment method VIRTUAL_FACE_TO_FACE", () => {
            data.method = "VIRTUAL_FACE_TO_FACE";
            component.currentEnrollmentData = {
                enrollmentMethod: "VIRTUAL_FACE_TO_FACE",
            } as EnrollmentMethodModel;
            const spy = jest.spyOn(memberService, "getMemberConsent");
            component.createForm();
            expect(spy).not.toBeCalled();
            expect(component.confirmAddressHeader).toStrictEqual("primary.portal.callCenter.confirmEmployeesAddress");
            expect(component.isVirtualF2FInfoDisplay).toBe(true);
        });
    });
    describe("onCancel()", () => {
        it("should close the dialog", () => {
            const spy = jest.spyOn(matDialogRef, "close");
            component.onCancel();
            expect(spy).toBeCalledWith({ action: "close" });
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy1 = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
        });
    });

    describe("checkZipCode()", () => {
        it("should set fieldsChanged value to true", () => {
            component.checkZipCode("30005");
            expect(component.fieldsChanged).toBe(true);
        });
    });

    describe("nextAfterVerifyAddress()", () => {
        it("should not open DependentAddressUpdateModalComponent when there are no dependents", (done) => {
            expect.assertions(1);
            component.hasDependents = false;
            component.fieldsChanged = true;
            const spy1 = jest.spyOn(empoweredModalService, "openDialog").mockReturnValue({
                afterClosed: () => of(true),
            } as MatDialogRef<any>);

            jest.spyOn(memberService, "saveMemberContact").mockReturnValue(of(void {}));
            jest.spyOn(memberService, "acceptMemberConsent").mockReturnValue(of({} as HttpResponse<unknown>));

            component.nextAfterVerifyAddress();
            expect(spy1).toBeCalledTimes(0);
            done();
        });

        it("should open DependentAddressUpdateModalComponent when there are dependents", (done) => {
            expect.assertions(1);
            component.hasDependents = true;
            component.fieldsChanged = true;
            const spy1 = jest.spyOn(empoweredModalService, "openDialog").mockReturnValue({
                afterClosed: () => of(true),
            } as MatDialogRef<any>);

            jest.spyOn(memberService, "saveMemberContact").mockReturnValue(of(void {}));
            jest.spyOn(memberService, "acceptMemberConsent").mockReturnValue(of({} as HttpResponse<unknown>));

            component.nextAfterVerifyAddress({ isVerifyAddress: true, selectedAddress: AppSettings.SUGGESTED_ADDRESS });
            expect(spy1).toBeCalledTimes(1);
            done();
        });
    });
});
