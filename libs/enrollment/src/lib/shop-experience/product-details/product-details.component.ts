import {
    Component,
    Input,
    OnChanges,
    ChangeDetectorRef,
    AfterViewChecked,
    SimpleChanges,
    OnDestroy,
    Output,
    EventEmitter,
    OnInit,
    ViewChild,
} from "@angular/core";
import {
    ShoppingService,
    AccountService,
    KnockoutQuestion,
    EnrollmentStatus,
    CoreService,
    BenefitsOfferingService,
    ShoppingCartDisplayService,
    InputType,
    CartStatus,
    EnrollmentStatusType,
    GetShoppingCart,
    MemberService,
    QLEEndPlanRequestStatus,
    CarrierStatus,
    ApplicationStatusTypes,
    LanguageModel,
    StaticService,
    Juvenile,
    ReinstatementType,
    Carrier,
    coverageStartFunction,
} from "@empowered/api";
import { Store, Select } from "@ngxs/store";

import {
    EnrollmentState,
    EnrollmentMethodState,
    SetProductPlanOfferings,
    SetExitPopupStatus,
    SetPlanStatus,
    SetProductOfferingsOfId,
    SetKnockOutData,
    ResetPlanKnockOutData,
    SetCompanyProductsDisplayed,
    SetAllPlanOfferings,
    SetErrorForShop,
    ShopCartService,
    MemberWizardState,
    DualPlanYearState,
    QleOeShopModel,
    SharedState,
    ApplicationStatusService,
    StaticUtilService,
    UtilService,
    DualPlanYearService,
    TPIState,
} from "@empowered/ngxs-store";
import { Observable, forkJoin, of, Subscription, ObservableInput, combineLatest, Subject } from "rxjs";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { NotEligibleDialogComponent } from "../../knockout-questions/not-eligible-dialog/not-eligible-dialog.component";
import { OfferingListPopupComponent, PayrollFrequencyCalculatorPipe, PlanDetailsComponent } from "@empowered/ui";
import { PlanMissingInfoPopupComponent } from "../product-details/plan-missing-info-popup/plan-missing-info-popup.component";
import {
    CarrierId,
    EnrollmentEnums,
    ProductId,
    DateFormats,
    ConfigName,
    DateInfo,
    ApiError,
    TpiSSOModel,
    PayFrequency,
    RiskClass,
    KnockoutType,
    EnrollmentConstants,
    AppSettings,
    PayFrequencyObject,
    DualPlanYearSettings,
    EnrollmentMethod,
    Characteristics,
    RiderCart,
    AddCartItem,
    ProductType,
    MissingInfoType,
    TaxStatus,
    CoverageLevelRule,
    CoverageLevel,
    PolicyOwnershipType,
    DependencyType,
    EnrollmentRequirement,
    GetCartItems,
    ProducerCredential,
    Enrollments,
    ApplicationResponse,
    PlanOfferingPricing,
    MemberFlexDollar,
    DisableType,
    PlanOfferingPanel,
    MemberQualifyingEvent,
    ProductOfferingPanel,
    PlanYearModel,
    MemberProfile,
} from "@empowered/constants";
import { map, catchError, mergeMap, finalize, take, tap, filter, switchMap, takeUntil } from "rxjs/operators";
import { LanguageService, LanguageState } from "@empowered/language";
import { ReplacementPlanModalComponent } from "../plan-selection/replacement-plan-modal/replacement-plan-modal.component";
import { KnockoutQuestionsDialogComponent } from "../../knockout-questions/knockout-questions-dialog/knockout-questions-dialog.component";
import { DatePipe } from "@angular/common";
import { MatExpansionPanel } from "@angular/material/expansion";
import { Router } from "@angular/router";
import { TpiServices, SharedService, EmpoweredModalService } from "@empowered/common-services";
import { UserService } from "@empowered/user";
// eslint-disable-next-line max-len
import { CompanyProvidedProductsDialogComponent } from "../shop-overview/company-provided-products-dialog/company-provided-products-dialog.component";
import { DateService } from "@empowered/date";

// Component Level Constant
const TPI = "tpi";
const PRIMARY_PRODUCER = "PRIMARY_PRODUCER";
const BLANK = "";
const REQ_ENROLL_PLAN: DependencyType = "REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN";
const REQ_NONENROLL_PLAN: DependencyType = "REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN";
const BASE = "BASE";
const REQ_PLAN_NAME = "requiredPlanName";
const REQ_PLAN_TYPE = "requirementType";
const HUNDRED = 100;
const ENROLLED_COVERAGE_LEVEL = 1;
const PRIMARY_PRODUCT_LANGUAGE = "primary.portal.qle.addNewQle";
const PLAN_SUMMARY_LANGUAGE = "primary.portal.shoppingExperience.planSummary";
const RESET_ENOLLMENT_LANGUAGE = "primary.portal.shoppingExperience.resetActiveEnrollment";
const REVERT_UPDATES_LANGUAGE = "primary.portal.shoppingExperience.dualPlanYear.revertPlanUpdatesPara";
const REVERT_LINK_LANGUAGE = "primary.portal.shoppingExperience.dualPlanYear.revertPlanUpdatesLink";
const CONTRIBUTION_YEAR_SIZE = 4;
const COVERAGE_START_DATE = "coverage_start_date";
const DAYS = "days";
const NEXT_FIFTEENTH_OF_MONTH_DATE = 15;
const TWO = 2;

