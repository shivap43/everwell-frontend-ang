import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from "@angular/core";

import {
    DateFormats,
    ConfigName,
    Permission,
    CarrierId,
    SHOP_SUCCESS,
    BooleanConst,
    ServerErrorResponseCode,
    ProductId,
    TpiSSOModel,
    PayFrequency,
    BeneficiaryType,
    Validity,
    GroupedCartItems,
    PayFrequencyObject,
    CompanyCode,
    AppSettings,
    CoverageLevelNames,
    DualPlanYearSettings,
    EnrollmentMethod,
    Portals,
    Characteristics,
    ContactType,
    TaxStatus,
    PlanYearType,
    CountryState,
    Product,
    MemberCredential,
    ProducerCredential,
    GroupAttributeEnum,
    Enrollments,
    MemberProfile,
    Relations,
    MemberDependent,
    MemberFlexDollar,
    PlanFlexDollarOrIncentives,
    EnrollmentInformation,
    Accounts,
    MemberContact,
    StatusType,
    MemberContactListDisplay,
    PaymentType,
    Admin,
    MemberQualifyingEvent,
    PlanYear,
    GroupAttribute,
    EbsPaymentRecord,
    DateFormat,
    DateFnsFormat,
    EbsPaymentFileEnrollment,
    ToastType,
    PartnerAccountType,
} from "@empowered/constants";
import { Store } from "@ngxs/store";
import {
    ShoppingService,
    BenefitsOfferingService,
    MemberService,
    EnrollmentService,
    AccountService,
    GetShoppingCart,
    ShoppingCartDisplayService,
    AflacService,
    StaticService,
    ApplicationStatusTypes,
    PayrollDeductions,
    EnrollmentMethodType,
    EmploymentStatus,
    QLEEndPlanRequestStatus,
    CarrierStatus,
    EnrollmentStatus,
    CoreService,
    MemberQLETypes,
    AdminService,
    STATUS,
    PdaForm,
    MemberListDisplayItem,
    PendingEnrollmentReason,
    SendReminderMode,
    PendingReasonForPdaCompletion,
    ThirdPartyPlatforms,
    AflacAlwaysService,
} from "@empowered/api";
import {
    ConfirmAddressDialogComponent,
    OfferingListPopupComponent,
    PayrollFrequencyCalculatorPipe,
    PlanDetailsComponent,
    SendApplicantPdaComponent,
    CartWarningPopupComponent,
    NewPdaComponent,
    BenefitOfferingUtilService,
    EBSRequiredInfoComponent,
    EBSInfoModalComponent,
    DropDownPortalComponent,
    OpenToast,
    ToastModel,
    EnrollmentMethodComponent,
} from "@empowered/ui";
import { DatePipe } from "@angular/common";
import { UserService } from "@empowered/user";
import { forkJoin, Subscription, of, Subject, Observable, combineLatest, EMPTY, iif } from "rxjs";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { FormGroup, FormBuilder } from "@angular/forms";
import { EditCoverageComponent } from "../edit-coverage/edit-coverage.component";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { OverlayRef } from "@angular/cdk/overlay";

import {
    EnrollmentState,
    MemberInfoState,
    AccountListState,
    TPIState,
    AccountInfoState,
    QleOeShopModel,
    EnrollmentMethodState,
    SetEnrollmentMethodSpecific,
    SetMemberIdentity,
    SetMemberInfo,
    SetDateFilterInfo,
    EnrollmentMethodModel,
    CoverageSummaryFilterInfo,
    SharedState,
    ApplicationStatusService,
    StaticUtilService,
    UtilService,
    DualPlanYearService,
    AccountTypes,
} from "@empowered/ngxs-store";
import { NgxMaskPipe } from "ngx-mask";
import { VoidCoverageComponent } from "../edit-coverage/void-coverage/void-coverage.component";
import { PdaCompletionComponent } from "../pda-completion/pda-completion.component";
import { BenefitSummaryService, AccountsBusinessService, SharedService, EmpoweredModalService } from "@empowered/common-services";
import { catchError, filter, finalize, map, switchMap, take, takeUntil, tap } from "rxjs/operators";
import { EndCoverageComponent } from "../end-coverage/end-coverage.component";
import { DateService } from "@empowered/date";
import { TpiServices } from "@empowered/common-services";
const EAA_URL = "general.download.eaa.url";
const CBS_RULE = "general.feature.enable.cross_border_sales_rule";
const SLASH = "/";
const BLANK = "_blank";
const DOCUMENT = "Application";

interface Details {
    id: any;
}

const TPI_SHOP_ROUTE = "tpi/shop";
const AUTOENROLLABLE = "AUTOENROLLABLE";
const CHARACTERISTICS_AUTOENROLLABLE_INDEX = 1;
const IS_TPI_END_COVERAGE = "true";
const HQ_ACCOUNT = "is_hq_account";
const TRUE_VALUE = "TRUE";
const PAYROLL_PERIOD = "Per pay period";
const COVERAGE_SUMMARY = "COVERAGE_SUMMARY";
const TWO = 2;
const SEND_PDA_APPLICATION = "send";
const ADD_MEMBER_CONTACT = "addContact";
const DATE_LENGTH = 10;
const TOAST_DURATION = 5000;
const TPI = "/tpi";

