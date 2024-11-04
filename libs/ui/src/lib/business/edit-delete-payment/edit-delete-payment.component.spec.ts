import { Pipe, PipeTransform } from "@angular/core";
import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { LanguageService } from "@empowered/language";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { StaticUtilService } from "@empowered/ngxs-store";
import {
    mockApplicationService,
    mockLanguageService,
    MockMaskPaymentPipe,
    mockMatDialog,
    mockMemberService,
    mockPaymetricService,
    mockStaticService,
    mockStaticUtilService,
} from "@empowered/testing";
import { EditDeletePaymentComponent } from "./edit-delete-payment.component";
import { ApplicationService, Configuration, MemberService, StaticService, ValidateRoutingNumber } from "@empowered/api";
import { DatePipe, TitleCasePipe } from "@angular/common";
import { of, throwError } from "rxjs";
import { HttpResponse } from "@angular/common/http";
import { Configurations, PaymentType, AddPayment } from "@empowered/constants";
import { MatDatepicker } from "@angular/material/datepicker";
import { PaymetricService } from "@empowered/common-services";

const mockMatDialogRef = {
    close: () => null,
} as MatDialogRef<EditDeletePaymentComponent>;

const mockPayloadData = {
    billingName: {
        firstName: "some first name",
        middleName: "some middle name",
        lastName: "some last name",
        suffix: "some suffix",
        maidenName: "some maiden name",
        nickname: "some nickName",
    },
    billingAddress: {
        address1: "some address",
        address2: "some address",
        city: "some city name",
        state: "some state name",
        zip: "some zip code",
        countyId: 12,
        country: "some country name",
    },
    sameAddressAsHome: true,
};
const data = {
    memberId: 10,
    mpGroup: 12345,
    selectedPaymentMethod: PaymentType.CREDITCARD,
    selectedIndex: {
        id: 1,
        expirationYear: 2024,
        lastFour: "7890",
        expirationMonth: 11,
        ...mockPayloadData,
        paymentType: "CREDIT_CARD",
    },
    selectedMethod: "CREDIT_CARD",
};

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

@Pipe({
    name: "titlecase",
})
class MockTitleCasePipe implements PipeTransform {
    transform(value: string) {
        return "Savings";
    }
}

