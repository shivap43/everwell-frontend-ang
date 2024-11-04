import { Component, OnInit, AfterContentInit, Input, HostListener, OnDestroy, Output, EventEmitter } from "@angular/core";
import { ActivatedRoute, Router, NavigationEnd } from "@angular/router";
import { MediaMatcher } from "@angular/cdk/layout";
import { MatSidenav } from "@angular/material/sidenav";
import { Store } from "@ngxs/store";
import { BenefitsOfferingService, AuthenticationService, ExceptionsService, AflacService } from "@empowered/api";
import { Observable, BehaviorSubject, Subject, EMPTY } from "rxjs";
import { takeUntil, catchError, switchMap } from "rxjs/operators";
import { LanguageService } from "@empowered/language";
import { Permission, UserPermissionList, AppSettings, ToastType, Exceptions, Accounts } from "@empowered/constants";
import { AflacBusinessService } from "@empowered/api-service";
import { AccountInfoState, SharedState, StaticUtilService } from "@empowered/ngxs-store";
import { OpenToast, ToastModel } from "@empowered/ui";
import { MPGroupAccountService, RouteInterceptorService } from "@empowered/common-services";

@Component({
    selector: "empowered-dashboard-sidenav",
    templateUrl: "./dashboard-sidenav.component.html",
    styleUrls: ["./dashboard-sidenav.component.scss"],
})
export class DashboardSidenavComponent implements OnInit, AfterContentInit, OnDestroy {
    currentUrl = "";
    @Input() credential: any;
    @Input() dashboardSideNav: MatSidenav;
    @Input() mpGroup: number;
    @Output() selectedNav = new EventEmitter<string>();
    private readonly screenWidth$ = new BehaviorSubject<number>(window.innerWidth);
    private readonly unsubscribe$ = new Subject<void>();
    private readonly _mobileQueryListener: () => void;
    mobileQuery: MediaQueryList;
    portal: any;
    createPermission = false;
    exceptions: Exceptions[];
    currentRoute = "";
    profileExpand = false;
    businessExpand = false;
    benefitsExpand = false;
    commissionsExpand = false;
    employeesExpand = false;
    reportsExpand = false;
    dashboardExpand = false;
    resourcesExpand = false;
    mpGroupAccount$: Observable<Accounts>;
    isAdminPortal = false;
    proposalsEnabled = false;
    reportsEnabled = false;
    adminAccountListEnabled = false;
    enteredBenefitsOffering = false;
    profileChildRoute = [];
    benefitsChildRoute = [];
    businessChildRoute = [];
    appSettings = AppSettings;

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.dashboard.accounts",
        "primary.portal.dashboard.accountList",
        "primary.portal.dashboard.dashboard",
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
        "primary.portal.benefitsOffering.refreshApi.failed",
    ]);
    inMemberPortal = false;
    classRegionPermission = false;
    hybridUserPermission$ = this.staticUtil.hasPermission(Permission.HYBRID_USER);
    isLoading: boolean;

    constructor(
        private readonly media: MediaMatcher,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly store: Store,
        private readonly benefitsService: BenefitsOfferingService,
        private readonly authenticationService: AuthenticationService,
        private readonly exceptionService: ExceptionsService,
        private readonly ri: RouteInterceptorService,
        private readonly mpGroupAccountService: MPGroupAccountService,
        private readonly language: LanguageService,
        private readonly aflacService: AflacService,
        private readonly staticUtil: StaticUtilService,
        private readonly aflacBusinessService: AflacBusinessService,
    ) {
        this.mobileQuery = this.media.matchMedia("(max-width: 992px)");
        this.profileChildRoute = [
            "account-info",
            "contacts",
            "display-admin-list",
            "enrollment-options",
            "case-builder",
            "structure",
            "carriers",
            "resources",
            "rules",
            "branding",
        ];
        this.businessChildRoute = ["schedule-send", "pending-enrollments"];
        this.benefitsChildRoute = ["maintenance-offering", "offering", "change-requests", "exceptions", "proposals"];
    }

    /**
     * lifecycle hook
     * ngOnInit() use to initialize value on component load.
     */
    ngOnInit(): void {
        this.mpGroupAccount$ = this.mpGroupAccountService.mpGroupAccount$;
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.dashboardExpand = true;
        this.isAdminPortal = this.portal === AppSettings.PORTAL_ADMIN ? true : false;
        if (this.portal === AppSettings.PORTAL_MEMBER) {
            this.inMemberPortal = true;
            this.dashboardExpand = false;
        }
        this.getPermission();
        this.setExpandedSideManuByUrl();

        this.ri.currentRoute$.pipe(takeUntil(this.unsubscribe$)).subscribe((route) => {
            this.currentRoute = route;
            /*
             ** When you add parent/child tab to sidenav don't forgot to add here as well.
             */
            this.setExpandedSideMenu(route);
        });

        this.getScreenWidth()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((width) => {
                if (this.mobileQuery.matches) {
                    this.dashboardSideNav.opened = false;
                } else {
                    this.dashboardSideNav.opened = true;
                }
            });

        this.router.events.pipe(takeUntil(this.unsubscribe$)).subscribe((event) => {
            if (event instanceof NavigationEnd) {
                this.currentUrl = event.url;
            }
        });
    }
    /** Function for setting expanded side menu based on route  */
    setExpandedSideMenu(route: string): void {
        /* Dashboard */
        if (["dashboard"].includes(route)) {
            this.dashboardExpand = true;
            this.menuItemClicked();
        } else {
            this.dashboardExpand = false;
        }
        /* Profile */
        if (this.profileChildRoute.includes(route)) {
            this.profileExpand = true;
            this.menuItemClicked();
        } else {
            this.profileExpand = false;
        }
        /* Benefits */
        if (this.benefitsChildRoute.includes(route)) {
            this.benefitsExpand = true;
            this.menuItemClicked();
        } else {
            this.benefitsExpand = false;
        }
        /* Employees */
        if (["employees"].includes(route)) {
            this.employeesExpand = true;
            this.menuItemClicked();
        } else {
            this.employeesExpand = false;
        }
        /* Business */
        if (this.businessChildRoute.includes(route)) {
            this.businessExpand = true;
            this.menuItemClicked();
        } else {
            this.businessExpand = false;
        }
        /* Commissions */
        if (["commissions"].includes(route)) {
            this.commissionsExpand = true;
            this.menuItemClicked();
        } else {
            this.commissionsExpand = false;
        }
        /* Reports */
        if (["reports"].includes(route)) {
            this.reportsExpand = true;
            this.menuItemClicked();
        } else {
            this.reportsExpand = false;
        }
    }
    /** Function for setting expanded side menu based on current route intially */
    setExpandedSideManuByUrl(): void {
        if (this.router && this.router.url) {
            const currentRoute = this.router.url.substring(this.router.url.lastIndexOf("/") + 1);
            this.setExpandedSideMenu(currentRoute);
        }
    }

    @HostListener("window:resize", ["$event"])
    onResize(event: Event & { target: { innerWidth: number } }) {
        this.screenWidth$.next(event.target.innerWidth);
        if (!this.mobileQuery.matches) {
            this.dashboardSideNav.opened = true;
        } else {
            this.dashboardSideNav.opened = false;
        }
    }

    getScreenWidth(): Observable<number> {
        return this.screenWidth$.asObservable();
    }

    ngAfterContentInit(): void {
        if (this.mobileQuery.matches) {
            this.dashboardSideNav.opened = false;
        } else {
            this.dashboardSideNav.opened = true;
        }
    }
    menuItemClicked(): void {
        const routeUrl = this.router.url.split("/");
        const route = routeUrl[routeUrl.length - 1];
        this.selectedNav.emit(route);
        if (this.mobileQuery.matches) {
            this.dashboardSideNav.opened = false;
        }
        if (this.enteredBenefitsOffering && !window.location.pathname.includes("benefits/offering")) {
            this.enteredBenefitsOffering = false;
        }
    }

    navigateToPCR(): void {
        this.router.navigate(["change-requests"], { relativeTo: this.route });
        if (this.mobileQuery.matches) {
            this.dashboardSideNav.opened = false;
        }
    }

    navigateToProposals(): void {
        this.router.navigate(["proposals"], { relativeTo: this.route });
    }

    navigateToReports(): void {
        this.router.navigate(["reports"], { relativeTo: this.route });
    }

    goToCommissions(): void {
        this.router.navigate(["commissions"], { relativeTo: this.route });
    }

    goToEmployees(): void {
        this.router.navigate(["employees"], { relativeTo: this.route });
    }

    goToSendBusiness(): void {
        this.router.navigate(["business/schedule-send"], { relativeTo: this.route });
    }
    /**
     * navigateToBenefitsOffering() gives navigation to benefit offering page.
     */
    navigateToBenefitsOffering(): void {
        if (!window.location.pathname.includes("benefits/offering") && !this.enteredBenefitsOffering) {
            this.isLoading = true;
            let routerToMaintenance = false;
            this.store
                .select(AccountInfoState.getAccountInfo)
                .pipe(
                    switchMap((account) => this.aflacBusinessService.refreshAccountBasedOnImportType(account)),
                    takeUntil(this.unsubscribe$),
                    catchError(() => {
                        const message = this.languageStrings["primary.portal.benefitsOffering.refreshApi.failed"];
                        const toastData: ToastModel = {
                            message: message,
                            toastType: ToastType.WARNING,
                        };
                        this.store.dispatch(new OpenToast(toastData));
                        return EMPTY;
                    }),
                )
                .subscribe();
            this.benefitsService
                .getApprovalRequests(this.mpGroup)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (response) => {
                        this.isLoading = false;
                        if (response) {
                            if (response.length > 0) {
                                routerToMaintenance = true;
                            }
                            if (routerToMaintenance && !this.enteredBenefitsOffering) {
                                this.enteredBenefitsOffering = true;
                                this.router.navigate(["./benefits/maintenance-offering"], { relativeTo: this.route });
                            } else if (!this.enteredBenefitsOffering) {
                                this.enteredBenefitsOffering = true;
                                this.router.navigate(["./benefits/offering"], { relativeTo: this.route });
                            }
                        } else if (!this.enteredBenefitsOffering) {
                            this.enteredBenefitsOffering = true;
                            this.router.navigate([`${this.portal}/payroll/${this.mpGroup}/dashboard/benefits/offering`]);
                        }
                    },
                    (error) => {
                        this.isLoading = false;
                    },
                );
        }
    }

    navigateToExceptions(): void {
        // TODO: change route when it is confirmed
        this.router.navigate(["exceptions"], { relativeTo: this.route });
    }

    getPermission(): void {
        this.authenticationService.permissions$.pipe(takeUntil(this.unsubscribe$)).subscribe((response) => {
            const hasPermission = response.filter((d) => String(d) === UserPermissionList.EXCEPTION_CREATE);
            if (response.length > 0 && hasPermission.length === 1) {
                this.createPermission = true;
            }
            const hasClassRegionPermission = response.filter(
                (per) => String(per) === UserPermissionList.READ_CLASS || String(per) === UserPermissionList.READ_REGION,
            );
            if (response.length > 0 && hasClassRegionPermission.length > 0) {
                this.classRegionPermission = true;
            }
        });
        this.getExceptions();
    }

    getExceptions(): void {
        if (this.mpGroup) {
            this.exceptionService
                .getExceptions(this.mpGroup.toString())
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((data) => {
                    this.exceptions = data;
                });
        }
    }

    goToDashboard(): void {
        this.router.navigate(["../dashboard"], { relativeTo: this.route });
    }

    isRouteActive(route: string): boolean {
        let bFound = false;
        if (this.currentUrl.includes(route)) {
            bFound = true;
        }
        return bFound;
    }

    /**
     * This method destroys all subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