@Component({
    selector: "empowered-coverage-summary",
    templateUrl: "./coverage-summary.component.html",
    styleUrls: ["./coverage-summary.component.scss"],
})
export class CoverageSummaryComponent implements OnInit, OnDestroy {
    @ViewChild("priceDisplayFilterDropdown") priceDisplayFilterDropdown: DropDownPortalComponent;
    @ViewChild("enrollDateFilterDropdown") enrollDateFilterDropdown: DropDownPortalComponent;
    specificEnrollmentObj: EnrollmentMethodModel;
    visitedMpGroupStateObj: string[];
    storedState: CountryState[];
    enrollmentState: any;
    activeCarrierStatus = STATUS.ACTIVE;
    enrollEndDisplayFlag = false;
    benefitsOffered = true;
    oeFlag = false;
    continuousProductList = [];
    MemberInfo: MemberProfile;
    mpGroupId: any;
    currentQualifyingEvents: MemberQualifyingEvent[];
    getPortal: any;
    qleData: any;
    eventTypes: any;
    qleList: MemberQualifyingEvent[];
    dataSource: MemberQualifyingEvent[];
    currentDate = new Date();
    qleFlag = false;
    subscriptions: Subscription[] = [];
    planYearsData = [];
    outsideOeQleFlag = false;
    planId: string;
    enrollData = {
        data: [],
        beneficiaries: [],
        enrollmentRiders: [],
        enrollmentDependents: [],
    };
    enrolledRiders: Enrollments[] = [];
    availProductsFlag = false;
    availProducts: any;
    memberDetails: any;
    checkFlag = false;
    qleCoverageEndDate: any;
    oneDay = 1000 * 60 * 60 * 24;
    oeCoverageEndDate: number;
    days: string;
    EnrollmentDialogRef: any;
    mpGroupObj: any;
    firstName: string;
    availPlanYears = [];
    maxAvailPYDate: string;
    accPayFrequencyId: number;
    payFrequency: PayFrequency;
    dependentRelations: Relations[] = [];
    currentCoverage = [];
    previousCoverage = [];
    futureCoverage = [];
    isPendingEnrollment = false;
    showPrevious = false;
    applications = false;
    isMemberPortal = false;
    hasCurrentCoverage = false;
    accountId: number;
    memberId: number;
    nextPayrollDeductionDate: Date | string;
    isnextPayrollDeductionDate = false;
    mpGroup: string;
    accountDetails: any;
    accountName = "";
    enrollmentMethod = "FACE_TO_FACE";
    expandPlanOfferings = "plan.productId";
    coverageStartDatePlaceHolder = "##coverageStartDate##";
    memberShopLink = "../../../../wizard/welcome";
    pyFlag = "*";
    pyList = [];
    abbreviation: any;
    products = [];
    isExpanded = false;
    preTaxBaseCost = 0;
    preTaxAdjustment = 0;
    preTaxTotalCost = 0;
    postTaxBaseCost = 0;
    postTaxAdjustment = 0;
    postTaxTotalCost = 0;
    payrollDeductionAmount = 0;
    payFrequencyName: string;
    isLoading = true;
    priceDisplay: string;
    priceDisplayFilters = [];
    benefitSummary = [
        {
            title: "",
            data: [],
            isHide: false,
            isPreviousEnrollment: false,
        },
    ];
    pyOutsideOE = [];
    continuousProductsFlag = false;
    planYearProductsFlag = false;
    displayAllProducts = false;
    outsideOEEnrollmentFlag = false;
    memberContact = [];
    filterOpen = false;
    // TODO - Language needs to be implemented
    dateFilters = ["Specific date", "Date range"];
    dateFilterForm: FormGroup;
    isSpecificDateSelected = false;
    isDateRangeSelected = false;
    payFrequencyObject = {
        payFrequencies: [],
        pfType: "",
        payrollsPerYear: 0,
    };
    payrollDeductionTitle = "";
    payrollDeductionSubTitle: string;
    // TODO - Language needs to be implemented
    monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    selectedPriceFilter = ": Per pay period";
    selectedDateFilter = "";
    memberFullName = "";
    onlyPreviousCoverage = false;
    availProductsFlagOE = false;
    outsideOeMmpFlag = false;
    oeMmpFlag = false;
    qleMmpFlag = false;
    memberCartDetails: GetShoppingCart;
    memberEnrollmentMethod = "SELF_SERVICE";
    qleOutsideOEFlag = false;
    contOutsideOEFlag = false;
    mmpInOE = false;
    zeroCartFlag = false;
    cartFlag = false;
    year: number;
    oeMaxDate: string;
    notEnrolled = [];
    qleMaxDate: string;
    isFilterApplied = false;
    zeroStateFlag = false;
    isAdmin = false;
    memberEnrollments: any[] = [];
    memberMPGroupId: number;
    minDate = null;
    maxDate = null;
    showContacts = false;
    state: any;
    memberContacts: any;
    contactList: MemberContactListDisplay[] = [];
    emailContacts = [];
    textContacts = [];
    selectedContactValue;
    contactForm: FormGroup;
    requestSent = false;
    hasMemberContact = false;
    portal: string;
    cartItems = [];
    configurationSubscriber: Subscription;
    unpluggedFeatureFlag = false;
    isShopEnabled = true;
    email = "email";
    phoneNumber = "phoneNumber";
    datePickerErrorMessage = "";
    enrollByDate: Date | string;
    noOfDaysLeft: number;
    planOfferingIds = [];
    payrollDeductions: PayrollDeductions[] = [];
    lapsedStatus = ApplicationStatusTypes.Lapsed;
    declinedStatus = ApplicationStatusTypes.Declined;
    pendingStatus = ApplicationStatusTypes.Pending;
    voidStatus = ApplicationStatusTypes.Void;
    approvedStatus = ApplicationStatusTypes.Approved;
    applicationDenied = ApplicationStatusTypes.Application_denied;
    postTax = TaxStatus.POSTTAX;
    preTax = TaxStatus.PRETAX;
    unknownTaxStatus = TaxStatus.UNKNOWN;
    endedStatus = ApplicationStatusTypes.Ended;
    QLE_STATUS_COVERAGE_CANCELLED = QLEEndPlanRequestStatus.COVERAGE_CANCELLED;
    QLE_STATUS_REQUEST_SUBMITTED = QLEEndPlanRequestStatus.COVERAGE_CANCELLATION_REQUEST_SUBMITTED;
    QLE_STATUS_PENDING_HR_APPROVAL = QLEEndPlanRequestStatus.PENDING_HR_APPROVAL;
    Juvenile = AppSettings.JUVENILE;
    creditCard = PaymentType.CREDITCARD;
    bankDraft = PaymentType.BANKDRAFT;
    debitCard = PaymentType.DEBITCARD;
    showErrorMessage: boolean;
    downloadError: boolean;
    hideShopOptions = false;
    errorMessage: string;
    isEndCoverage: boolean[] = [];
    isAGFutureEndCoverage: boolean[] = [];
    canDisplayEndCoverage: boolean[] = [];
    isVoidCurrentCoverage: boolean[] = [];
    isVoidFutureCoverage: boolean[] = [];
    coverageType = { current: "current coverage", future: "future coverage" };
    oeShopCoverageButton: string;
    qleShopUpdateButton: string;
    isPdaSaved = false;
    isHeadset = false;
    isTpiAccount = false;
    isHqAccount = false;
    showShopConfig = true;
    shopPermission = false;
    enrollMethodType = EnrollmentMethod.FACE_TO_FACE;
    EMPLOYEE_NAME_PLACEHOLDER = "##employeeName##";
    PLAN_YEAR_QLE_PLACEHOLDER = "##planYearQLE##";
    PLAN_DATE_PLACEHOLDER = "##planDate##";
    PLAN_YEAR_OE_PLACEHOLDER = "##planYearOE##";
    PLAN_OFFERING_ID = "planOfferingId";
    AFLAC_GROUP_CARRIER_ID = CarrierId.AFLAC_GROUP;
    planYearInfo: PlanYear[] = [];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.coverage.accountending",
        "primary.portal.coverage.addlifeevent",
        "primary.portal.coverage.adjustment",
        "primary.portal.coverage.aflacalways",
        "primary.portal.coverage.anapplication",
        "primary.portal.coverage.application",
        "primary.portal.coverage.apply",
        "primary.portal.coverage.avalaibleproducts",
        "primary.portal.coverage.awaiting",
        "primary.portal.coverage.awaitingapproval",
        "primary.portal.coverage.basecost",
        "primary.portal.coverage.beneficiary",
        "primary.portal.coverage.benefitamount",
        "primary.portal.coverage.benefits",
        "primary.portal.coverage.benefitsenroll",
        "primary.portal.coverage.beneiftready",
        "primary.portal.coverage.cardnumber",
        "primary.portal.coverage.clear",
        "primary.portal.coverage.continueenroll",
        "primary.portal.coverage.continueupdate",
        "primary.portal.coverage.cost",
        "primary.portal.coverage.coveragedate",
        "primary.portal.coverage.coveragedateoeleft",
        "primary.portal.coverage.coveragedateqleleft",
        "primary.portal.planDetails.title",
        "primary.portal.coverage.coverageDates",
        "primary.portal.coverage.coveredindividuals",
        "primary.portal.coverage.currently",
        "primary.portal.coverage.current_coverage",
        "primary.portal.coverage.currrentlyavaliable",
        "primary.portal.coverage.date",
        "primary.portal.coverage.deduction",
        "primary.portal.coverage.downloadapplication",
        "primary.portal.coverage.editcoverage",
        "primary.portal.coverage.eligibleupdate",
        "primary.portal.coverage.eliminationperiod",
        "primary.portal.coverage.enddate",
        "primary.portal.coverage.enrollleft",
        "primary.portal.coverage.enrollment",
        "primary.portal.coverage.enrollpy",
        "primary.portal.coverage.filter",
        "primary.portal.coverage.filterbydate",
        "primary.portal.coverage.finish",
        "primary.portal.coverage.future_coverage",
        "primary.portal.coverage.header",
        "primary.portal.coverage.hide",
        "primary.portal.coverage.lifechange",
        "primary.portal.coverage.lifeevent",
        "primary.portal.coverage.manage",
        "primary.portal.coverage.need",
        "primary.portal.coverage.next_payroll",
        "primary.portal.coverage.notenrolled",
        "primary.portal.coverage.notenrolledbenefits",
        "primary.portal.coverage.notenrolledbenefit",
        "primary.portal.coverage.oecoverageenddate",
        "primary.portal.coverage.payroll",
        "primary.portal.coverage.plan_name",
        "primary.portal.coverage.policyno",
        "primary.portal.coverage.pretax",
        "primary.portal.coverage.previous_coverage",
        "primary.portal.coverage.pricedisplay",
        "primary.portal.coverage.productsavalaible",
        "primary.portal.coverage.product_name",
        "primary.portal.coverage.progress",
        "primary.portal.coverage.progressupdate",
        "primary.portal.coverage.qlecoverageenddate",
        "primary.portal.coverage.qleCoverageleft",
        "primary.portal.coverage.qlecoveragelifeevent",
        "primary.portal.coverage.qlemaxdate",
        "primary.portal.coverage.recentlychanges",
        "primary.portal.coverage.riders",
        "primary.portal.coverage.shop",
        "primary.portal.coverage.specialenrollment",
        "primary.portal.coverage.specificdate",
        "primary.portal.coverage.startdate",
        "primary.portal.coverage.status",
        "primary.portal.coverage.view",
        "primary.portal.coverage.viewcoverage",
        "primary.portal.coverage.welcomemsg",
        "primary.portal.coverage.youhave",
        "primary.portal.coverage.justleft",
        "primary.portal.coverage.yearcoverage",
        "primary.portal.coverage.daterange",
        "primary.portal.coverage.edit",
        "primary.portal.coverage.posttax",
        "primary.portal.coverage.taxstatus",
        "primary.portal.coverage.makecoverage",
        "primary.portal.coverage.leftenroll",
        "primary.portal.coverage.lefttomake",
        "primary.portal.coverage.carrierstatus",
        "primary.portal.editCoverage.benefitamount",
        "primary.portal.coverage.benefitDollars",
        "primary.portal.coverage.offerlistDescription",
        "primary.portal.coverage.unknown",
        "primary.portal.common.addLifeEvent",
        "primary.portal.coverage.specailend",
        "primary.portal.coverage.just",
        "primary.portal.coverage.enrollin",
        "primary.portal.coverage.estate",
        "primary.portal.coverage.charity",
        "primary.portal.coverage.nextpayroll.deduction",
        "primary.portal.common.send",
        "primary.portal.coverage.signed",
        "primary.portal.coverage.notify",
        "primary.portal.coverage.sent",
        "primary.portal.common.dateHint",
        "primary.portal.coverage.addcontactInfo",
        "primary.portal.coverage.startdate.validation",
        "primary.portal.coverage.datePicker",
        "primary.portal.coverage.currently.avaliable",
        "primary.portal.coverage.justvisit",
        "primary.portal.coverage.pageenroll",
        "primary.portal.coverage.declined",
        "primary.portal.coverage.payroll.deduction",
        "primary.portal.coverage.Pendingcustomersignature",
        "primary.portal.coverage.approved",
        "primary.portal.coverage.Ended",
        "primary.portal.coverage.Pendingcarrierapproval",
        "primary.portal.coverage.pendingadminapproval",
        "primary.portal.coverage.PendingPDAcompletion",
        "primary.portal.coverage.Pending3rdpartyapproval",
        "primary.portal.coverage.pendingadminapproval",
        "primary.portal.coverage.Applicationdenied",
        "primary.portal.coverage.Lapsed",
        "primary.portal.editCoverage.void",
        "primary.portal.headset.email",
        "primary.portal.headset.text",
        "primary.portal.headset.noemailaddress",
        "primary.portal.headset.nomobile",
        "primary.portal.benefitSummary.show",
        "primary.portal.benefitSummary.hide",
        "primary.portal.coverage.aflacalways",
        "primary.portal.coverage.accountNumberEnding",
        "primary.portal.coverage.cardNumberEnding",
        "primary.portal.coverage.allEligibleDependents",
        "primary.portal.coverage.coverageStartDate",
        "primary.portal.endCoverage.endCoverage",
        "primary.portal.editCoverage.voidCoverage",
        "primary.portal.benefitSummary.eaaStatusPendingReason",
        "primary.portal.enrollments.eaaRequiredStatus",
        "primary.portal.accountEnrollments.incompleteMissingEAAMessage",
        "primary.portal.accountEnrollments.incompleteMissingEAAMessage.anchor",
        "primary.portal.coverage.policyEnds",
        "primary.portal.coverage.endCoverageRequested",
        "primary.portal.coverage.postTaxToolTip",
        "primary.portal.coverage.preTaxToolTip",
        "primary.portal.coverage.days",
        "primary.portal.coverage.day",
        "primary.portal.coverage.benefitReady",
        "primary.portal.apostropheSuffix",
        "primary.portal.coverageSummary.payrollDeductionDateMessage",
        "primary.portal.shoppingExperience.yourCost",
        "primary.portal.coverage.completePDA",
        "primary.portal.members.coverage.dualPlanYear.shopCoverage",
        "primary.portal.members.coverage.dualPlanYear.coverage.updateCurrentCoverage",
        "primary.portal.members.coverage.dualPlanYear.newCoverage.lifeEvent",
        "primary.portal.members.coverage.dualPlanYear.enrollNextYear",
        "primary.portal.members.coverage.dualPlanYear.updateCoverage",
        "primary.portal.members.coverage.dualPlanYear.coverageUpdates",
        "primary.portal.members.coverage.dualPlanYear.enrollmentOpen",
        "primary.portal.members.coverage.dualPlanYear.nextYearCoverage",
        "primary.portal.members.coverage.dualPlanYear.lifeEvent",
        "primary.portal.members.coverage.dualPlanYear.openEnrollment",
        "primary.portal.noCoverage.dualPlanYear.coverageUpdate",
        "primary.portal.noCoverage.dualPlanYear.coverageUpdateContent",
        "primary.portal.members.wizard.dualPlanYear.continueEnrollment",
        "primary.portal.noCoverage.dualPlanYear.enrollmentInProgress",
        "primary.portal.noCoverage.dualPlanYear.enrollmentEnds",
        "primary.portal.noCoverage.dualPlanYear.continueEnrollment",
        "primary.portal.members.wizard.dualPlanYear.continueCoverage",
        "primary.portal.applicationFlow.payments.billing",
        "primary.portal.editCoverage.employerContribution",
        "primary.portal.noCoverage.dualPlanYear.coverageUpdate.future",
        "primary.portal.members.coverage.dualPlanYear.updateCoverage.future",
        "primary.portal.members.coverage.dualPlanYear.coverage.updateCurrentCoverage.future",
        "primary.portal.members.coverage.dualPlanYear.coverage.updateCurrentCoverage.current",
        "primary.portal.noCoverage.dualPlanYear.coverageUpdateContent.current",
        "primary.portal.noCoverage.dualPlanYear.coverageUpdateContent.future",
        "primary.portal.members.coverage.dualPlanYear.lifeEvent.future",
        "primary.portal.members.coverage.dualPlanYear.lifeEvent.current",
        "primary.portal.coverageSummary.viewCoverage",
        "primary.portal.coverageSummary.filterByDate",
        "primary.portal.coverageSummary.priceDisplay",
        "primary.portal.accountEnrollments.filterEnrollment.dateRange",
        "primary.portal.pinSignature.endDate",
        "primary.portal.common.startDate",
        "primary.portal.accountEnrollments.filterEnrollment.specificDate",
        "primary.portal.endCoverage.noAdminTooltip",
        "primary.portal.applicationFlow.ebs.infoMsg",
        "primary.portal.applicationFlow.ebs.link",
        "primary.portal.applicationFlow.ebs.successfulMsg",
        "primary.portal.applicationFlow.ebs.warningMsg",
        "primary.portal.coverage.signed.aflac.always",
    ]);
    overlayRef: OverlayRef;
    buttonLabel = this.languageStrings["primary.portal.benefitSummary.show"];
    @ViewChild("moreFilterOrigin") moreFilterOrigin: ElementRef;
    adminPortalFlag = false;
    nonDeniedCoverage = "coverage-nondenied";
    deniedCoverage = "coverage-denied";
    showDateRangeOptions = false;
    isEndedStatusFilterApplied = false;
    DECLINED_COVERAGE_LEVEL_ID = 2;
    private readonly unsubscribe$ = new Subject<void>();
    charity = BeneficiaryType.CHARITY.toUpperCase();
    individual = BeneficiaryType.INDIVIDUAL.toUpperCase();
    trust = BeneficiaryType.TRUST.toUpperCase();
    estate = BeneficiaryType.ESTATE.toUpperCase();
    pendingEnrollmentReason = PendingEnrollmentReason;
    monthly = "MONTHLY";
    ACTIVE = CarrierStatus.ACTIVE;
    member = "/member";
    hideShopButton = false;
    isEAAMissing = false;
    allowCrossBorderCheck = false;
    qleStatus = "";
    readonly IS_VOID = "Void";
    readonly CANCELLED = "CANCELLED";
    CURRENT_COVERAGE = "Current coverage";
    FUTURE_COVERAGE = "Future coverage";
    dateFormat = AppSettings.DATE_FORMAT_MM_DD_YYYY;
    currentCoverageQleStatuses: string[] = [];
    futureCoverageQleStatuses: string[] = [];
    currentCoverageEndDates: string[] = [];
    futureCoverageEndDates: string[] = [];
    isCancelCurrentCoverages: boolean[] = [];
    isCancelFutureCoverages: boolean[] = [];
    planLevelflexDollars: PlanFlexDollarOrIncentives[] = [];
    isBenefitDollarConfigEnabled: boolean;
    isTPI = false;
    tpiSSODetail: TpiSSOModel;
    carrierStatusesCheckForQLE: string[] = [];
    partnerIdsNotEligibleForEdit: string[] = [];
    NOT_ALLOWED_CARRIER_STATUS = "user.enrollment.policy.override_qle_pending_statuses";
    NOT_ALLOWED_PARTNER_IDS_FOR_EDIT = "user.benefit_summary.edit.partner_list";
    CARRIER_STATUS_INDEX = 0;
    PARTNER_ID_INDEX = 0;
    EAALink: string;
    isDualPlanYear = false;
    isQleDuringOeEnrollment = false;
    isQleAfterOeEnrollment = false;
    cartContainsOf: string;
    MEMBER = "member";
    SUCCESS = "SUCCESS";
    ONE_YEAR = 1;
    QLE_INDEX = 0;
    NEXT_PLAN_YEAR_INDEX = 1;
    CART_INDEX = 0;
    LENGTH_ZERO = 0;
    dualPlanYearData: QleOeShopModel;
    lifeEventEnrollment: string;
    existingQleDescription: string;
    openEnrollment: string;
    oeDescription: string;
    qleTitle: string;
    oeTitle: string;
    qleDescription: string;
    tpiShopRoute: string;
    weeklyPayrollsPerYear: number;
    payFrequencies: PayFrequency[] = [];
    offerListDescription: string;
    UserPermissions = Permission;
    flexDollars: MemberFlexDollar[] = [];
    readonly NEW_YORK_ABBR = "NY";
    readonly OHIO_ABBR = "OH";
    isSelfEnrollment = false;
    hasPrivilege$ = of(false);
    policiesExpired: boolean[] = [];
    producerId: number;
    statusEnded = EnrollmentStatus.ended;
    partnerId = "";
    tpiEndCoverageEnable$: Observable<boolean>;
    readonly SHORT_TERM_DISABILITY = ProductId.SHORT_TERM_DISABILITY;
    readonly DISPLAY_INDIVIDUAL = "Individual";
    readonly ENROLLED = "Enrolled";
    readonly ENROLLMENT_CANCEL_UPDATE_PERMISSION = Permission.ENROLLMENT_UPDATE_CANCEL;
    allowEditCoverageForPartnerId = false;
    allAdmins: Admin[] = [];
    hasAdmin = false;
    isAccountProducer = true;
    readonly PENDING_CARRIER_APPROVAL = EnrollmentStatus.pending_carrier_approval;
    showPRStateForm: boolean;
    unsignedPDAForms: PdaForm[] = [];
    pdaFormId: number;
    disableSendReminder = false;
    isEBSIndicator$: Observable<boolean>;
    isEBSPaymentConfigEnabled: boolean;
    ssnConfirmationEnabled: boolean;
    ebsPaymentFailed = false;
    paymentPresent = false;
    currentEbsOnfile: EbsPaymentRecord;
    enrollIds: number[] = [];
    ebsReqDialog: MatDialogRef<EBSRequiredInfoComponent, any>;
    isTpiEndCoverageAllowed = false;

    readonly PAY_FREQUENCY_SHORT_LENGTH = 20;
    ebsInfoDialog: MatDialogRef<EBSInfoModalComponent, any>;
    isAflacAlways$: Observable<boolean>;
    isEnrolled: boolean;
    sendReminderHeaderText: string = this.languageStrings["primary.portal.coverage.signed"];

    constructor(
        private readonly store: Store,
        private readonly memberService: MemberService,
        private readonly shoppingService: ShoppingService,
        private readonly benefitService: BenefitsOfferingService,
        private readonly datePipe: DatePipe,
        private readonly maskPipe: NgxMaskPipe,
        private readonly enrollmentsService: EnrollmentService,
        private readonly userService: UserService,
        private readonly dialog: MatDialog,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly accService: AccountService,
        private readonly fb: FormBuilder,
        private readonly language: LanguageService,
        private EditCoverageDialogRef: MatDialogRef<EditCoverageComponent>,
        private readonly shoppingCartService: ShoppingCartDisplayService,
        private readonly aflacService: AflacService,
        private readonly staticService: StaticService,
        private readonly utilService: UtilService,
        private readonly sharedService: SharedService,
        private readonly staticUtilService: StaticUtilService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly payrollFrequencyPipe: PayrollFrequencyCalculatorPipe,
        private readonly coreService: CoreService,
        private readonly dualPlanYearService: DualPlanYearService,
        private readonly adminService: AdminService,
        private readonly benefitSummaryService: BenefitSummaryService,
        private readonly accountBusinessService: AccountsBusinessService,
        private readonly applicationStatusService: ApplicationStatusService,
        private readonly benefitOfferingUtilService: BenefitOfferingUtilService,
        private readonly dateService: DateService,
        readonly dialogRef: MatDialogRef<EBSRequiredInfoComponent>,
        private readonly tpiService: TpiServices,
        private readonly aflacAlwaysService: AflacAlwaysService,
    ) {
        this.subscriptions.push(
            this.userService.credential$.subscribe((credential: MemberCredential) => {
                if (credential.groupId) {
                    this.memberMPGroupId = credential.groupId;
                }
            }),
        );
    }
    /**
     * Initializes the component.
     * Sets required configurations.
     * @memberof CoverageSummaryComponent
     */
    ngOnInit(): void {
        this.subscriptions.push(
            this.sharedService.checkAgentSelfEnrolled().subscribe((response) => {
                this.isSelfEnrollment = response;
            }),
        );
        this.subscriptions.push(
            this.userService.credential$.subscribe((credential: ProducerCredential) => {
                this.producerId = credential.producerId;
            }),
        );

        this.isTPI = this.router.url.indexOf(AppSettings.TPI) > 0;
        this.tpiSSODetail = this.store.selectSnapshot(TPIState.tpiSsoDetail);
        this.showErrorMessage = false;
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.*"));
        this.payrollDeductionTitle = this.languageStrings["primary.portal.coverage.nextpayroll.deduction"];
        this.portal = this.store.selectSnapshot(SharedState.portal);
        if (this.portal) {
            this.portal = "/" + this.portal.toString().toLowerCase();
        }
        this.dateFilterForm = this.fb.group({
            priceFilter: [PAYROLL_PERIOD],
            specificDate: [""],
            startDate: [""],
            endDate: [""],
            enrollDateFilter: [""],
            priceDisplayFilterDropdown: [""],
        });
        const mpGroupObject: any = this.store.selectSnapshot(AccountListState.getGroup);
        if (mpGroupObject) {
            if (mpGroupObject.state) {
                this.state = mpGroupObject.state;
            } else if (mpGroupObject.situs) {
                this.state = mpGroupObject.situs.state.abbreviation;
            }
        }

        this.currentDate.setHours(0, 0, 0, 0);
        this.year = this.currentDate.getFullYear();
        this.getPortal = this.store.selectSnapshot(SharedState.portal);
        if (this.isTPI) {
            this.getPortal =
                this.tpiSSODetail.user.producerId || this.store.selectSnapshot(TPIState.getTPIProducerId)
                    ? Portals.PRODUCER
                    : Portals.MEMBER;
            this.tpiEndCoverageEnable$ = this.staticService
                .getConfigurations(ConfigName.TPI_END_COVERAGE_ENABLE, this.tpiSSODetail.user.groupId)
                .pipe(map((custom) => custom[0].value.toLowerCase() === IS_TPI_END_COVERAGE));
            this.producerId = this.tpiSSODetail.user.producerId;
            this.portal = TPI;

            // logic to fetch value memberEnrollmentCancellationAllowed if it is tpi
            this.subscriptions.push(
                this.tpiService
                    .isMemberCancellationAllowed(this.tpiSSODetail.user.groupId.toString())
                    .subscribe((isMemberCancellationAllowed) => (this.isTpiEndCoverageAllowed = isMemberCancellationAllowed)),
            );
        }
        this.memberId = this.isTPI ? this.tpiSSODetail.user.memberId : this.store.selectSnapshot(MemberInfoState.GetMemberId);
        if (!this.memberId) {
            this.memberId = this.store.selectSnapshot(EnrollmentState.GetMemberId);
        }
        if (this.getPortal === Portals.ADMIN) {
            this.adminPortalFlag = true;
        }
        if (this.getPortal === Portals.MEMBER) {
            this.isMemberPortal = true;
            this.subscriptions.push(
                this.userService.credential$
                    .pipe(
                        tap((response) => {
                            this.memberDetails = response;
                            this.memberFullName = this.isTPI
                                ? `${this.tpiSSODetail.user.name.firstName} ${this.tpiSSODetail.user.name.lastName}`
                                : `${this.memberDetails.name.firstName} ${this.memberDetails.name.lastName}`;
                            this.accountId = this.isTPI ? this.tpiSSODetail.user.groupId : this.memberDetails.groupId;
                            this.memberId = this.isTPI ? this.tpiSSODetail.user.memberId : this.memberDetails.memberId;
                            this.firstName = this.isTPI ? this.tpiSSODetail.user.name.firstName : this.memberDetails.name.firstName;
                            this.mpGroupId = this.isTPI ? this.tpiSSODetail.user.groupId : this.memberDetails.groupId;
                            if (this.memberDetails.status === EmploymentStatus.TERMINATED) {
                                this.hideShopOptions = true;
                            }
                        }),
                        switchMap(() => this.importAflacPolicies(this.memberId, this.accountId)),
                        switchMap(() => this.getRelationshipTypes()),
                        switchMap(() => this.getDualPlanYearData()),
                    )
                    .subscribe(),
            );
        } else {
            this.isMemberPortal = false;
            this.isAdmin = this.getPortal === Portals.ADMIN ? true : false;
            this.mpGroupId = this.isTPI ? this.tpiSSODetail.user.groupId : this.store.selectSnapshot(AccountListState.getMpGroupId);
            this.mpGroupObj = this.store.selectSnapshot(AccountListState.getGroup);
            this.accountId = this.isTPI ? this.tpiSSODetail.user.groupId : this.mpGroupId;
            this.importAflacPolicies(this.memberId, this.accountId).pipe(takeUntil(this.unsubscribe$)).subscribe();
            this.memberService
                .getPaymentMethodsForAflacAlways(this.memberId, this.accountId)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((data) => {
                    if (data.length > 0) {
                        this.isEnrolled = true;
                        this.sendReminderHeaderText = this.languageStrings["primary.portal.coverage.signed.aflac.always"];
                    }
                });
        }

        this.getConfigurationSpecifications();
        this.staticUtilService
            .cacheConfigEnabled("general.feature.enable.benefitDollars")
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((benefitDollarEnabled) => benefitDollarEnabled),
                switchMap((benefitDollarEnabled) => this.getMemberFlexDollars()),
            )
            .subscribe();
        this.hasPrivilege$ = this.utilService
            .checkDisableForRole12Functionalities(Permission.TPP_RESTRICTED_PERMISSION, this.mpGroupId.toString())
            .pipe(map(([isRestricted, accountData]) => !(isRestricted && accountData.thirdPartyPlatformsEnabled)));
        this.subscriptions.push(
            // check for admins in the account
            this.adminService.getAccountAdmins(this.mpGroupId, "roleId,reportsToId").subscribe((response) => {
                this.allAdmins = response;
                this.hasAdmin = Boolean(response.length);
            }),
        );
        if (this.producerId) {
            this.getProducerDetails();
        }
        this.checkShopPageAccess();
        this.isEBSIndicator$ = this.accService
            .getGroupAttributesByName([GroupAttributeEnum.EBS_INDICATOR], +this.mpGroupId)
            .pipe(map((ebsIndicator: GroupAttribute[]) => ebsIndicator[0].value === "true"));
        if (this.isEBSPaymentConfigEnabled) {
            this.callEbsPaymentOnFile(this.enrollIds);
        }

        // Method to check whether to show Aflac Always Card
        this.checkAflacAlways();
    }

    /**
     * Method to pre-populate the filter details
     */
    setFilter(): void {
        const filterInfo = this.store.selectSnapshot(EnrollmentMethodState.getDateFilterInfo);
        if (filterInfo && (filterInfo.specificDate || filterInfo.startDate || filterInfo.endDate)) {
            this.dateFilterForm.controls.priceFilter.setValue(filterInfo.priceFilter || PAYROLL_PERIOD);
            if (filterInfo.specificDate) {
                this.isSpecificDateSelected = true;
                this.dateFilterForm.controls.specificDate.setValue(filterInfo.specificDate);
            } else if (filterInfo.startDate || filterInfo.endDate) {
                this.isDateRangeSelected = true;
                this.dateFilterForm.controls.startDate.setValue(filterInfo.startDate);
                this.dateFilterForm.controls.endDate.setValue(filterInfo.endDate);
            }
            this.applyDateRangeFilter();
            if (filterInfo.priceFilter && !this.isMemberPortal && !this.isDateRangeSelected && !this.isSpecificDateSelected) {
                this.changePriceDisplayFilter();
            }
        }
    }
    /**
     * Method to get member flex dollars
     * @return the observable with a list of member flex dollars
     */
    getMemberFlexDollars(): Observable<MemberFlexDollar[]> {
        return this.accService.getFlexDollarsOfMember(this.memberId, null).pipe(
            tap((response) => {
                this.flexDollars = response.map((flexDollar) => ({ ...flexDollar, isApproved: true }));
            }),
        );
    }

    /**
     * This method has a service call to import Aflac Policies
     * @param memberId of type number
     * @param mpGroup of type number
     * @returns aflac policies, plan years, member info or void
     */
    importAflacPolicies(
        memberId: number,
        mpGroup: number,
    ): Observable<void | Product[] | [PayFrequency[], MemberContact[]] | [MemberProfile, MemberContact[]]> {
        return this.aflacService.importAflacPolicies(memberId, mpGroup).pipe(
            switchMap((response) => this.benefitService.getPlanYears(mpGroup, false, true)),
            switchMap((response) => {
                this.planYearInfo = response;
                return this.getRequiredInfo();
            }),
            catchError((error) => this.getRequiredInfo()),
            takeUntil(this.unsubscribe$),
        );
    }
    /**
     * Method to get required info based on portal
     * @returns {Observable<Product[] | [PayFrequency[], MemberContact[]] | [MemberProfile, MemberContact[]]>}
     */
    getRequiredInfo(): Observable<Product[] | [PayFrequency[], MemberContact[]] | [MemberProfile, MemberContact[]]> {
        if (this.isMemberPortal) {
            return this.setMemberRequiredInfo();
        }
        return this.getMemberInfo();
    }
    /**
     * This method is to download EAA file
     * */
    downloadFile(): void {
        window.open(this.EAALink, BLANK);
    }
    /**
     * This method gets list of carrier statuses when QLE status should not be pulled.
     * Also gets the list of partner ids which are not eligible for edit
     * @returns void
     */
    getConfigurationSpecifications(): void {
        this.subscriptions.push(
            combineLatest([
                this.staticUtilService.fetchConfigs(
                    [
                        this.NOT_ALLOWED_CARRIER_STATUS,
                        this.NOT_ALLOWED_PARTNER_IDS_FOR_EDIT,
                        ConfigName.UNPLUGGED_CONFIG,
                        ConfigName.EBS_PAYMENT_FEATURE_ENABLE,
                    ],
                    this.mpGroupId,
                ),
                this.staticUtilService.cacheConfigs([
                    ConfigName.PR_PDA_TEMPLATE,
                    ConfigName.CROSS_BORDER_RULE_ENABLED,
                    EAA_URL,
                    ConfigName.BENEFIT_DOLLARS,
                    ConfigName.SSN_CONFIRMATION_ENABLED,
                ]),
            ]).subscribe(
                ([
                    [carrierStatusesCheckForQLE, partnerIdsNotEligibleForEdit, unpluggedFeatureFlag, isEBSConfigEnabled],
                    [prStatePDAConfigValue, allowCrossBorderCheck, EAALink, isBenefitDollarConfigEnabled, ssnConfirmationEnabled],
                ]) => {
                    this.carrierStatusesCheckForQLE = carrierStatusesCheckForQLE?.value.split(",");
                    this.ssnConfirmationEnabled = this.staticUtilService.isConfigEnabled(ssnConfirmationEnabled);
                    this.partnerIdsNotEligibleForEdit = partnerIdsNotEligibleForEdit?.value.split(",");
                    if (this.partnerIdsNotEligibleForEdit?.length) {
                        const accountInfo = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
                        if (!this.isSelfEnrollment && accountInfo) {
                            this.partnerId = accountInfo.partnerId.toString();
                            this.allowEditCoverageForPartnerId =
                                this.partnerId && !this.partnerIdsNotEligibleForEdit.includes(this.partnerId);
                        }
                    }
                    this.unpluggedFeatureFlag = this.staticUtilService.isConfigEnabled(unpluggedFeatureFlag);
                    this.showPRStateForm = this.staticUtilService.isConfigEnabled(prStatePDAConfigValue);
                    this.allowCrossBorderCheck = this.staticUtilService.isConfigEnabled(allowCrossBorderCheck);
                    this.EAALink = EAALink.value;
                    this.isBenefitDollarConfigEnabled = this.staticUtilService.isConfigEnabled(isBenefitDollarConfigEnabled);
                    this.isEBSPaymentConfigEnabled = this.staticUtilService.isConfigEnabled(isEBSConfigEnabled);
                },
            ),
        );
    }

    /**
     * Function to check shop page access
     */
    checkShopPageAccess(): void {
        this.accountBusinessService
            .checkPermissions(this.mpGroupId.toString())
            .pipe(
                switchMap(([accountInfo, permissionConfig, groupAttribute, permissions]) => {
                    this.isTpiAccount = accountInfo.thirdPartyPlatformsEnabled;
                    this.showShopConfig = permissionConfig[0].value === TRUE_VALUE;
                    this.isHqAccount = groupAttribute[0].attribute === HQ_ACCOUNT && groupAttribute[0].value === BooleanConst.TRUE;
                    if (permissions.length > 0) {
                        this.shopPermission = Boolean(permissions.some((resp) => String(resp) === Permission.RESTRICT_SHOP));
                    }
                    this.isShopEnabled = !(this.shopPermission && this.showShopConfig && this.isTpiAccount && !this.isHqAccount);
                    return this.benefitService.getApprovalRequests(this.mpGroupId, true);
                }),
                tap((resp) => {
                    this.benefitsOffered = !!resp.length;
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * This method checks if a particular enrollment is eligible for end coverage.
     * End coverage link should not be visible when QLE added is of type BY_REQUEST
     * @returns void
     */
    checkEndCoverage(): void {
        this.currentCoverage.forEach((coverage, index) => {
            let isByRequestQle = false;
            if (coverage.qualifyingEventId) {
                const matchingQualifyingEvent = this.currentQualifyingEvents.find(
                    (currentQualifyingEvents) => currentQualifyingEvents.id === coverage.qualifyingEventId,
                );
                isByRequestQle =
                    this.currentQualifyingEvents &&
                    this.currentQualifyingEvents.length &&
                    matchingQualifyingEvent &&
                    matchingQualifyingEvent.type.description === MemberQLETypes.BY_REQUEST;
            }
            const coverageStartDate = this.dateService.toDate(coverage.validity.effectiveStarting).setHours(0, 0, 0, 0);
            const today = this.currentDate.setHours(0, 0, 0, 0);

            // For Aflac plans (carrier id =1), display end coverage only if the coverage status is Approved.
            // Based on MON-73272 ticket the enrollment status check is not added to other carriers
            this.isEndCoverage[index++] =
                coverage.plan.carrier &&
                ((coverage.status === EnrollmentStatus.approved && !isByRequestQle && coverage.plan.carrier.id === CarrierId.AFLAC) ||
                    coverage.plan.carrier.id === CarrierId.AFLAC_GROUP ||
                    coverage.plan.carrier.id === CarrierId.ADV ||
                    coverage.plan.carrier.id === CarrierId.ARGUS) &&
                coverageStartDate <= today;
        });
    }

    /**
     * Function to check AG coverage end date
     */
    checkAGEndCoverage(): void {
        const agPlanYears = this.planYearInfo.filter((planYear) => planYear.type === PlanYearType.AFLAC_GROUP);
        this.futureCoverage.forEach((coverage, index) => {
            if (coverage.plan.carrier && coverage.plan.carrier.id === CarrierId.AFLAC_GROUP) {
                if (!agPlanYears.length) {
                    this.isAGFutureEndCoverage[index] = true;
                } else {
                    this.isAGFutureEndCoverage[index] = agPlanYears.some(
                        (planYear) => coverage.planOffering && planYear.id !== coverage.planOffering.planYearId,
                    );
                }
                this.canDisplayEndCoverage[index] =
                    coverage.validity.expiresAfter && coverage.validity.expiresAfter > coverage.validity.effectiveStarting;
            }
        });
    }

    managePendingEnrollment(): void {
        this.router.navigate(["../../../pending-applications/view-enrollments/manage"], {
            relativeTo: this.route,
        });
    }
    /**
     * Set required info for MMP
     * @returns {Observable<Product[]>}
     */
    setMemberRequiredInfo(): Observable<Product[]> {
        return forkJoin([
            this.accService.getAccount(this.accountId.toString()),
            this.memberService.getMember(this.memberId, true, this.accountId.toString()),
            this.accService.getPayFrequencies(this.memberDetails.groupId),
        ]).pipe(
            tap(([acc, member, payFrequencies]) => {
                this.accountDetails = acc;
                this.accountName = acc.name;
                this.MemberInfo = member.body;
                this.accPayFrequencyId = member.body.workInformation.payrollFrequencyId;
                this.payFrequencies = [...payFrequencies];
                this.payFrequencyObject.payFrequencies = [...payFrequencies];
                this.payFrequency = payFrequencies.find((frequency) => frequency.id.toString() === this.accPayFrequencyId.toString());
                this.payFrequencyObject.pfType = this.payFrequency.name;
                const monthlypayFrequency = payFrequencies.find((ele) => ele.frequencyType === this.monthly);
                this.payFrequencyObject.payrollsPerYear = monthlypayFrequency.payrollsPerYear;
                this.payFrequencyName = this.payFrequency.name;
                if (member.body.workInformation.termination.terminationDate) {
                    this.hideShopOptions = true;
                }
                this.hideShopButtonHireDateClause(member.body);
                this.setOfferListDescriptionTag();
            }),
            switchMap((res) => this.getMemberCoverageData()),
        );
    }
    /**
     * Method to get member info
     * @returns observable of Product[] or array containing PayFrequency[], MemberContact[],
     * MemberProfile[]
     */
    getMemberInfo(): Observable<Product[] | [PayFrequency[], MemberContact[]] | [MemberProfile, MemberContact[]]> {
        return forkJoin([
            this.memberService.getMember(this.memberId, true, this.mpGroupId),
            this.memberService.getMemberContacts(this.memberId, this.mpGroupId),
        ]).pipe(
            tap(([member, contact]) => {
                this.MemberInfo = member.body;
                this.MemberInfo.address = contact[0].address;

                this.memberId = this.MemberInfo.id;
                if (this.MemberInfo.workInformation.termination.terminationDate) {
                    this.hideShopOptions = true;
                }
                this.hideShopButtonHireDateClause(this.MemberInfo);
                this.accPayFrequencyId = this.MemberInfo.workInformation.payrollFrequencyId;

                this.firstName = this.MemberInfo.name.firstName;
                this.memberFullName = `${this.MemberInfo.name.firstName} ${this.MemberInfo.name.lastName}`;
            }),
            switchMap((res) => this.getAccountDetails()),
            switchMap((res) => this.getRelationshipTypes()),
            switchMap((res) => this.setRequiredInfo()),
            catchError((error) => {
                this.showErrorAlertMessage(error);
                return EMPTY;
            }),
        );
    }
    /**
     * This method sets boolean value for void coverages
     * @returns void
     */
    setIsVoids(): void {
        if (this.currentCoverage.length) {
            this.currentCoverage.forEach((coverage, index) => {
                this.isVoidCurrentCoverage[index] =
                    coverage.feedSentDate === undefined &&
                    coverage.carrierStatus === undefined &&
                    coverage.status !== this.IS_VOID &&
                    coverage.status !== this.CANCELLED &&
                    coverage.status !== EnrollmentStatus.ended;
                if (
                    coverage.plan.characteristics &&
                    (coverage.plan.characteristics.includes(Characteristics.AUTOENROLLABLE) ||
                        coverage.plan.characteristics.includes(Characteristics.COMPANY_PROVIDED) ||
                        coverage.plan.characteristics.includes(Characteristics.DECLINE))
                ) {
                    this.isVoidCurrentCoverage[index] = false;
                }
            });
        }
        if (this.futureCoverage.length) {
            this.futureCoverage.forEach((coverage, index) => {
                this.isVoidFutureCoverage[index] =
                    coverage.feedSentDate === undefined &&
                    coverage.carrierStatus === undefined &&
                    coverage.status !== this.IS_VOID &&
                    coverage.status !== this.CANCELLED &&
                    coverage.status !== EnrollmentStatus.ended;
                if (
                    coverage.plan.characteristics &&
                    (coverage.plan.characteristics.includes(Characteristics.AUTOENROLLABLE) ||
                        coverage.plan.characteristics.includes(Characteristics.COMPANY_PROVIDED) ||
                        coverage.plan.characteristics.includes(Characteristics.DECLINE))
                ) {
                    this.isVoidFutureCoverage[index] = false;
                }
            });
        }
    }
    /**
     * This method will hide shop button if hire date of employee is in future.
     * @param memberInfo containing information of particular employee
     */
    hideShopButtonHireDateClause(memberInfo: MemberProfile): void {
        this.hideShopButton =
            !memberInfo.workInformation.hireDate ||
            this.dateService.checkIsAfter(this.dateService.toDate(memberInfo.workInformation.hireDate));
    }
    /**
     * Method to set required info for MPP/MAP
     * @returns Observable of Product[] or array containing PayFrequency[], MemberContact[]
     */
    setRequiredInfo(): Observable<Product[] | [PayFrequency[], MemberContact[]]> {
        return forkJoin([
            this.accService.getPayFrequencies(this.mpGroupId),
            this.memberService.getMemberContacts(this.memberId, this.mpGroupId),
        ]).pipe(
            tap((res) => {
                this.payFrequencyObject.payFrequencies = [...res[0]];
                this.payFrequency = res[0].find((frequency) => frequency.id.toString() === this.accPayFrequencyId.toString());
                this.payFrequencyObject.pfType = this.payFrequency.name;
                this.payFrequencies = [...res[0]];
                const monthlypayFrequency = res[0].find((ele) => ele.frequencyType === "MONTHLY");
                this.payFrequencyObject.payrollsPerYear = monthlypayFrequency.payrollsPerYear;

                this.payFrequencyName = this.payFrequency.name;
                this.priceDisplayFilters.push("Per pay period");
                if (this.payFrequencyName !== "Monthly") {
                    this.priceDisplayFilters.push("Monthly");
                }
                this.priceDisplayFilters.push("Yearly");
                this.memberContacts = res[1];
                this.getContactDetails();
            }),
            switchMap((res) => this.getCoverageData()),
            catchError((error) => {
                this.isLoading = false;
                return EMPTY;
            }),
        );
    }

    /**
     * This method is used to check whether member has email or phone numbers contacts saved
     * This method will push emailAddress to @var emailContacts, if there are emailAddresses
     * This method will push phoneNumbers to @var textContacts, if there are phoneNumbers
     * This method is used to call @method showContact() after gathering all contacts
     */
    getContactDetails(): void {
        this.memberContacts.forEach((contact) => {
            if (contact.emailAddresses?.length) {
                contact.emailAddresses.forEach((emailAddress) => {
                    this.emailContacts.push({ email: emailAddress.email, primary: emailAddress.primary });
                });
            }
            if (contact.phoneNumbers?.length) {
                this.textContacts.push(...contact.phoneNumbers.map(({ phoneNumber }) => phoneNumber));
            }
        });
        this.showContact();
    }
    /**
     * This method is used to fetch account name and other details
     * @return {Observable<Accounts>}
     */
    getAccountDetails(): Observable<Accounts> {
        return this.accService.getAccount(this.accountId.toString()).pipe(
            tap((acc) => {
                this.accountName = acc.name;
                this.setOfferListDescriptionTag();
            }),
        );
    }
    /**
     * to get relationship data and cart items
     * @returns {Observable<Relations[]>}
     */
    getRelationshipTypes(): Observable<Relations[]> {
        return this.accService.getDependentRelations(this.accountId).pipe(
            tap((res) => {
                this.dependentRelations = res;
            }),
        );
    }
    /**
     * method getMemberCoverageData to get the coverage related data/product details for member.
     * @returns {Observable<Product[]>}
     */
    getMemberCoverageData(): Observable<Product[]> {
        let memberId = null;
        let groupId = null;
        if (this.isTPI) {
            memberId = this.memberId;
            groupId = this.accountId;
        } else {
            memberId = this.memberDetails.memberId;
            groupId = this.memberDetails.groupId;
        }
        return forkJoin([
            this.enrollmentsService.searchMemberEnrollments(memberId, groupId),
            this.memberService.getMemberQualifyingEvents(memberId, groupId),
            this.memberService.getMemberContacts(memberId, groupId),
            this.shoppingService.getShoppingCart(memberId, groupId),
            this.benefitService.getPlanYears(groupId, false, true),
            this.shoppingService.getCartItems(this.memberId, this.accountId, this.PLAN_OFFERING_ID),
        ]).pipe(
            tap(([enrollments, lifeEvents, contacts, shoppingCart, planYears, cartItems]) => {
                this.currentQualifyingEvents = lifeEvents;
                this.memberContact = contacts;
                this.memberContacts = contacts;
                this.memberContacts.forEach((contact) => {
                    if (contact.emailAddresses?.length) {
                        contact.emailAddresses.forEach((emailAddress) => {
                            this.emailContacts.push({ email: emailAddress.email, primary: emailAddress.primary });
                        });
                    }
                });
                this.memberCartDetails = shoppingCart;
                this.planYearsData = planYears;
                this.abbreviation = this.memberContact[0].address.state;
                this.cartItems = [...cartItems];
                this.checkZeroSummary();
                enrollments = this.setBAForSupplementaryPlans(enrollments);
                this.setEnrollmentData(enrollments);
                if (this.dualPlanYearData && this.dualPlanYearData.isDualPlanYear) {
                    this.isDualPlanYear = this.dualPlanYearData.isDualPlanYear;
                    this.isQleDuringOeEnrollment = this.dualPlanYearData.isQleDuringOeEnrollment;
                    this.isQleAfterOeEnrollment = this.dualPlanYearData.isQleAfterOeEnrollment;
                    this.cartContainsOf = this.dualPlanYearService.checkCartItems(this.cartItems, this.memberId, this.accountId);
                    if (this.isQleAfterOeEnrollment && this.cartContainsOf === DualPlanYearSettings.OE_SHOP) {
                        this.cartContainsOf = DualPlanYearSettings.NEW_PY_QLE_SHOP;
                    }
                    if (this.isDualPlanYear) {
                        if (this.isQleDuringOeEnrollment) {
                            this.setScenarioObjectForQle();
                            this.setScenarioObjectForOe();
                        } else if (this.isQleAfterOeEnrollment) {
                            this.setScenarioObjectForCurrentPYQle();
                            this.setScenarioObjectForNewQle();
                        }
                    }
                }
                this.displayShop();
                this.enrollByDate = this.qleMaxDate ? this.qleMaxDate : this.oeMaxDate;
                this.noOfDaysLeft = this.qleCoverageEndDate ? this.qleCoverageEndDate : this.oeCoverageEndDate;
            }),
            switchMap(() => this.getProductDetails()),
            tap(() => this.setProductIcons()),
        );
    }
    /**
     * method getCoverageData to get coverage related data for Admin/Producer.
     * @returns {Observable<Product[]>}
     */
    getCoverageData(): Observable<Product[]> {
        return forkJoin([
            this.enrollmentsService.searchMemberEnrollments(this.memberId, this.mpGroupId),
            this.memberService.getMemberQualifyingEvents(this.memberId, this.mpGroupId),
            this.shoppingService.getCartItems(this.memberId, this.accountId, this.PLAN_OFFERING_ID),
        ]).pipe(
            tap(([enrollments, lifeEvents, cartItems]) => {
                this.currentQualifyingEvents = lifeEvents;
                this.cartItems = [...cartItems];
                this.checkZeroSummary();
                this.checkInOE(this.planYearsData);
                enrollments = this.setBAForSupplementaryPlans(enrollments);
                this.setEnrollmentData(enrollments);
                this.enrollByDate = this.qleMaxDate ? this.qleMaxDate : this.oeMaxDate;
            }),
            switchMap(() => this.getProductDetails()),
            tap(() => this.setProductIcons()),
        );
    }
    /**
     * @description method to set member enrollments data, separates base plan and riders enrollments
     * @param enrollments member enrollments
     * @returns void
     */
    setEnrollmentData(enrollments: Enrollments[]): void {
        enrollments.forEach((enroll) => {
            // checks if the enrollment is not rider enrollment else stores the rider enrollment into enrolledRiders[]
            if (!enroll.riderOfEnrollmentId) {
                if (this.displayCompanyProvidedPlans(enroll, enrollments)) {
                    enroll.coverageDate = this.getCoverageDateText(enroll);
                    enroll.coverageText = this.getCoverageText(enroll.validity);
                    enroll.status = this.languageStrings[this.applicationStatusService.convert(enroll)];
                    /* filters out the enrollments with void status or
                       ended status with no expiresAfter (future enrollments - coverage is not yet started)
                    */
                    if (
                        enroll &&
                        enroll.status !== ApplicationStatusTypes.Void &&
                        !(enroll.status === this.endedStatus && !enroll.validity.expiresAfter)
                    ) {
                        this.enrollData.data.push(enroll);
                        this.enrollIds.push(enroll.id);
                        if (
                            (!enroll.validity.expiresAfter ||
                                this.dateService.getIsAfterOrIsEqual(this.dateService.toDate(enroll.validity.expiresAfter))) &&
                            !this.planOfferingIds.includes(enroll.planOfferingId)
                        ) {
                            this.planOfferingIds.push(enroll.planOfferingId);
                        }
                    }
                }
            } else {
                this.enrolledRiders.push(enroll);
            }
        });
        this.zeroStateFlag = !this.enrollData.data.length;
        if (this.enrollData.data.length) {
            this.getEnrollmentInfo();
        } else {
            this.isLoading = false;
        }
    }
    /**
     * this method checks for supplementary plans(STD additional unit)
     * and map the benefit amount with its rider unit which has benefit amount
     * @param enrollments member enrollments
     * @returns Enrollments[] enrollment array with updated benefit amount
     */
    setBAForSupplementaryPlans(enrollments: Enrollments[]): Enrollments[] {
        return enrollments.map((enrollment) => {
            if (
                enrollment.plan &&
                enrollment.plan.characteristics &&
                enrollment.plan.characteristics.length &&
                enrollment.plan.characteristics.some((char) => char === Characteristics.SUPPLEMENTARY)
            ) {
                const riderEnrollmentBA = enrollments.find((enroll) =>
                    Boolean(enroll.riderOfEnrollmentId === enrollment.id && enroll.benefitAmount),
                );
                return {
                    ...enrollment,
                    benefitAmount: riderEnrollmentBA ? riderEnrollmentBA.benefitAmount : enrollment.benefitAmount,
                };
            }
            return enrollment;
        });
    }
    getCoverageDateText(enroll: any): any {
        enroll.coverageDate = "";
        const expireDate = this.dateService.toDate(enroll.validity.expiresAfter || "");
        expireDate.setHours(0, 0, 0, 0);
        const startDate = this.dateService.toDate(enroll.validity.effectiveStarting);
        startDate.setHours(0, 0, 0, 0);
        if (!enroll.validity.expiresAfter) {
            enroll.coverageDate = this.datePipe.transform(startDate, DateFormat.MONTH_DAY_YEAR);
        } else {
            enroll.coverageDate =
                this.datePipe.transform(startDate, DateFormat.MONTH_DAY_YEAR) +
                " - " +
                this.datePipe.transform(expireDate, DateFormat.MONTH_DAY_YEAR);
        }
        return enroll.coverageDate;
    }

    /** *
     * getCoverageText(validity: Validity) returns the coverage text
     * based on the expiresAfter property
     * @param validity validity for checking expiry date
     * @returns coverage text based on the check for expiry date
     */
    getCoverageText(validity: Validity): string {
        return !validity.expiresAfter
            ? this.languageStrings["primary.portal.coverage.coverageStartDate"]
            : this.languageStrings["primary.portal.coverage.coveragedate"];
    }
    /** *
     * @description this will make API call for capturing enrollment data and manipulating payroll deduction date
     * @returns void
     */
    getEnrollmentInfo(): void {
        // TODO - Language needs to be implemented
        this.subscriptions.push(
            this.memberService.getAllCompletedForms(this.memberId, this.mpGroupId, true).subscribe((data) => {
                this.unsignedPDAForms = data.PDA;
            }),
        );
        this.subscriptions.push(
            this.enrollmentsService.getEnrollmentInformation(this.memberId, this.accountId).subscribe((info: EnrollmentInformation) => {
                if (info.payrollDeductionInformationComponent.payrollsRemainingInYear) {
                    this.isnextPayrollDeductionDate = true;
                    this.nextPayrollDeductionDate = this.dateService.toDate(info.payrollDeductionInformationComponent.nextPayrollDate);
                    this.payrollDeductionSubTitle = this.languageStrings[
                        "primary.portal.coverageSummary.payrollDeductionDateMessage"
                    ].replace(
                        this.coverageStartDatePlaceHolder,
                        this.datePipe.transform(this.nextPayrollDeductionDate, DateFormat.MONTH_DAY_YEAR),
                    );
                } else {
                    this.enrollData.data.forEach((enroll) => {
                        const coverageStartDate = this.dateService.toDate(enroll.validity.effectiveStarting);
                        if (
                            this.dateService.isBeforeOrIsEqual(new Date(), coverageStartDate) &&
                            (this.dateService.isBeforeOrIsEqual(
                                coverageStartDate,
                                this.dateService.toDate(this.nextPayrollDeductionDate),
                            ) ||
                                !this.nextPayrollDeductionDate)
                        ) {
                            this.payrollDeductionSubTitle = this.languageStrings[
                                "primary.portal.coverageSummary.payrollDeductionDateMessage"
                            ].replace(
                                this.coverageStartDatePlaceHolder,
                                this.datePipe.transform(enroll.validity.effectiveStarting, DateFormat.MONTH_DAY_YEAR),
                            );
                            this.isnextPayrollDeductionDate = true;
                            this.nextPayrollDeductionDate = enroll.validity.effectiveStarting;
                            this.showDateRangeOptions = false;
                        } else if (!this.nextPayrollDeductionDate) {
                            this.payrollDeductionSubTitle = "";
                            this.isnextPayrollDeductionDate = false;
                            this.nextPayrollDeductionDate = "";
                        }
                    });
                }
                if (info.flexDollarOrIncentivesApplied) {
                    this.planLevelflexDollars = info.flexDollarOrIncentivesApplied.planFlexDollarOrIncentives;
                }
                this.coverageSummary();
                this.payrollDeductionTitle = this.languageStrings["primary.portal.coverage.nextpayroll.deduction"];
            }),
        );
    }
    /**
     * Method to set current, previous,future coverages
     */
    coverageSummary(): void {
        this.weeklyPayrollsPerYear = this.payFrequencies.find((payFrequency) => payFrequency.id === this.accPayFrequencyId).payrollsPerYear;
        const currentDate = this.datePipe.transform(this.currentDate, DateFormats.YEAR_MONTH_DAY);
        // current coverage will be considered only if the coverage start date is less than current date and
        // coverage end date should be greater than or equal to current date
        this.hasCurrentCoverage = this.enrollData.data.some(
            (data) =>
                data.validity.effectiveStarting < currentDate &&
                (!data?.validity?.expiresAfter || data?.validity?.expiresAfter >= currentDate),
        );
        const monthlyPayFrequencyObject: PayFrequencyObject = {
            payFrequencies: this.payFrequencyObject.payFrequencies,
            payrollsPerYear: this.weeklyPayrollsPerYear,
            pfType: this.monthly.toUpperCase(),
        };
        combineLatest(
            this.enrollData.data.map((data) =>
                forkJoin([
                    this.enrollmentsService.getEnrollmentDependents(this.memberId, data.id, this.accountId),
                    data.plan.carrier &&
                    data.plan.carrier.id !== CarrierId.AFLAC &&
                    (!data.validity.expiresAfter ||
                        this.dateService.getIsAfterOrIsEqual(this.dateService.toDate(data.validity.expiresAfter)))
                        ? this.shoppingService.getPlanOffering(data.planOfferingId.toString(), this.mpGroupId)
                        : of(null),
                ]).pipe(
                    // eslint-disable-next-line complexity
                    tap(([enrollmentDependents, planOffering]) => {
                        data.enrollmentRiders = [];
                        data.enrollmentDependents = enrollmentDependents;
                        data.planOffering = planOffering;
                        const riderEnrollments: Enrollments[] = this.enrolledRiders.filter(
                            (rider) => rider.riderOfEnrollmentId === data.id,
                        );
                        if (riderEnrollments.length) {
                            riderEnrollments.forEach((rider) => {
                                if (rider.coverageLevel.id !== this.DECLINED_COVERAGE_LEVEL_ID) {
                                    data.enrollmentRiders.push(rider);
                                }
                            });
                        }
                        data.enrollmentRiders.forEach((rider) => {
                            data.totalCost += rider.totalCost;
                            data.memberCost += rider.memberCost;
                        });
                        const originalMemberCost = data.memberCost;
                        const originalTotalCost = data.totalCost;
                        data.isAflacPlan =
                            data.plan.carrier && [CarrierId.AFLAC, CarrierId.AFLAC_DENTAL_AND_VISION].includes(data.plan.carrier.id);
                        const dependentObservable = [];
                        const expireDate = this.getDateFormat(data.validity.expiresAfter);
                        const startDate = this.getDateFormat(data.validity.effectiveStarting);
                        if (
                            data.pendingReason === PendingEnrollmentReason.CUSTOMER_SIGNATURE &&
                            data.subscriberApprovalRequiredByDate &&
                            this.utilService.isPastDate(data.subscriberApprovalRequiredByDate) &&
                            data.type !== EnrollmentMethodType.AGENT_ASSISTED_F2F
                        ) {
                            this.showContacts = true;
                            this.isEnrolled = false;
                            this.sendReminderHeaderText = this.languageStrings["primary.portal.coverage.signed"];
                            this.disableSendReminder =
                                data.pendingReason === PendingEnrollmentReason.PDA_COMPLETION &&
                                !this.unsignedPDAForms.some((pdaForm) =>
                                    pdaForm.policyPremiums.some((policyPremium) => policyPremium.newEnrollmentId === data.id),
                                );
                        }
                        data.benefitDollars = {};
                        if (!data.validity.effectiveStarting || this.dateService.isBefore(expireDate, this.currentDate)) {
                            data.benefitDollars = {
                                flexDollarOrIncentiveName: this.languageStrings["primary.portal.coverage.adjustment"],
                                flexDollarOrIncentiveAmount: 0.0,
                            };
                            this.previousCoverage.push(data);
                            data.totalCost = data.memberCost || 0;
                        } else {
                            let benefitDollars: PlanFlexDollarOrIncentives;
                            if (
                                data.plan.carrier?.id === CarrierId.AFLAC_GROUP ||
                                data.plan.characteristics?.includes(Characteristics.COMPANY_PROVIDED)
                            ) {
                                data.benefitDollars = {
                                    flexDollarOrIncentiveName: this.languageStrings["primary.portal.coverage.adjustment"],
                                    flexDollarOrIncentiveAmount: originalTotalCost - originalMemberCost,
                                };
                                data.memberCost = data.totalCost - (originalTotalCost - originalMemberCost);
                            } else {
                                if (this.planLevelflexDollars?.length) {
                                    benefitDollars = this.planLevelflexDollars.find(
                                        (planFlexDollar) =>
                                            planFlexDollar.planId === data.plan.id && planFlexDollar.enrollmentId === data.id,
                                    );
                                }
                                if (!benefitDollars || !this.isBenefitDollarConfigEnabled) {
                                    data.benefitDollars = {
                                        flexDollarOrIncentiveName: this.languageStrings["primary.portal.coverage.adjustment"],
                                        flexDollarOrIncentiveAmount: 0.0,
                                    };
                                } else {
                                    const employerContributionPerPayPeriod = Number(
                                        this.payrollFrequencyPipe
                                            .transform(originalTotalCost - originalMemberCost, this.payFrequencyObject)
                                            .toFixed(TWO),
                                    );
                                    data.benefitDollars = {
                                        flexDollarOrIncentiveName: this.languageStrings["primary.portal.editCoverage.employerContribution"],
                                        flexDollarOrIncentiveAmount:
                                            this.payFrequencyObject.pfType !== this.monthly.toUpperCase()
                                                ? this.payrollFrequencyPipe.transform(
                                                      employerContributionPerPayPeriod,
                                                      monthlyPayFrequencyObject,
                                                  )
                                                : employerContributionPerPayPeriod,
                                    };
                                    data.memberCost = data.totalCost - data.benefitDollars.flexDollarOrIncentiveAmount;
                                }
                            }
                            data.enrollmentDependents.forEach((item) => {
                                dependentObservable.push(
                                    this.memberService.getMemberDependent(this.memberId, item.dependentId, false, this.accountId),
                                );
                            });
                            forkJoin(dependentObservable).subscribe((result: MemberDependent[]) => {
                                data.enrollmentDependents.forEach((item, index) => {
                                    if (item.dependentId === result[index].id) {
                                        const relationship = this.dependentRelations.find(
                                            (ele) => ele.id === result[index].dependentRelationId,
                                        );
                                        item.relationType = relationship.name;
                                    }
                                });
                            });
                            if (this.currentDate >= startDate && (!data.validity.expiresAfter || expireDate >= this.currentDate)) {
                                this.currentCoverage.push(data);
                                const i = this.enrollData.data.indexOf(this.enrollData.data.find((innerData) => innerData.id === data.id));
                                this.enrollData.data[i] = {
                                    ...this.enrollData.data[i],
                                    statusCoverage: this.coverageType.current,
                                };
                                if (
                                    (data.status === this.approvedStatus || (data.status && data.status.startsWith(this.pendingStatus))) &&
                                    (!data.validity.expiresAfter || expireDate !== this.currentDate)
                                ) {
                                    if (!this.isnextPayrollDeductionDate) {
                                        this.payrollDeductionInfo(data);
                                    } else {
                                        const payrollDeductionDate = this.getDateFormat(this.nextPayrollDeductionDate);
                                        if (
                                            payrollDeductionDate >= startDate &&
                                            (!data.validity.expiresAfter || expireDate >= payrollDeductionDate)
                                        ) {
                                            this.payrollDeductionInfo(data);
                                        }
                                    }
                                }
                            } else if (this.currentDate < startDate) {
                                this.futureCoverage.push(data);
                                const i = this.enrollData.data.indexOf(this.enrollData.data.find((innerData) => innerData.id === data.id));
                                this.enrollData.data[i] = {
                                    ...this.enrollData.data[i],
                                    statusCoverage: this.coverageType.future,
                                };
                                const coverageDate = data.coverageDate.split("-");
                                const startCoverageDate = Date.parse(coverageDate[0]);
                                const formattedPayrollDeductionDate = this.datePipe.transform(
                                    this.nextPayrollDeductionDate,
                                    DateFormats.MONTH_DAY_YEAR,
                                );
                                if (Date.parse(formattedPayrollDeductionDate) >= startCoverageDate) {
                                    this.payrollDeductionInfo(data);
                                }
                            }
                        }
                    }),
                ),
            ),
        )
            .pipe(
                takeUntil(this.unsubscribe$),
                finalize(() => {
                    if (this.currentCoverage.length) {
                        this.benefitSummary.push({
                            title: this.languageStrings["primary.portal.coverage.current_coverage"],
                            data: [...this.currentCoverage],
                            isHide: false,
                            isPreviousEnrollment: false,
                        });
                    }
                    if (this.futureCoverage.length) {
                        this.checkAGEndCoverage();
                        this.benefitSummary.push({
                            title: this.languageStrings["primary.portal.coverage.future_coverage"],
                            data: [...this.futureCoverage],
                            isHide: false,
                            isPreviousEnrollment: false,
                        });
                    }
                    if (this.previousCoverage.length) {
                        if (!this.currentCoverage.length && !this.futureCoverage.length) {
                            this.onlyPreviousCoverage = true;
                            this.showPrevious = true;
                            this.buttonLabel = this.languageStrings["primary.portal.benefitSummary.hide"];
                        } else {
                            this.onlyPreviousCoverage = false;
                        }
                        this.benefitSummary.push({
                            title: this.languageStrings["primary.portal.coverage.previous_coverage"],
                            data: [...this.previousCoverage],
                            isHide: !this.onlyPreviousCoverage,
                            isPreviousEnrollment: true,
                        });
                    }
                    if (this.benefitSummary && this.benefitSummary.length) {
                        this.updatePendingEAAandPdaStatus();
                    }
                    this.checkEndCoverage();
                    this.setIsVoids();
                    this.setQLEStatuses();
                    this.setIsCancelIcons();
                    this.setFilter();
                    this.isLoading = false;
                }),
            )
            .subscribe();
    }
    /**
     * This method is used to update pending EAA status and PDA status
     * @returns void
     */
    updatePendingEAAandPdaStatus(): void {
        this.isEAAMissing = false;
        this.benefitSummary.forEach((item) => {
            if (item.data && item.data.length) {
                item.data.forEach((val) => {
                    if (this.allowCrossBorderCheck && val.pendingReason === PendingEnrollmentReason.INCOMPLETE_MISSING_EAA) {
                        val.status = this.languageStrings["primary.portal.enrollments.eaaRequiredStatus"];
                        this.isEAAMissing = true;
                    }
                    val.isPdaCompleted = this.unsignedPDAForms?.some((pdaForm) =>
                        pdaForm.policyPremiums.some((policyPremium) => policyPremium.newEnrollmentId === val.id),
                    );
                });
            }
        });
    }
    /**
     * Get product details for enrolled product
     * @return observable of an array of products
     */
    getProductDetails(): Observable<Product[]> {
        return iif(
            () => !!this.enrollData.data.length,
            forkJoin(
                this.enrollData.data.map((enrollment) =>
                    this.coreService
                        .getProduct(enrollment.plan.product.id)
                        .pipe(tap((product: Product) => (enrollment.prodDetails = [product]))),
                ),
            ),
            of(null),
        );
    }
    /**
     * function to set product icons for respective products
     * @returns void
     */
    setProductIcons(): void {
        this.enrollData.data.forEach((response) => {
            response["iconPath"] = "";
            if (response.prodDetails) {
                const filteredProduct = response.prodDetails.find((res) => res.name === response.plan.product.name);
                if (filteredProduct && filteredProduct.iconSelectedLocation) {
                    response["iconPath"] = filteredProduct.iconSelectedLocation;
                }
            }
            response["isCoverageLevelNameMatch"] = this.isDependentCovered(response.coverageLevel.name);
        });
    }
    /**
     * Method to display company provided plans based on conditions
     * @param data: Enrollment needs to be checked
     * @param enrollments: List of enrollments to check duplicate enrollment for auto enrollable plan
     * @returns TRUE if plan needs to be displayed else false
     */
    displayCompanyProvidedPlans(data: Enrollments, enrollments: Enrollments[]): boolean {
        let display = true;
        if (
            data.plan.characteristics.includes(Characteristics.COMPANY_PROVIDED) ||
            data.plan.characteristics.includes(Characteristics.AUTOENROLLABLE)
        ) {
            const item = this.cartItems.find((x) => x.enrollmentId === data.id);
            if (
                !item ||
                (this.oeMaxDate && this.dateService.getIsAfterOrIsEqual(this.currentDate, this.dateService.toDate(this.oeMaxDate)))
            ) {
                const duplicateEnrollments: Enrollments = enrollments.find(
                    (enrollment) =>
                        enrollment.plan.id === data.plan.id &&
                        enrollment.id !== data.id &&
                        this.dateService.isEqual(
                            this.dateService.toDate(enrollment.validity.effectiveStarting),
                            this.dateService.toDate(data.validity.effectiveStarting),
                        ) &&
                        (!enrollment.validity.expiresAfter ||
                            !data.validity.expiresAfter ||
                            this.dateService.isEqual(
                                this.dateService.toDate(enrollment.validity.expiresAfter),
                                this.dateService.toDate(data.validity.expiresAfter),
                            )) &&
                        (enrollment.status === StatusType.APPROVED || enrollment.status === StatusType.PENDING),
                );
                display = !duplicateEnrollments || data.status === StatusType.PENDING;
            } else {
                display = false;
            }
        }
        return display;
    }
    /**
     * Method to add coverage cost to display pre-tax and post-tax calculation
     * @param data: Enrollment cost to be added in pre-tax and post-tax calculation
     */
    payrollDeductionInfo(data: any): void {
        const currentDate = this.datePipe.transform(this.currentDate, DateFormats.YEAR_MONTH_DAY);
        if (data.taxStatus === this.preTax && (!this.hasCurrentCoverage || data.validity.effectiveStarting < currentDate)) {
            this.preTaxBaseCost += +data.totalCost;
            this.preTaxTotalCost += data.memberCost;
            this.preTaxAdjustment = this.preTaxBaseCost - this.preTaxTotalCost;
        } else if (
            (data.taxStatus === this.postTax || data.taxStatus === this.unknownTaxStatus) &&
            (!this.hasCurrentCoverage || data.validity.effectiveStarting < currentDate)
        ) {
            this.postTaxBaseCost += +data.totalCost;
            this.postTaxTotalCost += data.memberCost;
            this.postTaxAdjustment = this.postTaxBaseCost - this.postTaxTotalCost;
        }
    }
    checkZeroSummary(): void {
        this.zeroStateFlag = true;
        this.checkContinuousPlan(this.products);
        this.continuousProductList.forEach((el) => {
            const index = this.pyList.indexOf(el);
            if (index >= 0) {
                this.pyList.splice(index, 1);
            }
        });
        if (this.isMemberPortal) {
            if (this.currentQualifyingEvents && this.currentQualifyingEvents.length && !this.checkFlag) {
                this.checkInQle(this.currentQualifyingEvents);
            }
            if (this.planYearsData && this.planYearsData.length && !this.checkFlag) {
                this.checkInOE(this.planYearsData);
            }
            if (!this.qleFlag && !this.oeFlag && this.checkFlag === false) {
                this.outsideOeQleFlag = true;
                this.checkFlag = true;
            }
        } else if (this.enrollData && !this.enrollData.data.length) {
            if (this.availPlanYears && this.availPlanYears.length) {
                const availPYDates = [];
                this.availProductsFlag = true;
                this.availPlanYears.forEach((ele) => {
                    availPYDates.push(this.dateService.toDate(ele.enrollmentPeriod.expiresAfter));
                });
                this.maxAvailPYDate = this.datePipe.transform(Math.max.apply(null, availPYDates), DateFormat.MONTH_DAY_YEAR);
                this.enrollEndDisplayFlag = !this.pyList.length ? false : true;
            } else {
                this.availProductsFlag = true;
                this.enrollEndDisplayFlag = !this.pyList.length ? false : true;
            }
        }
    }

    /**
     * The method will route to shop page from coverage summary shop button
     */
    routeToShop(): void {
        this.isLoading = true;
        const details = this.store.selectSnapshot(EnrollmentMethodState.getMemberInfo);
        this.specificEnrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.specificEnrollmentMethod);
        this.visitedMpGroupStateObj = this.store.selectSnapshot(EnrollmentMethodState.visitedMpGroups);
        if (details && details.id) {
            this.dualPlanYearService.genericShopOeQLeNavigate(details.id, this.mpGroupId);
            this.enrollmentState = this.store.selectSnapshot(EnrollmentMethodState);
            this.store.dispatch(new SetMemberIdentity(details.id));
            this.store.dispatch(new SetMemberInfo(details));
            const mpGroupString = this.mpGroupId.toString();
            if (this.benefitsOffered) {
                if (
                    !(
                        this.specificEnrollmentObj &&
                        (this.specificEnrollmentObj.enrollmentMethod || this.specificEnrollmentObj.enrollmentState) &&
                        this.specificEnrollmentObj.mpGroup &&
                        this.specificEnrollmentObj.mpGroup === mpGroupString &&
                        this.visitedMpGroupStateObj.indexOf(mpGroupString) >= 0
                    )
                ) {
                    this.isLoading = false;
                    this.dialog.open(EnrollmentMethodComponent, {
                        backdropClass: "backdrop-blur",
                        maxWidth: "600px", // 600px max-width based on the definition in abstract.
                        panelClass: "shopping-experience",
                        data: {
                            mpGroup: mpGroupString,
                            detail: details,
                            route: this.route,
                            stateAbbr: this.state,
                            openingFrom: "coverageSummary",
                        },
                    });
                } else {
                    const currentEnrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment);
                    this.storedState = this.store.selectSnapshot(EnrollmentMethodState.getEnrollmentStateArray);
                    if (
                        currentEnrollmentObj.enrollmentMethod === EnrollmentMethod.HEADSET ||
                        currentEnrollmentObj.enrollmentMethod === EnrollmentMethod.CALL_CENTER
                    ) {
                        this.memberService
                            .getMemberContact(details.id, ContactType.HOME, this.mpGroupId.toString())
                            .pipe(takeUntil(this.unsubscribe$))
                            .subscribe(
                                (result) => {
                                    this.isLoading = false;
                                    if (result) {
                                        if (!this.storedState.some((state) => state.abbreviation === result.body.address.state)) {
                                            this.dialog.open(EnrollmentMethodComponent, {
                                                backdropClass: "backdrop-blur",
                                                maxWidth: "600px", // 600px max-width based on the definition in abstract.
                                                panelClass: "shopping-experience",
                                                data: {
                                                    mpGroup: mpGroupString,
                                                    detail: details,
                                                    route: this.route,
                                                    stateAbbr: this.state,
                                                    openingFrom: "coverageSummary",
                                                },
                                            });
                                        } else {
                                            this.openConfirmAddressDialogForShop(details, currentEnrollmentObj);
                                        }
                                    }
                                },
                                (error) => {
                                    this.isLoading = false;
                                },
                            );
                    } else {
                        this.memberService
                            .getMemberContact(details.id, ContactType.HOME, this.mpGroupId.toString())
                            .pipe(takeUntil(this.unsubscribe$))
                            .subscribe(
                                (result) => {
                                    const newEnrollmentStateAbbr = result.body.address.state;
                                    const homeState = this.storedState.find((state) => state.abbreviation === newEnrollmentStateAbbr);
                                    const newEnrollmentStateName = homeState ? homeState.name : "";
                                    this.store.dispatch(new SetMemberIdentity(details.id));
                                    this.store.dispatch(new SetMemberInfo(details));
                                    this.store.dispatch(
                                        new SetEnrollmentMethodSpecific({
                                            enrollmentMethod: currentEnrollmentObj.enrollmentMethod,
                                            enrollmentState: this.enrollmentState.currentEnrollment.enrollmentState,
                                            enrollmentCity: this.enrollmentState.currentEnrollment.enrollmentCity,
                                            headSetState: newEnrollmentStateName,
                                            headSetStateAbbreviation: newEnrollmentStateAbbr,
                                            enrollmentStateAbbreviation: this.enrollmentState.currentEnrollment.enrollmentStateAbbreviation,
                                            userType: currentEnrollmentObj.userType,
                                            memberId: currentEnrollmentObj.memberId,
                                            mpGroup: currentEnrollmentObj.mpGroup,
                                        }),
                                    );
                                    if (result) {
                                        this.sharedService.changeProducerNotLicensedInEmployeeState(
                                            !this.storedState.some((state) => state.abbreviation === newEnrollmentStateAbbr),
                                        );
                                    }
                                    this.isLoading = false;
                                    this.router.navigate([`../../../enrollment/quote-shop/${this.mpGroupId}/specific/${details.id}`], {
                                        relativeTo: this.route,
                                    });
                                },
                                () => {
                                    this.isLoading = false;
                                },
                            );
                    }
                }
            } else {
                // eslint-disable-next-line max-len
                const url = `/producer/payroll/${this.mpGroupId}/member/${details.id}/enrollment/quote-shop/${this.mpGroupId}/specific/${details.id}`;
                this.router
                    .navigateByUrl(`/producer/payroll/${this.mpGroupId}/member/${details.id}`, {
                        skipLocationChange: true,
                    })
                    .then(() => this.router.navigate([url]));
            }
        } else {
            this.isLoading = false;
        }
    }
    /**
     * opens confirm address pop up and saves enrollment data required for shop page
     * @param details - member details with member id and work employee id
     * @param currentEnrollmentObj current enrollment data
     */
    openConfirmAddressDialogForShop(details: MemberListDisplayItem, currentEnrollmentObj: EnrollmentMethodModel): void {
        const confirmAddressDialogRef = this.dialog.open(ConfirmAddressDialogComponent, {
            width: "750px",
            data: { memberId: details.id, mpGroup: this.mpGroupId, purpose: "shop" },
        });
        this.subscriptions.push(
            confirmAddressDialogRef.afterClosed().subscribe((result) => {
                if (result.action === SHOP_SUCCESS) {
                    this.store.dispatch(new SetMemberIdentity(details.id));
                    this.store.dispatch(new SetMemberInfo(details));
                    this.sharedService.setEnrollmentValuesForShop(result, currentEnrollmentObj);
                    this.router.navigate(["../../../enrollment/quote-shop/" + currentEnrollmentObj.mpGroup + "/specific/" + details.id], {
                        relativeTo: this.route,
                    });
                }
            }),
        );
    }

    routeToMemberShop(): void {
        this.router.navigate([this.memberShopLink], { relativeTo: this.route });
    }
    showPreviousCoverage(): void {
        if (this.showPrevious) {
            this.showPrevious = false;
            this.buttonLabel = this.languageStrings["primary.portal.benefitSummary.show"];
        } else {
            this.showPrevious = true;
            this.buttonLabel = this.languageStrings["primary.portal.benefitSummary.hide"];
        }
    }
    /**
     * Method to open the signed application document
     * @param enrollmentId -enrollmentId
     */
    viewSignedApplication(enrollmentId: number): void {
        this.isLoading = true;
        this.subscriptions.push(
            this.enrollmentsService.downloadSignedApplication(this.memberId, enrollmentId, this.accountId).subscribe(
                (response: any) => {
                    const blob = new Blob([response], { type: "text/html" });
                    const fileurl = URL.createObjectURL(blob);
                    this.isLoading = false;
                    window.open(fileurl, "_blank");

                    /*
                    source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/msSaveOrOpenBlob
                    msSaveorOpenBlob() and msSaveBlob() are non-standard. It is warned not to use these in production sites.
                    Typescript won't know this is a thing, so we have to use Type Assertion
                    */
                    if ((window.navigator as any).msSaveOrOpenBlob) {
                        (window.navigator as any).msSaveOrOpenBlob(blob);
                    } else {
                        const anchor = document.createElement("a");
                        anchor.download = DOCUMENT;
                        const signedFileURL = URL.createObjectURL(blob);
                        anchor.href = signedFileURL;
                        document.body.appendChild(anchor);
                        anchor.click();
                    }
                },
                (error: any) => {
                    this.isLoading = false;
                    if (error?.status === ServerErrorResponseCode.RESP_503) {
                        this.downloadError = true;
                        this.errorMessage = this.language.fetchSecondaryLanguageValue(
                            "secondary.portal.callCenter.8x8.api.common.error.message",
                        );
                    }
                },
            ),
        );
    }
    /**
     * Method used for editing existing enrollment
     * @param enrollmentId : enrollment id
     */
    openEditCoveragePopup(enrollmentId: number): void {
        if (this.enrollData.data && this.enrollData.data.length > 0) {
            const data = this.enrollData.data.find((eData) => eData.id === enrollmentId);
            this.EditCoverageDialogRef = this.dialog.open(EditCoverageComponent, {
                minWidth: "100%",
                height: "100%",
                data: {
                    enrollData: data,
                    payFrequency: this.payFrequencyName,
                    mpGroup: this.mpGroupId,
                    memberId: this.memberId,
                    memberEnrollments: this.memberEnrollments,
                    enrollmentState: this.isTPI ? this.store.selectSnapshot(EnrollmentState.GetEnrollmentState) : this.mpGroupObj.state,
                },
            });
        }
        this.subscriptions.push(
            this.EditCoverageDialogRef.afterClosed()
                .pipe(
                    takeUntil(this.unsubscribe$),
                    switchMap((res) => this.updateEnrollmentData()),
                )
                .subscribe(),
        );
    }

    /**
     * method to set QLE Statuses of planOfferings wrt coverage cancellation
     * @return void
     */
    setQLEStatuses(): void {
        if (this.currentCoverage.length) {
            this.currentCoverage.forEach((coverage, index) => {
                const isQLEStatus = !this.carrierStatusesCheckForQLE.includes(coverage.carrierStatus);
                const qleEvent = this.currentQualifyingEvents.find(
                    (event) => coverage.status === EnrollmentStatus.approved && isQLEStatus && event.id === coverage.qualifyingEventId,
                );
                this.currentCoverageQleStatuses[index] = qleEvent ? qleEvent.endPlanRequestStatus : "";
                this.currentCoverageEndDates[index] = qleEvent ? qleEvent.requestedCoverageEndDate : "";
                const endPlanRequestStatus = (qleEvent || ({} as MemberQualifyingEvent)).endPlanRequestStatus;
                this.policiesExpired[index] = this.utilService.checkPolicyExpired(qleEvent, endPlanRequestStatus);
            });
        }
        if (this.futureCoverage.length) {
            this.futureCoverage.forEach((coverage, index) => {
                const isQLEStatus = !this.carrierStatusesCheckForQLE.includes(coverage.carrierStatus);
                const qleEvent = this.currentQualifyingEvents.find(
                    (event) => coverage.status === EnrollmentStatus.approved && isQLEStatus && event.id === coverage.qualifyingEventId,
                );
                this.futureCoverageQleStatuses[index] = qleEvent ? qleEvent.endPlanRequestStatus : "";
                this.futureCoverageEndDates[index] = qleEvent ? qleEvent.requestedCoverageEndDate : "";
            });
        }
    }

    /**
     * method to get policy end date
     * @param qleId: number, qleId
     * @returns string, returns policy end date
     */
    getPolicyEndDate(qleId: number): string {
        const qleEvent = this.currentQualifyingEvents.find((event) => event.id === qleId);
        return qleEvent ? qleEvent.requestedCoverageEndDate : "";
    }

    /** *
     * This method is called to open Add Admin Popup wrt End Coverage link
     * @param enrollmentId: number, enrollment id
     * @param employeeName: string name of the employee whose policy will be cancelled
     * @param isAg: flag to check AG or AI flow
     * @returns void
     */
    openEndCoveragePopup(enrollmentId: number, employeeName: string, isAg: boolean = false): void {
        const data = this.enrollData.data.find((eData) => eData.id === enrollmentId);
        // if tax status is pretax and if there is no admin associated to the account, inform user to add admin.
        // else open End Coverage popup
        if (data && data.taxStatus === this.preTax && !this.hasAdmin) {
            this.benefitSummaryService.setEndCoverageFlag(true);
            this.benefitOfferingUtilService
                .addAdminPopUp()
                .pipe(
                    switchMap((status: string) =>
                        iif(() => Boolean(status), this.addAdmin(status, enrollmentId, employeeName, isAg), of(null)),
                    ),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
        } else {
            this.subscriptions.push(this.openEndCoveragePopupAfterAdminAddition(enrollmentId, employeeName, isAg).subscribe());
        }
    }

    /** *
     * This method is called to open add admin popup
     * @param choice: choice of admin addition
     * @param enrollmentId: number, enrollment id
     * @param employeeName: string name of the employee whose policy will be cancelled
     * @param isAg: flag to check AG or AI flow
     * @returns Observable<boolean | string | Product[]>, returns status (string | boolean)
     *  from addAdmin API, or Product[] from getProductDetails(). If status is true then
     *  opens end coverage popup that saves enrollment data upon completion of End Coverage.
     */
    addAdmin(choice: string, enrollmentId: number, employeeName: string, isAg: boolean = false): Observable<boolean | string | Product[]> {
        return this.benefitOfferingUtilService.addAdmin(this.allAdmins, choice).pipe(
            takeUntil(this.unsubscribe$),
            switchMap((status) =>
                iif(
                    () => status === true,
                    this.openEndCoveragePopupAfterAdminAddition(enrollmentId, employeeName, isAg),
                    of(status).pipe(
                        tap(() => {
                            // if admin was not added, open Coverage Summary page
                            this.router.navigate([
                                `producer/payroll/${this.mpGroupId}/member/${this.memberId}/enrollment/benefit-summary/coverage-summary`,
                            ]);
                        }),
                    ),
                ),
            ),
        );
    }

    /** *
     * This method is called to open End Coverage popup
     * @param enrollmentId: number, enrollment id
     * @param employeeName: string name of the employee whose policy will be cancelled
     * @param isAg: flag to check AG or AI flow
     * @returns Observable<Product[]>, returns an observable of product array
     */
    openEndCoveragePopupAfterAdminAddition(enrollmentId: number, employeeName: string, isAg: boolean = false): Observable<Product[]> {
        this.hasAdmin = true;
        const data = this.enrollData.data.find((eData) => eData.id === enrollmentId);
        const endCoverageDialogRef = this.empoweredModalService.openDialog(EndCoverageComponent, {
            data: {
                memberId: this.memberId,
                mpGroup: this.mpGroupId,
                enrollmentId: enrollmentId,
                enrollmentTaxStatus: data.taxStatus,
                planName: data.plan.name,
                employeeName: employeeName,
                coverageStartDate: data.validity.effectiveStarting,
                expiresAfter: data.validity.expiresAfter,
                isCoverageSummary: true,
                agEndDate: isAg ? data.validity.effectiveStarting : "",
                isArgus: data.plan.carrier.id === CarrierId.ADV,
            },
        });
        return endCoverageDialogRef.afterClosed().pipe(
            takeUntil(this.unsubscribe$),
            switchMap((res) => this.updateEnrollmentData()),
        );
    }
    /**
     * This method opens void coverage dialog
     * @param enrollmentId: number, enrollment id
     * @param planName: string, name of the current plan to be void
     */
    openVoidCoverage(enrollmentId: number, planName: string): void {
        const dialogRef = this.empoweredModalService.openDialog(VoidCoverageComponent, {
            data: {
                planName: planName,
                mpGroup: this.mpGroupId,
                memberId: this.memberId,
                enrollId: enrollmentId,
                isCoverageSummary: true,
            },
        });
        dialogRef
            .afterClosed()
            .pipe(
                switchMap(() => this.updateEnrollmentData()),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
    /**
     * Method to open Plan details Popup
     * @param data Plan Offering object
     */
    openPlanDetails(data: any): void {
        this.mpGroup = this.mpGroupId;
        const accountInfo = this.isMemberPortal
            ? this.store.selectSnapshot(SharedState.getState)?.memberMPGroupAccount
            : this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        const planDetails = {
            planId: data.plan.id,
            planName: data.plan.name,
            riderIds: this.getEnrolledRiderIds(data.plan.dependentPlanIds, this.enrolledRiders),
            states: [
                {
                    abbreviation: data.state,
                },
            ],
            mpGroup: this.mpGroup,
            carrierId: data.plan.carrier,
            productId: data.plan?.product.id,
            isCarrierOfADV: data.plan.carrier.id === CarrierId.ADV,
            situsState: accountInfo?.situs.state.abbreviation,
        };
        const dialogRef = this.dialog.open(PlanDetailsComponent, {
            hasBackdrop: true,
            data: planDetails,
            width: "600px",
        });
    }
    distinct(items: any, mapper: any): any {
        if (!mapper) {
            mapper = (item) => item;
        }
        return items.map(mapper).reduce((acc, item) => {
            if (acc.indexOf(item) === -1) {
                acc.push(item);
            }
            return acc;
        }, []);
    }

    changeDateFilter(val: any): void {
        switch (val) {
            case AppSettings.specificDate:
                this.isSpecificDateSelected = true;
                this.isDateRangeSelected = false;
                break;
            case AppSettings.dateRange:
                this.isSpecificDateSelected = false;
                this.isDateRangeSelected = true;
                break;
            default:
                return;
        }
    }
    /**
     * method to apply date range filter
     */
    applyDateRangeFilter(): void {
        this.isFilterApplied = true;
        if (this.isSpecificDateSelected && this.dateFilterForm.controls.specificDate.value) {
            this.dateFilterForm.controls.startDate.setValue("");
            this.dateFilterForm.controls.endDate.setValue("");
            this.isDateRangeSelected = false;
            this.specificDateFilter();
        } else if (
            this.isDateRangeSelected &&
            (this.dateFilterForm.controls.startDate.value || this.dateFilterForm.controls.endDate.value)
        ) {
            this.dateFilterForm.controls.specificDate.setValue("");
            this.isSpecificDateSelected = false;
            this.dateRangeFilter();
        }
        this.filterPayrollDeduction();
        if (this.enrollDateFilterDropdown) {
            this.enrollDateFilterDropdown.hide();
        }
    }
    /**
     * set filter details in the store
     */
    setDateFilterInfoStore(): void {
        const dateFilterInfo: CoverageSummaryFilterInfo = {
            mpGroup: this.mpGroupId,
            specificDate: this.dateFilterForm.controls.specificDate.value,
            startDate: this.dateFilterForm.controls.startDate.value,
            endDate: this.dateFilterForm.controls.endDate.value,
            priceFilter: this.dateFilterForm.controls.priceFilter.value,
        };
        this.store.dispatch(new SetDateFilterInfo(dateFilterInfo));
    }
    /**
     * method to display payroll deduction depending on filter
     */
    filterPayrollDeduction(): void {
        this.preTaxBaseCost = 0;
        this.preTaxAdjustment = 0;
        this.preTaxTotalCost = 0;
        this.postTaxBaseCost = 0;
        this.postTaxAdjustment = 0;
        this.postTaxTotalCost = 0;
        if (this.isFilterApplied) {
            this.benefitSummary.forEach((element) => {
                element.data.forEach((data) => {
                    if (data.status === this.approvedStatus || (data.status && data.status.startsWith(this.pendingStatus))) {
                        this.payrollDeductionInfo(data);
                    } else if (data.status === this.endedStatus) {
                        const coverageDate = data.coverageDate.split("-");
                        const endDate = coverageDate[1].substring(1);
                        if (
                            // eslint-disable-next-line no-underscore-dangle
                            this.dateService.toDate(endDate) >= this.dateFilterForm.controls.endDate.value._d ||
                            // eslint-disable-next-line no-underscore-dangle
                            this.dateFilterForm.controls.endDate.value._d === undefined
                        ) {
                            this.payrollDeductionInfo(data);
                            this.isEndedStatusFilterApplied = true;
                        }
                    }
                });
            });
        } else {
            this.setPayrollDeductionResetFilter(this.currentCoverage);
            this.setPayrollDeductionResetFilter(this.futureCoverage);
        }
    }
    /**
     * set payroll deduction value after clearing the filter
     * @param coverageDetails selected coverage details
     */
    setPayrollDeductionResetFilter(coverageDetails: Enrollments[]): void {
        coverageDetails.forEach((coverage: Enrollments) => {
            if (coverage.status === this.approvedStatus || (coverage.status && coverage.status.startsWith(this.pendingStatus))) {
                this.payrollDeductionInfo(coverage);
            }
        });
    }
    /**
     * reset filter
     * @param filter1 the filter to check for reset
     */
    resetFilter(filter1: string): void {
        if (filter1 === "date") {
            this.dateFilterForm.controls.startDate.setValue("");
            this.dateFilterForm.controls.endDate.setValue("");
            this.dateFilterForm.controls.specificDate.setValue("");
            this.minDate = null;
            this.maxDate = null;
            this.selectedDateFilter = "";
            this.isDateRangeSelected = false;
            this.isSpecificDateSelected = false;
            this.setDateFilterInfoStore();
            this.benefitSummary = [];
            if (this.currentCoverage.length) {
                this.benefitSummary.push({
                    title: this.languageStrings["primary.portal.coverage.current_coverage"],
                    data: [...this.currentCoverage],
                    isHide: false,
                    isPreviousEnrollment: false,
                });
            }
            if (this.futureCoverage.length) {
                this.benefitSummary.push({
                    title: this.languageStrings["primary.portal.coverage.future_coverage"],
                    data: [...this.futureCoverage],
                    isHide: false,
                    isPreviousEnrollment: false,
                });
            }
            if (this.previousCoverage.length) {
                this.benefitSummary.push({
                    title: this.languageStrings["primary.portal.coverage.previous_coverage"],
                    data: [...this.previousCoverage],
                    isHide: true,
                    isPreviousEnrollment: true,
                });
            }
            if (this.benefitSummary && this.benefitSummary.length) {
                this.updatePendingEAAandPdaStatus();
            }
            this.isFilterApplied = false;
            this.filterPayrollDeduction();
            if (!this.isMemberPortal) {
                this.changePriceDisplayFilter();
            }
            if (this.enrollDateFilterDropdown) {
                this.enrollDateFilterDropdown.hide();
            }
        }
    }
    specificDateFilter(): void {
        // TODO - Language needs to be implemented
        const date = this.getDateFormat(this.dateFilterForm.controls.specificDate.value);
        const filteredCurrent = [];
        let title = "";
        this.enrollData.data.forEach((data) => {
            const expireDate = this.getDateFormat(data.validity.expiresAfter);
            const startDate = this.getDateFormat(data.validity.effectiveStarting);
            if (date >= startDate && (!data.validity.expiresAfter || expireDate >= date)) {
                filteredCurrent.push(data);
            }
        });
        this.selectedDateFilter = ": " + this.datePipe.transform(date, AppSettings.DATE_FORMAT_MM_DD_YYYY);
        const specificdate = this.datePipe.transform(date, AppSettings.DATE_FORMAT_MM_DD_YYYY);
        if (this.isMemberPortal) {
            title = "Your coverage on " + specificdate;
        } else {
            title = this.memberFullName + "'s coverage on " + specificdate;
        }
        this.benefitSummary = [];
        this.benefitSummary.push({
            title: title,
            data: [...filteredCurrent],
            isHide: false,
            isPreviousEnrollment: false,
        });
        if (this.benefitSummary && this.benefitSummary.length) {
            this.updatePendingEAAandPdaStatus();
        }
        if (!this.isMemberPortal) {
            this.changePriceDisplayFilter();
        }
    }
    dateRangeFilter(): void {
        // TODO - Language needs to be implemented
        const filteredDateRange = [];
        const startDate = this.getDateFormat(this.dateFilterForm.controls.startDate.value);
        const endDate = this.getDateFormat(this.dateFilterForm.controls.endDate.value);
        let title = "";
        if (this.dateFilterForm.controls.startDate.value && !this.dateFilterForm.controls.endDate.value) {
            this.enrollData.data.forEach((data) => {
                const coverageStartDate = this.getDateFormat(data.validity.effectiveStarting);
                if (coverageStartDate >= startDate) {
                    filteredDateRange.push(data);
                }
            });
            const date = this.datePipe.transform(startDate, AppSettings.DATE_FORMAT_MM_DD_YYYY);
            if (this.isMemberPortal) {
                title = "Your coverage from " + date;
            } else {
                title = this.memberFullName + "'s coverage from " + date;
            }
            this.selectedDateFilter = ": On or after " + date;
        } else if (!this.dateFilterForm.controls.startDate.value && this.dateFilterForm.controls.endDate.value) {
            this.enrollData.data.forEach((data) => {
                if (data.validity.expiresAfter) {
                    const coverageEndDate = this.getDateFormat(data.validity.expiresAfter);
                    if (coverageEndDate <= endDate) {
                        filteredDateRange.push(data);
                    }
                } else if (this.getDateFormat(data.validity.effectiveStarting) <= endDate) {
                    filteredDateRange.push(data);
                }
            });
            const date = this.datePipe.transform(endDate, AppSettings.DATE_FORMAT_MM_DD_YYYY);
            if (this.isMemberPortal) {
                title = "Your coverage to " + date;
            } else {
                title = this.memberFullName + "'s coverage to " + date;
            }
            this.selectedDateFilter = ": On or before " + date;
        } else if (this.dateFilterForm.controls.startDate.value && this.dateFilterForm.controls.endDate.value) {
            this.enrollData.data.forEach((data) => {
                const coverageEndDate = this.getDateFormat(data.validity.expiresAfter);
                const coverageStartDate = this.getDateFormat(data.validity.effectiveStarting);
                if (coverageStartDate <= endDate && (!data.validity.expiresAfter || coverageEndDate >= startDate)) {
                    filteredDateRange.push(data);
                }
            });
            const fromdate = this.datePipe.transform(startDate, AppSettings.DATE_FORMAT_MM_DD_YYYY);
            const todate = this.datePipe.transform(endDate, AppSettings.DATE_FORMAT_MM_DD_YYYY);
            if (this.isMemberPortal) {
                title = "Your coverage from " + fromdate + " to " + todate;
            } else {
                title = this.memberFullName + "'s coverage from " + fromdate + " to " + todate;
            }
            this.selectedDateFilter = ": " + fromdate + "-" + todate;
        }
        this.benefitSummary = [];
        this.benefitSummary.push({
            title: title,
            data: [...filteredDateRange],
            isHide: false,
            isPreviousEnrollment: false,
        });
        if (this.benefitSummary && this.benefitSummary.length) {
            this.updatePendingEAAandPdaStatus();
        }
        if (!this.isMemberPortal) {
            this.changePriceDisplayFilter();
        }
    }
    /**
     * To update the values based on Price display filter
     * @returns void
     */
    changePriceDisplayFilter(): void {
        // TODO - Language needs to be implemented
        let val = this.dateFilterForm.controls.priceFilter.value;
        let date;
        if (this.dateFilterForm.controls.specificDate.value) {
            date = this.dateService.toDate(this.dateFilterForm.controls.specificDate.value);
        } else if (this.dateFilterForm.controls.startDate.value && this.dateFilterForm.controls.endDate.value) {
            const lastPayrollDeductionDate = this.payrollDeductions
                .filter(
                    (payrolldeduction) =>
                        payrolldeduction &&
                        this.dateService.isBeforeOrIsEqual(
                            this.dateService.toDate(payrolldeduction.date),
                            this.dateService.toDate(this.dateFilterForm.controls.endDate.value),
                        ) &&
                        this.dateService.getIsAfterOrIsEqual(
                            this.dateService.toDate(payrolldeduction.date),
                            this.dateService.toDate(this.dateFilterForm.controls.startDate.value),
                        ),
                )
                .sort((a: any, b: any) => this.dateService.toDate(b.date).getTime() - this.dateService.toDate(a.date).getTime());
            date = lastPayrollDeductionDate.length ? lastPayrollDeductionDate[0].date : null;
        } else if (this.dateFilterForm.controls.endDate.value) {
            const lastPayrollDeductionDate = this.payrollDeductions
                .filter(
                    (payrolldeduction) =>
                        payrolldeduction &&
                        this.dateService.isBeforeOrIsEqual(
                            this.dateService.toDate(payrolldeduction.date),
                            this.dateService.toDate(this.dateFilterForm.controls.endDate.value),
                        ),
                )
                .sort((a: any, b: any) => this.dateService.toDate(b.date).getTime() - this.dateService.toDate(a.date).getTime());
            date = lastPayrollDeductionDate.length ? lastPayrollDeductionDate[0].date : null;
        } else if (this.dateFilterForm.controls.startDate.value) {
            const lastPayrollDeductionDate = this.payrollDeductions
                .filter(
                    (payrolldeduction) =>
                        payrolldeduction &&
                        this.dateService.getIsAfterOrIsEqual(
                            this.dateService.toDate(payrolldeduction.date),
                            this.dateService.toDate(this.dateFilterForm.controls.startDate.value),
                        ),
                )
                .sort((a: any, b: any) => this.dateService.toDate(a.date).getTime() - this.dateService.toDate(b.date).getTime());
            date = lastPayrollDeductionDate.length ? lastPayrollDeductionDate[0].date : null;
        }
        switch (val) {
            case "Yearly": {
                this.payrollDeductionTitle = "Annual cost";
                this.selectedPriceFilter = ": " + val;
                const year = date ? date.getFullYear().toString() : new Date().getFullYear().toString();
                this.payrollDeductionSubTitle = "for " + year;
                this.showDateRangeOptions = true;
                this.payFrequencyName = val;
                val = "Annually";
                break;
            }
            case "Per pay period": {
                this.showDateRangeOptions = false;
                if (date) {
                    this.payrollDeductionTitle = "Payroll deduction";
                    this.payrollDeductionSubTitle = "for " + this.datePipe.transform(date, AppSettings.DATE_FORMAT_MM_DD_YYYY);
                } else {
                    this.payrollDeductionTitle = "Next payroll deduction";
                    if (this.isnextPayrollDeductionDate) {
                        this.payrollDeductionSubTitle =
                            "on " + this.datePipe.transform(this.nextPayrollDeductionDate, AppSettings.DATE_FORMAT_MM_DD_YYYY);
                    } else {
                        this.payrollDeductionSubTitle = "";
                    }
                }
                if (this.priceDisplayFilters.find((ele) => ele === "Monthly")) {
                    val = this.payFrequency.name;
                } else {
                    val = "Monthly";
                }
                this.selectedPriceFilter = ": Per pay period";
                this.payFrequencyName = val;
                break;
            }
            case "Monthly": {
                this.payrollDeductionTitle = "Monthly cost";
                const monthYear = date
                    ? this.monthNames[date.getMonth()] + " " + date.getFullYear().toString()
                    : this.monthNames[new Date().getMonth()];
                this.payrollDeductionSubTitle = "for " + monthYear;
                this.selectedPriceFilter = ": " + val;
                this.payFrequencyName = val;
                break;
            }
            default:
                return;
        }
        this.payFrequencyObject.pfType = val;
        this.payFrequencyObject = this.utilService.copy(this.payFrequencyObject);
        this.setDateFilterInfoStore();
        if (this.priceDisplayFilterDropdown) {
            this.priceDisplayFilterDropdown.hide();
        }
        if (this.enrollDateFilterDropdown) {
            this.enrollDateFilterDropdown.hide();
        }
    }
    /**
     * Method to display availbale and continuous products in MAP/MPP
     */
    displayProducts(): void {
        // Outside OE
        if (this.availPlanYears && !this.availPlanYears.length) {
            this.outsideOEEnrollmentFlag = true;
            this.enrollData.data.forEach((ele) => {
                this.products.forEach((elem) => {
                    if (ele.plan.product.id !== elem.plan.product.id) {
                        this.notEnrolled.push(elem);
                    }
                });
            });
            const cont = [];
            const py = [];
            this.notEnrolled.forEach((ele) => {
                if (ele.taxStatus === this.postTax && ele.plan.policyOwnershipType === AppSettings.INDIVIDUAL) {
                    cont.push(ele.plan);
                    this.continuousProductList = this.distinct(cont, (item) => item.product.name);
                } else {
                    py.push(ele.plan);
                    this.pyList = this.distinct(py, (item) => item.product.name);
                }
            });
            if (this.continuousProductList.length && !this.pyList.length) {
                this.continuousProductsFlag = true;
            } else if (!this.continuousProductList.length && this.pyList.length) {
                this.planYearProductsFlag = true;
            } else if (this.continuousProductList.length && this.pyList.length) {
                this.displayAllProducts = true;
            }
        } else {
            // Inside OE/OLE
            if (this.currentQualifyingEvents && this.currentQualifyingEvents.length && !this.checkFlag) {
                this.checkInQle(this.currentQualifyingEvents);
            }
            if (this.planYearsData && this.planYearsData.length && !this.checkFlag) {
                this.checkInOE(this.planYearsData);
            }
            if (!this.qleFlag && !this.oeFlag && !this.checkFlag) {
                this.outsideOeQleFlag = true;
                this.checkFlag = true;
            }
            this.availProductsFlagOE = true;
        }
    }
    displayShop(): void {
        if (this.memberCartDetails.productOfferingsInCart.length) {
            this.cartFlag = true;
            if (this.planYearsData && !this.planYearsData.length) {
                if (this.currentQualifyingEvents && this.currentQualifyingEvents.length) {
                    this.checkInQle(this.currentQualifyingEvents);
                } else {
                    this.oeMmpFlag = true;
                }
            } else {
                this.checkInOE(this.planYearsData);
            }
        } else {
            this.zeroCartFlag = true;
            this.checkContinuousPlan(this.products);
            if (this.planYearsData && !this.planYearsData.length) {
                if (this.pyList && this.pyList.length) {
                    this.qleOutsideOEFlag = true;
                } else if (this.continuousProductList.length) {
                    this.contOutsideOEFlag = true;
                }
            } else {
                this.mmpInOE = true;
                if (this.currentQualifyingEvents && this.currentQualifyingEvents.length && !this.checkFlag) {
                    this.checkInQle(this.currentQualifyingEvents);
                }
                if (this.planYearsData && this.planYearsData.length && !this.checkFlag) {
                    this.checkInOE(this.planYearsData);
                }
            }
        }
    }

    /**
     * check whether we're in OE and set any associated data
     * @param data plan year data
     */
    checkInOE(data: any): void {
        const pyDates = [];
        data.forEach((ele) => {
            if (
                this.datePipe.transform(this.currentDate, DateFormat.YEAR_MONTH_DAY) >= ele.enrollmentPeriod.effectiveStarting &&
                this.datePipe.transform(this.currentDate, DateFormat.YEAR_MONTH_DAY) <= ele.enrollmentPeriod.expiresAfter
            ) {
                pyDates.push(this.dateService.toDate(ele.enrollmentPeriod.expiresAfter));
            }
        });
        if (pyDates.length) {
            this.oeMaxDate = this.datePipe.transform(Math.max.apply(null, pyDates), AppSettings.DATE_FORMAT_MM_DD_YYYY);
            const dateDiff =
                this.dateService.toDate(this.oeMaxDate).getTime() -
                this.dateService.toDate(this.datePipe.transform(this.currentDate, DateFormat.YEAR_MONTH_DAY)).getTime();
            const noOfDays = Math.floor(dateDiff / this.oneDay);
            this.oeCoverageEndDate = noOfDays + 1;
            this.days =
                this.oeCoverageEndDate === 1
                    ? this.languageStrings["primary.portal.coverage.day"]
                    : this.languageStrings["primary.portal.coverage.days"];
            this.oeFlag = true;
            this.checkFlag = true;
        }
    }
    checkInQle(data: any): any {
        // TODO - Language needs to be implemented
        const qleDates = [];
        data.forEach((ele) => {
            if (
                this.datePipe.transform(this.currentDate, AppSettings.DATE_FORMAT) <=
                    this.datePipe.transform(ele.enrollmentValidity?.expiresAfter, AppSettings.DATE_FORMAT) &&
                this.datePipe.transform(this.currentDate, AppSettings.DATE_FORMAT) >= ele.enrollmentValidity?.effectiveStarting
            ) {
                qleDates.push(
                    this.dateService.toDate(this.datePipe.transform(ele.enrollmentValidity?.expiresAfter, DateFormat.YEAR_MONTH_DAY)),
                );
            }
        });
        if (qleDates.length) {
            this.qleMaxDate = this.datePipe.transform(Math.max.apply(null, qleDates), AppSettings.DATE_FORMAT_MM_DD_YYYY);
            const dateDiff =
                this.dateService.toDate(this.qleMaxDate).getTime() -
                this.dateService.toDate(this.datePipe.transform(this.currentDate, DateFormat.YEAR_MONTH_DAY)).getTime();
            this.qleCoverageEndDate = Math.floor(dateDiff / this.oneDay);
            this.days =
                this.qleCoverageEndDate === 1
                    ? this.languageStrings["primary.portal.coverage.day"]
                    : this.languageStrings["primary.portal.coverage.days"];
            this.qleFlag = true;
            this.checkFlag = true;
        }
    }

    checkContinuousPlan(data: any): any {
        data.forEach((ele) => {
            if (!this.continuousProductList.includes(ele.plan.product.name) && !this.pyList.includes(ele.plan.product.name)) {
                if (ele.taxStatus === this.postTax && ele.plan.policyOwnershipType === AppSettings.INDIVIDUAL) {
                    this.continuousProductList.push(ele.plan.product.name);
                } else {
                    this.pyList.push(ele.plan.product.name);
                }
            }
        });
    }
    routeToEnrollment(): void {
        this.router.navigate([`member/enrollment/app-flow/${this.memberDetails.groupId}/${this.memberDetails.memberId}`]);
    }
    /**
     * method to display Cancel Icon by checking Enrollment status
     * @returns void
     */
    setIsCancelIcons(): void {
        if (this.currentCoverage.length) {
            this.currentCoverage.forEach((coverage, index) => {
                this.isCancelCurrentCoverages[index] =
                    coverage.status === EnrollmentStatus.declined ||
                    coverage.status === EnrollmentStatus.application_denied ||
                    coverage.status === EnrollmentStatus.ended ||
                    coverage.status === EnrollmentStatus.void;
            });
        }
        if (this.futureCoverage.length) {
            this.futureCoverage.forEach((coverage, index) => {
                this.isCancelFutureCoverages[index] =
                    coverage.status === EnrollmentStatus.declined ||
                    coverage.status === EnrollmentStatus.application_denied ||
                    coverage.status === EnrollmentStatus.ended ||
                    coverage.status === EnrollmentStatus.void;
            });
        }
    }

    /**
     * Returns date object
     * @param date date in string format or date object
     * @returns date object
     */
    getDateFormat(date: string | Date): Date {
        if (date) {
            // Check for hyphenated date strings without timezone
            return typeof date === "string" && date.length === DATE_LENGTH ? this.dateService.toDate(date) : this.dateService.toDate(date);
        }
        return new Date("");
    }
    routeToLifeEvent(): any {
        this.router.navigate(["../../../qle/life-events"], { relativeTo: this.route });
    }
    /**
     * @description method to open offering-list popup component onclick of view link
     * @returns {void}
     */
    openOfferingListPopup(): void {
        this.dialog.open(OfferingListPopupComponent, {
            data: {
                mpGroup: this.accountId,
                memberId: this.memberId,
                filter: false,
                product: null,
                flexDollars: this.flexDollars,
            },
            width: "800px",
        });
    }
    /**
     * Method to update enrollment data
     * @returns Observable of product array
     */
    updateEnrollmentData(): Observable<Product[]> {
        this.isLoading = true;
        this.currentCoverage = [];
        this.futureCoverage = [];
        this.previousCoverage = [];
        this.benefitSummary = [];
        this.enrollData = {
            data: [],
            beneficiaries: [],
            enrollmentRiders: [],
            enrollmentDependents: [],
        };
        this.filterPayrollDeduction();
        return this.getCoverageData();
    }
    /**
     * @param date: To determine the input date is start date or end date
     * Function used to set the error message for minimum and maximum date
     */
    setMinMaxDate(date: string): void {
        if (date === "startDate") {
            if (this.dateFilterForm.controls.startDate.value) {
                const inputDate = this.dateService.toDate(this.dateFilterForm.controls.startDate.value);
                if (isNaN(inputDate.getTime())) {
                    this.dateFilterForm.controls.startDate.setErrors({ requirements: true });
                    this.minDate = null;
                    this.datePickerErrorMessage = this.language.fetchSecondaryLanguageValue(
                        "secondary.portal.benefitsOffering.coveragedates.invalidDate",
                    );
                } else if (this.maxDate && this.maxDate <= inputDate) {
                    this.dateFilterForm.controls.startDate.setErrors({ requirements: true });
                    this.datePickerErrorMessage = this.language.fetchSecondaryLanguageValue(
                        "secondary.portal.benefitsOffering.startdate.validation",
                    );
                    this.minDate = null;
                } else {
                    this.dateFilterForm.controls.startDate.setErrors(null);
                    this.minDate = this.dateService.toDate(this.dateFilterForm.controls.startDate.value);
                }
            } else {
                this.minDate = null;
                this.dateFilterForm.controls.startDate.setErrors(null);
            }
        } else if (date === "endDate") {
            const inputEndDate = this.dateService.toDate(this.dateFilterForm.controls.endDate.value);
            if (this.dateFilterForm.controls.endDate.value) {
                this.maxDate = inputEndDate;
            } else {
                this.maxDate = null;
                this.dateFilterForm.controls.endDate.setErrors(null);
            }
        }
        if (!this.dateFilterForm.controls.endDate.value && !this.dateFilterForm.controls.startDate.value) {
            this.dateFilterForm.controls.endDate.clearValidators();
            this.dateFilterForm.controls.startDate.clearValidators();
            this.dateFilterForm.updateValueAndValidity();
        }
    }
    /**
     * Function to send the reminder to the customer for enrollment completion
     */
    sendToCustomer(sendPdaData?: MemberContactListDisplay): void {
        let requestData: SendReminderMode;
        const requestSignData = sendPdaData ?? this.contactForm.value.contacts;
        this.isLoading = true;
        if (requestSignData.type === this.email) {
            requestData = { email: requestSignData.contact };
        } else {
            requestData = { phoneNumber: requestSignData.contact };
        }
        if (this.isEnrolled) {
            this.aflacAlwaysService
                .requestAflacAlwaysSignature(this.mpGroupId, this.memberId, requestData, true)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (resp) => {
                        this.isLoading = false;
                        this.requestSent = true;
                    },
                    (error) => {
                        this.isLoading = false;
                    },
                );
        } else {
            this.shoppingCartService
                .requestShoppingCartSignature(
                    this.mpGroupId,
                    this.memberId,
                    requestData,
                    sendPdaData ? PendingReasonForPdaCompletion.PDA : PendingReasonForPdaCompletion.ENROLLMENT,
                )
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (resp) => {
                        this.isLoading = false;
                        this.requestSent = true;
                    },
                    (error) => {
                        this.isLoading = false;
                    },
                );
        }
    }

    /**
     * This method is used to display member contacts after submitting
     * the applications during headset enrollment flow
     *
     * This method is used to set the list of member contacts to be displayed and
     * will pre-select the primary contact, if any
     */
    showContact(): void {
        this.contactForm = this.fb.group({});
        this.contactList = [];
        let selectedValue;
        if (this.emailContacts.length) {
            this.emailContacts.forEach((contact) => {
                this.contactList.push({
                    contact: contact.email,
                    disableField: false,
                    type: this.email,
                    primary: contact.primary,
                });
            });
            const primaryEmail: MemberContactListDisplay[] = this.contactList.filter((eachContact) => eachContact.primary);
            selectedValue = primaryEmail.length ? primaryEmail[0] : this.contactList[0];
        } else {
            this.contactList.push({
                contact: this.languageStrings["primary.portal.headset.noemailaddress"],
                disableField: true,
            });
        }
        if (this.textContacts.length) {
            this.textContacts.forEach((contact) => {
                this.contactList.push({
                    contact: contact,
                    disableField: false,
                    type: this.phoneNumber,
                    formatted: this.utilService.formatPhoneNumber(contact),
                });
            });
            if (!selectedValue) {
                selectedValue = this.contactList[1];
            }
        } else {
            this.contactList.push({
                contact: this.languageStrings["primary.portal.headset.nomobile"],
                disableField: true,
            });
        }
        const savedContact = this.contactList.filter((contact) => contact.type).pop();
        if (savedContact) {
            this.hasMemberContact = true;
        }
        this.contactForm.addControl("contacts", this.fb.control(selectedValue));
    }

    addContactInfo(): void {
        const url = `${this.portal}/${this.mpGroupId}/member/${this.memberId}/memberadd/`;
        this.router.navigate([url]);
    }
    getPayrollDeductions(): void {
        forkJoin(
            this.planOfferingIds.map((id) =>
                this.shoppingService.getPayrollDeductions(id, this.accountId).pipe(
                    catchError(() => of([])),
                    take(1),
                ),
            ),
        ).subscribe((planPayrollDeductions) => {
            // Show date range if at least one plan has payroll deductions
            this.showDateRangeOptions = planPayrollDeductions.some(
                (planPayrollDeduction) => planPayrollDeduction && planPayrollDeduction.length > 0,
            );
            this.payrollDeductions = [].concat(...planPayrollDeductions);
        });
    }
    showErrorAlertMessage(err: Error): void {
        this.showErrorMessage = true;
        const error = err["error"];
        if (error.status === AppSettings.API_RESP_400 && error["details"].length > 0) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(
                "secondary.portal.enrollments.api." + error.status + "." + error.code + "." + error["details"][0].field,
            );
        } else {
            this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code);
        }
    }
    /**
     * transform datepicker input values to the specified date format
     * @param event: the keyboard event that captures user input into the field
     */
    transform(event: KeyboardEvent): void {
        (event.target as HTMLInputElement).value = this.maskPipe.transform(
            (event.target as HTMLInputElement).value,
            AppSettings.DATE_MASK_FORMAT,
        );
    }

    navigateToPendingEnrollments(): void {
        this.router.navigate(["pending-applications/view-enrollments/manage"], {
            relativeTo: this.route,
        });
    }
    /**
     * method to decide route on click of shop button in zero state
     */
    shopPageNavigation(): void {
        if (this.isTPI) {
            if (this.store.selectSnapshot(TPIState.tpiShopRoute)) {
                this.tpiShopRoute = this.store.selectSnapshot(TPIState.tpiShopRoute);
                this.router.navigate([this.tpiShopRoute]);
            } else {
                this.router.navigate([TPI_SHOP_ROUTE]);
            }
        } else if (this.isMemberPortal) {
            this.routeToMemberShop();
        } else {
            this.routeToShop();
        }
    }
    /**
     * Checks if dependent covered or not in enrolled plan
     * @param coverageLevelName selected plan coverage level name
     * @return whether dependent is covered
     */
    isDependentCovered(coverageLevelName: string): boolean {
        return (
            coverageLevelName === CoverageLevelNames.ONE_PARENT_FAMILY_COVERAGE ||
            coverageLevelName === CoverageLevelNames.TWO_PARENT_FAMILY_COVERAGE ||
            coverageLevelName === CoverageLevelNames.NAME_INSURED_SPOUSE_ONLY_COVERAGE ||
            coverageLevelName === CoverageLevelNames.EMPLOYEE_SPOUSE_CHILDREN_COVERAGE ||
            coverageLevelName === CoverageLevelNames.EMPLOYEE_SPOUSE_COVERAGE ||
            coverageLevelName === CoverageLevelNames.EMPLOYEE_CHILDREN_COVERAGE ||
            coverageLevelName === CoverageLevelNames.FAMILY
        );
    }

    /**
     * To open pop up modal for enrollment method in case of pending PDA
     * To open PDA modal for agent self-assisted flow
     * @param enrollment id
     */
    openEnrollmentMethodModal(enrollmentId: number): void {
        const existingPdaForm = this.unsignedPDAForms.find((pdaForm) =>
            pdaForm.policyPremiums.some((policyPremium) => policyPremium.newEnrollmentId === enrollmentId),
        );
        if (existingPdaForm) {
            this.pdaFormId = existingPdaForm.id;
        }
        if (!this.isSelfEnrollment) {
            const dialogReference = this.empoweredModalService.openDialog(PdaCompletionComponent);
            dialogReference
                .afterClosed()
                .pipe(
                    takeUntil(this.unsubscribe$),
                    switchMap((response) => {
                        if (response !== undefined) {
                            this.enrollMethodType = response;
                            this.isHeadset = response === EnrollmentMethod.HEADSET;
                            return this.openPDAModal();
                        }
                        return of(null);
                    }),
                )
                .subscribe();
        } else {
            this.openPDAModal().subscribe();
        }
    }

    /**
     * Method to open PDA modal
     * @returns observable of boolean if pda is saved or updated enrollment data
     */
    openPDAModal(): Observable<boolean | Product[] | null> {
        const state = this.showPRStateForm ? CompanyCode.PR : CompanyCode.US;
        const dialogRef = this.empoweredModalService.openDialog(NewPdaComponent, {
            data: {
                mpGroupId: this.mpGroupId,
                memberId: this.memberId,
                enrollmentType: this.enrollMethodType,
                isDocument: false,
                state: state,
                isOwnAccount: this.isAccountProducer,
                isEditPda: true,
                producerId: this.producerId,
                formId: this.pdaFormId,
                openedFrom: COVERAGE_SUMMARY,
            },
        });
        return dialogRef.afterClosed().pipe(
            takeUntil(this.unsubscribe$),
            filter((res) => res),
            switchMap(() => this.updateEnrollmentData()),
            switchMap((resp) => {
                if (!this.pdaFormId && this.isHeadset) {
                    return this.empoweredModalService
                        .openDialog(SendApplicantPdaComponent, {
                            data: {
                                contactList: this.contactList,
                                firstName: this.firstName,
                            },
                        })
                        .afterClosed();
                }
                return of(resp);
            }),
            tap((dialogResponse) => {
                if (dialogResponse.action === SEND_PDA_APPLICATION) {
                    this.sendToCustomer(dialogResponse.selectedValue);
                }
                if (dialogResponse.action === ADD_MEMBER_CONTACT) {
                    this.addContactInfo();
                }
            }),
        );
    }
    /**
     * to get dual plan year data and set up flag for isDualPlanYear
     * @returns Observable<QleOeShopModel>
     */
    getDualPlanYearData(): Observable<QleOeShopModel> {
        return this.dualPlanYearService.dualPlanYear(this.memberDetails.memberId, this.memberDetails.groupId).pipe(
            tap((response) => {
                this.dualPlanYearData = response;
            }),
        );
    }
    /**
     * set scenario objects for qle in case of dual plan year
     */
    setScenarioObjectForQle(): void {
        const qleEndDate = this.dateService.format(
            this.dateService.toDate(this.dualPlanYearData.qleEventData[this.QLE_INDEX].enrollmentValidity?.expiresAfter),
            DualPlanYearSettings.MONTH_DAY_FORMAT,
        );
        if (
            (this.cartContainsOf && this.cartContainsOf === DualPlanYearSettings.QLE_SHOP) ||
            this.checkQleOeCoverage(DualPlanYearSettings.QLE_SHOP)
        ) {
            this.qleTitle = this.languageStrings["primary.portal.noCoverage.dualPlanYear.coverageUpdate"].replace(
                this.EMPLOYEE_NAME_PLACEHOLDER,
                this.memberDetails.name.firstName,
            );
            this.qleDescription = this.languageStrings["primary.portal.noCoverage.dualPlanYear.coverageUpdateContent"].replace(
                this.PLAN_DATE_PLACEHOLDER,
                qleEndDate,
            );
            this.qleShopUpdateButton = this.languageStrings["primary.portal.members.wizard.dualPlanYear.continueCoverage"];
        } else {
            this.qleTitle = this.languageStrings["primary.portal.members.coverage.dualPlanYear.lifeEvent"].replace(
                this.EMPLOYEE_NAME_PLACEHOLDER,
                this.memberDetails.name.firstName,
            );
            this.qleDescription = this.languageStrings[
                "primary.portal.members.coverage.dualPlanYear.coverage.updateCurrentCoverage"
            ].replace(this.PLAN_DATE_PLACEHOLDER, qleEndDate);
            this.qleShopUpdateButton = this.languageStrings["primary.portal.members.coverage.dualPlanYear.updateCoverage"];
        }
    }
    /**
     * set scenario objects for oe in case of dual plan year
     */
    setScenarioObjectForOe(): void {
        if (
            (this.cartContainsOf && this.cartContainsOf === DualPlanYearSettings.OE_SHOP) ||
            this.checkQleOeCoverage(DualPlanYearSettings.OE_SHOP)
        ) {
            this.oeTitle = this.languageStrings["primary.portal.noCoverage.dualPlanYear.enrollmentInProgress"].replace(
                this.EMPLOYEE_NAME_PLACEHOLDER,
                this.memberDetails.name.firstName,
            );
            this.oeDescription = this.languageStrings["primary.portal.noCoverage.dualPlanYear.enrollmentEnds"].replace(
                this.PLAN_DATE_PLACEHOLDER,
                this.dateService.format(
                    this.dateService.toDate(this.dualPlanYearData.planYearsData[this.NEXT_PLAN_YEAR_INDEX].coveragePeriod.expiresAfter),
                    DateFnsFormat.LONG_MONTH_AND_DAY,
                ),
            );
            this.oeShopCoverageButton = this.languageStrings["primary.portal.noCoverage.dualPlanYear.continueEnrollment"];
        } else {
            this.oeTitle = this.languageStrings["primary.portal.members.coverage.dualPlanYear.openEnrollment"].replace(
                this.EMPLOYEE_NAME_PLACEHOLDER,
                this.memberDetails.name.firstName,
            );
            this.oeDescription = this.languageStrings["primary.portal.members.coverage.dualPlanYear.nextYearCoverage"].replace(
                this.PLAN_DATE_PLACEHOLDER,
                this.dateService.format(
                    this.dateService.toDate(this.dualPlanYearData.planYearsData[this.NEXT_PLAN_YEAR_INDEX].coveragePeriod.expiresAfter),
                    DateFnsFormat.LONG_MONTH_AND_DAY,
                ),
            );
            this.oeShopCoverageButton = this.languageStrings["primary.portal.members.coverage.dualPlanYear.shopCoverage"];
        }
    }
    /**
     * set scenario objects for current plan year qle in case of dual plan year
     */
    setScenarioObjectForCurrentPYQle(): void {
        const qleEndDate = this.dateService.format(
            this.dateService.toDate(this.dualPlanYearData.qleEventData[this.QLE_INDEX].enrollmentValidity?.expiresAfter),
            DateFnsFormat.LONG_MONTH_AND_DAY,
        );
        if (
            (this.cartContainsOf && this.cartContainsOf === DualPlanYearSettings.QLE_SHOP) ||
            this.checkQleOeCoverage(DualPlanYearSettings.QLE_SHOP)
        ) {
            this.qleTitle = this.languageStrings["primary.portal.noCoverage.dualPlanYear.coverageUpdate"].replace(
                this.EMPLOYEE_NAME_PLACEHOLDER,
                this.memberDetails.name.firstName,
            );
            this.qleDescription = this.languageStrings["primary.portal.noCoverage.dualPlanYear.coverageUpdateContent.current"].replace(
                this.PLAN_DATE_PLACEHOLDER,
                qleEndDate,
            );
            this.qleShopUpdateButton = this.languageStrings["primary.portal.members.wizard.dualPlanYear.continueCoverage"];
        } else {
            this.qleTitle = this.languageStrings["primary.portal.members.coverage.dualPlanYear.lifeEvent.current"].replace(
                this.EMPLOYEE_NAME_PLACEHOLDER,
                this.memberDetails.name.firstName,
            );
            this.qleDescription = this.languageStrings[
                "primary.portal.members.coverage.dualPlanYear.coverage.updateCurrentCoverage.current"
            ].replace(this.PLAN_DATE_PLACEHOLDER, qleEndDate);
            this.qleShopUpdateButton = this.languageStrings["primary.portal.members.coverage.dualPlanYear.updateCoverage"];
        }
    }
    /**
     * set scenario objects for oe in case of dual plan year
     */
    setScenarioObjectForNewQle(): void {
        const qleEndDate = this.dateService.format(
            this.dateService.toDate(this.dualPlanYearData.qleEventData[this.QLE_INDEX].enrollmentValidity?.expiresAfter),
            DateFnsFormat.LONG_MONTH_AND_DAY,
        );
        if (this.cartContainsOf === DualPlanYearSettings.NEW_PY_QLE_SHOP || this.checkQleOeCoverage(DualPlanYearSettings.NEW_PY_QLE_SHOP)) {
            this.oeTitle = this.languageStrings["primary.portal.noCoverage.dualPlanYear.coverageUpdate.future"].replace(
                this.EMPLOYEE_NAME_PLACEHOLDER,
                this.memberDetails.name.firstName,
            );
            this.oeDescription = this.languageStrings["primary.portal.noCoverage.dualPlanYear.coverageUpdateContent.future"].replace(
                this.PLAN_DATE_PLACEHOLDER,
                qleEndDate,
            );
            this.oeShopCoverageButton = this.languageStrings["primary.portal.members.wizard.dualPlanYear.continueCoverage"];
        } else {
            this.oeTitle = this.languageStrings["primary.portal.members.coverage.dualPlanYear.lifeEvent.future"].replace(
                this.EMPLOYEE_NAME_PLACEHOLDER,
                this.memberDetails.name.firstName,
            );
            this.oeDescription = this.languageStrings[
                "primary.portal.members.coverage.dualPlanYear.coverage.updateCurrentCoverage.future"
            ].replace(this.PLAN_DATE_PLACEHOLDER, qleEndDate);
            this.oeShopCoverageButton = this.languageStrings["primary.portal.members.coverage.dualPlanYear.updateCoverage.future"];
        }
    }
    /**
     * @description setting up store data as per selected shop
     * @param shop selected shop
     */
    setStoreData(shop: string): void {
        if (
            shop === DualPlanYearSettings.QLE_SHOP ||
            shop === DualPlanYearSettings.OE_SHOP ||
            shop === DualPlanYearSettings.NEW_PY_QLE_SHOP
        ) {
            this.dualPlanYearService.setSelectedShop(shop);
        }
        this.routeToMemberShop();
    }
    /**
     * @description to open warning pop up getting response after close
     * @param shopSelected selected shop
     */
    openWarningPopUp(shopSelected: string): void {
        const cartWarningDialogRef = this.empoweredModalService.openDialog(CartWarningPopupComponent, {
            data: {
                memberPortal: true,
                selectedShop: shopSelected,
                memberId: this.memberDetails.memberId,
                groupId: this.memberDetails.groupId,
                memberName: this.memberDetails.name.firstName,
                oeYear: this.dualPlanYearData.oeYear,
                qleYear: this.dualPlanYearData.qleYear,
                isQleDuringOE: this.isQleDuringOeEnrollment,
                isQleAfterOE: this.isQleAfterOeEnrollment,
            },
        });
        cartWarningDialogRef.afterClosed().subscribe((response) => {
            if (response === this.SUCCESS) {
                this.setStoreData(shopSelected);
            }
        });
    }
    /**
     *  to route mmp shop page or to open warning pop up after clicking on update qle covrage button
     */
    updateQleCoverage(): void {
        this.cartContainsOf = this.dualPlanYearService.checkCartItems(
            this.cartItems,
            this.memberId,
            this.accountId,
            DualPlanYearSettings.QLE_SHOP,
        );
        if (this.cartContainsOf === DualPlanYearSettings.OE_SHOP || this.cartContainsOf === DualPlanYearSettings.NEW_PY_QLE_SHOP) {
            this.openWarningPopUp(DualPlanYearSettings.QLE_SHOP);
        } else {
            this.setStoreData(DualPlanYearSettings.QLE_SHOP);
        }
    }
    /**
     * to route mmp shop page or to open warning pop up after clicking on shop for next year button
     */
    shopNextPlanYearCoverage(): void {
        const selectedShop = this.isQleDuringOeEnrollment ? DualPlanYearSettings.OE_SHOP : DualPlanYearSettings.NEW_PY_QLE_SHOP;
        this.cartContainsOf = this.dualPlanYearService.checkCartItems(this.cartItems, this.memberId, this.accountId, selectedShop);
        if (this.cartContainsOf && this.cartContainsOf === DualPlanYearSettings.QLE_SHOP) {
            this.openWarningPopUp(selectedShop);
        } else {
            this.setStoreData(selectedShop);
        }
    }
    /**
     * check coverages for qle or oe
     * @returns true if coverage is there for either qle or oe else false
     */
    checkQleOeCoverage(coverageType: string): boolean {
        const groupedCartItems: GroupedCartItems = this.dualPlanYearService.groupCartItems(this.cartItems);
        if (groupedCartItems.vasPlans.length && groupedCartItems.preTaxPlans.length === 0 && groupedCartItems.postTaxPlans.length === 0) {
            return !groupedCartItems.vasPlans.some(
                (vasPlan) =>
                    vasPlan.planOffering &&
                    vasPlan.planOffering.plan.characteristics[CHARACTERISTICS_AUTOENROLLABLE_INDEX] === AUTOENROLLABLE,
            );
        }
        if (this.enrollData.data && this.enrollData.data.length) {
            if (coverageType === DualPlanYearSettings.QLE_SHOP) {
                if (this.isQleDuringOeEnrollment) {
                    return this.enrollData.data.some((enrollment) => enrollment.qualifyingEventId);
                }
                if (this.isQleAfterOeEnrollment) {
                    return this.enrollData.data.some((enrollment) =>
                        enrollment.validity ? this.getDateFormat(enrollment.validity.effectiveStarting) <= this.currentDate : false,
                    );
                }
            }
            if (coverageType === DualPlanYearSettings.OE_SHOP) {
                return this.enrollData.data.some((enrollment) => !enrollment.qualifyingEventId);
            }
            if (coverageType === DualPlanYearSettings.NEW_PY_QLE_SHOP) {
                return this.enrollData.data.some((enrollment) =>
                    enrollment.validity ? this.getDateFormat(enrollment.validity.effectiveStarting) > this.currentDate : false,
                );
            }
        }
        return false;
    }
    /**
     * sets the offer list description
     * @returns void
     */
    setOfferListDescriptionTag(): void {
        this.offerListDescription = this.languageStrings["primary.portal.coverage.offerlistDescription"].replace(
            "##accountName##",
            this.accountName,
        );
    }

    /**
     * Function to return date in "yyyy/mm/dd" format
     * @param dateValue {(Date | string)}
     * @returns date in yyyy-mm-dd format
     */
    dateTransform(dateValue: Date | string): string {
        return this.datePipe.transform(dateValue, DateFormats.YEAR_MONTH_DAY);
    }
    /**
     * This method fetches the producer details of the group
     */
    getProducerDetails(): void {
        this.subscriptions.push(
            this.accService.getAccountProducers(this.mpGroupId.toString()).subscribe((producerList) => {
                this.isAccountProducer = producerList.some((producer) => producer.producer.id === this.producerId);
            }),
        );
    }

    /**
     * Method to check all required info is available for member or not
     * @returns boolean - true if all info is available else false
     */
    isCompletedRequiredInfo(): boolean {
        return (
            // If plan information delivery preference is electronic check if memberContactInfo.emailAddresses is non-empty
            this.emailContacts?.length && this.MemberInfo.ssn && this.ssnConfirmationEnabled && this.MemberInfo.ssnConfirmed
        );
    }

    /**
     * Opens EBS required and info modals when configuration is enabled and payment status is valid and link is clicked
     * @returns void
     */
    gotoAflacEBS(): void {
        if (!this.isCompletedRequiredInfo()) {
            this.ebsReqDialog = this.empoweredModalService.openDialog(EBSRequiredInfoComponent, {
                data: {
                    memberInfo: this.MemberInfo,
                    memberContacts: this.memberContacts,
                    mpGroupId: this.mpGroupId,
                    memberId: this.memberId,
                    ssnConfirmationEnabled: this.ssnConfirmationEnabled,
                    ebsPaymentOnFile: this.paymentPresent,
                    enrollIds: this.enrollIds,
                },
            });
            this.ebsReqDialog.componentInstance.isEbsRequiredFlow.pipe(takeUntil(this.unsubscribe$)).subscribe((closeData) => {
                this.callEbsPaymentOnFile(this.enrollIds, closeData?.fromContEbs, closeData?.failedEbsPaymentCallback);
            });
            this.ebsReqDialog
                .afterClosed()
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(() => {
                    // Assign the latest
                    if (!this.MemberInfo.ssn) {
                        this.memberService
                            .getMember(this.memberId, true, this.mpGroupId)
                            .pipe(takeUntil(this.unsubscribe$))
                            .subscribe((res) => (this.MemberInfo = res.body));
                    }
                    if (this.emailContacts?.length === 0) {
                        this.memberService
                            .getMemberContacts(this.memberId, this.mpGroupId)
                            .pipe(takeUntil(this.unsubscribe$))
                            .subscribe((res) =>
                                res.forEach((contact) => {
                                    if (contact.emailAddresses.length) {
                                        this.emailContacts = [...contact.emailAddresses];
                                    }
                                }),
                            );
                    }
                });
        } else {
            this.ebsInfoDialog = this.empoweredModalService.openDialog(EBSInfoModalComponent, {
                data: {
                    isFromNonEnrollmentFlow: true,
                    mpGroup: this.mpGroupId.toString(),
                    memberId: this.memberId,
                    ebsPaymentOnFile: this.paymentPresent,
                    fromComponentName: "CoverageSummaryComponent",
                },
            });
            this.ebsInfoDialog
                .afterClosed()
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((closeData) => {
                    this.callEbsPaymentOnFile(this.enrollIds, closeData?.fromContEbs, closeData?.failedEbsPaymentCallback);
                });
        }
    }

    /**
     * Method to invoke getEbsPaymentOnFile after dialog close
     * @param enrollIds enrollment ids
     * @paaram fromInfoModal if being called from EBS Info Modal
     * @returns Observable<EbsPaymentRecord>
     */
    callEbsPaymentOnFile(enrollIds: number[], fromContEbs?: boolean, failedEbsPaymentCallback?: boolean): void {
        this.memberService
            .getEbsPaymentOnFile(this.memberId, this.mpGroupId)
            .pipe(
                switchMap((ebsPaymentRes) => {
                    const ebsPmt: EbsPaymentFileEnrollment = {
                        enrollmentIds: enrollIds,
                        ebsPaymentOnFile: (Object.keys(ebsPaymentRes) as unknown)[0],
                    };
                    this.currentEbsOnfile = ebsPaymentRes;
                    return this.enrollmentsService.updateEbsPaymentOnFile(this.memberId, this.mpGroupId, ebsPmt);
                }),
                tap(() => {
                    let toastErr = false;
                    if (fromContEbs) {
                        if (
                            this.currentEbsOnfile.CREDIT_CARD_PRESENT ||
                            this.currentEbsOnfile.DIRECT_DEPOSIT ||
                            this.currentEbsOnfile.BANK_INFORMATION_PRESENT
                        ) {
                            this.openToast(
                                this.languageStrings["primary.portal.applicationFlow.ebs.successfulMsg"],
                                ToastType.SUCCESS,
                                TOAST_DURATION,
                            );
                        } else {
                            toastErr = true;
                        }
                    }
                    if (failedEbsPaymentCallback || toastErr) {
                        this.ebsPaymentFailed = true;
                        this.openToast(
                            this.languageStrings["primary.portal.applicationFlow.ebs.warningMsg"],
                            ToastType.WARNING,
                            TOAST_DURATION,
                        );
                    }
                }),
                takeUntil(this.unsubscribe$),
                catchError(() => {
                    this.ebsPaymentFailed = true;
                    this.paymentPresent = false;
                    this.openToast(
                        this.languageStrings["primary.portal.applicationFlow.ebs.warningMsg"],
                        ToastType.WARNING,
                        TOAST_DURATION,
                    );
                    return EMPTY;
                }),
            )
            .subscribe();
    }

    /**
     * Method that opens a toast message to display messaging to a user
     * @param message The message to display
     * @param type will be ToastType for the type of toast to display
     * @param duration in milliseconds to display toast
     * @returns void
     */
    openToast(message: string, type: ToastType, duration: number): void {
        const toastData: ToastModel = {
            message: message,
            toastType: type,
            duration: duration,
        };
        this.store.dispatch(new OpenToast(toastData));
    }

    /**
     * Function to return enrolled rider ids for selected plan
     * @param dependentPlanIds {number[]} array of available rider id
     * @param riderEnrollments {Enrollments[]} array of all rider's enrollments
     * @returns {number[]} array of enrolled rider's id
     */
    getEnrolledRiderIds(dependentPlanIds: number[], riderEnrollments: Enrollments[]): number[] {
        return dependentPlanIds.filter((dependenPlanId: number) =>
            // This enrolled rider consist riders belongs to all enrolled plans
            // So filtering out the selected plan's enrolled rider only
            riderEnrollments.map((enrolledRider) => enrolledRider.plan.id).includes(dependenPlanId),
        );
    }

    /**
     * Method to check Aflac Always
     * @returns void
     */
    checkAflacAlways(): void {
        this.isAflacAlways$ = combineLatest([
            this.staticUtilService.cacheConfigEnabled(
                this.isTPI ? ConfigName.REVISE_AFLAC_ALWAYS_FEATURE_TPI : ConfigName.REVISE_AFLAC_ALWAYS_FEATURE_ENABLE,
            ),
            this.accService.getAccount(this.mpGroupId.toString()),
            this.accService.getGroupAttributesByName(
                [AccountTypes.ACH_ACCOUNT, AccountTypes.LIST_BILL_ACCOUNT, AccountTypes.EBS_ACCOUNT],
                this.mpGroupId,
            ),
        ]).pipe(
            map(([reviseAflacAlwaysConfig, account, groupAttributesByName]) => {
                // If Revise Aflac Always feature config is off, don't show Aflac Always card
                if (!reviseAflacAlwaysConfig) {
                    return false;
                } else {
                    // Get account info partner account type for direct bill
                    const isDirectBillPartnerAccountType = account.partnerAccountType === PartnerAccountType.PAYROLLDIRECTBILL;
                    // Get account info partner account types for PDA (Union, Association, Nonpayroll)
                    const isCompletePdaPartnerAccountType =
                        account.partnerAccountType === PartnerAccountType.UNION ||
                        account.partnerAccountType === PartnerAccountType.ASSOCIATION ||
                        account.partnerAccountType === PartnerAccountType.NONPAYROLL;
                    // Account/Group Attributes
                    let isAchAccount = false;
                    let isListBill = false;
                    let isEbsAccount = false;
                    // If ACH or if EBS set value to check and hide card
                    if (
                        groupAttributesByName.some(
                            (data) => data.attribute === AccountTypes.ACH_ACCOUNT && data.value.toLowerCase() === "true",
                        )
                    ) {
                        isAchAccount = true;
                    }
                    if (
                        groupAttributesByName.some(
                            (data) => data.attribute === AccountTypes.EBS_ACCOUNT && data.value.toLowerCase() === "true",
                        )
                    ) {
                        isEbsAccount = true;
                    }
                    // If List Bill set value to check to show/hide card
                    if (
                        groupAttributesByName.some(
                            (data) => data.attribute === AccountTypes.LIST_BILL_ACCOUNT && data.value.toLowerCase() === "true",
                        )
                    ) {
                        isListBill = true;
                    }
                    // Boolean check for qualifying AA criteria
                    // If not EBS/ACH proceed to show/hide card
                    if (!isEbsAccount && !isAchAccount) {
                        // Check if Direct Bill attribute to hide card
                        if (isDirectBillPartnerAccountType) {
                            return false;
                        }
                        // Check if PDA Partner (Union, Association, Nonpayroll) AND List Bill attribute to show/hide card
                        if (isCompletePdaPartnerAccountType) {
                            if (!isListBill) {
                                return false;
                            } else {
                                return true;
                            }
                        } else {
                            return true;
                        }
                    } else {
                        return false;
                    }
                }
            }),
        );
    }

    /**
     * Method that implements destroy lifecycle hook to clean up observables
     * @returns void
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((element) => element.unsubscribe());
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
