import {
    MemberListDisplayItem,
    SearchMembers,
    MemberStatus,
    MemberService,
    AuthenticationService,
    AccountService,
    StaticService,
    NotificationService,
    AccountList,
    RouteStateModel,
    CensusService,
    BenefitsOfferingService,
    AflacService,
} from "@empowered/api";
import { Select, Store } from "@ngxs/store";
import { Component, OnInit, ElementRef, ViewChild, AfterContentInit, OnDestroy } from "@angular/core";
import { MatDialogRef, MatDialog } from "@angular/material/dialog";
import { PageEvent } from "@angular/material/paginator";
import { MatSelect } from "@angular/material/select";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { Observable, Subscription, Subject, of, combineLatest } from "rxjs";
import { map, take, skip, takeUntil, withLatestFrom, filter, shareReplay, catchError, tap, switchMap, finalize } from "rxjs/operators";
import { FormBuilder, Validators, FormGroup, FormControl } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { UploadCensusComponent } from "../census/upload-census/upload-census.component";
import { DomSanitizer } from "@angular/platform-browser";
import { UserService } from "@empowered/user";
import {
    Permission,
    ConfigName,
    SHOP_SUCCESS,
    BooleanConst,
    CustomDataFilterConstants,
    MemberList,
    UserPermissionList,
    AppSettings,
    EnrollmentMethod,
    ToastType,
    MemberListItem,
    NotificationCode,
    ContactType,
    CountryState,
    AbstractNotificationModel,
    ProducerCredential,
} from "@empowered/constants";
import { MembersHelperService } from "../members-helper.service";
import { CurrencyPipe } from "@angular/common";
import {
    EmpoweredPaginatorComponent,
    DataFilter,
    OpenToast,
    CloseAllToast,
    ToastModel,
    ConfirmAddressDialogComponent,
    CensusManualEntryComponent,
    EnrollmentMethodComponent,
} from "@empowered/ui";
import {
    LoadMembers,
    MemberListState,
    AccountListState,
    AddGroup,
    ResetDualPlanYear,
    IsQleShop,
    EnrollmentMethodState,
    SetEnrollmentMethodSpecific,
    SetMemberIdentity,
    SetMemberInfo,
    EnrollmentMethodModel,
    EnrollmentMethodStateModel,
    SharedState,
    StaticUtilService,
    UtilService,
    DualPlanYearService,
    AccountInfoState,
} from "@empowered/ngxs-store";
import { TPIRestrictionsForHQAccountsService, SharedService } from "@empowered/common-services";
import { DateService } from "@empowered/date";
import { NotificationQueueService } from "@empowered/util/websockets";

const EMPLOYEE_NAME_ESCAPE_CHARS = "##EmployeeName##";
const TERM_DATE_ESCAPE_CHARS = "##TermDate##";
const REHIRE_DATE_ESCAPE_CHARS = "##RehireDate##";
const TERMINATION_DATE_ESCAPE_CHARS = "##Terminationdate##";
const CIE_NUMBER_ESCAPE_CHARS = "##Number##";
const TERM_REASON_ESCAPE_CHARS = "##TermReason##";

const NAME = "name";
const EDIT_MODE = "editMode";
const TERMINATE_DATE = "terminateDate";
const TERMINATION_DATE = "terminationDate";
const EDIT_REASON = "editReason";
const PARTNER_RESULT = "partnerServiceResult";
const SUCCESS = "SUCCESS";
const COMMENTS = "comments";
const FUTURE_DATE = "futureDate";
const CIF_ERROR = "cifError";
const EDIT_TERMINATION_DATE = "editTerminationDate";
const NOTIFICATIONS = "notifications";
const INTEGER_PARSE_INDEX = 10;
const UPLOAD_CENSUS_KEY = "uploadCensus";
const ADD_EMPLOYEES_KEY = "addEmployee";
const TRUE_VALUE = "TRUE";
const HQ_ACCOUNT = "is_hq_account";
const NOTIFICATION_COUNT_VAR = "count";
@Component({
    selector: "empowered-member-list",
    templateUrl: "./member-list.component.html",
    styleUrls: ["./member-list.component.scss"],
    providers: [DataFilter],
})
export class MemberListComponent implements OnInit, AfterContentInit, OnDestroy {
    @Select(MemberListState.membersList) membersList$: Observable<MemberListItem[]>;
    @Select(MemberListState.fullMemberListResponse) fullMemberListResponse$: Observable<SearchMembers>;
    @Select(MemberListState.activeCount) activeCount$: Observable<string>;
    @ViewChild(EmpoweredPaginatorComponent, { static: true }) matPaginator: EmpoweredPaginatorComponent;
    @ViewChild(MatSort, { static: true }) matSort: MatSort;
    @ViewChild("statusFilterDropdown") statusFilterDropdown: MatSelect;
    @ViewChild("productFilterDropdown", { static: true }) productFilterDropdown: MatSelect;
    @ViewChild("notificationFilterDropdown") notificationFilterDropdown: MatSelect;

    MemberInfo: any;
    form: FormGroup;
    search = new FormControl();
    statuses = new FormControl();
    products = new FormControl([]);
    notifications = new FormControl([]);
    pageNumberControl: FormControl = new FormControl(1);
    dataSource = new MatTableDataSource<MemberListDisplayItem>();
    manualEmployeeDialogRef: MatDialogRef<CensusManualEntryComponent, any>;
    state: any;
    isEnrollmentData = false;
    isMemberList = false;
    membersListDisplay$: Observable<MemberListDisplayItem[]>;

    subscriptions: Subscription[] = [];
    memberList: MemberListDisplayItem[] = [];
    statusList = [MemberStatus.ACTIVE, MemberStatus.TERMINATED];
    productList: string[] = [];
    notificationList: NotificationCode[] = [];
    filterDataStatusList: string[] = [];
    filterDataProductList: string[] = [];
    filterDataNotificationList: string[] = [];
    storeAllNotifications: string[] = [];
    statusfilterGroups = [];
    latestOperation: "search" | "product" | "status" | "notification";
    alertMessage = {
        show: false,
        type: "",
        message: "",
    };
    employeeThresholdValue: number;
    credentials: any;
    employeeListConst = "EMPLOYEELIST";
    membersListColumnsMap = [
        {
            propertyName: "fullName",
            isSortable: true,
        },
        {
            propertyName: "registered",
            isSortable: true,
        },
        {
            propertyName: "coverageNameList",
            isSortable: true,
        },
        {
            propertyName: "dependents",
            isSortable: false,
        },
        {
            propertyName: "employeeId",
            isSortable: true,
        },
        {
            propertyName: "notifications",
            isSortable: true,
        },
        {
            propertyName: "quickActions",
            isSortable: false,
        },
    ];
    displayedColumnsArray: string[] = this.membersListColumnsMap.map((col) => col.propertyName);
    pageSizeOptions: number[] = AppSettings.pageSizeOptions;
    parentMemberListResponse: MemberListDisplayItem[] = [];

    membersListLanguagePath = "primary.portal.members.membersList";
    filter = {
        freeText: {
            firstName: "",
            lastName: "",
            employeeId: undefined,
        },
        query: {
            employeeId: undefined,
            firstName: "",
            lastName: "",
            status: [],
            products: [],
            notifications: [],
        },
    };
    filterParams = {
        filter: "",
        search: "",
        size: 0,
        page: MemberList.pageNumberCount,
    };

    dropdownStatus = false;
    resultsLoaded = false;
    threshold = false;

