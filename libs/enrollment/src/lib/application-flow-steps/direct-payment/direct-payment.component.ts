import {
    SetCartItems,
    EnrollmentState,
    UpdateApplicationResponse,
    SetDirectPaymentCost,
    TPIState,
    AccountInfoState,
    EnrollmentMethodState,
    SharedState,
    RegexDataType,
    AppFlowService,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";

import { DatePipe } from "@angular/common";
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
    ShoppingService,
    RiderCartItem,
    CoreService,
    Carrier,
    DialogData,
    PaymentService,
} from "@empowered/api";
import { Store, Select } from "@ngxs/store";
import { Observable, forkJoin, Subject, of, combineLatest } from "rxjs";
import { PaymentDetailsPromptComponent } from "@empowered/ui";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from "@angular/material/core";
import { PaymetricService } from "@empowered/common-services";
import { UserService } from "@empowered/user";
import { takeUntil, switchMap, tap, first, filter } from "rxjs/operators";
import { EditDeletePaymentComponent } from "@empowered/ui";
import {
    Permission,
    CarrierId,
    DirectConfig,
    DateFormats,
    DateInfo,
    ConfigName,
    BasePlanApplicationPanel,
    DirectPaymentCost,
    StepData,
    StaticStep,
    AppSettings,
    EnrollmentMethod,
    RatingCode,
    ContactType,
    Configurations,
    AddCartItem,
    GetCartItems,
    ProducerCredential,
    TempusPaymentConfig,
    PaymentPromptDataModel,
    ClientErrorResponseCode,
    ClientErrorResponseType,
    ApplicationResponse,
    PlanOfferingPricing,
    MemberDependent,
    MoreSettings,
    PaymentType,
    AccountType,
    BillingAddress,
    BillingNameSchema,
    AddPaymentErrorCodes,
    AddPayment,
    RoutingNumberModel,
    PaymentEditPopUpClose,
    Token,
    StepType,
    PayMetricData,
    PartnerAccountType,
} from "@empowered/constants";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { EmpoweredAttentionModalComponent } from "@empowered/ui";
import { DateFnsDateAdapter, DateService, EXPIRY_DATES_FORMAT } from "@empowered/date";
import { EmpoweredModalService } from "@empowered/common-services";

const INITIALS = "initials";
const METHOD = "method";
const ROUTING_NUMBER_STARTING_INDEX = 5;
const ROUTING_NUMBER_ENDING_INDEX = 9;
const CHILD_AGE = "CHILD_AGE";
const TRUE_VALUE = "TRUE";
const TOTAL_DIGIT_COUNT = 2;
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
const DISPLAY_ACCOUNT_NUMBER_MAX_LENGTH = 11;

@Component({
    selector: "empowered-direct-payment",
    templateUrl: "./direct-payment.component.html",
    styleUrls: ["./direct-payment.component.scss"],
    providers: [
        { provide: DateAdapter, useClass: DateFnsDateAdapter, deps: [MAT_DATE_LOCALE] },
        { provide: MAT_DATE_FORMATS, useValue: EXPIRY_DATES_FORMAT },
    ],
})
export class DirectPaymentComponent implements OnInit, OnDestroy {
    @Input() carrierId?: number;
    @ViewChild("dpDc") debitCardDatePicker: MatDatepicker<Date>;
    @ViewChild("dp") creditCardDatePicker: MatDatepicker<Date>;
    private readonly unsubscribe$ = new Subject<void>();
    IS_ACH_PARTNER_ACCOUNT_TYPE = "is_ach_partner_account_type";
    DRAFT_ORIGIN_INDICATOR = "draft_origin_indicator";
    ROUTING_NUMBER = "routing_number";
    applicationPanelDetail: BasePlanApplicationPanel[] = [];
    showSpinner = false;
    apiError = false;
    apiErrorMessage: string;
    mpGroup: number;
    memberId: number;
    memberContact: any;
    memberInfo: any;
    validationRegex: any;
    showPayment = false;
    showBillingAddress = false;
    showSettingForm = false;
    bankDraftForm: FormGroup;
    debitCardForm: FormGroup;
    creditCardForm: FormGroup;
    billingForm: FormGroup;
    settingForm: FormGroup;
    paymentMethodForm: FormGroup;
    paymentType = PaymentType;
    accountType = AccountType;
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
    DRAFT_ORIGIN_INDICATOR_CHECKING = "1";
    DRAFT_ORIGIN_INDICATOR_SAVING = "2";
    paymentSteps;
    selectedPaymentMethod = PaymentType.BANKDRAFT;
    paymentFrequeny = [];
    paymentId: number;
    applicationResp = [];
    email: string;
    savedPaymentIdIndex = 0;
    focused = true;
    reEnterFocused = true;
    frequencyCost = [];
    restrictedEmails: string;
    restrictedDomain: string;
    monthValues = [];
    onlyVSP: boolean;
    enableDebitCardBilling = false;
    tempusResponsePayload: AddPayment;
    showNoCardError = false;
    tempusZip = null;
    onlyAflac: boolean;
    bothCarriers: boolean;
    monthNames = AppSettings.MONTHNAMES;
    nextDayDate = new Date();
    minDate: string;
    maxDate: string;
    MONTH_END_DATES = ["29", "30", "31"];
    MIN_DAYS_ALLOWED = 1;
    cartId: number;
    hasAflacAlways = false;
    currentDate = new Date();
    planObject: StepData;
    thirtyDayCheckDate: Date;
    lastDayOfMonth: number;
    billingAddressTitle = "";
    consentContent: SafeHtml;
    aflacCarrierId: number = CarrierId.AFLAC;
    ageExceededErrorMessage: string;
    APPLICANT_MUST_BE_YOUNGER = "applicantMustBeYounger";
    tempusPaymentConfig: boolean;
    bankDraftTempusConfig: boolean;
    tempusIframeURL: string;
    isCardNotExpired = true;
    showNoAccountError = false;
    bankDraftTempusResponsePayload: AddPayment;
    disableAddAccount = false;
    disableAddCard = false;

    firstPaymentDateConfigs = this.staticUtil
        .cacheConfigs([
            DirectConfig.DAYS_ALLOWED_DIRECT_FIRST_PAYMENT,
            DirectConfig.LAST_DAY_OF_MONTH_DIRECT_FIRST_PAYMENT,
            ConfigName.JUVENILE_PLANS,
        ])
        .pipe(
            tap(([daysAllowed, lastDayOfMonth, planIds]) => {
                this.lastDayOfMonth = +lastDayOfMonth?.value;
                // Setting dates as greatest coverage start date if the coverage starts in future
                this.currentDate = this.isCoverageInFuture ? this.dateService.toDate(this.greatestCoverageDate) : new Date();
                this.nextDayDate = this.isCoverageInFuture ? this.dateService.toDate(this.greatestCoverageDate) : new Date();
                this.thirtyDayCheckDate = this.isCoverageInFuture ? this.dateService.toDate(this.greatestCoverageDate) : new Date();
                // Get date that is 30 days from the current date
                const currentMonthLastDate: number = this.dateService.getLastDayOfMonth(new Date());
                const disregardedDaysAmount: number = currentMonthLastDate - +lastDayOfMonth?.value;
                this.juvenilePlanIds = planIds.value;
                this.thirtyDayCheckDate.setDate(this.thirtyDayCheckDate.getDate() + +daysAllowed.value + disregardedDaysAmount);
                let maxDayCheck = this.thirtyDayCheckDate.getDate();
                if (this.MONTH_END_DATES.includes(maxDayCheck.toString())) {
                    maxDayCheck = +lastDayOfMonth?.value;
                }
                this.nextDayDate.setDate(this.currentDate.getDate() + this.MIN_DAYS_ALLOWED);
                let minDayCheck = this.nextDayDate.getDate();
                if (this.MONTH_END_DATES.includes(minDayCheck.toString())) {
                    minDayCheck = this.minDateIfMonthEnd(this.currentDate.getDate(), 1) + this.currentDate.getDate();
                }
                this.maxDate = this.datepipe.transform(this.thirtyDayCheckDate.setDate(maxDayCheck), DateFormats.MONTH_DAY);
                // Get date that is 1 day from current date
                this.minDate = this.datepipe.transform(this.nextDayDate.setDate(minDayCheck), DateFormats.MONTH_DAY);
            }),
            first(),
        );

