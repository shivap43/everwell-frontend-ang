import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { BreakpointObserver, BreakpointState } from "@angular/cdk/layout";
import { UserService } from "@empowered/user";
import { RouteInterceptorService } from "@empowered/common-services";
import { ProducerService } from "@empowered/api";
import { Store } from "@ngxs/store";
import { Router, NavigationEnd } from "@angular/router";
import { MatMenuTrigger } from "@angular/material/menu";
import { filter, tap, switchMap, take } from "rxjs/operators";
import { Subscription, combineLatest, iif, defer, NEVER, Observable } from "rxjs";
import {
    MicroSiteConfig,
    MicroSiteLanguage,
    MICROSITE_ACCOUNT_LANDING_PAGE,
    UserPermissionList,
    PartnerId,
    ConfigName,
} from "@empowered/constants";
import { Permission, ProducerCredential } from "@empowered/constants";
import { EnrollmentMethodState, SetIsSubOrdinates, SetSearchedProducer, StaticUtilService, UtilService } from "@empowered/ngxs-store";

const CONFIG_INDEX = {
    OVERVIEW: 0,
    PAYROLL: 1,
    DIRECT: 2,
    TEAM: 3,
    CHANGE_REQUESTS: 4,
    QUICK_QUOTE: 5,
    AFLAC_FORMS: 6,
    AFLAC_ACCOUNT_LANDING_PAGE: 7,
    RATE_SHEETS: 8,
};

const NAV_BAR_ITEMS_TO_DISPLAY = {
    EFINANCE: 6,
    NON_EFINANCE: 4,
    CALL_CENTER_DISPLAY: 1,
};

