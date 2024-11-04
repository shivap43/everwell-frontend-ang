import { Component, OnInit, Inject } from "@angular/core";
import { EligiblePlans, ReplaceAflacGroupInfo } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { FormGroup, FormBuilder, Validators, AbstractControl, FormControl, ValidationErrors } from "@angular/forms";
import { DateFormats } from "@empowered/constants";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { DatePipe } from "@angular/common";
import { DateService } from "@empowered/date";

const ONE_DAY = 1;

@Component({
    selector: "empowered-confirm-ineligible-plans",
    templateUrl: "./confirm-ineligible-plans.component.html",
    styleUrls: ["./confirm-ineligible-plans.component.scss"],
})
export class ConfirmIneligiblePlansComponent implements OnInit {
    editOfferingForm: FormGroup;
    oeEndDate: Date;
    ineligiblePlans: ReplaceAflacGroupInfo[];
    plansToUpdate: ReplaceAflacGroupInfo[];
    today = new Date();
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.gotIt",
        "primary.portal.aflacGroup.offering.stopOfferingProducts",
        "primary.portal.maintenanceBenefitsOffering.nonAflacCoverageDates",
        "primary.portal.common.dateHint",
        "primary.portal.common.requiredField",
        "primary.portal.coverage.cannotBePast",
        "primary.portal.benefits.agOffering.invalidDate",
        "primary.portal.aflacGroup.offering.dateBeforeEnrollmentEndDate",
        "primary.portal.aflacGroup.offering.ineligiblePlans",
        "primary.portal.aflacGroup.offering.stopOfferingIneligiblePlans",
        "primary.portal.common.confirm",
        "primary.portal.aflacGroup.offering.enrollmentForSomeProducts",
        "primary.portal.aflacGroup.offering.existingEnrollments",
        "primary.portal.aflacGroup.offering.ineligiblePlansInfo",
    ]);

    constructor(
        @Inject(MAT_DIALOG_DATA) private readonly data: { eligiblePlansInfo: EligiblePlans; coverageStartDate: string },
        private readonly dialogRef: MatDialogRef<ConfirmIneligiblePlansComponent>,
        private readonly language: LanguageService,
        private readonly formBuilder: FormBuilder,
        private readonly datePipe: DatePipe,
        private readonly dateService: DateService,
    ) {}

    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     */
    ngOnInit(): void {
        this.editOfferingForm = this.formBuilder.group({
            offeringEndDate: ["", [Validators.required, this.checkDate.bind(this)]],
        });
        const coverageStartDate = this.dateService.toDate(this.data.coverageStartDate);
        this.oeEndDate = this.dateService.subtractDays(coverageStartDate, ONE_DAY);
        this.editOfferingForm.controls.offeringEndDate.setValue(new Date());
        this.checkIneligiblePlans();
    }

    /**
     * This method will be called on input of date field
     * This method is used to check whether entered date is valid or not
     * @param event is key-board event
     * @param control is the abstract control
     */
    checkDateInput(event: KeyboardEvent, control: AbstractControl): void {
        const dateValue: string = (event.target as HTMLInputElement).value;
        if (dateValue) {
            const inputDate: Date = this.dateService.toDate(dateValue);
            if (isNaN(inputDate.getTime())) {
                control.setErrors({ invalid: true });
            }
            if (inputDate && inputDate > this.oeEndDate) {
                control.setErrors({ greaterThanCoverageDate: true });
            }
        }
    }
    /**
     * The below method is bound to form control and validates the input date to be greater than current date
     * @param control is formControl value
     * @returns ValidationErrors for currently called form-control
     */
    checkDate(control: FormControl): ValidationErrors {
        let error: ValidationErrors = null;
        const dateObject: Date = control?.value ? this.dateService.parseDate(control.value, DateFormats.YEAR_MONTH_DAY) : null;
        if (control.value && control.value.toString().trim().length > 0) {
            const inputDate: Date = this.dateService.toDate(control.value);
            const currentDate: Date = new Date();
            inputDate.setHours(0, 0, 0, 0);
            currentDate.setHours(0, 0, 0, 0);
            if (!inputDate) {
                error = { required: true };
            } else if (inputDate < currentDate) {
                error = { pastDate: true };
            } else if (dateObject && !this.dateService.isValid(dateObject) && control.value.length !== 0) {
                error = { invalid: true };
            }
        } else {
            error = { required: true };
        }
        return error;
    }
    /**
     * This method will be called on blur of date-input after entering input
     * This method is used to check whether entered date is valid or not
     * @param event is key-board event
     * @param control is the abstract control
     */
    onBlur(event: KeyboardEvent, control: AbstractControl): void {
        const dateValue: string = (event.target as HTMLInputElement).value;
        if (control && dateValue && !Date.parse(dateValue)) {
            control.setErrors({ invalid: true });
        }
    }
    /**
     * check if ineligible plans exist
     */
    checkIneligiblePlans(): void {
        this.ineligiblePlans = this.data.eligiblePlansInfo.replaceWithAflacGroup.filter(
            (plans) => this.dateService.toDate(plans.enrollmentStartDate) > new Date(),
        );
        this.plansToUpdate = this.data.eligiblePlansInfo.replaceWithAflacGroup.filter(
            (plans) => !plans.enrollmentStartDate || this.dateService.toDate(plans.enrollmentStartDate) <= new Date(),
        );
    }
    /**
     * This method is called to close the dialog
     */
    close(): void {
        if (this.plansToUpdate && this.plansToUpdate.length > 0) {
            if (this.editOfferingForm.valid) {
                this.dialogRef.close({
                    isSaveOffering: true,
                    stopOfferingDate: this.dateService.format(
                        this.dateService.toDate(this.editOfferingForm.controls.offeringEndDate.value),
                        DateFormats.YEAR_MONTH_DAY,
                    ),
                });
            } else {
                this.editOfferingForm.controls.offeringEndDate.markAsTouched();
            }
        } else {
            this.dialogRef.close({
                isSaveOffering: true,
                stopOfferingDate: this.dateService.format(new Date(), DateFormats.YEAR_MONTH_DAY),
            });
        }
    }
}
