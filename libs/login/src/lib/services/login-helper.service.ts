import { Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { AccountService, ActionRequired, EnrollmentService, LoginResponse, Resource } from "@empowered/api";

import {
    SharedState,
    QueryParam,
    SetRouteAfterLogin,
    SetQueryParams,
    SetPermissions,
    SetURLNavigationAfterLogin,
} from "@empowered/ngxs-store";
import { Dispatch } from "@ngxs-labs/dispatch-decorator";
import { Navigate } from "@ngxs/router-plugin";
import { Store } from "@ngxs/store";
import { of, Subscription } from "rxjs";
import { ResourceAcknowledgmentComponent } from "../acknowledgements/members/resource-acknowlegdement/resource-acknowlegdement.component";
import { BooleanConst, MEMBER_HOME_ROUTE, MEMBER_PORTAL, Portals, MemberCredential } from "@empowered/constants";
import { switchMap } from "rxjs/operators";
import { ResetState } from "@empowered/user/state/actions";

const SELECT_ACCOUNT_URL = "/member/login/select-account";
const CONSENT_URL = "/login/consent";
const PENDING_ENROLLMENTS_URL = "/member/review-enrollment";
const CONSENT = "consent";
const HOME = "home";
const LOGOUT = "logout";
const RETURN_URL = "returnUrl";
const SLASH_URL = "/";
const MAT_DIALOG_WIDTH = "667px";
const MEMBER_LOGIN = "/member/login";
const QUESTION_MARK = "?";
const EQUAL = "=";
const AMPERSAND = "&";

@Injectable({
    providedIn: "root",
})
export class LoginHelperService {
    portal: string;
    queryParams: QueryParam;
    url: string;
    returnUrl: string;
    subscriptions: Subscription[];
    constructor(
        private readonly store: Store,
        private readonly enrollmentService: EnrollmentService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly accountService: AccountService,
        private readonly dialog: MatDialog,
    ) {}

    /**
     * This method is used to route the user to the correct portal
     * @param user is containing login user details.
     * @param userCred contains login user credential details
     */
    routeAfterLogin(user: LoginResponse, userCred: MemberCredential): Subscription[] {
        this.portal = this.store.selectSnapshot(SharedState.portal);
        let routeAfterLogin = this.store.selectSnapshot(SharedState.routeAfterLogin);
        let urlToNavigateAfterLogin = this.store.selectSnapshot(SharedState.getURLNavigationAfterLogin);
        if (userCred.memberId && !userCred.adminId && this.portal !== Portals.MEMBER) {
            routeAfterLogin = MEMBER_PORTAL;
            urlToNavigateAfterLogin = MEMBER_HOME_ROUTE;
        } else if (
            userCred.memberId &&
            this.portal === Portals.MEMBER &&
            userCred.actionRequired.includes(ActionRequired.pendingEnrollments)
        ) {
            urlToNavigateAfterLogin = PENDING_ENROLLMENTS_URL;
            routeAfterLogin = MEMBER_PORTAL;
            this.queryParams = { memberId: userCred.memberId.toString(), groupId: userCred.groupId.toString() };
            this.store.dispatch(new SetQueryParams(this.queryParams));
            if (!userCred.actionRequired.includes(ActionRequired.consent)) {
                this.enrollmentService.pendingEnrollments$.next(true);
            }
        }
        if (routeAfterLogin && urlToNavigateAfterLogin) {
            this.store.dispatch(new SetRouteAfterLogin(routeAfterLogin));
            this.store.dispatch(new SetURLNavigationAfterLogin(urlToNavigateAfterLogin));
        }
        this.checkForReturnURL(user, userCred);
        return this.subscriptions;
    }

    /**
     * Based on the consent value from user details Navigation of page.
     * @param user is containing login user details.
     */
    checkForReturnURL(user: LoginResponse, userCred: MemberCredential): void {
        let consentUrl = null;
        this.returnUrl = this.route.snapshot.queryParams[RETURN_URL] || SLASH_URL;
        if (!userCred.consented) {
            this.url = this.store.selectSnapshot(SharedState.routeAfterLogin);
            consentUrl = CONSENT_URL;
        } else {
            this.url = this.store.selectSnapshot(SharedState.getURLNavigationAfterLogin);
        }
        if (this.url) {
            if (consentUrl !== null) {
                this.url += consentUrl;
            }
            const currPortalUrlArr = this.url.split(SLASH_URL);
            if (this.returnUrl !== SLASH_URL && this.returnUrl.startsWith(SLASH_URL + currPortalUrlArr[1])) {
                // now check if portal is similar in the url and logged in user then do redirect
                const queryParams: QueryParam = null;
                const returnUrlArray = this.returnUrl.split(QUESTION_MARK);
                this.url = returnUrlArray[0];
                if (returnUrlArray && returnUrlArray.length > 1) {
                    const params = returnUrlArray[1].split(AMPERSAND);
                    params.forEach((element) => {
                        const elementArray = element.split(EQUAL);
                        if (elementArray && elementArray.length === 2) {
                            queryParams[elementArray[0]] = elementArray[1];
                        }
                    });
                }
                this.queryParams = queryParams;
            }
            this.getResourceList(user, userCred);
        }
    }

    /**
     * Checks if there are resources that need to be approved/acknowledged by a member
     * @param user login response
     */
    getResourceList(user: LoginResponse, userCred: MemberCredential): void {
        if (user.actionRequired.includes(ActionRequired.consent)) {
            this.goToHome();
            return;
        }
        if (user.actionRequired.includes(ActionRequired.multipleAccounts) && (!userCred.adminId || this.portal === Portals.MEMBER)) {
            // If the user(member) has multiple accounts,
            // then route to select-accounts if:
            // 1. They are not an admin
            // 2. They are also an admin but the portal is MMP
            this.router.navigate([SELECT_ACCOUNT_URL], {
                relativeTo: this.route,
            });
            return;
        }
        if (
            (user.user as MemberCredential).memberId !== undefined &&
            user.actionRequired.includes(ActionRequired.resourceAcknowledgement)
        ) {
            let acknowledgeRequireResources: Resource[] = null;
            this.subscriptions.push(
                this.accountService
                    .getResources(BooleanConst.TRUE)
                    .pipe(
                        switchMap((resources) => {
                            acknowledgeRequireResources = resources;
                            if (acknowledgeRequireResources.length) {
                                const dialogRef = this.dialog.open(ResourceAcknowledgmentComponent, {
                                    width: MAT_DIALOG_WIDTH,
                                    data: {
                                        resourceAckNeeded: acknowledgeRequireResources,
                                    },
                                });
                                return dialogRef.afterClosed();
                            }
                            this.goToHome();
                            return of(null);
                        }),
                    )
                    .subscribe((result) => {
                        if (result === HOME) {
                            this.acknowledgeResources(acknowledgeRequireResources);
                        } else if (result === LOGOUT) {
                            this.onLogoutClick();
                        }
                    }),
            );
        } else {
            this.goToHome();
        }
    }

    /* Will navigate after checking resource acknowledge needed or not on login */
    goToHome(): void {
        if (this.queryParams && Object.keys(this.queryParams).length && !this.url.includes(CONSENT)) {
            this.router.navigate([this.url], { queryParams: this.queryParams });
        } else {
            this.router.navigate([this.url]);
        }
    }

    /* Will perform logout action */
    @Dispatch()
    onLogoutClick = () => [new Navigate([MEMBER_LOGIN]), new ResetState()];

    /* Will approve/acknowledge every Resource/s that needs to be approve/acknowledge */
    acknowledgeResources(resources: Resource[]): void {
        const resourcesToServer = resources.map((r) => r.id);
        this.subscriptions.push(
            this.accountService.acknowledgeResources({ resourceIds: resourcesToServer }).subscribe((res) => {
                this.store.dispatch(new SetPermissions(true));
                this.goToHome();
            }),
        );
    }
}
