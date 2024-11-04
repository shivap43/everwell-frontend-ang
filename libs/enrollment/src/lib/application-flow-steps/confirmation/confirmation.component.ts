import { Component, OnInit, Input, OnDestroy, ViewChild, Output, EventEmitter } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import {
    EnrollmentService,
    CoreService,
    MemberService,
    BenefitsOfferingService,
    AccountService,
    ShoppingService,
    Carrier,
    SignaturePlan,
    Enrollment,
    FormType,
    MemberFullProfile,
    SendReminderMode,
    PendingReasonForPdaCompletion,
    ShoppingCartDisplayService,
    ContactMethodTypes,
} from "@empowered/api";
import {
    Permission,
    CarrierId,
    ConfigName,
    RESIDENT_STATE,
    ServerErrorResponseCode,
    CompanyCode,
    AppSettings,
    DualPlanYearSettings,
    EnrollmentMethod,
    Characteristics,
    PartnerAccountType,
    PlanOffering,
    ProductOffering,
    MemberCredential,
    ProducerCredential,
    Enrollments,
    CorrespondenceType,
    Accounts,
    MemberContact,
    StatusType,
    MemberContactListDisplay,
    MemberQualifyingEvent,
    PdaAccount,
    MemberCoverageDetails,
    SendPdaDialogResponseData,
    DateFormat,
    ProductNames,
} from "@empowered/constants";
import { Select, Store } from "@ngxs/store";

import {
    EnrollmentState,
    MemberWizardState,
    DualPlanYearState,
    IsQleShop,
    QleOeShopModel,
    defaultState,
    EnrollmentMethodState,
    SharedState,
    SetIdToCloseSEP,
    AppFlowService,
    StaticUtilService,
    UtilService,
    DualPlanYearService,
    AccountInfoState,
    TPIState,
    AccountTypes,
} from "@empowered/ngxs-store";
import { SafeResourceUrl, DomSanitizer } from "@angular/platform-browser";
import { MatDialog, MatDialogRef, MatDialogConfig } from "@angular/material/dialog";
import { UserService } from "@empowered/user";
import { forkJoin, Subscription, of, Observable, Subject, combineLatest } from "rxjs";
import {
    NewPdaComponent,
    SendApplicantPdaComponent,
    SendEnrollmentSummaryEmailModalComponent,
    SendEnrollmentSummaryEmailModalService,
} from "@empowered/ui";
import { LanguageService } from "@empowered/language";
import { DatePipe } from "@angular/common";
import { CloseSepPopupComponent } from "../close-sep-popup/close-sep-popup.component";
import { ApplicationPdfDialogComponent } from "../application-pdf-dialog/application-pdf-dialog.component";
import { TpiServices, SharedService, EmpoweredModalService } from "@empowered/common-services";
import { tap, switchMap, catchError, filter, takeUntil, map } from "rxjs/operators";
import { CloseLifeEventPopupComponent } from "./close-life-event-popup/close-life-event-popup.component";
import { DateFormats, ConfirmationStepLabels, EnrollmentData, ActivityPageCode, Portals, RegistrationStatus } from "@empowered/constants";
import { ViewPlanDetailsComponent } from "../view-plan-details/view-plan-details.component";
import { HttpClient } from "@angular/common/http";
import { ScreenHandOffComponent } from "../virtual-F2F/screen-hand-off/screen-hand-off.component";
import { EDeliveryPromptComponent } from "./edelivery-prompt/edelivery-prompt.component";
import { DateService } from "@empowered/date";

const ONE_DAY = 1;
const DAY = "day";
const NEW_HIRE = "NEW_HIRE";
const SEND_PDA_APPLICATION = "send";
const COMMA = ",";
const NO_NUMERIC_CHAR = /[^\d]/g;
const BLANK = "";
const CHUNK_NUMBER = /(\d{3})(\d{3})(\d{4})/;
const PHONE_FORMAT = "$1-$2-$3";
const TEN = 10;