describe("EditDeletePaymentComponent", () => {
    let component: EditDeletePaymentComponent;
    let fixture: ComponentFixture<EditDeletePaymentComponent>;
    let memberService: MemberService;
    let matDialogRef: MatDialogRef<EditDeletePaymentComponent>;
    let languageService: LanguageService;
    const formBuilder = new FormBuilder();
    const date = new Date();
    let paymetricService: PaymetricService;
    let staticService: StaticService;
    let applicationService: ApplicationService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EditDeletePaymentComponent, MockDateTransformDirective, MockMatDatePickerDirective, MockMaskPaymentPipe],
            providers: [
                FormBuilder,
                DatePipe,
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
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
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
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
                    provide: TitleCasePipe,
                    useClass: MockTitleCasePipe,
                },
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, ReactiveFormsModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EditDeletePaymentComponent);
        component = fixture.componentInstance;
        component.validationRegex = {
            VISA_CARD_REGEX: "^4[0-9]{12}(?:[0-9]{3})?$",
            MASTER_CARD_REGEX: "^(?:5[1-5][0-9]{14})$",
            AMEX_CARD_REGEX: "^(?:3[47][0-9]{13})$",
        };
        memberService = TestBed.inject(MemberService);
        matDialogRef = TestBed.inject(MatDialogRef);
        component.creditCardForm = formBuilder.group({
            cardNumber: [""],
            expirationDate: [new Date(2024, 10)],
        });
        component.creditCardExpiration = component.creditCardForm.controls.expirationDate;
        component.debitCardForm = formBuilder.group({
            cardNumber: [""],
            expirationDate: [new Date(2024, 10)],
        });
        component.bankDraftForm = formBuilder.group({
            accountName: ["some account name"],
            bankName: ["some bank name"],
            accountType: ["savings"],
            accountNumber: ["123456789012345"],
            routingNumber: ["000000000"],
            reAccountNumber: ["123456789012345"],
        });
        component.debitCardExpiration = component.debitCardForm.controls.expirationDate;
        component.currentDate = date;
        languageService = TestBed.inject(LanguageService);
        paymetricService = TestBed.inject(PaymetricService);
        staticService = TestBed.inject(StaticService);
        applicationService = TestBed.inject(ApplicationService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("initializeDebitForm()", () => {
        it("should set the debit card with last four digit and rest of the preceding digits with *", () => {
            component.initializeDebitForm();
            const lastFour = "************7890";
            expect(component.debitCardForm.controls.cardNumber.value).toStrictEqual(lastFour);
        });
        it("should set the debit card expiration date on calling initializeDebitForm", () => {
            component.initializeDebitForm();
            const debitDate = { year: 2024, month: 10 };
            expect(component.debitCardForm.controls.expirationDate.value).toStrictEqual(new Date(debitDate.year, debitDate.month));
        });
    });
    describe("updatePayment()", () => {
        // Skipping this test suit since MomentDateAdapter is not replaced in the application
        // and component is calling moment functions directly
        // We can include this test suit when MomentDateAdapter is replaced with DateFnsAdapter.
        it("should call commonPaymentPayload when updatePayment gets called and return the data", () => {
            component.updatePayment("1234");
            expect(component.commonPaymentPayload()).toEqual(mockPayloadData);
        });
        it("should call updatePaymentMethod on calling updatePayment", () => {
            const spy = jest.spyOn(memberService, "updatePaymentMethod");
            component.updatePayment("1234");
            expect(spy).toBeCalled();
        });
    });
    describe("deletePaymentData()", () => {
        it("should call deletePaymentMethod when deletePaymentData gets called", () => {
            const spy = jest.spyOn(memberService, "deletePaymentMethod");
            const mockMemberId = 10;
            const mockId = 1;
            const mockMpGroup = 12345;
            component.deletePaymentData();
            expect(spy).toBeCalledWith(mockMemberId, mockId, mockMpGroup);
        });
        it("should call closePopupDelete method on success response from deletePaymentMethod", () => {
            jest.spyOn(memberService, "deletePaymentMethod").mockReturnValue(of({} as HttpResponse<void>));
            const spy = jest.spyOn(component, "closePopupDelete");
            component.deletePaymentData();
            expect(spy).toBeCalled();
        });
        it("should call apiErrorMessageDisplay method on failed response of deletePaymentMethod", () => {
            jest.spyOn(memberService, "deletePaymentMethod").mockReturnValue(throwError({ status: 404 }));
            const spy = jest.spyOn(component, "apiErrorMessageDisplay");
            component.deletePaymentData();
            expect(spy).toBeCalledWith({ status: 404 });
        });
    });
    describe("getCardIndex()", () => {
        it("should return the index when type is credit card and last four digit matched", () => {
            component.creditCardAccounts = [{ lastFour: "3456" }];
            const mockReturnIndexValue = 0;
            expect(component.getCardIndex(1234567890123456, PaymentType.CREDITCARD)).toEqual(mockReturnIndexValue);
        });
    });
    describe("getCardIndex()", () => {
        it("should return the index when type is debit card and last four digit matched", () => {
            component.debitCardAccounts = [{ lastFour: "1234" }, { lastFour: "3456" }];
            const mockReturnIndexValue = 1;
            expect(component.getCardIndex(1234567890123456, PaymentType.DEBITCARD)).toEqual(mockReturnIndexValue);
        });
    });
    describe("mapPayments()", () => {
        beforeEach(() => {
            component.paymentMethods = [
                { name: "some name", paymentType: PaymentType.BANKDRAFT, accountName: "some bank account name" },
                { name: "some name", paymentType: PaymentType.CREDITCARD, accountName: "some credit card account name" },
                { name: "some name", paymentType: PaymentType.DEBITCARD, accountName: "some debit card account name" },
            ];
        });
        it("should add bank draft payment method in bankAccounts when method payment type is bank draft", () => {
            component.mapPayments();
            expect(component.bankAccounts).toStrictEqual([
                { name: "some name", paymentType: PaymentType.BANKDRAFT, accountName: "some bank account name" },
            ]);
        });
        it("should add credit card payment method in creditCardAccounts when method payment type is credit card", () => {
            component.mapPayments();
            expect(component.creditCardAccounts).toStrictEqual([
                { name: "some name", paymentType: PaymentType.CREDITCARD, accountName: "some credit card account name" },
            ]);
        });
        it("should add debit card payment method in debitCardAccounts when method payment type is debit card", () => {
            component.mapPayments();
            expect(component.debitCardAccounts).toStrictEqual([
                { name: "some name", paymentType: PaymentType.DEBITCARD, accountName: "some debit card account name" },
            ]);
        });
    });
    describe("closePopupEdit()", () => {
        it("should close dialog box", () => {
            const spy = jest.spyOn(matDialogRef, "close");
            const mockData = { accountName: "some account name" };
            component.closePopupEdit(mockData, 1);
            expect(spy).toBeCalledWith({ action: "close", closed: true, updatedData: mockData, id: 1 });
        });
    });
    describe("closePopupEdit()", () => {
        it("should close dialog box", () => {
            const spy = jest.spyOn(matDialogRef, "close");
            const mockData = { accountName: "some account name" };
            component.closePopupEdit(mockData, 1);
            expect(spy).toBeCalledWith({ action: "close", closed: true, updatedData: mockData, id: 1 });
        });
    });
    describe("isExpirationDateChanged()", () => {
        it("should return false if expiration date is  not changed", () => {
            component.creditCardAccounts = [{ lastFour: "1111", expirationMonth: 10, expirationYear: 2024 }];
            expect(component.isExpirationDateChanged(4111111111111111, PaymentType.CREDITCARD)).toBeFalsy();
        });
        it("should return true if expiration date is not changed and selected payment type is credit card", () => {
            component.creditCardAccounts = [{ lastFour: "1111", expirationMonth: 11, expirationYear: 2024 }];
            expect(component.isExpirationDateChanged(4111111111111111, PaymentType.CREDITCARD)).toBeTruthy();
        });
        it("should set isUpdated to false and return false if credit card details are not present", () => {
            expect(component.isExpirationDateChanged(4111111111111111, PaymentType.CREDITCARD)).toBeFalsy();
        });
        it("should return true if expiration date is not changed and selected payment type is debit card", () => {
            component.debitCardAccounts = [{ lastFour: "1111", expirationMonth: 11, expirationYear: 2024 }];
            expect(component.isExpirationDateChanged(4111111111111111, PaymentType.DEBITCARD)).toBeTruthy();
        });
    });
    describe("updateDate()", () => {
        // Skipping this test suit since MomentDateAdapter is not replaced in the application
        // and component is calling moment functions directly
        // We can include this test suit when MomentDateAdapter is replaced with DateFnsAdapter.
        it("should update the entered date when type selected is credit card", () => {
            component.updateDate(PaymentType.CREDITCARD);
            expect(component.creditCardExpiration.value).toStrictEqual(new Date(2024, 10));
        });
        it("should update the entered date when type selected is debit card", () => {
            component.updateDate(PaymentType.DEBITCARD);
            expect(component.debitCardExpiration.value).toStrictEqual(new Date(2024, 10));
        });
    });
    describe("isEmptyField()", () => {
        it("should update the value to the datepicker when type selected is credit card", () => {
            component.isEmptyField(PaymentType.CREDITCARD);
            expect(component.creditCardExpiration.value).toStrictEqual(new Date(2024, 10));
        });
    });
    describe("validateRoutingNumber()", () => {
        it("should return invalid as true if there is any error in entered routing number", () => {
            component.routingApiError = true;
            expect(component.validateRoutingNumber()).toStrictEqual({ invalid: true } as ValidateRoutingNumber);
        });
        it("should return null if there is no error in entered routing number", () => {
            component.routingApiError = false;
            expect(component.validateRoutingNumber()).toBe(null);
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
    describe("onChangeOfAccountNumber()", () => {
        it("it should enable the Account Name, Bank Name, Routing Number when account number is changed", () => {
            component.isBankInfoReadOnly = true;
            component.onChangeOfAccountNumber();
            expect(component.isBankInfoReadOnly).toBe(false);
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
    describe("saveEditedBankPaymentData()", () => {
        it("should call updatePaymentMethod on calling saveEditedBankPaymentData", () => {
            const spy = jest.spyOn(memberService, "updatePaymentMethod").mockReturnValue(of({} as HttpResponse<void>));
            const mockBankDraftData = {
                ...mockPayloadData,
                paymentType: "CREDIT_CARD",
                accountName: "some account name",
                bankName: "some bank name",
                accountType: "savings",
                accountNumber: "123456789012345",
                routingNumber: "000000000",
            };
            component.saveEditedBankPaymentData();
            expect(spy).toBeCalledWith(10, 12345, mockBankDraftData, 1);
        });
        it("should call closePopupEdit method on success response of updatePaymentMethod", () => {
            jest.clearAllMocks();
            jest.spyOn(memberService, "updatePaymentMethod").mockReturnValue(of({} as HttpResponse<void>));
            const mockBankDraftData = {
                ...mockPayloadData,
                paymentType: PaymentType.CREDITCARD,
                accountName: "some account name",
                bankName: "some bank name",
                accountType: "savings",
                accountNumber: "123456789012345",
                routingNumber: "000000000",
            };
            const spy = jest.spyOn(component, "closePopupEdit");
            component.saveEditedBankPaymentData();
            expect(spy).toBeCalledWith(mockBankDraftData, 1);
        });
        it("should call apiErrorMessageDisplay method on failed response of updatePaymentMethod", () => {
            jest.spyOn(memberService, "updatePaymentMethod").mockReturnValue(throwError({ status: 404 }));
            const spy = jest.spyOn(component, "apiErrorMessageDisplay");
            component.saveEditedBankPaymentData();
            expect(spy).toBeCalledWith({ status: 404 });
        });
    });
    describe("bankDraftSubmit()", () => {
        it("should call closePopupDelete if account number and reAccountNumber includes *", () => {
            component.bankDraftForm.controls.accountNumber.setValue("***123");
            component.bankDraftForm.controls.reAccountNumber.setValue("***123");
            const spy = jest.spyOn(component, "closePopupDelete");
            component.bankDraftSubmit();
            expect(spy).toBeCalled();
        });
        it("should call saveEditedBankPaymentData if account number and reAccountNumber not includes *", () => {
            jest.spyOn(memberService, "updatePaymentMethod").mockReturnValue(of({} as HttpResponse<void>));
            const spy = jest.spyOn(component, "saveEditedBankPaymentData");
            component.bankDraftSubmit();
            expect(spy).toBeCalled();
        });
    });
    describe("validateDebitCardNumber()", () => {
        it("should return invalid as true if there is any error in entered debit card number", () => {
            component.debitCardApiError = true;
            expect(component.validateDebitCardNumber()).toStrictEqual({ invalid: true } as ValidateRoutingNumber);
        });
        it("should return null if there is no error in entered debit card number", () => {
            component.debitCardApiError = false;
            expect(component.validateDebitCardNumber()).toBe(null);
        });
    });
    describe("validateCreditCardNumber()", () => {
        it("should return invalid as true if there is any error in entered credit card number", () => {
            component.creditCardApiError = true;
            expect(component.validateCreditCardNumber()).toStrictEqual({ invalid: true } as ValidateRoutingNumber);
        });
        it("should return null if there is no error in entered credit card number", () => {
            component.creditCardApiError = false;
            expect(component.validateCreditCardNumber()).toBe(null);
        });
    });
    describe("assignRegex()", () => {
        it("should set the visa , master and amex regex value on calling assignRegex method", () => {
            component.assignRegex();
            expect(component.visaRegex).toEqual(new RegExp("^4[0-9]{12}(?:[0-9]{3})?$"));
            expect(component.masterCardRegex).toEqual(new RegExp("^(?:5[1-5][0-9]{14})$"));
            expect(component.amexRegex).toEqual(new RegExp("^(?:3[47][0-9]{13})$"));
        });
    });
    describe("apiErrorMessageDisplay()", () => {
        it("should set language string when api response is 409 status", () => {
            const spy = jest.spyOn(languageService, "fetchSecondaryLanguageValue").mockReturnValueOnce("some value");
            component.apiErrorMessageDisplay({ name: "some name", message: "some message", error: { status: 409 } } as Error);
            expect(spy).toBeCalledWith("secondary.api.accountAlreadyExists");
            expect(component.apiErrorMessage).toStrictEqual("some value");
        });
        it("should set language string when api response is other than 409 status ", () => {
            const spy = jest.spyOn(languageService, "fetchSecondaryLanguageValue").mockReturnValueOnce("some data");
            component.apiErrorMessageDisplay({
                name: "some name",
                message: "some message",
                error: { status: 400, code: "badParameter" },
            } as Error);
            expect(spy).toBeCalledWith("secondary.api.400.badParameter");
            expect(component.apiErrorMessage).toStrictEqual("some data");
        });
    });
    describe("initializeCreditForm()", () => {
        it("should set the credit card with last four digit and rest of the preceding digits with *", () => {
            const lastFour = "************7890";
            component.initializeCreditForm();
            expect(component.creditCardForm.controls.cardNumber.value).toStrictEqual(lastFour);
        });
        it("should set the Credit card expiration date on calling initializeCreditForm", () => {
            component.initializeCreditForm();
            const creditDate = { year: 2024, month: 10 };
            expect(component.creditCardForm.controls.expirationDate.value).toStrictEqual(new Date(creditDate.year, creditDate.month));
        });
    });
    describe("initializeBankForm()", () => {
        it("should set the bank account number with last four digit and rest of the preceding digits with *", () => {
            component.data.selectedIndex.accountNumberLastFour = "2345";
            const lastFour = "************2345";
            component.initializeBankForm();
            expect(component.bankDraftForm.controls.accountNumber.value).toStrictEqual(lastFour);
        });
        it("should set bank accountType to selected value", () => {
            component.data.selectedIndex.accountType = "savings";
            component.initializeBankForm();
            expect(component.bankDraftForm.controls.accountType.value).toStrictEqual("savings");
        });
        it("should set routing number", () => {
            component.data.selectedIndex.routingNumber = "123425";
            component.initializeBankForm();
            expect(component.bankDraftForm.controls.routingNumber.value).toStrictEqual("123425");
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
        it("should return true when any numeric key is pressed", () => {
            expect(component.validateBankName({ charCode: 49 } as KeyboardEvent)).toBe(true);
        });
        it("should return true when any capital letter key (A-Z) is pressed", () => {
            expect(component.validateBankName({ charCode: 66 } as KeyboardEvent)).toBe(true);
        });
        it("should return true when any numpad key is pressed", () => {
            expect(component.validateBankName({ charCode: 120 } as KeyboardEvent)).toBe(true);
        });
    });
    describe("validateDateFormat()", () => {
        it("should return null when backspace key is pressed", () => {
            expect(component.validateDateFormat({ charCode: 8 } as KeyboardEvent)).toBe(null);
        });
        it("should return null when key null key is pressed", () => {
            expect(component.validateDateFormat({ charCode: 0 } as KeyboardEvent)).toBe(null);
        });
        it("should return true when number between 0 to 9 is pressed", () => {
            expect(component.validateDateFormat({ charCode: 49 } as KeyboardEvent)).toBe(true);
        });
    });
    describe("validateNumber()", () => {
        it("should return null when key backspace key is pressed", () => {
            expect(component.validateNumber({ charCode: 8 } as KeyboardEvent)).toBe(null);
        });
        it("should return null when key null key is pressed", () => {
            expect(component.validateNumber({ charCode: 0 } as KeyboardEvent)).toBe(null);
        });
        it("should return true if any numeric key is pressed", () => {
            expect(component.validateNumber({ charCode: 49 } as KeyboardEvent)).toBe(true);
        });
    });
    describe("callPaymetricService()", () => {
        it("should set the vsp merchant id and vsp token on calling callPaymetricService", () => {
            component.callPaymetricService([of([{ value: "123" }] as Configurations[]), of("token")], "1234567890", "7890");
            expect(component.vspMerchantId).toStrictEqual("123");
            expect(component.vspToken).toStrictEqual("token");
        });
        it("should call isValid method of paymetric service if card is tokenized", () => {
            const spy = jest.spyOn(paymetricService, "isValidCard");
            component.callPaymetricService([of([{ value: "123" }] as Configurations[]), of("token")], "1234567890", "7890");
            expect(spy).toBeCalledWith("1234567890", "token", "123");
        });
        it("should call updatePayment method if added card is valid", () => {
            jest.spyOn(paymetricService, "isValidCard").mockReturnValue(of({ HasPassed: true }));
            jest.spyOn(memberService, "updatePaymentMethod").mockReturnValue(of({} as HttpResponse<void>));
            const spy = jest.spyOn(component, "updatePayment");
            component.callPaymetricService([of([{ value: "123" }] as Configurations[]), of("token")], "1234567890", "7890");
            expect(spy).toBeCalledWith("7890");
        });
        it("should call closePopupEdit method on getting response from updatePayment method", () => {
            jest.spyOn(paymetricService, "isValidCard").mockReturnValue(of({ HasPassed: true }));
            jest.spyOn(component, "updatePayment").mockReturnValue(of({} as HttpResponse<void>));
            const spy = jest.spyOn(component, "closePopupEdit");
            component.callPaymetricService([of([{ value: "123" }] as Configurations[]), of("token")], "1234567890", "7890");
            expect(spy).toBeCalled();
        });
        it("should call apiErrorMessageDisplay method on failed response of updatePayment", () => {
            // Skipped this test case since this method is reliant on MomentDateAdapter.
            // Will un-skip this test case when DateFnsAdapter is used.
            jest.spyOn(paymetricService, "isValidCard").mockReturnValue(of({ HasPassed: true }));
            jest.spyOn(memberService, "updatePaymentMethod").mockReturnValue(throwError({ status: 404 }));
            const spy = jest.spyOn(component, "apiErrorMessageDisplay");
            component.callPaymetricService([of([{ value: "123" }] as Configurations[]), of("token")], "1234567890", "7890");
            expect(spy).toBeCalledWith({ status: 404 });
        });
    });
    describe("saveEditedCardPaymentData()", () => {
        beforeEach(() => {
            component.visaRegex = new RegExp("^4[0-9]{12}(?:[0-9]{3})?$");
            component.masterCardRegex = new RegExp("^(?:5[1-5][0-9]{14})$");
            component.amexRegex = new RegExp("^(?:3[47][0-9]{13})$");
        });
        it("should call isValidCardNumber on calling saveEditedCardPaymentData", () => {
            const spy = jest.spyOn(component, "isValidCardNumber");
            component.saveEditedCardPaymentData();
            expect(spy).toBeCalled();
        });
        it("should call getConfigurations method of static service on calling if card is valid", () => {
            component.creditCardForm.controls.cardNumber.setValue("4111111111111111");
            const spy = jest.spyOn(staticService, "getConfigurations");
            component.saveEditedCardPaymentData();
            expect(spy).toBeCalled();
        });
        it("should call getPaymetricAccessToken of application service on calling if card is valid", () => {
            component.creditCardForm.controls.cardNumber.setValue("4111111111111111");
            const spy = jest.spyOn(applicationService, "getPaymetricAccessToken");
            component.saveEditedCardPaymentData();
            expect(spy).toBeCalled();
        });
        it("should call callPaymetricService method if config is on and selected payment method is credit card", () => {
            component.creditCardForm.controls.cardNumber.setValue("4111111111111111");
            const spy = jest.spyOn(component, "callPaymetricService");
            component.tempusPaymentConfig = true;
            component.saveEditedCardPaymentData();
            expect(spy).toBeCalled();
        });
        it("should set the error as invalid for credit card number if entered card number is not valid", () => {
            component.creditCardForm.controls.cardNumber.setValue("****1111");
            component.creditCardForm.controls.cardNumber.markAsTouched();
            component.saveEditedCardPaymentData();
            expect(component.creditCardForm.controls.cardNumber.errors).toEqual({ invalid: true });
        });
        it("should set the error as invalid for debit card number if entered card number is not valid", () => {
            component.debitCardForm.controls.cardNumber.setValue("****1111");
            component.debitCardForm.controls.cardNumber.markAsTouched();
            component.data.selectedPaymentMethod = PaymentType.DEBITCARD;
            component.saveEditedCardPaymentData();
            expect(component.debitCardForm.controls.cardNumber.errors).toEqual({ invalid: true });
        });
    });
    describe("onSaveOfCardDetails()", () => {
        beforeEach(() => {
            component.visaRegex = new RegExp("");
            component.masterCardRegex = new RegExp("");
            component.amexRegex = new RegExp("");
        });
        it("should close dialogBox on calling onSaveOfCardDetails method if form is valid and expiration date is changed", () => {
            const spy = jest.spyOn(matDialogRef, "close");
            component.creditCardAccounts = [{ lastFour: "1111", expirationMonth: 11, expirationYear: 2024 }];
            component.creditCardForm.controls.cardNumber.setValue(4111111111111111);
            component.onSaveOfCardDetails(component.creditCardForm, PaymentType.CREDITCARD);
            expect(spy).toBeCalledWith({ action: "close", closed: true });
        });
    });
    describe("setAccountNameOnDeleteModal()", () => {
        it("should set account nick name for PNC bank draft when setAccountNameOnDeleteModal is called and token identity guid is present", () => {
            component.languageStrings["primary.portal.applicationFlow.payments.bankDraft.accountLabeling"] =
                "#accountType ending in #accountNumberLastFourDigits";
            component.data.selectedPaymentMethod = "BANK_DRAFT";
            component.data.selectedIndex.tempusTokenIdentityGuid = "token";
            component.data.selectedIndex.accountType = "Savings";
            component.data.selectedIndex.accountNumberLastFour = "2345";
            component.setAccountNameOnDeleteModal();
            expect(component.selectedAccountNickName).toEqual("Savings ending in 2345");
        });
    });
});
