import { Component, OnInit } from "@angular/core";
import { AbstractControl, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Store } from "@ngxs/store";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";

@Component({
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: "mon-forgot-username-verify-identity",
    templateUrl: "./verify-identity.component.html",
    styleUrls: ["./verify-identity.component.scss"],
})
export class VerifyIdentityComponent implements OnInit {
    communicationModeNotSet = true;
    error = false;
    errorMsg = "";
    // @Select(ForgotUsernameState.errorMessage) errorMessage$: Observable<string>;
    form: FormGroup;
    items: Array<any> = [
        { label: "Text", value: "phone" },
        { label: "Email", value: "email" },
    ];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.forgotUsername.email",
        "primary.portal.login.text",
        "primary.portal.common.next",
        "primary.portal.login.forgotPassword",
        "primary.portal.common.back",
        "primary.portal.forgotUsername.chooseMethod",
    ]);

    constructor(
        private readonly store: Store,
        private readonly fb: FormBuilder,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly language: LanguageService,
    ) {}

    get f(): { [key: string]: AbstractControl } {
        return this.form.controls;
    }

    ngOnInit(): void {
        this.form = this.fb.group({
            verifyMethod: ["", Validators.required],
        });
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.forgotUsername.*"));
    }

    updateSelection(): void {
        this.error = false;
    }
    onSubmit(): void {
        if (this.form.invalid) {
            this.error = true;
            this.errorMsg = "primary.portal.common.selectionRequired";
        } else {
            // FIXME - This should be in stepper
            this.error = false;
            if (this.form.value["verifyMethod"] === "Text") {
                this.router.navigate(["../verifyMethod/phone"], { relativeTo: this.route });
            } else {
                this.router.navigate(["../verifyMethod/email"], { relativeTo: this.route });
            }
        }
    }

    setcommunicationMode(): void {
        this.communicationModeNotSet = false;
    }
}
