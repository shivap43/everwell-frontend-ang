import { ApprovalItemObject } from "@empowered/api";
import {
    AccountsService,
    AccountNameUpdateService,
    MPGroupAccountService,
    TPIRestrictionsForHQAccountsService,
    EmpoweredModalService,
} from "@empowered/common-services";
import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { MatSidenav } from "@angular/material/sidenav";
import { ActivatedRoute, NavigationStart, Router, RouterOutlet } from "@angular/router";
import {
    AccountDetails,
    AflacService,
    DashboardService,
    AccountListService,
    ApprovalRequestStatus,
    BenefitsOfferingService,
    AuthenticationService,
    ProducerService,
    StaticService,
    AccountCarrier,
    CarrierFormSetupStatus,
    ApprovalRequest,
    AppTakerService,
    CheckoutStatus,
    CarrierFormStatus,
    MonSideNavList,
    MenuItem,
    AccessedFrom,
    AccountService,
    AccountCallCenter,
    SearchProducer,
    CensusService,
} from "@empowered/api";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { SharedService } from "@empowered/common-services";
import {
    AddGroup,
    AccountListState,
    AddAccountList,
    AccountInfoState,
    AddAccountInfo,
    SharedState,
    FetchConfigs,
    SetPrivacyForEnroller,
    checkIfAbleToAccessModuleInHQAccount,
    UtilService,
    StaticUtilService,
} from "@empowered/ngxs-store";
import { AccountRefreshModalComponent, OpenToast, ToastModel, WellthiePopupComponent, AgRefreshService } from "@empowered/ui";
import {
    SidenavTab,
    SidenavIcon,
    ClientErrorResponseCode,
    ConfigName,
    MessageCenterLanguage,
    PortalType,
    MicroSiteConfig,
    MicroSiteLanguage,
    Permission,
    AccountImportTypes,
    SidenavRoutes,
    UserPermissionList,
    AppSettings,
    ProducerDetails,
    ToastType,
    Exceptions,
    PlanChoice,
    PartnerAccountType,
    AdminCredential,
    MemberCredential,
    ProducerCredential,
    Accounts,
    VasFunding,
    RefreshEligibleInfo,
    Account,
    PhoneContact,
} from "@empowered/constants";
import { UserService, UserState } from "@empowered/user";
import { Store } from "@ngxs/store";
import { Subscription, Observable, of, iif, combineLatest, forkJoin, EMPTY, Subject } from "rxjs";
import { DeactivateAccountPopupComponent } from "./deactivate-account-popup/deactivate-account-popup.component";
import { MediaMatcher } from "@angular/cdk/layout";
import { AdminApprovalChecklistComponent } from "./admin-approval-checklist/admin-approval-checklist.component";
import { map, mergeMap, finalize, catchError, tap, switchMap, filter, first, takeUntil } from "rxjs/operators";
import { ProducerAuthorizationCodePopupComponent } from "./producer-authorization-code-popup/producer-authorization-code-popup.component";
import { DashboardSidenavComponent } from "./dashboard-sidenav/dashboard-sidenav.component";
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries, max-len
import { SpecialInstructionsComponent } from "../../../../libs/enrollment-options/src/lib/call-center/instructions/special-instructions.component";
import { RegistrationGuideComponent } from "./registration-guide/registration-guide.component";
import { BrandingService } from "@empowered/branding";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { AflacBusinessService } from "@empowered/api-service";
import { CarrierData } from "./admin-approval-checklist/model/carrier-date.model";
import { ConfigurationBooleanValue } from "@empowered/ngrx-store/services/configuration/configuration.model";
import { getSelectedAccount } from "@empowered/ngrx-store/ngrx-states/accounts/accounts.selectors";
import { select } from "@ngrx/store";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { AccountsActions } from "@empowered/ngrx-store/ngrx-states/accounts";
const accountStatus = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
};
const IBO_GROUP_ATTRIBUTE_NAME = "group_benefit_offering_step";
const selectedPortal = {
    MEMBER_PORTAL: "member",
    ADMIN_PORTAL: "admin",
    PRODUCER_PORTAL: "producer",
};

const userId = {
    MEMBER_ID: "memberId",
    ADMIN_ID: "adminId",
    PRODUCER_ID: "producerId",
    CALL_CENTER_ID: "callCenterId",
};

const alertTypes = {
    ALLOWACCESS: "ALLOWACCESS",
    BLOCKCHECKOUT: "BLOCKCHECKOUT",
    ENABLECHECKOUT: "ENABLECHECKOUT",
};

const CALL_CENTER = "callCenter";
const IBO_LANDING_STEP = "1";
const ACCOUNT_PAGE_LIMIT = 1;
const ACCOUNT_THRESHOLD_LIMIT = 1000;
const MBO_GROUP_ATTRIBUTE_NAME = "INITIAL_BO_STATUS";
const MBO_ATTRIBUTE_INDEX = 0;
const MBO_ATTRIBUTE_VALUE = "COMPLETE";
const APPROVAL_REQUEST_INDEX = 1;
const PREREQUISITE_FAILED = "prerequisiteFailed";
const COMMISSION_SPLIT = "commission-split";
const AG = "primary.portal.accounts.accountList.ag";
const SIC_CODE = "SIC code";
const ACCOUNT_TYPE = "Account Type";
enum DashboardWidget {
    EMPLOYEE_WIDGET = "EMPLOYEEWIDGET",
    BENEFITS_OFFERING_WIDGET = "BENEFITSOFFERINGWIDGET",
    ACCOUNT_PROFILE_WIDGET = "ACCOUNTPROFILEWIDGET",
    INVITE_CO_ENROLLERS_WIDGET = "INVITECOENROLLERSWIDGET",
    SEND_BUSINESS_WIDGET = "SENDBUSINESSWIDGET",
}

