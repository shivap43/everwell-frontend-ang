import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators, FormControl } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthenticationService } from "@empowered/api";
import { Subscription, Observable } from "rxjs";

import { SharedState, RegexDataType, SetRegex, StaticUtilService } from "@empowered/ngxs-store";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { Select, Store } from "@ngxs/store";
import { ClientErrorResponseCode, ClientErrorResponseType, ConfigName, Credential } from "@empowered/constants";

const PASSWORD = "password";
const CONFIRM_PASSWORD = "confirmPassword";
@Component({
    selector: "empowered-change-password",
    templateUrl: "./change-password.component.html",
    styleUrls: ["./change-password.component.scss"],
})
export class ChangePasswordComponent implements OnInit, OnDestroy {
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    subscriptions: Subscription[] = [];
    hideConfirmPassword = true;
    hidePassword = true;
    form: FormGroup;
    userData: Credential;
    errorMessage = "";
    error = false;
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
    lengthValidation: boolean;
    caseValidation: boolean;
    numberValidation: boolean;
    specialCharacterValidation: boolean;
    validationRegex: RegexDataType;
    spaceValidation: boolean;
    isPasswordEntered: boolean;
    isNewPasswordDisabled = true;
    isVerifyPasswordDisabled = true;
    PASSWORD_MIN_LENGTH = 8;
    PASSWORD_MAX_LENGTH = 20;
    restrictedPasswords: string[] = [];

    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly fb: FormBuilder,
        private readonly authservice: AuthenticationService,
        private readonly language: LanguageService,
        private readonly store: Store,
        private readonly staticUtilService: StaticUtilService,
    ) {}

    /**
     * fetching secondary languages.
     * Creating form controls.
     * fetching config, regex values.
     */
    ngOnInit(): void {
        this.subscriptions.push(
            this.regex$.subscribe((data) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
                data ? (this.validationRegex = data) : this.store.dispatch(new SetRegex());
            }),
        );
        /**
         * doing this here instead of the constructor because
         * it only needs to be called once upon initialization
         */
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.forgotPassword.*"));
        this.userData = JSON.parse(sessionStorage.getItem("userInfo"));
        this.form = this.fb.group(
            {
                password: ["", [Validators.maxLength(this.PASSWORD_MAX_LENGTH), Validators.required]],
                confirmPassword: ["", [Validators.maxLength(this.PASSWORD_MAX_LENGTH), Validators.required]],
                updateOn: "blur",
            },
            {
                validators: this.password.bind(this),
            },
        );
        this.subscriptions.push(
            this.staticUtilService.cacheConfigValue(ConfigName.BLACK_LIST_PASSWORDS).subscribe((configValue) => {
                this.restrictedPasswords = configValue && configValue !== "" ? configValue.split(",") : [];
            }),
        );
    }
    /** *
     * @returns FormControl of confirm password
     * Abstracting password as it's used multiple places
     */
    get passwordAliases(): FormControl {
        return this.form.get(PASSWORD) as FormControl;
    }
    /** *
     * @returns FormControl of confirm password
     * Abstracting confirmPassword as it's used multiple places
     */
    get confirmPasswordAliases(): FormControl {
        return this.form.get(CONFIRM_PASSWORD) as FormControl;
    }
    /** *
     * @returns Validator object or null
     * Password and confirm password match related validation
     */
    password(formGroup: FormGroup): Validators {
        const { value: password } = formGroup.get(PASSWORD);
        const { value: confirmPassword } = formGroup.get(CONFIRM_PASSWORD);
        if (password !== "" && confirmPassword !== "") {
            if (password !== confirmPassword) {
                this.confirmPasswordAliases.setErrors({
                    isVerifyPasswordValid: true,
                });
            } else {
                this.confirmPasswordAliases.setErrors(null);
            }
        }
        return password === confirmPassword ? null : { isVerifyPasswordValid: true };
    }
    /** *
     * reducing this.form.controls in template for accessing property values
     */
    get formControl(): FormGroup["controls"] {
        return this.form.controls;
    }
    /** *
     * once you focus out from new password field it will validate new password field and display error
     * if new password field empty it will hide password suggestion text
     */
    focusoutForNewPassword(): void {
        this.isFocusOut = true;
        this.confirmPasswordAliases.disable();
        if (this.passwordAliases.value !== "") {
            if (
                !this.lengthValidation ||
                !this.caseValidation ||
                !this.numberValidation ||
                !this.specialCharacterValidation ||
                !this.spaceValidation
            ) {
                this.isVerifyPasswordDisabled = true;
                this.passwordAliases.setErrors({
                    isNewPasswordValid: true,
                });
                this.confirmPasswordAliases.patchValue("");
            } else {
                this.isVerifyPasswordDisabled = false;
                this.confirmPasswordAliases.enable();
                this.passwordAliases.setErrors(null);
            }
        } else {
            this.resetValidation();
            this.isPasswordEntered = false;
            this.confirmPasswordAliases.patchValue("");
        }
    }
    /** *
     *  validating New password field value on change event
     */
    checkForNewPasswordValidation(): void {
        this.error = false;
        this.errorMessage = "";
        let newPassword = this.form.controls[PASSWORD].value;
        const passwordRegex = new RegExp(this.validationRegex.SPECIAL_CHARACTER_PASSWORD_VALIDATION);
        if (newPassword !== "") {
            if (!passwordRegex.test(newPassword)) {
                newPassword = newPassword.substring(0, newPassword.length - 1);
                this.form.controls[PASSWORD].patchValue(newPassword);
            }

            this.isFocusOut = false;
            this.lengthValidation = newPassword.length >= this.PASSWORD_MIN_LENGTH && newPassword.length <= this.PASSWORD_MAX_LENGTH;
            this.caseValidation =
                newPassword.match(new RegExp(this.validationRegex.LOWERCASE_VALIDATION)) &&
                newPassword.match(new RegExp(this.validationRegex.UPPERCASE_VALIDATION));
            this.numberValidation = newPassword.match(new RegExp(this.validationRegex.NUMBER_VALIDATION));
            this.specialCharacterValidation = newPassword.match(new RegExp(this.validationRegex.SPECIAL_CHARACTER_VALIDATION));
            this.spaceValidation = !newPassword.match(new RegExp(this.validationRegex.SPACE_VALIDATION));
        } else {
            this.resetValidation();
        }
    }
    /** *
     *  display new passwords rules text when user focus in new password input filed
     */
    isNewPasswordEntered(): void {
        this.isPasswordEntered = true;
    }
    /** *
     * if new password field empty reset both password fields
     */
    resetValidation(): void {
        this.isFocusOut = undefined;
        this.lengthValidation = undefined;
        this.caseValidation = undefined;
        this.numberValidation = undefined;
        this.specialCharacterValidation = undefined;
        this.spaceValidation = undefined;
    }
    /**
     * method to change password on form submit if form is valid and navigate to change password success page
     * display error for incorrect password values
     */
    onSubmit(): void {
        if (this.form.invalid || this.validateRestrictedPassword()) {
            return;
        }
        if (this.form.controls.password.value !== this.form.controls.confirmPassword.value) {
            this.error = true;
            this.errorMessage = this.secondaryLanguageStrings["secondary.portal.forgotPassword.passwordMismatch"];
        } else {
            const apiSubscription = this.authservice
                .resetPassword(this.form.controls.password.value, localStorage.getItem("authCode"))
                .subscribe(
                    (resp) => {
                        this.error = false;
                        this.router.navigate(["../changePasswordSuccess"], { relativeTo: this.route });
                    },
                    (erroresp) => {
                        this.error = true;
                        if (erroresp.status === ClientErrorResponseCode.RESP_400) {
                            if (erroresp.error.code === ClientErrorResponseType.BAD_PARAMETER) {
                                this.errorMessage = this.secondaryLanguageStrings["secondary.portal.forgotPassword.400.badParameter"];
                            }
                            if (erroresp.error.code === ClientErrorResponseType.HISTORY_MATCH) {
                                this.errorMessage = this.secondaryLanguageStrings["secondary.portal.forgotPassword.400.historyMatch"];
                                this.passwordAliases.setErrors({
                                    isMatchWithPreviousPassword: true,
                                });
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
    }
    /**
     * Validating password with restricted keywords.
     * @returns boolean flag if restricted keyword is included in password.
     */
    validateRestrictedPassword(): boolean {
        const password = this.form.controls[PASSWORD].value;
        const isRestrictedPassword = this.restrictedPasswords.some((value) => password.toLowerCase().includes(value.toLowerCase()));
        if (isRestrictedPassword) {
            this.error = true;
            this.errorMessage = this.secondaryLanguageStrings["secondary.portal.forgotPassword.400.restrictedPassword"];
        }
        return isRestrictedPassword;
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }
}
