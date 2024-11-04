import { Component, OnInit, Output, EventEmitter, OnDestroy } from "@angular/core";
import { StaticService } from "@empowered/api";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { Select, Store } from "@ngxs/store";
import { Observable, Subject } from "rxjs";
import { AppSettings, Gender } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { MatDialogRef } from "@angular/material/dialog";
import { Router, ActivatedRoute } from "@angular/router";
import { SharedState, AccountListState, SetGenericUserInfo } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";
import { takeUntil } from "rxjs/operators";

@Component({
    selector: "empowered-enrollment-info-popup",
    templateUrl: "./enrollment-info-popup.component.html",
    styleUrls: ["./enrollment-info-popup.component.scss"],
})
export class EnrollmentInfoPopupComponent implements OnInit, OnDestroy {
    @Select(SharedState.regex) regex$: Observable<any>;
    @Output() backClickEvent = new EventEmitter<boolean>();

    employeeStates: any;
    gender = [Gender.MALE, Gender.FEMALE, Gender.UNKNOWN];
    form: FormGroup;
    validationRegex: any;
    isFormSubmit = false;
    zipFlag = false;
    minimumSubscriberAge: any;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.direct.addCustomer.employeeMinAge",
        "primary.portal.enrollmentInfoPopup.step2",
        "primary.portal.enrollmentInfoPopup.addEmployeeInfo",
        "primary.portal.census.manualEntry.city",
        "primary.portal.census.manualEntry.zip",
        "primary.portal.common.optional",
        "primary.portal.common.invalidDateFormat",
        "primary.portal.common.requiredField",
        "primary.portal.census.manualEntry.birthdate",
        "primary.portal.common.cancel",
        "primary.portal.common.next",
        "primary.portal.common.back",
    ]);
    today = new Date();
    mpGroupId: any;
    maxLength = AppSettings.CALENDAR_MAX_LEN;
    isDateValid = false;
    showEnrollmentInfoPopup: boolean;
    routerAfterLogin: string;
    mpGroup: any;
    formControls = ["birthDate", "genderName", "state", "zip"];
    mpGroupObj: any;
    private readonly unsubscribe$ = new Subject<void>();

    constructor(
        private readonly staticService: StaticService,
        private readonly language: LanguageService,
        private readonly fb: FormBuilder,
        private readonly store: Store,
        private readonly EnrollmentInfoDialogRef: MatDialogRef<EnrollmentInfoPopupComponent>,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly dateService: DateService,
    ) {}

    ngOnInit(): void {
        this.mpGroupObj = this.store.selectSnapshot(AccountListState.getGroup);
        this.mpGroup = this.mpGroupObj.id;
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                this.validationRegex = data;
            }
        });
        this.form = this.fb.group({
            birthDate: ["", Validators.required],
            genderName: ["", Validators.required],
            city: [""],
            state: ["", [Validators.required, Validators.pattern(this.validationRegex.STATE)]],
            zip: ["", [Validators.required, Validators.pattern(this.validationRegex.ZIP_CODE)]],
        });
        this.getEmployeeState();
        this.isDateValid = true;
        this.getConfig();
        this.routerAfterLogin = this.store.selectSnapshot(SharedState.routeAfterLogin);
    }
    getEmployeeState(): void {
        this.staticService
            .getStates()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((states) => {
                this.employeeStates = states;
            });
    }
    saveInfoToStore(): void {
        this.isFormSubmit = true;
        if (this.form.valid) {
            const memberInfoObject: any = {
                birthDate: this.form.controls.birthDate.value,
                gender: this.form.controls.genderName.value,
                state: this.form.controls.state.value,
                zip: this.form.controls.zip.value,
                city: this.form.controls.city.value,
            };

            this.store.dispatch(new SetGenericUserInfo(memberInfoObject));
            this.closePopup();
            if (this.router.url.indexOf("direct") >= 0) {
                this.router.navigate(
                    // [`../../../enrollment/direct/quote-shop/${this.mpGroup}/specific/${customerId}`],
                    [this.routerAfterLogin + "/direct/enrollment/quote-shop/" + this.mpGroup + "/generic"],
                    {
                        relativeTo: this.route,
                    },
                );
            } else {
                this.router.navigate(
                    [this.routerAfterLogin + "/payroll/" + this.mpGroup + "/employees/enrollment/quote-shop/" + this.mpGroup + "/generic"],
                    {
                        relativeTo: this.route,
                    },
                );
            }
        } else {
            this.formControls.forEach((control) => {
                if (!this.form.controls[control].value) {
                    this.form.controls[control].markAsTouched();
                }
            });
        }
    }
    checkZipCode(value: string): void {
        if (value.length === 5 && this.form.value.state !== "") {
            this.staticService
                .validateStateZip(this.form.value.state, value)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (response) => {
                        if (response.status === AppSettings.API_RESP_204) {
                            this.zipFlag = false;
                        }
                    },
                    (error) => {
                        if (error.status === AppSettings.API_RESP_400) {
                            this.zipFlag = true;
                        }
                    },
                );
        }
    }
    /**
     * get error message for employee form data
     * @param formControlName form control data
     * @returns error message
     */
    getEmployeeFormErrorMessage(formControlName: string): string {
        if (formControlName === "genderName" || formControlName === "state") {
            return this.form.controls[formControlName].errors && this.form.controls[formControlName].errors.required
                ? "primary.portal.common.selectionRequired"
                : "";
        }
        return this.form.controls[formControlName].errors && this.form.controls[formControlName].errors.required
            ? "primary.portal.common.requiredField"
            : "";
    }
    /**
     * get error message for form data
     * @param control form control data
     * @returns error message
     */
    getErrorMessages(control: string): string {
        if (this.isFormSubmit && !this.form.controls[control].value) {
            this.form.controls[control].markAsTouched();
            return "primary.portal.common.requiredField";
        }
        return this.form.controls[control].hasError("pattern") ? "secondary.portal.census.manualEntry.validName" : "";
    }
    validateDate(event: any): string {
        this.form.controls.birthDate.setErrors({ invalid: true });
        const dateInput = this.dateService.toDate(this.form.controls["birthDate"].value);
        if (this.isFormSubmit && !this.form.controls["birthDate"].value) {
            return this.languageStrings["primary.portal.common.requiredField"];
        }
        if ((this.form.controls["birthDate"].value === null || this.form.controls["birthDate"].value === "") && event !== "") {
            return this.languageStrings["primary.portal.common.invalidDateFormat"];
        }
        if (dateInput <= this.today && !(dateInput.getMonth() + 1 && dateInput.getDate() && dateInput.getFullYear())) {
            return this.languageStrings["primary.portal.common.invalidDateFormat"];
        }
        if (this.today.getFullYear() - dateInput.getFullYear() < this.minimumSubscriberAge) {
            return this.languageStrings["primary.portal.direct.addCustomer.employeeMinAge"].replace(
                "#minSubscriberAge",
                this.minimumSubscriberAge,
            );
        }
        this.form.controls.birthDate.setErrors(null);
        return null;
    }
    getConfig(): void {
        this.staticService
            .getConfigurations("general.data.minimum_subscriber_age", this.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp: any) => {
                this.minimumSubscriberAge = resp[0].value;
            });
    }

    closePopup(): void {
        this.EnrollmentInfoDialogRef.close({ action: "close" });
    }
    onBack(): void {
        this.showEnrollmentInfoPopup = false;
        this.backClickEvent.emit(this.showEnrollmentInfoPopup);
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
