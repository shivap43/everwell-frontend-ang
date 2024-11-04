import { Component, OnInit, Inject } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormControl, FormGroup, FormBuilder, Validators } from "@angular/forms";
import { DeletePlanChoice, BenefitsOfferingService } from "@empowered/api";
import { LanguageService } from "@empowered/language";

import { DatePipe } from "@angular/common";
import { catchError, takeUntil } from "rxjs/operators";
import { forkJoin, Observable, of, Subject } from "rxjs";
import { DateFormats, PlanChoice } from "@empowered/constants";
import { HttpResponse } from "@angular/common/http";
import { Store } from "@ngxs/store";
import { BenefitsOfferingState } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";

interface RemoveAllDetails {
    detail: any;
    mpGroup: any;
    route: ActivatedRoute;
    enrollmentStartDate: any;
    enrollmentEndDate: any;
    selectedPlanYearId: number;
    planYearTooltipMsg: string;
}

const ACTION_SUBMIT = "submit";

@Component({
    selector: "empowered-remove-all-plans",
    templateUrl: "./remove-all-plans.component.html",
    styleUrls: ["./remove-all-plans.component.scss"],
})
export class RemoveAllPlansComponent implements OnInit {
    carrierName;
    productName;
    isDisplayDate = false;
    productType;
    endDate;
    endDateVal;
    productTypeContinuous = "Continuous";
    productTypePlanYear = "PlanYearRestricted";
    enrollmentStartDate;
    todaysDate = new Date();
    today = new Date();
    private unsubscribe$ = new Subject<void>();
    defaultDate = new FormControl(new Date().toISOString());
    deletedPlan: DeletePlanChoice = {};
    enrollmentEndDate: Date;
    removeAllPlansForm: FormGroup;
    continuousProduct: boolean;
    falseStringConstant = "false";
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.maintenanceBenefitsOffering.removeAllPlans.subtitle",
        "primary.portal.maintenanceBenefitsOffering.removeAllPlans.enrollmentEndDate",
        "primary.portal.common.cancel",
        "primary.portal.common.remove",
        "primary.portal.common.requiredField",
        "primary.portal.common.close",
        "primary.portal.maintenanceBenefitsOffering.removePlan.openEnrollment",
        "primary.portal.common.stopOfferingPlan",
        "primary.portal.maintenanceBenefitsOffering.removeAllContinuousPlans.openEnrollment",
        "primary.portal.maintenanceBenefitsOffering.removeAllPlans.openEnrollment",
        "primary.portal.thirdParty.invalidDates",
        "primary.portal.thirdParty.pastDate",
    ]);
    enrollmentEndDateFormValue: string;
    yesterday: Date;
    yesterdayValue: string;
    enrollmentStartDateValue: string;
    coverageStartDate: number;
    continuousPlan = false;
    planYear = false;
    maxDate: Date;
    currentDate: string;
    isPlanAfterOE = false;
    isSuccess = false;
    isProductDisabled = false;
    isLoading = false;
    planYearEffectiveStartDate: string;
    planYearEffectiveEndDate: string;
    lastDayOfMonthHours = 23;
    lastDayOfMonthMinutes = 59;
    lastDayOfMonthSeconds = 59;
    planYearName: string;
    readonly INVALID = "INVALID";

    constructor(
        @Inject(MAT_DIALOG_DATA) private readonly removeAllData: RemoveAllDetails,
        private readonly removeAllPlansDialogRef: MatDialogRef<RemoveAllPlansComponent>,
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly fb: FormBuilder,
        private readonly datePipe: DatePipe,
        private readonly language: LanguageService,
        private readonly store: Store,
        private readonly dateService: DateService,
    ) {}

    /**
     * Method to populate product name, carrier name and other dates
     * It is also used to retrieve tooltip value from user selected plan year if it is more than one
     * @memberof RemoveAllPlansComponent
     */
    ngOnInit(): void {
        this.carrierName = this.removeAllData.detail.carrierName;
        this.productName = this.removeAllData.detail.productName;
        const date = new Date(
            this.todaysDate.getFullYear(),
            this.todaysDate.getMonth() + 1,
            0,
            this.lastDayOfMonthHours,
            this.lastDayOfMonthMinutes,
            this.lastDayOfMonthSeconds,
        );
        this.endDate = this.datePipe.transform(this.dateService.toDate(date), DateFormats.MONTH_DAY_YEAR);
        this.enrollmentStartDate = this.dateService.toDate(this.removeAllData.enrollmentStartDate || "");
        this.endDateVal = this.dateService.toDate(this.endDate || "");
        this.removeAllPlansForm = this.fb.group({
            enrollmentEndDate: [this.dateService.toDate(this.todaysDate || ""), Validators.required],
        });
        this.currentDate = this.datePipe.transform(new Date(), DateFormats.MONTH_DAY_YEAR);
        this.enrollmentStartDateValue = this.datePipe.transform(
            this.dateService.toDate(this.enrollmentStartDate),
            DateFormats.MONTH_DAY_YEAR,
        );

        if (this.removeAllData.detail.planYear === this.falseStringConstant) {
            this.continuousPlan = true;
            if (
                this.dateService.isBeforeOrIsEqual(
                    this.dateService.toDate(this.enrollmentStartDateValue),
                    this.dateService.toDate(this.currentDate),
                )
            ) {
                this.isDisplayDate = true;
            }
        } else {
            this.planYear = true;
            this.planYearName = this.removeAllData.planYearTooltipMsg
                ? this.removeAllData.planYearTooltipMsg
                : this.removeAllData.detail.planYearToolTip;
            const planYear = this.removeAllData.detail.plans.find(
                (plan) => plan.planYear && plan.planYear.id === this.removeAllData.selectedPlanYearId,
            ).planYear;
            this.planYearEffectiveStartDate = this.datePipe.transform(
                planYear.enrollmentPeriod.effectiveStarting,
                DateFormats.MONTH_DAY_YEAR,
            );
            this.planYearEffectiveEndDate = this.datePipe.transform(planYear.enrollmentPeriod.expiresAfter, DateFormats.MONTH_DAY_YEAR);
            if (
                this.dateService.isBeforeOrIsEqual(
                    this.dateService.toDate(this.planYearEffectiveStartDate || ""),
                    this.dateService.toDate(this.currentDate || ""),
                ) &&
                this.dateService.getIsAfterOrIsEqual(
                    this.dateService.toDate(this.planYearEffectiveEndDate || ""),
                    this.dateService.toDate(this.currentDate || ""),
                )
            ) {
                //  during OE In progress
                this.isDisplayDate = true;
            } else if (
                this.dateService.isBefore(
                    this.dateService.toDate(this.planYearEffectiveEndDate || ""),
                    this.dateService.toDate(this.currentDate || ""),
                )
            ) {
                // After OE in Past
                this.isPlanAfterOE = true;
                this.isDisplayDate = true;
            }
        }
    }

    /**
     * @description method to close the remove-All-plans dialog modal
     * @returns {void}
     * @memberof RemoveAllPlansComponent
     */
    closePopup(): void {
        this.removeAllPlansDialogRef.close({ action: "close" });
    }

    /**
     * This method is used to call deactivatePlansByProductCarrier which deactivates all plans under product carrier combo
     * @param productId is the product id to deactivate
     * @param carrierId is the carrier id to deactivate
     * @param deactivationDate is the deactivation date
     * @memberof RemoveAllPlansComponent
     */
    deactivateProduct(productId: number, carrierId: number, deactivationDate: string): void {
        this.isLoading = true;
        const activePlans: PlanChoice[] = this.removeAllData.detail.plans
            .filter(
                (planDetail) =>
                    !planDetail.plan.expirationDate || this.dateService.checkIsTodayOrAfter(planDetail.plan.expirationDate || ""),
            )
            .map((planDetail) => planDetail.plan);
        const productCarrierSpecificActivePlanChoices: PlanChoice[] = this.store
            .selectSnapshot(BenefitsOfferingState.getUnapprovedPlanChoices)
            .concat(this.store.selectSnapshot(BenefitsOfferingState.getPlanChoices))
            .filter(
                (planChoice) =>
                    planChoice.plan.carrierId === carrierId &&
                    planChoice.plan.productId === productId &&
                    !planChoice.plan.rider &&
                    (!planChoice.expirationDate || this.dateService.checkIsTodayOrAfter(planChoice.expirationDate)),
            );
        if (
            activePlans.length &&
            !productCarrierSpecificActivePlanChoices.every((planChoices) => planChoices.continuous === activePlans[0].continuous)
        ) {
            const deactivatePlanOfferingCalls$: Observable<HttpResponse<void>>[] = activePlans.map((res) =>
                this.benefitOfferingService
                    .deactivatePlanOffering(
                        res.plan.id,
                        this.removeAllData.mpGroup,
                        deactivationDate,
                        res.planYearId ? res.planYearId : undefined,
                    )
                    .pipe(catchError((error) => of(error))),
            );
            forkJoin(deactivatePlanOfferingCalls$)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (resp) => {
                        this.onAllPlansRemoved();
                    },
                    (error) => () => {
                        this.isSuccess = false;
                        this.isLoading = false;
                    },
                );
        } else {
            if (
                !this.removeAllData.selectedPlanYearId &&
                this.removeAllData.detail.plans.length > 0 &&
                this.removeAllData.detail.plans[0].planYear
            ) {
                this.removeAllData.selectedPlanYearId = this.removeAllData.detail.plans[0].planYear.id;
            }
            this.benefitOfferingService
                .deactivatePlansByProductCarrier(
                    [this.removeAllData.selectedPlanYearId],
                    productId,
                    carrierId,
                    this.removeAllData.mpGroup,
                    deactivationDate,
                )
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (resp) => {
                        this.onAllPlansRemoved();
                    },
                    (error) => () => {
                        this.isSuccess = false;
                        this.isLoading = false;
                    },
                );
        }
    }
    /**
     * This method will execute when all plans are successfully removed
     * This method is used to stop spinner and to close dialog
     */
    onAllPlansRemoved(): void {
        this.isSuccess = true;
        this.isLoading = false;
        this.isProductDisabled = true;
        this.removeAllPlansDialogRef.close({ action: ACTION_SUBMIT, data: this.isProductDisabled });
    }

    /**
     * @description method to remove all plans
     * @returns {void}
     * @memberof RemoveAllPlansComponent
     */
    removeAllPlans(): void {
        this.enrollmentEndDateFormValue = this.datePipe.transform(
            this.dateService.toDate(this.removeAllPlansForm.controls.enrollmentEndDate.value),
            DateFormats.YEAR_MONTH_DAY,
        );
        if (this.removeAllPlansForm.status !== this.INVALID) {
            this.deactivateProduct(
                this.removeAllData.detail.plans[0].plan.plan.productId,
                this.removeAllData.detail.plans[0].plan.plan.carrierId,
                this.enrollmentEndDateFormValue,
            );
        }
    }
    /**
     * set max date for stop offering plan
     * @returns Date for PY and null for continuous plan
     */
    setMaxDate(): Date | null {
        return this.removeAllData.detail.planYear !== this.falseStringConstant
            ? this.dateService.toDate(this.removeAllData.detail.plans[0].planYear.enrollmentPeriod.expiresAfter || "")
            : null;
    }
}