const SUPERVISOR_ID = "supervisorProducerId";
const TEAM_TAB = "primary.portal.primaryNav.team";
const CUSTOMER_ROUTE = "customers";
const DIRECT_TAB = "direct";
const PRODUCER_URL = "payroll";
@Component({
    selector: "empowered-header-nav",
    templateUrl: "./header-nav.component.html",
    styleUrls: ["./header-nav.component.scss"],
})
export class HeaderNavComponent implements OnInit, OnDestroy {
    @ViewChild(MatMenuTrigger, { read: MatMenuTrigger }) moreOptionsTrigger: MatMenuTrigger;
    subscriptions: Subscription[] = [];
    currentUrl = "";
    navItems = [];
    menuItems = [];
    permission = Permission;
    visibleHeaderTabs: Array<{ name: string; lang: string; config: boolean; permission: boolean }> = [];
    items = [
        { name: "overview", lang: "primary.portal.primaryNav.overview", config: true, permission: true },
        {
            name: "payroll",
            lang: "primary.portal.primaryNav.payroll",
            config: true,
            permission: true,
            otherRoutes: ["member"],
        },
        { name: "direct", lang: "primary.portal.primaryNav.direct", config: true, permission: true },
        { name: "team", lang: "primary.portal.primaryNav.team", config: true, permission: true },
        {
            name: "change-requests",
            lang: "primary.portal.primaryNav.policyChangeRequest",
            config: true,
            permission: true,
        },
        { name: "quick-quote", lang: "primary.portal.primaryNav.universalQuote", config: true, permission: true },
        { name: "aflac-forms", lang: "primary.portal.primaryNav.aflacForms", config: true, permission: true },
        {
            name: "account-landing-pages",
            lang: MicroSiteLanguage.ACCOUNT_LANDING_PAGE,
            config: false,
            permission: false,
            externalLink: true,
        },
        { name: "rate-sheets", lang: "primary.portal.primaryNav.rateSheets", config: true, permission: true },
    ];
    currentRoute = "";
    isCallCenterAgent = false;
    showTeamTabFlag: boolean;
    params = {};
    isAflacUser: boolean;
    accountLandingPage = MICROSITE_ACCOUNT_LANDING_PAGE;
    /**
     * Use to get the account landing page url
     */
    accountLandingPageUrl$: Observable<string> = this.staticUtil.cacheConfigValue(MicroSiteConfig.MICROSITE_ACCOUNT_LANDING_PAGE_URL);
    constructor(
        private readonly ri: RouteInterceptorService,
        public breakpointObserver: BreakpointObserver,
        public user: UserService,
        private readonly producerService: ProducerService,
        private readonly store: Store,
        private readonly utilService: UtilService,
        public router: Router,
        private readonly staticUtil: StaticUtilService,
    ) {}
    /**
     * check permissions and config for header nav items
     */
    ngOnInit(): void {
        this.subscriptions.push(
            combineLatest([
                this.user.credential$,
                this.staticUtil.hasPermission(UserPermissionList.HYBRID_USER),
                this.staticUtil.hasAllPermission([UserPermissionList.PENDED_BUSINESS_READ, UserPermissionList.PENDED_BUSINESS_UPDATE]),
            ])
                .pipe(
                    take(1),
                    tap(([credential, hybridUserPermission, showPendedBusiness]) => {
                        this.isAflacUser = credential["partnerId"] === PartnerId.AFLAC;
                    }),
                    filter(([credential, hybridUserPermission, showPendedBusiness]) => "producerId" in credential),
                    tap(([credential, hybridUserPermission, showPendedBusiness]: [ProducerCredential, boolean, boolean]) => {
                        if (credential.producerId && credential.callCenterId && !hybridUserPermission) {
                            this.isCallCenterAgent = true;
                        }
                        this.params[SUPERVISOR_ID] = credential.producerId;

                        if (this.params && this.params[SUPERVISOR_ID] && showPendedBusiness) {
                            this.items.push({
                                name: "pended-business",
                                lang: "primary.portal.primaryNav.pendedBusiness",
                                config: true,
                                permission: showPendedBusiness,
                            });
                        }
                    }),
                    switchMap(() =>
                        iif(
                            () => Boolean(this.params && this.params[SUPERVISOR_ID]),
                            defer(() =>
                                this.producerService.producerSearch(this.params).pipe(
                                    tap((response) => {
                                        this.showTeamTabFlag = response.content.length ? true : false;
                                        this.store.dispatch(new SetIsSubOrdinates(this.showTeamTabFlag));
                                    }),
                                ),
                            ),
                            defer(() => NEVER),
                        ),
                    ),
                )
                .subscribe(),
        );
        this.subscriptions.push(
            combineLatest([
                this.staticUtil.cacheConfigEnabled("portal.producer.overview_tab.enabled"),
                this.staticUtil.hasPermission(UserPermissionList.POLICY_CHANGE_REQUEST),
                this.staticUtil.hasPermission(UserPermissionList.QUICK_QUOTE),
                this.staticUtil.hasPermission(UserPermissionList.PAYROLL),
                this.staticUtil.hasPermission(UserPermissionList.DIRECT),
                this.staticUtil.cacheConfigEnabled("general.forms_repository.user.enable"),
                this.staticUtil.hasPermission(UserPermissionList.FORMS),
                this.staticUtil.hasPermission(UserPermissionList.AFLAC_E_FINANCE),
                this.staticUtil.hasPermission(UserPermissionList.AFLAC_CLEAR_LINK),
                this.staticUtil.hasPermission(UserPermissionList.AFLAC_STRIDE_LIFE_QUOTE),
                this.staticUtil.hasPermission(UserPermissionList.AFLAC_ACCOUNT_LANDING_PAGE),
                this.staticUtil.cacheConfigEnabled(MicroSiteConfig.MICROSITE_ACCOUNT_LANDING_PAGE_ENABLE),
                this.staticUtil.cacheConfigEnabled(ConfigName.RATE_SHEETS_ENABLED),
            ]).subscribe(
                ([
                    overviewConfig,
                    policyChangeRequestPermission,
                    quickQuotePermission,
                    payroll,
                    direct,
                    formsConfig,
                    formsPermission,
                    aflacEFinance,
                    aflacClearLink,
                    aflacStrideLifeQuote,
                    alfacAccountLandingPagePermission,
                    alfacAccountLandingPageConfig,
                    rateSheetsEnabledConfig,
                ]) => {
                    this.items[CONFIG_INDEX.OVERVIEW].config = overviewConfig; // Overview tab
                    // Payroll tab
                    this.items[CONFIG_INDEX.PAYROLL].permission = aflacEFinance || aflacClearLink || aflacStrideLifeQuote ? false : payroll;
                    this.items[CONFIG_INDEX.DIRECT].permission = direct; // direct tab
                    this.items[CONFIG_INDEX.CHANGE_REQUESTS].permission = policyChangeRequestPermission; // Policy Change Request tab
                    // Quick Quote tab
                    this.items[CONFIG_INDEX.QUICK_QUOTE].permission = quickQuotePermission && this.isAflacUser;
                    // Rate sheets tab
                    this.items[CONFIG_INDEX.RATE_SHEETS].permission =
                        this.items[CONFIG_INDEX.QUICK_QUOTE].permission && rateSheetsEnabledConfig;

                    this.items[CONFIG_INDEX.AFLAC_FORMS].permission = formsPermission;
                    this.items[CONFIG_INDEX.AFLAC_FORMS].config = formsConfig;

                    this.items[CONFIG_INDEX.AFLAC_ACCOUNT_LANDING_PAGE].permission = alfacAccountLandingPagePermission;
                    this.items[CONFIG_INDEX.AFLAC_ACCOUNT_LANDING_PAGE].config = alfacAccountLandingPageConfig;
                    this.visibleHeaderTabs = this.items.filter((item) => item.config && item.permission);
                    const result = [...this.visibleHeaderTabs];
                    if (
                        (aflacEFinance || aflacClearLink || aflacStrideLifeQuote) &&
                        this.visibleHeaderTabs.length >= NAV_BAR_ITEMS_TO_DISPLAY.EFINANCE
                    ) {
                        this.navItems = result.splice(0, NAV_BAR_ITEMS_TO_DISPLAY.EFINANCE);
                        this.menuItems = [...result];
                    } else if (this.visibleHeaderTabs.length >= NAV_BAR_ITEMS_TO_DISPLAY.NON_EFINANCE) {
                        this.navItems = result.splice(0, NAV_BAR_ITEMS_TO_DISPLAY.NON_EFINANCE);
                        this.menuItems = [...result];
                    } else {
                        this.navItems = [...result];
                        this.menuItems = [];
                    }
                    this.sortMenuItems();
                },
            ),
        );

        this.subscriptions.push(
            this.breakpointObserver.observe(["(max-width: 992px)"]).subscribe((state: BreakpointState) => {
                if (this.isCallCenterAgent) {
                    const result = [...this.visibleHeaderTabs].filter((item) => item.lang !== TEAM_TAB || this.showTeamTabFlag);
                    if (state.matches) {
                        this.navItems = result.splice(0, NAV_BAR_ITEMS_TO_DISPLAY.CALL_CENTER_DISPLAY);
                        this.menuItems = [...result];
                    } else {
                        this.navItems = result.splice(0, NAV_BAR_ITEMS_TO_DISPLAY.NON_EFINANCE);
                        this.menuItems = [...result];
                    }
                } else if (state.matches) {
                    const result = [...this.visibleHeaderTabs];
                    if (this.visibleHeaderTabs.length > 3) {
                        this.navItems = result.splice(0, 3);
                        this.menuItems = [...result];
                    } else {
                        this.navItems = [...result];
                        this.menuItems = [];
                    }
                } else {
                    const result = [...this.visibleHeaderTabs];
                    if (this.visibleHeaderTabs.length > 4) {
                        this.navItems = result.splice(0, 4);
                        this.menuItems = [...result];
                    } else {
                        this.navItems = [...result];
                        this.menuItems = [];
                    }
                }
                this.sortMenuItems();
            }),
        );

        this.subscriptions.push(
            this.ri.currentRoute$.subscribe((route) => {
                this.currentRoute = route;
            }),
        );
        this.subscriptions.push(
            this.router.events.subscribe((event) => {
                if (event instanceof NavigationEnd) {
                    this.currentUrl = event.url;
                }
            }),
        );
    }

