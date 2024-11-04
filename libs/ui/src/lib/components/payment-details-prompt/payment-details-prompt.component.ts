import { Component, EventEmitter, HostListener, Inject, OnDestroy, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { MemberService } from "@empowered/api";
import {
    CarrierId,
    CreditCardNetwork,
    DateInfo,
    PaymentType,
    AddPaymentErrorCodes,
    AddPayment,
    EditPayment,
    AccountType,
    BankDraftErrorCodes,
} from "@empowered/constants";
import { Observable, Subject } from "rxjs";
import { takeUntil, switchMap, filter } from "rxjs/operators";
import {
    TempusIframeResponseModel,
    RepAddDataModel,
    PaymentPromptDataModel,
    ClientErrorResponseCode,
    ClientErrorResponseType,
    ConfigName,
} from "@empowered/constants";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { DateService } from "@empowered/date";
import { LanguageService } from "@empowered/language";
import { HttpErrorResponse } from "@angular/common/http";
import { MatSelectChange } from "@angular/material/select";
import { Select } from "@ngxs/store";
import { RegexDataType, SharedState } from "@empowered/ngxs-store";
import { StaticUtilService } from "@empowered/ngxs-store";
import { CustomValidation } from "../../validation/custom-validation";
import { TitleCasePipe } from "@angular/common";
import * as xml2js from "xml2js";

type RepAddDataResponse = Partial<RepAddDataModel>;

const MAX_YEAR_LIMIT = 2999;
const FIVE = 5;
const NINE = 9;
const TWO = 2;
const YEAR = 2000;
const HUNDRED = 100;
const DECLINED = "DECLINED";
const FALSE = "FALSE";
const EXPIRED = "EXPIRED";
const TRUE = "true";
const TOUCHED = "TOUCHED";
const SUCCESS = "TRUE";

@Component({
    selector: "empowered-payment-details-prompt",
    templateUrl: "./payment-details-prompt.component.html",
    styleUrls: ["./payment-details-prompt.component.scss"],
})
export class PaymentDetailsPromptComponent implements OnInit, OnDestroy {
    url: SafeResourceUrl;
    tempusTokenIdentityGuid: string;
    mpGroup: number;
    memberId: number;
    editModal: boolean;
    creditCardForm: FormGroup;
    bankDraftEditForm: FormGroup;
    monthNames = DateInfo.MONTH_NAMES;
    years: number[] = [];
    selectedMonth: number;
    tempusResponsePayload: AddPayment;
    creditCardDetails: EditPayment;
    bankDraftDetails: EditPayment;
    maxAttemptsAllowed: number;
    incorrectCardInfoErrorMessage = false;
    isCardNotExpired = true;
    validationRegex: RegexDataType;
    paymentMethod: string;
    paymentType = PaymentType;
    accountType = AccountType;
    selectedAccountType: string;
    isACHPartnerAccountType: boolean;
    defaultRoutingNumber: string;
    defaultRoutingNumberText: string;
    isRoutingNumCopied = false;

    private readonly unsubscribe$ = new Subject<void>();
    // TODO Added nullish check to avoid failure of test case, once module federation changes completed, need to overview on it again
    @Select(SharedState?.regex) regex$: Observable<any>;

    constructor(
        private readonly dialogRef: MatDialogRef<PaymentDetailsPromptComponent>,
        private readonly sanitizer: DomSanitizer,
        @Inject(MAT_DIALOG_DATA) data: PaymentPromptDataModel,
        private readonly memberService: MemberService,
        private readonly fb: FormBuilder,
        private readonly dateService: DateService,
        private readonly langService: LanguageService,
        private readonly staticUtil: StaticUtilService,
        private readonly titleCasePipe: TitleCasePipe,
    ) {
        this.editModal = data.editModal;
        this.mpGroup = data.mpGroup;
        this.memberId = data.memberId;
        this.paymentMethod = data.paymentMethod;
        if (this.paymentMethod === this.paymentType.BANKDRAFT) {
            this.bankDraftDetails = data.bankDraftDetails;
            this.isACHPartnerAccountType = data.isACHPartnerAccountType;
            this.defaultRoutingNumber = data.defaultRoutingNumber;
        } else {
            this.creditCardDetails = data.creditCardDetails;
        }
        if (!this.editModal) {
            this.url = this.sanitizer.bypassSecurityTrustResourceUrl(data.tempusIframeURL + data.tempusSessionObject.sessionId);
            this.tempusTokenIdentityGuid = data.tempusSessionObject.tempusTokenIdentityGuid;
        } else {
            this.tempusTokenIdentityGuid =
                this.creditCardDetails?.tempusTokenIdentityGuid ?? this.bankDraftDetails?.tempusTokenIdentityGuid;
        }
    }

    languageStrings: Record<string, string> = this.langService.fetchPrimaryLanguageValues([
        "primary.portal.paymentDetails.cardEndingIn",
        "primary.portal.paymentDetails.placeholderExpirationMonth",
        "primary.portal.paymentDetails.placeholderExpirationYear",
        "primary.portal.paymentDetails.displayRoutingNumberAlert",
    ]);

    ngOnInit(): void {
        const currentYear = new Date().getFullYear();
        this.defaultRoutingNumberText = this.languageStrings["primary.portal.paymentDetails.displayRoutingNumberAlert"].replace(
            "#defaultRoutingNumber",
            this.defaultRoutingNumber,
        );
        for (let year = currentYear; year <= MAX_YEAR_LIMIT; year++) {
            this.years.push(year);
        }
        new CustomValidation();
        if (this.editModal) {
            if (this.paymentMethod === this.paymentType.BANKDRAFT) {
                this.initializeBankDraftEditForm();
            } else {
                this.initializeCreditForm();
            }
        }
        this.staticUtil
            .cacheConfigValue(ConfigName.PNC_IFRAME_MAX_FAILURE_ATTEMPTS)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((configValue) => (this.maxAttemptsAllowed = +configValue));
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                this.validationRegex = data;
            }
        });
    }

    /**
     * Determines whether it is PCR generic flow
     * @returns true if PCR generic flow
     */
    isPCRGenericFlow(): boolean {
        return !this.mpGroup && !this.memberId;
    }

    /**
     * Initializes bank draft edit form
     */
    initializeBankDraftEditForm(): void {
        const transformAccountTypeToTitleCase = this.titleCasePipe.transform(this.bankDraftDetails?.accountType);
        this.selectedAccountType = transformAccountTypeToTitleCase;
        this.bankDraftEditForm = this.fb.group({
            accountType: [transformAccountTypeToTitleCase, Validators.required],
            accountName: [this.bankDraftDetails?.accountName, [Validators.required, CustomValidation.checkNameValidation]],
        });
    }

    /**
     * Initializing credit form
     */
    initializeCreditForm(): void {
        // selectedDate will be last day of expiration month
        const selectedDate = new Date(this.creditCardDetails?.expirationYear, this.creditCardDetails?.expirationMonth, 0);
        this.isCardNotExpired = this.dateService.getIsAfterOrIsEqual(selectedDate, new Date());
        const expirationMonth = this.monthNames[this.creditCardDetails?.expirationMonth - 1];
        const expirationYear =
            this.creditCardDetails?.expirationYear?.toString()?.length === TWO
                ? this.creditCardDetails?.expirationYear + YEAR
                : this.creditCardDetails?.expirationYear;
        this.creditCardForm = this.fb.group(
            {
                cardHolder: [this.creditCardDetails?.accountName, [Validators.required, CustomValidation.checkNameValidation]],
                cardNumber: [
                    {
                        value: this.languageStrings["primary.portal.paymentDetails.cardEndingIn"] + " " + this.creditCardDetails?.lastFour,
                        disabled: true,
                    },
                ],
                expirationMonth: [this.isCardNotExpired ? expirationMonth : "", Validators.required],
                expirationYear: [this.isCardNotExpired ? expirationYear : "", Validators.required],
                zipCode: [this.creditCardDetails?.tempusPostalCode, { updateOn: "change", validators: Validators.required }],
            },
            { updateOn: "change" },
        );
    }

    /**
     * this method is used to remove leading and trailing spaces of cardholder name and also it is used to remove the spaces
     * between two words if more than 1 space is added
     * @param cardHolderValue the entered card holder value
     * @returns void
     */
    onCardHolderBlurEvent(cardHolderValue: string): void {
        this.creditCardForm.get("cardHolder").patchValue(cardHolderValue.replace(/\s+/g, " ").trim());
    }

    /**
     * Sets appropriate variables to show error to the user
     * @param err HttpErrorResponse
     */
    onHttpError(err: HttpErrorResponse): void {
        if (err?.error?.status === ClientErrorResponseCode.RESP_400 && err?.error?.code === ClientErrorResponseType.BAD_PARAMETER) {
            this.incorrectCardInfoErrorMessage = true;
            this.isCardNotExpired = true;
        }
    }

    /**
     * Determines whether save of bank draft on
     */
    submitBankDraft(): void {
        if (this.bankDraftEditForm.valid) {
            if (this.mpGroup) {
                const updatePayload = this.createBankDraftUpdatePayload();
                this.memberService
                    .updatePaymentMethod(this.memberId, this.mpGroup, updatePayload, this.bankDraftDetails?.id)
                    .pipe(
                        switchMap(() => this.memberService.getPaymentMethods(this.memberId, this.mpGroup)),
                        takeUntil(this.unsubscribe$),
                    )
                    .subscribe(
                        (paymentMethods) => {
                            const updatedPaymentRecord = paymentMethods.find(
                                (paymentMethod) =>
                                    paymentMethod?.paymentType === PaymentType.BANKDRAFT && paymentMethod?.id === this.bankDraftDetails?.id,
                            );
                            this.bankDraftDetails.accountName = updatedPaymentRecord?.accountName;
                            this.bankDraftDetails.accountType = updatedPaymentRecord?.accountType;
                            this.dialogRef.close(this.bankDraftDetails);
                        },
                        (err) => this.onHttpError(err),
                    );
            } else {
                const payload = {
                    tempusTokenIdentityGuid: this.tempusTokenIdentityGuid,
                    accountName: this.bankDraftEditForm.value.accountName,
                    accountType: this.bankDraftEditForm.value.accountType,
                    paymentType: this.paymentMethod,
                };
                this.memberService
                    .updatePcrPaymentMethod(payload)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        () => {
                            this.bankDraftDetails.accountName = this.bankDraftEditForm.value.accountName;
                            this.bankDraftDetails.accountType = this.bankDraftEditForm.value.accountType;
                            this.dialogRef.close(this.bankDraftDetails);
                        },
                        (err) => this.onHttpError(err),
                    );
            }
        }
    }

    /**
     * save updated card information
     */
    onSaveOfCardDetails(): void {
        this.creditCardForm.controls.cardHolder.markAsTouched();
        const zipCodeControl = this.creditCardForm.controls.zipCode;
        if (!zipCodeControl.value) {
            (zipCodeControl.statusChanges as EventEmitter<string>).emit(TOUCHED);
        }
        if (!this.isCardNotExpired) {
            this.creditCardForm.controls.expirationMonth.markAsTouched();
            this.creditCardForm.controls.expirationYear.markAsTouched();
        }
        if (this.creditCardForm.valid) {
            if (this.mpGroup) {
                const payload = this.updatePayload(this.creditCardDetails);
                this.memberService
                    .updatePaymentMethod(this.memberId, this.mpGroup, payload, this.creditCardDetails.id)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        () => {
                            this.creditCardDetails.accountName = payload.accountName;
                            this.creditCardDetails.expirationMonth = payload.expirationMonth;
                            this.creditCardDetails.expirationYear = payload.expirationYear;
                            this.creditCardDetails.tempusPostalCode = payload.tempusPostalCode;
                            this.dialogRef.close(this.creditCardDetails);
                        },
                        (err) => this.onHttpError(err),
                    );
            } else {
                const payload = {
                    expirationMonth: this.monthNames.indexOf(this.creditCardForm.value.expirationMonth) + 1,
                    expirationYear: this.creditCardForm.value.expirationYear,
                    tempusTokenIdentityGuid: this.tempusTokenIdentityGuid,
                    tempusPostalCode: this.creditCardForm.value.zipCode,
                    cardHolderName: this.creditCardForm.value.cardHolder,
                };
                this.memberService
                    .updatePcrPaymentMethod(payload)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        () => {
                            this.creditCardDetails.accountName = this.creditCardForm.value.cardHolder;
                            this.creditCardDetails.expirationMonth = this.monthNames.indexOf(this.creditCardForm.value.expirationMonth) + 1;
                            this.creditCardDetails.expirationYear = this.creditCardForm.value.expirationYear;
                            this.creditCardDetails.tempusPostalCode = this.creditCardForm.value.zipCode;
                            this.dialogRef.close(this.creditCardDetails);
                        },
                        (err) => this.onHttpError(err),
                    );
            }
        }
    }
    /**
     * Creates bank draft update payload for update api call
     * @returns bank draft update payload
     */
    createBankDraftUpdatePayload(): AddPayment {
        const payload: AddPayment = {
            accountName: this.bankDraftEditForm.value.accountName,
            paymentType: PaymentType.BANKDRAFT,
            accountType: this.bankDraftEditForm.value.accountType,
            accountNumber: this.bankDraftDetails.accountNumberLastFour,
            routingNumber: this.bankDraftDetails.routingNumber,
            bankName: this.bankDraftDetails.bankName,
            billingName: this.bankDraftDetails.billingName,
            billingAddress: this.bankDraftDetails.billingAddress?.zip ? this.bankDraftDetails.billingAddress : null,
            sameAddressAsHome: this.bankDraftDetails.sameAddressAsHome,
            tokens: [{ carrierId: CarrierId.AFLAC, token: "" }],
            tempusTokenIdentityGuid: this.bankDraftDetails.tempusTokenIdentityGuid,
        };
        return payload;
    }

    /**
     * this method is used to remove leading and trailing spaces of account name and also it is used to remove the spaces
     * between two words if more than 1 space is added
     * @param accountNameValue the entered account name value
     * @returns void
     */
    onAccountNameBlurEvent(accountNameValue: string): void {
        this.bankDraftEditForm.get("accountName").patchValue(accountNameValue.replace(/\s+/g, " ").trim());
    }

    /**
     * Creates payload data for update payment call
     * @param repUpdateData RepUpdateDataResponse
     * @returns payload data
     */
    updatePayload(repUpdateData: EditPayment): AddPayment {
        const payload: AddPayment = {
            accountName: this.creditCardForm.value.cardHolder,
            paymentType: repUpdateData.paymentType,
            type: repUpdateData.type,
            tempusTokenIdentityGuid: this.tempusTokenIdentityGuid,
            sameAddressAsHome: repUpdateData.sameAddressAsHome,
            tokens: [{ carrierId: CarrierId.AFLAC, token: repUpdateData.tokens[0].token }],
            lastFour: repUpdateData.lastFour,
            expirationMonth: this.monthNames.indexOf(this.creditCardForm.value.expirationMonth) + 1,
            expirationYear: this.creditCardForm.value.expirationYear,
            tempusPostalCode: this.creditCardForm.value.zipCode,
            billingName: repUpdateData.billingName,
            billingAddress: repUpdateData.billingAddress,
        };
        return payload;
    }

    /**
     * Validates month and year field
     * @param event event occurs when value changes in dropdown
     * @param isMonthChange if month is change in dropdown
     * @param isYearChange if year is change in dropdown
     * @return void
     */
    updateDateSelection(event: MatSelectChange, isMonthChange: boolean, isYearChange: boolean): void {
        const indexOfMonth = isMonthChange
            ? this.monthNames.indexOf(event.value)
            : this.monthNames.indexOf(this.creditCardForm.value.expirationMonth);
        const selectedDate = isYearChange
            ? new Date(event.value, indexOfMonth)
            : new Date(this.creditCardForm.value.expirationYear, indexOfMonth);
        const checkFutureDate = this.dateService.getIsAfterOrIsEqual(selectedDate, new Date());
        this.creditCardForm.controls.expirationMonth.markAsTouched();
        const isDateIncorrect = !checkFutureDate && selectedDate && (isYearChange ? event.value : this.creditCardForm.value.expirationYear);
        this.creditCardForm.controls.expirationMonth.setErrors(isDateIncorrect ? { incorrect: true } : null);
    }

    /**
     * Hosts listener to listen message event sent by tempus iframe
     * @param messageEvent post message data sent by tempus
     */
    @HostListener("window:message", ["$event"])
    onMessage(messageEvent: MessageEvent): void {
        const resp = messageEvent.data as TempusIframeResponseModel;
        const attempts = resp.attempts ?? 1;

        const cancel = resp?.cancel ?? false;
        if (cancel === TRUE) {
            const returnErrorResult = { errorCode: AddPaymentErrorCodes.CANCEL };
            this.dialogRef.close(returnErrorResult);
            return;
        }
        // TODO: Cancel click logic goes here. Once available in iFrame, connect it here.
        let result: RepAddDataResponse = {};
        if (this.maxAttemptsAllowed && attempts <= this.maxAttemptsAllowed) {
            // We are getting post message response from tempus iframe
            // in form of query params, so we will have to pull details
            // out of it to perform further operations and store it.
            decodeURI(resp?.repadddataResult)
                .replace("?", "")
                .split("&")
                .forEach((value: string) => {
                    const valuePair = value.split("=");
                    result = { ...result, [valuePair[0]]: valuePair[1] };
                });
            this.processTempusResponse(result, attempts);
            return;
        }
    }

    /**
     * Returns error code post parsing the TAVSRESPONSE XML
     * @param transResponseData
     * @returns error code
     */
    returnErrorCode(transResponseData: RepAddDataResponse): string {
        let errorMessage;
        const parser: xml2js.Parser = new xml2js.Parser();
        // parsing TAVSRESPONSE which comes as XML to get error codes
        parser.parseString(transResponseData.TAVSRESPONSE, (err, result) => {
            if (err) {
                throw err;
            }
            errorMessage = result.TAVSRESPONSE.VALIDATIONTYPES[0].VALIDATIONTYPE[0].RAWVALIDATIONRESPONSE[0];
        });
        return errorMessage;
    }

    /**
     * Gets card type after mapping it from card type enums
     * @param cardType string
     * @returns card type
     */
    getCardType(cardType: string): string {
        if (cardType === "MC") {
            return CreditCardNetwork.MASTER_CARD;
        } else if (cardType === "AMEX") {
            return CreditCardNetwork.AMERICAN_EXPRESS;
        }
        return CreditCardNetwork.VISA;
    }

    /**
     * Handles bank draft error
     * @param errorMessage this includes the error code with reason of validation failure after
     * submitting account details through iframe for bank draft
     * @param attempts attempts count after clicking on save button in Iframe
     * @return void
     */
    handleBankDraftError(errorMessage: string, attempts: number): void {
        let returnErrorResult: AddPayment;
        if (errorMessage.includes(BankDraftErrorCodes.RT01)) {
            returnErrorResult = { errorCode: AddPaymentErrorCodes.ACCOUNT_VALIDATION_FAILED };
            this.dialogRef.close(returnErrorResult);
        } else if (
            attempts >= this.maxAttemptsAllowed &&
            (errorMessage.includes(BankDraftErrorCodes.GS01) || errorMessage.includes(BankDraftErrorCodes.GS02))
        ) {
            returnErrorResult = { errorCode: AddPaymentErrorCodes.MAX_ATTEMPTS_REACHED };
            this.dialogRef.close(returnErrorResult);
        }
    }
    /**
     * Process tempus response and also will check if card is declined or expired or
     * maximum attempts reached and accordingly will close dialog box with appropriate errorCode
     * @param result data getting from tempus response
     * @param attempts attempts count after clicking on save button in Iframe
     * @returns void
     */
    processTempusResponse(result: RepAddDataResponse, attempts: number): void {
        let returnErrorResult: AddPayment;
        if (result?.TRANSUCCESS === "TRUE") {
            // Close the modal with iFrame
            // Make an API call to store data in BE
            const payloadData =
                this.paymentMethod === this.paymentType.BANKDRAFT ? this.createBankDraftPayload(result) : this.createPayload(result);
            if (this.defaultRoutingNumber && this.defaultRoutingNumber !== payloadData.routingNumber && this.isACHPartnerAccountType) {
                returnErrorResult = { errorCode: AddPaymentErrorCodes.ROUTING_NUMBER_MISMATCH };
                this.dialogRef.close(returnErrorResult);
                return;
            }
            if (result.REPQUEUEDFAILURE && result.REPQUEUEDFAILURE === SUCCESS) {
                returnErrorResult = { errorCode: AddPaymentErrorCodes.ACCOUNT_VALIDATION_FAILED };
                this.dialogRef.close(returnErrorResult);
                return;
            }
            if (!this.mpGroup) {
                this.dialogRef.close(payloadData);
            } else {
                this.savePaymentData(payloadData);
            }
        } else if (result?.TRANSUCCESS === FALSE) {
            let errorCode: string;
            if (this.paymentMethod === this.paymentType.BANKDRAFT) {
                // for bank draft flows we are dependent on TAVSRESPONSE XML for error codes
                errorCode = this.returnErrorCode(result);
                this.handleBankDraftError(errorCode, attempts);
            } else {
                if (result?.TRANRESPMESSAGE?.includes(DECLINED)) {
                    returnErrorResult = { errorCode: AddPaymentErrorCodes.DECLINED_CARD };
                    this.dialogRef.close(returnErrorResult);
                } else if (result?.TRANRESPMESSAGE?.includes(EXPIRED)) {
                    returnErrorResult = { errorCode: AddPaymentErrorCodes.EXPIRED_CARD };
                    this.dialogRef.close(returnErrorResult);
                } else if (attempts >= this.maxAttemptsAllowed) {
                    returnErrorResult = { errorCode: AddPaymentErrorCodes.MAX_ATTEMPTS_REACHED };
                    this.dialogRef.close(returnErrorResult);
                }
            }
        }
    }
    /**
     * Creates bank draft payload out of tempus response
     * @param repAddData
     * @returns bank draft payload
     */
    createBankDraftPayload(repAddData: RepAddDataResponse): AddPayment {
        // this payload has some hardcoded values and magic numbers
        // as tempus is not returning complete response,
        // so as an interim solution we are passing few hardcoded values
        const payload: AddPayment = {
            accountName: repAddData.REPCHECKACCOUNTNAME,
            paymentType: this.paymentType.BANKDRAFT,
            accountType: repAddData.CHECKACCOUNTTYPE === "CHECKING" ? "Checking" : "Savings",
            accountNumber: repAddData.CKACCOUNT4,
            routingNumber: repAddData.CHECKROUTING,
            bankName: repAddData.BANKNAME,
            sameAddressAsHome: false,
            tokens: [{ carrierId: CarrierId.AFLAC, token: repAddData.REPTOKEN }],
            billingName: { firstName: "", lastName: "" },
            tempusTokenIdentityGuid: this.tempusTokenIdentityGuid,
        };
        return payload;
    }

    /**
     * Saves payment data
     * @param payloadData AddPayment
     */
    savePaymentData(payloadData: AddPayment): void {
        this.memberService
            .addPaymentMethod(this.memberId, this.mpGroup, payloadData, true)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                () => this.dialogRef.close(payloadData),
                (err) => this.dialogRef.close(err),
            );
    }

    /**
     * Creates payload data for add payment call
     * @param repadddata RepAddDataResponse
     * @returns payload data to be sent to BE
     */
    createPayload(repAddData: RepAddDataResponse): AddPayment {
        const lastFour = repAddData.TRANSARMORTOKEN;
        const expirationDate = repAddData.CCEXP;
        const payload: AddPayment = {
            accountName: repAddData.REPCCNAME,
            paymentType: PaymentType.CREDITCARD,
            type: this.getCardType(repAddData.CCCARDTYPE),
            tempusTokenIdentityGuid: this.tempusTokenIdentityGuid,
            sameAddressAsHome: false,
            tokens: [{ carrierId: CarrierId.AFLAC, token: repAddData.REPTOKEN }],
            lastFour: lastFour.substring(lastFour.length - 4, lastFour.length),
            expirationMonth: +expirationDate.substring(0, 2),
            expirationYear: this.getExpYear(+expirationDate.substring(expirationDate.length - 2, expirationDate.length)),
            tempusPostalCode: repAddData.AVSDATA,
            billingName: { firstName: "", lastName: "" },
            billingAddress: { zip: repAddData.AVSDATA },
        };
        return payload;
    }

    /**
     * Gets expiration year
     * @param year two digit expiration year
     * @returns four digit expiration year
     */
    getExpYear(year: number): number {
        const date = new Date();
        // it takes first two digit of current year and appends last two digit of exp year
        // received from iframe to it
        const expYear = Math.floor(date.getFullYear() / HUNDRED) * HUNDRED + year;
        // if the resulting year is in past then add 100 to it
        // here the assumption is tempus won't allow past year during add card flow
        return expYear < date.getFullYear() ? expYear + HUNDRED : expYear;
    }

    /**
     * Copies data to clipboard
     * change the icon and text to copied after successful copy action
     * @returns void
     */
    copyToClipboard(): void {
        this.isRoutingNumCopied = !this.isRoutingNumCopied;
    }

    /**
     * To clean up subscription on destroy
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
