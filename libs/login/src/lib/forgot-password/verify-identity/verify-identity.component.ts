import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthenticationService } from "@empowered/api";
import { EMPTY, Subject, Subscription } from "rxjs";
import { LanguageService } from "@empowered/language";
import { HttpErrorResponse } from "@angular/common/http";
import { catchError, takeUntil, tap } from "rxjs/operators";
import { ClientErrorResponseCode, ClientErrorResponseType } from "@empowered/constants";

@Component({
    selector: "empowered-verify-identity",
    templateUrl: "./verify-identity.component.html",
    styleUrls: ["./verify-identity.component.scss"],
})
export class VerifyIdentityComponent implements OnInit, OnDestroy {
    /* @Select(ForgotPasswordState.errorMessage) errorMessage$: Observable<string>; */

    form: FormGroup;
    username: string;
    errorMessage: string;
    error = false;
    fieldErrorFlag = false;
    apiSubscription: Subscription;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.forgotPassword.chooseVerificationMethod",
        "primary.portal.common.next",
        "primary.portal.common.back",
        "primary.portal.forgotPassword.email",
        "primary.portal.forgotPassword.text",
    ]);
    private readonly unsubscribe$ = new Subject<void>();

    /* items: Array<Option> = [{ label: "Text", value: "phone" }, { label: "Email", value: "email" }]; */

    constructor(
        private readonly fb: FormBuilder,
        private readonly router: Router,
        private readonly _authService: AuthenticationService,
        private readonly route: ActivatedRoute,
        private readonly language: LanguageService,
    ) {
        this.route.queryParams.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => (this.username = atob(params["username"])));
    }

    ngOnInit(): void {
        this.form = this.fb.group({
            verifyMethod: [null, Validators.required],
            updateOn: "blur",
        });
    }
    /**
     * this method handles the button click after selecting the verification type and makes a api call to generate authcode
     * and navigates to verifycode-component
     */
    onSubmit(): void {
        if (this.form.invalid) {
            this.fieldErrorFlag = true;
            return;
        }
        this.fieldErrorFlag = false;
        // eslint-disable-next-line no-underscore-dangle
        this._authService
            .forgotPassword(this.username, this.form.controls.verifyMethod.value)
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
                tap(() => {
                    this.error = false;
                    this.router.navigate(["../verifyCode"], {
                        queryParams: {
                            username: btoa(this.username),
                        },
                        relativeTo: this.route,
                    });
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
