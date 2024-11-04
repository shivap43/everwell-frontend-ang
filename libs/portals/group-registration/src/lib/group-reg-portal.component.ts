import { StaticUtilService } from "@empowered/ngxs-store";
import { RegexForFieldValidation } from "@empowered/ui";
import { LanguageService } from "@empowered/language";
import { OnDestroy } from "@angular/core";
import { of, Subscription } from "rxjs";
import { AuthenticationService, MemberService } from "@empowered/api";
import { CsrfService } from "@empowered/util/csrf";
import { FormGroup, Validators, FormControl, FormBuilder, ValidationErrors } from "@angular/forms";
import { Component, OnInit } from "@angular/core";
import { retry, switchMap, catchError, tap } from "rxjs/operators";
import { PortalType } from "@empowered/constants";

const API_RETRY = 3;

@Component({
    selector: "empowered-group-reg-portal",
    templateUrl: "./group-reg-portal.component.html",
})
export class GroupRegPortalComponent implements OnInit, OnDestroy {
    readonly USERNAME_CONFIG = "groupportal.username.default";
    readonly PASSWORD_CONFIG = "groupportal.password.default";
    groupRegForm: FormGroup;
    showAlert = false;
    isGroupNumValid = true;
    loader = false;
    errorMessage: string;
    errorMsg: string;
    showSuccessAlert = false;
    successMessage: string;
    isError = false;
    username: string;
    password: string;
    subscriptions: Subscription[] = [];
    loginForm: FormGroup = this.fb.group({
        username: [""],
        password: [""],
    });
    languageStrings: Record<string, string>;
    loaderFlag = false;
    portal: string = PortalType.PRODUCER;

    constructor(
        private readonly csrfService: CsrfService,
        private readonly memberService: MemberService,
        private readonly auth: AuthenticationService,
        private readonly fb: FormBuilder,
        private readonly languageService: LanguageService,
        private readonly staticUtilService: StaticUtilService,
    ) {}

    ngOnInit(): void {
        this.languageStrings = this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.groupreg.title",
            "primary.portal.groupreg.groupnum.label",
            "primary.portal.groupreg.button.submit",
            "primary.portal.groupreg.groupNumRequired",
            "primary.portal.groupreg.groupNumRestriction",
            "primary.portal.groupreg.genericerror",
            "primary.portal.groupreg.successmsg",
            "primary.portal.groupreg.errormsg",
        ]);
        this.groupRegForm = this.fb.group({
            groupNumber: this.fb.control("", [Validators.required, this.checkGroupNum.bind(this)]),
        });
        /**
         * Test credentials based on env from config
         */
        this.subscriptions.push(
            this.staticUtilService.cacheConfigValue(this.USERNAME_CONFIG).subscribe((response) => {
                if (response && response.length) {
                    this.username = response;
                }
            }),
        );
        this.subscriptions.push(
            this.staticUtilService.cacheConfigValue(this.PASSWORD_CONFIG).subscribe((response) => {
                if (response && response.length) {
                    this.password = response;
                }
            }),
        );
    }

    /**
     * Returning an error message based on the type of error
     * @param inputType
     * @returns string
     */
    getErrorGroup(inputType: string): string | undefined {
        if (this.groupRegForm.get(inputType).hasError("required")) {
            return this.languageStrings["primary.portal.groupreg.groupNumRequired"];
        }
        if (this.groupRegForm.get(inputType).hasError("requirements")) {
            return this.languageStrings["primary.portal.groupreg.groupNumRestriction"];
        }
        return undefined;
    }

    /**
     * if invalid group form, return false else login the auto-register the members in the group
     */
    onSubmit(): void {
        this.loaderFlag = true;
        this.showSuccessAlert = false;
        this.showAlert = false;
        if (this.groupRegForm.invalid) {
            this.isGroupNumValid = false;
            this.loaderFlag = false;
        } else {
            this.loginAndRegister();
        }
    }

    /**
     * Group num is required and in the REGEX format
     * @param control
     */
    checkGroupNum(control: FormControl): ValidationErrors | null {
        const enteredGroupNum: string = control.value;
        const groupNumCheck = RegexForFieldValidation.GROUP;
        return !groupNumCheck.test(enteredGroupNum) && enteredGroupNum ? { requirements: true } : null;
    }

    /**
     * Logs in as the test producer and registers all the members in the group
     */
    loginAndRegister(): void {
        this.subscriptions.push(
            this.csrfService
                .load()
                .pipe(
                    retry(API_RETRY),
                    switchMap((res) => {
                        (this.loginForm as FormGroup).setValue({
                            username: this.username,
                            password: this.password,
                        });
                        const formData = this.loginForm.value;
                        return this.auth.login(this.portal, formData);
                    }),
                    switchMap((res) => this.csrfService.load()),
                    switchMap((res) => this.memberService.registerAccountMembers(this.groupRegForm.value.groupNumber)),
                    tap((res) => {
                        this.loader = false;
                        this.showSuccessAlert = true;
                        this.errorMsg = this.languageStrings["primary.portal.groupreg.successmsg"];
                        this.loaderFlag = false;
                    }),
                    switchMap((res) => this.csrfService.logOut().pipe(retry(API_RETRY))),
                    catchError((error) => {
                        this.showAlert = true;
                        this.errorMsg = this.languageStrings["primary.portal.groupreg.errormsg"];
                        this.loaderFlag = false;
                        return of(error);
                    }),
                )
                .subscribe(),
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((subs) => subs.unsubscribe());
    }
}
