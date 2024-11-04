/* eslint-disable no-underscore-dangle */
import { Component, OnInit, Input, OnDestroy, HostListener } from "@angular/core";
import { FormBuilder, FormGroup, Validators, FormControl, AbstractControl, ValidationErrors } from "@angular/forms";
import { LanguageService } from "@empowered/language";

import { RegexForFieldValidation } from "@empowered/ui";
import { CheckForm, SharedState, UtilService } from "@empowered/ngxs-store";
import { AppSettings } from "@empowered/constants";
import { HeadsetSSO, AuthenticationService } from "@empowered/api";
import { MatDialog } from "@angular/material/dialog";
import { ReviewFlowService } from "../services/review-flow.service";
import { ActivatedRoute } from "@angular/router";
import { Select, Store } from "@ngxs/store";
import { Observable, Subject } from "rxjs";
import { takeUntil, filter, tap } from "rxjs/operators";
import { CensusStatementModalComponent } from "../census-statement-modal/census-statement-modal.component";
import { DateService } from "@empowered/date";
import { EmpoweredModalService } from "@empowered/common-services";

@Component({
    selector: "empowered-verify-user",
    templateUrl: "./verify-user.component.html",
    styleUrls: ["./verify-user.component.scss"],
})
export class VerifyUserComponent implements OnInit, OnDestroy {
    @Select(SharedState.regex) regex$: Observable<any>;
    private unsubscribe$ = new Subject<void>();
    @Input() userDetails: any;
    firstFormGroup: FormGroup;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.enrollment.review.verify",
        "primary.portal.enrollment.review.confirmidentiy",
        "primary.portal.enrollment.review.firstname",
        "primary.portal.common.requiredField",
        "primary.portal.enrollment.review.lastname",
        "primary.portal.enrollment.review.birthdate",
        "primary.portal.enrollment.review.email",
        "primary.portal.enrollment.review.agree",
        "primary.portal.enrollment.review.consent",
        "primary.portal.review.selectionrequired",
        "primary.portal.common.next",
        "primary.portal.common.cancel",
        "primary.portal.common.iAgree",
        "primary.portal.headset.consent.update",
        "primary.portal.headset.consent.service",
        "primary.portal.headset.consent.record",
        "primary.portal.headset.consent.paper",
        "primary.portal.headset.consent.agree",
        "primary.portal.headset.communication",
        "primary.portal.consent.rights",
        "primary.portal.headset.introduction",
        "primary.portal.headset.consent.info",
        "primary.portal.headset.consent.electronic",
        "primary.portal.headset.consent.statement",
        "primary.portal.headset.consent",
        "primary.portal.enrollment.review.consent",
        "primary.portal.headset.fpo.contact",
        "primary.portal.headset.fpo.birth.notmatch",
        "primary.portal.headset.fpo.birth",
        "primary.portal.headset.notmatch",
        "primary.portal.headset.fpo.lastname",
        "primary.portal.records.unmatch",
        "primary.portal.headset.fpo.firstname",
        "primary.portal.headset.contact.valid",
        "primary.portal.enrollment.review.invalidDate",
    ]);

    maxDate = new Date();

    error = false;
    errorMessage: any = null;

    isSpinnerLoading = false;
    validationRegex: any;
    groupId: any;
    memberId: any;
    guid: any;
    loginForm: FormGroup;

    formName = "verify-user-form";
    firstNameError: any;
    lastNameError: any;
    birthDateError: any;
    emailError: any;
    phoneError: any;
    contactValue: any;
    NAME_REGEX = new RegExp(RegexForFieldValidation.NAME);
    EMAIL_REGEX = new RegExp(RegexForFieldValidation.EMAIL);
    PHONE_REGEX = new RegExp(RegexForFieldValidation.PHONE);
    BIRTHDATE_REGEX = new RegExp(RegexForFieldValidation.DATE);

    headsetSSO: HeadsetSSO;
    agreeCheckbox = false;
    checked = false;
    showErrorMessage = false;

    constructor(
        private readonly dialog: MatDialog,
        private readonly _formBuilder: FormBuilder,
        private readonly language: LanguageService,
        private readonly authenticationService: AuthenticationService,
        private readonly reviewFlowService: ReviewFlowService,
        private readonly route: ActivatedRoute,
        private readonly utilService: UtilService,
        private readonly store: Store,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly dateService: DateService,
    ) {}

    ngOnInit(): void {
        this.route.queryParams.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => {
            this.memberId = params["memberId"];
            this.groupId = params["groupId"];
            this.guid = params["guid"];
        });

        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                this.validationRegex = data;
            }
        });

        this.loginForm = this._formBuilder.group({
            firstName: ["", [Validators.required, Validators.pattern(this.NAME_REGEX)]],
            lastName: ["", [Validators.required, Validators.pattern(this.NAME_REGEX)]],
            birthDate: ["", [Validators.required, this.checkDate.bind(this)]],
            contactValue: ["", [Validators.required, this.validateContact.bind(this)]],
            consentValue: ["", [Validators.requiredTrue]],
        });
    }

    hasError = (controlName: string, errorName: string) => this.loginForm.controls[controlName].hasError(errorName);

    checkUsername(control: FormControl): any {
        const enteredUsername: string = control.value;
        const usernameCheck = RegexForFieldValidation.USERNAME;
        return !usernameCheck.test(enteredUsername) && enteredUsername ? { requirements: true } : null;
    }

    /**
     * This method will validate date
     * @param event as event
     * @param control as controls of form
     */
    checkDateInput(event: KeyboardEvent, control: AbstractControl): void {
        const elem = event.target as HTMLInputElement;
        const value = elem.value;
        if (isNaN(this.dateService.toDate(value).getTime())) {
            control.setErrors({ invalid: true });
        }
    }

    /**
     * This method checks date input and returns error if exist in form control
     * @param control as controls of form
     * @return validation errors
     */
    checkDate(control: FormControl): ValidationErrors {
        if (!control.value) {
            return null;
        } else {
            const date = new Date();
            const inputDate = this.dateService.getToDate(this.dateService.toDate(control.value));
            if (!inputDate) {
                return { required: true };
            }
            if (this.dateService.checkIsAfter(inputDate, date)) {
                return { futureDate: true };
            }
            return null;
        }
    }

    onSubmit(): any {
        if (this.loginForm.valid) {
            this.isSpinnerLoading = true;
            this.agreeCheckbox = false;
            this.headsetSSO = this.loginForm.value;
            this.headsetSSO.firstName = this.loginForm.value.firstName;
            this.headsetSSO.lastName = this.loginForm.value.lastName;
            this.headsetSSO.birthDate = this.utilService.getMomentDateObject(this.loginForm.value.birthDate);
            this.headsetSSO.contactValue = this.loginForm.value.contactValue;
            this.headsetSSO.groupId = this.groupId;
            this.headsetSSO.guid = this.guid;
            this.authenticationService
                .getHeadsetSSO(this.headsetSSO)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (data: any) => {
                        this.isSpinnerLoading = false;
                        this.groupId = data.groupId;
                        this.memberId = data.memberId;
                        this.reviewFlowService.updateMemberId$.next(this.memberId);
                    },
                    (error) => {
                        this.isSpinnerLoading = false;
                        if (error.status === AppSettings.API_RESP_400 && error.error.details.length) {
                            error.error.details.forEach((detail) => {
                                if (detail.field) {
                                    this.loginForm.controls[detail.field].setErrors({ apiError: true });
                                }
                            });
                        } else {
                            this.errorMessage = this.language.fetchSecondaryLanguageValue(
                                "secondary.api." + error.status + "." + error.code,
                            );
                            this.showErrorMessage = true;
                        }
                    },
                );
        } else {
            this.store.dispatch(new CheckForm(this.formName));
            this.agreeCheckbox = true;
        }
    }

    validateContact(contol: FormControl): any {
        const value = contol.value;
        const numberCheck = this.PHONE_REGEX;
        const emailCheck = this.EMAIL_REGEX;
        return numberCheck.test(value) || emailCheck.test(value) ? null : { contactValueError: true };
    }

    consentStatement(): void {
        this.empoweredModalService
            .openDialog(CensusStatementModalComponent)
            .afterClosed()
            .pipe(
                filter((value) => value),
                tap(() => this.setEnrollmentStatus()),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    closeModal(): void {
        this.dialog.closeAll();
    }

    setEnrollmentStatus(): void {
        if (!this.checked) {
            this.checked = !this.checked;
        }
        this.dialog.closeAll();
    }

    @HostListener("window:beforeunload", ["$event"])
    beforeunloadHandler(event: any): boolean {
        event.preventDefault();
        event.stopPropagation();
        return false;
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
