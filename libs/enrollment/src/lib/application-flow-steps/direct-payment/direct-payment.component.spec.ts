import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { LanguageService } from "@empowered/language";
import { FormBuilder, FormControl, ReactiveFormsModule } from "@angular/forms";
import {
    mockAppFlowService,
    mockApplicationService,
    mockLanguageService,
    mockMemberService,
    mockPaymetricService,
    mockStaticService,
    mockStaticUtilService,
    mockShoppingCartDisplayService,
    mockEmpoweredModalService,
    mockShoppingService,
    mockAccountService,
    mockUserService,
    mockCoreService,
    mockDomSanitizer,
    mockDateService,
    mockUtilService,
    mockPaymentService,
    MockMaskPaymentPipe,
} from "@empowered/testing";
import {
    AccountService,
    ApplicationService,
    Carrier,
    CoreService,
    MemberService,
    PaymentService,
    ShoppingCartDisplayService,
    ShoppingService,
    StaticService,
} from "@empowered/api";
import { AccountType, ApplicationResponse, Configurations, EnrollmentMethod, MemberDependent, PaymentType } from "@empowered/constants";
import { DatePipe } from "@angular/common";
import { PaymetricService } from "@empowered/common-services";
import { DirectPaymentComponent } from "./direct-payment.component";
import { AppFlowService, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { EmpoweredModalService } from "@empowered/common-services";
import { UserService } from "@empowered/user";
import { DomSanitizer } from "@angular/platform-browser";
import { DateService } from "@empowered/date";
import { Observable, of, throwError } from "rxjs";
import { HttpResponse } from "@angular/common/http";
import { EmpoweredAttentionModalComponent, PaymentDetailsPromptComponent } from "@empowered/ui";
import { MatDialogRef } from "@angular/material/dialog";
import { MatDatepicker } from "@angular/material/datepicker";
import { EditDeletePaymentComponent } from "@empowered/ui";

@Directive({
    selector: "[empoweredDateTransform]",
})
class MockDateTransformDirective {
    @Input() notCalenderFormat: boolean;
}
@Directive({
    selector: "[matDatepicker]",
})
class MockMatDatePickerDirective {
    @Input() matDatepicker!: MatDatepicker<unknown>;
}

describe("DirectPaymentComponent", () => {
    let component: DirectPaymentComponent;
    let fixture: ComponentFixture<DirectPaymentComponent>;
    let memberService: MemberService;
    let coreService: CoreService;
    let accountService: AccountService;
    const formBuilder = new FormBuilder();
    let paymetricService: PaymetricService;
    let staticService: StaticService;
    let empoweredModalService: EmpoweredModalService;
    let paymentService: PaymentService;
    let staticUtilService: StaticUtilService;
    let shoppingCartDisplayService: ShoppingCartDisplayService;
    let shoppingService: ShoppingService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DirectPaymentComponent, MockDateTransformDirective, MockMatDatePickerDirective, MockMaskPaymentPipe],
            providers: [
                FormBuilder,
                DatePipe,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                {
                    provide: ApplicationService,
                    useValue: mockApplicationService,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: StaticService,
                    useValue: mockStaticService,
                },
                {
                    provide: PaymetricService,
                    useValue: mockPaymetricService,
                },
                {
                    provide: AppFlowService,
                    useValue: mockAppFlowService,
                },
                {
                    provide: ShoppingCartDisplayService,
                    useValue: mockShoppingCartDisplayService,
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
                {
                    provide: ShoppingService,
                    useValue: mockShoppingService,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
                {
                    provide: CoreService,
                    useValue: mockCoreService,
                },
                {
                    provide: DomSanitizer,
                    useValue: mockDomSanitizer,
                },
                {
                    provide: DateService,
                    useValue: mockDateService,
                },
                {
                    provide: UtilService,
                    useValue: mockUtilService,
                },
                {
                    provide: PaymentService,
                    useValue: mockPaymentService,
                },
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, ReactiveFormsModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DirectPaymentComponent);
        component = fixture.componentInstance;
        memberService = TestBed.inject(MemberService);
        coreService = TestBed.inject(CoreService);
        accountService = TestBed.inject(AccountService);
        empoweredModalService = TestBed.inject(EmpoweredModalService);
        paymentService = TestBed.inject(PaymentService);
        shoppingCartDisplayService = TestBed.inject(ShoppingCartDisplayService);

        component.bankDraftForm = formBuilder.group({
            accountName: ["some account name"],
            bankName: ["some bank name"],
            accountType: ["savings"],
            accountNumber: ["123456789012345"],
            routingNumber: ["000000000"],
            reAccountNumber: ["123456789012345"],
        });
        component.paymentMethodForm = formBuilder.group({
            method: [PaymentType.BANKDRAFT],
        });
        component.billingForm = formBuilder.group({
            address1: ["some address"],
            address2: ["some address2"],
            city: ["city name"],
            state: ["state name"],
            zip: ["123456"],
            firstName: ["some first name"],
            lastName: ["some last name"],
            mi: ["middle name"],
            suffix: ["some suffix"],
        });
        paymetricService = TestBed.inject(PaymetricService);
        staticService = TestBed.inject(StaticService);
        component.creditCardForm = formBuilder.group({
            cardNumber: ["4111"],
            expirationDate: ["04/2024"],
        });
        component.debitCardForm = formBuilder.group({
            cardNumber: ["4111"],
            expirationDate: ["04/2024"],
        });
        staticUtilService = TestBed.inject(StaticUtilService);
        component.settingForm = formBuilder.group({
            frequency: ["anually"],
            month: ["January"],
            date: ["15/07"],
            agree: [true],
            initials: ["initials"],
        });
        shoppingService = TestBed.inject(ShoppingService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("getMemberDependents()", () => {
        it("should call getMemberDependents method of memberService", () => {
            const spy = jest.spyOn(memberService, "getMemberDependents");
            component.memberId = 1;
            component.mpGroup = 12345;
            component.getMemberDependents();
            expect(spy).toBeCalledWith(1, true, 12345);
        });
        it("should set dependents value after getting response from getMemberDependents method of member service", () => {
            jest.spyOn(memberService, "getMemberDependents").mockReturnValue(of([{ name: "some name" }] as MemberDependent[]));
            component.getMemberDependents();
            expect(component.dependents).toEqual([{ name: "some name" }]);
        });
    });
    describe("getCarrierDetails()", () => {
        it("should call getCarrier method of core service on calling getCarrierDetails", () => {
            const spy = jest.spyOn(coreService, "getCarrier");
            component.getCarrierDetails(1);
            expect(spy).toBeCalledWith(1);
        });
        it("should set carrierDetail value after getting response from getCarrierDetails method of core service", () => {
            jest.spyOn(coreService, "getCarrier").mockReturnValue(
                of({ id: 1, name: "some name", nameOverride: "override", commissionSplitEligible: true } as Carrier),
            );
            component.getCarrierDetails(1);
            expect(component.carrierDetail).toEqual({ id: 1, name: "some name", nameOverride: "override", commissionSplitEligible: true });
        });
    });
    describe("toggleNoPaymentError()", () => {
        it("should set showNoCardError to true if user added new card and when user tries to navigate to billing page without adding any payment method", () => {
            component.selectedAccount = "Add new card";
            component.toggleNoPaymentError();
            expect(component.showNoCardError).toBe(true);
        });
        it("should set showNoCardError to false when either a card is added, or bank draft payment type is selected or PNC config is turned off", () => {
            component.selectedAccount = "411111111111111";
            component.toggleNoPaymentError();
            expect(component.showNoCardError).toBe(false);
            component.selectedAccount = "Add new card";
            component.enableDebitCardBilling = true;
            component.toggleNoPaymentError();
            expect(component.showNoCardError).toBe(false);
        });
    });
    describe("mapPayments()", () => {
        beforeEach(() => {
            component.paymentMethods = [
                {
                    name: "some name",
                    paymentType: PaymentType.BANKDRAFT,
                    accountName: "some bank account name",
                    tempusTokenIdentityGuid: "some token",
                },
                {
                    name: "some name",
                    paymentType: PaymentType.CREDITCARD,
                    accountName: "some credit card account name",
                    tempusTokenIdentityGuid: "some token",
                },
                { name: "some name", paymentType: PaymentType.DEBITCARD, accountName: "some debit card account name" },
                {
                    name: "some name",
                    paymentType: PaymentType.DEBITCARD,
                    accountName: "some debit card account name",
                    tempusTokenIdentityGuid: "some token",
                },
            ];
        });
        it("should add bank draft payment method in bankAccounts when method payment type is bank draft", () => {
            component.mapPayments();
            expect(component.bankAccounts).toStrictEqual([
                {
                    name: "some name",
                    paymentType: PaymentType.BANKDRAFT,
                    accountName: "some bank account name",
                    tempusTokenIdentityGuid: "some token",
                },
            ]);
        });
        it("should add credit card payment method in creditCardAccounts when method payment type is credit card and debit card billing is off", () => {
            component.enableDebitCardBilling = false;
            component.mapPayments();
            expect(component.creditCardAccount).toStrictEqual([
                {
                    name: "some name",
                    paymentType: PaymentType.CREDITCARD,
                    accountName: "some credit card account name",
                    tempusTokenIdentityGuid: "some token",
                },
                {
                    name: "some name",
                    paymentType: PaymentType.DEBITCARD,
                    accountName: "some debit card account name",
                    tempusTokenIdentityGuid: "some token",
                },
            ]);
        });
        it("should add debit card payment method in debitCardAccounts when method payment type is debit card", () => {
            component.mapPayments();
            expect(component.debitCardAccount).toStrictEqual([
                { name: "some name", paymentType: PaymentType.DEBITCARD, accountName: "some debit card account name" },
            ]);
        });
        it("should add debit card payment method in creditCardAccounts when method payment type is debit card and tempus token identity guid is present", () => {
            component.mapPayments();
            expect(component.creditCardAccount).toStrictEqual([
                {
                    name: "some name",
                    paymentType: PaymentType.CREDITCARD,
                    accountName: "some credit card account name",
                    tempusTokenIdentityGuid: "some token",
                },
                {
                    name: "some name",
                    paymentType: PaymentType.DEBITCARD,
                    accountName: "some debit card account name",
                    tempusTokenIdentityGuid: "some token",
                },
            ]);
        });
    });
    describe("getGroupAttributes()", () => {
        it("should call getGroupAttributesByName method of account service on calling getGroupAttributes", () => {
            const spy = jest.spyOn(accountService, "getGroupAttributesByName");
            component.getGroupAttributes();
            expect(spy).toBeCalled();
        });
        it("should set isACHPartnerAccountType to true if group attribute is is_ach_partner_account_type", () => {
            jest.spyOn(accountService, "getGroupAttributesByName").mockReturnValue(
                of([
                    {
                        id: 1,
                        attribute: "is_ach_partner_account_type",
                        value: "true",
                    },
                ]),
            );
            component.getGroupAttributes();
            expect(component.isACHPartnerAccountType).toBeTruthy();
        });
    });
    describe("isValidCardNumber()", () => {
        beforeEach(() => {
            component.visaRegex = new RegExp("^4[0-9]{12}(?:[0-9]{3})?$");
            component.masterCardRegex = new RegExp("^(?:5[1-5][0-9]{14})$");
            component.amexRegex = new RegExp("^(?:3[47][0-9]{13})$");
        });
        it("should return true if visa card number is valid", () => {
            const card = "4005562231212123";
            expect(component.isValidCardNumber(card)).toBe(true);
        });
        it("should return true if master card number is valid", () => {
            const card = "5405000000000000";
            expect(component.isValidCardNumber(card)).toBe(true);
        });
        it("should return true if amex card number is valid", () => {
            const card = "373953192351004";
            expect(component.isValidCardNumber(card)).toBe(true);
        });
    });
    describe("zipError()", () => {
        it("should return zip error as true if there is any error for zip field", () => {
            component.zipApiError = true;
            expect(component.zipError()).toEqual({ zipError: true });
        });
        it("should return null if there is no error for zip field", () => {
            component.zipApiError = false;
            expect(component.zipError()).toEqual(null);
        });
    });
    describe("checkCompleteStatus()", () => {
        it("should set showPayment to true for showing payment screen if stepPosition is 0", () => {
            component.stepPosition = 0;
            component.checkCompleteStatus();
            expect(component.showPayment).toBe(true);
        });
        it("should set showBillingAddress to true for showing billing address screen if stepPosition is 1", () => {
            component.stepPosition = 1;
            component.checkCompleteStatus();
            expect(component.showBillingAddress).toBe(true);
        });
    });
    describe("validateNumber()", () => {
        it("should return null when backspace key is pressed", () => {
            expect(component.validateNumber({ charCode: 8 } as KeyboardEvent)).toBe(null);
        });
        it("should return null when null key is pressed", () => {
            expect(component.validateNumber({ charCode: 0 } as KeyboardEvent)).toBe(null);
        });
        it("should return true if any numeric key is pressed", () => {
            expect(component.validateNumber({ charCode: 49 } as KeyboardEvent)).toBe(true);
        });
    });
    describe("capitalize()", () => {
        it("should capitalize the first character of string", () => {
            expect(component.capitalize("upperCase")).toEqual("UpperCase");
        });
    });
    describe("removeSpaces()", () => {
        it("should remove trailing and leading spaces from bank name", () => {
            const bankNameControl = component.bankDraftForm.controls.bankName;
            bankNameControl.setValue(" bank ");
            component.removeSpaces();
            expect(bankNameControl.value).toBe("bank");
        });
    });
    describe("filterPaymentMethod()", () => {
        beforeEach(() => {
            component.bankAccounts = [{ id: 1, name: "some name", paymentType: PaymentType.BANKDRAFT }];
            component.creditCardAccount = [{ id: 10, name: "some credit card name", paymentType: PaymentType.CREDITCARD }];
            component.debitCardAccount = [{ id: 11, name: "some debit card name", paymentType: PaymentType.DEBITCARD }];
        });
        it("should set bank account data in dropdown data when selected radio button is bank draft", () => {
            component.selectedRadio = PaymentType.BANKDRAFT;
            component.filterPaymentMethod();
            expect(component.dropdownData).toEqual([{ id: 1, name: "some name", paymentType: PaymentType.BANKDRAFT }]);
        });
        it("should set credit card data in dropdown data when selected radio button is credit card", () => {
            component.selectedRadio = PaymentType.CREDITCARD;
            component.filterPaymentMethod();
            expect(component.dropdownData).toEqual([{ id: 10, name: "some credit card name", paymentType: PaymentType.CREDITCARD }]);
        });
        it("should set debit card data in dropdown data when selected radio button is debit card", () => {
            component.selectedRadio = PaymentType.DEBITCARD;
            component.filterPaymentMethod();
            expect(component.dropdownData).toEqual([{ id: 11, name: "some debit card name", paymentType: PaymentType.DEBITCARD }]);
        });
    });
    describe("validateBankName()", () => {
        it("should return null when backspace is pressed", () => {
            expect(component.validateBankName({ charCode: 8 } as KeyboardEvent)).toBe(null);
        });
        it("should return null when insert key is pressed", () => {
            expect(component.validateBankName({ charCode: 45 } as KeyboardEvent)).toBe(null);
        });
        it("should return null when right arrow is pressed", () => {
            expect(component.validateBankName({ charCode: 39 } as KeyboardEvent)).toBe(null);
        });
        it("should return null when space bar is pressed and there is some bank name entered in form", () => {
            component.bankDraftForm.controls.bankName.setValue("bankName");
            expect(component.validateBankName({ charCode: 32 } as KeyboardEvent)).toBe(null);
        });
        it("should return null when null key is pressed", () => {
            expect(component.validateBankName({ charCode: 0 } as KeyboardEvent)).toBe(null);
        });
    });
    describe("checkIfNewCardAndStateAdded()", () => {
        it("should return true if the selected account is Add new card on calling checkIfNewCardAndStateAdded method", () => {
            component.selectedAccount = "Add new card";
            expect(component.checkIfNewCardAndStateAdded()).toBe(true);
        });
    });
    describe("validateDebitCardNumber()", () => {
        it("should return invalid as true if debit card api error is set to true", () => {
            component.debitCardApiError = true;
            expect(component.validateDebitCardNumber()).toEqual({ invalid: true });
        });
        it("should return null if debit card api error is set to false", () => {
            component.debitCardApiError = false;
            expect(component.validateDebitCardNumber()).toBe(null);
        });
    });
    describe("initializePaymentMethodForm()", () => {
        it("should set method of paymentMethodForm to seletcedPaymentMethod value on calling initializePaymentMethodForm", () => {
            component.selectedPaymentMethod = PaymentType.CREDITCARD;
            component.initializePaymentMethodForm();
            expect(component.paymentMethodForm.controls.method.value).toEqual("CREDIT_CARD");
        });
    });
    describe("updateCheckBox()", () => {
        it("should update check box for bank draft payment type when selected payment type is bank draft", () => {
            component.selectedPaymentMethod = PaymentType.BANKDRAFT;
            component.selectedAccount = "827327128112";
            component.bankAccounts = [{ sameAddressAsHome: true }];
            component.selectedIndex = 0;
            expect(component.updateCheckbox()).toBe(true);
        });
        it("should update check box for credit card payment type when selected payment type is credit card", () => {
            component.selectedPaymentMethod = PaymentType.CREDITCARD;
            component.selectedAccount = "4111111111111";
            component.creditCardAccount = [{ sameAddressAsHome: true }];
            component.selectedIndex = 0;
            expect(component.updateCheckbox()).toBe(true);
        });
        it("should update check box for debit card payment type when selected payment type is debit card", () => {
            component.selectedPaymentMethod = PaymentType.DEBITCARD;
            component.selectedAccount = "4111111111111";
            component.debitCardAccount = [{ sameAddressAsHome: true }];
            component.selectedIndex = 0;
            expect(component.updateCheckbox()).toBe(true);
        });
        it("should return true if user has selected the checkbox", () => {
            component.selectedPaymentMethod = null;
            component.sameAddress = true;
            expect(component.updateCheckbox()).toBe(true);
        });
    });
    describe("checkIfNewCardAndStateAdded()", () => {
        it("should return true if new card or new bank account is selected", () => {
            component.selectedAccount = "Add new account";
            expect(component.checkIfNewCardAndStateAdded()).toBe(true);
            component.selectedAccount = "Add new card";
            expect(component.checkIfNewCardAndStateAdded()).toBe(true);
        });
        it("should return true if tempus config is on, and payment type is credit card and payment method does not billing address", () => {
            component.tempusPaymentConfig = true;
            component.selectedPaymentMethod = PaymentType.CREDITCARD;
            component.selectedIndex = 0;
            component.creditCardAccount = [{ billingName: null }];
            expect(component.checkIfNewCardAndStateAdded()).toBe(true);
        });
    });
    describe("zipLength()", () => {
        it("should return length as true when zip length is less than 5", () => {
            expect(component.zipLength(new FormControl(["1234"]))).toEqual({ length: true });
        });
        it("should return length as true when zip length is less than 9 and not equals to 5", () => {
            expect(component.zipLength(new FormControl(["1234456"]))).toEqual({ length: true });
        });
    });
    describe("initializePaymentMethodForm()", () => {
        it("should set method as selectedPaymentMethod value on initializing payment method form", () => {
            component.selectedPaymentMethod = PaymentType.CREDITCARD;
            component.initializePaymentMethodForm();
            expect(component.paymentMethodForm.value.method).toEqual("CREDIT_CARD");
        });
    });
    describe("checkCarriers()", () => {
        it("should set onlyVSP to true when carrierId is 59", () => {
            component.paymentSteps = [{ carrierId: 59 }];
            component.checkCarriers();
            expect(component.onlyVSP).toBe(true);
        });
        it("should set onlyAflac to true when carrierId is other than 59", () => {
            component.paymentSteps = [{ carrierId: 1 }];
            component.checkCarriers();
            expect(component.onlyAflac).toBe(true);
        });
        it("should set bothCarriers to true when there is more than 1 payment is available and any one payment have carrierId is 59", () => {
            component.paymentSteps = [{ carrierId: 1 }, { carrierId: 59 }];
            component.checkCarriers();
            expect(component.bothCarriers).toBe(true);
        });
    });
    describe("fetchBillingAddress()", () => {
        it("should return billing address on calling fetchBillingAddress method", () => {
            expect(component.fetchBillingAddress()).toEqual({
                address1: "some address",
                address2: "some address2",
                city: "city name",
                state: "state name",
                zip: "123456",
            });
        });
    });
    describe("fetchBillingName()", () => {
        it("should return billing name details on calling fetchBillingName method", () => {
            expect(component.fetchBillingName()).toEqual({
                firstName: "some first name",
                lastName: "some last name",
                middleName: "middle name",
                suffix: "some suffix",
            });
        });
    });
    describe("onVspCardNext()", () => {
        it("should call isValidCard method of paymetric service on calling onVspCardNext", () => {
            const spy = jest.spyOn(paymetricService, "isValidCard");
            component.paymetricAccessTokenVsp = "abc123";
            component.onVspCardNext("1234", "5678");
            expect(spy).toBeCalledWith("1234", "abc123", "5678");
        });
    });
    describe("validateStateZip()", () => {
        it("should call validateStateZip method of static service on calling validateStateZip if new card is added", () => {
            component.selectedAccount = "Add new card";
            const spy = jest.spyOn(staticService, "validateStateZip");
            component.validateStateZip();
            expect(spy).toBeCalledWith("state name", "123456");
        });
        it("should set showSettingForm to true to show settings page if the state and zip matches and new card is added", () => {
            component.selectedAccount = "Add new card";
            jest.spyOn(staticService, "validateStateZip").mockReturnValue(of({}) as Observable<HttpResponse<void>>);
            component.validateStateZip();
            expect(component.showSettingForm).toBe(true);
        });
        it("should set zipApiError to true if state and zip are not matched when new card is added", () => {
            component.selectedAccount = "Add new card";
            jest.spyOn(staticService, "validateStateZip").mockReturnValue(throwError({ status: 404 }));
            component.validateStateZip();
            expect(component.zipApiError).toBe(true);
        });
    });
    describe("saveBankDraft()", () => {
        it("should call addPaymentMethod of member service on calling saveBankDraft method", () => {
            const spy = jest.spyOn(memberService, "addPaymentMethod");
            component.memberId = 1;
            component.mpGroup = 12345;
            component.saveBankDraft();
            expect(spy).toBeCalledWith(
                1,
                12345,
                {
                    accountName: "some account name",
                    accountNumber: "123456789012345",
                    accountType: "savings",
                    bankName: "some bank name",
                    billingAddress: {
                        address1: "some address",
                        address2: "some address2",
                        city: "city name",
                        state: "state name",
                        zip: "123456",
                    },
                    billingName: {
                        firstName: "some first name",
                        lastName: "some last name",
                        middleName: "middle name",
                        suffix: "some suffix",
                    },
                    paymentType: "BANK_DRAFT",
                    routingNumber: "000000000",
                },
                true,
            );
        });
    });
    describe("openPaymentPrompt()", () => {
        beforeEach(() => {
            component.memberId = 1;
            component.mpGroup = 12345;
        });
        it("should open the dialog box for payment details prompt component with editModal value as true to open edit modal on calling openPaymentPrompt method", () => {
            component.creditCardAccount = [{ id: 1, accountName: "firstName", lastFour: "1111" }];
            component.selectedIndex = 0;
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            component.openPaymentPrompt(true);
            expect(spy).toBeCalledWith(PaymentDetailsPromptComponent, {
                data: {
                    editModal: true,
                    memberId: 1,
                    mpGroup: 12345,
                    creditCardDetails: { id: 1, accountName: "firstName", lastFour: "1111" },
                },
            });
        });
        it("should call getConfigurations and getSessions api call to open iframe when editModal passed is false in openPaymentPrompt method", () => {
            const spy1 = jest.spyOn(staticService, "getConfigurations");
            const spy2 = jest.spyOn(paymentService, "getSession");
            component.openPaymentPrompt(false);
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
        });
        beforeEach(() => {
            jest.spyOn(staticService, "getConfigurations").mockReturnValue(
                of([{ value: "some url", name: "some name", dataType: "dataType" }]),
            );
            jest.spyOn(paymentService, "getSession").mockReturnValue(of({ tempusTokenIdentityGuid: "token guid", sessionId: "1234" }));
        });
        it("should open the dialog box for payment details prompt component with iframe url and session data to open the iframe on calling openPaymentPrompt method", () => {
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            component.openPaymentPrompt(false);
            expect(spy).toBeCalledWith(PaymentDetailsPromptComponent, {
                data: {
                    memberId: 1,
                    mpGroup: 12345,
                    tempusIframeURL: "some url",
                    tempusSessionObject: { tempusTokenIdentityGuid: "token guid", sessionId: "1234" },
                },
            });
        });
        it("should open empowered attention modal to display card already added modal", () => {
            jest.spyOn(empoweredModalService, "openDialog").mockReturnValue({
                afterClosed: () =>
                    of({
                        error: {
                            status: 409,
                            code: "duplicate",
                        },
                    }),
            } as MatDialogRef<any>);
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            component.openPaymentPrompt(false);
            expect(spy).toBeCalledWith(EmpoweredAttentionModalComponent, {
                data: {
                    buttonText: "primary.portal.common.ok",
                    message: "primary.portal.applicationFlowSteps.duplicateCard.message",
                    title: "primary.portal.applicationFlowSteps.duplicateCard.title",
                },
            });
        });
        it("should open empowered attention modal to display maximum attempts reached modal", () => {
            jest.spyOn(empoweredModalService, "openDialog").mockReturnValue({
                afterClosed: () =>
                    of({
                        errorCode: 2,
                    }),
            } as MatDialogRef<any>);
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            component.openPaymentPrompt(false);
            expect(spy).toBeCalledWith(EmpoweredAttentionModalComponent, {
                data: {
                    buttonText: "primary.portal.common.ok",
                    message: "primary.portal.applicationFlowSteps.maxAttemptsReached.message",
                    title: "primary.portal.applicationFlowSteps.maxAttemptsReached.title",
                },
            });
        });
        it("should open empowered attention modal to display card validation modal when the card is invalid", () => {
            jest.spyOn(empoweredModalService, "openDialog").mockReturnValue({
                afterClosed: () =>
                    of({
                        errorCode: 3,
                    }),
            } as MatDialogRef<any>);
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            component.openPaymentPrompt(false);
            expect(spy).toBeCalledWith(EmpoweredAttentionModalComponent, {
                data: {
                    buttonText: "primary.portal.common.ok",
                    message: "primary.portal.applicationFlowSteps.cardValidationFailed.message",
                    title: "primary.portal.applicationFlowSteps.cardValidationFailed.title",
                },
            });
        });
        it("should open empowered attention modal to display card validation modal when the card is expired", () => {
            jest.spyOn(empoweredModalService, "openDialog").mockReturnValue({
                afterClosed: () =>
                    of({
                        errorCode: 4,
                    }),
            } as MatDialogRef<any>);
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            component.openPaymentPrompt(false);
            expect(spy).toBeCalledWith(EmpoweredAttentionModalComponent, {
                data: {
                    buttonText: "primary.portal.common.ok",
                    message: "primary.portal.applicationFlowSteps.cardValidationFailed.message",
                    title: "primary.portal.applicationFlowSteps.cardValidationFailed.title",
                },
            });
        });
        it("should call getPaymentMethods function of member service when card is added successfully", () => {
            jest.spyOn(empoweredModalService, "openDialog").mockReturnValue({
                afterClosed: () =>
                    of({
                        accountName: "some account name",
                        paymentType: "CREDIT_CARD",
                    }),
            } as MatDialogRef<any>);
            const spy = jest.spyOn(memberService, "getPaymentMethods");
            component.openPaymentPrompt(false);
            expect(spy).toBeCalledWith(1, 12345);
        });
        it("should set selectedAccount to lastFour of last record in creditCardAccounts array when iframe modal is closed without adding credit card details", () => {
            jest.spyOn(empoweredModalService, "openDialog").mockReturnValue({
                afterClosed: () => of(null),
            } as MatDialogRef<any>);
            component.creditCardAccount = [{ accountName: "some account name", paymentType: "CREDIT_CARD", lastFour: "1234" }];
            component.selectedIndex = 0;
            component.openPaymentPrompt(false);
            expect(component.selectedAccount).toEqual("1234");
        });
        it("should call mapPayments method when the card is added successfully to add newly added card in creditCardAccount array", () => {
            jest.spyOn(empoweredModalService, "openDialog").mockReturnValue({
                afterClosed: () =>
                    of({
                        accountName: "some account name",
                        paymentType: "CREDIT_CARD",
                        lastFour: "1234",
                    }),
            } as MatDialogRef<any>);
            jest.spyOn(memberService, "getPaymentMethods").mockReturnValue(
                of([
                    {
                        name: "some name",
                        paymentType: "CREDIT_CARD",
                        accountName: "some credit card account name",
                        tempusTokenIdentityGuid: "some token",
                    },
                ]),
            );
            component.openPaymentPrompt(false);
            expect(component.creditCardAccount).toEqual([
                {
                    name: "some name",
                    paymentType: "CREDIT_CARD",
                    accountName: "some credit card account name",
                    tempusTokenIdentityGuid: "some token",
                },
            ]);
        });

        it("should set disableAddCard to false on calling openPaymentPrompt method in edit mode", () => {
            component.openPaymentPrompt(true);
            expect(component.disableAddCard).toBe(false);
        });
        it("should set disableAddCard to false on calling openPaymentPrompt method", () => {
            component.openPaymentPrompt(false);
            expect(component.disableAddCard).toBe(false);
        });
    });
    describe("getCardIndex()", () => {
        it("should return the index of credit card from creditCardAccount array when last four digits are matched with last four digits of card number which is passed as a parameter also the payment type is passed as CREDIT_CARD to getCardIndex function", () => {
            component.creditCardAccount = [
                {
                    id: 1,
                    lastFour: "1111",
                    expirationMonth: 4,
                    expirationYear: 2024,
                },
            ];
            expect(component.getCardIndex(4111111111111111, PaymentType.CREDITCARD, new Date(2024, 3))).toEqual(0);
        });
        it("should return the index of debit card from debitCardAccount array when last four digits are matched with last four digits of card number which is passed as a parameter also the payment type is passed as DEBIT_CARD to getCardIndex function", () => {
            component.debitCardAccount = [
                {
                    id: 1,
                    lastFour: "2111",
                    expirationMonth: 3,
                    expirationYear: 2027,
                },
                {
                    id: 2,
                    lastFour: "1111",
                    expirationMonth: 5,
                    expirationYear: 2024,
                },
            ];
            expect(component.getCardIndex(4111111111111111, PaymentType.DEBITCARD, new Date(2024, 4))).toEqual(1);
        });
        it("should return the index as -1 when paymentType passed as BANK_DRAFT to get getCardIndex function", () => {
            expect(component.getCardIndex(4111111111111111, PaymentType.BANKDRAFT, new Date(2024, 4))).toEqual(-1);
        });
    });
    describe("prePopulateAccount()", () => {
        beforeEach(() => {
            component.bankAccounts = [
                {
                    id: 1,
                    name: "some name",
                    paymentType: PaymentType.BANKDRAFT,
                    accountName: "some account name",
                    accountNumberLastFour: "1111",
                    bankName: "some bank name",
                    accountType: "Checking",
                    routingNumber: "123456789",
                },
            ];
            component.validationRegex = { BANK_NAME: "some bank name regex" };
        });
        it("should set the bank draft last four digit routing number when prePopulate account is called with method as BANK_DRAFT", () => {
            component.prePopulateAccount(PaymentType.BANKDRAFT, 0);
            expect(component.routingNumberLastFourDigits).toEqual("6789");
        });
        it("should set the selectedAccount value to selected bank accountName value when enablePaymetricBankDraft value is true and when prePopulate account is called with method as BANK_DRAFT", () => {
            component.enablePaymetricBankDraft = true;
            component.prePopulateAccount(PaymentType.BANKDRAFT, 0);
            expect(component.selectedAccount).toEqual("some account name");
        });
    });
    describe("validateDateFormat()", () => {
        it("should set credit card error to null and return null when payment type credit card is selected and backspace pressed", () => {
            expect(component.validateDateFormat({ charCode: 8 } as KeyboardEvent, PaymentType.CREDITCARD)).toBe(null);
            expect(component.creditCardForm.controls.cardNumber.errors).toBe(null);
        });
        it("should set debit card error to null and return null when payment type debit card is selected and backspace pressed", () => {
            expect(component.validateDateFormat({ charCode: 8 } as KeyboardEvent, PaymentType.DEBITCARD)).toBe(null);
            expect(component.debitCardForm.controls.cardNumber.errors).toBe(null);
        });
    });
    describe("validateRoutingNumber()", () => {
        it("should return invalid as true if routing number api error is set to true", () => {
            component.routingApiError = true;
            expect(component.validateRoutingNumber()).toEqual({ invalid: true });
        });
        it("should return null if routing number api error is set to false", () => {
            component.routingApiError = false;
            expect(component.validateRoutingNumber()).toBe(null);
        });
    });
    describe("getAccountId()", () => {
        it("should update savedPaymentIdIndex value to the index of method present in both bankAccounts and paymentMethods when the type is BANK_DRAFT and savedPaymentIdIndex value is greater than or equal to 0", () => {
            component.paymentMethods = [
                {
                    id: 1,
                    paymentType: "BANK_DRAFT",
                    tempusTokenIdentityGuid: "some bank draft guid",
                },
            ];
            component.bankAccounts = [
                {
                    id: 0,
                    paymentType: "BANK_DRAFT",
                    tempusTokenIdentityGuid: "some bank draft guid",
                    accountNumber: "4111111111111111",
                },
                {
                    id: 1,
                    paymentType: "BANK_DRAFT",
                    tempusTokenIdentityGuid: "some bank draft guid",
                    accountNumber: "4222222222222222",
                },
            ];
            component.enablePaymetricBankDraft = true;
            component.savedPaymentIdIndex = 0;
            component.getAccountId(PaymentType.BANKDRAFT);
            expect(component.savedPaymentIdIndex).toEqual(1);
        });
        it("should update savedPaymentIdIndex value to the index of method present in both bankAccounts and paymentMethods when the type is BANK_DRAFT and savedPaymentIdIndex value is less than 0", () => {
            component.paymentMethods = [
                {
                    id: 1,
                    paymentType: "BANK_DRAFT",
                },
                {
                    id: 2,
                    paymentType: "BANK_DRAFT",
                    tempusTokenIdentityGuid: "some bank draft guid",
                },
            ];
            component.bankAccounts = [
                {
                    id: 1,
                    paymentType: "BANK_DRAFT",
                    tempusTokenIdentityGuid: "some bank draft guid",
                    accountNumber: "4222222222222222",
                },
                {
                    id: 2,
                    paymentType: "BANK_DRAFT",
                    tempusTokenIdentityGuid: "some bank draft guid",
                    accountNumber: "4111111111111111",
                },
            ];
            component.enablePaymetricBankDraft = true;
            component.savedPaymentIdIndex = -1;
            component.getAccountId(PaymentType.BANKDRAFT);
            expect(component.savedPaymentIdIndex).toEqual(0);
        });
        it("should update savedPaymentIdIndex value to the index of method present in both creditCardAccount and paymentMethods when the type is CREDIT_CARD and savedPaymentIdIndex value is greater than or equal to 0", () => {
            component.paymentMethods = [
                {
                    id: 1,
                    paymentType: "CREDIT_CARD",
                    tempusTokenIdentityGuid: "some credit card guid",
                },
            ];
            component.creditCardAccount = [
                {
                    id: 0,
                    paymentType: "CREDIT_CARD",
                    tempusTokenIdentityGuid: "some credit card guid",
                    accountNumber: "4111111111111111",
                },
                {
                    id: 1,
                    paymentType: "CREDIT_CARD",
                    tempusTokenIdentityGuid: "some credit card guid",
                    accountNumber: "4222222222222222",
                },
            ];
            component.enableDebitCardBilling = true;
            component.savedPaymentIdIndex = 0;
            component.getAccountId(PaymentType.CREDITCARD);
            expect(component.savedPaymentIdIndex).toEqual(1);
        });
        it("should update savedPaymentIdIndex value to the index of method present in both creditCardAccount and paymentMethods when the type is CREDIT_CARD and savedPaymentIdIndex value is less than 0", () => {
            component.paymentMethods = [
                {
                    id: 1,
                    paymentType: "CREDIT_CARD",
                },
                {
                    id: 2,
                    paymentType: "CREDIT_CARD",
                    tempusTokenIdentityGuid: "some credit card guid",
                },
            ];
            component.creditCardAccount = [
                {
                    id: 1,
                    paymentType: "CREDIT_CARD",
                    tempusTokenIdentityGuid: "some credit card guid",
                    accountNumber: "4222222222222222",
                },
                {
                    id: 2,
                    paymentType: "CREDIT_CARD",
                    tempusTokenIdentityGuid: "some credit card guid",
                    accountNumber: "4111111111111111",
                },
            ];
            component.enableDebitCardBilling = true;
            component.savedPaymentIdIndex = -1;
            component.getAccountId(PaymentType.CREDITCARD);
            expect(component.savedPaymentIdIndex).toEqual(0);
        });
        it("should update savedPaymentIdIndex value to the index of method present in both debitCardAccount and paymentMethods when the type is DEBIT_CARD and savedPaymentIdIndex value is greater than or equal to 0", () => {
            component.paymentMethods = [
                {
                    id: 1,
                    paymentType: "DEBIT_CARD",
                },
            ];
            component.debitCardAccount = [
                {
                    id: 0,
                    paymentType: "DEBIT_CARD",
                    accountNumber: "4111111111111111",
                },
                {
                    id: 1,
                    paymentType: "DEBIT_CARD",
                    accountNumber: "4222222222222222",
                },
            ];
            component.savedPaymentIdIndex = 0;
            component.getAccountId(PaymentType.DEBITCARD);
            expect(component.savedPaymentIdIndex).toEqual(1);
        });
        it("should update savedPaymentIdIndex value to the index of method present in both creditCardAccount and paymentMethods when the type is CREDIT_CARD and payment type is DEBIT_CARD and savedPaymentIdIndex value is less than 0", () => {
            component.paymentMethods = [
                {
                    id: 1,
                    paymentType: "DEBIT_CARD",
                    tempusTokenIdentityGuid: "some token",
                },
            ];
            component.creditCardAccount = [
                {
                    id: 0,
                    paymentType: "CREDIT_CARD",
                    accountNumber: "4111111111111111",
                },
                {
                    id: 1,
                    paymentType: "DEBIT_CARD",
                    accountNumber: "4222222222222222",
                },
            ];
            component.savedPaymentIdIndex = -1;
            component.getAccountId(PaymentType.CREDITCARD);
            expect(component.savedPaymentIdIndex).toEqual(1);
        });
    });
    describe("getConfigurationSpecifications()", () => {
        it("should call fetchConfigs api to fetch the configson calling getConfigurationSpecifications", () => {
            const spy = jest.spyOn(staticUtilService, "fetchConfigs");
            component.mpGroup = 12345;
            component.getConfigurationSpecifications();
            expect(spy).toBeCalledWith(
                [
                    "user.enrollment.telephone_initial_placeholder",
                    "user.enrollment.telephone_signature_placeholder",
                    "user.payment.authorization_agreement",
                ],
                12345,
            );
        });
        it("should set customerInitials,customerSign,showSignerAgreement from the response received by fetchConfigs api call", () => {
            jest.spyOn(staticUtilService, "fetchConfigs").mockReturnValue(
                of([
                    { name: "customer initials", value: "a,b,c", dataType: "some dataType" },
                    { name: "customer sign", value: "c,d,e", dataType: "some dataType" },
                    { name: "signer agreement", value: "TRUE", dataType: "some dataType" },
                ] as Configurations[]),
            );
            component.mpGroup = 12345;
            component.getConfigurationSpecifications();
            expect(component.customerInitial).toEqual("a");
            expect(component.customerSign).toEqual("c");
            expect(component.showSignerAgreement).toBe(true);
        });
    });

    describe("savePaymentResponse()", () => {
        it("should call saveApplicationResponse when savePaymentResponse method is called", () => {
            const spy = jest.spyOn(shoppingCartDisplayService, "saveApplicationResponse");
            component.onlyVSP = false;
            component.paymentSteps = [
                {
                    itemId: 33,
                    steps: [
                        {
                            id: 357365,
                            type: "PAYMENT",
                            constraintAggregates: {
                                skip: {},
                                show: {},
                            },
                            allowedPayFrequencies: ["MONTHLY", "QUARTERLY", "SEMI_ANNUALLY", "ANNUALLY"],
                            allowedAchGroupPayFrequencies: ["MONTHLY"],
                            completed: true,
                        },
                    ],
                    planId: 11543,
                    flowId: 26541,
                    carrierId: 1,
                    applicationType: "NEW",
                },
            ];
            component.savePaymentResponse();
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("deleteAccount()", () => {
        it("should call openDialog method and should open the EditDeletePaymentComponent", () => {
            component.bankAccounts = [{ id: 1, name: "some name", paymentType: PaymentType.BANKDRAFT }];
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            component.mpGroup = 12345;
            component.memberId = 1;
            component.selectedIndex = 0;
            component.isACHPartnerAccountType = true;
            component.deleteAccount();
            expect(spy).toBeCalledWith(EditDeletePaymentComponent, {
                data: {
                    selectedIndex: { id: 1, name: "some name", paymentType: PaymentType.BANKDRAFT },
                    selectedPaymentMethod: "BANK_DRAFT",
                    delete: true,
                    mpGroup: 12345,
                    memberId: 1,
                    isACHPartnerAccountType: true,
                },
            });
        });
        it("should call getPaymentMethods api call on closing edit delete payment modal", () => {
            jest.spyOn(empoweredModalService, "openDialog").mockReturnValue({
                afterClosed: () => of({}),
            } as MatDialogRef<any>);
            component.mpGroup = 12345;
            component.memberId = 1;
            const spy = jest.spyOn(memberService, "getPaymentMethods");
            component.deleteAccount();
            expect(spy).toBeCalledWith(1, 12345);
        });
        it("should set bankAccounts to empty array on closing edit delete payment modal", () => {
            jest.spyOn(empoweredModalService, "openDialog").mockReturnValue({
                afterClosed: () => of({}),
            } as MatDialogRef<any>);
            component.mpGroup = 12345;
            component.memberId = 1;
            jest.spyOn(memberService, "getPaymentMethods").mockReturnValue(
                of({ id: 1, name: "some name", paymentType: PaymentType.BANKDRAFT }),
            );
            component.deleteAccount();
            expect(component.bankAccounts).toEqual([]);
        });
    });
    describe("mapAccountData()", () => {
        it("should set selectedAccount and selectedIndex if the same record present in editedPaymentData and bankAccounts when bank draft config is off", () => {
            component.paymentMethods = [{ id: 1, name: "some name", paymentType: PaymentType.BANKDRAFT }];
            component.enablePaymetricBankDraft = true;
            component.selectedRadio = "BANK_DRAFT";
            component.mapAccountData({
                id: 1,
                closed: true,
                action: "some action",
                updatedData: {
                    accountName: "some account name",
                },
                accountType: AccountType.CHECKING,
            });
            expect(component.selectedIndex).toEqual(0);
            expect(component.selectedAccount).toEqual("some account name");
        });
        it("should set selectedAccount and selectedIndex if the same record present in editedPaymentData and creditCardAccount when tempus config is off for credit and debit", () => {
            component.paymentMethods = [{ id: 10, name: "some credit card name", paymentType: PaymentType.CREDITCARD }];
            component.enableDebitCardBilling = true;
            component.selectedRadio = "CREDIT_CARD";
            component.mapAccountData({
                id: 10,
                closed: true,
                action: "some action",
                updatedData: {
                    lastFour: "1111",
                },
                accountType: null,
            });
            expect(component.selectedIndex).toEqual(0);
            expect(component.selectedAccount).toEqual("1111");
        });
        it("should set selectedAccount and selectedIndex if the same record present in editedPaymentData and debitCardAccount when tempus config is off for credit and debit", () => {
            component.paymentMethods = [{ id: 11, name: "some debit card name", paymentType: PaymentType.DEBITCARD }];
            component.enableDebitCardBilling = true;
            component.selectedRadio = "DEBIT_CARD";
            component.mapAccountData({
                id: 11,
                closed: true,
                action: "some action",
                updatedData: {
                    lastFour: "1112",
                },
                accountType: null,
            });
            expect(component.selectedIndex).toEqual(0);
            expect(component.selectedAccount).toEqual("1112");
        });
    });
    describe("editAccount()", () => {
        it("should open edit modal of credit card on calling editAccount function when tempusConfig is on", () => {
            component.creditCardAccount = [{ id: 1, accountName: "firstName", lastFour: "1111" }];
            component.memberId = 1;
            component.mpGroup = 12345;
            component.selectedIndex = 0;
            component.enableDebitCardBilling = false;
            component.selectedPaymentMethod = PaymentType.CREDITCARD;
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            component.editAccount();
            expect(spy).toBeCalledWith(PaymentDetailsPromptComponent, {
                data: {
                    editModal: true,
                    memberId: 1,
                    mpGroup: 12345,
                    creditCardDetails: { id: 1, accountName: "firstName", lastFour: "1111" },
                },
            });
        });
        it("should open edit modal of bankDraft on calling editAccount function when bankDraftTempusConfig is on", () => {
            jest.clearAllMocks();
            component.bankAccounts = [{ id: 1, name: "some name", paymentType: PaymentType.BANKDRAFT }];
            component.memberId = 1;
            component.mpGroup = 12345;
            component.selectedIndex = 0;
            component.enablePaymetricBankDraft = false;
            component.enableDebitCardBilling = true;
            component.selectedPaymentMethod = PaymentType.BANKDRAFT;
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            component.editAccount();
            expect(spy).toBeCalledWith(PaymentDetailsPromptComponent, {
                data: {
                    editModal: true,
                    memberId: 1,
                    mpGroup: 12345,
                    paymentMethod: "BANK_DRAFT",
                    bankDraftDetails: { id: 1, name: "some name", paymentType: PaymentType.BANKDRAFT },
                },
            });
        });
    });
    describe("openBankDraftPrompt()", () => {
        beforeEach(() => {
            component.memberId = 1;
            component.mpGroup = 12345;
        });
        it("should open the dialog box for payment details prompt component with editModal value as true to open edit modal on calling openBankDraftPrompt method", () => {
            component.bankAccounts = [{ id: 1, accountName: "firstName", accountNumber: "1111" }];
            component.selectedIndex = 0;
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            component.openBankDraftPrompt(true);
            expect(spy).toBeCalledWith(PaymentDetailsPromptComponent, {
                data: {
                    editModal: true,
                    memberId: 1,
                    mpGroup: 12345,
                    bankDraftDetails: { id: 1, accountName: "firstName", accountNumber: "1111" },
                    paymentMethod: "BANK_DRAFT",
                },
            });
        });
        it("should call getConfigurations and getSessions api call to open iframe when editModal passed is false in openBankDraftPrompt method", () => {
            const spy1 = jest.spyOn(staticService, "getConfigurations");
            const spy2 = jest.spyOn(paymentService, "getSession");
            component.openBankDraftPrompt(false);
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
        });
        beforeEach(() => {
            jest.spyOn(staticService, "getConfigurations").mockReturnValue(
                of([{ value: "some url", name: "some name", dataType: "dataType" }]),
            );
            jest.spyOn(paymentService, "getSession").mockReturnValue(of({ tempusTokenIdentityGuid: "token guid", sessionId: "1234" }));
        });
        it("should open the dialog box for payment details prompt component with iframe url and session data to open the iframe on calling openBankDraftPrompt method", () => {
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            component.openBankDraftPrompt(false);
            expect(spy).toBeCalledWith(PaymentDetailsPromptComponent, {
                data: {
                    memberId: 1,
                    mpGroup: 12345,
                    tempusIframeURL: "some url",
                    tempusSessionObject: { tempusTokenIdentityGuid: "token guid", sessionId: "1234" },
                    paymentMethod: "BANK_DRAFT",
                },
            });
        });
        it("should open empowered attention modal to display account already added modal", () => {
            jest.spyOn(empoweredModalService, "openDialog").mockReturnValue({
                afterClosed: () =>
                    of({
                        error: {
                            status: 409,
                            code: "duplicate",
                        },
                    }),
            } as MatDialogRef<any>);
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            component.openBankDraftPrompt(false);
            expect(spy).toBeCalledWith(EmpoweredAttentionModalComponent, {
                data: {
                    buttonText: "primary.portal.common.ok",
                    message: "primary.portal.applicationFlowSteps.duplicateAccount.message",
                    title: "primary.portal.applicationFlowSteps.duplicateAccount.title",
                },
            });
        });
        it("should set selectedAccount value to the selectedIndex value present in bankAccounts", () => {
            jest.spyOn(empoweredModalService, "openDialog").mockReturnValue({
                afterClosed: () => of(null),
            } as MatDialogRef<any>);
            component.bankAccounts = [{ id: 1, name: "some name", paymentType: PaymentType.BANKDRAFT }];
            component.selectedIndex = 0;
            component.openBankDraftPrompt(false);
            expect(component.selectedAccount).toEqual("1");
        });
        it("should open account validation failed modal when account is blocked", () => {
            jest.spyOn(empoweredModalService, "openDialog").mockReturnValue({
                afterClosed: () =>
                    of({
                        errorCode: 5,
                    }),
            } as MatDialogRef<any>);
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            component.openBankDraftPrompt(false);
            expect(spy).toBeCalledWith(EmpoweredAttentionModalComponent, {
                data: {
                    buttonText: "primary.portal.common.ok",
                    message: "primary.portal.applicationFlowSteps.accountValidationFailedBlocked.message",
                    title: "primary.portal.applicationFlowSteps.accountValidationFailed.title",
                },
            });
        });
        it("should set disableAddAccount to false on calling openBankDraftPrompt method in edit mode", () => {
            component.openBankDraftPrompt(true);
            expect(component.disableAddAccount).toBe(false);
        });
        it("should set disableAddAccount to true on calling openBankDraftPrompt method", () => {
            component.openBankDraftPrompt(false);
            expect(component.disableAddAccount).toBe(false);
        });
    });
    describe("serviceCalls()", () => {
        beforeEach(() => {
            component.memberId = 1;
            component.mpGroup = 12345;
        });
        it("should call configurations with ach edit retire config enum value", () => {
            const spy1 = jest.spyOn(staticService, "getConfigurations");
            component.serviceCalls();
            expect(spy1).toBeCalledWith("general.feature.enable.ach_edit_tempus_payment_service", component.mpGroup);
        });
        it("should set false value to achBankDraftEditEnableConfig when serviceCalls method is called", () => {
            jest.spyOn(staticService, "getConfigurations").mockReturnValue(
                of([{ value: "FALSE", name: "some name", dataType: "dataType" }]),
            );
            component.serviceCalls();
            expect(component.achBankDraftEditEnableConfig).toBe(false);
        });
        it("should set true value to achBankDraftEditEnableConfig when serviceCalls method is called", () => {
            jest.spyOn(staticService, "getConfigurations").mockReturnValue(
                of([{ value: "TRUE", name: "some name", dataType: "dataType" }]),
            );
            component.serviceCalls();
            expect(component.achBankDraftEditEnableConfig).toBe(true);
        });
    });
    describe("savePaymentMethod()", () => {
        beforeEach(() => {
            component.monthNames = ["January"];
            component.paymentId = 1;
            component.paymentSteps = [
                {
                    itemId: 123,
                    planId: 12345,
                    steps: [{ id: 12, type: "PAYMENT" }],
                },
            ];
            component.cartItemsToUpdate = [{ assistingAdminId: 1234, totalCost: 200, memberCost: 30.8, planOfferingId: 18 }];
            component.cartData = [
                {
                    acknowledged: false,
                    applicationId: 1234,
                    applicationType: "NEW",
                    assistingAdminId: 213,
                    coverageEffectiveDate: "2023-11-24",
                    coverageLevelId: 12,
                    enrollmentCity: "Abbeville",
                    enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                    enrollmentState: "GA",
                    id: 12,
                    lastAnsweredId: 87,
                    memberCost: 12.0,
                    requiresSignature: true,
                    riskClassOverrideId: 4,
                    status: "COMPLETE",
                    totalCost: 21.8,
                    riders: [],
                    planOfferingId: 12,
                    coverageValidity: { effectiveStarting: "2023-11-24", expiresAfter: "2023-12-12" },
                    benefitAmount: 8723,
                    recentChange: { changeDate: "2023-10-10", previousCost: 1234 },
                },
            ];
        });
        it("should disable the finish application button and enable the button again after single click to avoid calling multiple updatePayment api when selectedPaymentMethod is credit card", () => {
            component.enableDebitCardBilling = false;
            component.selectedPaymentMethod = PaymentType.CREDITCARD;
            component.selectedIndex = 0;
            component.creditCardAccount = [{ id: 1, accountName: "firstName", lastFour: "1111" }];
            jest.spyOn(memberService, "updatePaymentMethod").mockReturnValue(of({}) as Observable<HttpResponse<void>>);
            jest.spyOn(shoppingCartDisplayService, "saveApplicationResponse").mockReturnValue(of({}) as Observable<ApplicationResponse>);
            jest.spyOn(shoppingService, "updateCartItem").mockReturnValue(of({}) as Observable<HttpResponse<unknown>>);
            component.savePaymentMethod();
            expect(component.disableNextButton).toBe(false);
        });
        it("should disable the finish application button and enable the button again after single click if in case updatePayment api is failed when selectedPaymentMethod is credit card", () => {
            component.enableDebitCardBilling = false;
            component.selectedPaymentMethod = PaymentType.CREDITCARD;
            component.selectedIndex = 0;
            component.creditCardAccount = [{ id: 1, accountName: "firstName", lastFour: "1111" }];
            component.paymentId = 1;
            jest.spyOn(memberService, "updatePaymentMethod").mockReturnValue(throwError({ status: 404 }));
            component.savePaymentMethod();
            expect(component.disableNextButton).toBe(false);
        });
        it("should enable the button when clicking on VSP billing finish application button", () => {
            component.enableDebitCardBilling = true;
            component.enablePaymetricBankDraft = true;
            component.onlyVSP = true;
            jest.spyOn(shoppingCartDisplayService, "saveApplicationResponse").mockReturnValue(of({}) as Observable<ApplicationResponse>);
            jest.spyOn(shoppingService, "updateCartItem").mockReturnValue(of({}) as Observable<HttpResponse<unknown>>);
            component.savePaymentMethod();
            expect(component.disableNextButton).toBe(false);
        });
        it("should disable the finish application button and enable the button again after single click to avoid calling multiple updatePayment api when selectedPaymentMethod is bank draft", () => {
            component.enablePaymetricBankDraft = false;
            component.selectedPaymentMethod = PaymentType.BANKDRAFT;
            component.selectedIndex = 0;
            component.bankAccounts = [{ id: 1, name: "some name", paymentType: PaymentType.BANKDRAFT }];
            jest.spyOn(memberService, "updatePaymentMethod").mockReturnValue(of({}) as Observable<HttpResponse<void>>);
            jest.spyOn(shoppingCartDisplayService, "saveApplicationResponse").mockReturnValue(of({}) as Observable<ApplicationResponse>);
            jest.spyOn(shoppingService, "updateCartItem").mockReturnValue(of({}) as Observable<HttpResponse<unknown>>);
            component.savePaymentMethod();
            expect(component.disableNextButton).toBe(false);
        });
        it("should disable the finish application button and enable the button again after single click if in case updatePayment api is failed when selectedPaymentMethod is bank draft", () => {
            component.enablePaymetricBankDraft = false;
            component.selectedPaymentMethod = PaymentType.BANKDRAFT;
            component.selectedIndex = 0;
            component.bankAccounts = [{ id: 1, name: "some name", paymentType: PaymentType.BANKDRAFT }];
            component.paymentId = 1;
            jest.spyOn(memberService, "updatePaymentMethod").mockReturnValue(throwError({ status: 404 }));
            component.savePaymentMethod();
            expect(component.disableNextButton).toBe(false);
        });
        it("should disable and again enable finish application button after single click when save application response is failed and when selectedPaymentMethod is bank draft", () => {
            component.enablePaymetricBankDraft = false;
            component.selectedPaymentMethod = PaymentType.BANKDRAFT;
            component.selectedIndex = 0;
            component.bankAccounts = [{ id: 1, name: "some name", paymentType: PaymentType.BANKDRAFT }];
            jest.spyOn(memberService, "updatePaymentMethod").mockReturnValue(of({}) as Observable<HttpResponse<void>>);
            jest.spyOn(shoppingCartDisplayService, "saveApplicationResponse").mockReturnValue(throwError({ status: 404 }));
            jest.spyOn(shoppingService, "updateCartItem").mockReturnValue(of({}) as Observable<HttpResponse<unknown>>);
            component.savePaymentMethod();
            expect(component.disableNextButton).toBe(false);
        });
        it("should avoid disabling finish application button if agree checkbox is not selected and when selectedPaymentMethod is bank draft", () => {
            component.enablePaymetricBankDraft = false;
            component.settingForm.controls.agree.setValue(false);
            component.savePaymentMethod();
            expect(component.disableNextButton).toBe(false);
        });
    });
});
