import {
    SharedState,
    ProducerListState,
    SetDirectUserState,
    SetDirectUserStateAbbr,
    SetDirectAccountId,
    StaticUtilService,
} from "@empowered/ngxs-store";
import { Store } from "@ngxs/store";
import { Component, OnInit, ViewChild, HostListener, OnDestroy } from "@angular/core";
import { AccountService, MonSideNavList, EmpSidenavContent, AflacService, MenuItem } from "@empowered/api";
import { Router, ActivatedRoute } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { CreateDirectAccountComponent, CreateDirectAccountDialogData } from "./create-direct-account/create-direct-account.component";
import { Subscription, forkJoin, BehaviorSubject, Observable, Subject, throwError } from "rxjs";
import { MediaMatcher } from "@angular/cdk/layout";
import { takeUntil, tap, catchError, switchMap, filter } from "rxjs/operators";
import { LanguageService } from "@empowered/language";
import {
    SidenavIcon,
    Permission,
    ClientErrorResponseCode,
    ServerErrorResponseCode,
    CompanyCode,
    WritingNumber,
    Accounts,
} from "@empowered/constants";
import { GenericSidenavComponent, SearchProducerComponent } from "@empowered/ui";

enum ProducerState {
    NY = "NY",
    US = "US",
}
enum DirectEnrollmentSideNavOptions {
    CUSTOMERS = "CUSTOMERS",
    COVERAGE_SUMMARY = "COVERAGE_SUMMARY",
}
@Component({
    selector: "empowered-direct-dashboard",
    templateUrl: "./direct-dashboard.component.html",
    styleUrls: ["./direct-dashboard.component.scss"],
})
export class DirectDashboardComponent implements OnInit, OnDestroy {
    @ViewChild("genSideNav", { static: true }) genSideNav: GenericSidenavComponent;
    private unsubscribe$ = new Subject<void>();
    private screenWidth$ = new BehaviorSubject<number>(window.innerWidth);
    mobileQuery: MediaQueryList;
    directEnrollmentSideNavOptions = DirectEnrollmentSideNavOptions;
    selectedOptions = DirectEnrollmentSideNavOptions.CUSTOMERS;
    isLoading = false;
    mpGroup = "";
    directSitusState: any;
    directSitusStateAbbr: any;
    dialogRefsubscription$: Subscription;
    producerInfo;
    writingNumbers: WritingNumber[];
    sitCodes;
    writingNumberNY: number;
    sitCodesNY;
    USSitCodeOptions = [];
    NYSitcodeOptions = [];
    NYData;
    ProducerState = ProducerState;
    sitData;
    enablePopUpNY = false;
    enablePopUpUS = false;
    usSitCodeId: number;
    nySitCodeId: number;
    producerId = null;
    usWritingNumberData: WritingNumber[] = [];
    nyWritingNumberData: WritingNumber[] = [];
    navOptions: MonSideNavList[];
    producerName = "";
    hasRoleTwentyDirectPermission = false;
    eFinancePermission = false;
    haveRequiredPermissions = false;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.sideNavBar.pendingEnrollments",
        "primary.portal.common.openNavigation",
        "primary.portal.directDashboard.customers",
        "primary.portal.directDashboard.business",
        "primary.portal.directDashboard.scheduleAndSend",
        "primary.portal.directDashboard.pendingEnrollments",
        "primary.portal.directDashboard.commissions",
        "primary.portal.directDashboard.reports",
        "primary.portal.directDashboard.openOtherProducerDirectAccount",
        "primary.portal.direct.directSales",
        "primary.portal.account.direct.searchProducerTitle",
        "primary.portal.sideNavBar.scheduleAndSend",
        "primary.portal.sideNavBar.customers",
        "primary.portal.sideNavBar.commissions",
        "primary.portal.sideNavBar.reports",
    ]);

    constructor(
        private readonly media: MediaMatcher,
        private readonly accountService: AccountService,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly store: Store,
        private readonly dialog: MatDialog,
        private readonly aflac: AflacService,
        private readonly language: LanguageService,
        private readonly staticUtil: StaticUtilService,
    ) {
        this.mobileQuery = this.media.matchMedia("(max-width: 992px)");
    }
    /** *
     * To get the producer information and check for the permission
     */
    ngOnInit(): void {
        this.getRequiredPermissions();
        const producerId = this.route.snapshot.queryParams["producerId"];
        const producerList = this.store.selectSnapshot(ProducerListState).producerList;
        if (producerList && producerList.length > 0) {
            producerList.map((producer) => {
                if (producer.id === +producerId) {
                    this.producerName = producer.name.firstName + " " + producer.name.lastName + ":";
                }
            });
        }
        this.hasRoleTwentyDirectPermission = this.store.selectSnapshot(SharedState.hasPermission(Permission.READ_ACCOUNT_DIRECT_ALWAYS));

        if (producerId || this.hasRoleTwentyDirectPermission) {
            this.getDirectAccount(producerId as number)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe();
            this.navigationHandler();
        } else {
            this.openDirect();
        }
    }
    /**
     * @description open pop up to find other producer's direct sales
     */
    openDirect(): void {
        this.store
            .select(SharedState.hasPermission("core.account.read.account.direct.any"))
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((permission) => {
                    this.hasRoleTwentyDirectPermission = permission;
                    if (this.hasRoleTwentyDirectPermission) {
                        const dialogRef = this.dialog.open(SearchProducerComponent, {
                            data: {
                                isDirect: true,
                                roleTwentyDirectPermission: this.hasRoleTwentyDirectPermission,
                                dialogTitle: this.languageStrings["primary.portal.direct.directSales"],
                                dialogSubtitle: this.languageStrings["primary.portal.account.direct.searchProducerTitle"],
                            },
                            width: "700px",
                            height: "auto",
                        });
                        return dialogRef.afterClosed().pipe(
                            switchMap((afterClose) => {
                                if (afterClose && afterClose.searchType === "byProducer") {
                                    this.router.navigate(["/producer/direct"]);
                                    this.producerId = afterClose.producerData.id;
                                    this.writingNumbers = afterClose.producerData.writingNumbers;
                                    // eslint-disable-next-line max-len
                                    this.producerName = `${afterClose.producerData.name.firstName} ${afterClose.producerData.name.lastName}:`;
                                }
                                return this.getDirectAccount(this.producerId);
                            }),
                        );
                    }
                    return this.getDirectAccount();
                }),
            )
            .subscribe();
        this.navigationHandler();
    }

    navigationHandler(): void {
        this.addNavigationOptions();
        this.getScreenWidth()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                if (this.mobileQuery.matches) {
                    this.genSideNav.dashboardSideNav.opened = false;
                } else {
                    this.genSideNav.dashboardSideNav.opened = true;
                }
            });
    }

    @HostListener("window:resize", ["$event"])
    onResize(event: Event & { target: { innerWidth: number } }) {
        this.screenWidth$.next(event.target.innerWidth);
        if (!this.mobileQuery.matches) {
            this.genSideNav.dashboardSideNav.opened = true;
        } else {
            this.genSideNav.dashboardSideNav.opened = false;
        }
    }

    getScreenWidth(): Observable<number> {
        return this.screenWidth$.asObservable();
    }
    /**
     * This function will configure sidenav with all required options
     * @returns void
     */
    addNavigationOptions(): void {
        this.navOptions = [
            {
                menuIntem: {
                    name: this.languageStrings["primary.portal.directDashboard.customers"],
                    iconName: SidenavIcon.CUSTOMERS,
                    path: "customers",
                },
                subMenuItem: [],
            },
            {
                menuIntem: {
                    name: this.languageStrings["primary.portal.directDashboard.business"],
                    iconName: SidenavIcon.BUSINESS,
                },
                subMenuItem: [
                    {
                        name: this.languageStrings["primary.portal.directDashboard.scheduleAndSend"],
                        iconName: "schedule-and-send",
                        path: "schedule-send",
                    },
                    {
                        name: this.languageStrings["primary.portal.directDashboard.pendingEnrollments"],
                        iconName: "pending-enrollments",
                        path: "pending-enrollments",
                    },
                ],
            },
            {
                menuIntem: {
                    name: this.languageStrings["primary.portal.directDashboard.commissions"],
                    iconName: SidenavIcon.COMMISSIONS,
                    path: "commissions",
                },
                subMenuItem: [],
            },
            {
                menuIntem: {
                    name: this.languageStrings["primary.portal.directDashboard.reports"],
                    iconName: SidenavIcon.REPORTS,
                    path: "reports",
                    isConfigEnabled$: this.staticUtil.cacheConfigEnabled("portal.account.reports.enabled"),
                    hasPermission$: this.store.select(SharedState.hasPermission("core.document.read")),
                } as MenuItem,
                subMenuItem: [],
            },
        ];
    }
    /** *
     * In this method, we are landing on the customer page if user goes to a direct group
     * @param producerId is containing login producer id.
     * @returns Accounts details
     */
    getDirectAccount(producerId?: number): Observable<Accounts> {
        this.isLoading = true;
        return this.accountService.getDirectAccount(producerId ? producerId : null).pipe(
            tap((response) => {
                this.isLoading = false;
                this.mpGroup = response.id.toString();
                this.directSitusState = response.situs.state.name;
                this.directSitusStateAbbr = response.situs.state.abbreviation;
                this.store.dispatch(new SetDirectUserState(this.directSitusState));
                this.store.dispatch(new SetDirectUserStateAbbr(this.directSitusStateAbbr));
                this.store.dispatch(new SetDirectAccountId(this.mpGroup));
                if (this.router.routerState.snapshot.url === "/producer/direct") {
                    this.routeToCustomers();
                }
            }),
            catchError((error) => {
                if (error.status === ClientErrorResponseCode.RESP_404 && this.eFinancePermission) {
                    return this.createDirectAccount();
                }
                if (error.status === ClientErrorResponseCode.RESP_404) {
                    if (this.producerId) {
                        this.getSitCodesByWritingNumber();
                    } else {
                        this.getProducerSitCodes();
                    }
                } else {
                    this.isLoading = false;
                }
                return throwError(error);
            }),
        );
    }

    goToReports(): void {
        this.router.navigate([`${this.mpGroup}/reports`], { relativeTo: this.route });
    }
    goToCommissions(): void {
        this.router.navigate([`${this.mpGroup}/commissions`], { relativeTo: this.route });
    }
    goToScheduleSend(): void {
        this.router.navigate([`${this.mpGroup}/business/schedule-send`], { relativeTo: this.route });
    }
    /**
     * This method used to navigate user to pending enrollments page of a direct customer.
     */
    goToPendingEnrollments(): void {
        this.router.navigate([`${this.mpGroup}/business/pending-enrollments`], { relativeTo: this.route });
    }
    routeToCustomers(): void {
        this.router.navigate([`customers/${this.mpGroup}`], {
            relativeTo: this.route,
            queryParams: { producerId: this.producerId },
        });
    }
    getProducerSitCodes(): void {
        forkJoin(this.aflac.getSitCodes(CompanyCode.US), this.aflac.getSitCodes(CompanyCode.NY)).subscribe((resp) => {
            this.validateWritingNumbers(resp[0], resp[1]);
        });
    }
    /** *
     * This method used to get the site code details.
     */
    getSitCodesByWritingNumber(): void {
        let usWritingNumberData = [];
        let nyWritingNumberData = [];
        this.usWritingNumberData = [];
        this.nyWritingNumberData = [];
        usWritingNumberData = this.writingNumbers.map((ele) => {
            this.USSitCodeOptions = ele.sitCodes.filter((sit) => sit.companyCode === CompanyCode.US);
            // eslint-disable-next-line id-denylist
            return { number: ele.number, sitCodes: this.USSitCodeOptions };
        });
        nyWritingNumberData = this.writingNumbers.map((ele) => {
            this.NYSitcodeOptions = ele.sitCodes.filter((sit) => sit.companyCode === CompanyCode.NY);
            // eslint-disable-next-line id-denylist
            return { number: ele.number, sitCodes: this.NYSitcodeOptions };
        });
        usWritingNumberData.forEach((ele) => {
            if (ele.sitCodes && ele.sitCodes.length > 0) {
                this.usWritingNumberData.push(ele);
            }
        });
        nyWritingNumberData.forEach((ele) => {
            if (ele.sitCodes && ele.sitCodes.length > 0) {
                this.nyWritingNumberData.push(ele);
            }
        });
        this.validateWritingNumbers(this.usWritingNumberData, this.nyWritingNumberData);
    }
    /** *
     * Method to validate the writing number
     * @param usWritingNumberData US sit code details
     * @param nyWritingNumberData is NY sit code details
     */
    validateWritingNumbers(usWritingNumberData: WritingNumber[], nyWritingNumberData: WritingNumber[]): void {
        // eslint-disable-next-line prefer-const
        let createDirectAccountDialogData: CreateDirectAccountDialogData = {
            nySitCodes: null,
            usSitCodes: null,
        };
        if (usWritingNumberData.length > 0) {
            usWritingNumberData.forEach((usWritingNumber: WritingNumber, index) => {
                if (usWritingNumber.sitCodes.length > 0 || index > 0) {
                    createDirectAccountDialogData.usSitCodes = usWritingNumberData;
                }
            });
            if (!createDirectAccountDialogData.usSitCodes) {
                this.usSitCodeId = usWritingNumberData[0].sitCodes[0].id;
            }
        }
        if (nyWritingNumberData.length > 0) {
            nyWritingNumberData.forEach((nyWritingNumber: WritingNumber, index) => {
                if (nyWritingNumber.sitCodes.length > 0 || index > 0) {
                    createDirectAccountDialogData.nySitCodes = nyWritingNumberData;
                }
            });
            if (!createDirectAccountDialogData.nySitCodes) {
                this.nySitCodeId = nyWritingNumberData[0].sitCodes[0].id;
            }
        }
        if (createDirectAccountDialogData.nySitCodes || createDirectAccountDialogData.usSitCodes) {
            this.isLoading = false;
            this.openCreateAccountPopUp(createDirectAccountDialogData);
        } else {
            this.createDirectAccount().pipe(takeUntil(this.unsubscribe$)).subscribe();
        }
    }
    /** *
     * This method used to open create direct account pop up.
     */
    openCreateAccountPopUp(data: CreateDirectAccountDialogData): void {
        const matDialogRef = this.dialog.open(CreateDirectAccountComponent, {
            data: data,
        });
        this.dialogRefsubscription$ = matDialogRef
            .afterClosed()
            .pipe(
                tap((resp) => {
                    if (resp.cancel) {
                        this.router.navigate(["/producer/payroll"]);
                        this.dialogRefsubscription$.unsubscribe();
                    } else if (resp.back) {
                        this.openDirect();
                    }
                }),
                filter((resp) => resp.create),
                switchMap((resp) => {
                    if (resp.nySitCodeId) {
                        this.nySitCodeId = resp.nySitCodeId;
                    }
                    if (resp.usSitCodeId) {
                        this.usSitCodeId = resp.usSitCodeId;
                    }
                    return this.createDirectAccount();
                }),
            )
            .subscribe();
    }
    /**
     * Method to create direct account. it will call when there is no direct account.
     * @returns http response
     */
    createDirectAccount(): Observable<Accounts> {
        this.isLoading = true;
        return this.accountService
            .createDirectAccount(
                {
                    nySitCodeId: this.nySitCodeId ? this.nySitCodeId : null,
                    usSitCodeId: this.usSitCodeId ? this.usSitCodeId : null,
                },
                this.producerId ? this.producerId : null,
            )
            .pipe(
                switchMap((response) => {
                    this.isLoading = false;
                    if (this.producerId) {
                        return this.getDirectAccount(this.producerId);
                    }
                    return this.getDirectAccount();
                }),
                catchError((error) => {
                    this.isLoading = false;
                    this.router.navigate(["/producer/payroll"]);
                    if (error.status === ClientErrorResponseCode.RESP_403) {
                    }
                    if (error.status === ServerErrorResponseCode.RESP_503) {
                    }
                    return throwError(error);
                }),
            );
    }

    /**
     * Navigates to selected route
     * @param route selected side-nav option
     */
    navigateToSelectedOption(route: string): void {
        switch (route) {
            case this.languageStrings[EmpSidenavContent.REPORTS]:
                this.goToReports();
                break;
            case this.languageStrings[EmpSidenavContent.COMMISSIONS]:
                this.goToCommissions();
                break;
            case this.languageStrings[EmpSidenavContent.CUSTOMERS]:
                this.routeToCustomers();
                break;
            case this.languageStrings[EmpSidenavContent.SCHEDULE_AND_SEND]:
                this.goToScheduleSend();
                break;
            case this.languageStrings[EmpSidenavContent.PENDING_ENROLLMENTS]:
                this.goToPendingEnrollments();
                break;
        }
    }
    /** *
     * Method to check the EFinancial and other permissions.
     */
    getRequiredPermissions(): void {
        this.staticUtil
            .hasPermission(Permission.AFLAC_E_FINANCE)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((aflacEFinance) => (this.eFinancePermission = aflacEFinance));
    }
    /**
     * Life cycle hook to unsubscribe the subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
