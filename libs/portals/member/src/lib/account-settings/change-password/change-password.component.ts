import { Component, OnInit, OnDestroy } from "@angular/core";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { FormBuilder, Validators, FormGroup } from "@angular/forms";
import { MemberService } from "@empowered/api";
import { Observable, Subscription } from "rxjs";
import { UserState } from "@empowered/user";
import { Select, Store } from "@ngxs/store";

import { SharedState, SetRegex, StaticUtilService } from "@empowered/ngxs-store";
import { ClientErrorResponseType, ConfigName, Credential } from "@empowered/constants";

const NEW_PASSWORD = "newPassword";
const CURRENT_PASSWORD = "currentPassword";
const VERIFY_PASSWORD = "verifyPassword";
const DETAILS = "details";
@Component({
    selector: "empowered-change-password",
    templateUrl: "./change-password.component.html",
    styleUrls: ["./change-password.component.scss"],
})
export class ChangePasswordComponent implements OnInit, OnDestroy {
    @Select(UserState) credential$: Observable<Credential>;
    @Select(SharedState.regex) regex$: Observable<any>;
    changePasswordForm: any;
    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
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
        "primary.portal.members.change-password.invalidPasswordFormat",
    ]);
    secondaryLanguageStrings: Record<string, string>;
    hideCurrentPassword = true;
    hideNewPassword = true;
    hideVerifyPassword = true;
    isNewPasswordDisabled = true;
    isVerifyPasswordDisabled = true;
    maxNewPasswordLength = 20;
    isFocusOut: boolean;
    lengthValidation: boolean;
    caseValiadtion: boolean;
    numberValidation: boolean;
    specialCharacterValidation: boolean;
    userProfileValidation: boolean;
    spaceValidation: boolean;
    isPasswordEntered: boolean;
    userData: any;
    isPasswordUpdated: boolean;
    showSpinner: boolean;
    subscription: Subscription;
    validationRegex: any;
    errorMessage = "";
    error = false;
    restrictedPasswords: string[] = [];

    constructor(
        private readonly fb: FormBuilder,
        private readonly languageService: LanguageService,
        private readonly memberService: MemberService,
        private readonly store: Store,
        private readonly staticUtilService: StaticUtilService,
    ) {
        this.regex$.subscribe((data) => {
            if (data) {
                this.validationRegex = data;
            } else {
                this.store.dispatch(new SetRegex());
            }
        });
    }

    /**
     * Creating form controls.
     * fetching config values.
     */
    ngOnInit(): void {
        this.subscription = new Subscription();
        this.createFormControl();
        this.subscription.add(
            this.credential$.subscribe((data) => {
                this.userData = data;
            }),
        );
        this.subscription.add(
            this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*")).subscribe(() => {
                this.getSecondaryLanguageKeys();
            }),
        );
        this.subscription.add(
            this.staticUtilService.cacheConfigValue(ConfigName.BLACK_LIST_PASSWORDS).subscribe((configValue) => {
                this.restrictedPasswords = configValue && configValue !== "" ? configValue.split(",") : [];
            }),
        );
    }
    /**
     * @description getting secondary language array.
     */
    getSecondaryLanguageKeys(): void {
        this.secondaryLanguageStrings = this.languageService.fetchSecondaryLanguageValues([
            "secondary.portal.forgotPassword.400.badParameter",
            "secondary.portal.forgotPassword.400.restrictedPassword",
        ]);
    }
    /**
     * Method to create form control for change password form
     */
    createFormControl(): void {
        this.changePasswordForm = this.fb.group({
            currentPassword: ["", Validators.compose([Validators.maxLength(60), Validators.required])],
            newPassword: [
                { value: "", disabled: this.isNewPasswordDisabled },
                Validators.compose([Validators.maxLength(60), Validators.required]),
            ],
            verifyPassword: [
                { value: "", disabled: this.isVerifyPasswordDisabled },
                Validators.compose([Validators.maxLength(60), Validators.required]),
            ],
        });
    }

    get formControl(): any {
        return this.changePasswordForm.controls;
    }

    /**
     * Checking for current password match.
     */
    checkForCurrentPasswordMatch(): void {
        if (this.formControl[CURRENT_PASSWORD].value !== "") {
            this.formControl[NEW_PASSWORD].enable();
            this.isNewPasswordDisabled = false;
        } else {
            this.formControl[NEW_PASSWORD].disable();
            this.formControl[VERIFY_PASSWORD].disable();
            this.formControl[NEW_PASSWORD].patchValue("");
            this.formControl[VERIFY_PASSWORD].patchValue("");
            this.isNewPasswordDisabled = true;
            this.resetValidation();
            this.isPasswordEntered = false;
        }
    }

    /**
     * Checking new password validations
     */
    checkForNewPasswordValidation(): void {
        this.error = false;
        this.errorMessage = "";
        let newPassword = this.formControl[NEW_PASSWORD].value;
        const passwordRegex = new RegExp(this.validationRegex.SPECIAL_CHARACTER_PASSWORD_VALIDATION);

        if (newPassword !== "") {
            if (!passwordRegex.test(newPassword)) {
                newPassword = newPassword.substring(0, newPassword.length - 1);
                this.formControl[NEW_PASSWORD].patchValue(newPassword);
            }
            this.isFocusOut = false;
            this.lengthValidation = newPassword.length >= 8 && newPassword.length <= 20 ? true : false;
            this.caseValiadtion =
                newPassword.match(new RegExp(this.validationRegex.LOWERCASE_VALIDATION)) &&
                newPassword.match(new RegExp(this.validationRegex.UPPERCASE_VALIDATION))
                    ? true
                    : false;
            this.numberValidation = newPassword.match(new RegExp(this.validationRegex.NUMBER_VALIDATION)) ? true : false;
            this.specialCharacterValidation = newPassword.match(new RegExp(this.validationRegex.SPECIAL_CHARACTER_VALIDATION))
                ? true
                : false;
            this.spaceValidation = newPassword.match(new RegExp(this.validationRegex.SPACE_VALIDATION)) ? false : true;
            this.userProfileValidation = !this.checkForUserProfileValidation(newPassword);
            this.validateVerifyPassword();
        } else {
            this.resetValidation();
        }
    }

    resetValidation(): void {
        this.isFocusOut = undefined;
        this.lengthValidation = undefined;
        this.caseValiadtion = undefined;
        this.numberValidation = undefined;
        this.specialCharacterValidation = undefined;
        this.userProfileValidation = undefined;
        this.spaceValidation = undefined;
    }

    isNewPasswordEntered(): void {
        this.isPasswordEntered = true;
    }

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
    /**
     * @description This function will validate new password field on focusout
     */
    focusoutForNewPassword(): void {
        this.isFocusOut = true;
        this.formControl[VERIFY_PASSWORD].disable();
        if (this.formControl[NEW_PASSWORD].value !== "") {
            if (
                !this.lengthValidation ||
                !this.caseValiadtion ||
                !this.numberValidation ||
                !this.specialCharacterValidation ||
                !this.userProfileValidation ||
                !this.spaceValidation
            ) {
                this.isVerifyPasswordDisabled = true;
                this.formControl[NEW_PASSWORD].setErrors({
                    invalidPasswordFormat: true,
                });
                this.formControl[VERIFY_PASSWORD].patchValue("");
            } else {
                this.isVerifyPasswordDisabled = false;
                this.formControl[VERIFY_PASSWORD].enable();
                this.formControl[NEW_PASSWORD].setErrors(null);
            }
        } else {
            this.resetValidation();
            this.isPasswordEntered = false;
            this.formControl[VERIFY_PASSWORD].patchValue("");
        }
        this.validateVerifyPassword();
    }

    /**
     * Validating verify password.
     */
    validateVerifyPassword(): void {
        const newPassword = this.formControl[NEW_PASSWORD].value;
        const verifyPassword = this.formControl[VERIFY_PASSWORD].value;
        if (newPassword !== "" && verifyPassword !== "") {
            if (newPassword !== verifyPassword) {
                this.formControl[VERIFY_PASSWORD].setErrors({
                    isVerifyPasswordValid: true,
                });
            } else {
                this.formControl[VERIFY_PASSWORD].setErrors(null);
            }
        }
    }

    /**
     * Validating password with restricted keywords.
     * @returns boolean flag if restricted keyword is included in password.
     */
    validateRestrictedPassword(): boolean {
        const password = this.formControl[NEW_PASSWORD].value;
        const isRestrictedPassword = this.restrictedPasswords.some((value) => password.toLowerCase().includes(value.toLowerCase()));
        if (isRestrictedPassword) {
            this.error = true;
            this.errorMessage = this.secondaryLanguageStrings["secondary.portal.forgotPassword.400.restrictedPassword"];
        }
        return isRestrictedPassword;
    }

    /**
     * Triggering change password service.
     */
    changePassword(): void {
        this.validateAllFormFields(this.changePasswordForm);
        if (this.changePasswordForm.valid && !this.validateRestrictedPassword()) {
            this.isPasswordEntered = false;
            this.showSpinner = true;
            this.subscription.add(
                this.memberService
                    .changePassword({
                        currentPassword: this.formControl[CURRENT_PASSWORD].value,
                        newPassword: this.formControl[NEW_PASSWORD].value,
                    })
                    .subscribe(
                        (data) => {
                            this.showSpinner = false;
                            this.isPasswordUpdated = true;
                            this.changePasswordForm.reset();
                            this.isNewPasswordDisabled = true;
                            this.isVerifyPasswordDisabled = true;
                            this.createFormControl();
                        },
                        (error) => {
                            this.isPasswordEntered = true;
                            this.error = true;
                            if (
                                error.error.code === ClientErrorResponseType.NOT_FOUND ||
                                (error.error[DETAILS] && error.error[DETAILS].length && error.error[DETAILS][0].field === CURRENT_PASSWORD)
                            ) {
                                this.formControl[CURRENT_PASSWORD].setErrors({
                                    wrongCurrentPassword: true,
                                });
                                this.error = false;
                            }
                            if (error.error.code === ClientErrorResponseType.BAD_PARAMETER) {
                                this.errorMessage = this.secondaryLanguageStrings["secondary.portal.forgotPassword.400.badParameter"];
                            }
                            if (error.error.code === ClientErrorResponseType.HISTORY_MATCH) {
                                this.formControl[VERIFY_PASSWORD].disable();
                                this.formControl[VERIFY_PASSWORD].patchValue("");
                                this.formControl[NEW_PASSWORD].setErrors({
                                    isMatchWithPreviousPassword: true,
                                });
                                this.error = false;
                            }
                            this.showSpinner = false;
                        },
                    ),
            );
        }
    }

    validateAllFormFields(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((field) => {
            const control = formGroup.get(field);
            if (control["controls"]) {
                for (const subField in control["controls"]) {
                    if (subField) {
                        control["controls"][subField].markAsTouched({ onlySelf: true });
                    }
                }
            } else {
                control.markAsTouched({ onlySelf: true });
            }
        });
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}
