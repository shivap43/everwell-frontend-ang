import { takeUntil } from "rxjs/operators";
import { MatSidenav } from "@angular/material/sidenav";
import { LanguageService } from "@empowered/language";
import { RouteInterceptorService } from "@empowered/common-services";
import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { Router } from "@angular/router";
import { Subject } from "rxjs";

const PRIVACY_POLICY = "privacy-policy";
const TERM_CONDITION = "terms-conditions";
const CONSENT_STATEMENT = "consent-statement";
const BACK_SLASH = "/";
const DIGIT_ONE = 1;

@Component({
    selector: "empowered-footer-nav",
    templateUrl: "./footer-nav.component.html",
    styleUrls: ["./footer-nav.component.scss"],
})
export class FooterNavComponent implements OnInit, OnDestroy {
    @ViewChild("sideNav", { static: true }) sideNav: MatSidenav;
    currentRoute: string;
    title: string;
    languageStrings: Record<string, string>;
    private readonly unsubscribe$: Subject<void> = new Subject();

    constructor(
        private readonly location: Location,
        private readonly router: Router,
        private readonly language: LanguageService,
        private readonly routeInterceptor: RouteInterceptorService,
    ) {}

    /**
     * Implements Angular OnInit Life Cycle hook
     * @returns void
     */
    ngOnInit(): void {
        this.sideNav.opened = true;
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.footer.title",
            "primary.portal.common.back",
            "primary.portal.termsConditions.title",
            "primary.portal.privacyPolicy.title",
            "primary.portal.consentStatement.title",
        ]);
        this.setTitle(this.router.url.substring(this.router.url.lastIndexOf(BACK_SLASH) + DIGIT_ONE));
        this.routeInterceptor.currentRoute$.pipe(takeUntil(this.unsubscribe$)).subscribe((route) => {
            this.currentRoute = route;
            this.setTitle(this.currentRoute);
        });
    }
    /**
     * Function to set the title of the navigated page
     * @param title Its a string which will passed based on current route
     * @returns void It returns nothing
     */
    setTitle(title: string): void {
        this.currentRoute = title;
        if (title === TERM_CONDITION) {
            this.title = this.languageStrings["primary.portal.termsConditions.title"];
        } else if (title === PRIVACY_POLICY) {
            this.title = this.languageStrings["primary.portal.privacyPolicy.title"];
        } else if (title === CONSENT_STATEMENT) {
            this.title = this.languageStrings["primary.portal.consentStatement.title"];
        }
    }

    /**
     * Function to handle back click from side nav bar
     * @returns void
     */
    backClick(): void {
        this.location.back();
    }

    /**
     * Implements Angular OnDestroy Life Cycle hook
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
