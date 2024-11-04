import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthenticationService } from "@empowered/api";
import { Subscription, Observable, Subject } from "rxjs";
import { Select, Store } from "@ngxs/store";

import { SharedState, RegexDataType, SetRegex, StaticUtilService } from "@empowered/ngxs-store";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { takeUntil } from "rxjs/operators";
import { ClientErrorResponseCode, ClientErrorResponseType, ConfigName, Credential } from "@empowered/constants";

const NEW_PASSWORD = "newPassword";

@Component({
    selector: "empowered-reset-password",
    templateUrl: "./reset-password.component.html",
    styleUrls: ["./reset-password.component.scss"],
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    visibleConfirmPassword = false;
    visiblePassword = false;
    form: FormGroup;
    errorMessage = "";
    subscriptions: Subscription[] = [];
    private readonly unsubscribe$ = new Subject<void>();
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.forgotPassword.createPassword",
        "primary.portal.forgotPassword.confirmPasswordAgain",
        "primary.portal.forgotPassword.confirmPassword",
        "primary.portal.common.back",
        "primary.portal.members.change-password.header",
        "primary.portal.members.change-password.title",
        "primary.portal.members.change-password.currentPassword",
        "primary.portal.members.change-password.newPassword",
        "primary.portal.members.change-password.verifyPassword",
        "primary.portal.members.change-password.newPasswordHint",
        "primary.portal.members.change-password.updated",
        "primary.portal.members.change-password.currentPassword.passwordValidation",
        "primary.portal.members.change-password.passwordValidation.characterValidation",
        "primary.portal.members.change-password.passwordValidation.letterValidation",
        "primary.portal.members.change-password.passwordValidation.numberValidation",
        "primary.portal.members.change-password.passwordValidation.specialValidation",
        "primary.portal.members.change-password.passwordValidation.profileValidation",
        "primary.portal.members.change-password.passwordValidation.spaceValidation",
        "primary.portal.members.change-password.requiredField",
        "primary.portal.common.update",
        "primary.portal.members.change-password.verifyPassword.passwordValidation",
        "primary.portal.members.reset-password.showPassword",
        "primary.portal.members.reset-password.hidePassword",
    ]);
    secondaryLanguageStrings: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.forgotPassword.400.badParameter",
        "secondary.portal.forgotPassword.400.historyMatch",
        "secondary.portal.forgotPassword.400.restrictedPassword",
        "secondary.portal.forgotPassword.resetPassword.401",
        "secondary.portal.forgotPassword.resetPassword.403",
        "secondary.portal.forgotPassword.passwordMismatch",
    ]);
    isFocusOut: boolean;
    isNewPasswordDisabled = true;
    isVerifyPasswordDisabled = true;
    lengthValidation: boolean;
    caseValiadtion: boolean;
    numberValidation: boolean;
    specialCharacterValidation: boolean;
    userProfileValidation: boolean;
    spaceValidation: boolean;
    isPasswordEntered: boolean;
    validationRegex: RegexDataType;
    userData: Credential;
    showSpinner: boolean;
    isPasswordUpdated: boolean;
    PASSWORD_MIN_LENGTH_8 = 8;
    PASSWORD_MAX_LENGTH_20 = 20;
    restrictedPasswords: string[] = [];

    /** *
     * constructor for services initialization
     */
    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly fb: FormBuilder,
        private readonly authservice: AuthenticationService,
        private readonly language: LanguageService,
        private readonly store: Store,
        private readonly staticUtilService: StaticUtilService,
    ) {}

    /** *
     * reducing this.form.controls in template for accessing property values
     */
    get formControl(): FormGroup["controls"] {
        return this.form.controls;
    }

    /** *
     * ngOnInit angular life cycle for Init
     */
    ngOnInit(): void {
        this.showSpinner = true;
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
            data ? (this.validationRegex = data) : this.store.dispatch(new SetRegex());
            this.showSpinner = false;
        });
        this.staticUtilService
            .cacheConfigValue(ConfigName.BLACK_LIST_PASSWORDS)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((configValue) => {
                this.restrictedPasswords = configValue && configValue !== "" ? configValue.split(",") : [];
            });
        /**
         * doing this here instead of the constructor because
         * it only needs to be called once upon initialization
         */
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.forgotPassword.*"));
        this.userData = JSON.parse(sessionStorage.getItem("userInfo"));
        if (!this.userData) {
            this.router.navigate(["../../login"], {
                relativeTo: this.route,
            });
            return;
        }
        this.form = this.fb.group(
            {
                newPassword: ["", Validators.compose([Validators.maxLength(this.PASSWORD_MAX_LENGTH_20), Validators.required])],
                verifyPassword: ["", Validators.compose([Validators.maxLength(this.PASSWORD_MAX_LENGTH_20), Validators.required])],
                updateOn: "blur",
            },
            {
                validators: this.password.bind(this),
            },
        );
    }
    password(formGroup: FormGroup): Validators {
        const { value: newPassword } = formGroup.get("newPassword");
        const { value: verifyPassword } = formGroup.get("verifyPassword");
        if (newPassword !== "" && verifyPassword !== "") {
            if (newPassword !== verifyPassword) {
                formGroup.get("verifyPassword").setErrors({
                    isVerifyPasswordValid: true,
                });
            } else {
                formGroup.get("verifyPassword").setErrors(null);
            }
        }
        return newPassword === verifyPassword ? null : { isVerifyPasswordValid: true };
    }
    /** *
     *  validating New password field value on change event
     */
    checkForNewPasswordValidation(): void {
        this.errorMessage = "";
        let newPassword = this.formControl[NEW_PASSWORD].value;
        const passwordRegex = new RegExp(this.validationRegex.SPECIAL_CHARACTER_PASSWORD_VALIDATION);
        if (newPassword !== "") {
            if (!passwordRegex.test(newPassword)) {
                newPassword = newPassword.substring(0, newPassword.length - 1);
                this.formControl[NEW_PASSWORD].patchValue(newPassword);
            }
            this.isFocusOut = false;
            this.lengthValidation = newPassword.length >= this.PASSWORD_MIN_LENGTH_8 && newPassword.length <= this.PASSWORD_MAX_LENGTH_20;
            this.caseValiadtion =
                newPassword.match(new RegExp(this.validationRegex.LOWERCASE_VALIDATION)) &&
                newPassword.match(new RegExp(this.validationRegex.UPPERCASE_VALIDATION));
            this.numberValidation = newPassword.match(new RegExp(this.validationRegex.NUMBER_VALIDATION));
            this.specialCharacterValidation = newPassword.match(new RegExp(this.validationRegex.SPECIAL_CHARACTER_VALIDATION));
            this.spaceValidation = !newPassword.match(new RegExp(this.validationRegex.SPACE_VALIDATION));
            this.userProfileValidation = !this.checkForUserProfileValidation(newPassword);
        } else {
            this.resetValidation();
        }
    }
    /** *
     *  validating New password field value contains username, firstname and lastname
     * user can not use his/her username, firstname or last name in new password input field
     */
    checkForUserProfileValidation(newPassword: string): boolean {
        if (
            newPassword.includes(this.userData.username) ||
            newPassword.includes(this.userData.name.firstName) ||
            newPassword.includes(this.userData.name.lastName)
        ) {
            return true;
        }
        return false;
    }
    /** *
     *  display new passwords rules text when user focus in new password input filed
     */
    isNewPasswordEntered(): void {
        this.isPasswordEntered = true;
    }
    /** *
     * once you focus out from new password field it will validate new password field and display error
     * if new passowrd field empty it will hide password suggestion text
     */
    focusoutForNewPassword(): void {
        this.isFocusOut = true;
        this.formControl["verifyPassword"].disable();
        if (this.formControl["newPassword"].value !== "") {
            if (
                !this.lengthValidation ||
                !this.caseValiadtion ||
                !this.numberValidation ||
                !this.specialCharacterValidation ||
                !this.userProfileValidation ||
                !this.spaceValidation
            ) {
                this.isVerifyPasswordDisabled = true;
                this.formControl["newPassword"].setErrors({
                    isNewPasswordValid: true,
                });
                this.formControl["verifyPassword"].patchValue("");
            } else {
                this.isVerifyPasswordDisabled = false;
                this.formControl["verifyPassword"].enable();
                this.formControl["newPassword"].setErrors(null);
            }
        } else {
            this.resetValidation();
            this.isPasswordEntered = false;
            this.formControl["verifyPassword"].patchValue("");
        }
    }
    /** *
     * if new password field empty reset both passowrd fields
     */
    resetValidation(): void {
        this.isFocusOut = undefined;
        this.lengthValidation = undefined;
        this.caseValiadtion = undefined;
        this.numberValidation = undefined;
        this.specialCharacterValidation = undefined;
        this.userProfileValidation = undefined;
        this.spaceValidation = undefined;
    }
    /** *
     * Form Submit event
     */
    onSubmit(): void {
        if (this.form.invalid || this.validateRestrictedPassword()) {
            return;
        }

        const apiSubscription = this.authservice
            .resetPassword(this.form.controls.newPassword.value, localStorage.getItem("authCode"))
            .subscribe(
                (resp) => {
                    this.router.navigate(["../resetPasswordSuccess"], { relativeTo: this.route });
                },
                (erroresp) => {
                    if (erroresp.status === ClientErrorResponseCode.RESP_400) {
                        if (erroresp.error.code === ClientErrorResponseType.BAD_PARAMETER) {
                            this.errorMessage = this.secondaryLanguageStrings["secondary.portal.forgotPassword.400.badParameter"];
                        }
                        if (erroresp.error.code === ClientErrorResponseType.HISTORY_MATCH) {
                            this.errorMessage = this.secondaryLanguageStrings["secondary.portal.forgotPassword.400.historyMatch"];
                        }
                    } else if (erroresp.status === ClientErrorResponseCode.RESP_401) {
                        this.errorMessage = this.secondaryLanguageStrings["secondary.portal.forgotPassword.resetPassword.401"];
                    } else if (erroresp.status === ClientErrorResponseCode.RESP_403) {
                        this.errorMessage = this.secondaryLanguageStrings["secondary.portal.forgotPassword.resetPassword.403"];
                    }
                },
            );
        this.subscriptions.push(apiSubscription);
    }
    /**
     * Validating password with restricted keywords.
     * @returns boolean flag if restricted keyword is included in password.
     */
    validateRestrictedPassword(): boolean {
        const password = this.form.controls["newPassword"].value;
        const isRestrictedPassword = this.restrictedPasswords.some((value) => password.toLowerCase().includes(value.toLowerCase()));
        if (isRestrictedPassword) {
            this.errorMessage = this.secondaryLanguageStrings["secondary.portal.forgotPassword.400.restrictedPassword"];
        }
        return isRestrictedPassword;
    }
    /**
     * ngOnDestroy angular life cycle for destroy all subscription
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }
}