    displayStatusContent = "";
    displayProductContent = "";
    displayNotificationContent = "";
    isLoading = true;
    searchTerm = undefined;
    searchTermOnEnter = undefined;
    timeOut = undefined;
    noResultsFound = "";
    noResultsFoundMessage = "";
    mpGroup: any;
    subscribeCounter = 0;
    count = 0;
    totalElementsCount = 0;
    activeCount: string;
    fullMemberListResponse: SearchMembers;
    filterMemberResponse: MemberListItem[];
    activeCol: string;
    filterOpen = false;
    isTpiAccount = false;
    isHqAccount = false;
    showAddEmployee = true;
    restrictShop = false;
    showShopConfig = true;
    languageStrings = {
        searchEmployees: this.language.fetchPrimaryLanguageValue(`${this.membersListLanguagePath}.search.employees`),
        addEmployee: this.language.fetchPrimaryLanguageValue(`${this.membersListLanguagePath}.addEmployees`),
        status: this.language.fetchPrimaryLanguageValue(`${this.membersListLanguagePath}.status`),
        coverages: this.language.fetchPrimaryLanguageValue(`${this.membersListLanguagePath}.coverage`),
        notification: this.language.fetchPrimaryLanguageValue(`${this.membersListLanguagePath}.notification`),
        checkbox: this.language.fetchPrimaryLanguageValue("primary.portal.members.workLabel.checkbox"),
        info: this.language.fetchPrimaryLanguageValue("primary.portal.members.workLabel.info"),
        warning: this.language.fetchPrimaryLanguageValue("primary.portal.members.workLabel.warning"),
        unlistedQuoteEmployees: this.language.fetchPrimaryLanguageValue(`${this.membersListLanguagePath}.quoteunlistedemployees`),
    };
    langStrings = {};
    searchInputEventTargetObj: string;
    censusDialogRef: MatDialogRef<UploadCensusComponent>;
    options = [
        {
            name: this.language.fetchPrimaryLanguageValue("primary.portal.census.uploadCensus"),
            value: "uploadCensus",
        },
        {
            name: this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.licensedModal.title"),
            value: "addEmployee",
        },
    ];
    payFrequencies = [];
    selectedVal = "";
    enrollmentState: EnrollmentMethodStateModel;
    storedMpGroup: any;
    specificEnrollmentObj: EnrollmentMethodModel;
    genericEnrollmentObj: EnrollmentMethodModel;
    visitedMpGroupStateObj: string[];
    bodyElement = document.querySelector("body");
    searchFreetextValue: any;
    portal: string;
    portalTypeAdminVal = "ADMIN";
    isShopEnabled = true;
    canOnlyCreateTestMember: boolean;
    canCreateTestMember: boolean;
    canCreateMember: boolean;
    canReadMember: boolean;
    isDirect = false;
    notificationResponse = [];
    configurationSubscriber: Subscription;
    unpluggedFeatureFlag: boolean;
    totalElementFlag: boolean;
    validationRegex: any;
    @Select(SharedState.regex) regex$: Observable<any>;
    private unsubscribe$ = new Subject<void>();
    memberListData$: Observable<MemberListItem[]>;
    storedState: CountryState[] = [];
    account: AccountList;
    routeState$: Observable<RouteStateModel>;
    GET_ACCOUNT_DATA_WITH_EXISTING_POLICIES = this.language.fetchPrimaryLanguageValue("primary.portal.duplicateRecords.existingPolicies");
    toastType: ToastType;
    message = "";
    isImported = false;
    TOAST_DURATION = 5000;
    actionText = "";
    DEFAULT_URL: string;
    isDisable = false;
    currentDate = new Date();
    importingFromAflac: string;
    hasPrivilege$ = of(false);
    showShopLink: boolean;
    showZeroState: boolean;
    disableOptionNoBenefits = false;
    disableCoverageProducts = false;
    restrictImportMember = false;
    restrictUploadCensus = false;
    restrictCreateMember = false;
    showImportAflac = true;
    importEmployeePermission$: Observable<boolean>;
    showAddEmployeeConfig = true;
    readonly permissionEnum = Permission;
    readonly NONE = "None";
    memberListSubject = new Subject<MemberListItem[]>();
    memberList$ = this.memberListSubject.asObservable();
    wsAccountMemberData$: Observable<any>;
    notificationWSData$: Observable<any>;
    notificationWSSubscription: Subscription;
    loggedInMemberId: number;
    accountInfoId: number;
    accountMemberList$: Observable<MemberListDisplayItem[]>;

    constructor(
        private readonly router: Router,
        private readonly store: Store,
        private readonly fb: FormBuilder,
        private readonly route: ActivatedRoute,
        private readonly dataFilter: DataFilter,
        private readonly elementRef: ElementRef,
        private readonly dialog: MatDialog,
        private readonly language: LanguageService,
        private readonly memberService: MemberService,
        private readonly domSanitizer: DomSanitizer,
        private readonly utilService: UtilService,
        private readonly authenticationService: AuthenticationService,
        private readonly accountService: AccountService,
        private readonly staticService: StaticService,
        private readonly notificationService: NotificationService,
        private readonly userService: UserService,
        private readonly sharedService: SharedService,
        private readonly tpiRestrictions: TPIRestrictionsForHQAccountsService,
        private readonly staticUtil: StaticUtilService,
        private readonly dualPlanYearService: DualPlanYearService,
        private readonly censusService: CensusService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly membersHelperService: MembersHelperService,
        private readonly aflacService: AflacService,
        private readonly currencyPipe: CurrencyPipe,
        private readonly dateService: DateService,
        private readonly notificationQueueService: NotificationQueueService,
    ) {
        this.regex$.pipe(take(2)).subscribe((data) => {
            if (data) {
                this.validationRegex = data;
                this.form = this.fb.group({
                    searchInput: new FormControl("", {
                        validators: [
                            Validators.pattern(this.validationRegex.SEARCH_FIELD),
                            Validators.minLength(MemberList.minSearchTextLength),
                        ],
                        updateOn: "blur",
                    }),
                });
            }
        });
        this.getLanguageStrings();
        this.memberListData$ = this.store.select(MemberListState.membersList);
    }

    ariaLabelForMemberName(firstName: string, lastName: string): string {
        const name = `${lastName}, ${firstName}`;
        const languageString = this.language.fetchPrimaryLanguageValue("primary.portal.members.membersList.viewEmployee");

        return languageString.replace(/#memberName/g, name);
    }

    getCredentials(): void {
        this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((res: any) => {
            this.credentials = res;
        });
    }

    /**
     * Fetch language specifications using the language service and store in an array.
     */
    getLanguageStrings(): void {
        this.langStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.members.membersList.notification",
            "primary.portal.member.rehire.rehireconfirm",
            "primary.portal.member.ciferror.errorconfirm",
            "primary.portal.member.editterminate.edittermconfirm",
            "primary.portal.member.terminate.terminationconfirm",
            "primary.portal.member.editterminate.editreasonconfirm",
            "primary.portal.member.editterminate.editreasonfurtheraction",
            "primary.portal.member.editterminate.editcoveragedatefurtheraction",
            "primary.portal.member.testText",
            "primary.portal.member.list.noPermissionToAdd",
            "primary.portal.member.list.showingItem",
            "primary.portal.member.list.showingItems",
            "primary.portal.member.cifError.editErrorConfirm",
            "primary.portal.members.membersList.title",
            "primary.portal.members.membersList.filter.clear",
            "primary.portal.members.membersList.filter.apply",
            "primary.portal.members.membersList.addEmployees",
            "primary.portal.members.membersList.quoteunlistedemployees",
            "primary.portal.members.membersList.page",
            "primary.portal.members.membersList.quickActions.email",
            "primary.portal.members.membersList.quickActions.message",
            "primary.portal.qle.pendingText",
            "primary.portal.direct.policy",
            "primary.portal.direct.policies",
            "primary.portal.common.of",
            "primary.portal.members.membersList.shop",
            "primary.portal.members.membersList.status",
            "primary.portal.members.membersList.coverage",
            "primary.portal.members.membersList.",
            "primary.portal.member.editTerminate.successReasonTermEdit",
            "primary.portal.member.editTerminate.editComments",
            "primary.portal.member.editterminate.editDateFurtherAction",
            "primary.portal.duplicateRecords.importAflac",
            "primary.portal.duplicateRecords.refreshEmployeeList",
            "primary.portal.duplicateRecords.importedEmployeeRecords",
            "primary.portal.duplicateRecords.importingEmployeeRecords",
            "primary.portal.duplicateRecords.viewEmployeeList",
            "primary.portal.duplicateRecords.noNewEmployeeRecords",
            "primary.portal.duplicateRecords.noUpdatesToEmployeeRecords",
            "primary.portal.duplicateRecords.refreshingEmployee",
            "primary.portal.duplicateRecords.refreshCompleted",
            "primary.portal.notificationCount",
            "primary.portal.member.list.noPermissionToRead",
            "primary.portal.customer.noBenefits",
            "primary.portal.member.cifError.editErrorConfirmPast",
            "primary.portal.notification.enrollmentsPendingTransmittal.multipleNotifications.displayText",
            "primary.portal.notification.enrollmentsPendingTransmittal.singleNotification.displayText",
        ]);

        this.notificationWSData$ = this.userService.credential$.pipe(
            take(1),
            tap((credential: ProducerCredential) => {
                this.accountInfoId = this.store.selectSnapshot(AccountInfoState.getAccountInfo)?.id;
                if (credential.producerId) {
                    this.MemberInfo = credential;
                    this.loggedInMemberId = credential.producerId;
                }
            }),
            switchMap(() => this.notificationQueueService.getMemberListNotifications(this.loggedInMemberId, this.accountInfoId)),
        );

