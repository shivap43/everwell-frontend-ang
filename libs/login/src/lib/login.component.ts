import {
    ClientErrorResponseCode,
    ClientErrorResponseType,
    SuccessResponseCode,
    UserPermissionList,
    AppSettings,
    Portals,
} from "@empowered/constants";
import { HttpErrorResponse } from "@angular/common/http";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormControl, FormGroup, Validators, FormBuilder, ValidationErrors } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import {
    AccountListService,
    AuthenticationService,
    AccountService,
    ActionRequired,
    EnrollmentService,
    StaticService,
    LoginResponse,
    CommonService,
    AflacService,
} from "@empowered/api";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { UserService } from "@empowered/user";
import { RegexForFieldValidation } from "@empowered/ui";
import { Store } from "@ngxs/store";
import { Subscription, Subject, combineLatest, Observable, EMPTY, of } from "rxjs";
import { MatDialog } from "@angular/material/dialog";
import { ResourceAcknowledgmentComponent } from "./acknowledgements/members/resource-acknowlegdement/resource-acknowlegdement.component";
import { Dispatch } from "@ngxs-labs/dispatch-decorator";
import { Navigate } from "@ngxs/router-plugin";
import { CsrfService } from "@empowered/util/csrf";
import { retry, switchMap, takeUntil, take, filter, tap, map, catchError } from "rxjs/operators";
import { CookieService } from "ngx-cookie-service";
import { Title } from "@angular/platform-browser";

import {
    CheckForm,
    AddAccountList,
    AddGroup,
    SharedState,
    SetPortal,
    SetRouteAfterLogin,
    SetQueryParams,
    SetPermissions,
    SetURLNavigationAfterLogin,
    StaticUtilService,
} from "@empowered/ngxs-store";
import { ResetState } from "@empowered/user/state/actions";
import { SharedService } from "@empowered/common-services";

const USER_LOGIN_NOT_ALLOWED = "User login not allowed.";
const PARSE_INT_VALUE = 0;
const USER_NAME_REGEX = "portal.validation.member_profile_username";
const RETRY_COUNT = 3;
const USERNAME = "username";
const PASSWORD = "password";
export enum UrlAfterLogin {
    ACCOUNT_LIST = "/admin/accountList",
    MEMBER_HOME = "/member/home",
    PRODUCER_OVERVIEW = "/producer/overview",
}
export enum RouteAfterLogin {
    ADMIN = "/admin",
    MEMBER = "/member",
    PRODUCER = "/producer",
}

