import { CsrfService } from "@empowered/util/csrf";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthenticationService } from "@empowered/api";
import { Store } from "@ngxs/store";
import { of, Subscription } from "rxjs";
import { catchError, switchMapTo, tap } from "rxjs/operators";
import {
    SetAdminId,
    SetEmail,
    SetGroupId,
    SetMemberId,
    SetPhone,
    SetProducerId,
    SetName,
    SetUserName,
    SetIncompleteRegistrationAlert,
} from "@empowered/ngxs-store";
import { HttpErrorResponse } from "@angular/common/http";

import { RegexForFieldValidation } from "@empowered/ui";
import { LanguageService } from "@empowered/language";
import {
    ClientErrorResponseCode,
    ClientErrorResponseType,
    PhoneNumber,
    Portals,
    AdminCredential,
    MemberCredential,
    ProducerCredential,
} from "@empowered/constants";

const GLOBAL_REGEX = /-/g;
const STEP_TWO = 2;

@Component({
    selector: "empowered-verify-method",
    templateUrl: "./verify-method.component.html",
    styleUrls: ["./verify-method.component.scss"],
})
export class VerifyMethodComponent implements OnInit, OnDestroy {
    form: FormGroup;
    subscriptions: Subscription[] = [];
    verifyMethod: string;
    errorMessage = "";
    error = false;
    errorMsg: string;
    fieldErrorFlag = false;
    verifyMethodEmail = "email";
    verifyMethodPhone = "phone";
    loadSpinner = false;
    saveError = false;
    readonly PHONE_NUMBER_MAX_LENGTH = PhoneNumber.MAX_LENGTH;
    // eslint-disable-next-line max-len
    EMAIL_REGEX = new RegExp(
        // eslint-disable-next-line max-len
        RegexForFieldValidation.EMAIL,
    );
    MOBILE_REGEX = new RegExp(RegexForFieldValidation.PHONE);

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.register.verifyMethod.phoneNumberField",
        "primary.portal.register.verifyMethod.emailField",
        "primary.portal.common.back",
        "primary.portal.common.submit",
    ]);
    isSelfService = false;
    // eslint-disable-next-line max-len
    constructor(
        private readonly fb: FormBuilder,
        private readonly route: ActivatedRoute,
        private readonly authenticationService: AuthenticationService,
        private readonly router: Router,
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly csrf: CsrfService,
    ) {}

    /**
     * Set needed variables
     */
    ngOnInit(): void {
        // It is used to not route user directly to other page of registration
        if (this.authenticationService.formValue.value < 1) {
            this.saveError = true;
            this.store.dispatch(new SetIncompleteRegistrationAlert(this.saveError));
            this.router.navigate(["../../../login"], {
                relativeTo: this.route,
            });
        }
        this.route.params.subscribe((params) => {
            if (params["id"] === this.verifyMethodEmail) {
                this.verifyMethod = this.verifyMethodEmail;
            } else {
                this.verifyMethod = this.verifyMethodPhone;
            }
        });

        this.form = this.fb.group({
            phone: ["", [Validators.required, Validators.pattern(this.MOBILE_REGEX)]],
            // eslint-disable-next-line indent, @typescript-eslint/indent
            email: ["", [Validators.required, Validators.pattern(this.EMAIL_REGEX)]],
            updateOn: "blur",
        });
        this.isSelfService = this.router.url.indexOf("/self-service") !== -1;
    }

    /**
     * This function is used to save registration form value.
     */
    onSubmit(): void {
        this.authenticationService.formValue.next(STEP_TWO);
        if (this.verifyMethod === this.verifyMethodEmail && this.form.controls.email.invalid) {
            this.handleInvalidField(this.verifyMethodEmail);
            return;
        }
        if (this.verifyMethod === this.verifyMethodPhone && this.form.controls.phone.invalid) {
            this.handleInvalidField(this.verifyMethodPhone);
            return;
        }
        const isVerifiedMethodEmail = this.verifyMethod === this.verifyMethodEmail;
        const email = isVerifiedMethodEmail ? this.form.controls.email.value : null;
        const phone = isVerifiedMethodEmail ? null : this.form.controls.phone.value.replace(GLOBAL_REGEX, "");
        const portal = this.isSelfService ? Portals.MEMBER : undefined;
        const authCodeResponse = this.isSelfService
            ? this.authenticationService.sendOneTimePass(email, phone)
            : this.authenticationService.startRegistration(portal, email, phone);

        this.fieldErrorFlag = false;
        this.loadSpinner = true;
        this.subscriptions.push(
            this.csrf
                .load()
                .pipe(
                    switchMapTo(authCodeResponse),
                    catchError((error: HttpErrorResponse) => {
                        if (error.error.code === "ssoRequired") {
                            this.navigateToFfs(error);
                        }
                        this.displayErrorMessage(error);
                        return of(null);
                    }),
                    tap((_) => {
                        this.store.dispatch(new SetPhone(this.form.controls.phone.value));
                        this.store.dispatch(new SetEmail(this.form.controls.email.value));
                        this.router.navigate(["../../3/" + this.verifyMethod], { relativeTo: this.route });
                    }),
                )
                .subscribe(),
        );
    }

    /**
     * Set error variables for invalid field.
     * @param field invalid field
     */
    handleInvalidField(field: string): void {
        this.fieldErrorFlag = true;
        if (this.form.controls[field].errors.required) {
            this.errorMsg = "secondary.portal.register.requiredField";
        } else {
            this.errorMsg = "primary.portal.register.invalidEmail";
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
                link: link,
            },
            relativeTo: this.route,
        });
    }

    /**
     * This function is used to update store data
     * @param resp http response
     * @param isPhone to differentiate from where this function is being called.
     */
    updateStoreData(resp: MemberCredential | ProducerCredential | AdminCredential, isPhone: boolean): void {
        this.loadSpinner = false;
        this.store.dispatch(new SetPhone(this.form.controls.phone.value));
        this.store.dispatch(new SetEmail(this.form.controls.email.value));
        this.store.dispatch(new SetName(resp.name));
        this.store.dispatch(new SetUserName(resp.username));
        this.store.dispatch(new SetGroupId(resp.groupId));
        this.setStateValues(resp);
        this.router.navigate(["../../3/" + this.verifyMethod], { relativeTo: this.route });
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
     * Set ID of current user in store based on credential type.
     * @param currentUser current user
     */
    setStateValues(currentUser: MemberCredential | ProducerCredential | AdminCredential): void {
        if ("adminId" in currentUser) {
            this.store.dispatch(new SetAdminId(currentUser.adminId));
        } else if ("memberId" in currentUser) {
            this.store.dispatch(new SetMemberId(currentUser.memberId));
        } else if ("producerId" in currentUser) {
            this.store.dispatch(new SetProducerId(currentUser.producerId));
        }
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