@Component({
    selector: "empowered-confirmation",
    templateUrl: "./confirmation.component.html",
    styleUrls: ["./confirmation.component.scss"],
})
export class ConfirmationComponent implements OnInit, OnDestroy {
    @Input() planObject;
    @Input() signRequest;
    @Input() fromApplicationFlow: boolean;
    @Output() closeForm = new EventEmitter();
    @ViewChild("formTemplate", { static: true }) formModal;
    account: string;
    mpGroup;
    memberId;
    loadSpinner = true;
    itemId;
    planData: SignaturePlan[] = [];
    planDataReview;
    pdaDetail;
    enrollmentId;
    enrollmentData: Enrollments;
    getEnrollmentData;
    safeUrl: SafeResourceUrl;
    signedFileURL: string;
    tpiProducerId: number;
    planName: string;
    isMember: boolean;
    dialogRef;
    confirmationTableData;
    displayedColumns = ["product_name", "plan", "cost"];
    footerColumns = ["cost"];
    payFrequency;
    qleData;
    flow;
    planYear;
    totalCost = 0;
    STR_CARRIER = "carrier";
    STR_APPROVED = "APPROVED";
    STR_PENDING = "PENDING";
    STR_MEMBER_HOME = "/member/home";
    STR_MY_COVERAGE_LINK = "member/coverage/enrollment/benefit-summary/coverage-summary";
    enrollmentMethod: string;
    enrollMethod: string;
    enrollmentState: string;
    // TODO: Need to fetch from behaviour subject
    firstName = "";
    lastName: string;
    isHybridUser: boolean;
    isCallCenterAgent: boolean;
    showPin = false;
    pinDetails: any;
    showPda: boolean;
    isHeadset = false;
    trident = "Trident/";
    isSignatureForSingle = false;
    signRequestSent = false;
    signRequestType: string;
    memberFirstName: string;
    pdaId: number;
    STR_NONE = "none";
    signOffData = Date.now();
    FACE_TO_FACE = AppSettings.FACE_TO_FACE;
    PUERTO_RICO = AppSettings.PUERTO_RICO;
    PDA = FormType.PDA;
    signoffDataFormat = AppSettings.DATE_FORMAT_MM_DD_YYYY;
    buttonLabel = "Close special enrollment period now";
    isSEPClosed = false;
    currentDate = new Date();
    isQLEPending: boolean;
    isQLEApproved: boolean;
    isQLEInProgess: boolean;
    qleToCloseSEP: MemberQualifyingEvent;
    memberInfo: any;
    portal: string;
    oeMaxDate: Date | string;
    oeFlag: boolean;
    newCoverageDate: Date | string;
    qleFlag: boolean;
    qleEndDate: Date | string;
    loginLanguages: any = [];
    closeSepDialogRef: MatDialogRef<CloseSepPopupComponent>;
    memberEvents: any;
    isAdmin: boolean;
    changedQLE: any = {};
    isDirectAcc = false;
    pdaSubmitted = false;
    filename = "signedApplicationView.htm";
    dialogPda;
    errorMessage: string;
    downloadError = false;
    isSpecialCase = false;
    subscriptions: Subscription[] = [];
    planEnrollmentData: EnrollmentData[] = [];
    isReinstate: boolean;
    readonly CREATE_FORM_PDA: string = Permission.CREATE_PDA_MEMBER;
    isCompletePdaPartnerAccountType: boolean;
    isPRPDAConfigEnabled: boolean;
    languageStrings = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.applicationFlow.confirmation.changesSaved",
        "primary.portal.brandingModalExit.buttonExit",
        "primary.portal.enrollmentWizard.closeSpecialEnrollmentPeriod",
        "primary.portal.enrollmentWizard.approvalMsg",
        "primary.portal.enrollmentWizard.closeSEPExit",
        "primary.portal.enrollmentWizard.cancel",
        "primary.portal.applicationFlow.confirmation.completeEither",
        "primary.portal.applicationFlow.confirmation.yourRecords",
        "primary.portal.applicationFlow.confirmation.signRequestSentWarning",
        "primary.portal.pda.form.pda",
        "primary.portal.pda.form.pdaFull",
        "primary.portal.common.or",
        "primary.portal.common.view",
        "primary.portal.common.print",
        "primary.portal.common.finish",
        "primary.portal.common.continue",
        "primary.portal.enrollment.complete.special",
        "primary.portal.enrollment.complete.review",
        "primary.portal.enrollment.complete.period",
        "primary.portal.enrollment.complete.exit",
        "primary.portal.applicationFlow.confirmation.confirmationTitle",
        "primary.portal.applicationFlow.confirmation.viewCoverageSummary",
        "primary.portal.applicationFlow.confirmation.returnToEmployees",
        "primary.portal.applicationFlow.confirmation.enrollmemtComplete",
        "primary.portal.applicationFlow.confirmation.oeMaxDate",
        "primary.portal.applicationFlow.confirmation.newCoverageDate",
        "primary.portal.applicationFlow.confirmation.applicationComplete",
        "primary.portal.applicationFlow.confirmation.contactAgent",
        "primary.portal.applicationFlow.confirmation.applicationForInsurance",
        "primary.portal.applicationFlow.confirmation.pin",
        "primary.portal.applicationFlow.confirmation.applicationSigned",
        "primary.portal.applicationFlow.confirmation.agentElectronicallySigned",
        "primary.portal.applicationFlow.confirmation.agentSignature",
        "primary.portal.applicationFlow.confirmation.duringPhoneConvers",
        "primary.portal.applicationFlow.confirmation.returnToCustomers",
        "primary.portal.applicationFlow.confirmation.qleApprovedSummaryTitle",
        "primary.portal.applicationFlow.confirmation.qleApprovedSummaryBrief",
        "primary.portal.applicationFlow.confirmation.continuousSummaryTitle",
        "primary.portal.applicationFlow.confirmation.continuousSummaryBrief",
        "primary.portal.applicationFlow.confirmation.yourNewCoverage",
        "primary.portal.applicationFlow.confirmation.viewSignedApplications",
        "primary.portal.applicationFlow.confirmation.total",
        "primary.portal.applicationFlow.confirmation.viewMyCoverage",
        "primary.portal.applicationFlow.confirmation.exitEnrollment",
        "primary.portal.applicationFlow.confirmation.signReqApplication",
        "primary.portal.applicationFlow.confirmation.signReqApplications",
        "primary.portal.applicationFlow.confirmation.applicationSubmitted",
        "primary.portal.applicationFlow.confirmation.applicationsSubmitted",
        "primary.portal.applicationFlow.confirmation.signRequestSuccessHas",
        "primary.portal.applicationFlow.confirmation.signRequestSuccessHave",
        "primary.portal.applicationFlow.confirmation.downloadError",
        "primary.portal.applicationFlow.confirmation.complete",
        "primary.portal.shop.confirmation.dualPlanYear.closeLifeEvent",
        "primary.portal.shop.confirmation.dualPlanYear.lifeEventEnrollmentPeriod",
        "primary.portal.shop.confirmation.dualPlanYear.closeLifeEventContent",
        "primary.portal.shop.confirmation.dualPlanYear.closePeriodExit",
        "primary.portal.shop.confirmation.dualPlanYear.shopCoveragePlan",
        "primary.portal.shop.confirmation.dualPlanYear.updateEnrollments",
        "primary.portal.members.confirmation.dualPlanYear.shopCoverage",
        "primary.portal.members.confirmation.dualPlanYear.exitEnrollment",
        "primary.portal.members.confirmation.dualPlanYear.changeCoverage",
        "primary.portal.members.confirmation.dualPlanYear.coverageUpdates",
        "primary.portal.shop.confirmation.dualPlanYear.lifeEventClosed",
        "primary.portal.shop.confirmation.dualPlanYear.updateFutureEnrollments",
        "primary.portal.members.confirmation.dualPlanYear.coverageChangePara.current",
        "primary.portal.members.confirmation.dualPlanYear.newCoverageChangePara",
        "primary.portal.members.confirmation.dualPlanYear.updateEnrollments.future",
        "primary.portal.shoppingExperience.viewDetails",
        "primary.portal.shop.confirmation.dualPlanYear.newHireQleFutureCoverage",
        "primary.portal.headset.noemailaddress",
        "primary.portal.headset.nomobile",
        "primary.portal.coverage.adjustment",
        "primary.portal.shoppingCart.employerContribution",
        "primary.portal.applicationFlow.confirmation.aflacAflaysCard.header",
        "primary.portal.applicationFlow.confirmation.aflacAflaysCard.content",
        "primary.portal.applicationFlow.confirmation.aflacAflaysCard.linkText",
        "primary.portal.applicationFlow.confirmation.aflacAflaysCard.buttonText",
        "primary.portal.applicationFlow.confirmation.enrollmentSummarySentConfirmation",
    ]);
    signText: string;
    dualPlanYearData: QleOeShopModel;
    SHOP_ENUM = DualPlanYearSettings;
    isQleShop = true;
    isOeShop = true;
    isQleAfterOeEnrollment: boolean;
    isTpi = false;
    tpiLnlMode = false;
    producerIdValue: number;
    memberIdValue: number;
    private readonly unsubscribe$ = new Subject<void>();
    isDualPlanYear = false;
    isQleDuringOeEnrollment = false;
    isQleMemberShop = false;
    oeYear: string;
    qleYear: string;
    isBenefitDollarConfigEnabled = false;
    enrollmentShopButtonLabel: string;
    disableQleButton = false;
    agCarrierId: number;
    isAgPlanOnly = false;
    newHireQle: MemberQualifyingEvent[];
    pdaFormType: FormType;
    isEDeliveryPortalAccessed: boolean;
    isLoading = false;
    @Select(MemberWizardState.GetAllCarriers) allMemberWizardCarriers$: Observable<Carrier[]>;
    @Select(TPIState.GetAllCarriers) allTPICarriers$: Observable<Carrier[]>;
    allCarriers$: Observable<Carrier[]>;
    virginiaFeatureEnabledConfig$: Observable<boolean>;
    virginiaFeatureEnabled$: Observable<boolean>;
    isAgentSelfEnrolled: boolean;
    contactList: MemberContactListDisplay[] = [];
    isDirectFlow = false;
    isAflacAlways$: Observable<boolean>;
    isPinSignature = false;
    isArgus = CarrierId.ADV;
    contactInfo: string;

    constructor(
        private readonly enrollmentService: EnrollmentService,
        private readonly store: Store,
        private readonly sanitizer: DomSanitizer,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly matDialog: MatDialog,
        private readonly appFlowService: AppFlowService,
        private readonly uService: UserService,
        private readonly eService: EnrollmentService,
        private readonly coreService: CoreService,
        private readonly mService: MemberService,
        private readonly benefitOffService: BenefitsOfferingService,
        private readonly dialog: MatDialog,
        private readonly languageService: LanguageService,
        private readonly accountService: AccountService,
        private readonly benefitService: BenefitsOfferingService,
        private readonly datePipe: DatePipe,
        private readonly utilService: UtilService,
        private readonly memberService: MemberService,
        private readonly shoppingService: ShoppingService,
        private readonly staticUtil: StaticUtilService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly tpiService: TpiServices,
        private readonly staticUtilService: StaticUtilService,
        private readonly enrollmentsService: EnrollmentService,
        private readonly dualPlanYearService: DualPlanYearService,
        private readonly sharedService: SharedService,
        private readonly httpClient: HttpClient,
        private readonly shoppingCartService: ShoppingCartDisplayService,
        private readonly dateService: DateService,
        private readonly sendEnrollmentSummaryEmailModalService: SendEnrollmentSummaryEmailModalService<SendEnrollmentSummaryEmailModalComponent>,
    ) {
        this.showPda = false;
        // To set the isAgentSelfEnrolled flag
        this.sharedService
            .checkAgentSelfEnrolled()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((isAgentSelfEnrolled) => (this.isAgentSelfEnrolled = isAgentSelfEnrolled));
        this.contactInfo = this.sendEnrollmentSummaryEmailModalService.email
            ? this.sendEnrollmentSummaryEmailModalService.email
            : this.normalizePhone(this.sendEnrollmentSummaryEmailModalService.phone);
    }

    /**
     * This method helps formatting the phone number if phone number available and is of 10 digit in length
     * @param phoneNumber
     * @returns the input or a formatted input
     */
    normalizePhone(phoneNumber: string) {
        if (phoneNumber) {
            // normalize string and remove all unnecessary characters
            phoneNumber = phoneNumber.replace(NO_NUMERIC_CHAR, BLANK);

            // check if number length equals to 10
            if (phoneNumber.length === TEN) {
                // reformat and return phone number
                return phoneNumber.replace(CHUNK_NUMBER, PHONE_FORMAT);
            }
        }
        return phoneNumber;
    }

    /**
     * Implements Angular's OnInit Life Cycle hook
     * Taking snapshot of SharedState, TPIState, EnrollmentState
     * API getEnrollments, getMemberQualifyingEvents, getPlanYears being called
     */
    ngOnInit(): void {
        this.appFlowService.hideBackButton$.next(true);
        this.staticUtilService
            .cacheConfigEnabled("general.feature.enable.benefitDollars")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((result) => {
                this.isBenefitDollarConfigEnabled = result;
            });
        this.appFlowService.showNextProductFooter$.next({
            nextClick: false,
            data: ConfirmationStepLabels.EXIT_ENROLLMENT,
        });
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
        this.isMember = this.portal === Portals.MEMBER;
        this.agCarrierId = CarrierId.AFLAC_GROUP;
        if (this.router.url.indexOf(AppSettings.TPI) >= 0) {
            this.isTpi = true;
            this.tpiLnlMode = this.tpiService.isLinkAndLaunchMode();
            this.tpiProducerId = this.store.selectSnapshot(TPIState.tpiSsoDetail).user.producerId;
            this.isMember = !this.tpiProducerId;
            this.callBackUrlOnCompletion();
        }
        const mpGroupObj = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
        this.memberId = this.store.selectSnapshot(EnrollmentState.GetMemberId);
        if (!this.mpGroup) {
            this.mpGroup = this.route.snapshot.params?.mpGroupId;
        }
        this.dualPlanYearScenario();
        this.getEnrollmentStateAndMethod();
        this.isAdmin = this.portal === Portals.ADMIN;

        const memberData = this.store.selectSnapshot(EnrollmentState.GetMemberData);
        if (memberData && memberData.info && memberData.info.name) {
            this.memberFirstName = memberData.info.name.firstName;
        }

        if (this.isTpi) {
            this.fetchTpiData();
        }
        this.fetchUserCredential();
        this.utilService.currentForm.pipe(takeUntil(this.unsubscribe$)).subscribe((formSubmitted) => {
            if (
                (formSubmitted.formType === this.PDA || formSubmitted.formType === FormType.PDA_PR) &&
                formSubmitted.formSubmitted === true
            ) {
                this.pdaSubmitted = true;
            }
        });
        this.appFlowService.currentPlanDetails.pipe(takeUntil(this.unsubscribe$)).subscribe((pinDetails) => {
            this.pinDetails = pinDetails;
        });
        // To Do :: Identify Member login
        // this.uService.credential$.subscribe(userData => {});
        this.appFlowService.planAndCart.pipe(takeUntil(this.unsubscribe$)).subscribe((planAndCart) => {
            if (planAndCart) {
                this.planData = planAndCart;
                this.loadTotalCost(this.planData);
            }
            this.isSignatureForSingle = this.planData.length === 1;
            this.signText = this.isSignatureForSingle
                ? this.languageStrings["primary.portal.applicationFlow.confirmation.signReqApplication"]
                : this.languageStrings["primary.portal.applicationFlow.confirmation.signReqApplications"];
        });
        this.appFlowService.planAndCartReview.pipe(takeUntil(this.unsubscribe$)).subscribe((planAndCartReview) => {
            if (planAndCartReview) {
                this.planDataReview = planAndCartReview;
                this.checkAgPlans();
                this.loadTotalCost(this.planDataReview);
            }
        });
        this.staticUtilService
            .cacheConfigEnabled(ConfigName.PR_PDA_TEMPLATE)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((result) => {
                this.isPRPDAConfigEnabled = result;
                this.fetchPDADocs();
            });
        if (this.signRequest && Object.keys(this.signRequest).length) {
            this.signRequestSent = true;
            if (Object.keys(this.signRequest).indexOf("email") >= 0) {
                this.signRequestType = "emailed";
            } else {
                this.signRequestType = "texted";
            }
        }
        forkJoin([
            this.benefitService.getPlanYears(this.mpGroup, false, true),
            this.enrollmentService.getEnrollments(this.memberId, this.mpGroup),
            this.memberService.getMemberQualifyingEvents(this.memberId, this.mpGroup),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((dataList) => {
                this.checkOEPeriod(dataList[0], dataList[1]);
                this.getPlanEnrollmentData(dataList[1]);
                this.getQLEs(dataList[2]);
                this.loadSpinner = false;
            });
        this.sharedService.currentMemberEDeliveryAccess
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((isEDeliveryPortalAccessed) => (this.isEDeliveryPortalAccessed = isEDeliveryPortalAccessed));
        // opening the EDelivery prompt when the user is a member, the delivery preference is paper
        // and the user is coming to the confirmation screen for the first time and Agent is not self enrolling
        const deliveryPreference = memberData?.info?.profile?.correspondenceType;
        if (
            !this.isEDeliveryPortalAccessed &&
            deliveryPreference === CorrespondenceType.PAPER &&
            this.isMember &&
            !this.isAgentSelfEnrolled
        ) {
            this.empoweredModalService.openDialog(EDeliveryPromptComponent, { data: memberData });
        }
        if (
            (!memberData?.info?.registrationStatus ||
                !(
                    memberData.info.registrationStatus === RegistrationStatus.CIAM_BASIC ||
                    memberData.info.registrationStatus === RegistrationStatus.CIAM_FULL
                )) &&
            deliveryPreference === CorrespondenceType.ELECTRONIC &&
            this.enrollmentMethod !== EnrollmentMethod.HEADSET &&
            !this.isAgentSelfEnrolled
        ) {
            this.isLoading = true;
            this.enrollmentService
                .registerCustomer(ActivityPageCode.CONFIRMATION_COMPONENT, this.memberId, this.mpGroup)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (response) => (this.isLoading = false),
                    (error) => (this.isLoading = false),
                );
        }

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

        // TODO - Checking for Direct Path to hide Aflac Always Card EVE-38426
        this.isDirectFlow = this.router.url.indexOf("direct") !== -1;

        // Method to check whether to show Aflac Always Card
        this.checkAflacAlways();
    }

    /**
     * To check if there are only AG plans in enrollment flow
     */
    checkAgPlans(): void {
        if (!this.planData.length) {
            this.isAgPlanOnly = this.planDataReview.every((x) => x.carrierId === this.agCarrierId);
        }
    }

    /**
     * Method to get enrollment information
     */
    getEnrollmentInfo(): void {
        this.totalCost = 0;
        this.confirmationTableData = this.confirmationTableData.map((data) => {
            data.employerCostPerPayPeriod = data.memberCostPerPayPeriod - data.totalCostPerPayPeriod;
            data.paymentLabel = data.plan.characteristics.some(
                (characteristic: string) => characteristic === Characteristics.COMPANY_PROVIDED,
            )
                ? this.languageStrings["primary.portal.coverage.adjustment"]
                : this.languageStrings["primary.portal.shoppingCart.employerContribution"];
            data.planLevelBenefitDollars = data.employerCostPerPayPeriod !== 0;
            const benefitAmount: number = data.employerCostPerPayPeriod;
            const totalCost: number = data.memberCostPerPayPeriod + benefitAmount;
            data.memberCostPerPayPeriod = totalCost > 0 ? totalCost : 0;
            if (data.individualPlan) {
                const individualCost: number = data.individualPlan.cost + benefitAmount;
                data.individualPlan.cost = individualCost > 0 ? individualCost : 0;
                this.totalCost += data.individualPlan.cost;
            } else {
                this.totalCost += data.memberCostPerPayPeriod;
            }
            return {
                ...data,
            };
        });
    }

    /**
     * This method is used to get total cost from plansList
     * @param plansList is an array of SignaturePlan
     */
    loadTotalCost(plansList: SignaturePlan[]): void {
        plansList.forEach((plan) => {
            this.totalCost = this.totalCost + plan.cost;
        });
    }
    /**
     * Check for dual plan year scenario
     */
    dualPlanYearScenario(): void {
        this.dualPlanYearData = this.store.selectSnapshot(DualPlanYearState);
        if (this.dualPlanYearData && this.dualPlanYearData.isDualPlanYear) {
            this.isDualPlanYear = this.dualPlanYearData.isDualPlanYear;
            this.oeYear = this.dualPlanYearData.oeYear;
            this.qleYear = this.dualPlanYearData.qleYear;
            this.isQleAfterOeEnrollment = this.dualPlanYearData.isQleAfterOeEnrollment;
            this.isQleDuringOeEnrollment = this.dualPlanYearData.isQleDuringOeEnrollment;
            if (this.dualPlanYearData.qleEventData && this.dualPlanYearData.qleEventData.length) {
                this.newHireQle = this.dualPlanYearData.qleEventData.filter((qleData) => qleData.type.code === NEW_HIRE);
            }
            if (this.dualPlanYearData.selectedShop === DualPlanYearSettings.QLE_SHOP) {
                if (this.isQleDuringOeEnrollment) {
                    this.languageStrings["primary.portal.shop.confirmation.dualPlanYear.shopCoveragePlan"] = this.languageStrings[
                        "primary.portal.shop.confirmation.dualPlanYear.shopCoveragePlan"
                    ].replace("##planYear##", this.dualPlanYearData.oeYear);
                }
                if (this.isQleAfterOeEnrollment) {
                    if (this.newHireQle && this.newHireQle.length) {
                        this.enrollmentShopButtonLabel =
                            this.languageStrings["primary.portal.shop.confirmation.dualPlanYear.newHireQleFutureCoverage"];
                    } else if (this.qleYear === this.oeYear) {
                        this.enrollmentShopButtonLabel =
                            this.languageStrings["primary.portal.shop.confirmation.dualPlanYear.updateFutureEnrollments"];
                    } else {
                        this.enrollmentShopButtonLabel = this.languageStrings[
                            "primary.portal.shop.confirmation.dualPlanYear.updateEnrollments"
                        ].replace("##planYear##", this.dualPlanYearData.oeYear);
                    }
                }
                this.buttonLabel = this.languageStrings["primary.portal.shop.confirmation.dualPlanYear.closeLifeEvent"];
                this.isQleShop = true;
                this.isOeShop = false;
                this.isQleMemberShop = true;
            } else if (
                this.dualPlanYearData.selectedShop === DualPlanYearSettings.OE_SHOP ||
                this.dualPlanYearData.selectedShop === DualPlanYearSettings.NEW_PY_QLE_SHOP
            ) {
                this.isQleShop = false;
                this.isOeShop = true;
            }
        }
    }

    /**
     * fetching user data from credential
     */
    fetchUserCredential(): void {
        const productData: ProductOffering[] = this.store.selectSnapshot(EnrollmentState.GetProductOfferings);
        const planData: PlanOffering[] = this.store.selectSnapshot(EnrollmentState.GetProductPlanOfferings);
        combineLatest([this.uService.credential$, this.staticUtil.hasPermission(Permission.HYBRID_USER)])
            .pipe(
                tap(([credential, hybridUserPermission]: [ProducerCredential & MemberCredential, boolean]) => {
                    this.producerIdValue = credential.producerId;
                    this.memberIdValue = credential.memberId;
                    this.firstName = this.isTpi ? this.firstName : credential.name.firstName;
                    this.memberInfo = this.portal === Portals.MEMBER ? credential : "";
                    this.getEnrollmentStateAndMethod();
                    if (credential.producerId && !credential.memberId) {
                        this.enrollmentMethod = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment).enrollmentMethod;
                    }
                    if (credential.producerId && credential.memberId) {
                        this.enrollmentMethod = EnrollmentMethod.FACE_TO_FACE;
                    }
                    this.fetchCallCenterData(credential, hybridUserPermission);
                    if (this.enrollmentMethod === EnrollmentMethod.HEADSET) {
                        this.isHeadset = true;
                    }
                    if (this.enrollmentMethod === EnrollmentMethod.VIRTUAL_FACE_TO_FACE) {
                        this.empoweredModalService.openDialog(ScreenHandOffComponent, { data: false });
                    }
                }),
                switchMap(() => {
                    if (this.isHeadset) {
                        return this.memberService.getMemberContacts(+this.memberId, this.mpGroup.toString());
                    }
                    return of(null);
                }),
                tap((memberContact) => {
                    this.contactList = memberContact && this.utilService.getFormattedMemberContacts(memberContact);
                }),
                filter(() => this.isMember),
                switchMap(() => {
                    this.loadSpinner = true;
                    return this.getMemberEnrollmentRequiredData(productData, planData);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(() => {
                this.loadSpinner = false;
                this.configureCoverage(this.getEnrollmentData, planData, productData);
            });
    }

    /**
     * fetching call center data
     * @param credential - ProducerCredential is passed
     * @param hybridPermission - call center permission value
     */
    fetchCallCenterData(credential: ProducerCredential, hybridPermission: boolean): void {
        if (credential.name) {
            this.firstName = credential.name.firstName ? credential.name.firstName : "";
            this.lastName = credential.name.lastName ? credential.name.lastName : "";
        }
        if (credential.producerId && credential.callCenterId) {
            if (hybridPermission) {
                this.isHybridUser = true;
            } else {
                this.isCallCenterAgent = true;
            }
            if (this.enrollmentMethod === EnrollmentMethod.CALL_CENTER || this.enrollmentMethod === EnrollmentMethod.PIN_SIGNATURE) {
                this.isPinSignature = true;
                this.showPin = true;
            }
        }
    }
    /**
     * fetching tpi data for tpi flow
     */
    fetchTpiData(): void {
        this.firstName = this.store.selectSnapshot(TPIState.tpiSsoDetail).user.name.firstName;
        this.lastName = this.store.selectSnapshot(TPIState.tpiSsoDetail).user.name.lastName;
        if (!this.isMember) {
            this.enrollmentMethod = this.store.selectSnapshot(EnrollmentState.GetEnrollmentMethod);
        }
        if (this.enrollmentMethod === EnrollmentMethod.HEADSET) {
            this.isHeadset = true;
        }
    }
    /**
     * maps enrollment data based on plans signed in siganture page
     * @param enrollments enrollments of member is passed
     */
    getPlanEnrollmentData(enrollments: Enrollments[]): void {
        const plans: SignaturePlan[] = this.planData;
        let currentEnrollments: Enrollments[] = [];
        this.planEnrollmentData = [];
        if (Array.isArray(this.planData)) {
            this.planData.forEach((planData) => {
                const stackablePlans = plans.filter((plan) => plan.planOfferingId === planData.planOfferingId);
                if (!this.planEnrollmentData.filter((data) => data.planOfferingId === planData.planOfferingId).pop()) {
                    const enrollmentList = enrollments
                        .filter((enrollment) => enrollment.planOfferingId === planData.planOfferingId)
                        .sort((e1, e2) => e2.id - e1.id);
                    currentEnrollments = enrollmentList.slice(0, stackablePlans.length);
                    currentEnrollments.forEach((enrollment) => {
                        this.planEnrollmentData.push({
                            planId: planData.planId,
                            planName: planData.planName,
                            productName: planData.productName,
                            cartId: planData.cartId,
                            enrollmentId: enrollment.id,
                            planOfferingId: enrollment.planOfferingId,
                            carrierId: planData.carrierId,
                        });
                    });
                }
            });
        }
        if (this.planDataReview) {
            this.planDataReview.forEach((data) => {
                data.enrollmentId = enrollments
                    .filter((enr) => enr.planOfferingId === data.planOfferingId)
                    .map((value) => value.id)
                    .pop();
            });
        }
    }
    /**
     * Method to check OE period
     * @param data : Plan years to check oe period
     * @param enrollments : enrollments to get new coverage date
     */
    checkOEPeriod(data: any, enrollments: any): void {
        const pyDates = [];
        if (data.length) {
            data.forEach((ele) => {
                if (
                    this.dateService.getIsAfterOrIsEqual(
                        this.currentDate,
                        this.dateService.toDate(ele.enrollmentPeriod.effectiveStarting),
                    ) &&
                    this.dateService.isBeforeOrIsEqual(this.currentDate, this.dateService.toDate(ele.enrollmentPeriod.expiresAfter))
                ) {
                    pyDates.push(this.dateService.toDate(ele.enrollmentPeriod.expiresAfter));
                    this.oeMaxDate = this.datePipe.transform(Math.max.apply(null, pyDates), AppSettings.DATE_FORMAT_MM_DD_YYYY);
                    this.oeFlag = true;
                }
            });
        }

        if (enrollments.length) {
            const enrollmentsData = enrollments.sort(
                (a: any, b: any) =>
                    this.dateService.toDate(b.validity.effectiveStarting).getTime() -
                    this.dateService.toDate(a.validity.effectiveStarting).getTime(),
            );
            if (enrollmentsData.length) {
                const newCoverage = enrollmentsData.find(
                    (enrollment) =>
                        (enrollment.status === StatusType.APPROVED || enrollment.status === StatusType.PENDING) &&
                        this.dateService.isBeforeOrIsEqual(
                            this.currentDate,
                            this.dateService.toDate(enrollment.validity.effectiveStarting),
                        ),
                );
                if (newCoverage) {
                    this.newCoverageDate = this.datePipe.transform(
                        this.dateService.toDate(newCoverage.validity.effectiveStarting),
                        DateFormat.MONTH_DAY_YEAR,
                    );
                }
            }
        }
    }

    /**
     * To get the qle id from store and set the qleFlag
     * @param qleData QLE details
     */
    getQLEs(qleData: any[]): void {
        const qleId = this.store.selectSnapshot(SharedState.getQleIdToCloseSEP);
        if (qleId && qleId.qleIdToCloseSEP !== 0 && qleData.length) {
            this.qleToCloseSEP = qleData.find((qle) => qle.id === qleId.qleIdToCloseSEP);
            this.isQLEApproved = this.qleToCloseSEP.status === StatusType.APPROVED;
            this.isQLEPending = this.qleToCloseSEP.status === StatusType.PENDING;
            this.isQLEInProgess = this.qleToCloseSEP.status === StatusType.INPROGRESS;
            this.qleEndDate = this.datePipe.transform(this.dateService.toDate(this.qleToCloseSEP.enrollmentValidity?.expiresAfter));
        } else {
            if (qleData.length) {
                this.memberEvents = qleData
                    .filter((event) => this.getApprovedPendingQLEs(event))
                    .sort(
                        (a: any, b: any) => this.dateService.toDate(b.eventDate).getTime() - this.dateService.toDate(a.eventDate).getTime(),
                    );
            }
            if (this.memberEvents) {
                this.qleToCloseSEP = this.memberEvents.find((event) => event.status === StatusType.PENDING);
                this.isQLEPending = Boolean(this.qleToCloseSEP);
                this.qleToCloseSEP = !this.qleToCloseSEP ? this.memberEvents.find((event) => event.status === StatusType.INPROGRESS) : null;
            }
            if (this.qleToCloseSEP && this.isQLEPending === false) {
                this.isQLEInProgess = true;
            } else {
                if (this.memberEvents) {
                    this.qleToCloseSEP = this.memberEvents.find((event) => event.status === StatusType.APPROVED);
                }
                this.isQLEApproved = this.qleToCloseSEP ? true : false;
            }
            this.qleEndDate = this.qleToCloseSEP
                ? this.datePipe.transform(
                      this.dateService.toDate(this.qleToCloseSEP.enrollmentValidity?.expiresAfter || Date.now()),
                      DateFormat.MONTH_DAY_YEAR,
                  )
                : "";
        }
        this.qleFlag = this.isQLEPending || this.isQLEApproved || this.isQLEInProgess;
        this.loadSpinner = false;
        this.tpiFooterButtons();
    }

    /**
     * To check validity of qle based on enrollment period
     * @param event QLE data
     * @return true or false based on validity
     */
    getApprovedPendingQLEs(event: MemberQualifyingEvent): boolean {
        if (
            this.dateService.getIsAfterOrIsEqual(this.currentDate, this.dateService.toDate(event.enrollmentValidity?.effectiveStarting)) &&
            this.dateService.isBeforeOrIsEqual(this.currentDate, this.dateService.toDate(event.enrollmentValidity?.expiresAfter))
        ) {
            return true;
        }
        return false;
    }
    displayCoverageButton(): boolean {
        if (this.oeFlag && !this.qleFlag) {
            return true;
        }
        if (this.isQLEApproved) {
            return true;
        }
        return false;
    }

    /**
     * Function to return partner account type
     */
    getPartnerAccountType(): void {
        let account: string;
        this.getAccount()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((res: Accounts) => {
                this.isCompletePdaPartnerAccountType =
                    res.partnerAccountType === PartnerAccountType.UNION ||
                    res.partnerAccountType === PartnerAccountType.ASSOCIATION ||
                    res.partnerAccountType === PartnerAccountType.NONPAYROLL;
                account = res.partnerAccountType;
                this.getPdaTPIData(account);
            });
    }

    /**
     * Function to get the data for TPI, we have multiple business scenarios, so we need to check all the conditions.
     * @param accountData Account type
     * @returns void
     */
    getPdaTPIData(accountData: string): void {
        if (!this.isMember) {
            this.enrollmentMethod = this.store.selectSnapshot(EnrollmentState.GetEnrollmentMethod);
            this.enrollmentState = this.store.selectSnapshot(EnrollmentState.GetEnrollmentState);
            this.loadSpinner = true;
            this.isDirectAcc = Boolean(accountData.toLowerCase() === AppSettings.DIRECT);
            this.loadSpinner = false;
            this.showPda = this.appFlowService.iteratePdaAccount(accountData, this.enrollmentMethod, this.enrollmentState);
        } else {
            this.checkMemberId(accountData);
        }
    }

    /**
     * @returns Observable with the account details
     */
    getAccount(): Observable<Accounts> {
        return this.store
            .select(AccountInfoState.getMpGroupId)
            .pipe(
                switchMap((groupId) =>
                    groupId === String(this.mpGroup)
                        ? this.store.select(AccountInfoState.getAccountInfo)
                        : this.accountService.getAccount(this.mpGroup),
                ),
            );
    }

    /**
     * To get the enrollment state and method, we have multiple business scenarios, so we need to check all the conditions.
     * @returns void
     */
    getEnrollmentStateAndMethod(): void {
        if (this.planObject?.reinstate && this.fromApplicationFlow) {
            this.isReinstate = true;
        }
        if (this.isTpi) {
            this.getPartnerAccountType();
        } else {
            let account: string = null;
            this.getAccount()
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((res: Accounts) => {
                    this.isCompletePdaPartnerAccountType =
                        res.partnerAccountType === PartnerAccountType.UNION ||
                        res.partnerAccountType === PartnerAccountType.ASSOCIATION ||
                        res.partnerAccountType === PartnerAccountType.NONPAYROLL;
                    account = res.partnerAccountType;
                    if (this.producerIdValue) {
                        this.checkProducerId(account);
                    }
                    if (this.memberIdValue) {
                        this.checkMemberId(account);
                    }
                });
        }
    }
    /**
     * To get the enrollment state and method based on memberId credential
     * @param account Account type
     * @return void
     */
    checkMemberId(account: string): void {
        const memberContact = this.store.selectSnapshot(EnrollmentState.GetMemberContact);
        if (memberContact && PdaAccount.PAYROLL === account && memberContact.address.state === RESIDENT_STATE.PUERTO_RICO) {
            this.showPda = true;
        }
    }
    /**
     * To get the enrollment state and method based on producerId credential
     * @param account Account type
     * @returns void
     */
    checkProducerId(account: string): void {
        const enrollment = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment);
        if (enrollment) {
            this.enrollMethod = !(enrollment.enrollmentMethod === null || enrollment.enrollmentMethod === undefined)
                ? enrollment.enrollmentMethod
                : "";
            this.enrollmentState = !(
                enrollment.enrollmentStateAbbreviation === null || enrollment.enrollmentStateAbbreviation === undefined
            )
                ? enrollment.enrollmentStateAbbreviation
                : "";
            this.loadSpinner = true;
            this.isDirectAcc = Boolean(account.toLowerCase() === AppSettings.DIRECT);
            this.loadSpinner = false;
            this.showPda = this.appFlowService.iteratePdaAccount(account, this.enrollMethod, this.enrollmentState);
        }
    }
    /**
     * Method to configure coverages
     * @param enrollments - Enrollments of the member
     * @param planOfferings - Plan data
     * @param productOfferings - Product data
     */
    configureCoverage(enrollments: Enrollment[], planOfferings: PlanOffering[], productOfferings: ProductOffering[]): void {
        if (planOfferings.length !== 0 && enrollments.length !== 0) {
            let cost = 0;
            const coverageArray = [];
            enrollments.forEach((eplan, index) => {
                const planOffering: PlanOffering = planOfferings.find((x) => x.plan.id === eplan.plan.id);
                if (planOffering) {
                    const coverageObject: any = { ...planOffering };
                    coverageObject.product = productOfferings.find((x) => x.product.id === planOffering.plan.productId);
                    if (
                        eplan.coverageLevel.id &&
                        (eplan.validity.expiresAfter === undefined ||
                            this.dateService.checkIsAfter(this.dateService.toDate(eplan.validity.expiresAfter), new Date().setHours(0))) &&
                        this.dateService.getIsAfterOrIsEqual(
                            this.dateService.toDate(eplan.validity.effectiveStarting),
                            new Date().setHours(0),
                        )
                    ) {
                        const plans = this.planData.filter((plan) => plan.planOfferingId === eplan.planOfferingId);
                        if (eplan.plan.characteristics.includes(Characteristics.STACKABLE)) {
                            const stackableEnrollmentIndex = enrollments
                                .filter((enrollment) => enrollment.planOfferingId === eplan.planOfferingId)
                                .findIndex((enrollment) => enrollment.id === eplan.id);
                            coverageObject.individualPlan = plans[stackableEnrollmentIndex];
                        } else {
                            coverageObject.individualPlan = plans[0];
                        }
                        coverageObject.coverageLevel = eplan.coverageLevel;
                        coverageObject.carrier = planOffering.plan.carrier;
                        coverageObject.validity = eplan.validity;
                        coverageObject.memberCostPerPayPeriod = eplan.memberCostPerPayPeriod;
                        coverageObject.totalCostPerPayPeriod = eplan.totalCostPerPayPeriod;
                        cost += eplan.memberCostPerPayPeriod;
                        coverageObject.eid = eplan.id;
                        if (this.planDataReview) {
                            coverageObject.agPlan = this.planDataReview.find(
                                (plan) => plan.carrierId === CarrierId.AFLAC_GROUP && plan.planOfferingId === eplan.planOfferingId,
                            );
                        }
                        coverageObject.carrierId = eplan.plan.carrierId;
                        coverageArray.push(coverageObject);
                    }
                }
                if (index === enrollments.length - 1) {
                    combineLatest([this.virginiaFeatureEnabled$, this.allCarriers$])
                        .pipe(
                            tap(([virginiaEnabled, allCarriers]) => {
                                this.confirmationTableData = coverageArray.map((coverage) => {
                                    const carrierObj = allCarriers.find((carrier) => coverage.carrierId === carrier.id);
                                    if (!carrierObj) {
                                        return { ...coverage, carrierName: coverage.plan.carrierNameOverride };
                                    }

                                    return virginiaEnabled && carrierObj.legalName
                                        ? { ...coverage, legalName: carrierObj.legalName, carrierName: carrierObj.name }
                                        : { ...coverage, carrierName: carrierObj.name };
                                });
                            }),
                        )
                        .subscribe();
                }
            });
        }
        if (this.isBenefitDollarConfigEnabled) {
            this.getEnrollmentInfo();
        }
        this.loadSpinner = false;
    }

    /**
     * To fetch coverage details from getMemberCoverageDetails API, display details on ViewPlanDetails pop up
     * @param enrollmentId number EnrollmentId
     */
    viewPlanDetailsDialog(enrollmentId: number): void {
        this.appFlowService
            .getMemberCoverageDetailsAPI(this.memberId, null, enrollmentId, this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response: MemberCoverageDetails) => {
                const dialogConfig = new MatDialogConfig();
                dialogConfig.data = response;
                this.empoweredModalService.openDialog(ViewPlanDetailsComponent, dialogConfig);
            });
    }

    // To view the signed application in Confirmation page
    viewSignedApplication(enrollmentID: number, planName: string): void {
        this.loadSpinner = true;
        this.enrollmentService
            .downloadSignedApplication(this.memberId, enrollmentID, this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response: any) => {
                    this.loadSpinner = false;
                    const signedBlob = new Blob([response], { type: "text/html" });
                    this.signedFileURL = window.URL.createObjectURL(signedBlob);

                    /*
                    source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/msSaveOrOpenBlob
                    msSaveorOpenBlob() and msSaveBlob() are non-standard. It is warned not to use these in production sites.
                    Typescript won't know this is a thing, so we have to use Type Assertion
                    */
                    if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) {
                        (window.navigator as any).msSaveOrOpenBlob(signedBlob, this.filename);
                    } else {
                        this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.signedFileURL);
                        const data = {
                            signedFileURL: this.signedFileURL,
                            safeUrl: this.safeUrl,
                            planName: planName,
                        };

                        const dialogConfig = new MatDialogConfig();
                        dialogConfig.data = data;
                        this.matDialog.open(ApplicationPdfDialogComponent, dialogConfig);
                    }
                },
                (error: any) => {
                    this.loadSpinner = false;
                    if (error?.status === ServerErrorResponseCode.RESP_503) {
                        this.downloadError = true;
                        this.errorMessage = this.languageService.fetchSecondaryLanguageValue(
                            "secondary.portal.callCenter.8x8.api.common.error.message",
                        );
                    }
                },
            );
    }

    /**
     * Open close QLE pop-up
     */
    openDialog(): void {
        if (
            !this.disableQleButton &&
            ((!this.isSEPClosed && this.isMember) ||
                (this.dualPlanYearData?.isDualPlanYear && this.dualPlanYearData?.selectedShop === DualPlanYearSettings.QLE_SHOP))
        ) {
            this.closeSepDialogRef = this.empoweredModalService.openDialog(CloseSepPopupComponent, {
                data: {
                    qle: this.qleToCloseSEP,
                    memberInfo: this.memberInfo,
                    dualRollover: this.qleFlag && this.oeFlag,
                    qleFlag: this.qleFlag,
                    oeFlag: this.oeFlag,
                    dualPlanYearData: this.dualPlanYearData ? this.dualPlanYearData : null,
                    memberId: this.memberId ? this.memberId : null,
                    mpGroup: this.mpGroup ? this.mpGroup : null,
                },
            });
            this.closeSepDialogRef.afterClosed().subscribe((action) => {
                if (action === "updated") {
                    this.isSEPClosed = true;
                    this.store.dispatch(new SetIdToCloseSEP(0));
                    this.store.dispatch(new IsQleShop(defaultState));
                    this.buttonLabel = this.dualPlanYearData?.isDualPlanYear
                        ? this.languageStrings["primary.portal.shop.confirmation.dualPlanYear.lifeEventClosed"]
                        : this.languageStrings["primary.portal.shop.confirmation.dualPlanYear.specialEventClosed"];
                    if (this.qleToCloseSEP && !this.dualPlanYearData?.isDualPlanYear) {
                        this.router.navigate(["member/coverage/life-events/life-events"]);
                    }
                    this.disableQleButton = true;
                }
            });
        } else if (!this.isMember && !this.disableQleButton) {
            this.changedQLE.eventDate = this.datePipe.transform(this.qleToCloseSEP.eventDate, AppSettings.DATE_FORMAT_YYYY_MM_DD);
            this.changedQLE.enrollmentValidity = {
                expiresAfter: this.datePipe.transform(this.dateService.subtractDays(new Date(), ONE_DAY), DateFormats.YEAR_MONTH_DAY),
                effectiveStarting: this.datePipe.transform(this.dateService.subtractDays(new Date(), ONE_DAY), DateFormats.YEAR_MONTH_DAY),
            };
            this.changedQLE.adminComment = this.qleToCloseSEP.adminComment;
            this.changedQLE.coverageStartDates = [];
            this.changedQLE.status = StatusType.APPROVED;
            this.changedQLE.documentIds = [];
            if (this.qleToCloseSEP.documents.length > 0) {
                this.qleToCloseSEP.documents.forEach((doc) => {
                    this.changedQLE.documentIds.push(doc.id);
                });
            } else {
                this.changedQLE.documentIds = [];
            }
            this.changedQLE.typeId = this.qleToCloseSEP.type.id;
            this.memberService
                .updateMemberQualifyingEvent(this.memberId, this.qleToCloseSEP.id, this.changedQLE, this.mpGroup)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((res) => {
                    this.isSEPClosed = true;
                    this.store.dispatch(new SetIdToCloseSEP(0));
                    this.buttonLabel = this.languageStrings["primary.portal.shop.confirmation.dualPlanYear.specialEventClosed"];
                });
        }
    }

    /**
     * To close dialog if open
     */
    closeDialog(): void {
        this.dialogRef.close();
    }

    /**
     * Function to route to proper URL based TPI flow condition
     */
    exitEnrollment(): void {
        if (this.isTpi) {
            if (this.tpiLnlMode) {
                this.router.navigate(["/tpi/shop"]);
            } else {
                this.router.navigate(["/tpi/exit"]);
            }
        } else {
            this.router.navigate(["member/home"]);
        }
    }
    /**
     * calls download application to open in modal
     * @param planName Plan name
     * @param enrollmentId enrollment id of selected pdf
     */
    getEnrollmentId(planName: string, enrollmentId: number): void {
        this.planName = planName;
        this.viewSignedApplication(enrollmentId, planName);
    }
    goToEmployees(): void {
        let url = "";
        if (this.isDirectAcc) {
            url = `producer/direct/customers/${this.mpGroup}`;
        } else {
            url = `producer/payroll/${this.mpGroup}/dashboard/employees`;
        }
        if (this.planObject.reinstate) {
            this.closeForm.emit();
        }
        this.router.navigate([url]);
    }

    goToMyCoverage(): void {
        let url = "";
        if (this.isMember && !this.isTpi) {
            url = "member/coverage/enrollment/benefit-summary/coverage-summary";
        } else if (this.isTpi) {
            url = "tpi/coverage-summary";
        } else {
            url = this.isDirectAcc
                ? `producer/direct/customers/${this.mpGroup}/${this.memberId}/coverage-summary`
                : `producer/payroll/${this.mpGroup}/member/${this.memberId}/enrollment/benefit-summary/coverage-summary`;
        }
        if (this.planObject.reinstate) {
            this.closeForm.emit();
        }
        this.router.navigate([url]);
    }
    /**
     * Close life event call
     */
    closeLifeEvent(): void {
        this.empoweredModalService.openDialog(CloseLifeEventPopupComponent);
    }

    /**
     * Fetch completed PDA documents of particular member
     */
    fetchPDADocs(): void {
        let formType = FormType.PDA;
        if (
            this.isPRPDAConfigEnabled &&
            this.planObject &&
            this.planObject.application &&
            this.planObject.application.cartData &&
            this.planObject.application.cartData.enrollmentState &&
            this.planObject.application.cartData.enrollmentState === CompanyCode.PR
        ) {
            formType = FormType.PDA_PR;
        }
        this.subscriptions.push(
            this.mService.getMemberFormsByType(this.memberId, formType, this.mpGroup.toString(), AppSettings.COMPLETED).subscribe((res) => {
                if (res.length) {
                    if (res.length > 1) {
                        const pdaIdArray = res.map((pda) => pda.id);
                        this.pdaId = Math.max(...pdaIdArray);
                        this.pdaFormType = res.find((pdaData) => pdaData.id === this.pdaId).formType;
                    } else if (res.length === 1) {
                        this.pdaId = res[0].id;
                        this.pdaFormType = res[0].formType;
                    }
                }
            }),
        );
    }

    /**
     * Method to download PDA form
     */
    downloadForm(): void {
        this.loadSpinner = true;
        this.subscriptions.push(
            this.mService.downloadMemberForm(this.memberId, this.pdaFormType, this.pdaId, this.mpGroup.toString()).subscribe(
                (response) => {
                    this.loadSpinner = false;
                    const formBlob = new Blob([response], {
                        type: "text/html",
                    });

                    /*
                        source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/msSaveOrOpenBlob
                        msSaveorOpenBlob() and msSaveBlob() are non-standard. It is warned not to use these in production sites.
                        Typescript won't know this is a thing, so we have to use Type Assertion
                        */
                    if ((window.navigator as any).msSaveOrOpenBlob) {
                        (window.navigator as any).msSaveOrOpenBlob(formBlob);
                    } else {
                        const formFileURL = window.URL.createObjectURL(formBlob);
                        window.open(formFileURL, "_blank");
                    }
                },
                (error: any) => {
                    this.loadSpinner = false;
                },
            ),
        );
    }

    /**
     * Open PDA form dialog
     */
    openPda(): void {
        const dialogConfig = {
            data: {
                mpGroupId: this.mpGroup,
                memberId: this.memberId,
                producerId: this.isTpi ? this.tpiProducerId : this.producerIdValue,
                isDocument: false,
                isOwnAccount: true,
                pinDetails: this.pinDetails ? this.pinDetails : null,
            },
        };
        this.empoweredModalService
            .openDialog(NewPdaComponent, dialogConfig)
            .afterClosed()
            .pipe(
                filter((isClosed) => !!isClosed),
                switchMap(() => {
                    if (this.isHeadset) {
                        return this.empoweredModalService
                            .openDialog(SendApplicantPdaComponent, {
                                data: {
                                    contactList: this.contactList,
                                    firstName: this.memberFirstName,
                                },
                            })
                            .afterClosed();
                    }
                    return of(null);
                }),
                switchMap((response: SendPdaDialogResponseData) => {
                    if (response?.action === SEND_PDA_APPLICATION) {
                        const requestData: SendReminderMode =
                            response.selectedValue.type === ContactMethodTypes.EMAIL.toLowerCase()
                                ? { email: response.selectedValue.contact }
                                : { phoneNumber: response.selectedValue.contact };

                        return this.shoppingCartService.requestShoppingCartSignature(
                            this.mpGroup,
                            +this.memberId,
                            requestData,
                            PendingReasonForPdaCompletion.PDA,
                        );
                    }
                    return of(null);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        this.subscriptions.push(
            this.utilService.currentForm.subscribe((formSubmitted) => {
                if (
                    (formSubmitted.formType === this.PDA || formSubmitted.formType === FormType.PDA_PR) &&
                    formSubmitted.formSubmitted === true
                ) {
                    this.pdaSubmitted = true;
                    this.fetchPDADocs();
                }
            }),
        );
    }

    exitShopping(): void {
        this.router.navigate([this.STR_MEMBER_HOME]);
    }

    /**
     * This method is used to fetch all member related enrollment, planOffering, productOffering information
     * and set the listing of current coverage application in member portal
     * @param productData - Product Offering information
     * @param planData - Plan Offering information
     * @returns {Observable<void>}
     */
    getMemberEnrollmentRequiredData(productData: ProductOffering[], planData: PlanOffering[]): Observable<void> {
        this.loadSpinner = true;
        this.payFrequency = this.store.selectSnapshot(EnrollmentState.GetPayFrequency);
        return forkJoin([
            this.eService.getEnrollments(this.memberId, this.mpGroup),
            this.mService.getMemberQualifyingEvents(this.memberId, this.mpGroup),
            this.benefitOffService.getPlanYears(this.mpGroup, true),
        ]).pipe(
            tap(([enrollments, qualifyingEvents, planYears]) => {
                this.getEnrollmentData = enrollments.filter(
                    (dataItem) =>
                        this.planData.find(({ planOfferingId }) => dataItem.planOfferingId === planOfferingId) ||
                        (Array.isArray(this.planDataReview) && this.planDataReview.some(({ planId }) => dataItem.plan.id === planId)),
                );
                this.qleData = qualifyingEvents;
                this.planYear = planYears;
                if (productData.length && planData.length && this.payFrequency) {
                    this.configureCoverage(this.getEnrollmentData, planData, productData);
                }
                this.loadSpinner = false;
            }),
            filter((res) => productData.length === 0 || planData.length === 0 || !this.payFrequency),
            switchMap((res) => this.getRequiredData(this.mpGroup, productData, planData)),
            catchError((error) => of(error)),
        );
    }
    /**
     * This method is used to fetch required data of product offerings and plan-offering if data is not present
     * @param groupId is the mpGroup id
     * @param productArray is the product-offering array which will store productOffering[]
     * @param planArray is the plan-offering array which will store planOffering[]
     *
     * @returns array of Observable<ProductOffering | [Carrier[], ProductOffering]>
     */
    getRequiredData(
        groupId: number,
        productArray: ProductOffering[],
        planArray: PlanOffering[],
    ): Observable<ProductOffering | [Carrier, ProductOffering]>[] {
        const offeringObservables: Observable<ProductOffering | [Carrier, ProductOffering]>[] = [];
        this.getEnrollmentData.map((ele) => {
            offeringObservables.push(
                this.shoppingService.getPlanOffering(ele.planOfferingId, groupId).pipe(
                    tap((planOff) => {
                        this.loadSpinner = true;
                    }),
                    switchMap((planOff) => {
                        if (!planOff.plan.carrierId) {
                            return forkJoin([
                                this.coreService.getCarrier(planOff.plan.carrierId),
                                this.shoppingService.getProductOffering(planOff.productOfferingId),
                            ]).pipe(
                                tap((dataList) => {
                                    planOff[this.STR_CARRIER] = dataList[0];
                                    planArray.push(planOff);
                                    productArray.push(dataList[1]);
                                }),
                            );
                        }
                        return this.shoppingService.getProductOffering(planOff.productOfferingId).pipe(
                            tap((pdata) => {
                                planArray.push(planOff);
                                productArray.push(pdata);
                            }),
                        );
                    }),
                ),
            );
        });
        return offeringObservables;
    }

    /**
     * The method will route to Open Enrollment shop page.
     */
    shopForOpenEnrollmentYear(): void {
        this.subscriptions.push(
            this.dualPlanYearService.dualPlanYear(this.memberId, this.mpGroup).subscribe(() => {
                // eslint-disable-next-line max-len
                const url = `producer/payroll/${this.mpGroup}/member/${this.memberId}/enrollment/quote-shop/${this.mpGroup}/specific/${this.memberId}`;
                this.store.dispatch(new IsQleShop({ selectedShop: this.SHOP_ENUM.OE_SHOP }));
                this.router.navigate([url]);
            }),
        );
    }
    /**
     * to route to next plan year wizard welcome page for mmp
     * @param nextQle : set selected shop to new plan year qle if true
     */
    shopForNextYear(nextQle: boolean): void {
        this.dualPlanYearService.setSelectedShop(nextQle ? DualPlanYearSettings.NEW_PY_QLE_SHOP : DualPlanYearSettings.OE_SHOP);
        this.router.navigateByUrl("/", { skipLocationChange: true }).then(() => this.router.navigate(["member/wizard/enrollment/shop"]));
    }

    /**
     * To set TPI footer buttons on confirmation screen
     */
    tpiFooterButtons(): void {
        if (!this.isMember && !this.isReinstate && this.isOeShop) {
            this.appFlowService.showNextProductFooter$.next({
                nextClick: true,
                data: ConfirmationStepLabels.VIEW_COVERAGE_SUMMARY,
            });
        } else if (
            this.isMember &&
            !this.isReinstate &&
            (!this.qleFlag || (this.tpiLnlMode && this.isTpi) || (this.isOeShop && this.isDualPlanYear))
        ) {
            this.appFlowService.showNextProductFooter$.next({
                nextClick: true,
                data: ConfirmationStepLabels.VIEW_MY_COVERAGE,
            });
        }
    }

    /**
     * Function to consume the callback api on completion of enrollment
     * @returns void
     */
    callBackUrlOnCompletion(): void {
        const callbackUrl = this.store.selectSnapshot(TPIState.tpiSsoDetail).callback;
        if (callbackUrl) {
            this.httpClient
                .get(callbackUrl)
                .pipe(
                    takeUntil(this.unsubscribe$),
                    catchError((error) => of(error)),
                )
                .subscribe();
        }
    }

    /**
     * Method to check Aflac Always
     * @returns void
     */
    checkAflacAlways(): void {
        this.isAflacAlways$ = combineLatest([
            this.staticUtilService.cacheConfigs([
                this.isTpi ? ConfigName.REVISE_AFLAC_ALWAYS_FEATURE_TPI : ConfigName.REVISE_AFLAC_ALWAYS_FEATURE_ENABLE,
                ConfigName.AFLAC_ALWAYS_EXCLUDED_PRODUCTS,
                ConfigName.AFLAC_ALWAYS_INELIGIBLE_STATE,
            ]),
            this.accountService.getAccount(this.mpGroup.toString()),
            this.accountService.getGroupAttributesByName(
                [AccountTypes.ACH_ACCOUNT, AccountTypes.LIST_BILL_ACCOUNT, AccountTypes.EBS_ACCOUNT],
                this.mpGroup,
            ),
            this.coreService.getProducts(),
        ]).pipe(
            map(([[reviseAflacAlwaysConfig, excludedProductCodes, ineligibleStates], account, groupAttributesByName, allProducts]) => {
                const isEligibleState = this.isAflacAlwaysEligibleState(ineligibleStates.value.split(COMMA));
                // If Revise Aflac Always feature config is off, don't show Aflac Always card
                if (!this.staticUtilService.isConfigEnabled(reviseAflacAlwaysConfig) || !isEligibleState) {
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

                    // Get the AFLAC ALWAYS excluded product list from config
                    const prodCodeList = excludedProductCodes.value.split(COMMA);
                    const excludedProductList = allProducts.filter((product) => prodCodeList.some((code) => code === product.code));

                    // If only Life plans do not show show AA Card
                    const hasOnlyLifeAndOrVASPlan = this.planData.every((plan) =>
                        excludedProductList.some((product) => product.name === plan.productName),
                    );

                    // If only argus plans do not show show AA Card
                    const hasOnlyArgusPlan = this.planData.every((plan) => this.isArgus === plan.carrierId);
                    // Boolean check for qualifying AA criteria
                    // If not EBS/LifeOnlyPlan/Argus/ACH proceed to show/hide card
                    if (!isEbsAccount && !hasOnlyLifeAndOrVASPlan && !isAchAccount && !hasOnlyArgusPlan) {
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
     * To get the enrollment state and method based on memberId credential
     * @param stateList Ineligible state list
     * @return boolean
     */
    isAflacAlwaysEligibleState(stateList: string[]): boolean {
        const memberContact = this.store.selectSnapshot(EnrollmentState.GetMemberContact);
        return !stateList.some((state) => state === memberContact?.address?.state);
    }

    /**
     * It is a ng life cycle hook, used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((x) => x.unsubscribe());
        if (this.showPin) {
            this.appFlowService.changePlanDetails({ pin: null, date: null, signature: null });
        }
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
