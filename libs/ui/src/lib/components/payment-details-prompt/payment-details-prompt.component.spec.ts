import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { NgxsModule, Store } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { PaymentDetailsPromptComponent } from "./payment-details-prompt.component";
import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input } from "@angular/core";
import {
    CarrierId,
    ClientErrorResponseCode,
    ClientErrorResponseType,
    CreditCardNetwork,
    RepAddDataModel,
    PaymentType,
    AddPayment,
} from "@empowered/constants";
import { Configuration, MemberService } from "@empowered/api";
import { of } from "rxjs";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { HttpErrorResponse } from "@angular/common/http";
import { SharedState, StaticUtilService } from "@empowered/ngxs-store";
import { TitleCasePipe } from "@angular/common";
import { mockStaticUtilService } from "@empowered/testing";

type RepAddDataResponse = Partial<RepAddDataModel>;

const mockMemberService = {
    addPaymentMethod: (memberId: number, mpGroup: number, payload: AddPayment, override: boolean) => of(),
    updatePaymentMethod: (memberId: number, mpGroup: number, payload: AddPayment, id: string) => of(),
};

const mockMatDialogRef = { close: () => {} };

const data = {
    tempusSessionObject: { sessionID: "wdiuwuio", tempusTokenIdentityGuid: "guid1386123" },
    memberId: 1,
    mpGroup: 212132,
    tempusIframeURL: "iframeURL",
};

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[cdkCopyToClipboard]",
})
class MockCdkCopyToClipboardDirective {
    @Input("cdkCopyToClipboard") text: string;
}