        combineLatest([this.notificationWSData$, this.memberList$])
            .pipe(
                map(([wsData, accountListArr]) =>
                    accountListArr.map((accountMemberListItem) => {
                        let notificationCountValue = 0;
                        const notificationForAccount = wsData[accountMemberListItem.id];
                        notificationCountValue = this.getNotificationCount(
                            accountMemberListItem,
                            notificationCountValue,
                            notificationForAccount,
                        );
                        const newAccountObj = {
                            ...accountMemberListItem,
                            notificationSum: notificationCountValue,
                            notifications: notificationForAccount
                                ? this.notificationService.getNotificationDisplayText(
                                      notificationForAccount,
                                      notificationCountValue > 1
                                          ? this.langStrings[
                                                "primary.portal.notification.enrollmentsPendingTransmittal.multipleNotifications.displayText"
                                            ]
                                          : this.langStrings[
                                                "primary.portal.notification.enrollmentsPendingTransmittal.singleNotification.displayText"
                                            ],
                                  )
                                : [],
                        };
                        return newAccountObj;
                    }),
                ),
                tap((accountMemberList) => {
                    this.dataSource.data = this.utilService.copy(accountMemberList);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * This is the initial function that gets executed in this component
     * fetching config values, permissions and store values
     * Showing alert messages regarding termination functionality based on param values.
     * fetching values which are required to load the component.
     * adding logic to handle sorting case insensitive
     */
    ngOnInit(): void {
        this.getConfigurations();
        this.routeState$ = this.route.paramMap.pipe(map(() => window.history.state));
        this.store
            .select(AccountListState.getGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                this.account = res;
            });
        if (this.router.url.indexOf("direct") >= 0) {
            this.isDirect = true;
        }
        this.getPermissions();
        this.getCredentials();
        this.store.dispatch(new ResetDualPlanYear());
        const mpGroupObj: any = this.store.selectSnapshot(AccountListState.getGroup);
        if (mpGroupObj) {
            if (mpGroupObj.state) {
                this.state = mpGroupObj.state;
            } else if (mpGroupObj.situs) {
                this.state = mpGroupObj.situs.state.abbreviation;
            }
        }

        this.portal = this.store.selectSnapshot(SharedState.portal);
        if (this.portal === this.portalTypeAdminVal) {
            this.isShopEnabled = false;
        } else {
            this.isShopEnabled = true;
        }
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        if (this.router.url.indexOf("prospect") !== -1) {
            // Checking for payroll Prospect Path
            this.mpGroup = this.route.parent?.parent.snapshot.params ? this.route.parent.parent.snapshot.params.prospectId : null;
        } else {
            // Checking for payroll Account Path
            this.mpGroup = this.route.parent?.parent.snapshot.params ? this.route.parent.parent.snapshot.params.mpGroupId : null;
        }
        this.memberService.isUpdateMemberList.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                this.getMemberList();
            }
        });
        this.routeState$
            .pipe(takeUntil(this.unsubscribe$))
            // eslint-disable-next-line complexity
            .subscribe((params: RouteStateModel) => {
                let message = "";
                let isSuccess = true;
                if ("rehireDate" in params) {
                    // Rehired date success message
                    message = this.langStrings["primary.portal.member.rehire.rehireconfirm"]
                        .replace(EMPLOYEE_NAME_ESCAPE_CHARS, params["name"])
                        .replace(REHIRE_DATE_ESCAPE_CHARS, params["rehireDate"]);
                } else if (EDIT_MODE in params && TERMINATE_DATE in params && EDIT_REASON in params) {
                    if (params[PARTNER_RESULT] === SUCCESS) {
                        message = this.langStrings["primary.portal.member.editTerminate.successReasonTermEdit"]
                            .replace(EMPLOYEE_NAME_ESCAPE_CHARS, params[NAME])
                            .replace(TERM_REASON_ESCAPE_CHARS, params[EDIT_REASON])
                            .replace(TERMINATION_DATE_ESCAPE_CHARS, params[TERMINATE_DATE]);
                    } else if (params[PARTNER_RESULT] === "") {
                        message = this.langStrings["primary.portal.member.editterminate.editDateFurtherAction"]
                            .replace(EMPLOYEE_NAME_ESCAPE_CHARS, params[NAME])
                            .replace(TERM_DATE_ESCAPE_CHARS, params[TERMINATE_DATE])
                            .replace(CIE_NUMBER_ESCAPE_CHARS, params[CIF_ERROR]);
                    }
                } else if (COMMENTS in params) {
                    message = this.langStrings["primary.portal.member.editTerminate.editComments"].replace(
                        EMPLOYEE_NAME_ESCAPE_CHARS,
                        params[NAME],
                    );
                } else if (EDIT_MODE in params && FUTURE_DATE in params) {
                    if (params[PARTNER_RESULT] === SUCCESS) {
                        // edit termination date success message
                        message = this.langStrings["primary.portal.member.editterminate.edittermconfirm"]
                            .replace(EMPLOYEE_NAME_ESCAPE_CHARS, params[NAME])
                            .replace(TERM_DATE_ESCAPE_CHARS, params[EDIT_TERMINATION_DATE]);
                    } else {
                        message = this.langStrings["primary.portal.member.editterminate.editDateFurtherAction"]
                            .replace(EMPLOYEE_NAME_ESCAPE_CHARS, params[NAME])
                            .replace(TERM_DATE_ESCAPE_CHARS, params[TERMINATE_DATE])
                            .replace(CIE_NUMBER_ESCAPE_CHARS, params[CIF_ERROR]);
                    }
                } else if ("isCoverageDateChanged" in params) {
                    /// coverage end date change success message
                    if (params[PARTNER_RESULT] === SUCCESS) {
                        message = this.langStrings["primary.portal.member.editterminate.edittermconfirm"]
                            .replace(EMPLOYEE_NAME_ESCAPE_CHARS, params[NAME])
                            .replace(TERM_DATE_ESCAPE_CHARS, params[TERMINATE_DATE]);
                    } else {
                        message = this.langStrings["primary.portal.member.editterminate.editDateFurtherAction"]
                            .replace(EMPLOYEE_NAME_ESCAPE_CHARS, params[NAME])
                            .replace(TERM_DATE_ESCAPE_CHARS, params[TERMINATE_DATE])
                            .replace(CIE_NUMBER_ESCAPE_CHARS, params[CIF_ERROR]);
                    }
                } else if ("terminationDate" in params) {
                    // termination date success message
                    if (FUTURE_DATE in params) {
                        message = this.langStrings["primary.portal.member.cifError.editErrorConfirm"]
                            .replace(EMPLOYEE_NAME_ESCAPE_CHARS, params["name"])
                            .replace(CIE_NUMBER_ESCAPE_CHARS, params["cifError"])
                            .replace(TERMINATION_DATE_ESCAPE_CHARS, params["terminationDate"]);
                        isSuccess = false;
                    } else if (CIF_ERROR in params) {
                        message = this.langStrings[
                            this.dateService.isBefore(this.dateService.toDate(params[TERMINATION_DATE] || ""), new Date())
                                ? "primary.portal.member.cifError.editErrorConfirmPast"
                                : "primary.portal.member.cifError.editErrorConfirm"
                        ]
                            .replace(EMPLOYEE_NAME_ESCAPE_CHARS, params[NAME])
                            .replace(TERMINATION_DATE_ESCAPE_CHARS, params[TERMINATION_DATE])
                            .replace(CIE_NUMBER_ESCAPE_CHARS, params[CIF_ERROR]);
                        isSuccess = false;
                    } else {
                        message = this.langStrings["primary.portal.member.terminate.terminationconfirm"]
                            .replace(EMPLOYEE_NAME_ESCAPE_CHARS, params["name"])
                            .replace(TERMINATION_DATE_ESCAPE_CHARS, params["terminationDate"]);
                    }
                } else if ("editReason" in params) {
                    // edit reason succes message
                    message = this.langStrings["primary.portal.member.editterminate.editreasonconfirm"]
                        .replace(EMPLOYEE_NAME_ESCAPE_CHARS, params["name"])
                        .replace(TERM_REASON_ESCAPE_CHARS, params["editReason"]);
                } else if ("editReasonFurtherAction" in params) {
                    // Edit Reason further action message
                    message = this.langStrings["primary.portal.member.editterminate.editreasonfurtheraction"]
                        .replace(EMPLOYEE_NAME_ESCAPE_CHARS, params["name"])
                        .replace(TERM_REASON_ESCAPE_CHARS, params["editReasonFurtherAction"])
                        .replace(CIE_NUMBER_ESCAPE_CHARS, params["CIEerrorFurtherAction"]);
                } else if ("editFutureTerminationDate" in params) {
                    // Edit future termination date message
                    message = this.langStrings["primary.portal.member.cifError.editErrorConfirm"]
                        .replace(EMPLOYEE_NAME_ESCAPE_CHARS, params["name"])
                        .replace(CIE_NUMBER_ESCAPE_CHARS, params["CIEerrorFurtherAction"])
                        .replace(TERMINATION_DATE_ESCAPE_CHARS, params["editFutureTerminationDate"]);
                    isSuccess = false;
                } else if ("editTerminationDate" in params) {
                    // edit termination date success message
                    message = this.langStrings["primary.portal.member.editterminate.edittermconfirm"]
                        .replace(EMPLOYEE_NAME_ESCAPE_CHARS, params["name"])
                        .replace(TERM_DATE_ESCAPE_CHARS, params["editTerminationDate"]);
                } else if (CIF_ERROR in params) {
                    // CIE Error message
                    message = this.langStrings["primary.portal.member.ciferror.errorconfirm"]
                        .replace(EMPLOYEE_NAME_ESCAPE_CHARS, params["name"])
                        .replace(CIE_NUMBER_ESCAPE_CHARS, params[CIF_ERROR]);
                    isSuccess = false;
                } else {
                    message = "";
                }
                if (message !== "") {
                    this.showAlertMessage(message, isSuccess);
                } else {
                    this.hideAlertMessage();
                }
            });
        this.benefitsOfferingService
            .getApprovalRequests(this.mpGroup, true)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.showShopLink = !!resp.length;
            });
        this.DEFAULT_URL = `${this.portal?.toLowerCase()}/payroll/${this.mpGroup}/dashboard`;
        this.unpluggedFeatureFlag = false;
        this.getGroupAttributes();
        this.initHQAccountRestrictions();
        this.benefitsOfferingService
            .getPlanYears(this.mpGroup, false)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((planYearsData) => this.store.dispatch(new IsQleShop({ planYearsData })));
        this.hasPrivilege$ = this.utilService
            .checkDisableForRole12Functionalities(Permission.TPP_RESTRICTED_PERMISSION, this.mpGroup.toString())
            .pipe(
                map(([isRestricted, accountData]) => {
                    this.isTpiAccount = accountData.thirdPartyPlatformsEnabled;
                    this.showAddEmployeeButton();
                    return !(isRestricted && accountData.thirdPartyPlatformsEnabled);
                }),
                shareReplay(1),
            );
    }

    /**
     * function to set boolean value to hide re-upload radio button
     * @return void
     */
    setIsDisableButton(): void {
        this.filterMemberResponse = this.fullMemberListResponse.content.filter((result) => result.products);
        if (this.filterMemberResponse.length) {
            this.isDisable = true;
        }
    }
    /**
     * Import employees from aflac
     * @returns void
     */
    importFromAflac(): void {
        let reload = false;
        this.toastType = ToastType.INFO;
        this.message = this.isImported
            ? this.langStrings["primary.portal.duplicateRecords.refreshingEmployee"]
            : this.langStrings["primary.portal.duplicateRecords.importingEmployeeRecords"];
        this.openToast(this.message, this.toastType, this.actionText, -1);
        this.censusService
            .importSubscribers(this.mpGroup)
            .pipe(
                takeUntil(this.unsubscribe$),
                catchError((error) => {
                    this.store.dispatch(new CloseAllToast());
                    return of(null);
                }),
                tap((response) => {
                    this.toastType = ToastType.SUCCESS;
                    if (response?.status === AppSettings.API_RESP_201) {
                        this.message = this.isImported
                            ? this.langStrings["primary.portal.duplicateRecords.refreshCompleted"]
                            : this.langStrings["primary.portal.duplicateRecords.importedEmployeeRecords"];
                        if (this.router.url === `/${this.DEFAULT_URL}/employees`) {
                            this.openToast(this.message, this.toastType, this.actionText, this.TOAST_DURATION);
                            this.router
                                .navigateByUrl(`${this.DEFAULT_URL}/employees`, { skipLocationChange: true })
                                .then(() => this.router.navigate([`${this.DEFAULT_URL}/employees`]));
                        } else {
                            this.actionText = this.langStrings["primary.portal.duplicateRecords.viewEmployeeList"];
                            this.openToast(this.message, this.toastType, this.actionText, this.TOAST_DURATION);
                        }
                        reload = true;
                    } else if (response?.status === AppSettings.API_RESP_204) {
                        this.message = this.isImported
                            ? this.langStrings["primary.portal.duplicateRecords.noUpdatesToEmployeeRecords"]
                            : this.langStrings["primary.portal.duplicateRecords.noNewEmployeeRecords"];
                        this.openToast(this.message, this.toastType, this.actionText, this.TOAST_DURATION);
                    }
                }),
                filter((importedMembers) => reload === true),
                switchMap((importedMembers) => {
                    this.isLoading = true;
                    return this.store.dispatch(new LoadMembers(this.mpGroup, this.filterParams));
                }),
            )
            .subscribe((memberList) => {
                if (memberList.members) {
                    this.totalElementFlag = memberList.members.fullResponse.totalElements > this.employeeThresholdValue;
                }
                this.totalElementsCount = memberList.members.fullResponse.content.length;
                this.noResultsFoundMessage = this.getFilterParams();
                this.isLoading = false;
            });
        this.getGroupAttributes();
    }
    /**
     * function to get group attributes
     * @returns void
     */
    getGroupAttributes(): void {
        this.accountService
            .getGroupAttributesByName([this.GET_ACCOUNT_DATA_WITH_EXISTING_POLICIES], this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.isImported = response && response.length > 0;
                this.importingFromAflac = this.isImported
                    ? this.langStrings["primary.portal.duplicateRecords.refreshEmployeeList"]
                    : this.langStrings["primary.portal.duplicateRecords.importAflac"];
            });
    }
    /**
     * Initializes value for Toast Model and opens the toast component.
     * @param message content for toast component
     * @param type type of toast to display is set based on this value
     * @param actionText action text is to display the hyperlink
     * @param duration duration of time to display the toast
     * @returns void
     */
    openToast(message: string, type: ToastType, actionText: string, duration: number): void {
        const toastData: ToastModel = {
            message: message,
            toastType: type,
            duration: duration,
            action: {
                text: actionText,
                callback: () => {
                    if (actionText) {
                        if (this.router.url === `/${this.DEFAULT_URL}`) {
                            this.censusService.updateDashboardDetails(true);
                        } else {
                            this.router.navigate([`${this.DEFAULT_URL}/employees`]);
                        }
                    }
                },
            },
        };
        this.store.dispatch(new OpenToast(toastData));
    }
    showAlertMessage(message: string, isSuccess: boolean): void {
        this.alertMessage = {
            show: true,
            type: isSuccess ? "success" : "warning",
            message: message,
        };
    }
    hideAlertMessage(): void {
        this.alertMessage = {
            show: false,
            type: "",
            message: "",
        };
    }
    closeForm(): void {
        this.hideAlertMessage();
    }
    /**
     * function to get members' data
     */
    getMemberList(): void {
        this.setActiveCount();
        this.accountService
            .getPayFrequencies()
            .pipe(take(1))
            .subscribe((res) => {
                this.payFrequencies = res;
                this.store
                    .dispatch(new LoadMembers(this.mpGroup, this.filterParams))
                    .pipe(take(1))
                    .subscribe(() => {
                        this.isLoading = false;
                    });
            });

        this.fullMemberListResponse$.pipe(take(2), skip(1)).subscribe((fmr) => {
            this.fullMemberListResponse = fmr;
            if (this.fullMemberListResponse && this.fullMemberListResponse.content) {
                this.showZeroState = this.fullMemberListResponse.content.length === 0;
            }
            this.parentMemberListResponse = this.getMappedMemberListResponse(fmr.content);
            this.totalElementsCount = this.fullMemberListResponse.totalElements;
            if (this.fullMemberListResponse.totalElements > this.employeeThresholdValue) {
                this.totalElementFlag = true;
            } else {
                this.totalElementFlag = false;
            }
            if (this.totalElementsCount > 0) {
                this.isMemberList = true;
            } else {
                this.isMemberList = false;
            }
            if (this.fullMemberListResponse.totalElements > this.filterParams.size) {
                this.threshold = true;
            }
            this.setIsDisableButton();
        });
        this.membersListDisplayArray();
        this.memberListArraySubscription();
        this.notificationService
            .getNotificationCodes(this.portal, this.mpGroup)
            .pipe(
                map((codes) => codes.sort((a, b) => (a.displayText < b.displayText ? -1 : 1))),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((response) => (this.notificationList = response));

        // fetching all selected status options value as an array and showing clear button
        this.statuses.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((value) => {
            this.filterDataStatusList = value;
        });

        // fetching all selected product options value as an array and showing clear button
        this.products.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((value) => {
            this.filterDataProductList = value;
        });
        // fetching all selected product options value as an array and showing clear button
        this.notifications.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((value) => {
            this.filterDataNotificationList = value;
        });
    }

    /**
     * This method to update the flags to disable or enable products checkbox
     * @param selection Array of selected options
     */
    coverageOptionSelect(selection: Array<string>): void {
        this.disableCoverageProducts = false;
        this.disableOptionNoBenefits = false;
        if (selection.length) {
            const noneSelection = selection.includes(this.NONE);
            this.disableCoverageProducts = noneSelection;
            this.disableOptionNoBenefits = !noneSelection;
        }
    }

    selectedOption(selectedOption: any): void {
        setTimeout(() => {
            switch (selectedOption.value) {
                case "uploadCensus":
                    this.uploadCensus();
                    break;
                case "addEmployee":
                    this.memberManualAdd();
                    break;
                default:
                    return;
            }
        }, 0);
    }
    uploadCensus(): void {
        this.censusDialogRef = this.dialog.open(UploadCensusComponent, {
            hasBackdrop: true,
            minWidth: "100%",
            height: "100%",
            panelClass: "upload-census",
            data: {
                mpGroupId: this.mpGroup,
                isDisable: this.isDisable,
            },
        });
        this.censusDialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this.selectedVal = "";
                this.memberService.updateMemberList(true);
                this.bodyElement.classList.remove("dialog-open-screen-blur");
            });
        this.censusDialogRef
            .afterOpened()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this.bodyElement.classList.add("dialog-open-screen-blur");
            });
    }
    matSelectOpenHandler(isOpen: boolean): void {
        this.filterOpen = isOpen;
    }

    /**
     * Method to set the member list of the account
     */
    membersListDisplayArray(): void {
        this.membersListDisplay$ = this.membersList$.pipe(
            withLatestFrom(this.store.select(MemberListState.activeCount)),
            map(([memberList, activeCount]) => {
                const cloneAccountStore = { ...this.account };
                cloneAccountStore.employeeCount = +activeCount;
                this.store.dispatch(new AddGroup(cloneAccountStore));
                return this.getMappedMemberListResponse(memberList);
            }),
        );
    }

    /**
     * Method to set the active member count
     */
    setActiveCount(): void {
        this.activeCount$.pipe(takeUntil(this.unsubscribe$)).subscribe((resp) => {
            this.activeCount = resp;
        });
    }

    getMappedMemberListResponse(memberList: any): MemberListDisplayItem[] {
        const membersListDisplay: MemberListDisplayItem[] = [];
        memberList.filter((member) => {
            member.notifications.forEach((notification) => {
                this.notificationResponse.push(notification);
            });
        });
        memberList.forEach((memberListItem) => {
            const hasPending = Boolean(memberListItem.products?.pendingProducts);
            let coverageNameList = [];
            if (memberListItem.products?.names) {
                coverageNameList = memberListItem.products?.names?.split(",");
            }
            let pendingItemsList = [];
            if (memberListItem.products?.pendingProducts) {
                pendingItemsList = memberListItem.products?.pendingProducts?.split(",");
            }
            const notificationCodeList = memberListItem.notifications.map((element) => element.code.id);
            let coverageNameListForToolTip = [];
            if (coverageNameList) {
                coverageNameListForToolTip = coverageNameList.map((product) => {
                    let iconMkp = "";
                    if (pendingItemsList?.includes(product)) {
                        iconMkp =
                            // "<mon-icon class='icon-warning' iconName='warning-triangle' [iconSize]='15'></mon-icon>" + " ";
                            "<img class='icon-warning' src='assets/svgs/warning-triangle-yellow.svg' >" + " ";
                    }
                    return `${iconMkp}${product}`;
                });
            }
            const payFrequencyObject = this.payFrequencies.find((x) => x.id === memberListItem.payFrequencyId);
            const totalCost = memberListItem.products?.totalCost;
            const matTooltipContent = this.domSanitizer.bypassSecurityTrustHtml(
                `${this.currencyPipe.transform(totalCost)} <br>${
                    payFrequencyObject && payFrequencyObject.name.toLowerCase()
                }<br><br> ${coverageNameListForToolTip.join(", ")}`,
            );
            membersListDisplay.push(
                Object.assign(
                    {},
                    memberListItem,
                    { fullName: `${memberListItem.lastName}, ${memberListItem.firstName}` },
                    { hasPending },
                    { coverageNameList },
                    { notificationCodeList },
                    { totalCost },
                    { matTooltipContent },
                    { notificationSum: 0 },
                ),
            );
        });
        return membersListDisplay;
    }

    /**
     * Method to get the notification count after removing duplicate notifications
     * @param memberListItem - the current member list iteration
     * @return - the notification count after filtering duplicates
     */
    getNotificationCount(
        account: MemberListItem,
        notificationCountValue: number,
        notificationsForAccount: AbstractNotificationModel[],
    ): number {
        const notifications: AbstractNotificationModel[] = [];
        const accountData = account;
        if (notificationsForAccount && notificationsForAccount.length > 0) {
            notificationsForAccount.forEach((obj) => {
                notifications.push(obj);
            });
            accountData.notifications = notifications;
            notificationCountValue = accountData?.notifications.reduce(
                (accumulator, value) => (value[NOTIFICATION_COUNT_VAR] ? accumulator + value[NOTIFICATION_COUNT_VAR] : accumulator + 1),
                0,
            );
        }
        return notificationCountValue;
    }

    memberListArraySubscription(): void {
        this.membersListDisplay$
            .pipe(
                // Ignore the first (empty) result.
                skip(1),
                tap((membersListDisplay) => {
                    this.subscribeCounter++;
                    this.memberList = membersListDisplay;
                    this.dataSource.data = membersListDisplay;
                    this.memberListSubject.next(membersListDisplay);
                    this.distinctValue();
                    this.hideShopButton();
                    this.resultsLoaded = true;
                    this.pageSizeOptions = this.updatePageSizeOptions(AppSettings.pageSizeOptions);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * This method will show/hide shop button based on member's hire date.
     * If hire date is in fututre, shop button will be hidden.
     *
     * @return employeeData with added field of showShopButton
     */
    hideShopButton(): void {
        this.dataSource.data = this.dataSource.data.map((employeeData) => ({
            ...employeeData,
            showShopButton:
                employeeData.hireDate && this.dateService.isBeforeOrIsEqual(this.dateService.toDate(employeeData.hireDate), new Date()),
        }));
    }

    /**
     * fetching distinct values for status and product from API response data
     */
    private distinctValue(): void {
        const storeAllProducts = [];
        this.parentMemberListResponse.forEach((item) => {
            item.coverageNameList.forEach((prod) => {
                storeAllProducts.push(prod);
            });
        });

        this.productList = storeAllProducts.map((item) => item).filter((value, index, self) => self.indexOf(value) === index);
    }

    getNotificationDescription(code: string): any {
        return this.notificationResponse.find((val) => val.code === code);
    }

    ngAfterContentInit(): void {
        if (this.matPaginator) {
            this.dataSource.paginator = this.matPaginator;
            // eslint-disable-next-line no-underscore-dangle
            this.matPaginator._changePageSize(AppSettings.pageSizeOptions[0]);
            this.dataSource.sort = this.matSort;
            // By default items per page is set to the first available option.
            this.matPaginator.page.pipe(takeUntil(this.unsubscribe$)).subscribe((page: PageEvent) => {
                this.pageNumberControl.setValue(page.pageIndex + 1);
            });
            const sortState: any = { active: this.membersListColumnsMap[0].propertyName, direction: "asc" };
            // TODO: We have to hide sort header arrow once threshold records come
            if (!this.threshold) {
                this.matSort.active = sortState.active;
                this.matSort.direction = sortState.direction;
                this.matSort.sortChange.emit(sortState);
            }
        }
    }

    sortData(event: any): void {
        this.activeCol = event.active;
    }
    // Filter option reset if user has selected options but not apply
    resetFilterOptions(type: string): void {
        switch (type) {
            case MemberList.statusType:
                if (this.filter.query.status.length !== 0) {
                    this.statuses.setValue(this.filter.query.status);
                } else {
                    this.statuses.setValue([]);
                }
                break;
            case MemberList.productType:
                if (this.filter.query.products.length !== 0) {
                    this.products.setValue(this.filter.query.products);
                } else {
                    this.products.setValue([]);
                }
                break;
            case MemberList.notificationType:
                if (this.filter.query.notifications.length !== 0) {
                    this.notifications.setValue(this.filter.query.notifications);
                } else {
                    this.notifications.setValue([]);
                }
                break;
            default:
                break;
        }
    }

    // Added select all option in the filter dropdown it will be toggling the selected options
    toggleSelection(option: any, type: string): boolean | undefined {
        if (type === MemberList.productType) {
            if (!option.checked) {
                this.products.setValue([]);
                return false;
            }
            this.products.setValue(this.productList);
        } else {
            if (!option.checked) {
                this.notifications.setValue([]);
                return false;
            }
            this.notifications.setValue(this.notificationList);
        }
        return undefined;
    }

    getNotificationToolTipContent(notifications: any): any {
        return this.utilService.getNotificationToolTip(notifications, "notificationToolTip");
    }

    /**
     * Function to display text on selection
     * if selected options charater count should be greater than the maximum character count allowed
     *  then return option count or selected all
     * @param optionsList total option list
     * @param selectedOptions selection options list
     * @return content to display after filtering
     */
    filterDisplayContent(optionsList: string[] | NotificationCode[], selectedOptions: string[]): string | undefined {
        let str = "";
        const colonSpace = ": ";
        selectedOptions.forEach((element: string) => {
            if (typeof element === "string") {
                str = str.concat(element.toLowerCase());
            } else {
                str = str.concat(element);
            }
        });
        if (selectedOptions.includes(MemberList.noneProductsSelected)) {
            return colonSpace + MemberList.noneProductsSelected;
        }
        if (optionsList.length && selectedOptions.length === 0) {
            return colonSpace + MemberList.noneProductsSelected;
        }
        if (optionsList.length === selectedOptions.length) {
            return colonSpace + MemberList.allProductsSelected;
        }
        if (optionsList.length && str.length < MemberList.maxCharLenToDisplay) {
            return (
                colonSpace +
                selectedOptions.map((val: string) => (val = val.charAt(0).toUpperCase() + val.substr(1).toLowerCase())).join(", ")
            );
        }
        if (optionsList.length && str.length >= MemberList.maxCharLenToDisplay) {
            return colonSpace + selectedOptions.length;
        }
        return undefined;
    }

    // checking select all option is checked or unchecked
    isChecked(type: string): boolean {
        if (type === MemberList.productType) {
            return this.products.value && this.productList.length && this.products.value.length === this.productList.length;
        }
        return this.notifications.value && this.notificationList.length && this.notifications.value.length === this.notificationList.length;
    }

    // checking all options selected or not, based on that sign change in the select all option
    isIndeterminate(type: string): boolean {
        if (type === MemberList.productType) {
            return (
                this.products.value &&
                this.productList.length &&
                this.products.value.length &&
                this.products.value.length < this.productList.length
            );
        }
        return (
            this.notifications.value &&
            this.notificationList.length &&
            this.notifications.value.length &&
            this.notifications.value.length < this.notificationList.length
        );
    }

    /**
     * Method will trigger once searchText enter in the search field
     * @param searchValue search value
     */
    applySearchFilter(searchValue: any): void {
        this.latestOperation = "search";
        const searchValueTrimmed = searchValue.target.value.trim();
        this.searchTerm = searchValueTrimmed;
        this.searchTermOnEnter = searchValueTrimmed;
        this.filter.query.firstName = "";
        this.filter.query.lastName = "";
        this.filter.query.employeeId = undefined;
        this.dropdownStatus = true;
        if (searchValue.target.value.indexOf(":") > -1) {
            const property = searchValue.target.value.substring(0, searchValue.target.value.indexOf(":"));
            const value = searchValue.target.value.substring(searchValue.target.value.indexOf(":") + 1, searchValue.target.value.length);
            if (value.length >= MemberList.minSearchTextLength && value) {
                this.searchTerm = value;
            } else {
                this.searchTerm = "";
            }
            this.searchTermOnEnter = value;
            this.filterByIdName(property);
            this.dropdownStatus = false;
        } else if (searchValue.target.value.length >= MemberList.minSearchTextLength) {
            this.filter.freeText.employeeId = searchValueTrimmed;
            this.filter.freeText.firstName = searchValueTrimmed;
            this.filter.freeText.lastName = searchValueTrimmed;
            this.filter.query.firstName = searchValueTrimmed;
            this.filter.query.lastName = searchValueTrimmed;
            // setTimeOut to filter data using pipe
            this.timeOut = setTimeout(() => {
                this.filterDataObject();
            }, 1000);
        } else {
            this.filter.freeText.employeeId = "";
            this.filter.freeText.firstName = "";
            this.filter.freeText.lastName = "";
        }
        if (
            searchValue.target.value.length < MemberList.minSearchTextLength ||
            this.searchTerm.replace(/^\s+/g, "").length < MemberList.minSearchTextLength
        ) {
            clearTimeout(this.timeOut);
            this.filterDataObject();
        }
    }

    // Method will trigger when user select name or id in the dropdown list
    filterByIdName(value: any): void {
        this.filter.freeText.employeeId = "";
        this.filter.freeText.firstName = "";
        this.filter.freeText.lastName = "";
        if (this.searchTerm.length >= MemberList.minSearchTextLength) {
            this.filter.query.firstName = "";
            this.filter.query.lastName = "";
            this.filter.query.employeeId = undefined;
            const commaIndex = this.searchTerm.indexOf(",");
            if (commaIndex !== -1) {
                this.filter.query.firstName = this.searchTerm.substr(commaIndex + 1, this.searchTerm.length).trim();
                this.filter.query.lastName = this.searchTerm.substr(0, commaIndex).trim();
            } else if (value.trim().toLowerCase() === MemberList.nameType) {
                this.filter.query.firstName = this.searchTerm;
                this.filter.query.lastName = this.searchTerm;
            } else if (value.trim().toLowerCase() === MemberList.idType) {
                this.filter.query.employeeId = this.searchTerm.toString();
            }
            // setTimeOut to filter data using pipe
            setTimeout(() => {
                this.filterDataObject();
            }, 1000);
        }
        if (this.searchTerm && value) {
            this.form.controls["searchInput"].setValue(value.trim() + ": " + this.searchTerm.replace(/^\s+/g, ""));
        }
        this.dropdownStatus = false;
    }

    // When user press escap key dropdown should be hide
    keyPressEvent(event: any): void {
        if (event.keyCode === MemberList.escapKeyUnicode) {
            this.dropdownStatus = false;
        } else if (event.keyCode === MemberList.enterKeyUnicode) {
            this.filterDataObjectOnEnter();
        }
    }
    onKey(event: any): void {
        if (event.key === MemberList.tabKey) {
            this.filterDataObjectOnEnter();
        }
    }

    // When user enter text and press enter key then custom pipe willreturn filtered result
    filterDataObjectOnEnter(): void {
        this.dropdownStatus = false;
        this.filter.freeText.firstName = this.searchTermOnEnter;
        this.filter.freeText.lastName = this.searchTermOnEnter;
        this.filter.freeText.employeeId = this.searchTermOnEnter;
        this.filterDataObject();
    }

    // We are checking all object properties value here. It should return true if did't find any value
    isEmptyObjectValues(filterObject: unknown): boolean {
        let flag = true;
        if (filterObject) {
            const keys = this.getObjectKeys(filterObject); // fetching all keys from the filter object
            for (const prop of keys) {
                switch (typeof filterObject[prop]) {
                    case CustomDataFilterConstants.dataTypeNumber:
                        if (filterObject[prop] !== undefined) {
                            this.filterParams.filter = this.filterParams.filter + prop + ":" + filterObject[prop] + "|";
                            flag = false;
                        }
                        break;
                    case CustomDataFilterConstants.dataTypeString:
                        if (filterObject[prop] !== "") {
                            this.filterParams.filter = this.filterParams.filter + prop + ":" + filterObject[prop] + "|";
                            flag = false;
                        }
                        break;
                    case CustomDataFilterConstants.dataTypeObject:
                        if (Array.isArray(filterObject[prop]) && filterObject[prop].length !== 0) {
                            const propValue = filterObject[prop].map((val) => val).join(",");
                            if (!this.filterParams.filter.includes(propValue)) {
                                this.filterParams.filter = `${this.filterParams.filter}${prop}:${propValue}|`;
                                flag = false;
                            }
                        } else if (!Array.isArray(filterObject[prop])) {
                            // It will call recursively for checking all objects property values
                            if (prop === "freeText") {
                                this.getFullNameFilterField(filterObject[prop]);
                                if (this.searchFreetextValue) {
                                    this.filterParams.search = this.searchFreetextValue;
                                    flag = false;
                                }
                            } else {
                                flag = this.isEmptyObjectValues(filterObject[prop]);
                            }
                        }
                        break;
                    default:
                        flag = true;
                }
            }
        }
        if (this.filterParams.filter && this.filterParams.filter.slice(-1) === "|") {
            this.filterParams.filter = this.filterParams.filter.slice(0, -1);
        }
        return flag;
    }

    /**
     * Process search query content for first and last name.
     *
     * @param freeTextObj search query content
     */
    getFullNameFilterField(freeTextObj: any): void {
        const lastName = "lastName";
        if (freeTextObj) {
            const keys = this.getObjectKeys(freeTextObj);
            keys.forEach((prop) => {
                if (prop === "firstName") {
                    if (freeTextObj[prop] && freeTextObj[prop].indexOf(" ") > -1) {
                        const property = freeTextObj[prop].substring(0, freeTextObj[prop].indexOf(" "));
                        const value = freeTextObj[prop].substring(freeTextObj[prop].indexOf(" ") + 1, freeTextObj[prop].length);
                        this.searchFreetextValue = property + " " + value;
                    }
                    this.searchFreetextValue = freeTextObj[prop];
                }
                if (prop === lastName) {
                    if (freeTextObj[prop] && freeTextObj[prop].indexOf(" ") > -1) {
                        const property = freeTextObj[prop].substring(0, freeTextObj[prop].indexOf(" "));
                        const value = freeTextObj[prop].substring(freeTextObj[prop].indexOf(" ") + 1, freeTextObj[prop].length);
                        this.searchFreetextValue = property + " " + value;
                    }
                    this.searchFreetextValue = freeTextObj[prop];
                }
                if (prop === "employeeId") {
                    this.searchFreetextValue = freeTextObj[prop];
                }
            });
        }
    }
    getObjectKeys(object: any): string[] {
        return Object.getOwnPropertyNames(object); // fetching all keys from the filter object
    }

    searchInputEvent(event: any): void {
        this.searchInputEventTargetObj = event.target;
    }

    /**
     * When user clicks outside of the search box, dropdown should be hidden
     * @param event click event
     */
    clickOutsideElement(event: MouseEvent): void {
        event.stopPropagation();
        if (this.elementRef.nativeElement.contains(event.target) && this.searchInputEventTargetObj) {
            this.dropdownStatus = false;
        }
    }

    /**
     * Method to filter the members list based on filter selected
     * @param type Type of filter selected
     */
    submitFilterList(type: string): void {
        this.noResultsFoundMessage = "";
        switch (type) {
            case MemberList.statusType:
                this.filterDataStatusList = this.statuses.value;
                if (!this.filterDataStatusList) {
                    this.filter.query.status = [];
                    this.displayStatusContent = "";
                } else {
                    this.filter.query.status = this.filterDataStatusList;
                    this.displayStatusContent = this.filterDisplayContent(this.statusList, this.filterDataStatusList);
                }
                this.statusFilterDropdown.close();
                this.latestOperation = "status";
                break;
            case MemberList.productType:
                this.filterDataProductList = this.products.value;
                if (!(this.filterDataProductList && this.filterDataProductList.length)) {
                    this.filter.query.products = [];
                    this.displayProductContent = "";
                } else {
                    this.filter.query.products = this.filterDataProductList;
                    this.displayProductContent = this.filterDisplayContent(this.productList, this.filterDataProductList);
                }
                this.productFilterDropdown.close();
                this.latestOperation = "product";
                break;
            case MemberList.notificationType:
                this.filterDataNotificationList = this.notifications.value;
                if (!this.filterDataNotificationList) {
                    this.filter.query.notifications = [];
                    this.displayNotificationContent = "";
                } else {
                    this.filter.query.notifications = this.filterDataNotificationList;
                    this.displayNotificationContent = this.filterDisplayContent(this.notificationList, this.filterDataNotificationList);
                }
                this.notificationFilterDropdown.close();
                this.latestOperation = "notification";
                break;
            default:
                break;
        }
        this.filterDataObject();
        this.distinctValue();
    }

    /**
     * Method to clear the filter selected and display default data
     * @param type Type of filter selected
     */
    clearFilterList(type: string): void {
        switch (type) {
            case MemberList.statusType:
                this.statuses.setValue([]);
                this.filterDataStatusList = [];
                break;
            case MemberList.productType:
                this.products.setValue([]);
                this.filterDataProductList = [];
                this.coverageOptionSelect(this.filterDataProductList);
                break;
            case MemberList.notificationType:
                this.notifications.setValue([]);
                this.filterDataNotificationList = [];
                break;
            default:
                break;
        }
    }

    /**
     * Method will be deep copying object and passing to custom filter along with the API response data
     */
    filterDataObject(): void {
        this.isLoading = true;
        this.filterParams.filter = "";
        this.filterParams.search = "";
        this.filter = this.utilService.copy(this.filter);
        if (this.totalElementFlag && !this.isEmptyObjectValues(this.filter)) {
            this.getFilteredResponse();
        } else if (
            !this.totalElementFlag &&
            !this.isEmptyObjectValues(this.filter) &&
            this.filterDataProductList &&
            this.filterDataProductList.length === 0
        ) {
            this.getFilteredResponse();
        } else if (this.threshold && this.isEmptyObjectValues(this.filter)) {
            this.subscribeCounter = 1;
            this.getFilteredResponse();
            this.hideShopButton();
        } else if (this.isEmptyObjectValues(this.filter.freeText) && this.isEmptyObjectValues(this.filter.query)) {
            this.dataSource.data = this.dataFilter.transform(this.parentMemberListResponse, this.filter);
            this.memberList = this.parentMemberListResponse;
            this.totalElementsCount = this.memberList.length;
            this.hideShopButton();
        } else if (this.filter.query.products.length && this.filter.query.products.includes(this.NONE)) {
            this.dataSource.data = this.memberList.filter((data) => !data.products);
            this.totalElementsCount = this.dataSource.data.length;
            this.hideShopButton();
        } else {
            this.dataSource.data = this.dataFilter.transform(this.memberList, this.filter);
            this.totalElementsCount = this.dataSource.data.length;
            this.hideShopButton();
        }
        this.pageSizeOptions = this.updatePageSizeOptions(AppSettings.pageSizeOptions);
        if (this.matPaginator && this.matPaginator.matPaginator) {
            this.matPaginator.matPaginator.firstPage();
        }
        this.isLoading = false;
    }

    /**
     * get filtered responses based on search bar or filter
     */
    getFilteredResponse(): void {
        this.store
            .dispatch(new LoadMembers(this.mpGroup, this.filterParams))
            .pipe(take(1))
            .subscribe((response) => {
                this.isLoading = false;
                if (response.members) {
                    this.totalElementFlag = response.members.fullResponse.totalElements > this.employeeThresholdValue;
                }
                this.totalElementsCount = response.members.fullResponse.content.length;
                this.noResultsFoundMessage = this.getFilterParams();
            });
    }

    // Getting no records found message
    getFilterParams(): string | undefined {
        if (this.filterParams.search) {
            return (this.noResultsFoundMessage = this.filterParams.search);
        }
        if (this.dataSource.data.length === 0) {
            if (
                this.filter.freeText.employeeId ||
                this.filter.freeText.firstName ||
                this.filter.query.firstName ||
                this.filter.freeText.lastName ||
                this.filter.query.lastName ||
                this.filter.query.employeeId
            ) {
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
                this.filter.freeText.employeeId
                    ? (this.noResultsFound = this.filter.freeText.employeeId)
                    : this.filter.query.firstName
                    ? (this.noResultsFound = this.filter.query.firstName)
                    : this.filter.freeText.firstName
                    ? (this.noResultsFound = this.filter.freeText.firstName)
                    : this.filter.query.lastName
                    ? (this.noResultsFound = this.filter.query.lastName)
                    : this.filter.freeText.lastName
                    ? (this.noResultsFound = this.filter.freeText.lastName)
                    : (this.noResultsFound = this.filter.query.employeeId);
            }
            if (this.latestOperation === "search") {
                return this.noResultsFound;
            }
            if (this.filter.query.status.length >= 1 && this.filter.query.products.length >= 1) {
                return "selected filters";
            }
            if (this.filter.query.products.length !== 0) {
                return this.filter.query.products[0];
            }
            if (this.filter.query.status.length !== 0) {
                return this.filter.query.status[0];
            }
            if (this.filter.query.notifications.length !== 0) {
                return this.filter.query.notifications[0];
            }
            return this.noResultsFound;
        }
        return undefined;
    }

    // Dynamically updating page size options
    updatePageSizeOptions(globalPageSizeOptions: number[]): number[] {
        const dataLength = this.dataSource.data.length;
        const pageSizeOptionsLength = globalPageSizeOptions.length;

        for (let i = 0; i < pageSizeOptionsLength; i++) {
            const nextIndex = i + 1;
            if (dataLength < globalPageSizeOptions[0]) {
                return [];
            }
            if (dataLength >= globalPageSizeOptions[i] && dataLength < globalPageSizeOptions[nextIndex]) {
                return globalPageSizeOptions.slice(0, nextIndex);
            }
        }
        return globalPageSizeOptions;
    }

    // Adding this input listener because using valueChanges.subscribe throws RangeError: Maximum call stack size exceeded.
    pageInputChanged(pageNumber: string): void {
        if (this.totalElementsCount > 0) {
            if (this.threshold) {
                this.filterParams.page = Number(pageNumber);
            }
            if (pageNumber !== "" && +pageNumber > 0 && +pageNumber <= this.matPaginator.getNumberOfPages()) {
                this.matPaginator.pageIndex = +pageNumber - 1;
                this.matPaginator.page.next({
                    pageIndex: this.matPaginator.pageIndex,
                    pageSize: this.matPaginator.pageSize,
                    length: this.matPaginator.length,
                });
            }
        }
    }
    /**
     * import aflac policies,
     * fetch member details and navigate to respective component based on portal
     * @param details employee info
     */
    fetchRowDetails(details: MemberListDisplayItem): void {
        this.isLoading = true;
        this.aflacService
            .importAflacPolicies(details.id, this.mpGroup)
            .pipe(
                takeUntil(this.unsubscribe$),
                finalize(() => {
                    this.isLoading = false;
                    if (details.id) {
                        this.store.dispatch(new SetMemberInfo(details));
                        let url = "";
                        const portal = this.portal.toLowerCase();
                        if (this.credentials && this.credentials.producerId) {
                            this.membersHelperService.updateEmployeeStatus(details.status);
                            let subUrl = "payroll";
                            if (this.router.url.indexOf("prospect") !== -1) {
                                subUrl = "payroll/prospect";
                            }
                            url = `/${portal}/${subUrl}/${this.mpGroup}/member/${details.id}/memberadd`;
                        } else if (this.credentials && this.credentials.adminId) {
                            url = `/${portal}/accountList/${this.mpGroup}/member/${details.id}/memberadd`;
                        }
                        this.router.navigate([url], {
                            relativeTo: this.route,
                        });
                    }
                }),
            )
            .subscribe();
    }
    memberManualAdd(): void {
        this.manualEmployeeDialogRef = this.dialog.open(CensusManualEntryComponent, {
            hasBackdrop: true,
            minWidth: "100%",
            height: "100%",
            panelClass: "census-manual-entry",
            data: {
                canOnlyCreateTestMember: this.canOnlyCreateTestMember,
                canCreateTestMember: this.canCreateTestMember,
                canCreateMember: this.canCreateMember,
                isQuoteShopPage: false,
                mpGroupId: this.mpGroup,
            },
        });
    }
    /**
     * function to get permissions for member data
     */
    getPermissions(): void {
        this.authenticationService.permissions$.pipe(takeUntil(this.unsubscribe$)).subscribe(
            (response) => {
                if (response.length > 0) {
                    this.canReadMember = Boolean(response.find((d) => String(d) === UserPermissionList.READ_MEMBER));
                    const canCreateMember = response.find((d) => String(d) === UserPermissionList.CREATE_MEMBER) ? true : false;
                    this.restrictCreateMember = Boolean(response.find((d) => String(d) === Permission.RESTRICT_CREATE_MEMBER));
                    this.restrictImportMember = Boolean(response.find((d) => String(d) === Permission.RESTRICT_IMPORT_MEMBERS));
                    this.restrictUploadCensus = Boolean(response.find((d) => String(d) === Permission.RESTRICT_CENSUS_UPLOAD));
                    this.restrictShop = Boolean(response.find((d) => String(d) === Permission.RESTRICT_SHOP));
                    const createTestMember = response.find((d) => String(d) === UserPermissionList.CREATE_TEST_MEMBER) ? true : false;
                    if (canCreateMember) {
                        this.canCreateMember = true;
                        this.canCreateTestMember = createTestMember;
                        this.canOnlyCreateTestMember = false;
                    } else {
                        this.canCreateMember = createTestMember;
                        this.canCreateTestMember = createTestMember;
                        this.canOnlyCreateTestMember = createTestMember;
                    }
                }
            },
            (Error) => {
                // TODO need to handle Error
            },
        );
    }
    /**
     * Method to navigate user to shop page
     * @param details member details
     */
    specificShopNav(details: MemberListDisplayItem): void {
        this.isLoading = true;
        this.specificEnrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.specificEnrollmentMethod);
        this.visitedMpGroupStateObj = this.store.selectSnapshot(EnrollmentMethodState.visitedMpGroups);
        // eslint-disable-next-line sonarjs/no-collapsible-if
        if (details.id) {
            this.dualPlanYearService.genericShopOeQLeNavigate(details.id, this.mpGroup);
            this.enrollmentState = this.store.selectSnapshot(EnrollmentMethodState);
            this.store.dispatch(new SetMemberIdentity(details.id));
            this.store.dispatch(new SetMemberInfo(details));
            if (this.showShopLink) {
                if (
                    !(
                        (this.specificEnrollmentObj?.enrollmentMethod || this.specificEnrollmentObj?.enrollmentState) &&
                        this.specificEnrollmentObj.mpGroup &&
                        this.specificEnrollmentObj.mpGroup === this.mpGroup &&
                        this.visitedMpGroupStateObj.indexOf(this.mpGroup.toString()) >= 0
                    ) ||
                    (this.specificEnrollmentObj && this.specificEnrollmentObj.enrollmentMethod === EnrollmentMethod.VIRTUAL_FACE_TO_FACE)
                ) {
                    this.isLoading = false;
                    this.dialog.open(EnrollmentMethodComponent, {
                        backdropClass: "backdrop-blur",
                        maxWidth: "600px", // 600px max-width based on the definition in abstract.
                        panelClass: "shopping-experience",
                        data: {
                            mpGroup: this.mpGroup,
                            detail: details,
                            route: this.route,
                            stateAbbr: this.state,
                            openingFrom: this.employeeListConst,
                            method: this.specificEnrollmentObj ? this.specificEnrollmentObj.enrollmentMethod : undefined,
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
                            .getMemberContact(details.id, ContactType.HOME, this.mpGroup.toString())
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
                                                    mpGroup: this.mpGroup,
                                                    detail: details,
                                                    route: this.route,
                                                    stateAbbr: this.state,
                                                    openingFrom: this.employeeListConst,
                                                    method: currentEnrollmentObj ? currentEnrollmentObj.enrollmentMethod : undefined,
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
                            .getMemberContact(details.id, ContactType.HOME, this.mpGroup.toString())
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
                                            headSetState: newEnrollmentStateName,
                                            headSetStateAbbreviation: newEnrollmentStateAbbr,
                                            enrollmentStateAbbreviation: this.enrollmentState.currentEnrollment.enrollmentStateAbbreviation,
                                            userType: currentEnrollmentObj.userType,
                                            memberId: currentEnrollmentObj.memberId,
                                            mpGroup: currentEnrollmentObj.mpGroup,
                                            enrollmentCity: currentEnrollmentObj.enrollmentCity,
                                        }),
                                    );
                                    if (result) {
                                        this.sharedService.changeProducerNotLicensedInEmployeeState(
                                            !this.storedState.some((state) => state.abbreviation === newEnrollmentStateAbbr),
                                        );
                                    }
                                    this.isLoading = false;
                                    this.router.navigate(
                                        [`../../member/${details.id}/enrollment/quote-shop/${this.mpGroup}/specific/${details.id}`],
                                        {
                                            relativeTo: this.route,
                                        },
                                    );
                                },
                                (error) => {
                                    this.isLoading = false;
                                },
                            );
                    }
                }
            } else {
                this.router.navigate([`../../member/${details.id}/enrollment/quote-shop/${this.mpGroup}/specific/${details.id}`], {
                    relativeTo: this.route,
                });
            }
        } else {
            this.isLoading = false;
        }
    }

    genericShopNav(): void {
        this.genericEnrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.specificEnrollmentMethod);
        this.enrollmentState = this.store.selectSnapshot(EnrollmentMethodState);
        this.visitedMpGroupStateObj = this.store.selectSnapshot(EnrollmentMethodState.visitedMpGroups);
        this.store.dispatch(new SetMemberIdentity(null));
        // eslint-disable-next-line max-len
        if (
            !(
                this.genericEnrollmentObj &&
                (this.genericEnrollmentObj.enrollmentMethod || this.genericEnrollmentObj.enrollmentState) &&
                this.genericEnrollmentObj.mpGroup &&
                this.genericEnrollmentObj.mpGroup === this.mpGroup &&
                this.visitedMpGroupStateObj.indexOf(this.mpGroup.toString()) >= 0
            )
        ) {
            this.dialog.open(EnrollmentMethodComponent, {
                backdropClass: "backdrop-blur",
                maxWidth: "600px", // 600px max-width based on the definition in abstract.
                panelClass: "shopping-experience",
                data: { mpGroup: this.mpGroup, route: this.route, stateAbbr: this.state },
            });
        } else {
            this.router.navigate(["enrollment/quote-shop/" + this.mpGroup + "/generic"], {
                relativeTo: this.route,
            });
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
            data: { memberId: details.id, mpGroup: this.mpGroup, purpose: "shop" },
        });
        confirmAddressDialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((addressResult) => {
                if (addressResult.action === SHOP_SUCCESS) {
                    this.store.dispatch(new SetMemberIdentity(details.id));
                    this.store.dispatch(new SetMemberInfo(details));
                    this.sharedService.setEnrollmentValuesForShop(addressResult, currentEnrollmentObj);
                    this.router.navigate(
                        ["../../member/" + details.id + "/enrollment/quote-shop/" + this.mpGroup + "/specific/" + details.id],
                        {
                            relativeTo: this.route,
                        },
                    );
                }
            });
    }
    /**
     * Initialize variables that determine access to specific modules in HQ accounts
     * @returns nothing
     */
    initHQAccountRestrictions(): void {
        this.tpiRestrictions
            .canAccessTPIRestrictedModuleInHQAccount()
            .pipe(
                filter((isNotAnHQAccount) => !isNotAnHQAccount),
                withLatestFrom(this.staticUtil.hasPermission(UserPermissionList.AFLAC_HQ_ACCOUNT_ADD_EMPLOYEE)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(([, canAddEmployee]) => {
                this.options = this.options.filter((option) => option.value !== UPLOAD_CENSUS_KEY);
                if (!canAddEmployee) {
                    this.options = this.options.filter((option) => option.value !== ADD_EMPLOYEES_KEY);
                }
            });
    }
    /**
     * This function checks for restrictions and then enables or disables the add employee button
     */
    showAddEmployeeButton(): void {
        this.importEmployeePermission$ = this.staticUtil.hasAllPermission([Permission.WEBSERVICE_CREATE_MEMBER]);
        this.membersHelperService.setTpiAccountStatus(this.isTpiAccount);
        combineLatest([
            this.staticUtil.fetchConfigs(
                [ConfigName.PRODUCER_PERMISSION_TPP_RESTRICT_CREATE_MEMBER, ConfigName.PRODUCER_PERMISSION_TPP_RESTRICT_SHOP],
                this.mpGroup,
            ),
            this.accountService.getGroupAttributesByName([HQ_ACCOUNT]),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([[showAddEmployeeConfig, showShopConfig], groupAttribute]) => {
                this.showAddEmployeeConfig = showAddEmployeeConfig.value === TRUE_VALUE;
                if (groupAttribute[0]?.attribute === HQ_ACCOUNT) {
                    this.isHqAccount = groupAttribute[0].value === BooleanConst.TRUE;
                }
                this.showShopConfig = showShopConfig.value === TRUE_VALUE;
                this.showAddEmployeeFlag();
            });
    }

    /**
     * This function checks for restrictions and then enables or disables the add employee Flag
     */
    showAddEmployeeFlag(): void {
        if (this.isTpiAccount && this.showAddEmployeeConfig && !this.isHqAccount) {
            this.showAddEmployee = !(this.restrictUploadCensus && this.restrictImportMember && this.restrictCreateMember);
            this.showImportAflac = !this.restrictImportMember;
            this.options = this.options.filter(
                (option) =>
                    (option.value === UPLOAD_CENSUS_KEY && !this.restrictUploadCensus) ||
                    (option.value === ADD_EMPLOYEES_KEY && !this.restrictCreateMember),
            );
        }
        if (this.restrictShop && this.isTpiAccount && !this.isHqAccount && this.showShopConfig) {
            this.isShopEnabled = false;
        }
    }

    /**
     * Function call to get configs from the database
     */
    getConfigurations(): void {
        combineLatest([
            this.staticUtil.cacheConfigs([ConfigName.EMPLOYEE_THRESHOLD_VALUE, ConfigName.ENABLE_NOTIFICATIONS]),
            this.staticService.getConfigurations(ConfigName.UNPLUGGED_CONFIG),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([[employeeThresholdValue, enableNotifications], configs]) => {
                this.employeeThresholdValue = parseInt(employeeThresholdValue?.value, INTEGER_PARSE_INDEX);
                this.filterParams.size = this.employeeThresholdValue;

                this.displayedColumnsArray = !this.staticUtil.isConfigEnabled(enableNotifications)
                    ? this.displayedColumnsArray.filter((data) => data !== NOTIFICATIONS)
                    : this.displayedColumnsArray;

                this.unpluggedFeatureFlag = configs.length && configs[0].value.toLowerCase() === "true";
            });
    }

    // destroying subscribers here for preventing memory leakage
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
