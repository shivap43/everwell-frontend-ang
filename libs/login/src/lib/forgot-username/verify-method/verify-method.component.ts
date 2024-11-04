import { Component, OnDestroy, OnInit } from "@angular/core";
import { AbstractControl, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthenticationService } from "@empowered/api";
import { PhoneNumber } from "@empowered/constants";
import { LanguageService } from "@empowered/language";

import { SharedState, RegexDataType, SetRegex } from "@empowered/ngxs-store";
import { Select, Store } from "@ngxs/store";
import { Observable, Subject } from "rxjs";
import { finalize, first, flatMap, takeUntil, tap } from "rxjs/operators";

@Component({
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: "mon-forgot-username-verify-method",
    templateUrl: "./verify-method.component.html",
    styleUrls: ["./verify-method.component.scss"],
})
export class VerifyMethodComponent implements OnInit, OnDestroy {
    form: FormGroup;
    selectedId: any;
    verifyMethod;
    contact;
    email;
    phone;
    errorMessage = false;
    errMsg;
    validationRegex: RegexDataType;
    private readonly unsubscribe$ = new Subject<void>();
    readonly PHONE_NUMBER_MAX_LENGTH = PhoneNumber.MAX_LENGTH;

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.forgotUsername.emailAddress",
        "primary.portal.forgotUsername.phone",
        "primary.portal.common.submit",
        "primary.portal.common.back",
    ]);

    @Select(SharedState.regex) regex$: Observable<RegexDataType>;

    constructor(
        private readonly store: Store,
        private readonly fb: FormBuilder,
        private readonly route: ActivatedRoute,
        private readonly authenticationService: AuthenticationService,
        private readonly router: Router,
        private readonly language: LanguageService,
    ) {}

    get f(): { [key: string]: AbstractControl } {
        return this.form.controls;
    }

    /*
     * To get regex values and retrieve verify method
     */
    ngOnInit(): void {
        this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => {
            if (params["id"] === "email") {
                this.verifyMethod = "email";
            } else {
                this.verifyMethod = "phone";
            }
        });

        this.store
            .dispatch(new SetRegex())
            .pipe(
                flatMap((data) => this.regex$),
                takeUntil(this.unsubscribe$),
                tap((regexData) => (this.validationRegex = regexData)),
                first(),
                finalize(() => this.initializeForm()),
            )
            .subscribe();
    }

    handleEmptyInput(event: any): any {
        this.errorMessage = false;
    }
    /*
     * To initialize the form
     */
    initializeForm(): void {
        if (this.verifyMethod === "phone") {
            this.form = this.fb.group(
                {
                    phone: ["", [Validators.required, Validators.pattern(new RegExp(this.validationRegex.VALID_PHONE))]],
                },
                { updateOn: "blur" },
            );
        } else {
            this.form = this.fb.group(
                {
                    email: ["", [Validators.required, Validators.pattern(this.validationRegex.EMAIL)]],
                },
                { updateOn: "blur" },
            );
        }
    }
    /**
     * Method to verify contact info
     */
    onSubmit(): void {
        if (this.form.invalid) {
            this.errorMessage = true;
            if (this.verifyMethod === "email") {
                this.errMsg = "Enter valid email";
            } else {
                this.errMsg = "Enter valid phone number";
            }
            return;
        }
        if (this.verifyMethod === "email" && this.form.value["email"].length < 1) {
            this.errMsg = "Email ID is mandatory";
            this.errorMessage = true;
        } else if (this.verifyMethod === "phone" && this.form.value["phone"].length < 1) {
            this.errMsg = "Phone number is mandatory";
            this.errorMessage = true;
        } else {
            if (this.verifyMethod === "email") {
                this.contact = this.form.value["email"];
            } else {
                this.contact = this.form.value["phone"];
            }
            // api call to send username to the contact details provided
            this.authenticationService
                .forgotUsername(this.verifyMethod, this.contact)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    () => {
                        localStorage.setItem("contact", this.contact);

                        // on success navigate to verify username component with appropriate verfication mode set
                        this.router.navigate(["../../usernameSent/", this.verifyMethod], { relativeTo: this.route });
                    },
                    () => {
                        this.router.navigate(["../../usernameSent/invalid"], { relativeTo: this.route });
                    },
                );
        }
    }
    /**
     * Unsubscribes from observables
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
