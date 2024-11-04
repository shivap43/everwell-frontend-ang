import { Component, OnInit, ViewChild, HostListener, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { UserService } from "@empowered/user";
import { MediaMatcher } from "@angular/cdk/layout";
import { MatSidenav } from "@angular/material/sidenav";
import { Router } from "@angular/router";
import { Observable, BehaviorSubject, Subject } from "rxjs";
import { takeUntil, tap } from "rxjs/operators";
import { SharedService, RouteInterceptorService } from "@empowered/common-services";
import { CurrentRoute } from "./footer-nav.model";

@Component({
    selector: "empowered-footer-nav",
    templateUrl: "./footer-nav.component.html",
    styleUrls: ["./footer-nav.component.scss"],
})
export class FooterNavComponent implements OnInit, OnDestroy {
    @ViewChild("sideNav", { static: true }) sideNav: MatSidenav;
    isAuthenticated;
    mobileQuery: MediaQueryList;
    private readonly _mobileQueryListener: () => void;
    currentRoute = "";
    navLang;
    showToggle: string;
    mode: string;
    openSidenav: boolean;
    logoMember;
    colorMember;
    portal;
    private readonly screenWidth$ = new BehaviorSubject<number>(window.innerWidth);
    private readonly unsubscribe$: Subject<void> = new Subject();

    constructor(
        private readonly ri: RouteInterceptorService,
        media: MediaMatcher,
        public user: UserService,
        private readonly location: Location,
        private readonly router: Router,
        private readonly sharedService: SharedService,
    ) {
        this.sharedService.userPortal$
            .pipe(
                tap((portal) => {
                    this.portal = portal;
                }),
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe();
        if (this.portal.type === "member") {
            this.logoMember = "assets/images/logo_MMP.png";
            this.colorMember = "#fff";
        } else {
            this.logoMember = "assets/images/logo.png";
            this.colorMember = "#00abb9";
        }
        this.mobileQuery = media.matchMedia("(max-width: 992px)");
    }
    /**
     * Implements Angular OnInit Life Cycle hook
     * @returns void
     */
    ngOnInit(): void {
        this.setTitle(this.router.url.substring(this.router.url.lastIndexOf("/") + 1));

        this.ri.currentRoute$.pipe(takeUntil(this.unsubscribe$)).subscribe((route) => {
            this.currentRoute = route;
            if (
                this.currentRoute ===
                    (CurrentRoute.TERM_CONDITION ||
                        CurrentRoute.PRIVACY_POLICY ||
                        CurrentRoute.SITE_MAP ||
                        CurrentRoute.CONSENT_STATEMENT) &&
                !this.mobileQuery.matches
            ) {
                this.sideNav.opened = true;
            }

            this.setTitle(this.currentRoute);
        });
        this.user.isAuthenticated$.pipe(takeUntil(this.unsubscribe$)).subscribe((res) => {
            this.isAuthenticated = res;
        });

        this.getScreenWidth()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                if (this.mobileQuery.matches) {
                    this.sideNav.opened = false;
                } else {
                    this.sideNav.opened = true;
                }
            });
    }

    @HostListener("window:resize", ["$event"])
    onResize(event: Event & { target: { innerWidth: number } }) {
        this.screenWidth$.next(event.target.innerWidth);
        if (!this.mobileQuery.matches) {
            this.sideNav.opened = true;
        } else {
            this.sideNav.opened = false;
        }
    }

    getScreenWidth(): Observable<number> {
        return this.screenWidth$.asObservable();
    }
    /**
     * Function to set the title of the navigated page
     * @param title It's a string which will passed based on current route
     * @returns void
     */
    setTitle(title: string): void {
        this.currentRoute = title;
        const currentURL = title;
        if (currentURL === CurrentRoute.TERM_CONDITION) {
            this.navLang = "termsConditions";
        } else if (currentURL === CurrentRoute.PRIVACY_POLICY) {
            this.navLang = "privacyPolicy";
        } else if (currentURL === CurrentRoute.SITE_MAP) {
            this.navLang = "siteMap";
        } else if (currentURL === CurrentRoute.CONSENT_STATEMENT) {
            this.navLang = "consentStatement";
        }
    }

    backClick(): void {
        this.location.back();
    }

    menuItemClicked(): void {
        if (this.mobileQuery.matches) {
            this.sideNav.opened = false;
        }
    }

    /**
     * This method destroys all subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
