import { Component, OnInit, OnDestroy } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { Router, NavigationExtras } from "@angular/router";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { UserService } from "@empowered/user";
import { Subject, Observable, EMPTY, iif, of, defer, combineLatest } from "rxjs";
import { Store } from "@ngxs/store";
import { tap, takeUntil, catchError, switchMapTo, map, switchMap } from "rxjs/operators";

import { SharedState, SetRegex, SetPermissions, SetURLNavigationAfterLogin, StaticUtilService } from "@empowered/ngxs-store";
import { EmpoweredModalService } from "@empowered/common-services";
import { AuthenticationService, AssociatedAccount, ActionRequired, EnrollmentService, AccountService } from "@empowered/api";
import { ResourceAcknowledgmentComponent } from "../acknowledgements/members/resource-acknowlegdement/resource-acknowlegdement.component";
import { CsrfService } from "@empowered/util/csrf";
import { ConfigName, AppSettings, Credential } from "@empowered/constants";

const MEMBER_ID = "memberId";
const GROUP_ID = "groupId";
const SESSION_USER_INFO_KEY = "userInfo";
const HOME = "home";

enum ComponentRoutes {
    REGISTER_PERSONAL_INFO = "/member/register/personal-info",
    REGISTER_CONTACT_INFO = "/member/register/contact-info",
    REGISTER_DEPENDENTS = "/member/register/manage",
    REVIEW_ENROLLMENT = "/member/review-enrollment",
    // eslint-disable-next-line @typescript-eslint/no-shadow
    HOME = "/member/home",
    LOGIN = "/member/login",
}
interface RouteInfo {
    commands: string[];
    extras?: NavigationExtras;
}

@Component({
    selector: "empowered-select-account",
    templateUrl: "./select-account.component.html",
    styleUrls: ["./select-account.component.scss"],
})
export class SelectAccountComponent implements OnInit, OnDestroy {
    username: string;
    associatedAccounts$: Observable<AssociatedAccount[]>;
    form: FormGroup;
    userCred: Credential;
    languageStrings: Record<string, string>;
    apiError: string;
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    userData: Credential;

    constructor(
        private readonly language: LanguageService,
        private readonly authService: AuthenticationService,
        private readonly formBuilder: FormBuilder,
        private readonly userService: UserService,
        private readonly store: Store,
        private readonly router: Router,
        private readonly enrollmentService: EnrollmentService,
        private readonly accountService: AccountService,
        private readonly csrf: CsrfService,
        private readonly modal: EmpoweredModalService,
        private readonly staticUtil: StaticUtilService,
    ) {}

