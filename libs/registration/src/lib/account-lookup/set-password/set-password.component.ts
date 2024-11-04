import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthenticationService } from "@empowered/api";
import { Store, Select } from "@ngxs/store";
import { Subscription, Observable } from "rxjs";

import {
    RegistrationState,
    RegistrationStateModel,
    SharedState,
    RegexDataType,
    SetIncompleteRegistrationAlert,
    SetRegex,
    StaticUtilService,
} from "@empowered/ngxs-store";

import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { ClientErrorResponseCode, ClientErrorResponseType, ConfigName } from "@empowered/constants";

const PASSWORD = "password";
const CONFIRM_PASSWORD = "confirmPassword";

@Component({
    selector: "empowered-set-password",
    templateUrl: "./set-password.component.html",
    styleUrls: ["./set-password.component.scss"],
})
export class SetPasswordComponent implements OnInit, OnDestroy {
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    subscriptions: Subscription[] = [];
    createPasswordhide = true;
    confirmPasswordhide = true;
    form: FormGroup;
    mfaCheck = false;
    authCode;
    userName;
    apiSubscription: Subscription;
    userData: RegistrationStateModel;
    error = false;
    errorMessage = "";
    accountUserName = "";
    fieldErrorFlag = false;
    passwordErrorMsg;
    confirmPasswordMsg;
    saveError = false;
    incompleteRegistrationError: string;
    loadSpinner = false;
    isFocusOut: boolean;
    lengthValidation: boolean;
    caseValidation: boolean;
    numberValidation: boolean;
    specialCharacterValidation: boolean;
    validationRegex: RegexDataType;
    spaceValidation: boolean;
    userProfileValidation: boolean;
    isPasswordEntered: boolean;
    isNewPasswordDisabled = true;
    isVerifyPasswordDisabled = true;
    PASSWORD_MIN_LENGTH = 8;
    PASSWORD_MAX_LENGTH = 20;
    restrictedPasswords: string[] = [];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.forgotPassword.confirmPasswordAgain",
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
        "primary.portal.register.setPassword.createPassword",
        "primary.portal.register.setPassword.confirmPassword",
        "primary.portal.common.next",
        "primary.portal.common.back",
    ]);

    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly fb: FormBuilder,
        private readonly _authservice: AuthenticationService,
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly staticUtilService: StaticUtilService,
    ) {}

    /**
     * This function is used to initialize all the variables at the time of component loading.
     * @returns Nothing
     */
    ngOnInit(): void {
        this.subscriptions.push(
            this.regex$.subscribe((data) => {
                if (data) {
                    this.validationRegex = data;
                } else {
                    this.store.dispatch(new SetRegex());
                }
            }),
        );
        this.subscriptions.push(
            this.staticUtilService.cacheConfigValue(ConfigName.BLACK_LIST_PASSWORDS).subscribe((configValue) => {
                this.restrictedPasswords = configValue && configValue !== "" ? configValue.split(",") : [];
            }),
        );
        this.userData = JSON.parse(sessionStorage.getItem("RegistrationState"));
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        // eslint-disable-next-line no-underscore-dangle
        if (this._authservice.formValue.value < 3) {
            this.saveError = true;
            this.store.dispatch(new SetIncompleteRegistrationAlert(this.saveError));
            this.router.navigate(["/member/login"], { relativeTo: this.route });
        } else {
            this.userName = this.store.selectSnapshot(RegistrationState.userName);
            this.accountUserName = this.store.selectSnapshot(RegistrationState.accountUserName);
            this.form = this.fb.group(
                {
                    password: ["", [Validators.required, Validators.maxLength(this.PASSWORD_MAX_LENGTH)]],
                    confirmPassword: ["", [Validators.required, Validators.maxLength(this.PASSWORD_MAX_LENGTH)]],
                    mfaPreferred: [""],
                    updateOn: "blur",
                },
                {
                    validators: this.checkPassword.bind(this),
                },
            );
            this.authCode = localStorage.getItem("authCode");
        }
    }
    /** *
     * Password and confirm password match related validation
     * @param formGroup {FormGroup} FormGroup
     * @returns Validators object or null
     */
    checkPassword(formGroup: FormGroup): Validators {
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
                !this.userProfileValidation ||
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
        let newPassword = this.passwordAliases.value;
        const passwordRegex = new RegExp(this.validationRegex.SPECIAL_CHARACTER_PASSWORD_VALIDATION);
        if (newPassword !== "") {
            if (!passwordRegex.test(newPassword)) {
                newPassword = newPassword.substring(0, newPassword.length - 1);
                this.passwordAliases.patchValue(newPassword);
            }
            this.isFocusOut = false;
            this.lengthValidation = newPassword.length >= this.PASSWORD_MIN_LENGTH && newPassword.length <= this.PASSWORD_MAX_LENGTH;
            this.caseValidation =
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
     * validating New password field value contains username, first name and last name
     * user can not use his/her username, first name or last name in new password input field
     */
    checkForUserProfileValidation(newPassword: string): boolean {
        if (
            newPassword.includes(this.userData.accountUserName) ||
            newPassword.includes(this.userData.userName.firstName) ||
            newPassword.includes(this.userData.userName.lastName)
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
     * if new password field empty reset both password fields
     */
    resetValidation(): void {
        this.isFocusOut = undefined;
        this.lengthValidation = undefined;
        this.caseValidation = undefined;
        this.numberValidation = undefined;
        this.specialCharacterValidation = undefined;
        this.userProfileValidation = undefined;
        this.spaceValidation = undefined;
    }
    /** *
     * New set password on form submit if form is valid and navigating consent page
     * @returns Nothing
     */
    onSubmit(): void {
        if (this.form.invalid || this.validateRestrictedPassword()) {
            return;
        }
        // eslint-disable-next-line no-underscore-dangle
        this._authservice.formValue.next(4);
        this.fieldErrorFlag = false;
        const consented = JSON.parse(sessionStorage.getItem("consented"));
        this.loadSpinner = true;
        // eslint-disable-next-line no-underscore-dangle
        this.apiSubscription = this._authservice.setPassword(this.form.controls.password.value, this.authCode, this.mfaCheck).subscribe(
            (x) => {
                this.loadSpinner = false;
                if (x.status === 204) {
                    if (consented) {
                        this.router.navigate(["../../login"], { relativeTo: this.route });
                    } else {
                        this.router.navigate(["../consent"], { relativeTo: this.route });
                    }
                }
            },
            (error: any) => {
                this.loadSpinner = false;
                this.error = true;
                if (error.status === ClientErrorResponseCode.RESP_400) {
                    if (error.error.code === ClientErrorResponseType.BAD_PARAMETER) {
                        this.errorMessage = "secondary.portal.register.setPassword.badParameter";
                    } else if (error.error.code === ClientErrorResponseType.HISTORY_MATCH) {
                        this.errorMessage = "secondary.portal.register.setPassword.historyMatch";
                    } else {
                        this.errorMessage = "secondary.portal.register.setPassword.badParameter";
                    }
                } else if (
                    error.status === ClientErrorResponseCode.RESP_401 &&
                    error.statusText === ClientErrorResponseType.NOT_AUTHORIZED
                ) {
                    this.errorMessage = "secondary.portal.register.setPassword.notAuthorized";
                } else if (error.status === ClientErrorResponseCode.RESP_403 && error.statusText === ClientErrorResponseType.SSO_REQUIRED) {
                    this.errorMessage = "secondary.portal.register.setPassword.ssoRequired";
                } else {
                    this.errorMessage = `secondary.api.${error.status}.${error.code}`;
                }
            },
        );
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
            this.errorMessage = "secondary.portal.forgotPassword.400.restrictedPassword";
        }
        return isRestrictedPassword;
    }
    /** *
     * @returns void
     * Verify My Identity Always when log in
     *
     */
    mfaPrefferedCheck(): void {
        this.mfaCheck = !this.mfaCheck;
    }

    ngOnDestroy(): void {
        if (this.apiSubscription !== undefined) {
            this.apiSubscription.unsubscribe();
        }
        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
    }
}