describe("PaymentDetailsPromptComponent", () => {
    let component: PaymentDetailsPromptComponent;
    let fixture: ComponentFixture<PaymentDetailsPromptComponent>;
    let memberService: MemberService;
    let matDialogRef: MatDialogRef<PaymentDetailsPromptComponent>;
    const formBuilder = new FormBuilder();
    let store: Store;
    let staticUtilService: StaticUtilService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PaymentDetailsPromptComponent, MockCdkCopyToClipboardDirective],
            imports: [MatDialogModule, HttpClientTestingModule, NgxsModule.forRoot([SharedState]), ReactiveFormsModule],
            providers: [
                TitleCasePipe,
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                Configuration,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });
    beforeEach(() => {
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            core: {
                regex: { someRegex: "SAMPLE_REGEX" },
            },
        });
        staticUtilService = TestBed.inject(StaticUtilService);
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(PaymentDetailsPromptComponent);
        memberService = TestBed.inject(MemberService);
        component = fixture.componentInstance;
        matDialogRef = TestBed.inject(MatDialogRef);
        component.creditCardForm = formBuilder.group({
            cardHolder: ["name"],
            expirationMonth: ["February"],
            expirationYear: [25],
            zipCode: ["123421"],
        });
        component.monthNames = ["January", "February"];
        component.bankDraftEditForm = formBuilder.group({
            accountType: ["Checking"],
            accountName: ["account name"],
        });
        component.isRoutingNumCopied = false;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("createPayload()", () => {
        const tempusGuid = "guid1386123";
        const repAddDataResponse: RepAddDataResponse = {
            TRANSARMORTOKEN: "12344124121",
            CCEXP: "0225",
            REPCCNAME: "name",
            PAYMENTTYPE: "CREDITCARD",
            CCCARDTYPE: "VISA",
            REPTOKEN: "23764658348734",
            AVSDATA: "123421",
        };

        it("should return payload for add payment method call", () => {
            const payload = {
                accountName: "name",
                paymentType: "CREDIT_CARD",
                type: "VISA",
                tempusTokenIdentityGuid: tempusGuid,
                sameAddressAsHome: false,
                tokens: [{ carrierId: CarrierId.AFLAC, token: "23764658348734" }],
                lastFour: "4121",
                expirationMonth: 2,
                expirationYear: 2025,
                tempusPostalCode: "123421",
                billingName: { firstName: "", lastName: "" },
                billingAddress: { zip: "123421" },
            };
            const value = component.createPayload(repAddDataResponse);
            expect(value).toStrictEqual(payload);
        });
    });
    describe("processTempusToken()", () => {
        const repAddDataResponse: RepAddDataResponse = {
            TRANSUCCESS: "TRUE",
            TRANSARMORTOKEN: "12344124121",
            CCEXP: "0225",
            REPCCNAME: "name",
            PAYMENTTYPE: "CREDITCARD",
            CCCARDTYPE: "VISA",
            REPTOKEN: "23764658348734",
            AVSDATA: "123421",
        };
        const payload = {
            accountName: "name",
            paymentType: "CREDIT_CARD" as PaymentType,
            type: "VISA",
            tempusTokenIdentityGuid: "tempusGuid",
            sameAddressAsHome: false,
            tokens: [{ carrierId: CarrierId.AFLAC, token: "23764658348734" }],
            lastFour: "4121",
            expirationMonth: 2,
            expirationYear: 25,
            tempusPostalCode: "123421",
            billingName: { firstName: "", lastName: "" },
            billingAddress: { zip: "123421" },
        };
        const bankDraftPayload = {
            accountName: "name",
            paymentType: "BANK_DRAFT" as PaymentType,
            accountType: "Savings",
            accountNumber: "9455",
            routingNumber: "122199983",
            bankName: "AVS BANK",
            sameAddressAsHome: false,
            tokens: [{ carrierId: CarrierId.AFLAC, token: "23764658348734" }],
            billingName: { firstName: "", lastName: "" },
            tempusTokenIdentityGuid: "tempusGuid",
        };
        it("should call add payment method in case of truthy response from tempus", () => {
            const spy = jest.spyOn(component, "createPayload").mockReturnValue(payload);
            const spy2 = jest.spyOn(component, "savePaymentData").mockImplementation(() => {});
            component.processTempusResponse(repAddDataResponse, 1);
            expect(spy).toBeCalledWith(repAddDataResponse);
            expect(spy2).toBeCalledTimes(1);
        });
        it("should close dialog box if TRANSUCCESS is false and max attempts is reached", () => {
            const repAddData: RepAddDataResponse = {
                TRANSUCCESS: "FALSE",
                TRANRESPMESSAGE: "EXPIRED",
            };
            const spy = jest.spyOn(matDialogRef, "close");
            component.processTempusResponse(repAddData, 1);
            expect(spy).toBeCalledWith({ errorCode: 4 });
        });
        it("should close dialog box if TRANSUCCESS is false and card is declined", () => {
            const repAddData: RepAddDataResponse = {
                TRANSUCCESS: "FALSE",
                TRANRESPMESSAGE: "CVV mismatched",
            };
            component.maxAttemptsAllowed = 3;
            const spy = jest.spyOn(matDialogRef, "close");
            component.processTempusResponse(repAddData, 3);
            expect(spy).toBeCalledWith({ errorCode: 2 });
        });
        it("should close dialog box if TRANSUCCESS is false and card is expired", () => {
            const repAddData: RepAddDataResponse = {
                TRANSUCCESS: "FALSE",
                TRANRESPMESSAGE: "EXPIRED",
            };
            const spy = jest.spyOn(matDialogRef, "close");
            component.processTempusResponse(repAddData, 1);
            expect(spy).toBeCalledWith({ errorCode: 4 });
        });
        it("should close dialog box if RoutingNumber is not same as default routing number", () => {
            component.paymentMethod = "BANK_DRAFT";
            component.isACHPartnerAccountType = true;
            const spy = jest.spyOn(component, "createBankDraftPayload").mockReturnValue(bankDraftPayload);
            const repAddData: RepAddDataResponse = {
                TRANSUCCESS: "TRUE",
            };
            component.defaultRoutingNumber = "272850911";
            const spy1 = jest.spyOn(matDialogRef, "close");
            component.processTempusResponse(repAddData, 1);
            expect(spy).toBeCalled();
            expect(spy1).toBeCalledWith({ errorCode: 6 });
        });
        it("should call add payment method when if TRANSUCCESS is true when REPQUEUEDFAILURE is not true or invalid", () => {
            component.paymentMethod = "BANK_DRAFT";
            const repAddData: RepAddDataResponse = {
                TRANSUCCESS: "TRUE",
                REPQUEUEDFAILURE: "",
            };
            const spy = jest.spyOn(component, "createBankDraftPayload").mockReturnValue(bankDraftPayload);
            const spy2 = jest.spyOn(component, "savePaymentData").mockImplementation(() => {});
            component.processTempusResponse(repAddDataResponse, 1);
            expect(spy).toBeCalledWith(repAddDataResponse);
            expect(spy2).toBeCalledTimes(1);
        });
        it("should close dialog box when TRANSUCCESS is true when REPQUEUEDFAILURE is true", () => {
            component.paymentMethod = "BANK_DRAFT";
            const repAddData: RepAddDataResponse = {
                TRANSUCCESS: "TRUE",
                REPQUEUEDFAILURE: "TRUE",
            };
            const spy = jest.spyOn(matDialogRef, "close");
            component.processTempusResponse(repAddData, 1);
            expect(spy).toBeCalledWith({ errorCode: 5 });
        });
    });
    describe("savePaymentData", () => {
        it("should call service method with payload", () => {
            const spy = jest.spyOn(memberService, "addPaymentMethod");
            component.savePaymentData({} as AddPayment);
            expect(spy).toBeCalledTimes(1);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");

            fixture.destroy();

            expect(spy).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
    describe("getCardType()", () => {
        it("should return master card as card type", () => {
            const cardType = "MC";
            const cardTypeRecieved = component.getCardType(cardType);
            expect(cardTypeRecieved).toBe(CreditCardNetwork.MASTER_CARD);
        });
        it("should return AMERICANEXPRESS as card type", () => {
            const cardType = "AMEX";
            const cardTypeRecieved = component.getCardType(cardType);
            expect(cardTypeRecieved).toBe(CreditCardNetwork.AMERICAN_EXPRESS);
        });
        it("should return VISA as card type", () => {
            const cardType = "VISA";
            const cardTypeRecieved = component.getCardType(cardType);
            expect(cardTypeRecieved).toBe(CreditCardNetwork.VISA);
        });
    });

    describe("isPCRGenericFlow()", () => {
        it("should return true if its PCR generic flow", () => {
            component.mpGroup = undefined;
            component.memberId = undefined;
            const isGenericFLow = component.isPCRGenericFlow();
            expect(isGenericFLow).toBe(true);
        });
        it("should return false if its PCR member specific flow", () => {
            component.mpGroup = 29501;
            component.memberId = 1;
            const isGenericFLow = component.isPCRGenericFlow();
            expect(isGenericFLow).toBe(false);
        });
    });

    describe("updatePayload()", () => {
        const tempusGuid = "guid1386123";
        const repUpdateData = {
            id: 1,
            accountName: "name",
            paymentType: PaymentType.CREDITCARD,
            type: "VISA",
            lastFour: "4121",
            sameAddressAsHome: false,
            expirationMonth: 2,
            expirationYear: 25,
            tokens: [{ carrierId: CarrierId.AFLAC, token: "23764658348734" }],
            tempusPostalCode: "123421",
            billingName: { firstName: "", lastName: "" },
            billingAddress: { zip: "123421" },
        };

        it("should return payload for add payment method call", () => {
            const payload = {
                accountName: "name",
                paymentType: PaymentType.CREDITCARD,
                type: "VISA",
                tempusTokenIdentityGuid: tempusGuid,
                sameAddressAsHome: false,
                tokens: [{ carrierId: CarrierId.AFLAC, token: "23764658348734" }],
                lastFour: "4121",
                expirationMonth: 2,
                expirationYear: 25,
                tempusPostalCode: "123421",
                billingName: { firstName: "", lastName: "" },
                billingAddress: { zip: "123421" },
            };
            const value = component.updatePayload(repUpdateData);
            expect(value).toStrictEqual(payload);
        });
    });
    describe("onHttpError()", () => {
        it("should set error message display flags to true if there is bad parameter error", () => {
            const error = {
                error: {
                    code: ClientErrorResponseType.BAD_PARAMETER,
                    status: ClientErrorResponseCode.RESP_400,
                },
            } as HttpErrorResponse;
            component.onHttpError(error);
            expect(component.incorrectCardInfoErrorMessage).toBe(true);
            expect(component.isCardNotExpired).toBe(true);
        });
        it("should not set error message display flags to true if its not bad parameter error", () => {
            component.incorrectCardInfoErrorMessage = false;
            component.isCardNotExpired = false;
            const error = {
                error: {
                    code: ClientErrorResponseType.BAD_PARAMETER,
                    status: ClientErrorResponseCode.RESP_404,
                },
            } as HttpErrorResponse;
            component.onHttpError(error);
            expect(component.incorrectCardInfoErrorMessage).toBe(false);
            expect(component.isCardNotExpired).toBe(false);
        });
    });

    describe("getExpYear()", () => {
        it("should return four digit expiration year", () => {
            const year = 24;
            expect(component.getExpYear(year)).toBe(2024);
        });
    });
    describe("createBankDraftPayload()", () => {
        const payload = {
            accountName: "some account name",
            paymentType: PaymentType.BANKDRAFT,
            accountType: "Checking",
            accountNumber: "1234",
            routingNumber: "1234567890",
            bankName: "test bank",
            sameAddressAsHome: false,
            tokens: [{ carrierId: CarrierId.AFLAC, token: "some token" }],
            billingName: { firstName: "", lastName: "" },
            tempusTokenIdentityGuid: "token identity guid",
        };
        it("should return a bank draft payload when createBankDraftPayload called", () => {
            const payloadData = {
                REPCHECKACCOUNTNAME: "some account name",
                CHECKACCOUNTTYPE: "CHECKING",
                CKACCOUNT4: "1234",
                CHECKROUTING: "1234567890",
                BANKNAME: "test bank",
                REPTOKEN: "some token",
            };
            component.tempusTokenIdentityGuid = "token identity guid";
            expect(component.createBankDraftPayload(payloadData)).toStrictEqual(payload);
        });
    });
    describe("handleBankDraftError()", () => {
        beforeEach(() => {
            component.maxAttemptsAllowed = 3;
        });
        it("should close the dialog box with appropriate error code corresponding to account validation failed i.e RT01", () => {
            const spy1 = jest.spyOn(matDialogRef, "close");
            component.handleBankDraftError("RT01: Account closed", 1);
            expect(spy1).toBeCalledWith({ errorCode: 5 });
        });
        it("should close the dialog box with appropriate error code corresponding to maximum attempts reached when routing number is invalid", () => {
            const spy1 = jest.spyOn(matDialogRef, "close");
            component.handleBankDraftError("GS01: Invalid RT", 3);
            expect(spy1).toBeCalledWith({ errorCode: 2 });
        });
        it("should close the dialog box with appropriate error code corresponding to maximum attempts reached when account number is invalid", () => {
            const spy1 = jest.spyOn(matDialogRef, "close");
            component.handleBankDraftError("GS02: Invalid account number", 3);
            expect(spy1).toBeCalledWith({ errorCode: 2 });
        });
    });
    describe("onAccountNameBlurEvent()", () => {
        it("should remove leading and trailing spaces from account holder name", () => {
            component.onAccountNameBlurEvent("  account  name  ");
            expect(component.bankDraftEditForm.controls.accountName.value).toEqual("account name");
        });
    });

    describe("onCardHolderBlurEvent()", () => {
        it("should remove leading and trailing spaces from card holder name", () => {
            component.onCardHolderBlurEvent("  name  ");
            expect(component.creditCardForm.controls.cardHolder.value).toEqual("name");
        });
    });

    describe("submitBankDraft()", () => {
        beforeEach(() => {
            component.bankDraftDetails = {
                id: 1,
                bankName: "name",
                paymentType: PaymentType.CREDITCARD,
                type: "VISA",
                accountNumberLastFour: "4121",
                routingNumber: "122199983",
                sameAddressAsHome: false,
                expirationMonth: 2,
                expirationYear: 25,
                tokens: [{ carrierId: CarrierId.AFLAC, token: "23764658348734" }],
                tempusPostalCode: "123421",
                billingName: { firstName: "", lastName: "" },
                billingAddress: { zip: "123421" },
            };
        });
        it("should return a bank draft payload when createBankDraftUpdatePayload called", () => {
            const spy1 = jest.spyOn(memberService, "updatePaymentMethod");
            const spy2 = jest.spyOn(component, "createBankDraftUpdatePayload");

            component.submitBankDraft();
            expect(spy2).toBeCalled();
            expect(spy1).toBeCalled();
        });
    });

    describe("copyToClipBoard()", () => {
        it("should copy the routing number successfully", () => {
            component.copyToClipboard();
            expect(component.isRoutingNumCopied).toBe(true);
        });
    });

    describe("onSaveOfCardDetails()", () => {
        beforeEach(() => {
            component.creditCardDetails = {
                id: 1,
                accountName: "name",
                paymentType: PaymentType.CREDITCARD,
                type: "VISA",
                lastFour: "4121",
                sameAddressAsHome: false,
                expirationMonth: 2,
                expirationYear: 25,
                tokens: [{ carrierId: CarrierId.AFLAC, token: "23764658348734" }],
                tempusPostalCode: "123421",
                billingName: { firstName: "", lastName: "" },
                billingAddress: { zip: "123421" },
            };
        });

        it("should trigger onSaveOfCardDetails in edit card flow", () => {
            component.paymentMethod = PaymentType.CREDITCARD;
            const spy1 = jest.spyOn(memberService, "updatePaymentMethod");
            component.onSaveOfCardDetails();
            expect(spy1).toBeCalled();
        });
    });
    describe("ngOnInit()", () => {
        it("should set default routing number text on initializing component", () => {
            component.defaultRoutingNumber = "123456789";
            jest.spyOn(staticUtilService, "cacheConfigValue");
            component.languageStrings["primary.portal.paymentDetails.displayRoutingNumberAlert"] =
                "This account must use routing number #defaultRoutingNumber";
            component.ngOnInit();
            expect(component.defaultRoutingNumberText).toEqual("This account must use routing number 123456789");
        });
    });
});
