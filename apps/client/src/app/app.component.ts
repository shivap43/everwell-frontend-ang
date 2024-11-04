import { Subscription, forkJoin, Observable, of, zip, interval, EMPTY, iif, NEVER, combineLatest, from, defer, Subject } from "rxjs";
import { MediaMatcher } from "@angular/cdk/layout";
import {
    Component,
    HostBinding,
    OnInit,
    ViewChild,
    ViewEncapsulation,
    OnDestroy,
    HostListener,
    ElementRef,
    Renderer2,
} from "@angular/core";
import { MatIconRegistry } from "@angular/material/icon";
import { MatSidenav } from "@angular/material/sidenav";
import { DomSanitizer } from "@angular/platform-browser";
import { UserService, UserState } from "@empowered/user";
import {
    tap,
    retry,
    map,
    filter,
    switchMap,
    withLatestFrom,
    distinctUntilChanged,
    timeoutWith,
    switchMapTo,
    catchError,
    first,
    concatMap,
    delay,
    takeUntil,
} from "rxjs/operators";
import { Select, Store } from "@ngxs/store";
import { CookieService } from "ngx-cookie-service";
import { Platform } from "@angular/cdk/platform";
import { EnrollmentService, StaticService, AuthenticationService } from "@empowered/api";
import { Idle, DEFAULT_INTERRUPTSOURCES } from "@ng-idle/core";
import { Keepalive } from "@ng-idle/keepalive";
import { Router, ActivatedRoute, NavigationEnd } from "@angular/router";
import {
    BreakpointSizes,
    PEGAConfig,
    PortalType,
    Permission,
    PortalState,
    Configurations,
    Credential,
    BooleanConst,
} from "@empowered/constants";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { AuthActions } from "@empowered/ngrx-store/ngrx-states/auth";
import { GuideMeService } from "@empowered/core";
import { TpiServices, LoadExternalJsService, SharedService, RouteInterceptorService } from "@empowered/common-services";
import { SharedState, FetchConfigs, BreakPointUtilService, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { NotificationPopupComponent } from "@empowered/ui";
import { NotificationQueueService } from "@empowered/util/websockets";

// Function declared in index.html
declare let walkMe: any;
/** displayLauncher, DOMContentLoadedHandler,initPegaConfig and pegaScript are external javascript function
 * defined in PegaHelper.js and PegaScript.js file So in order to access them in component we defined them as any */
declare let displayLauncher: any;

// DOMContentLoadedHandler is defined using external javascript, so we cannot rename property to match eslint naming convention
declare let DOMContentLoadedHandler: any; // eslint-disable-line @typescript-eslint/naming-convention
declare let initPegaConfig: any;
declare let pegaScript: any;
declare let displayChatButton: any;

const DISPLAY = "display";
const NONE = "none";
// File Constants
const CONFIG_SESSION_TIMEOUT = "general.session_timeout";
const DEFAULT_SESSION_TIMEOUT_MINUTES = 30;
const REQUEST_TIMEOUT_SECONDS = 5 * 1000;
const KEEPALIVE_INTERVAL_SECONDS = 5 * 1000 * 60;
const TIMEOUT_COUNTDOWN_SECONDS = 60;
const PING_RATE_INTERVAL_SECONDS = 15;
const APP_FLOW_ROUTE = 3;
const URL_SLASH = "/";
const TPI_ROUTE = "/tpi";
const EXTERNAL_ROUTE = "/paylogixconfirmation";
const ROUTER_STATE = "_routerState";
const ENVIRONMENT_CONFIG = "general.environment.name";
const ANALYTICS_ENVIRONMENTS = "general.feature.analytics.environments";

@Component({
    selector: "empowered-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
    providers: [NotificationPopupComponent],
    // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation
    encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements OnInit, OnDestroy {
    private readonly unsubscribe$ = new Subject<void>();

    @ViewChild("sideNav", { static: true }) sideNav: MatSidenav;
    @ViewChild("notificationNav", { static: true }) notificationNav: MatSidenav;
    @ViewChild(NotificationPopupComponent) notificationPopUp: NotificationPopupComponent;
    @HostBinding("class") classes = "app-root";

    mobileQuery: MediaQueryList;
    appSideNavOpened = false;
    notificationSideNavOpened = false;
    currentRoute = "";
    portal: PortalState;
    isAuthenticated = false;
    noSideNavRoutes: string[] = [];
    noSupportIconRoutes: string[] = [];
    logoMember: string;
    colorMember: string;
    isTouchDevice = false;
    subscriptions: Subscription[] = [];
    producerId: number;
    adminId: number;
    notificationFlag: boolean;
    pendingEnrollments = false;
    backdropToggle: boolean;
    @Select(UserState) credential$: Observable<Credential>;
    portalName: string;
    currentUrl: string;
    appFlowRoute: string;
    isTpiFlow = false;
    isExternalPage = false;
    isTpi = false;
    tpiLnlMode = false;
    chatWithUsRestrictPermission = true;

    /**
     * Config the NG-Idle with the timeout config, if config request fails, assume 30.
     */
    configureNgIdle$: Observable<unknown> = this.store.select(SharedState.getConfig(CONFIG_SESSION_TIMEOUT)).pipe(
        // Only emit the actual value, not the initial null
        filter((config) => !!config),
        // Get the value
        map((config) => config.value),
        // If the config is not fetched in time, use the default timeout
        timeoutWith(REQUEST_TIMEOUT_SECONDS, of(DEFAULT_SESSION_TIMEOUT_MINUTES)),
        // Only need the one emission, don't want more than one idle set up
        first(),
        // Got a timeout in minutes
        switchMap((timeoutValue) => {
            // Convert the timeout minutes to seconds, save for two minutes for the timeout count down
            this.idle.setIdle((Number(timeoutValue) - 2) * 60);
            this.idle.setTimeout(TIMEOUT_COUNTDOWN_SECONDS);
            this.idle.setInterrupts(DEFAULT_INTERRUPTSOURCES);
            // Ping rate for the keepalive
            this.keepalive.interval(PING_RATE_INTERVAL_SECONDS);

            // Combine the associated observables to be subscribed to
            return zip(this.onTimeout$, this.onIdleEnd$, this.authWatch$, this.keepAlive$);
        }),
    );

    /**
     * OnTimeout, the user needs to be logged out if they are logged into a portal that requires authentication
     */
    onTimeout$: Observable<[number, PortalState]> = this.idle.onTimeout.asObservable().pipe(
        // Get the logged in portal
        withLatestFrom(this.sharedService.userPortal$),
        // Don't fire on the public portal, it is unauthenticated and no need to logout
        filter(([, portal]) => portal.type !== "public"),
        // Send the user to the login page (which, consequentially, logs them out)
        tap(([, portal]) => {
            if (this.notificationQueueService.isWebSocketConnected()) {
                this.notificationQueueService.deactivate();
            }
            // if (this.reportsService.isWebSocketConnected()) {
            //     this.reportsService.deactivate();
            // }
            this.route.navigate([`${portal.type}/login`]);
            const launcherDocElementId = document.getElementById("launcher");
            if (launcherDocElementId) {
                try {
                    this.renderer.setStyle(launcherDocElementId, DISPLAY, NONE);
                } catch {}
                try {
                    this.renderer.setStyle(document.getElementById("OnlineHelp"), DISPLAY, NONE);
                } catch {}
                try {
                    this.renderer.setStyle(document.getElementById("launcherminimized"), DISPLAY, NONE);
                } catch {}
                try {
                    this.renderer.setStyle(document.getElementById("ProactiveChat"), DISPLAY, NONE);
                } catch {}
            }
        }),
    );

    /**
     * Whenever the idle ends, fire a keepAlive request just in case.
     */
    onIdleEnd$: Observable<unknown> = this.idle.onIdleEnd.asObservable().pipe(switchMap(() => this.auth.keepalive()));

    /**
     * Get authentication status of current user.
     */
    isUserAuthenticated$: Observable<boolean> = this.userService.isAuthenticated$.pipe(
        tap((isAuthenticatedResponse) => (this.isAuthenticated = isAuthenticatedResponse)),
        takeUntil(this.unsubscribe$),
    );

    /**
     * If the user logs in start the idle watch, otherwise stop watching (don't care if authenticated)
     */
    authWatch$: Observable<boolean> = this.isUserAuthenticated$.pipe(
        // Only fire if the user transitions from one state to another
        distinctUntilChanged(),
        tap((isAuthenticated) => {
            if (isAuthenticated) {
                // If the user is authenticated start the watch
                this.idle.watch();
            } else {
                // If the user is not authenticated, there is no session to timeout
                this.idle.stop();
            }
        }),
    );

    /**
     * Intermittently fire a keepalive request to the Java backend in order to keep the API session alive
     */
    keepAlive$: Observable<unknown> = this.isUserAuthenticated$.pipe(
        // If the user is authenticated...
        switchMap((isAuthenticated) =>
            iif(
                () => isAuthenticated === true,
                // ...Fire a keepalive request every interval, and swallow all the errors
                interval(KEEPALIVE_INTERVAL_SECONDS).pipe(switchMapTo(this.auth.keepalive().pipe(catchError(() => EMPTY)))),
                // ...Otherwise never emit
                NEVER,
            ),
        ),
    );

    /**
     * Use to get the Pega chat src url.
     */
    pegaChatConfig$: Observable<Configurations[]> = this.staticUtil.cacheConfigs([
        PEGAConfig.PEGA_CHAT_SRC_URL,
        PEGAConfig.PEGA_CHAT_PRODUCER_CONFIG,
        PEGAConfig.PEGA_CHAT_MEMBER_CONFIG,
        PEGAConfig.PEGA_CHAT_ADMIN_CONFIG,
    ]);

    constructor(
        public userService: UserService,
        iconRegistry: MatIconRegistry,
        sanitizer: DomSanitizer,
        media: MediaMatcher,
        private readonly routerInterceptor: RouteInterceptorService,
        private readonly enrollmentService: EnrollmentService,
        public platform: Platform,
        private readonly utilService: UtilService,
        private readonly cookieService: CookieService,
        private readonly staticService: StaticService,
        private readonly sharedService: SharedService,
        private readonly idle: Idle,
        private readonly keepalive: Keepalive,
        private readonly auth: AuthenticationService,
        private readonly host: ElementRef,
        private readonly route: Router,
        private readonly store: Store,
        private readonly activatedRoute: ActivatedRoute,
        private readonly breakPointUtilService: BreakPointUtilService,
        private readonly staticUtil: StaticUtilService,
        private readonly renderer: Renderer2,
        private readonly loadExternalJs: LoadExternalJsService,
        private readonly ngrxStore: NGRXStore,
        private readonly guideMeService: GuideMeService,
        private readonly tpiService: TpiServices,
        private readonly notificationQueueService: NotificationQueueService, // private readonly reportsService: ReportsService,
    ) {
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

        // Dispatch required actions
        this.store.dispatch(new FetchConfigs("general.session_timeout"));

        this.mobileQuery = media.matchMedia("(max-width: 992px)");
        this.logoMember = "assets/images/logo_MMP.png";
        this.colorMember = "#fff";
        this.noSideNavRoutes = [
            "support",
            "site-map",
            "shop",
            "login",
            "notificationPreferences",
            "welcome",
            "myhousehold",
            "coverage",
            "consent",
        ];
        this.noSupportIconRoutes = ["terms-conditions", "privacy-policy", "site-map"];
        // Enable chat bot based on permission
        this.subscriptions.push(
            this.staticUtil.hasPermission(Permission.CHAT_WITH_US_RESTRICT_READ_CHAT).subscribe((restrictPermission) => {
                this.chatWithUsRestrictPermission = !restrictPermission;
            }),
        );

        // Configure the session timeout observables
        this.subscriptions.push(this.configureNgIdle$.subscribe());
    }

    /**
     * Initializing all variables and validating route, touch device and validating safari browser,
     * listening for path parameters, validating environment configuration,
     * Observable fires off every time when notification nav is opened and applies focus to the nav items for accessibility and
     * WalkMe if feature is enabled. Per partner, per environment configuration for source is available.
     */
    ngOnInit(): void {
        this.subscriptions.push(
            this.sharedService.currentTpi$.subscribe((isTpi) => {
                this.isTpi = isTpi;
                if (isTpi) {
                    this.tpiLnlMode = this.tpiService.isLinkAndLaunchMode();
                }
            }),
        );
        this.backdropToggle = this.mobileQuery.matches;
        this.enrollmentService.pendingEnrollments$.pipe(takeUntil(this.unsubscribe$)).subscribe((isEnrollmentPending) => {
            this.pendingEnrollments = isEnrollmentPending;
            if (this.pendingEnrollments) {
                this.sideNav.opened = false;
            }
        });
        this.subscriptions.push(this.isUserAuthenticated$.subscribe());

        this.route.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                map((event) => event as NavigationEnd),
                withLatestFrom(this.sharedService.userPortal$, this.pegaChatConfig$),
                tap(([navEnd, userPortal, pegaChatConfig]) => {
                    const isChatWithUsEnabled = this.isPegaChatConfigEnable(userPortal.type, pegaChatConfig);
                    const isLoginRoute = navEnd.url.includes("/login");
                    displayChatButton(userPortal.type);
                    // Hide Chat with us button when feature flag is turn off, user has restriction and on login page.
                    if (isLoginRoute || !this.chatWithUsRestrictPermission || isChatWithUsEnabled.toLowerCase() === BooleanConst.FALSE) {
                        this.renderer.setStyle(document.getElementById("launcherminimized"), DISPLAY, NONE);
                    } else {
                        this.renderer.setStyle(document.getElementById("launcherminimized"), DISPLAY, "block");
                    }
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        this.sharedService.userPortal$
            .pipe(
                tap((portal) => (portal.type ? (this.classes = `app-root ${portal.type}-portal`) : null)),
                /* Open sideNav by default when user loads MPP in desktop */
                tap((portal) => {
                    this.portal = portal;
                    this.portalName = portal["type"];
                    if (this.portal.type === "member" && !this.mobileQuery.matches) {
                        this.sideNav.opened = true;
                    } else {
                        this.sideNav.opened = false;
                    }
                }),
                switchMap(() => this.credential$),
                map((credential) => Object.entries(credential).length !== 0),
                filter((isAuthenticated) => isAuthenticated),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        // if (this.chatWithUsRestrictPermission) {
        //     this.setUpPega().subscribe();
        // }

        this.listenToCurrentRoute();
        this.checkForTouchDevice();
        this.getUserRole();
        this.checkIfSafari();

        /**
         * Observables used application wide that need to be subscribed to
         */
        // On application load, start listening for path parameters
        this.subscriptions.push(this.routerInterceptor.routerStateParams$.subscribe());

        // Get the config variables for google analytics, and then log a tracking event for each navigations
        this.subscriptions.push(
            forkJoin(
                this.staticService.getConfigurations(ENVIRONMENT_CONFIG).pipe(
                    retry(3),
                    first(),
                    map((environmentConfigs: Configurations[]) => {
                        if (environmentConfigs && environmentConfigs.length > 0) {
                            return environmentConfigs.find((config) => config.name === ENVIRONMENT_CONFIG);
                        }
                        return undefined;
                    }),
                ),
                this.staticService.getConfigurations(ANALYTICS_ENVIRONMENTS).pipe(
                    retry(3),
                    first(),
                    map((environmentConfigs) => {
                        if (environmentConfigs && environmentConfigs.length > 0) {
                            return environmentConfigs.find((config) => config.name === ANALYTICS_ENVIRONMENTS).value.split(",");
                        }
                        return [];
                    }),
                ),
            )
                .pipe(
                    filter(([currentEnvironment, analyticsEnvironments]) => {
                        if (currentEnvironment && currentEnvironment.value) {
                            return analyticsEnvironments.indexOf(currentEnvironment.value) !== -1;
                        }
                        return false;
                    }),
                    tap(() => this.routerInterceptor.trackCurrentRoute()),
                    switchMap(() => this.routerInterceptor.googleAnalyticsNavigationEnd$),
                )
                .subscribe(),
        );
        this.utilService.setSidenav(this.notificationNav);
        // Observable fires off every time the notification nav is opened and applies focus to the nav items for accessibility.
        this.notificationNav.openedChange
            .pipe(
                filter((isOpened) => isOpened),
                tap(() => this.notificationPopUp.applyFocus()),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        // On application load, add walkMe if feature is enabled. Per partner, per environment configuration for source is available.
        /* TODO - Cookie logic revisit */
        const cookiePartnerId: string = this.cookieService.get("partnerId");
        this.subscriptions.push(
            this.staticService
                .getConfigurations("member.feature.walkMe.*", undefined, cookiePartnerId)
                .pipe(
                    retry(3),
                    tap((configs) => {
                        if (configs) {
                            const featureEnabled: Configurations = configs.find(
                                (config) => config.name === "member.feature.walkMe.enabled",
                            );
                            const walkMeSrc: Configurations = configs.find((config) => config.name === "member.feature.walkMe.src");

                            if (featureEnabled && featureEnabled.value.toLowerCase() === "true") {
                                walkMe(walkMeSrc.value);
                            }
                        }
                    }),
                )
                .subscribe(),
        );

        // Log the page on navigation end
        this.subscriptions.push(this.routerInterceptor.pageLog$.subscribe());

        // Checks whether the GuideMe player is already displayed on the page
        if (this.isAuthenticated && !document.getElementById("mgPlayerJSProd_btn-start-button")) {
            this.auth
                .getMyGuideToken()
                .pipe(
                    tap((token) => {
                        this.guideMeService.embedGuideMePlayer(token, this.renderer);
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
        }

        // This is required for trying to access the old and new producer shop
        this.credential$
            .pipe(
                tap((credential) => {
                    // sync NGRX Credentials using NGXS state
                    if (!Object.keys(credential ?? {}).length) {
                        this.ngrxStore.dispatch(AuthActions.logout());
                    } else {
                        this.ngrxStore.dispatch(AuthActions.loginSuccess({ user: credential }));
                    }
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        // to check the page transition and if the page is loaded from cache
        window.addEventListener("pageshow", this.checkIfPageLoadedFromCache);
    }

    isPegaChatConfigEnable(portal, configValues: Configurations[]): string {
        if (portal.toUpperCase() === PortalType.PRODUCER) {
            return configValues[1].value;
        }
        if (portal.toUpperCase() === PortalType.MEMBER) {
            return configValues[2].value;
        }
        if (portal.toUpperCase() === PortalType.ADMIN) {
            return configValues[3].value;
        }
        return "false";
    }

    /**
     * This function is used to route to the member home page on logo click in member portal
     */
    memberLogoClicked(): void {
        this.route.navigate(["member/home"], {
            relativeTo: this.activatedRoute,
        });
    }

    /**
     * This function checks for current route and based on routes and screen size will open/close side nav.
     * Also now closes nav when a new nav item is selected.
     */
    listenToCurrentRoute(): void {
        this.route.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                map((event) => event as NavigationEnd),
                tap((navEnd) => {
                    this.isTpiFlow = this.activatedRoute.snapshot[ROUTER_STATE].url.includes(TPI_ROUTE);
                    this.isExternalPage = this.activatedRoute.snapshot[ROUTER_STATE].url.includes(EXTERNAL_ROUTE);
                    this.currentRoute = navEnd.url.substring(navEnd.url.lastIndexOf(URL_SLASH) + 1);
                    this.currentUrl = navEnd.url;
                    this.appFlowRoute = this.currentUrl.split(URL_SLASH)[APP_FLOW_ROUTE];
                }),
                switchMap(() => this.breakPointUtilService.breakpointObserver$),
                filter((breakpoint) => this.portal.type.toUpperCase() === PortalType.MEMBER && breakpoint.size !== BreakpointSizes.MD),
                tap((breakpoint) => {
                    const noSideNavRoutes =
                        this.noSideNavRoutes.includes(this.currentRoute) || this.noSideNavRoutes.includes(this.appFlowRoute);
                    const closeSideNav =
                        this.pendingEnrollments ||
                        noSideNavRoutes ||
                        breakpoint.size === BreakpointSizes.XS ||
                        breakpoint.size === BreakpointSizes.SM;
                    this.sideNav.opened = !closeSideNav;
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Get user credential info updates from the store and set the appropriate id accordingly.
     */
    getUserRole(): void {
        this.subscriptions.push(
            this.userService.credential$.subscribe((credential) => {
                if ("producerId" in credential) {
                    this.producerId = credential.producerId;
                }
                if ("adminId" in credential) {
                    this.adminId = credential.adminId;
                }
            }),
        );
    }

    /**
     * Set flag to indicate whether notification window is open in MPP/MAP.
     * @param event value to set flag
     */
    setNotificationFlag(event: boolean): void {
        this.notificationFlag = event;
    }

    checkForTouchDevice(): void {
        const isTouchDevice = "ontouchstart" in document.documentElement;
        const touchClass = isTouchDevice ? "is-touch" : "no-touch";
        const bodyElement = document.querySelector("body");
        bodyElement.classList.add(touchClass);
    }

    checkIfSafari(): void {
        const isSafari = this.platform.SAFARI;
        const safariClass = isSafari ? "safari" : "";
        const bodyElement = document.querySelector("body");
        if (isSafari) {
            bodyElement.classList.add(safariClass);
        }
    }

    @HostListener("window:scroll", ["$event"])
    onWindowScroll(): void {
        // In chrome and some browser scroll is given to body tag
        const pos = (document.documentElement.scrollTop || document.body.scrollTop) + document.documentElement.offsetHeight;
        const max = document.documentElement.scrollHeight;
        const footerHeight = this.host.nativeElement.getElementsByClassName("primary-footer").length
            ? this.host.nativeElement.getElementsByClassName("primary-footer")[0].offsetHeight
            : 0;
        // pos/max will give you the distance between scroll bottom and and bottom of screen in percentage.
        const appBody = this.host.nativeElement;
        if (Math.round(pos) > Math.round(max) - footerHeight) {
            if (!appBody.classList.contains("is-footer-fixed")) {
                appBody.classList.add("is-footer-fixed");
            }
        } else if (appBody && appBody.classList.contains("is-footer-fixed")) {
            appBody.classList.remove("is-footer-fixed");
        }
    }
    isMemberApplicationFlow(): boolean {
        const x = this.route.url.indexOf("wizard/enrollment/app-flow") !== -1;
        return x;
    }
    /**
     * @description Detect click outside of notification component and close notification popup
     */
    notificationClick(): void {
        this.notificationNav.close();
    }

    /**
     * Used to collect PEGA configs and initialize the feature
     * @returns observable of configs for PEGA
     */
    checkPegaChatConfig(): Observable<unknown[]> {
        return combineLatest([
            this.staticUtil.cacheConfigValue(PEGAConfig.PEGA_CHAT_CSS_SELF_SERVICE_NBA_URL),
            this.staticUtil.cacheConfigValue(PEGAConfig.PEGA_CHAT_AFLAC_SELF_SERVICE_URL),
            this.staticUtil.cacheConfigValue(PEGAConfig.PEGA_CHAT_CO_BROWSE_TOKEN),
            this.staticUtil.cacheConfigValue(PEGAConfig.PEGA_CHAT_CO_BROWSE_SERVER_HOST_URL),
        ]).pipe(
            tap(([cssSelfServiceNba, aflacSelfService, coBrowseToken, serverHostUrl]) => {
                initPegaConfig(aflacSelfService, cssSelfServiceNba, coBrowseToken, serverHostUrl);
                DOMContentLoadedHandler();
                displayLauncher();
                pegaScript();
            }),
        );
    }

    /**
     * Download and load the PEGA script per the config, and then hide / show the chat options based on what portal is active.
     * @returns an observable that loads and monitors the state of the PEGA scripts and if the chat feature should be shown or not
     */
    /* setUpPega(): Observable<[string, unknown]> {
        return combineLatest([
            // Current Portal
            this.sharedService.userPortal$.pipe(
                map((portal) => portal.type.toUpperCase()),
                distinctUntilChanged(),
            ),
            // Load Pega script post login for Producers and Members based on configs
            this.initializePegaScripts(),
        ]).pipe(
            switchMap(([portal]) =>
                iif(
                    () => portal === "PUBLIC" || !this.chatWithUsRestrictPermission,
                    defer(() => of(undefined).pipe(tap(() => this.hidePegaFeature()))),
                    defer(() =>
                        this.staticUtil
                            .cacheConfigEnabled(
                                portal === PortalType.PRODUCER ? PEGAConfig.PEGA_CHAT_PRODUCER_CONFIG : PEGAConfig.PEGA_CHAT_MEMBER_CONFIG,
                            )
                            .pipe(
                                filter(
                                    (isEnabled) =>
                                        isEnabled &&
                                        (portal === PortalType.MEMBER || portal === PortalType.PRODUCER) &&
                                        this.chatWithUsRestrictPermission,
                                ),
                                tap(() => this.showPegaFeature()),
                            ),
                    ),
                ),
            ),
            takeUntil(this.unsubscribe$.asObservable()),
        );
    } */

    /**
     * Load the PEGA scripts per the configs
     * @returns an observable to pull down the PEGA scripts and load them into the DOM
     */
    // initializePegaScripts(): Observable<unknown> {
    //     return this.sharedService.userPortal$.pipe(
    //         map((portal) => portal.type.toUpperCase()),
    //         distinctUntilChanged(),
    //         filter((portal) => portal === PortalType.PRODUCER || portal === PortalType.MEMBER),
    //         switchMap(() =>
    //             this.staticUtil.cacheConfigEnabled(
    //                 PortalType.PRODUCER ? PEGAConfig.PEGA_CHAT_PRODUCER_CONFIG : PEGAConfig.PEGA_CHAT_MEMBER_CONFIG,
    //             ),
    //         ),
    //         filter((isConfigEnabled) => isConfigEnabled),
    //         switchMap(() => this.staticUtil.cacheConfigValue(PEGAConfig.PEGA_MASHUP_LOCATION)),
    //         concatMap((mashupLocation) =>
    //             from(
    //                 new Promise((resolve) => {
    //                     this.loadExternalJs.loadScript(mashupLocation);
    //                     resolve(true);
    //                 }),
    //             ),
    //         ),
    //         switchMap(() => this.staticUtil.cacheConfigValue(PEGAConfig.PEGA_CHAT_MASHUP_SCRIPT_DELAY)),
    //         switchMap((delayAmountFromConfig) => of(undefined).pipe(delay(Number(delayAmountFromConfig)))),
    //         switchMap(() => this.checkPegaChatConfig()),
    //         first(),
    //     );
    // }

    /**
     * Hide all of the PEGA related features
     */
    hidePegaFeature(): void {
        const launcherDocElementId = document.getElementById("launcher");

        try {
            this.renderer.setStyle(launcherDocElementId, DISPLAY, NONE);
        } catch {}
        try {
            this.renderer.setStyle(document.getElementById("OnlineHelp"), DISPLAY, NONE);
        } catch {}
        try {
            this.renderer.setStyle(document.getElementById("launcherminimized"), DISPLAY, NONE);
        } catch {}
        try {
            this.renderer.setStyle(document.getElementById("ProactiveChat"), DISPLAY, NONE);
        } catch {}
    }

    /**
     * Show the PEGA feature once all the scripts have been loaded
     */
    showPegaFeature(): void {
        try {
            this.renderer.setStyle(document.getElementById("launcher"), DISPLAY, "");
        } catch {}
        try {
            this.renderer.setStyle(document.getElementById("OnlineHelp"), DISPLAY, "");
        } catch {}
        try {
            this.renderer.setStyle(document.getElementById("launcherminimized"), DISPLAY, "");
        } catch {}
    }

    /**
     *
     * @param event contains details about page transition
     * @description to reload the page if the page is loaded from cache so that authentication
     * guards will be executed.
     */
    checkIfPageLoadedFromCache(event: PageTransitionEvent): void {
        // persisted property indicates that the page is loaded from cache
        if (event.persisted) {
            window.location.reload();
        }
    }
    /**
     * Unsubscribe on destroy
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subs) => subs.unsubscribe());
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
        window.removeEventListener("pageshow", this.checkIfPageLoadedFromCache);
    }
}
