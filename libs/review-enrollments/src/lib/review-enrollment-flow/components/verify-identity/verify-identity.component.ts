import { Component, OnInit, OnDestroy, HostListener } from "@angular/core";
import { FormBuilder, FormGroup, Validators, FormControl, AbstractControl, ValidationErrors } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { RegexForFieldValidation } from "@empowered/ui";
import { AppSettings, DateFormats } from "@empowered/constants";
import { AuthenticationService, HeadsetSSO } from "@empowered/api";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute } from "@angular/router";
import { Subject } from "rxjs";
import { takeUntil, filter, tap } from "rxjs/operators";
import { DateService } from "@empowered/date";
import { EmpoweredModalService } from "@empowered/common-services";
import { ReviewFlowService, StepTitle } from "../../services/review-flow.service";
import { CensusStatementModalComponent } from "../census-statement-modal/census-statement-modal.component";

@Component({
    selector: "empowered-verify-identity",
    templateUrl: "./verify-identity.component.html",
    styleUrls: ["./verify-identity.component.scss"],
})
export class VerifyIdentityComponent implements OnInit, OnDestroy {
    private unsubscribe$ = new Subject<void>();
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
    errorMessage: string;
    isSpinnerLoading = false;
    validationRegex: any;
    groupId: number;
    memberId: number;
    guid: string;
    loginForm: FormGroup;
    formName = "verify-user-form";
    firstNameError: string;
    lastNameError: string;
    birthDateError: string;
    emailError: string;
    phoneError: string;
    contactValue: string;
    NAME_REGEX = new RegExp(RegexForFieldValidation.NAME);
    EMAIL_REGEX = new RegExp(RegexForFieldValidation.EMAIL);
    PHONE_REGEX = new RegExp(RegexForFieldValidation.PHONE);
    BIRTHDATE_REGEX = new RegExp(RegexForFieldValidation.DATE);
    userSSO: HeadsetSSO; // UserSSO;
    agreeCheckbox = false;
    checked = false;
    showErrorMessage = false;

    constructor(
        private readonly dialog: MatDialog,
        private readonly formBuilder: FormBuilder,
        private readonly language: LanguageService,
        private readonly authenticationService: AuthenticationService,
        private readonly reviewFlowService: ReviewFlowService,
        private readonly route: ActivatedRoute,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly dateService: DateService,
    ) {}

    ngOnInit(): void {
        this.route.queryParams.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => {
            this.groupId = params["groupId"];
            this.guid = params["guid"];
        });

        this.loginForm = this.formBuilder.group({
            firstName: ["", [Validators.required, Validators.pattern(this.NAME_REGEX)]],
            lastName: ["", [Validators.required, Validators.pattern(this.NAME_REGEX)]],
            birthDate: ["", [Validators.required, this.checkDate.bind(this)]],
            contactValue: ["", [Validators.required, this.validateContact.bind(this)]],
            consentValue: ["", [Validators.requiredTrue]],
        });
    }

    hasError = (controlName: string, errorName: string) => this.loginForm.controls[controlName].hasError(errorName);

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

    /**
     * Invoke onSubmit on click of Next button. This method helps to authenticate
     */
    onSubmit(): void {
        if (this.loginForm.valid) {
            this.isSpinnerLoading = true;
            this.agreeCheckbox = false;
            this.userSSO = this.loginForm.value;
            this.userSSO.firstName = this.loginForm.value.firstName;
            this.userSSO.lastName = this.loginForm.value.lastName;
            this.userSSO.birthDate = this.dateService.format(this.loginForm.value.birthDate, DateFormats.YEAR_MONTH_DAY);
            this.userSSO.contactValue = this.loginForm.value.contactValue;
            this.userSSO.groupId = this.groupId;
            this.userSSO.guid = this.guid;
            this.authenticationService
                .getHeadsetSSO(this.userSSO)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (data: any) => {
                        this.isSpinnerLoading = false;
                        this.groupId = data.groupId;
                        this.memberId = data.memberId;
                        this.reviewFlowService.updateMemberId$.next(this.memberId);
                        this.reviewFlowService.mpGroup$.next(this.groupId);
                        this.reviewFlowService.stepChanged$.next(StepTitle.ENROLLMENT_SUMMARY);
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
            this.agreeCheckbox = true;
        }
    }

    /**
     * bind the method on form validation
     */
    validateContact(control: FormControl): any {
        const value = control.value;
        const numberCheck = this.PHONE_REGEX;
        const emailCheck = this.EMAIL_REGEX;
        return numberCheck.test(value) || emailCheck.test(value) ? null : { contactValueError: true };
    }

    /**
     * This method helps to open a census modal
     */
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

    /**
     * This method helps to close the modal
     */
    closeModal(): void {
        this.dialog.closeAll();
    }

    /**
     * This method used to toggle the checkbox
     */
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
