import { Component, OnInit, Inject, Input, ViewChild, OnDestroy } from "@angular/core";
import { DatePipe, TitleCasePipe } from "@angular/common";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormGroup, FormBuilder, Validators, ValidationErrors, AbstractControl } from "@angular/forms";
import { ApplicationService, CardType, StaticService, MemberService, ValidateRoutingNumber, DialogData } from "@empowered/api";
import { MatDatepicker } from "@angular/material/datepicker";
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from "@angular/material/core";
import { Store, Select } from "@ngxs/store";
import { Observable, combineLatest, forkJoin, Subscription } from "rxjs";
import { EnrollmentState, SharedState, RegexDataType, StaticUtilService } from "@empowered/ngxs-store";
import { PaymetricService } from "@empowered/common-services";
import { switchMap, filter } from "rxjs/operators";
import { HttpResponse } from "@angular/common/http";
import {
    CreditCardNetwork,
    PaymentInfo,
    AppSettings,
    CarrierId,
    TempusPaymentConfig,
    ConfigName,
    STAR,
    Configurations,
    PaymentType,
    AccountType,
    AddPayment,
    Token,
    PayMetricData,
} from "@empowered/constants";
import { DateFnsDateAdapter, DateService, EXPIRY_DATES_FORMAT } from "@empowered/date";

const TRUE_VALUE = "TRUE";
const DATE_FORMAT = {
    parse: {
        dateInput: AppSettings.DATE_FORMAT_MM_YYYY,
    },
    display: {
        dateInput: AppSettings.DATE_FORMAT_MM_YYYY,
        monthYearLabel: AppSettings.MONTH_YEAR_FORMAT,
        dateA11yLabel: AppSettings.DATE_A11_LABEL,
        monthYearA11yLabel: AppSettings.DATE_FORMAT_MMMM_YYYY,
    },
};

/* Part of deprecated code */
const KEY_NULL = 0;
const MONTH = 1;
const KEY_BACKSPACE = 8;
const KEY_HELP = 47;
const KEY_ZERO = 48;
const KEY_NINE = 57;
const KEY_INSERT = 45;
const KEY_RIGHT_ARROW = 39;
const KEY_SPACEBAR = 32;
const KEY_A = 65;
const KEY_Z = 90;
const KEY_NUMPAD_1 = 97;
const KEY_F11 = 122;
/* Part of deprecated code */

const PREPENDED_ASTERISKS = "*".repeat(PaymentInfo.CARD_NUMBER_MAX_LENGTH - PaymentInfo.LAST_FOUR_DIGITS_LENGTH);
const ALREADY_EXIST = "alreadyExist";
const ALLOWED_ERROR_NO = 1;
const CLOSE = "close";

