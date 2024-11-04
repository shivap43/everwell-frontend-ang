import { DatePipe, TitleCasePipe } from "@angular/common";
import { MediaMatcher } from "@angular/cdk/layout";
import { SafeHtml, DomSanitizer } from "@angular/platform-browser";
import {
    AfterContentInit,
    AfterViewInit,
    Component,
    OnInit,
    ViewChild,
    ElementRef,
    OnDestroy,
    Injector,
    Renderer2,
    ChangeDetectorRef,
} from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { MatCheckboxChange } from "@angular/material/checkbox";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MatMenuTrigger } from "@angular/material/menu";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSelect } from "@angular/material/select";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";

import { MatAutocomplete } from "@angular/material/autocomplete";
import { MatChipInputEvent } from "@angular/material/chips";
import {
    AccountList,
    producersData,
    FilterParameters,
    StaticService,
    StatusFilterDropdownData,
    AccountTypeFilterDropdownData,
    AccountListService,
    ProducerService,
    CallCenter,
    OpenEnrollmentPeriod,
    AuthenticationService,
    AccountService,
    NotificationService,
    PageableResponse,
    STATUS,
    State,
    AccountListStatus,
    BenefitsOfferingService,
    AccountListType,
    SearchProducer,
} from "@empowered/api";
import { UserService } from "@empowered/user";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { DataFilter, SearchProducerComponent, AddSingleProducerComponent } from "@empowered/ui";
import { Select, Store } from "@ngxs/store";

