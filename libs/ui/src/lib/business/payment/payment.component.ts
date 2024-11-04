import { takeUntil, switchMap, filter, map } from "rxjs/operators";
import { Component, OnInit, Input, ViewChild, OnDestroy } from "@angular/core";
import { FormGroup, FormBuilder, Validators, FormControl } from "@angular/forms";
import { MatCheckbox } from "@angular/material/checkbox";
import { MatDatepicker } from "@angular/material/datepicker";
import { MatRadioChange } from "@angular/material/radio";
import {
    MemberService,
    StaticService,
    ShoppingCartDisplayService,
    ApplicationService,
    AccountService,
    CardType,
    AgentSelfEnrollmentSSO,
    PaymentService,
} from "@empowered/api";
import { Store, Select } from "@ngxs/store";

import {
    EnrollmentState,
    UpdateApplicationResponse,
    SetPaymentCost,
    EnrollmentMethodState,
    SharedState,
    AppFlowService,
    StaticUtilService,
    UtilService,
    AccountListState,
    MemberInfoState,
} from "@empowered/ngxs-store";

import { Observable, forkJoin, Subject, combineLatest, of } from "rxjs";
import { LanguageService } from "@empowered/language";
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from "@angular/material/core";
import { PaymetricService } from "@empowered/common-services";
import { UserService } from "@empowered/user";
import { Router } from "@angular/router";
import { TPIState } from "@empowered/ngxs-store";

import {
    StaticStep,
    TpiSSOModel,
    UserPermissionList,
    AppSettings,
    EnrollmentMethod,
    ContactType,
    Configurations,
    ProducerCredential,
    TempusPaymentConfig,
    PaymentPromptDataModel,
    CarrierId,
    ConfigName,
    ClientErrorResponseCode,
    ClientErrorResponseType,
    ApplicationResponse,
    EmailContact,
    UserContactParameters,
    MemberContact,
    PaymentType,
    AccountType,
    BillingAddress,
    BillingNameSchema,
    AddPaymentErrorCodes,
    AddPayment,
    RoutingNumberModel,
    StepType,
    PayMetricData,
    MemberCredential,
    Portals,
} from "@empowered/constants";
import { EditDeletePaymentComponent } from "../edit-delete-payment/edit-delete-payment.component";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { PaymentDetailsPromptComponent } from "../../components/payment-details-prompt/payment-details-prompt.component";
import { EmpoweredAttentionModalComponent } from "../../components/empowered-attention-modal/empowered-attention-modal.component";
import { DateService, EXPIRY_DATES_FORMAT, DateFnsDateAdapter } from "@empowered/date";
import { EmpoweredModalService } from "@empowered/common-services";

const TRUE_VALUE = "TRUE";
const TOTAL_DIGIT_COUNT = 2;
const ROUTING_NUMBER_STARTING_INDEX = 5;
const ROUTING_NUMBER_ENDING_INDEX = 9;
const DISPLAY_ACCOUNT_NUMBER_MAX_LENGTH = 11;

