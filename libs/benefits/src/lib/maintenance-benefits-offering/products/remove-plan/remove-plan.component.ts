import { Component, OnInit, Inject } from "@angular/core";
import { BenefitsOfferingService } from "@empowered/api";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { LanguageService } from "@empowered/language";
import { DatePipe } from "@angular/common";
import { DateFormats } from "@empowered/constants";
import { RemovePlansDialogData } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";

@Component({
    selector: "empowered-remove-plan",
    templateUrl: "./remove-plan.component.html",
    styleUrls: ["./remove-plan.component.scss"],
})
export class RemovePlanComponent implements OnInit {
    enrollmentStartDate;
    modifiedEnrollmentStartDate: Date;
    endDate;
    endDateVal;
    maxDate: Date;
    coverageStartDate: string;
    enrollmentStartDateValue;
    displayEnrollmentEndDate = false;
    planName: string;
    removeForm: FormGroup;
    private unsubscribe$ = new Subject<void>();
    enrollmentEndDateFormValue: string;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.maintenanceBenefitsOffering.removePlan.subtitle",
        "primary.portal.maintenanceBenefitsOffering.removePlan.enrollmentEndDate",
        "primary.portal.common.cancel",
        "primary.portal.common.remove",
        "primary.portal.common.requiredField",
        "primary.portal.common.close",
        "primary.portal.maintenanceBenefitsOffering.removePlan.openEnrollment",
        "primary.portal.common.stopOfferingPlan",
        "primary.portal.maintenanceBenefitsOffering.removeContinuousPlan.openEnrollment",
        "primary.portal.maintenanceBenefitsOffering.managePlans.invalidDate",
    ]);
    enrollmentEndDateValue: Date;
    yesterdayValue: string;
    planYearRestricted = false;
    continuousPlan = false;
    currentDate: string;
    PlanYearEffectiveEndDate: string;
    isPlanAfterOE = false;
    isPlanDisabled = false;
    isSuccess = false;
    planYearEnrollmentStartDate: string;
    lastDayOfMonthHours = 23;
    lastDayOfMonthMinutes = 59;
    lastDayOfMonthSeconds = 59;
    todayDate = new Date();
    planYearName: string;

    constructor(
        private readonly benefitOfferingService: BenefitsOfferingService,
        @Inject(MAT_DIALOG_DATA) readonly removePlanData: RemovePlansDialogData,
        private readonly dialogRef: MatDialogRef<RemovePlanComponent>,
        private readonly datePipe: DatePipe,
        private readonly fb: FormBuilder,
        private readonly language: LanguageService,
        private readonly dateService: DateService,
    ) {}

    /**
     * @description Angular Life cycle hook
     *
     * @memberof RemovePlanComponent
     */
    ngOnInit(): void {
        this.planName = this.removePlanData.planDetails.plan.plan.name;
        this.planYearName = this.removePlanData.planDetails.planYear ? this.removePlanData.planDetails.planYear.name : undefined;
        const date = new Date(
            this.todayDate.getFullYear(),
            this.todayDate.getMonth() + 1,
            0,
            this.lastDayOfMonthHours,
            this.lastDayOfMonthMinutes,
            this.lastDayOfMonthSeconds,
        );
        this.endDate = this.datePipe.transform(this.dateService.toDate(date || ""), DateFormats.MONTH_DAY_YEAR);
        this.enrollmentStartDate = this.dateService.toDate(this.removePlanData.enrollmentEndDate || "");
        this.endDateVal = this.dateService.toDate(this.endDate || "");
        this.currentDate = this.datePipe.transform(new Date(), DateFormats.MONTH_DAY_YEAR);
        this.enrollmentStartDateValue = this.datePipe.transform(
            this.dateService.toDate(this.removePlanData.enrollmentStartDate || ""),
            DateFormats.MONTH_DAY_YEAR,
        );
        this.removeForm = this.fb.group({
            enrollmentEndDate: [this.dateService.toDate(this.todayDate), Validators.required],
        });

        if (this.removePlanData.continuous) {
            this.continuousPlan = true;
            if (
                this.dateService.isBeforeOrIsEqual(
                    this.dateService.toDate(this.enrollmentStartDateValue || ""),
                    this.dateService.toDate(this.currentDate),
                )
            ) {
                this.displayEnrollmentEndDate = true;
            }
        } else {
            this.planYearRestricted = true;
            this.planYearEnrollmentStartDate = this.datePipe.transform(
                this.dateService.toDate(this.removePlanData.planDetails.planYear.enrollmentPeriod.effectiveStarting || ""),
                DateFormats.MONTH_DAY_YEAR,
            );
            this.PlanYearEffectiveEndDate = this.datePipe.transform(
                this.dateService.toDate(this.removePlanData.planDetails.planYear.enrollmentPeriod.expiresAfter || ""),
                DateFormats.MONTH_DAY_YEAR,
            );
            if (
                this.dateService.isBeforeOrIsEqual(
                    this.dateService.toDate(this.planYearEnrollmentStartDate || ""),
                    this.dateService.toDate(this.currentDate),
                ) &&
                this.dateService.getIsAfterOrIsEqual(
                    this.dateService.toDate(this.PlanYearEffectiveEndDate || ""),
                    this.dateService.toDate(this.currentDate),
                )
            ) {
                //  during OE In progress
                this.displayEnrollmentEndDate = true;
            } else if (
                this.dateService.isBefore(
                    this.dateService.toDate(this.PlanYearEffectiveEndDate || ""),
                    this.dateService.toDate(this.currentDate),
                )
            ) {
                // After OE / Past OE
                this.isPlanAfterOE = true;
                this.displayEnrollmentEndDate = true;
            }
        }
    }
    /**
     * @description Service call to remove Plan
     * @param planId {number} selected plan id
     * @param deactivationDate {string} deactivation date selected
     * @param planYearId {number} selected plan year id
     * @returns {void}
     * @memberof RemovePlanComponent
     */
    deactivatePlan(planId: number, deactivationDate: string, planYearId: number): void {
        this.benefitOfferingService
            .deactivatePlanOffering(planId, this.removePlanData.mpGroup, deactivationDate, planYearId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {
                    this.isSuccess = true;
                    this.isPlanDisabled = true;
                    const data = {
                        disableCondition: this.isPlanDisabled,
                        planId: planId,
                    };
                    if (this.isPlanDisabled) {
                        this.dialogRef.close({ action: "submit", data: data });
                    }
                },
                (error) => (this.isSuccess = false),
            );
    }
    /**
     * @description method to remove Plan
     * @returns {void}
     * @memberof RemovePlanComponent
     */
    removePlan(): void {
        // To get the enrollment end date value from the form
        this.enrollmentEndDateFormValue = this.datePipe.transform(
            this.dateService.toDate(this.removeForm.controls.enrollmentEndDate.value),
            DateFormats.YEAR_MONTH_DAY,
        );
        if (this.removeForm.valid) {
            const selectedPlanYear = this.removePlanData.planDetails.planYear;
            this.deactivatePlan(
                this.removePlanData.planDetails.plan.plan.id,
                this.enrollmentEndDateFormValue,
                selectedPlanYear ? selectedPlanYear.id : undefined,
            );
        }
    }

    /**
     * @description method to close the remove-plan dialog modal
     * @returns {void}
     * @memberof RemovePlanComponent
     */
    cancel(): void {
        this.dialogRef.close({ action: "cancel" });
    }
    /**
     * set max date for stop offering plan
     * @returns Date for PY and null for continuous plan
     */
    setMaxDate(): Date | null {
        return this.removePlanData.continuous ? null : this.dateService.toDate(this.removePlanData.enrollmentEndDate || "");
    }
}
