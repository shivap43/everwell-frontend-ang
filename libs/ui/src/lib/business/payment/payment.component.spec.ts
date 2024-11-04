import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { LanguageService } from "@empowered/language";
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
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
    mockDomSanitizer,
    mockDateService,
    mockUtilService,
    mockPaymentService,
    MockMaskPaymentPipe,
} from "@empowered/testing";
import {
    AccountService,
    ApplicationService,
    MemberService,
    PaymentService,
    ShoppingCartDisplayService,
    ShoppingService,
    StaticService,
} from "@empowered/api";
import { DatePipe } from "@angular/common";

import { PaymentComponent } from "./payment.component";
import { AppFlowService, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { EmpoweredModalService, PaymetricService } from "@empowered/common-services";
import { UserService } from "@empowered/user";
import { DomSanitizer } from "@angular/platform-browser";
import { DateService } from "@empowered/date";
import { RouterTestingModule } from "@angular/router/testing";
import { ApplicationResponse, PaymentType } from "@empowered/constants";
import { PaymentDetailsPromptComponent } from "../../components/payment-details-prompt/payment-details-prompt.component";
import { EmpoweredAttentionModalComponent } from "../../components/empowered-attention-modal/empowered-attention-modal.component";
import { Observable, of, throwError } from "rxjs";
import { MatDialogRef } from "@angular/material/dialog";
import { HttpResponse } from "@angular/common/http";
import { MatDatepicker } from "@angular/material/datepicker";
import { EditDeletePaymentComponent } from "../edit-delete-payment/edit-delete-payment.component";

@Directive({
    selector: "[empoweredDateTransform]",
})
class MockDateTransformDirective {
    @Input() notCalenderFormat: boolean;
}
@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[matDatepicker]",
})
class MockMatDatePickerDirective {
    @Input() matDatepicker!: MatDatepicker<unknown>;
}
@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[disableControl]",
})
class MockDisableControlDirective {
    @Input() disableControl: boolean;
}

