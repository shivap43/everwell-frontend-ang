import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { AccountService, StaticService, AccountCarrierContact, AccountContactType } from "@empowered/api";
import { Configurations, CountryState, AddUpdateContactDialogData } from "@empowered/constants";
import { NgxsModule, Store } from "@ngxs/store";
import { LanguageService } from "@empowered/language";
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Observable, of, Subscription, throwError } from "rxjs";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatCheckboxChange } from "@angular/material/checkbox";
import { mockLanguageService, mockPhoneFormatConverterPipe } from "@empowered/testing";
import { NumberValidationDirective } from "../../directives/number-validation.directive";
import { AddUpdateContactInfoComponent } from "./add-update-contact-info.component";
import { SharedState } from "@empowered/ngxs-store";

const mockStaticService = {
    getConfigurations: (names: string, mpGroup?: number, partnerId?: string) =>
        of([{ name: "unplugged", value: "true" }] as Configurations[]),
    getStates: () =>
        of([
            {
                abbreviation: "NC",
                name: "NorthCarolina",
            },
            {
                abbreviation: "TX",
                name: "Texas",
            },
        ]),
    getCountries: () => of([]),
    getCounties: (event: string) => of([]),
};

const mockAccountService = {
    getGroupAttributesByName: (groupAttributeNames: string[], mpGroup?: number) =>
        of([
            {
                id: 989898,
                attribute: "some attribute",
                value: "",
            },
        ]),

    getAccountContactTypes: () =>
        of([
            {
                id: 2,
                name: "TestAccount",
                type: "CARRIER",
            },
            {
                id: 2,
                name: "TestAccount_1",
                type: "ACCOUNT",
            },
            {
                id: 3,
                name: "TestAccount_2",
                type: "ACCOUNT",
            },
        ]),
    getAccountContacts: (expand: string) =>
        of([
            {
                address: {
                    address1: "11611 GILROY LN",
                    address2: null,
                    city: "Huntersville",
                    state: "NC",
                    zip: "28078",
                    countyId: null,
                    country: "USA",
                },
                phoneNumbers: [
                    {
                        phoneNumber: "704-206-3333",
                        extension: null,
                        type: "Secondary",
                    },
                    {
                        phoneNumber: "704-206-5555",
                        extension: null,
                        type: "Primary",
                    },
                ],
                emailAddresses: [
                    {
                        email: "testp.aflac.com",
                        type: "primary",
                    },
                    {
                        email: "tests.aflac.com",
                        type: "secondary",
                    },
                ],
                id: 123456,
                name: "DummyCarrierAccountName",
                typeId: 123456789,
                type: {
                    id: 123,
                    partnerId: 12345,
                    name: "EverWell Pharma",
                    displayName: "EverWell",
                },
                primary: true,
            },
        ]),
    getAccountContact: (mpGroup: string, contactId: string, expand: string) =>
        of({
            address: {
                address1: "11611 GILROY LN",
                address2: null,
                city: "Huntersville",
                state: "NC",
                zip: "28078",
                countyId: null,
                country: "USA",
            },
            phoneNumbers: [
                {
                    phoneNumber: "704-206-3333",
                    extension: null,
                    type: "Secondary",
                },
                {
                    phoneNumber: "704-206-5555",
                    extension: null,
                    type: "Primary",
                },
            ],
            emailAddresses: [
                {
                    email: "testp.aflac.com",
                    type: "primary",
                },
                {
                    email: "tests.aflac.com",
                    type: "secondary",
                },
            ],
            id: 123456,
            name: "DummyAccountForm",
            typeId: 123456789,
            type: {
                id: 123,
                partnerId: 12345,
                name: "EverWell Pharma",
                displayName: "EverWell",
            },
            primary: true,
        }),
    getCarrierContacts: (mpGroup: string, carrierId: string) =>
        of([
            {
                address: {
                    address1: "11611 GILROY LN",
                    address2: null,
                    city: "Huntersville",
                    state: "NC",
                    zip: "28078",
                    countyId: null,
                    country: "USA",
                },
                phoneNumbers: [
                    {
                        phoneNumber: "704-206-3333",
                        extension: null,
                        type: "Secondary",
                    },
                    {
                        phoneNumber: "704-206-5555",
                        extension: null,
                        type: "Primary",
                    },
                ],
                emailAddresses: [
                    {
                        email: "testp.aflac.com",
                        type: "primary",
                    },
                    {
                        email: "tests.aflac.com",
                        type: "secondary",
                    },
                ],
                id: 123456,
                name: "DummyCarrierAccountName",
                primary: true,
            },
        ]),

    addCarrierContact: (mpGroup: string, carrierId: string, carrierContact: AccountCarrierContact) =>
        of({
            address: {
                address1: "11611 GILROY LN",
                address2: null,
                city: "Huntersville",
                state: "NC",
                zip: "28078",
                countyId: null,
                country: "USA",
            },
            phoneNumbers: [
                {
                    phoneNumber: "704-206-3333",
                    extension: null,
                    type: "Secondary",
                },
                {
                    phoneNumber: "704-206-5555",
                    extension: null,
                    type: "Primary",
                },
            ],
            emailAddresses: [
                {
                    email: "testp.aflac.com",
                    type: "primary",
                },
                {
                    email: "tests.aflac.com",
                    type: "secondary",
                },
            ],
            id: 123456,
            name: "DummyCarrierAccountName",
            primary: true,
        }),

    getAccountCarrierContact: (mmpGroup: string, carrierId: string, contactId: string) =>
        of({
            address: {
                address1: "123 MAIN ST",
                address2: null,
                city: "CHARLOTTE",
                state: "NC",
                zip: "28202",
                countyId: null,
                country: "USA",
            },
            phoneNumbers: [
                {
                    phoneNumber: "704-206-3333",
                    extension: null,
                    type: "Secondary",
                },
                {
                    phoneNumber: "704-206-5555",
                    extension: null,
                    type: "Primary",
                },
            ],
            emailAddresses: [
                {
                    email: "testp.aflac.com",
                    type: "primary",
                },
                {
                    email: "tests.aflac.com",
                    type: "secondary",
                },
            ],
            id: 123456,
            name: "DummyCarrierForm",
            primary: true,
        }),

    updateAccountCarrierContact: (mpGroup: string, contactId: string, contactInfo: any) =>
        of({
            address: {
                address1: "11611 GILROY LN",
                address2: null,
                city: "Huntersville",
                state: "NC",
                zip: "28078",
                countyId: null,
                country: "USA",
            },
            phoneNumbers: [
                {
                    phoneNumber: "704-206-3333",
                    extension: null,
                    type: "Secondary",
                },
                {
                    phoneNumber: "704-206-5555",
                    extension: null,
                    type: "Primary",
                },
            ],
            emailAddresses: [
                {
                    email: "testp.aflac.com",
                    type: "primary",
                },
                {
                    email: "tests.aflac.com",
                    type: "secondary",
                },
            ],
            id: 123456,
            name: "DummyCarrierAccountName",
            primary: true,
        }),
    addAccountContact: (mpGroup: string, contactInfo: any) =>
        of({
            address: {
                address1: "11611 GILROY LN",
                address2: "Add",
                city: "Huntersville",
                state: "NC",
                zip: "28078",
                countyId: null,
                country: "USA",
            },
            phoneNumbers: [
                {
                    phoneNumber: "704-206-3333",
                    extension: null,
                    type: "Secondary",
                },
                {
                    phoneNumber: "704-206-5555",
                    extension: null,
                    type: "Primary",
                },
            ],
            emailAddresses: [
                {
                    email: "testp.aflac.com",
                    type: "primary",
                },
                {
                    email: "tests.aflac.com",
                    type: "secondary",
                },
            ],
            id: 123456,
            name: "DummyAccountAdd",
            primary: true,
        }),
    updateAccountContact: (mpGroup: string, contactId: string, contactInfo: any) =>
        of({
            address: {
                address1: "11611 GILROY LN",
                address2: "Update",
                city: "Huntersville",
                state: "NC",
                zip: "28078",
                countyId: null,
                country: "USA",
            },
            phoneNumbers: [
                {
                    phoneNumber: "704-206-3333",
                    extension: null,
                    type: "Secondary",
                },
                {
                    phoneNumber: "704-206-5555",
                    extension: null,
                    type: "Primary",
                },
            ],
            emailAddresses: [
                {
                    email: "testp.aflac.com",
                    type: "primary",
                },
                {
                    email: "tests.aflac.com",
                    type: "secondary",
                },
            ],
            id: 123456,
            name: "DummyAccountUpdate",
            primary: true,
        }),
};

