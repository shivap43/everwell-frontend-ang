import { Component, OnInit, Inject, EventEmitter, Output, OnDestroy } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from "@angular/material/dialog";
import { MatRadioChange } from "@angular/material/radio";
import { ActivatedRoute } from "@angular/router";
import { ReplacePlanComponent } from "../replace-plan/replace-plan.component";
import { Subject } from "rxjs";
import { BenefitsOfferingService, DeletePlanChoice } from "@empowered/api";
import { FormGroup, FormBuilder, Validators, FormControl, AbstractControl, ValidationErrors } from "@angular/forms";
import { takeUntil, filter } from "rxjs/operators";
import { DatePipe } from "@angular/common";
import { AppSettings } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { RemovePlansDialogData } from "@empowered/ngxs-store";
import { BenefitOfferingUtilService } from "@empowered/ui";
import { DateService } from "@empowered/date";

const END_DATE_VAR = "endDate";
const START_DATE_VAR = "startDate";

@Component({
    selector: "empowered-stop-offering",
    templateUrl: "./stop-offering.component.html",
    styleUrls: ["./stop-offering.component.scss"],
})
export class StopOfferingComponent implements OnInit, OnDestroy {
    planYearType: any;
    planName: any;
    enrollmentStartDate: any;
    modifiedEnrollmentStartDate: Date;
    RemoveTypeSelectedValue: any;
    selection: string;
    today: Date = new Date();
    private unsubscribe$ = new Subject<void>();
    showReplacePlan = false;
    coverageCount = 0;
    NONReplacePlan = true;
    RadioSelectedValue: any;
    coverageEndDate: any;
    removePlanForm: FormGroup;
    showCoverageEndDate: boolean;
    modifiedCoverageEndDate: string;
    enrollmentEndDate: any;
    modifiedEnrollmentEndDate: string;
    modifiedStartDate: string;
    modifiedEndDate: string;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.stopOfferingPlan",
        "primary.portal.common.replaceCoverage",
        "primary.portal.common.cancel",
        "primary.portal.maintenanceBenefitsOffering.stopOffering.title",
        "primary.portal.maintenanceBenefitsOffering.stopOffering.description",
        "primary.portal.maintenanceBenefitsOffering.stopOffering.enrollmentEndDate",
        "primary.portal.maintenanceBenefitsOffering.stopOffering.enrolledDescription",
        "primary.portal.maintenanceBenefitsOffering.stopOffering.continueCoverage",
        "primary.portal.maintenanceBenefitsOffering.stopOffering.endCoverage",
        "primary.portal.maintenanceBenefitsOffering.stopOffering.coverageEndDate",
        "primary.portal.maintenanceBenefitsOffering.stopOffering.replaceNewCoverage",
        "primary.portal.maintenanceBenefitsOffering.stopOffering.planYearTypeDescription",
        "primary.portal.maintenanceBenefitsOffering.stopOffering.optionYes",
        "primary.portal.maintenanceBenefitsOffering.stopOffering.startDate",
        "primary.portal.maintenanceBenefitsOffering.stopOffering.endDate",
        "primary.portal.maintenanceBenefitsOffering.stopOffering.optionNo",
        "primary.portal.common.requiredField",
        "primary.portal.common.selectOption",
        "primary.portal.common.close",
        "primary.portal.common.invalidDateFormat",
        "primary.portal.coverage.cannotBePast",
    ]);
    endDate: any;
    startDate: any;
    formDataValue: any;
    showStartEndDate = false;
    removeStartEndDate = false;
    showDateError: boolean;
    errorMessage: string;
    replaceButtonClicked = "replace";
    languageSecondStringsArray: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.benefitsOffering.coveragedates.invalidDate",
        "secondary.portal.benefitsOffering.coveragedates.invalidenddate",
        "secondary.portal.benefitsOffering.stopOffering.startDate.invalid",
        "secondary.portal.benefitsOffering.stopOffering.endDate.invalid",
    ]);

    constructor(
        @Inject(MAT_DIALOG_DATA) readonly stopOfferingData: RemovePlansDialogData,
        private readonly dialogRef: MatDialogRef<StopOfferingComponent>,
        private readonly dialog: MatDialog,
        private readonly datePipe: DatePipe,
        private readonly route: ActivatedRoute,
        private readonly fb: FormBuilder,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly language: LanguageService,
        private readonly benefitOfferingUtilService: BenefitOfferingUtilService,
        private readonly dateService: DateService,
    ) {}

    ngOnInit(): void {
        this.planName = this.stopOfferingData.planDetails.plan.plan.name;
        this.enrollmentStartDate = this.stopOfferingData.enrollmentStartDate;
        this.modifiedEnrollmentStartDate = this.dateService.toDate(this.enrollmentStartDate);
        if (this.stopOfferingData.continuous) {
            this.planYearType = false;
        } else {
            this.planYearType = true;
        }
        this.removePlanForm = this.fb.group({
            enrollmentEndDate: [new Date(), [Validators.required, this.checkDate.bind(this)]],
            coverageEndDate: [null],
        });
        if (this.planYearType) {
            this.removePlanForm.removeControl("enrollmentEndDate");
            this.removePlanForm.addControl(
                "startDate",
                new FormControl(null, [Validators.required, this.checkDate.bind(this), this.checkStartDate.bind(this, START_DATE_VAR)]),
            );
            this.removePlanForm.addControl(
                "endDate",
                new FormControl(null, [Validators.required, this.checkDate.bind(this), this.checkStartDate.bind(this, END_DATE_VAR)]),
            );
        }
    }
    /**
     * This method will execute on change of radio button value
     * This method is used to add validators on change of radio-value
     * @param selectedValue is current changed radio value
     */
    onChange(selectedValue: MatRadioChange): void {
        this.showReplacePlan = false;
        if (selectedValue.value === "endCoverage") {
            this.showCoverageEndDate = true;
        } else {
            this.showCoverageEndDate = false;
        }
        if (selectedValue.value === "Replace") {
            this.showReplacePlan = true;
        } else {
            this.showReplacePlan = false;
        }
        if (this.showCoverageEndDate) {
            this.removePlanForm.controls.coverageEndDate.setValidators([Validators.required, this.checkDate.bind(this)]);
            this.removePlanForm.controls.coverageEndDate.updateValueAndValidity();
        } else {
            this.removePlanForm.controls.coverageEndDate.clearValidators();
            this.removePlanForm.controls.coverageEndDate.updateValueAndValidity();
        }
    }
    onChangePlanYear(selectedValue: MatRadioChange): void {
        if (selectedValue.value === "no" || this.showReplacePlan) {
            this.removeStartEndDate = true;
            this.removePlanForm.controls.startDate.clearValidators();
            this.removePlanForm.controls.startDate.updateValueAndValidity();
            this.removePlanForm.controls.endDate.clearValidators();
            this.removePlanForm.controls.endDate.updateValueAndValidity();
        } else {
            this.removePlanForm.controls.startDate.setValidators([
                Validators.required,
                this.checkDate.bind(this),
                this.checkStartDate.bind(this, START_DATE_VAR),
            ]);
            this.removePlanForm.controls.startDate.updateValueAndValidity();
            this.removePlanForm.controls.endDate.setValidators([
                Validators.required,
                this.checkDate.bind(this),
                this.checkStartDate.bind(this, END_DATE_VAR),
            ]);
            this.removePlanForm.controls.endDate.updateValueAndValidity();
        }
    }
    /**
     * open ReplacePlanComponent modal and close modal based on option afterClosed
     * @param data data of plan to be deleted
     */
    replacePlanChoice(data: any): void {
        if (this.modifiedEnrollmentStartDate.getTime() - Date.now() < 0) {
            if (this.planYearType) {
                this.removePlanForm.controls.startDate.clearValidators();
                this.removePlanForm.controls.startDate.updateValueAndValidity();
                this.removePlanForm.controls.endDate.clearValidators();
                this.removePlanForm.controls.endDate.updateValueAndValidity();
            }
            const replaceDialogRef = this.dialog.open(ReplacePlanComponent, {
                backdropClass: "backdrop-blur",
                width: "600px",
                data: {
                    route: this.route,
                    mpGroup: this.stopOfferingData.mpGroup,
                    deletedPlan: data,
                    choiceId: this.stopOfferingData.choiceId,
                    continuous: this.stopOfferingData.continuous,
                    enrollmentStartDate: this.enrollmentStartDate,
                    planDetails: this.stopOfferingData.planDetails,
                    productDetails: this.stopOfferingData.productDetails,
                    enrollmentEndDate: this.modifiedEnrollmentEndDate,
                },
            });
            replaceDialogRef
                .afterClosed()
                .pipe(
                    takeUntil(this.unsubscribe$),
                    filter((option) => option.data === this.replaceButtonClicked),
                )
                .subscribe((option) => {
                    this.dialogRef.close();
                });
        }
    }
    cancel(): void {
        this.dialog.closeAll();
    }

    deletePlanChoice(deletedPlan: any): void {
        this.benefitOfferingService
            .deletePlanChoice(deletedPlan, this.stopOfferingData.choiceId, this.stopOfferingData.mpGroup, this.modifiedEnrollmentEndDate)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.cancel();
            });
    }
    onNext(): void {
        const data: DeletePlanChoice = {};
        if (this.showReplacePlan) {
            this.formDataValue = this.removePlanForm.value;
            if (!this.planYearType && this.formDataValue.enrollmentEndDate !== null) {
                this.modifiedEnrollmentEndDate = this.datePipe.transform(this.formDataValue.enrollmentEndDate, AppSettings.DATE_FORMAT);
                data.qualifyingEventValidity = {
                    effectiveStarting: this.enrollmentStartDate,
                    expiresAfter: this.modifiedEnrollmentEndDate,
                };
            }
            this.replacePlanChoice(data);
        } else if (this.removePlanForm.valid) {
            this.formDataValue = this.removePlanForm.value;
            if (!this.planYearType && this.formDataValue.enrollmentEndDate !== null) {
                this.modifiedEnrollmentEndDate = this.datePipe.transform(this.formDataValue.enrollmentEndDate, AppSettings.DATE_FORMAT);
                data.qualifyingEventValidity = {
                    effectiveStarting: this.enrollmentStartDate,
                    expiresAfter: this.modifiedEnrollmentEndDate,
                };
            }
            if (this.formDataValue.coverageEndDate !== undefined) {
                this.modifiedCoverageEndDate = this.datePipe.transform(this.formDataValue.coverageEndDate, AppSettings.DATE_FORMAT);
                data.coverageEndDate = this.modifiedCoverageEndDate;
            }
            if (!this.removeStartEndDate && this.formDataValue.startDate !== undefined && this.formDataValue.endDate !== undefined) {
                this.modifiedStartDate = this.datePipe.transform(this.formDataValue.startDate, AppSettings.DATE_FORMAT);
                this.modifiedEndDate = this.datePipe.transform(this.formDataValue.endDate, AppSettings.DATE_FORMAT);
                data.qualifyingEventValidity = {
                    effectiveStarting: this.modifiedStartDate,
                    expiresAfter: this.modifiedEndDate,
                };
            }
            this.deletePlanChoice(data);
        }
    }
    /**
     * This below method is used to validate date should be greater than or lesser than the date
     * @param control Form control to take the date value
     * @returns ValidationErrors for currently called form-control, if any
     */
    checkStartDate(from: string, control: FormControl): ValidationErrors | void {
        return this.benefitOfferingUtilService.checkStartDate(from, control, this.removePlanForm);
    }
    /**
     * This method will be called on input of date-filed
     * This method is used to check whether entered date is valid or not
     * @param event is date value
     * @param control is form control of selected date-picker
     */
    checkDateInput(event: string, control: AbstractControl): void {
        this.benefitOfferingUtilService.checkDateInput(event, control);
    }
    /**
     * This method will be called on blur of date-input after entering input
     * This method is used to check whether entered date is valid or not
     * @param event is date value
     */
    onBlur(event: string, control: AbstractControl): void {
        this.benefitOfferingUtilService.onBlur(event, control as FormControl);
    }
    /**
     * The below method is bind to form control and validates the input date to be greater than current date
     * @param control is formControl value
     * @returns ValidationErrors for currently called form-control
     */
    checkDate(control: FormControl): ValidationErrors {
        return this.benefitOfferingUtilService.checkDate(control);
    }

    /**
     * Unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