    getEnrollmentMethodAndPin = combineLatest([this.userService.credential$, this.staticUtil.hasPermission(Permission.HYBRID_USER)]).pipe(
        tap(([credential, hybridUserPermission]: [ProducerCredential, boolean]) => {
            if (credential.producerId) {
                this.enrollmentMethod = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment).enrollmentMethod;
            }
            if (this.enrollmentMethod === EnrollmentMethod.CALL_CENTER || this.enrollmentMethod === EnrollmentMethod.PIN_SIGNATURE) {
                this.showPin = true;
            }
        }),
        takeUntil(this.unsubscribe$),
    );

    creditCardFocused = true;
    paymetricAccessTokenAflac: string;
    paymetricAccessTokenVsp: string;
    creditCardApiError = false;
    debitCardApiError = false;
    enrollmentMethod: string;
    showPin = false;
    visaRegex: RegExp;
    masterCardRegex: RegExp;
    amexRegex: RegExp;
    cardConstant = "Card ending in";
    isACHPartnerAccountType: boolean;
    draftOriginIndicator: string;
    defaultRoutingNumber: string;
    enrollmentState: string;
    isCoverageDateDifferent = false;
    disableNextButton = false;
    cartData: GetCartItems[];
    cartItemsToUpdate: AddCartItem[];
    moreSettings: MoreSettings;
    selectedRadio: string;
    carrierDetail: Carrier;
    upcomingBillingCarrier: Carrier;
    indexOfCurrentCarrier: number;
    vspToken: string;
    aflacToken: string;
    MASK_FIRST_EIGHT = "********";
    routingNumberLastFourDigits: string;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.applicationFlow.payments.accountName",
        "primary.portal.applicationFlow.payments.bankName",
        "primary.portal.applicationFlow.payments.billing",
        "primary.portal.applicationFlow.payments.billingAddress",
        "primary.portal.applicationFlow.payments.paymentMethod",
        "primary.portal.applicationFlow.payments.paymentTypeBankDraft",
        "primary.portal.applicationFlow.payments.paymentTypeCreditCard",
        "primary.portal.applicationFlow.payments.paymentTypeDebitCard",
        "primary.portal.applicationFlow.payments.selectAccount",
        "primary.portal.applicationFlow.payments.addNewAccount",
        "primary.portal.applicationFlow.payments.routingNumber",
        "primary.portal.applicationFlow.payments.invalidRoutingNumber",
        "primary.portal.applicationFlow.payments.accountNumber",
        "primary.portal.applicationFlow.payments.reenterAccountNumber",
        "primary.portal.applicationFlow.payments.invalidAccountNumber",
        "primary.portal.applicationFlow.payments.accountNoDontMatch",
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
        "primary.portal.applicationFlow.payments.monthOfFirstPayment",
        "primary.portal.applicationFlow.payments.paymentDay",
        "primary.portal.applicationFlow.payments.invalidDate",
        "primary.portal.applicationFlow.payments.chooseDay",
        "primary.portal.applicationFlow.payments.forNewlyIssuedPoliciesOnly",
        "primary.portal.applicationFlow.payments.customerInitials",
        "primary.portal.applicationFlow.payments.invalidFormat",
        "primary.portal.formPageQuestion.useOnlyLetters",
        "primary.portal.applicationFlow.payments.vspVisionPlan",
        "primary.portal.applicationFlow.payments.onceMonthly",
        "primary.portal.applicationFlow.payments.dateOfMonth",
        "primary.portal.applicationFlow.payments.effectiveDate",
        "primary.portal.applicationFlow.payments.yourPlanEffective",
        "primary.portal.applicationFlow.payments.enrollmentsCompletedBefore",
        "primary.portal.applicationFlow.payments.enrollmentsCompletedOnOrAfter",
        "primary.portal.applicationFlow.payments.nextFinishApplications",
        "primary.portal.applicationFlow.payments.nextAflacAlways",
        "primary.portal.applicationFlow.payments.selectDebitCard",
        "primary.portal.applicationFlow.payments.selectCreditCard",
        "primary.portal.applicationFlow.payments.cardNumber",
        "primary.portal.applicationFlow.payments.invalidCardNumber",
        "primary.portal.applicationFlow.payments.expirationDate",
        "primary.portal.applicationFlow.payments.expDate.dateFormat",
        "primary.portal.applicationFlow.payments.invalidExpirationDate",
        "primary.portal.applicationFlow.payments.addNewCard",
        "primary.portal.applicationFlow.payments.pastDate",
        "primary.portal.applicationFlow.payments.futureDate",
        "primary.portal.applicationFlow.payments.enterPin",
        "primary.portal.applicationFlow.payments.cannotExceedChar",
        "primary.portal.applicationFlow.payments.mustLeastChar",
        "primary.portal.applicationFlow.payments.onlyLettersNumUnderscore",
        "primary.portal.applicationFlow.payments.customerInitialsLater",
        "primary.portal.applicationFlow.payments.accountOwner",
        "primary.portal.applicationFlow.payments.cardHolder",
        "primary.portal.common.iAgree",
        "primary.portal.common.requiredField",
        "primary.portal.common.next",
        "primary.portal.common.selectionRequired",
        "primary.portal.common.back",
        "primary.portal.applicationFlow.payments.cardExist",
        "primary.portal.applicationFlow.payments.cardTypeHint",
        "primary.portal.applicationFlow.payments.thirtyDayCheck",
        "primary.portal.applicationFlow.payments.viewAccount.accountName",
        "primary.portal.applicationFlow.payments.viewAccount.bankName",
        "primary.portal.applicationFlow.payments.editAccount",
        "primary.portal.applicationFlow.payments.deleteAccount",
        "primary.portal.applicationFlow.payments.editCard",
        "primary.portal.applicationFlow.payments.deleteCard",
        "primary.portal.applicationFlow.payments.paymentFor",
        "primary.portal.applicationFlow.payments.payCheck.warning",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.transferToDirect.cardType",
        "primary.portal.common.payMetric.issue",
        "primary.portal.vf2f.disable.info",
        "primary.portal.applicationFlow.payments.debitCardMessage",
        "primary.portal.billingAflac.consent.content",
        "primary.portal.common.city.patternError",
        "primary.portal.common.ok",
        "primary.portal.applicationFlowSteps.maxAttemptsReached.title",
        "primary.portal.applicationFlowSteps.maxAttemptsReached.message",
        "primary.portal.applicationFlowSteps.duplicateCard.title",
        "primary.portal.applicationFlowSteps.duplicateCard.message",
        "primary.portal.applicationFlowSteps.cardValidationFailed.title",
        "primary.portal.applicationFlow.payments.bankDraft.accountLabeling",
        "primary.portal.applicationFlowSteps.duplicateAccount.title",
        "primary.portal.applicationFlowSteps.accountValidationFailed.title",
        "primary.portal.applicationFlowSteps.routingNumber.accountValidationFailed.message",
        "primary.portal.applicationFlow.payments.paymentMethod.achBankDraftLabel",
        "primary.portal.applicationFlow.nextPreliminaryStatement",
    ]);
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    @Input() planId: number;
    @Input() reinstate: boolean;
    customerInitial: string;
    customerSign: string;
    isHeadset: boolean;
    cardType: CardType;
    AppSettings = AppSettings;
    applicationsData: BasePlanApplicationPanel[];
    reinstateItemId: number;
    dependents: MemberDependent[];
    isJuvenile = false;
    juvenilePlanIds: string;
    addNewBankAccount = false;
    addNewCreditAccount = false;
    addNewDebitAccount = false;
    dropdownData: RoutingNumberModel[];
    isTpi = false;
    isTpiMember = false;
    // virtual face to face flag. It will be true if enrollment method is virtual face to face.
    isVf2f = false;
    showSignerAgreement: boolean;
    editCardModal = false;
    creditCardExpirationDate: string;
    debitCardExpirationDate: string;
    isCoverageInFuture: boolean;
    greatestCoverageDate: number;
    partnerAccountType: PartnerAccountType;

    enablePaymetricBankDraft: boolean;
    MASK_FIRST_SEVEN = "*******";
    MASK_FIRST_FIVE = "*****";
    showMaskedAccountNumber: string;
    achBankDraftEditEnableConfig: boolean;
    showPreliminaryStatement: boolean;

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
        private readonly shoppingService: ShoppingService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly datepipe: DatePipe,
        private readonly staticUtil: StaticUtilService,
        private readonly coreService: CoreService,
        private readonly domSanitizer: DomSanitizer,
        private readonly paymentService: PaymentService,
        private readonly dateService: DateService,
        private readonly utilService: UtilService,
    ) {
        this.mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
        this.memberId = this.store.selectSnapshot(EnrollmentState.GetMemberId);
        this.partnerAccountType = this.store.selectSnapshot(AccountInfoState.getPartnerAccountType);
        this.getConfigurationSpecifications();
        this.memberService
            .getMemberContact(this.memberId, ContactType.HOME, this.mpGroup?.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                if (resp) {
                    this.memberContact = resp;
                }
            });
    }

    /**
     * Initialize configurations and load data upon which this component depends. Populate
     * form fields and set up form validation.
     */
    ngOnInit(): void {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.store.dispatch(new SetDirectPaymentCost(this.carrierId, this.reinstate));
        this.getCartAndApplicationData();
        this.firstPaymentDateConfigs.subscribe();
        this.getGroupAttributes();
        this.getMemberDependents();
        let tpiCallCenterId: number;
        this.consentContent = this.domSanitizer.bypassSecurityTrustHtml(
            this.languageStrings["primary.portal.billingAflac.consent.content"],
        );
        this.appFlowService.showNextProductFooter$.next({ nextClick: false, data: null });
        if (this.appFlowService.checkTpi()) {
            const tpiSsoDetail = this.store.selectSnapshot(TPIState.tpiSsoDetail);
            this.isTpi = true;
            this.isTpiMember = !tpiSsoDetail.user.producerId;
            tpiCallCenterId = tpiSsoDetail.user.callCenterId;
            this.getTPIData();
        } else {
            this.getEnrollmentMethodAndPin.subscribe();
        }
        this.isVf2f = this.enrollmentMethod === EnrollmentMethod.VIRTUAL_FACE_TO_FACE;
        if (this.enrollmentMethod === EnrollmentMethod.HEADSET) {
            this.isHeadset = true;
            this.showPin = false;
        }
        if (
            tpiCallCenterId &&
            (this.enrollmentMethod === EnrollmentMethod.CALL_CENTER || this.enrollmentMethod === EnrollmentMethod.PIN_SIGNATURE)
        ) {
            this.showPin = true;
            this.isHeadset = false;
        }

        if (this.reinstate) {
            this.appFlowService.reinstateLastCompletedBillingIndex$.next(1);
        } else {
            this.appFlowService.lastCompletedBillingIndex.next(1);
        }
        this.initializeText();
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => (this.validationRegex = data));
        this.serviceCalls();
        this.checkCarriers();
        this.getMonthValues();

        this.appFlowService.paymentStepPosition.pipe(takeUntil(this.unsubscribe$)).subscribe((resp) => {
            this.stepPosition = resp;
            this.checkCompleteStatus();
        });
        this.checkAflacAlways();
        this.assignRegex();
        if (this.carrierId) {
            this.getCarrierDetails(this.carrierId);
        }
        this.appFlowService.showPreliminaryStatementStep$
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => (this.showPreliminaryStatement = response));
    }

    /**
     * Get member dependents
     */
    getMemberDependents(): void {
        this.memberService
            .getMemberDependents(this.memberId, true, this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((dependents) => {
                this.dependents = dependents;
            });
    }

    /**
     * To fetch tpi data for modal mode enrollment
     */
    getTPIData(): void {
        if (!this.isTpiMember) {
            this.enrollmentMethod = this.store.selectSnapshot(EnrollmentState.GetEnrollmentMethod);
        }
    }

    /**
     * @description a recursive function to compute the no. of days to change start date to next month when it is month end dates (29,30,31)
     * @param currentDay {number} the current day of the month
     * @param factor {number} the factor by which the date should be increased so it becomes next month
     * @returns {number} the factor to add to current date
     */
    minDateIfMonthEnd(currentDay: number, factor: number): number {
        const checkDate = new Date();
        checkDate.setDate(currentDay + factor);
        if (checkDate.getDate() !== 1) {
            factor++;
            return this.minDateIfMonthEnd(currentDay, factor);
        }
        return factor;
    }
    /**
     * This method fetches carrier details based of carrier id
     * @param carrierId - id of carrier
     */
    getCarrierDetails(carrierId: number): void {
        this.coreService
            .getCarrier(carrierId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((carrierDetail) => {
                this.carrierDetail = carrierDetail;
            });
    }
    /**
     * To get application data and cart data based on reinstateflag
     */
    getCartAndApplicationData(): void {
        if (this.reinstate) {
            this.applicationsData = this.store
                .selectSnapshot(EnrollmentState.GetReinstatementPanel)
                .filter((app) => app.appData.planId === this.planId && app.cartData.applicationType === StepType.REINSTATEMENT);
            this.reinstateItemId = this.applicationsData.map((app) => app.cartData.id).pop();
            this.cartData = this.store
                .selectSnapshot(EnrollmentState.GetCartItem)
                .filter((cartItem) => cartItem.id === this.reinstateItemId);
        } else {
            this.applicationsData = this.store.selectSnapshot(EnrollmentState.GetApplicationPanel);
            this.cartData = this.store
                .selectSnapshot(EnrollmentState.GetCartItem)
                .filter((cartItem) => cartItem.id && cartItem.applicationType !== StepType.REINSTATEMENT);
            /**
             * checking if the partnerAccountType is PAYROLLDIRECTBILL and if VAS plans added to cart
             * then taking greatest coverage date if the coverage starts in future
             */
            const vasPlansAdded: GetCartItems[] = this.cartData.filter((item) => item.planOffering?.plan.vasFunding);
            if (this.partnerAccountType === PartnerAccountType.PAYROLLDIRECTBILL && vasPlansAdded?.length) {
                this.isCoverageInFuture = vasPlansAdded.some(
                    (item) => this.dateService.toDate(item.planOffering?.validity?.effectiveStarting) > new Date(),
                );
                const dates = vasPlansAdded.map((item) =>
                    this.dateService.toDate(item.planOffering?.validity?.effectiveStarting).getTime(),
                );
                this.greatestCoverageDate = Math.max(...dates);
            }
        }
        this.getCarriers();
    }

    /**
     * Extract carriers from Direct Payment [stored in ngxs store].
     * Handles details for upcoming carrier in for app flow side nav.
     */
    getCarriers(): void {
        this.applicationPanelDetail = this.applicationsData.filter((data) => data.carrierId === this.carrierId);
        const payments = this.store.selectSnapshot(EnrollmentState.GetDirectPayment);
        const carriers: number[] = payments.map((plan) => plan.carrierId);
        const carrierIds = [...new Set(carriers)];
        this.indexOfCurrentCarrier = carrierIds.indexOf(this.carrierId);
        if (this.indexOfCurrentCarrier >= 0 && carrierIds[this.indexOfCurrentCarrier + 1]) {
            const upcomingBillingCarrierID = carrierIds[this.indexOfCurrentCarrier + 1];
            this.coreService
                .getCarrier(upcomingBillingCarrierID)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((carrierDetail) => {
                    this.upcomingBillingCarrier = carrierDetail;
                });
        }
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
    checkAflacAlways(): void {
        this.hasAflacAlways = this.store.selectSnapshot(EnrollmentState.GetAflacAlways)?.length ? true : false;
    }
    /** To manipulate showPayment, showBillingAddress, showSettingForm based on step position
     * @returns void
     */
    checkCompleteStatus(): void {
        this.showPayment = this.showBillingAddress = this.showSettingForm = false;
        if (this.stepPosition === 0) {
            this.showPayment = true;
        } else if (this.stepPosition === 1) {
            this.showBillingAddress = true;
        } else if (this.stepPosition === 2) {
            this.showSettingForm = true;
            this.appFlowService.showNextProductFooter$.next({
                nextClick: true,
                data: StaticStep.ONE_SIGNATURE,
            });
        }
    }
    initializeText(): void {
        if (this.reinstate) {
            this.paymentSteps = this.store
                .selectSnapshot(EnrollmentState.GetDirectPayment)
                .filter((data) => data.applicationType === StepType.REINSTATEMENT);
        } else {
            this.paymentSteps = this.store
                .selectSnapshot(EnrollmentState.GetDirectPayment)
                .filter((data) => data.applicationType !== StepType.REINSTATEMENT && data.carrierId === this.carrierId);
        }
        if (this.paymentSteps.length) {
            this.paymentFrequeny = this.paymentSteps[0].steps[0].allowedPayFrequencies;
            this.cartId = this.paymentSteps[0].itemId;
            const cost = this.store.selectSnapshot(EnrollmentState.GetDirectPaymentCost);
            this.setFrequencyCost(cost);
        }
    }
    setFrequencyCost(cost: DirectPaymentCost): void {
        this.frequencyCost = [];
        this.frequencyCost.push(cost.monthly);
        this.frequencyCost.push(cost.quarterly);
        this.frequencyCost.push(cost.semiAnnually);
        this.frequencyCost.push(cost.annually);
    }
    serviceCalls(): void {
        const paymentApi = this.memberService.getPaymentMethods(this.memberId, this.mpGroup);
        const memberApi = this.memberService.getMember(this.memberId, false, this.mpGroup.toString());
        const stateApi = this.staticService.getStates();
        const suffixApi = this.staticService.getSuffixes();
        const restrictedEmailsConfigApi = this.staticService.getConfigurations("general.email.restriction.list", this.mpGroup);
        const restrictedDomainConfigApi = this.staticService.getConfigurations(
            "general.email.restriction.domain.accounts.map",
            this.mpGroup,
        );
        const tempusConfigApi = this.staticService.getConfigurations(TempusPaymentConfig.TEMPUS_IFRAME_ENABLE_CONFIG, this.mpGroup);
        const tempusAchConfigApi = this.staticService.getConfigurations(TempusPaymentConfig.TEMPUS_ACH_IFRAME_ENABLE_CONFIG, this.mpGroup);
        const tempusAchEditConfigApi = this.staticService.getConfigurations(
            TempusPaymentConfig.TEMPUS_ACH_EDIT_ENABLE_CONFIG,
            this.mpGroup,
        );
        this.showSpinner = true;
        combineLatest([
            paymentApi,
            memberApi,
            stateApi,
            suffixApi,
            restrictedEmailsConfigApi,
            restrictedDomainConfigApi,
            tempusConfigApi,
            tempusAchConfigApi,
            tempusAchEditConfigApi,
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {
                    this.tempusPaymentConfig = resp[6][0].value === TRUE_VALUE;
                    this.bankDraftTempusConfig = resp[7][0].value === TRUE_VALUE;
                    this.achBankDraftEditEnableConfig = resp[8][0].value === TRUE_VALUE;
                    this.showSpinner = false;
                    this.paymentMethods = resp[0];
                    this.memberInfo = resp[1];
                    this.allState = resp[2];
                    this.allSuffixes = resp[3];
                    if (resp[4] && resp[5] && resp[4][0] && resp[5][0]) {
                        this.restrictedEmails = resp[4][0].value;
                        this.restrictedDomain = resp[5][0].value;
                    }

                    // enable Debit card billing (i.e. paymetric flow) only when config is off or
                    // in case of VSP billing
                    this.enableDebitCardBilling =
                        !this.tempusPaymentConfig || this.onlyVSP || (this.bothCarriers && this.carrierId !== this.aflacCarrierId);

                    // enable paymetric bank draft flow only when config is off or in case of VSP billing
                    this.enablePaymetricBankDraft =
                        !this.bankDraftTempusConfig || this.onlyVSP || (this.bothCarriers && this.carrierId !== this.aflacCarrierId);
                    this.mapPayments();
                    this.getApplicationResponse();
                    this.onEnrollNext();
                    this.showSpinner = false;
                },
                (error) => {
                    this.showSpinner = false;
                    this.apiError = true;
                    this.apiErrorMessage = this.language.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code);
                },
            );
    }
    /**
     * This function is used to map the various payment methods into their respective array
     * (bankAccounts,creditCardAccount and debitCardAccount)
     */
    mapPayments(): void {
        this.bankAccounts = [];
        this.creditCardAccount = [];
        this.debitCardAccount = [];
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
    onEnrollNext(): void {
        this.initializePaymentMethodForm();
        this.showPayment = true;
        this.showBillingAddress = false;
        this.initializePaymentForm();
        if (this.reinstate) {
            this.appFlowService.reinstateLastCompletedBillingIndex$.next(1);
        } else {
            this.appFlowService.lastCompletedBillingIndex.next(1);
        }
    }

    /**
     * This method is used to update the payment option selected
     * @param event The selected radio button
     */
    updatePaymentOption(event: MatRadioChange): void {
        this.showNoCardError = false;
        this.showNoAccountError = false;
        this.selectedRadio = event.value;
        this.apiError = this.disableDropdown = this.sameAddress = false;
        this.initializeBillingAddressForm();
        this.selectedPaymentMethod = event.value;
        if (this.reinstate) {
            this.appFlowService.reinstateLastCompletedBillingIndex$.next(1);
        } else {
            this.appFlowService.lastCompletedBillingIndex.next(1);
        }
        this.initializePaymentForm();
    }

    /**
     * This method updates the header message and payment information based on the selected payment option.
     */
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
     * Gets account id and savedPaymentId index
     * @param type payment type
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
                this.appFlowService.reinstateLastCompletedBillingIndex$.next(1);
            } else {
                this.appFlowService.lastCompletedBillingIndex.next(1);
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
        this.debitCardForm.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
            if (this.reinstate) {
                this.appFlowService.reinstateLastCompletedBillingIndex$.next(1);
            } else {
                this.appFlowService.lastCompletedBillingIndex.next(1);
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
                this.appFlowService.reinstateLastCompletedBillingIndex$.next(1);
            } else {
                this.appFlowService.lastCompletedBillingIndex.next(1);
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
     * Validate routing number and turn api error false
     * @param event paste event data
     * @returns boolean value which determines whether to paste or not
     */
    validatePastedNumber(event: Event): boolean {
        this.apiError = this.zipApiError = this.routingApiError = this.creditCardApiError = this.debitCardApiError = false;
        return true;
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
            this.showBillingAddress = true;
            this.showPayment = false;
            this.initializeBillingForm();
            if (this.reinstate) {
                this.appFlowService.reinstateLastCompletedBillingIndex$.next(2);
            } else {
                this.appFlowService.lastCompletedBillingIndex.next(2);
            }
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
            promptData.bankDraftDetails = this.bankAccounts[this.selectedIndex];
            this.empoweredModalService
                .openDialog(PaymentDetailsPromptComponent, { data: promptData })
                .afterClosed()
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((bankDraft) => {
                    this.disableAddAccount = false;
                    if (bankDraft) {
                        this.bankAccounts[this.selectedIndex] = bankDraft;
                    }
                });
        } else {
            promptData.isACHPartnerAccountType = this.isACHPartnerAccountType;
            promptData.defaultRoutingNumber = this.defaultRoutingNumber;
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
                        // IF user enters routing number which is not a default one from Group Attribute
                        if (repAddData?.errorCode === AddPaymentErrorCodes.ROUTING_NUMBER_MISMATCH) {
                            data = {
                                title: this.languageStrings["primary.portal.applicationFlowSteps.accountValidationFailed.title"],
                                message: "primary.portal.applicationFlowSteps.routingNumber.accountValidationFailed.message",
                                buttonText: this.languageStrings["primary.portal.common.ok"],
                                defaultRoutingNumber: this.defaultRoutingNumber,
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
                        if (repAddData) {
                            this.bankDraftTempusResponsePayload = repAddData;
                            this.showNoAccountError = !this.bankDraftTempusResponsePayload;
                        }
                        return this.memberService.getPaymentMethods(this.memberId, this.mpGroup);
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe((paymentMethods) => {
                    if (paymentMethods) {
                        this.paymentMethods = paymentMethods;
                        this.mapPayments();
                        // to get last added bank account on top
                        this.bankAccounts.sort((account1, account2) => account1.id - account2.id);
                        this.selectedIndex = this.bankAccounts.length - 1;
                        this.routingNumberLastFourDigits = this.bankAccounts[this.selectedIndex].routingNumber.substring(
                            ROUTING_NUMBER_STARTING_INDEX,
                            ROUTING_NUMBER_ENDING_INDEX,
                        );
                        this.paymentId = this.bankAccounts[this.selectedIndex].id;
                        this.selectedAccount = this.bankAccounts[this.selectedIndex]?.id.toString();
                        this.showMaskedAccountNumber = this.getMaskedAccountNumber(
                            this.bankAccounts[this.selectedIndex].accountNumberLastFour,
                        );
                    }
                });
        }
        this.editCardModal = false;
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
     * Initializes bank draft billing form
     * @return void
     */
    initializeBankDraftBillingForm(): void {
        if (
            !(
                this.enablePaymetricBankDraft ||
                this.sameAddress ||
                this.bankAccounts[this.selectedIndex].sameAddressAsHome ||
                this.bankAccounts[this.selectedIndex].billingName.firstName
            )
        ) {
            this.setBillingAddress();
        } else if (!this.sameAddress) {
            this.prePopulateBillingAddress();
        }
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
     * This method is used to trigger the next button in the UI for the payment methods(Bank Draft, Credit Card and Debit Card)
     * @param method is the type of payment method selected
     */
    onPaymentNext(method: PaymentType): void {
        if (method === this.paymentType.BANKDRAFT) {
            this.showNoAccountError = this.selectedAccount === this.newBankAccount && !this.enablePaymetricBankDraft;
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
                    this.appFlowService.reinstateLastCompletedBillingIndex$.next(2);
                } else {
                    this.appFlowService.lastCompletedBillingIndex.next(2);
                }
            } else if (!this.enablePaymetricBankDraft && this.selectedAccount !== this.newBankAccount) {
                this.showBillingAddress = true;
                this.showPayment = false;
                this.initializeBankDraftBillingForm();
                if (this.reinstate) {
                    this.appFlowService.reinstateLastCompletedBillingIndex$.next(2);
                } else {
                    this.appFlowService.lastCompletedBillingIndex.next(2);
                }
            }
        } else if (method === this.paymentType.CREDITCARD) {
            this.onCreditCardPaymentNext(method);
        } else if (method === this.paymentType.DEBITCARD) {
            this.apiError = false;
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
                this.showBillingAddress = true;
                this.showPayment = false;
                this.prePopulateBillingAddress();
                if (this.reinstate) {
                    this.appFlowService.reinstateLastCompletedBillingIndex$.next(2);
                } else {
                    this.appFlowService.lastCompletedBillingIndex.next(2);
                }
            }
        }
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
                this.creditCardAccount[this.selectedIndex].sameAddressAsHome ||
                this.creditCardAccount[this.selectedIndex].billingName.firstName
            )
        ) {
            this.setBillingAddress();
        } else if (!this.sameAddress) {
            this.prePopulateBillingAddress();
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
        let index = -1;
        if (type === PaymentType.CREDITCARD) {
            index = this.creditCardAccount.findIndex(
                (card) => card.lastFour === lastFour && card.expirationYear === expirationYear && card.expirationMonth === expirationMonth,
            );
        } else {
            index = this.debitCardAccount.findIndex(
                (card) => card.lastFour === lastFour && card.expirationYear === expirationYear && card.expirationMonth === expirationMonth,
            );
        }
        return index;
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
    initializeBillingAddressForm(
        firstName?: string,
        lastName?: string,
        mi?: string,
        suffix?: string,
        address1?: string,
        address2?: string,
        city?: string,
        state?: string,
        zip?: number,
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
                this.appFlowService.reinstateLastCompletedBillingIndex$.next(2);
            } else {
                this.appFlowService.lastCompletedBillingIndex.next(2);
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
     * This function is used to add a new account based on the payment method selected
     * @param method type of payment method chosen
     * @returns void
     */
    addNewAccount(method: PaymentType): void {
        if (!this.enableDebitCardBilling && this.selectedPaymentMethod === this.paymentType.CREDITCARD) {
            this.selectedAccount = this.newCard;
            this.openPaymentPrompt(this.editCardModal);
        } else if (!this.enablePaymetricBankDraft && this.selectedPaymentMethod === this.paymentType.BANKDRAFT) {
            // this flow will run when user click on add new account through dropdown
            this.selectedAccount = this.newBankAccount;
            this.openBankDraftPrompt();
        } else if (method === this.paymentType.BANKDRAFT) {
            this.addNewBankAccount = true;
            this.selectedAccount = this.newBankAccount;
            this.initializeBankForm();
            this.initializeNewForms();
        } else if (method === this.paymentType.CREDITCARD) {
            this.addNewCreditAccount = true;
            this.selectedAccount = this.newCard;
            this.initializeCreditForm();
            this.creditCardDatePicker.disabled = false;
            this.initializeNewForms();
        } else if (method === this.paymentType.DEBITCARD) {
            this.addNewDebitAccount = true;
            this.selectedAccount = this.newCard;
            this.initializeDebitForm();
            this.debitCardDatePicker.disabled = false;
            this.initializeNewForms();
        }
    }
    initializeNewForms(): void {
        this.initializeBillingAddressForm();
        this.initializeSettingForm();
        this.sameAddress = false;
        this.disableDropdown = false;
        if (this.reinstate) {
            this.appFlowService.reinstateLastCompletedBillingIndex$.next(1);
        } else {
            this.appFlowService.lastCompletedBillingIndex.next(1);
        }
    }
    updateCheckbox(): boolean {
        let returnValue = false;
        if (this.selectedPaymentMethod === this.paymentType.BANKDRAFT && this.selectedAccount !== this.newBankAccount) {
            returnValue = this.bankAccounts[this.selectedIndex].sameAddressAsHome;
        } else if (this.selectedPaymentMethod === this.paymentType.CREDITCARD && this.selectedAccount !== this.newCard) {
            returnValue = this.creditCardAccount[this.selectedIndex].sameAddressAsHome;
        } else if (this.selectedPaymentMethod === this.paymentType.DEBITCARD && this.selectedAccount !== this.newCard) {
            returnValue = this.debitCardAccount[this.selectedIndex].sameAddressAsHome;
        } else if (this.sameAddress) {
            returnValue = true;
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
     * This function is used to pre populate the account based on the payment method selected
     * @param method type of payment method chosen
     * @param index index of the payment method selected
     * @returns void
     */
    prePopulateAccount(method: PaymentType, index: number): void {
        this.selectedIndex = index;
        this.apiError = false;
        this.disableSameAddress = true;
        if (method === this.paymentType.BANKDRAFT) {
            this.routingNumberLastFourDigits = this.bankAccounts[index].routingNumber.substring(
                ROUTING_NUMBER_STARTING_INDEX,
                ROUTING_NUMBER_ENDING_INDEX,
            );
            if (!this.enablePaymetricBankDraft) {
                this.showMaskedAccountNumber = this.getMaskedAccountNumber(this.bankAccounts[index].accountNumberLastFour);
            }
            this.addNewBankAccount = false;
            this.initializeBankForm(
                this.bankAccounts[index].accountName,
                this.bankAccounts[index].bankName,
                this.MASK_FIRST_EIGHT + this.bankAccounts[index].routingNumber,
                this.MASK_FIRST_EIGHT + this.bankAccounts[index].accountNumberLastFour,
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
            this.addNewCreditAccount = false;
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
            this.addNewDebitAccount = false;
            const expirationDate = new Date();
            this.debitCardExpirationDate = this.getExpirationDate(this.debitCardAccount[index]);
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
        this.billingForm.controls.firstName.disable();
        this.billingForm.controls.lastName.disable();
        this.billingForm.controls.mi.disable();
        this.billingForm.controls.address1.disable();
        this.billingForm.controls.address2.disable();
        this.billingForm.controls.city.disable();
        this.billingForm.controls.zip.disable();
    }
    updateAddress(event: MatCheckbox): void {
        this.sameAddress = event.checked;
        if (this.sameAddress) {
            this.initializeBillingAddressForm(
                this.memberInfo.body.name.firstName,
                this.memberInfo.body.name.lastName,
                this.memberInfo.body.name.middleName,
                this.memberInfo.body.name.suffix,
                this.memberContact.body.address.address1,
                this.memberContact.body.address.address2,
                this.memberContact.body.address.city,
                this.memberContact.body.address.state,
                this.memberContact.body.address.zip,
            );
            this.billingForm.controls.firstName.disable();
            this.billingForm.controls.lastName.disable();
            this.billingForm.controls.mi.disable();
            this.billingForm.controls.address1.disable();
            this.billingForm.controls.address2.disable();
            this.billingForm.controls.city.disable();
            this.billingForm.controls.zip.disable();
        } else {
            this.initializeBillingAddressForm();
        }
    }

    /**
     * This method is used to check whether state is added and new card is selected or not
     * also this method is used to check if new account is added or not for bank draft to validate state and zip
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
    onBillingNext(): void {
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
        }
    }
    patchValues(): void {
        this.showBillingAddress = false;
        this.showSettingForm = true;
        if (this.applicationResp.length && this.applicationResp[0].payment) {
            this.initializeSettingForm(
                this.applicationResp[0].payment.payFrequency,
                this.applicationResp[0].payment.firstPaymentDay,
                this.applicationResp[0].payment.consent,
                this.applicationResp[0].payment.initial,
                this.applicationResp[0].payment.firstPaymentMonth,
            );
            // validate the entered date if the value is already present and show the error message
            this.validateEnteredDate();
        } else {
            this.initializeSettingForm();
        }
        if (this.reinstate) {
            this.appFlowService.reinstateLastCompletedBillingIndex$.next(3);
        } else {
            this.appFlowService.lastCompletedBillingIndex.next(3);
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
                            this.appFlowService.reinstateLastCompletedBillingIndex$.next(3);
                        } else {
                            this.appFlowService.lastCompletedBillingIndex.next(3);
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
    /**
     * When the payment type is bank draft,this method gets triggered to save the entered details
     */
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
                    this.savePaymentResponse();
                },
                (error) => {
                    this.showSpinner = false;
                    this.apiError = true;
                    const errors = error.error.details;
                    if (error.status === AppSettings.API_RESP_409) {
                        this.apiErrorMessage = this.language.fetchSecondaryLanguageValue("secondary.api.accountAlreadyExists");
                    } else {
                        this.apiErrorMessage = this.language.fetchSecondaryLanguageValue(
                            `secondary.api.${error.error.status}${error.error.code}`,
                        );
                    }
                    if (errors.length && errors[0].field === "routingNumber") {
                        this.routingApiError = true;
                        this.validateRoutingNumber();
                        this.bankDraftForm.controls.routingNumber.updateValueAndValidity();
                        this.apiErrorMessage = errors[0].message;
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
     * This method will return the masked account number
     * @param accountNumber selected bank account number
     * @return string masked account number
     */
    getMaskedAccountNumber(accountNumber: string): string {
        return this.utilService.getMaskedString(accountNumber, DISPLAY_ACCOUNT_NUMBER_MAX_LENGTH - accountNumber?.length);
    }
    /**
     * This function is used for setting the Payment Form for Direct Method
     * @param freq Used to set frequency of Payment
     * @param date Used to set date of payment for particular month
     * @param consent Used for setting user consent for payment
     * @param initial Used for setting User initials
     * @param month Used to set month of first payment
     * @returns void
     */
    initializeSettingForm(freq?: string, date?: string, consent?: boolean, initial?: string, month?: number): void {
        let monthToPopulate;
        if (month >= 0) {
            const currentDate = new Date();
            let currentMonth = currentDate.getMonth();
            if (currentDate.getDate() > this.lastDayOfMonth) {
                currentMonth = currentMonth + 1;
            }
            if (month >= currentMonth || (currentMonth + 1) % DateInfo.NUMBER_OF_MONTHS === month) {
                monthToPopulate = this.monthNames[month];
            } else {
                monthToPopulate = this.monthValues[0];
            }
        } else {
            monthToPopulate = this.monthValues[0];
        }
        if (this.showPin) {
            const callCenterPin = this.appFlowService.getcallCenterPin();
            let initials = null;
            if (initial && initial.length > 0) {
                initials = initial;
            } else if (callCenterPin && callCenterPin.length > 0) {
                initials = callCenterPin;
            }
            this.settingForm = this.fb.group({
                frequency: [freq ? freq : this.paymentFrequeny[0]],
                month: [monthToPopulate],
                date: [date, [Validators.required, Validators.min(1), Validators.max(this.lastDayOfMonth)]],
                agree: [consent, Validators.required],
                initials: [
                    initials,
                    [
                        Validators.required,
                        Validators.maxLength(25),
                        Validators.minLength(3),
                        Validators.pattern(this.validationRegex.ALPHANUMERIC_WITH_UNDERSCORE),
                    ],
                ],
            });
            if ((callCenterPin && callCenterPin.length > 0) || (initial && initial.length > 0)) {
                this.settingForm.get(INITIALS).disable();
            }
        } else {
            this.settingForm = this.fb.group({
                frequency: [freq ? freq : this.paymentFrequeny[0]],
                month: [monthToPopulate],
                date: [date, [Validators.required, Validators.min(1), Validators.max(this.lastDayOfMonth)]],
                agree: [consent, Validators.required],
                initials: [
                    this.isHeadset ? "" : initial,
                    this.isHeadset ? [] : [Validators.required, Validators.pattern(this.validationRegex.ALPHA), Validators.minLength(2)],
                ],
            });
        }
        if (this.isHeadset || this.isVf2f) {
            this.settingForm.controls.initials.disable();
        }
    }
    callService(): void {
        this.agreeCheckbox = false;
        this.apiError = false;
        const billingName = this.fetchBillingName();
        const billingAddress = this.fetchBillingAddress();
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
                .subscribe(
                    () => {
                        this.paymentId = this.creditCardAccount[this.selectedIndex]?.id;
                        this.savePaymentResponse();
                    },
                    () => (this.disableNextButton = false),
                );
            return;
        }
        if (!this.enablePaymetricBankDraft && this.selectedPaymentMethod === this.paymentType.BANKDRAFT) {
            this.bankDraftTempusResponsePayload = this.bankAccounts[this.selectedIndex];
            this.bankDraftTempusResponsePayload.accountNumber = this.bankDraftTempusResponsePayload.accountNumberLastFour;
            delete this.bankDraftTempusResponsePayload.accountNumberLastFour;
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
                        this.savePaymentResponse();
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
            this.savePaymentResponse();
        }
    }

    /**
     * If form is valid, proceed to payments.
     *
     * @memberof DirectPaymentComponent
     */
    savePaymentMethod(): void {
        this.disableNextButton = false;
        if (this.showPin && this.settingForm.valid) {
            this.appFlowService.setcallCenterPin(this.settingForm.get(INITIALS).value);
        }
        if (this.onlyVSP) {
            this.callService();
            // eslint-disable-next-line sonarjs/no-collapsible-if
        } else {
            if (this.settingForm.controls.agree.value && this.settingForm.valid) {
                this.disableNextButton = true;
                this.callService();
            } else {
                this.agreeCheckbox = true;
                this.disableNextButton = false;
            }
        }
    }

    /**
     * This method saves payment responses.
     */
    savePaymentResponse(): void {
        this.showSpinner = true;
        const paymentObservables = [];
        const updateCartObservables = [];
        this.paymentSteps.forEach((data) => {
            const value = [];
            if (this.onlyVSP) {
                //  Hardcoding needed here for VSP product
                const payloadData = {
                    payFrequency: "MONTHLY",
                    subscriberPaymentId: this.paymentId,
                    firstPaymentDay: "27",
                };
                value.push(payloadData);
            } else {
                const selectedMonth = this.settingForm.value.month;
                const monthIndex = this.monthNames.indexOf(selectedMonth);
                const payload = {
                    payFrequency: this.settingForm.value.frequency,
                    subscriberPaymentId: this.paymentId,
                    firstPaymentDay: this.settingForm.value.date,
                    consent: true,
                    initial: this.isHeadset || this.isVf2f ? this.customerInitial : this.settingForm.getRawValue()?.initials,
                    firstPaymentMonth: monthIndex,
                };
                value.push(payload);
            }
            const schema: ApplicationResponse = {
                stepId: data.steps[0].id,
                value: value,
                type: StepType.PAYMENT,
            };
            paymentObservables.push(this.shoppingCartService.saveApplicationResponse(this.memberId, data.itemId, this.mpGroup, [schema]));
        });
        if (this.cartItemsToUpdate && this.cartItemsToUpdate.length) {
            this.cartItemsToUpdate.forEach((cartItem, index) => {
                updateCartObservables.push(
                    this.shoppingService.updateCartItem(this.memberId, this.mpGroup, this.cartData[index].id, cartItem),
                );
            });
        }
        forkJoin(paymentObservables)
            .pipe(
                takeUntil(this.unsubscribe$),
                tap(() => {
                    if (updateCartObservables.length <= 0) {
                        return forkJoin(this.updateStore()).pipe(takeUntil(this.unsubscribe$));
                    }
                    return undefined;
                }),
                switchMap(() => {
                    if (updateCartObservables.length > 0) {
                        return forkJoin(updateCartObservables).pipe(switchMap(() => forkJoin(this.updateStore())));
                    }
                    return of(null);
                }),
            )
            .subscribe(
                () => {
                    this.showSpinner = false;
                    this.disableNextButton = false;
                    this.nextStep();
                },
                (error) => {
                    this.showSpinner = false;
                    this.disableNextButton = false;
                    this.apiError = true;
                    this.apiErrorMessage = this.language.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code);
                },
            );
    }

    updateStore(): Observable<any>[] {
        const storeUpdates = this.cartData.map((cartItem) =>
            this.store.dispatch(new UpdateApplicationResponse(this.memberId, cartItem.id, this.mpGroup)),
        );
        storeUpdates.push(this.store.dispatch(new SetCartItems(this.memberId, this.mpGroup)));
        return storeUpdates;
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
                this.appFlowService.lastCompleteStaticStep.next(3 + this.indexOfCurrentCarrier);
            } else {
                this.appFlowService.lastCompleteStaticStep.next(2 + this.indexOfCurrentCarrier);
            }
        }
    }
    /**
     * This function is used to get the Application response
     * @returns void
     */
    getApplicationResponse(): void {
        const appResponse = this.store.selectSnapshot(EnrollmentState.GetResponseItems);
        this.paymentSteps.forEach((data) => {
            if (!this.applicationResp.length) {
                const resp = appResponse.filter((item) => item.planId === data.planId).pop();
                if (resp) {
                    const frequency = resp.response.filter((res) => res.type === StepType.PAYMENT).pop();
                    const frequencyValue = frequency ? frequency.value[0] : null;
                    if (frequencyValue) {
                        this.applicationResp.push({ payment: frequencyValue });
                    }
                }
            }
        });
        if (this.applicationResp.length) {
            const id = this.applicationResp[0].payment.subscriberPaymentId;
            if (this.paymentMethods.length) {
                this.savedPaymentIdIndex = this.paymentMethods.findIndex((idx) => idx.id === id);
                if (this.savedPaymentIdIndex >= 0) {
                    const selectedPayment = this.paymentMethods[this.savedPaymentIdIndex].paymentType;
                    // when pnc config is on then selected Payment should either be bank draft or credit card in case of edit coverage
                    if (this.tempusPaymentConfig) {
                        this.selectedPaymentMethod =
                            selectedPayment === PaymentType.BANKDRAFT ? PaymentType.BANKDRAFT : PaymentType.CREDITCARD;
                    } else {
                        this.selectedPaymentMethod = selectedPayment;
                    }
                } else {
                    this.selectedPaymentMethod = PaymentType.BANKDRAFT;
                }
            }
        }
    }
    initializePaymentMethodForm(): void {
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
     * Get month options for first payment date.
     */
    getMonthValues(): void {
        const currentDate = new Date();
        let currentMonth = currentDate.getMonth();
        if (currentDate.getDate() > this.lastDayOfMonth) {
            currentMonth = currentMonth + 1;
        }
        // setting greatest month if coverage starts in future
        if (this.isCoverageInFuture) {
            currentMonth = this.dateService.toDate(this.greatestCoverageDate).getMonth();
        }
        const nextMonth = currentMonth + 1;
        this.monthValues.push(
            this.monthNames[currentMonth % DateInfo.NUMBER_OF_MONTHS],
            this.monthNames[nextMonth % DateInfo.NUMBER_OF_MONTHS],
        );
    }
    checkCarriers(): void {
        // 59 carrier Id is for VSP this has to be hardcode for getting the flag
        this.onlyVSP = this.onlyAflac = this.bothCarriers = false;
        if (this.paymentSteps.length === 1 && this.paymentSteps[0].carrierId === 59) {
            this.onlyVSP = true;
        } else {
            this.onlyAflac = true;
        }
        if (this.paymentSteps.length > 1 && this.paymentSteps.findIndex((carrier) => carrier.carrierId === 59) > -1) {
            this.bothCarriers = true;
        } else if (this.paymentSteps.length > 1) {
            this.onlyAflac = true;
        }
    }

    /**
     * this method is used to get the string with leading zeroes if the expiration month is in between 1 to 9 else
     * will return the expiration date without change
     * @param cardData credit or debit card data
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
     * Opens payment prompt with tempus iframe to Enter credit/debit card data
     * @param boolean value
     */
    openPaymentPrompt(editModal?: boolean): void {
        this.disableAddCard = true;
        const promptData = {} as PaymentPromptDataModel;
        promptData.memberId = this.memberId;
        promptData.mpGroup = this.mpGroup;
        if (editModal) {
            promptData.editModal = editModal;
            promptData.creditCardDetails = this.creditCardAccount[this.selectedIndex];
            this.empoweredModalService
                .openDialog(PaymentDetailsPromptComponent, { data: promptData })
                .afterClosed()
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((creditCard) => {
                    this.disableAddCard = false;
                    if (creditCard) {
                        this.creditCardExpirationDate = this.getExpirationDate(creditCard);
                        this.isCardNotExpired = this.checkFutureDate(creditCard);
                        this.creditCardAccount[this.selectedIndex] = creditCard;
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
                        return this.empoweredModalService.openDialog(PaymentDetailsPromptComponent, { data: promptData }).afterClosed();
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
                        if (repAddData) {
                            this.tempusResponsePayload = repAddData;
                            this.showNoCardError = !this.tempusResponsePayload;
                            this.isCardNotExpired = true;
                        }
                        return this.memberService.getPaymentMethods(this.memberId, this.mpGroup);
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe((paymentMethods) => {
                    if (paymentMethods) {
                        this.paymentMethods = paymentMethods;
                        this.mapPayments();
                        // to get last added credit card on top
                        this.creditCardAccount.sort((card1, card2) => card1.id - card2.id);
                        this.selectedIndex = this.creditCardAccount.length - 1;
                        this.paymentId = this.creditCardAccount[this.selectedIndex].id;
                        this.selectedAccount = this.creditCardAccount[this.selectedIndex]?.lastFour;
                        this.creditCardExpirationDate = this.getExpirationDate(this.creditCardAccount[this.selectedIndex]);
                    }
                });
        }
        this.editCardModal = false;
    }
    /**
     * The method is used to update the year to the date-picker
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
            const ctrlValue = this.dateService.toDate(this.debitCardForm.value.expirationDate);
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
     * @param type is paymentType selected
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

    /**
     * Save credit card info to database.
     */
    saveCreditCard(): void {
        const billingName = this.fetchBillingName();
        const billingAddress = this.fetchBillingAddress();
        const tokens: Token[] = [{ carrierId: CarrierId.VSP_INDIVIDUAL_VISION, token: this.paymetricAccessTokenVsp }];
        if (!this.tempusPaymentConfig) {
            tokens.push({ carrierId: CarrierId.AFLAC, token: this.paymetricAccessTokenAflac });
        }
        const cardLength = this.creditCardForm.controls.cardNumber.value.toString().length;
        const lastFour = this.creditCardForm.controls.cardNumber.value.substr(cardLength - 4);
        const expirationDate = this.dateService.toDate(this.creditCardForm.controls.expirationDate.value);
        const payload: AddPayment = {
            name: "Card ending in " + lastFour,
            paymentType: this.paymentType.CREDITCARD,
            type: this.cardType,
            tokens,
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
                    this.savePaymentResponse();
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

    /**
     * Save debit card info to database.
     */
    saveDebitCard(): void {
        const cardLength = this.debitCardForm.controls.cardNumber.value.toString().length;
        const lastFour = this.debitCardForm.controls.cardNumber.value.substr(cardLength - 4);
        const expirationDate = this.dateService.toDate(this.debitCardForm.controls.expirationDate.value);
        const tokens: Token[] = [{ carrierId: CarrierId.VSP_INDIVIDUAL_VISION, token: this.paymetricAccessTokenVsp }];
        if (!this.tempusPaymentConfig) {
            tokens.push({ carrierId: CarrierId.AFLAC, token: this.paymetricAccessTokenAflac });
        }
        const payload: AddPayment = {
            name: "Card ending in " + lastFour,
            paymentType: this.paymentType.DEBITCARD,
            type: this.cardType,
            tokens,
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
                    this.savePaymentResponse();
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
            .fetchConfigs(
                [ConfigName.TELEPHONE_INITIAL_PLACEHOLDER, ConfigName.TELEPHONE_SIGNATURE_PLACEHOLDER, ConfigName.AUTHORIZATION_AGREEMENT],
                this.mpGroup,
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([customerInitial, customerSign, showSignerAgreement]) => {
                this.customerInitial = customerInitial.value.split(",")[0];
                this.customerSign = customerSign.value.split(",")[0];
                this.showSignerAgreement = showSignerAgreement.value === TRUE_VALUE;
            });
    }
    /**
     * The method is used to perform the edit functionality for the various payment methods (Bank draft, credit card and debit card)
     */
    editAccount(): void {
        if (!this.enableDebitCardBilling && this.selectedPaymentMethod === this.paymentType.CREDITCARD) {
            this.editCardModal = true;
            this.openPaymentPrompt(this.editCardModal);
        } else if (!this.enablePaymetricBankDraft && this.selectedPaymentMethod === this.paymentType.BANKDRAFT) {
            this.editCardModal = true;
            this.openBankDraftPrompt(this.editCardModal);
        } else {
            this.isCardNotExpired = true;
            this.selectedRadio = this.paymentMethodForm.controls[METHOD].value;
            this.filterPaymentMethod();
            const data: DialogData = {
                selectedIndex: this.dropdownData[this.selectedIndex],
                selectedPaymentMethod: this.selectedRadio,
                edit: true,
                mpGroup: this.mpGroup,
                memberId: this.memberId,
                isACHPartnerAccountType: this.isACHPartnerAccountType,
                isAccountTypeDisabled: this.disableDropdown,
            };
            const addressDialog = this.empoweredModalService.openDialog(EditDeletePaymentComponent, {
                data,
            });
            addressDialog.afterClosed().subscribe((editedPaymentData) => {
                this.memberService
                    .getPaymentMethods(this.memberId, this.mpGroup)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        (paymentData) => {
                            this.paymentMethods = paymentData;
                            this.mapAccountData(editedPaymentData);
                            if (editedPaymentData) {
                                if (editedPaymentData?.updatedData?.paymentType === PaymentType.CREDITCARD) {
                                    this.creditCardExpirationDate = this.getExpirationDate(editedPaymentData?.updatedData);
                                } else if (editedPaymentData?.updatedData?.paymentType === PaymentType.DEBITCARD) {
                                    this.debitCardExpirationDate = this.getExpirationDate(editedPaymentData?.updatedData);
                                }
                            }
                            const selectedBankAccount = this.bankAccounts[this.selectedIndex];
                            this.routingNumberLastFourDigits = selectedBankAccount
                                ? selectedBankAccount.routingNumber.substring(ROUTING_NUMBER_STARTING_INDEX, ROUTING_NUMBER_ENDING_INDEX)
                                : "";
                        },
                        (err) => {
                            this.apiError = true;
                            this.apiErrorMessageDisplay(err);
                        },
                    );
            });
        }
    }
    /**
     * This function is used to map the selected account data
     * @param editedPaymentData updated payment data
     */
    mapAccountData(editedPaymentData: PaymentEditPopUpClose): void {
        if (this.selectedRadio === PaymentType.BANKDRAFT) {
            this.mapPayments();
            this.bankAccounts.forEach((bankAccount, index) => {
                if (editedPaymentData && bankAccount.id === editedPaymentData.id) {
                    this.selectedIndex = index;
                    this.selectedAccount = editedPaymentData.updatedData.accountName;
                }
            });
        } else if (this.selectedRadio === PaymentType.CREDITCARD) {
            this.mapPayments();
            this.creditCardAccount.forEach((creditAccount, index) => {
                if (editedPaymentData && creditAccount.id === editedPaymentData.id) {
                    this.selectedIndex = index;
                    this.selectedAccount = editedPaymentData.updatedData.lastFour;
                }
            });
        } else if (this.selectedRadio === PaymentType.DEBITCARD) {
            this.mapPayments();
            this.debitCardAccount.forEach((debitAccount, index) => {
                if (editedPaymentData && debitAccount.id === editedPaymentData.id) {
                    this.selectedIndex = index;
                    this.selectedAccount = editedPaymentData.updatedData.lastFour;
                }
            });
        }
    }
    /**
     * The method is used to perform the delete functionality for the various payment methods (Bank draft, credit card and debit card)
     */
    deleteAccount(): void {
        this.selectedRadio = this.paymentMethodForm.controls[METHOD].value;
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
        addressDialog.afterClosed().subscribe(
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

    /**
     * Validate entered date is within range in relation to current date and in acceptable range within the month.
     * If valid, retrieve pricing.
     */
    validateEnteredDate(): void {
        const currentDate = this.isCoverageInFuture ? this.dateService.toDate(this.greatestCoverageDate) : new Date();
        const currentDay = currentDate.getDate();
        let currentYear = currentDate.getFullYear();
        if (this.settingForm) {
            const enteredMonth = this.settingForm.value.month;
            const enteredMonthIndex = this.monthNames.indexOf(enteredMonth);
            const enteredDate: number = this.settingForm.value.date;

            const thirtyDate = this.thirtyDayCheckDate.getDate();
            const thirtyDateMonth = this.thirtyDayCheckDate.getMonth();

            // if the next month falls in next year
            if (enteredMonthIndex < currentDate.getMonth()) {
                currentYear += 1;
            }
            if (enteredDate && enteredDate <= currentDay && enteredMonthIndex === currentDate.getMonth()) {
                this.settingForm.controls.date.setErrors({ pastDate: true });
            } else if (enteredMonthIndex === thirtyDateMonth && enteredDate > thirtyDate) {
                this.settingForm.controls.date.setErrors({ thirtyDayPassed: true });
            } else if (enteredDate && enteredDate > 0 && enteredDate <= this.lastDayOfMonth) {
                this.settingForm.controls.date.setErrors(null);
                const coverageEffectiveDate = this.datepipe.transform(
                    (enteredMonthIndex + 1).toString() + "/" + enteredDate.toString() + "/" + currentYear.toString(),
                    AppSettings.DATE_FORMAT_YYYY_MM_DD,
                );
                if (
                    !this.isCoverageDateDifferent &&
                    this.cartData.filter((cartItem) => cartItem.coverageEffectiveDate !== coverageEffectiveDate).pop()
                ) {
                    this.isCoverageDateDifferent = true;
                }
                if (this.isCoverageDateDifferent && !this.reinstate) {
                    const isTobaccoUser = this.appFlowService.getTobaccoStatus();
                    this.moreSettings = this.appFlowService.getTobaccoSettings(
                        isTobaccoUser,
                        coverageEffectiveDate,
                        this.cartData && this.cartData.length > 0 ? this.cartData[0] : null,
                    );
                    this.calculatePremium(coverageEffectiveDate, this.cartData);
                }
            }
        }
    }
    /**
     * Function to get tobacco status based on rider/ plan
     * @param application application of plan
     * @param isRider indicates riders or not
     * @param riderPlanId planId of rider incase of rider
     * @returns boolean indicating Tobacco response for respective rider/ Plan
     */
    getTobaccoResponse(application: BasePlanApplicationPanel, isRider: boolean, riderPlanId: number): boolean {
        let applicationData: BasePlanApplicationPanel = application;
        if (isRider && riderPlanId) {
            applicationData = application.riders?.filter((app) => app.appData.planId === riderPlanId).pop();
        }
        this.planObject = {
            application: applicationData,
            basePlanId: application.planId,
            isRider: isRider,
        };

        this.isJuvenile =
            this.juvenilePlanIds &&
            this.juvenilePlanIds.length &&
            applicationData &&
            applicationData.appData &&
            this.juvenilePlanIds.includes(applicationData.appData.planId.toString());

        return applicationData && this.appFlowService.getTobaccoResponse(this.planObject);
    }
    /**
     * Method to calculate the premium for the cart item
     * @param coverageEffectiveDate Shop coverge effective dates
     * @param cartData cartData of the cart item
     */
    calculatePremium(coverageEffectiveDate: string, cartData: GetCartItems[]): void {
        this.disableNextButton = true;
        const priceObservables: Observable<PlanOfferingPricing[]>[] = [];
        const cartItemIds: number[] = [];
        cartData.forEach((cartItem) => {
            this.enrollmentState = cartItem.enrollmentState;
            const application: BasePlanApplicationPanel = this.applicationsData.filter((app) => app.cartData.id === cartItem.id).pop();
            let riskClassOverrideId: number;
            if (cartItem.riskClassOverrideId) {
                riskClassOverrideId = cartItem.riskClassOverrideId;
            } else if (application.carrierId === CarrierId.AFLAC) {
                const currentAccount = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
                if (currentAccount && currentAccount.ratingCode === RatingCode.DUAL) {
                    riskClassOverrideId = this.appFlowService.getDualAccountRiskClassId(application.productId);
                } else {
                    riskClassOverrideId = this.store.selectSnapshot(EnrollmentState.GetMemberData).riskClassId;
                }
            }
            const planOfferingId = cartItem?.planOffering?.id || cartItem.planOfferingId;
            if (application) {
                this.moreSettings.tobaccoUser = this.getTobaccoResponse(application, false, null);
                priceObservables.push(
                    this.getPlanOfferingPricing(
                        this.moreSettings,
                        planOfferingId.toString(),
                        coverageEffectiveDate,
                        riskClassOverrideId,
                        null,
                        application,
                    ),
                );
                cartItemIds.push(cartItem.id);
            }

            if (application && cartItem.riders && cartItem.riders.length) {
                cartItem.riders.forEach((riderCart) => {
                    cartItemIds.push(riderCart.cartItemId);
                    this.moreSettings.tobaccoUser = this.getTobaccoResponse(application, true, riderCart.planId);
                    priceObservables.push(
                        this.getPlanOfferingPricing(
                            this.moreSettings,
                            riderCart.planOfferingId.toString(),
                            coverageEffectiveDate,
                            riskClassOverrideId,
                            riderCart,
                            application,
                        ),
                    );
                });
            }
        });
        forkJoin(priceObservables)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {
                    this.cartItemsToUpdate = this.appFlowService.getUpdatedCartItems(
                        cartItemIds,
                        resp,
                        cartData,
                        coverageEffectiveDate,
                        true,
                    );
                    const cost = this.appFlowService.getPremiumCostDetails(this.cartItemsToUpdate);
                    this.setFrequencyCost(cost);
                    this.disableNextButton = false;
                },
                (error) => {
                    this.disableNextButton = false;
                    this.apiError = true;
                    this.apiErrorMessage = this.language.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code);
                    // set the error message on payment day if the api returns applicantMustBeYounger error response
                    if (error?.error?.details?.length) {
                        const ageExceededError = error.error.details.find(
                            (errorField) => errorField.field === this.APPLICANT_MUST_BE_YOUNGER,
                        );
                        if (ageExceededError) {
                            this.settingForm.controls.date.setErrors({ ageExceeded: true });
                            this.ageExceededErrorMessage = ageExceededError.message;
                            this.settingForm.controls.date.markAsTouched();
                        }
                    }
                },
            );
        this.store.dispatch(new SetDirectPaymentCost(this.carrierId, this.reinstate));
    }
    /**
     * Gets getPlanOfferingPricing observable to get prices
     * @param tobaccoSettings tobacco settings of base/rider
     * @param planOfferingId planOffering id of base/rider
     * @param coverageEffectiveDate coverage effective date of base
     * @param riskClassOverrideId risk class override id of base cart item
     * @param riderCartItem cart item of rider
     * @param application application of base plan
     * @returns Observable<PlanOfferingPricing[]> to get prices
     */
    getPlanOfferingPricing(
        tobaccoSettings: MoreSettings,
        planOfferingId: string,
        coverageEffectiveDate: string,
        riskClassOverrideId: number,
        riderCartItem?: RiderCartItem,
        application?: BasePlanApplicationPanel,
    ): Observable<PlanOfferingPricing[]> {
        let basePlanId: number;
        let dependentAge: number;
        let benefitAmount: number;
        if (riderCartItem && riderCartItem.baseRiderId) {
            basePlanId = riderCartItem.baseRiderId;
        } else if (application) {
            basePlanId = application.planId;
        }
        if (this.isJuvenile && this.dependents && !this.planObject.rider) {
            dependentAge = this.planObject.application.cartData.dependentAge || 0;
            benefitAmount = this.planObject.application.cartData.benefitAmount || null;
        }
        const planPricingEndPoint$ = this.shoppingService.getPlanOfferingPricing(
            planOfferingId,
            this.enrollmentState,
            tobaccoSettings,
            this.memberId,
            this.mpGroup,
            riderCartItem ? basePlanId : null,
            riderCartItem ? application.cartData.coverageLevelId : null,
            benefitAmount,
            dependentAge,
            coverageEffectiveDate,
            riskClassOverrideId,
            true,
            application ? application.cartData.id : null,
        );
        return planPricingEndPoint$;
    }

    /**
     * This method gets called when card is valid and initializing billing address form if billing form is undefined
     * @returns void
     */
    callIfCardIsValid(): void {
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
    }

    /**
     * Get configurations and access tokens and use payment type to call Paymetric service.
     * @param type type of payment
     */
    callPaymetricService(type: PaymentType): void {
        this.showSpinner = true;
        const observables: [Observable<Configurations[]>, Observable<string>] = [
            this.staticService.getConfigurations(ConfigName.PAYMETRIC_MERCHANT_GUID_VSP, this.mpGroup),
            this.applicationService.getPaymetricAccessToken(CarrierId.VSP_INDIVIDUAL_VISION),
        ];
        if (this.tempusPaymentConfig && (type === PaymentType.CREDITCARD || type === PaymentType.DEBITCARD)) {
            forkJoin(observables)
                .pipe(
                    switchMap(([vspConfiguration, vspPaymetricAccessToken]) => {
                        this.paymetricAccessTokenVsp = vspPaymetricAccessToken;
                        if (type === PaymentType.CREDITCARD) {
                            return this.onVspCardNext(this.creditCardForm.value.cardNumber, vspConfiguration[0].value);
                        }
                        return this.onVspCardNext(this.debitCardForm.value.cardNumber, vspConfiguration[0].value);
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe(
                    (paymetricData) => {
                        if (paymetricData.HasPassed) {
                            this.callIfCardIsValid();
                        } else {
                            this.showSpinner = false;
                            this.apiError = true;
                            this.apiErrorMessage = paymetricData.Message;
                        }
                    },
                    (error) => {
                        this.showSpinner = false;
                        this.apiError = true;
                        this.apiErrorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
                    },
                );
        } else {
            const vspAflacObservables: [
                Observable<Configurations[]>,
                Observable<string>,
                Observable<Configurations[]>,
                Observable<string>,
            ] = [
                ...observables,
                this.staticService.getConfigurations(ConfigName.PAYMETRIC_MERCHANT_GUID_AFLAC, this.mpGroup),
                this.applicationService.getPaymetricAccessToken(CarrierId.AFLAC),
            ];
            forkJoin(vspAflacObservables)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    ([vspConfiguration, vspPaymetricAccessToken, aflacConfiguration, aflacPaymetricAccessToken]) => {
                        this.paymetricAccessTokenVsp = vspPaymetricAccessToken;
                        this.paymetricAccessTokenAflac = aflacPaymetricAccessToken;
                        if (type === PaymentType.CREDITCARD) {
                            this.onCardNext(this.creditCardForm.value.cardNumber, vspConfiguration[0].value, aflacConfiguration[0].value);
                        } else if (type === PaymentType.DEBITCARD) {
                            this.onCardNext(this.debitCardForm.value.cardNumber, vspConfiguration[0].value, aflacConfiguration[0].value);
                        }
                    },
                    (error) => {
                        this.showSpinner = false;
                        this.apiError = true;
                        this.apiErrorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
                    },
                );
        }
    }

    /**
     * this method will get called when tempusPaymentConfig is enabled and card selected is credit card
     * @param cardNumber credit card number
     * @param vspMerchantId vsp merchant id when tempusPaymentConfig is enabled
     * @returns observable of paymetric data
     */
    onVspCardNext(cardNumber: string, vspMerchantId: string): Observable<PayMetricData> {
        this.showSpinner = true;
        return this.paymetricService.isValidCard(cardNumber, this.paymetricAccessTokenVsp, vspMerchantId);
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
                        this.callIfCardIsValid();
                    } else {
                        this.showSpinner = false;
                        this.apiError = true;
                        this.apiErrorMessage = results[0].Message;
                    }
                },
                (error) => {
                    this.showSpinner = false;
                    this.apiError = true;
                    this.apiErrorMessage = this.language.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code);
                },
            );
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
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