    /**
     * Gets language and associated accounts and initializes form
     * @returns nothing
     */
    ngOnInit(): void {
        this.getLanguages();
        this.store.dispatch(new SetRegex());
        this.userService.setUserCredential({});
        this.form = this.formBuilder.group({
            account: [null, Validators.required],
        });
        this.getAssociatedAccounts();
    }
    /**
     * Get the accounts associated with the logged-in user
     * @returns nothing
     */
    getAssociatedAccounts(): void {
        this.associatedAccounts$ = this.authService.getAssociatedAccounts().pipe(
            map((accounts) => this.sortAccounts(accounts)),
            catchError((error) => {
                this.apiError = this.language.fetchSecondaryLanguageValue(
                    `secondary.portal.login.getAssociatedAccounts.api.${error.error.status}.${error.error.code}`,
                );
                return EMPTY;
            }),
            // Select the first account by default
            tap((accounts) => this.form.controls.account.patchValue(accounts[0])),
        );
    }
    /**
     * Handles form submission
     * @returns nothing
     */
    onSubmit(): void {
        const portal = this.store.selectSnapshot(SharedState.portal);
        this.apiError = "";
        this.userData = JSON.parse(sessionStorage.getItem("userInfo"));
        if (this.form.valid) {
            iif(
                () => Boolean(this.userData.authCode),
                defer(() => this.authService.verifyTokenAndLogin(this.userData.authCode.toString(), this.form.value.account.groupId)),
                defer(() => this.authService.resume(this.form.value.account.groupId, true)),
            )
                .pipe(
                    // Set required variables
                    tap((user) => {
                        this.userCred = user.user;
                        this.userCred.authCode = this.userData.authCode;
                        this.userCred.actionRequired = user.actionRequired ? user.actionRequired : null;
                        sessionStorage.setItem("actionRequired", JSON.stringify(this.userCred.actionRequired));
                        sessionStorage.setItem(SESSION_USER_INFO_KEY, JSON.stringify(this.userCred));
                        this.store.dispatch(new SetURLNavigationAfterLogin(ComponentRoutes.HOME));
                        this.userService.setUserCredential(this.userCred);
                    }),
                    switchMapTo(this.csrf.load()),
                    // Get credential
                    switchMapTo(this.userService.credential$),
                    switchMap((user) =>
                        iif(
                            () => !!(user.actionRequired && user.actionRequired.length),
                            defer(() => this.handleRequiredActions(user)),
                            of({ commands: [ComponentRoutes.HOME] } as RouteInfo),
                        ),
                    ),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe(({ commands, extras }) => {
                    this.store.dispatch(new SetPermissions(true));
                    this.router.navigate(commands, extras);
                });
        }
    }
    /**
     * Handles required actions
     * @param user login response
     * @returns observable of an object containing the new route and navigation extras
     */
    handleRequiredActions(user: Credential): Observable<RouteInfo> {
        // User has enrollments pending
        if (user.actionRequired.includes(ActionRequired.pendingEnrollments)) {
            return of({
                commands: [ComponentRoutes.REVIEW_ENROLLMENT],
                extras: {
                    queryParams: { memberId: user[MEMBER_ID], groupId: user[GROUP_ID] },
                },
            }).pipe(tap(() => this.enrollmentService.pendingEnrollments$.next(true)));
        }
        if (user.actionRequired.includes(ActionRequired.resourceAcknowledgement)) {
            return this.getResourceList();
        }
        return of({ commands: [ComponentRoutes.HOME] });
    }
    /**
     * Get and acknowledge resources if any
     * @returns observable of an object containing the new route and navigation extras
     */
    getResourceList(): Observable<RouteInfo> {
        return this.accountService.getResources(AppSettings.TRUE.toLowerCase()).pipe(
            switchMap((resources) =>
                iif(
                    () => !!resources.length,
                    defer(() =>
                        this.modal
                            .openDialog(ResourceAcknowledgmentComponent, {
                                data: {
                                    resourceAckNeeded: resources,
                                },
                            })
                            .afterClosed()
                            .pipe(
                                switchMap((afterClosedResponse) =>
                                    iif(
                                        () => afterClosedResponse === HOME,
                                        this.accountService
                                            .acknowledgeResources({
                                                resourceIds: resources,
                                            })
                                            .pipe(switchMapTo(of({ commands: [ComponentRoutes.HOME] }))),
                                        of({ commands: [ComponentRoutes.LOGIN] }),
                                    ),
                                ),
                            ),
                    ),
                    of({ commands: [ComponentRoutes.HOME] }),
                ),
            ),
            takeUntil(this.unsubscribe$),
        );
    }

    /**
     * Go to home page
     * @returns nothing
     */
    goToHome(): void {
        this.router.navigate([this.store.selectSnapshot(SharedState.getURLNavigationAfterLogin)]);
    }

    /**
     * Sorts an array of associated accounts in ascending order of their names
     * @param accounts array of accounts a member is associated with
     * @returns sorted array of accounts
     */
    sortAccounts(accounts: AssociatedAccount[]): AssociatedAccount[] {
        return accounts.sort((first: AssociatedAccount, second: AssociatedAccount) => {
            const firstName = first.accountName.toUpperCase();
            const secondName = second.accountName.toUpperCase();
            if (firstName < secondName) {
                return -1;
            }
            if (firstName > secondName) {
                return 1;
            }
            return 0;
        });
    }

    /**
     * Gets language strings required for this component
     * @returns nothing
     */
    getLanguages(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.common.back",
            "primary.portal.common.loginToAccount",
            "primary.portal.multipleAccountLogin.selectAccount",
            "primary.portal.multipleAccountLogin.selectAccountDescription",
        ]);
    }

    /**
     * Cleans up subscriptions
     * @returns nothing
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