@Component({
    selector: "empowered-product-details",
    templateUrl: "./product-details.component.html",
    styleUrls: ["./product-details.component.scss"],
})
export class ProductDetailsComponent implements OnInit, OnChanges, AfterViewChecked, OnDestroy {
    isMedical: boolean;
    isTpi = false;
    isSsoToPlan = false;
    isSsoToProduct = false;
    isSsoToShop = false;
    inValidDate = false;
    isMinDate = false;
    isMaxDate = false;
    showAdditionalChild = false;
    riskClassId: number;
    isDualPlan = false;
    coverageStartDate: Date | string;
    method = EnrollmentMethod.SELF_SERVICE;
    isAGPlans: boolean;
    minCoverageDate: string;
    minDate: string;
    thirdPartyPlatformsId: number;
    planOffer = [];
    shortTermDisablilityCheck = false; 
    /**
     * Setter function that triggers when there is a change in the selected product
     * @param prod initial/new value being set
     */
    // eslint-disable-next-line @angular-eslint/no-input-rename
    @Input("productOffering") set prodOfr(prod: ProductOfferingPanel) {
        combineLatest([this.virginiaFeatureEnabled$, this.allCarriers$])
            .pipe(
                tap(([virginiaEnabled, allCarriers]) => {
                    let newProduct = prod;
                    if (virginiaEnabled) {
                        const aflacCarrierObj = allCarriers.find((carrier) => CarrierId.AFLAC === carrier.id);
                        newProduct = { ...prod, product: { ...prod.product, legalName: aflacCarrierObj?.legalName } };
                    }
                    this.productOfferingChanged$.next(newProduct);
                    this.productOffering = newProduct;
                    this.planOfferingError = "";
                    // moved the code below this point into this section since they reference this.productOffering
                    if (this.productOffering) {
                        this.isJuvenile = !!(
                            this.productOffering.product.id === ProductId.JUVENILE_TERM_LIFE ||
                            this.productOffering.product.id === ProductId.JUVENILE_WHOLE_LIFE
                        );
                        this.minCoverageDate = this.datepipe.transform(this.productOffering.minCoverageDate, DateFormats.MONTH_DAY_YEAR);
                        if (
                            this.minCoverageDate ===
                                this.dateService.format(this.dateService.addDays(new Date(), 1), DateFormats.MONTH_DAY_YEAR) &&
                            this.productOffering.planOfferings.some(
                                (planOffering) => planOffering.coverageStartFunction === coverageStartFunction.DAY_AFTER,
                            )
                        ) {
                            this.minCoverageDate = this.dateService.format(new Date(), DateFormats.YEAR_MONTH_DAY);
                            this.minDate = this.dateService.format(new Date(), DateFormats.MONTH_DAY_YEAR);
                        } else {
                            this.minCoverageDate = this.dateService.format(
                                this.dateService.toDate(this.minCoverageDate),
                                DateFormats.YEAR_MONTH_DAY,
                            );
                            this.minDate = this.dateService.format(
                                this.dateService.toDate(this.minCoverageDate),
                                DateFormats.MONTH_DAY_YEAR,
                            );
                        }
                    }
                    this.getHeaderName(this.productOffering.product.name);
                    if (this.productOffering && this.isAgentAssisted && !this.productOffering.product.valueAddedService) {
                        this.coverageDate = this.productOffering.coverageDate;
                    }
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        this.multipleCarriers = prod.product.carrierName?.includes(",");
        this.riskClassId = this.store.selectSnapshot(EnrollmentState.GetRiskClassId);
        this.isAGPlans = prod.planOfferings?.some((planOffering) => planOffering.plan.carrier.id === CarrierId.AFLAC_GROUP);
        this.setPlanOfferingDetails();
        if (!prod.planOfferings?.length) {
            this.planOfferingError = (
                this.isAgentAssisted
                    ? this.languageStrings["primary.portal.tpi.producer.noPlanOfferings.error"]
                    : this.languageStrings["primary.portal.tpi.member.noPlanOfferings.error"]
            )
                .replace("##productname##", prod.product.name)
                .replace("##state##", this.enrollmentState);
        }
        this.getQualifyingEvent();
    }
    @Input() grandFatherPlan: any;
    @Input() expandCartItemId: number;
    // eslint-disable-next-line @angular-eslint/no-input-rename
    @Input("reinstateIndex") set reinstate(reinstateIndex: number) {
        if (reinstateIndex) {
            this.setPlanOfferingDetails();
        }
    }
    @ViewChild(MatExpansionPanel) expPanel: MatExpansionPanel;
    @Output() productChangedEvent = new EventEmitter<number>();
    @Output() hideFooterEvent = new EventEmitter<boolean>();

    // Language
    primaryLanguages: LanguageModel[];
    secondaryLanguages: LanguageModel[];
    languageStrings = this.language.fetchPrimaryLanguageValues([
        "primary.portal.shoppingExperience.productOfferingActive",
        "primary.portal.shoppingExperience.planYear",
        PLAN_SUMMARY_LANGUAGE,
        "primary.portal.quoteShop.planDisabledView.askHR",
        "primary.portal.quoteShop.planDisabledView.agentRequired",
        "primary.portal.quoteShop.planDisabledView.ineligibleKO",
        "primary.portal.quoteShop.plansDisplay.pricingNotAvailable",
        "primary.portal.quoteShop.productDisabledView.askHR",
        "primary.portal.quoteShop.productDisabledView.agentRequired",
        "primary.portal.quoteShop.productDisabledView.missingInfo",
        "primary.portal.quoteShop.planDisabledView.declinePlan",
        "primary.portal.quoteShop.planDisabledView.crossBorderRestriction",
        "primary.portal.quoteShop.planDisabledView.enrollPlan",
        "primary.portal.quoteShop.productDisabledView.declineProduct",
        "primary.portal.quoteShop.productDisabledView.enrollProduct",
        "primary.portal.coverage.declined",
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
        "primary.portal.shoppingExperience.agentAssistance",
        RESET_ENOLLMENT_LANGUAGE,
        "primary.portal.planDetails.title",
        "primary.portal.shoppingExperience.declineCoverage",
        "primary.portal.shoppingExperience.clickToViewPricing",
        "primary.portal.shoppingExperience.yourSelection",
        "primary.portal.shoppingExperience.comapnyProvidedPara",
        "primary.portal.shoppingExperience.lapsedPlan",
        "primary.portal.coverage.current_coverage",
        "primary.portal.shoppingExperience.lapsedPlanText",
        "primary.portal.quoteShop.individualMedicalDescription1",
        "primary.portal.quoteShop.individualMedicalDescription2",
        "primary.portal.quoteShop.individualMedicalDescription3",
        "primary.portal.quoteShop.individualMedicalDescription4",
        "primary.portal.shoppingExperience.declineMedical",
        "primary.portal.shoppingExperience.benefitDollars",
        "primary.portal.shoppingExperience.employerCouponsOffer",
        "primary.portal.shoppingExperience.learnMore",
        "primary.portal.shoppingExperience.agentDetails",
        "primary.portal.shoppingExperience.buyUp",
        "primary.portal.shoppingExperience.buyUpPara",
        "primary.portal.shoppingExperience.morePlanOptions",
        "primary.portal.shoppingExperience.yourPlanOptions",
        "primary.portal.coverage.policyEnds",
        "primary.portal.coverage.endCoverageRequested",
        "primary.portal.quoteShop.dependency.enrollInPlanToolTip",
        "primary.portal.quoteShop.dependency.declinePlanToolTip",
        "primary.portal.coverage.mmpEnrollmentDependencyMsg",
        "primary.portal.shoppingExperience.selectplan",
        "primary.portal.tpi.coverageStartsOn",
        "primary.portal.tpiEnrollment.helpEnrollment",
        "primary.portal.tpiEnrollment.at",
        "primary.portal.tpiEnrollment.or",
        "primary.portal.coverage.datePicker",
        "primary.portal.coverage.cannotBePast",
        "primary.portal.coverage.cannotBeFuture",
        "primary.portal.coverage.invalidDate",
        "primary.portal.benefitsOffering.coverageStartDate",
        "primary.portal.qle.addNewQle.accident",
        "primary.portal.qle.addNewQle.shortTermDisability",
        "primary.portal.qle.addNewQle.cancer",
        "primary.portal.qle.addNewQle.vision",
        "primary.portal.qle.addNewQle.dental",
        "primary.portal.qle.addNewQle.criticalIllness",
        "primary.portal.qle.addNewQle.hospital",
        "primary.portal.qle.addNewQle.termLife",
        "primary.portal.qle.addNewQle.wholeLife",
        "primary.portal.qle.addNewQle.juvenileTermLife",
        "primary.portal.qle.addNewQle.juvenileWholeLife",
        "primary.portal.census.manualEntry.child",
        "primary.portal.planDetails.additionalChild",
        "primary.portal.planDetails.planCostInfo",
        "primary.portal.qle.addNewQle.hcfsa",
        "primary.portal.qle.addNewQle.dcfsa",
        "primary.portal.qle.addNewQle.hra",
        REVERT_UPDATES_LANGUAGE,
        REVERT_LINK_LANGUAGE,
        "primary.portal.qle.addNewQle.hsa",
        "primary.portal.qle.addNewQle.transit",
        "primary.portal.qle.addNewQle.parking",
        "primary.portal.common.eligibilityQuestions",
        "primary.portal.quoteShop.plansDisplay.crossBorderRestriction",
        "primary.portal.planDetails.planMissingDetail",
        "primary.portal.planDetails.addWorkDetails",
        "primary.portal.shoppingExperience.optionalLapsedPlanText",
        "primary.portal.callCenter.8x8.form.alert.cannotEnrollDisability",
        "primary.portal.members.planOptions",
        "primary.portal.tpi.producer.noPlanOfferings.error",
        "primary.portal.tpi.member.noPlanOfferings.error",
    ]);

    // Store variables
    mpGroup: number;
    enrollmentMethod: EnrollmentMethod;
    enrollmentState: string;
    payFrequency: PayFrequency;
    payrollPerYear: number;
    memberId: number;
    productOfferings: ProductOfferingPanel[];
    enrollments: Enrollments[];
    producerDetails: any;
    currentQle: MemberQualifyingEvent;
    allPlanOfferings: PlanOfferingPanel[];

    // Shop experience
    cartItems: GetCartItems[];
    productOffering: ProductOfferingPanel;
    planOfferings: PlanOfferingPanel[];
    inCartPlanOfferings: PlanOfferingPanel[];
    enrolledPlanOfferings: PlanOfferingPanel[];
    companyProvidedPlanOfferings: PlanOfferingPanel[];
    supplementaryPlanOfferings: PlanOfferingPanel[];
    totalSelectedPlans: number;
    planInfo = new Map<number, { cost: number; coverage: string; expanded: boolean; memberAgeOnCoverageEffectiveDate?: number }>();
    selectedPlansInfo = {
        in_cart: [],
        enrolled: [],
        company_provided: [],
        adjustment: 0,
    };
    selectedPlanData: Array<{
        name: string;
        title: string;
        description: string;
        link?: string;
        data: PlanOfferingPanel[];
    }>;

    cartItemId: number;
    selectedPlanOffering: PlanOfferingPanel;
    expandItemIndex: number;
    isPlanExpanded: boolean;

    // Knockout Questions
    allEligibilityQuestions: KnockoutQuestion[];
    knockout: any[];
    responses: ApplicationResponse[];

    // HSA, FSA
    isHsa: boolean;
    isFsa: boolean;
    enableHsa: boolean;
    isMedicalProduct: boolean;
    medicalCoverage: CoverageLevel;

    // Lapsed Plan
    isLapsedRequiredReinstate: boolean;
    lapsedDate: string;
    productName: string;
    removeDialogRef: MatDialogRef<ReplacementPlanModalComponent>;
    showSpinner: boolean;
    displayPlans: boolean;
    isProductDeclinable: boolean;
    action: "add" | "update" | "decline" | "reset_active";
    displayPlanMessage = "";
    DECLINE = "decline";
    ENROLLS = "enrolls";
    eligibilityCheck: any;
    ELIGIBILITYTEXT = "eligibilityCheck";
    UPDATEDONE = "updateDone";
    DECLINE_ID = 2;
    showDisableCoverageMsg: boolean;
    knockOutData: any;
    knockOutList: any[];
    agentFirstName: string;
    agentLastName: string;
    agentEmail: string;
    isLoading: boolean;
    accPayFrequencyId: number;
    payFrequencyObject: PayFrequencyObject;
    planStatus = {
        enrolled: "enrolled",
        company_provided: "company_provided",
        in_cart: "in_cart",
    };
    MISSING_INFO_TOOLTIP = "missingInformationToolTip";
    AGENT_REQUIRED_TOOLTIP = "agentAssistanceRequiredToolTip";
    ENROLL_REQ_TOOLTIP = "enrollmentRequirementsToolTip";
    currentQualifyingEvents: MemberQualifyingEvent[];
    subscriptions: Subscription[] = [];
    errorMessage = "";
    ERROR = "error";
    DETAILS = "details";
    DECLINED_ID = 2;
    NOT_FOUND_INDEX = -1;
    qleStatus = "";
    QLE_STATUS_COVERAGE_CANCELLED = QLEEndPlanRequestStatus.COVERAGE_CANCELLED;
    QLE_STATUS_REQUEST_SUBMITTED = QLEEndPlanRequestStatus.COVERAGE_CANCELLATION_REQUEST_SUBMITTED;
    QLE_STATUS_PENDING_HR_APPROVAL = QLEEndPlanRequestStatus.PENDING_HR_APPROVAL;
    ACTIVE = CarrierStatus.ACTIVE;
    APPROVED_STATUS = ApplicationStatusTypes.Approved;
    isWarnings: boolean[] = [];
    isVoid: boolean[] = [];
    qualifyingEventStatuses: string[] = [];
    policyEndDates: string[] = [];
    showProductDropdown = false;
    agentNumber = BLANK;
    agentDetails = BLANK;
    dateFormat = AppSettings.DATE_FORMAT_MM_DD_YYYY;
    COLOR_DEFAULT = "#c6c6c6";
    isAgentAssisted = false;
    tpiProducerId: number;
    coverageDate: string;
    tpiLnlMode = false;
    isBenefitDollarConfigEnabled = false;
    headerName: string;
    carrierStatusesCheckForQLE: string[] = [];
    NOT_ALLOWED_CARRIER_STATUS = "user.enrollment.policy.override_qle_pending_statuses";
    CARRIER_STATUS_INDEX = 0;
    isSelfEnrollment = false;
    producerId: number;
    isWageWorksCompanyProvided = false;
    expansionPanelArray: boolean[] = [];
    flexDollars: MemberFlexDollar[] = [];
    readonly NEW_YORK_ABBR = "NY";
    readonly OHIO_ABBR = "OH";
    apiErrorMessage = "";
    productIcon = "";
    enrollmentCity = "";
    @Select(EnrollmentState.GetMPGroup) mpGroup$: Observable<number>;
    @Select(EnrollmentState.GetMemberId) memberId$: Observable<number>;
    @Select(EnrollmentState.GetPayFrequency) payFrequency$: Observable<PayFrequency>;
    @Select(EnrollmentState.GetEnrollmentMethod) enrollmentMethod$: Observable<EnrollmentMethod>;
    @Select(EnrollmentState.GetEnrollmentState) enrollmentState$: Observable<string>;
    @Select(EnrollmentMethodState.GetEnrollmentCity) enrollmentCity$: Observable<string>;
    @Select(EnrollmentState.GetProductOfferings) productOfferings$: Observable<ProductOfferingPanel[]>;
    @Select(EnrollmentState.GetEnrollments) enrollments$: Observable<Enrollments[]>;
    @Select(EnrollmentState.GetKnockOutData) knockOutList$: Observable<any[]>;
    @Select(EnrollmentState.GetCurrentQLE) currentQLE$: Observable<MemberQualifyingEvent>;
    @Select(EnrollmentState.GetAllPlanOfferings) allPlanOfferings$: Observable<PlanOfferingPanel[]>;
    @Select(LanguageState.getApiErrorLanguage) errorMessage$: Observable<ApiError>;
    @Select(MemberWizardState.GetAllCarriers) allMemberWizardCarriers$: Observable<Carrier[]>;
    @Select(TPIState.GetAllCarriers) allTPICarriers$: Observable<Carrier[]>;
    isJuvenile = false;
    juvenilePlanOfferingId = 0;
    statusEnded = EnrollmentStatus.ended;
    policiesExpired: boolean[] = [];
    displayCrossBorderDisclaimer: boolean;
    planYearId = undefined;
    hasMissingInfo = false;
    isVASPlanEligibleForWorkState: boolean;
    policyFeeRiderIds: string[] = [];
    isOpenEnrollment: PlanYearModel[] = [];
    callCenterDisabilityEnrollmentRestricted: boolean;
    productOfferingChanged$: Subject<ProductOfferingPanel> = new Subject<ProductOfferingPanel>();
    multipleCarriers: boolean;
    private readonly unsubscribe$ = new Subject<void>();
    allCarriers$: Observable<Carrier[]>;
    virginiaFeatureEnabledConfig$: Observable<boolean>;
    virginiaFeatureEnabled$: Observable<boolean>;
    disableCoverageDate: boolean;
    readonly PAY_FREQUENCY_SHORT_LENGTH = 20;
    memberProfile: MemberProfile;

    planOfferingError = "";
    // Shows disability enrollment info message based on selected enrollment method.
    disabilityEnrollmentRestrictionInfo$: Observable<{
        callCenterDisabilityEnrollmentRestricted?: boolean;
        callCenterDisabilitySupportEmail?: string;
    }> = combineLatest([
        this.staticUtilService.cacheConfigValue(ConfigName.CALL_CENTER_8X8_TRANSMITTAL_DISABILITY_SUPPORT_EMAIL),
        this.store.select(TPIState.getDisabilityEnrollmentRestriction),
        this.productOfferingChanged$.asObservable(),
    ]).pipe(
        map(
            ([callCenterDisabilitySupportEmail, callCenterDisabilityEnrollmentRestricted, productOffering]) =>
                (callCenterDisabilityEnrollmentRestricted &&
                    productOffering.product.id === ProductId.SHORT_TERM_DISABILITY && {
                    callCenterDisabilitySupportEmail,
                    callCenterDisabilityEnrollmentRestricted,
                }) ||
                null,
        ),
        tap(
            (disabilityEnrollmentRestrictionInfo) =>
                (this.callCenterDisabilityEnrollmentRestricted =
                    disabilityEnrollmentRestrictionInfo?.callCenterDisabilityEnrollmentRestricted),
        ),
    );
    coverageStartDate$: Observable<string>;
    coverageDateBoldConfigEnabled$: Observable<boolean>;

    constructor(
        private readonly shoppingService: ShoppingService,
        private readonly coreService: CoreService,
        private readonly cd: ChangeDetectorRef,
        private readonly store: Store,
        private readonly dialog: MatDialog,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly shoppingCartService: ShoppingCartDisplayService,
        private readonly accountService: AccountService,
        private readonly language: LanguageService,
        private readonly datepipe: DatePipe,
        private readonly shopCartService: ShopCartService,
        private readonly util: UtilService,
        private readonly memberService: MemberService,
        private readonly router: Router,
        private readonly tpiService: TpiServices,
        private readonly staticUtilService: StaticUtilService,
        private readonly staticService: StaticService,
        private readonly sharedService: SharedService,
        private readonly userService: UserService,
        private readonly empoweredService: EmpoweredModalService,
        private readonly dualPlanYearService: DualPlanYearService,
        private readonly shoppingCartDisplayService: ShoppingCartDisplayService,
        private readonly applicationStatusService: ApplicationStatusService,
        private readonly dateService: DateService,
    ) {
        if (this.router.url.indexOf(TPI) >= 0) {
            this.isTpi = true;
            const tpiSsoDetail: TpiSSOModel = this.store.selectSnapshot(TPIState.tpiSsoDetail);
            this.tpiLnlMode = this.tpiService.isLinkAndLaunchMode();
            if (tpiSsoDetail.planId) {
                this.isSsoToPlan = true;
            } else if (tpiSsoDetail.productId) {
                this.isSsoToProduct = true;
            } else {
                this.isSsoToShop = true;
            }
            this.tpiProducerId = tpiSsoDetail.user.producerId || this.store.selectSnapshot(TPIState.getTPIProducerId);
            if (this.tpiProducerId) {
                this.isAgentAssisted = true;
                this.method = this.store.selectSnapshot(EnrollmentState.GetEnrollmentMethod);
            }
        }
        this.payFrequencyObject = {
            payFrequencies: [],
            pfType: "",
            payrollsPerYear: 0,
        };
        this.primaryLanguages = this.store.selectSnapshot(LanguageState.languageList);
        this.secondaryLanguages = this.store.selectSnapshot(LanguageState.secondaryLanguageList);
        this.subscriptions.push(this.mpGroup$.subscribe((x) => (this.mpGroup = x)));
        this.subscriptions.push(this.memberId$.subscribe((x) => (this.memberId = x)));
        this.getCoverageStartDate();
        this.subscriptions.push(
            this.payFrequency$.subscribe((x) => {
                this.payFrequency = x;
                this.payrollPerYear = x ? x.payrollsPerYear : 1;
            }),
        );
        this.subscriptions.push(this.enrollmentMethod$.subscribe((x) => (this.enrollmentMethod = x)));
        this.subscriptions.push(this.enrollmentState$.subscribe((x) => (this.enrollmentState = x)));
        this.subscriptions.push(this.enrollmentCity$.subscribe((city) => (this.enrollmentCity = city)));
        this.subscriptions.push(this.productOfferings$.subscribe((x) => (this.productOfferings = x)));
        this.subscriptions.push(this.enrollments$.subscribe((x) => (this.enrollments = x)));
        this.subscriptions.push(this.knockOutList$.subscribe((x) => (this.knockOutList = x)));
        this.subscriptions.push(
            this.shopCartService.reviewKnockoutQuestion.subscribe((data) => {
                this.knockOutData = data;
                if (this.knockOutData) {
                    this.reviewKnockoutResponse();
                }
            }),
        );
        this.subscriptions.push(this.currentQLE$.subscribe((x) => (this.currentQle = x)));
        this.subscriptions.push(
            this.allPlanOfferings$.subscribe((allPlanOfferings) => {
                this.allPlanOfferings = allPlanOfferings;
            }),
        );
        this.subscriptions.push(
            this.shoppingService.isVASPlanEligible$.subscribe(
                (isVASPlanEligible) => (this.isVASPlanEligibleForWorkState = isVASPlanEligible),
            ),
        );

        this.planYearId = this.store.selectSnapshot(DualPlanYearState.getCurrentPYId);
        this.isLoading = false;
        this.getPayFrequencyData();
        this.isPlanExpanded = true;

        // Gets all carriers from either the member or TPI flow
        this.allCarriers$ = combineLatest([this.allMemberWizardCarriers$, this.allTPICarriers$]).pipe(
            map(([wizardCarriers, tpiCarriers]) => wizardCarriers ?? tpiCarriers),
            takeUntil(this.unsubscribe$),
        );
        // Virginia Connection configuration enabled/disabled
        this.virginiaFeatureEnabledConfig$ = this.staticUtilService.cacheConfigEnabled(ConfigName.FEATURE_ENABLE_VIRGINIA_OBJECTION);
        // Virginia Connection config
        this.virginiaFeatureEnabled$ = this.virginiaFeatureEnabledConfig$.pipe(
            map(
                (virginiaConfig) =>
                    // if virginia objection config is off, then disable feature
                    !!virginiaConfig,
            ),
        );
    }

    /**
     * Angular life-cycle hook ngOnInit.
     * Called on component initialization.
     * Sets required configurations.
     * Fetch configs to determine flow type and all apis required for displaying in Product details page
     */
    ngOnInit(): void {
        this.errorMessage = "";
        this.getConfigurationSpecifications();
        this.getOpenEnrollmentPlanYears();
        this.subscriptions.push(
            this.userService.credential$.subscribe((credential: ProducerCredential) => {
                if (credential.producerId) {
                    this.producerId = credential.producerId;
                }
            }),
        );
        this.subscriptions.push(
            this.sharedService
                .checkAgentSelfEnrolled()
                .pipe(
                    tap((response) => {
                        this.isSelfEnrollment = response;
                    }),
                )
                .subscribe(),
        );
        this.subscriptions.push(
            this.staticUtilService
                .cacheConfigEnabled("general.feature.enable.benefitDollars")
                .pipe(
                    tap((benefitDollarEnabled) => (this.isBenefitDollarConfigEnabled = benefitDollarEnabled)),
                    filter((benefitDollarEnabled) => benefitDollarEnabled),
                    switchMap((benefitDollarEnabled) => this.getMemberFlexDollars()),
                )
                .subscribe(),
            this.staticUtilService
                .cacheConfigValue(ConfigName.ENROLLMENT_MANDATORY_RIDER_ID)
                .pipe(tap((policyFeeRiderIds) => (this.policyFeeRiderIds = policyFeeRiderIds ? policyFeeRiderIds.split(",") : [])))
                .subscribe(),
        );
        this.staticService
            .getConfigurations(ConfigName.TPP_RESTRICT_COVERAGE_START_DATE, this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => (this.disableCoverageDate = response[0].value === "TRUE"));
        this.productOfferingChanged$.next(this.productOffering);
        this.getMemberFlexDollars();
        this.coverageDateBoldConfigEnabled$ = this.staticUtilService.cacheConfigEnabled(ConfigName.COVERAGE_DATE_BOLD_VISIBILITY_ENABLED);
        this.coverageStartDate$ = this.getDefaultCoverageStartDate();
    }
    /**
     * Method to get the deefault coverage start date
     * @return observable of string that contains the default coverage start date
     */
    getDefaultCoverageStartDate(): Observable<string> {
        return this.shoppingService
            .getPlanCoverageDatesMap(this.memberId, this.mpGroup)
            .pipe(map((plans) => plans[this.planOfferings[0].id].defaultCoverageStartDate));
    }
    /**
     * Method to get member flex dollars
     * @return observable of member flex dollars
     */
    getMemberFlexDollars(): Observable<MemberFlexDollar[]> {
        return this.accountService.getFlexDollarsOfMember(this.memberId, String(this.mpGroup)).pipe(
            tap((response) => {
                this.flexDollars = response.map((flexDollar) => ({ ...flexDollar, isApproved: true }));
            }),
        );
    }
    /**
     * This method gets list of carrier statuses when QLE status should not be pulled
     * @returns void
     */
    getConfigurationSpecifications(): void {
        this.subscriptions.push(
            this.staticService
                .getConfigurations(this.NOT_ALLOWED_CARRIER_STATUS, this.mpGroup)
                .subscribe((data) => (this.carrierStatusesCheckForQLE = data[this.CARRIER_STATUS_INDEX].value.split(","))),
        );
    }

    /**
     * Angular life-cycle hook ngOnChanges
     * Checks if the expanded cart on change has the same selected item as before
     * @param changes: the change in cart Item
     */
    ngOnChanges(changes: SimpleChanges): void {
        if (this.grandFatherPlan) {
            this.totalSelectedPlans++;
        }
        if (
            changes.expandCartItemId &&
            changes.expandCartItemId.currentValue != null &&
            changes.expandCartItemId.currentValue !== changes.expandCartItemId.previousValue &&
            !changes.expandCartItemId.firstChange &&
            this.inCartPlanOfferings &&
            this.inCartPlanOfferings.length
        ) {
            this.expandItemIndex = this.inCartPlanOfferings.findIndex(
                (plan) => plan.cartItem && plan.cartItem.id === changes.expandCartItemId.currentValue,
            );
        }
    }
    /**
     * @description angular life-cycle method for after view checked
     */
    ngAfterViewChecked(): void {
        this.cd.detectChanges();
        this.setExpansionPanelArray();
    }
    getPayFrequencyData(): void {
        this.isLoading = true;
        this.subscriptions.push(
            this.memberService.getMember(this.memberId, true, this.mpGroup?.toString()).subscribe(
                (member) => {
                    this.memberProfile = member.body;
                    this.accPayFrequencyId = member.body.workInformation.payrollFrequencyId;
                    this.accountService.getPayFrequencies(this.mpGroup.toString()).subscribe(
                        (res) => {
                            this.payFrequencyObject.payFrequencies = [...res];
                            this.payFrequency = res.find((frequency) => frequency.id.toString() === this.accPayFrequencyId.toString());
                            this.payFrequencyObject.pfType = this.payFrequency.name;
                            const monthlypayFrequency = res.find((ele) => ele.frequencyType === "MONTHLY");
                            this.payFrequencyObject.payrollsPerYear = monthlypayFrequency.payrollsPerYear;
                            this.isLoading = false;
                        },
                        () => {
                            this.isLoading = false;
                        },
                    );
                },
                (error) => {
                    this.store.dispatch(new SetErrorForShop(error.error));
                    this.showErrorAlertMessage(error);
                },
            ),
        );
    }
    /**
     * method to display Cancel Icon by checking Enrollment status
     * @returns void
     */
    setIsCancelIcons(): void {
        this.enrolledPlanOfferings.forEach((Offering, index) => {
            this.isVoid[index] = false;
            if (Offering.enrollment) {
                this.isVoid[index] =
                    Offering.enrollmentStatus === EnrollmentStatus.declined ||
                    Offering.enrollmentStatus === EnrollmentStatus.application_denied ||
                    Offering.enrollmentStatus === EnrollmentStatus.void ||
                    Offering.enrollmentStatus === EnrollmentStatus.ended;
            }
        });
    }
    /**
     * method to get Qualifying Events
     * @returns void
     */
    getQualifyingEvent(): void {
        this.subscriptions.push(
            this.memberService.getMemberQualifyingEvents(this.memberId, this.mpGroup).subscribe(
                (resp) => {
                    this.currentQualifyingEvents = resp;
                    this.setQLEStatuses();
                },
                (error) => {
                    this.store.dispatch(new SetErrorForShop(error.error));
                    this.showErrorAlertMessage(error);
                    this.showSpinner = false;
                },
            ),
        );
    }
    /**
     * method to set QLE Statuses of PlanOfferings wrt coverage cancellation
     * @return void
     */
    setQLEStatuses(): void {
        if (this.enrolledPlanOfferings?.length) {
            this.enrolledPlanOfferings.forEach((coverage, index) => {
                if (coverage.enrollment) {
                    const isQLEStatus = !this.carrierStatusesCheckForQLE.includes(coverage.enrollment.carrierStatus);
                    const qleEvent = this.currentQualifyingEvents.find(
                        (event) =>
                            event.id === coverage.enrollment.qualifyingEventId &&
                            isQLEStatus &&
                            (coverage.enrollment.status === EnrollmentStatus.approved.toUpperCase() ||
                                coverage.enrollment.status.toUpperCase() === this.ACTIVE),
                    );
                    this.qualifyingEventStatuses[index] = qleEvent ? qleEvent.endPlanRequestStatus : "";
                    this.policyEndDates[index] = qleEvent ? qleEvent.requestedCoverageEndDate : "";
                    const endPlanRequestStatus = (qleEvent || ({} as MemberQualifyingEvent)).endPlanRequestStatus;
                    this.policiesExpired[index] = this.util.checkPolicyExpired(qleEvent, endPlanRequestStatus);
                } else {
                    this.qualifyingEventStatuses[index] = "";
                    this.policyEndDates[index] = "";
                }
                this.isWarnings[index] =
                    this.qualifyingEventStatuses[index] === this.QLE_STATUS_REQUEST_SUBMITTED ||
                    this.qualifyingEventStatuses[index] === this.QLE_STATUS_PENDING_HR_APPROVAL;
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

    /**
     * Function to set planOffering Details to display the plan details
     * @param isCoverageChanges {boolean} default value set to false
     * @param isDependentAgeChanged {boolean} default value set to false
     */
    setPlanOfferingDetails(isCoverageChanges: boolean = false, isDependentAgeChanged: boolean = false): void {
        if (this.productOffering) {
            this.resetData();
            this.showSpinner = true;
            this.planOfferings = this.util.copy(this.productOffering.planOfferings);
            this.setFooterVisibility(true);
            this.productName = this.productOffering.product.name;
            this.productIcon = this.productOffering.product.iconSelectedLocation;
            this.subscriptions.push(
                this.getCartItems().subscribe(
                    // eslint-disable-next-line complexity
                    (response) => {
                        this.showSpinner = false;
                        this.setFooterVisibility(false);
                        this.cartItems = response;
                        this.isHsa = this.productOffering.productType === ProductType.HSA;
                        this.isFsa = this.productOffering.productType === ProductType.FSA;
                        this.isMedical = this.productOffering.productType === ProductType.MEDICAL;
                        this.isProductDeclinable = !(
                            this.productOffering.companyProvided ||
                            this.productOffering.enrollStatus != null ||
                            this.isHsa ||
                            this.isFsa
                        );
                        if (!this.isProductDeclinable && this.productOffering.enrollStatus === this.statusEnded) {
                            this.isProductDeclinable = true;
                        }
                        if (
                            this.productOffering.product.id === ProductId.SHORT_TERM_DISABILITY &&
                            this.productOffering.planOfferings.some((plan) => plan.missingInformation === MissingInfoType.SALARY)
                        ) {
                            this.planOfferings.map((planOffering) => {
                                planOffering.missingInformation = MissingInfoType.SALARY;
                                return planOffering;
                            });
                        }
                        this.isWageWorksCompanyProvidedPlan();
                        this.findSelectedPlans();
                        if ((this.isHsa || this.isFsa) && !this.isWageWorksCompanyProvided) {
                            this.initializePlanInfo();
                            this.enableHsa = this.isHsa ? this.checkIfMedicalPlanExists() : true;
                            if (this.planOfferings[0].minHSA == null && this.planOfferings[0].maxHSA == null) {
                                this.getProductContributionLimits();
                            } else {
                                this.planOfferings.forEach((plan) => this.setHsaFsaPlanInfo(plan));
                                this.setSelectedPlans();
                                this.createSelectedPlanArray();
                                this.displayPlans = true;
                            }
                        } else if (this.productOffering.planOfferings && this.productOffering.planOfferings.length) {
                            if (this.planOfferings.some((x) => !x.planPricing) || isCoverageChanges || isDependentAgeChanged) {
                                this.subscriptions.push(
                                    this.getPlanPricings().subscribe((planPricing) => {
                                        const juvenilePlanOffering = this.planOfferings.find(
                                            (plan) => plan.id === this.juvenilePlanOfferingId,
                                        );
                                        if (juvenilePlanOffering) {
                                            juvenilePlanOffering.planPricing = planPricing.planOfferingPricing;
                                            juvenilePlanOffering.selectedPricing = planPricing.planOfferingPricing[0];
                                        }
                                    }),
                                );
                            } else {
                                this.initializePlanInfo();
                                this.sortPlans();
                                this.setSelectedPlans();
                                this.filterSupplementaryPlanOfferings();
                                this.createSelectedPlanArray();
                                this.displayPlans = true;
                            }
                        }
                        this.setToolTips();
                        this.setDisplayMessage();
                    },
                    (error) => {
                        this.showSpinner = false;
                        this.setFooterVisibility(false);
                        this.store.dispatch(new SetErrorForShop(error.error));
                        this.showErrorAlertMessage(error);
                    },
                ),
            );
        }
        this.getAgentDetails();
    }
    /**
     * Set product disabled display message if all plans are disabled. Plans are disabled for any of the following reasons:
     * 1. Agent assistance required
     * 2. Missing information
     * 3. Enrollment requirements
     * @returns void
     */
    setDisplayMessage(): void {
        this.displayPlanMessage = "";
        if (
            (this.productOffering.agentAssistanceRequired ||
                this.planOfferings.every(
                    (planOfr) => planOfr.agentAssistanceRequired || Boolean(planOfr.missingInformation) || Boolean(planOfr[REQ_PLAN_TYPE]),
                )) &&
            this.testPlanOfferings()
        ) {
            if (
                (this.productOffering.agentAssistanceRequired || this.planOfferings.some((x) => x.agentAssistanceRequired)) &&
                !this.isSelfEnrollment
            ) {
                this.displayPlanMessage = this.languageStrings["primary.portal.quoteShop.productDisabledView.agentRequired"];
            } else if (this.planOfferings.some((x) => Boolean(x.missingInformation)) && !this.isSelfEnrollment) {
                const infoType = this.planOfferings.find((plan) => plan.missingInformation != null).missingInformation.toLowerCase();
                this.displayPlanMessage = this.languageStrings["primary.portal.quoteShop.productDisabledView.missingInfo"]
                    .replace("##Product##", this.productName)
                    .replace("##Type##", infoType);
            } else {
                const disabledPlanOfr = this.planOfferings.find((planOfr) => planOfr[REQ_PLAN_TYPE] != null);
                let toEnrollOrDecline;
                if (disabledPlanOfr && disabledPlanOfr[REQ_PLAN_TYPE] === REQ_ENROLL_PLAN) {
                    toEnrollOrDecline = this.languageStrings["primary.portal.quoteShop.dependency.enrollInPlanToolTip"];
                } else if (disabledPlanOfr && disabledPlanOfr[REQ_PLAN_TYPE] === REQ_NONENROLL_PLAN) {
                    toEnrollOrDecline = this.languageStrings["primary.portal.quoteShop.dependency.declinePlanToolTip"];
                }
                this.displayPlanMessage = toEnrollOrDecline
                    ? `${this.languageStrings["primary.portal.coverage.mmpEnrollmentDependencyMsg"]}
                        ${toEnrollOrDecline}
                        ${disabledPlanOfr[REQ_PLAN_NAME]}`
                    : null;
            }
        }
    }
    /**
     * @description to check if it's a wageworks company provided plan (HRA)
     */
    isWageWorksCompanyProvidedPlan(): void {
        this.planOfferings.forEach((planOffr) => {
            if (planOffr.plan.characteristics && planOffr.plan.characteristics.indexOf(Characteristics.AUTOENROLLABLE) !== -1) {
                this.isWageWorksCompanyProvided = true;
            }
        });
    }
    /**
     * @description Sets the expansion panel's disabled attribute value
     */
    setExpansionPanelArray(): void {
        if (this.planOfferings && this.planOfferings.length > 0 && this.expPanel && this.expansionPanelArray.length === 0) {
            this.planOfferings.forEach((planOffr) => {
                this.expansionPanelArray.push(this.disabledExpansionPanel(planOffr, this.expPanel));
            });
        }
    }
    /**
     * @description To check if the expansion panel should disabled
     * @param planOffering {planOfferingPanel} the current plan offering
     * @param expPanel {MatExpansionPanel} the expansion panel reference
     * @returns {boolean} to disable or enable expansion panel
     */
    disabledExpansionPanel(planOffering: PlanOfferingPanel, expPanel: MatExpansionPanel): boolean {
        if (planOffering.plan.carrier.id === CarrierId.WAGEWORKS) {
            return false;
        }
        return this.disablePlanSelection(planOffering, expPanel) || !(planOffering.planPricing && planOffering.planPricing.length);
    }

    /**
     * Set tooltip message for disabled plans. Plans are disabled for any of the following reasons:
     * 1. Agent assistance required
     * 2. Missing information
     * 3. Enrollment requirements
     * 4. Plan pricing is empty
     * 5. Plans is cross border restricted
     * @returns void
     */
    setToolTips(): void {
        this.displayCrossBorderDisclaimer = this.planOfferings.some((plan) => plan.crossBorderRestrict);
        this.planOfferings.forEach((plan) => {
            delete plan.tooltipMessage;
            delete plan.disable;
            if (plan.agentAssistanceRequired && !this.isSelfEnrollment && !this.isAgentAssisted) {
                plan.tooltipMessage = this.languageStrings["primary.portal.quoteShop.planDisabledView.agentRequired"];
                plan.disable = { status: true, planDisable: true, type: DisableType.AGENT_ASSISTANCE };
            } else if (plan.missingInformation && !this.isSelfEnrollment) {
                const infoType = plan.missingInformation.toLowerCase();
                plan.tooltipMessage = this.languageStrings["primary.portal.quoteShop.productDisabledView.missingInfo"]
                    .replace("##Product##", this.productName)
                    .replace("##Type##", infoType);
                plan.disable = {
                    status: true,
                    planDisable: true,
                    type: DisableType.MISSING_INFO,
                    message: plan.missingInformation,
                };
            } else if (
                !this.checkPlanEnrollmentRequirements(plan) &&
                plan.planPricing &&
                !plan.planPricing.length &&
                plan.plan.carrier.id !== CarrierId.WAGEWORKS
            ) {
                plan.tooltipMessage = this.languageStrings["primary.portal.quoteShop.plansDisplay.pricingNotAvailable"].replace(
                    "##state##",
                    this.enrollmentState,
                );
                plan.disable = {
                    status: true,
                    planDisable: true,
                    type: DisableType.GENERIC,
                };
            } else if (plan.crossBorderRestrict) {
                plan.tooltipMessage = this.languageStrings["primary.portal.quoteShop.planDisabledView.crossBorderRestriction"];
                plan.disable = {
                    status: true,
                    planDisable: true,
                    type: DisableType.GENERIC,
                };
            }
        });
    }

    /**
     * Search plan for enrollment requirements of type:
     * 1. Requires enrollment in another plan
     * 2. Requires non-enrollment in another plan
     * If plan is not disabled, remove previously added disabling details.
     * @param planOffering : PlanOffering which is being tested for enrollment requirement
     * @returns boolean : boolean value to suggest disabling the plan if enrollment requirement conditions are satisfied.
     */
    checkPlanEnrollmentRequirements(planOffering: PlanOfferingPanel): boolean {
        let disablePlan = false;
        const enrollRequirements = planOffering.enrollmentRequirements.filter(
            (req) => req.dependencyType === REQ_ENROLL_PLAN || req.dependencyType === REQ_NONENROLL_PLAN,
        );
        if (enrollRequirements.length) {
            disablePlan = enrollRequirements.some((requirement) => this.findEnrollmentRequirement(requirement, planOffering));
        }
        if (!disablePlan) {
            delete planOffering[REQ_PLAN_NAME];
            delete planOffering[REQ_PLAN_TYPE];
        }
        return disablePlan;
    }

    /**
     * Search either base plan or rider plan based on the requirement plan type
     * @param requirement : Enrollment requirement object from the plan
     * @param planOffering : PlanOffering which is being tested for enrollment requirement
     * @returns boolean: boolean value to suggest disabling the plan if enrollment requirement conditions are satisfied.
     */
    findEnrollmentRequirement(requirement: EnrollmentRequirement, planOffering: PlanOfferingPanel): boolean {
        return requirement.relatedPlanType === BASE
            ? this.isBasePlanInCart(requirement, planOffering)
            : this.isRiderPlanInCart(requirement, planOffering);
    }

    /**
     * Search the base plans in the cart to check if the required planId for enrollment is in cart.
     * @param requirement : Enrollment requirement object from the plan
     * @param planOffering : PlanOffering which is being tested for enrollment requirement
     * @returns boolean : boolean value to suggest disabling the plan if enrollment requirement conditions are satisfied.
     */
    isBasePlanInCart(requirement: EnrollmentRequirement, planOffering: PlanOfferingPanel): boolean {
        const basePlanOffering = this.allPlanOfferings.find((planOfr) => planOfr.plan.id === requirement.relatedPlanId);
        if (basePlanOffering) {
            const cartItem = this.cartItems.find((item) => item.planOfferingId === basePlanOffering.id);
            const enrollment = this.enrollments.find((enrolledPlan) => enrolledPlan.planOfferingId === basePlanOffering.id);
            if (
                ((cartItem || enrollment) && requirement.dependencyType === REQ_NONENROLL_PLAN) ||
                (!(cartItem || enrollment) && requirement.dependencyType === REQ_ENROLL_PLAN)
            ) {
                this.setEnrollmentRequirementTootTip(planOffering, requirement.dependencyType, basePlanOffering.plan.name);
                return true;
            }
        }
        return false;
    }

    /**
     * Search the riders in the cart items to check if the required planId for enrollment is in cart.
     * If rider is found, api call to get plan name is made which is used to display in the tooltip.
     * @param requirement : Enrollment requirement object from the plan
     * @param planOffering : PlanOffering which is being tested for enrollment requirement
     * @returns boolean : boolean value to suggest disabling the plan if enrollment requirement conditions are satisfied.
     */
    isRiderPlanInCart(requirement: EnrollmentRequirement, planOffering: PlanOfferingPanel): boolean {
        const planFound =
            this.cartItems.some((item) =>
                item.riders.some(
                    (riderItem) =>
                        riderItem.planId === requirement.relatedPlanId &&
                        Boolean(requirement.coverageLevels.find((coverage) => riderItem.coverageLevelId === coverage.id)),
                ),
            ) ||
            this.enrollments.some((enrollment) =>
                enrollment.riders.some(
                    (rider) =>
                        rider.planId === requirement.relatedPlanId &&
                        Boolean(requirement.coverageLevels.find((coverage) => rider.coverageLevelId === coverage.id)),
                ),
            );
        if (
            (planFound && requirement.dependencyType === REQ_NONENROLL_PLAN) ||
            (!planFound && requirement.dependencyType === REQ_ENROLL_PLAN)
        ) {
            this.setEnrollmentRequirementTootTip(planOffering, requirement.dependencyType, requirement.relatedPlanName);
            return true;
        }
        return false;
    }

    /**
     * Set the tooltip message of plan based on dependency type
     * @param planOffering : Tooltip message of this plan will be updated
     * @param dependencyType : Tooltip message is based on the type of dependency
     * @param relatedPlanName : Related plan name to be displayed in the tooltip
     * @returns void
     */
    setEnrollmentRequirementTootTip(planOffering: PlanOfferingPanel, dependencyType: DependencyType, relatedPlanName: string): void {
        let tooltip = "";
        switch (dependencyType) {
            case REQ_ENROLL_PLAN:
                tooltip = `${this.languageStrings["primary.portal.coverage.mmpEnrollmentDependencyMsg"]}
                ${this.languageStrings["primary.portal.quoteShop.dependency.enrollInPlanToolTip"]}
                ${relatedPlanName}`;
                break;
            case REQ_NONENROLL_PLAN:
                tooltip = `${this.languageStrings["primary.portal.coverage.mmpEnrollmentDependencyMsg"]}
                ${this.languageStrings["primary.portal.quoteShop.dependency.declinePlanToolTip"]}
                ${relatedPlanName}`;
                break;
        }
        if (tooltip !== "") {
            planOffering.tooltipMessage = tooltip;
            planOffering.disable = {
                status: true,
                planDisable: true,
            };
            planOffering[REQ_PLAN_NAME] = relatedPlanName;
            planOffering[REQ_PLAN_TYPE] = dependencyType;
        }
    }

    testPlanOfferings(): boolean | undefined {
        if (this.supplementaryPlanOfferings.length) {
            return this.supplementaryPlanOfferings.some(
                (supPlanOffering) => !supPlanOffering.inCart && supPlanOffering.planPricing.length > 0,
            );
        }
        if (this.planOfferings.length) {
            return this.planOfferings.some(
                (planOffering) =>
                    (this.productOffering.productType === ProductType.STACKABLE || !planOffering.inCart) && !planOffering.supplementary,
            );
        }
        return undefined;
    }
    /**
     * @description Resets values
     */
    resetData(): void {
        this.planOfferings = [];
        this.selectedPlanData = [];
        this.planInfo.clear();
        this.selectedPlansInfo = {
            enrolled: [],
            company_provided: [],
            in_cart: [],
            adjustment: 0,
        };
        this.totalSelectedPlans = 0;
        this.companyProvidedPlanOfferings = [];
        this.enrolledPlanOfferings = [];
        this.inCartPlanOfferings = [];
        this.supplementaryPlanOfferings = [];
        this.allEligibilityQuestions = [];
        this.displayPlans = false;
        this.medicalCoverage = null;
        this.action = null;
        this.cartItemId = null;
        this.isLapsedRequiredReinstate = false;
        this.errorMessage = "";
        this.isWageWorksCompanyProvided = false;
        this.expansionPanelArray = [];
    }

    /**
     * Setting plan pricing data and selected plans all data
     */
    initializePlanInfo(): void {
        this.planOfferings.forEach((plan) => {
            this.planInfo.set(plan.id, {
                cost: this.getCost(plan),
                expanded: this.isJuvenile && plan.id === this.juvenilePlanOfferingId,
                coverage: plan.selectedCoverage ? plan.selectedCoverage.name : "",
                memberAgeOnCoverageEffectiveDate: this.getAgeOfMemberOnCoverageEffectiveDate(plan),
            });
        });
    }

    /**
     * Get Cost for a member
     * @param plan selected plan details
     * @returns cost of selected plan
     */
    getCost(plan: PlanOfferingPanel): number {
        if (plan.aflacPolicyFeePricing) {
            return plan.plan.carrier.id !== CarrierId.AFLAC_GROUP
                ? plan.aflacPolicyFeePricing.totalCost
                : plan.aflacPolicyFeePricing.memberCost;
        }
        return 0.0;
    }
    updatePlanInfo(data: { cost?: number; coverage?: string; expanded?: boolean }, id: number): void {
        const obj = this.planInfo.get(id);
        if (obj) {
            Object.keys(data).forEach((key) => {
                if (obj[key] != null) {
                    obj[key] = data[key];
                }
            });
            this.planInfo.set(id, obj);
        }
    }

    updateSelectedPlanInfo(data: { cost?: number; coverage?: string }, type: string, index: number): void {
        if (this.selectedPlansInfo[type][index]) {
            if (!isNaN(data.cost)) {
                this.selectedPlansInfo[type][index].cost = data.cost;
            }
            if (data.coverage != null) {
                this.selectedPlansInfo[type][index].coverage = data.coverage;
            }
        }
    }
    /**
     * Function to create an array of company provided and enrolled plans
     * Consists of Company provided plans, enrollments
     */
    createCompanyProvidedAndEnrolledData(): void {
        if (this.companyProvidedPlanOfferings.length && this.isVASPlanEligibleForWorkState) {
            const description = !this.companyProvidedPlanOfferings[0].missingInformation
                ? this.languageStrings["primary.portal.shoppingExperience.comapnyProvidedPara"]
                : "";
            this.selectedPlanData.push({
                name: this.companyProvidedPlanOfferings?.some((companyProvidedPlanOffering) => !!companyProvidedPlanOffering.enrollment)
                    ? this.planStatus.enrolled
                    : this.planStatus.company_provided,
                title: this.languageStrings["primary.portal.shoppingExperience.yourSelection"],
                description: description,
                data: this.companyProvidedPlanOfferings,
            });
        }
        this.getEnrolledPlanOfferings();
    }

    /**
     * Method to get enrolled plan offerings.
     */
    private getEnrolledPlanOfferings(): void {
        if (this.enrolledPlanOfferings.length) {
            const dualPlanState: QleOeShopModel = this.store.selectSnapshot(DualPlanYearState);
            if (dualPlanState.selectedShop === DualPlanYearSettings.QLE_SHOP) {
                this.isDualPlan = true;
            }
            this.setEnrolledData();
            this.setIsCancelIcons();
        }
    }
    /**
     * Function to create an array of enrolled plans
     */
    setEnrolledData(): void {
        const isLapsed = this.enrolledPlanOfferings.some((plan) => plan.enrollmentStatus === EnrollmentStatus.lapsed);
        let lapsedText: string;
        if (isLapsed) {
            const enrollmentObject = this.enrolledPlanOfferings.find(
                (enroll) => enroll.enrollmentStatus === EnrollmentStatus.lapsed,
            ).enrollment;
            if (enrollmentObject.reinstatement === ReinstatementType.MANDATORY) {
                lapsedText = this.languageStrings["primary.portal.shoppingExperience.lapsedPlanText"];
            } else if (enrollmentObject.reinstatement === ReinstatementType.OPTIONAL) {
                lapsedText = this.dateService.isBefore(this.dateService.toDate(enrollmentObject.reinstatementEndDate))
                    ? ""
                    : this.languageStrings["primary.portal.shoppingExperience.optionalLapsedPlanText"];
            }
        }
        const isContinuos = this.checkIfPlanYearContinuos(this.enrolledPlanOfferings);
        this.selectedPlanData.push({
            name: this.planStatus.enrolled,
            title: isLapsed
                ? this.languageStrings["primary.portal.shoppingExperience.lapsedPlan"]
                : isContinuos
                    ? this.languageStrings["primary.portal.coverage.current_coverage"]
                    : this.languageStrings["primary.portal.shoppingExperience.yourSelection"],
            description: isLapsed
                ? lapsedText
                : isContinuos
                    ? this.languageStrings["primary.portal.shoppingExperience.planYear"]
                    : this.languageStrings["primary.portal.shoppingExperience.productOfferingActive"],
            data: this.enrolledPlanOfferings,
        });
    }

    /**
     * Function to create an array of selected plans and enrollments.
     * Consists of Company provided plans, enrollments and plans in cart
     */
    createSelectedPlanArray(): void {
        this.createCompanyProvidedAndEnrolledData();
        if (this.inCartPlanOfferings.length) {
            const replacedAflacEnrollment = this.inCartPlanOfferings.some((planOffering) => this.checkReplaceEnrollment(planOffering));
            const descriptionKey = replacedAflacEnrollment
                ? "primary.portal.shoppingExperience.dualPlanYear.revertPlanUpdatesPara"
                : "primary.portal.shoppingExperience.planSummary";
            const linkKey = replacedAflacEnrollment
                ? "primary.portal.shoppingExperience.dualPlanYear.revertPlanUpdatesLink"
                : "primary.portal.shoppingExperience.resetActiveEnrollment";
            this.selectedPlanData.push({
                name: this.planStatus.in_cart,
                title: this.languageStrings["primary.portal.shoppingExperience.yourSelection"],
                description: this.languageStrings[descriptionKey],
                link: this.languageStrings[linkKey],
                data: this.inCartPlanOfferings,
            });
        }
    }

    /**
     * Create separate arrays and add selected details for in-cart, enrolled and company provided plans.
     */
    setSelectedPlans(): void {
        this.inCartPlanOfferings = this.inCartPlanOfferings.map((planOfr) =>
            this.deepCopyCartPlan(planOfr, planOfr.cartItem.coverageLevelId, planOfr.cartItem.benefitAmount),
        );
        if (this.expandCartItemId != null && this.inCartPlanOfferings.length) {
            this.expandItemIndex = this.inCartPlanOfferings.findIndex(
                (plan) => plan.cartItem && plan.cartItem.id === this.expandCartItemId,
            );
        }
        this.enrolledPlanOfferings = this.enrolledPlanOfferings.map((planOfr) => this.deepCopyEnrollPlan(planOfr));
        this.companyProvidedPlanOfferings = this.companyProvidedPlanOfferings.map((planOfr) => {
            this.selectedPlansInfo[this.planStatus.company_provided].push({
                cost: 0,
                coverage: planOfr.enrollment && planOfr.enrollment.coverageLevel ? planOfr.enrollment.coverageLevel.name : "",
            });
            return planOfr;
        });
    }
    /**
     * @description to make a deep copy of the cart items
     * @param plan {planOfferingPanel} the plan in consideration
     * @param id {number} the id of the plan to get selected pricing
     * @param amount {number} the amount to get selected pricing
     * @return {PlanOfferingPanel} the deep copy of cart plan
     */
    deepCopyCartPlan(plan: PlanOfferingPanel, id: number, amount: number): PlanOfferingPanel {
        const planOffering = this.planOfferings.find((x) => x.id === plan.id);
        const planOfr: PlanOfferingPanel = this.util.copy(planOffering);
        planOfr.cartItem = plan.cartItem;
        // Incase of stackable plans, enrollment is stored at the plan instead of the planOfferings
        planOfr.enrollment =
            planOfr.enrollment ||
            (plan.cartItem.enrollmentId ? this.enrollments.find((enrollment) => enrollment.id === plan.cartItem.enrollmentId) : null);
        planOfr.showSummary = planOfr.showSummary || plan.showSummary;
        if (this.isHsa || this.isFsa) {
            const amt = planOfr.cartItem.totalCost * this.payrollPerYear;
            planOfr.hsaFsaAmount = Math.round(amt * HUNDRED) / HUNDRED;
            planOfr.hsaFsaCoverage = this.isHsa && this.medicalCoverage ? this.medicalCoverage.name : "";
            planOfr.contributionYear = planOfr.cartItem.coverageValidity.effectiveStarting.slice(0, CONTRIBUTION_YEAR_SIZE);
        } else {
            planOfr.selectedPricing = this.util.copy(this.getSelectedPricing(planOfr.planPricing, id, amount));
            planOfr.selectedCoverage = planOfr.coverageLevel ? planOfr.coverageLevel.find((x) => x.id === id) : null;
            if (planOfr.ridersData && planOfr.ridersData.length) {
                this.checkRiderInCart(planOfr, this.cartItems);
                planOfr.ridersData.forEach((riderPlan) => {
                    if (riderPlan.inCart) {
                        this.getRiderPricingAndCoverage(
                            riderPlan,
                            planOfr.cartItem.riders,
                            planOfr.selectedPricing ? planOfr.selectedPricing.benefitAmount : null,
                        );
                    }
                });
            }
        }
        let cost = planOfr.cartItem.memberCost;
        if (planOfr.cartItem.riders.length) {
            cost += planOfr.cartItem.riders.map((x) => x.totalCost).reduce((a, b) => a + b);
        }
        let coverage = "";
        if ((this.isHsa || this.isFsa) && planOfr.hsaFsaCoverage) {
            coverage = planOfr.hsaFsaCoverage;
        } else if (planOfr.selectedCoverage) {
            coverage = planOfr.selectedCoverage.name;
        }
        this.selectedPlansInfo[this.planStatus.in_cart].push({
            cost: cost,
            coverage: coverage,
        });
        return planOfr;
    }

    /**
     * create a deep clone and add additional details of the plan that is enrolled
     * @param plan : Plan to be copied
     * @returns deep cloned plan with selected cost, coverage and pricing details
     */
    deepCopyEnrollPlan(plan: PlanOfferingPanel): PlanOfferingPanel {
        const planOfr: PlanOfferingPanel = this.util.copy(plan);
        if (this.isHsa || this.isFsa) {
            // Maintain correct value up to 2 decimal places after rounding total cost value.
            const amt = planOfr.enrollment.totalCost * this.payrollPerYear;
            planOfr.hsaFsaAmount = Math.round(amt * HUNDRED) / HUNDRED;
            planOfr.contributionYear = planOfr.enrollment.validity.effectiveStarting.toString().slice(0, CONTRIBUTION_YEAR_SIZE);
        } else {
            planOfr.selectedPricing = this.getSelectedPricing(
                planOfr.planPricing,
                planOfr.enrollment.coverageLevel.id,
                planOfr.enrollment.benefitAmount,
            );
            planOfr.selectedCoverage = planOfr.enrollment.coverageLevel;
        }
        let riderCost = 0;
        let riderMemberCostPerPayPeriord = 0;
        if (planOfr.enrollment?.riders?.length) {
            riderCost = planOfr.enrollment.riders.map((rider) => rider.totalCost).reduce((a, b) => a + b);
            riderMemberCostPerPayPeriord = planOfr.enrollment.riders.map((rider) => rider.memberCostPerPayPeriod).reduce((a, b) => a + b);
        }
        const totalCostPerPayPeriord = PayrollFrequencyCalculatorPipe.prototype
            .transform(planOfr.enrollment.totalCost + riderCost, this.payFrequencyObject)
            .toFixed(TWO);
        const adjustment = Number(totalCostPerPayPeriord) - (planOfr.enrollment?.memberCostPerPayPeriod + riderMemberCostPerPayPeriord);
        this.selectedPlansInfo[this.planStatus.enrolled].push({
            cost: PayrollFrequencyCalculatorPipe.prototype.transform(planOfr.enrollment.totalCost + riderCost, this.payFrequencyObject),
            coverage: planOfr.enrollment.coverageLevel ? planOfr.enrollment.coverageLevel.name : "",
            adjustment,
        });
        return planOfr;
    }
    /**
     * @description Finds the plans in cart and company provided plans
     */
    findSelectedPlans(): void {
        this.updateMissingInfo();
        if (this.planOfferings && this.planOfferings.length) {
            this.planOfferings = this.planOfferings.map((plan) => {
                plan.supplementary = plan.plan.characteristics.some((x) => x === Characteristics.SUPPLEMENTARY);
                plan.cartItem = null;
                plan.enrollment = null;
                return plan;
            });
            if (
                (this.productOffering.companyProvided || this.isWageWorksCompanyProvided) &&
                ![ProductId.DENTAL, ProductId.VISION].includes(this.productOffering.product.id)
            ) {
                this.findCompanyProvidedPlans();
            } else {
                this.findInCartPlans();
                this.findEnrolledPlans();
            }
        }
    }
    /**
     * updates missing info data
     */
    updateMissingInfo(): void {
        this.planOfferings.forEach((planOffering) => {
            if (
                planOffering.missingInformation &&
                this.allPlanOfferings.some((offering) => offering.id === planOffering.id && !offering.missingInformation)
            ) {
                delete planOffering.missingInformation;
                if (planOffering.disable && planOffering.disable.message === MissingInfoType.WORK_ZIP_STATE) {
                    delete planOffering.disable;
                }
            }
            // When VAS plan not offered in updated work state set below flags
            if (planOffering.missingInformation && !this.allPlanOfferings.some((offering) => offering.id === planOffering.id)) {
                delete planOffering.missingInformation;
                this.displayPlans = false;
                this.shoppingService.isVASPlanEligible$.next(false);
            }
        });
        this.hasMissingInfo = this.planOfferings.some(
            (planOffering) =>
                planOffering.plan && planOffering.plan.vasFunding && planOffering.missingInformation === MissingInfoType.WORK_ZIP_STATE,
        );
    }
    /**
     * @description Finds all company provided plans
     */
    findCompanyProvidedPlans(): void {
        this.planOfferings.forEach((planOfr) => {
            if (this.isCompanyProvidedPlan(planOfr)) {
                const enrollmentForCompanyProvided = this.enrollments.find((enrollment) => enrollment.plan.id === planOfr.plan.id);
                planOfr.inCart = true;
                planOfr.showSummary = true;
                planOfr.cartItem = this.cartItems.find((item) => item.planOfferingId === planOfr.id);
                planOfr.enrollment = !this.cartItems.some((item) => item.enrollmentId === enrollmentForCompanyProvided.id)
                    ? enrollmentForCompanyProvided
                    : null;
                const enrollmentStatus = planOfr.enrollment ? this.applicationStatusService.convert(planOfr.enrollment) : null;
                planOfr.enrollmentStatus = enrollmentStatus ? this.languageStrings[enrollmentStatus] : planOfr.enrollmentStatus;
                if (this.isHsa || this.isFsa) {
                    if (planOfr.cartItem) {
                        planOfr.contributionYear = planOfr.cartItem.coverageValidity.effectiveStarting.slice(0, CONTRIBUTION_YEAR_SIZE);
                        planOfr.hsaFsaAmount = planOfr.cartItem.totalCost;
                    } else if (planOfr.enrollment) {
                        planOfr.contributionYear = planOfr.enrollment.validity.effectiveStarting
                            .toString()
                            .slice(0, CONTRIBUTION_YEAR_SIZE);
                        planOfr.hsaFsaAmount = planOfr.enrollment.totalCost;
                    }
                }
                this.companyProvidedPlanOfferings.push(planOfr);
                this.totalSelectedPlans++;
            }
        });
    }

    /**
     * Function to find plans which are already in cart
     */
    findInCartPlans(): void {
        if (this.cartItems && this.cartItems.length) {
            this.cartItems.forEach((cartItem) => {
                const planOffering = this.planOfferings.find((x) => x.id === cartItem.planOfferingId);
                // Breaking reference incase of stackable plans
                // Since incase of normal plans only one enrollment is possible against a plan offering
                const planOfr: PlanOfferingPanel =
                    this.productOffering.productType === ProductType.STACKABLE ? this.util.copy(planOffering) : planOffering;
                if (planOfr && cartItem.applicationType !== "REINSTATEMENT") {
                    planOfr.inCart = true;
                    planOfr.showSummary = true;
                    planOfr.cartItem = cartItem;
                    this.inCartPlanOfferings.push(this.util.copy(planOfr));
                    this.totalSelectedPlans++;
                }
            });
            if (this.inCartPlanOfferings.length && this.isJuvenile && this.productOffering.inCart) {
                this.showAdditionalChild = this.inCartPlanOfferings.some((inCartPlan) =>
                    this.productOffering.planOfferings.some((plan) => plan.id === inCartPlan.id),
                );
            } else {
                this.showAdditionalChild = false;
            }
        }
    }

    /**
     * Function to get the enrolled plans from plan offering and push it to enrolledPlanOfferings
     * @returns void
     */
    findEnrolledPlans(): void {
        this.enrolledPlanOfferings = [];
        if (this.enrollments && this.enrollments.length) {
            this.enrollments.forEach((enrollment) => {
                const planOffering = this.planOfferings.find((x) => x.plan.id === enrollment.plan.id);
                // Breaking reference since if product is not stackable then only one enrollment is possible against a plan offering
                // If product is stackable then multiple enrollment are possible against a plan offering
                const planOfr = this.productOffering.productType === ProductType.STACKABLE ? this.util.copy(planOffering) : planOffering;

                if (planOfr) {
                    planOfr.enrollment = enrollment;
                    const enrollmentStatus = this.applicationStatusService.convert(enrollment);
                    planOfr.enrollmentStatus = enrollmentStatus ? this.languageStrings[enrollmentStatus] : planOfr.enrollmentStatus;
                    if (planOfr.hasDuplicatePlan) {
                        planOfr.cartItem = null;
                    }
                    if (
                        !planOfr.cartItem &&
                        !this.inCartPlanOfferings.some((inCartPlanOfr) => inCartPlanOfr.cartItem.enrollmentId === enrollment.id)
                    ) {
                        // Setting planOffering inCart to true to fetch Coverage levels against an enrolled plan
                        if (this.productOffering.productType === ProductType.STACKABLE) {
                            planOffering.inCart = true;
                        }
                        // Set inCart to true only if its not a reinstatement plan.
                        // This will allow to show the same plan in plan offering panel.
                        if (planOfr.plan.id === enrollment.plan.id && !this.isReinstatementPlan(enrollment)) {
                            planOfr.inCart = true;
                        }
                        planOfr.showSummary = true;
                        this.totalSelectedPlans++;
                        this.enrolledPlanOfferings.push(this.util.copy(planOfr));
                    }
                }
            });
            if (this.enrolledPlanOfferings.length) {
                this.isLapsedRequiredReinstate = this.enrolledPlanOfferings.some(
                    (planOfr) =>
                        planOfr.enrollment &&
                        (planOfr.enrollment.status === EnrollmentStatusType.TERMINATED ||
                            planOfr.enrollment.status === EnrollmentStatus.lapsed) &&
                        planOfr.enrollment.reinstatement === "MANDATORY",
                );
            }
        }
    }

    /**
     * Function to return the reinstatement end date date for enrolled product
     * @param enrollment enrollmentObject
     */
    getLapsedDate(enrollment: Enrollments): string {
        let reinstatementEndDate = "";
        if (enrollment && enrollment.reinstatementEndDate) {
            reinstatementEndDate = this.convertDate(enrollment.reinstatementEndDate);
        }
        return reinstatementEndDate;
    }

    filterSupplementaryPlanOfferings(): void {
        this.planOfferings = this.planOfferings.map((planOfr) => {
            if (planOfr.supplementary) {
                const activePlan = this.enrolledPlanOfferings.find(
                    (x) => x.enrollmentStatus === EnrollmentStatus.approved && x.plan.dependentPlanIds.some((id) => id === planOfr.plan.id),
                );
                if (activePlan && activePlan.enrollment) {
                    if (planOfr.selectedPricing && planOfr.selectedPricing.benefitAmount != null) {
                        planOfr.selectedPricing.benefitAmount = activePlan.enrollment.benefitAmount;
                    }
                    this.supplementaryPlanOfferings.push(planOfr);
                }
            }
            return planOfr;
        });
    }
    /**
     * @description Checks if its a company provided plan and VAS eligible
     * @param planOfr {PlanOfferingPanel} current plan
     * @returns {boolean} if company provided plan or not
     */
    isCompanyProvidedPlan(planOfr: PlanOfferingPanel): boolean {
        if (
            planOfr &&
            planOfr.plan &&
            planOfr.plan.characteristics &&
            planOfr.plan.characteristics.length &&
            this.isVASPlanEligibleForWorkState
        ) {
            return (
                planOfr.plan.characteristics.indexOf(Characteristics.COMPANY_PROVIDED) !== -1 ||
                planOfr.plan.characteristics.indexOf(Characteristics.AUTOENROLLABLE) !== -1
            );
        }
        return false;
    }

    isActivePlan(enrollment: Enrollments): boolean {
        if (enrollment) {
            return this.languageStrings[this.applicationStatusService.convert(enrollment)] === EnrollmentStatus.approved;
        }
        return false;
    }

    /**
     * Get plan pricings
     * @returns observable of plan offering pricings
     */
    getPlanPricings(): Observable<{
        planOfferingPricing: PlanOfferingPricing[];
        planOfferingPricingWithPolicyFee: PlanOfferingPricing[];
    }> {
        this.showSpinner = true;
        this.setFooterVisibility(true);
        const updatedPlanOfferings = this.planOfferings;
        return of(...this.planOfferings).pipe(
            mergeMap((planOffering) =>
                forkJoin([
                    this.getPlanOfferingPricing(planOffering.id.toString(), planOffering.plan.carrier.id),
                    this.getPlanOfferingPricing(planOffering.id.toString(), planOffering.plan.carrier.id, true),
                ]).pipe(
                    map(([planOfferingPricing, planOfferingPricingWithPolicyFee]) => {
                        if (planOffering.supplementary && this.enrollments && this.enrollments.length) {
                            const approvedMatchingEnrollment = this.enrollments.find(
                                (enrollment) =>
                                    enrollment.status === EnrollmentStatusType.APPROVED &&
                                    enrollment.plan.dependentPlanIds.some((x) => x === planOffering.plan.id),
                            );
                            if (approvedMatchingEnrollment) {
                                return {
                                    planOfferingPricing: planOfferingPricing.filter(
                                        (price) => price.coverageLevelId === approvedMatchingEnrollment.coverageLevel.id,
                                    ),
                                    planOfferingPricingWithPolicyFee: planOfferingPricingWithPolicyFee.filter(
                                        (price) => price.coverageLevelId === approvedMatchingEnrollment.coverageLevel.id,
                                    ),
                                };
                            }
                        }
                        return {
                            planOfferingPricing: planOfferingPricing,
                            planOfferingPricingWithPolicyFee: planOfferingPricingWithPolicyFee,
                        };
                    }),
                    tap((pricingData) => {
                        planOffering.planPricing = pricingData.planOfferingPricing;
                        this.shortTermDisablilityCheck = this.productOffering.product.id === ProductId.SHORT_TERM_DISABILITY;
                        if (this.shortTermDisablilityCheck) {
                            planOffering.planPricing.sort((a, b) => b.benefitAmount - a.benefitAmount);
                        }
                        planOffering.selectedPricing = this.getDefaultPricing(pricingData.planOfferingPricing);
                        planOffering.aflacPolicyFeePricing = this.getDefaultPricing(pricingData.planOfferingPricingWithPolicyFee);
                        const planOfferingIndex = this.planOfferings.findIndex(
                            (currentPlanOffering) => currentPlanOffering.id === planOffering.id,
                        );
                        updatedPlanOfferings[planOfferingIndex] = planOffering;
                    }),
                ),
            ),
            finalize(() => {
                // updating planOfferings with new pricing data
                this.planOfferings = updatedPlanOfferings;
                this.showSpinner = false;
                this.setFooterVisibility(false);
                this.getSelectedPlanOfferingsData();
                this.initializePlanInfo();
                this.setToolTips();
            }),
        );
    }

    /**
     * Function to call getPlanOfferingPricing API
     * @param planId id of plan
     * @param carrierId id of carrier
     * @param includeFee whether to include the fee in the pricing
     * @returns {Observable<PlanOfferingPricing[]>}
     */
    getPlanOfferingPricing(planId: string, carrierId: number, includeFee: boolean = false): Observable<PlanOfferingPricing[]> {
        if (
            this.isAgentAssisted &&
            !this.productOffering.product.valueAddedService &&
            !this.isMinDate &&
            !this.isMaxDate &&
            !this.inValidDate
        ) {
            return this.shoppingService
                .getPlanOfferingPricing(
                    planId.toString(),
                    this.enrollmentState,
                    null,
                    this.memberId,
                    this.mpGroup,
                    null,
                    null,
                    null,
                    null,
                    this.dateTransform(this.productOffering.coverageDate),
                    this.riskClassId && carrierId === CarrierId.AFLAC ? this.riskClassId : null,
                    null,
                    null,
                    includeFee,
                )
                .pipe(
                    map((response) => response),
                    catchError((err) => {
                        this.showSpinner = false;
                        return of([]);
                    }),
                );
        }
        if (this.isJuvenile) {
            return this.shoppingService
                .getPlanOfferingPricing(
                    planId.toString(),
                    this.enrollmentState,
                    null,
                    this.memberId,
                    this.mpGroup,
                    null,
                    null,
                    null,
                    this.planOfferings.find((plan) => plan.id.toString() === planId).childAge || 0,
                )
                .pipe(
                    map((response) => response),
                    catchError((err) => {
                        this.showSpinner = false;
                        return of([]);
                    }),
                );
        }
        return this.shoppingService
            .getPlanOfferingPricing(
                planId.toString(),
                this.enrollmentState,
                null,
                this.memberId,
                this.mpGroup,
                null,
                null,
                null,
                null,
                this.dateTransform(this.coverageDate),
                this.riskClassId && carrierId === CarrierId.AFLAC ? this.riskClassId : null,
                null,
                null,
                includeFee,
            )
            .pipe(
                map((response) => response),
                catchError((err) => {
                    this.showSpinner = false;
                    return of([]);
                }),
            );
    }

    /**
     * Function determines the highest or lowest price from the given data based on the product offering.
     * @param productOffering - The product offering containing the product details.
     * @param data -  The array of data objects containing memberCost.
     * @returns {object|null} The object with the highest or lowest memberCost, or null if data is empty or not provided.
     */
    getDefaultPricing(data: PlanOfferingPricing[]): PlanOfferingPricing {
        if (data && data.length) {
            const targetPrice = data.reduce((acc, el) => {
                if (this.shortTermDisablilityCheck) {
                    return el.memberCost > acc.memberCost ? el : acc;
                } else {
                    return el.memberCost < acc.memberCost ? el : acc;
                }
            }, data[0]);

            return targetPrice;
        }
        
        return null;
    }

    getSelectedPricing(pricingArray: PlanOfferingPricing[], id: number, benefitAmount: number): PlanOfferingPricing | undefined {
        if (pricingArray && pricingArray.length) {
            const idx = pricingArray.findIndex(
                (x) => x.coverageLevelId === id && (benefitAmount ? benefitAmount === x.benefitAmount : true),
            );
            if (idx > -1) {
                return pricingArray[idx];
            }
            return pricingArray[0];
        }
        return undefined;
    }

    /**
     * Function to get selected plan data
     */
    getSelectedPlanOfferingsData(): void {
        this.showSpinner = true;
        this.setFooterVisibility(true);
        const array = [];
        this.planOfferings.forEach((planOfr) => {
            array.push(planOfr.inCart ? this.getPlanOfferingData(planOfr.id.toString(), planOfr.plan.id.toString()) : of(null));
        });
        this.subscriptions.push(
            forkJoin(array).subscribe((data) => {
                this.planOfferings.forEach((plan, idx) => {
                    if (data[idx]) {
                        this.planOfferings[idx].coverageLevel = data[idx][0];
                        this.planOfferings[idx].ridersData = data[idx][1];
                    }
                });
                this.showSpinner = false;
                this.setFooterVisibility(false);
                this.store.dispatch(new SetProductPlanOfferings(this.productOffering.id, this.planOfferings));
            }),
        );
    }

    getPlanOfferingData(planOfferingId: string, planId: string): Observable<[CoverageLevel[], PlanOfferingPanel[]]> {
        return forkJoin([this.getCoverageLevels(planId), this.getRidersData(planOfferingId)]);
    }

    getCoverageLevels(id: string): Observable<CoverageLevel[]> {
        return this.coreService.getCoverageLevels(id).pipe(
            map((response) => response),
            catchError((err) => of([])),
        );
    }

    /**
     * Get plan offering riders
     * @returns Observable of PlanOfferingPanel array
     */
    getRidersData(id: string): Observable<PlanOfferingPanel[]> {
        return this.shoppingService
            .getPlanOfferingRiders(id, this.mpGroup, this.enrollmentMethod, this.enrollmentState, this.memberId)
            .pipe(catchError(() => of([])));
    }

    /**
     * Method to get the pricing for each coverage level
     * @param riderPlan
     * @param cartRiders
     * @param benefitAmount
     */
    getRiderPricingAndCoverage(riderPlan: PlanOfferingPanel, cartRiders: RiderCart[], benefitAmount: number): void {
        const riderPlanId = riderPlan.plan.id.toString();
        this.subscriptions.push(
            forkJoin([
                this.shoppingService.getPlanOfferingPricing(
                    riderPlan.id.toString(),
                    this.enrollmentState,
                    {},
                    this.memberId,
                    this.mpGroup,
                    riderPlan.parentPlanId,
                    riderPlan.parentPlanCoverageLevelId,
                    benefitAmount,
                    null,
                    null,
                    null,
                    null,
                    null,
                    this.policyFeeRiderIds.includes(riderPlanId),
                ),
                this.coreService.getCoverageLevels(riderPlanId),
            ]).subscribe(
                (data) => {
                    riderPlan.planPricing = data[0];
                    riderPlan.coverageLevel = data[1];
                    if (cartRiders && cartRiders.length) {
                        const cartRider = cartRiders.find((x) => x.planOfferingId === riderPlan.id);
                        if (cartRider) {
                            riderPlan.inCart = true;
                            riderPlan.selectedPricing = this.getSelectedPricing(
                                riderPlan.planPricing,
                                cartRider.coverageLevelId,
                                cartRider.benefitAmount,
                            );
                        }
                    }
                },
                (error) => {
                    if (error.error) {
                        this.store.dispatch(new SetErrorForShop(error.error));
                        this.showSpinner = false;
                    }
                },
            ),
        );
    }

    getAgentDetails(): void {
        this.subscriptions.push(
            this.accountService.getAccountProducers(this.mpGroup.toString()).subscribe((producers) => {
                const primaryProducer = producers.find((primary) => primary.role === PRIMARY_PRODUCER);
                this.agentFirstName = primaryProducer.producer.name.firstName;
                this.agentLastName = primaryProducer.producer.name.lastName;
                this.agentEmail = primaryProducer.producer.emailAddress;
                this.agentNumber = primaryProducer.producer.phoneNumber;
                // eslint-disable-next-line max-len
                this.agentDetails = `${this.agentFirstName} ${this.agentLastName} ${this.languageStrings["primary.portal.tpiEnrollment.at"]} ${this.agentNumber} ${this.languageStrings["primary.portal.tpiEnrollment.or"]} ${this.agentEmail}.`;
            }),
        );
    }

    /**
     * @param planOffering : plan offering data
     * @returns age of the member on coverage start date
     */
    getAgeOfMemberOnCoverageEffectiveDate(planOffering: PlanOfferingPanel): number {
        const coverageDate = this.getDateForCart();
        const coverageEffectiveDate = this.getCoverageEffectiveDate(planOffering, coverageDate);
        return this.dateService.getDifferenceInYears(this.memberProfile.birthDate, coverageEffectiveDate);
    }

    /**
     * @description Function to return the payload for add to cart API
     * also set the coverage effective date based upon condition
     * @param planOffering Plan offering object returned from getAllPlanOffering API
     * @param update boolean value whether the cart needs to be updated or not
     * @param parentCartItemId the parent cart item Id
     * @returns addCartItem instance of AddCartItem Model
     */
    getCartObject(planOffering: PlanOfferingPanel, update: boolean, parentCartItemId?: number): AddCartItem {
        const coverageDate = this.getDateForCart();
        const cartObject: AddCartItem = {
            planOfferingId: planOffering.id,
            memberCost: this.isHsa || this.isFsa ? planOffering.totalCost : null,
            totalCost: this.isHsa || this.isFsa ? planOffering.totalCost : null,
            enrollmentMethod: this.enrollmentMethod,
            enrollmentState: this.enrollmentState,
            enrollmentCity: this.enrollmentCity,
        };
        if (this.isAgentAssisted) {
            cartObject.assistingAdminId = this.tpiProducerId;
        }
        if (this.isSelfEnrollment) {
            cartObject.assistingAdminId = this.producerId;
        }
        if (!this.isAgentAssisted) {
            const coverageEffectiveDate = this.getCoverageEffectiveDate(planOffering, coverageDate);
            cartObject.coverageEffectiveDate = this.isTpi
                ? this.productOffering.tppSelfServiceCoverageStartDate
                : coverageEffectiveDate.toString();
        }
        if (planOffering.selectedPricing) {
            cartObject.memberCost = planOffering.selectedPricing.memberCost;
            cartObject.totalCost = planOffering.selectedPricing.totalCost;
            cartObject.coverageLevelId = planOffering.selectedPricing.coverageLevelId;
            if (planOffering.selectedPricing.benefitAmount) {
                cartObject.benefitAmount = planOffering.selectedPricing.benefitAmount;
            }
        } else {
            cartObject.coverageLevelId = ENROLLED_COVERAGE_LEVEL;
        }
        if (parentCartItemId) {
            cartObject.parentCartItemId = parentCartItemId;
        }
        if (!update && planOffering.ridersData && planOffering.ridersData.length) {
            cartObject.riders = this.setRidersOfCartObject(planOffering.ridersData);
        }
        if (this.currentQle) {
            this.setQleDataOfCartObject(cartObject, planOffering, update);
        }
        this.updateCoverageEffectiveDate(cartObject);
        if (this.isJuvenile) {
            cartObject.dependentAge = planOffering.childAge;
        }
        return cartObject;
    }
    /**
     * updates coverage effective date for cart item
     * @param cartObject cartObject data
     */
    updateCoverageEffectiveDate(cartObject: AddCartItem): void {
        if (this.isAgentAssisted) {
            cartObject.assistingAdminId = this.tpiProducerId;
            if (!this.isMinDate && !this.isMaxDate && !this.inValidDate && !this.productOffering.product.valueAddedService) {
                cartObject.coverageEffectiveDate = this.productOffering.coverageDate;
            }
        }
    }

    /**
     * getDateForCart function to return today's date if effective start date is in past.
     * @return date in string form
     */
    getDateForCart(): string {
        return this.dateService.format(new Date(), DateFormats.YEAR_MONTH_DAY);
    }

    /**
     * Set the riders data for the cart object request payload
     * @param ridersData: Selected plan offering riders data
     * @returns RiderCart array
     */
    setRidersOfCartObject(ridersData: PlanOfferingPanel[]): RiderCart[] {
        return ridersData
            .map((rider) => {
                const baseRider = rider.parentPlanId ? { baseRiderId: rider.parentPlanId } : {};
                if (rider.inCart && rider.selectedPricing) {
                    if (!rider.totalCost) {
                        rider.totalCost = 0;
                    }
                    return {
                        planOfferingId: rider.id,
                        coverageLevelId: rider.selectedPricing.coverageLevelId,
                        benefitAmount: rider.selectedPricing.benefitAmount,
                        memberCost: rider.totalCost,
                        totalCost: rider.totalCost,
                        ...baseRider,
                    };
                }
                let coverage: CoverageLevel;
                if (rider.coverageLevel) {
                    coverage = rider.coverageLevel.find((coverageLvl) => coverageLvl.name.toLowerCase() === EnrollmentStatus.declined);
                }
                if (!coverage && rider.disable && rider.disable.planDisable) {
                    return null;
                }
                const coverageId = coverage ? coverage.id : this.DECLINED_ID;
                return {
                    planOfferingId: rider.id,
                    coverageLevelId: coverageId,
                    memberCost: 0,
                    totalCost: 0,
                    ...baseRider,
                };
            })
            .filter((rider) => rider);
    }

    /**
     * Set the parameters for the cart item request payload during qle
     * @param cartObject: Cart item request payload
     * @param planOffering: Selected plan offering
     * @param update: Is plan updated
     */
    setQleDataOfCartObject(cartObject: AddCartItem, planOffering: PlanOfferingPanel, update: boolean): void {
        const dualPlanState: QleOeShopModel = this.store.selectSnapshot(DualPlanYearState);
        const newPYShop = dualPlanState.selectedShop === DualPlanYearSettings.NEW_PY_QLE_SHOP;
        const oeShop = dualPlanState.selectedShop === DualPlanYearSettings.OE_SHOP;
        // Send qualifying event id in addCartItem request body if in QLE period, not for oeShop, and plan is PY restricted
        cartObject.subscriberQualifyingEventId = !oeShop && planOffering.planYearId ? this.currentQle.id : null;

        // Send coverage effective date when plan added during qle for current plan year
        const productCoverageDate = this.currentQle.coverageStartDates.find((cov) => cov.productId === this.productOffering.product.id);
        if (productCoverageDate && productCoverageDate.date) {
            if (dualPlanState.selectedShop === DualPlanYearSettings.QLE_SHOP) {
                const coverageDate = this.dateService.isBefore(this.dateService.toDate(productCoverageDate.date))
                    ? this.dateService.format(new Date(), DateFormats.YEAR_MONTH_DAY)
                    : productCoverageDate.date;
                cartObject.coverageEffectiveDate = coverageDate.toString();
            } else if (
                (oeShop || newPYShop) &&
                dualPlanState.isQleAfterOeEnrollment &&
                dualPlanState.oeCoverageStartDate &&
                this.dateService.checkIsAfter(
                    this.dateService.toDate(productCoverageDate.date),
                    dualPlanState.oeCoverageStartDate ? this.dateService.toDate(dualPlanState.oeCoverageStartDate) : undefined,
                )
            ) {
                cartObject.coverageEffectiveDate = productCoverageDate.date.toString();
            } else if (
                !dualPlanState.isDualPlanYear &&
                !this.store.selectSnapshot(EnrollmentState.GetIsOpenEnrollment) &&
                this.dateService.checkIsAfter(
                    this.dateService.toDate(productCoverageDate.date),
                    this.dateService.toDate(planOffering.validity.effectiveStarting),
                )
            ) {
                const coverageDate = this.dateService.checkIsAfter(this.dateService.toDate(productCoverageDate.date))
                    ? productCoverageDate.date
                    : this.dateService.format(new Date(), DateFormats.YEAR_MONTH_DAY);
                cartObject.coverageEffectiveDate = coverageDate.toString();
            }
        }
    }

    /**
     * Function to add plan to cart
     * @param planOffering {PlanOfferingPanel}
     */
    addPlan(planOffering: PlanOfferingPanel): void {
        this.showSpinner = true;
        this.juvenilePlanOfferingId = 0;
        this.errorMessage = "";
        this.action = "add";
        this.selectedPlanOffering = planOffering;
        if (this.inCartPlanOfferings.length && this.inCartPlanOfferings[0].cartItem) {
            this.cartItemId = this.inCartPlanOfferings[0].cartItem.id;
        }
        if (
            this.productOffering.productType !== ProductType.STACKABLE &&
            this.enrolledPlanOfferings.length &&
            !this.enrolledPlanOfferings.some((plan) => plan.id === planOffering.id)
        ) {
            this.getKnockoutQuestions(planOffering, false, false);
        } else if (this.inCartPlanOfferings.length && this.productOffering.productType !== ProductType.STACKABLE) {
            // If existing plan in cart and not stackable, replace plan
            if (this.isHsa || this.isFsa) {
                // If HSA, FSA plans no knockout questions, replace plan
                this.removePlanFromCart(planOffering, false, true);
            } else {
                // Display knockout questions and replace
                this.shoppingCartService.setPlanName(this.inCartPlanOfferings[0].plan.name, planOffering.plan.name);
                this.getKnockoutQuestions(planOffering, false, true);
            }
        } else if (this.isHsa || this.isFsa) {
            // If HSA, FSA plans no knockout questions, add plan
            this.addPlanToCart(planOffering);
        } else {
            // No existing plan in cart or stackable product, add plan
            this.getKnockoutQuestions(planOffering, false, false);
        }
    }

    /**
     * Function to add selected plan to cart
     * @param planOffering: Selected plan offering
     */
    addPlanToCart(planOffering: PlanOfferingPanel): void {
        this.showSpinner = true;
        const addCartItem = this.getCartObject(planOffering, false);
        addCartItem.enrollmentId =
            this.productOffering.productType === ProductType.STACKABLE && planOffering.enrollment ? planOffering.enrollment.id : undefined;
        this.selectedPlanOffering = planOffering;
        this.shoppingService.addCartItem(this.memberId, this.mpGroup, addCartItem).subscribe(
            (resp) => {
                this.showSpinner = false;
                this.updatePlanInStore();
                if (!(this.isHsa || this.isFsa) && this.allEligibilityQuestions && this.allEligibilityQuestions.length) {
                    const location = resp.headers.get("location");
                    const numberMatches = location.match(/\d+/g);
                    const itemId = +numberMatches[numberMatches.length - 1];
                    this.saveApplicationResponse(itemId, addCartItem);
                }
                this.subscriptions.push(
                    this.shoppingService
                        .getShoppingCart(this.memberId, this.mpGroup, this.isTpi ? [] : this.planYearId)
                        .subscribe((res) => {
                            this.shoppingCartService.setShoppingCart(res);
                        }),
                );
                this.eligibilityCheck = planOffering;
                this.eligibilityCheck = { ...this.eligibilityCheck, ...{ updateDone: true } };
            },
            (error) => {
                this.showSpinner = false;
                this.showErrorAlertMessage(error);
            },
        );
    }

    addSupplementaryPlan(planOffering: PlanOfferingPanel): void {
        this.errorMessage = "";
        this.addPlanToCart(planOffering);
    }

    updatePlan(planOffering: PlanOfferingPanel): void {
        this.errorMessage = "";
        this.action = "update";
        this.selectedPlanOffering = planOffering;
        if (planOffering.enrollment && !planOffering.cartItem) {
            this.action = "add";
            this.removeSupplementaryPlans(planOffering);
        } else {
            this.cartItemId = planOffering.cartItem.id;
            if (this.isHsa || this.isFsa) {
                this.updatePlanSuccess(planOffering);
            } else {
                this.getKnockoutQuestions(planOffering, true, false);
            }
        }
    }

    /**
     * Updates cart item
     * @param planOffering selected plan offering
     */
    updatePlanSuccess(planOffering: PlanOfferingPanel): void {
        if (planOffering && planOffering.cartItem) {
            const basePlanUpdated =
                this.isHsa ||
                this.isFsa ||
                this.checkPlanUpdated(planOffering, planOffering.cartItem.coverageLevelId, planOffering.cartItem.benefitAmount) ||
                (this.isJuvenile && planOffering.childAge !== planOffering.cartItem.dependentAge);
            if (basePlanUpdated) {
                this.updateCartItem(planOffering);
            }
            if (planOffering.ridersData && planOffering.ridersData.length) {
                const array = [];
                planOffering.ridersData.forEach((rider) => {
                    const riderItem = planOffering.cartItem.riders.find((item) => item.planOfferingId === rider.id);
                    if (rider.inCart && riderItem) {
                        array.push(
                            this.shoppingService.updateCartItem(
                                this.memberId,
                                this.mpGroup,
                                riderItem.cartItemId,
                                this.getCartObject(rider, true, planOffering.cartItem.id),
                            ),
                        );
                    } else if (rider.inCart && !riderItem) {
                        array.push(
                            this.shoppingService.addCartItem(
                                this.memberId,
                                this.mpGroup,
                                this.getCartObject(rider, false, planOffering.cartItem.id),
                            ),
                        );
                    } else if (!rider.inCart && riderItem) {
                        array.push(this.shoppingService.removeCartItem(this.memberId, this.mpGroup, riderItem.cartItemId));
                    }
                });
                if (array.length) {
                    this.showSpinner = true;
                    this.subscriptions.push(
                        forkJoin(array).subscribe(
                            (response) => {
                                this.showSpinner = false;
                                if (!basePlanUpdated) {
                                    this.updatePlanInStore();
                                    if (this.allEligibilityQuestions && this.allEligibilityQuestions.length) {
                                        this.saveApplicationResponse(planOffering.cartItem.id);
                                    }
                                }
                                this.getShopping();
                            },
                            (error) => {
                                this.showSpinner = false;
                                this.showErrorAlertMessage(error);
                            },
                        ),
                    );
                }
            }
        }
    }

    checkPlanUpdated(plan: PlanOfferingPanel, id: number, amount: number): boolean {
        return plan.selectedPricing.coverageLevelId !== id || plan.selectedPricing.benefitAmount !== amount;
    }
    /**
     * Method to get get cart items
     * @returns {Observable<GetCartItems[]>} Observable with cart items
     */
    getCartItems(): Observable<GetCartItems[]> {
        return this.shoppingService.getCartItems(this.memberId, this.mpGroup, "", this.isTpi ? [] : this.planYearId);
    }

    updateCartItem(planOffering: PlanOfferingPanel): void {
        this.showSpinner = true;
        const updateCartItem = this.getCartObject(planOffering, true);
        this.subscriptions.push(
            this.shoppingService.updateCartItem(this.memberId, this.mpGroup, planOffering.cartItem.id, updateCartItem).subscribe(
                (response) => {
                    this.showSpinner = false;
                    this.updatePlanInStore();
                    if (this.allEligibilityQuestions && this.allEligibilityQuestions.length) {
                        this.saveApplicationResponse(planOffering.cartItem.id, updateCartItem);
                    }
                    this.getShopping();
                },
                (error) => {
                    this.showSpinner = false;
                    this.showErrorAlertMessage(error);
                },
            ),
        );
    }

    /**
     * Update cartItemId if it is null and remove plan from cart.
     * @param planOffering plan to replace previous plan in cart or proceed with to knockout questions
     * @param resetActive whether cart is being reset
     * @param isReplace whether removed plan is being replaced by another plan
     */
    removePlanFromCart(planOffering: PlanOfferingPanel, resetActive: boolean, isReplace: boolean): void {
        this.showSpinner = true;
        if (!this.cartItemId) {
            const matchingCartItem = this.cartItems.find((cartItem) => cartItem.planOfferingId === this.inCartPlanOfferings[0].id);
            if (matchingCartItem) {
                this.cartItemId = matchingCartItem.id;
            }
        }
        this.subscriptions.push(
            this.shoppingService.removeCartItem(this.memberId, this.mpGroup, this.cartItemId).subscribe(
                (_) => {
                    this.showSpinner = false;
                    if (resetActive) {
                        planOffering.cartItem = null;
                        this.updatePlanInStore();
                    } else if (!isReplace) {
                        this.getKnockoutQuestions(planOffering, false, false);
                    } else {
                        this.addPlanToCart(planOffering);
                    }
                },
                (error) => {
                    this.showSpinner = false;
                    this.showErrorAlertMessage(error);
                },
            ),
        );
    }

    /**
     * Remove supplementary plans for active enrollment if base plan is replaced
     * @param planOffering: Selected plan offering
     */
    removeSupplementaryPlans(planOffering: PlanOfferingPanel): void {
        const plans = this.inCartPlanOfferings.filter(
            (planOfr) =>
                this.productOffering.productType !== ProductType.STACKABLE ||
                (planOfr.plan.characteristics.some((x) => x === Characteristics.SUPPLEMENTARY) &&
                    planOffering.plan.dependentPlanIds.some((id) => id === planOfr.plan.id)),
        );
        const replaceData = this.dualPlanYearService.checkForActiveEnrollments(planOffering, this.enrollments);
        const showReplaceModal =
            this.checkReplaceEnrollment(planOffering) && replaceData.sameProductActiveEnrollment && replaceData.planEdit;
        if (plans.length) {
            this.showSpinner = true;
            const array = [];
            plans.forEach((plan) => {
                this.planOfferings.find((x) => x.id === plan.id).inCart = false;
                array.push(this.shoppingService.removeCartItem(this.memberId, this.mpGroup, plan.cartItem.id));
            });
            this.subscriptions.push(
                forkJoin(array).subscribe(
                    () => {
                        this.showSpinner = false;
                        plans.forEach((plan) => {
                            const index = this.planOfferings.findIndex((x) => x.id === plan.id);
                            if (index > -1) {
                                this.planOfferings[index].inCart = false;
                            }
                        });
                        if (showReplaceModal) {
                            this.replaceModal(planOffering, false, true);
                        } else {
                            this.addPlanToCart(planOffering);
                        }
                    },
                    (error) => {
                        this.showSpinner = false;
                        this.showErrorAlertMessage(error);
                    },
                ),
            );
        } else {
            if (showReplaceModal) {
                this.replaceModal(planOffering, false, true);
            } else {
                this.addPlanToCart(planOffering);
            }
        }
    }
    /**
     * Function for declining the product, return if cross border restriction is on
     */
    declineProductFromList(): void {
        if (this.displayCrossBorderDisclaimer) {
            return;
        }
        this.showSpinner = true;
        this.subscriptions.push(
            this.shoppingService
                .declineProduct(this.productOffering.id.toString(), this.memberId, this.enrollmentMethod, this.mpGroup)
                .subscribe(
                    (_) => {
                        this.showSpinner = false;
                        this.action = "decline";
                        if (this.isMedicalProduct) {
                            this.checkForHsaPlansInCart();
                        }
                        this.updatePlanInStore();
                    },
                    (err) => {
                        this.showSpinner = false;
                    },
                ),
        );
    }

    resetActiveEnrollment(planOffering: PlanOfferingPanel): void {
        this.action = "reset_active";
        this.cartItemId = planOffering.cartItem.id;
        this.removePlanFromCart(planOffering, true, false);
    }
    /**
     * Method is used to update plan details.
     */
    updatePlanInStore(): void {
        this.planOfferings = this.util.copy(this.planOfferings);
        this.productOffering = this.util.copy(this.productOffering);
        const tempProductOfr = { ...this.productOffering };
        if (this.action === "decline") {
            if (this.inCartPlanOfferings.length) {
                this.inCartPlanOfferings.forEach((planOfr) => {
                    this.planOfferings.find((plan) => plan.id === planOfr.id).inCart = false;
                });
            }
            this.inCartPlanOfferings = [];
            tempProductOfr.declined = true;
            tempProductOfr.inCart = false;
        } else if (this.action === "reset_active") {
            tempProductOfr.inCart = this.inCartPlanOfferings.length > 1;
            // Upon reset, set the inCart flag to false to be reappear the plan in plan offering panel
            if (this.inCartPlanOfferings.length) {
                this.inCartPlanOfferings.forEach((planOfr) => {
                    this.planOfferings.find((plan) => plan.id === planOfr.id).inCart = false;
                });
            }
        } else {
            if (this.inCartPlanOfferings.length && this.productOffering.productType !== ProductType.STACKABLE && this.action === "add") {
                this.planOfferings.find((x) => x.id === this.inCartPlanOfferings[0].id).inCart = false;
                this.productOffering.inCart = true;
                this.productOffering.declined = false;
            }
            tempProductOfr.inCart = true;
            tempProductOfr.declined = false;
        }
        tempProductOfr.planOfferings = this.getTempPlanOfferings(tempProductOfr);
        this.store.dispatch(new SetProductOfferingsOfId(tempProductOfr));
        this.store.dispatch(new SetExitPopupStatus(false));
    }

    /**
     * to get updated plan offerings per selected plan offering
     * @param tempProductOfr product offering details
     * @return plan offerings after update
     */
    getTempPlanOfferings(tempProductOfr: ProductOfferingPanel): PlanOfferingPanel[] {
        return this.selectedPlanOffering && !this.isReinstatementPlan(this.selectedPlanOffering.enrollment)
            ? this.planOfferings.map((plan) => {
                if (plan.id === this.selectedPlanOffering.id) {
                    this.selectedPlanOffering = this.util.copy(this.selectedPlanOffering);
                    if (this.isDualPlan || tempProductOfr.declined) {
                        this.selectedPlanOffering.inCart = false;
                    }
                    this.selectedPlanOffering.selectedCoverage = null;
                    this.selectedPlanOffering.selectedPricing = null;
                    if (this.selectedPlanOffering.ridersData && this.selectedPlanOffering.ridersData.length) {
                        this.selectedPlanOffering.ridersData = this.selectedPlanOffering.ridersData.map((rider) => {
                            rider.selectedCoverage = null;
                            rider.selectedPricing = null;
                            rider.inCart = false;
                            return rider;
                        });
                    }
                    return this.selectedPlanOffering;
                }
                return plan;
            })
            : this.planOfferings;
    }
    /**
     * @description checks if medical, hsa, fsa plans exists and api calls for add, remove, update plans.
     * @returns {boolean} if plan exists returns true or else false
     */
    checkIfMedicalPlanExists(): boolean {
        let planExists = false;
        const productOffering = this.productOfferings.find((productOfr) =>
            EnrollmentEnums.productIds.MEDICAL.some((x) => x === productOfr.product.id),
        );
        if (productOffering) {
            const medPlan = productOffering.planOfferings.find((x) => x.inCart);
            if (medPlan && medPlan.selectedCoverage) {
                planExists = true;
                this.medicalCoverage = medPlan.selectedCoverage;
            } else {
                planExists =
                    productOffering.inCart || productOffering.companyProvided || productOffering.enrollStatus === EnrollmentStatus.approved;
                if (planExists) {
                    const medPlanItem = this.cartItems.find((item) =>
                        productOffering.planOfferings.some((x) => x.id === item.planOfferingId),
                    );
                    if (medPlanItem) {
                        this.getMedicalPlanCoverageDetails(medPlanItem.coverageLevelId.toString());
                    } else {
                        const medPlanEnroll = this.enrollments.find((x) => x.plan.productId === productOffering.product.id);
                        if (medPlanEnroll) {
                            this.medicalCoverage = medPlanEnroll.coverageLevel;
                        }
                    }
                }
            }
        }
        return planExists;
    }

    getMedicalPlanCoverageDetails(id: string): void {
        this.subscriptions.push(
            this.coreService.getCoverageLevel(id).subscribe((response) => {
                this.medicalCoverage = response;
                const plans = [];
                this.planOfferings.forEach((planOfr) => {
                    const plan = { ...planOfr };
                    plan.hsaFsaCoverage = this.getHSACoverage();
                    plans.push(plan);
                    this.updatePlanInfo({ coverage: plan.hsaFsaCoverage }, plan.id);
                });
                this.planOfferings = plans;
            }),
        );
    }

    getProductContributionLimits(): void {
        this.showSpinner = true;
        this.subscriptions.push(
            this.benefitOfferingService.getProductContributionLimits(this.productOffering.product.id, this.mpGroup).subscribe(
                (response) => {
                    this.showSpinner = false;
                    if (response && response["minContribution"] != null && response["maxContribution"] != null) {
                        const plans = [];
                        this.planOfferings.forEach((planOfr) => {
                            const plan = { ...planOfr };
                            plan.minHSA = response.minContribution;
                            plan.maxHSA = response.maxContribution;
                            plan.hsaFsaAmount = plan.minHSA;
                            if (this.medicalCoverage) {
                                plan.hsaFsaCoverage = this.getHSACoverage();
                            }
                            plans.push(plan);
                            this.setHsaFsaPlanInfo(plan);
                        });
                        this.planOfferings = plans;
                        this.store.dispatch(new SetProductPlanOfferings(this.productOffering.id, this.planOfferings));
                    }
                },
                (error) => {
                    this.showSpinner = false;
                },
            ),
        );
    }

    setHsaFsaPlanInfo(plan: PlanOfferingPanel): void {
        const minAmt = plan.hsaFsaAmount / this.payrollPerYear;
        this.updatePlanInfo({ cost: minAmt, coverage: plan.hsaFsaCoverage }, plan.id);
    }
    /**
     * @description checks in cart for the hsa and fsa plans.
     */
    checkForHsaPlansInCart(): void {
        const hsaProducts = this.productOfferings.filter((product) => EnrollmentEnums.productIds.HSA.some((x) => product.product.id === x));
        if (hsaProducts && hsaProducts.length) {
            hsaProducts.forEach((prod) => {
                prod.planOfferings.forEach((plan) => {
                    const idx = this.cartItems.findIndex((x) => x.planOfferingId === plan.id);
                    if (idx > -1) {
                        this.removeHsaPlan(this.cartItems[idx].id, prod.id, plan.id);
                    }
                });
            });
        }
    }

    removeHsaPlan(id: number, productOfrId: number, planOfrId: number): void {
        this.subscriptions.push(
            this.shoppingService.removeCartItem(this.memberId, this.mpGroup, id).subscribe((response) => {
                this.store.dispatch(new SetPlanStatus(productOfrId, planOfrId));
            }),
        );
    }

    getHSACoverage(): string {
        return EnrollmentConstants.coverageId.INDIVIDUAL.some((x) => x.id === this.medicalCoverage.id)
            ? EnrollmentConstants.hsaCoverage.INDIVIDUAL
            : EnrollmentConstants.hsaCoverage.FAMILY;
    }
    /* END: Medical, HSA, FSA Code */

    /* START: Knockout Section */
    getKnockoutQuestions(planOffering: PlanOfferingPanel, isUpdate: boolean, isReplace: boolean): void {
        if (this.isKnockOutComplete(planOffering.plan.id)) {
            this.decider(planOffering, isUpdate, isReplace);
        } else {
            this.showSpinner = true;
            this.subscriptions.push(
                this.shoppingService.getKnockoutQuestions(planOffering.id, this.enrollmentState, this.mpGroup, this.memberId).subscribe(
                    (knockoutQuestions) => {
                        this.coreService
                            .getCoverageLevelRules(planOffering.selectedPricing.coverageLevelId.toString())
                            .pipe(take(1))
                            .subscribe(
                                (coverageLevelRules) => {
                                    this.showSpinner = false;
                                    const isCoverSpouse = coverageLevelRules[0].coversSpouse;
                                    this.filterKnockoutQuestion(knockoutQuestions, isCoverSpouse, planOffering, isUpdate, isReplace);
                                },
                                (error) => {
                                    this.showSpinner = false;
                                    this.filterKnockoutQuestion(knockoutQuestions, true, planOffering, isUpdate, isReplace);
                                },
                            );
                    },
                    (error) => {
                        this.showSpinner = false;
                        this.decider(planOffering, isUpdate, isReplace);
                    },
                ),
            );
        }
    }

    /**
     * Function to determine if plan needs to be added, updated or replaced
     * @param planOffering: selected plan offering
     * @param isUpdate: is plan being updated
     * @param isReplace: is plan being replaced
     */
    decider(planOffering: PlanOfferingPanel, isUpdate: boolean, isReplace: boolean): void {
        const replaceData = this.dualPlanYearService.checkForActiveEnrollments(planOffering, this.enrollments);
        if (this.checkReplaceEnrollment(planOffering) && replaceData.sameProductActiveEnrollment) {
            if (isUpdate) {
                this.updatePlanSuccess(planOffering);
            } else if (isReplace) {
                this.replaceModal(planOffering, true);
            } else if (replaceData.sameProductActiveEnrollment) {
                this.replaceModal(planOffering, false, !!replaceData.planEdit || !replaceData.replacePlan);
            } else {
                this.addPlanToCart(planOffering);
            }
        } else if (!isUpdate && !isReplace) {
            this.addPlanToCart(planOffering);
        } else if (isUpdate) {
            this.updatePlanSuccess(planOffering);
        } else if (isReplace) {
            this.replaceModal(planOffering, true);
        }
    }

    /**
     * Check condition for displaying replace modal for Aflac plans in dual plan year current coverage
     * @param planOffering: Selected plan offering
     * @returns boolean: true, if its dual plan current year and Aflac plan
     */
    checkReplaceEnrollment(planOffering: PlanOfferingPanel): boolean {
        const dualPlanState: QleOeShopModel = this.store.selectSnapshot(DualPlanYearState);
        return (
            dualPlanState.isDualPlanYear &&
            dualPlanState.selectedShop === DualPlanYearSettings.QLE_SHOP &&
            planOffering.plan.carrier.id === CarrierId.AFLAC
        );
    }
    /**
     * filters knockout questions
     * @param knockoutQuestions list of knockout questions
     * @param isCoverSpouse indicates if spouse is covered or not
     * @param planOffering plan offering panel data
     * @param isUpdate indicates if update or not
     * @param isReplace indicates if replace or not
     */
    filterKnockoutQuestion(
        knockoutQuestions: KnockoutQuestion[],
        isCoverSpouse: boolean,
        planOffering: PlanOfferingPanel,
        isUpdate: boolean,
        isReplace: boolean,
    ): void {
        this.allEligibilityQuestions = knockoutQuestions.filter((questions) =>
            questions.title.toLowerCase().includes(this.languageStrings["primary.portal.common.eligibilityQuestions"]),
        );
        if (this.allEligibilityQuestions.length) {
            // remove duplicate based on questionId
            this.allEligibilityQuestions = this.allEligibilityQuestions.reduce((unique, o) => {
                if (!unique.some((obj) => obj.question.id === o.question.id)) {
                    unique.push(o);
                }
                return unique;
            }, []);
        }
        if (this.allEligibilityQuestions.length && !isCoverSpouse) {
            const someEligibilityQuestions = [];
            for (const eligibilityQuestion of this.allEligibilityQuestions) {
                for (const [j, option] of eligibilityQuestion.question.options.entries()) {
                    if (option.knockoutType === KnockoutType.SPOUSE_KNOCKOUT) {
                        break;
                    }

                    if (j === eligibilityQuestion.question.options.length - 1) {
                        someEligibilityQuestions.push(eligibilityQuestion);
                    }
                }
            }
            if (someEligibilityQuestions.length) {
                this.allEligibilityQuestions = someEligibilityQuestions;
            } else {
                this.allEligibilityQuestions = [];
            }
        }
        if (this.allEligibilityQuestions.length) {
            // Remove {glossary} from Knockout Questions
            this.allEligibilityQuestions.forEach((question) => {
                if (question.question.text.toLowerCase().includes("{glossary}")) {
                    question.question.text = question.question.text.replace(/{glossary}/g, "");
                }
            });
            this.openKnockoutQuestionDialog(planOffering, false, isUpdate, isReplace);
        } else {
            this.decider(planOffering, isUpdate, isReplace);
        }
    }

    openKnockoutQuestionDialog(
        planOffering: PlanOfferingPanel,
        isEdit: boolean,
        isUpdate: boolean,
        isReplace: boolean,
        isReview?: boolean,
    ): void {
        if (!isEdit) {
            this.responses = [];
        }
        if (isUpdate && !isEdit) {
            this.showSpinner = true;
            this.subscriptions.push(
                this.shoppingCartService.getApplicationResponses(this.memberId, this.cartItemId, this.mpGroup).subscribe(
                    (previousResponse) => {
                        this.showSpinner = false;
                        if (previousResponse.length) {
                            this.responses = previousResponse;
                        } else {
                            this.responses = [];
                        }
                        this.handleKnockoutResponse(planOffering, isEdit, isUpdate, isReplace);
                    },
                    (error) => {
                        this.showSpinner = false;
                        this.responses = [];
                        this.handleKnockoutResponse(planOffering, isEdit, isUpdate, isReplace);
                    },
                ),
            );
        } else {
            this.handleKnockoutResponse(planOffering, isEdit, isUpdate, isReplace, isReview);
        }
    }

    /**
     * Function to handle Knockout question response from user
     * @param planCartObject plan cart object data
     * @param isEdit indicates if edit or not
     * @param isUpdate indicates if update or not
     * @param isReplace indicates if replace or not
     * @param isReview indicates if review or not
     */
    handleKnockoutResponse(
        planCartObject: PlanOfferingPanel,
        isEdit: boolean,
        isUpdate: boolean,
        isReplace: boolean,
        isReview?: boolean,
    ): void {
        const knockoutdialogRef = this.dialog.open(KnockoutQuestionsDialogComponent, {
            width: "750px",
            data: {
                knockoutQuestions: this.allEligibilityQuestions,
                response: this.responses,
                isEdit: isEdit,
                isProducer: false,
                mpGroup: this.mpGroup,
                memberId: this.memberId,
            },
        });
        this.subscriptions.push(
            knockoutdialogRef.afterClosed().subscribe((knockoutResult) => {
                this.knockout = [];
                if (knockoutResult.action === "submit") {
                    this.responses = knockoutResult.responses;
                    this.responses.forEach((response) => {
                        const currentQuestion = this.allEligibilityQuestions.find(
                            (question) => question.question.id === response.planQuestionId,
                        );
                        if (currentQuestion.question.inputType === InputType.RADIO) {
                            currentQuestion.question.options.forEach((option) => {
                                if (response.value[0] === option.value) {
                                    this.knockout.push({
                                        type: option.knockoutType,
                                        text: option.knockoutText,
                                    });
                                }
                            });
                        }
                        if (currentQuestion.question.inputType === InputType.CHECKBOX) {
                            currentQuestion.question.options.forEach((option) => {
                                (response.value as string[]).forEach((item) => {
                                    if (item === option.value) {
                                        this.knockout.push({
                                            type: option.knockoutType,
                                            text: option.knockoutText,
                                        });
                                    }
                                });
                            });
                        }
                    });
                    if (this.knockout.length) {
                        for (const [i, item] of this.knockout.entries()) {
                            if (item.type === KnockoutType.KNOCKOUT || item.type === KnockoutType.SPOUSE_KNOCKOUT) {
                                this.openNotEligibleDialog(planCartObject, item, isUpdate, isReplace, isReview);
                                break;
                            }
                            if (i === this.knockout.length - 1) {
                                if (isReview) {
                                    this.store.dispatch(new ResetPlanKnockOutData(this.knockOutData.planId));
                                } else {
                                    this.decider(planCartObject, isUpdate, isReplace);
                                }
                            }
                        }
                    } else {
                        this.decider(planCartObject, isUpdate, isReplace);
                    }
                }
            }),
        );
    }

    reviewKnockoutResponse(): void {
        this.allEligibilityQuestions = this.knockOutData.knockoutQuestions;
        this.responses = this.knockOutData.responseAnswers;
        this.handleKnockoutResponse(null, true, false, false, true);
    }

    isKnockOutComplete(planId: number): boolean {
        if (this.knockOutList && this.knockOutList.length) {
            return this.knockOutList.some((data) => data.planId === planId && !data.disable);
        }
        return false;
    }

    openNotEligibleDialog(
        planCartObject: PlanOfferingPanel,
        knockout: any,
        isUpdate: boolean,
        isReplace: boolean,
        isReview?: boolean,
    ): void {
        const notEligibledialogRef = this.dialog.open(NotEligibleDialogComponent, {
            width: "750px",
            data: { knockout: knockout, isProducer: false },
        });
        this.subscriptions.push(
            notEligibledialogRef.afterClosed().subscribe((result) => {
                if (result.action === "edit") {
                    this.eligibilityCheck = null;
                    this.openKnockoutQuestionDialog(planCartObject, true, isUpdate, isReplace, isReview);
                } else if (result.action === this.ELIGIBILITYTEXT && result.knockoutType === KnockoutType.SPOUSE_KNOCKOUT) {
                    this.eligibilityCheck = planCartObject;
                    if (isReview) {
                        this.store.dispatch(
                            new SetKnockOutData({
                                knockoutQuestions: this.allEligibilityQuestions,
                                responseAnswers: this.responses,
                                planId: this.knockOutData.planId,
                                coverageLevel: this.knockOutData.coverageLevel,
                                disable: true,
                            }),
                        );
                    } else {
                        this.disableSpouseCoverages(planCartObject);
                    }
                } else {
                    this.eligibilityCheck = null;
                    const planOffering = this.planOfferings.find((plan) => plan.id === planCartObject.id);
                    if (planOffering) {
                        planOffering.disable = {
                            status: true,
                            planDisable: true,
                        };
                        planOffering.tooltipMessage = this.languageStrings["primary.portal.quoteShop.planDisabledView.ineligibleKO"];
                    }
                }
            }),
        );
    }

    /**
     * To save application response and update cart items
     * @param itemId Item id
     * @param cartItem Cart item of type AddCartItem
     */
    saveApplicationResponse(itemId: number, cartItem?: AddCartItem): void {
        this.subscriptions.push(
            this.shoppingCartService.saveApplicationResponse(this.memberId, itemId, this.mpGroup, this.responses).subscribe((resp) => {
                if (cartItem) {
                    cartItem.status = CartStatus.TODO;
                    cartItem.riders = [];
                    this.shoppingService.updateCartItem(this.memberId, this.mpGroup, itemId, cartItem).subscribe();
                }
            }),
        );
    }

    disableSpouseCoverages(planOffering: PlanOfferingPanel): void {
        if (planOffering.coverageLevel && planOffering.coverageLevel.length) {
            const coverageIds = planOffering.coverageLevel.map((covLvl) => covLvl.id.toString());
            of(coverageIds)
                .pipe(
                    mergeMap((coverages) => coverages),
                    mergeMap((coverage) =>
                        this.getCoverageRules(coverage).pipe(
                            map((rules) => {
                                if (rules && rules.length && rules[0].coversSpouse) {
                                    this.store.dispatch(
                                        new SetKnockOutData({
                                            knockoutQuestions: this.allEligibilityQuestions,
                                            responseAnswers: this.responses,
                                            planId: planOffering.plan.id,
                                            coverageLevel: +coverage,
                                            disable: true,
                                        }),
                                    );
                                }
                            }),
                        ),
                    ),
                )
                .subscribe();
        }
    }

    getCoverageRules(coverageLevelId: string): Observable<CoverageLevelRule[]> {
        return this.coreService.getCoverageLevelRules(coverageLevelId).pipe(
            map((response) => response),
            catchError((_) => of([])),
        );
    }
    /* END: Knockout Section */

    /* START: HTML functions*/
    /**
     * Method to revert after cancelling the edit.
     * @param planOffering plan card selected
     * @param type Cart status of the plan card selected
     * @param index index of the selected plan
     */
    cancelEdit(planOffering: PlanOfferingPanel, type: string, index: number): void {
        planOffering.showSummary = true;
        let cost = 0;
        let coverage = "";
        if (type === this.planStatus.in_cart) {
            cost += planOffering.cartItem.memberCost;
            if (planOffering.cartItem.riders.length) {
                cost += planOffering.cartItem.riders.map((x) => x.memberCost).reduce((a, b) => a + b);
            }
            if ((this.isHsa || this.isFsa) && planOffering.hsaFsaCoverage) {
                coverage = planOffering.hsaFsaCoverage;
            } else if (planOffering.selectedCoverage) {
                coverage = planOffering.selectedCoverage.name;
            }
        }
        if (type === this.planStatus.enrolled) {
            cost += planOffering.enrollment.totalCost;
            if (planOffering.enrollment.coverageLevel) {
                coverage = planOffering.enrollment.coverageLevel.name;
            }
        }
        this.selectedPlansInfo[type][index].cost = cost;
        this.selectedPlansInfo[type][index].coverage = coverage;
    }

    showPlanDescription(planData: any): boolean {
        if (
            planData.name === this.planStatus.in_cart ||
            (planData.name === this.planStatus.enrolled &&
                planData.data.some((planOfr: PlanOfferingPanel) => planOfr.enrollmentStatus === EnrollmentStatus.lapsed))
        ) {
            return false;
        }
        return true;
    }

    /**
     * Disable a plan based on any of the following conditions:
     * 1. Enrolled policy is lapsed and requires re-instatement.
     *    Other plans in the product cannot be selected unless the policy is re-instated.
     * 2. HSA product but Medical product is not in cart or enrolled.
     * 3. Plan requires agent assistance.
     * 4. Member has missing information which is required for the plan.
     * 5. Plan has some enrollment requirements.
     * 6. Product requires agent assistance.
     * Close the panel if it is expanded and disabled.
     * @param planOffering: PlanOffering which is tested for above conditions.
     * @param panelRef: Reference of the expansion panel.
     * @returns boolean: returns true if any of the above conditions are satisfied.
     */
    disablePlanSelection(planOffering: PlanOfferingPanel, panelRef: MatExpansionPanel): boolean {
        let disable = false;
        if (this.isAgentAssisted) {
            disable =
                this.isLapsedRequiredReinstate ||
                (this.isHsa && !this.enableHsa) ||
                (planOffering.disable && planOffering.disable.status && planOffering.disable.type !== DisableType.AGENT_ASSISTANCE);
        } else {
            disable =
                (this.isLapsedRequiredReinstate ||
                    (this.isHsa && !this.enableHsa) ||
                    (planOffering.disable && planOffering.disable.status) ||
                    this.productOffering.agentAssistanceRequired) &&
                !this.isSelfEnrollment;
        }
        if (this.isTpi) {
            disable = disable || this.callCenterDisabilityEnrollmentRestricted;
        }
        if (disable && panelRef && panelRef.expanded) {
            panelRef.expanded = false;
        }
        return disable;
    }

    /**
     * To display the plan if it neither expired  nor in cart and it should be stackable and VAS eligible
     * @param planOffering: PlanOffering which is tested for above conditions.
     * @returns boolean: returns true if conditions are satisfied.
     */
    displayPlanOffering(planOffering: PlanOfferingPanel): boolean {
        // reset isVASPlanEligible flag on shopping page product selection
        this.shoppingService.isVASPlanEligible$.next(
            planOffering.missingInformation ? true : this.allPlanOfferings.some((offering) => offering.id === planOffering.id),
        );
        // reset displayPlans flag to show appropriate messages and rendering on UI
        this.displayPlans = this.isVASPlanEligibleForWorkState;
        return (
            (this.productOffering.productType === ProductType.STACKABLE ||
                !planOffering.inCart ||
                this.productOffering.enrollStatus === this.statusEnded) &&
            !planOffering.supplementary &&
            !planOffering.expired &&
            this.displayPlans
        );
    }
    /* END: : HTML functions*/

    convertDate(date1: any): any {
        let endDate = this.datepipe.transform(date1, AppSettings.DATE_FORMAT);
        const p = endDate.split(/\D/g);
        endDate = [p[2], p[1], p[0]].join("/");

        return endDate;
    }

    /**
     * Opens the plan details modal
     *
     * @param event mouse event object
     * @param planOffering info about offered plan
     */
    showPlanDetailsPopup(event: MouseEvent, planOffering: PlanOfferingPanel): void {
        event.stopPropagation();
        this.store
            .select(SharedState.getState)
            .pipe(
                take(1),
                tap((sharedState) => {
                    const situsState =
                        (sharedState.memberMPGroupAccount && sharedState.memberMPGroupAccount.situs.state.abbreviation) || "";
                    this.dialog.open(PlanDetailsComponent, {
                        data: {
                            planId: planOffering.plan.id,
                            planName: planOffering.plan.name,
                            states: [
                                {
                                    abbreviation:
                                        planOffering.plan.policyOwnershipType === PolicyOwnershipType.GROUP && situsState
                                            ? situsState
                                            : this.enrollmentState,
                                },
                            ],
                            mpGroup: this.mpGroup,
                            productId: this.productOffering?.product.id,
                            isCarrierOfADV: planOffering.plan.carrier.id === CarrierId.ADV,
                            situsState,
                            referenceDate: this.dualPlanYearService.getReferenceDate(),
                        },
                    });
                }),
            )
            .subscribe();
    }

    /**
     * Displays missing work info popup
     * @param event Mouse event
     */
    showMissingInfoPopup(event: MouseEvent): void {
        const referenceDate = this.dualPlanYearService.getReferenceDate();
        const dialogRef = this.empoweredService.openDialog(PlanMissingInfoPopupComponent, {
            data: {
                memberId: this.memberId,
                mpGroup: this.mpGroup,
                productName: this.productName,
            },
        });
        this.subscriptions.push(
            dialogRef
                .afterClosed()
                .pipe(
                    filter((response) => response.data.isUpdated),
                    switchMap((response) => {
                        this.hasMissingInfo = false;
                        this.showSpinner = true;
                        return this.shoppingService.getPlanOfferings(
                            undefined,
                            this.enrollmentMethod,
                            this.enrollmentState,
                            {},
                            this.memberId,
                            this.mpGroup,
                            "",
                            referenceDate,
                        );
                    }),
                )
                .subscribe((planOfferings) => {
                    this.showSpinner = false;
                    this.allPlanOfferings = planOfferings;
                    this.store.dispatch(new SetAllPlanOfferings(planOfferings));
                    this.updateMissingInfo();
                    if (this.selectedPlanData.length) {
                        this.displayCompanyProvidedProductsDetails();
                    } else {
                        this.expansionPanelArray = [];
                        this.setExpansionPanelArray();
                    }
                }),
        );
    }

    /**
     * Displays company provided products popup
     * @returns void
     */
    displayCompanyProvidedProductsDetails(): void {
        const companyProductNames: string[] = [];
        const companyPlanIds: number[] = [];
        this.productOfferings.forEach((productOfr) => {
            const companyProvidedPlanIds = productOfr.planOfferings
                .filter((planOfr) => this.isCompanyProvidedPlan(planOfr))
                .map((planOfr) => planOfr.id);
            if (productOfr.planOfferings && productOfr.planOfferings.length && companyProvidedPlanIds.length) {
                companyPlanIds.push(...companyProvidedPlanIds);
                companyProductNames.push(productOfr.product.name);
                const oldProductCopy: ProductOfferingPanel = this.util.copy(productOfr);
                oldProductCopy.inCart = true;
                this.store.dispatch(new SetProductOfferingsOfId(oldProductCopy));
            }
        });
        // No cost dialog should not display When VAS plan not offered in updated work state
        if (companyProductNames.length && this.isVASPlanEligibleForWorkState) {
            const dialogRef = this.empoweredService.openDialog(CompanyProvidedProductsDialogComponent, {
                data: {
                    products: companyProductNames,
                },
                width: "600px",
            });
            this.subscriptions.push(
                dialogRef.afterClosed().subscribe((resp) => {
                    this.store.dispatch(new SetCompanyProductsDisplayed(true));
                    if (resp === "save") {
                        this.updateCompanyProvidedCartItems(companyPlanIds);
                    }
                }),
            );
        } else {
            this.store.dispatch(new SetCompanyProductsDisplayed(true));
        }
    }

    /**
     * Method to update cart items for company provided plans
     * @param companyPlanIds : Company provided plan ids
     * @returns void
     */
    updateCompanyProvidedCartItems(companyPlanIds: number[]): void {
        this.showSpinner = true;

        this.subscriptions.push(
            this.shoppingService.getCartItems(this.memberId, this.mpGroup, "", this.isTpi ? [] : this.planYearId).subscribe(
                (response) => {
                    this.cartItems = response;
                    const cartList = [];
                    if (this.cartItems && this.cartItems.length) {
                        this.cartItems.forEach((item) => {
                            if (companyPlanIds.indexOf(item.planOfferingId) > -1 && !item.acknowledged) {
                                cartList.push(item);
                            }
                        });
                    }
                    if (cartList.length) {
                        of(cartList)
                            .pipe(
                                mergeMap((cartItem) => cartItem),
                                map((item) => this.updateItemInCart(item)),
                                finalize(() => {
                                    this.showSpinner = false;
                                }),
                            )
                            .subscribe();
                    } else {
                        this.showSpinner = false;
                    }
                },
                (error) => {
                    this.showSpinner = false;
                },
            ),
        );
    }

    /**
     * Function to update the plan in cart
     * @param {GetCartItems} cartItem
     */
    updateItemInCart(cartItem: GetCartItems): void {
        let cartObject: AddCartItem = { ...cartItem, acknowledged: true, enrollmentMethod: this.method };
        if (this.isAgentAssisted) {
            cartObject = { ...cartObject, assistingAdminId: this.tpiProducerId };
        }
        delete cartObject["id"];
        this.subscriptions.push(
            this.shoppingService
                .updateCartItem(this.memberId, this.mpGroup, cartItem.id, cartObject)
                .pipe(switchMap(() => this.updateShoppingCart()))
                .subscribe(),
        );
    }
    /**
     * Function used to get the cart items and update the shopping cart
     * @returns number of items in cart
     */
    updateShoppingCart(): ObservableInput<number> {
        this.subscriptions.push(
            this.shoppingService.getShoppingCart(this.memberId, this.mpGroup).subscribe((resp: GetShoppingCart) => {
                if (resp) {
                    return this.shoppingCartDisplayService.setShoppingCart(resp);
                }
            }),
        );
        return of(null);
    }

    /**
     * Show warning modal to get confirmation while replacing cart item of the same product
     * @param planOffering: selected planOffering object
     * @param cartItem: Is cart item being replaced
     * @param updatePlan: Is enrollment being updated
     */
    replaceModal(planOffering: PlanOfferingPanel, cartItem: boolean, updatePlan: boolean = false): void {
        this.removeDialogRef = this.empoweredService.openDialog(ReplacementPlanModalComponent, {
            backdropClass: "backdrop-blur",
            panelClass: "popup-close",
            data: {
                productName: this.productName,
                cartItem,
                updatePlan,
            },
        });
        this.subscriptions.push(
            this.removeDialogRef.afterClosed().subscribe((result) => {
                if (result && result.type === "Replace") {
                    if (cartItem) {
                        this.removePlanFromCart(planOffering, false, true);
                    } else {
                        this.addPlanToCart(planOffering);
                    }
                }
            }),
        );
    }
    /**
     * checks if plan year is continuos or not
     */
    checkIfPlanYearContinuos(planOffering: PlanOfferingPanel[]): boolean {
        return planOffering.some(
            (planOfr) =>
                planOfr.enrollmentStatus === EnrollmentStatus.approved &&
                planOfr.plan.policyOwnershipType === PolicyOwnershipType.INDIVIDUAL &&
                planOfr.taxStatus === TaxStatus.POSTTAX,
        );
    }

    /**
     * Open Offer listing popup
     */
    openOfferingListPopup(): void {
        this.dialog.open(OfferingListPopupComponent, {
            data: {
                mpGroup: this.mpGroup,
                memberId: this.memberId,
                filter: false,
                product: this.productOffering.product,
                flexDollars: this.flexDollars,
            },
            width: "800px",
        });
    }

    /**
     * Display error message received from api
     * @param err Error object
     */
    showErrorAlertMessage(err: Error): void {
        const error = err[this.ERROR];
        if (error.status === AppSettings.API_RESP_400 && error[this.DETAILS] && error[this.DETAILS].length > 0) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(
                `secondary.portal.members.api.${error.status}.${error.code}.${error[this.DETAILS].field}`,
            );
        } else if (
            error.code === AppSettings.DUPLICATE ||
            (error.status === AppSettings.API_RESP_401 && error.code === AppSettings.NOTAUTHORIZED)
        ) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.portal.members.api.${error.status}.${error.code}`);
        } else {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }

        this.subscriptions.push(
            this.errorMessage$.subscribe((errorMessage) => {
                const apiErrorObject = this.store.selectSnapshot(EnrollmentState.GetApiError);
                if (
                    errorMessage &&
                    apiErrorObject &&
                    errorMessage.errorKey &&
                    apiErrorObject.errorKey &&
                    errorMessage.errorKey === apiErrorObject.errorKey
                ) {
                    this.errorMessage = errorMessage.value;
                }
            }),
        );
        this.showSpinner = false;
    }
    /**
     * Method to get shopping cart and set it in store
     */
    getShopping(): void {
        this.subscriptions.push(
            this.shoppingService
                .getShoppingCart(this.memberId, this.mpGroup, this.isTpi ? [] : this.planYearId)
                .subscribe((res: GetShoppingCart) => {
                    this.shoppingCartService.setShoppingCart(res);
                }),
        );
    }
    setPlanExpanded(expanded: boolean): void {
        this.isPlanExpanded = expanded;
    }
    /**
     * @description function will check decline riders and will make it unchecked on rider section
     * @param plnOff: PlanOffering which is supposed to be rendered.
     * @param cartPlanOff: all plan Offering in cart
     * @returns void
     */
    checkRiderInCart(plnOff: PlanOfferingPanel, cartPlanOff: GetCartItems[]): void {
        const inCartPlan = cartPlanOff.find((cartPlan) => plnOff.cartItem.id === cartPlan.id);
        if (inCartPlan) {
            inCartPlan.riders.forEach((inCartRider) => {
                const index = plnOff.ridersData.findIndex((rider) => inCartRider.planOfferingId === rider.id);
                if (index !== this.NOT_FOUND_INDEX) {
                    plnOff.ridersData[index].inCart = inCartRider.coverageLevelId !== this.DECLINE_ID;
                }
            });
        }
    }

    /**
     * Function to handle date change event
     */
    dateChangeCustom(): void {
        if (!this.isMinDate && !this.isMaxDate && !this.inValidDate && !this.productOffering.product.valueAddedService) {
            const oldProduct: ProductOfferingPanel = this.util.copy(this.productOffering);
            oldProduct.coverageDate = this.dateTransform(this.coverageDate);
            this.store.dispatch(new SetProductOfferingsOfId(oldProduct));
            this.setPlanOfferingDetails(true);
        }
    }

    /**
     * Function to validate manual input typed by user
     * @param {Event} event DateChange event
     * @param {string} coverageDate Selected coverage date
     */
    dateChange(event: Event, coverageDate: string): void {
        const EVENT_VALUE = event.target["value"];
        this.isMinDate = false;
        this.isMaxDate = false;
        this.inValidDate = false;
        if (EVENT_VALUE) {
            const inputDate = new Date(EVENT_VALUE);
            this.inValidDate = isNaN(inputDate.getTime());
            if (!this.inValidDate) {
                coverageDate = this.dateTransform(inputDate);
            }
        }
        if (!this.inValidDate) {
            if (coverageDate < this.dateTransform(this.productOffering.minCoverageDate)) {
                this.isMinDate = true;
            } else if (coverageDate > this.dateTransform(this.productOffering.maxCoverageDate)) {
                this.isMaxDate = true;
            }
        }
    }

    /**
     * Function to return date in "yyyy/mm/dd" format
     * @param {(Date | string)} dateValue
     * @returns {string}
     */
    dateTransform(dateValue: Date | string): string {
        return this.datepipe.transform(dateValue, AppSettings.DATE_FORMAT_YYYY_MM_DD);
    }

    /**
     * Function to decide footer visibility
     * @param {boolean} isFooterVisible
     */
    setFooterVisibility(isFooterVisible: boolean): void {
        if (this.tpiLnlMode) {
            this.hideFooterEvent.emit(isFooterVisible);
        }
    }
    /**
     * Function to set product name
     * @param value which will have the passed product value
     * @returns void
     */
    getHeaderName(value: string): void {
        const productArray = [
            "accident",
            "shortTermDisability",
            "cancer",
            "vision",
            "dental",
            "criticalIllness",
            "hospital",
            "termLife",
            "wholeLife",
            "juvenileTermLife",
            "juvenileWholeLife",
            "hcfsa",
            "hra",
            "dcfsa",
            "hsa",
            "transit",
            "parking",
        ];
        value = value.replace(/-|\s/g, "").toLowerCase();
        const headerName = productArray.find((element) => `${PRIMARY_PRODUCT_LANGUAGE}.${element}`.toLowerCase().indexOf(value) > -1);
        this.headerName = this.languageStrings[`${PRIMARY_PRODUCT_LANGUAGE}.${headerName}`];
    }

    /**
     * Function called when child age is changed
     * @param $event {Juvenile}
     */
    onChildAgeChanged($event: Juvenile): void {
        this.planOfferings.find((plan) => plan.id === $event.planOfferingId).childAge = $event.childAge;
        this.store.dispatch(new SetProductPlanOfferings(this.productOffering.id, this.planOfferings));
        this.juvenilePlanOfferingId = $event.planOfferingId;
        this.setPlanOfferingDetails(false, true);
    }

    /**
     * Function to set Risk Class Id
     * @param riskClass {RiskClass[]}
     * @param riskClassName {string}
     */
    setRiskClassId(riskClass: RiskClass[], riskClassName: string): void {
        const defaultJobClass = riskClass.find((jobClass) => jobClass.name === riskClassName);
        if (defaultJobClass) {
            this.riskClassId = defaultJobClass.id;
            this.setPlanOfferingDetails(true);
        }
    }
    /**
     * Method to call groupAttributes API to get coverage date.
     */
    getCoverageStartDate(): void {
        this.subscriptions.push(
            this.accountService
                .getGroupAttributesByName([COVERAGE_START_DATE], this.mpGroup)
                .pipe(
                    tap((response) => {
                        if (response.length) {
                            this.coverageStartDate = response[0].value;
                        }
                    }),
                )
                .subscribe(),
        );
    }

    /**
     * Method to calculate coverage date based on coverageStartFunction selected in BO
     * @param coverageStart - compare coverageStartFunction selected in BO to calculate coverage date
     * @return date - returns coverage date based on coverageStartFunction
     */
    calculateCoverageDateFunction(coverageStart: string): Date | string {
        let date: Date | string;
        const today = new Date();
        const dateOneMonthFromToday = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        today.setHours(0, 0, 0, 0);
        if (coverageStart === coverageStartFunction.DAY_AFTER) {
            const dayAfterDate = this.dateService.addDays(new Date(), 1);
            const notAllowedDate = this.dateService.addDays(new Date(), 1).getDate();
            if (DateInfo.LAST_DATES_OF_MONTH.includes(notAllowedDate)) {
                return dateOneMonthFromToday;
            }
            return dayAfterDate;
        }
        if (coverageStart === coverageStartFunction.NEXT_FIRST_OF_MONTHNEXT_FIRST_OF_MONTH) {
            return dateOneMonthFromToday;
        }
        if (coverageStart === coverageStartFunction.NEXT_FIRST_OR_FIFTEENTH_OF_MONTH) {
            return new Date(today) < new Date(today.getFullYear(), today.getMonth(), NEXT_FIFTEENTH_OF_MONTH_DATE)
                ? new Date(today.getFullYear(), today.getMonth(), NEXT_FIFTEENTH_OF_MONTH_DATE)
                : dateOneMonthFromToday;
        }
        return date;
    }

    /**
     * Method to get the Coverage effective date based on condition.
     * @param planOffering: Selected plan offering
     * @param coverageDate: Contains coverage date
     * @return date
     */
    getCoverageEffectiveDate(planOffering: PlanOfferingPanel, coverageDate: Date | string): Date | string {
        const coverageStartDate: string = this.datepipe.transform(this.coverageStartDate, DateFormats.YEAR_MONTH_DAY);
        const dualPlanState: QleOeShopModel = this.store.selectSnapshot(DualPlanYearState);
        if (planOffering.taxStatus === TaxStatus.POSTTAX && !planOffering.planYearId) {
            const isProductInQle =
                this.currentQle && this.currentQle.coverageStartDates.find((cov) => cov.productId === this.productOffering.product.id);
            // checking if it is dual plan year, selected OE shop page and if multiple plan years are in Open Enrollment window
            if (
                dualPlanState.isDualPlanYear &&
                dualPlanState.selectedShop === DualPlanYearSettings.OE_SHOP &&
                this.isOpenEnrollment.length > 1
            ) {
                return this.dualPlanYearService.getEarliestCoverageDate(this.isOpenEnrollment);
            }
            if (
                (this.isOpenEnrollment.length ||
                    (dualPlanState.isQleAfterOeEnrollment && dualPlanState.selectedShop === DualPlanYearSettings.NEW_PY_QLE_SHOP)) &&
                ((isProductInQle && dualPlanState.selectedShop !== DualPlanYearSettings.QLE_SHOP) || !isProductInQle)
            ) {
                return this.dualPlanYearService.getReferenceDate(this.isOpenEnrollment);
            }
            const coverageEffectiveDate = this.datepipe.transform(
                this.calculateCoverageDateFunction(planOffering.coverageStartFunction),
                DateFormats.YEAR_MONTH_DAY,
            );
            return coverageStartDate && this.dateService.toDate(coverageStartDate) > new Date() ? coverageStartDate : coverageEffectiveDate;
        } else {
            return planOffering.validity.effectiveStarting && this.dateService.toDate(planOffering.validity.effectiveStarting) > new Date()
                ? planOffering.validity.effectiveStarting
                : coverageDate;
        }
    }
    /**
     * get list of open enrollment plan years
     */
    getOpenEnrollmentPlanYears(): void {
        const currentDate = new Date();
        this.subscriptions.push(
            combineLatest([
                this.benefitOfferingService.getPlanYears(this.mpGroup, true, false),
                this.benefitOfferingService.getPlanYears(this.mpGroup, false, false),
            ]).subscribe(([unapprovedPlanYears, approvedPlanYears]) => {
                const allPlanYears = [...approvedPlanYears, ...unapprovedPlanYears];
                if (allPlanYears.length) {
                    this.isOpenEnrollment = allPlanYears.filter(
                        (planYear) =>
                            this.productOfferings.some(
                                (prod) =>
                                    prod.product.carrierIds.includes(CarrierId.AFLAC) &&
                                    prod.planOfferings.some((planOffering) => planOffering.planYearId === planYear.id),
                            ) &&
                            this.dateService.isBeforeOrIsEqual(
                                this.dateService.toDate(planYear.enrollmentPeriod.effectiveStarting),
                                currentDate,
                            ) &&
                            this.dateService.getIsAfterOrIsEqual(
                                planYear.enrollmentPeriod.expiresAfter
                                    ? this.dateService.toDate(planYear.enrollmentPeriod.expiresAfter)
                                    : new Date(),
                                currentDate,
                            ),
                    );
                }
            }),
        );
    }

    /**
     * Sorts in cart items and enrolled plans according to their id
     */
    sortPlans(): void {
        // Places plan cards with enrollment at top then sorts plan cards according to cart id
        this.inCartPlanOfferings.sort((a, b) => {
            if (a.cartItem.enrollmentId && b.cartItem.enrollmentId) {
                return a.cartItem.id - b.cartItem.id;
            }
            if (!a.cartItem.enrollmentId && !b.cartItem.enrollmentId) {
                return a.cartItem.id - b.cartItem.id;
            }
            if (a.cartItem.enrollmentId && !b.cartItem.enrollmentId) {
                return -1;
            }
            return 1;
        });
        this.enrolledPlanOfferings.sort((a, b) => a.enrollment.id - b.enrollment.id);
        // Sort the plans by plan id in plan offering panel
        this.planOfferings.sort((a, b) => a.plan.id - b.plan.id);
    }

    /**
     * Method returns true if its a reinstatement Plan.
     * @param enrollment: Enrollments
     * @return boolean
     */
    isReinstatementPlan(enrollment: Enrollments): boolean {
        const todayDate = this.dateTransform(new Date());
        return enrollment?.reinstatement === ReinstatementType.OPTIONAL && enrollment?.reinstatementPeriodEndDate < todayDate;
    }

    /**
     * Method will be called when component is destroyed.
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((x) => x.unsubscribe());
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
