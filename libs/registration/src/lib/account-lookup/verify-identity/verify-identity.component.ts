import { Component, OnInit } from "@angular/core";
import { AbstractControl, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthenticationService } from "@empowered/api";
import { Store } from "@ngxs/store";
import { CookieService } from "ngx-cookie-service";
import { AppSettings } from "@empowered/constants";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";

@Component({
    selector: "empowered-verify-identity",
    templateUrl: "./verify-identity.component.html",
    styleUrls: ["./verify-identity.component.scss"],
})
export class VerifyIdentityComponent implements OnInit {
    communicationModeNotSet = true;
    partnerId: number;
    form: FormGroup;
    items: Array<any> = [
        { label: "Text", value: "phone" },
        { label: "Email", value: "email" },
    ];
    error = false;
    errorMsg = "";
    aflacPartner = AppSettings.AFLAC_PARTNER_ID;
    textConfigKey: string;
    languageStrings = this.language.fetchPrimaryLanguageValues(["primary.portal.register.aflacPartner.verifyIdentitySubtitle"]);
    isSelfService = false;
    constructor(
        private readonly fb: FormBuilder,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly _authService: AuthenticationService,
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly cookieService: CookieService,
    ) {}

    get f(): { [key: string]: AbstractControl } {
        return this.form.controls;
    }

    /**
     * Creating form group for Verify method email or phone, fetching error messages
     * and creating text config key based on portal
     */
    ngOnInit(): void {
        this.form = this.fb.group({
            verifyMethod: ["", Validators.required],
        });
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        /* TODO - Cookie logic revisit */
        this.partnerId = parseInt(this.cookieService.get("partnerId"), 10);
        // Accessing portal from route as SharedService.userPortal$ will return type: public as user has not yet logged in.
        if (this.router.url.indexOf("/producer") === 0) {
            this.textConfigKey = "producer.auth.enable.text_registration";
        } else if (this.router.url.indexOf("/admin") === 0) {
            this.textConfigKey = "admin.auth.enable.text_registration";
        } else if (this.router.url.indexOf("/member") === 0) {
            this.textConfigKey = "member.auth.enable.text_registration";
        }
        this.isSelfService = this.router.url.indexOf("/self-service") !== -1;
    }

    updateSelection(): void {
        this.error = false;
    }

    onSubmit(): void {
        // Updates the value of registration form
        // eslint-disable-next-line no-underscore-dangle
        this._authService.formValue?.next(1);
        if (!this.form.valid) {
            this.error = true;
            this.errorMsg = "primary.portal.common.selectionRequired";
        } else {
            this.error = false;
            if (this.form.value["verifyMethod"] === "Text") {
                this.router.navigate(["../2/phone"], { relativeTo: this.route });
            } else {
                this.router.navigate(["../2/email"], { relativeTo: this.route });
            }
        }
    }

    setcommunicationMode(): void {
        this.communicationModeNotSet = false;
    }
}
