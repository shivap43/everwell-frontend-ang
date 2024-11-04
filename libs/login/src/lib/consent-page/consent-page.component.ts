import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AuthenticationService, ActionRequired } from "@empowered/api";

import {
    SharedState,
    QueryParam,
    SetRouteAfterLogin,
    SetPermissions,
    SetURLNavigationAfterLogin,
    StaticUtilService,
} from "@empowered/ngxs-store";
import { UserPermissionList, Portals, ProducerCredential } from "@empowered/constants";
import { Store } from "@ngxs/store";
import { Subscription, combineLatest } from "rxjs";
import { LanguageService } from "@empowered/language";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { UserService } from "@empowered/user";

const PRODUCER_ID = "producerId";

@Component({
    selector: "empowered-consent-page",
    templateUrl: "./consent-page.component.html",
    styleUrls: ["./consent-page.component.scss"],
})
export class ConsentPageComponent implements OnInit, OnDestroy {
    urlNavigationAfterLogin: string;
    admin: boolean;
    producer: boolean;
    member: boolean;
    backRoute: string;
    subscriptions: Subscription[] = [];
    portal: string;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.back",
        "primary.portal.common.iAgree",
        "primary.portal.common.iAgreeAria",
        "primary.portal.login.consent.content",
    ]);
    consentContent: SafeHtml;
    userInfo: ProducerCredential;
    payrollPermission: boolean;
    directPermission: boolean;
    queryParams: QueryParam;
    constructor(
        private readonly auth: AuthenticationService,
        private readonly router: Router,
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly domSanitizer: DomSanitizer,
        private readonly userService: UserService,
        private readonly staticUtil: StaticUtilService,
    ) {}

    /**
     * Initializes required variables
     * @returns nothing
     */
    ngOnInit(): void {
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.queryParams = this.store.selectSnapshot(SharedState.getQueryParams);
        this.urlNavigationAfterLogin = this.store.selectSnapshot(SharedState.getURLNavigationAfterLogin);
        this.subscriptions.push(
            this.userService.credential$.subscribe((credential) => {
                if (PRODUCER_ID in credential) {
                    this.userInfo = credential;
                } else if (credential.actionRequired.includes(ActionRequired.multipleAccounts)) {
                    const SELECT_ACCOUNT_URL = "/member/login/select-account";
                    this.urlNavigationAfterLogin = SELECT_ACCOUNT_URL;
                    this.store.dispatch(new SetURLNavigationAfterLogin(SELECT_ACCOUNT_URL));
                } else if (credential.actionRequired.includes(ActionRequired.pendingEnrollments)) {
                    const PENDING_ENROLLMENTS_URL = "/member/review-enrollment";
                    this.urlNavigationAfterLogin = PENDING_ENROLLMENTS_URL;
                    this.store.dispatch(new SetURLNavigationAfterLogin(PENDING_ENROLLMENTS_URL));
                }
            }),
        );
        switch (this.portal) {
            case Portals.ADMIN:
                this.admin = true;
                this.backRoute = "/admin/login";
                break;
            case Portals.PRODUCER:
                this.producer = true;
                this.backRoute = "/producer/login";
                break;
            default:
                this.member = true;
                this.backRoute = "/member/login";
                break;
        }
        this.consentContent = this.domSanitizer.bypassSecurityTrustHtml(this.languageStrings["primary.portal.login.consent.content"]);
    }
    /**
     * Checking for permission of direct and payroll
     * @returns void
     */
    setPermissions(): void {
        if (this.userInfo && this.userInfo.producerId) {
            const routeAfterLogin = "/producer";
            let urlToNavigateAfterLogin;
            this.subscriptions.push(
                combineLatest([
                    this.staticUtil.hasPermission(UserPermissionList.PAYROLL),
                    this.staticUtil.hasPermission(UserPermissionList.DIRECT),
                ]).subscribe(([payroll, direct]) => {
                    // navigate on basis of permission either to payroll or direct.
                    if (payroll !== null && direct !== null) {
                        if (!payroll && direct) {
                            urlToNavigateAfterLogin = "/producer/direct";
                        } else {
                            urlToNavigateAfterLogin = "/producer/payroll";
                        }

                        if (routeAfterLogin && urlToNavigateAfterLogin) {
                            this.store.dispatch(new SetRouteAfterLogin(routeAfterLogin));
                            this.store.dispatch(new SetURLNavigationAfterLogin(urlToNavigateAfterLogin));
                        }
                        this.navigateAfterConsent(urlToNavigateAfterLogin);
                    }
                }),
            );
        } else if (this.urlNavigationAfterLogin !== undefined) {
            this.navigateAfterConsent(this.urlNavigationAfterLogin);
        }
    }
    acceptConsent(): void {
        this.subscriptions.push(
            this.auth.acceptConsent().subscribe((response) => {
                // setting all user permissions if he accepts the consent.
                this.store.dispatch(new SetPermissions(true));
                this.setPermissions();
            }),
        );
    }
    /**
     * Gets the URL to navigate after consent
     * @param urlToNavigateAfterLogin has URL after login
     * @returns void
     */
    navigateAfterConsent(urlToNavigateAfterLogin: string): void {
        if (this.queryParams && Object.keys(this.queryParams).length) {
            this.router.navigate([urlToNavigateAfterLogin], {
                replaceUrl: true,
                queryParams: this.queryParams,
            });
        } else {
            this.router.navigate([urlToNavigateAfterLogin], {
                replaceUrl: true,
            });
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
}