@Component({
    selector: "empowered-payment",
    templateUrl: "./payment.component.html",
    styleUrls: ["./payment.component.scss"],
    providers: [
        { provide: DateAdapter, useClass: DateFnsDateAdapter, deps: [MAT_DATE_LOCALE] },
        { provide: MAT_DATE_FORMATS, useValue: EXPIRY_DATES_FORMAT },
    ],
})
export class PaymentComponent implements OnInit, OnDestroy {
    @ViewChild("dpDc") debitCardDatePicker: MatDatepicker<Date>;
    @ViewChild("dp") creditCardDatePicker: MatDatepicker<Date>;
    @Input() isBilling?: boolean = false;
    IS_ACH_PARTNER_ACCOUNT_TYPE = "is_ach_partner_account_type";
    DRAFT_ORIGIN_INDICATOR = "draft_origin_indicator";
    ROUTING_NUMBER = "routing_number";
    showSpinner = false;
    apiError = false;
    apiErrorMessage: string;
    mpGroup: number;
    memberId: number;
    memberContact: MemberContact[];
    memberInfo: any;
    validationRegex: any;
    textToShow: string;
    showEnroll = true;
    showPayment = false;
    showBillingAddress = false;
    showSettingForm = false;
    isEnrolled: string;
    enrollRadioError: boolean;
    enrollForm: FormGroup;
    bankDraftForm: FormGroup;
    debitCardForm: FormGroup;
    creditCardForm: FormGroup;
    billingForm: FormGroup;
    settingForm: FormGroup;
    paymentMethodForm: FormGroup;
    paymentType = PaymentType;
    accountType = AccountType;
    DRAFT_ORIGIN_INDICATOR_CHECKING = "1";
    DRAFT_ORIGIN_INDICATOR_SAVING = "2";
    allState = [];
    allSuffixes = [];
    paymentMethods = [];
    bankAccounts = [];
    creditCardAccount = [];
    debitCardAccount = [];
    selectedAccount: string;
    selectedIndex: number;
    sameAddress = false;
    disableDropdown = false;
    disableSameAddress = false;
    newBankAccount = "Add new account";
    newCard = "Add new card";
    stepPosition = 0;
    agreeCheckbox = false;
    zipApiError = false;
    routingApiError = false;
    aflacSteps;
    title: string;
    direction: string;
    selectedPaymentMethod = PaymentType.BANKDRAFT;
    paymentFrequeny = [];
    paymentId: number;
    applicationResp = [];
    email: string;
    savedPaymentIdIndex = 0;
    cartId: number;
    focused = true;
    reEnterFocused = true;
    frequencyCost = [];
    restrictedEmails: string;
    restrictedDomain: string;
    hasPayment = false;
    currentDate = new Date();
    creditCardFocused = true;
    paymetricAccessTokenAflac: string;
    paymetricAccessTokenVsp: string;
    aflacCarrierId = 1;
    vspCarrierId = 59;
    creditCardApiError = false;
    debitCardApiError = false;
    enrollmentMethod: string;
    showPin = false;
    visaRegex: RegExp;
    masterCardRegex: RegExp;
    amexRegex: RegExp;
    isACHPartnerAccountType: boolean;
    draftOriginIndicator: string;
    defaultRoutingNumber: string;
    billingAddressTitle = "";
    callCenterPin: string;
    pinDisableFlag = false;
    cardConstant = "Card ending in";
    staticStep: StaticStep;
    isCardNotExpired = true;
    isAchEditTempusPaymentService: boolean;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.applicationFlow.payments.accountName",
        "primary.portal.applicationFlow.payments.bankName",
        "primary.portal.applicationFlow.payments.cardExist",
        "primary.portal.applicationFlow.payments.billingAddress",
        "primary.portal.applicationFlow.payments.contactLater",
        "primary.portal.applicationFlow.payments.emailAddress",
        "primary.portal.applicationFlow.payments.invalidEmailAddressFormat",
        "primary.portal.applicationFlow.payments.nextFinishApplications",
        "primary.portal.applicationFlow.payments.paymentMethod",
        "primary.portal.applicationFlow.payments.paymentTypeBankDraft",
        "primary.portal.applicationFlow.payments.paymentTypeCreditCard",
        "primary.portal.applicationFlow.payments.paymentTypeDebitCard",
        "primary.portal.applicationFlow.payments.bankDraft",
        "primary.portal.applicationFlow.payments.creditCard",
        "primary.portal.applicationFlow.payments.debitCard",
        "primary.portal.applicationFlow.payments.selectDebitCard",
        "primary.portal.applicationFlow.payments.selectCreditCard",
        "primary.portal.applicationFlow.payments.addNewCard",
        "primary.portal.applicationFlow.payments.cardNumber",
        "primary.portal.applicationFlow.payments.invalidCardNumber",
        "primary.portal.applicationFlow.payments.expirationDate",
        "primary.portal.applicationFlow.payments.invalidExpirationDate",
        "primary.portal.applicationFlow.payments.enterPin",
        "primary.portal.applicationFlow.payments.customerInitials",
        "primary.portal.applicationFlow.payments.customerInitialsLater",
        "primary.portal.applicationFlow.payments.pastDate",
        "primary.portal.applicationFlow.payments.selectAccount",
        "primary.portal.applicationFlow.payments.addNewAccount",
        "primary.portal.applicationFlow.payments.routingNumber",
        "primary.portal.applicationFlow.payments.invalidRoutingNumber",
        "primary.portal.applicationFlow.payments.accountNumber",
        "primary.portal.applicationFlow.payments.reenterAccountNumber",
        "primary.portal.applicationFlow.payments.invalidAccountNumber",
        "primary.portal.applicationFlow.payments.accountNoDontMatch",
        "primary.portal.applicationFlow.payments.accountOwner",
        "primary.portal.applicationFlow.payments.cardHolder",
        "primary.portal.applicationFlow.payments.accountType",
        "primary.portal.applicationFlow.payments.accountTypeChecking",
        "primary.portal.applicationFlow.payments.accountTypeSaving",
        "primary.portal.applicationFlow.payments.sameAsApplicant",
        "primary.portal.applicationFlow.payments.firstName",
        "primary.portal.applicationFlow.payments.mi",
        "primary.portal.applicationFlow.payments.lastName",
        "primary.portal.applicationFlow.payments.suffix",
        "primary.portal.applicationFlow.payments.streetAddress1",
        "primary.portal.applicationFlow.payments.streetAddress2optional",
        "primary.portal.applicationFlow.payments.city",
        "primary.portal.applicationFlow.payments.zip",
        "primary.portal.applicationFlow.payments.state",
        "primary.portal.applicationFlow.payments.matchStateDigits",
        "primary.portal.applicationFlow.payments.matchState",
        "primary.portal.applicationFlow.payments.paymentSettings",
        "primary.portal.applicationFlow.payments.paymentFrequency",
        "primary.portal.applicationFlow.payments.paymentDate",
        "primary.portal.applicationFlow.payments.invalidDate",
        "primary.portal.applicationFlow.payments.chooseDay",
        "primary.portal.applicationFlow.payments.agreeDescription",
        "primary.portal.applicationFlow.payments.customerInitials",
        "primary.portal.applicationFlow.payments.invalidFormat",
        "primary.portal.formPageQuestion.useOnlyLetters",
        "primary.portal.applicationFlow.payments.nextFinishApplications",
        "primary.portal.applicationFlow.payments.cannotExceedChar",
        "primary.portal.applicationFlow.payments.mustLeastChar",
        "primary.portal.applicationFlow.payments.onlyLettersNumUnderscore",
        "primary.portal.common.iAgree",
        "primary.portal.common.requiredField",
        "primary.portal.common.next",
        "primary.portal.common.selectionRequired",
        "primary.portal.common.back",
        "primary.portal.common.yes",
        "primary.portal.common.no",
        "primary.portal.applicationFlow.payments.cardTypeHint",
        "primary.portal.sra.form.invalidFormat",
        "primary.portal.common.payMetric.issue",
        "primary.portal.applicationFlow.payments.duplicatepayment",
        "primary.portal.vf2f.disable.info",
        "primary.portal.applicationFlow.payments.debitCardMessage",
        "primary.portal.common.city.patternError",
        "primary.portal.billingAflac.consent.content",
        "primary.portal.common.ok",
        "primary.portal.applicationFlowSteps.maxAttemptsReached.title",
        "primary.portal.applicationFlowSteps.maxAttemptsReached.message",
        "primary.portal.applicationFlowSteps.duplicateCard.title",
        "primary.portal.applicationFlowSteps.duplicateCard.message",
        "primary.portal.applicationFlowSteps.cardValidationFailed.title",
        "primary.portal.applicationFlowSteps.duplicateAccount.title",
        "primary.portal.applicationFlowSteps.accountValidationFailed.title",
        "primary.portal.applicationFlow.payments.paymentMethod.achEditRetireWarning",
    ]);
    languageSecondStringsArray: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.common.errorResponse",
        "secondary.portal.common.errorSaving",
        "secondary.portal.common.somethingWrong",
    ]);
    @Select(SharedState.regex) regex$: Observable<any>;
    @Input() reinstate: boolean;
    @Input() isAflacAlwaysQuasiModal?: boolean;

    customerInitial: string;
    customerSign: string;
    isHeadset: boolean;
    cardType: CardType;
    private unsubscribe$ = new Subject<void>();
    AppSettings = AppSettings;
    isTpi = false;
    isModalMode = false;
    // virtual face to face flag. It will be true if enrollment method is virtual face to face.
    isVf2f = false;

    enableDebitCardBilling = false;
    tempusResponsePayload: AddPayment;
    showNoCardError = false;
    tempusZip: string = null;
    tempusPaymentConfig: boolean;
    tempusIframeURL: string;
    MASK_FIRST_EIGHT = "********";
    editMode = false;
    METHOD = "method";
    dropdownData: RoutingNumberModel[];
    selectedRadio: string;
    consentContent: SafeHtml;
    showSignerAgreement: boolean;
    creditCardExpirationDate: string;
    bankDraftTempusConfig: boolean;
    showNoAccountError = false;
    enablePaymetricBankDraft: boolean;
    phraseEndingIn = " ending in ";
    MASK_FIRST_SEVEN = "*******";
    MASK_FIRST_FIVE = "*****";
    bankDraftTempusResponsePayload: AddPayment;
    routingNumberLastFourDigits: string;
    showMaskedAccountNumber: string;
    disableNextButton = false;
    disableAddAccount = false;
    disableAddCard = false;
    initializeBilling = false;
    providedPaymentMethod: string;

    constructor(
        private readonly fb: FormBuilder,
        private readonly memberService: MemberService,
        private readonly store: Store,
        private readonly staticService: StaticService,
        private readonly appFlowService: AppFlowService,
        private readonly language: LanguageService,
        private readonly shoppingCartService: ShoppingCartDisplayService,
        private readonly applicationService: ApplicationService,
        private readonly paymetricService: PaymetricService,
        private readonly userService: UserService,
        private readonly accountService: AccountService,
        private readonly router: Router,
        private readonly staticUtil: StaticUtilService,
        private readonly utilService: UtilService,
        private readonly paymentService: PaymentService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly domSanitizer: DomSanitizer,
        private readonly dateService: DateService,
    ) {
        this.mpGroup = this.store.selectSnapshot(AccountListState.getGroup)?.id;
        this.memberId = this.store.selectSnapshot(MemberInfoState.GetMemberId);
        const portal = this.store.selectSnapshot(SharedState.portal);
        if (portal === Portals.MEMBER) {
            this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential: MemberCredential) => {
                if (credential) {
                    this.mpGroup = credential.groupId;
                    this.memberId = credential.memberId;
                }
            });
        }
        // Fetch mpGroup and memberId from enrollment state if the values are not set
        if (!this.mpGroup || !this.memberId) {
            this.mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
            this.memberId = this.store.selectSnapshot(EnrollmentState.GetMemberId);
        }

        this.getConfigurationSpecifications();
        this.memberService
            .getMemberContacts(this.memberId, this.mpGroup?.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                if (resp) {
                    this.memberContact = resp;
                }
            });
        this.initializeBilling = this.appFlowService.initializeBilling;
        this.store.dispatch(new SetPaymentCost(null));
    }
    /**
     * Life cycle hook for angular to initialize the component
     */
    ngOnInit(): void {
        let isAgentAssistedFlow = false;
        this.showPayment = this.isAflacAlwaysQuasiModal;
        this.consentContent = this.domSanitizer.bypassSecurityTrustHtml(
            this.languageStrings["primary.portal.billingAflac.consent.content"],
        );
        this.appFlowService.showNextProductFooter$.next({ nextClick: false, data: null });
        this.appFlowService.paymentMethod$.pipe(takeUntil(this.unsubscribe$)).subscribe((response) => {
            this.providedPaymentMethod = response;
        });
        this.getGroupAttributes();
        if (this.router.url.indexOf(AppSettings.TPI) >= 0) {
            this.isTpi = true;
            const tpiSsoDetail: TpiSSOModel = this.store.selectSnapshot(TPIState.tpiSsoDetail);
            isAgentAssistedFlow = Boolean(tpiSsoDetail.user.producerId || this.store.selectSnapshot(TPIState.getTPIProducerId));
            this.isModalMode = tpiSsoDetail.modal;
        }
        combineLatest([
            this.userService.credential$,
            this.staticUtil.hasPermission(UserPermissionList.HYBRID_USER),
            this.staticService
                .getConfigurations(TempusPaymentConfig.TEMPUS_IFRAME_ENABLE_CONFIG, this.mpGroup)
                .pipe(map((configs) => configs[0].value === TRUE_VALUE)),
            this.staticService.getConfigurations(ConfigName.AUTHORIZATION_AGREEMENT, this.mpGroup),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                ([credential, , tempusPaymentConfig, showSignerAgreement]: [
                    ProducerCredential & AgentSelfEnrollmentSSO,
                    boolean,
                    boolean,
                    Configurations[],
                ]) => {
                    // if config is on, we don't want to show third payment method radio button for debit card
                    this.enableDebitCardBilling = !tempusPaymentConfig;

                    this.showSignerAgreement = showSignerAgreement[0].value === TRUE_VALUE;
                    if (credential.producerId && credential.memberId) {
                        this.enrollmentMethod = EnrollmentMethod.FACE_TO_FACE;
                    }
                    if ((credential.producerId && !credential.memberId) || isAgentAssistedFlow) {
                        this.enrollmentMethod = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment)?.enrollmentMethod;
                    }
                    this.isVf2f = this.enrollmentMethod === EnrollmentMethod.VIRTUAL_FACE_TO_FACE;
                    if (this.enrollmentMethod === EnrollmentMethod.HEADSET) {
                        this.isHeadset = true;
                    }
                    if (
                        this.enrollmentMethod === EnrollmentMethod.CALL_CENTER ||
                        this.enrollmentMethod === EnrollmentMethod.PIN_SIGNATURE
                    ) {
                        this.showPin = true;
                    }
                    // config for PNC implementation
                    this.tempusPaymentConfig = tempusPaymentConfig;
                },
            );
        if (this.reinstate) {
            this.appFlowService.reinstateLastCompletedPaymentIndex$.next(1);
        } else {
            this.appFlowService.lastCompletedPaymentIndex.next(1);
        }
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                this.validationRegex = data;
                this.assignRegex();
            }
        });
        this.initializeText();
        this.initializeEnrollForm();
        if (this.isAflacAlwaysQuasiModal) {
            if (this.initializeBilling) {
                this.selectedPaymentMethod = this.appFlowService.selectedPaymentMethod;
                this.initializePaymentMethodForm();
                this.initializePaymentForm();
                this.showPayment = false;
            } else {
                this.initializePaymentMethodForm();
                this.initializePaymentForm();
            }
        }
        this.serviceCalls();
        this.appFlowService.paymentStepPosition.pipe(takeUntil(this.unsubscribe$)).subscribe((resp) => {
            this.stepPosition = resp;
            this.checkCompleteStatus();
        });
        this.checkPayment();
        this.appFlowService.paymentStepNext$.pipe(takeUntil(this.unsubscribe$)).subscribe((resp) => {
            if (resp === 1) {
                this.onPaymentNext(this.selectedPaymentMethod);
                this.appFlowService.setSelectedPaymentType(this.selectedPaymentMethod);
            } else if (resp === 2) {
                this.onBillingNext();
            }
        });
    }
    // getting values fo Group Attribute
    getGroupAttributes(): void {
        this.accountService
            .getGroupAttributesByName([this.IS_ACH_PARTNER_ACCOUNT_TYPE, this.DRAFT_ORIGIN_INDICATOR, this.ROUTING_NUMBER], this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                if (response && response.length > 0) {
                    response.forEach((groupAttribute) => {
                        const value = groupAttribute.value && groupAttribute.value.toString();
                        switch (groupAttribute.attribute) {
                            case this.IS_ACH_PARTNER_ACCOUNT_TYPE:
                                this.isACHPartnerAccountType = value === AppSettings.TRUE;
                                break;
                            case this.DRAFT_ORIGIN_INDICATOR:
                                this.draftOriginIndicator = value;
                                break;
                            case this.ROUTING_NUMBER:
                                this.defaultRoutingNumber = value;
                                break;
                        }
                    });
                }
            });
    }
    assignRegex(): void {
        this.visaRegex = new RegExp(this.validationRegex.VISA_CARD_REGEX);
        this.masterCardRegex = new RegExp(this.validationRegex.MASTER_CARD_REGEX);
        this.amexRegex = new RegExp(this.validationRegex.AMEX_CARD_REGEX);
    }
    checkPayment(): void {
        this.hasPayment = this.store.selectSnapshot(EnrollmentState.GetDirectPayment).length ? true : false;
    }
    /** To manipulate showEnroll, showPayment, showBillingAddress, showSettingForm based on step position
     * @returns void
     */
    checkCompleteStatus(): void {
        this.showEnroll = this.showPayment = this.showBillingAddress = this.showSettingForm = false;
        if (this.stepPosition === 0) {
            this.showEnroll = true;
        } else if (this.stepPosition === 1) {
            this.showPayment = true;
        } else if (this.stepPosition === 2) {
            this.showBillingAddress = true;
        } else if (this.stepPosition === 3) {
            this.showSettingForm = true;
            this.appFlowService.showNextProductFooter$.next({ nextClick: true, data: StaticStep.ONE_SIGNATURE });
        }
    }
    /**
     * Initialize the payment step text information
     */
    initializeText(): void {
        if (this.reinstate) {
            this.aflacSteps = this.store
                .selectSnapshot(EnrollmentState.GetAflacAlways)
                .filter((data) => data.applicationType === StepType.REINSTATEMENT);
            if (this.aflacSteps && this.aflacSteps.length) {
                this.store.dispatch(new SetPaymentCost(this.aflacSteps[0].itemId));
            }
        } else {
            this.aflacSteps = this.store
                .selectSnapshot(EnrollmentState.GetAflacAlways)
                .filter((data) => data.applicationType !== StepType.REINSTATEMENT);
        }
        if (this.aflacSteps.length) {
            this.title = this.aflacSteps[0].steps[0].title;
            this.textToShow = this.aflacSteps[0].steps[0].question.text;
            this.direction = this.aflacSteps[0].steps[2].directions;
            this.paymentFrequeny = this.aflacSteps[0].steps[2].allowedPayFrequencies;
            this.cartId = this.aflacSteps[0].itemId;
            const cost = this.store.selectSnapshot(EnrollmentState.GetPaymentCost);
            this.frequencyCost.push(cost.monthly);
            this.frequencyCost.push(cost.quarterly);
        }
    }
    serviceCalls(): void {
        const paymentApi = this.memberService.getPaymentMethods(this.memberId, this.mpGroup);
        const memberApi = this.memberService.getMember(this.memberId, false, this.mpGroup.toString());
        const stateApi = this.staticService.getStates();
        const suffixApi = this.staticService.getSuffixes();
        const restrictedEmailsAndDomainsConfigApi = this.staticUtil.fetchConfigs(
            [ConfigName.EMAIL_RESTRICTION_LIST, ConfigName.RESTRICTED_DOMAIN_ACCOUNTS_MAP],
            this.mpGroup,
        );

        const tempusConfigApi = this.staticUtil.cacheConfigEnabled(TempusPaymentConfig.TEMPUS_IFRAME_ENABLE_CONFIG);
        const tempusAchConfigApi = this.staticService.getConfigurations(TempusPaymentConfig.TEMPUS_ACH_IFRAME_ENABLE_CONFIG, this.mpGroup);
        const achEditEnableConfigApi = this.staticService.getConfigurations(
            TempusPaymentConfig.TEMPUS_ACH_EDIT_ENABLE_CONFIG,
            this.mpGroup,
        );
        this.showSpinner = true;
        combineLatest([
            paymentApi,
            memberApi,
            stateApi,
            suffixApi,
            restrictedEmailsAndDomainsConfigApi,
            tempusConfigApi,
            tempusAchConfigApi,
            achEditEnableConfigApi,
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {
                    this.showSpinner = false;
                    this.isAchEditTempusPaymentService = resp[7][0].value === TRUE_VALUE;
                    this.tempusPaymentConfig = resp[5];
                    this.bankDraftTempusConfig = resp[6][0].value === TRUE_VALUE;
                    this.paymentMethods = resp[0];
                    this.memberInfo = resp[1];
                    this.allState = resp[2];
                    this.allSuffixes = resp[3];
                    const [, , , , [restrictedEmails, restrictedDomain]] = resp;
                    if (restrictedEmails && restrictedDomain) {
                        this.restrictedEmails = restrictedEmails.value;
                        this.restrictedDomain = restrictedDomain.value;
                    }

                    // enable paymetric bank draft flow only when config is off or in case of VSP billing
                    this.enablePaymetricBankDraft = !this.bankDraftTempusConfig;

                    this.mapPayments();
                    if (this.isAflacAlwaysQuasiModal) {
                        this.savedPaymentIdIndex = this.appFlowService.selectedPaymentIndex;
                        this.initializePaymentMethodForm();
                        this.initializePaymentForm();
                        if (this.initializeBilling) {
                            this.onPaymentNext(this.selectedPaymentMethod);
                        }
                    } else {
                        this.getApplicationResponse();
                    }
                },
                () => {
                    this.showSpinner = false;
                    this.apiError = true;
                    this.apiErrorMessage = "primary.portal.common.servertimeout";
                },
            );
    }

    /**
     * This function is used to map the various payment methods into their respective array
     * (bankAccounts,creditCardAccount and debitCardAccount)
     */
    mapPayments(): void {
        this.creditCardAccount = [];
        this.bankAccounts = [];
        this.paymentMethods.forEach((method) => {
            if (
                (this.enablePaymetricBankDraft && method.paymentType === this.paymentType.BANKDRAFT && !method?.tempusTokenIdentityGuid) ||
                (!this.enablePaymetricBankDraft && method?.tempusTokenIdentityGuid && method.paymentType === this.paymentType.BANKDRAFT)
            ) {
                this.bankAccounts.push(method);
            } else if (
                (this.enableDebitCardBilling && method.paymentType === this.paymentType.CREDITCARD && !method.tempusTokenIdentityGuid) ||
                (!this.enableDebitCardBilling &&
                    method.tempusTokenIdentityGuid &&
                    (method.paymentType === this.paymentType.CREDITCARD || method.paymentType === this.paymentType.DEBITCARD))
            ) {
                this.creditCardAccount.push(method);
            } else if (method.paymentType === this.paymentType.DEBITCARD && !method?.tempusTokenIdentityGuid) {
                this.debitCardAccount.push(method);
            }
        });
    }
    updateEnrollOption(event: MatRadioChange): void {
        if (this.reinstate) {
            this.appFlowService.reinstateLastCompletedPaymentIndex$.next(1);
        } else {
            this.appFlowService.lastCompletedPaymentIndex.next(1);
        }

        if (this.reinstate) {
            this.appFlowService.reinstateLastCompleteStaticStep$.next(0);
        } else {
            this.appFlowService.lastCompleteStaticStep.next(0);
        }
        this.isEnrolled = event.value;
        this.enrollRadioError = false;
        this.apiError = false;
        if (event.value === AppSettings.CONTACT_LATER) {
            this.enrollForm.addControl("contact", this.addContactControl());
        } else {
            this.enrollForm.removeControl("contact");
        }
        this.onNextTPI(event.value);
    }

    /**
     * To show the button on the click of next in TPI footer
     * @param value Data of event
     */

    onNextTPI(value: string): void {
        if (value !== AppSettings.YES) {
            this.appFlowService.showNextProductFooter$.next({
                nextClick: true,
                data: StaticStep.ONE_SIGNATURE,
            });
        } else {
            this.appFlowService.showNextProductFooter$.next({
                nextClick: false,
                data: null,
            });
        }
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
     * This method is used to add member contact control to existing form group
     * @returns FormControl with default value and validations
     */
    addContactControl(): FormControl {
        let emailValue: (EmailContact & UserContactParameters) | string = null;
        if (this.email) {
            emailValue = this.email;
        } else if (this.memberContact && this.memberContact.length) {
            const primaryEmailAddresses: (EmailContact & UserContactParameters)[] = [];
            this.memberContact.forEach((eachContact) => {
                primaryEmailAddresses.push(...eachContact.emailAddresses.filter((eachEmail) => eachEmail.primary));
            });
            emailValue = primaryEmailAddresses.length ? primaryEmailAddresses[0].email : null;
            if (!emailValue) {
                emailValue = this.memberContact[0].emailAddresses.length ? this.memberContact[0].emailAddresses[0].email : null;
            }
        } else {
            emailValue = null;
        }
        return this.fb.control(emailValue, [Validators.required, Validators.pattern(new RegExp(this.validationRegex.EMAIL))]);
    }
    initializeEnrollForm(enroll?: string): void {
        this.enrollForm = this.fb.group({
            enrolled: [enroll, Validators.required],
        });
    }
    onEnrollNext(): void {
        if (this.enrollForm.valid) {
            this.initializePaymentMethodForm();
            this.enrollRadioError = false;
            if (this.isEnrolled === AppSettings.NO) {
                this.saveQuestion();
            } else if (this.isEnrolled === AppSettings.CONTACT_LATER) {
                if (!this.restrictedEmails.includes(this.enrollForm.value.contact)) {
                    this.saveQuestion();
                } else {
                    this.enrollForm.controls.contact.setErrors({ pattern: true });
                }
            } else {
                this.showPayment = true;
                this.showEnroll = false;
                this.showBillingAddress = false;
                this.initializePaymentForm();
                if (this.reinstate) {
                    this.appFlowService.reinstateLastCompletedPaymentIndex$.next(2);
                } else {
                    this.appFlowService.lastCompletedPaymentIndex.next(2);
                }
            }
        } else if (!this.isEnrolled) {
            this.enrollRadioError = true;
        }
    }
    updatePaymentOption(event: MatRadioChange): void {
        this.showNoCardError = false;
        this.showNoAccountError = false;
        this.apiError = this.disableDropdown = this.sameAddress = false;
        this.initializeBillingAddressForm();
        this.selectedPaymentMethod = event.value;
        if (this.reinstate) {
            this.appFlowService.reinstateLastCompletedPaymentIndex$.next(2);
        } else {
            this.appFlowService.lastCompletedPaymentIndex.next(2);
        }
        this.initializePaymentForm();
    }
    initializePaymentForm(): void {
        const cardMessage = this.languageStrings["primary.portal.applicationFlow.payments.cardHolder"];
        if (this.selectedPaymentMethod === PaymentType.BANKDRAFT) {
            this.billingAddressTitle = this.languageStrings["primary.portal.applicationFlow.payments.accountOwner"];
            if (this.bankAccounts.length) {
                this.getAccountId(PaymentType.BANKDRAFT);
                this.prePopulateAccount(this.paymentType.BANKDRAFT, this.savedPaymentIdIndex);
                this.selectedAccount = this.enablePaymetricBankDraft
                    ? this.bankAccounts[this.savedPaymentIdIndex].accountName
                    : this.bankAccounts[this.savedPaymentIdIndex]?.id.toString();
            } else {
                this.selectedAccount = this.newBankAccount;
                this.initializeBankForm();
            }
        } else if (this.selectedPaymentMethod === PaymentType.DEBITCARD) {
            this.billingAddressTitle = cardMessage;
            if (this.debitCardAccount.length) {
                this.getAccountId(PaymentType.DEBITCARD);
                this.prePopulateAccount(this.paymentType.DEBITCARD, this.savedPaymentIdIndex);
                this.selectedAccount = this.debitCardAccount[this.savedPaymentIdIndex].lastFour;
            } else {
                this.selectedAccount = this.newCard;
                this.initializeDebitForm();
            }
        } else if (this.selectedPaymentMethod === PaymentType.CREDITCARD) {
            this.billingAddressTitle = cardMessage;
            if (this.creditCardAccount.length) {
                this.getAccountId(PaymentType.CREDITCARD);
                this.prePopulateAccount(this.paymentType.CREDITCARD, this.savedPaymentIdIndex);
                this.selectedAccount = this.creditCardAccount[this.savedPaymentIdIndex].lastFour;
            } else {
                this.selectedAccount = this.newCard;
                this.initializeCreditForm();
            }
        }
    }

    /**
     * Gets account id
     * @param type Payment method type
     */
    getAccountId(type: PaymentType): void {
        const index = this.paymentMethods.findIndex(
            (method) =>
                // when the type selected is CREDIT_CARD and enableDebitCardBilling is true then get the index for paymetric card
                // when the type selected is CREDIT_CARD and enableDebitCardBilling is false then get the index for non-paymetric card
                // when the type selected is BANK_DRAFT then get the index for bank draft
                // when the type selected is DEBIT_CARD then get the index for debit card
                // when the type selected is Credit/Debit card and payment type as Debit_CARD, get the index for non-paymetric debit card
                (type === PaymentType.CREDITCARD &&
                    type === method.paymentType &&
                    ((!this.enableDebitCardBilling && method.tempusTokenIdentityGuid) ||
                        (this.enableDebitCardBilling && !method.tempusTokenIdentityGuid))) ||
                (type === PaymentType.BANKDRAFT &&
                    type === method.paymentType &&
                    ((!this.enablePaymetricBankDraft && method.tempusTokenIdentityGuid) ||
                        (this.enablePaymetricBankDraft && !method.tempusTokenIdentityGuid))) ||
                (type === PaymentType.DEBITCARD && type === method.paymentType && !method.tempusTokenIdentityGuid) ||
                (method.paymentType === PaymentType.DEBITCARD &&
                    type === PaymentType.CREDITCARD &&
                    method.tempusTokenIdentityGuid &&
                    !this.enableDebitCardBilling),
        );
        if (type === PaymentType.BANKDRAFT) {
            const idIndex = this.bankAccounts.findIndex((acc) => acc.id === this.paymentMethods[this.savedPaymentIdIndex]?.id);
            if (idIndex > -1) {
                this.savedPaymentIdIndex = idIndex;
            } else {
                const bankIndex = this.bankAccounts.findIndex((acc) => acc.id === this.paymentMethods[index].id);
                this.savedPaymentIdIndex = bankIndex;
            }
        } else if (type === PaymentType.CREDITCARD) {
            const idIndex = this.creditCardAccount.findIndex((acc) => acc.id === this.paymentMethods[this.savedPaymentIdIndex]?.id);
            if (idIndex > -1) {
                this.savedPaymentIdIndex = idIndex;
            } else {
                const creditCardIndex = this.creditCardAccount.findIndex((acc) => acc.id === this.paymentMethods[index].id);
                this.savedPaymentIdIndex = creditCardIndex;
            }
        } else if (type === PaymentType.DEBITCARD) {
            const idIndex = this.debitCardAccount.findIndex((acc) => acc.id === this.paymentMethods[this.savedPaymentIdIndex].id);
            if (idIndex > -1) {
                this.savedPaymentIdIndex = idIndex;
            } else {
                const debitCardIndex = this.debitCardAccount.findIndex((acc) => acc.id === this.paymentMethods[index].id);
                this.savedPaymentIdIndex = debitCardIndex;
            }
        }
    }
    initializeBankForm(name?: string, bankName?: string, routingNumber?: string, accountNumber?: string, accountType?: AccountType): void {
        routingNumber = this.isACHPartnerAccountType ? this.defaultRoutingNumber : routingNumber;
        accountType =
            this.isACHPartnerAccountType && this.draftOriginIndicator === this.DRAFT_ORIGIN_INDICATOR_CHECKING
                ? this.accountType.CHECKING
                : this.isACHPartnerAccountType && this.draftOriginIndicator === this.DRAFT_ORIGIN_INDICATOR_SAVING
                ? this.accountType.SAVINGS
                : accountType;

        this.disableDropdown =
            (this.draftOriginIndicator === this.DRAFT_ORIGIN_INDICATOR_CHECKING ||
                this.draftOriginIndicator === this.DRAFT_ORIGIN_INDICATOR_SAVING) &&
            this.isACHPartnerAccountType;

        this.bankDraftForm = this.fb.group(
            {
                accountName: [name, Validators.required],
                bankName: [bankName, Validators.pattern(this.validationRegex.BANK_NAME)],
                routingNumber: [
                    { value: routingNumber, disabled: this.isACHPartnerAccountType },
                    [Validators.required, Validators.minLength(9), this.validateRoutingNumber.bind(this)],
                ],
                accountNumber: [accountNumber, [Validators.required, Validators.minLength(6)]],
                reAccountNumber: [accountNumber],
                accountType: [accountType, Validators.required],
            },
            { validators: this.isMatching("accountNumber", "reAccountNumber") },
        );

        this.bankDraftForm.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((change) => {
            if (this.reinstate) {
                this.appFlowService.reinstateLastCompletedPaymentIndex$.next(2);
            } else {
                this.appFlowService.lastCompletedPaymentIndex.next(2);
            }
        });
    }

    initializeDebitForm(cardNumber?: string, expirationDate?: any): void {
        this.debitCardForm = this.fb.group(
            {
                cardNumber: [
                    cardNumber,
                    [
                        Validators.required,
                        Validators.minLength(AppSettings.CARD_NUMBER_MIN_LENGTH),
                        this.validateDebitCardNumber.bind(this),
                    ],
                ],
                expirationDate: [expirationDate, Validators.required],
            },
            { updateOn: "blur" },
        );
        this.debitCardForm.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((change) => {
            if (this.reinstate) {
                this.appFlowService.reinstateLastCompletedPaymentIndex$.next(2);
            } else {
                this.appFlowService.lastCompletedPaymentIndex.next(2);
            }
        });
    }
    initializeCreditForm(cardNumber?: string, expirationDate?: any): void {
        this.creditCardForm = this.fb.group(
            {
                cardNumber: [
                    cardNumber,
                    [
                        Validators.required,
                        Validators.minLength(AppSettings.CARD_NUMBER_MIN_LENGTH),
                        this.validateCreditCardNumber.bind(this),
                    ],
                ],
                expirationDate: [expirationDate, Validators.required],
            },
            { updateOn: "blur" },
        );
        this.creditCardForm.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((change) => {
            if (this.reinstate) {
                this.appFlowService.reinstateLastCompletedPaymentIndex$.next(2);
            } else {
                this.appFlowService.lastCompletedPaymentIndex.next(2);
            }
        });
    }
    isMatching(accountNumber: string, confirmAccountNumber: string): any {
        return (group: FormGroup) => {
            const accountInput = group.controls[accountNumber],
                accountConfirmationInput = group.controls[confirmAccountNumber];
            if (!accountConfirmationInput.value) {
                return accountConfirmationInput.setErrors({ required: true });
            }
            if (accountConfirmationInput.value.length < 4) {
                return accountConfirmationInput.setErrors({ minlength: true });
            } else if (accountInput.value !== accountConfirmationInput.value) {
                return accountConfirmationInput.setErrors({ notEquivalent: true });
            }
            return accountConfirmationInput.setErrors(null);
        };
    }
    validateNumber(event: any): boolean {
        this.apiError = this.zipApiError = this.routingApiError = this.creditCardApiError = this.debitCardApiError = false;
        return event.charCode === 8 || event.charCode === 0 ? null : event.charCode >= 48 && event.charCode <= 57;
    }
    /**
     * this method is used to set billing address values and initialize the billing address form with those values
     * @return void
     */
    setBillingAddress(): void {
        this.disableSameAddress = false;
        this.disableDropdown = false;
        const firstName = this.billingForm?.value.firstName ?? "";
        const lastName = this.billingForm?.value.lastName ?? "";
        const mi = this.billingForm?.value.mi ?? "";
        const suffix = this.billingForm?.value.suffix ?? "";
        const address1 = this.billingForm?.value.address1 ?? "";
        const address2 = this.billingForm?.value.address2 ?? "";
        const city = this.billingForm?.value.city ?? "";
        const state = this.billingForm?.value.state ?? "";
        const zip =
            this.selectedPaymentMethod === this.paymentType.CREDITCARD
                ? this.billingForm?.value.zip ?? this.creditCardAccount[this.selectedIndex]?.tempusPostalCode ?? this.tempusZip
                : this.billingForm?.value.zip ?? "";
        this.initializeBillingAddressForm(firstName, lastName, mi, suffix, address1, address2, city, state, zip);
    }

    /**
     * Initializes bank draft billing form
     */
    initializeBankDraftBillingForm() {
        if (
            !(
                this.enablePaymetricBankDraft ||
                this.sameAddress ||
                this.bankAccounts[this.selectedIndex].sameAddressAsHome ||
                this.bankAccounts[this.selectedIndex].billingName.firstName
            )
        ) {
            if (!this.bankAccounts[this.selectedIndex].billingName.firstName && this.billingForm?.value.firstName) {
                this.billingForm.reset();
            }
            this.setBillingAddress();
        } else if (!this.sameAddress) {
            this.prePopulateBillingAddress();
        }
    }
    /**
     * this method gets called when credit card is selected and it is used to validate card number if new card added and
     * initialize billing form when card already exist and card is not expired
     * @param method selected payment method is credit card
     * @return void
     */
    onCreditCardPaymentNext(method: PaymentType): void {
        this.toggleNoPaymentError();
        this.apiError = false;
        this.creditCardForm.markAllAsTouched();
        if (this.selectedAccount === this.newCard && this.creditCardForm.valid) {
            const cardNumber = this.creditCardForm.value.cardNumber;
            const cardExpiryDate = this.creditCardForm.value.expirationDate;
            const index = this.getCardIndex(cardNumber, PaymentType.CREDITCARD, cardExpiryDate);
            if (index > -1) {
                this.creditCardForm.controls.cardNumber.setErrors({ alreadyExist: true });
            } else {
                const isValid = this.isValidCardNumber(cardNumber);
                if (isValid) {
                    this.showSpinner = true;
                    this.callPaymetricService(method);
                } else {
                    this.creditCardForm.controls.cardNumber.setErrors({ invalid: true });
                }
            }
        } else if (!this.enableDebitCardBilling && this.selectedAccount !== this.newCard && !this.isCardNotExpired) {
            this.showBillingAddress = false;
            this.showPayment = true;
        } else if (this.selectedAccount !== this.newCard) {
            this.initializeBillingForm();
            if (this.reinstate) {
                this.appFlowService.reinstateLastCompletedPaymentIndex$.next(3);
            } else {
                this.appFlowService.lastCompletedPaymentIndex.next(3);
                this.showBillingAddress = true;
                this.showPayment = false;
            }
        }
    }
    /**
     * Validate routing number and turn api error false
     * @param event paste event data
     * @returns boolean value which determines whether to paste or not
     */
    validatePastedNumber(event: Event): boolean {
        this.apiError = this.zipApiError = this.routingApiError = this.creditCardApiError = this.debitCardApiError = false;
        return true;
    }
    onPaymentNext(method: PaymentType): void {
        if (method === this.paymentType.BANKDRAFT) {
            this.showNoAccountError = this.selectedAccount === this.newBankAccount && !this.enablePaymetricBankDraft;
            this.bankDraftForm.markAllAsTouched();
            if (this.enablePaymetricBankDraft && this.bankDraftForm.valid) {
                this.showBillingAddress = true;
                this.showPayment = false;
                if (this.selectedAccount === this.newBankAccount) {
                    if (!this.billingForm) {
                        this.initializeBillingAddressForm();
                    } else {
                        this.disableSameAddress = false;
                    }
                } else {
                    this.prePopulateBillingAddress();
                }
                if (this.reinstate) {
                    this.appFlowService.reinstateLastCompletedPaymentIndex$.next(3);
                } else {
                    this.appFlowService.lastCompletedPaymentIndex.next(3);
                }
            } else if (!this.enablePaymetricBankDraft && this.selectedAccount !== this.newBankAccount) {
                this.showBillingAddress = true;
                this.showPayment = false;
                this.initializeBankDraftBillingForm();
                if (this.reinstate) {
                    this.appFlowService.reinstateLastCompletedPaymentIndex$.next(3);
                } else {
                    this.appFlowService.lastCompletedPaymentIndex.next(3);
                    this.showBillingAddress = true;
                }
            }
        } else if (method === this.paymentType.CREDITCARD) {
            this.onCreditCardPaymentNext(method);
        } else if (method === this.paymentType.DEBITCARD) {
            this.apiError = false;
            this.debitCardForm.markAllAsTouched();
            if (this.selectedAccount === this.newCard && this.debitCardForm.valid) {
                const cardNumber = this.debitCardForm.value.cardNumber;
                const cardExpiryDate = this.debitCardForm.value.expirationDate;
                const index = this.getCardIndex(cardNumber, PaymentType.DEBITCARD, cardExpiryDate);
                if (index > -1) {
                    this.debitCardForm.controls.cardNumber.setErrors({
                        alreadyExist: true,
                    });
                } else {
                    const isValid = this.isValidCardNumber(cardNumber);
                    if (isValid) {
                        this.showSpinner = true;
                        this.callPaymetricService(method);
                    } else {
                        this.debitCardForm.controls.cardNumber.setErrors({ invalid: true });
                    }
                }
            } else if (this.selectedAccount !== this.newCard) {
                this.prePopulateBillingAddress();
            }
            if (this.reinstate) {
                this.appFlowService.reinstateLastCompletedPaymentIndex$.next(3);
            } else {
                this.appFlowService.lastCompletedPaymentIndex.next(3);
                this.showBillingAddress = true;
                this.showPayment = false;
            }
        }
    }
    /**
     * Opens bank draft prompt
     * @param editMode if true then open edit modal for bank draft else open iframe
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
            promptData.bankDraftDetails = this.bankAccounts[this.selectedIndex];
            this.empoweredModalService
                .openDialog(PaymentDetailsPromptComponent, {
                    data: promptData,
                })
                .afterClosed()
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((editedBankDraftData) => {
                    this.disableAddAccount = false;
                    if (editedBankDraftData) {
                        this.bankAccounts[this.selectedIndex] = editedBankDraftData;
                    }
                });
        } else {
            combineLatest([
                this.staticService.getConfigurations(TempusPaymentConfig.TEMPUS_IFRAME_URL, this.mpGroup),
                this.paymentService.getSession(PaymentType.BANKDRAFT),
            ])
                .pipe(
                    switchMap(([iframeURL, sessionData]) => {
                        promptData.tempusIframeURL = iframeURL[0].value;
                        promptData.tempusSessionObject = sessionData;
                        this.disableAddAccount = false;
                        return this.empoweredModalService.openDialog(PaymentDetailsPromptComponent, { data: promptData }).afterClosed();
                    }),
                    switchMap((repAddData) => {
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
                        return of(repAddData);
                    }),
                    filter((repAddData) => {
                        if (!repAddData && this.bankAccounts.length) {
                            this.selectedAccount = this.bankAccounts[this.selectedIndex].id.toString();
                        }
                        return repAddData;
                    }),
                    switchMap((repAddData) => {
                        this.showNoAccountError = !repAddData;
                        this.bankDraftTempusResponsePayload = repAddData;
                        return this.memberService.getPaymentMethods(this.memberId, this.mpGroup);
                    }),
                )
                .subscribe((payments) => {
                    if (payments) {
                        this.paymentMethods = payments;
                        this.mapPayments();
                        this.bankAccounts.sort((account1, account2) => account1.id - account2.id);
                        this.selectedIndex = this.bankAccounts.length - 1;
                        const selectedBankAccount = this.bankAccounts[this.selectedIndex];
                        this.routingNumberLastFourDigits = this.bankAccounts[this.selectedIndex].routingNumber.substring(
                            ROUTING_NUMBER_STARTING_INDEX,
                            ROUTING_NUMBER_ENDING_INDEX,
                        );
                        this.selectedAccount = selectedBankAccount?.id.toString();
                        this.paymentId = selectedBankAccount.id;
                        this.showMaskedAccountNumber = this.getMaskedAccountNumber(
                            this.bankAccounts[this.selectedIndex].accountNumberLastFour,
                        );
                    }
                });
        }
    }

    /**
     * This method is used to toggle showNoCardError and showNoAccountError when close icon is pressed on mon-alert
     * @returns void
     */
    closeNoPaymentInfoAlert(): void {
        if (this.selectedPaymentMethod === PaymentType.CREDITCARD) {
            this.showNoCardError = false;
        } else {
            this.showNoAccountError = false;
        }
    }

    /**
     * function to determine whether the card detail entered is duplicate or not
     * @cardNumber is card number entered by user
     * @type is paymentType selected
     * @cardExpiryDate is card expiry date entered
     * @returns number
     */
    getCardIndex(cardNumber: number, type: PaymentType, cardExpiryDate: Date): number {
        const lastFour = cardNumber.toString().substr(cardNumber.toString().length - 4);
        const expirationYear = cardExpiryDate.getFullYear();
        const expirationMonth = cardExpiryDate.getMonth() + 1;
        const cardAccount = type === PaymentType.CREDITCARD ? this.creditCardAccount : this.debitCardAccount;
        return cardAccount.findIndex(
            (card) => card.lastFour === lastFour && card.expirationYear === expirationYear && card.expirationMonth === expirationMonth,
        );
    }
    isValidCardNumber(cardNumber: string): boolean {
        let isValid = false;
        if (this.visaRegex.test(cardNumber)) {
            isValid = true;
            this.cardType = "VISA";
        } else if (this.masterCardRegex.test(cardNumber)) {
            isValid = true;
            this.cardType = "MASTERCARD";
        } else if (this.amexRegex.test(cardNumber)) {
            isValid = true;
            this.cardType = "AMERICANEXPRESS";
        }
        return isValid;
    }
    /**
     * This method is used to initialize the billing address form
     * @param firstName is first name of the member
     * @param lastName is last name of the member
     * @param mi is middle name of the member
     * @param suffix is suffix of the member
     * @param address1 is address1 detail of the member contact
     * @param address2 is address2 detail of the member contact
     * @param city is city of the member contact
     * @param state is state of the member contact
     * @param zip is zip of the member contact
     */
    initializeBillingAddressForm(
        firstName?: string,
        lastName?: string,
        mi?: string,
        suffix?: string,
        address1?: string,
        address2?: string,
        city?: string,
        state?: string,
        zip?: string,
    ): void {
        this.billingForm = this.fb.group({
            firstName: [firstName, [Validators.required, Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED)]],
            mi: [mi, [Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED)]],
            lastName: [lastName, [Validators.required, Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED)]],
            suffix: [suffix],
            address1: [address1, Validators.required],
            address2: [address2],
            city: [city, [Validators.required, Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED)]],
            state: [state, Validators.required],
            zip: [zip, [Validators.required, this.zipLength.bind(this), this.zipError.bind(this)]],
        });
        this.billingForm.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((change) => {
            if (this.reinstate) {
                this.appFlowService.reinstateLastCompletedPaymentIndex$.next(3);
            } else {
                this.appFlowService.lastCompletedPaymentIndex.next(3);
            }
        });
    }
    zipLength(control: FormControl): any {
        const value = control.value;
        if (value && value.length < 5) {
            return { length: true };
        }
        if (value && value.length < 9 && value.length !== 5) {
            return { length: true };
        }
    }
    zipError(): any {
        return this.zipApiError ? { zipError: true } : null;
    }

    /**
     * Toggles no payment method error when user
     * tries to navigate to billing page without
     * adding any payment method
     */
    toggleNoPaymentError(): void {
        this.showNoCardError = this.selectedAccount === this.newCard && !this.enableDebitCardBilling;
    }

    /**
     * Initializes billing form
     */
    initializeBillingForm(): void {
        if (
            !(
                this.enableDebitCardBilling ||
                this.sameAddress ||
                this.creditCardAccount[this.selectedIndex]?.sameAddressAsHome ||
                this.creditCardAccount[this.selectedIndex]?.billingName?.firstName
            )
        ) {
            if (!this.creditCardAccount[this.selectedIndex]?.billingName?.firstName && this.billingForm?.value.firstName) {
                this.billingForm.reset();
            }
            this.setBillingAddress();
        } else if (!this.sameAddress) {
            this.prePopulateBillingAddress();
        }
    }

    /**
     * To add a new account on click of add account from dropdown
     * @param method selected payment method
     */
    addNewAccount(method: PaymentType): void {
        if (!this.enableDebitCardBilling && this.selectedPaymentMethod === this.paymentType.CREDITCARD) {
            this.selectedAccount = this.newCard;
            this.openPaymentPrompt(this.editMode);
        } else if (!this.enablePaymetricBankDraft && this.selectedPaymentMethod === this.paymentType.BANKDRAFT) {
            // this flow will run when user click on add new account through dropdown
            this.selectedAccount = this.newBankAccount;
            this.openBankDraftPrompt();
        } else if (method === this.paymentType.BANKDRAFT) {
            this.selectedAccount = this.newBankAccount;
            this.initializeBankForm();
            this.initializeBillingAddressForm();
            this.initializeSettingForm();
            this.sameAddress = false;
            this.disableDropdown = false;
            if (this.reinstate) {
                this.appFlowService.reinstateLastCompletedPaymentIndex$.next(2);
            } else {
                this.appFlowService.lastCompletedPaymentIndex.next(2);
            }
        } else if (method === this.paymentType.CREDITCARD) {
            this.selectedAccount = this.newCard;
            this.initializeCreditForm();
            this.creditCardDatePicker.disabled = false;
            this.initializeBillingAddressForm();
            this.initializeSettingForm();
            this.sameAddress = false;
            this.disableDropdown = false;
            if (this.reinstate) {
                this.appFlowService.reinstateLastCompletedPaymentIndex$.next(2);
            } else {
                this.appFlowService.lastCompletedPaymentIndex.next(2);
            }
        } else if (method === this.paymentType.DEBITCARD) {
            this.selectedAccount = this.newCard;
            this.initializeDebitForm();
            this.debitCardDatePicker.disabled = false;
            this.initializeBillingAddressForm();
            this.initializeSettingForm();
            this.sameAddress = false;
            this.disableDropdown = false;
            if (this.reinstate) {
                this.appFlowService.reinstateLastCompletedPaymentIndex$.next(2);
            } else {
                this.appFlowService.lastCompletedPaymentIndex.next(2);
            }
        }
    }
    updateCheckbox(): boolean {
        let returnValue = false;
        if (this.sameAddress) {
            returnValue = true;
        } else if (this.selectedPaymentMethod === this.paymentType.BANKDRAFT && this.selectedAccount !== this.newBankAccount) {
            returnValue = this.bankAccounts[this.selectedIndex].sameAddressAsHome;
        } else if (this.selectedPaymentMethod === this.paymentType.CREDITCARD && this.selectedAccount !== this.newCard) {
            returnValue = this.creditCardAccount[this.selectedIndex].sameAddressAsHome;
        } else if (this.selectedPaymentMethod === this.paymentType.DEBITCARD && this.selectedAccount !== this.newCard) {
            returnValue = this.debitCardAccount[this.selectedIndex].sameAddressAsHome;
        }
        return returnValue;
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
     * this method is used to get the string with leading zeroes if the expiration month is in between 1 to 9 else
     * will return the expiration date without change
     * @param cardData credit card data
     * @returns return string with leading zeroes on expiration month
     */
    getExpirationDate(cardData: AddPayment): string {
        return (
            this.utilService.getStringWithLeadingZeroes(cardData?.expirationMonth?.toString(), TOTAL_DIGIT_COUNT) +
            "/" +
            cardData?.expirationYear
        );
    }

    /**
     * This function is used to pre-populate the account details during initialization based on the payment method
     * @param method is the mode of Payment(Bank Draft or Credit Card or Debit Card)
     * @param index is the selected index
     */
    prePopulateAccount(method: PaymentType, index: number): void {
        this.selectedIndex = index;
        this.appFlowService.selectedPaymentIndex = index;
        this.apiError = false;
        this.disableSameAddress = this.selectedPaymentMethod !== this.providedPaymentMethod ? true : false;
        if (method === this.paymentType.BANKDRAFT) {
            this.routingNumberLastFourDigits = this.bankAccounts[index].routingNumber.substring(
                ROUTING_NUMBER_STARTING_INDEX,
                ROUTING_NUMBER_ENDING_INDEX,
            );
            if (!this.enablePaymetricBankDraft) {
                this.showMaskedAccountNumber = this.getMaskedAccountNumber(this.bankAccounts[index].accountNumberLastFour);
            }
            this.initializeBankForm(
                this.bankAccounts[index].accountName,
                this.bankAccounts[index].bankName,
                "********" + this.bankAccounts[index].routingNumber,
                "********" + this.bankAccounts[index].accountNumberLastFour,
                this.bankAccounts[index].accountType,
            );
            this.bankDraftForm.controls.accountName.disable();
            this.bankDraftForm.controls.bankName.disable();
            this.bankDraftForm.controls.routingNumber.disable();
            this.bankDraftForm.controls.accountNumber.disable();
            this.bankDraftForm.controls.reAccountNumber.disable();
            this.disableDropdown = true;
            this.selectedAccount = this.enablePaymetricBankDraft
                ? this.bankAccounts[index].accountName
                : this.bankAccounts[this.selectedIndex]?.id.toString();
            this.paymentId = this.bankAccounts[this.selectedIndex].id;
        } else if (method === this.paymentType.CREDITCARD) {
            const expirationDate = new Date();
            this.creditCardExpirationDate = this.getExpirationDate(this.creditCardAccount[index]);
            if (!this.enableDebitCardBilling) {
                this.isCardNotExpired = this.checkFutureDate(this.creditCardAccount[index]);
            }
            expirationDate.setMonth(this.creditCardAccount[index].expirationMonth - 1);
            expirationDate.setFullYear(this.creditCardAccount[index].expirationYear);
            this.initializeCreditForm("*".repeat(12) + this.creditCardAccount[index].lastFour, expirationDate);
            this.creditCardForm.controls.cardNumber.disable();
            this.creditCardForm.controls.expirationDate.disable();
            this.paymentId = this.creditCardAccount[this.selectedIndex].id;
            this.disableDropdown = true;
            this.selectedAccount = this.creditCardAccount[index].lastFour;
            if (this.creditCardDatePicker) {
                this.creditCardDatePicker.disabled = true;
            }
        } else if (method === this.paymentType.DEBITCARD) {
            const expirationDate = new Date();
            expirationDate.setMonth(this.debitCardAccount[index].expirationMonth - 1);
            expirationDate.setFullYear(this.debitCardAccount[index].expirationYear);
            this.initializeDebitForm("*".repeat(12) + this.debitCardAccount[index].lastFour, expirationDate);
            this.debitCardForm.controls.cardNumber.disable();
            this.debitCardForm.controls.expirationDate.disable();
            this.paymentId = this.debitCardAccount[this.selectedIndex].id;
            this.disableDropdown = true;
            this.selectedAccount = this.debitCardAccount[index].lastFour;
            if (this.debitCardDatePicker) {
                this.debitCardDatePicker.disabled = true;
            }
        }
    }
    prePopulateBillingAddress(): void {
        if (this.selectedPaymentMethod === PaymentType.BANKDRAFT) {
            this.initializeBillingAddressForm(
                this.bankAccounts[this.selectedIndex].billingName
                    ? this.bankAccounts[this.selectedIndex].billingName.firstName
                    : this.memberInfo.body.name.firstName,
                this.bankAccounts[this.selectedIndex].billingName
                    ? this.bankAccounts[this.selectedIndex].billingName.lastName
                    : this.memberInfo.body.name.lastName,
                this.bankAccounts[this.selectedIndex].billingName
                    ? this.bankAccounts[this.selectedIndex].billingName.middleName
                    : this.memberInfo.body.name.middleName,
                this.bankAccounts[this.selectedIndex].billingName
                    ? this.bankAccounts[this.selectedIndex].billingName.suffix
                    : this.memberInfo.body.name.suffix,
                this.bankAccounts[this.selectedIndex].billingAddress.address1,
                this.bankAccounts[this.selectedIndex].billingAddress.address2,
                this.bankAccounts[this.selectedIndex].billingAddress.city,
                this.bankAccounts[this.selectedIndex].billingAddress.state,
                this.bankAccounts[this.selectedIndex].billingAddress.zip,
            );
        } else if (this.selectedPaymentMethod === PaymentType.CREDITCARD) {
            this.initializeBillingAddressForm(
                this.creditCardAccount[this.selectedIndex].billingName
                    ? this.creditCardAccount[this.selectedIndex].billingName.firstName
                    : this.memberInfo.body.name.firstName,
                this.creditCardAccount[this.selectedIndex].billingName
                    ? this.creditCardAccount[this.selectedIndex].billingName.lastName
                    : this.memberInfo.body.name.lastName,
                this.creditCardAccount[this.selectedIndex].billingName
                    ? this.creditCardAccount[this.selectedIndex].billingName.middleName
                    : this.memberInfo.body.name.middleName,
                this.creditCardAccount[this.selectedIndex].billingName
                    ? this.creditCardAccount[this.selectedIndex].billingName.suffix
                    : this.memberInfo.body.name.suffix,
                this.creditCardAccount[this.selectedIndex].billingAddress.address1,
                this.creditCardAccount[this.selectedIndex].billingAddress.address2,
                this.creditCardAccount[this.selectedIndex].billingAddress.city,
                this.creditCardAccount[this.selectedIndex].billingAddress.state,
                this.creditCardAccount[this.selectedIndex].billingAddress.zip,
            );
        } else if (this.selectedPaymentMethod === PaymentType.DEBITCARD) {
            this.initializeBillingAddressForm(
                this.debitCardAccount[this.selectedIndex].billingName
                    ? this.debitCardAccount[this.selectedIndex].billingName.firstName
                    : this.memberInfo.body.name.firstName,
                this.debitCardAccount[this.selectedIndex].billingName
                    ? this.debitCardAccount[this.selectedIndex].billingName.lastName
                    : this.memberInfo.body.name.lastName,
                this.debitCardAccount[this.selectedIndex].billingName
                    ? this.debitCardAccount[this.selectedIndex].billingName.middleName
                    : this.memberInfo.body.name.middleName,
                this.debitCardAccount[this.selectedIndex].billingName
                    ? this.debitCardAccount[this.selectedIndex].billingName.suffix
                    : this.memberInfo.body.name.suffix,
                this.debitCardAccount[this.selectedIndex].billingAddress.address1,
                this.debitCardAccount[this.selectedIndex].billingAddress.address2,
                this.debitCardAccount[this.selectedIndex].billingAddress.city,
                this.debitCardAccount[this.selectedIndex].billingAddress.state,
                this.debitCardAccount[this.selectedIndex].billingAddress.zip,
            );
        }
        if (this.selectedPaymentMethod !== this.providedPaymentMethod || this.updateCheckbox()) {
            this.billingForm.controls.firstName.disable();
            this.billingForm.controls.lastName.disable();
            this.billingForm.controls.mi.disable();
            this.billingForm.controls.address1.disable();
            this.billingForm.controls.address2.disable();
            this.billingForm.controls.city.disable();
            this.billingForm.controls.zip.disable();
        } else {
            this.disableSameAddress = this.providedPaymentMethod ? false : true;
            this.sameAddress = false;
            this.disableDropdown = false;
        }
    }
    /**
     * This method is used to update the address of the member during the payment method
     * This method will initialize billing form and pre-populates address values if user selects same address checkbox
     * @param event is MatCheckbox event which says whether user click on same address checkbox or not
     */
    updateAddress(event: MatCheckbox): void {
        this.sameAddress = event.checked;
        this.appFlowService.paymentMethod$.next(this.selectedPaymentMethod);
        if (this.sameAddress) {
            const memberHomeContactDetails: MemberContact = this.utilService
                .copy(this.memberContact)
                .filter((eachContact: MemberContact) => eachContact.contactType === ContactType.HOME)
                .pop();
            this.initializeBillingAddressForm(
                this.memberInfo.body.name.firstName,
                this.memberInfo.body.name.lastName,
                this.memberInfo.body.name.middleName,
                this.memberInfo.body.name.suffix,
                memberHomeContactDetails.address.address1,
                memberHomeContactDetails.address.address2,
                memberHomeContactDetails.address.city,
                memberHomeContactDetails.address.state,
                memberHomeContactDetails.address.zip,
            );
            this.billingForm.controls.firstName.disable();
            this.billingForm.controls.lastName.disable();
            this.billingForm.controls.mi.disable();
            this.billingForm.controls.address1.disable();
            this.billingForm.controls.address2.disable();
            this.billingForm.controls.city.disable();
            this.billingForm.controls.zip.disable();
        } else {
            this.disableDropdown = false;
            this.initializeBillingAddressForm();
        }
    }
    /**
     * This method is used to check whether state is added and new card is selected or not
     * @returns boolean indicating card selected is new or state is added
     */
    checkIfNewCardAndStateAdded(): boolean {
        return (
            this.selectedAccount === this.newBankAccount ||
            this.selectedAccount === this.newCard ||
            (this.tempusPaymentConfig &&
                this.selectedPaymentMethod === PaymentType.CREDITCARD &&
                !this.creditCardAccount[this.selectedIndex]?.billingName?.firstName) ||
            (this.bankDraftTempusConfig &&
                this.selectedPaymentMethod === PaymentType.BANKDRAFT &&
                !this.bankAccounts[this.selectedIndex]?.billingName?.firstName)
        );
    }

    /**
     * This method will be called after filling address information and clicking on next button
     * also this method is use to validate zip code
     * @return void
     */
    onBillingNext(): void {
        this.billingForm.markAllAsTouched();
        if (
            this.billingForm.valid &&
            (this.selectedPaymentMethod === this.paymentType.BANKDRAFT ||
                this.selectedPaymentMethod === this.paymentType.CREDITCARD ||
                this.selectedPaymentMethod === this.paymentType.DEBITCARD)
        ) {
            if (this.checkIfNewCardAndStateAdded()) {
                this.validateStateZip();
            } else {
                this.patchValues();
            }
            if (this.isAflacAlwaysQuasiModal) {
                // initates loader in aflac always quasi modal
                this.appFlowService.lastCompletedPaymentIndex.next(0);
                this.saveAflacAlwaysQuasi();
            }
        }
    }
    patchValues(): void {
        this.showBillingAddress = false;
        this.showSettingForm = true;
        if (this.applicationResp.length && this.applicationResp[2].aflacAlways) {
            this.initializeSettingForm(
                this.applicationResp[2].aflacAlways.payFrequency,
                this.applicationResp[2].aflacAlways.firstPaymentDay,
            );
        } else {
            this.initializeSettingForm();
        }
        if (this.reinstate) {
            this.appFlowService.reinstateLastCompletedPaymentIndex$.next(4);
        } else if (!this.isAflacAlwaysQuasiModal) {
            this.appFlowService.lastCompletedPaymentIndex.next(4);
        }
    }
    validateStateZip(): void {
        const state = this.billingForm.controls.state.value;
        const zip = this.billingForm.controls.zip.value;
        this.apiError = false;
        if (this.checkIfNewCardAndStateAdded()) {
            this.showSpinner = true;
            this.staticService
                .validateStateZip(state, zip.toString())
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    () => {
                        this.showSpinner = false;
                        this.showBillingAddress = false;
                        this.showSettingForm = true;
                        if (!this.settingForm) {
                            this.initializeSettingForm();
                        }
                        if (this.reinstate) {
                            this.appFlowService.reinstateLastCompletedPaymentIndex$.next(4);
                        } else if (!this.isAflacAlwaysQuasiModal) {
                            this.appFlowService.lastCompletedPaymentIndex.next(4);
                        }
                    },
                    () => {
                        this.zipApiError = true;
                        this.billingForm.controls.zip.updateValueAndValidity();
                        this.showSpinner = false;
                    },
                );
        }
    }
    validateRoutingNumber(): any {
        return this.routingApiError ? { invalid: true } : null;
    }
    validateCreditCardNumber(): any {
        return this.creditCardApiError ? { invalid: true } : null;
    }
    validateDebitCardNumber(): any {
        return this.debitCardApiError ? { invalid: true } : null;
    }

    // Delete Credit Card
    deleteAccount(): void {
        this.selectedRadio = this.paymentMethodForm.controls[this.METHOD].value;
        this.filterPaymentMethod();
        const addressDialog = this.empoweredModalService.openDialog(EditDeletePaymentComponent, {
            data: {
                selectedIndex: this.dropdownData[this.selectedIndex],
                selectedPaymentMethod: this.selectedRadio,
                delete: true,
                mpGroup: this.mpGroup,
                memberId: this.memberId,
                isACHPartnerAccountType: this.isACHPartnerAccountType,
            },
        });
        addressDialog
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                () => {
                    this.memberService.getPaymentMethods(this.memberId, this.mpGroup).subscribe((paymentData) => {
                        this.paymentMethods = paymentData;
                        if (this.selectedRadio === PaymentType.BANKDRAFT) {
                            this.bankAccounts = [];
                        } else if (this.selectedRadio === PaymentType.CREDITCARD) {
                            this.creditCardAccount = [];
                            this.isCardNotExpired = true;
                        } else if (this.selectedRadio === PaymentType.DEBITCARD) {
                            this.debitCardAccount = [];
                        }
                        this.mapPayments();
                        this.initializePaymentForm();
                        this.selectedIndex = 0;
                    });
                },
                (err) => {
                    this.apiError = true;
                    this.apiErrorMessageDisplay(err);
                },
            );
        this.disableSameAddress = false;
    }
    /**
     * The method contains the display message for API Error
     * @param err The argument passed inside the error block of API subscription
     */
    apiErrorMessageDisplay(err: Error): void {
        const error = err["error"];
        this.apiError = true;
        this.language.fetchSecondaryLanguageValue(`secondary.api.${error["status"]}.${error["code"]}`);
    }
    /**
     * The method is used to filter out the various payment methods (Bank draft, credit card and debit card)
     */
    filterPaymentMethod(): void {
        this.dropdownData = [];
        if (this.selectedRadio === PaymentType.BANKDRAFT) {
            this.dropdownData = this.bankAccounts;
        } else if (this.selectedRadio === PaymentType.CREDITCARD) {
            this.dropdownData = this.creditCardAccount;
        } else if (this.selectedRadio === PaymentType.DEBITCARD) {
            this.dropdownData = this.debitCardAccount;
        }
    }

    saveBankDraft(): void {
        const payload: AddPayment = {
            accountName: this.bankDraftForm.controls.accountName.value,
            paymentType: this.paymentType.BANKDRAFT,
            accountType: this.bankDraftForm.controls.accountType.value,
            accountNumber: this.bankDraftForm.controls.accountNumber.value,
            routingNumber: this.bankDraftForm.controls.routingNumber.value,
            bankName: this.bankDraftForm.controls.bankName.value,
        };
        const billingAddress: BillingAddress = {
            address1: this.billingForm.controls.address1.value,
            address2: this.billingForm.controls.address2.value,
            city: this.billingForm.controls.city.value,
            state: this.billingForm.controls.state.value,
            zip: this.billingForm.controls.zip.value,
        };
        const billingName: BillingNameSchema = {
            firstName: this.billingForm.controls.firstName.value,
            lastName: this.billingForm.controls.lastName.value,
        };
        if (this.billingForm.controls.mi.value) {
            billingName.middleName = this.billingForm.controls.mi.value;
        }
        if (this.billingForm.controls.suffix.value) {
            billingName.suffix = this.billingForm.controls.suffix.value;
        }
        payload.billingName = billingName;
        if (this.sameAddress) {
            payload.sameAddressAsHome = true;
        } else {
            payload.billingAddress = billingAddress;
        }
        this.memberService
            .addPaymentMethod(this.memberId, this.mpGroup, payload, true)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (data: any) => {
                    if (this.selectedAccount === this.newBankAccount) {
                        const location = data.headers.get("location").split("/")[7];
                        const id = location.split("?")[0];
                        this.paymentId = parseInt(id, 10);
                    }
                    this.saveAflacResponse();
                },
                (error) => {
                    this.showSpinner = false;
                    this.apiError = true;
                    const errors = error.error.details !== undefined ? error.error.details : error.error.status;

                    if (errors.length && errors[0].field === "routingNumber") {
                        this.routingApiError = true;
                        this.validateRoutingNumber();
                        this.bankDraftForm.controls.routingNumber.updateValueAndValidity();
                        this.apiErrorMessage = errors[0].message;
                    } else if (error.error.status === 409) {
                        this.apiErrorMessage = this.languageStrings["primary.portal.applicationFlow.payments.duplicatepayment"];
                    } else if (errors.length && errors[0].field && errors[0].message) {
                        const errorMsg = this.capitalize(errors[0].field) + " " + errors[0].message;
                        this.apiErrorMessage = errorMsg;
                    } else {
                        this.apiErrorMessage = error.error.message;
                    }
                },
            );
    }
    /**
     * @description initializing setting form on condition to show pin or initials
     * @param freq as frequency
     * @param date as date
     * @returns void
     */
    initializeSettingForm(freq?: string, date?: string): void {
        if (this.showPin) {
            this.callCenterPin = this.appFlowService.getcallCenterPin();
            if (this.callCenterPin && this.callCenterPin.length) {
                this.pinDisableFlag = true;
            }
            this.settingForm = this.fb.group({
                frequency: [freq ? freq : this.paymentFrequeny[0]],
                date: [date, [Validators.required, Validators.min(1), Validators.max(28)]],
                agree: [null, Validators.required],
                initials: [
                    this.callCenterPin && this.callCenterPin.length > 0 ? this.callCenterPin : null,
                    [
                        Validators.required,
                        Validators.maxLength(25),
                        Validators.minLength(3),
                        Validators.pattern(this.validationRegex.ALPHANUMERIC_WITH_UNDERSCORE),
                    ],
                ],
            });
        } else {
            this.settingForm = this.fb.group({
                frequency: [freq ? freq : this.paymentFrequeny[0]],
                date: [date, [Validators.required, Validators.min(1), Validators.max(28)]],
                agree: [null, Validators.required],
                initials: [
                    null,
                    this.isHeadset || this.isVf2f
                        ? []
                        : [Validators.required, Validators.pattern(this.validationRegex.ALPHA), Validators.minLength(2)],
                ],
            });
        }
        if (this.isHeadset || this.isVf2f) {
            this.settingForm.controls.initials.disable();
        }
    }
    /**
     * This method saves bank details,responses and sets pin
     */
    saveAflacAlways(): void {
        if (this.settingForm.controls.agree.value && this.settingForm.valid) {
            if (this.showPin && this.settingForm.controls.initials.value) {
                this.appFlowService.setcallCenterPin(this.settingForm.controls.initials.value);
            }
            this.agreeCheckbox = false;
            this.apiError = false;
            this.disableNextButton = true;
            const billingName = this.fetchBillingName();
            const billingAddress = this.fetchBillingAddress();

            // Start - EVE-992 - Added for PNC iFrame
            if (!this.enableDebitCardBilling && this.selectedPaymentMethod === this.paymentType.CREDITCARD) {
                this.tempusResponsePayload = this.creditCardAccount[this.selectedIndex];
                this.tempusResponsePayload.tokens = [{ carrierId: CarrierId.AFLAC, token: "" }];

                if (this.sameAddress) {
                    this.tempusResponsePayload.sameAddressAsHome = true;
                } else {
                    this.tempusResponsePayload.billingAddress = billingAddress;
                }
                this.tempusResponsePayload.billingName = billingName;

                this.memberService
                    .updatePaymentMethod(
                        this.memberId,
                        this.mpGroup,
                        this.tempusResponsePayload,
                        this.creditCardAccount[this.selectedIndex].id,
                    )
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        () => this.saveAflacResponse(),
                        () => (this.disableNextButton = false),
                    );
                return;
            }
            // End - EVE-992 - Added for PNC iFrame
            if (!this.enablePaymetricBankDraft && this.selectedPaymentMethod === this.paymentType.BANKDRAFT) {
                this.bankDraftTempusResponsePayload = this.bankAccounts[this.selectedIndex];
                this.bankDraftTempusResponsePayload.accountNumber = this.bankDraftTempusResponsePayload?.accountNumberLastFour;
                delete this.bankDraftTempusResponsePayload["accountNumberLastFour"];
                this.bankDraftTempusResponsePayload.tokens = [{ carrierId: CarrierId.AFLAC, token: "" }];

                if (this.sameAddress) {
                    this.bankDraftTempusResponsePayload.sameAddressAsHome = true;
                    delete this.bankDraftTempusResponsePayload.billingAddress;
                } else {
                    this.bankDraftTempusResponsePayload.billingAddress = billingAddress;
                }
                this.bankDraftTempusResponsePayload.billingName = billingName;

                this.memberService
                    .updatePaymentMethod(
                        this.memberId,
                        this.mpGroup,
                        this.bankDraftTempusResponsePayload,
                        this.bankAccounts[this.selectedIndex].id,
                    )
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        () => {
                            this.paymentId = this.bankAccounts[this.selectedIndex]?.id;
                            this.saveAflacResponse();
                        },
                        () => (this.disableNextButton = false),
                    );
                return;
            }
            this.disableNextButton = false;
            if (this.selectedAccount === this.newBankAccount || this.selectedAccount === this.newCard) {
                this.showSpinner = true;
                if (this.selectedPaymentMethod === this.paymentType.BANKDRAFT) {
                    this.saveBankDraft();
                } else if (this.selectedPaymentMethod === this.paymentType.CREDITCARD) {
                    this.saveCreditCard();
                } else if (this.selectedPaymentMethod === this.paymentType.DEBITCARD) {
                    this.saveDebitCard();
                }
            } else {
                this.saveAflacResponse();
            }
        } else {
            this.agreeCheckbox = true;
            this.disableNextButton = false;
        }
    }

    saveAflacAlwaysQuasi(): void {
        const billingName = this.fetchBillingName();
        const billingAddress = this.fetchBillingAddress();
        this.appFlowService.setSelectedPaymentType(this.selectedPaymentMethod);
        // Start - EVE-992 - Added for PNC iFrame
        if (!this.enableDebitCardBilling && this.selectedPaymentMethod === this.paymentType.CREDITCARD) {
            this.tempusResponsePayload = this.creditCardAccount[this.selectedIndex];
            this.tempusResponsePayload.tokens = [{ carrierId: CarrierId.AFLAC, token: "" }];

            if (this.sameAddress) {
                this.tempusResponsePayload.sameAddressAsHome = true;
            } else {
                this.tempusResponsePayload.billingAddress = billingAddress;
            }
            this.tempusResponsePayload.billingName = billingName;

            this.memberService
                .updatePaymentMethod(this.memberId, this.mpGroup, this.tempusResponsePayload, this.creditCardAccount[this.selectedIndex].id)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(() => {
                    this.appFlowService.setPaymentIdForAflacAlwaysQuasiModal(this.paymentId);
                    this.appFlowService.lastCompletedPaymentIndex.next(4);
                });
        }
        // End - EVE-992 - Added for PNC iFrame
        if (!this.enablePaymetricBankDraft && this.selectedPaymentMethod === this.paymentType.BANKDRAFT) {
            this.bankDraftTempusResponsePayload = this.bankAccounts[this.selectedIndex];
            this.bankDraftTempusResponsePayload.accountNumber = this.bankDraftTempusResponsePayload?.accountNumberLastFour;
            delete this.bankDraftTempusResponsePayload["accountNumberLastFour"];
            this.bankDraftTempusResponsePayload.tokens = [{ carrierId: CarrierId.AFLAC, token: "" }];

            if (this.sameAddress) {
                this.bankDraftTempusResponsePayload.sameAddressAsHome = true;
                delete this.bankDraftTempusResponsePayload.billingAddress;
            } else {
                this.bankDraftTempusResponsePayload.billingAddress = billingAddress;
            }
            this.bankDraftTempusResponsePayload.billingName = billingName;

            this.memberService
                .updatePaymentMethod(
                    this.memberId,
                    this.mpGroup,
                    this.bankDraftTempusResponsePayload,
                    this.bankAccounts[this.selectedIndex].id,
                )
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    () => {
                        this.paymentId = this.bankAccounts[this.selectedIndex]?.id;
                        this.appFlowService.setPaymentIdForAflacAlwaysQuasiModal(this.paymentId);
                        this.appFlowService.lastCompletedPaymentIndex.next(4);
                    },
                    () => (this.disableNextButton = false),
                );
        }
    }
    saveQuestion(): void {
        this.showSpinner = true;
        const enrollObservables = [];
        this.aflacSteps.forEach((data) => {
            if (this.isEnrolled === AppSettings.NO || this.isEnrolled === AppSettings.YES) {
                const schema: ApplicationResponse = {
                    stepId: data.steps[0].id,
                    value: [this.isEnrolled],
                    key: data.steps[0].question.key,
                    type: StepType.QUESTION,
                    planQuestionId: data.steps[0].question.id,
                };
                enrollObservables.push(
                    this.shoppingCartService.saveApplicationResponse(this.memberId, data.itemId, this.mpGroup, [schema]),
                );
            } else {
                const firstSchema: ApplicationResponse = {
                    stepId: data.steps[0].id,
                    value: [this.isEnrolled],
                    key: data.steps[0].question.key,
                    type: StepType.QUESTION,
                    planQuestionId: data.steps[0].question.id,
                };
                const secondSchema: ApplicationResponse = {
                    stepId: data.steps[1].id,
                    value: [this.enrollForm.value.contact],
                    key: data.steps[1].question.key,
                    type: StepType.QUESTION,
                    planQuestionId: data.steps[1].question.id,
                };
                enrollObservables.push(
                    this.shoppingCartService.saveApplicationResponse(this.memberId, data.itemId, this.mpGroup, [firstSchema, secondSchema]),
                );
            }
        });
        forkJoin(enrollObservables)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                () => {
                    this.store
                        .dispatch(new UpdateApplicationResponse(this.memberId, this.cartId, this.mpGroup))
                        .pipe(takeUntil(this.unsubscribe$))
                        .subscribe(
                            () => {
                                this.showSpinner = false;
                                this.disableNextButton = false;
                                this.nextStep();
                            },
                            () => {
                                this.showSpinner = false;
                                this.disableNextButton = false;
                                this.apiError = true;
                                this.apiErrorMessage = this.languageSecondStringsArray["secondary.portal.common.errorResponse"];
                            },
                        );
                },
                () => {
                    this.showSpinner = false;
                    this.disableNextButton = false;
                    this.apiError = true;
                    this.apiErrorMessage = this.languageSecondStringsArray["secondary.portal.common.errorSaving"];
                },
            );
    }

    /**
     * This method saves aflac responses.
     */
    saveAflacResponse(): void {
        this.showSpinner = true;
        const aflacAlwaysObservables = [];
        this.aflacSteps.forEach((data) => {
            const value = [];
            const payload = {
                payFrequency: this.settingForm.value.frequency,
                subscriberPaymentId: this.paymentId,
                firstPaymentDay: this.settingForm.value.date,
                initial: this.isHeadset || this.isVf2f ? this.customerInitial : this.settingForm.value.initials,
            };
            value.push(payload);
            const schema: ApplicationResponse = {
                stepId: data.steps[3].id,
                value: value,
                type: StepType.AFLACALWAYSCAPS,
            };
            aflacAlwaysObservables.push(
                this.shoppingCartService.saveApplicationResponse(this.memberId, data.itemId, this.mpGroup, [schema]),
            );
        });
        forkJoin(aflacAlwaysObservables)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                () => {
                    this.saveQuestion();
                },
                () => {
                    this.showSpinner = false;
                    this.disableNextButton = false;
                    this.apiError = true;
                    this.apiErrorMessage = this.languageSecondStringsArray["secondary.portal.common.errorSaving"];
                },
            );
    }
    nextStep(): void {
        if (this.reinstate) {
            this.appFlowService.reinstateLastCompleteStaticStep$.next(1);
        } else {
            this.appFlowService.planChanged$.next({
                nextClicked: true,
                discard: false,
            });
            const isEBSAccount = this.store.selectSnapshot(EnrollmentState.GetEBSPayment)?.isEBSAccount;
            if (isEBSAccount) {
                this.appFlowService.lastCompleteStaticStep.next(3);
            } else {
                this.appFlowService.lastCompleteStaticStep.next(2);
            }
        }
    }
    getApplicationResponse(): void {
        const appResponse = this.store.selectSnapshot(EnrollmentState.GetResponseItems);
        let prePopulateData;
        this.aflacSteps.forEach((data) => {
            if (!this.applicationResp.length) {
                const resp = appResponse.filter((item) => item.planId === data.planId).pop();
                if (resp) {
                    prePopulateData = resp.response.filter((res) => res.planQuestionId === 40241).pop();
                    if (prePopulateData) {
                        const enrollValue = prePopulateData.value[0];
                        const contact = resp.response.filter((res) => res.planQuestionId === 40244).pop();
                        const conatactValue = contact ? contact.value[0] : null;
                        const frequency = resp.response.filter((res) => res.type === StepType.AFLACALWAYSCAPS).pop();
                        const frequencyValue = frequency ? frequency.value[0] : null;
                        this.applicationResp.push(
                            { questionId: 40241, value: enrollValue },
                            { questionId: 40244, value: conatactValue },
                            { aflacAlways: frequencyValue },
                        );
                    }
                }
            }
        });
        if (this.applicationResp.length) {
            this.initializeEnrollForm(this.applicationResp[0].value);
            this.isEnrolled = this.applicationResp[0].value;
            this.onNextTPI(this.isEnrolled);
            if (this.applicationResp[1].value && this.isEnrolled === AppSettings.CONTACT_LATER) {
                this.email = this.applicationResp[1].value;
                this.enrollForm.addControl("contact", this.addContactControl());
            }
            if (this.applicationResp[2].aflacAlways) {
                const id = this.applicationResp[2].aflacAlways.subscriberPaymentId;
                if (this.paymentMethods.length) {
                    this.savedPaymentIdIndex = this.paymentMethods.findIndex((idx) => idx.id === id);
                    const selectedPayment = this.paymentMethods[this.savedPaymentIdIndex].paymentType;
                    // when pnc config is on then selected Payment should either be bank draft or credit card in case of edit coverage
                    if (this.tempusPaymentConfig) {
                        this.selectedPaymentMethod =
                            selectedPayment === PaymentType.BANKDRAFT ? PaymentType.BANKDRAFT : PaymentType.CREDITCARD;
                    } else {
                        this.selectedPaymentMethod = selectedPayment;
                    }
                }
            }
        }
    }
    initializePaymentMethodForm(): void {
        if (this.isAflacAlwaysQuasiModal) {
            this.selectedPaymentMethod = this.appFlowService.selectedPaymentMethod;
        }
        this.paymentMethodForm = this.fb.group({
            method: [this.selectedPaymentMethod ? this.selectedPaymentMethod : PaymentType.BANKDRAFT],
        });
    }
    validateBankName(event: any): boolean {
        return event.charCode === 8 ||
            event.charCode === 45 ||
            event.charCode === 39 ||
            (event.charCode === 32 && this.bankDraftForm.controls.bankName.value) ||
            event.charCode === 0
            ? null
            : (event.charCode >= 48 && event.charCode <= 57) ||
                  (event.charCode >= 65 && event.charCode <= 90) ||
                  (event.charCode >= 97 && event.charCode <= 122);
    }
    /**
     * This function removes all trailing and leading spaces from the Bank Name field value.
     */
    removeSpaces(): void {
        this.bankDraftForm.controls.bankName.setValue(this.bankDraftForm.controls.bankName.value.trim());
    }
    onBack(): void {
        this.appFlowService.planChanged$.next({
            nextClicked: false,
            discard: false,
        });
    }
    capitalize(message: string): string {
        return message.charAt(0).toUpperCase() + message.slice(1);
    }

    /**
     * Opens payment prompt with tempus iframe to Enter credit/debit card data
     */
    openPaymentPrompt(editMode: boolean): void {
        this.disableAddCard = true;
        const promptData = {} as PaymentPromptDataModel;
        promptData.memberId = this.memberId;
        promptData.mpGroup = this.mpGroup;

        if (editMode) {
            promptData.editModal = editMode;
            promptData.creditCardDetails = this.creditCardAccount[this.selectedIndex];
            this.empoweredModalService
                .openDialog(PaymentDetailsPromptComponent, {
                    data: promptData,
                })
                .afterClosed()
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((editedCreditCardData) => {
                    this.disableAddCard = false;
                    if (editedCreditCardData) {
                        this.creditCardExpirationDate = this.getExpirationDate(editedCreditCardData);
                        this.isCardNotExpired = this.checkFutureDate(editedCreditCardData);
                        this.creditCardAccount[this.selectedIndex] = editedCreditCardData;
                    }
                });
        } else {
            combineLatest([
                this.staticService.getConfigurations(TempusPaymentConfig.TEMPUS_IFRAME_URL, this.mpGroup),
                this.paymentService.getSession(),
            ])
                .pipe(
                    switchMap(([iframeURL, sessionData]) => {
                        promptData.tempusIframeURL = iframeURL[0].value;
                        promptData.tempusSessionObject = sessionData;
                        this.disableAddCard = false;
                        return this.empoweredModalService
                            .openDialog(PaymentDetailsPromptComponent, {
                                data: promptData,
                            })
                            .afterClosed();
                    }),
                    switchMap((repAddData) => {
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
                        return of(repAddData);
                    }),
                    filter((repAddData) => {
                        if (!repAddData && this.creditCardAccount.length) {
                            this.selectedAccount = this.creditCardAccount[this.selectedIndex].lastFour;
                        }
                        return repAddData;
                    }),
                    switchMap((repAddData) => {
                        this.tempusResponsePayload = repAddData;
                        this.showNoCardError = !this.tempusResponsePayload;
                        this.isCardNotExpired = true;
                        return this.memberService.getPaymentMethods(this.memberId, this.mpGroup);
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe((paymentMethods) => {
                    if (paymentMethods) {
                        this.paymentMethods = paymentMethods;
                        this.mapPayments();
                        this.creditCardAccount.sort((card1, card2) => card1.id - card2.id);
                        this.selectedIndex = this.creditCardAccount.length - 1;
                        this.appFlowService.selectedPaymentIndex = this.selectedIndex;
                        this.selectedAccount = this.creditCardAccount[this.selectedIndex]?.lastFour;
                        this.paymentId = this.creditCardAccount[this.selectedIndex].id;
                        this.creditCardExpirationDate = this.getExpirationDate(this.creditCardAccount[this.selectedIndex]);
                    }
                });
        }
        this.editMode = false;
    }

    /**
     * The method is used to update the year to the datepicker
     * @param normalizedYear Selected year
     * @param type Payment type
     */
    chosenYearHandler(normalizedYear: Date, type: PaymentType): void {
        if (type === PaymentType.CREDITCARD) {
            this.creditCardForm.controls.cardNumber.setErrors(null);
            const ctrlValue = this.dateService.toDate(this.creditCardForm.value.expirationDate);
            ctrlValue.setFullYear(normalizedYear.getFullYear());
            this.creditCardForm.controls.expirationDate.setValue(ctrlValue);
        } else if (type === PaymentType.DEBITCARD) {
            this.debitCardForm.controls.cardNumber.setErrors(null);
            const ctrlValue = this.dateService.toDate(this.debitCardForm.value.expirationDate);
            ctrlValue.setFullYear(normalizedYear.getFullYear());
            this.debitCardForm.controls.expirationDate.setValue(ctrlValue);
        }
    }

    chosenMonthHandler(normalizedMonth: Date, datepicker: MatDatepicker<Date>, type: PaymentType): void {
        if (type === PaymentType.CREDITCARD) {
            const ctrlValue = this.dateService.toDate(this.creditCardForm.value.expirationDate);
            ctrlValue.setMonth(normalizedMonth.getMonth());
            this.creditCardForm.controls.expirationDate.setValue(ctrlValue);
            datepicker.close();
        } else if (type === PaymentType.DEBITCARD) {
            const ctrlValue = this.dateService.toDate(this.debitCardForm.value.expirationDate);
            ctrlValue.setMonth(normalizedMonth.getMonth());
            this.debitCardForm.controls.expirationDate.setValue(ctrlValue);
            datepicker.close();
        }
    }
    isEmptyField(type: PaymentType): void {
        if (type === PaymentType.CREDITCARD) {
            const ctrlValue = this.dateService.toDate(this.creditCardForm.value.expirationDate);
            if (!ctrlValue) {
                this.creditCardForm.controls.expirationDate.setValue(new Date());
            } else {
                ctrlValue.setDate(this.currentDate.getDate());
                this.creditCardForm.controls.expirationDate.setValue(ctrlValue);
            }
        } else if (type === PaymentType.DEBITCARD) {
            const ctrlValue = this.dateService.toDate(this.creditCardForm.value.expirationDate);
            if (!ctrlValue) {
                this.debitCardForm.controls.expirationDate.setValue(new Date());
            } else {
                ctrlValue.setDate(this.currentDate.getDate());
                this.debitCardForm.controls.expirationDate.setValue(ctrlValue);
            }
        }
    }
    /**
     * The method is used to validate the entered date based on what the user enters on keypress
     * @param event takes in the keyboard input event
     * @param type Payment type
     * @returns Null or allows certain char codes based on the input event
     */
    validateDateFormat(event: KeyboardEvent, type: PaymentType): boolean {
        if (type === PaymentType.CREDITCARD) {
            this.creditCardForm.controls.cardNumber.setErrors(null);
        } else if (type === PaymentType.DEBITCARD) {
            this.debitCardForm.controls.cardNumber.setErrors(null);
        }
        return event.charCode === 8 || event.charCode === 47 || event.charCode === 0 ? null : event.charCode >= 48 && event.charCode <= 57;
    }
    updateDate(type: PaymentType): void {
        if (type === PaymentType.CREDITCARD) {
            const ctrlValue = this.dateService.toDate(this.creditCardForm.value.expirationDate);
            if (
                ctrlValue &&
                ctrlValue.getMonth() &&
                ctrlValue.getFullYear() &&
                ctrlValue.getMonth() === this.currentDate.getMonth() &&
                ctrlValue.getFullYear() === this.currentDate.getFullYear()
            ) {
                ctrlValue.setDate(this.currentDate.getDate());
                this.creditCardForm.controls.expirationDate.setValue(ctrlValue);
            }
        } else if (type === PaymentType.DEBITCARD) {
            const ctrlValue = this.dateService.toDate(this.debitCardForm.value.expirationDate);
            if (
                ctrlValue &&
                ctrlValue.getMonth() &&
                ctrlValue.getFullYear() &&
                ctrlValue.getMonth() === this.currentDate.getMonth() &&
                ctrlValue.getFullYear() === this.currentDate.getFullYear()
            ) {
                ctrlValue.setDate(this.currentDate.getDate());
                this.debitCardForm.controls.expirationDate.setValue(ctrlValue);
            }
        }
    }

    /**
     * Gets billing name from billing form
     * @returns billing name entered in billing form
     */
    fetchBillingName(): BillingNameSchema {
        const billingFormControls = this.billingForm.controls;
        const billingName: BillingNameSchema = {
            firstName: billingFormControls.firstName.value,
            lastName: billingFormControls.lastName.value,
        };
        if (billingFormControls.mi.value) {
            billingName.middleName = billingFormControls.mi.value;
        }
        if (billingFormControls.suffix.value) {
            billingName.suffix = billingFormControls.suffix.value;
        }
        return billingName;
    }

    /**
     * Fetches billing address from billing address form
     * @returns billing address
     */
    fetchBillingAddress(): BillingAddress {
        const billingFormControls = this.billingForm.controls;
        const billingAddress: BillingAddress = {
            address1: billingFormControls.address1.value,
            address2: billingFormControls.address2.value,
            city: billingFormControls.city.value,
            state: billingFormControls.state.value,
            zip: billingFormControls.zip.value,
        };
        return billingAddress;
    }

    saveCreditCard(): void {
        const billingName = this.fetchBillingName();
        const billingAddress = this.fetchBillingAddress();
        const cardLength = this.creditCardForm.controls.cardNumber.value.toString().length;
        const lastFour = this.creditCardForm.controls.cardNumber.value.substr(cardLength - 4);
        const expirationDate = this.dateService.toDate(this.creditCardForm.controls.expirationDate.value);
        const payload: AddPayment = {
            name: "Card ending in " + lastFour,
            paymentType: this.paymentType.CREDITCARD,
            type: this.cardType,
            tokens: [
                { carrierId: this.vspCarrierId, token: this.paymetricAccessTokenVsp },
                { carrierId: this.aflacCarrierId, token: this.paymetricAccessTokenAflac },
            ],
            lastFour: lastFour,
            expirationMonth: expirationDate.getMonth() + 1,
            expirationYear: expirationDate.getFullYear(),
        };
        payload.billingName = billingName;
        if (this.sameAddress) {
            payload.sameAddressAsHome = true;
        } else {
            payload.billingAddress = billingAddress;
        }
        this.memberService
            .addPaymentMethod(this.memberId, this.mpGroup, payload, true)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (data: any) => {
                    if (this.selectedAccount === this.newCard) {
                        const location = data.headers.get("location").split("/")[7];
                        const id = location.split("?")[0];
                        this.paymentId = parseInt(id, 10);
                    }
                    this.saveAflacResponse();
                },
                (error) => {
                    this.showSpinner = false;
                    this.apiError = true;
                    const errors = error.error.details;
                    if (error.error.status === AppSettings.API_RESP_409) {
                        this.apiErrorMessage = error.error.message;
                        this.creditCardApiError = true;
                        this.validateCreditCardNumber();
                        this.creditCardForm.controls.cardNumber.updateValueAndValidity();
                    } else if (errors.length && errors[0].field && errors[0].message) {
                        const errorMsg = this.capitalize(errors[0].field) + " " + errors[0].message;
                        this.apiErrorMessage = errorMsg;
                    } else {
                        this.apiErrorMessage = error.error.message;
                    }
                },
            );
    }
    saveDebitCard(): void {
        const cardLength = this.debitCardForm.controls.cardNumber.value.toString().length;
        const lastFour = this.debitCardForm.controls.cardNumber.value.substr(cardLength - 4);
        const expirationDate = this.dateService.toDate(this.debitCardForm.controls.expirationDate.value);
        const payload: AddPayment = {
            name: "Card ending in " + lastFour,
            paymentType: this.paymentType.DEBITCARD,
            type: this.cardType,
            tokens: [
                { carrierId: this.vspCarrierId, token: this.paymetricAccessTokenVsp },
                { carrierId: this.aflacCarrierId, token: this.paymetricAccessTokenAflac },
            ],
            lastFour: lastFour,
            expirationMonth: expirationDate.getMonth() + 1,
            expirationYear: expirationDate.getFullYear(),
        };
        const billingAddress: BillingAddress = {
            address1: this.billingForm.controls.address1.value,
            address2: this.billingForm.controls.address2.value,
            city: this.billingForm.controls.city.value,
            state: this.billingForm.controls.state.value,
            zip: this.billingForm.controls.zip.value,
        };
        const billingName: BillingNameSchema = {
            firstName: this.billingForm.controls.firstName.value,
            lastName: this.billingForm.controls.lastName.value,
        };
        if (this.billingForm.controls.mi.value) {
            billingName.middleName = this.billingForm.controls.mi.value;
        }
        if (this.billingForm.controls.suffix.value) {
            billingName.suffix = this.billingForm.controls.suffix.value;
        }
        payload.billingName = billingName;
        if (this.sameAddress) {
            payload.sameAddressAsHome = true;
        } else {
            payload.billingAddress = billingAddress;
        }
        this.memberService
            .addPaymentMethod(this.memberId, this.mpGroup, payload, true)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (data: any) => {
                    if (this.selectedAccount === this.newCard) {
                        const location = data.headers.get("location").split("/")[7];
                        const id = location.split("?")[0];
                        this.paymentId = parseInt(id, 10);
                    }
                    this.saveAflacResponse();
                },
                (error) => {
                    this.showSpinner = false;
                    this.apiError = true;
                    const errors = error.error.details;
                    if (error.error.status === AppSettings.API_RESP_409) {
                        this.apiErrorMessage = error.error.message;
                        this.creditCardApiError = true;
                        this.validateDebitCardNumber();
                        this.debitCardForm.controls.cardNumber.updateValueAndValidity();
                    } else if (errors.length && errors[0].field && errors[0].message) {
                        const errorMsg = this.capitalize(errors[0].field) + " " + errors[0].message;
                        this.apiErrorMessage = errorMsg;
                    } else {
                        this.apiErrorMessage = error.error.message;
                    }
                },
            );
    }

    /**
     * Function call to get configs from the database
     */
    getConfigurationSpecifications(): void {
        this.staticUtil
            .fetchConfigs([ConfigName.TELEPHONE_INITIAL_PLACEHOLDER, ConfigName.TELEPHONE_SIGNATURE_PLACEHOLDER], this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([customerInitial, customerSign]) => {
                this.customerInitial = customerInitial.value.split(",")[0];
                this.customerSign = customerSign.value.split(",")[0];
            });
    }
    callPaymetricService(type: PaymentType): void {
        this.showSpinner = true;
        const observables: [Observable<Configurations[]>, Observable<string>, Observable<string>] = [
            this.staticUtil.fetchConfigs([ConfigName.PAYMETRIC_MERCHANT_GUID_VSP, ConfigName.PAYMETRIC_MERCHANT_GUID_AFLAC], this.mpGroup),
            this.applicationService.getPaymetricAccessToken(this.vspCarrierId),
            this.applicationService.getPaymetricAccessToken(this.aflacCarrierId),
        ];
        forkJoin(observables)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                ([
                    [paymetricMerchantGuidVspConfig, paymetricMerchantGuidAflacConfig],
                    paymetricAccessTokenVsp,
                    paymetricAccessTokenAflac,
                ]) => {
                    this.paymetricAccessTokenVsp = paymetricAccessTokenVsp;
                    this.paymetricAccessTokenAflac = paymetricAccessTokenAflac;
                    const paymetricMerchantGuidVsp = paymetricMerchantGuidVspConfig.value;
                    const paymetricMerchantGuidAflac = paymetricMerchantGuidAflacConfig.value;
                    if (type === PaymentType.CREDITCARD) {
                        this.onCardNext(this.creditCardForm.value.cardNumber, paymetricMerchantGuidVsp, paymetricMerchantGuidAflac);
                    } else if (type === PaymentType.DEBITCARD) {
                        this.onCardNext(this.debitCardForm.value.cardNumber, paymetricMerchantGuidVsp, paymetricMerchantGuidAflac);
                    }
                },
                () => {
                    this.showSpinner = false;
                    this.apiError = true;
                    this.apiErrorMessage = this.languageSecondStringsArray["secondary.portal.common.somethingWrong"];
                },
            );
    }
    onCardNext(cardNumber: string, vspMerchantId: string, aflacMerchantId: string): void {
        this.showSpinner = true;
        const paymetricObservables: Observable<PayMetricData>[] = [];
        paymetricObservables.push(
            this.paymetricService.isValidCard(cardNumber, this.paymetricAccessTokenVsp, vspMerchantId),
            this.paymetricService.isValidCard(cardNumber, this.paymetricAccessTokenAflac, aflacMerchantId),
        );
        combineLatest(paymetricObservables)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (results) => {
                    if (results[0].HasPassed && results[1].HasPassed) {
                        this.showSpinner = false;
                        this.showBillingAddress = true;
                        this.showPayment = false;
                        if (!this.billingForm) {
                            this.disableSameAddress = false;
                            this.sameAddress = false;
                            this.disableDropdown = false;
                            this.initializeBillingAddressForm();
                        } else {
                            this.disableDropdown = false;
                            this.disableSameAddress = false;
                        }
                        if (this.reinstate) {
                            this.appFlowService.reinstateLastCompletedBillingIndex$.next(2);
                        } else {
                            this.appFlowService.lastCompletedBillingIndex.next(2);
                        }
                    } else {
                        this.showSpinner = false;
                        this.apiError = true;
                        this.apiErrorMessage = results[0].Message;
                    }
                },
                () => {
                    this.showSpinner = false;
                    this.apiError = true;
                    this.apiErrorMessage = this.languageSecondStringsArray["secondary.portal.common.somethingWrong"];
                },
            );
    }

    /**
     * Function to hold selected payment method during AflacAlwaysEnrollment
     * This is used to enable billing address while enrollment with new payment method
     */
    onChange(): void {
        this.appFlowService.paymentMethod$.next(this.selectedPaymentMethod);
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