import {
    BreakpointData,
    BreakPointUtilService,
    SetEligibleEmployees,
    SharedState,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { Observable, Subscription, combineLatest, Subject, of, race, timer, iif } from "rxjs";
import { CreateAccountFormComponent } from "../create-account-form/create-account-form.component";
import { Router, ActivatedRoute } from "@angular/router";
import { InvitationPopupComponent } from "../invitation-popup/invitation-popup.component";
import { ENTER, SPACE, UP_ARROW, DOWN_ARROW } from "@angular/cdk/keycodes";
import { AccountsService, EmpoweredModalService } from "@empowered/common-services";
import { ProdData, OverlayOpen, ProducerCredential, Admin } from "@empowered/constants";
import { ProducerFilterComponent } from "../producer-filter/producer-filter.component";
import { OverlayPositionBuilder, Overlay, OverlayRef, OverlayConfig } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { shareReplay, take, map, switchMap, filter, tap, takeUntil } from "rxjs/operators";
// TODO: PortalInjector is deprecated
// Switch to Injector.create or use the following resources to refactor:
// https://github.com/angular/material.angular.io/issues/701
// https://github.com/angular/angular/issues/35548#issuecomment-588551120
import { PortalInjector } from "@angular/cdk/portal";
import { MoreFilterComponent } from "../more-filter/more-filter.component";
import { CONTAINER_DATA } from "../container-data";
import {
    PaginationConstants,
    DateFormats,
    ConfigName,
    MemberList,
    SearchType,
    UserPermissionList,
    AppSettings,
    ROLE,
    AccountLock,
    Portals,
    SortOrder,
    Address,
    AbstractNotificationModel,
} from "@empowered/constants";
import { Permission } from "@empowered/constants";
import { GuideMeService } from "@empowered/core";
import { AddAccountList, AccountListState, AddGroup, SetDateFilterInfo } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";
import { NotificationQueueService, WSAccountListNotifications } from "@empowered/util/websockets";

const ACCOUNT_PAGE_LIMIT = 1;
const ACCOUNT_THRESHOLD_LIMIT = 1000;
const UNPLUGGED = "UNPLUGGED";
const NOTIFICATION_SUM = "notificationSum";
const PROSPECT = "prospect";
const DATE_START_INDEX = 0;
const DATE_END_INDEX = 10;

const NOTIFICATION_COUNT_VAR = "count";
const type = AccountListType.CLIENT;
const includeAllSubordinates = true;
const ENTER_KEY = "Enter";
const ESCAPE_KEY = "Escape";

export enum ProducerFilterSelectedOption {
    MY_ACCOUNTS = "1",
    TEAMS_ACC = "2",
    UNASSIGNED = "3",
    ALL_ACCOUNTS = "4",
    SPECIFIC_PRODUCER = "5",
}

@Component({
    selector: "empowered-account-list",
    templateUrl: "./account-list.component.html",
    styleUrls: ["./account-list.component.scss"],
    providers: [DataFilter],
    // FIX-ME: commenting the below lines to fix create account form issue. Alternative code fix must be identified for the below lines
    // eslint-disable-next-line @angular-eslint/no-host-metadata-property
    // host: {
    //     "(document:click)": "this.dropdownStatus = false",
    // },
})
export class AccountListComponent implements OnInit, AfterViewInit, AfterContentInit, OnDestroy {
    accountListSearchData$: Observable<PageableResponse<AccountListDisplay>>;
    accountListSearchDataDummy$: Observable<PageableResponse<AccountListDisplay>>;
    forMobileDevices = false;
    forMediumDevices = false;
    isRenewalDisplay = true;
    isApply = false;
    renewalCheck = -1;
    result = "";
    filterParams: FilterParameters = {
        filter: "",
        search: "",
        property: "",
        page: PaginationConstants.PAGE,
        size: PaginationConstants.SIZE,
        value: "",
    };
    SUCCESS = "SUCCESS";
    thesholdValue = "1000";
    stateChipList = [];
    notificationChipList = [];
    notificationResponse = [];
    accountList: any;
    defaultPageNumber = "1";
    rangeVal: unknown;
    employeeCountFilterVal: any;
    renewalFilterVal: any;
    stateFilterVal: any;
    notificationFilterVal: number[];
    producerFilterVal: any;
    productFilterVal: any;
    minimumSearchLength = 3;
    displayedColumnsForProducer = [
        "name",
        "groupNumber",
        "primaryProducer",
        "state",
        "renewalDate",
        "employeeCount",
        "productsCount",
        "status",
        "detailedPartnerAccountType",
        "notificationSum",
        "manageFromProducer",
    ];
    displayedColumnsForAdmin = [
        "name",
        "groupNumber",
        "location",
        "employeeCount",
        "status",
        "detailedPartnerAccountType",
        "notificationSum",
        "manageFromAdmin",
    ];
    pageNumberControl: FormControl = new FormControl(1);
    pageEventSubscription: Subscription;
    form: FormGroup;
    statusFilterVal: any;
    accountTypeFilterVal: string[];
    employeeMin: any;
    employeeMax: number;
    producerFilterDropdown: boolean;
    statusData = [];
    accountTypeData = [];
    renewalData = [];
    stateData = [];
    notificationData = [];
    employeeCountData = [];
    producerData = producersData;
    latest: string;
    stateControl = new FormControl("");
    notificationControl = new FormControl("");
    searchControl = new FormControl("");
    searchField = new FormControl("");
    statusFilter = new FormControl([]);
    accountTypeFilter = new FormControl([]);
    stateFilter = new FormControl([]);
    notificationFilter = new FormControl([]);
    producerFilter = new FormControl("");
    productFilter = new FormControl("");
    groupFilter = new FormControl("");
    renewalFilter = new FormControl("");
    employeeCountFilter = new FormControl("");

    stateFilterSearchControl = new FormControl();
    producerFilterCall: boolean;
    stateFilterChipRemovable = true;
    stateFilterAddOnBlur = false;
    stateFilterResult: State[];
    stateFilterActiveindex = 0;
    readonly permissionEnum = Permission;
    readonly STATUS_INACTIVE = "Inactive";

    @ViewChild("stateFilterAutoCompleteInput") stateFilterAutoCompleteInput: ElementRef<HTMLInputElement>;
    @ViewChild("stateFilterAutoComplete") stateFilterAutoComplete: MatAutocomplete;
    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

    statusOnClick = "";
    accountTypeOnClick: string[] = [];
    teamWritingNumbers: number[] = [];
    stateOnClick = [];
    accountType = "accountTypeFilter";
    notificationOnClick = [];
    storeAllNotifications = [];
    renewalOnClick = "";
    empOnClick = "";
    searchTerm = undefined;
    dropdownStatus = true;
    isProducer = false;
    isAdmin = false;
    threshold = false;
    empMax = 500;
    haveAccounts = false;
    isSpinnerLoading = false;
    onDelete = false;
    filterValue = "type:CLIENT";
    filter = {
        query: {
            name: "",
            groupNumber: "",
            altGroupNumber: "",
            id: undefined,
            products: [],
            producers: [],
            notificationCount: [],
            state: [],
            notifications: [],
            primaryProducer: "",
        },
        ranges: {
            employeeCount: [],
            renewalDate: [],
        },
        strictFields: {
            status: [],
            detailedPartnerAccountType: [],
        },
        freeText: {
            name: "",
            groupNumber: "",
            altGroupNumber: "",
        },
    };
    isDisplayStatus: any;
    isDisplayAccountType: string;
    isDisplayState: any;
    isDisplayRenewal: any;
    isDisplayEmployee: any;
    isDisplayNotification: any;
    filterChoiceState: any;
    filterChoiceStatus: any;
    filterChoiceAccountType: string[];
    filterChoiceRenewal: any;
    filterChoiceEmployeeCount: any;
    filterChoiceNotification: any;
    dataSource = new MatTableDataSource<AccountListDisplay>();
    dataCount: number;
    accountListData: any;
    pageSizeOption: any;
    isLoggedIn = true;
    dataLoaded = false;
    dispError: string;
    mobileQuery: MediaQueryList;
    moreFilterResponse;
    moreFormControls;
    private readonly _mobileQueryListener: () => void;
    createAccountDialogRef: MatDialogRef<CreateAccountFormComponent>;
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild("statusFilterDropdown") statusFilterDropdown: MatSelect;
    @ViewChild("accountTypeFilterDropdown") accountTypeFilterDropdown: MatSelect;

    @ViewChild("renewalFilterDropdown") renewalFilterDropdown: MatSelect;
    @ViewChild("stateFilterDropdown") stateFilterDropdown: MatSelect;
    @ViewChild("notificationFilterDropdown") notificationFilterDropdown: MatSelect;
    @ViewChild("employeeCountFilterDropdown") employeeCountFilterDropdown: MatSelect;
    @ViewChild("input") matInput;
    @ViewChild("stateFilterInput") stateFilterInput: ElementRef;
    @ViewChild("moreFilterOrigin") moreFilterOrigin: ElementRef;
    @ViewChild("producerFilterTrigger") producerFilterTrigger: ElementRef;
    @Select(AccountListState.getAccountList) accountsLi: Observable<AccountList[]>;
    checkmax: any;
    max: Date;
    maxVal: number;
    searchCalled = false;
    stateDropdown: any;
    notificationDropdown: any;
    statusFilterDropdowndata = StatusFilterDropdownData;
    accountTypeFilterDropdowndata = AccountTypeFilterDropdownData;
    stateFilterValresult: string;
    notificationFilterValresult: string;
    thresholdFilter = "";
    listGrid = "list-grid-filter";
    accountTypeFilterValue: string[];
    filterClassNames = {
        status: [this.listGrid, "filter-status"],
        detailedPartnerAccountType: [this.listGrid, "filter-accountType"],
        renewal: [this.listGrid, "filter-renewal"],
        state: [this.listGrid, "filter-state"],
        notification: [this.listGrid, "filter-notification"],
        employeeCount: [this.listGrid, "filter-employeeCount"],
    };
    filterOpen = false;
    producerBtn = false;
    compareZero = 0;
    duplicateCall = false;
    errorCheckLength = 2;
    statusFlag = false;
    accountTypeFlag = false;
    appliedFilters = [];
    filteredStateData = [];
    savedStateChipList: any[];
    savedNotificationChipList: any[];
    languageStrings: Record<string, string>;
    activeCol: string;
    routeAfterLogin: string;
    searchInputEventTargetObj: string;
    searchTermOnEnter: string;
    loggedInProducerId: number;
    adminId: number;
    timeOut = undefined;
    readonly stateFilterSeparatorKeysCodes: number[] = [ENTER, SPACE];
    hasPermission;
    readonly separatorKeysCodes: number[] = [ENTER];
    allSelected = false;
    allStatusSelected = false;
    allAccountTypeSelected = false;
    screenSize: string;
    userCallCenter: CallCenter;
    isCallCenterAgent = false;
    isHybridUser = false;
    overlayRef: OverlayRef;
    producerSearchList: any;
    producerDisplay: string;
    loggedProducerId: number;
    subordinateFlag = false;
    producerReadPermission = "core.producer.read";
    producerNameForOverlay: string;
    producerOptionSelectedForOverlay: string;

    subscriptions: Subscription[] = [];
    adminAccountListEnabled = false;
    showManageColumnForAdmin = false;

    notificationSelectedData: any[] = [];
    companySelectedData: any[] = [];
    statusSelectedData: any[] = [];
    accountTypeSelectedData: string[] = [];
    appliedFilter: any[] = [];
    accountDataList: AccountListDisplay[] = [];
    BREAKPOINT_SIZES = AppSettings.BREAKPOINT_SIZES;
    wnFilter = [];
    ProspectsConst = "prosp";
    selectedIndex = 0;
    notificationFilterCode = [];
    isNotificationFilter: boolean;
    showStateOptions: boolean;

    MemberInfo: ProducerCredential;
    wnOfProducer: Admin;
    subscriber: Subscription[] = [];
    producerSearchSubscription: Subscription;
    totalAccounts: number;
    isStateFilterMenuOpen: boolean;
    AccountType = "AccountType";
    accountTypePtoperty = "detailedPartnerAccountType:";
    stateFilterData: string[];
    nameCount = -1;
    groupNumberCount = -1;
    altGroupNumberCount = -1;
    memberName: string;
    currentProducer: string;
    isRole93 = false;
    isUnassignedExists: boolean;
    accountStatusType = AccountListStatus;
    prevSearch = "";
    otherProducerData: SearchProducer;
    notificationTriggerTypeAll: string[];
    private readonly unsubscribe$: Subject<void> = new Subject();
    accountListSubject = new Subject<AccountList[]>();
    accountList$ = this.accountListSubject.asObservable();
    wsAccountData$: Observable<any>;
    notificationWSData$: Observable<any>;
    notificationWSSubscription: Subscription;
    producerNotificationData$: Observable<AccountListDisplay[]>;
    producerNotificationDataSubscription: Subscription;
    otherProducerNotificationData$: Observable<WSAccountListNotifications>;
    otherProducerNotificationDataSubscription: Subscription;
    notifications: WSAccountListNotifications = {};
    isPublishRequired = false;

    credential$ = this.userService.credential$.pipe(
        filter((credential) => JSON.stringify(credential) !== "{}"),
        take(1),
        tap((credential: ProducerCredential) => {
            if (credential.producerId) {
                this.MemberInfo = credential;
                this.loggedInProducerId = credential.producerId;
            }
            if (credential.adminId) {
                this.adminId = credential.adminId;
            }
        }),
    );

    constructor(
        private readonly store: Store,
        private readonly dialog: MatDialog,
        private readonly fb: FormBuilder,
        private readonly dataFilter: DataFilter,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly staticService: StaticService,
        private readonly elementRef: ElementRef,
        private readonly userService: UserService,
        private readonly producerService: ProducerService,
        private readonly accountListService: AccountListService,
        private readonly domSanitizer: DomSanitizer,
        private readonly datePipe: DatePipe,
        private readonly language: LanguageService,
        private readonly utilService: UtilService,
        private readonly overlay: Overlay,
        private readonly overlayPositionBuilder: OverlayPositionBuilder,
        private readonly accountsService: AccountsService,
        private readonly accountService: AccountService,
        private readonly injector: Injector,
        media: MediaMatcher,
        private readonly authenticationService: AuthenticationService,
        private readonly breakPointUtilService: BreakPointUtilService,
        private readonly notificationService: NotificationService,
        private readonly staticUtil: StaticUtilService,
        private readonly empoweredModal: EmpoweredModalService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly titleCasePipe: TitleCasePipe,
        private readonly renderer: Renderer2,
        private readonly guideMeService: GuideMeService,
        private readonly dateService: DateService,
        private readonly changeDetector: ChangeDetectorRef,
        private readonly notificationQueueService: NotificationQueueService,
    ) {
        this.route.queryParams.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => {
            if (params && params["page"] && params["page"] === this.ProspectsConst) {
                this.selectedIndex = 1;
            }
        });
        this.breakPointUtilService.breakpointObserver$.pipe(takeUntil(this.unsubscribe$)).subscribe((resp: BreakpointData) => {
            if (resp.size === this.BREAKPOINT_SIZES.MD || resp.size === this.BREAKPOINT_SIZES.SM) {
                this.forMediumDevices = true;
                this.forMobileDevices = true;
            } else {
                this.forMediumDevices = false;
                this.forMobileDevices = false;
            }
        });
        this.getNotificationTriggerTypeAll();
        this.isRole93 = this.store.selectSnapshot(SharedState.hasPermission(Permission.READ_AFLAC_ACCOUNT));
        this.breakPointUtilService.breakpointObserver$.pipe(takeUntil(this.unsubscribe$)).subscribe((resp: BreakpointData) => {
            if (resp.size === this.BREAKPOINT_SIZES.SM) {
                this.forMobileDevices = true;
                this.screenSize = "small";
            } else {
                this.forMobileDevices = false;
                if (resp.size === this.BREAKPOINT_SIZES.MD) {
                    this.screenSize = "medium";
                } else if (resp.size !== this.BREAKPOINT_SIZES.XS) {
                    this.screenSize = "large";
                }
            }
        });

        this.credential$.subscribe();
    }
    /**
     * This is the initial function that executes after login.
     * Few service calls to fetch the required data, filters etc are performed
     */
    ngOnInit(): void {
        this.getNotificationEnableConfig();
        this.removeInactiveStatus();
        this.getPortalAndNotifications();

        this.subscriber.push(
            this.store.select(SharedState.hasPermission(UserPermissionList.ACCOUNTLIST_ROLE_20)).subscribe((response) => {
                this.hasPermission = response;
            }),
        );
        this.getLanguageStrings();
        this.loadCurrentProducerData();

        this.notificationWSData$ = this.store.selectOnce(SharedState.hasPermission(UserPermissionList.ACCOUNTLIST_ROLE_20)).pipe(
            switchMap((hqSupport) => {
                if (this.loggedInProducerId) {
                    return this.notificationQueueService.getNotifications(
                        this.loggedInProducerId,
                        JSON.stringify({ includeSubordinates: true, hqSupport: hqSupport }),
                    );
                } else {
                    return this.notificationQueueService.getNotifications(
                        this.adminId,
                        JSON.stringify({ includeSubordinates: false, hqSupport: false }),
                    );
                }
            }),
        );

        this.producerNotificationData$ = combineLatest([this.notificationWSData$, this.accountList$]).pipe(
            map(([notifications, accountList]) => {
                if (notifications && Object.keys(notifications).length) {
                    this.notifications = { ...this.notifications, ...notifications }; // Storing notifications to use filter
                    this.mapNotificationsToAccounts(notifications, accountList);
                }
                return accountList as AccountListDisplay[];
            }),
            tap((accountList) => {
                this.accountList = this.utilService.copy(accountList);
                this.dataSource.data = this.utilService.copy(accountList);
            }),
            takeUntil(this.unsubscribe$),
        );
        this.producerNotificationDataSubscription = this.producerNotificationData$.subscribe();

        if (this.isAdmin) {
            this.accountListSearchDataDummy$ = this.accountListSearchData$ = this.getAccountList(this.filterParams);
        } else {
            const thresholdFilter = `producers.id:${this.loggedInProducerId}|${this.filterValue}`;
            const filterParams: FilterParameters = {
                filter: thresholdFilter,
                search: "",
                property: "",
                page: PaginationConstants.PAGE,
                size: PaginationConstants.SIZE,
                value: "",
                includeAllSubordinates: !this.checkHQSupport(),
            };
            this.accountListSearchDataDummy$ = this.getAccountList(filterParams);
        }
        this.subscriptions.push(
            this.accountListSearchDataDummy$.subscribe((data) => {
                const accountList = data.content;
                const dates: Date[] = [];
                accountList.forEach((element: AccountListDisplay) => {
                    if (element.renewalDate) {
                        dates.push(this.dateService.toDate(element.renewalDate));
                    }
                });
                this.latest = this.dateService.toDate(Math.max.apply(null, dates)).toISOString().slice(DATE_START_INDEX, DATE_END_INDEX);
            }),
        );
        // reset the coverage summary filters
        this.store.dispatch(new SetDateFilterInfo(null));
        this.utilService.setMpGroup(undefined);
        if (this.isProducer) {
            this.subscriptions.push(
                combineLatest([this.userService.credential$, this.staticUtil.hasPermission(UserPermissionList.HYBRID_USER)]).subscribe(
                    ([credential, hybridUserPermission]: [ProducerCredential, boolean]) => {
                        if (credential.producerId && credential.callCenterId) {
                            if (hybridUserPermission) {
                                this.isHybridUser = true;
                            } else {
                                this.isCallCenterAgent = true;
                            }
                            this.staticService.getCallCenter(credential.callCenterId).subscribe((callCenter) => {
                                this.userCallCenter = callCenter;
                            });
                        }
                        this.loggedProducerId = credential.producerId;
                        this.getProducerSubordinate(this.loggedInProducerId);
                        this.setAccountList();
                    },
                    (err) => {
                        this.setAccountList();
                    },
                ),
            );
        } else {
            this.listAccounts();
        }
        this.checkPermission();
        this.pageSizeOption = AppSettings.pageSizeOptions;
        this.getStates();
        this.form = this.fb.group({
            // eslint-disable-next-line no-useless-escape
            searchInput: ["", Validators.pattern(/^[a-zA-Z0-9!@#\$%\^\&*\)\(+=._-]+$/)],
        });
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.accounts.*"));

        // the status filter in the admin portal has a lower number of (and reordered) values, hence the below logic
        if (this.isAdmin) {
            this.statusFilterDropdowndata = this.statusFilterDropdowndata.filter(
                (status) =>
                    status.name !== "Processing" &&
                    status.name !== "Invitation pending" &&
                    status.name !== "Group invitation" &&
                    status.name !== "UnPlugged",
            );
            // moving Open enrollment status to the end of the status filter list
            this.statusFilterDropdowndata.splice(3, 0, this.statusFilterDropdowndata.splice(2, 1)[0]);
        }

        this.statusFilter.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((value) => {
            this.statusFlag = false;
            this.statusFilterVal = value;
        });
        this.accountTypeFilter.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((value) => {
            this.accountTypeFlag = false;
            this.accountTypeFilterVal = value;
        });
        this.stateFilter.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((value) => {
            this.stateFilterVal = value;
        });

        this.notificationFilter.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((value) => {
            this.notificationFilterVal = [];
            this.notificationFilterCode = [];
            value.forEach((element) => {
                this.notificationFilterVal.push(element.id);
                this.notificationFilterCode.push(element.displayText);
            });
        });
        this.producerFilter.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((value) => {
            this.producerFilterVal = value;
        });
        this.getProducerDetails();

        // Checks whether the GuideMe player is already displayed on the page
        if (!document.getElementById("mgPlayerJSProd_btn-start-button")) {
            this.subscriptions.push(
                this.authenticationService
                    .getMyGuideToken()
                    .pipe(
                        tap((token) => {
                            this.guideMeService.embedGuideMePlayer(token, this.renderer);
                        }),
                    )
                    .subscribe(),
            );
        }
    }
    /**
     * gets notification enable config value
     */
    getNotificationEnableConfig(): void {
        this.subscriber.push(
            this.staticUtil
                .cacheConfigEnabled("general.feature.notifications.enable")
                .pipe(filter((res) => !res))
                .subscribe((_) => {
                    this.displayedColumnsForProducer = this.displayedColumnsForProducer.filter((data) => data !== NOTIFICATION_SUM);
                    this.displayedColumnsForAdmin = this.displayedColumnsForAdmin.filter((data) => data !== NOTIFICATION_SUM);
                }),
        );
    }

    /**
     * Loads current producer data
     */
    loadCurrentProducerData(): void {
        if (this.store.selectSnapshot(AccountListState.getCurrentProducer) && this.isProducer) {
            const searchedProducer = this.store.selectSnapshot(AccountListState.getCurrentProducer);
            this.loggedInProducerId = searchedProducer.id;
            this.setTotalAccounts(searchedProducer.id);
            this.memberName = `${searchedProducer.name.firstName.trim()} ${searchedProducer.name.lastName.trim()}`;
            if (this.MemberInfo.producerId !== searchedProducer.id) {
                this.otherProducerData = searchedProducer;
                this.currentProducer = this.memberName;
            } else {
                this.otherProducerData = null;
                this.currentProducer = "";
            }
            this.accountsService.setProducerForProspectList(searchedProducer);
            this.accountsService.setAnyProducerViewed(true);
        } else {
            this.setTotalAccounts();
            if (this.isProducer) {
                this.memberName = `${this.MemberInfo.name.firstName.trim()} ${this.MemberInfo.name.lastName.trim()}`;
                this.loggedInProducerId = this.MemberInfo.producerId;
                this.accountsService.setProducerForProspectList(null);
                this.accountsService.setAnyProducerViewed(false);
            }
        }

        const hqSupport = this.checkHQSupport();
        this.accountsService.changeSelectedProducer(
            this.utilService.copy(
                !this.isAdmin
                    ? {
                        producerName: hqSupport ? this.memberName : null,
                        filterByProducer: hqSupport
                            ? ProducerFilterSelectedOption.MY_ACCOUNTS
                            : ProducerFilterSelectedOption.ALL_ACCOUNTS,
                    }
                    : {},
            ),
        );
    }

    /**
     * check if producer has hq support permission or not
     * @returns boolean indicating producer belongs to hq support or not
     */
    checkHQSupport(): boolean {
        if (this.otherProducerData) {
            return this.otherProducerData.hqSupport;
        }
        return this.hasPermission || this.isRole93;
    }

    /**
     * set total number of accounts for the admin
     * sets total number of accounts of logged in user if no admin id passed
     * @param adminId admin id of the user
     */
    setTotalAccounts(adminId?: number): void {
        this.subscriptions.push(
            this.accountListService.getTotalAccounts(type, includeAllSubordinates, adminId).subscribe((response) => {
                this.totalAccounts = response;
            }),
        );
    }
    /**
     * remove inactive accounts based on config
     */
    removeInactiveStatus(): void {
        this.subscriptions.push(
            this.staticUtil
                .cacheConfigEnabled(ConfigName.HIDE_INACTIVE_ACCOUNTS_STATUS)
                .pipe(filter((hideInactiveAccounts) => hideInactiveAccounts))
                .subscribe((hideInactiveAccounts) => {
                    this.statusFilterDropdowndata = this.statusFilterDropdowndata.filter((status) => status.name !== this.STATUS_INACTIVE);
                }),
        );
    }
    /**
     * get the portal and notifications
     */
    getPortalAndNotifications(): void {
        if (this.store.selectSnapshot(SharedState.portal) === Portals.ADMIN) {
            this.isAdmin = true;
        }
        if (this.store.selectSnapshot(SharedState.portal) === Portals.PRODUCER) {
            this.isProducer = true;
        }
        this.subscriptions.push(
            this.notificationService
                .getNotificationCodes(this.isProducer ? Portals.PRODUCER : Portals.ADMIN)
                .pipe(map((codes) => codes.sort((a, b) => (a.displayText < b.displayText ? -1 : 1))))
                .subscribe((response) => {
                    this.notificationData = response;
                }),
        );
    }
    getProducerDetails(): void {
        this.accountsService.currentProducer.pipe(take(1), takeUntil(this.unsubscribe$)).subscribe((currentProducer: ProdData) => {
            if (currentProducer) {
                this.getSelectedProducer();
            }
        });
    }
    /**
     * get the subordinates of the producer and set the flag to show producer flag
     * @param producerId the producer id of the current producer
     */
    getProducerSubordinate(producerId: number): void {
        if (producerId) {
            const params = {
                supervisorProducerId: producerId,
                includeInactiveProducers: true,
                page: ACCOUNT_PAGE_LIMIT,
                size: ACCOUNT_THRESHOLD_LIMIT,
            };
            this.subscriptions.push(
                this.producerService.producerSearch(params).subscribe((resp) => {
                    this.producerSearchList = resp;
                    this.accountsService.setProductSearchList(resp);
                    this.subordinateFlag = this.producerSearchList && this.producerSearchList.content.length > 0;
                    this.accountsService.viewProducerFilter(this.subordinateFlag);
                }),
            );
        }
    }
    /**
     * set the account list for the current producer
     */
    setAccountList(): void {
        const thresholdFilter = `producers.id:${this.loggedInProducerId}|${this.filterValue}`;
        const filterParams: FilterParameters = {
            filter: thresholdFilter,
            search: "",
            property: "",
            page: PaginationConstants.PAGE,
            size: PaginationConstants.SIZE,
            value: "",
            includeAllSubordinates: !this.checkHQSupport(),
        };
        this.accountListSearchData$ = this.getAccountList(filterParams);
        this.listAccounts();
    }

    /**
     * Method to get all group IDs with selected notifications filtered
     * @return array of group IDs (numbers)
     */
    getGroupIdWithNotifications(): number[] {
        const groupIds: number[] = [];
        groupIds.push(
            ...Object.keys(this.notifications)
                .filter(
                    (accountId) =>
                        this.notifications[accountId].filter((notificationForAccount) =>
                            this.notificationFilterVal.includes(notificationForAccount.code.id),
                        ).length,
                )
                .map((accountId) => +accountId),
        );
        return groupIds;
    }

    ngAfterViewInit(): void {
        this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential: ProducerCredential) => {
            if (credential.producerId) {
                const loggedInProducerId = credential.producerId;
                const accountId = this.route.snapshot.queryParams[AppSettings.QUERY_PARAM_ACCOUNT_ID];
                if (loggedInProducerId && accountId) {
                    this.openInvitationPopup(loggedInProducerId, parseInt(accountId, 10));
                }
            }
        });
        // The view update requires angular detection to be triggered to avoid ExpressionChangedAfterItHasBeenCheckedError console error
        this.changeDetector.detectChanges();
    }

    ngAfterContentInit(): void {
        this.dataSource.sort = this.sort;
        this.dataSource.sortingDataAccessor = (data, sortHeaderId) => {
            if (typeof data[sortHeaderId] === "string") {
                return SortOrder.TWO + data[sortHeaderId].toLocaleLowerCase();
            }
            return data[sortHeaderId];
        };
        this.dataSource.paginator = this.paginator;
        this.pageEventSubscription = this.paginator?.page.pipe(takeUntil(this.unsubscribe$)).subscribe((page: PageEvent) => {
            this.pageNumberControl.setValue(page.pageIndex + 1);
        });
    }
    // method to jump to a particular page
    pageInputChanged(pageNumber: string): void {
        if (pageNumber !== "" && +pageNumber > this.compareZero && +pageNumber <= this.paginator.getNumberOfPages()) {
            this.paginator.pageIndex = +pageNumber - 1;
            this.paginator.page.next({
                pageIndex: this.paginator.pageIndex,
                pageSize: this.paginator.pageSize,
                length: this.paginator.length,
            });
        }
    }

    // updates page size options in pagination
    updatePageSizeOptions(globalPageSizeOptions: number[]): number[] {
        const dataLength = this.dataSource.data.length;
        const pageSizeOptionsLength = globalPageSizeOptions.length;

        for (let i = this.compareZero; i < pageSizeOptionsLength; i++) {
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

    /**
     * Method will trigger once searchText enter in the search field
     * @param searchValue search value
     */
    applySearchFilter(searchValue: any): void {
        this.duplicateCall = false;
        const searchValueTrimmed = searchValue.target.value.trim();
        this.searchTerm = searchValueTrimmed;
        this.searchTermOnEnter = searchValueTrimmed;
        this.filter.query.name = "";
        this.filter.query.groupNumber = "";
        this.filter.query.altGroupNumber = "";
        this.dropdownStatus = true;
        const searchValueLength = searchValue.target.value.length;
        if (searchValue.target.value.indexOf(":") > -1) {
            this.onDelete = true;
            const property = searchValue.target.value.substring(0, searchValue.target.value.indexOf(":"));
            const value = searchValue.target.value.substring(searchValue.target.value.indexOf(":") + 1, searchValueLength);
            if (value.length >= this.minimumSearchLength && value) {
                this.searchTerm = value;
            } else {
                this.searchTerm = "";
            }
            this.searchTermOnEnter = value;
            this.filterByIdName(property);
            this.dropdownStatus = false;
        } else if (searchValueLength >= this.minimumSearchLength || (searchValueLength && searchValue.key === ENTER_KEY)) {
            this.isPublishRequired = true; // Publish for new notifications, since account-list is changing
            this.filter.freeText.groupNumber = searchValueTrimmed;
            this.filter.freeText.name = searchValueTrimmed;
            this.filter.freeText.altGroupNumber = searchValueTrimmed;
            if (searchValueLength && searchValueLength < this.minimumSearchLength) {
                this.onDelete = true;
            }
            if (searchValue.key === ENTER_KEY || searchValue.key === ESCAPE_KEY) {
                this.dropdownStatus = false;
            }
            this.searchCalled = true;
            // setTimeout to load the filtered data
            this.timeOut = setTimeout(() => {
                this.filterDataObject();
            }, 1000);
            const filterName = {
                query: {
                    name: searchValueTrimmed,
                    groupNumber: "",
                    altGroupNumber: "",
                    id: undefined,
                    products: [],
                    producers: [],
                    notificationCount: [],
                    state: [],
                    notifications: [],
                    primaryProducer: "",
                },
                ranges: {
                    employeeCount: [],
                    renewalDate: [],
                },
                strictFields: {
                    status: [],
                    detailedPartnerAccountType: [],
                },
                freeText: {
                    name: "",
                    groupNumber: "",
                    altGroupNumber: "",
                },
            };
            const filterGroupNumberCount = {
                query: {
                    name: "",
                    groupNumber: searchValueTrimmed,
                    altGroupNumber: "",
                    id: undefined,
                    products: [],
                    producers: [],
                    notificationCount: [],
                    state: [],
                    notifications: [],
                    primaryProducer: "",
                },
                ranges: {
                    employeeCount: [],
                    renewalDate: [],
                },
                strictFields: {
                    status: [],
                    detailedPartnerAccountType: [],
                },
                freeText: {
                    name: "",
                    groupNumber: "",
                    altGroupNumber: "",
                },
            };
            const filterAltGroupNumberCount = {
                query: {
                    name: "",
                    groupNumber: "",
                    altGroupNumber: searchValueTrimmed,
                    id: undefined,
                    products: [],
                    producers: [],
                    notificationCount: [],
                    state: [],
                    notifications: [],
                    primaryProducer: "",
                },
                ranges: {
                    employeeCount: [],
                    renewalDate: [],
                },
                strictFields: {
                    status: [],
                    detailedPartnerAccountType: [],
                },
                freeText: {
                    name: "",
                    groupNumber: "",
                    altGroupNumber: "",
                },
            };
            this.nameCount = this.dataFilter.transform(this.accountList, filterName).length;
            this.groupNumberCount = this.dataFilter.transform(this.accountList, filterGroupNumberCount).length;
            this.altGroupNumberCount = this.dataFilter.transform(this.accountList, filterAltGroupNumberCount).length;
        } else {
            this.filter.freeText.groupNumber = "";
            this.filter.freeText.name = "";
            this.filter.freeText.altGroupNumber = "";
            this.nameCount = this.accountList.length;
            this.groupNumberCount = this.accountList.length;
            this.altGroupNumberCount = this.accountList.length;
        }
        if (searchValueLength < this.minimumSearchLength || this.searchTerm.replace(/^\s+/g, "").length < this.minimumSearchLength) {
            clearTimeout(this.timeOut);
            if (this.onDelete || !searchValueLength) {
                this.filterDataObject();
                this.onDelete = false;
            }
        }
    }

    // search based on account name or account number
    filterByIdName = (value: any): void => {
        this.dropdownStatus = false;
        this.duplicateCall = false;
        this.dropdownStatus = false;
        if (this.threshold) {
            this.filterParams.search = this.filter.freeText.name;
            if (this.searchTerm && value) {
                this.form.controls["searchInput"].setValue(value.trim() + ":" + this.searchTerm);
            }
        } else if (this.searchTerm.length >= this.minimumSearchLength) {
            if (value === "name") {
                this.filter.query.name = this.searchTerm;
                this.filter.query.groupNumber = "";
                this.filter.query.altGroupNumber = "";
                this.filter.freeText.name = "";
                this.filter.freeText.groupNumber = "";
                this.filter.freeText.altGroupNumber = "";
            } else if (value === "groupNumber") {
                this.filter.query.groupNumber = this.searchTerm;
                this.filter.query.name = "";
                this.filter.query.altGroupNumber = "";
                this.filter.freeText.name = "";
                this.filter.freeText.groupNumber = "";
                this.filter.freeText.altGroupNumber = "";
            } else if (value === "altGroupNumber") {
                this.filter.query.altGroupNumber = this.searchTerm;
                this.filter.query.name = "";
                this.filter.query.groupNumber = "";
                this.filter.freeText.name = "";
                this.filter.freeText.groupNumber = "";
                this.filter.freeText.altGroupNumber = "";
            } else {
                this.filter.freeText.groupNumber = "";
                this.filter.freeText.name = "";
                this.filter.freeText.altGroupNumber = "";
            }
            if (this.searchTerm && value) {
                this.form.controls["searchInput"].setValue(value.trim() + ":" + this.searchTerm.replace(/^\s+/g, ""));
            }
        }
        // setTimeout to load the filtered data
        setTimeout(() => {
            this.filterDataObject();
        }, 1000);
        if (this.searchTerm && value) {
            this.form.controls["searchInput"].setValue(value.trim() + ": " + this.searchTerm.replace(/^\s+/g, ""));
        }
    };

    searchInputEvent(event: any): void {
        this.searchInputEventTargetObj = event.target;
    }

    keyPressEvent(event: any): void {
        if (event.keyCode === MemberList.escapKeyUnicode) {
            this.dropdownStatus = false;
        } else if (event.keyCode === MemberList.enterKeyUnicode) {
            this.duplicateCall = false;
            this.filterDataObjectOnEnter();
        }
    }

    onKey(event: any): void {
        if (event.key === MemberList.tabKey) {
            this.filterDataObjectOnEnter();
        }
    }

    clickOutsideElement(event: any): void {
        event.stopPropagation();
        if (this.elementRef.nativeElement.contains(event.target) && this.searchInputEventTargetObj && !this.threshold) {
            this.filterDataObjectOnEnter();
        } else if (this.elementRef.nativeElement.contains(event.target) && this.searchInputEventTargetObj && this.threshold) {
            this.dropdownStatus = false;
        }
    }
    /**
     * set search term on enter
     */
    filterDataObjectOnEnter(): void {
        this.dropdownStatus = false;
        this.filter.freeText.name = this.searchTermOnEnter;
        this.filter.freeText.groupNumber = this.searchTermOnEnter;
        this.filter.freeText.altGroupNumber = this.searchTermOnEnter;
    }
    /**
     * @description check for threshold and set the status of filters to show account list
     * @param filterValues additional filter values to be applied to show account list
     */
    setProducerStatus(filterValues?: string): void {
        if (!this.threshold) {
            this.filter = this.utilService.copy(this.filter);
        }
        this.setStatusForThreshold(filterValues);
    }
    /**
     * @description set the status of the filters to show the account list based on the filters for threshold
     * @param filterValues additional filter values to be applied to show account list
     */
    setStatusForThreshold(filterValues?: string): void {
        if (!this.isAdmin) {
            this.subscriptions.push(
                // eslint-disable-next-line complexity
                this.accountsService.currentProducer.subscribe((currentProducer: ProdData) => {
                    filterValues = filterValues ? filterValues : "";
                    let producerFilterIds = [];
                    this.filterParams.unassignedOnly = false;
                    this.filterParams.includeAllSubordinates = false;
                    if (currentProducer.filterByProducer === ProducerFilterSelectedOption.MY_ACCOUNTS) {
                        this.filter.query.primaryProducer = null;
                        producerFilterIds.push(this.loggedInProducerId);
                    } else if (currentProducer.filterByProducer === ProducerFilterSelectedOption.TEAMS_ACC) {
                        this.filterParams.includeAllSubordinates = true;
                        this.filter.query.primaryProducer = null;
                        producerFilterIds = this.setTeamsAccount(currentProducer, producerFilterIds);
                    } else if (currentProducer.filterByProducer === ProducerFilterSelectedOption.UNASSIGNED) {
                        this.filterParams.includeAllSubordinates = true;
                        this.filterParams.unassignedOnly = true;
                        producerFilterIds.push(this.loggedInProducerId);
                    } else if (currentProducer.filterByProducer === ProducerFilterSelectedOption.ALL_ACCOUNTS) {
                        this.filterParams.includeAllSubordinates = true;
                        if (!this.otherProducerData) {
                            producerFilterIds.push(this.loggedInProducerId);
                        }
                    }
                    if (
                        (currentProducer.filterByProducer === ProducerFilterSelectedOption.UNASSIGNED ||
                            currentProducer.filterByProducer === ProducerFilterSelectedOption.ALL_ACCOUNTS) &&
                        this.otherProducerData
                    ) {
                        producerFilterIds.push(this.otherProducerData.id);
                    }
                    if (this.producerNameForOverlay) {
                        this.producerDisplay = this.producerNameForOverlay
                            ? ": " + this.producerNameForOverlay
                            : this.producerNameForOverlay;
                    }
                    if (this.subordinateFlag) {
                        this.producerFilter.setValue(this.producerNameForOverlay ? this.producerNameForOverlay : "");
                    }
                    if (producerFilterIds.length || currentProducer.filterByProducer !== ProducerFilterSelectedOption.TEAMS_ACC) {
                        let getAccounts = false;
                        filterValues = !producerFilterIds.length
                            ? `${filterValues} ${this.filterValue}`
                            : `${filterValues} producers.id:${producerFilterIds}|${this.filterValue}`;

                        if (this.filterParams.filter !== filterValues || this.threshold || this.prevSearch !== this.filterParams.search) {
                            getAccounts = true;
                            this.filterParams.filter = filterValues;
                        }
                        if (!this.duplicateCall) {
                            this.duplicateCall = true;
                            this.accountListSearchData$ = this.getAccountList(this.filterParams);
                            this.prevSearch = this.filterParams.search;
                            filterValues = "";
                            this.listAccounts();
                        }
                    }
                }),
            );
        } else {
            this.filterParams.filter = filterValues;
            this.accountListSearchData$ = this.getAccountList(this.filterParams);
            this.listAccounts();
        }
    }
    /**
     * get the writing numbers base on the selected option
     * @param currentProducer current producer searched
     * @param producerIds the producer id's
     * @return required writing number for my teams account filter
     */
    setTeamsAccount(currentProducer: ProdData, producerIds: string[]): string[] {
        if (this.producerSearchList) {
            this.teamWritingNumbers = [];
            this.producerSearchList.content.forEach((producer) => {
                const name = `${producer.name.firstName} ${producer.name.lastName}`;
                if (name === currentProducer.producerName) {
                    producerIds = producerIds.concat(producer.id);
                }
            });
        }
        return producerIds;
    }

    /**
     * pass data to filter object
     */
    async filterDataObject(): Promise<void> {
        this.filterParams.search = this.filter.freeText.name;
        this.thresholdFilter = "";
        if (this.statusFilterVal && this.statusFilterVal.length > this.compareZero) {
            this.setThresholdStatusFilter();
        } else {
            this.statusOnClick = "";
            this.statusFilter.setValue([]);
            this.filter.strictFields.status = [];
            this.isDisplayStatus = "";
        }
        if (this.accountTypeFilterVal && this.accountTypeFilterVal.length > this.compareZero) {
            this.setThresholdAccountFilter();
        }
        if (this.stateFilterVal && this.stateFilterVal.length > this.compareZero) {
            this.setThresholdStateFilter();
        }
        if (this.renewalFilter.value && this.renewalFilter.value.length > this.compareZero) {
            this.setRenewalFilterForThreshold();
        } else {
            this.renewalOnClick = "";
            this.renewalFilter.setValue("");
            this.filter.ranges.renewalDate = [];
            this.isDisplayRenewal = "";
        }
        if (this.employeeCountFilter.value && this.employeeCountFilter.value.length > this.compareZero) {
            this.setThresholdEmployeeCountFilter();
        } else {
            this.empOnClick = "";
            this.employeeCountFilter.setValue("");
            this.employeeCountFilterVal = [];
            this.filter.ranges.employeeCount = [];
            this.isDisplayEmployee = "";
        }
        if (this.notificationFilterVal && this.notificationFilterVal.length > this.compareZero) {
            await this.setThresholdNotificationFilter();
        }
        this.setProducerStatus(this.thresholdFilter);
    }
    /**
     * set notification filter value if threshold
     */
    async setThresholdNotificationFilter(): Promise<void> {
        // Return if threshold has not been reached
        if (this.totalAccounts < ACCOUNT_THRESHOLD_LIMIT) {
            return;
        }
        // if total accounts greater than threshold, fetch the latest notifications to filter the groupIds
        await new Promise<void>((resolve, reject) => {
            race(
                iif(() => !!this.otherProducerData, this.otherProducerNotificationData$, this.notificationWSData$),
                timer(3000),
            )
                .pipe(take(1))
                .subscribe((data) => {
                    if (data && typeof data !== "number" && Object.keys(data).length) {
                        this.notifications = data;
                    }
                    resolve();
                });
        });
        this.filterParams.filteredGroupList = this.getGroupIdWithNotifications();
        this.notificationFilterDropdown.close();
    }
    /**
     * set state filter value if threshold
     */
    setThresholdStateFilter(): void {
        this.thresholdFilter = `${this.thresholdFilter}state:${this.stateFilterVal}|`;
        this.filterChoiceState = this.stateFilter.value;
        this.isDisplayState = ": " + this.filterDisplayContent(this.stateData, this.stateFilterVal, "stateFilter");
    }
    /**
     * set status filter value if threshold
     */
    setThresholdStatusFilter(): void {
        this.statusFilterVal = this.statusFilterVal.map((statusFilters) => statusFilters.toLowerCase());
        const statusFilterName = this.statusFilterDropdowndata
            .filter((el) => this.statusFilterVal.indexOf(el.name.toLowerCase()) > -1)
            .map((ele) => ele.name);
        const statusFilterVal = this.statusFilterDropdowndata
            .filter((el) => this.statusFilterVal.indexOf(el.name.toLowerCase()) > -1)
            .map((ele) => ele.value);
        this.thresholdFilter = `${this.thresholdFilter}status:${statusFilterVal}|`;
        this.statusOnClick = this.statusFilterVal;
        this.filterChoiceStatus = this.statusFilter.value;
        this.filter.strictFields.status = statusFilterName;
        this.isDisplayStatus = ": " + this.filterDisplayContent(this.statusData, statusFilterName, "statusFilter");

        this.statusFilterDropdown.close();
    }
    /**
     * set account type filter value if threshold
     */
    setThresholdAccountFilter(): void {
        this.accountTypeFilterVal = this.accountTypeFilterVal.map((statusFilter) => statusFilter.toLowerCase());
        const accountTypeFilter = this.accountTypeFilterDropdowndata
            .filter((el) => this.accountTypeFilterVal.indexOf(el.name.toLowerCase()) > -1)
            .map((ele) => ele.value);
        this.thresholdFilter = `${this.thresholdFilter}${this.accountTypePtoperty}${accountTypeFilter}|`;
        this.accountTypeFilterValue = this.accountTypeFilterDropdowndata
            .filter((el) => this.accountTypeFilterVal.indexOf(el.name.toLowerCase()) > -1)
            .map((ele) => ele.name);
        this.filterChoiceAccountType = this.accountTypeFilter.value;
        this.isDisplayAccountType = ": " + this.filterDisplayContent(this.accountTypeData, this.accountTypeFilterValue, this.accountType);

        this.accountTypeFilterDropdown.close();
    }
    /**
     * set employee count filter value if threshold
     */
    setThresholdEmployeeCountFilter(): void {
        const employeeSizeForThreshold = this.employeeCountData
            .filter((el) => this.employeeCountFilter.value.indexOf(el.id) > -1)
            .map((ele) => ({ min: ele.minValue, max: ele.maxValue }));

        const employeeCountRange = employeeSizeForThreshold
            .map((employeeCountObj) => employeeCountObj.min + "/" + (employeeCountObj.max ?? ""))
            .join(",");

        this.thresholdFilter = `${this.thresholdFilter}employeeCount:${employeeCountRange}|`;
        this.filterChoiceEmployeeCount = this.employeeCountFilter.value;

        this.isDisplayEmployee =
            ": " + this.filterDisplayContent(this.employeeCountData, this.employeeCountFilter.value, "employeeCountFilter");
        this.empOnClick = this.employeeCountFilterVal;
        this.employeeCountFilterDropdown.close();
    }
    /**
     * set renewal filter value if threshold
     */
    setRenewalFilterForThreshold(): void {
        const renewalDateForThreshold = this.renewalData
            .filter((el) => this.renewalFilter.value.indexOf(el.id) > -1)
            .map((ele) => ({ min: ele.minValue, max: ele.maxValue }));

        const renewalDateRange = renewalDateForThreshold.map((el) => `${el.min}/${el.max}`).join(",");

        this.filterChoiceRenewal = this.renewalFilter.value;

        this.thresholdFilter = `${this.thresholdFilter}renewalDate:${renewalDateRange}|`;

        this.isDisplayRenewal = ": " + this.filterDisplayContent(this.renewalData, this.renewalFilter.value, "renewalFilter");
        this.renewalOnClick = this.renewalFilter.value;
        this.renewalFilterDropdown.close();
    }
    /**
     * service call to get all accounts
     */
    listAccounts(): void {
        this.isSpinnerLoading = true;
        this.accountListSearchData$
            .pipe(takeUntil(this.unsubscribe$))
            .pipe(
                tap((data) => {
                    this.updateAccountList(data);
                    // Publish a message to the WebSocket to get the latest notifications against the account-list
                    if (this.isPublishRequired) {
                        this.notificationQueueService.getLatestAccountListNotifications(
                            this.adminId ?? this.loggedInProducerId,
                            JSON.stringify({ includeSubordinates: true, hqSupport: true }),
                        );
                    }
                    this.accountListSubject.next(this.accountList);
                    this.isSpinnerLoading = false;
                }),
            )
            .subscribe(
                () => {
                    if (this.filter.query.notifications.length > 0) {
                        this.isNotificationFilter = true;
                        this.dataSource.data = this.dataFilter.transform(this.accountList, this.filter, this.isNotificationFilter);
                        // accountList and dataSource must always have same values
                        this.accountList = this.utilService.copy(this.dataSource.data);
                        // Need to update the subject with the latest accountList or it will update the accountList next emission
                        this.accountListSubject.next(this.accountList);
                    }
                },
                (Error) => {
                    this.isSpinnerLoading = false;
                },
            );
    }
    /**
     * check for the filter value and set the error
     */
    checkForError(): void {
        const val =
            this.statusFilter.value.length +
            this.stateFilter.value.length +
            this.renewalFilter.value.length +
            this.employeeCountFilter.value.length +
            this.notificationFilter.value.length +
            this.accountTypeFilter.value.length +
            this.producerFilter.value.length;

        if (val < this.errorCheckLength) {
            this.setError();
        } else {
            this.dispError = this.languageStrings["primary.portal.accounts.accountList.selectedFilters"];
        }
    }
    /**
     * set the error based on the filter status
     */
    setError(): void {
        const statusError = this.statusFilter.value.length > this.compareZero ? this.isDisplayStatus : "";
        if (statusError !== "") {
            this.dispError = this.languageStrings["primary.portal.accounts.accountList.status"] + this.isDisplayStatus;
        }
        const accountTypeError = this.accountTypeFilter.value.length > this.compareZero ? this.isDisplayAccountType : "";
        if (accountTypeError !== "") {
            this.dispError = this.AccountType + this.isDisplayAccountType;
        }
        const stateError = this.stateFilter.value.length > this.compareZero ? this.isDisplayState : "";
        if (stateError !== "") {
            this.dispError = this.languageStrings["primary.portal.accounts.state"] + this.isDisplayState;
        }
        const renewalError = this.renewalFilter.value.length > this.compareZero ? this.isDisplayRenewal : "";
        if (renewalError !== "") {
            this.dispError = this.languageStrings["primary.portal.accounts.accountList.renewal"] + this.isDisplayRenewal;
        }
        const employeeError = this.employeeCountFilter.value.length > this.compareZero ? this.isDisplayEmployee : "";
        if (employeeError !== "") {
            this.dispError = this.languageStrings["primary.portal.accounts.accountList.companySize"] + this.isDisplayEmployee;
        }
        const notificationError = this.notificationFilter.value.length > this.compareZero ? this.isDisplayNotification : "";
        if (notificationError !== "") {
            this.dispError = this.languageStrings["primary.portal.accounts.accountList.notification"] + this.isDisplayNotification;
        }
        const producerError =
            this.producerDisplay && this.subordinateFlag && this.producerDisplay.length > this.compareZero ? this.producerDisplay : "";
        if (producerError !== "") {
            this.dispError = this.languageStrings["primary.portal.producerFilter.producer"] + this.producerDisplay;
        }
    }

    /**
     * storing group id into the store
     * @params value account details
     */
    storeGroupId(value: AccountList): void {
        let censusEstimate;
        this.store.dispatch(new AddGroup(value));
        // use this code snippet to get groupId
        // this.store.selectSnapshot(AccountListState.getGroup)
        this.subscriptions.push(
            this.benefitsOfferingService.getBenefitOfferingSettings(value.id).subscribe((response) => {
                censusEstimate = response.totalEligibleEmployees;
                this.store.dispatch(new SetEligibleEmployees(censusEstimate));
            }),
        );
        this.router.navigate([`${value.id}/dashboard`], { relativeTo: this.route });
    }

    getStates(): void {
        this.subscriptions.push(
            this.staticService.getStates().subscribe(
                (value) => {
                    this.stateDropdown = value;
                    this.stateData = this.stateDropdown;
                },
                (error) => error,
            ),
        );
    }

    /**
     * To display filter dropdowns based on unique set of data from listAccounts API
     */
    configureFilters(): void {
        this.renewalCheck++;
        this.stateData = this.stateDropdown;
        this.accountTypeData = this.accountTypeFilterDropdowndata;
        this.statusData = this.statusFilterDropdowndata;
        const dates = [];
        const employees = [];
        // eslint-disable-next-line no-underscore-dangle, @typescript-eslint/no-unused-vars, @typescript-eslint/no-this-alias
        const _this = this;
        this.accountList.forEach((element: any) => {
            if (element.renewalDate) {
                dates.push(this.dateService.toDate(element.renewalDate));
            }
            employees.push(element["employeeCount"]);
        });
        if (dates && dates.length > this.compareZero) {
            this.checkmax = new Date().toISOString().slice(0, 10);
            this.renewalData = [
                {
                    id: 0,
                    name: "Less than 30 days",
                    propertyName: "renewalDate",
                    minValue: this.checkmax,
                    maxValue: this.addDate(this.checkmax),
                },
                {
                    id: 1,
                    name: "30 to 60 days",
                    propertyName: "renewalDate",
                    minValue: this.checkmax,
                    maxValue: this.addDate(this.checkmax),
                },
                {
                    id: 2,
                    name: "60 to 90 days",
                    propertyName: "renewalDate",
                    minValue: this.checkmax,
                    maxValue: this.addDate(this.checkmax),
                },
                {
                    id: 3,
                    name: "90+ days",
                    propertyName: "renewalDate",
                    minValue: this.checkmax,
                    maxValue: this.latest,
                },
            ];
        } else if (dates.length < this.compareZero && this.renewalCheck === this.compareZero) {
            this.isRenewalDisplay = false;
        }
        this.employeeMax = Math.max.apply(null, employees);
        if (this.employeeMax > this.empMax) {
            this.maxVal = this.employeeMax;
        } else {
            this.employeeMax = NaN;
        }
        this.employeeMin = Math.min.apply(null, employees);
        this.employeeCountData = [];
        // TODO: implement language
        this.employeeCountData = [
            {
                id: 0,
                name: "0-49 employees",
                propertyName: "employeeCount",
                minValue: 0,
                maxValue: 49,
            },
            {
                id: 1,
                name: "50-99 employees",
                propertyName: "employeeCount",
                minValue: 50,
                maxValue: 99,
            },
            {
                id: 2,
                name: "100-499 employees",
                propertyName: "employeeCount",
                minValue: 100,
                maxValue: 499,
            },
            {
                id: 3,
                name: "500+ employees",
                propertyName: "employeeCount",
                minValue: 500,
                maxValue: this.maxVal,
            },
        ];
    }
    addDate(minDate: Date): any {
        this.max = this.dateService.toDate(minDate);
        this.max.setDate(this.max.getDate() + 30);
        this.checkmax = this.max.toISOString().slice(0, 10);
        return this.checkmax;
    }
    constructCompanySizeFilt(min: number, max: number, param: string): unknown {
        const displayVar = "employees";
        this.rangeVal = {};
        this.rangeVal = {
            name: min + "-" + max + displayVar,
            propertyName: param,
            minValue: min,
            maxValue: max,
        };
        return this.rangeVal;
    }

    getNotificationDescription(code: string): any {
        return this.notificationResponse.find((val) => val.code === code);
    }

    // Change ranges based on the value selection
    applyRanges(val: string, fil: string): void {
        switch (fil) {
            case "renewalFilter":
                this.renewalFilterVal = val;
                break;
            case "employeeCountFilter":
                this.employeeCountFilterVal = val;
                break;
        }
    }

    // to set the ranges based on the Value selected from the dropdown
    callRanges(prop: string, val: any[]): any {
        if (prop === "renewalFilter") {
            this.filter.ranges.renewalDate = [];
            val.forEach((element) => {
                if (this.renewalData[element]) {
                    this.filter.ranges.renewalDate.push(this.renewalData[element]);
                }
            });
        } else if (prop === "employeeCountFilter") {
            this.filter.ranges.employeeCount = [];
            val.forEach((element) => {
                this.employeeCountData.forEach((ele) => {
                    if (ele.id === element) {
                        this.filter.ranges.employeeCount.push(ele);
                    }
                });
            });
        }
    }

    // Apply filtering based on the selection of checkbox's data
    async filterApply(val: string): Promise<any> {
        this.isPublishRequired = true;
        this.isApply = true;
        switch (val) {
            case "statusFilter":
                this.filterChoiceStatus = this.statusFilter.value;
                this.statusFilterVal = this.filterChoiceStatus.map((statusFilter) => statusFilter.toLowerCase());
                this.statusFilterVal = this.statusFilterDropdowndata
                    .filter((el) => this.statusFilterVal.indexOf(el.value.toLowerCase()) > -1)
                    .map((ele) => ele.name);
                this.statusFlag = true;
                this.statusOnClick = this.statusFilterVal;
                this.filter.strictFields.status = this.statusFilterVal;
                this.isDisplayStatus = ": " + this.filterDisplayContent(this.statusData, this.statusFilterVal, "statusFilter");
                this.statusFilterDropdown.close();
                this.statusFilterDropdown.focus();
                break;
            case this.accountType:
                this.filterChoiceAccountType = this.accountTypeFilter.value;
                this.accountTypeFilterVal = this.filterChoiceAccountType.map((accountType) => accountType.toLowerCase());
                this.accountTypeFilterVal = this.accountTypeFilterDropdowndata
                    .filter((el) => this.accountTypeFilterVal.indexOf(el.value.toLowerCase()) > -1)
                    .map((ele) => ele.name);
                this.accountTypeFlag = true;
                this.accountTypeOnClick = this.accountTypeFilterVal;
                this.filter.strictFields.detailedPartnerAccountType = this.accountTypeFilterVal;
                this.isDisplayAccountType =
                    ": " + this.filterDisplayContent(this.accountTypeData, this.accountTypeFilterVal, this.accountType);
                this.accountTypeFilterDropdown.close();
                this.accountTypeFilterDropdown.focus();
                break;
            case "stateFilter":
                this.filterChoiceState = this.stateFilter.value;
                this.filter.query.state = this.stateFilterVal;
                this.stateOnClick = [...this.stateFilter.value];
                this.savedStateChipList = this.stateChipList;

                this.stateControl.setValue("");
                this.stateFilterData = this.filterDisplayContent(this.stateDropdown, this.stateFilterVal, "stateFilter");
                this.isDisplayState = this.stateFilterData.length ? ": " + this.stateFilterData : "";
                break;
            case "renewalFilter":
                this.filterChoiceRenewal = this.renewalFilter.value;
                this.callRanges("renewalFilter", [this.renewalFilter.value]);
                this.renewalOnClick = this.renewalFilter.value;
                this.isDisplayRenewal = ": " + this.filterDisplayContent(this.renewalData, this.renewalFilterVal, "renewalFilter");
                this.renewalFilterDropdown.close();
                this.renewalFilterDropdown.focus();
                break;
            case "employeeCountFilter":
                this.filterChoiceEmployeeCount = this.employeeCountFilter.value;
                this.callRanges("employeeCountFilter", this.employeeCountFilterVal);
                this.empOnClick = this.employeeCountFilterVal;
                this.isDisplayEmployee =
                    ": " + this.filterDisplayContent(this.employeeCountData, this.employeeCountFilterVal, "employeeCountFilter");
                this.employeeCountFilterDropdown.close();
                this.employeeCountFilterDropdown.focus();
                break;
            case "notificationFilter":
                this.filterChoiceNotification = this.notificationFilter.value;
                this.filter.query.notifications = this.notificationFilterVal;
                this.notificationOnClick = [...this.notificationFilter.value];
                this.savedNotificationChipList = this.notificationChipList;

                this.stateControl.setValue("");
                this.isDisplayNotification =
                    ": " + this.filterDisplayContent(this.notificationData, this.notificationFilterCode, "notificationFilter");
                this.notificationFilterDropdown.close();
                this.notificationFilterDropdown.focus();

                break;
        }
        await this.filterDataObject();
    }

    resetAllFilters(): void {
        this.isPublishRequired = false;
        this.resetVal("statusFilter");
        this.resetVal(this.accountType);
        this.resetVal("employeeCountFilter");
        this.resetVal("renewalFilter");
        this.resetVal("notificationFilter");
        this.resetVal("stateFilter");
    }
    // To reset filter cvalues on clear
    resetVal(val: string): void {
        this.dispError = "";
        this.isApply = true;
        switch (val) {
            case "statusFilter":
                this.statusOnClick = "";
                this.statusFilter.setValue([]);
                this.statusFilterVal = [];
                this.filter.strictFields.status = [];
                this.statusFilterDropdown.close();
                this.isDisplayStatus = "";
                this.statusSelectedData = [];

                break;
            case this.accountType:
                this.accountTypeOnClick = [];
                this.accountTypeFilter.setValue([]);
                this.accountTypeFilterVal = [];
                this.filter.strictFields.detailedPartnerAccountType = [];
                this.accountTypeFilterDropdown.close();
                this.isDisplayAccountType = "";
                this.accountTypeSelectedData = [];
                break;
            case "stateFilter":
                this.stateFilterVal = [];
                this.stateOnClick = [];
                this.stateChipList = [];
                this.filter.query.state = [];
                this.stateFilter.setValue([]);
                this.isDisplayState = "";
                break;
            case "renewalFilter":
                this.renewalFilter.setValue("");
                this.renewalFilterVal = [];
                this.renewalOnClick = "";
                this.filter.ranges.renewalDate = [];
                this.renewalFilterDropdown?.close();
                this.isDisplayRenewal = "";
                break;
            case "employeeCountFilter":
                this.empOnClick = "";
                this.employeeCountFilter.setValue("");
                this.employeeCountFilterVal = [];
                this.filter.ranges.employeeCount = [];
                if (this.employeeCountFilterDropdown) {
                    this.employeeCountFilterDropdown.close();
                }
                this.companySelectedData = [];
                this.isDisplayEmployee = "";
                break;
            case "notificationFilter":
                this.notificationFilterVal = [];
                this.notificationOnClick = [];
                this.notificationChipList = [];
                this.filterParams.filteredGroupList = [];
                this.filter.query.notifications = [];
                if (this.notificationFilterDropdown) {
                    this.notificationFilterDropdown.close();
                }
                this.notificationSelectedData = [];
                this.notificationFilter.setValue([]);
                this.isDisplayNotification = "";
                this.notificationSelectedData = [];

                break;
        }
        this.filterDataObject();
    }

    openFunc(): void {
        this.producerFilterDropdown = !this.producerFilterDropdown;
    }

    // Function to find unique data from an Array
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
    /**
     * Function to Select all and Unselect all based on checkbox click
     * @param change is MatCheckboxChange
     * @param filterType is filter type
     */
    toggleSelection(change: MatCheckboxChange, filterType: string): void {
        switch (filterType) {
            case "notificationFilter":
                if (change.checked) {
                    this.notificationFilter.setValue(this.notificationData);
                } else {
                    this.notificationFilter.setValue([]);
                }
                break;
            case "statusFilter":
                if (change.checked) {
                    this.statusFilterVal = this.statusData.map((element) => element.value.toLowerCase());
                    this.statusFilter.setValue(this.statusFilterVal);
                } else {
                    this.statusFilter.setValue([]);
                }
                this.pageNumberControl.setValue(this.paginator.pageIndex + 1);
                break;
            case this.accountType:
                if (change.checked) {
                    this.accountTypeFilterVal = this.accountTypeData.map((element) => element.value.toLowerCase());
                    this.accountTypeFilter.setValue(this.accountTypeFilterVal);
                } else {
                    this.accountTypeFilter.setValue([]);
                }
                this.pageNumberControl.setValue(this.paginator.pageIndex + 1);
                break;
            default:
                break;
        }
    }
    toggleStatusSelectionAll(): void {
        this.allStatusSelected = !this.allStatusSelected;
        if (this.allStatusSelected) {
            this.statusFilterVal = this.statusData.map((element) => element.value.toLowerCase());
            this.statusFilter.setValue(this.statusFilterVal);
        } else {
            this.statusFilter.setValue([]);
        }
    }
    /**
     * Description: function to handle "select all" scenario for account type
     */

    toggleAccountTypeSelectionAll(): void {
        this.allAccountTypeSelected = !this.allAccountTypeSelected;
        if (this.allAccountTypeSelected) {
            this.accountTypeFilterVal = this.accountTypeData.map((element) => element.value.toLowerCase());
            this.accountTypeFilter.setValue(this.accountTypeFilterVal);
        } else {
            this.accountTypeFilter.setValue([]);
        }
    }
    toggleSelectionAll(): void {
        this.allSelected = !this.allSelected;
        if (this.allSelected) {
            this.stateFilterVal = this.stateData.map((element) => element.abbreviation.toLowerCase());
            this.stateFilter.setValue(this.stateFilterVal);
            this.stateChipList = this.stateFilter.value;
        } else {
            this.stateFilter.setValue([]);
            this.stateChipList = [];
        }
    }
    // This is to display Select All options and it is available for Renewal Date and Company Size/Employee Count
    isChecked(val: string): boolean | undefined {
        switch (val) {
            case "statusFilter":
                return this.statusFilter.value && this.statusData.length && this.statusFilter.value.length === this.statusData.length;
            case this.accountType:
                return (
                    this.accountTypeFilter.value &&
                    this.accountTypeData.length &&
                    this.accountTypeFilter.value.length === this.accountTypeData.length
                );
            case "stateFilter":
                return this.stateFilter.value && this.stateData.length && this.stateFilter.value.length === this.stateData.length;
            case "notificationFilter":
                return (
                    this.notificationFilter.value &&
                    this.notificationData.length &&
                    this.notificationFilter.value.length === this.notificationData.length
                );
            default:
                break;
        }
        return undefined;
    }
    /**
     * Open the popup for user to reject/ accept the invitation
     * @param loggedInProducerId producer id of logged in user
     * @param accountId account id of the selected account
     */
    openInvitationPopup(loggedInProducerId: any, accountId: any): void {
        this.isSpinnerLoading = true;
        this.subscriptions.push(
            this.producerService
                .getReceivedAccountInvitations(loggedInProducerId)
                .pipe(
                    map((accountDetails) => accountDetails.find((x) => x.account.id === accountId)),
                    tap((res) => {
                        this.isSpinnerLoading = false;
                    }),
                    filter((accountDetails) => accountDetails !== null && accountDetails !== undefined),
                    switchMap((accountDetails) =>
                        this.dialog
                            .open(InvitationPopupComponent, {
                                data: {
                                    loggedInProducerId: loggedInProducerId,
                                    accountDetails: accountDetails,
                                },
                                width: "600px",
                            })
                            .afterClosed(),
                    ),
                    filter((status) => status === this.SUCCESS),
                    tap((res) => {
                        this.isSpinnerLoading = true;
                    }),
                    switchMap((res) =>
                        this.accountListService.getTotalAccounts(type, includeAllSubordinates).pipe(
                            tap((response) => {
                                this.totalAccounts = response;
                            }),
                        ),
                    ),
                )
                .subscribe(
                    (response) => {
                        this.isSpinnerLoading = false;
                        this.setAccountList();
                        this.accountsService.setProducerForProspectList(null);
                        this.pageSizeOption = PaginationConstants.PAGE_SIZE_OPTIONS;
                    },
                    (error) => {
                        this.isSpinnerLoading = false;
                    },
                ),
        );
    }
    /**
     * method to find the notification ids which have trigger type all
     */
    getNotificationTriggerTypeAll(): void {
        this.subscriber.push(
            this.staticUtil.cacheConfigValue(ConfigName.PRODUCER_NOTIFICATION_TRIGGER_TYPE_ALL).subscribe((response) => {
                this.notificationTriggerTypeAll = response ? response.split(",") : [];
            }),
        );
    }

    /**
     * Gets the account list and adds the required fields used to display the list
     * @param filterParams object where each key-value pair denotes a query param to be passed to the request
     * @returns observable of a pageable list of accounts
     */
    getAccountList(filterParams: FilterParameters): Observable<PageableResponse<AccountListDisplay>> {
        return this.accountListService.listAccountsPageable(filterParams).pipe(
            // Add the notificationSum field to the AccountList object
            map<PageableResponse<AccountList>, PageableResponse<AccountListDisplay>>((accountList) => {
                // Get the content (AccountList items)
                accountList.content = accountList.content.map(
                    (account) =>
                        ({
                            // Add all the fields from the base AccountList object
                            ...account,
                            /**
                             * Add the new notificationSum field. Add either the count from the notification or one.
                             * If there are no notifications, then assume zero as the sum
                             */
                            notificationSum: 0,
                            groupNumber: account.accountNumber || account.groupNumber,
                            altGroupNumber: account.aflacGroupNumber || account.altGroupNumber,
                            unpluggedTooltipContent: account.lock
                                ? this.generateUnpluggedAccountInfoTooltipContent(account.lock)
                                : undefined,
                            productsTooltipContent: account.products && account.products.length ? account.products.join(", ") : "",
                            locked: Boolean(account.lock),
                        } as AccountListDisplay),
                );
                return accountList as PageableResponse<AccountListDisplay>;
            }),
            // Template subscribes multiple times. Until refactor using shareReplay to prevent duplicate calls
            shareReplay(1),
        );
    }

    /**
     * Method to get the notification count after removing duplicate notifications
     * @param account - the current account list iteration
     * @param notificationCountValue - current notification count
     * @return - the notification count after filtering duplicates
     */
    getNotificationCount(
        account: AccountList,
        notificationCountValue: number,
        notificationsForAccount: AbstractNotificationModel[],
    ): number {
        const notifications: AbstractNotificationModel[] = [];
        if (notificationsForAccount && notificationsForAccount.length > 0) {
            notificationsForAccount.forEach((obj) => {
                if (
                    this.notificationTriggerTypeAll?.every((id) => +id !== obj.code.id) ||
                    notifications.every((data) => data.code.id !== obj.code.id)
                ) {
                    notifications.push(obj);
                }
            });
            account.notifications = notifications;
            notificationCountValue = account.notifications.reduce(
                (accumulator, value) => (value[NOTIFICATION_COUNT_VAR] ? accumulator + value[NOTIFICATION_COUNT_VAR] : accumulator + 1),
                0,
            );
        }
        return notificationCountValue;
    }

    onClickViewInvitation(accountDetails: any): void {
        this.openInvitationPopup(this.loggedInProducerId.toString(), accountDetails.id);
    }

    // Function to implement Indeterminate state
    isIndeterminate(val: string): boolean | undefined {
        switch (val) {
            case "statusFilter":
                return (
                    this.statusFilter.value &&
                    this.statusData.length &&
                    this.statusFilter.value.length &&
                    this.statusFilter.value.length < this.statusData.length
                );
            case this.accountType:
                return (
                    this.accountTypeFilter.value &&
                    this.accountTypeData.length &&
                    this.accountTypeFilter.value.length &&
                    this.accountTypeFilter.value.length < this.accountTypeData.length
                );
            case "stateFilter":
                return (
                    this.stateFilter.value &&
                    this.stateData.length &&
                    this.stateFilter.value.length &&
                    this.stateFilter.value.length < this.stateData.length
                );
            case "notificationFilter":
                return (
                    this.notificationFilter.value &&
                    this.notificationData.length &&
                    this.notificationFilter.value.length &&
                    this.notificationFilter.value.length < this.notificationData.length
                );
        }
        return undefined;
    }

    // Function to display the selected data in filters based on the < 30 character condition and concatination
    filterDisplayContent(optionsList: any, selectedOptions: any, filterName: string): any {
        let str = "";
        let arr = [];
        switch (filterName) {
            case "renewalFilter":
                if (selectedOptions) {
                    selectedOptions.forEach((element) => {
                        if (this.renewalData[element]) {
                            str = str.concat(this.renewalData[element]["name"]);
                            arr = arr.concat(" " + this.renewalData[element]["name"]);
                        }
                    });
                }
                break;
            case "employeeCountFilter":
                if (selectedOptions) {
                    selectedOptions.forEach((element) => {
                        if (this.employeeCountData[element]) {
                            str = str.concat(this.employeeCountData[element]["name"]);
                            arr = arr.concat(" " + this.employeeCountData[element]["name"]);
                        }
                    });
                }
                break;
            default:
                if (selectedOptions) {
                    selectedOptions.forEach((element) => {
                        str = str.concat(element);
                        arr = arr.concat(" " + element);
                    });
                }
                break;
        }
        if (str.length + arr.length * 2 - 1 > 30) {
            if (optionsList.length === arr.length) {
                return "All";
            }
            return arr.length;
        }
        if (optionsList.length === arr.length) {
            return "All";
        }
        return arr;
    }

    matSelectOpenHandler(isOpen: boolean): void {
        this.duplicateCall = false;
        this.filterOpen = isOpen;
    }
    clickOutside(val: string): void {
        if (!this.isApply) {
            switch (val) {
                case "statusFilter":
                    this.mapStatus();
                    break;
                case "stateFilter":
                    this.stateFilter.setValue(this.stateOnClick);
                    this.stateChipList = this.stateOnClick;
                    break;
                case this.accountType:
                    this.mapAccountType();
                    break;
                case "renewalFilter":
                    this.renewalFilter.setValue(this.renewalOnClick);
                    break;

                case "employeeCountFilter":
                    this.employeeCountFilter.setValue(this.empOnClick);
                    break;
                case "notificationFilter":
                    this.notificationFilter.setValue(this.notificationOnClick);
                    break;
            }
        }
        this.isApply = false;
    }
    mapStatus(): void {
        this.statusFilter.setValue(
            this.statusFilterDropdowndata.filter((el) => this.statusOnClick.indexOf(el.name) > -1).map((ele) => ele.value.toLowerCase()),
        );
    }
    /**
     * Description: function to convert value displayed to user into value supplied to api on filter selection
     */

    mapAccountType(): void {
        this.accountTypeFilter.setValue(
            this.accountTypeFilterDropdowndata
                .filter((el) => this.accountTypeOnClick.indexOf(el.name) > -1)
                .map((ele) => ele.value.toLowerCase()),
        );
    }
    addRemoveState(stateName: string): void {
        const index = this.stateChipList.indexOf(stateName);
        if (index >= 0) {
            this.stateChipList.splice(index, 1);
        }
        this.stateFilter.setValue(this.stateChipList);
    }
    updateFilteredState(): void {
        this.stateFilterSearch(this.stateControl.value);
    }
    /**
     * Filtering filteredStateData based on parameter
     * @param filterValue { string } filter value
     * @returns Nothing
     */
    stateFilterSearch(filterValue: string): void {
        if (filterValue) {
            this.filteredStateData = this.stateDropdown.filter(
                (option) => option.abbreviation.toLowerCase().indexOf(filterValue.toLowerCase()) === 0,
            );
        } else {
            this.filteredStateData = [];
        }
        this.filteredStateData = this.filteredStateData.length === 0 ? this.utilService.copy(this.stateData) : this.filteredStateData;
    }

    chipListDisplay(): any {
        if (this.stateFilter && this.stateFilter.value.length > 0 && this.stateFilter.value[0] && !this.isStateSelectionDuplicate()) {
            this.stateChipList.push(this.stateFilter.value[0]);
            this.stateFilter.setValue(this.stateChipList);
            this.stateControl.setValue("");
        } else if (this.stateFilter.value != null && this.stateFilter.value[0] !== undefined) {
            // Using foreach instead of map here as the the stateFilter will be prefilled and it has to be updated.
            this.stateFilter.value.forEach((each) => {
                if (!this.stateChipList.includes(each)) {
                    this.stateChipList.push(each);
                }
            });
            this.stateFilter.setValue(this.stateChipList);
        }
        this.stateFilterInput.nativeElement.focus();
        this.filteredStateData = this.utilService.copy(this.stateData);
    }

    stateFilterInputFocusHandler(): void {
        this.stateFilterResult = this.stateData;
        this.showStateOptions = true;
    }

    stateFilterInputInputHandler(event: KeyboardEvent): void {
        const elem = event.target as HTMLInputElement;
        const value = elem.value;

        this.stateFilterResult = this.stateData.filter((each) => each.abbreviation.toLowerCase().indexOf(value.toLowerCase()) === 0);
    }

    stateFilterInputKeydownHandler(event: KeyboardEvent): void {
        const key = event.key;
        const keyCodeMap = {
            ArrowDown: DOWN_ARROW,
            ArrowUp: UP_ARROW,
        };

        const stateFilterNavKeys = [UP_ARROW, DOWN_ARROW];
        // eslint-disable-next-line sonarjs/no-collapsible-if
        if (
            stateFilterNavKeys.includes(keyCodeMap[key]) &&
            this.stateFilterActiveindex >= 0 &&
            this.stateFilterActiveindex <= this.stateFilterResult.length
        ) {
            this.stateFilterActiveindex =
                keyCodeMap[key] === DOWN_ARROW ? this.stateFilterActiveindex + 1 : this.stateFilterActiveindex - 1;
        }
    }

    stateListSelectionHandler(event: MatCheckboxChange): void {
        const elem = event.source;
        const value = elem.value;

        if (elem.checked && !this.isStateSelectedDuplicate(value, this.stateChipList)) {
            this.stateChipList.push(elem.value);
        }
    }

    isStateSelectionDuplicate(): boolean {
        const dupes = this.stateFilter.value.filter((val) => !this.stateChipList.includes(val.toUpperCase()));

        return dupes.length > 0;
    }

    stateChiplistClickHandler(): void {
        this.stateFilterInput.nativeElement.focus();
    }

    stateFilterAdd(event: MatChipInputEvent): void {
        const input = event.input;
        const value = event.value.trim();

        if (value && this.isStateSelectedStateValid(value, this.stateData) && !this.isStateSelectedDuplicate(value, this.stateChipList)) {
            this.stateChipList.push(value.toUpperCase());
        }

        if (input) {
            input.value = "";
        }

        this.stateFilterSearchControl.setValue(null);
        this.stateFilterResult = this.utilService.copy(this.stateData);
    }

    isStateSelectedStateValid(state: string, stateList: State[]): boolean {
        return stateList.filter((each) => each.abbreviation.toLowerCase() === state.toLowerCase()).length > 0;
    }

    isStateSelectedDuplicate(state: string, stateChipList: string[]): boolean {
        return stateChipList.includes(state.toUpperCase());
    }

    /**
     * Applys state filter on the accounts list
     * @param appliedStates contains states selected for filter
     */
    applyStateSelection(appliedStates: State[]): void {
        this.duplicateCall = false;
        this.stateFilterVal = appliedStates.map((state) => state.abbreviation);
        this.filter.query.state = this.stateFilterVal;
        this.isDisplayState = this.stateFilterVal.join(", ");
        this.trigger.closeMenu();
        // stateFilter contains the state filter input
        this.stateFilter.setValue(this.stateFilterVal);
        this.filterApply("stateFilter");
    }

    stateFilterMenuToggle(menuState: string): void {
        this.isStateFilterMenuOpen = menuState === "open";
    }

    sortData(event: any): void {
        this.activeCol = event.active;
        // for the location column in the admin portal, we need to sort by city (and thus state)
        if (this.isAdmin && event.active === "location") {
            this.dataSource.data.sort((a, b) => {
                const stateCompare = this.compare(
                    a.primaryContactAddress.state,
                    b.primaryContactAddress.state,
                    this.sort.direction === "asc",
                );
                if (stateCompare === 0) {
                    return this.compare(a.primaryContactAddress.city, b.primaryContactAddress.city, this.sort.direction === "asc");
                }
                return stateCompare;
            });
        }
    }
    // comparing two strings
    compare(a: string, b: string, isAsc: boolean): number {
        let sortOrder = 0;
        if (a < b) {
            sortOrder = -1;
        } else if (a > b) {
            sortOrder = 1;
        }
        return sortOrder * (isAsc ? 1 : -1);
    }

    getNotificationToolTipContent(notifications: any): any {
        return this.utilService.getNotificationToolTip(notifications, "notificationToolTip");
    }

    onImportAccount(imported: boolean): void {
        if (imported) {
            this.accountListData = JSON.parse(JSON.stringify(this.store.selectSnapshot(AccountListState.getAccountList)));
            this.listAccounts();
        }
    }
    resetChips(): void {
        this.stateFilterVal = [];
        this.stateChipList = [];
        this.filter.query.state = [];
        this.stateFilter.setValue([]);
        this.removeText();
    }
    removeText(): void {
        /* setTimeout is required since it's a mat autocomplete clicking on any value from the dropdown will
             consider as click outside and the value will not get appended in the input field*/
        setTimeout(() => {
            // this.matInput.nativeElement.value = "";
            this.stateControl.setValue("");
        }, 250);
    }

    // generate tooltip HTML content for account address
    generateLocationTooltipContent(address: Address): SafeHtml {
        return this.domSanitizer.bypassSecurityTrustHtml(
            `<b>${this.language.fetchPrimaryLanguageValue("primary.portal.accounts.accountList.address")}:</b>
        ${address.address1} ${address.address2}<br>${address.city} ${address.state} ${address.zip}`,
        );
    }

    // generate tooltip HTML content for account address
    generateProducerTooltipContent(producer: any): SafeHtml {
        return this.domSanitizer.bypassSecurityTrustHtml(
            `${producer.inactiveProducerName} ${this.language.fetchPrimaryLanguageValue(
                "primary.portal.accounts.accountList.inactiveProducer.info",
            )}`,
        );
    }

    // generate tooltip HTML content for OE dates
    generateOEDatesTooltipContent(oeps: OpenEnrollmentPeriod[]): SafeHtml {
        const today = this.datePipe.transform(new Date(), AppSettings.DATE_FORMAT);
        const currentOeps = oeps.filter((oep) => oep.validity.effectiveStarting <= today && today <= oep.validity.expiresAfter);
        let htmlString = "";
        if (currentOeps.length > 0) {
            htmlString = `<b>${this.language.fetchPrimaryLanguageValue("primary.portal.accounts.accountList.oeDates")}:</b>`;
            for (const oep of currentOeps) {
                const effectiveStarting = this.datePipe.transform(oep.validity.effectiveStarting, "MM/dd/yy");
                const expiresAfter = this.datePipe.transform(oep.validity.expiresAfter, "MM/dd/yy");
                htmlString = htmlString + `<br>${effectiveStarting}&ndash;${expiresAfter}`;
            }
        }
        return this.domSanitizer.bypassSecurityTrustHtml(htmlString);
    }

    /**
     * load producer filter overlay
     */
    loadProducerFilter(): void {
        this.duplicateCall = true;
        this.producerFilterCall = true;
        const bodyElement = document.querySelector("body");
        bodyElement.classList.add("negate-blur");
        this.filterOpen = true;
        this.producerBtn = true;

        // this.isCartOpen = true;
        const positionStrategy = this.overlayPositionBuilder
            .flexibleConnectedTo(this.producerFilterTrigger)
            .withPositions([
                {
                    originX: "start",
                    originY: "bottom",
                    overlayX: "start",
                    overlayY: "top",
                    offsetY: 10,
                },
            ])
            .withLockedPosition(true);

        const overlayConfig = new OverlayConfig({
            hasBackdrop: true,
            positionStrategy,
            scrollStrategy: this.overlay.scrollStrategies.reposition(),
            backdropClass: "productfilter-backdrop-view",
            panelClass: "producer-filter",
        });

        const popupComponentPortal = new ComponentPortal(ProducerFilterComponent);

        this.overlayRef = this.overlay.create(overlayConfig);

        this.overlayRef
            .backdropClick()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this.overlayRef.dispose();
                bodyElement.classList.remove("negate-blur");
                this.filterOpen = false;
                this.producerBtn = false;
            });

        this.overlayRef.attach(popupComponentPortal);
        this.accountsService.expandedOverlay.pipe(takeUntil(this.unsubscribe$)).subscribe((resp: OverlayOpen) => {
            if (resp.isOpen === true && this.producerFilterCall) {
                this.producerFilterCall = false;
                this.duplicateCall = false;
                this.getProducerDetails();
                this.overlayRef.dispose();
                this.accountsService.closeExpandedOverlayProducer({ isOpen: false });
                this.filterOpen = false;
                this.producerBtn = false;
            }
        });
        let prod = {};
        prod = {
            producerName: this.producerNameForOverlay,
            filterByProducer: this.producerOptionSelectedForOverlay,
        };
        this.accountsService.changeSelectedProducer(this.utilService.copy(prod));
    }
    /**
     * get the selected filter for the current producer
     */
    getSelectedProducer(): void {
        this.accountsService.currentProducer.pipe(take(1)).subscribe((currentProducer: ProdData) => {
            if (currentProducer.producerIdFilter && currentProducer.producerIdFilter.length > 0) {
                this.wnFilter = currentProducer.producerIdFilter;
            }
            this.producerNameForOverlay = currentProducer.producerName;
            this.producerOptionSelectedForOverlay = currentProducer.filterByProducer;
            this.filter.query.primaryProducer = currentProducer.producerName;
            this.producerDisplay = currentProducer.producerName ? ": " + currentProducer.producerName : currentProducer.producerName;
            this.filterDataObject();
        });
    }
    /**
     * fetch all primary languages
     * @memberof AccountListComponent
     */
    getLanguageStrings(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.accounts.accountList.notification",
            "primary.portal.accounts.accountList.selectedFilters",
            "primary.portal.producerFilter.producer",
            "primary.portal.commission.producer.role.primaryProducer",
            "primary.portal.accounts.accountList.unassigned",
            "primary.portal.common.moreFilter",
            "primary.portal.accounts.accountList.accounts",
            "primary.portal.accounts.accountList.accountsMessage",
            "primary.portal.accounts.accountList.isCallCenterAgent",
            "primary.portal.accounts.accountList.isHybridUser",
            "primary.portal.common.clear",
            "primary.portal.common.apply",
            "primary.portal.common.selectAll",
            "primary.portal.accounts.accountList.filter",
            "primary.portal.accounts.accountList.status",
            "primary.portal.accounts.accountList.allAccountTypes",
            "primary.portal.accounts.accountList.type",
            "primary.portal.accounts.accountList.allStatuses",
            "primary.portal.accounts.accountList.renewal",
            "primary.portal.accounts.accountList.state",
            "primary.portal.accounts.accountList.companySize",
            "primary.portal.accounts.accountList.accountNameColumn",
            "primary.portal.accounts.accountList.inactiveAlongWithAccountName",
            "primary.portal.accounts.accountList.accountIdColumn",
            "primary.portal.accounts.accountList.accountStateColumn",
            "primary.portal.accounts.accountList.primaryProducerColumn",
            "primary.portal.accounts.accountList.renewalColumn",
            "primary.portal.accounts.accountList.accountLocationColumn",
            "primary.portal.accounts.accountList.employeesColumn",
            "primary.portal.accounts.accountList.productsColumn",
            "primary.portal.accounts.accountList.accountStatusColumn",
            "primary.portal.accounts.accountList.viewInvitation",
            "primary.portal.accounts.accountList.getNotificationDetails",
            "primary.portal.accounts.accountList.notifications",
            "primary.portal.accounts.accountList.manageColumn",
            "primary.portal.accounts.accountList.assign",
            "primary.portal.accounts.accountList.partialListingMessage",
            "primary.portal.accounts.accountList.resultNotFound",
            "primary.portal.accounts.accountList.searchStates",
            "primary.portal.accounts.accountList.page",
            "primary.portal.common.enterPageNumber",
            "primary.portal.common.ariaShowMenu",
            "primary.portal.accounts.accountList.accountType",
            "primary.portal.notification.count",
            "primary.portal.accounts.accountList.ag",
            "primary.portal.accountList.zeroState",
            "primary.portal.accounts.openOtherProducersAccount",
            "primary.portal.accounts.findOtherProducer.accountsAndProspects",
            "primary.portal.accounts.state",
            "primary.portal.aflacGroup.offering.reviewBenefit",
            "primary.portal.notificationCount",
            "primary.portal.accounts.accountList.account.checkedOutSuffix",
            "primary.portal.accounts.accountList.account.checkedOutBy",
            "primary.portal.accounts.accountList.account.firstCheckoutDate",
            "primary.portal.accounts.accountList.account.lastCheckinDate",
            "primary.portal.accounts.accountList.account.notification.account.business.send",
            "primary.portal.accounts.accountList.account.notification.account.business.send.multiple",
            "primary.portal.notification.unsent.enrollments.dollar",
            "primary.portal.notification.enrollmentsPendingTransmittal.singleNotification.displayText",
            "primary.portal.notification.enrollmentsPendingTransmittal.multipleNotifications.displayText",
        ]);
    }
    /**
     * check permission for producer read
     * @returns void
     */
    checkPermission(): void {
        this.authenticationService.permissions$.pipe(takeUntil(this.unsubscribe$)).subscribe((response) => {
            if (response.length > 0 && response.find((d) => String(d) === this.producerReadPermission) && !this.isAdmin) {
                const params = {
                    supervisorProducerId: this.loggedProducerId,
                    includeInactiveProducers: true,
                    page: ACCOUNT_PAGE_LIMIT,
                    size: ACCOUNT_THRESHOLD_LIMIT,
                };
                this.producerSearchList = this.accountsService.getproducerSearchList();
                if (!this.producerSearchList && this.isProducer) {
                    this.producerService
                        .producerSearch(params)
                        .pipe(takeUntil(this.unsubscribe$))
                        .subscribe((resp) => {
                            this.producerSearchList = resp;
                            this.accountsService.setProductSearchList(resp);
                            this.setAccountList();
                            if (this.producerSearchList && this.producerSearchList.content.length > 0) {
                                this.subordinateFlag = true;
                            }
                        });
                }
            } else {
                this.subordinateFlag = true;
                this.listAccounts();
            }
        });
    }

    // More Filter

    moreFilterView(): void {
        this.duplicateCall = false;
        const bodyElement = document.querySelector("body");
        bodyElement.classList.add("negate-blur");

        const positionStrategy = this.overlayPositionBuilder
            .flexibleConnectedTo(this.elementRef)
            .withPositions([
                {
                    originX: "end",
                    originY: "bottom",
                    overlayX: "end",
                    overlayY: "top",
                },
            ])
            .withLockedPosition(true)
            .setOrigin(this.moreFilterOrigin);

        const overlayConfig = new OverlayConfig({
            hasBackdrop: true,
            positionStrategy,
            scrollStrategy: this.overlay.scrollStrategies.reposition(),
            width: 350,
            maxHeight: 600,
            backdropClass: "expanded-card-view",
            panelClass: "account-list-more-view",
        });

        const popupComponentPortal = new ComponentPortal(
            MoreFilterComponent,
            null,
            this.createInjector([
                this.notificationData,
                this.notificationSelectedData,
                this.employeeCountData,
                this.companySelectedData,
                this.statusData,
                this.statusSelectedData,
                this.accountTypeData,
                this.accountTypeSelectedData,
                this.appliedFilter,
            ]),
        );

        this.overlayRef = this.overlay.create(overlayConfig);

        this.overlayRef
            .backdropClick()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this.overlayRef.dispose();
                bodyElement.classList.remove("negate-blur");
            });

        const overlayInstance = this.overlayRef.attach(popupComponentPortal);
        overlayInstance.instance.filterApplied.pipe(takeUntil(this.unsubscribe$)).subscribe((resp) => {
            this.moreFilterResponse = resp;

            this.filter.query.notifications = this.moreFilterResponse.selectedNotificationData;
            const selectedNotificationData = this.moreFilterResponse.selectedNotificationData;
            this.notificationSelectedData = selectedNotificationData;

            this.filter.ranges.employeeCount = this.moreFilterResponse.selectedCompanyData;
            const selectedCompanyData = this.moreFilterResponse.selectedCompanyData;
            this.companySelectedData = selectedCompanyData;

            this.filter.strictFields.status = this.moreFilterResponse.selectedStatusData.map((data) => data.name);
            const selectedStatusData = this.moreFilterResponse.selectedStatusData;
            this.statusSelectedData = selectedStatusData;
            this.filterDataObject();
            this.overlayRef.dispose();
        });

        overlayInstance.instance.resetMoreFilterSubject.pipe(takeUntil(this.unsubscribe$)).subscribe((resp) => {
            this.moreFormControls = resp;
            this.moreFormControls.forEach((each) => {
                if (each !== "companyFilter") {
                    this.resetVal(each);
                } else {
                    this.resetVal("employeeCountFilter");
                }
            });
            this.overlayRef.dispose();
        });
    }
    createInjector(dataToPass: any[]): PortalInjector {
        const injectorTokens = new WeakMap();
        injectorTokens.set(CONTAINER_DATA, dataToPass);
        return new PortalInjector(this.injector, injectorTokens);
    }

    convertIntoDisplayCase(key: string[]): string {
        if (key && key.length > 0) {
            const wordsArray = key[0].toLowerCase().split(" ");
            if (wordsArray.length && wordsArray[0].length) {
                wordsArray[0] = wordsArray[0][0].toUpperCase() + wordsArray[0].slice(1);
            }
            return wordsArray.join(" ");
        }
        return "";
    }
    openSinglePopup(id: string): void {
        this.subscriptions.push(
            this.accountService.getAccount(id).subscribe((resp) => {
                const dialogRef = this.dialog.open(AddSingleProducerComponent, {
                    data: {
                        roleList: [
                            {
                                name: this.languageStrings["primary.portal.commission.producer.role.primaryProducer"],
                                id: ROLE.PRIMARY_PRODUCER,
                            },
                        ],
                        loggedInProducerId: this.loggedInProducerId,
                        mpGroupId: id,
                        isDirect: false,
                        situs: resp.situs,
                    },
                    width: "700px",
                    height: "auto",
                });
            }),
        );
    }
    /**
     * open the search other producers' account popup. Set the account list and filters for searched producer on close
     */
    findOtherProducersAccount(): void {
        const dialogRef = this.empoweredModal.openDialog(SearchProducerComponent, {
            data: {
                isDirect: false,
                roleTwentyAccountPermission: this.hasPermission,
                dialogTitle: this.languageStrings["primary.portal.accounts.findOtherProducer.accountsAndProspects"],
                dialogSubtitle: this.languageStrings["primary.portal.accounts.openOtherProducersAccount"],
            },
        });
        const BY_PRODUCER = "byProducer";
        let producerSearchData: { producerData: SearchProducer; searchType: SearchType };
        this.subscriptions.push(
            dialogRef
                .afterClosed()
                .pipe(
                    tap((producerData) => {
                        if (producerData && producerData.searchType === SearchType.BY_PRODUCER_ACC) {
                            if (producerData.producer.type.toLowerCase() === PROSPECT) {
                                this.router.navigate([`./prospect/${producerData.producer.id}`], {
                                    relativeTo: this.route,
                                });
                            } else {
                                this.storeGroupId(producerData.producer);
                            }
                        } else if (producerData && producerData.searchType === SearchType.BY_PRODUCER) {
                            producerSearchData = producerData;
                        }
                        if (producerData) {
                            this.resetAllFilters();
                        }
                    }),
                    filter((producerData) => producerData?.searchType === BY_PRODUCER),
                    switchMap((producerData) =>
                        this.accountListService.getTotalAccounts(type, includeAllSubordinates, producerData.producerData.id),
                    ),
                )
                .subscribe((totalAccounts) => {
                    this.totalAccounts = totalAccounts;
                    this.accountsService.setProducerForProspectList(producerSearchData.producerData);
                    // eslint-disable-next-line max-len
                    const producerName = `${producerSearchData.producerData.name.firstName} ${producerSearchData.producerData.name.lastName}`;
                    if (this.MemberInfo.producerId !== producerSearchData.producerData.id) {
                        this.otherProducerData = producerSearchData.producerData;
                        this.currentProducer = producerName;
                        this.notifications = {}; // Resetting the notifications
                        // Unsubscribing from loggedInProducer Id since we don't want to listen to his notification updates
                        this.producerNotificationDataSubscription?.unsubscribe();
                        // Unsubscribing from otherProducer notifications
                        this.otherProducerNotificationDataSubscription?.unsubscribe();
                        // Initializing otherProducer's Notifications Observable
                        this.otherProducerNotificationData$ = this.notificationQueueService.getNotifications(
                            producerSearchData.producerData.id,
                            JSON.stringify({ includeSubordinates: true, hqSupport: true }),
                        );
                        // Listening to notification updates as well as the accountList updates
                        this.otherProducerNotificationDataSubscription = combineLatest([
                            this.otherProducerNotificationData$,
                            this.accountList$,
                        ])
                            .pipe(takeUntil(this.unsubscribe$))
                            .subscribe(([notifications, accountList]) => {
                                if (notifications && Object.keys(notifications).length) {
                                    // Storing notifications to use filter
                                    this.notifications = { ...this.notifications, ...notifications };
                                    this.mapNotificationsToAccounts(notifications, accountList);
                                    this.accountList = accountList;
                                    this.dataSource.data = this.utilService.copy(this.accountList);
                                }
                            });
                    } else {
                        this.otherProducerData = null;
                        this.currentProducer = "";
                        this.otherProducerNotificationDataSubscription?.unsubscribe();
                        // If we're switching to loggedInProducer then unsubscribe from otherProducer notifications
                        if (this.producerNotificationDataSubscription?.closed) {
                            this.notifications = {}; // Resetting the notifications, if other producer's account-list was loaded
                            this.producerNotificationDataSubscription = this.producerNotificationData$.subscribe();
                        }
                    }
                    const hqSupport = this.checkHQSupport();
                    const producer = {
                        producerName: hqSupport ? producerName : null,
                        filterByProducer: hqSupport ? ProducerFilterSelectedOption.MY_ACCOUNTS : ProducerFilterSelectedOption.ALL_ACCOUNTS,
                    };
                    this.accountsService.changeSelectedProducer(this.utilService.copy(producer));
                    this.accountsService.setAnyProducerViewed(true);
                    this.loggedInProducerId = producerSearchData.producerData.id;
                    this.setAccountList();
                    this.getProducerSubordinate(this.loggedInProducerId);
                    this.getSelectedProducer();
                }),
        );
    }
    /**
     * This method will execute on click of review benefits offering in manage section of account-list
     * This method is used to navigate user to profile -> carrier page and opens review benefits offering pop-up
     * @param selectedAccount is the user selected account
     */
    reviewBenefitsOffering(selectedAccount: AccountListDisplay): void {
        this.store.dispatch(new AddGroup(selectedAccount));
        this.router
            .navigate([`${selectedAccount.id}/dashboard/profile/carriers`], {
                relativeTo: this.route,
            })
            .finally(() => {
                this.benefitsOfferingService.setReviewBenefitsOfferingFlag(true);
            });
    }
    /**
     * Generates tooltip HTML content for unplugged accounts
     * @param lock lock object associated with unplugged account
     * @returns HTML tooltip content
     */
    generateUnpluggedAccountInfoTooltipContent(lock: AccountLock): SafeHtml {
        const languagePrefix = "primary.portal.accounts.accountList.account.";
        const lockInfo = {
            checkedOutBy: lock.admins
                .map((admin) => this.titleCasePipe.transform(`${admin.name.firstName} ${admin.name.lastName}`))
                .join(", "),
            firstCheckoutDate: lock.firstCheckoutDate
                ? this.datePipe.transform(lock.firstCheckoutDate, DateFormats.DATE_TIME_24_HOUR)
                : undefined,
            lastCheckinDate: lock.lastCheckinDate
                ? this.datePipe.transform(lock.lastCheckinDate, DateFormats.DATE_TIME_24_HOUR)
                : undefined,
        };
        return Object.entries(lockInfo)
            .filter(([, value]) => value)
            .map(([key, value]) => `<p><b>${this.languageStrings[languagePrefix + key]}</b><br />${value}</p>`)
            .join("");
    }

    /**
     * Gets the data from accountList API and sets the account list in the application
     * @param data - Pageable response of the accountList API
     */
    updateAccountList(data: any): void {
        const accountList = this.utilService.copy(data);
        this.threshold = accountList.totalElements > Number(this.thesholdValue);
        if (!this.threshold) {
            if (this.dataSource.data.length === this.compareZero) {
                this.checkForError();
            }
            this.pageInputChanged(this.defaultPageNumber);
        }
        const arr = [];
        let temp = [];
        if (this.isProducer && (this.isCallCenterAgent || this.isHybridUser)) {
            accountList.content.filter((acc) => {
                acc.producers?.forEach((prod) => {
                    arr.push(acc);
                    if (this.producerSearchList) {
                        this.producerSearchList.content.forEach((pro) => {
                            if (pro.id === prod.id && prod.primary === true) {
                                arr.push(acc);
                            }
                        });
                    }
                });
            });
        }
        accountList.content.filter((acc) => {
            acc.notifications.forEach((notification) => {
                this.notificationResponse.push(notification);
            });
        });
        temp = this.utilService.copy(accountList.content);
        accountList.content = this.utilService.copy(temp);
        accountList.content.map((item) => {
            item["isReportingManager"] =
                item.inactiveProducer &&
                item.inactiveProducer.reportingProducerIds.length &&
                item.inactiveProducer.reportingProducerIds.some((id) => id === this.loggedInProducerId);
            if (item.producers !== undefined) {
                // condition to check whether producers array is empty or not
                if (
                    !item.inactiveProducer &&
                    item.producers.length > 0 &&
                    item.producers.filter((producer) => producer.primary === true).length > 0
                ) {
                    item["primaryProducer"] = `${item.producers
                        .find((producer) => producer.primary === true)
                        .firstName.trim()} ${item.producers.find((producer) => producer.primary === true).lastName.trim()}`;
                } else {
                    item["primaryProducer"] = this.languageStrings["primary.portal.accounts.accountList.unassigned"];
                    this.isUnassignedExists = true;
                    if (item.inactiveProducerId) {
                        item["inactiveProducerName"] = item.inactiveProducerId.name;
                    }
                }
            }
            item.productsCount = item.products.length;
            if (item.producers && item.producers.length && this.loggedInProducerId) {
                const loggedInProducerDetails = item.producers.find((producer) => producer.id === this.loggedInProducerId);
                if (loggedInProducerDetails) {
                    item["pendingInvitation"] = loggedInProducerDetails.pendingInvitation;
                    if (loggedInProducerDetails.pendingInvitation) {
                        item["status"] = STATUS.INVITATION;
                    }
                }
            }
        });
        this.store.dispatch(new AddAccountList(accountList));
        this.accountListData = this.utilService.copy(this.store.selectSnapshot(AccountListState.getAccountList));
        if (this.accountListData.content && this.accountListData.content.length !== 0) {
            this.haveAccounts = true;
        }

        // for admin portal, only certain statuses apply
        if (this.isAdmin) {
            this.accountListData.content = this.accountListData.content.filter(
                (account) =>
                    account.status === "SET_UP" ||
                    account.status === "ACTIVE" ||
                    account.status === "INACTIVE" ||
                    account.status === "ENROLLMENT" ||
                    account.status === UNPLUGGED,
            );
            this.statusFilterDropdowndata = this.statusFilterDropdowndata.filter(
                (status) =>
                    status.value === "SET_UP" || status.value === "ACTIVE" || status.value === "INACTIVE" || status.value === "ENROLLMENT",
            );
            if (this.accountListData.content.length === 1 && !(this.filterParams.search || this.filterParams.filter)) {
                this.store.dispatch(new AddGroup(this.accountListData.content[0]));
                this.router.navigate([`${accountList.content[0].id}/dashboard`], {
                    relativeTo: this.route,
                });
            }
        }
        if (this.accountListData.content) {
            this.accountListData.content.forEach((element) => {
                element.status = this.statusFilterDropdowndata.filter((el) => el.value === element.status).map((el) => el.name);
            });
            this.accountListData.content.forEach((account) => {
                account.detailedPartnerAccountType = this.accountTypeFilterDropdowndata
                    .filter((element) => element.value === account.detailedPartnerAccountType)
                    .map((element) => element.name);
            });
        }
        this.accountList = this.utilService.copy(this.accountListData.content);
        this.dataSource.data = this.utilService.copy(this.accountList);
        this.nameCount = this.accountList.length;
        this.groupNumberCount = this.accountList.length;
        this.altGroupNumberCount = this.accountList.length;
        this.dataLoaded = true;
        if (this.threshold) {
            this.dataSource.sort = null;
        }
        this.configureFilters();
        if (this.dataSource.data.length === this.compareZero) {
            this.checkForError();
        }
    }

    /**
     * Sets notification for the account
     * @param account  - Account to the set the notification for
     * @param notificationForAccount - notification data for the account
     * @returns Account with updated notification properties
     */
    setNotificationForAccount(account: AccountListDisplay, notificationForAccount: AbstractNotificationModel[]): AccountListDisplay {
        let notificationCountValue = 0;
        notificationCountValue = this.getNotificationCount(account, notificationCountValue, notificationForAccount);
        account = {
            ...account,
            notificationSum: notificationCountValue,
            notifications: notificationCountValue
                ? this.notificationService.getNotificationDisplayText(
                    notificationForAccount,
                    notificationCountValue > 1
                        ? this.languageStrings[
                            "primary.portal.notification.enrollmentsPendingTransmittal.multipleNotifications.displayText"
                        ]
                        : this.languageStrings[
                            "primary.portal.notification.enrollmentsPendingTransmittal.singleNotification.displayText"
                        ],
                )
                : [],
        };
        return account;
    }

    /**
     * Maps notifications to the accountList
     * @param notifications - Notification received from WebSocket
     * @param accountList - accountsList against which to populate the notifications
     */
    mapNotificationsToAccounts(notifications: WSAccountListNotifications, accountList: AccountList[]): void {
        for (const accountId in notifications) {
            if (Object.prototype.hasOwnProperty.call(notifications, accountId)) {
                const accountIndex = accountList.findIndex((accountElement) => accountElement.id === +accountId);
                if (accountIndex !== -1) {
                    const account = this.setNotificationForAccount(
                        accountList[accountIndex] as AccountListDisplay,
                        notifications[accountId],
                    );
                    accountList[accountIndex] = account;
                }
            }
        }
    }

    /**
     * This method destroys all subscriptions.
     */
    ngOnDestroy(): void {
        let prod = {};
        prod = {
            producerName: "",
            filterByProducer: "",
        };
        this.accountsService.changeSelectedProducer(this.utilService.copy(prod));
        this.subscriptions.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
        // this.notificationQueueService.deactivate();
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}

/**
 * Display interface, needed to sum the notifications coming in to get a more accurate count
 */
type AccountListDisplay = AccountList & {
    notificationSum: number;
    unpluggedTooltipContent: SafeHtml;
    productsTooltipContent: SafeHtml;
};