@Component({
    selector: "empowered-edit-delete-payment",
    templateUrl: "./edit-delete-payment.component.html",
    styleUrls: ["./edit-delete-payment.component.scss"],
    providers: [
        { provide: DateAdapter, useClass: DateFnsDateAdapter, deps: [MAT_DATE_LOCALE] },
        { provide: MAT_DATE_FORMATS, useValue: EXPIRY_DATES_FORMAT },
    ],
})
export class EditDeletePaymentComponent implements OnInit, OnDestroy {
    @ViewChild("dp") creditCardDatePicker: MatDatepicker<Date>;
    @ViewChild("dpDc") debitCardDatePicker: MatDatepicker<Date>;
    subscriptions: Subscription[] = [];
    bankDraftForm: FormGroup;
    creditCardForm: FormGroup;
    debitCardForm: FormGroup;
    accountType = AccountType;
    isACHPartnerAccountType: boolean;
    defaultRoutingNumber: string;
    draftOriginIndicator: string;
    DRAFT_ORIGIN_INDICATOR_CHECKING = "1";
    DRAFT_ORIGIN_INDICATOR_SAVING = "2";
    routingApiError = false;
    disableDropdown = false;
    apiError = false;
    apiErrorMessage: string;
    creditCardApiError = false;
    debitCardApiError = false;
    zipApiError = false;
    reqBodyForBankDraftEdit: AddPayment;
    AppSettings = AppSettings;
    @Input() reinstate: boolean;
    paymentType = PaymentType;
    creditCardFocused = true;
    debitCardFocused = true;
    currentDate = new Date();
    minDate: string;
    maxDate: string;
    thirtyDayCheckDate = new Date();
    nextDayDate = new Date();
    MAX_DAYS_ALLOWED = 29;
    MIN_DAYS_ALLOWED = 1;
    vspToken: string;
    aflacToken: string;
    validationRegex: RegexDataType;
    focused = true;
    routingNumberfocused = true;
    reEnterFocused = true;
    paymetricObservables: Observable<PayMetricData>[] = [];
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    visaRegex: RegExp;
    masterCardRegex: RegExp;
    amexRegex: RegExp;
    cardType: CardType;
    creditDate: Date;
    mpGroup: number;
    memberId: number;
    enrollmentState: string;
    vspMerchantId: string;
    aflacMerchantId: string;
    showSpinner = false;
    removedCardHeader: string;
    creditCardExpiration: AbstractControl;
    debitCardExpiration: AbstractControl;
    reqBodyForCardEdit: AddPayment;
    ACCOUNT_NUMBER_MAX_LENGTH = 24;
    CARD_NUMBER_MAX_LENGTH = 16;
    paymentMethods: AddPayment[] = [];
    bankAccounts: AddPayment[] = [];
    creditCardAccounts: AddPayment[] = [];
    debitCardAccounts: AddPayment[] = [];
    cardExists = false;
    isBankInfoReadOnly = true;
    tempusPaymentConfig: boolean;
    selectedAccountNickName: string;

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.placeholderSelect",
        "primary.portal.applicationFlow.payments.accountName",
        "primary.portal.common.requiredField",
        "primary.portal.common.save",
        "primary.portal.common.delete",
        "primary.portal.applicationFlow.payments.editAccount",
        "primary.portal.applicationFlow.payments.deletePaymentMethod",
        "primary.portal.applicationFlow.payments.cardRemoved",
        "primary.portal.applicationFlow.payments.accountNameRemoved",
        "primary.portal.applicationFlow.payments.bankName",
        "primary.portal.applicationFlow.payments.routingNumber",
        "primary.portal.applicationFlow.payments.accountNumber",
        "primary.portal.applicationFlow.payments.reenterAccountNumber",
        "primary.portal.applicationFlow.payments.accountType",
        "primary.portal.applicationFlow.payments.accountTypeChecking",
        "primary.portal.applicationFlow.payments.accountTypeSaving",
        "primary.portal.common.selectionRequired",
        "primary.portal.applicationFlow.payments.cardNumber",
        "primary.portal.applicationFlow.payments.cardTypeHint",
        "primary.portal.applicationFlow.payments.invalidCardNumber",
        "primary.portal.applicationFlow.payments.cardExist",
        "primary.portal.applicationFlow.payments.expirationDate",
        "primary.portal.applicationFlow.payments.expDate.dateFormat",
        "primary.portal.applicationFlow.payments.invalidExpirationDate",
        "primary.portal.applicationFlow.payments.pastDate",
        "primary.portal.applicationFlow.payments.editCard",
        "primary.portal.applicationFlow.payments.invalidRoutingNumber",
        "primary.portal.applicationFlow.payments.invalidAccountNumber",
        "primary.portal.applicationFlow.payments.accountNoDontMatch",
        "primary.portal.applicationFlow.payments.bankDraft.accountLabeling",
    ]);

    /**
     * Initializing and resolving all class members
     */
    constructor(
        private readonly language: LanguageService,
        @Inject(MAT_DIALOG_DATA) readonly data: DialogData,
        private readonly fb: FormBuilder,
        private readonly memberService: MemberService,
        private readonly EnrollmentDialogRef: MatDialogRef<EditDeletePaymentComponent>,
        private readonly datePipe: DatePipe,
        private readonly applicationService: ApplicationService,
        private readonly staticService: StaticService,
        private readonly store: Store,
        private readonly paymetricService: PaymetricService,
        private readonly staticUtil: StaticUtilService,
        private readonly dateService: DateService,
        private readonly titleCasePipe: TitleCasePipe,
    ) {
        this.mpGroup = this.data?.mpGroup ?? this.store.selectSnapshot(EnrollmentState.GetMPGroup);
        this.memberId = this.data?.memberId ?? this.store.selectSnapshot(EnrollmentState.GetMemberId);
    }

    /**
     * Angular life cycle hook to initialize the component
     */
    ngOnInit(): void {
        this.routingNumberfocused = false;
        this.setAccountNameOnDeleteModal();
        if (this.mpGroup) {
            this.subscriptions.push(
                this.memberService.getPaymentMethods(this.memberId, this.mpGroup).subscribe((res) => (this.paymentMethods = res)),
                this.staticService
                    .getConfigurations(TempusPaymentConfig.TEMPUS_IFRAME_ENABLE_CONFIG, this.mpGroup)
                    .subscribe((tempusConfig) => (this.tempusPaymentConfig = tempusConfig[0].value === TRUE_VALUE)),
            );
        }
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.subscriptions.push(
            this.regex$.subscribe((data) => {
                if (data) {
                    this.validationRegex = data;
                }
            }),
        );
        if (this.data.selectedPaymentMethod === PaymentType.BANKDRAFT && this.data?.edit) {
            this.initializeBankForm();
        } else {
            if (this.data.selectedPaymentMethod === PaymentType.CREDITCARD) {
                this.initializeCreditForm();
                this.creditCardExpiration = this.creditCardForm.controls.expirationDate;
            } else {
                this.initializeDebitForm();
                this.debitCardExpiration = this.debitCardForm.controls.expirationDate;
            }
            this.removedCardHeader = this.languageStrings["primary.portal.applicationFlow.payments.cardRemoved"].replace(
                "##cardNumber##",
                this.data.selectedIndex.lastFour,
            );
        }
        this.currentDate = new Date();
        // Get date that is 30 days from the current date
        this.maxDate = this.datePipe.transform(
            this.thirtyDayCheckDate.setDate(this.currentDate.getDate() + this.MAX_DAYS_ALLOWED),
            AppSettings.MONTH_DATE_FORMAT_MM_DD,
        );
        // Get date that is 1 day from current date
        this.minDate = this.datePipe.transform(
            this.nextDayDate.setDate(this.currentDate.getDate() + this.MIN_DAYS_ALLOWED),
            AppSettings.MONTH_DATE_FORMAT_MM_DD,
        );
        this.assignRegex();
    }
    /**
     * This method is used to set account name on delete modal according to tempusTokenIdentityGuid
     * @returns void
     */
    setAccountNameOnDeleteModal(): void {
        if (this.data?.selectedPaymentMethod === PaymentType.BANKDRAFT) {
            if (this.data?.selectedIndex?.tempusTokenIdentityGuid) {
                this.setAccountNickName();
            } else {
                this.selectedAccountNickName = this.data?.selectedIndex?.accountName;
            }
        }
    }
    /**
     * Sets account nick name
     * @returns void
     */
    setAccountNickName(): void {
        const selectedBankAccount = this.data.selectedIndex;
        const transformAccountTypeToTitleCase = this.titleCasePipe.transform(selectedBankAccount?.accountType);
        this.selectedAccountNickName = this.languageStrings["primary.portal.applicationFlow.payments.bankDraft.accountLabeling"]
            .replace("#accountType", transformAccountTypeToTitleCase)
            .replace("#accountNumberLastFourDigits", selectedBankAccount?.accountNumberLastFour);
    }
    /**
     * The method is used to determine if the entered account number and re entered account numbers match
     * @param accountNumber entered account number
     * @param confirmAccountNumber confirmation of entered account number
     * @returns An error based on the truthiness of the entered account numbers.
     */
    isMatching(accountNumber: string, confirmAccountNumber: string): ValidationErrors {
        return (group: FormGroup) => {
            const accountInput = group.controls[accountNumber],
                accountConfirmationInput = group.controls[confirmAccountNumber];
            if (!accountConfirmationInput.value) {
                return accountConfirmationInput.setErrors({ required: true });
            }
            if (accountConfirmationInput.value.length < PaymentInfo.ACCOUNT_NUMBER_MIN_LENGTH) {
                return accountConfirmationInput.setErrors({ minlength: true });
            }
            if (accountInput.value !== accountConfirmationInput.value) {
                return accountConfirmationInput.setErrors({ notEquivalent: true });
            }
            return accountConfirmationInput.setErrors(null);
        };
    }

    /**
     * The method is used to initialize the bank form
     */
    initializeBankForm(): void {
        this.bankDraftForm = this.fb.group(
            {
                accountName: [
                    this.data.selectedIndex.accountName,
                    [Validators.required, Validators.maxLength(PaymentInfo.ACCOUNT_NUMBER_MAX_LENGTH)],
                ],
                bankName: [this.data.selectedIndex.bankName, [Validators.pattern(this.validationRegex.BANK_NAME)]],
                routingNumber: [
                    { value: this.data.selectedIndex.routingNumber, disabled: this.data.isACHPartnerAccountType },
                    [
                        Validators.required,
                        Validators.minLength(PaymentInfo.ROUTING_NUMBER_MIN_LENGTH),
                        this.validateRoutingNumber.bind(this),
                    ],
                ],
                accountNumber: [
                    this.data.selectedIndex.accountNumberLastFour
                        ? PREPENDED_ASTERISKS.concat(this.data.selectedIndex.accountNumberLastFour)
                        : "",
                    [Validators.required, Validators.minLength(PaymentInfo.ACCOUNT_NUMBER_MIN_LENGTH)],
                ],
                reAccountNumber: [
                    this.data.selectedIndex.accountNumberLastFour
                        ? PREPENDED_ASTERISKS.concat(this.data.selectedIndex.accountNumberLastFour)
                        : "",
                    [Validators.required, Validators.maxLength(PaymentInfo.ACCOUNT_NUMBER_MAX_LENGTH)],
                ],
                accountType: [this.data.selectedIndex.accountType, Validators.required],
            },
            { validators: this.isMatching("accountNumber", "reAccountNumber") },
        );
    }

    /**
     * The method is used to validate the entered bank name so that only certain characters are allowed
     * @param event the Data entered by the user on keypress
     * @returns  charCode values based on the keyboard event
     */
    validateBankName(event: KeyboardEvent): boolean {
        return event.charCode === KEY_BACKSPACE ||
            event.charCode === KEY_INSERT ||
            event.charCode === KEY_RIGHT_ARROW ||
            (event.charCode === KEY_SPACEBAR && this.bankDraftForm.controls.bankName.value) ||
            event.charCode === KEY_NULL
            ? null
            : (event.charCode >= KEY_ZERO && event.charCode <= KEY_NINE) ||
                  (event.charCode >= KEY_A && event.charCode <= KEY_Z) ||
                  (event.charCode >= KEY_NUMPAD_1 && event.charCode <= KEY_F11);
    }

    /**
     * This function removes all trailing and leading spaces from the Bank Name field value.
     */
    removeSpaces(): void {
        this.bankDraftForm.controls.bankName.setValue(this.bankDraftForm.controls.bankName.value.trim());
    }
    /**
     * The method is used to validate the entered routing number
     * @returns True or null based on the truthiness of the class variable (routingApiError)
     */
    validateRoutingNumber(): ValidateRoutingNumber {
        return this.routingApiError ? { invalid: true } : null;
    }

    /**
     * The method is used to validate the entered number
     * @param event the Data entered by the user on keypress
     * @returns charCode values or null based on the card number entered
     */
    validateNumber(event: KeyboardEvent): boolean {
        this.apiError = this.zipApiError = this.routingApiError = this.creditCardApiError = this.debitCardApiError = false;
        return event.charCode === KEY_BACKSPACE || event.charCode === KEY_NULL
            ? null
            : event.charCode >= KEY_ZERO && event.charCode <= KEY_NINE;
    }

    /**
     * The method is used to initialize Credit card form
     */
    initializeCreditForm(): void {
        this.creditDate = new Date();
        this.creditDate.setHours(0, 0, 0, 0);
        this.creditDate.setFullYear(this.data.selectedIndex.expirationYear);
        this.creditDate.setMonth(this.data.selectedIndex.expirationMonth - MONTH);
        this.creditDate.setDate(1);
        this.creditCardForm = this.fb.group(
            {
                cardNumber: [
                    this.data.selectedIndex.lastFour ? PREPENDED_ASTERISKS.concat(this.data.selectedIndex.lastFour) : "",
                    [
                        Validators.required,
                        Validators.minLength(PaymentInfo.CARD_NUMBER_MIN_LENGTH),
                        this.validateCreditCardNumber.bind(this),
                    ],
                ],
                expirationDate: [this.creditDate, [Validators.required]],
            },
            { updateOn: "blur" },
        );
    }

    /**
     * The method is used to validate the entered credit card number
     * @returns True or null based on the truthiness of the class variable (creditCardApiError)
     */
    validateCreditCardNumber(): ValidateRoutingNumber {
        return this.creditCardApiError ? { invalid: true } : null;
    }

    /**
     * The method is used to initialize Debit card form
     */
    initializeDebitForm(): void {
        const debitDate = new Date();
        debitDate.setHours(0, 0, 0, 0);
        debitDate.setFullYear(this.data.selectedIndex.expirationYear);
        debitDate.setMonth(this.data.selectedIndex.expirationMonth - MONTH);
        debitDate.setDate(1);
        this.debitCardForm = this.fb.group(
            {
                cardNumber: [
                    this.data.selectedIndex.lastFour ? PREPENDED_ASTERISKS.concat(this.data.selectedIndex.lastFour) : "",
                    [
                        Validators.required,
                        Validators.minLength(PaymentInfo.CARD_NUMBER_MIN_LENGTH),
                        this.validateDebitCardNumber.bind(this),
                    ],
                ],
                expirationDate: [debitDate, [Validators.required]],
            },
            { updateOn: "blur" },
        );
    }

    /**
     * The method is used to validate the entered debit card number
     * @returns True or null based on the truthiness of the class variable (debitCardApiError)
     */
    validateDebitCardNumber(): ValidateRoutingNumber {
        return this.debitCardApiError ? { invalid: true } : null;
    }

    /**
     * The method is triggered on Submit of bankDraftForm
     */
    bankDraftSubmit(): void {
        const bankDraftFormControls = this.bankDraftForm.controls;
        if (this.bankDraftForm.valid) {
            if (
                bankDraftFormControls.accountNumber.value.toString().includes("*") ||
                bankDraftFormControls.reAccountNumber.value.toString().includes("*")
            ) {
                this.closePopupDelete();
            } else {
                this.saveEditedBankPaymentData();
            }
        } else {
            Object.keys(bankDraftFormControls).forEach((field) => {
                const control = this.bankDraftForm.get(field);
                control.markAsTouched({ onlySelf: true });
            });
        }
    }

    /**
     * The method is used to save the edited BankDraft data and makes an Update API call
     */
    saveEditedBankPaymentData(): void {
        this.showSpinner = true;
        const bankPayload = this.commonPaymentPayload();
        const bankDraftFormControls = this.bankDraftForm.controls;
        this.reqBodyForBankDraftEdit = {
            ...bankPayload,
            paymentType: this.data.selectedIndex.paymentType,
            accountName: bankDraftFormControls.accountName.value,
            bankName: bankDraftFormControls.bankName.value,
            accountType: bankDraftFormControls.accountType.value,
            accountNumber: bankDraftFormControls.accountNumber.value,
            routingNumber: bankDraftFormControls.routingNumber.value,
        };
        this.subscriptions.push(
            this.memberService
                .updatePaymentMethod(this.data.memberId, this.data.mpGroup, this.reqBodyForBankDraftEdit, this.data.selectedIndex.id)
                .subscribe(
                    () => {
                        this.showSpinner = false;
                        this.closePopupEdit(this.reqBodyForBankDraftEdit, this.data.selectedIndex.id);
                    },
                    (err) => {
                        this.showSpinner = false;
                        this.apiErrorMessageDisplay(err);
                    },
                ),
        );
    }

    /**
     * This method is used to enable the Account Name, Bank Name, Routing Number when account number is changed.
     */
    onChangeOfAccountNumber(): void {
        this.isBankInfoReadOnly = false;
    }

    /**
     * The method is triggered on Delete of all payment Methods (Bank Draft, Credit Card and Debit Card) and makes a Delete API call
     */
    deletePaymentData(): void {
        this.showSpinner = true;
        if (this.data.mpGroup) {
            this.subscriptions.push(
                this.memberService.deletePaymentMethod(this.data.memberId, this.data.selectedIndex.id, this.data.mpGroup).subscribe(
                    () => {
                        this.closePopupDelete();
                        this.showSpinner = false;
                    },
                    (err) => {
                        this.showSpinner = false;
                        this.apiErrorMessageDisplay(err);
                    },
                ),
            );
        } else {
            this.closePopupDelete();
            this.showSpinner = false;
        }
    }

    /**
     * The method is used to trigger the close event of the popup after edit API success response
     * @param reqBody the request body of API being passed back on closing the popup window
     * @param id id of the selectedIndexOkay, got
     */
    closePopupEdit(reqBody: AddPayment, id: number): void {
        this.EnrollmentDialogRef.close({ action: CLOSE, closed: true, updatedData: reqBody, id: id });
    }

    /**
     * The method is used to trigger the close event of the popup after delete API success response
     */
    closePopupDelete(): void {
        this.EnrollmentDialogRef.close({ action: CLOSE, closed: true });
    }

    /**
     * The method is used to call paymetric service when config is enabled and selected payment method is credit_card or debit_card
     * @param vspObservables vsp observables (vsp GUID and vsp paymetric access token)
     * @param cardNumber credit or debit card number
     * @param lastFour last four digit of credit or debit card
     * @return void
     */
    callPaymetricService(vspObservables: [Observable<Configurations[]>, Observable<string>], cardNumber: string, lastFour: string): void {
        this.subscriptions.push(
            forkJoin(vspObservables)
                .pipe(
                    switchMap(([vspGUIDResponse, paymetricAccessTokenVspResponse]) => {
                        this.vspMerchantId = vspGUIDResponse?.length ? vspGUIDResponse[0].value : null;
                        this.vspToken = paymetricAccessTokenVspResponse;
                        return this.paymetricService.isValidCard(cardNumber, this.vspToken, this.vspMerchantId);
                    }),
                    filter((vspValidityResponse: PayMetricData) => vspValidityResponse.HasPassed),
                    switchMap(() => this.updatePayment(lastFour)),
                )
                .subscribe(
                    () => {
                        this.showSpinner = false;
                        this.closePopupEdit(this.reqBodyForCardEdit, this.data.selectedIndex.id);
                    },
                    (err) => {
                        this.showSpinner = false;
                        this.apiErrorMessageDisplay(err);
                    },
                ),
        );
    }

    /**
     * The method is used to save the edited Card data (Credit card and Debit card) and makes several API calls
     */
    saveEditedCardPaymentData(): void {
        if (!this.cardExists) {
            this.showSpinner = true;
            let cardNumber: string;
            if (this.data.selectedPaymentMethod === PaymentType.CREDITCARD) {
                cardNumber = this.creditCardForm.controls.cardNumber.value;
            } else if (this.data.selectedPaymentMethod === PaymentType.DEBITCARD) {
                cardNumber = this.debitCardForm.controls.cardNumber.value;
            }
            if (this.isValidCardNumber(cardNumber)) {
                const cardLength = cardNumber.toString().length;
                const lastFour = cardNumber.substr(cardLength - PaymentInfo.LAST_FOUR_DIGITS_LENGTH);
                const vspObservables: [Observable<Configurations[]>, Observable<string>] = [
                    this.staticService.getConfigurations(ConfigName.PAYMETRIC_MERCHANT_GUID_VSP, this.mpGroup),
                    this.applicationService.getPaymetricAccessToken(CarrierId.VSP_INDIVIDUAL_VISION),
                ];
                if (
                    this.tempusPaymentConfig &&
                    (this.data.selectedPaymentMethod === PaymentType.CREDITCARD ||
                        this.data.selectedPaymentMethod === PaymentType.DEBITCARD)
                ) {
                    this.callPaymetricService(vspObservables, cardNumber, lastFour);
                } else {
                    const vspAflacObservables: [
                        Observable<Configurations[]>,
                        Observable<string>,
                        Observable<Configurations[]>,
                        Observable<string>,
                    ] = [
                        ...vspObservables,
                        this.staticService.getConfigurations(ConfigName.PAYMETRIC_MERCHANT_GUID_AFLAC, this.mpGroup),
                        this.applicationService.getPaymetricAccessToken(CarrierId.AFLAC),
                    ];
                    this.subscriptions.push(
                        forkJoin(vspAflacObservables)
                            .pipe(
                                switchMap(
                                    ([
                                        vspGUIDResponse,
                                        paymetricAccessTokenVspResponse,
                                        aflacGUIDResponse,
                                        paymetricAccessTokenAflacResponse,
                                    ]) => {
                                        this.vspMerchantId = vspGUIDResponse?.length ? vspGUIDResponse[0].value : null;
                                        this.aflacMerchantId = aflacGUIDResponse?.length ? aflacGUIDResponse[0].value : null;
                                        this.vspToken = paymetricAccessTokenVspResponse;
                                        this.aflacToken = paymetricAccessTokenAflacResponse;
                                        this.paymetricObservables = [
                                            this.paymetricService.isValidCard(cardNumber, this.vspToken, this.vspMerchantId),
                                            this.paymetricService.isValidCard(cardNumber, this.aflacToken, this.aflacMerchantId),
                                        ];
                                        return combineLatest(this.paymetricObservables);
                                    },
                                ),
                                filter(
                                    ([vspValidityResponse, aflacValidityResponse]: PayMetricData[]) =>
                                        vspValidityResponse.HasPassed && aflacValidityResponse.HasPassed,
                                ),
                                switchMap(() => this.updatePayment(lastFour)),
                            )
                            .subscribe(
                                (response) => {
                                    this.showSpinner = false;
                                    this.closePopupEdit(this.reqBodyForCardEdit, this.data.selectedIndex.id);
                                },
                                (err) => {
                                    this.showSpinner = false;
                                    this.apiErrorMessageDisplay(err);
                                },
                            ),
                    );
                }
            } else {
                this.showSpinner = false;
                if (this.data.selectedPaymentMethod === PaymentType.CREDITCARD) {
                    this.creditCardForm.controls.cardNumber.setErrors({ invalid: true });
                } else if (this.data.selectedPaymentMethod === PaymentType.DEBITCARD) {
                    this.debitCardForm.controls.cardNumber.setErrors({ invalid: true });
                }
            }
        }
    }

    /**
     * This method is used to update the edited payment
     * @param lastFour last four digits of card
     * @returns observable of HTTP Response
     */
    updatePayment(lastFour: string): Observable<HttpResponse<void>> {
        const cardPayload = this.commonPaymentPayload();
        const EXPIRATION_DATE_CONTROL = "expirationDate";
        let expirationMonth: number;
        let expirationYear: number;
        if (this.data.selectedPaymentMethod === PaymentType.CREDITCARD) {
            // eslint-disable-next-line no-underscore-dangle
            expirationMonth = this.creditCardExpiration.value.getMonth() + MONTH;
            // eslint-disable-next-line no-underscore-dangle
            expirationYear = this.creditCardForm.value[EXPIRATION_DATE_CONTROL].getFullYear();
        } else if (this.data.selectedPaymentMethod === PaymentType.DEBITCARD) {
            // eslint-disable-next-line no-underscore-dangle
            expirationMonth = this.debitCardExpiration.value.getMonth() + MONTH;
            // eslint-disable-next-line no-underscore-dangle
            expirationYear = this.debitCardForm.value[EXPIRATION_DATE_CONTROL].getFullYear();
        }
        const tokens: Token[] = [
            {
                carrierId: CarrierId.VSP_INDIVIDUAL_VISION,
                token: this.vspToken,
            },
        ];
        if (!this.tempusPaymentConfig) {
            tokens.push({
                carrierId: CarrierId.AFLAC,
                token: this.aflacToken,
            });
        }
        this.reqBodyForCardEdit = {
            ...cardPayload,
            paymentType: this.data.selectedIndex.paymentType,
            type: this.cardType,
            tokens,
            lastFour: lastFour,
            expirationMonth,
            expirationYear,
        };
        return this.memberService.updatePaymentMethod(
            this.data.memberId,
            this.data.mpGroup,
            this.reqBodyForCardEdit,
            this.data.selectedIndex.id,
        );
    }

    /**
     * Checks whether expiration date is changed or not
     * @param cardNumber card number [E.g - credit card]
     * @param type mode of payment
     * @returns false if expiration date is changed.
     */
    isExpirationDateChanged(cardNumber: number, type: PaymentType): boolean {
        const lastFour = cardNumber.toString().substr(cardNumber.toString().length - PaymentInfo.LAST_FOUR_DIGITS_LENGTH);
        let isUpdated = true;
        const accounts = type === PaymentType.CREDITCARD ? this.creditCardAccounts : this.debitCardAccounts;
        const cardDetails = accounts.find((card) => card.lastFour === lastFour);
        const editFormValue = type === PaymentType.CREDITCARD ? this.creditCardForm.value : this.debitCardForm.value;
        const expirationMonth = editFormValue.expirationDate.getMonth();
        const expirationYear = editFormValue.expirationDate.getFullYear();
        if (cardDetails) {
            isUpdated = expirationMonth + 1 === cardDetails.expirationMonth && expirationYear === cardDetails.expirationYear;
        } else {
            isUpdated = false;
        }
        return isUpdated;
    }

    /**
     * This method is used to identify if a duplicate card exists based on the index
     * @param cardNumber is the cardNumber
     * @param type is the type of card (Credit card/Debit card)
     * @return index of the card to identify if the card already exists
     */
    getCardIndex(cardNumber: number, type: PaymentType): number {
        const lastFour = cardNumber.toString().substr(cardNumber.toString().length - PaymentInfo.LAST_FOUR_DIGITS_LENGTH);
        let index = -1;
        if (type === PaymentType.CREDITCARD) {
            index = this.creditCardAccounts.findIndex((card) => card.lastFour === lastFour);
        } else {
            index = this.debitCardAccounts.findIndex((card) => card.lastFour === lastFour);
        }
        return index;
    }

    /**
     * This function is used to map the payment methods into their respective accounts (bankAccounts,creditCardAccount and debitCardAccount)
     */
    mapPayments(): void {
        this.paymentMethods.forEach((method) => {
            if (method.paymentType === PaymentType.BANKDRAFT) {
                this.bankAccounts.push(method);
            } else if (method.paymentType === PaymentType.CREDITCARD) {
                this.creditCardAccounts.push(method);
            } else if (method.paymentType === PaymentType.DEBITCARD) {
                this.debitCardAccounts.push(method);
            }
        });
    }

    /**
     * Common method to save card[debit and credit] details
     * @param cardForm - card form ref
     * @param type - type of payment [DEBIT_CARD or CREDIT_CARD]
     * @returns void
     */
    onSaveOfCardDetails(cardForm: FormGroup, type: PaymentType): void {
        const cardError = cardForm.controls.cardNumber.errors;
        const errorSet = cardError ? Object.keys(cardError) : [];
        if (cardForm.valid || (errorSet.length === ALLOWED_ERROR_NO && errorSet[0] === ALREADY_EXIST)) {
            this.cardExists = false;
            this.mapPayments();
            const cardNumber = cardForm.controls.cardNumber.value;
            const index = this.getCardIndex(cardNumber, type);
            const isExpirationDateChanged = this.isExpirationDateChanged(cardNumber, type);
            if (index > -1 && isExpirationDateChanged) {
                this.closePopupDelete();
            } else {
                this.saveEditedCardPaymentData();
            }
        } else {
            Object.keys(cardForm.controls).forEach((field) => {
                const control = cardForm.get(field);
                control.markAsTouched({ onlySelf: true });
            });
        }
    }

    /**
     * The method consists of common Payload for all the payment formats (Bank Draft, Credit card and Debit card)
     */
    commonPaymentPayload(): AddPayment {
        const billingName = this.data.selectedIndex.billingName;
        const billingAddress = this.data.selectedIndex.billingAddress;
        return {
            billingName: {
                firstName: billingName.firstName,
                middleName: billingName.middleName ? billingName.middleName : null,
                lastName: billingName.lastName,
                suffix: billingName.suffix ? billingName.suffix : null,
                maidenName: billingName.maidenName ? billingName.maidenName : null,
                nickname: billingName.nickname ? billingName.nickname : null,
            },

            billingAddress: {
                address1: billingAddress.address1,
                address2: billingAddress.address2 ? billingAddress.address2 : null,
                city: billingAddress.city,
                state: billingAddress.state,
                zip: billingAddress.zip,
                countyId: billingAddress.countyId ? billingAddress.countyId : null,
                country: billingAddress.country ? billingAddress.country : null,
            },
            sameAddressAsHome: this.data.selectedIndex.sameAddressAsHome ? this.data.selectedIndex.sameAddressAsHome : null,
        };
    }
    /**
     * The method is used to validate the entered date based on what the user enters on keypress
     * @param event takes in the keyboard input event
     * @returns Null or allows certain charcodes based on the input event
     */
    validateDateFormat(event: KeyboardEvent): boolean {
        return event.charCode === KEY_BACKSPACE || event.charCode === KEY_HELP || event.charCode === KEY_NULL
            ? null
            : event.charCode >= KEY_ZERO && event.charCode <= KEY_NINE;
    }
    /**
     * The method is used to update the entered date on blur
     * @param type is the payment type (Bank Draft,Credit Card or Debit Card)
     */
    updateDate(type: PaymentType): void {
        if (type === PaymentType.CREDITCARD) {
            const creditExpiration = this.dateService.toDate(this.creditCardForm.value.expirationDate);
            if (creditExpiration && creditExpiration.getMonth() && creditExpiration.getFullYear()) {
                this.creditCardExpiration.setValue(creditExpiration);
            }
        } else if (type === PaymentType.DEBITCARD) {
            const debitExpiration = this.dateService.toDate(this.debitCardForm.value.expirationDate);
            if (
                debitExpiration &&
                debitExpiration.getMonth() &&
                debitExpiration.getFullYear() &&
                debitExpiration.getMonth() === this.currentDate.getMonth() &&
                debitExpiration.getFullYear() === this.currentDate.getFullYear()
            ) {
                debitExpiration.setDate(this.currentDate.getDate());
                this.debitCardExpiration.setValue(debitExpiration);
            }
        }
    }
    /**
     * The method is used to update the value to the datepicker
     *  @param type Payment type
     */
    isEmptyField(type: PaymentType): void {
        if (type === PaymentType.CREDITCARD) {
            const creditExpiration = this.creditCardForm.value.expirationDate;
            if (creditExpiration) {
                this.creditCardExpiration.setValue(creditExpiration);
            }
        } else if (type === PaymentType.DEBITCARD) {
            const debitExpiration = this.dateService.toDate(this.debitCardForm.value.expirationDate);
            if (!debitExpiration) {
                this.debitCardExpiration.setValue(new Date());
            } else {
                debitExpiration.setDate(this.currentDate.getDate());
                this.debitCardExpiration.setValue(debitExpiration);
            }
        }
    }
    /**
     * The method is used to update the year to the datepicker
     * @param normalizedYear Selected year
     * @param type Payment type
     */
    chosenYearHandler(normalizedYear: Date, type: PaymentType): void {
        if (type === PaymentType.CREDITCARD) {
            const creditExpiration = this.dateService.toDate(this.creditCardForm.value.expirationDate);
            creditExpiration.setFullYear(normalizedYear.getFullYear());
            this.creditCardExpiration.setValue(creditExpiration);
        } else if (type === PaymentType.DEBITCARD) {
            const debitExpiration = this.dateService.toDate(this.debitCardForm.value.expirationDate);
            debitExpiration.setFullYear(normalizedYear.getFullYear());
            this.debitCardExpiration.setValue(debitExpiration);
        }
    }
    /**
     * The method is used to update the month to the datepicker
     * @param normalizedMonth Selected month
     * @param datepicker Reference for date picker
     * @param type Payment type
     */
    chosenMonthHandler(normalizedMonth: Date, datepicker: MatDatepicker<Date>, type: PaymentType): void {
        if (type === PaymentType.CREDITCARD) {
            const creditExpiration = this.dateService.toDate(this.creditCardForm.value.expirationDate);
            creditExpiration.setMonth(normalizedMonth.getMonth());
            this.creditCardExpiration.setValue(creditExpiration);
            datepicker.close();
        } else if (type === PaymentType.DEBITCARD) {
            const creditExpiration = this.dateService.toDate(this.debitCardForm.value.expirationDate);
            creditExpiration.setMonth(normalizedMonth.getMonth());
            this.debitCardExpiration.setValue(creditExpiration);
            datepicker.close();
        }
    }
    /**
     * The method is used to assign Regular Expressions to the cards (VISA,MASTER or AMEX)
     */
    assignRegex(): void {
        this.visaRegex = new RegExp(this.validationRegex.VISA_CARD_REGEX);
        this.masterCardRegex = new RegExp(this.validationRegex.MASTER_CARD_REGEX);
        this.amexRegex = new RegExp(this.validationRegex.AMEX_CARD_REGEX);
    }
    /**
     * The method is used to check if the entered card number is valid card (VISA,MASTER or AMEX)
     * @param cardNumber Card number entered by the user
     * @returns a flag isValid as true or false
     */
    isValidCardNumber(cardNumber: string): boolean {
        let isValid = false;
        // if the card number is not changed and only expiration date is changed while editing
        // credit card or debit card details then return true
        if (
            cardNumber.includes(STAR) &&
            !(this.creditCardForm?.controls?.cardNumber?.touched || this.debitCardForm?.controls?.cardNumber?.touched)
        ) {
            const cardLength = cardNumber.toString().length;
            const lastFour = cardNumber.substr(cardLength - PaymentInfo.LAST_FOUR_DIGITS_LENGTH);
            this.cardType =
                this.data.selectedPaymentMethod === PaymentType.CREDITCARD
                    ? (this.creditCardAccounts.find((creditCardAccount) => creditCardAccount.lastFour === lastFour)
                        ?.type as CreditCardNetwork)
                    : (this.debitCardAccounts.find((debitCardAccount) => debitCardAccount.lastFour === lastFour)
                        ?.type as CreditCardNetwork);
            isValid = true;
        }
        if (this.visaRegex.test(cardNumber)) {
            isValid = true;
            this.cardType = CreditCardNetwork.VISA;
        } else if (this.masterCardRegex.test(cardNumber)) {
            isValid = true;
            this.cardType = CreditCardNetwork.MASTER_CARD;
        } else if (this.amexRegex.test(cardNumber)) {
            isValid = true;
            this.cardType = CreditCardNetwork.AMERICAN_EXPRESS;
        }
        return isValid;
    }
    /**
     * The method contains the display message for API Error
     * @param err The argument passed inside the error block of API subscription
     */
    apiErrorMessageDisplay(err: Error): void {
        const error = err["error"];
        this.apiError = true;
        if (error.status === AppSettings.API_RESP_409) {
            this.apiErrorMessage = this.language.fetchSecondaryLanguageValue("secondary.api.accountAlreadyExists");
        } else {
            this.apiErrorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error["status"]}.${error["code"]}`);
        }
    }
    /**
     * The ngOnDestroy Life cycle hook is used to destroy the subscriptions.
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subs) => subs.unsubscribe());
    }
}
