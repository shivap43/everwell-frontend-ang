import { Component, OnInit, Inject } from "@angular/core";
import { MatDialog, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatRadioChange } from "@angular/material/radio";
import { ReplaceAllPlansComponent } from "../replace-all-plans/replace-all-plans.component";
import { ActivatedRoute } from "@angular/router";
import { FormGroup, FormBuilder, Validators, FormControl, AbstractControl, ValidationErrors } from "@angular/forms";
import { BenefitsOfferingService, DeletePlanChoice } from "@empowered/api";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { DatePipe } from "@angular/common";
import { AppSettings } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { BenefitOfferingUtilService } from "@empowered/ui";
import { DateService } from "@empowered/date";

const END_DATE_VAR = "endDate";
const START_DATE_VAR = "startDate";

interface PlansDetails {
    enrollmentEndDateVal: any;
    route: ActivatedRoute;
    mpGroup: any;
    details: any;
    isPlanYear: any;
}

@Component({
    selector: "empowered-stop-offering-product",
    templateUrl: "./stop-offering-product.component.html",
    styleUrls: ["./stop-offering-product.component.scss"],
})
export class StopOfferingProductComponent implements OnInit {
    removePlanForm: FormGroup;
    showReplacePlan: boolean;
    showCoverageEndDate: boolean;
    productType: any;
    modifiedEnrollmentStartDate: Date;
    enrollmentStartDate: any;
    private unsubscribe$ = new Subject<void>();
    coverageEndDate: any;
    enrollmentEndDate: any;
    modifiedEnrollmentEndDate: string;
    modifiedCoverageEndDate: string;
    planYearType: any;
    carrierName: any;
    productName: any;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.stopOfferingProduct",
        "primary.portal.common.replaceCoverage",
        "primary.portal.common.cancel",
        "primary.portal.maintenanceBenefitsOffering.stopOffering.productTitle",
        "primary.portal.maintenanceBenefitsOffering.stopOffering.productContinuous",
        "primary.portal.maintenanceBenefitsOffering.stopOffering.enrollmentEndDate",
        "primary.portal.maintenanceBenefitsOffering.stopOffering.coverageDescription",
        "primary.portal.maintenanceBenefitsOffering.stopOffering.continueCoverage",
        "primary.portal.maintenanceBenefitsOffering.stopOffering.endCoverage",
        "primary.portal.maintenanceBenefitsOffering.stopOffering.coverageEndDate",
        "primary.portal.maintenanceBenefitsOffering.stopOffering.replaceNewCoverage",
        "primary.portal.maintenanceBenefitsOffering.stopOffering.planYearTypeDescription",
        "primary.portal.maintenanceBenefitsOffering.stopOffering.optionYes",
        "primary.portal.maintenanceBenefitsOffering.stopOffering.startDate",
        "primary.portal.maintenanceBenefitsOffering.stopOffering.endDate",
        "primary.portal.maintenanceBenefitsOffering.stopOffering.optionNo",
        "primary.portal.common.selectOption",
        "primary.portal.common.requiredField",
        "primary.portal.common.close",
        "primary.portal.common.invalidDateFormat",
        "primary.portal.coverage.cannotBePast",
    ]);
    formDataValue: any;
    modifiedEndDate: any;
    modifiedStartDate: any;
    removeStartEndDate = false;
    coverageCount = 0;
    today: Date = new Date();
    languageSecondStringsArray: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.benefitsOffering.coveragedates.invalidDate",
        "secondary.portal.benefitsOffering.coveragedates.invalidenddate",
        "secondary.portal.benefitsOffering.stopOffering.startDate.invalid",
        "secondary.portal.benefitsOffering.stopOffering.endDate.invalid",
    ]);

    constructor(
        private readonly dialog: MatDialog,
        @Inject(MAT_DIALOG_DATA) readonly removePlansData: PlansDetails,
        private readonly fb: FormBuilder,
        private readonly route: ActivatedRoute,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly datePipe: DatePipe,
        private readonly language: LanguageService,
        private readonly benefitOfferingUtilService: BenefitOfferingUtilService,
        private readonly dateService: DateService,
    ) {}

    ngOnInit(): void {
        this.carrierName = this.removePlansData.details.carrierName;
        this.productName = this.removePlansData.details.productName;
        if (this.removePlansData.isPlanYear === "false") {
            this.planYearType = false;
        } else {
            this.planYearType = true;
        }
        this.enrollmentStartDate = this.removePlansData.details.plans[0].plan.enrollmentStartDate;
        this.modifiedEnrollmentStartDate = this.dateService.toDate(this.enrollmentStartDate);
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

    replacePlanChoice(data: any): void {
        if (this.modifiedEnrollmentStartDate.getTime() - Date.now() < 0) {
            if (this.planYearType) {
                this.removePlanForm.controls.startDate.clearValidators();
                this.removePlanForm.controls.startDate.updateValueAndValidity();
                this.removePlanForm.controls.endDate.clearValidators();
                this.removePlanForm.controls.endDate.updateValueAndValidity();
            }
            this.dialog.open(ReplaceAllPlansComponent, {
                backdropClass: "backdrop-blur",
                width: "600px",
                data: {
                    route: this.route,
                    enrollmentEndDateVal: this.removePlansData.enrollmentEndDateVal,
                    mpGroup: this.removePlansData.mpGroup,
                    details: this.removePlansData.details,
                    deletedPlan: data,
                    isProductContinuous: this.removePlansData.isPlanYear,
                },
            });
        }
    }

    deletePlanChoice(deletedPlan: any, choiceId: any): void {
        this.benefitOfferingService
            .deletePlanChoice(deletedPlan, choiceId, this.removePlansData.mpGroup, this.modifiedEnrollmentEndDate)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.cancel();
            });
    }

    cancel(): void {
        this.dialog.closeAll();
    }

    onNext(): void {
        const data: DeletePlanChoice = {};
        this.removePlansData.details.plans.forEach((element) => {
            if (this.showReplacePlan) {
                this.formDataValue = this.removePlanForm.value;
                if (!this.planYearType && this.formDataValue.enrollmentEndDate !== null) {
                    this.modifiedEnrollmentEndDate = this.datePipe.transform(this.formDataValue.enrollmentEndDate, AppSettings.DATE_FORMAT);
                    data.qualifyingEventValidity = {
                        effectiveStarting: this.enrollmentStartDate,
                        expiresAfter: this.modifiedEnrollmentEndDate,
                    };
                }
            } else if (this.removePlanForm.valid) {
                this.formDataValue = this.removePlanForm.value;
                if (!this.planYearType && this.formDataValue.enrollmentEndDate !== null) {
                    this.modifiedEnrollmentEndDate = this.datePipe.transform(this.formDataValue.enrollmentEndDate, AppSettings.DATE_FORMAT);
                    data.qualifyingEventValidity = {
                        effectiveStarting: this.enrollmentStartDate,
                        expiresAfter: this.modifiedEnrollmentEndDate,
                    };
                }
                if (this.formDataValue.coverageEndDate !== null) {
                    this.modifiedCoverageEndDate = this.datePipe.transform(this.formDataValue.coverageEndDate, AppSettings.DATE_FORMAT);
                    data.coverageEndDate = this.modifiedCoverageEndDate;
                }
                if (!this.removeStartEndDate && this.formDataValue.startDate !== null && this.formDataValue.endDate !== null) {
                    this.modifiedStartDate = this.datePipe.transform(this.formDataValue.startDate, AppSettings.DATE_FORMAT);
                    this.modifiedEndDate = this.datePipe.transform(this.formDataValue.endDate, AppSettings.DATE_FORMAT);
                    data.qualifyingEventValidity = {
                        effectiveStarting: this.modifiedStartDate,
                        expiresAfter: this.modifiedEndDate,
                    };
                }
                this.deletePlanChoice(data, element.plan.id);
            }
        });
        if (!this.showCoverageEndDate && this.showReplacePlan) {
            this.replacePlanChoice(data);
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
}