    /**
     * Used to sort the menuItems by ascending order
     */
    sortMenuItems(): void {
        this.menuItems.sort((x, y) => (x.name < y.name ? -1 : 1));
    }

    /**
     * Function to setting the tab name for the portal
     * @param tabName tab name of header
     * @param portal portal type of the application
     */
    openTab(tabName: string, portal?: string): void {
        this.utilService.setPortalTabName(tabName);
        if (tabName === DIRECT_TAB) {
            const mpGroupId = this.store.selectSnapshot(EnrollmentMethodState.getDirectAccountId);
            if (mpGroupId) {
                this.router.navigate([`${portal}/${tabName}/${CUSTOMER_ROUTE}/${mpGroupId}`]);
            }
        }
        if (tabName === PRODUCER_URL) {
            this.store.dispatch(new SetSearchedProducer(null));
        }
        if (tabName === this.accountLandingPage) {
            this.subscriptions.push(
                this.accountLandingPageUrl$.subscribe((url) => {
                    window.open(url, "_blank");
                }),
            );
        }
    }
    isMenuActive(): boolean {
        let bFound = false;
        const item = this.menuItems.filter((a) => a.name === this.currentRoute);
        if (item.length) {
            bFound = true;
        }
        return bFound;
    }
    activeInOtherRoute(name: string): boolean {
        let bFound = false;
        const item = this.navItems.filter((a) => a.name === name);
        if (item.length && item[0].otherRoutes) {
            item[0].otherRoutes.forEach((route) => {
                if (this.currentUrl.split("/").includes(route)) {
                    bFound = true;
                }
            });
        }
        return bFound;
    }
    /**
     * This method destroys all subscriptions.
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subs) => subs.unsubscribe());
    }
}
