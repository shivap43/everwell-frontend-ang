import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthenticationService, ActionRequired, LoginResponse } from "@empowered/api";

import { Store } from "@ngxs/store";
import { of, Subscription } from "rxjs";
import { LanguageService } from "@empowered/language";

import {
    SetAdminId,
    SetGroupId,
    SetRegistrationMemberId,
    SetName,
    SetProducerId,
    SetUserName,
    SetPhone,
    SetEmail,
    RegistrationState,
    SharedState,
    SetIncompleteRegistrationAlert,
} from "@empowered/ngxs-store";
import { catchError, tap, switchMapTo } from "rxjs/operators";
import { HttpErrorResponse } from "@angular/common/http";
import { CsrfService } from "@empowered/util/csrf";
import {
    ClientErrorResponseCode,
    ClientErrorResponseType,
    Portals,
    AdminCredential,
    MemberCredential,
    ProducerCredential,
} from "@empowered/constants";
import { UserService } from "@empowered/user";
import { LoginHelperService } from "@empowered/login";
const GLOBAL_REGEX = /-/g;

@Component({
    selector: "empowered-verify-authentication",
    templateUrl: "./verify-authentication.component.html",
    styleUrls: ["./verify-authentication.component.scss"],
})
export class VerifyAuthenticationComponent implements OnInit, OnDestroy {
    form: FormGroup;
    apiSubscription: Subscription;
    subscriptions: Subscription[] = [];
    verifyMethod;
    email;
    phone;
    verifyMethodEmail = "email";
    verifyMethodPhone = "phone";
    error = false;
    errorMessage = "";
    requiredError = false;
    loadSpinner = false;
    saveError = false;
    incompleteRegistrationError: string;
    failedAttempts = 0;
    isSelfService = false;
    portal: string;
    userCred: AdminCredential | MemberCredential | ProducerCredential;

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.register.verifyAuthenticationCodeName",
        "primary.portal.common.back",
        "primary.portal.common.submit",
        "primary.portal.common.edit",
        "primary.portal.common.cancel",
        "primary.portal.register.verifyCodeEmailMessage",
        "primary.portal.register.verifyCodePhoneMessage",
    ]);

    constructor(
        private readonly router: Router,
        private readonly fb: FormBuilder,
        private readonly authService: AuthenticationService,
        private readonly store: Store,
        private readonly route: ActivatedRoute,
        private readonly language: LanguageService,
        private readonly csrf: CsrfService,
        private readonly userService: UserService,
        private readonly loginHelperService: LoginHelperService,
    ) {}

    ngOnInit(): void {
        // It is used to not route user directly to other page of registration
        if (this.authService.formValue.value < 2) {
            this.saveError = true;
            this.store.dispatch(new SetIncompleteRegistrationAlert(this.saveError));
            this.router.navigate(["../../../login"], { relativeTo: this.route });
        }
        this.form = this.fb.group({
            authCode: ["", Validators.required],
            updateOn: "blur",
        });
        this.route.params.subscribe((params) => {
            if (params["id"] === this.verifyMethodEmail) {
                this.verifyMethod = this.verifyMethodEmail;
            } else if (params["id"] === this.verifyMethodPhone) {
                this.verifyMethod = this.verifyMethodPhone;
            } else {
                this.verifyMethod = "invalid";
            }
            this.email = this.store.selectSnapshot(RegistrationState.email);
            this.phone = this.store.selectSnapshot(RegistrationState.phone);
        });
        this.isSelfService = this.router.url.indexOf("/self-service") !== -1;
        this.portal = this.store.selectSnapshot(SharedState.portal);
    }

    /**
     * Verifies authentication token and saves needed values in the store.
     */
    onSubmit(): void {
        // Updates the value of registration form
        this.authService.formValue.next(3);
        if (this.form.invalid) {
            this.requiredError = true;
        } else {
            this.requiredError = false;
            this.loadSpinner = true;
            if (this.isSelfService) {
                this.verifyAuthTokenLogin();
            } else {
                this.verifyAuthToken();
            }
        }
    }

    /**
     * Displays appropriate error message and navigates away from page when there are too many failed attempts.
     * @param errorResp caught http error response
     */
    submitError(errorResp: HttpErrorResponse): void {
        this.loadSpinner = false;
        this.error = true;
        if (errorResp?.error?.code === ClientErrorResponseCode.RESP_400) {
            if (errorResp.statusText === ClientErrorResponseType.MISSING_PARAMETER) {
                this.errorMessage = "secondary.portal.register.verifyAuthentication.missingParameter";
            }
        } else if (errorResp?.status === ClientErrorResponseCode.RESP_401) {
            this.failedAttempts++;
            if (errorResp.error?.code === ClientErrorResponseType.NOT_AUTHORIZED) {
                this.errorMessage = "secondary.portal.register.verifyAuthentication.notAuthorized";
            }
            if (this.failedAttempts > 3) {
                this.router.navigate(["../../1"], { relativeTo: this.route });
            }
        } else if (
            errorResp?.status === ClientErrorResponseCode.RESP_403 &&
            errorResp.error?.code === ClientErrorResponseType.SSO_REQUIRED
        ) {
            this.errorMessage = "secondary.portal.register.verifyAuthentication.ssoRequired";
        }
    }

    /**
     * resends the auth code when user clicks on did not receive auth code
     */
    getAuthCode(): void {
        const authCodeResponse = this.isSelfService
            ? this.authService.sendOneTimePass(this.email, this.phone.replace(GLOBAL_REGEX, ""))
            : this.authService.startRegistration(this.portal, this.email, this.phone);
        this.subscriptions.push(
            this.csrf
                .load()
                .pipe(
                    switchMapTo(authCodeResponse),
                    tap(() => {
                        this.store.dispatch(new SetPhone(this.phone));
                        this.store.dispatch(new SetEmail(this.email));
                    }),
                    catchError((error: HttpErrorResponse) => {
                        if (error.error.code === ClientErrorResponseType.SSO_REQUIRED) {
                            this.navigateToFfs(error);
                        }
                        this.displayErrorMessage(error);
                        return of(null);
                    }),
                )
                .subscribe(),
        );
    }
    /**
     * This function is used to display api error message
     * @param error http error response
     */
    displayErrorMessage(error: HttpErrorResponse): void {
        this.loadSpinner = false;
        this.error = true;
        if (error.status === ClientErrorResponseCode.RESP_400) {
            if (error.error.code === ClientErrorResponseType.MISSING_PARAMETER) {
                this.errorMessage = "secondary.portal.register.accountLookup.missingParameter";
            } else {
                this.errorMessage = "secondary.portal.register.accountLookup.badParameter";
            }
        } else {
            this.errorMessage = `secondary.api.${error.status}.${error.error.code}`;
        }
    }
    /**
     * will navigated user to field force services
     * @param error http error response
     */
    navigateToFfs(error: HttpErrorResponse): void {
        const url = this.router.url;
        const portalArr = url.split("/");
        const link = error.headers.get("link");
        this.router.navigate([`/${portalArr[1]}/login/ffs`], {
            queryParams: {
                link,
            },
            relativeTo: this.route,
        });
    }

    /**
     * Verifies auth token
     */
    verifyAuthToken(): void {
        this.subscriptions.push(
            this.authService
                .verifyAuthToken(this.form.controls.authCode.value)
                .pipe(
                    tap((credential) => {
                        this.loadSpinner = false;
                        this.store.dispatch(new SetName(credential.name));
                        this.store.dispatch(new SetUserName(credential.username));
                        this.store.dispatch(new SetGroupId(credential.groupId));
                        if ("adminId" in credential) {
                            this.store.dispatch(new SetAdminId(credential.adminId));
                        } else if ("memberId" in credential) {
                            this.store.dispatch(new SetRegistrationMemberId(credential.memberId));
                        } else if ("producerId" in credential) {
                            this.store.dispatch(new SetProducerId(credential.producerId));
                        }
                        localStorage.setItem("authCode", this.form.controls.authCode.value);
                        if (credential.consented) {
                            sessionStorage.setItem("consented", credential.consented);
                        }
                        this.router.navigate(["../../4"], { relativeTo: this.route });
                    }),
                    catchError((errorResp) => {
                        this.submitError(errorResp);
                        return of(null);
                    }),
                )
                .subscribe(),
        );
    }

    /**
     * Verifies auth token login for self service
     */
    verifyAuthTokenLogin(): void {
        this.subscriptions.push(
            this.authService
                .verifyTokenAndLogin(this.form.controls.authCode.value)
                .pipe(
                    tap(
                        (user: LoginResponse) => {
                            const USER_INFO_STORAGE = "userInfo";
                            this.loadSpinner = false;
                            this.csrf.load().toPromise();
                            this.userCred = user.user;
                            this.userCred.authCode = this.form.controls.authCode.value;
                            this.userCred.actionRequired = user.actionRequired;
                            sessionStorage.setItem(USER_INFO_STORAGE, JSON.stringify(this.userCred));
                            this.userService.setUserCredential(this.userCred);
                            const subscriptions = this.loginHelperService.routeAfterLogin(user, this.userCred as MemberCredential);
                            if (subscriptions?.length) {
                                this.subscriptions.push(...subscriptions);
                            }
                        },
                        (error) => {
                            this.submitError(error);
                        },
                    ),
                )
                .subscribe(),
        );
    }

    /**
     * Clean up subscriptions
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
    }
}