@Component({
    selector: "empowered-dashboard",
    templateUrl: "./dashboard.component.html",
    styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent implements OnInit, OnDestroy {
    @ViewChild("dashboardSideNav") dashboardSideNav: MatSidenav;
    @ViewChild("rla") routerOutlet: RouterOutlet;
    @ViewChild("accountSideNav") accountSideNav: DashboardSidenavComponent;
    private readonly _mobileQueryListener: () => void;
    destroy$ = new Subject<void>();
    mobileQuery: MediaQueryList;
    isLoading = true;
    accountDetails: AccountDetails;
    accountName: string;
    accountHolderLocation: string;
    accountList = [];
    isDashboard: boolean;
    DETAILS = "details";
    errorMessage: string;
    showErrorMessage: boolean;
    errorMessageArray = [];
    ERROR = "error";
    mpGroup: number;
    refreshAccountSuccessAlertFlag = false;
    isMaintananceLockFlag = false;
    refreshAccountSuccessData = [];
    refreshAccountErrorAlertFlag = false;
    accountListData: any;
    manageAccountButtonFlag: boolean;
    canDeactivateAccount: boolean;
    canReactivateAccount: boolean;
    canRefreshAccount: boolean;
    viewAccountMsg: boolean;
    noLongerViewAccountMsg: boolean;
    viewAccountTimePeriodMsg: boolean;
    resultsLoaded: boolean;
    aflacSupport: string;

    subscriptions: Subscription[] = [];
    inactiveAccountFlag: boolean;
    inactiveAccountmsg: string;
    dashBoardSideNavLogo: string;
    dashBoardSideNavColor: string;
    checkoutEnableFlag = false;
    alertTypeAccess: string;
    alertType: string;
    appTakerPermission = "core.checkout.read.passcode";
    credential$: Observable<AdminCredential | MemberCredential | ProducerCredential>;
    phoneNumbers: PhoneContact[] = [];
    accountImportType = AccountImportTypes;
    producerCheckOutstatusResp: CheckoutStatus;
    dashboardWidget = DashboardWidget;
    OFFERING: string = this.langService.fetchPrimaryLanguageValue("primary.portal.dashboard.offering");
    DASHBOARD: string = this.langService.fetchPrimaryLanguageValue("primary.portal.dashboard.dashboard");
    ACCOUNT_INFO: string = this.langService.fetchPrimaryLanguageValue("primary.portal.dashboard.accountInfo");
    ACCOUNTS: string = this.langService.fetchPrimaryLanguageValue("primary.portal.dashboard.accounts");
    CONTACTS: string = this.langService.fetchPrimaryLanguageValue("primary.portal.dashboard.contacts");
    ADMINISTRATORS: string = this.langService.fetchPrimaryLanguageValue("primary.portal.dashboard.administrators");
    ENROLLMENT_OPTIONS: string = this.langService.fetchPrimaryLanguageValue("primary.portal.dashboard.enrollmentOptions");
    CASE_BUILDER_ADMINS: string = this.langService.fetchPrimaryLanguageValue("primary.portal.dashboard.caseBuilderAdmins");
    STRUCTURE: string = this.langService.fetchPrimaryLanguageValue("primary.portal.dashboard.structure");
    CARRIERS: string = this.langService.fetchPrimaryLanguageValue("primary.portal.dashboard.carriers");
    RESOURCES: string = this.langService.fetchPrimaryLanguageValue("primary.portal.dashboard.resources");
    BRANDING: string = this.langService.fetchPrimaryLanguageValue("primary.portal.branding.side_nav");
    RULES: string = this.langService.fetchPrimaryLanguageValue("primary.portal.dashboard.rules");
    BENEFITS: string = this.langService.fetchPrimaryLanguageValue("primary.portal.dashboard.benefits");
    EXCEPTIONS: string = this.langService.fetchPrimaryLanguageValue("primary.portal.dashboard.exceptions");
    PROPOSALS: string = this.langService.fetchPrimaryLanguageValue("primary.portal.dashboard.proposals");
    CHANGE_REQUESTS: string = this.langService.fetchPrimaryLanguageValue("primary.portal.dashboard.policyChangeRequests");
    EMPLOYEES: string = this.langService.fetchPrimaryLanguageValue("primary.portal.dashboard.employees");
    BUSINESS: string = this.langService.fetchPrimaryLanguageValue("primary.portal.dashboard.business");
    SCHEDULE_SEND: string = this.langService.fetchPrimaryLanguageValue("primary.portal.dashboard.scheduleAndSend");
    PENDING_ENROLLMENTS: string = this.langService.fetchPrimaryLanguageValue("primary.portal.dashboard.pendingEnrollments");
    COMMISSIONS: string = this.langService.fetchPrimaryLanguageValue("primary.portal.dashboard.commissions");
    REPORTS: string = this.langService.fetchPrimaryLanguageValue("primary.portal.dashboard.reports");
    MESSAGE_CENTER_HEADER = this.langService.fetchPrimaryLanguageValue(MessageCenterLanguage.MESSAGE_CENTER_DASHBOARD_HEADER);
    MESSAGE_CENTER_INBOX = this.langService.fetchPrimaryLanguageValue(MessageCenterLanguage.MESSAGE_CENTER_DASHBOARD_INBOX);
    MESSAGE_CENTER_SETTINGS = this.langService.fetchPrimaryLanguageValue(MessageCenterLanguage.MESSAGE_CENTER_DASHBOARD_SETTINGS);
    PROFILE: string = this.langService.fetchPrimaryLanguageValue("primary.portal.dashboard.profile");
    languageStrings = this.langService.fetchPrimaryLanguageValues([
        "primary.portal.dashboard.deactivateAccount.deactivate",
        "primary.portal.dashboard.deactivateAccount.cancel",
        "primary.portal.dashboard.deactivateAccount.name",
        "primary.portal.dashboard.reactivateAccount.yes",
        "primary.portal.dashboard.reactivateAccount.no",
        "primary.portal.dashboard.deactivateAccount.accountViewTimePeriodMessage",
        "primary.portal.dashboard.deactivateAccount.noLongerViewAccountMessage",
        "primary.portal.dashboard.deactivateAccount.viewAccountMessage",
        "primary.portal.dashboard.refreshAccount.errorMessage",
        "primary.portal.dashboard.refreshAccount.successDefaultMessage",
        "primary.portal.dashboard.refreshAccount.successHeaderMessage",

        "primary.portal.dashboard.unpluggedAccount.allowAccess",
        "primary.portal.dashboard.unpluggedAccount.blockCheckout",
        "primary.portal.dashboard.unpluggedAccount.enableCheckout",
        "primary.portal.dashboard.unpluggedAccount.viewAuthorizationCode",
        "primary.portal.dashboard.unpluggedAccount.checkedOutToUnplugged",
        "primary.portal.dashboard.unpluggedAccount.ineligibleForCheckout",
        "primary.portal.dashboard.unpluggedAccount.benefitOfferingLock",
        "primary.portal.dashboard.manageAccountProfile",
        "primary.portal.dashboard.manageAccountProfileBrief",
        "primary.portal.dashboard.buildBenefitsOffering",
        "primary.portal.dashboard.buildBenefitsOfferingBrief",
        "primary.portal.dashboard.addEmployees",
        "primary.portal.dashboard.addEmployeesBrief",
        "primary.portal.dashboard.inviteCoenrollers",
        "primary.portal.dashboard.inviteCoenrollersBrief",
        "primary.portal.dashboard.sendBusiness",
        "primary.portal.dashboard.sendBusinessBrief",
        "primary.portal.dashboard.helpfulLinks",
        "primary.portal.dashboard.fieldForceServices",
        "primary.portal.dashboard.myAflac",
        "primary.portal.dashboard.rpm",
        "primary.portal.common.close",
        "primary.portal.common.openNavigation",
        "primary.portal.dashboard.adminApprovalChecklist.applicationForm",
        "primary.portal.dashboard.adminApprovalChecklist.groupApplicationForm",
        "primary.portal.dashboard.ownerAccount",
        "primary.portal.dashboard.accountType",
        "primary.portal.dashboard.accountTypeAndName",
        "primary.portal.dashboard.singleCoproducer",
        "primary.portal.dashboard.multipleCoproducer",
        "primary.portal.dashboard.accounts",
        "primary.portal.dashboard.accountList",
        "primary.portal.dashboard.dashboard",
        "primary.portal.dashboard.accountInstructions",
        "primary.portal.dashboard.profile",
        "primary.portal.dashboard.accountInfo",
        "primary.portal.dashboard.contacts",
        "primary.portal.dashboard.administrators",
        "primary.portal.dashboard.enrollmentOptions",
        "primary.portal.dashboard.caseBuilderAdmins",
        "primary.portal.dashboard.structure",
        "primary.portal.dashboard.carriers",
        "primary.portal.dashboard.resources",
        "primary.portal.dashboard.benefits",
        "primary.portal.dashboard.offering",
        "primary.portal.dashboard.exceptions",
        "primary.portal.dashboard.proposals",
        "primary.portal.dashboard.policyChangeRequests",
        "primary.portal.dashboard.employees",
        "primary.portal.dashboard.business",
        "primary.portal.dashboard.scheduleAndSend",
        "primary.portal.dashboard.pendingEnrollments",
        "primary.portal.dashboard.commissions",
        "primary.portal.dashboard.reports",
        "primary.portal.dashboard.rules",
        "primary.portal.totalcost.wellthieSupport",
        "primary.portal.dashboard.aflacEmployerDiscoveryAssist",
        "primary.portal.helpfulLinks.guide.header",
        "primary.portal.benefitsOffering.refreshApi.failed",
        "primary.portal.aflacgroup.everwellSupport",
        MicroSiteLanguage.ACCOUNT_LANDING_PAGE,
        "primary.portal.commissionSplit.repairRequires.error",
        "primary.portal.commissionSplit.repairRequires.goToCommission",
        AG,
        "primary.portal.dashboard.unpluggedAccount.accountCheckedOut",
        "primary.portal.dashboard.invalidZipCode",
    ]);
    previousListName: string;
    adminId: any;
    producerId: any;
    userData: AdminCredential;
    currentAccount: any;
    fullName: any;
    fullNameList: string[] = [];
    condition: string;
    selectedRoute = "dashboard";
    dashboardMessage: string;
    conditionThreeFlag = false;
    conditionTwoFlag = false;
    conditionOneFlag = false;
    conditionFourFlag = false;
    conditionFiveFlag = false;
    producerRole = "";
    memberInfo: AdminCredential | MemberCredential | ProducerCredential;
    producerSearchList: any;
    assistingProdPrev = "WRITING_PRODUCER";
    assistingProd = "assisting producer";
    enrollerPrev = "ENROLLER";
    enroller = "enroller";
    primaryProducer = "PRIMARY_PRODUCER";
    primaryProd = "primary producer";
    accountsData: any[] = [];
    producerReadPermission = "core.producer.read";
    alertMessage: string;
    approvalRequest: ApprovalRequest[];
    carrierData: CarrierData[] = [];
    planChoices: PlanChoice[];
    configurations = new Map<number, string>();
    configurationTagName = "group.acknowledgement.admin_review_plans";
    carrierSetupStatusError: boolean;
    showApptakerOptions = false;
    alertTypes = alertTypes;
    showAlerts = true;
    classRegionPermission = false;
    createPermission = false;
    portal: string;
    exceptions: Exceptions[];
    isAdminPortal: boolean;
    isMemberPortal: boolean;
    isProducerPortal: boolean;
    isTpiAdded = false;
    mpGroupAccount$: Observable<Accounts>;
    agentLevel: number;
    readonly AGENT_LEVEL_TWO = 2;
    readonly AGENT_LEVEL_THREE = 3;
    showWellthieLink$: Observable<boolean> = this.utilService.showWellthieLink();
    currentAccountDetails: Accounts;
    agRefreshStatus$: Observable<boolean>;
    isRefreshEligible: RefreshEligibleInfo;
    readonly SOUTHERLAND_CALL_CENTER = 1;

    // variable used to store field force url
    fieldForceServiceUrl: string;
    // variable used to store configuration tag name of fetch field force service link
    fieldForceUrlConfigurationTagName = "account.dashboard.external.link.fieldForceServices";
    // variable used to store rpm url
    rpmNavigationUrl = AppSettings.RPM_NAVIGATION_URL;
    navOptions: MonSideNavList[] = [];
    accountCallCenters: AccountCallCenter[];
    specialInstructions: string;
    specialInstructionsModifiedDate: string;
    specialInstructionsByName: string;
    discoveryAssistLink: string;
    hasPrivilege$ = of(false);
    isRepairRequiredCommissionSplit$ = of(false);
    toolTipContent: SafeHtml = "";

    // Getting branding color and returning it as border-left style
    brandingColor$ = this.brandingService.customBrandingColor$.pipe(map((color) => color));
    /**
     * Use to get the account landing page url
     */
    accountLandingPageUrl$: Observable<string> = this.staticUtil.cacheConfigValue("general.microsites.account.landing.pages.url");
    permissionBuildOffering = Permission.HQ_PRODUCER_BENEFITS_OFFERING_ENABLED;
    refreshConfig = ConfigName.AFLAC_GROUP_REFRESH;
    mircositeConfig = MicroSiteConfig;
    micrositePermission = UserPermissionList.AFLAC_ACCOUNT_LANDING_PAGE;
    allowedPartnerAccountType = false;
    accountNumberDisplay: string;
    accountStatus: string;
    hasPermissionToAccount: boolean;
    sicCode: string;
    industryCode: string;
    acctType: boolean;
    refreshAccountData: string[] = [];
    isAccountRefreshedError: boolean;
    refreshAccountDataBO: string[] = [];
    isBenefitOffering = false;
    validZip = true;
    isRole20Producer = false;
    isQ60: boolean;
    isPrivacyEnabledForEnroller = false;
    account$: Observable<Account>;
    constructor(
        private readonly media: MediaMatcher,
        private readonly router: Router,
        private readonly store: Store,
        private readonly ngrxStore: NGRXStore,
        private readonly route: ActivatedRoute,
        private readonly dashboardService: DashboardService,
        private readonly dialog: MatDialog,
        private readonly langService: LanguageService,
        private readonly aflacService: AflacService,
        readonly userService: UserService,
        private readonly accountListService: AccountListService,
        private readonly sharedService: SharedService,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly auth: AuthenticationService,
        private readonly accountsService: AccountsService,
        private readonly producerService: ProducerService,
        private readonly utilService: UtilService,
        private readonly staticService: StaticService,
        private readonly appTakerService: AppTakerService,
        private readonly accountNameUpdate: AccountNameUpdateService,
        private readonly staticUtil: StaticUtilService,
        private readonly mpGroupAccountService: MPGroupAccountService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly accountService: AccountService,
        private readonly censusService: CensusService,
        private readonly brandingService: BrandingService,
        private readonly tpiRestrictions: TPIRestrictionsForHQAccountsService,
        private readonly agRefreshService: AgRefreshService,
        private readonly domSanitizer: DomSanitizer,
        private readonly aflacBusinessService: AflacBusinessService,
    ) {
        this.manageAccountButtonFlag = true;
        this.mobileQuery = this.media.matchMedia("(max-width: 992px)");
        this.credential$ = this.userService.credential$;
        this.mpGroup = this.route.parent.snapshot.params.mpGroupId;
        this.ngrxStore.dispatch(AccountsActions.setSelectedMPGroup({ mpGroup: this.mpGroup }));
        this.account$ = this.ngrxStore.onAsyncValue(select(getSelectedAccount));
        this.hasPermissionToAccount = this.store.selectSnapshot(AccountInfoState.getPermissionToAccount);
        if (this.hasPermissionToAccount) {
            this.subscriptions.push(
                this.account$
                    .pipe(
                        tap((resp) => {
                            this.currentAccountDetails = resp;
                            this.allowedPartnerAccountType =
                                this.currentAccountDetails.partnerAccountType === PartnerAccountType.PAYROLL ||
                                this.currentAccountDetails.partnerAccountType === PartnerAccountType.PAYROLLDIRECTBILL;
                            if (this.currentAccountDetails.checkedOut) {
                                this.toolTipContent = this.domSanitizer.bypassSecurityTrustHtml(
                                    this.languageStrings["primary.portal.dashboard.unpluggedAccount.accountCheckedOut"],
                                );
                            }
                            this.validateZip();
                            this.addNavigationOptions();
                        }),
                        filter(
                            (resp) =>
                                resp.importType === this.accountImportType.AFLAC_GROUP ||
                                resp.importType === this.accountImportType.SHARED_CASE,
                        ),
                        switchMap((resp) => this.aflacService.getAflacGroupRefreshStatus(this.mpGroup)),
                    )
                    .subscribe((refreshStatus) => {
                        this.isRefreshEligible = this.utilService.copy(refreshStatus);
                        this.agRefreshStatus$ = of(refreshStatus.refreshAllowed || refreshStatus.requiresBenefitOfferingRenewal);
                    }),
            );
        }
        this.subscriptions.push(
            this.staticUtil
                .cacheConfigValue("account.dashboard.external.link.myAflac_discoveryAssist")
                .subscribe((value) => (this.discoveryAssistLink = value)),
        );
        if (this.mpGroup != null) {
            this.store.dispatch(new FetchConfigs(ConfigName.GA_ENABLE_PRIVACY_RULES_ENROLLER));
            this.getAccountProducerRole(this.mpGroup.toString());
        } else {
            this.store.dispatch(new SetPrivacyForEnroller(false));
        }
    }

    /**
     * Life cycle hook to initialize the component.
     * Initialize side nav, getting required data as well as check and set flags.
     * @returns void
     */
    ngOnInit(): void {
        this.aflacSupport = this.languageStrings["primary.portal.aflacgroup.everwellSupport"];
        this.hasPermissionToAccount = this.store.selectSnapshot(AccountInfoState.getPermissionToAccount);
        if (this.hasPermissionToAccount) {
            this.portal = this.store.selectSnapshot(SharedState.portal);
            this.isAdminPortal = this.portal === AppSettings.PORTAL_ADMIN;
            this.isMemberPortal = this.portal === AppSettings.PORTAL_MEMBER;
            this.isProducerPortal = this.portal === AppSettings.PORTAL_PRODUCER;
            this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
            // To get agent level from user state
            this.agentLevel = this.store.selectSnapshot(UserState).agentLevel;
            this.subscriptions.push(
                this.userService.credential$.subscribe((memberInfo) => {
                    this.memberInfo = memberInfo;
                }),
            );
            this.router.events.pipe(takeUntil(this.destroy$)).subscribe(event => {
                if(event instanceof NavigationStart) {
                    this.destroy$.next();
                }
            });
            // To refresh account when user lands on dashboard
            if (this.isProducerPortal) {
                this.refreshAccountOnDashboard();
            }

            this.getIboGroupAttribute();
            this.checkPermission();
            this.checkPendingElements();
            this.previousListName = this.ACCOUNTS;
            const filterParams = {
                filter: "",
                search: "",
                property: "",
                page: "1",
                size: "1000",
                value: "",
            };
            this.currentAccount = this.store.selectSnapshot(AccountListState.getGroup);
            this.accountsData = this.store.selectSnapshot(AccountListState.getAccountList);
            if (!this.currentAccount) {
                this.subscriptions.push(
                    this.accountListService
                        .listAccounts(filterParams)
                        .pipe(
                            tap((res) => {
                                this.accountListData = res;
                            }),
                            switchMap((res) => this.store.dispatch(new AddAccountList(res))),
                        )
                        .subscribe(),
                );
            } else {
                this.accountListData = this.accountsData;
            }

            if (this.currentAccount) {
                this.fullName = this.currentAccount.primaryProducer;
            }
            this.getStateManagement();
            if (this.accountListData && this.accountListData.content && this.accountListData.content.length > 0) {
                this.getAccountDetails();
            }
            this.getAccountContactDetails();
            if (this.mpGroup) {
                this.getMaintananceLock();
            }
            this.fetchFieldForceUrl();
            this.isLoading = false;
            this.subscriptions.push(this.accountNameUpdate.accountName$.subscribe((value: string) => (this.accountName = value)));
            this.isDashboard = !location.href.includes("dashboard/");
            this.getAccountCallCenters();
            this.subscriptions.push(
                this.censusService.getUpdateDashboardDetails.pipe(filter((dashboard) => dashboard === true)).subscribe((dashboard) => {
                    this.navitageToSelectedOption(this.EMPLOYEES);
                }),
            );
            this.hasPrivilege$ = this.utilService
                .checkDisableForRole12Functionalities(Permission.TPP_RESTRICTED_PERMISSION, this.mpGroup.toString())
                .pipe(
                    tap(([, accountData]) => (this.isTpiAdded = accountData.thirdPartyPlatformsEnabled)),
                    map(([isRestricted, accountData]) => !(isRestricted && accountData.thirdPartyPlatformsEnabled)),
                    filter((hasPermission) => hasPermission),
                    switchMap(() => this.staticUtil.hasPermission(Permission.RESTRICT_CREATE_MEMBER)),
                    map((isRestricted) => !(isRestricted && this.isTpiAdded)),
                );

            if (this.isProducerPortal) {
                this.isRepairRequiredCommissionSplit$ = this.aflacService
                    .getCommissionSplits(this.mpGroup.toString())
                    .pipe(map((commissionSplits) => commissionSplits.some((commissionSplit) => commissionSplit.repairRequired)));
            }
            this.subscriptions.push(
                this.store
                    .select(SharedState.hasPermission(Permission.BO_PRODUCT_CREATE))
                    .pipe(
                        filter((response) => !response),
                        switchMap((resp) => this.benefitOfferingService.getApprovalRequests(this.mpGroup)),
                        filter((response) => response.length === 0),
                    )
                    .subscribe((response) => {
                        const navOptions = this.navOptions.map((element) => {
                            element.subMenuItem = element.subMenuItem.filter(
                                (subItem) => subItem.name.toLowerCase() !== this.OFFERING.toLowerCase(),
                            );
                            return element;
                        });
                        this.navOptions = navOptions.filter(
                            (element) =>
                                element.menuIntem.name.toLowerCase() !== this.BENEFITS.toLowerCase() || element.subMenuItem.length > 0,
                        );
                    }),
            );
        } else {
            this.subscriptions.push(
                this.userService.credential$.subscribe((memberInfo) => {
                    this.memberInfo = memberInfo;
                }),
            );
            this.previousListName = this.ACCOUNTS;
            this.errorMessage = this.langService.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.sorryPermissionDenied");
            this.isDashboard = true;
            this.showErrorMessage = true;
            this.isLoading = false;
        }

        this.subscriptions.push(
            this.benefitOfferingService.getPlanChoices(false, false, this.mpGroup).subscribe((resp) => {
                this.isQ60 = resp.some((plans) => !plans.plan.rider && plans.plan.policySeries.includes("Q60"));
                if (this.isQ60) {
                    return;
                }
            }),
        );
    }
    /**
     * Method to check if the zipcode is valid or not
     */
    validateZip(): void {
        this.subscriptions.push(
            this.utilService
                .validateZip(this.currentAccountDetails.situs.state.abbreviation, this.currentAccountDetails.situs.zip)
                .subscribe((resp) => {
                    this.validZip = resp;
                }),
        );
    }

    /**
     * Method to refresh account automatically on dashboard
     */
    refreshAccountOnDashboard(): void {
        this.isLoading = true;
        this.subscriptions.push(
            this.aflacService.refreshAccount(this.mpGroup.toString()).subscribe(
                (refreshDetails) => {
                    if (refreshDetails && refreshDetails.body && refreshDetails.body.changeData) {
                        this.refreshAccountData = Object.keys(refreshDetails.body.changeData);
                        this.isAccountRefreshedError = false;
                        this.isLoading = false;
                    }
                },
                (error) => {
                    this.isAccountRefreshedError = true;
                    this.isLoading = false;
                },
            ),
        );
    }

    /**
     * Check and clear the pending elements of Benefit Offerings
     */
    checkPendingElements(): void {
        this.subscriptions.push(
            forkJoin([
                this.accountService.getGroupAttributesByName([MBO_GROUP_ATTRIBUTE_NAME]).pipe(first()),
                this.benefitOfferingService.getApprovalRequests(this.mpGroup).pipe(first()),
            ])
                .pipe(
                    filter(
                        (response) =>
                            response[APPROVAL_REQUEST_INDEX].length > 0 ||
                            (response[MBO_ATTRIBUTE_INDEX].length > 0 &&
                                response[MBO_ATTRIBUTE_INDEX][MBO_ATTRIBUTE_INDEX].value === MBO_ATTRIBUTE_VALUE),
                    ),
                    switchMap((res) => this.accountService.clearPendingElements(this.mpGroup)),
                )
                .subscribe(),
        );
    }

    /**
     * This function will be called when user clicks on side nav item
     * @param route is path of side nav item configured
     * @returns void
     */
    navitageToSelectedOption(route: string): void {
        const routeToPath = new Map();
        routeToPath.set(this.ACCOUNTS, SidenavRoutes.MPP_PAYROLL);
        routeToPath.set(this.DASHBOARD, SidenavRoutes.DASHBOARD);
        routeToPath.set(this.ACCOUNT_INFO, SidenavRoutes.ACCOUNT_INFO);
        routeToPath.set(this.CONTACTS, SidenavRoutes.CONTACTS);
        routeToPath.set(this.ADMINISTRATORS, SidenavRoutes.DISPLAY_ADMIN_LIST);
        routeToPath.set(this.ENROLLMENT_OPTIONS, SidenavRoutes.ENROLLMENT_OPTIONS);
        routeToPath.set(this.CASE_BUILDER_ADMINS, SidenavRoutes.CASE_BUILDER_ADMINS);
        routeToPath.set(this.STRUCTURE, SidenavRoutes.STRUCTURE);
        routeToPath.set(this.CARRIERS, SidenavRoutes.CARRIERS);
        routeToPath.set(this.RESOURCES, SidenavRoutes.RESOURCES);
        routeToPath.set(this.BRANDING, SidenavTab.BRANDING);
        routeToPath.set(this.RULES, SidenavRoutes.RULES);
        routeToPath.set(this.EXCEPTIONS, SidenavRoutes.EXCEPTIONS);
        routeToPath.set(this.PROPOSALS, SidenavRoutes.PROPOSALS);
        routeToPath.set(this.CHANGE_REQUESTS, SidenavRoutes.CHANGE_REQUESTS);
        routeToPath.set(this.EMPLOYEES, SidenavRoutes.EMPLOYEES);
        routeToPath.set(this.SCHEDULE_SEND, SidenavRoutes.SCHEDULE_SEND);
        routeToPath.set(this.PENDING_ENROLLMENTS, SidenavRoutes.PENDING_ENROLLMENTS);
        routeToPath.set(this.COMMISSIONS, SidenavRoutes.COMMISSIONS);
        routeToPath.set(this.REPORTS, SidenavRoutes.REPORTS);
        routeToPath.set(this.MESSAGE_CENTER_INBOX, SidenavTab.MESSAGE_CENTER_INBOX);
        routeToPath.set(this.MESSAGE_CENTER_SETTINGS, SidenavTab.MESSAGE_CENTER_SETTINGS);

        this.isDashboard = true;
        this.selectedRoute = route;
        this.isBenefitOffering = false;
        if (route !== this.DASHBOARD) {
            this.isDashboard = false;
            this.refreshAccountData = [];
        }
        if (route === this.OFFERING) {
            this.refreshAccountDataBO = [];
            this.isBenefitOffering = true;
            this.navigateToBenefitsOffering();
        } else if (route === this.ACCOUNTS) {
            if (this.memberInfo && this.memberInfo[userId.PRODUCER_ID]) {
                this.navigateTo(SidenavRoutes.MPP_PAYROLL);
            } else if (this.memberInfo && this.memberInfo[userId.ADMIN_ID]) {
                this.navigateTo(SidenavRoutes.MAP_ACCOUNTLIST);
            }
        } else {
            this.navigateTo(routeToPath.get(route));
        }
    }

    /**
     * This function will navigate user to selected tab in sidenav
     * @param path is configured path for element in the sidenav
     * @returns void
     */
    navigateTo(path: string): void {
        this.router.navigate([path], { relativeTo: this.route });
    }

    /**
     * Navigates to commission split tab in Commission page
     */
    navigateToCommissionSplitTab(): void {
        this.isDashboard = false;
        this.router.navigate([SidenavRoutes.COMMISSIONS], {
            queryParams: { page: COMMISSION_SPLIT },
            relativeTo: this.route,
        });
    }

    /**
     * This function will configure sidenav with all required options
     * @returns void
     */
    // eslint-disable-next-line complexity
    addNavigationOptions(): void {
        this.navOptions = [
            {
                menuIntem: {
                    name: this.DASHBOARD,
                    iconName: SidenavIcon.DASHBOARD,
                    path: SidenavTab.DASHBOARD,
                } as MenuItem,
                subMenuItem: [],
            },
            {
                menuIntem: {
                    name: this.PROFILE,
                    iconName: SidenavIcon.PROFILE,
                    isVisible$: combineLatest([this.userService.credential$, this.staticUtil.hasPermission(Permission.HYBRID_USER)]).pipe(
                        map(
                            ([memberInfo, hybridUserPermission]) =>
                                memberInfo &&
                                ((userId.PRODUCER_ID in memberInfo &&
                                    Boolean(!memberInfo[userId.CALL_CENTER_ID] || hybridUserPermission)) ||
                                    userId.ADMIN_ID in memberInfo),
                        ),
                    ),
                } as MenuItem,
                subMenuItem: [
                    {
                        name: this.ACCOUNT_INFO,
                        iconName: SidenavIcon.ACCOUNT_INFO,
                        path: SidenavTab.ACCOUNT_INFO,
                        isVisible$: combineLatest([this.userService.credential$, this.sharedService.userPortal$]).pipe(
                            map(
                                ([memberInfo, portal]) => !(userId.MEMBER_ID in memberInfo) || portal.type !== selectedPortal.MEMBER_PORTAL,
                            ),
                        ),
                    } as MenuItem,
                    {
                        name: this.CONTACTS,
                        iconName: SidenavIcon.CONTACTS,
                        path: SidenavTab.CONTACTS,
                        isVisible$: combineLatest([this.userService.credential$, this.sharedService.userPortal$]).pipe(
                            map(
                                ([memberInfo, portal]) => !(userId.MEMBER_ID in memberInfo) || portal.type !== selectedPortal.MEMBER_PORTAL,
                            ),
                        ),
                    } as MenuItem,
                    {
                        name: this.ADMINISTRATORS,
                        iconName: SidenavIcon.ADMINISTRATORS,
                        path: SidenavTab.DISPLAY_ADMIN_LIST,
                        isVisible$: combineLatest([this.userService.credential$, this.sharedService.userPortal$]).pipe(
                            map(
                                ([memberInfo, portal]) => !(userId.MEMBER_ID in memberInfo) || portal.type !== selectedPortal.MEMBER_PORTAL,
                            ),
                        ),
                    } as MenuItem,
                    {
                        name: this.ENROLLMENT_OPTIONS,
                        iconName: SidenavIcon.ENROLLMENT_OPTIONS,
                        path: SidenavTab.ENROLLMENT_OPTIONS,
                        isVisible$: combineLatest([this.userService.credential$, this.sharedService.userPortal$]).pipe(
                            map(
                                ([memberInfo, portal]) => !(userId.MEMBER_ID in memberInfo) || portal.type !== selectedPortal.MEMBER_PORTAL,
                            ),
                        ),
                    } as MenuItem,
                    {
                        name: this.CASE_BUILDER_ADMINS,
                        iconName: SidenavIcon.CASE_BUILDER_ADMINS,
                        path: SidenavTab.CASE_BUILDER_ADMINS,
                        isConfigEnabled$: this.staticUtil.cacheConfigEnabled(ConfigName.CASE_BUILDER_FEATURE_ENABLE),
                        hasPermission$: this.store.select(SharedState.hasPermission(Permission.CASE_BUILDER_ADMINS_READ)),
                        isVisible$: combineLatest([this.userService.credential$, this.sharedService.userPortal$]).pipe(
                            map(
                                ([memberInfo, portal]) => !(userId.MEMBER_ID in memberInfo) || portal.type !== selectedPortal.MEMBER_PORTAL,
                            ),
                        ),
                    } as MenuItem,
                    {
                        name: this.STRUCTURE,
                        iconName: SidenavIcon.STRUCTURE,
                        path: SidenavTab.STRUCTURE,
                        isVisible$: combineLatest([
                            this.userService.credential$,
                            this.sharedService.userPortal$,
                            this.auth.permissions$,
                        ]).pipe(
                            map(([memberInfo, portal, permission]) => {
                                const hasClassRegionPermission = permission.filter(
                                    (per) =>
                                        String(per) === UserPermissionList.READ_CLASS || String(per) === UserPermissionList.READ_REGION,
                                );
                                return (
                                    (!(userId.MEMBER_ID in memberInfo) || portal.type !== selectedPortal.MEMBER_PORTAL) &&
                                    permission.length > 0 &&
                                    hasClassRegionPermission.length > 0
                                );
                            }),
                        ),
                    } as MenuItem,
                    {
                        name: this.CARRIERS,
                        iconName: SidenavIcon.CARRIERS,
                        path: SidenavTab.CARRIERS,
                        isVisible$: combineLatest([this.userService.credential$, this.sharedService.userPortal$]).pipe(
                            map(
                                ([memberInfo, portal]) => !(userId.MEMBER_ID in memberInfo) || portal.type !== selectedPortal.MEMBER_PORTAL,
                            ),
                        ),
                    } as MenuItem,
                    {
                        name: this.RESOURCES,
                        iconName: SidenavIcon.RESOURCES,
                        path: SidenavTab.RESOURCES,
                        isVisible$: combineLatest([this.userService.credential$, this.sharedService.userPortal$]).pipe(
                            map(
                                ([memberInfo, portal]) =>
                                    (portal.type !== selectedPortal.ADMIN_PORTAL && !(userId.MEMBER_ID in memberInfo)) ||
                                    portal.type !== selectedPortal.MEMBER_PORTAL,
                            ),
                        ),
                        isConfigEnabled$: this.staticUtil.cacheConfigEnabled("portal.resources_config.enabled"),
                        hasPermission$: combineLatest([
                            checkIfAbleToAccessModuleInHQAccount(
                                this.staticUtil,
                                this.accountService,
                                UserPermissionList.READ_RESOURCE_ALWAYS,
                            ),
                            this.store.select(SharedState.hasPermission(UserPermissionList.READ_RESOURCE)),
                            this.store.select(SharedState.hasPermission(Permission.ACCOUNT_RESTRICT_PROFILE_RESOURCE)),
                        ]).pipe(
                            map(
                                ([canAccessResourceConsideringHQAccount, readResourcePermission, restrictResource]) =>
                                    canAccessResourceConsideringHQAccount && readResourcePermission && !restrictResource,
                            ),
                        ),
                    } as MenuItem,
                    {
                        name: this.BRANDING,
                        iconName: SidenavTab.BRANDING,
                        path: SidenavTab.BRANDING,
                        isVisible$: combineLatest([this.userService.credential$, this.sharedService.userPortal$]).pipe(
                            map(
                                ([memberInfo, portal]) =>
                                    (portal.type !== selectedPortal.ADMIN_PORTAL && !(userId.MEMBER_ID in memberInfo)) ||
                                    portal.type !== selectedPortal.MEMBER_PORTAL,
                            ),
                        ),
                        isConfigEnabled$: combineLatest([
                            this.staticUtil.cacheConfigEnabled("general.branding.enabled"),
                            this.staticUtil.cacheConfigEnabled("general.branding.standard.setUp_flag"),
                            this.staticUtil.cacheConfigEnabled("general.branding.custom.setUp_flag"),
                        ]).pipe(map(([enable, standard, custom]) => enable && (standard || custom))),

                        hasPermission$: this.store.select(SharedState.hasPermission(UserPermissionList.CREATE_BRANDING)),
                    } as MenuItem,
                    {
                        name: this.RULES,
                        iconName: SidenavIcon.RULES,
                        path: SidenavTab.RULES,
                    } as MenuItem,
                ],
            },
            {
                menuIntem: {
                    name: this.BENEFITS,
                    iconName: SidenavIcon.BENEFITS,
                    isVisible$: combineLatest([this.userService.credential$, this.staticUtil.hasPermission(Permission.HYBRID_USER)]).pipe(
                        map(
                            ([memberInfo, hybridUserPermission]) =>
                                memberInfo &&
                                ((userId.ADMIN_ID in memberInfo && !(memberInfo[userId.CALL_CENTER_ID] || hybridUserPermission)) ||
                                    userId.PRODUCER_ID in memberInfo),
                        ),
                    ),
                } as MenuItem,
                subMenuItem: [
                    {
                        name: this.OFFERING,
                        iconName: SidenavIcon.BENEFITS,
                        path: SidenavTab.BENEFITS,
                        isVisible$: combineLatest([
                            this.userService.credential$,
                            this.tpiRestrictions.canAccessTPIRestrictedModuleInHQAccount(this.permissionBuildOffering),
                        ]).pipe(
                            map(
                                ([memberInfo, canBuildOffering]) =>
                                    canBuildOffering &&
                                    memberInfo &&
                                    (userId.ADMIN_ID in memberInfo || userId.PRODUCER_ID in memberInfo) &&
                                    this.memberInfo[userId.CALL_CENTER_ID] !== this.SOUTHERLAND_CALL_CENTER,
                            ),
                        ),
                    } as MenuItem,
                    {
                        name: this.EXCEPTIONS,
                        iconName: SidenavIcon.EXCEPTIONS,
                        path: SidenavTab.EXCEPTIONS,
                        isVisible$: this.auth.permissions$.pipe(
                            map((permission) => {
                                const hasPermission = permission.filter(
                                    (d) =>
                                        String(d) === UserPermissionList.EXCEPTION_CREATE ||
                                        String(d) === UserPermissionList.VAS_EXCEPTIONS_CREATE_PERMISSION ||
                                        String(d) === Permission.ACCOUNT_BO_READ_EXCEPTION_DETAILS,
                                );
                                return (
                                    permission.length > 0 &&
                                    hasPermission.length > 0 &&
                                    this.currentAccountDetails.importType !== this.accountImportType.AFLAC_GROUP
                                );
                            }),
                        ),
                    } as MenuItem,
                    {
                        name: this.PROPOSALS,
                        iconName: SidenavIcon.PROPOSALS,
                        path: SidenavTab.PROPOSALS,
                        isVisible$: combineLatest([this.userService.credential$, this.mpGroupAccountService.mpGroupAccount$]).pipe(
                            map(([memberInfo, mpGroupAcc]) => userId.PRODUCER_ID in memberInfo || mpGroupAcc.type !== "PROSPECT"),
                        ),
                        isConfigEnabled$: this.staticUtil.cacheConfigEnabled("portal.producer.payroll_tab.prospects.proposals.enabled"),
                        hasPermission$: combineLatest([
                            this.store.select(SharedState.hasPermission("core.proposal.read")),
                            checkIfAbleToAccessModuleInHQAccount(this.staticUtil, this.accountService),
                        ]).pipe(
                            map(
                                ([hasReadPermission, canAccessProposalConsideringHQAccount]) =>
                                    hasReadPermission && canAccessProposalConsideringHQAccount,
                            ),
                        ),
                    } as MenuItem,
                    {
                        name: this.CHANGE_REQUESTS,
                        iconName: SidenavIcon.CHANGE_REQUESTS,
                        path: SidenavTab.CHANGE_REQUESTS,
                        hasPermission$: this.store.select(SharedState.hasPermission("core.policyChangeRequest.read")),
                    } as MenuItem,
                ],
            },
            {
                menuIntem: {
                    name: this.EMPLOYEES,
                    iconName: SidenavIcon.EMPLOYEES,
                    path: SidenavTab.EMPLOYEES,
                } as MenuItem,
                subMenuItem: [],
            },
            {
                menuIntem: {
                    name: this.BUSINESS,
                    iconName: SidenavIcon.BUSINESS,
                    isVisible$: combineLatest([this.userService.credential$, this.staticUtil.hasPermission(Permission.HYBRID_USER)]).pipe(
                        map(
                            ([memberInfo, hybridUserPermission]) =>
                                (memberInfo && Boolean(memberInfo[userId.CALL_CENTER_ID] || hybridUserPermission)) ||
                                userId.PRODUCER_ID in memberInfo,
                        ),
                    ),
                } as MenuItem,
                subMenuItem: [
                    {
                        name: this.SCHEDULE_SEND,
                        iconName: SidenavIcon.SCHEDULE_SEND,
                        path: SidenavTab.SCHEDULE_SEND,
                        isVisible$: this.userService.credential$.pipe(map((memberInfo) => memberInfo && userId.PRODUCER_ID in memberInfo)),
                    } as MenuItem,
                    {
                        name: this.PENDING_ENROLLMENTS,
                        iconName: SidenavIcon.PENDING_ENROLLMENTS,
                        path: SidenavTab.PENDING_ENROLLMENTS,
                        isVisible$: this.userService.credential$.pipe(map((memberInfo) => memberInfo && !(userId.MEMBER_ID in memberInfo))),
                    } as MenuItem,
                ],
            },
            {
                menuIntem: {
                    name: this.COMMISSIONS,
                    iconName: SidenavIcon.COMMISSIONS,
                    path: SidenavTab.COMMISSIONS,
                    isVisible$: this.userService.credential$.pipe(
                        map((memberInfo) => memberInfo && !(userId.MEMBER_ID in memberInfo) && !(userId.ADMIN_ID in memberInfo)),
                    ),
                    hasPermission$: this.store.select(SharedState.hasPermission(Permission.COMMISSION_READ)),
                } as MenuItem,
                subMenuItem: [],
            },
            {
                menuIntem: {
                    name: this.REPORTS,
                    iconName: SidenavIcon.REPORTS,
                    path: SidenavTab.REPORTS,
                    isVisible$: this.userService.credential$.pipe(
                        map((memberInfo) => memberInfo && (userId.ADMIN_ID in memberInfo || userId.PRODUCER_ID in memberInfo)),
                    ),
                    isConfigEnabled$: this.staticUtil.cacheConfigEnabled("portal.account.reports.enabled"),
                    hasPermission$: this.store.select(SharedState.hasPermission(Permission.REPORT_VIEW_PERMISSION)),
                } as MenuItem,
                subMenuItem: [],
            },
            {
                menuIntem: {
                    name: this.MESSAGE_CENTER_HEADER,
                    iconName: SidenavIcon.EMAIL,
                    isVisible$: this.staticUtil.cacheConfigEnabled(ConfigName.MESSAGE_CENTER_TOGGLE),
                } as MenuItem,
                subMenuItem: [
                    {
                        name: this.MESSAGE_CENTER_INBOX,
                        path: SidenavTab.MESSAGE_CENTER_INBOX,
                        isVisible$: this.staticUtil.cacheConfigEnabled(ConfigName.MESSAGE_CENTER_TOGGLE),
                    } as MenuItem,
                    {
                        name: this.MESSAGE_CENTER_SETTINGS,
                        path: SidenavTab.MESSAGE_CENTER_SETTINGS,
                        isVisible$: combineLatest([
                            this.staticUtil.cacheConfigEnabled(ConfigName.MESSAGE_CENTER_TOGGLE),
                            this.sharedService.userPortal$,
                        ]).pipe(
                            map(([isFeatureEnabled, userPortal]) => isFeatureEnabled && userPortal.type.toUpperCase() === PortalType.ADMIN),
                        ),
                    } as MenuItem,
                ],
            },
        ];
    }
    /**
     * This method is used to navigate user to benefits-offering based approval requests
     */
    navigateToBenefitsOffering(): void {
        if (!window.location.pathname.includes("benefits/offering")) {
            let routerToMaintenance = false;

            this.subscriptions.push(
                this.store
                    .select(AccountInfoState.getAccountInfo)
                    .pipe(
                        switchMap((account) => this.aflacBusinessService.refreshAccountBasedOnImportType(account)),
                        tap((refreshDetails: HttpResponse<any>) => {
                            if (refreshDetails?.body?.changeData) {
                                this.refreshAccountDataBO = Object.keys(refreshDetails.body.changeData);
                            }
                        }),
                        catchError((objError) => {
                            const message = this.languageStrings["primary.portal.benefitsOffering.refreshApi.failed"];
                            this.openToast(message, ToastType.WARNING);
                            return EMPTY;
                        }),
                    )
                    .subscribe(),
            );
            this.subscriptions.push(
                forkJoin([
                    this.accountService.getGroupAttributesByName([MBO_GROUP_ATTRIBUTE_NAME]).pipe(first()),
                    this.benefitOfferingService.getApprovalRequests(this.mpGroup).pipe(first()),
                ]).subscribe((response) => {
                    if (response[MBO_ATTRIBUTE_INDEX] || response[APPROVAL_REQUEST_INDEX]) {
                        const currentAccount: AccountDetails = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
                        if (
                            response[APPROVAL_REQUEST_INDEX].length > 0 ||
                            (response[MBO_ATTRIBUTE_INDEX].length > 0 &&
                                response[MBO_ATTRIBUTE_INDEX][MBO_ATTRIBUTE_INDEX].value === MBO_ATTRIBUTE_VALUE)
                        ) {
                            routerToMaintenance = true;
                        }

                        if (
                            (currentAccount.importType === AccountImportTypes.AFLAC_GROUP ||
                                currentAccount.importType === AccountImportTypes.SHARED_CASE) &&
                            !routerToMaintenance
                        ) {
                            this.router.navigate(["./benefits/aflac-group-offering"], { relativeTo: this.route });
                        } else if (routerToMaintenance) {
                            this.router.navigate(["./benefits/maintenance-offering"], { relativeTo: this.route });
                        } else {
                            this.router.navigate(["./benefits/offering"], { relativeTo: this.route });
                        }
                    } else {
                        this.router.navigate([`${this.portal}/payroll/${this.mpGroup}/dashboard/benefits/offering`]);
                    }
                }),
            );
        }
    }

    checkPermission(): void {
        this.subscriptions.push(
            this.auth.permissions$.subscribe((response) => {
                if (response.length > 0 && response.find((d) => String(d) === this.appTakerPermission)) {
                    this.showApptakerOptions = true;
                    if (this.mpGroup) {
                        this.getProducerCheckoutAllowedStatus();
                    }
                }
                if (response.length > 0 && response.find((d) => String(d) === this.producerReadPermission)) {
                    const params = {
                        supervisorProducerId: this.memberInfo[userId.PRODUCER_ID],
                        page: ACCOUNT_PAGE_LIMIT,
                        size: ACCOUNT_THRESHOLD_LIMIT,
                    };
                    this.producerSearchList = this.accountsService.getproducerSearchList();
                    if (!this.producerSearchList && this.memberInfo && this.memberInfo[userId.PRODUCER_ID]) {
                        this.producerService.producerSearch(params).subscribe((resp) => {
                            if (resp) {
                                this.producerSearchList = resp;
                                this.accountsService.setProductSearchList(resp);
                            }
                        });
                    }
                }
            }),
        );
    }
    getStateManagement(): void {
        const filterParams = {
            filter: "",
            search: "",
            property: "",
            page: "1",
            size: "1000",
            value: "",
        };
        const mpGroup = this.route.parent.snapshot.params.mpGroupId;
        if (mpGroup) {
            this.utilService.setMpGroup(mpGroup);
        } else {
            this.utilService.setMpGroup(0);
        }
        this.mpGroup = mpGroup;
        this.subscriptions.push(
            this.userService.credential$.subscribe((credential: any) => {
                this.userData = credential;
                this.adminId = credential.adminId;
                this.producerId = credential.producerId;
                if (this.mpGroup && this.userData && this.adminId) {
                    this.checkForPendingApprovals();
                }
            }),
        );
        if (this.adminId && !this.mpGroup) {
            this.subscriptions.push(
                this.accountListService.listAccounts(filterParams).subscribe((res) => {
                    this.accountListData = res;
                    if (this.accountListData && this.accountListData.content.length > 0) {
                        this.store.dispatch(new AddGroup(this.accountListData.content[0]));
                        this.mpGroup = this.accountListData.content[0].id;
                        if (this.mpGroup) {
                            this.router.navigate(["../accountList/" + this.mpGroup + "/dashboard"], {
                                relativeTo: this.route,
                            });
                        }
                    }
                }),
            );
        } else if (this.adminId && this.mpGroup) {
            this.getAccountDetails();
        }
        if (this.producerId && this.mpGroup) {
            this.getAccountDetails();
        }
    }

    getMaintananceLock(): void {
        this.subscriptions.push(
            this.appTakerService
                .getMaintananceLock(this.mpGroup.toString())
                .pipe(catchError(() => EMPTY))
                .subscribe((res) => {
                    this.isMaintananceLockFlag = res;
                    this.alertTypeAccess = alertTypes.ALLOWACCESS;
                }),
        );
    }

    // Fetching account details based on mp group
    getAccountDetails(): void {
        this.subscriptions.push(
            this.account$.subscribe(
                (accountDetailResponse: AccountDetails) => {
                    if (accountDetailResponse) {
                        this.isLoading = false;
                        this.accountDetails = accountDetailResponse;
                        this.getMessage();
                        this.accountName = accountDetailResponse.name;
                        this.displayAccountNumber();
                        if (accountDetailResponse.status === accountStatus.INACTIVE) {
                            this.accountStatus = ` (${accountDetailResponse.status.toLowerCase()})`;
                            this.manageAccountButtonFlag = false;
                            this.inactiveAccountFlag = true;
                        }
                        this.accountHolderLocation =
                            this.getConvertedTextToTitleCase(accountDetailResponse.primaryContact.address.city) +
                            ", " +
                            accountDetailResponse.primaryContact.address.state;
                        this.store.dispatch(
                            new AddAccountInfo({
                                accountInfo: this.accountDetails,
                                mpGroupId: this.mpGroup.toString(),
                            }),
                        );
                        this.resultsLoaded = true;
                    }
                },
                (err) => {
                    this.isLoading = false;
                    this.resultsLoaded = false;
                    this.showErrorAlertMessage(err);
                },
            ),
        );
    }
    /**
     * to display account number next to account name in header
     */
    displayAccountNumber(): void {
        if (this.accountDetails) {
            if (this.accountDetails.importType === AccountImportTypes.AFLAC_GROUP && this.accountDetails.aflacGroupNumber) {
                this.accountNumberDisplay = ` (${this.languageStrings[AG]}${this.accountDetails.aflacGroupNumber})`;
            } else if (
                this.accountDetails.importType === AccountImportTypes.SHARED_CASE &&
                this.accountDetails.aflacGroupNumber &&
                this.accountDetails.accountNumber
            ) {
                // eslint-disable-next-line max-len
                this.accountNumberDisplay = ` (${this.accountDetails.accountNumber} / ${this.languageStrings[AG]}${this.accountDetails.aflacGroupNumber})`;
            } else if (this.accountDetails.accountNumber) {
                this.accountNumberDisplay = ` (${this.accountDetails.accountNumber})`;
            }
        }
    }

    getConvertedTextToTitleCase(strValue: string): string {
        return strValue.substring(0, 1).toUpperCase() + strValue.substring(1).toLowerCase();
    }

    navigateToAccountList(): void {
        this.router.navigate(["../../../payroll"], { relativeTo: this.route });
    }

    hideRefreshAccountAlert(): void {
        this.refreshAccountSuccessAlertFlag = false;
        this.refreshAccountErrorAlertFlag = false;
    }
    showRefreshAccountAlert(isError: any, data?: any): void {
        this.hideRefreshAccountAlert();
        if (isError) {
            this.refreshAccountErrorAlertFlag = true;
        } else {
            this.refreshAccountSuccessData = Object.keys(data);
            this.refreshAccountSuccessAlertFlag = true;
        }
    }
    /**
     * Method to refresh account by calling refresh api.
     * Opening account refresh modal if SIC/ABI code or Industry code is updated
     */
    refreshAccount(): void {
        this.isLoading = true;
        this.hideRefreshAccountAlert();
        this.subscriptions.push(
            this.aflacService
                .refreshAccount(this.mpGroup.toString(), true)
                .pipe(
                    tap((refreshDetails) => {
                        if (refreshDetails && refreshDetails.body && refreshDetails.body.changeData) {
                            this.sicCode = refreshDetails.body.changeData[SIC_CODE] || null;
                            this.industryCode = refreshDetails.body.changeData.GroupIndustryCode || null;
                            this.acctType = refreshDetails.body.changeData[ACCOUNT_TYPE] === ConfigurationBooleanValue.TRUE || false;
                            this.agRefreshService.onRefreshAccount();
                            this.showRefreshAccountAlert(false, refreshDetails.body.changeData);
                            this.getAccountDetails();
                            this.utilService.setRefreshActivity(true);
                        }
                    }),
                    catchError((error) => {
                        this.isLoading = false;
                        this.showRefreshAccountAlert(true);
                        const message = this.languageStrings["primary.portal.benefitsOffering.refreshApi.failed"];
                        this.openToast(message, ToastType.WARNING);
                        throw error;
                    }),
                    switchMap(() => this.staticUtil.cacheConfigEnabled(ConfigName.FEATURE_ENABLE_PEO_RULES)),
                    filter((PeoFeatureEnable) => !!(PeoFeatureEnable && (this.sicCode || this.industryCode)) || this.acctType),
                    tap(() =>
                        this.empoweredModalService.openDialog(AccountRefreshModalComponent, {
                            data: {
                                sicCode: this.sicCode,
                                industryCode: this.industryCode,
                                acctype: this.acctType,
                            },
                        }),
                    ),
                )
                .subscribe(),
        );
    }
    // TODO: once getting time period then need to replace #time with API response time
    deactivateDialogMessage(): string | undefined {
        if (this.noLongerViewAccountMsg) {
            return this.languageStrings["primary.portal.dashboard.deactivateAccount.noLongerViewAccountMessage"];
        }
        if (this.viewAccountMsg) {
            return this.languageStrings["primary.portal.dashboard.deactivateAccount.viewAccountMessage"];
        }
        return undefined;
    }

    /**
     * Opens the deactivate account confirmation modal
     */
    deactivateAccountDialog(): void {
        const dialogRef = this.dialog.open(DeactivateAccountPopupComponent, {
            width: "667px",
            data: {
                title: this.languageStrings["primary.portal.dashboard.deactivateAccount.name"],
                deactivateMsg: this.deactivateDialogMessage(),
                cancelButton: this.languageStrings["primary.portal.dashboard.deactivateAccount.cancel"],
                deactivateButton: this.languageStrings["primary.portal.dashboard.deactivateAccount.deactivate"],
                accountName: this.accountName,
                mpGroup: this.mpGroup.toString(),
                checkedOutAccount: this.currentAccountDetails.checkedOut,
            },
        });
        this.subscriptions.push(
            dialogRef.afterClosed().subscribe((mpgroup) => {
                if (mpgroup) {
                    this.isLoading = true;
                    this.deactivateAccount(mpgroup);
                }
            }),
        );
    }

    deactivateAccount(mpgroup: string): void {
        this.subscriptions.push(
            this.dashboardService.deactivateAccount(mpgroup).subscribe(
                (Response) => {
                    if (Response) {
                        this.isLoading = false;
                        this.navigateToAccountList();
                    }
                },
                (error) => {
                    this.isLoading = false;
                    this.showErrorAlertMessage(error);
                },
            ),
        );
    }
    /**
     * Method to handle error message
     * @param err {HttpErrorResponse} is used to receive error object
     */
    showErrorAlertMessage(err: HttpErrorResponse): void {
        this.errorMessageArray = [];
        if (err.error.status === ClientErrorResponseCode.RESP_403 && err.error.code === PREREQUISITE_FAILED) {
            this.errorMessage = this.langService.fetchSecondaryLanguageValue("secondary.portal.dashboard.canNotDeactivateAccount");
        } else {
            this.errorMessage = this.langService.fetchSecondaryLanguageValue(`secondary.api.${err["error"].status}.${err["error"].code}`);
        }
        this.showErrorMessage = true;
    }
    /**
     * Method to check permissions and set appropriate flags.
     *
     * @param getpermissionData
     */
    checkuserPermissions(getpermissionData: any): void {
        this.inactiveAccountmsg = this.languageStrings["primary.portal.dashboard.reactivateAccount.no"];
        for (const permission of getpermissionData) {
            if (permission === Permission.ACCOUNTLIST_ROLE_20) {
                this.isRole20Producer = true;
            }
            if (permission === UserPermissionList.ACCOUNT_DEACTIVATE) {
                this.canDeactivateAccount = true;
            }
            if (permission === UserPermissionList.ACCOUNT_REACTIVATE) {
                this.canReactivateAccount = true;
                this.inactiveAccountmsg = this.languageStrings["primary.portal.dashboard.reactivateAccount.yes"];
            }

            if (permission === UserPermissionList.ACCOUNT_REFRESH) {
                this.canRefreshAccount = true;
            }
        }
        if (!this.canReactivateAccount) {
            this.noLongerViewAccountMsg = true;
        }
        if (this.canReactivateAccount) {
            this.viewAccountMsg = true;
        }
        if (!this.canDeactivateAccount && !this.canRefreshAccount) {
            this.manageAccountButtonFlag = false;
        }
    }
    clickOnBranding(): void {
        this.router.navigate(["../../../overview"], { relativeTo: this.route });
    }

    checkForPendingApprovals(): void {
        this.subscriptions.push(
            this.benefitOfferingService.getApprovalRequests(this.mpGroup).subscribe((response) => {
                this.approvalRequest = response;
                if (
                    !this.dialog.openDialogs.length &&
                    response &&
                    response.some(
                        (x) =>
                            x.status === ApprovalRequestStatus.SUBMITTED ||
                            x.status === ApprovalRequestStatus.SUBMITTED_TO_HR ||
                            x.status === ApprovalRequestStatus.DECLINED,
                    )
                ) {
                    const isLimited = this.approvalRequest[this.approvalRequest.length - 1].status === ApprovalRequestStatus.DECLINED;
                    if (isLimited) {
                        this.openDialog(true);
                    } else {
                        this.getConfigurations();
                    }
                }
            }),
        );
    }

    getConfigurations(): void {
        this.subscriptions.push(
            this.staticService.getConfigurations(this.configurationTagName, this.mpGroup).subscribe(
                (response) => {
                    if (response && response.length) {
                        response.forEach((configuration) => {
                            const planConfigs = configuration.value.split(",");
                            planConfigs.forEach((planConfig) => {
                                const tagName = planConfig.split("=");
                                const planLanguageStr = tagName[0];
                                const planIds = tagName[1].split(":");
                                planIds.forEach((id) => this.configurations.set(+id, planLanguageStr));
                            });
                        });
                    }
                    this.getPlanChoices();
                },
                (error) => {
                    this.getPlanChoices();
                },
            ),
        );
    }

    getPlanChoices(): void {
        this.subscriptions.push(
            this.benefitOfferingService.getPlanChoices(true, false, this.mpGroup).subscribe(
                (response: PlanChoice[]) => {
                    this.planChoices = response;
                    this.getCarriersData();
                },
                (error) => {
                    this.getCarriersData();
                },
            ),
        );
    }

    /**
     * get carrier data
     */
    getCarriersData(): void {
        this.carrierSetupStatusError = false;
        this.carrierData = [];
        let benefitDollarsEnabled = false;
        this.subscriptions.push(
            combineLatest([
                this.benefitOfferingService.getBenefitOfferingCarriers(true, this.mpGroup.toString()),
                this.staticUtil.cacheConfigEnabled("general.feature.enable.benefitDollars").pipe(first()),
            ])
                .pipe(
                    tap(([, isBenefitDollarsEnabled]) => (benefitDollarsEnabled = isBenefitDollarsEnabled)),
                    mergeMap(([carriers]) => carriers),
                    mergeMap((carrier) => this.getCarrierSetupStatus(carrier)),
                    finalize(() => {
                        const submittedToHRApprovalRequest = this.approvalRequest.find(
                            (request) => request.status === ApprovalRequestStatus.SUBMITTED_TO_HR,
                        );
                        if (
                            (this.carrierData.length && !this.carrierSetupStatusError) ||
                            (benefitDollarsEnabled &&
                                submittedToHRApprovalRequest &&
                                submittedToHRApprovalRequest.approvalItems.some(
                                    (item) => item.object === ApprovalItemObject.BENEFIT_DOLLARS,
                                ))
                        ) {
                            this.openDialog(false);
                        }
                    }),
                )
                .subscribe(),
        );
    }

    getCarrierSetupStatus(carrier: AccountCarrier): Observable<any> {
        return this.benefitOfferingService.getCarrierSetupStatuses(this.mpGroup, carrier.id, true).pipe(
            switchMap((unapprovedCarrier) =>
                iif(
                    () => unapprovedCarrier === null || unapprovedCarrier === undefined || unapprovedCarrier.length === 0,
                    this.benefitOfferingService.getCarrierSetupStatuses(this.mpGroup, carrier.id, false).pipe(
                        map((response) => {
                            this.setCarrierData(response, carrier);
                        }),
                    ),
                    of(unapprovedCarrier),
                ),
            ),
            map((response) => {
                this.setCarrierData(response, carrier);
            }),
            catchError(() => {
                this.carrierSetupStatusError = true;
                return of(null);
            }),
        );
    }

    /**
     * This method is used to set the unapproved carrier data and VAS product
     * @param response unapproved carrier form data
     * @param carrier will provider name and id of carrier
     */
    setCarrierData(response: void | CarrierFormStatus[], carrier: AccountCarrier): void {
        if (response && response.length) {
            const vasPlan = this.getVASPlan(carrier.id);
            const isVAS = vasPlan.planId != null;
            const forms = response.filter(
                (setupStatus) =>
                    setupStatus.status === CarrierFormSetupStatus.SIGNED_BY_BROKER ||
                    setupStatus.status === CarrierFormSetupStatus.SUBMITTED_TO_CARRIER ||
                    setupStatus.status === CarrierFormSetupStatus.SIGNED_BY_GROUP ||
                    setupStatus.status === CarrierFormSetupStatus.DENIED_BY_CARRIER ||
                    setupStatus.status === CarrierFormSetupStatus.APPROVED_BY_CARRIER ||
                    (setupStatus.status === CarrierFormSetupStatus.APPROVED_AUTO && isVAS),
            );
            if (forms.length) {
                const formNamesArray = forms.map((form, index) =>
                    form.carrierFormId
                        ? form.carrierFormName
                        : forms.length > 1
                        ? this.languageStrings["primary.portal.dashboard.adminApprovalChecklist.applicationForm"]
                              .replace("#carriername", carrier.name)
                              .replace("#index", (index + 1).toString())
                        : this.languageStrings["primary.portal.dashboard.adminApprovalChecklist.groupApplicationForm"].replace(
                              "#carriername",
                              carrier.name,
                          ),
                );
                // Remove duplicate values
                const formNames = [...new Set(formNamesArray)];
                const viewOnly =
                    isVAS ||
                    forms.some(
                        (form) =>
                            (form.status === CarrierFormSetupStatus.APPROVED_BY_CARRIER ||
                                form.status === CarrierFormSetupStatus.APPROVED_AUTO) &&
                            form.carrierResponseDate == null,
                    );
                this.carrierData.push({
                    carrier: carrier,
                    carrierForms: forms,
                    carrierFormNames: formNames,
                    viewOnly: viewOnly,
                    signatureRequired: !viewOnly && !forms[0].accountApprovalDate,
                    documentViewed: !viewOnly && Boolean(forms[0].accountApprovalDate),
                    isVAS: isVAS,
                    vasContentTag: isVAS ? this.configurations.get(vasPlan.planId) : null,
                    planName: vasPlan.planName,
                });
            }
        }
    }

    getVASPlan(carrierId: number): { planId: number; planName: string } {
        let planId: number;
        let planName: string;
        if (this.planChoices && this.planChoices.length) {
            const choicePlan = this.planChoices.find(
                (planChoice) => planChoice.plan.carrierId === carrierId && planChoice.plan.vasFunding != null,
            );
            if (choicePlan) {
                planId = choicePlan.plan.id;
                planName = choicePlan.plan.vasFunding === VasFunding.EMPLOYER ? choicePlan.plan.name : null;
            }
        }
        return { planId, planName };
    }

    /**
     * Specifies configurations/data and opens admin approval checklist dialog. If user
     * selects "Logout" option in dialog, the action is carried out here.
     *
     * @param isLimited flag to indicate whether dialog's size is limited
     */
    openDialog(isLimited: boolean): void {
        if (!this.dialog.openDialogs.length) {
            const data = {
                admin: this.userData,
                mpGroup: this.mpGroup,
                approvalRequests: this.approvalRequest,
                isLimited: isLimited,
                carrierData: this.carrierData,
                planChoices: this.planChoices,
            };
            const dialogConfig = new MatDialogConfig();
            dialogConfig.disableClose = true;
            if (data.isLimited) {
                dialogConfig.maxWidth = "500px";
            } else {
                dialogConfig.minWidth = "100%";
                dialogConfig.height = "100%";
            }
            dialogConfig.data = data;
            const dialogRef = this.dialog.open(AdminApprovalChecklistComponent, dialogConfig);
            this.subscriptions.push(
                dialogRef.afterClosed().subscribe((response) => {
                    if (response === "logout") {
                        this.logout(selectedPortal.ADMIN_PORTAL);
                    }
                }),
            );
        }
    }
    getRole(role: string): string {
        return role === this.assistingProdPrev ? this.assistingProd : role === this.enrollerPrev ? this.enroller : this.primaryProd;
    }

    /**
     * get producer message
     */
    getMessage(): void {
        const loggedInProducerId = this.store.selectSnapshot(UserState).producerId;
        const subOrdinates = this.producerSearchList ? this.producerSearchList.content : [];
        let accountProducers: SearchProducer[] = [];
        const params = {
            filter: "accountId:" + this.route.parent.snapshot.params.mpGroupId,
        };
        this.subscriptions.push(
            this.producerService.producerSearch(params).subscribe((resp) => {
                accountProducers = resp.content;
                accountProducers.forEach((prod) => {
                    if (prod.role === this.primaryProducer) {
                        this.specialInstructionsByName = `${prod.name.firstName} ${prod.name.lastName}`;
                        if (prod.id === loggedInProducerId) {
                            this.producerRole = prod.role;
                        }
                    }
                    if (!subOrdinates.length && prod.id === loggedInProducerId && prod.role !== this.primaryProducer) {
                        this.producerRole = this.getRole(prod.role);
                        this.conditionThreeFlag = true;
                    }
                    subOrdinates.forEach((subOrd: { id: number }) => {
                        if (prod.id === subOrd.id && prod.role === this.primaryProducer) {
                            this.fullName = `${prod.name.firstName} ${prod.name.lastName}`;
                            this.conditionOneFlag = true;
                        } else if (prod.id === loggedInProducerId && prod.role !== this.primaryProducer && this.conditionOneFlag) {
                            this.conditionTwoFlag = true;
                            this.conditionOneFlag = false;
                            this.producerRole = this.getRole(prod.role);
                        } else if (
                            prod.id === loggedInProducerId &&
                            prod.role !== this.primaryProducer &&
                            !this.conditionOneFlag &&
                            !this.conditionTwoFlag
                        ) {
                            this.producerRole = this.getRole(prod.role);
                            this.conditionThreeFlag = true;
                        } else if (prod.id === subOrd.id && prod.role !== this.primaryProducer) {
                            this.fullName = `${prod.name.firstName} ${prod.name.lastName}`;
                            this.conditionFourFlag = true;
                        } else if (this.conditionOneFlag || this.conditionFourFlag) {
                            if (this.fullName && this.fullNameList.indexOf(this.fullName) === -1) {
                                this.fullNameList.push(this.fullName);
                            }
                            if (this.fullNameList.length > 1) {
                                this.conditionFiveFlag = true;
                            }
                            if (this.conditionFiveFlag) {
                                this.conditionOneFlag = false;
                                this.conditionFourFlag = false;
                            }
                        }
                    });
                });
            }),
        );
    }
    logout(portal: string): void {
        this.router.navigate([`${portal}/login`]);
    }
    openAuthorizationCodePopUp(): void {
        this.dialog.open(ProducerAuthorizationCodePopupComponent, {
            backdropClass: "backdrop-blur",
            width: "600px",
            data: {
                mpGroup: this.mpGroup,
                producerCheckoutData: this.currentAccount.producers,
            },
        });
    }
    /**
     * This function sets unplugged access parameters when access is allowed.
     */
    setAllowAccessWhileUnplugged(): void {
        this.subscriptions.push(
            this.appTakerService.overrideMaintenanceLock(this.mpGroup.toString()).subscribe((resp) => {
                this.alertTypeAccess = alertTypes.ALLOWACCESS;
                this.isMaintananceLockFlag = true;
                this.sharedService.checkUnpluggedDetails({
                    allowAccess: this.currentAccountDetails.checkedOut,
                    isCheckedOut: this.alertTypeAccess === alertTypes.ALLOWACCESS,
                    hasMaintenanceLock: this.isMaintananceLockFlag,
                });
            }),
        );
    }
    setCheckOutToUnpluggedFlag(status: boolean): void {
        this.isLoading = true;
        this.subscriptions.push(
            this.appTakerService.setCheckoutAllowed(this.mpGroup.toString(), status).subscribe(
                (resp) => {
                    // eslint-disable-next-line max-len
                    this.alertMessage =
                        "this account is no longer available for unplugged checkout, check-in functionality is available, if needed";
                    this.alertType = status ? alertTypes.ENABLECHECKOUT : alertTypes.BLOCKCHECKOUT;
                    this.getProducerCheckoutAllowedStatus();
                },
                (error) => {
                    this.isLoading = false;
                },
            ),
        );
    }
    getProducerCheckoutAllowedStatus(): void {
        this.subscriptions.push(
            this.appTakerService.getCheckoutAllowed(this.mpGroup.toString()).subscribe(
                (resp) => {
                    this.checkoutEnableFlag = resp;
                    if (!this.checkoutEnableFlag) {
                        this.alertType = alertTypes.BLOCKCHECKOUT;
                    }
                    this.isLoading = false;
                },
                (error) => {
                    this.isLoading = false;
                },
            ),
        );
    }

    getAccountContactDetails(): void {
        if (this.mpGroup) {
            this.subscriptions.push(
                this.account$.subscribe((resp) => {
                    this.phoneNumbers = resp.primaryContact.phoneNumbers;
                }),
            );
        }
    }

    /**
     * This function will be called when user clicks on widgets on dashboard
     * @param widgetName string
     * @returns void
     */
    widgetNavigation(widgetName: DashboardWidget): void {
        this.isDashboard = false;
        this.isBenefitOffering = false;
        // TODO : Need to handle aflac links
        switch (widgetName) {
            case DashboardWidget.ACCOUNT_PROFILE_WIDGET: {
                this.navigateTo("profile/account-info");
                break;
            }
            case DashboardWidget.BENEFITS_OFFERING_WIDGET: {
                this.isBenefitOffering = true;
                this.navigateToBenefitsOffering();
                break;
            }
            case DashboardWidget.EMPLOYEE_WIDGET: {
                this.navigateTo("employees");
                break;
            }
            case DashboardWidget.INVITE_CO_ENROLLERS_WIDGET: {
                this.navigateTo("commissions");
                break;
            }
            case DashboardWidget.SEND_BUSINESS_WIDGET: {
                this.navigateTo("business/schedule-send");
                break;
            }
        }
    }
    /**
     * This method will open wellthie pop up
     */
    openWellthiePopup(): void {
        this.empoweredModalService.openDialog(WellthiePopupComponent, {
            data: { accessedFrom: AccessedFrom.ACCOUNT_DASHBOARD },
        });
    }

    /**
     * This function is used to open registration guide pop-up
     */
    openEverwellRegistrationGuidePopup(): void {
        this.empoweredModalService.openDialog(RegistrationGuideComponent);
    }

    // This method is used  to fetch field-force service link from configurations using tag name
    fetchFieldForceUrl(): void {
        this.subscriptions.push(
            this.staticService.getConfigurations(this.fieldForceUrlConfigurationTagName, this.mpGroup).subscribe((fieldForceUrl) => {
                if (fieldForceUrl && fieldForceUrl.length) {
                    this.fieldForceServiceUrl = fieldForceUrl[0].value;
                }
            }),
        );
    }

    /**
     * Open modal dialog and show account instruction details
     */
    showAccountInstructions(): void {
        this.empoweredModalService.openDialog(SpecialInstructionsComponent, {
            data: {
                specialInstructions: this.specialInstructions,
                specialInstructionsByName: this.specialInstructionsByName,
                specialInstructionsModifiedDate: this.specialInstructionsModifiedDate,
            },
        });
    }

    /**
     * This methode will get details of SutherLand call center and set special instructions and lastmodified date if any.
     */
    getAccountCallCenters(): void {
        if (this.memberInfo[userId.CALL_CENTER_ID] && this.memberInfo[userId.CALL_CENTER_ID] === this.SOUTHERLAND_CALL_CENTER) {
            this.subscriptions.push(
                this.accountService
                    .getAccountCallCenters(this.mpGroup, userId.CALL_CENTER_ID)
                    .subscribe((accountCallCenters: AccountCallCenter[]) => {
                        if (accountCallCenters && accountCallCenters.length) {
                            this.accountCallCenters = accountCallCenters;
                            this.accountCallCenters.forEach((data) => {
                                if (
                                    data[CALL_CENTER] &&
                                    data[CALL_CENTER].id === this.SOUTHERLAND_CALL_CENTER &&
                                    data.specialInstructions
                                ) {
                                    this.specialInstructions = data.specialInstructions;
                                    this.specialInstructionsModifiedDate = data.lastModified;
                                }
                            });
                        }
                    }),
            );
        }
    }
    /**
     * This function will get the group attribute for benefits offering setup and if attribute is not present it will create one
     */
    getIboGroupAttribute(): void {
            this.accountService
                .getGroupAttributesByName([IBO_GROUP_ATTRIBUTE_NAME])
                .pipe(
                    switchMap((resp) => {
                        if (resp.length === 0) {
                            return this.accountService.createGroupAttribute({
                                attribute: IBO_GROUP_ATTRIBUTE_NAME,
                                value: IBO_LANDING_STEP,
                            });
                        }

                        return of(false);
                    }),
                    takeUntil(this.destroy$)
                )
                .subscribe();
    }
    /**
     * This method will be called when we click on refresh AG
     */
    refreshAflacGroup(): void {
        const currentAccount: AccountDetails = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        if (currentAccount.importType === AccountImportTypes.SHARED_CASE && this.canRefreshAccount) {
            this.refreshAccount();
        }
        if (
            (currentAccount.importType === AccountImportTypes.SHARED_CASE ||
                currentAccount.importType === AccountImportTypes.AFLAC_GROUP) &&
            this.isRefreshEligible &&
            (this.isRefreshEligible.refreshAllowed || this.isRefreshEligible.requiresBenefitOfferingRenewal)
        ) {
            this.subscriptions.push(this.agRefreshService.refreshAgOffering(currentAccount, this.isRefreshEligible, true).subscribe());
        }
    }
    /**
     * used to handle refresh api call and show warning message.
     * @param message used to pass in toast.
     * @param toastType to pass toast type.
     */
    openToast(message: string, toastType: ToastType): void {
        const toastData: ToastModel = {
            message: message,
            toastType: toastType,
        };
        this.store.dispatch(new OpenToast(toastData));
    }

    /**
     * this fucntion is used to get Account Producer role.
     * @param groupId used to pass in function.
     */
    getAccountProducerRole(groupId: string): void {
        this.subscriptions.push(
            this.sharedService.getEnroller(groupId).subscribe((enroller) => this.store.dispatch(new SetPrivacyForEnroller(!!enroller))),
        );
    }
    /**
     * ng life cycle hook
     * used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        if (this.subscriptions && this.subscriptions.length > 0) {
            this.subscriptions.forEach((sub) => sub.unsubscribe());
        }
        this.destroy$.next();
        this.destroy$.complete();
    }
}