@Component({
    selector: "empowered-login",
    templateUrl: "./login.component.html",
    styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit, OnDestroy {
    validationRegex: string;
    canLogin = true;
    loginLanguages: any = [];
    url: string;
    loginForm: FormGroup;
    partnerId: string;
    inValidCredentials = false;
    isUsernameValid = true;
    isPasswordValid = true;
    errorMessage: string;
    notAuthorized = false;
    notAuthorizedErrorMessage: string;
    showAlert = false;
    userNameMinLength: number;
    userNameMaxLength: number;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.login.username",
        "primary.portal.login.password",
        "primary.portal.login.login",
        "primary.portal.login.textPassword",
        "primary.portal.login.textUsername",
        "primary.portal.login.register",
        "primary.portal.login.textPassword",
        "primary.portal.login.textForgot",
        "primary.portal.login.textOr",
        "primary.portal.login.usernameInfo",
        "primary.portal.appTitle",
    ]);
    cred: any;
    returnUrl: string;
    queryParams: any;
    adminAccountListEnabled = false;
    portal: string;
    loader = true;
    userCred: any;
    readonly formName = "login-form";
    private unsubscribe$ = new Subject<void>();
    payrollPermission: boolean;
    directPermission: boolean;
    readonly PREREQUISITE_FAILED: "prerequisiteFailed";
    loginClicked = false;
    selfService = false;
    token: string;
    usernamePasswordErrorMessage: string;
    readonly AFLAC_LOGIN_REDIRECT = "/api/oauth2/authorization/aflac";
    constructor(
        private readonly csrfService: CsrfService,
        private readonly store: Store,
        private readonly fb: FormBuilder,
        private readonly router: Router,
        private readonly auth: AuthenticationService,
        private readonly user: UserService,
        private readonly language: LanguageService,
        private readonly accountService: AccountService,
        private readonly accountListService: AccountListService,
        private readonly enrollmentService: EnrollmentService,
        private readonly dialog: MatDialog,
        private readonly route: ActivatedRoute,
        private readonly staticService: StaticService,
        private readonly staticUtil: StaticUtilService,
        private readonly cookieService: CookieService,
        private readonly commonService: CommonService,
        private readonly titleService: Title,
        private readonly sharedService: SharedService,
        private readonly aflacService: AflacService,
    ) {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.*"));
    }

    /**
     * ngOnInit function is one of an Angular component's life-cycle methods
     * This function is used to initialize all the values and function at the time of component loading.
     */
    ngOnInit(): void {
        this.initializedLoginForm();
        this.getUserNameLengthConfig()
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((res) => this.staticService.getRegex(USER_NAME_REGEX)),
                filter((data) => data !== undefined && data !== null && data.length > 0),
                map((data) => data[0].value),
            )
            .subscribe((data: string) => {
                this.validationRegex = data;
            });

        this.titleService.setTitle(this.languageStrings["primary.portal.appTitle"]);
        /* TODO - Cookie logic revisit */
        this.partnerId = this.cookieService.get("partnerId");
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.selfService = this.isSelfService();
        this.getCsrfToken();
        if (!this.selfService) {
            this.initializedLoginForm();
            this.getUserNameLengthConfig()
                .pipe(
                    switchMap((res) => this.staticService.getRegex(USER_NAME_REGEX)),
                    filter((data) => data?.length > 0),
                    map((data) => data[0].value),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe((data: string) => {
                    this.validationRegex = data;
                });
            this.getUserNameLengthConfig();
        } else {
            this.loader = false;
        }
        this.getUserNameLengthConfig();

        this.enrollmentService.pendingEnrollments$.next(false);

        this.staticService
            .getConfigurations("portal.admin.account_list.enabled")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((configs) => {
                this.adminAccountListEnabled = configs.length && configs[0].value.toLowerCase() === "true";
            });
        this.returnUrl = this.route.snapshot.queryParams["returnUrl"] || "/";

        // To show alert on incomplete registration form
        this.showAlert = this.store.selectSnapshot(SharedState.showAlert);
        // doing this here instead of the constructor because
        // it only needs to be called once upon initialization
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.*"));
    }
    /**
     *This function is used for initializing login form
     */
    initializedLoginForm(): void {
        this.loginForm = this.fb.group({
            username: this.fb.control("", [Validators.required, this.checkUsername.bind(this)]),
            // FIX ME: Uncomment below line and delete next line in production environment
            // password: this.fb.control("", [Validators.required, this.checkPassword.bind(this)])
            password: this.fb.control("", Validators.required),
        });
    }

    /**
     * This function is used to get the min and max lengths for username field from config.
     * @returns observable of an array of min and max username lengths ([min, max])
     */
    getUserNameLengthConfig(): Observable<string[]> {
        return combineLatest([
            this.staticUtil.cacheConfigValue("general.data.username.length.minimum"),
            this.staticUtil.cacheConfigValue("general.data.username.length.maximum"),
        ]).pipe(
            takeUntil(this.unsubscribe$),
            tap(([minValue, maxValue]) => {
                this.userNameMinLength = parseInt(minValue, PARSE_INT_VALUE);
                this.userNameMaxLength = parseInt(maxValue, PARSE_INT_VALUE);
                this.loginForm.controls.username.setValidators([
                    Validators.minLength(this.userNameMinLength),
                    Validators.maxLength(this.userNameMaxLength),
                    this.loginForm.controls.username.validator,
                ]);
            }),
        );
    }
    /**
     * This function is used to validate user name
     * @param control user name form control
     * @returns ValidationErrors
     */
    checkUsername(control: FormControl): ValidationErrors {
        const enteredUsername: string = control.value;
        const usernameCheck = new RegExp(this.validationRegex);
        return !usernameCheck.test(enteredUsername) && enteredUsername ? { requirements: true } : null;
    }

    /**
     * This function is used to display error message for username and password
     * @param inputType form control input.
     * @returns error message.
     */
    getErrorUsernamePassword(inputType: string): void {
        this.usernamePasswordErrorMessage = this.loginForm.controls[inputType].hasError("required")
            ? `secondary.portal.login.${inputType}Required`
            : this.loginForm.controls[inputType].hasError("requirements")
            ? `secondary.portal.login.${inputType}Invalid`
            : "";
    }

    checkPassword(control: FormControl): any {
        const enteredPassword: string = control.value;
        const passwordCheck = RegexForFieldValidation.PASSWORD;
        return !passwordCheck.test(enteredPassword) && enteredPassword ? { requirements: true } : null;
    }

    handleEmptyUsername(event: any): any {
        this.isUsernameValid = true;
        this.inValidCredentials = false;
    }

    handleEmptyPassword(event: any): any {
        this.isPasswordValid = true;
        this.inValidCredentials = false;
    }
    /**
     * On submission, checks to see if form is valid.
     * If the form is valid it will allow the user to login.
     * If the form is invalid it will dispatch the CheckForm action and update the username and password variables to false.
     */
    onSubmit(): void {
        if (!this.loginClicked) {
            if (this.loginForm.invalid) {
                this.store.dispatch(new CheckForm(this.formName));
                this.isUsernameValid = false;
                this.getErrorUsernamePassword(USERNAME);
                this.isPasswordValid = false;
                this.getErrorUsernamePassword(PASSWORD);
            } else {
                this.login();
            }
        }
    }
    /** *
     * resetPassword(username: string) method called when login api response
     * contain actionRequired PASSWORD_CHANGE
     */
    resetPassword(username: string): void {
        /** *
         * passing username to forgotPassword api for generating auth token
         */
        this.auth
            .forgotPassword(username)
            .pipe(
                takeUntil(this.unsubscribe$),
                catchError((errorResp: HttpErrorResponse) => {
                    this.inValidCredentials = true;
                    this.notAuthorized = false;
                    if (
                        errorResp.status === ClientErrorResponseCode.RESP_400 &&
                        errorResp.error.code === ClientErrorResponseType.MISSING_PARAMETER
                    ) {
                        this.errorMessage = "secondary.portal.forgotPassword.verify.400.missingParameter";
                    } else {
                        this.errorMessage = `secondary.api.${errorResp.status}.${errorResp.error.code}`;
                    }
                    return EMPTY;
                }),
                tap((resp) => {
                    this.inValidCredentials = false;
                    if (resp.status === SuccessResponseCode.RESP_204) {
                        this.router.navigate(["../forgot-password/verifyCode"], {
                            queryParams: {
                                username: btoa(this.loginForm.controls.username.value),
                            },
                            relativeTo: this.route,
                        });
                    }
                }),
            )
            .subscribe();
    }

    /**
     * This method is used to get the login details of the user and route the user to the correct portal
     * @returns void
     */
    login(): void {
        this.loginClicked = true;
        this.notAuthorized = false;
        const formData = this.loginForm.value;
        const url = this.router.url;
        const portalArr = url.split("/");
        this.auth
            .login(this.portal, formData)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (user) => {
                    this.csrfService.load().toPromise();
                    this.userCred = user.user;
                    this.userCred.actionRequired = user.actionRequired;
                    sessionStorage.setItem("actionRequired", this.userCred.actionRequired);
                    sessionStorage.setItem("userInfo", JSON.stringify(this.userCred));
                    if (user.actionRequired && user.actionRequired.length) {
                        if (user.actionRequired.indexOf(ActionRequired.passwordChange) >= 0) {
                            this.resetPassword(this.loginForm.controls.username.value);
                            return;
                        }

                        if (user.actionRequired.indexOf(ActionRequired.pendingEnrollments) >= 0) {
                            this.userCred.isPendingEnrollments = true;
                        }
                    }
                    this.user.setUserCredential(this.userCred);
                    this.routeAfterLogin(user);
                    this.loginClicked = false;
                    this.loader = true;
                    // EDeliveryAccess value false ensures EDeliveryPrompt, that should appear only for mmp user, has not yet popped up
                    this.sharedService.changeCurrentMemberEDeliveryAccess(false);
                },
                (error: HttpErrorResponse) => {
                    this.errorHandle(error, false, portalArr);
                },
            );
    }

    /** *
     * Based on the producer permission Navigation of page.If producer is having aflacEFinance or aflacClearLink or aflacStrideLifeQuote
     * permission will navigate to the direct tab.
     * @param user is containing login user details.
     */
    routeAfterLogin(user: LoginResponse): void {
        let routeAfterLogin = this.store.selectSnapshot(SharedState.routeAfterLogin);
        let urlToNavigateAfterLogin = this.store.selectSnapshot(SharedState.getURLNavigationAfterLogin);
        if (this.userCred.producerId) {
            if (this.userCred.consented) {
                combineLatest([
                    this.staticUtil.hasPermission(UserPermissionList.PAYROLL),
                    this.staticUtil.hasPermission(UserPermissionList.DIRECT),
                    this.staticUtil.hasPermission(UserPermissionList.AFLAC_E_FINANCE),
                    this.staticUtil.hasPermission(UserPermissionList.AFLAC_CLEAR_LINK),
                    this.staticUtil.hasPermission(UserPermissionList.AFLAC_STRIDE_LIFE_QUOTE),
                ])
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(([payroll, direct, aflacEFinance, aflacClearLink, aflacStrideLifeQuote]) => {
                        this.payrollPermission = aflacEFinance || aflacClearLink || aflacStrideLifeQuote ? false : payroll;
                        this.directPermission = direct;
                        if (payroll !== null && direct !== null) {
                            if (!this.payrollPermission && this.directPermission) {
                                urlToNavigateAfterLogin = "/producer/direct";
                            } else {
                                urlToNavigateAfterLogin = "/producer/payroll";
                            }
                            if (routeAfterLogin && urlToNavigateAfterLogin) {
                                this.store.dispatch(new SetRouteAfterLogin(routeAfterLogin));
                                this.store.dispatch(new SetURLNavigationAfterLogin(urlToNavigateAfterLogin));
                                this.checkForReturnURL(user);
                            }
                        }
                    });
            } else {
                urlToNavigateAfterLogin = "/producer/payroll";
                this.checkForReturnURL(user);
            }
            // Agent Refresh should not get triggered when last_refreshed_date is greater than broker's current date
            this.aflacService
                .refreshAgent(false)
                .pipe(
                    take(1),
                    catchError(() => of(null)),
                )
                .subscribe();
            routeAfterLogin = "/producer";
        } else {
            if (
                (this.userCred.adminId && !this.userCred.memberId) ||
                (this.userCred.memberId && this.userCred.adminId && this.portal !== Portals.ADMIN && this.portal !== Portals.MEMBER)
            ) {
                urlToNavigateAfterLogin = "/admin/accountList";
                routeAfterLogin = "/admin";
            } else if (this.userCred.memberId && !this.userCred.adminId && this.portal !== Portals.MEMBER) {
                routeAfterLogin = "/member";
                urlToNavigateAfterLogin = "/member/home";
            } else if (
                this.userCred.memberId &&
                this.portal === Portals.MEMBER &&
                this.userCred.actionRequired.includes(ActionRequired.pendingEnrollments)
            ) {
                urlToNavigateAfterLogin = "/member/review-enrollment";
                routeAfterLogin = "/member";
                this.enrollmentService.pendingEnrollments$.next(true);
                this.queryParams = { memberId: this.userCred.memberId, groupId: this.userCred.groupId };
                this.store.dispatch(new SetQueryParams(this.queryParams));
            }
            if (routeAfterLogin && urlToNavigateAfterLogin) {
                this.store.dispatch(new SetRouteAfterLogin(routeAfterLogin));
                this.store.dispatch(new SetURLNavigationAfterLogin(urlToNavigateAfterLogin));
            }
            this.checkForReturnURL(user);
        }
    }
    /**
     * Based on the consent value from user details Navigation of page.
     * @param user is containing login user details.
     */
    checkForReturnURL(user: LoginResponse): void {
        let consentUrl = null;
        if (!this.userCred.consented) {
            this.url = this.store.selectSnapshot(SharedState.routeAfterLogin);
            consentUrl = "/login/consent";
        } else {
            this.url = this.store.selectSnapshot(SharedState.getURLNavigationAfterLogin);
        }
        if (this.url) {
            if (consentUrl !== null) {
                this.url += consentUrl;
            }
            const currPortalUrlArr = this.url.split("/");
            if (this.returnUrl !== "/" && this.returnUrl.startsWith("/" + currPortalUrlArr[1])) {
                // now check if portal is similar in the url and logged in user then do redirect
                const queryParams = {};
                const returnUrlArray = this.returnUrl.split("?");
                this.url = returnUrlArray[0];
                if (returnUrlArray && returnUrlArray.length > 1) {
                    const params = returnUrlArray[1].split("&");
                    params.forEach((element) => {
                        const elementArray = element.split("=");
                        if (elementArray && elementArray.length === 2) {
                            queryParams[elementArray[0]] = elementArray[1];
                        }
                    });
                }
                this.queryParams = queryParams;
            }
            this.getResourceList(user);
        }
    }
    /**
     * Method to handle the errors of login api
     * @param error : Error from the login api response
     * @param isLogout : True if logout api is called else false
     * @param portalArr : Name of the loaded portal
     */
    errorHandle(error: HttpErrorResponse, isLogout: boolean, portalArr?: any): void {
        this.notAuthorized = false;
        this.inValidCredentials = true;
        this.loginClicked =
            !isLogout && error.status === ClientErrorResponseCode.RESP_403 && error.error.code === ClientErrorResponseType.CSRF_MISMATCH;
        if (error.status === 401) {
            if (error.error.code === "notAuthorized") {
                if (error.error.message === USER_LOGIN_NOT_ALLOWED) {
                    // will get Partner Name base on Partner Id from language table.
                    // If we need different partner name, we needs to update in language table.
                    this.commonService
                        .getLanguages("secondary.portal.login.notAuthorized.partnerName", undefined, undefined, this.partnerId)
                        .pipe(take(1))
                        .subscribe((languages) => {
                            const partnerName = languages.find(
                                (language) => language.tagName === "secondary.portal.login.notAuthorized.partnerName",
                            ).value;
                            this.notAuthorizedErrorMessage = this.language
                                .fetchSecondaryLanguageValue("secondary.portal.login.notAuthorized")
                                .replace("#partnerName#", partnerName);
                        });
                    this.notAuthorized = true;
                } else {
                    this.errorMessage = "secondary.portal.login.loginError";
                }
            } else if (error.error.code === "accountLocked") {
                this.errorMessage = "secondary.portal.login.accountLocked";
            }
        } else if (error.status === 403) {
            if (error.error.code === "csrfMismatch") {
                if (!isLogout) {
                    this.inValidCredentials = false;
                    this.csrfService
                        .load()
                        .pipe(takeUntil(this.unsubscribe$))
                        .subscribe((res) => this.login());
                } else {
                    this.errorMessage = "secondary.portal.login.csrfMismatch";
                }
            } else if (error.error.code === "ssoRequired") {
                this.errorMessage = "secondary.portal.forgotPassword.ssoRequired";
                const link = error.headers.get("link");
                this.router.navigate([`/${portalArr[1]}/login/ffs`], {
                    queryParams: {
                        link: link,
                    },
                    relativeTo: this.route,
                });
            }
        } else if (error.status === 503) {
            this.errorMessage = "secondary.portal.login.groupMaintenance";
        }
    }
    getLoginLanguages(event: any): any {
        this.loginLanguages = event;
    }

    getAccountListResponse(portal: any, cred: any): void {
        const filterParams = {
            filter: "",
            search: "",
            property: "",
            page: "1",
            size: "1000",
            value: "",
        };
        this.accountListService
            .listAccounts(filterParams)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((accountList: any) => {
                accountList.content.map((item) => {
                    // condition to check whether producers array is empty or not
                    if (
                        item.producers !== undefined &&
                        item.producers.length > 0 &&
                        item.producers.filter((producer) => producer.primary === true).length > 0
                    ) {
                        item["primaryProducer"] =
                            item.producers.filter((producer) => producer.primary === true)[0].firstName +
                            " " +
                            item.producers.filter((producer) => producer.primary === true)[0].lastName;
                    }
                    item.productsCount = item.products.length;
                });
                this.store.dispatch(new AddAccountList(accountList));
                this.getRediractionPath(portal, cred, accountList);

                this.url = this.store.selectSnapshot(SharedState.getURLNavigationAfterLogin);

                if (this.url) {
                    if (accountList && accountList.content.length > 0 && cred.adminId) {
                        this.store.dispatch(new AddGroup(accountList.content[0]));
                        // TODO: This need to change once single url for login
                        if (this.adminAccountListEnabled && cred.adminId && !cred.memberId && portal === Portals.ADMIN) {
                            if (accountList.content.length > 1) {
                                this.router.navigate([this.url + "/admin/accountList"]);
                            } else {
                                this.router.navigate([this.url + "/admin/accountList/" + accountList.content[0].id + "/dashboard"]);
                            }
                        } else {
                            this.router.navigate([this.url]);
                        }
                    } else {
                        this.router.navigate([this.url]);
                    }
                }
            });
    }

    getRediractionPath(portal: any, cred: any, accountList: any): void {
        let urlToNavigateAfterLogin = "";
        let routeAfterLogin = "";
        if (cred.producerId !== undefined && portal !== Portals.PRODUCER) {
            if ((cred.callCenterId && cred.callCenterId === 11) || !cred.callCenterId) {
                routeAfterLogin = "/producer";
                urlToNavigateAfterLogin = "/producer/overview";
            } else {
                routeAfterLogin = "/producer/payroll";
                urlToNavigateAfterLogin = routeAfterLogin;
            }
        } else if (cred.adminId !== undefined && cred.memberId === undefined) {
            if (this.adminAccountListEnabled && cred.tpa) {
                routeAfterLogin = "/admin/accountList";
                urlToNavigateAfterLogin = routeAfterLogin;
            } else {
                const url = this.adminAccountListEnabled
                    ? "/admin/accountList/" + accountList.content[0].id + "/dashboard"
                    : "/admin/dashboard";
                routeAfterLogin = url;
                urlToNavigateAfterLogin = url;
            }
        } else if (
            (cred.memberId && !cred.adminId && portal !== Portals.MEMBER) ||
            (cred.memberId && cred.adminId && portal !== Portals.ADMIN && portal !== Portals.MEMBER)
        ) {
            routeAfterLogin = "/member";
            urlToNavigateAfterLogin = routeAfterLogin;
        }
        this.store.dispatch(new SetRouteAfterLogin(routeAfterLogin));
        this.store.dispatch(new SetURLNavigationAfterLogin(urlToNavigateAfterLogin));
    }

    /* Will navigate after checking resource acknowledge needed or not on login */
    goToHome(): void {
        if (this.queryParams && Object.keys(this.queryParams).length && !this.url.includes("consent")) {
            this.router.navigate([this.url], { queryParams: this.queryParams });
        } else {
            this.router.navigate([this.url]);
        }
    }

    /**
     * Checks if there are resources that need to be approved/acknowledged by a member
     * @param user login response
     * @returns nothing
     */
    getResourceList(user: any): void {
        if (user.user.memberId && user.actionRequired.includes(ActionRequired.consent)) {
            this.goToHome();
            return;
        }
        if (user.actionRequired.includes(ActionRequired.multipleAccounts) && (!this.userCred.adminId || this.portal === Portals.MEMBER)) {
            // If the user(member) has multiple accounts,
            // then route to select-accounts if:
            // 1. They are not an admin
            // 2. They are also an admin but the portal is MMP
            this.goToSelectAccount();
            return;
        }
        if (user.user.memberId !== undefined && user.actionRequired.includes(AppSettings.RESOURCE_ACKNOWLEDGEMENT)) {
            this.accountService
                .getResources("true")
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((resources) => {
                    const acknowledgeRequireResources = resources;
                    if (acknowledgeRequireResources.length) {
                        const dialogRef = this.dialog.open(ResourceAcknowledgmentComponent, {
                            width: "667px",
                            data: {
                                resourceAckNeeded: acknowledgeRequireResources,
                            },
                        });
                        dialogRef
                            .afterClosed()
                            .pipe(takeUntil(this.unsubscribe$))
                            .subscribe((result) => {
                                if (result === "home") {
                                    this.acknowledgeResources(acknowledgeRequireResources);
                                } else if (result === "logout") {
                                    this.onLogoutClick();
                                }
                            });
                    } else {
                        this.goToHome();
                    }
                });
        } else {
            this.goToHome();
        }
    }

    /* Will approve/acknowledge every Resource/s that needs to be approve/acknowledge */
    acknowledgeResources(resources: any): void {
        const resourcesToServer = resources.map((r) => r.id);
        this.accountService
            .acknowledgeResources({ resourceIds: resourcesToServer })
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                this.store.dispatch(new SetPermissions(true));
                this.goToHome();
            });
    }

    /**
     * Navigate to account selection page
     * @returns nothing
     */
    goToSelectAccount(): void {
        this.router.navigate(["/member/login/select-account"], {
            relativeTo: this.route,
        });
    }

    /* Will perform logout action */
    @Dispatch()
    onLogoutClick = () => [new Navigate(["/member/login"]), new ResetState()];
    /**
     * method to check aflac partner for member portal
     */
    isSelfService(): boolean {
        return this.portal.toUpperCase() === Portals.MEMBER;
    }

    /**
     * Gets csrf token
     */
    getCsrfToken(): void {
        // Call csrf and logout on load of login component
        this.csrfService
            .load()
            .pipe(
                retry(RETRY_COUNT),
                switchMap(() => this.csrfService.logOut().pipe(retry(RETRY_COUNT))),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(
                () => {
                    let urlToNavigateAfterLogin = "";
                    let routeAfterLogin = "";
                    if (this.portal.toUpperCase() === Portals.ADMIN) {
                        urlToNavigateAfterLogin = UrlAfterLogin.ACCOUNT_LIST;
                        routeAfterLogin = RouteAfterLogin.ADMIN;
                    } else if (this.portal.toUpperCase() === Portals.MEMBER) {
                        urlToNavigateAfterLogin = UrlAfterLogin.MEMBER_HOME;
                        routeAfterLogin = RouteAfterLogin.MEMBER;
                    } else if (this.portal.toUpperCase() === Portals.PRODUCER) {
                        urlToNavigateAfterLogin = UrlAfterLogin.PRODUCER_OVERVIEW;
                        routeAfterLogin = RouteAfterLogin.PRODUCER;
                    }
                    this.store.dispatch([
                        new SetPortal(this.portal.toUpperCase()),
                        new SetURLNavigationAfterLogin(urlToNavigateAfterLogin),
                        new SetRouteAfterLogin(routeAfterLogin),
                    ]);
                    this.loader = false;
                },
                (error) => {
                    this.loader = false;
                    this.errorHandle(error, true);
                },
            );
    }
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
