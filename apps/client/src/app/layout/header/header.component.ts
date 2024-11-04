import { MediaMatcher } from "@angular/cdk/layout";
import { Component, OnInit, Input, Output, ElementRef, EventEmitter, OnDestroy, OnChanges } from "@angular/core";
import { MatIconRegistry } from "@angular/material/icon";
import { DomSanitizer } from "@angular/platform-browser";
import { Router, ActivatedRoute } from "@angular/router";
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { LanguageService } from "@empowered/language";
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { MemberService, NotificationService, EnrollmentService, AflacService, StaticService, AdminService } from "@empowered/api";
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { UserService, UserState } from "@empowered/user";

import { RouteInterceptorService } from "@empowered/common-services";
import { MatDialog } from "@angular/material/dialog";
import { MatSidenav } from "@angular/material/sidenav";
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { take } from "rxjs/operators";
import { OverlayRef, Overlay, OverlayConfig, OverlayPositionBuilder } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { Location } from "@angular/common";
import { SelfEnrollmentPopupComponent } from "@empowered/accounts";

import { AccountsService, EmpoweredModalService, MPGroupAccountService, PortalType, SharedService } from "@empowered/common-services";
import {
    AbstractNotificationModel,
    AdminCredential,
    AppSettings,
    ClientErrorResponseCode,
    ConfigName,
    Credential,
    HeaderObject,
    PortalState,
    PortalType as Portal,
    ServerErrorResponseCode,
    ToastType,
    UserPermissionList,
} from "@empowered/constants";
import { BreakPointUtilService, MemberHomeState, SharedState, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { MemberNotificationComponent, OpenToast, ToastModel } from "@empowered/ui";
import { CsrfService } from "@empowered/util/csrf";
import { Select, Store } from "@ngxs/store";
import deepEqual from "fast-deep-equal";
import { combineLatest, forkJoin, iif, Observable, of, Subject, Subscription, timer } from "rxjs";
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import {
    catchError,
    distinctUntilChanged,
    filter,
    first,
    map,
    retry,
    shareReplay,
    startWith,
    switchMap,
    takeUntil,
    tap,
    throttleTime,
} from "rxjs/operators";
import { NotificationQueueService } from "@empowered/util/websockets";

const TOAST_DURATION = 5000;
const DEFAULT_THROTTLE_TIME = 5000;
const DEFAULT_INTERVAL_TIME = 30000;
const API_RETRY = 3;

@Component({
    selector: "empowered-header",
    templateUrl: "./header.component.html",
    styleUrls: ["./header.component.scss"],
})
export class HeaderComponent implements OnInit, OnDestroy, OnChanges {
    languageStrings = this.language.fetchPrimaryLanguageValues([
        "primary.portal.enrollment.header",
        "primary.portal.header.notification",
        "primary.portal.requestSupport.pageHeader",
        "primary.portal.common.SkipToMainContent",
        "primary.portal.header.home",
        "primary.portal.header.msgDataRefreshed",
        "primary.portal.header.msgRefreshFailed",
        "primary.portal.header.msgRetrieveFailed",
        "primary.portal.header.msgNpnNotFound",
        "primary.portal.utilityNav.refreshProducerData",
        "primary.portal.header.profile",
        "primary.portal.header.references",
        "primary.portal.common.openNavigation",
        "primary.portal.enrollment.summary.header.review.enrollments",
    ]);

    @Input() user: Credential;
    @Input() isAuthenticated: boolean;
    @Input() sideNavMMP: MatSidenav;
    @Output() notificationFlag = new EventEmitter();
    @Select(MemberHomeState.GetHeaderObject) headerObject$: Observable<HeaderObject>;
    mobileQuery: MediaQueryList;

    isMember = false;
    currentRoute = "";
    portalTypeMember: PortalType = "member";
    portalTypeProducer: PortalType = "producer";
    nohamburgerMenuRoutes: string[] = [];
    noHeaderNevRoutes: string[] = [];
    noUtilityNevRoutes: string[] = [];
    shopRoutes: string[] = [];
    supportPageRoute: string[] = [];
    memberLogoRoutes: string[] = [];
    publicHeader = true;
    memberHeader = false;
    producerHeader = false;
    adminHeader = false;
    supportHeader = false;
    portalMMP = false;
    activeNotificationFlag: boolean;
    logoPublic: string;
    colorPublic: string;
    logoMember: string;
    colorMember: string;
    portal: PortalState;
    producerId: number;
    adminId: number;
    memberId: number;
    overlayRef: OverlayRef;
    isTestEmployee = false;
    getFullProfileSubscription: Subscription;
    tpaAdminUser: boolean;
    mobileSize: boolean;
    isLoading: boolean;
    mpGroup: number;
    isAppFlow: boolean;
    externalApp: boolean;
    subscriptions: Subscription[] = [];
    producerName: string;
    npn: string;
    message: string;
    toastType: ToastType;
    pendingEnrollments = false;
    profileEnabled = true;
    consentConst = "consent";
    isAgentSelfEnrolled = false;
    isWizard: boolean;
    notificationCount: number;
    globalNotificationCount: number;
    accountNotificationCount: number;
    mmpRouteUrl: string;
    loggedInUserId: number;
    private readonly notificationUnsubscribe$: Subject<void> = new Subject();
    reviewEnrollmentSummaryFlow: boolean;
    private readonly unsubscribe$: Subject<void> = new Subject();
    readonly createBrandingPermission = UserPermissionList.CREATE_BRANDING;

    /**
     * isBrandingConfigEnable$ is observable of type boolean used to check whether standard and custom branding are enabled or not
     * @returns boolean value
     */
    areBrandingConfigEnabled$: Observable<boolean> = forkJoin([
        this.staticService.getConfigurations("general.branding.standard.setUp_flag"),
        this.staticService.getConfigurations("general.branding.custom.setUp_flag"),
    ]).pipe(
        map(
            ([standard, custom]) =>
                !(standard[0].value.toLowerCase() === AppSettings.FALSE && custom[0].value.toLowerCase() === AppSettings.FALSE),
        ),
    );

    /**
     * get/set the current route so the header can show and hide things.
     */
    getHeaderState$ = combineLatest([
        this.ri.currentRoute$ as Observable<string>,
        this.sharedService.userPortal$,
        this.userService.isAuthenticated$,
    ]).pipe(
        distinctUntilChanged((previous, current) => deepEqual(previous, current)),
        tap(([route, portal, isAuthenticated]) => {
            this.portal = portal;
            this.currentRoute = route;
            this.isWizard = ["welcome", "myhousehold", "coverage"].includes(route);

            this.isAppFlow = this.route.snapshot["_routerState"].url.includes("wizard/enrollment/app-flow");
            this.externalApp = this.route.snapshot["_routerState"].url.includes("/paylogixconfirmation");
            this.reviewEnrollmentSummaryFlow = this.route.snapshot["_routerState"].url.includes("/review-enrollment-summary");

            // TODO: change to constants
            if (this.portal.type === "member") {
                this.portalMMP = true;
                this.publicHeader = false;
                this.supportHeader = this.currentRoute === "support" || this.mobileQuery.matches;
                this.producerHeader = ["shop", "welcome", "myhousehold", "coverage"].includes(this.currentRoute) || this.isAppFlow;
                this.memberHeader = !this.producerHeader;
            } else if (["admin", "producer"].includes(this.portal.type)) {
                this.memberHeader = this.publicHeader = this.profileEnabled = false;
                this.producerHeader = true;
            }
            if ((this.portal.type === "public" && !isAuthenticated) || this.currentRoute === "consent") {
                this.memberHeader = this.producerHeader = false;
                this.publicHeader = true;
            }
        }),
    );

    /**
     * Get portal type updates from the store.
     */
    portal$ = this.store.select(SharedState.portal).pipe(
        filter((portal) => !!portal),
        first(),
    );

    /**
     * Open notification window and scroll to top.
     */
    getNotificationStatus$ = this.utilService.getNotificationStatus().pipe(
        filter((res) => res),
        tap(() => {
            window.scrollTo(0, 0);
            this.openNotifications();
        }),
    );

    /**
     * Once user logs in, get notifications at a specified recurring interval.
     */
    notificationPoll$: Observable<AbstractNotificationModel[]> = this.userService.isAuthenticated$.pipe(
        distinctUntilChanged(),
        filter((isAuthenticated) => isAuthenticated),
        switchMap(() => this.getNotifications$),
        // get timing configurations from cache/database
        switchMap(() =>
            combineLatest([
                this.staticUtilService.cacheConfigValue("general.notifications.polling_interval"),
                this.staticUtilService.cacheConfigValue("general.notifications.polling_throttle"),
            ]).pipe(catchError(() => of(null))),
        ),
        // triggered whenever router completes any navigation
        switchMap(([intervalResponse, throttleResponse]) =>
            this.ri.lastNavigationEndEvent$.pipe(
                startWith(null),
                // Don't get notifications if user has logged out.
                filter((navigationEnd) => !navigationEnd || !navigationEnd.url.includes("login")),
                throttleTime(throttleResponse ? +throttleResponse : DEFAULT_THROTTLE_TIME),
                // do initial call(s) then repeat at every interval completion
                switchMap(() =>
                    timer(0, intervalResponse ? +intervalResponse : DEFAULT_INTERVAL_TIME).pipe(switchMap(() => this.getNotifications$)),
                ),
                takeUntil(this.userService.isAuthenticated$.pipe(filter((isAuthenticated) => !isAuthenticated))),
            ),
        ),
    );

    /**
     * Get notifications summary for all accounts associated with current user
     * and account specific notifications if one is selected.
     */
    getNotifications$: Observable<AbstractNotificationModel[]> = this.portal$.pipe(
        first(),
        switchMap((portal) =>
            iif(
                // if in MMP, global notifications DNE
                () => portal === Portal.MEMBER,
                this.getAccountNotifications$,
                // this.getGlobalNotifications$.pipe(
                //     // get account specific notifications if one is selected
                //     switchMap(() => this.getAccountNotifications$),
                // ),
                of(null),
            ),
        ),
    );

    /**
     * Get account notifications if group ID exists. Otherwise, return an empty array.
     */
    getAccountNotifications$ = this.mpGroupAccountService.mpGroupAccount$.pipe(
        first(),
        map((mpGroupAccount) => (mpGroupAccount ? mpGroupAccount.id : 0)),
        switchMap((mpGroupAccountID: number) => {
            // in MPP and account is selected || in MMP
            const groupID = mpGroupAccountID || this.store.selectSnapshot(UserState.getGroupID);
            // If groupID exists in either store location, call endpoint. Otherwise, return an empty array.
            return iif(
                () => !!groupID && !!this.memberId,
                this.notificationQueueService
                    .getMemberNotifications(groupID, this.memberId)
                    .pipe(tap((notifications) => (this.accountNotificationCount = this.getTotalNotificationCount(notifications)))),
                of([]),
            );
        }),
    );

    credential$ = this.userService.credential$.pipe(
        filter((credential) => JSON.stringify(credential) !== "{}"),
        take(1),
        tap((credential) => {
            // set IDs/names based on credential info
            if ("producerId" in credential) {
                this.producerId = credential.producerId;
                this.producerName = `${credential.name.firstName} ${credential.name.lastName}`;
                this.loggedInUserId = credential.producerId;
            }
            if ("adminId" in credential) {
                this.adminId = credential.adminId;
                this.loggedInUserId = credential.adminId;
            }
            if ("memberId" in credential) {
                this.memberId = credential.memberId;
                this.mpGroup = credential.groupId;
                if (this.portalMMP) {
                    this.getMemberType(credential.groupId, credential.memberId);
                }
            }
        }),
    );

    notificationsWSList$ = this.credential$.pipe(
        filter((credential) => !!this.loggedInUserId),
        switchMap(() => this.notificationQueueService.getProducerNotifications(this.loggedInUserId).pipe(catchError(() => of([])))),
        tap((globalNotifications) => {
            this.globalNotificationCount = this.getTotalNotificationCount(globalNotifications);
        }),
        takeUntil(this.notificationUnsubscribe$),
    );

    constructor(
        iconRegistry: MatIconRegistry,
        sanitizer: DomSanitizer,
        media: MediaMatcher,
        private readonly router: Router,
        private readonly csrfService: CsrfService,
        private readonly ri: RouteInterceptorService,
        private readonly sharedService: SharedService,
        private readonly route: ActivatedRoute,
        public userService: UserService,
        private readonly utilService: UtilService,
        private readonly memberService: MemberService,
        private readonly dialog: MatDialog,
        private readonly location: Location,
        private readonly overlay: Overlay,
        private readonly overlayPositionBuilder: OverlayPositionBuilder,
        private readonly elementref: ElementRef,
        private readonly notificationService: NotificationService,
        private readonly enrollmentService: EnrollmentService,
        public language: LanguageService,
        private readonly aflacService: AflacService,
        private readonly store: Store,
        private readonly accountService: AccountsService,
        private readonly staticService: StaticService,
        private readonly staticUtilService: StaticUtilService,
        private readonly breakpointUtilService: BreakPointUtilService,
        private readonly mpGroupAccountService: MPGroupAccountService,
        private readonly adminService: AdminService,
        private readonly modalService: EmpoweredModalService,
        private readonly notificationQueueService: NotificationQueueService, // private readonly reportsService: ReportsService,
    ) {
        this.logoMember = "assets/images/logo_MMP.png";
        this.colorMember = "#fff";
        this.logoPublic = "assets/images/logo.png";
        this.colorPublic = "#00abb9";
        this.nohamburgerMenuRoutes = ["support", "terms-conditions", "privacy-policy", "site-map", "consent-statement"];
        this.noHeaderNevRoutes = ["support", "terms-conditions", "privacy-policy", "consent-statement", "site-map", "shop"];
        this.shopRoutes = ["shop", "welcome", "myhousehold", "coverage"];
        this.supportPageRoute = ["support"];
        this.memberLogoRoutes = ["notificationPreferences", "change-password", "support"];
        this.subscriptions.push(
            this.staticUtilService.cacheConfigValue(ConfigName.MMP_LOGOUT_REDIRECT_LINK).subscribe((routeUrl) => {
                this.mmpRouteUrl = routeUrl;
            }),
        );
        /**
         * GLOBAL ICON REGISTRY
         *
         * Any SVG icons registered in the AppComponent will be available via the MatIcon directive in child components.
         *
         * @example Decorative Icon
         *    <mat-icon svgIcon="success" aria-hidden="true"></mat-icon>
         *
         * @see https://material.angular.io/components/icon/overview#accessibility
         */
        iconRegistry.addSvgIconSet(sanitizer.bypassSecurityTrustResourceUrl("assets/icons/core.svg"));

        this.mobileQuery = media.matchMedia("(max-width: 992px)");
        this.isAppFlow = false;
    }

    /**
     * Checks the credits of the user, enrollment status, and other configuration factors to display header accordingly.
     */
    ngOnInit(): void {
        this.subscriptions.push(
            ...[
                // open notification popup if invoked
                this.getNotificationStatus$,

                // set agent self enrollment flag
                this.sharedService
                    .checkAgentSelfEnrolled()
                    .pipe(tap((isAgentSelfEnrolled) => (this.isAgentSelfEnrolled = isAgentSelfEnrolled))),

                // set various header state variables
                this.getHeaderState$,

                // set admin TPA (mix up of TPI?) flag
                this.userService.credential$.pipe(tap((credentials: AdminCredential) => (this.tpaAdminUser = credentials.tpa))),

                // set pending enrollments flag
                this.enrollmentService.pendingEnrollments$.pipe(
                    tap((pendingEnrollments) => (this.pendingEnrollments = pendingEnrollments)),
                ),

                // begin notification polling
                this.notificationPoll$,

                // track window size to set mobile screen size flag
                this.breakpointUtilService.breakpointObserver$.pipe(
                    tap((breakpointData) => (this.mobileSize = breakpointData.size === "XS")),
                ),

                // get header title
                this.headerObject$.pipe(shareReplay(1)),
            ].map((observable) => (observable as Observable<unknown>).subscribe()),
        );
    }

    ngOnChanges(): void {
        this.getUserRole();
    }

    /**
     * Get API response to set the content for toast component
     */
    refreshAflacAgent(): void {
        if (this.producerId) {
            this.subscriptions.push(
                this.adminService
                    .getAdmin(this.producerId)
                    .pipe(
                        switchMap((adminData) => {
                            this.npn = adminData.npn;
                            return this.aflacService.refreshAgent().pipe(
                                // set toast details and open (either success or fail)
                                tap(() => {
                                    this.message = this.languageStrings["primary.portal.header.msgDataRefreshed"];
                                    this.toastType = ToastType.SUCCESS;
                                    this.openToast(this.message, this.toastType);
                                }),
                                catchError((errorResp) => {
                                    const partOne = [
                                        ServerErrorResponseCode.RESP_503 as number,
                                        ClientErrorResponseCode.RESP_404 as number,
                                    ].includes(errorResp.status as number)
                                        ? `${this.languageStrings["primary.portal.header.msgRefreshFailed"]} `
                                        : "";

                                    const partTwo = (
                                        this.languageStrings[
                                            errorResp.status === ClientErrorResponseCode.RESP_404
                                                ? "primary.portal.header.msgNpnNotFound"
                                                : "primary.portal.header.msgRetrieveFailed"
                                        ] as string
                                    ).replace("##npnNumber##", adminData.npn);

                                    this.message = partOne + partTwo;
                                    this.toastType = ToastType.DANGER;
                                    this.openToast(this.message, this.toastType);
                                    return of(errorResp);
                                }),
                            );
                        }),
                    )
                    .subscribe(),
            );
        }
    }

    /**
     * Initializes value for Toast Model and opens the toast component.
     * @param message content for toast component
     * @param type type of toast to display is set based on this value
     */
    openToast(message: string, type: ToastType): void {
        const toastData: ToastModel = {
            message: message,
            toastType: type,
            duration: TOAST_DURATION,
        };
        this.store.dispatch(new OpenToast(toastData));
    }

    /**
     * Get member info and set test employee flag accordingly.
     * @param groupId id of group (account)
     * @param memberId id of member
     */
    getMemberType(groupId: number, memberId: number): void {
        if (groupId && memberId) {
            this.subscriptions.push(
                this.memberService
                    .getMember(memberId, true, groupId.toString())
                    .pipe(tap((member) => (this.isTestEmployee = member.body.profile.test)))
                    .subscribe(),
            );
        }
    }

    /**
     * fetch the user role according to login
     */
    getUserRole(): void {
        this.notificationsWSList$.subscribe();
    }

    /**
     * Open self enrollment popup.
     */
    openSelfEnrollmentPopup(): void {
        this.modalService.openDialog(SelfEnrollmentPopupComponent).afterClosed();
    }

    /**
     * Routes to support page based on user role.
     */
    onSupportClick(): void {
        this.router.navigate([this.portal.type === this.portalTypeMember ? "member/support" : "producer/support/trainingResources"], {
            relativeTo: this.route,
        });
    }

    /**
     * Open notification popup.
     * @param $event an event triggered on click of notification icon
     */
    openDrawer($event: Event): void {
        $event.stopPropagation();
        if (this.producerId || this.adminId) {
            this.activeNotificationFlag = !this.activeNotificationFlag;
            this.notificationFlag.emit(this.activeNotificationFlag);
            this.utilService.hasNotificationTriggered(true);
            this.utilService.toggle();
        } else {
            this.dialog.open(MemberNotificationComponent, {
                width: "667px",
            });
        }
    }

    /**
     * Get destination based on user and navigate to it.
     */
    clickOnBranding(): void {
        let navigationDestination: string;
        if (this.currentRoute === "shop" && this.portal.type === "member") {
            navigationDestination = "member/home";
        } else if (this.portal.type === "producer") {
            navigationDestination = "/producer/payroll";
        } else if (this.portal.type === "admin" && this.currentRoute !== this.consentConst) {
            navigationDestination = this.tpaAdminUser ? "/admin/accountList" : "/admin/dashboard";
        }
        this.router.navigate([navigationDestination], {
            relativeTo: this.route,
        });
    }

    /**
     * Function invokes while clicking on logout link
     */
    logout = () => {
        // Closing all websocket connections on logout
        if (this.notificationQueueService.isWebSocketConnected()) {
            this.notificationQueueService.deactivate();
        }
        // if (this.reportsService.isWebSocketConnected()) {
        //     this.reportsService.deactivate();
        // }
        this.loggedInUserId = null;
        this.notificationUnsubscribe$.next();
        this.notificationUnsubscribe$.complete();
        if (this.portal.type !== this.portalTypeMember || this.store.selectSnapshot(UserState).authCode) {
            const portal: string = this.portal ? this.portal.type : "";
            this.router.navigate([`${portal}/login`]);
        } else if (this.isAgentSelfEnrolled) {
            this.router.navigate(["producer/login"]);
        } else {
            // if portal is member and login method is CIAM login then route to myAflac login screen on logout
            this.subscriptions.push(
                this.csrfService
                    .logOut()
                    .pipe(retry(API_RETRY))
                    .subscribe(() => {
                        window.location.href = this.mmpRouteUrl;
                    }),
            );
        }
    };
    publicLogoClicked(): void {
        if (this.currentRoute === "privacy-policy" && this.publicHeader) {
            this.location.back();
        }
    }
    memberLogoClicked(): void {
        this.router.navigate(["member/home"], {
            relativeTo: this.route,
        });
    }

    /**
     * Open notification popup in MMP/MAP.
     */
    openNotifications(): void {
        const bodyElement = document.querySelector("body");
        bodyElement.classList.add("negate-blur");
        const positionStrategy = this.overlayPositionBuilder.flexibleConnectedTo(this.elementref).withPositions([
            {
                originX: "end",
                originY: "top",
                overlayX: "end",
                overlayY: "top",
                offsetY: 70,
                offsetX: -265,
            },
        ]);

        const overlayConfig = new OverlayConfig({
            hasBackdrop: true,
            positionStrategy,
            scrollStrategy: this.overlay.scrollStrategies.block(),
            width: 380,
            maxHeight: 311,
            backdropClass: "expanded-card-view",
        });

        const popupComponentPortal = new ComponentPortal(MemberNotificationComponent);
        this.overlayRef = this.overlay.create(overlayConfig);
        this.overlayRef
            .backdropClick()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this.overlayRef.dispose();
                bodyElement.classList.remove("negate-blur");
            });

        this.overlayRef.attach(popupComponentPortal);
    }

    /**
     * Calculate sum of notifications.
     * @param notifications array of notifications (global or account)
     * @returns sum of notifications
     */
    getTotalNotificationCount(notifications: AbstractNotificationModel[]): number {
        return notifications.reduce((acc, val) => (acc += "count" in val ? val.count : 1), 0);
    }

    setBackURL(): void {
        this.sharedService.setBackUrl(this.router.url);
    }

    skipToMainContent(id: string): void {
        if (document.getElementById(id)) {
            document.getElementById(id).focus();
        }
    }

    /**
     * Unsubscribe from all subscriptions.
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
