import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthenticationService, VerificationMethod } from "@empowered/api";
import { EMPTY, Subject, Subscription } from "rxjs";

import { LanguageService } from "@empowered/language";
import { HttpErrorResponse } from "@angular/common/http";
import { catchError, takeUntil } from "rxjs/operators";
import { ClientErrorResponseCode, ClientErrorResponseType, AppSettings } from "@empowered/constants";

@Component({
    selector: "empowered-verify-code",
    templateUrl: "./verify-code.component.html",
    styleUrls: ["./verify-code.component.scss"],
})
export class VerifyCodeComponent implements OnInit, OnDestroy {
    form: FormGroup;
    errorMessage = "";
    error = false;
    communicationMethod: VerificationMethod;
    username: string;
    actionRequired: string;
    languageStrings = {
        authCode: this.language.fetchPrimaryLanguageValue("primary.portal.forgotPassword.authenticationCode"),
        buttonSubmit: this.language.fetchPrimaryLanguageValue("primary.portal.common.submit"),
        didtReceiveCode: this.language.fetchPrimaryLanguageValue("primary.portal.forgotPassword.didtReceiveCode"),
        buttonBack: this.language.fetchPrimaryLanguageValue("primary.portal.common.back"),
    };
    private readonly unsubscribe$ = new Subject<void>();

    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly fb: FormBuilder,
        private readonly authService: AuthenticationService,
        private readonly language: LanguageService,
    ) {}

    ngOnInit(): void {
        this.route.queryParams
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((params) => (this.communicationMethod = params["communicationMethod"]));
        this.route.queryParams.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => (this.username = atob(params["username"])));
        this.form = this.fb.group({
            authCode: ["", Validators.required],
            updateOn: "blur",
        });
        this.actionRequired = sessionStorage.getItem("actionRequired");
    }

    onSubmit(): void {
        if (this.form.invalid) {
            return;
        }
        this.authService
            .verifyAuthToken(this.form.controls.authCode.value)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {
                    this.error = false;
                    localStorage.setItem("authCode", this.form.controls.authCode.value);
                    if (this.actionRequired) {
                        this.router.navigate(["../../reset-password"], {
                            relativeTo: this.route,
                        });
                        return;
                    }
                    this.router.navigate(["../changePassword"], { relativeTo: this.route });
                },
                (error) => {
                    this.error = true;
                    if (error.status === AppSettings.API_RESP_400) {
                        this.errorMessage = "secondary.portal.forgotPassword.verifyAuthCode.400";
                    } else if (error.status === AppSettings.API_RESP_401) {
                        this.errorMessage = "secondary.portal.forgotPassword.verifyAuthCode.401";
                    } else if (error.status === AppSettings.API_RESP_403) {
                        this.errorMessage = "secondary.portal.forgotPassword.verifyAuthCode.403";
                    }
                },
            );
    }
    regenerateAuthCode(): void {
        this.authService
            .forgotPassword(this.username, this.communicationMethod)
            .pipe(
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
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
    navigateBack(): void {
        if (this.actionRequired) {
            this.router.navigate(["../../login"], { relativeTo: this.route });
            return;
        }
        this.router.navigate(["../verifyUsername"], { relativeTo: this.route });
    }
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
