/* eslint-disable no-underscore-dangle */
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthenticationService } from "@empowered/api";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { Store } from "@ngxs/store";
import { EMPTY, Subject } from "rxjs";
import { CsrfService } from "@empowered/util/csrf";
import { catchError, takeUntil, tap } from "rxjs/operators";
import { HttpErrorResponse } from "@angular/common/http";
import { ClientErrorResponseCode, ClientErrorResponseType, SuccessResponseCode } from "@empowered/constants";

@Component({
    selector: "empowered-verify-username",
    templateUrl: "./verify-username.component.html",
    styleUrls: ["./verify-username.component.scss"],
})
export class VerifyUsernameComponent implements OnInit, OnDestroy {
    /* @Select(ForgotPasswordState.errorMessage) errorMessage$: Observable<string>; */

    form: FormGroup;
    errorMessage = "";
    error = false;
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    languageStrings = {
        username: this.language.fetchPrimaryLanguageValue("primary.portal.login.username"),
        buttonNext: this.language.fetchPrimaryLanguageValue("primary.portal.common.next"),
        forgotMyUsername: this.language.fetchPrimaryLanguageValue("primary.portal.forgotPassword.forgotMyUsername"),
        buttonBack: this.language.fetchPrimaryLanguageValue("primary.portal.common.back"),
        usernameInfo: this.language.fetchPrimaryLanguageValue("primary.portal.forgotPassword.usernameInfoIconText"),
        usernameToolTip: this.language.fetchPrimaryLanguageValue("primary.portal.forgotPassword.usernameInfoIconMsg"),
    };

    constructor(
        private readonly store: Store,
        private readonly fb: FormBuilder,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly _authservice: AuthenticationService,
        private readonly _csrf: CsrfService,
        private readonly language: LanguageService,
    ) {}
    /**
     * Creating form group for Verify Username and fetching error messages
     */
    ngOnInit(): void {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.form = this.fb.group({
            username: ["", Validators.required],
            updateOn: "blur",
        });
        // eslint-disable-next-line no-underscore-dangle
        this._csrf.load().pipe(takeUntil(this.unsubscribe$)).subscribe();
    }
    /**
     * The below method is triggered on click of submit after entering the username. here we check for error code and
     * different success codes; based on that will allow user to proceed further.
     */
    onSubmit(): void {
        if (this.form.invalid) {
            return;
        }
        this._authservice
            .forgotPassword(this.form.controls.username.value)
            .pipe(
                takeUntil(this.unsubscribe$),
                catchError((errorResp: HttpErrorResponse) => {
                    this.error = true;
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
                    this.error = false;
                    if (resp.status === SuccessResponseCode.RESP_204) {
                        this.router.navigate(["../verifyCode"], {
                            queryParams: {
                                username: btoa(this.form.controls.username.value),
                            },
                            relativeTo: this.route,
                        });
                    }
                }),
            )
            .subscribe();
    }

    /**
     * Remove existing subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