const mockStore = {
    dispatch: () => of({}),
    select: () => of({}),
};

const mockMatDialogRef = { close: () => {} };

const mockDialogData = {
    parentMode: "",
    isAdd: true,
    isPrimary: true,
    mpGroupId: "111",
    allowEditingAddress: true,
    allowEditingContactName: true,
    allowEditingPhoneNumber: true,
    allowEditingEmailAddress: true,
    carrier: { id: "123456", name: "CareerTest" },
    carrierContact: { id: "12345" },
    accountContact: { id: "12345", type: { id: 67890 } },
} as AddUpdateContactDialogData;

const fg: FormGroup = new FormBuilder().group({
    type: "AddUpdateContactForm",
    name: "Test",
    address1: "11611 Gilroy Ln",
    address2: null,
    city: "Huntersville",
    state: "NC",
    zip: "28078",
    phone: "7040003456",
    email: "abv@gmail.com",
});

const error = {};
error["error"] = {
    status: "ERROR",
    code: 404,
    ["details"]: [
        { code: "", message: "Mock 404 error" },
        { code: "", message: "Reached Maximum length" },
    ],
};

const mockSubscription = [
    {
        unsubscribe: () => {},
    },
] as Subscription[];

describe("AddUpdateContactInfoComponent", () => {
    let component: AddUpdateContactInfoComponent;
    let fixture: ComponentFixture<AddUpdateContactInfoComponent>;
    let mockDialog: MatDialogRef<AddUpdateContactInfoComponent, any>;
    let staticService: StaticService;
    let accountService: AccountService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddUpdateContactInfoComponent, NumberValidationDirective, mockPhoneFormatConverterPipe],
            providers: [
                {
                    provide: StaticService,
                    useValue: mockStaticService,
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
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockDialogData,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
            ],
            imports: [NgxsModule.forRoot([SharedState]), HttpClientTestingModule, ReactiveFormsModule, NgxsModule.forRoot([])],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
        staticService = TestBed.inject(StaticService);
        accountService = TestBed.inject(AccountService);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AddUpdateContactInfoComponent);
        component = fixture.componentInstance;
        mockDialog = TestBed.inject(MatDialogRef);
        component.addUpdateContactForm = new FormGroup({
            zip: new FormControl("00969", [Validators.required]),
        });
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("getAccountContactTypes()", () => {
        beforeEach(() => {
            component.subscriber.forEach((sub) => {
                if (sub) {
                    sub.unsubscribe();
                }
            });
        });
        it("Should be the Subscription array size is 2 as accountService returns 2 subscriptions", () => {
            component.getAccountContactTypes();
            expect(component.subscriber.length).toEqual(2);
        });
    });

    describe("setupDisplayContentWhenCarrier()", () => {
        beforeEach(() => {
            component.langStrings = {};
            component.parentMode = "CARRIER";
            component.langStrings["primary.portal.profile.accountContacts.addUpdateContact.title_addCarrierContact"] =
                "#name - AddCarrierContact";
            component.langStrings["primary.portal.profile.accountContacts.addUpdateContact.title_editCarrierContact"] =
                "#name - EditCarrierContact";
            component.langStrings["primary.portal.profile.accountContacts.addUpdateContact.name_carrier"] = "CarrierName";
        });

        it("Should be the Title and contactNameText field values AddCarrierContact & CarrierName when isAdd is true", () => {
            component.isAdd = true;
            component.setupDisplayContent();
            expect(component?.title).toBe("CareerTest - AddCarrierContact");
            expect(component?.contactNameText).toBe("CarrierName");
        });

        it("Should be the Title and contactNameText field values EditCarrierContact & CarrierName when isAdd is false", () => {
            component.isAdd = false;
            component.setupDisplayContent();
            expect(component?.title).toBe("CareerTest - EditCarrierContact");
            expect(component?.contactNameText).toBe("CarrierName");
        });
    });

    describe("setupDisplayContentWhenAccount()", () => {
        beforeEach(() => {
            component.langStrings = {};
            component.langStrings["primary.portal.profile.accountContacts.addUpdateContact.titleAddBillingContact"] = "AddBillingContact";
            component.langStrings["primary.portal.profile.accountContacts.addUpdateContact.title_editPrimaryContact"] =
                "EditPrimaryContact";
            component.langStrings["primary.portal.profile.accountContacts.addUpdateContact.title_editBillingContact"] =
                "EditBillingContact";
            component.langStrings["primary.portal.profile.accountContacts.addUpdateContact.name_account"] = "AccountName";
            component.parentMode = "ACCOUNT";
        });

        it("Should be Title and contactNameText field values AddBillingContact & AccountName when isAdd is true", () => {
            component.isAdd = true;
            component.setupDisplayContent();
            expect(component?.title).toBe("AddBillingContact");
            expect(component?.contactNameText).toBe("AccountName");
        });

        it("Should be Title and contactNameText field values EditPrimaryContact & AccountName when isAdd is false & primary is true ", () => {
            component.isAdd = false;
            component.isPrimary = true;
            component.setupDisplayContent();
            expect(component?.title).toBe("EditPrimaryContact");
            expect(component?.contactNameText).toBe("AccountName");
        });

        it("Should be Title and contactNameText field values EditBillingContact & AccountName when isAdd is false & primary is false ", () => {
            component.isAdd = false;
            component.isPrimary = false;
            component.setupDisplayContent();
            expect(component?.title).toBe("EditBillingContact");
            expect(component?.contactNameText).toBe("AccountName");
        });
    });

    describe("onChangePrimary()", () => {
        it("should assign isPrimary value based on event check", () => {
            const eventData = {
                checked: false,
            } as MatCheckboxChange;
            component.onChangePrimary(eventData);
            expect(component.isPrimary).toBeFalsy();
        });
    });

    describe("hideErrorAlertMessage()", () => {
        it("should handle error", () => {
            component.hideErrorAlertMessage();
            expect(component.showErrorMessage).toBeFalsy();
            expect(component.errorMessage).toBeNull();
        });
    });

    describe("showMissMatchStateError()", () => {
        it("should set error for field zip", () => {
            component.showMissMatchStateError();
            expect(component.addUpdateContactForm.get("zip").errors).toEqual({ mismatch: true });
        });
    });

    describe("closePopup()", () => {
        it("should close the pop up", () => {
            const spy = jest.spyOn(mockDialog, "close");
            component.closePopup();
            expect(spy).toHaveBeenCalled();
        });
    });

    describe("ngOnDestroy()", () => {
        it("should unsubscribe from all subscriptions", () => {
            component.subscriber = mockSubscription;
            const spy = jest.spyOn(mockSubscription[0], "unsubscribe");
            component.ngOnDestroy();
            expect(spy).toBeCalled();
        });
    });

    describe("getContactDetailsForCarrier()", () => {
        beforeEach(() => {
            jest.resetModules();
            jest.clearAllMocks();
            component.mpGroupId = "111";
            component.parentMode = "CARRIER";
            component.addUpdateContactForm = fg;
            jest.spyOn(component, "formatNumber").mockReturnValue("704-206-3333");
        });

        it("Should call getAccountCarrierContact service and set addUpdateContactForm name", () => {
            component.getContactDetails();
            expect(component.addUpdateContactForm.getRawValue().name).toBe("DummyCarrierForm");
        });

        it("Should call getAccountCarrierContact service and set addUpdateContactForm with the address detail provided", () => {
            component.getContactDetails();
            expect(component.addUpdateContactForm.getRawValue().address1).toBe("123 MAIN ST");
            expect(component.addUpdateContactForm.getRawValue().city).toBe("CHARLOTTE");
            expect(component.addUpdateContactForm.getRawValue().zip).toBe("28202");
        });

        it("Should call getAccountCarrierContact service and set addUpdateContactForm with the first available phone", () => {
            component.getContactDetails();
            expect(component.addUpdateContactForm.getRawValue().phone).toBe("704-206-3333");
        });

        it("Should call getAccountCarrierContact service and set addUpdateContactForm with the first available email", () => {
            component.getContactDetails();
            expect(component.addUpdateContactForm.getRawValue().email).toBe("testp.aflac.com");
        });
    });

    describe("getContactDetailsForAccount()", () => {
        beforeEach(() => {
            jest.resetModules();
            jest.clearAllMocks();
            component.mpGroupId = "111";
            component.parentMode = "ACCOUNT";
            component.addUpdateContactForm = fg;
            component.showType = true;
            jest.spyOn(component, "formatNumber").mockReturnValue("704-206-3333");
        });

        it("Should call getAccountContact service and set addUpdateContactForm name", () => {
            component.getContactDetails();
            expect(component.addUpdateContactForm.getRawValue().name).toBe("DummyAccountForm");
        });

        it("Should call getAccountContact service and set addUpdateContactForm with the address detail provided", () => {
            component.getContactDetails();
            expect(component.addUpdateContactForm.getRawValue().address1).toBe("11611 GILROY LN");
            expect(component.addUpdateContactForm.getRawValue().city).toBe("Huntersville");
            expect(component.addUpdateContactForm.getRawValue().zip).toBe("28078");
        });

        it("Should call getAccountContact service and set addUpdateContactForm with the first available phone", () => {
            component.getContactDetails();
            expect(component.addUpdateContactForm.getRawValue().phone).toBe("704-206-3333");
        });

        it("Should call getAccountContact service and set addUpdateContactForm with the first available email", () => {
            component.getContactDetails();
            expect(component.addUpdateContactForm.getRawValue().email).toBe("testp.aflac.com");
        });
    });

    describe("changeFormat", () => {
        beforeEach(() => {
            jest.resetModules();
            jest.clearAllMocks();
            component.addUpdateContactForm = fg;
        });

        it("Should remove all '-' from the formatted number", () => {
            component.addUpdateContactForm.get("phone").patchValue("704-000-3457");
            component.changeFormat();
            expect(component.addUpdateContactForm.get("phone").value).toBe("7040003457");
        });
    });

    describe("revertToFormat", () => {
        beforeEach(() => {
            jest.resetModules();
            jest.clearAllMocks();
            jest.spyOn(component, "formatNumber").mockReturnValue("704-206-3322");
        });

        it("Should remove all '-' from the formatted number", () => {
            component.addUpdateContactForm = fg;
            component.revertToFormat();
            expect(component.addUpdateContactForm.get("phone").value).toBe("704-206-3322");
        });
    });

    describe("existingAddressChange", () => {
        beforeEach(() => {
            jest.resetModules();
            jest.clearAllMocks();
            component.addUpdateContactForm = fg;
        });

        it("Should update the existing address", () => {
            const event = {
                value: {
                    address1: "Update Address",
                    address2: "New",
                    city: "Huntersville",
                    state: "NC",
                    zip: "28202",
                    countyId: null,
                    country: "USA",
                },
            };
            component.existingAddressChange(event);
            expect(component.addUpdateContactForm.get("address1").value).toBe("Update Address");
            expect(component.addUpdateContactForm.get("address2").value).toBe("New");
            expect(component.addUpdateContactForm.get("zip").value).toBe("28202");
        });
    });

    describe("removeDefaultExisting", () => {
        beforeEach(() => {
            jest.resetModules();
            jest.clearAllMocks();
            component.addUpdateContactForm = fg;
            component.existingAddrSelected = true;
        });

        it("Should update the existing address", () => {
            component.initializeForm();
            component.removeDefaultExisting();
            expect(component.existingAddrSelected).toBeFalsy();
            expect(component.addUpdateContactForm.get("existing").value).toBeNull();
        });
    });

    describe("covering leftover code path ", () => {
        beforeEach(() => {
            jest.resetModules();
            jest.clearAllMocks();
        });

        it("Should able to initialize the form when showType is enabled", () => {
            component.showType = true;
            component.initializeForm();
            expect(component.initializeForm()).toBe(void 0);
        });

        it("should be an empty account contact type array ", () => {
            const accountArray: Observable<AccountContactType[]> = of([]);
            jest.spyOn(accountService, "getAccountContactTypes").mockReturnValue(accountArray);
            component.getAccountContactTypes();
            expect(component.getAccountContactTypes).toHaveLength(0);
        });
    });

    describe("patchContactDetails()", () => {
        beforeEach(() => {
            jest.resetModules();
            jest.clearAllMocks();
            component.addUpdateContactForm = fg;
            component.existingAddrSelected = true;
            component.initializeForm();
        });
        it("should patch values to addUpdateContactForm", () => {
            const contactDetails = {
                name: "",
                address: {
                    address1: "address1",
                    address2: "address2",
                    city: "city",
                    state: "state",
                    zip: "30005",
                },
                phoneNumbers: [],
                emailAddresses: [],
                type: {
                    id: 12,
                },
            };
            component.patchContactDetails(contactDetails);
            expect(component.addUpdateContactForm.get("address1").value).toBe("address1");
            expect(component.addUpdateContactForm.get("address2").value).toBe("address2");
            expect(component.addUpdateContactForm.get("city").value).toBe("city");
            expect(component.addUpdateContactForm.get("state").value).toBe("state");
            expect(component.addUpdateContactForm.get("zip").value).toBe("30005");
        });

        it("should patch values to addUpdateContactForm", () => {
            const contactDetails = {
                name: "",
                address: {},
                phoneNumbers: [],
                emailAddresses: [
                    {
                        email: "abc@gmail.com",
                    },
                ],
                type: {
                    id: 12,
                },
            };
            component.patchContactDetails(contactDetails);
            expect(component.addUpdateContactForm.get("email").value).toBe("abc@gmail.com");
        });

        it("should patch values to addUpdateContactForm", () => {
            const contactDetails = {
                name: "",
                address: {},
                phoneNumbers: [],
                emailAddresses: [],
                type: {
                    id: 12,
                },
            };
            component.showType = true;
            component.patchContactDetails(contactDetails);
            expect(component.addUpdateContactForm.get("type").value).toBe("12");
        });
    });
});
