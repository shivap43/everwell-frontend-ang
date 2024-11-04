import { Component, OnInit, Input, AfterContentInit, Output, EventEmitter, OnChanges, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { MatSidenav } from "@angular/material/sidenav";
import { MediaMatcher } from "@angular/cdk/layout";
import { MonSideNavList, MemberService, AuthenticationService, BenefitsOfferingService } from "@empowered/api";
import { Router, NavigationEnd } from "@angular/router";
import { Subscription, Observable, Subject } from "rxjs";
import { Store } from "@ngxs/store";
import { map, take, filter, takeUntil } from "rxjs/operators";
import { Permission, BooleanConst, EmployeeData, DualPlanYearSettings, Portals } from "@empowered/constants";
import { AccountsBusinessService, SharedService, PortalType, TPIRestrictionsForHQAccountsService } from "@empowered/common-services";
import { UtilService, AccountListState, DualPlanYearState, QleOeShopModel } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";

const EMPTY = "";
const SHOP = "Shop";
const LIFE_EVENT_ENROLLMENT = "Life Event enrollment";
const OPEN_ENROLLMENT = "Open Enrollment";
const AFLAQ_HQ_AVOID_MENU_ITEMS = {
    proposals: "Proposals",
    "enrollment-options": "Enrollment options",
};
const HQ_ACCOUNT = "is_hq_account";
const TRUE_VALUE = "TRUE";
const CURRENT = "current";
const FUTURE = "future";
const COVERAGE = "Coverage";

@Component({
    selector: "empowered-mon-navlist",
    templateUrl: "./mon-navlist.component.html",
    styleUrls: ["./mon-navlist.component.scss"],
})
export class MonNavlistComponent implements OnInit, AfterContentInit, OnChanges, OnDestroy {
    @Input() navigationOptions: MonSideNavList[];
    @Input() dashboardSideNav: MatSidenav;
    @Input() backToList: boolean;
    @Input() backToListName: string;
    @Input() employeeData: EmployeeData;
    @Input() brandingColor$: Observable<string>;
    @Output() optionSelected: EventEmitter<any> = new EventEmitter<any>();
    private readonly _mobileQueryListener: () => void;
    mobileQuery: MediaQueryList;
    businessExpand = false;
    currentPath: string;
    hireDateSubscription: Subscription;
    portal: string;
    subscriptions: Subscription[] = [];
    mpGroupId: string;
    isTpiAccount = false;
    isHqAccount = false;
    showShopConfig = true;
    shopPermission = false;
    authenticatedPortal$: Observable<PortalType> = this.shared.userPortal$.pipe(
        map((portal) => portal.type as PortalType),
        take(1),
    );
    private readonly unsubscribe$ = new Subject<void>();
    constructor(
        media: MediaMatcher,
        private readonly router: Router,
        private readonly memberService: MemberService,
        private readonly shared: SharedService,
        private readonly tpiRestrictions: TPIRestrictionsForHQAccountsService,
        private readonly store: Store,
        private readonly utilService: UtilService,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly authenticationService: AuthenticationService,
        private readonly accountBusinessService: AccountsBusinessService,
        private readonly dateService: DateService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) {
        this.authenticatedPortal$.pipe(takeUntil(this.unsubscribe$)).subscribe((response) => (this.portal = response));
        this.mobileQuery = media.matchMedia("(max-width: 992px)");
        this.router.events.pipe(takeUntil(this.unsubscribe$)).subscribe((val) => {
            if (val instanceof NavigationEnd) {
                this.activeRoute(val.url);
                this.currentPath = val.url;
            }
        });
    }
    /**
     * Life cycle hook to initialize the component.
     * Initialize side nav, getting require data as well as check and set flags.
     * @returns void
     */
    ngOnInit(): void {
        const mpGroupId = this.store.selectSnapshot(AccountListState.getMpGroupId);
        this.mpGroupId = mpGroupId ? mpGroupId.toString() : "";
        if (this.portal.toUpperCase() === Portals.PRODUCER) {
            this.subscriptions.push(
                this.tpiRestrictions
                    .canAccessTPIRestrictedModuleInHQAccount()
                    .pipe(
                        filter((res) => !res),
                        takeUntil(this.unsubscribe$),
                    )
                    .subscribe((_) => {
                        if (this.navigationOptions) {
                            this.navigationOptions = this.navigationOptions.map((menu) => {
                                menu.subMenuItem = menu.subMenuItem.filter((item) => item.name !== AFLAQ_HQ_AVOID_MENU_ITEMS.proposals);
                                return menu;
                            });
                        }
                    }),
            );
            this.subscriptions.push(
                this.tpiRestrictions
                    .canAccessTPIRestrictedModuleInHQAccount(Permission.AFLAC_HQ_TPP_ACCESS)
                    .pipe(
                        filter((res) => !res),
                        takeUntil(this.unsubscribe$),
                    )
                    .subscribe((_) => {
                        if (this.navigationOptions) {
                            this.navigationOptions = this.navigationOptions.filter((menu) => {
                                if (menu.subMenuItem) {
                                    return (menu.subMenuItem = menu.subMenuItem.filter(
                                        (item) => item.name !== AFLAQ_HQ_AVOID_MENU_ITEMS["enrollment-options"],
                                    ));
                                }
                                return undefined;
                            });
                        }
                    }),
            );
        }
    }
    ngAfterContentInit(): void {
        if (this.mobileQuery.matches) {
            this.dashboardSideNav.opened = false;
        } else {
            this.dashboardSideNav.opened = true;
        }
    }

    /**
     * Ths method will be called when there is change in navigationoptions or employeeData.
     * The method is used to hide shop button for future hire date.
     */
    ngOnChanges(): void {
        if (this.navigationOptions && this.navigationOptions.some((opt) => opt.menuIntem.name === SHOP) && this.employeeData) {
            this.subscriptions.push(
                this.memberService.getMemberHireDate.pipe(takeUntil(this.unsubscribe$)).subscribe((updatedHireDate) => {
                    let showMenu = true;
                    if (updatedHireDate !== EMPTY) {
                        showMenu = this.dateService.isBeforeOrIsEqual(updatedHireDate);
                        this.hireDateNavigationOptions(showMenu);
                    }

                    if (updatedHireDate === EMPTY) {
                        if (!this.employeeData.hireDate) {
                            showMenu = false;
                        } else {
                            showMenu = this.dateService.isBeforeOrIsEqual(this.employeeData.hireDate);
                        }
                        this.hireDateNavigationOptions(showMenu);
                    }
                    this.hireDateNavigationOptions(showMenu);
                }),
            );
            this.activateShopSubMenu();
            this.removeShopMenuItem();
            this.removeShopMenuItemForTPPAccounts();
        } else if (this.navigationOptions) {
            this.hireDateNavigationOptions(true);
            this.activateShopSubMenu();
            // Runs change detection
            this.changeDetectorRef.detectChanges();
        }
    }

    /**
     * This method will add showMenu flag to every object in navigationOptions.
     * The flag is used to determine whether to show that menu or not.
     * @param showMenu flag of type bolean to determine whether to show menu or not.
     */
    hireDateNavigationOptions(showMenu: boolean): void {
        let restrictScheduleAndSend,
            restrictPendingEnrollments,
            restrictMessageCenter,
            restrictReports = false;

        this.authenticationService.permissions$.pipe(takeUntil(this.unsubscribe$)).subscribe(
            (response) => {
                if (response.length > 0) {
                    restrictScheduleAndSend = Boolean(response.find((d) => String(d) === Permission.RESTRICT_SCHEDULE_AND_SEND));
                    restrictPendingEnrollments = Boolean(response.find((d) => String(d) === Permission.RESTRICT_PENDING_ENROLLMENTS));
                    restrictMessageCenter = Boolean(response.find((d) => String(d) === Permission.RESTRICT_MESSAGE_CENTER));
                    restrictReports = Boolean(response.find((d) => String(d) === Permission.RESTRICT_REPORTS));
                }
            },
            (Error) => {
                // TODO need to handle Error
            },
        );
        this.navigationOptions = this.navigationOptions.map((menu) => {
            if (menu.menuIntem.name === SHOP) {
                return { ...menu, hireDateClause: showMenu };
            }
            if (
                (menu.menuIntem.name === "Business" && restrictScheduleAndSend && restrictPendingEnrollments) ||
                (menu.menuIntem.name === "Message center" && restrictMessageCenter) ||
                (menu.menuIntem.name === "Reports" && restrictReports)
            ) {
                return { ...menu, hireDateClause: false };
            }
            return { ...menu, hireDateClause: true };
        });
    }
    /**
     * In Dual plan year scenario, the selected shop will be set to active on the side nav.
     */
    activateShopSubMenu(): void {
        const dualPlanYearState: QleOeShopModel = this.store.selectSnapshot(DualPlanYearState);
        const selectedShop = dualPlanYearState.selectedShop;
        this.navigationOptions.forEach((menu) => {
            if (menu.menuIntem.name === SHOP && menu.subMenuItem.length) {
                menu.subMenuItem.forEach((subMenu) => {
                    if (dualPlanYearState.isQleAfterOeEnrollment) {
                        if (
                            (subMenu.name.includes(CURRENT) && selectedShop === DualPlanYearSettings.QLE_SHOP) ||
                            (subMenu.name.includes(FUTURE) && selectedShop === DualPlanYearSettings.OE_SHOP)
                        ) {
                            subMenu.routerLinkActive = true;
                        }
                    } else if (
                        (subMenu.name.includes(LIFE_EVENT_ENROLLMENT) && selectedShop === DualPlanYearSettings.QLE_SHOP) ||
                        (subMenu.name.includes(OPEN_ENROLLMENT) && selectedShop === DualPlanYearSettings.OE_SHOP)
                    ) {
                        subMenu.routerLinkActive = true;
                    }
                });
            }
        });
    }

    /**
     * Method to get the activated link based on route
     * @param path URL route
     */
    activeRoute(path: string): void {
        this.router.events.pipe(takeUntil(this.unsubscribe$)).subscribe((val) => {
            if (val instanceof NavigationEnd) {
                const currentPath = val.url;
                if (path && currentPath) {
                    this.navigationOptions.forEach((menu) =>
                        menu.subMenuItem.forEach((submenu) => {
                            if (submenu.path === path && currentPath.indexOf(path) >= 0) {
                                menu.businessExpand = true;
                                submenu.routerLinkActive = true;
                            }
                        }),
                    );
                }
            }
        });
    }
    menuItemClicked(): void {
        if (this.mobileQuery.matches) {
            this.dashboardSideNav.opened = false;
        }
    }
    optionSelectedTrigger(item: string): void {
        this.optionSelected.emit(item);
    }
    checkExpandedStatus(key: MonSideNavList): boolean {
        let expanded = false;
        if (key.menuIntem.path && this.currentPath.indexOf(key.menuIntem.path) >= 0) {
            expanded = true;
        } else if (!key.menuIntem.path) {
            key.subMenuItem.forEach((submenu) => {
                submenu.routerLinkActive = false;
                if (this.currentPath.indexOf(submenu.path) >= 0) {
                    submenu.routerLinkActive = true;
                    expanded = true;
                }
            });
        }

        return expanded;
    }
    /**
     * This method will remove the shop menu item if the user doesn't have permission for it.
     * @returns void
     */
    removeShopMenuItem(): void {
        this.subscriptions.push(
            this.utilService
                .checkDisableForRole12Functionalities(Permission.TPP_RESTRICTED_PERMISSION, this.mpGroupId)
                .pipe(
                    filter(([isRestricted, accountData]) => isRestricted && accountData.thirdPartyPlatformsEnabled),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe(() => {
                    this.navigationOptions = this.navigationOptions.filter((opt) => opt.menuIntem.name !== SHOP);
                }),
        );
    }
    /**
     * This method will remove the shop menu item if the TPI user doesn't have permission for it.
     * This removes the shop menu for role 12 and role 91 users
     * @returns void
     */
    removeShopMenuItemForTPPAccounts(): void {
        this.accountBusinessService
            .checkPermissions(this.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([accountInfo, permissionConfig, groupAttribute, permissions]) => {
                this.isTpiAccount = accountInfo.thirdPartyPlatformsEnabled;
                this.showShopConfig = permissionConfig[0].value === TRUE_VALUE;
                this.isHqAccount = groupAttribute[0]?.attribute === HQ_ACCOUNT && groupAttribute[0].value === BooleanConst.TRUE;
                if (permissions.length > 0) {
                    this.shopPermission = Boolean(permissions.some((d) => String(d) === Permission.RESTRICT_SHOP));
                }
                if (this.shopPermission && this.showShopConfig && this.isTpiAccount && !this.isHqAccount) {
                    this.navigationOptions = this.navigationOptions.filter((opt) => opt.menuIntem.name !== SHOP);
                }
            });
    }
    /**
     * This method will be called immediately before the component instance is destroyed.
     */
    ngOnDestroy(): void {
        this.memberService.setMemberHireDate = EMPTY;
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