describe("PaymentComponent", () => {
    let component: PaymentComponent;
    let fixture: ComponentFixture<PaymentComponent>;
    const formBuilder = new FormBuilder();
    let empoweredModalService: EmpoweredModalService;
    let paymentService: PaymentService;
    let staticService: StaticService;
    let memberService: MemberService;
    let staticUtilService: StaticUtilService;
    let shoppingCartDisplayService: ShoppingCartDisplayService;
    let store: Store;
    let appFlowService: AppFlowService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                PaymentComponent,
                MockDateTransformDirective,
                MockMatDatePickerDirective,
                MockMaskPaymentPipe,
                MockDisableControlDirective,
            ],
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
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, ReactiveFormsModule, RouterTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PaymentComponent);
        component = fixture.componentInstance;
        component.bankDraftForm = formBuilder.group({
            accountName: ["some account name"],
            bankName: ["some bank name"],
            accountType: ["savings"],
            accountNumber: ["123456789012345"],
            routingNumber: ["000000000"],
            reAccountNumber: ["123456789012345"],
        });
        empoweredModalService = TestBed.inject(EmpoweredModalService);
        paymentService = TestBed.inject(PaymentService);
        staticService = TestBed.inject(StaticService);
        memberService = TestBed.inject(MemberService);
        component.creditCardForm = formBuilder.group({
            cardNumber: ["4111"],
            expirationDate: ["04/2024"],
        });
        component.debitCardForm = formBuilder.group({
            cardNumber: ["4111"],
            expirationDate: ["04/2024"],
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
        component.paymentMethodForm = formBuilder.group({
            method: [PaymentType.BANKDRAFT],
        });
        staticUtilService = TestBed.inject(StaticUtilService);
        component.settingForm = formBuilder.group({
            frequency: ["anually"],
            date: ["15/07"],
            agree: [true],
            initials: ["initials"],
        });
        shoppingCartDisplayService = TestBed.inject(ShoppingCartDisplayService);
        store = TestBed.inject(Store);
        appFlowService = TestBed.inject(AppFlowService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
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
    describe("toggleNoPaymentError()", () => {
        it("should set showNoCardError to true if user added new card and when user tries to navigate to billing page without adding any payment method", () => {
            component.selectedAccount = "Add new card";
            component.toggleNoPaymentError();
            expect(component.showNoCardError).toBe(true);
        });
        it("should set showNoCardError to false when either a card is added, or bank draft payment type is selected or PNC config is turned off", () => {
            component.selectedAccount = "Add new card";
            component.enableDebitCardBilling = true;
            component.toggleNoPaymentError();
            expect(component.showNoCardError).toBe(false);
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
    describe("checkCompleteStatus()", () => {
        it("should set showEnroll to true for showing aflac always enroll screen if stepPosition is 0", () => {
            component.stepPosition = 0;
            component.showEnroll = false;
            component.checkCompleteStatus();
            expect(component.showEnroll).toBe(true);
        });
        it("should set showPayment to true for showing payment screen if stepPosition is 1", () => {
            component.stepPosition = 1;
            component.showPayment = false;
            component.checkCompleteStatus();
            expect(component.showPayment).toBe(true);
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
    describe("initializePaymentMethodForm()", () => {
        it("should set method of paymentMethodForm to seletcedPaymentMethod value on calling initializePaymentMethodForm", () => {
            component.selectedPaymentMethod = PaymentType.CREDITCARD;
            component.initializePaymentMethodForm();
            expect(component.paymentMethodForm.controls.method.value).toEqual("CREDIT_CARD");
        });
        it("should set method of paymentMethodForm to Bank draft value if there is no value in application responses", () => {
            component.selectedPaymentMethod = undefined;
            component.initializePaymentMethodForm();
            expect(component.paymentMethodForm.controls.method.value).toEqual("BANK_DRAFT");
        });
    });
    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy1 = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");

            fixture.destroy();

            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
    describe("validateCreditCardNumber()", () => {
        it("should return invalid as true if credit card api error is set to true", () => {
            component.creditCardApiError = true;
            expect(component.validateCreditCardNumber()).toEqual({ invalid: true });
        });
        it("should return null if credit card api error is set to false", () => {
            component.creditCardApiError = false;
            expect(component.validateCreditCardNumber()).toBe(null);
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
    describe("checkIfNewCardAndStateAdded()", () => {
        it("should return true if the selected account is Add new card on calling checkIfNewCardAndStateAdded method", () => {
            component.selectedAccount = "Add new card";
            expect(component.checkIfNewCardAndStateAdded()).toBe(true);
        });
        it("should return true if the selected account is Add new account on calling checkIfNewCardAndStateAdded method", () => {
            component.selectedAccount = "Add new account";
            expect(component.checkIfNewCardAndStateAdded()).toBe(true);
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
    describe("zipLength()", () => {
        it("should return length as true when zip length is less than 5", () => {
            expect(component.zipLength(new FormControl(["1234"]))).toEqual({ length: true });
        });
        it("should return length as true when zip length is not equal to 5 and length should be in between 5 to 9", () => {
            expect(component.zipLength(new FormControl(["1234567"]))).toEqual({ length: true });
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
    describe("closeNoPaymentInfoAlert()", () => {
        it("should set showNoCardError to false when selected payment method is credit card", () => {
            component.closeNoPaymentInfoAlert();
            expect(component.showNoCardError).toBe(false);
        });
        it("should set showNoAccountError to false when selected payment method is other than credit card", () => {
            component.closeNoPaymentInfoAlert();
            expect(component.showNoAccountError).toBe(false);
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
    });
    describe("getAccountId()", () => {
        it("should update savedPaymentIdIndex value to the index of method present in both bankAccounts and paymentMethods when the type is BANK_DRAFT and savedPaymentIdIndex value is greater than or equal to 0", () => {
            component.paymentMethods = [
                {
                    id: 1,
                    paymentType: "BANK_DRAFT",
                    tempusTokenIdentityGuid: "some bank draft token guid",
                },
            ];
            component.bankAccounts = [
                {
                    id: 0,
                    paymentType: "BANK_DRAFT",
                    tempusTokenIdentityGuid: "some bank draft token guid",
                    accountNumber: "4222222222222222",
                },
                {
                    id: 1,
                    paymentType: "BANK_DRAFT",
                    tempusTokenIdentityGuid: "some bank draft token guid",
                    accountNumber: "4111111111111111",
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
                    tempusTokenIdentityGuid: "some bank draft token guid",
                },
            ];
            component.bankAccounts = [
                {
                    id: 1,
                    paymentType: "BANK_DRAFT",
                    tempusTokenIdentityGuid: "some bank draft token guid",
                    accountNumber: "4111111111111111",
                },
                {
                    id: 2,
                    paymentType: "BANK_DRAFT",
                    tempusTokenIdentityGuid: "some bank draft guid",
                    accountNumber: "4222222222222222",
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
                    tempusTokenIdentityGuid: "some credit card token guid",
                },
            ];
            component.creditCardAccount = [
                {
                    id: 0,
                    paymentType: "CREDIT_CARD",
                    tempusTokenIdentityGuid: "some credit card token guid",
                    accountNumber: "4111111111111111",
                },
                {
                    id: 1,
                    paymentType: "CREDIT_CARD",
                    tempusTokenIdentityGuid: "some credit card token guid",
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
                    tempusTokenIdentityGuid: "some credit card token guid",
                    accountNumber: "4111111111111111",
                },
                {
                    id: 2,
                    paymentType: "CREDIT_CARD",
                    tempusTokenIdentityGuid: "some credit card token guid",
                    accountNumber: "4222222222222222",
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
                    accountNumber: "4222222222222222",
                },
                {
                    id: 1,
                    paymentType: "DEBIT_CARD",
                    accountNumber: "4111111111111111",
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
    });
    describe("saveAflacAlways()", () => {
        beforeEach(() => {
            component.paymentId = 1;
            component.isEnrolled = "yes";
            component.aflacSteps = [
                {
                    itemId: 12,
                    planId: 15,
                    steps: [
                        {
                            allowedPayFrequencies: ["Monthly", "quarterly"],
                            completed: false,
                            id: 618,
                            title: "Aflac Always",
                            type: "AFLAC_ALWAYS",
                            question: {
                                id: 12,
                                key: "some key",
                            },
                        },
                        {
                            allowedPayFrequencies: ["Monthly", "quarterly"],
                            completed: false,
                            id: 619,
                            title: "Aflac Always",
                            type: "AFLAC_ALWAYS",
                            question: {
                                id: 15,
                                key: "some key",
                            },
                        },
                        {
                            allowedPayFrequencies: ["Monthly", "quarterly"],
                            completed: false,
                            id: 620,
                            title: "Aflac Always",
                            type: "AFLAC_ALWAYS",
                            question: {
                                id: 14,
                                key: "some key",
                            },
                        },
                        {
                            allowedPayFrequencies: ["Monthly", "quarterly"],
                            completed: false,
                            id: 621,
                            title: "Aflac Always",
                            type: "AFLAC_ALWAYS",
                            question: {
                                id: 13,
                                key: "some key",
                            },
                        },
                    ],
                },
            ];
        });
        it("should disable the finish application button after single click and enable the button again after the saveApplication response api and updateCartItem is success to avoid multiple update payment api calls when selected payment method is credit card", () => {
            component.enableDebitCardBilling = false;
            component.selectedPaymentMethod = PaymentType.CREDITCARD;
            component.selectedIndex = 0;
            component.creditCardAccount = [{ id: 1, accountName: "firstName", lastFour: "1111" }];
            jest.spyOn(memberService, "updatePaymentMethod").mockReturnValue(of({}) as Observable<HttpResponse<void>>);
            jest.spyOn(shoppingCartDisplayService, "saveApplicationResponse").mockReturnValue(of({}) as Observable<ApplicationResponse>);
            jest.spyOn(store, "dispatch").mockReturnValue(of({}));
            component.saveAflacAlways();
            expect(component.disableNextButton).toBe(false);
        });
        it("should disable the finish application button after single click and enable the button again if store response is failed to avoid multiple update payment api calls when selected payment method is credit card", () => {
            component.enableDebitCardBilling = false;
            component.selectedPaymentMethod = PaymentType.CREDITCARD;
            component.selectedIndex = 0;
            component.creditCardAccount = [{ id: 1, accountName: "firstName", lastFour: "1111" }];
            jest.spyOn(memberService, "updatePaymentMethod").mockReturnValue(of({}) as Observable<HttpResponse<void>>);
            jest.spyOn(shoppingCartDisplayService, "saveApplicationResponse").mockReturnValue(of({}) as Observable<ApplicationResponse>);
            jest.spyOn(store, "dispatch").mockReturnValue(throwError({ status: 404 }));
            component.saveAflacAlways();
            expect(component.disableNextButton).toBe(false);
        });
        it("should disable the finish application button after single click and enable the button again after the saveApplication api is failed when selected payment method is credit card", () => {
            component.enableDebitCardBilling = false;
            component.selectedPaymentMethod = PaymentType.CREDITCARD;
            component.selectedIndex = 0;
            component.creditCardAccount = [{ id: 1, accountName: "firstName", lastFour: "1111" }];
            jest.spyOn(memberService, "updatePaymentMethod").mockReturnValue(of({}) as Observable<HttpResponse<void>>);
            jest.spyOn(shoppingCartDisplayService, "saveApplicationResponse").mockReturnValue(throwError({ status: 404 }));
            jest.spyOn(store, "dispatch").mockReturnValue(of({}));
            component.saveAflacAlways();
            expect(component.disableNextButton).toBe(false);
        });
        it("should disable the finish application button after single click and enable the button again after the saveApplication response api and updateCartItem is success to avoid multiple update payment api calls when selected payment method is bank draft", () => {
            component.enableDebitCardBilling = true;
            component.enablePaymetricBankDraft = false;
            component.selectedPaymentMethod = PaymentType.BANKDRAFT;
            component.selectedIndex = 0;
            component.bankAccounts = [{ id: 1, name: "some name", paymentType: PaymentType.BANKDRAFT }];
            jest.spyOn(memberService, "updatePaymentMethod").mockReturnValue(of({}) as Observable<HttpResponse<void>>);
            jest.spyOn(shoppingCartDisplayService, "saveApplicationResponse").mockReturnValue(throwError({ status: 404 }));
            jest.spyOn(store, "dispatch").mockReturnValue(of({}));
            component.saveAflacAlways();
            expect(component.disableNextButton).toBe(false);
        });
        it("should disable the finish application button after single click and enable the button again after the updatePayment method api is failed when selected payment method is credit card", () => {
            component.enableDebitCardBilling = false;
            component.selectedPaymentMethod = PaymentType.CREDITCARD;
            component.selectedIndex = 0;
            component.creditCardAccount = [{ id: 1, accountName: "firstName", lastFour: "1111" }];
            jest.spyOn(memberService, "updatePaymentMethod").mockReturnValue(throwError({ status: 404 }));
            component.saveAflacAlways();
            expect(component.disableNextButton).toBe(false);
        });
        it("should disable the finish application button after single click and enable the button again after the updatePayment method api is failed when selected payment method is bank draft", () => {
            component.enableDebitCardBilling = true;
            component.enablePaymetricBankDraft = false;
            component.selectedPaymentMethod = PaymentType.BANKDRAFT;
            component.selectedIndex = 0;
            component.bankAccounts = [{ id: 1, name: "some name", paymentType: PaymentType.BANKDRAFT }];
            jest.spyOn(memberService, "updatePaymentMethod").mockReturnValue(throwError({ status: 404 }));
            component.saveAflacAlways();
            expect(component.disableNextButton).toBe(false);
        });
        it("should disable the finish application button after single click and enable the button again if the pnc configs are off", () => {
            component.enableDebitCardBilling = true;
            component.enablePaymetricBankDraft = true;
            component.saveAflacAlways();
            expect(component.disableNextButton).toBe(false);
        });
        it("should avoid disabling finish application button if agree checkbox is not selected and when selectedPaymentMethod is bank draft", () => {
            component.enableDebitCardBilling = true;
            component.enablePaymetricBankDraft = false;
            component.settingForm.controls.agree.setValue(false);
            component.saveAflacAlways();
            expect(component.disableNextButton).toBe(false);
        });
    });
    describe("saveAflacAlways()", () => {
        it("should call callCenterPin API on saveAflacAlways payment method", () => {
            component.bankAccounts = [{ id: 1, name: "some name", paymentType: PaymentType.BANKDRAFT }];
            component.selectedIndex = 0;
            component.settingForm = formBuilder.group({
                agree: [true],
                initials: ["1234"],
            });
            component.showPin = true;
            const spy1 = jest.spyOn(appFlowService, "setcallCenterPin");
            const spy2 = jest.spyOn(memberService, "updatePaymentMethod").mockReturnValue(of({}) as Observable<HttpResponse<void>>);
            component.saveAflacAlways();
            expect(spy1).toHaveBeenCalled();
            expect(spy2).toHaveBeenCalled();
        });
    });

    describe("assignRegex()", () => {
        it("should assign regex to variables", () => {
            component.validationRegex = {
                VISA_CARD_REGEX: "SAMPLE_VISA_REGEX",
                MASTER_CARD_REGEX: "SAMPLE_MASTER_CARD_REGEX",
                AMEX_CARD_REGEX: "SAMPLE_AMEX_CAD_REGEX",
            };
            component.assignRegex();
            expect(component.visaRegex).toStrictEqual(new RegExp(component.validationRegex.VISA_CARD_REGEX));
            expect(component.masterCardRegex).toStrictEqual(new RegExp(component.validationRegex.MASTER_CARD_REGEX));
            expect(component.amexRegex).toStrictEqual(new RegExp(component.validationRegex.AMEX_CARD_REGEX));
        });
    });

    describe("checkPayment()", () => {
        it("should set hasPayment to true when there are payments for an enrollment", () => {
            const spy = jest.spyOn(store, "selectSnapshot").mockReturnValue([{}]);
            component.checkPayment();
            expect(component.hasPayment).toBe(true);
        });
    });

    describe("initializeEnrollForm()", () => {
        it("should initialize enrollForm", () => {
            component.initializeEnrollForm();
            expect(component.enrollForm).toBeInstanceOf(FormGroup);
            expect(Object.keys(component.enrollForm.controls).length).toBe(1);
        });
    });

    describe("validatePastedNumber()", () => {
        it("should return true and reset API errors to false", () => {
            expect(component.validatePastedNumber({} as Event)).toBe(true);
            expect([
                component.apiError,
                component.zipApiError,
                component.routingApiError,
                component.creditCardApiError,
                component.debitCardApiError,
            ]).toStrictEqual([false, false, false, false, false]);
        });
    });

    describe("initializeBankDraftBillingForm()", () => {
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
                    billingName: {
                        address1: "street1",
                        address2: "street2",
                        city: "Ok",
                        state: "GA",
                        zip: "39901",
                        firstName: "first",
                        lastName: "last",
                        mi: "middle",
                        suffix: "suffix",
                    },
                },
            ];
            component.validationRegex = { BANK_NAME: "some bank name regex" };
        });
        it("should call setBillingAddress when condition are met", () => {
            component.enablePaymetricBankDraft = false;
            component.sameAddress = false;
            component.selectedIndex = 0;
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
            const spy = jest.spyOn(component, "setBillingAddress").mockImplementation(() => {});
            const spy2 = jest.spyOn(component, "prePopulateBillingAddress").mockImplementation(() => {});
            component.initializeBankDraftBillingForm();
            expect(spy).not.toHaveBeenCalled();
            expect(spy2).toHaveBeenCalled();
        });
        it("should call prePopulateBillingAddress when sameAddress is false", () => {
            const spy2 = jest.spyOn(component, "setBillingAddress").mockImplementation(() => {});
            const spy = jest.spyOn(component, "prePopulateBillingAddress").mockImplementation(() => {});
            component.enablePaymetricBankDraft = true;
            component.sameAddress = false;
            component.selectedIndex = 0;
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
            component.initializeBankDraftBillingForm();
            expect(spy).toHaveBeenCalled();
            expect(spy2).not.toHaveBeenCalled();
        });
        it("should reset billingForm when billing.firsName is empty && form firstName is set", () => {
            component.bankAccounts = [
                {
                    id: 1,
                    name: "",
                    paymentType: PaymentType.BANKDRAFT,
                    accountName: "",
                    accountNumberLastFour: "",
                    bankName: "",
                    accountType: "",
                    routingNumber: "",
                    billingName: {
                        address1: "",
                        address2: "",
                        city: "",
                        state: "",
                        zip: "",
                        firstName: "",
                        lastName: "",
                        mi: "",
                        suffix: "",
                    },
                },
            ];
            component.validationRegex = { BANK_NAME: "some bank name regex" };
            component.enablePaymetricBankDraft = false;
            component.sameAddress = false;
            component.selectedIndex = 0;
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
            const spy = jest.spyOn(component.billingForm, "reset");
            component.initializeBankDraftBillingForm();
            expect(spy).toHaveBeenCalled();
        });
    });

    describe("initializeBillingForm()", () => {
        it("should call setBillingAddress when condition are met", () => {
            component.creditCardAccount = [{ id: 10, name: "some credit card name", paymentType: PaymentType.CREDITCARD }];
            component.validationRegex = { BANK_NAME: "some bank name regex" };
            component.enablePaymetricBankDraft = false;
            component.sameAddress = false;
            component.selectedIndex = 0;
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
            const spy = jest.spyOn(component, "setBillingAddress").mockImplementation(() => {});
            const spy2 = jest.spyOn(component, "prePopulateBillingAddress").mockImplementation(() => {});
            component.initializeBillingForm();
            expect(spy).toHaveBeenCalled();
            expect(spy2).not.toHaveBeenCalled();
        });
        it("should call prePopulateBillingAddress when sameAddress is false", () => {
            component.creditCardAccount = [
                {
                    id: 10,
                    name: "some credit card name",
                    paymentType: PaymentType.CREDITCARD,
                    billingName: {
                        address1: "",
                        address2: "",
                        city: "",
                        state: "",
                        zip: "",
                        firstName: "",
                        lastName: "",
                        mi: "",
                        suffix: "",
                    },
                },
            ];
            component.validationRegex = { BANK_NAME: "some bank name regex" };
            component.enablePaymetricBankDraft = true;
            component.sameAddress = false;
            component.selectedIndex = 0;
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
            const spy2 = jest.spyOn(component, "setBillingAddress").mockImplementation(() => {});
            const spy = jest.spyOn(component, "prePopulateBillingAddress").mockImplementation(() => {});
            component.initializeBillingForm();
            expect(spy).not.toHaveBeenCalled();
            expect(spy2).toHaveBeenCalled();
        });
        it("should reset billingForm when billing.firsName is empty && form firstName is set", () => {
            component.creditCardAccount = [{ id: 10, name: "some credit card name", paymentType: PaymentType.CREDITCARD }];
            component.validationRegex = { BANK_NAME: "some bank name regex" };
            component.enablePaymetricBankDraft = false;
            component.sameAddress = false;
            component.selectedIndex = 0;
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
            const spy = jest.spyOn(component.billingForm, "reset");
            component.initializeBillingForm();
            expect(spy).toHaveBeenCalled();
        });
    });
});
