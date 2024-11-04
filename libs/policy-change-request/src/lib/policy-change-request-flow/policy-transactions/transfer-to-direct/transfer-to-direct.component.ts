import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from "@angular/forms";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";

import { combineLatest, Observable, of, Subject, Subscription } from "rxjs";
import { Select, Store } from "@ngxs/store";
import { SideNavService } from "./../../side-nav/services/side-nav.service";
import {
    StaticService,
    PolicyTransactionForms,
    FindPolicyholderModel,
    AffectedPolicies,
    PaymentService,
    MemberService,
} from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { PolicyChangeRequestState, SetTransferToDirectRequest, SharedState, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { DatePipe } from "@angular/common";
import { HttpEvent } from "@angular/common/http";
import { NgxMaskPipe } from "ngx-mask";
import { PolicyChangeRequestComponent } from "../../../policy-change-request.component";
import {
    DateFormats,
    PaymentInfo,
    AccountType,
    BillingMode,
    BillingType,
    CardType,
    PolicyChangeRequestList,
    AppSettings,
    CountryState,
    TempusPaymentConfig,
    PaymentPromptDataModel,
    ConfigName,
    ClientErrorResponseType,
    ClientErrorResponseCode,
    PaymentType,
    BillingAddress,
    AddPaymentErrorCodes,
    AddPayment,
} from "@empowered/constants";
import { EditDeletePaymentComponent } from "@empowered/ui";
import {
    EmpoweredAttentionModalComponent,
    PolicyChangeRequestCancelPopupComponent,
    PaymentDetailsPromptComponent,
    PolicyChangeRequestConfirmationPopupComponent,
} from "@empowered/ui";
import { DateService } from "@empowered/date";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { filter, switchMap, distinctUntilChanged, tap, takeUntil } from "rxjs/operators";
import { MatSelectChange } from "@angular/material/select";
import { EmpoweredModalService } from "@empowered/common-services";
import { Router } from "@angular/router";
import { ADMIN, DIRECT, MEMBER, PAYROLL } from "./transfer-to-direct.constants";

const CURRENT_ACCOUNT_NAME = "currentAccountName";
const CARD_HOLDER_SIGN = "cardHoldersSignature";
const ACCOUNT_SIGN = "accountSignature";
const AMEX = "AMERICANEXPRESS";
const TRUE_VALUE = "TRUE";
const LAST_FOUR_CHARACTER = -4;
const ROUTING_NUMBER_STARTING_INDEX = 5;
const ROUTING_NUMBER_ENDING_INDEX = 9;
const DISPLAY_ACCOUNT_NUMBER_MAX_LENGTH = 11;

interface CardData {
    accountName: string;
    type: CardType;
    expirationMonth: number;
    expirationYear: number;
    lastFour: string;
    repToken?: string;
    tempusTokenIdentityGuid: string;
    tempusPostalCode?: string;
    id?: number;
    billingAddress?: BillingAddress;
}
interface AccountData {
    accountName: string;
    accountType: string;
    accountNumberLastFour: string;
    routingNumber: string;
    bankName: string;
    repToken?: string;
    tempusTokenIdentityGuid: string;
    billingAddress?: BillingAddress;
    id?: number;
}

enum PaymentMethods {
    BANK_ACCOUNT = "Bank draft",
    CREDIT_CARD = "Credit/Debit card",
    MAIL_PAPER_BILL = "Mail (paper bill)",
}

@Component({
    selector: "empowered-transfer-to-direct",
    templateUrl: "./transfer-to-direct.component.html",
    styleUrls: ["./transfer-to-direct.component.scss"],
    providers: [DatePipe],
})
export class TransferToDirectComponent implements OnInit, OnDestroy {
    transferToDirectForm: FormGroup;
    submitted: boolean;
    termAndCondition: string;
    states$: Observable<CountryState[]>;
    private readonly unsubscribe$ = new Subject<void>();
    affectedPolicyList = [];
    accountTypeList = [];
    billingTypeList: any;
    billingModeList: any;
    cardTypeList: any;
    deductionDateList: any = AppSettings.DEDUCTION_DATE_PER_PERIOD;
    policyList = [];
    isAllPolicySelected: boolean;
    counter = 0;
    mpGroup: any;
    memberId: any;
    minDate = new Date();
    isSubmitted: boolean;
    showSpinner: boolean;
    validationRegex: any;
    transferToDirectRequestInitialData: any;
    uploadApi: Observable<HttpEvent<any>>;
    selectedPolicyIds = [];
    storePolicy: any;
    formArray: any;
    MASK_FIRST_EIGHT = "********";
    isIndeterminate: boolean;
    repToken: string;
    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.policyChangeRequest.transactions.transferToDirect.header",
        "primary.portal.policyChangeRequest.transactions.continue",
        "primary.portal.policyChangeRequest.transactions.cancel",
        "primary.portal.dashboard.policyChangeRequestFlow.pcrFlow",
        "primary.portal.common.cancel",
        "primary.portal.common.back",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessage",
        "primary.portal.dashboard.policyChangeRequestFlow.cancelMessageNotSaved",
        "primary.portal.policyChangeRequest.transactions.back",
        "primary.portal.applicationFlow.payments.addNewCard",
        "primary.portal.common.ok",
        "primary.portal.applicationFlowSteps.maxAttemptsReached.title",
        "primary.portal.applicationFlowSteps.maxAttemptsReached.message",
        "primary.portal.applicationFlowSteps.duplicateCard.title",
        "primary.portal.applicationFlowSteps.duplicateCard.message",
        "primary.portal.billingAflac.consent.content",
        "primary.portal.pcr.consent.content",
        "primary.portal.applicationFlowSteps.cardValidationFailed.title",
        "primary.portal.applicationFlow.payments.bankDraft.accountLabeling",
        "primary.portal.applicationFlow.payments.addNewAccount",
        "primary.portal.applicationFlowSteps.duplicateAccount.title",
        "primary.portal.applicationFlowSteps.accountValidationFailed.title",
        "primary.portal.applicationFlow.payments.paymentMethod.achEditRetireWarning",
    ]);
    nameWithHypenApostrophesValidation: any;
    documentIdArray = [];
    cifNumber: any;
    displayDate: Date;
    unMaskedCardNumber: any;
    unMaskedAccountNumber: any;
    cardNumberMaxlength = AppSettings.MAX_LENGTH_16;
    accountNumberNumberMaxlength = AppSettings.MAX_LENGTH_24;
    transitNumberMaxLength = AppSettings.MAX_LENGTH_9;
    memberInfo: FindPolicyholderModel;
    selectedAccountNumber: string;
    isMultipleAccounts: boolean;
    currentAccountName: string;
    amexMaxLength = PaymentInfo.AMEX_CARD_NUMBER_MAX_LENGTH;
    isAmexSelected = false;
    tempusConfig: boolean;
    tempusZip: string;
    enableTempusCardBilling = false;
    iframeURL: string;
    addedCards: CardData[] = [];
    selectedIndex: number;
    cardConstant = "Card ending in";
    paymentMethodTypes = PaymentMethods;
    paymentMethods = [];
    isCardNotExpired = true;
    showSignerAgreement: boolean;
    consentContent: SafeHtml;
    showNoCardError = false;
    selectedBillingType = "";
    selectedBillingTypeIndex = 0;
    savedBillingAddress: BillingAddress;
    selectedAccount: string;
    addNewCard: string;
    bankDraftTempusConfig: boolean;
    addedBankAccounts: AccountData[] = [];
    enableBankDraftTempusBilling = false;
    selectedBankAccount: string;
    selectedBankAccountIndex: number;
    MASK_FIRST_SEVEN = "*******";
    MASK_FIRST_FIVE = "*****";
    routingNumberLastFourDigits: string;
    showNoAccountError = false;
    isAchEditTempusPaymentService: boolean;
    @Select(SharedState.regex) regex$: Observable<any>;
    @Select(PolicyChangeRequestState.GetmemberInfo) memberInfo$: Observable<FindPolicyholderModel>;
    @Select(PolicyChangeRequestState.GetTransferToDirectRequest) transferToDirectRequest$: Observable<any>;
    paymentType = BillingType;
    showMaskedAccountNumber: string;
    savedAccountSignature: string;
    savedCardHoldersSignature: string;
    isMember: boolean;
    isDirect: boolean;
    isAdmin: boolean;
    isPayroll: boolean;
    disableAddCard = false;
    disableAddAccount = false;

    constructor(
        private readonly fb: FormBuilder,
        private readonly dialog: MatDialog,
        private readonly sideNavService: SideNavService,
        private readonly staticService: StaticService,
        private readonly languageService: LanguageService,
        private readonly store: Store,
        private readonly datePipe: DatePipe,
        private readonly maskPipe: NgxMaskPipe,
        private cancelDialogRef: MatDialogRef<PolicyChangeRequestCancelPopupComponent>,
        private readonly PCRDialogRef: MatDialogRef<PolicyChangeRequestComponent>,
        private readonly staticUtil: StaticUtilService,
        private readonly paymentService: PaymentService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly memberService: MemberService,
        private readonly dateService: DateService,
        private readonly domSanitizer: DomSanitizer,
        private readonly utilService: UtilService,
        private readonly router: Router,
    ) {
        this.setInitialValues();
    }

    setInitialValues() {
        this.isMember = this.router.url.split("/").some((str) => str === MEMBER);
        this.isDirect = this.router.url.split("/").some((str) => str === DIRECT);
        this.isAdmin = this.router.url.split("/").some((str) => str === ADMIN);
        this.isPayroll = this.router.url.split("/").some((str) => str === PAYROLL);

        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                // Assign the data object to the local object(i.e validationRegex)
                this.validationRegex = data;
            }
        });
        this.memberInfo$.pipe(takeUntil(this.unsubscribe$)).subscribe((memberInfo) => {
            if (memberInfo) {
                this.memberInfo = memberInfo;
                if (this.isMember || this.isPayroll || this.isAdmin || this.isDirect) {
                    this.mpGroup = memberInfo["groupId"];
                    this.memberId = memberInfo["memberId"];
                }
                this.cifNumber = memberInfo["cifNumber"];
                if (memberInfo.policies.length > 1) {
                    const accNumber = memberInfo.policies[0].accountNumber;
                    this.isMultipleAccounts = !memberInfo.policies.every((policy) => policy.accountNumber === accNumber);
                }
            }
        });
    }

    /**
     * Angular life-cycle hook ngOnInit
     * Get required details to set and pre-populate the Transfer to Direct form
     */
    ngOnInit(): void {
        this.getBankDraftConfigValues();
        this.addNewCard = this.languageStrings["primary.portal.applicationFlow.payments.addNewCard"];
        this.consentContent = this.domSanitizer.bypassSecurityTrustHtml(this.languageStrings["primary.portal.pcr.consent.content"]);
        this.states$ = this.staticService.getStates();
        this.nameWithHypenApostrophesValidation = new RegExp(this.validationRegex.NAME_WITH_HYPENS_APOSTROPHES);
        this.billingTypeList = this.convertEnumToKeyValuePair(BillingType);
        this.paymentMethods = this.convertEnumToKeyValuePair(PaymentMethods);
        this.billingModeList = this.convertEnumToKeyValuePair(BillingMode);
        this.cardTypeList = this.convertEnumToKeyValuePair(CardType);
        this.accountTypeList = this.convertEnumToKeyValuePair(AccountType);
        this.convertDeductionDatePerPeriod();
        this.transferToDirectForm = this.fb.group(
            {
                policyNumbers: this.fb.array([]),
                currentAccountName: ["", Validators.required],
                billingType: ["", Validators.required],
                billingMode: ["", Validators.required],
                deductionDatePerPeriod: [null, Validators.required],
                documentIds: [[]],
                effectiveDate: [this.datePipe.transform(new Date(), AppSettings.DATE_FORMAT), Validators.required],
                policyHolderSignature: ["", Validators.required],
                type: [Object.keys(PolicyTransactionForms)[3]],
            },
            { updateOn: "blur" },
        );
        this.getConfigValues();
        if (!this.isMultipleAccounts) {
            this.setAccountDetails(this.memberInfo.policies[0]);
        }
        this.transferToDirectRequestInitialData = this.transferToDirectForm.value;
        if (this.store.selectSnapshot(PolicyChangeRequestState.GetmemberInfo)) {
            this.policyList = this.store.selectSnapshot(PolicyChangeRequestState.GetmemberInfo).policies;
        }
        this.transferToDirectRequest$.pipe(takeUntil(this.unsubscribe$)).subscribe((transferToDirectRequest) => {
            if (transferToDirectRequest) {
                this.isAmexSelected = transferToDirectRequest["creditCardType"] === AMEX;
                this.getDataFromStore(transferToDirectRequest);
                this.selectedBillingTypeIndex = this.paymentMethods.findIndex(
                    (paymentMethod) => paymentMethod.id === transferToDirectRequest.billingType,
                );
                this.savedBillingAddress = {
                    address1: transferToDirectRequest.address1,
                    city: transferToDirectRequest.city,
                    address2: transferToDirectRequest.address2,
                    state: transferToDirectRequest.state,
                    zip: transferToDirectRequest.zip,
                } as BillingAddress;
                this.selectedBillingType = transferToDirectRequest.billingType;

                // to load  cards from store when user navigates back to billing details page
                // but only if it's PNC flow and addedCards is empty to avoid duplicate entries
                if (
                    this.selectedBillingType === PaymentType.CREDITCARD &&
                    transferToDirectRequest.tempusTokenIdentityGuid &&
                    !this.addedCards.length
                ) {
                    this.addedCards.push({
                        accountName:
                            transferToDirectRequest?.cardHoldersName.firstName + " " + transferToDirectRequest?.cardHoldersName.lastName,
                        type: transferToDirectRequest?.creditCardType,
                        lastFour: transferToDirectRequest?.lastFour,
                        expirationMonth: transferToDirectRequest?.creditCardExpirationMonth,
                        expirationYear: transferToDirectRequest?.creditCardExpirationYear,
                        tempusTokenIdentityGuid: transferToDirectRequest?.tempusTokenIdentityGuid,
                        tempusPostalCode: transferToDirectRequest?.tempusPostalCode,
                        repToken: transferToDirectRequest?.creditCardAccessToken,
                    });
                    this.savedCardHoldersSignature = transferToDirectRequest?.cardHoldersSignature;
                    this.selectedIndex = this.addedCards.length - 1;
                    this.selectedAccount = this.addedCards[this.selectedIndex].lastFour;
                    if (this.savedBillingAddress) {
                        this.addedCards[this.selectedIndex].billingAddress = this.savedBillingAddress;
                    }
                    this.initializeBillingForms();
                }
                if (
                    this.selectedBillingType === this.paymentMethods[0].id &&
                    transferToDirectRequest.tempusTokenIdentityGuid &&
                    !this.addedBankAccounts.length
                ) {
                    this.addedBankAccounts.push({
                        accountName:
                            transferToDirectRequest?.accountHoldersName.firstName +
                            " " +
                            transferToDirectRequest?.accountHoldersName.lastName,
                        accountNumberLastFour: transferToDirectRequest?.accountNumber,
                        routingNumber: transferToDirectRequest?.transitNumber,
                        accountType: transferToDirectRequest?.accountType,
                        repToken: transferToDirectRequest?.bankAccountAccessToken,
                        tempusTokenIdentityGuid: transferToDirectRequest?.tempusTokenIdentityGuid,
                        bankName: transferToDirectRequest?.bankName,
                    });
                    this.savedAccountSignature = transferToDirectRequest?.accountSignature;
                    this.selectedBankAccountIndex = this.addedBankAccounts.length - 1;
                    this.selectedBankAccount = this.addedBankAccounts[this.selectedBankAccountIndex].tempusTokenIdentityGuid;
                    if (this.savedBillingAddress) {
                        this.addedBankAccounts[this.selectedBankAccountIndex].billingAddress = this.savedBillingAddress;
                    }
                    this.initializeBillingForms();
                }
            } else {
                this.createPolicyFormControl(false);
            }
        });
    }

    /**
     * This method is used to call pcr bank draft tempus config
     * @return void
     */
    getBankDraftConfigValues(): void {
        const tempusBankDraftConfigApi = this.staticService.getConfigurations(
            TempusPaymentConfig.TEMPUS_PCR_ACH_IFRAME_ENABLE_CONFIG,
            this.mpGroup,
        );
        const tempusEditEnableConfigApi = this.staticService.getConfigurations(
            TempusPaymentConfig.TEMPUS_ACH_EDIT_ENABLE_CONFIG,
            this.mpGroup,
        );
        combineLatest([tempusBankDraftConfigApi, tempusEditEnableConfigApi])
            .pipe(
                switchMap(([tempusBankDraftConfig, tempusEditEnableConfig]) => {
                    this.bankDraftTempusConfig = tempusBankDraftConfig[0].value === TRUE_VALUE;
                    this.isAchEditTempusPaymentService = tempusEditEnableConfig[0].value === TRUE_VALUE;
                    if (!this.bankDraftTempusConfig) {
                        return of(null);
                    }
                    if (!(this.memberId || this.mpGroup)) {
                        this.initializeBillingForms();
                        return of(null);
                    }
                    return this.memberService.getPaymentMethods(this.memberId, this.mpGroup);
                }),
                filter((paymentMethods) => paymentMethods),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((paymentMethods) => {
                let selectedAccount: AccountData;
                if (this.addedBankAccounts?.length) {
                    selectedAccount = this.addedBankAccounts[0];
                }
                this.addedBankAccounts = paymentMethods.filter(
                    (paymentMethod) => paymentMethod?.paymentType === PaymentType.BANKDRAFT && paymentMethod?.tempusTokenIdentityGuid,
                );
                if (this.addedBankAccounts?.length > 0 && selectedAccount) {
                    this.selectedBankAccountIndex = this.addedBankAccounts.findIndex(
                        (account) => account?.tempusTokenIdentityGuid === selectedAccount?.tempusTokenIdentityGuid,
                    );
                    this.addedBankAccounts[this.selectedBankAccountIndex].repToken = selectedAccount?.repToken;
                }
                if (!selectedAccount) {
                    this.selectedBankAccountIndex = this.addedBankAccounts.length - 1;
                }
                if (this.selectedBankAccountIndex > -1) {
                    this.selectedBankAccount = this.addedBankAccounts[this.selectedBankAccountIndex].tempusTokenIdentityGuid;
                }
                if (this.savedBillingAddress && this.selectedBillingType === this.paymentMethods[0].id) {
                    this.addedBankAccounts[this.selectedBankAccountIndex].billingAddress = this.savedBillingAddress;
                }
                this.initializeBillingForms();
                this.showMaskedAccountNumber = this.getMaskedAccountNumber(
                    this.addedBankAccounts[this.selectedBankAccountIndex].accountNumberLastFour,
                );
            });
    }
    /**
     * this method is used to check if selected date is in future
     * @param creditCard selected credit card
     * @returns return true is selected date is future date
     */
    checkFutureDate(creditCard: AddPayment): boolean {
        // selectedDate will be last day of expiration month
        const selectedDate = new Date(creditCard.expirationYear, creditCard.expirationMonth, 0);
        return this.dateService.getIsAfterOrIsEqual(selectedDate, new Date());
    }
    /**
     * This method will return the masked account number
     * @param accountNumber selected bank account number
     * @return string masked account number
     */
    getMaskedAccountNumber(accountNumber: string): string {
        return this.utilService.getMaskedString(accountNumber, DISPLAY_ACCOUNT_NUMBER_MAX_LENGTH - accountNumber?.length);
    }
    /**
     * Pre populate account
     * @param index index of selected card
     */
    prePopulateAccount(index: number): void {
        if (index > -1) {
            this.selectedIndex = index;
            this.selectedAccount = this.addedCards[this.selectedIndex].lastFour;
            this.isCardNotExpired = this.checkFutureDate(this.addedCards[index]);
            this.addAddressControls();
            const billingAddress = this.addedCards[this.selectedIndex]?.billingAddress;
            if (billingAddress) {
                this.setBillingTypeAddress(billingAddress);
            }
        }
    }

    /**
     * Gets config values
     */
    getConfigValues(): void {
        const tempusConfigApi = this.staticService.getConfigurations(TempusPaymentConfig.TEMPUS_PCR_IFRAME_ENABLE_CONFIG, this.mpGroup);
        const signerAgreementConfigAPI = this.mpGroup
            ? this.staticService.getConfigurations(ConfigName.AUTHORIZATION_AGREEMENT, this.mpGroup)
            : this.staticService.getConfigurations(ConfigName.AUTHORIZATION_AGREEMENT);
        combineLatest([tempusConfigApi, signerAgreementConfigAPI])
            .pipe(
                switchMap(([tempusConfigs, signerAgreementConfig]) => {
                    if (tempusConfigs[0].value !== TRUE_VALUE) {
                        return of(null);
                    }
                    this.showSignerAgreement = signerAgreementConfig[0].value === TRUE_VALUE;
                    this.tempusConfig = tempusConfigs[0].value === TRUE_VALUE;
                    if (!(this.memberId || this.mpGroup)) {
                        this.initializeBillingForms();
                        return of(null);
                    }
                    return this.memberService.getPaymentMethods(this.memberId, this.mpGroup);
                }),
                filter((paymentMethods) => paymentMethods),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((paymentMethods) => {
                let selectedCard: CardData;
                if (this.addedCards?.length > 0) {
                    selectedCard = this.addedCards[0];
                }
                this.addedCards = paymentMethods.filter(
                    (paymentMethod) => paymentMethod?.paymentType === PaymentType.CREDITCARD && paymentMethod?.tempusTokenIdentityGuid,
                );
                if (this.addedCards?.length > 0 && selectedCard) {
                    this.selectedIndex = this.addedCards.findIndex(
                        (card) => card?.tempusTokenIdentityGuid === selectedCard?.tempusTokenIdentityGuid,
                    );
                    this.addedCards[this.selectedIndex].repToken = selectedCard?.repToken;
                }
                if (!selectedCard) {
                    this.selectedIndex = this.addedCards.length - 1;
                }
                if (this.selectedIndex > -1) {
                    this.selectedAccount = this.addedCards[this.selectedIndex].lastFour;
                    this.isCardNotExpired = this.checkFutureDate(this.addedCards[this.selectedIndex]);
                }
                this.tempusZip = this.addedCards[this.selectedIndex]?.billingAddress?.zip;
                if (this.savedBillingAddress && this.selectedBillingType === PaymentType.CREDITCARD) {
                    this.addedCards[this.selectedIndex].billingAddress = this.savedBillingAddress;
                }
                this.initializeBillingForms();
            });
    }

    /**
     * Initializes billing forms
     */
    initializeBillingForms(): void {
        if (
            this.selectedBillingTypeIndex === 0 &&
            ((!this.bankDraftTempusConfig && !this.savedBillingAddress) || this.bankDraftTempusConfig)
        ) {
            this.removeBankDraftControls();
            this.onSelectionBankDraft();
        } else if (this.selectedBillingTypeIndex === 1) {
            this.removeCreditCardControls();
            this.onSelectionCreditCard();
        }
    }

    convertEnumToKeyValuePair(data: any): any {
        return Object.keys(data).map((key) => ({ id: key, name: data[key] }));
    }

    convertDeductionDatePerPeriod(): void {
        this.deductionDateList = Object.keys(this.deductionDateList).map((key) => ({
            id: Number(key) + 1,
            name: this.getNumberWithOrdinal(this.deductionDateList[key]),
        }));
    }

    getNumberWithOrdinal(n: number): string {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    /**
     * Get existing data for transfer to direct from store
     * @param transferToDirectRequest: transfer to direct form values
     */
    getDataFromStore(transferToDirectRequest: any): void {
        const requestData = { ...transferToDirectRequest };
        requestData["deductionDatePerPeriod"] = transferToDirectRequest.deductionDatePerPeriod.toString();
        if (requestData["creditCardExpirationMonth"]) {
            const expDate = new Date();
            expDate.setMonth(requestData["creditCardExpirationMonth"] - 1);
            expDate.setFullYear(requestData["creditCardExpirationYear"]);
            requestData["expDate"] = expDate;
            this.displayDate = this.dateService.toDate(expDate);
        }
        this.counter = transferToDirectRequest["policyNumbers"].length;
        this.storePolicy = [...transferToDirectRequest["policyNumbers"]];
        if (this.storePolicy.length) {
            this.policyList.forEach((policy) => {
                const matchedPolicy = this.storePolicy.find((policyNumber) => policyNumber === policy.policyNumber);
                if (matchedPolicy) {
                    this.storePolicy[this.storePolicy.indexOf(matchedPolicy)] = policy;
                }
            });
        }
        this.documentIdArray = transferToDirectRequest["documentIds"];
        this.transferToDirectForm.patchValue(requestData);
        this.checkForBillingType(requestData);
        this.transferToDirectRequestInitialData = {
            ...this.store.selectSnapshot(PolicyChangeRequestState.GetTransferToDirectInitialData),
        };
        this.maskAccountNumber();
        this.maskCardNumber();
        this.createPolicyFormControl(true);
        this.checkForIntermidiateValue();
    }

    checkForBillingType(transferToDirectRequest: any): void {
        if (transferToDirectRequest.billingType === AppSettings.BANK_DRAFT) {
            this.onSelectionBankDraft();
        } else if (transferToDirectRequest.billingType === AppSettings.CREDIT_CARD) {
            this.onSelectionCreditCard();
        }
        this.transferToDirectForm.patchValue(transferToDirectRequest);
    }

    cancel(): void {
        this.cancelDialogRef = this.dialog.open(PolicyChangeRequestCancelPopupComponent, {
            width: "667px",
            data: {
                cancelModalDisplayType: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.pcrFlow"],
                cancelButton: this.languageStrings["primary.portal.common.cancel"],
                backButton: this.languageStrings["primary.portal.common.back"],
                requestType: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.cancelMessage"],
                description: this.languageStrings["primary.portal.dashboard.policyChangeRequestFlow.cancelMessageNotSaved"],
            },
        });
        this.cancelDialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((result) => {
                if (result === AppSettings.CANCEL) {
                    this.sideNavService.removeTransactionScreenFromStore(true);
                    this.store.dispatch(new SetTransferToDirectRequest(null, null));
                    this.PCRDialogRef.close(PolicyChangeRequestList.cancel);
                }
            });
    }

    back(): void {
        this.sideNavService.onBackClick();
    }
    /**
     * Get form controls
     */
    get formControl(): any {
        return this.transferToDirectForm.controls;
    }

    /**
     * Submit transfer to direct request
     */
    transferToDirect(): void {
        if (this.isCardNotExpired) {
            if (!this.transferToDirectForm.dirty && !this.store.selectSnapshot(PolicyChangeRequestState.GetTransferToDirectRequest)) {
                this.openConfirmationPopup();
            } else {
                this.transferToDirectForm.value["documentIds"] = this.documentIdArray;
                this.isSubmitted = true;
                if (this.tempusConfig) {
                    if (!this.selectedBillingType) {
                        this.transferToDirectForm.patchValue({
                            billingType: this.paymentMethods[0].id,
                        });
                    }
                    if (this.selectedBillingType === BillingType.CREDIT_CARD && !this.addedCards.length) {
                        this.showNoCardError = true;
                        return;
                    }
                }
                if (
                    this.bankDraftTempusConfig &&
                    this.selectedBillingType === PaymentMethods.BANK_ACCOUNT &&
                    !this.addedBankAccounts.length
                ) {
                    // this is used to show please add payment information message if no account is added and
                    // user tries to click on next button
                    this.showNoAccountError = true;
                    return;
                }

                this.validateAllFormFields(this.transferToDirectForm);
                this.setAffectedPolicy();
                this.unmaskedCardNumbers();
                this.storeRequest();
            }
        }
    }

    unmaskedCardNumbers(): void {
        if (this.formControl["cardHoldersName"]) {
            this.transferToDirectForm.patchValue({
                creditCardAccessToken: this.unMaskedCardNumber,
            });
        } else if (this.formControl["accountNumber"]) {
            this.transferToDirectForm.patchValue({
                accountNumber: this.unMaskedAccountNumber,
            });
        }
    }

    setAffectedPolicy(): void {
        this.selectedPolicyIds = this.policyList.filter((x, i) => !!this.transferToDirectForm.value.policyNumbers[i]);
        this.selectedPolicyIds = this.selectedPolicyIds.map((policy) => policy.policyNumber);
    }

    /**
     * Function is to set credit card expiration month and year
     */
    setCreditCardExpirationDate(): void {
        if (this.transferToDirectForm.value["cardHoldersName"]) {
            this.transferToDirectForm.value["creditCardExpirationMonth"] = (
                this.dateService.toDate(this.transferToDirectForm.controls.expDate.value).getMonth() + 1
            ).toString();
            this.transferToDirectForm.value["creditCardExpirationYear"] = this.dateService
                .toDate(this.transferToDirectForm.controls.expDate.value)
                .getFullYear()
                .toString();
        }
        delete this.transferToDirectForm.value["expDate"];
    }

    /**
     * Set transfer to direct form values in store
     */
    storeRequest(): void {
        this.counter = this.selectedPolicyIds.length;
        if (this.transferToDirectForm.valid && this.counter) {
            this.setDateFormat();
            this.setCreditCardExpirationDate();
            this.transferToDirectForm.value["deductionDatePerPeriod"] = Number(this.transferToDirectForm.value["deductionDatePerPeriod"]);
            this.transferToDirectForm.value["policyNumbers"] = this.selectedPolicyIds;
            const sign = this.transferToDirectForm.get("policyHolderSignature").value;
            const cardSignFormControl = this.transferToDirectForm.get(CARD_HOLDER_SIGN);
            if (cardSignFormControl && !cardSignFormControl.value) {
                this.transferToDirectForm.value[CARD_HOLDER_SIGN] = sign;
            }
            const accSignFormControl = this.transferToDirectForm.get(ACCOUNT_SIGN);
            if (accSignFormControl && !accSignFormControl.value) {
                this.transferToDirectForm.value[ACCOUNT_SIGN] = sign;
            }
            const accName = this.transferToDirectForm.value[CURRENT_ACCOUNT_NAME];
            const finalData = {
                ...this.transferToDirectForm.value,
                currentAccountName: accName ? accName : this.currentAccountName,
            };
            // if tempus PNC config is on and card billing type is selected
            // then we need to include to few fields in store with repAddData recieved from iframe
            if (this.tempusConfig && this.enableTempusCardBilling) {
                const selectedCard: CardData = this.addedCards[this.selectedIndex];
                const [firstName, ...lastName] = selectedCard?.accountName.split(" ");
                finalData.cardHoldersName = { firstName, lastName: lastName.join(" ") };
                finalData.creditCardType = selectedCard?.type;
                finalData.creditCardExpirationMonth = selectedCard?.expirationMonth;
                finalData.creditCardExpirationYear = selectedCard?.expirationYear;
                finalData.creditCardAccessToken = selectedCard?.repToken ?? " ";
                finalData.tempusTokenIdentityGuid = selectedCard?.tempusTokenIdentityGuid;
                finalData.lastFour = selectedCard?.lastFour;
                finalData.tempusPostalCode = selectedCard?.tempusPostalCode;
            }
            if (!this.tempusConfig && finalData?.creditCardAccessToken) {
                finalData.lastFour = finalData.creditCardAccessToken.slice(LAST_FOUR_CHARACTER);
            }
            if (this.bankDraftTempusConfig && this.enableBankDraftTempusBilling) {
                const selectedCard: AccountData = this.addedBankAccounts[this.selectedBankAccountIndex];
                const [firstName, ...lastName] = selectedCard?.accountName.split(" ");
                finalData.accountHoldersName = { firstName, lastName: lastName.join(" ") };
                finalData.accountNumber = selectedCard?.accountNumberLastFour;
                finalData.transitNumber = selectedCard?.routingNumber;
                finalData.accountType = selectedCard?.accountType;
                finalData.bankAccountAccessToken = selectedCard?.repToken ?? " ";
                finalData.tempusTokenIdentityGuid = selectedCard?.tempusTokenIdentityGuid;
                finalData.bankName = selectedCard?.bankName;
            }
            this.store.dispatch(new SetTransferToDirectRequest(finalData, this.transferToDirectRequestInitialData));
            this.sideNavService.onNextClick(1);
        }
    }

    validateAllFormFields(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((field) => {
            const control = formGroup.get(field);
            if (control["controls"]) {
                for (const subField in control["controls"]) {
                    if (subField) {
                        control["controls"][subField].markAsTouched({ onlySelf: true });
                    }
                }
            } else {
                control.markAsTouched({ onlySelf: true });
            }
        });
    }

    /**
     * Decide to show bank draft or credit card based on billing type selection
     * @param billingType takes billing type as parameter
     */
    selectBillingType(billingType: string): void {
        if (billingType === AppSettings.BANK_DRAFT || billingType === PaymentMethods.BANK_ACCOUNT) {
            this.selectedBillingType = PaymentMethods.BANK_ACCOUNT;
            this.showNoCardError = false;
            this.onSelectionBankDraft();
        } else if (billingType === AppSettings.CREDIT_CARD) {
            this.selectedBillingType = BillingType.CREDIT_CARD;
            this.showNoAccountError = false;
            this.onSelectionCreditCard();
        } else {
            this.showNoCardError = false;
            this.showNoAccountError = false;
            this.selectedBillingType = BillingType.MAIL_PAPER_BILL;
            this.removeFormControl();
        }
        this.billingModeList =
            (BillingType[billingType] === BillingType.MAIL_PAPER_BILL || billingType === BillingType.MAIL_PAPER_BILL) &&
            this.billingModeList &&
            this.billingModeList.length
                ? this.billingModeList.filter((billingMode) => billingMode.name !== BillingMode.MONTHLY)
                : this.convertEnumToKeyValuePair(BillingMode);
    }

    removeFormControl(): void {
        this.removeBankDraftControls();
        this.removeCreditCardControls();
        this.removeAddressControls();
    }

    setDateFormat(): void {
        this.transferToDirectForm.value["effectiveDate"] = this.datePipe.transform(
            this.transferToDirectForm.value["effectiveDate"],
            AppSettings.DATE_FORMAT,
        );
    }

    /**
     * This method is used to set routing number last four digits which is being used to display
     * on transfer to direct billing page after adding account under bank draft
     * @return void
     */
    setRoutingNumber(): void {
        if (this.selectedBankAccountIndex > -1) {
            this.routingNumberLastFourDigits = this.addedBankAccounts[this.selectedBankAccountIndex].routingNumber
                .toString()
                .substring(ROUTING_NUMBER_STARTING_INDEX, ROUTING_NUMBER_ENDING_INDEX);
        }
    }

    /**
     * On selection of billing type bank draft add bank draft form group
     */
    onSelectionBankDraft(): void {
        if (this.tempusConfig) {
            // to clear add card button when bank draft payment method is selected
            this.enableTempusCardBilling = false;

            // if card holder signature control exists then remove that
            if (this.transferToDirectForm.controls[CARD_HOLDER_SIGN]) {
                this.transferToDirectForm.removeControl(CARD_HOLDER_SIGN);
                this.removeAddressControls();
            }
        }
        if (this.formControl["cardHoldersName"]) {
            this.removeCreditCardControls();
        }
        if (this.bankDraftTempusConfig) {
            this.enableBankDraftTempusBilling = true;
            // setting the billingType value here because default value is BANK_ACCOUNT on reaching to the transfer to direct billing page
            this.transferToDirectForm.patchValue({
                billingType: this.paymentMethods[0].id,
            });
            this.transferToDirectForm.controls.billingType.markAsDirty();
            this.selectedBillingType = PaymentMethods.BANK_ACCOUNT;
            this.transferToDirectForm.addControl(ACCOUNT_SIGN, this.fb.control(this.savedAccountSignature ?? ""));
            if (this.selectedBankAccountIndex > -1) {
                this.showMaskedAccountNumber = this.getMaskedAccountNumber(
                    this.addedBankAccounts[this.selectedBankAccountIndex].accountNumberLastFour,
                );
            }
            this.setRoutingNumber();
            const selectedCardBillingAddress = this.addedBankAccounts[this.selectedBankAccountIndex]?.billingAddress;
            if (this.addedBankAccounts.length) {
                this.addAddressControls();
                if (selectedCardBillingAddress) {
                    this.setBillingTypeAddress(selectedCardBillingAddress);
                }
            }
            // here setting the initial data for bank draft which is needed for mapping on
            // review and submit page when the bank draft tempus config is on.
            this.transferToDirectRequestInitialData = {
                ...this.transferToDirectRequestInitialData,
                address1: "",
                billingMode: "",
                billingType: "",
                city: "",
                state: "",
                transitNumber: "",
                zip: "",
                accountHoldersName: { firstName: "", lastName: "" },
                accountNumber: "",
                accountSignature: "",
                accountType: "",
            };
            return;
        }
        this.addAddressControls();
        const accountHoldersName = this.fb.group({
            firstName: [
                "",
                Validators.compose([
                    Validators.required,
                    Validators.maxLength(60),
                    Validators.pattern(new RegExp(this.validationRegex.NAME)),
                ]),
            ],
            lastName: [
                "",
                Validators.compose([
                    Validators.required,
                    Validators.maxLength(60),
                    Validators.pattern(new RegExp(this.validationRegex.NAME)),
                ]),
            ],
        });
        this.transferToDirectForm.addControl(ACCOUNT_SIGN, this.fb.control(""));
        this.transferToDirectForm.addControl("accountHoldersName", accountHoldersName);
        this.transferToDirectForm.addControl(
            "accountNumber",
            this.fb.control(
                "",
                Validators.compose([Validators.required, Validators.pattern(new RegExp(this.validationRegex.ACCOUNT_NUMBER))]),
            ),
        );
        this.transferToDirectForm.addControl("accountType", this.fb.control("", Validators.required));
        this.transferToDirectForm.addControl(
            "transitNumber",
            this.fb.control(
                "",
                Validators.compose([Validators.required, Validators.pattern(new RegExp(this.validationRegex.TRANSIT_OR_ABA_NUMBER))]),
            ),
        );
        this.transferToDirectRequestInitialData = { ...this.transferToDirectForm.value };
    }

    /**
     * This method is used to toggle showNoCardError and showNoAccountError when close icon is pressed on mon-alert
     * @returns void
     */
    closeNoPaymentInfoAlert(): void {
        if (this.selectedBillingType === BillingType.CREDIT_CARD) {
            this.showNoCardError = false;
        } else {
            this.showNoAccountError = false;
        }
    }

    /**
     * Remove bank draft form controls
     */
    removeBankDraftControls(): void {
        if (this.bankDraftTempusConfig) {
            this.enableBankDraftTempusBilling = false;
        }
        this.transferToDirectForm.removeControl("accountHoldersName");
        this.transferToDirectForm.removeControl("accountNumber");
        this.transferToDirectForm.removeControl("accountType");
        this.transferToDirectForm.removeControl("transitNumber");
        this.transferToDirectForm.removeControl(ACCOUNT_SIGN);
        this.removeAddressControls();
    }

    /**
     * Remove credit card form controls
     */
    removeCreditCardControls(): void {
        if (this.tempusConfig) {
            this.enableTempusCardBilling = false;
        }
        this.transferToDirectForm.removeControl("cardHoldersName");
        this.transferToDirectForm.removeControl("creditCardAccessToken");
        this.transferToDirectForm.removeControl("creditCardType");
        this.transferToDirectForm.removeControl("expDate");
        this.transferToDirectForm.removeControl(CARD_HOLDER_SIGN);
        this.removeAddressControls();
    }

    addAddressControls(): void {
        this.transferToDirectForm.addControl(
            "city",
            this.fb.control(
                "",
                Validators.compose([
                    Validators.required,
                    Validators.maxLength(100),
                    Validators.pattern(new RegExp(this.validationRegex.ADDRESS)),
                ]),
            ),
        );
        this.transferToDirectForm.addControl(
            "address1",
            this.fb.control(
                "",
                Validators.compose([
                    Validators.required,
                    Validators.maxLength(100),
                    Validators.pattern(new RegExp(this.validationRegex.ADDRESS)),
                ]),
            ),
        );
        this.transferToDirectForm.addControl("state", this.fb.control("", Validators.required));
        this.transferToDirectForm.addControl(
            "zip",
            this.fb.control(
                this.enableTempusCardBilling && this.tempusZip ? this.tempusZip : "",
                Validators.compose([Validators.required, Validators.pattern(this.validationRegex.ZIP_CODE)]),
            ),
        );
        this.validateZipIfStateChange();
    }

    /**
     * Pre populate bank account
     * @param index index of selected account
     * @returns void
     */
    prePopulateBankAccount(index: number): void {
        if (index > -1) {
            this.selectedBankAccountIndex = index;
            this.selectedBankAccount = this.addedBankAccounts[this.selectedBankAccountIndex].tempusTokenIdentityGuid;
            this.setRoutingNumber();
            this.addAddressControls();
            const billingAddress = this.addedBankAccounts[this.selectedBankAccountIndex]?.billingAddress;
            if (billingAddress) {
                this.setBillingTypeAddress(billingAddress);
            }
            this.showMaskedAccountNumber = this.getMaskedAccountNumber(
                this.addedBankAccounts[this.selectedBankAccountIndex].accountNumberLastFour,
            );
        }
    }
    /**
     * Opens bank draft prompt with tempus iframe to Enter bank account data
     * @return void
     */
    openBankDraftPrompt(editModal?: boolean): void {
        this.disableAddAccount = true;
        const promptData = {} as PaymentPromptDataModel;
        promptData.memberId = this.memberId;
        promptData.mpGroup = this.mpGroup;
        promptData.paymentMethod = PaymentType.BANKDRAFT;
        if (editModal) {
            promptData.editModal = editModal;
            promptData.bankDraftDetails = this.addedBankAccounts[this.selectedBankAccountIndex];
            this.empoweredModalService
                .openDialog(PaymentDetailsPromptComponent, { data: promptData })
                .afterClosed()
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((bankDraft) => {
                    this.disableAddAccount = false;
                    if (bankDraft) {
                        this.addedBankAccounts[this.selectedBankAccountIndex] = bankDraft;
                    }
                });
        } else {
            this.selectedBankAccount = this.languageStrings["primary.portal.applicationFlow.payments.addNewAccount"];
            combineLatest([
                this.staticService.getConfigurations(TempusPaymentConfig.TEMPUS_IFRAME_URL, this.mpGroup),
                this.paymentService.getSession(PaymentType.BANKDRAFT),
            ])
                .pipe(
                    takeUntil(this.unsubscribe$),
                    switchMap(([iframeURL, sessionData]) => {
                        promptData.tempusIframeURL = iframeURL[0].value;
                        promptData.tempusSessionObject = sessionData;
                        this.disableAddAccount = false;
                        return this.empoweredModalService.openDialog(PaymentDetailsPromptComponent, { data: promptData }).afterClosed();
                    }),
                    switchMap((repAddData) => {
                        if (!this.mpGroup && repAddData?.accountName) {
                            this.showNoAccountError = false;
                            this.addedBankAccounts.push({
                                accountName: repAddData.accountName,
                                accountType: repAddData.accountType,
                                accountNumberLastFour: repAddData.accountNumber,
                                routingNumber: repAddData.routingNumber,
                                bankName: repAddData.bankName,
                                repToken: repAddData.tokens[0].token,
                                tempusTokenIdentityGuid: repAddData.tempusTokenIdentityGuid,
                            });
                            this.selectedBankAccountIndex = this.addedBankAccounts.length - 1;
                            this.selectedBankAccount = this.addedBankAccounts[this.selectedBankAccountIndex].tempusTokenIdentityGuid;
                            this.setRoutingNumber();
                            this.showMaskedAccountNumber = this.getMaskedAccountNumber(
                                this.addedBankAccounts[this.selectedBankAccountIndex].accountNumberLastFour,
                            );
                        }
                        if (repAddData?.accountName) {
                            this.removeAddressControls();
                            this.addAddressControls();
                        }
                        let data = {};
                        if (
                            repAddData?.error?.status === ClientErrorResponseCode.RESP_409 &&
                            repAddData?.error?.code === ClientErrorResponseType.DUPLICATE
                        ) {
                            data = {
                                title: this.languageStrings["primary.portal.applicationFlowSteps.duplicateAccount.title"],
                                message: "primary.portal.applicationFlowSteps.duplicateAccount.message",
                                buttonText: this.languageStrings["primary.portal.common.ok"],
                            };
                        }
                        // If user hits maximum number of attempts for putting in valid CC details,
                        // close iFrame and popup a dialog to notify the user and don't save any data.
                        if (repAddData?.errorCode === AddPaymentErrorCodes.MAX_ATTEMPTS_REACHED) {
                            data = {
                                title: this.languageStrings["primary.portal.applicationFlowSteps.maxAttemptsReached.title"],
                                message: "primary.portal.applicationFlowSteps.maxAttemptsReached.bankDraftAccount.message",
                                buttonText: this.languageStrings["primary.portal.common.ok"],
                            };
                        }
                        if (repAddData?.errorCode === AddPaymentErrorCodes.ACCOUNT_VALIDATION_FAILED) {
                            data = {
                                title: this.languageStrings["primary.portal.applicationFlowSteps.accountValidationFailed.title"],
                                message: "primary.portal.applicationFlowSteps.accountValidationFailedBlocked.message",
                                buttonText: this.languageStrings["primary.portal.common.ok"],
                            };
                        }
                        // If user hits cancel button in the iFrame, do nothing.
                        if (repAddData?.errorCode === AddPaymentErrorCodes.CANCEL) {
                            return of("");
                        }
                        if (repAddData?.errorCode || repAddData?.error?.code === ClientErrorResponseType.DUPLICATE) {
                            return this.empoweredModalService
                                .openDialog(EmpoweredAttentionModalComponent, {
                                    data,
                                })
                                .afterClosed();
                        }
                        this.repToken = repAddData?.tokens[0]?.token;
                        return of(repAddData);
                    }),
                    filter((repAddData) => {
                        if (!repAddData && this.addedBankAccounts.length) {
                            this.selectedBankAccount = this.addedBankAccounts[this.selectedBankAccountIndex].tempusTokenIdentityGuid;
                        }
                        return repAddData;
                    }),
                    switchMap(() => {
                        if (this.mpGroup) {
                            return this.memberService.getPaymentMethods(this.memberId, this.mpGroup);
                        }
                        return of(null);
                    }),
                )
                .subscribe((paymentMethod) => {
                    if (this.mpGroup) {
                        this.showNoAccountError = false;
                        this.addedBankAccounts = paymentMethod.filter(
                            (paymentData) => paymentData.paymentType === PaymentType.BANKDRAFT && paymentData?.tempusTokenIdentityGuid,
                        );
                        // to get last added bank account on top
                        this.addedBankAccounts.sort((account1, account2) => account1.id - account2.id);
                        this.selectedBankAccountIndex = this.addedBankAccounts.length - 1;
                        this.selectedBankAccount = this.addedBankAccounts[this.selectedBankAccountIndex].tempusTokenIdentityGuid;
                        this.setRoutingNumber();
                        this.addedBankAccounts[this.selectedBankAccountIndex].repToken = this.repToken;
                        this.showMaskedAccountNumber = this.getMaskedAccountNumber(
                            this.addedBankAccounts[this.selectedBankAccountIndex].accountNumberLastFour,
                        );
                    }
                });
        }
    }
    /**
     * this method is used to validate state and zip when state is change and zip
     * code is already pre-populated
     * @return void
     */
    validateZipIfStateChange(): void {
        // for credit card type in tempus iframe we pre-populate zip
        // to validate entered state when zip is already pre-populated
        if (this.enableTempusCardBilling && this.tempusZip) {
            this.transferToDirectForm
                .get("state")
                .valueChanges.pipe(
                    distinctUntilChanged(),
                    switchMap(() =>
                        this.transferToDirectForm.get("state").value
                            ? this.staticService.validateStateZip(
                                  this.transferToDirectForm.get("state").value,
                                  this.transferToDirectForm.get("zip").value,
                              )
                            : of(null),
                    ),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe(
                    () => {
                        this.formControl["zip"].setErrors(null);
                        this.formControl["state"].setErrors(null);
                    },
                    () => {
                        this.formControl["zip"].setErrors({ zipValid: true });
                        this.formControl["state"].setErrors({
                            zipValid: true,
                        });
                    },
                );
        }
    }
    removeAddressControls(): void {
        this.transferToDirectForm.removeControl("city");
        this.transferToDirectForm.removeControl("address1");
        this.transferToDirectForm.removeControl("state");
        this.transferToDirectForm.removeControl("zip");
    }

    /**
     * Sets billingtype address
     * @param billingAddress
     */
    setBillingTypeAddress(billingAddress: BillingAddress): void {
        this.transferToDirectForm.controls["city"].setValue(billingAddress?.city);
        this.transferToDirectForm.controls["address1"].setValue(billingAddress?.address1);
        this.transferToDirectForm.controls["zip"].setValue(billingAddress?.zip);
        this.transferToDirectForm.controls["state"].setValue(billingAddress?.state);
        this.tempusZip = billingAddress?.zip;
    }
    /**
     * On selection of billing type credit card add credit card form group
     */
    onSelectionCreditCard(): void {
        if (this.formControl["accountHoldersName"]) {
            this.removeBankDraftControls();
        }
        if (this.bankDraftTempusConfig) {
            this.enableBankDraftTempusBilling = false;
            this.removeAddressControls();
            // if account holder signature control exists then remove that
            if (this.transferToDirectForm.controls[ACCOUNT_SIGN]) {
                this.transferToDirectForm.removeControl(ACCOUNT_SIGN);
            }
        }
        if (this.tempusConfig) {
            this.enableTempusCardBilling = true;
            this.transferToDirectForm.addControl(CARD_HOLDER_SIGN, this.fb.control(this.savedCardHoldersSignature ?? ""));
            const selectedCardBillingAddress = this.addedCards[this.selectedIndex]?.billingAddress;
            if (this.addedCards.length) {
                this.addAddressControls();
                if (selectedCardBillingAddress) {
                    this.setBillingTypeAddress(selectedCardBillingAddress);
                }
            }
            // here setting the initial data for credit card which is needed for mapping on
            // review and submit page when the tempus config is on.
            this.transferToDirectRequestInitialData = {
                ...this.transferToDirectRequestInitialData,
                cardHoldersName: { firstName: "", lastName: "" },
                creditCardType: "",
                state: "",
                city: "",
                zip: "",
                address1: "",
                billingType: "",
                billingMode: "",
                deductionDatePerPeriod: "",
                policyHolderSignature: "",
                cardHoldersSignature: "",
            };
            return;
        }
        this.addAddressControls();
        const cardHoldersName = this.fb.group({
            firstName: [
                "",
                Validators.compose([
                    Validators.required,
                    Validators.maxLength(60),
                    Validators.pattern(new RegExp(this.validationRegex.NAME)),
                ]),
            ],
            lastName: [
                "",
                Validators.compose([
                    Validators.required,
                    Validators.maxLength(60),
                    Validators.pattern(new RegExp(this.validationRegex.NAME)),
                ]),
            ],
        });
        this.transferToDirectForm.addControl(CARD_HOLDER_SIGN, this.fb.control(""));
        this.transferToDirectForm.addControl("cardHoldersName", cardHoldersName);
        this.transferToDirectForm.addControl(
            "creditCardAccessToken",
            this.fb.control(
                "",
                Validators.compose(
                    this.isAmexSelected
                        ? [
                              Validators.required,
                              Validators.pattern(new RegExp(this.validationRegex.POSITIVENUMBER_NONDECIMAL)),
                              Validators.minLength(this.amexMaxLength),
                              Validators.maxLength(this.amexMaxLength),
                          ]
                        : [Validators.required, Validators.pattern(new RegExp(this.validationRegex.CREDIT_CARD))],
                ),
            ),
        );
        this.transferToDirectForm.addControl("creditCardType", this.fb.control("", Validators.required));
        this.transferToDirectForm.addControl("expDate", this.fb.control(new Date(), Validators.required));
        this.transferToDirectRequestInitialData = { ...this.transferToDirectForm.value };
    }

    /**
     * Deletes bank account
     */
    deleteBankAccount(): void {
        if (!this.mpGroup) {
            const deletePaymentDialog = this.empoweredModalService.openDialog(EditDeletePaymentComponent, {
                data: {
                    selectedIndex: this.addedBankAccounts[this.selectedBankAccountIndex],
                    delete: true,
                    selectedPaymentMethod: PaymentType.BANKDRAFT,
                },
            });
            deletePaymentDialog
                .afterClosed()
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((res) => {
                    if (res) {
                        this.addedBankAccounts.splice(this.selectedBankAccountIndex, 1);
                        this.selectedBankAccountIndex = this.addedBankAccounts.length >= 1 ? this.addedBankAccounts.length - 1 : undefined;
                        if (this.selectedBankAccountIndex === undefined) {
                            this.removeAddressControls();
                        } else {
                            this.selectedBankAccount = this.addedBankAccounts[this.selectedBankAccountIndex]?.tempusTokenIdentityGuid;
                            this.showMaskedAccountNumber = this.getMaskedAccountNumber(
                                this.addedBankAccounts[this.selectedBankAccountIndex].accountNumberLastFour,
                            );
                            this.setRoutingNumber();
                        }
                    }
                });
        } else {
            const deletePaymentDialog = this.empoweredModalService.openDialog(EditDeletePaymentComponent, {
                data: {
                    selectedIndex: this.addedBankAccounts[this.selectedBankAccountIndex],
                    selectedPaymentMethod: PaymentType.BANKDRAFT,
                    delete: true,
                    mpGroup: this.mpGroup,
                    memberId: this.memberId,
                },
            });
            deletePaymentDialog
                .afterClosed()
                .pipe(
                    switchMap((res) => this.memberService.getPaymentMethods(this.memberId, this.mpGroup)),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe((paymentData) => {
                    this.addedBankAccounts = paymentData.filter(
                        (paymentInfo) => paymentInfo?.paymentType === PaymentType.BANKDRAFT && paymentInfo?.tempusTokenIdentityGuid,
                    );
                    this.selectedBankAccountIndex = this.addedBankAccounts.length >= 1 ? this.addedBankAccounts.length - 1 : undefined;
                    if (this.selectedBankAccountIndex === undefined) {
                        this.removeAddressControls();
                    } else {
                        this.selectedBankAccount = this.addedBankAccounts[this.selectedBankAccountIndex].tempusTokenIdentityGuid;
                        this.showMaskedAccountNumber = this.getMaskedAccountNumber(
                            this.addedBankAccounts[this.selectedBankAccountIndex].accountNumberLastFour,
                        );
                        this.setRoutingNumber();
                        this.setBillingTypeAddress(this.addedBankAccounts[this.selectedBankAccountIndex]?.billingAddress);
                    }
                });
        }
    }

    /**
     * deleting selected card details
     */
    deleteAccount(): void {
        if (!this.mpGroup) {
            const addressDialog = this.empoweredModalService.openDialog(EditDeletePaymentComponent, {
                data: {
                    selectedIndex: this.addedCards[this.selectedIndex],
                    delete: true,
                    selectedPaymentMethod: PaymentType.CREDITCARD,
                },
            });
            addressDialog
                .afterClosed()
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((res) => {
                    if (res) {
                        this.isCardNotExpired = true;
                        this.addedCards.splice(this.selectedIndex, 1);
                        this.selectedIndex = this.addedCards.length >= 1 ? this.addedCards.length - 1 : undefined;
                        if (this.selectedIndex === undefined) {
                            this.removeAddressControls();
                        }
                        this.selectedAccount = this.addedCards[this.selectedIndex].lastFour;
                    }
                });
        } else {
            const addressDialog = this.empoweredModalService.openDialog(EditDeletePaymentComponent, {
                data: {
                    selectedIndex: this.addedCards[this.selectedIndex],
                    selectedPaymentMethod: PaymentType.CREDITCARD,
                    delete: true,
                    mpGroup: this.mpGroup,
                    memberId: this.memberId,
                },
            });
            addressDialog
                .afterClosed()
                .pipe(
                    switchMap((res) => {
                        if (res) {
                            this.isCardNotExpired = true;
                        }
                        return this.memberService.getPaymentMethods(this.memberId, this.mpGroup);
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe((paymentData) => {
                    this.addedCards = paymentData.filter(
                        (paymentInfo) => paymentInfo?.paymentType === PaymentType.CREDITCARD && paymentInfo?.tempusTokenIdentityGuid,
                    );
                    this.selectedIndex = this.addedCards.length >= 1 ? this.addedCards.length - 1 : undefined;
                    if (this.selectedIndex === undefined) {
                        this.tempusZip = "";
                        this.removeAddressControls();
                    } else {
                        this.selectedAccount = this.addedCards[this.selectedIndex].lastFour;
                        this.setBillingTypeAddress(this.addedCards[this.selectedIndex].billingAddress);
                        this.isCardNotExpired = this.checkFutureDate(this.addedCards[this.selectedIndex]);
                    }
                });
        }
    }

    /**
     * Opens payment prompt with tempus iframe to Enter credit/debit card data
     * @param editMode boolean value
     */
    openPaymentPrompt(editMode: boolean): void {
        this.disableAddCard = true;
        if (editMode) {
            const promptData = {} as PaymentPromptDataModel;
            promptData.memberId = this.memberId;
            promptData.mpGroup = this.mpGroup;
            promptData.editModal = editMode;
            promptData.creditCardDetails = this.addedCards[this.selectedIndex];
            this.empoweredModalService
                .openDialog(PaymentDetailsPromptComponent, {
                    data: promptData,
                })
                .afterClosed()
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((creditCard) => {
                    this.disableAddCard = false;
                    if (creditCard) {
                        this.isCardNotExpired = this.checkFutureDate(creditCard);
                        this.addedCards[this.selectedIndex] = creditCard;
                    }
                });
        } else {
            this.selectedAccount = this.addNewCard;
            combineLatest([
                this.staticService.getConfigurations(TempusPaymentConfig.TEMPUS_IFRAME_URL, this.mpGroup),
                this.paymentService.getSession(),
            ])
                .pipe(
                    takeUntil(this.unsubscribe$),
                    switchMap(([iframeURL, sessionData]) => {
                        this.iframeURL = iframeURL[0].value;
                        this.disableAddCard = false;
                        return this.empoweredModalService
                            .openDialog(PaymentDetailsPromptComponent, {
                                data: {
                                    tempusSessionObject: sessionData,
                                    memberId: this.memberId,
                                    mpGroup: this.mpGroup,
                                    tempusIframeURL: this.iframeURL,
                                } as PaymentPromptDataModel,
                            })
                            .afterClosed();
                    }),
                    switchMap((repAddData) => {
                        this.tempusZip = repAddData?.tempusPostalCode;
                        if (!this.mpGroup) {
                            this.showNoCardError = false;
                            if (this.tempusZip) {
                                this.addedCards.push({
                                    accountName: repAddData?.accountName,
                                    type: repAddData?.type,
                                    lastFour: repAddData?.lastFour,
                                    expirationMonth: repAddData?.expirationMonth,
                                    expirationYear: repAddData?.expirationYear,
                                    tempusTokenIdentityGuid: repAddData?.tempusTokenIdentityGuid,
                                    repToken: repAddData?.tokens[0].token,
                                    tempusPostalCode: repAddData?.tempusPostalCode,
                                });
                                this.selectedIndex = this.addedCards.length - 1;
                                this.selectedAccount = this.addedCards[this.selectedIndex].lastFour;
                            }
                        }
                        if (repAddData?.accountName) {
                            this.isCardNotExpired = true;
                            this.removeAddressControls();
                            this.addAddressControls();
                        }
                        if (
                            repAddData?.error?.status === ClientErrorResponseCode.RESP_409 &&
                            repAddData?.error?.code === ClientErrorResponseType.DUPLICATE
                        ) {
                            return this.empoweredModalService
                                .openDialog(EmpoweredAttentionModalComponent, {
                                    data: {
                                        title: this.languageStrings["primary.portal.applicationFlowSteps.duplicateCard.title"],
                                        message: "primary.portal.applicationFlowSteps.duplicateCard.message",
                                        buttonText: this.languageStrings["primary.portal.common.ok"],
                                    },
                                })
                                .afterClosed();
                        }
                        // If user hits cancel button in the iFrame, do nothing.
                        if (repAddData?.errorCode === AddPaymentErrorCodes.CANCEL) {
                            return of("");
                        }
                        // If user hits maximum number of attempts for putting in valid CC details,
                        // close iFrame and popup a dialog to notify the user and don't save any data.
                        if (repAddData?.errorCode === AddPaymentErrorCodes.MAX_ATTEMPTS_REACHED) {
                            return this.empoweredModalService
                                .openDialog(EmpoweredAttentionModalComponent, {
                                    data: {
                                        title: this.languageStrings["primary.portal.applicationFlowSteps.maxAttemptsReached.title"],
                                        message: "primary.portal.applicationFlowSteps.maxAttemptsReached.message",
                                        buttonText: this.languageStrings["primary.portal.common.ok"],
                                    },
                                })
                                .afterClosed();
                        }
                        if (
                            repAddData?.errorCode === AddPaymentErrorCodes.DECLINED_CARD ||
                            repAddData?.errorCode === AddPaymentErrorCodes.EXPIRED_CARD
                        ) {
                            return this.empoweredModalService
                                .openDialog(EmpoweredAttentionModalComponent, {
                                    data: {
                                        title: this.languageStrings["primary.portal.applicationFlowSteps.cardValidationFailed.title"],
                                        message: "primary.portal.applicationFlowSteps.cardValidationFailed.message",
                                        buttonText: this.languageStrings["primary.portal.common.ok"],
                                    },
                                })
                                .afterClosed();
                        }
                        this.repToken = repAddData?.tokens[0]?.token;
                        return of(repAddData);
                    }),
                    filter((repAddData) => {
                        if (!repAddData && this.addedCards.length) {
                            this.selectedAccount = this.addedCards[this.selectedIndex].lastFour;
                        }
                        return repAddData;
                    }),
                    switchMap(() => {
                        if (this.mpGroup) {
                            return this.memberService.getPaymentMethods(this.memberId, this.mpGroup);
                        }
                        return of(null);
                    }),
                )
                .subscribe((paymentMethod) => {
                    if (this.mpGroup) {
                        this.showNoCardError = false;
                        this.addedCards = paymentMethod.filter(
                            (paymentData) => paymentData?.paymentType === PaymentType.CREDITCARD && paymentData?.tempusTokenIdentityGuid,
                        );
                        // to get last added credit card on top
                        this.addedCards.sort((card1, card2) => card1.id - card2.id);
                        this.selectedIndex = this.addedCards.length - 1;
                        if (this.selectedIndex > -1) {
                            this.selectedAccount = this.addedCards[this.selectedIndex].lastFour;
                            this.addedCards[this.selectedIndex].repToken = this.repToken;
                        }
                    }
                });
        }
    }

    /**
     * Mask last 4 digits of account number
     */
    maskAccountNumber(): void {
        if (this.formControl["accountNumber"]) {
            this.unMaskedAccountNumber = this.formControl["accountNumber"].value;
            const accNumberEntered = this.formControl["accountNumber"].value;
            if (accNumberEntered) {
                const maskedAccNumber = accNumberEntered.replace(/\d(?=\d{4})/g, "*");
                this.formControl.accountNumber.setValue(maskedAccNumber);
                this.transferToDirectForm.patchValue({
                    accountNumber: accNumberEntered,
                });
            }
        }
    }

    /**
     * Mask credit card number entered by the user
     * @returns void
     */
    maskCardNumber(): void {
        if (this.formControl["creditCardAccessToken"]) {
            this.unMaskedCardNumber = this.formControl["creditCardAccessToken"].value;
            const cardNumber = this.formControl["creditCardAccessToken"].value;
            if (cardNumber) {
                const maskedCardNumber = cardNumber.replace(/\d(?=\d{4})/g, "*");
                this.formControl.creditCardAccessToken.setValue(maskedCardNumber);
                this.transferToDirectForm.patchValue({
                    creditCardAccessToken: cardNumber,
                });
            }
        }
    }

    /**
     * Show policy change confirmation popup
     */
    openConfirmationPopup(): void {
        const dialogRef = this.dialog.open(PolicyChangeRequestConfirmationPopupComponent, {
            width: "667px",
            data: {
                cancelButton: this.languageStrings["primary.portal.policyChangeRequest.transactions.cancel"],
                continueButton: this.languageStrings["primary.portal.policyChangeRequest.transactions.continue"],
                requestType: this.languageStrings["primary.portal.policyChangeRequest.transactions.transferToDirect.header"],
            },
        });
        dialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((result) => {
                if (result === AppSettings.CONTINUE) {
                    this.sideNavService.onNextClick(1);
                } else {
                    dialogRef.close();
                }
            });
    }

    /**
     * Create form array for policies and set values
     * @param selected : set if all policies selected
     */
    private createPolicyFormControl(selected?: boolean): void {
        this.isAllPolicySelected = selected;
        this.formArray = this.transferToDirectForm.get("policyNumbers") as FormArray;
        if (this.storePolicy) {
            this.policyList.forEach((element) => {
                const setValue = this.storePolicy.indexOf(element) !== -1;
                this.formArray.push(this.fb.control(setValue));
            });
        } else {
            this.policyList.forEach((x) => this.formArray.push(this.fb.control(false)));
        }
    }

    selectAll(isChecked: boolean): void {
        this.formControl["policyNumbers"].controls = [];
        if (isChecked) {
            this.counter = this.policyList.length;
            this.isAllPolicySelected = true;
            this.policyList.forEach((x) => this.formArray.push(this.fb.control(true)));
        } else {
            this.isAllPolicySelected = false;
            this.counter = 0;
            this.isIndeterminate = false;
            this.policyList.forEach((x) => this.formArray.push(this.fb.control(false)));
        }
    }

    checkAllpolicySelected(): void {
        if (this.counter > 0) {
            this.counter--;
        }
    }

    selectSingle(isChecked: boolean, policy: AffectedPolicies): void {
        if (!isChecked) {
            this.counter = this.counter > 0 ? --this.counter : this.counter;
            if (this.counter === 0 && this.isMultipleAccounts) {
                this.clearAccountDetails();
            }
            this.isAllPolicySelected = isChecked;
        } else {
            this.counter++;
            this.isAllPolicySelected = this.counter === this.formControl["policyNumbers"].controls.length;
            this.setAccountDetails(policy);
        }
        this.checkForIntermidiateValue();
    }

    checkForIntermidiateValue(): void {
        this.isAllPolicySelected = this.counter === this.policyList.length;
        this.isIndeterminate = this.counter !== 0 && !this.isAllPolicySelected;
    }

    /**
     * Populate the form with account name and disable the field, based on the selected policy
     * @param selectedPolicy: Policy used for filling the form details
     * @returns void
     */
    setAccountDetails(selectedPolicy: AffectedPolicies): void {
        if (this.selectedAccountNumber !== selectedPolicy.accountNumber) {
            this.selectedAccountNumber = selectedPolicy.accountNumber;
            this.currentAccountName = selectedPolicy.accountName;
            if (selectedPolicy.accountName) {
                this.formControl[CURRENT_ACCOUNT_NAME].setValue(selectedPolicy.accountName);
                this.formControl[CURRENT_ACCOUNT_NAME].disable();
            }
        }
    }

    /**
     * On un-checking the policy in form, the policy details are reset and enabled.
     * @returns void
     */
    clearAccountDetails(): void {
        this.selectedAccountNumber = null;
        this.formControl[CURRENT_ACCOUNT_NAME].reset();
        this.formControl[CURRENT_ACCOUNT_NAME].enable();
    }

    getDocumentId(documentID: number): void {
        if (documentID) {
            this.documentIdArray.push(documentID);
        } else {
            this.formControl["documentIds"].patchValue(null);
            this.documentIdArray = [];
        }
    }

    /**
     * this method is use to validate zip code
     * @return void
     */
    validateZipCode(): void {
        if (this.formControl["zip"].dirty || (this.tempusConfig && this.formControl["zip"].value)) {
            this.showSpinner = true;
            this.staticService
                .validateStateZip(this.formControl["state"].value, this.formControl["zip"].value)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (resp) => {
                        this.showSpinner = false;
                        this.formControl["zip"].setErrors(null);
                        this.formControl["state"].setErrors(null);
                    },
                    (error) => {
                        this.showSpinner = false;
                        this.formControl["zip"].setErrors({ zipValid: true });
                        this.formControl["state"].setErrors({
                            zipValid: true,
                        });
                    },
                );
        }
    }

    /**
     * Update credit card number validators based on credit card selection
     * @param event MatSelectChange event
     */
    cardTypeUpdated(event: MatSelectChange): void {
        const creditCardNumberControl: AbstractControl = this.transferToDirectForm.get("creditCardAccessToken");
        if (event.value === AMEX) {
            this.isAmexSelected = true;
            creditCardNumberControl.setValidators([
                Validators.required,
                Validators.pattern(new RegExp(this.validationRegex.POSITIVENUMBER_NONDECIMAL)),
                Validators.minLength(this.amexMaxLength),
                Validators.maxLength(this.amexMaxLength),
            ]);
        } else {
            this.isAmexSelected = false;
            creditCardNumberControl.setValidators([Validators.required, Validators.pattern(new RegExp(this.validationRegex.CREDIT_CARD))]);
        }
    }

    /**
     * Get the date from date picker and assign value to form control
     * Set credit card expiration date
     * @param date date value from date picker
     */
    getDate(date: Date): void {
        let ctrlValue = this.formControl["expDate"].value;
        if (typeof ctrlValue === "string") {
            ctrlValue = this.dateService.toDate(ctrlValue);
        }
        ctrlValue.setMonth(date["value"].month());
        ctrlValue.setFullYear(date["value"].year());
        this.formControl["expDate"].setValue(this.dateService.format(this.dateService.toDate(ctrlValue), DateFormats.LONG_MONTH_YEAR));
        this.setCreditCardExpirationDate();
    }

    transform(event: any): void {
        event.target.value = this.maskPipe.transform(event.target.value, AppSettings.DATE_MASK_FORMAT);
    }
    /**
     * This method will unsubscribe all the api subscription.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
